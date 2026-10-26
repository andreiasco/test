// ======================================================
// MOTOR 3D - CASTEL QUIZ (v2 cinematic)
// Three.js procedural + riguri animate. Fara asset-uri obligatorii.
// Poate fi extins ulterior cu modele .glb fara schimbarea API-ului.
// ======================================================

window.CastleQuiz3D = (() => {
    let THREE = null;
    let GLTFLoaderClass = null;
    let mergeGeometries = null;
    let renderer = null;
    let scene = null;
    let camera = null;
    let canvas = null;
    let animationId = null;
    let resizeObserver = null;
    let hero = null;
    let monster = null;
    let door = null;
    let particles = null;
    let roomGroup = null;
    let roomMoodLight = null;
    let clockStart = performance.now();
    let activeTween = null;
    let initialized = false;
    let encounterIndex = 0;
    let heroState = "idle";
    let monsterState = "idle";
    let fxGroup = null;
    let fxBursts = [];
    let ambientPulse = 0;
    let usingGlbHero = false;
    let usingGlbMonster = false;
    let currentWorld = 'castle';
    let surfaces = null;
    let environmentTarget = null;
    let shadowTexture = null;
    let dustTexture = null;
    let lightingLookup = null;
    let heroShadow = null;
    let monsterShadow = null;
    let flames = [];
    let torchLights = [];
    let lastFrame = 0;
    let lastRender = 0;
    let lifecycle = 0;
    let skipRequested = false;
    let heroPhase = 0;
    let heroPreviousPosition = null;
    let lowDetail = false;
    const CANCELLED = Symbol("castle-animation-cancelled");
    const motionPreference = window.matchMedia?.("(prefers-reduced-motion: reduce)");

    function reducedMotion() { return Boolean(motionPreference?.matches); }

    function disposeTree(root, textures = false) {
        if (!root) return;
        const geometries = new Set(), materials = new Set(), maps = new Set();
        root.traverse((obj) => {
            if (obj.geometry) geometries.add(obj.geometry);
            for (const material of (Array.isArray(obj.material) ? obj.material : [obj.material])) {
                if (!material) continue;
                materials.add(material);
                if (textures && !material.userData?.castleSurface) Object.values(material).forEach(value => {
                    if (value?.isTexture && value !== shadowTexture && value !== dustTexture) maps.add(value);
                });
            }
            obj.shadow?.dispose?.();
        });
        geometries.forEach(geometry => geometry.dispose());
        materials.forEach(material => material.dispose());
        maps.forEach(texture => texture.dispose());
    }

    function surface(kind, color) {
        const material = surfaces?.material(kind, color) || mat(color, 0.94, 0);
        material.userData.castleSurface = kind;
        return material;
    }

    function surfaceUV(geometry, kind) {
        const positions = geometry.getAttribute("position");
        if (!positions) return;
        if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
        const normals = geometry.getAttribute("normal");
        const uv = new Float32Array(positions.count * 2);
        const width = kind === "floor" ? 3 : kind === "wood" ? 2.76 : 2;
        const height = kind === "floor" ? 3 : kind === "wood" ? 3.3 : 1.6;
        for (let i = 0; i < positions.count; i++) {
            const nx = Math.abs(normals.getX(i)), ny = Math.abs(normals.getY(i)), nz = Math.abs(normals.getZ(i));
            uv[i * 2] = (nx > ny && nx > nz ? positions.getZ(i) : positions.getX(i)) / width;
            uv[i * 2 + 1] = (ny > nx && ny > nz ? positions.getZ(i) : positions.getY(i)) / height;
        }
        geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    }

    function prepareActorMaterials(root, kind, type) {
        root.traverse(obj => {
            if (!obj.isMesh) return;
            if (!obj.geometry.getAttribute("normal")) obj.geometry.computeVertexNormals();
            const name = obj.name.toLowerCase();
            const metal = /helmet|plate|armor/.test(name) || (type === "knight" && !/eye/.test(name));
            const leather = /boot|belt/.test(name);
            const skin = /head|hand/.test(name) && !metal;
            const tune = material => {
                const copy = material.clone();
                if (copy.isMeshStandardMaterial) {
                    copy.metalness = metal ? 0.72 : 0;
                    copy.roughness = metal ? 0.38 : leather ? 0.82 : skin ? 0.72 : 0.94;
                    copy.envMapIntensity = metal ? 0.8 : 0.25;
                    copy.flatShading = false;
                    if (type === "ghost") { copy.transparent = true; copy.opacity = 0.72; copy.depthWrite = false; }
                }
                return copy;
            };
            obj.material = Array.isArray(obj.material) ? obj.material.map(tune) : tune(obj.material);
        });
    }

    function softTexture(color) {
        const image = document.createElement("canvas"); image.width = image.height = 64;
        const context = image.getContext("2d"); if (!context) return null;
        const gradient = context.createRadialGradient(32, 32, 2, 32, 32, 31);
        gradient.addColorStop(0, color); gradient.addColorStop(1, "rgba(0,0,0,0)");
        context.fillStyle = gradient; context.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(image);
    }

    function groundShadow(width, depth) {
        if (!shadowTexture) shadowTexture = softTexture("rgba(0,0,0,0.8)");
        if (!shadowTexture) return null;
        const shadow = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false }));
        shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.014;
        scene.add(shadow); return shadow;
    }

    function createEnvironment() {
        const image = document.createElement("canvas"); image.width = 256; image.height = 128;
        const context = image.getContext("2d"); if (!context) return;
        const gradient = context.createLinearGradient(0, 0, 0, 128);
        gradient.addColorStop(0, "#9daeb9"); gradient.addColorStop(0.48, "#8a8171"); gradient.addColorStop(1, "#282d2c");
        context.fillStyle = gradient; context.fillRect(0, 0, 256, 128);
        const texture = new THREE.CanvasTexture(image); texture.colorSpace = THREE.SRGBColorSpace;
        const generator = new THREE.PMREMGenerator(renderer);
        environmentTarget = generator.fromEquirectangular(texture);
        scene.environment = environmentTarget.texture; scene.environmentIntensity = 0.45;
        texture.dispose(); generator.dispose();
    }

    const MONSTER_COLORS = {
        goblin: 0x6f9f47,
        bat: 0x554963,
        skeleton: 0xd6d0c2,
        spider: 0x3f303c,
        knight: 0x596477,
        ghost: 0x8fc3d5,
        golem: 0x806b57,
        wizard: 0x654184,
        demon: 0x8f3440,
        dragon: 0xb43b31
    };


    function sceneShell() {
        return canvas?.closest?.(".castle-scene") || null;
    }

    function pulseScene(className, duration = 520) {
        if (reducedMotion() || skipRequested) return;
        const shell = sceneShell();
        if (!shell) return;
        shell.classList.remove(className);
        void shell.offsetWidth;
        shell.classList.add(className);
        setTimeout(() => shell.classList.remove(className), duration);
    }

    function ensureFxGroup() {
        if (!scene) return null;
        if (!fxGroup) {
            fxGroup = new THREE.Group();
            fxGroup.name = "cinematicFx";
            scene.add(fxGroup);
        }
        return fxGroup;
    }

    function burst(position, color = 0xffd36f, count = 24, speed = 1.7, life = 0.75, size = 0.055) {
        if (!THREE || !scene || reducedMotion() || skipRequested) return;
        count = Math.min(count, lowDetail ? 14 : 28);
        const group = ensureFxGroup();
        const geom = new THREE.SphereGeometry(size, 6, 5);
        const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.92 });
        const created = [];
        for (let i = 0; i < count; i++) {
            const m = new THREE.Mesh(geom, material.clone());
            m.position.copy(position);
            const a = Math.random() * Math.PI * 2;
            const up = 0.35 + Math.random() * 1.05;
            const radial = 0.45 + Math.random() * speed;
            m.userData.fxVelocity = new THREE.Vector3(Math.cos(a) * radial, up, Math.sin(a) * radial);
            group.add(m); created.push(m);
        }
        fxBursts.push({ items: created, born: performance.now(), life: life * 1000 });
    }

    function magicRing(position, color = 0x85c9ff, radius = 0.7) {
        if (!THREE || !scene || reducedMotion() || skipRequested) return;
        const group = ensureFxGroup();
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(radius, 0.035, 8, 36),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 })
        );
        ring.position.copy(position);
        ring.rotation.x = Math.PI / 2;
        ring.userData.fxRing = true;
        ring.userData.fxBorn = performance.now();
        ring.userData.fxLife = 760;
        group.add(ring);
    }

    function updateFx(now, delta) {
        if (!fxGroup) return;
        for (let i = fxBursts.length - 1; i >= 0; i--) {
            const b = fxBursts[i];
            const age = now - b.born;
            const dt = delta;
            const fade = Math.max(0, 1 - age / b.life);
            b.items.forEach((m) => {
                const v = m.userData.fxVelocity;
                if (v) {
                    m.position.addScaledVector(v, dt);
                    v.y -= 1.4 * dt;
                }
                if (m.material) m.material.opacity = fade;
                m.scale.setScalar(0.75 + (1 - fade) * 1.15);
            });
            if (age >= b.life) {
                b.items.forEach((m) => { fxGroup.remove(m); m.geometry?.dispose?.(); m.material?.dispose?.(); });
                fxBursts.splice(i, 1);
            }
        }
        [...fxGroup.children].forEach((obj) => {
            if (!obj.userData?.fxRing) return;
            const p = Math.min(1, (now - obj.userData.fxBorn) / obj.userData.fxLife);
            obj.scale.setScalar(1 + p * 2.1);
            obj.material.opacity = (1 - p) * 0.78;
            obj.rotation.z += delta * 1.5;
            if (p >= 1) { fxGroup.remove(obj); obj.geometry?.dispose?.(); obj.material?.dispose?.(); }
        });
    }

    async function loadThree() {
    if (THREE && GLTFLoaderClass && mergeGeometries) {
        return THREE;
    }

    try {
        // Three.js este rezolvat prin importmap din index.html
        if (!THREE) {
            THREE = await import("three");
        }

        // GLTFLoader folosește aceeași versiune Three.js
        if (!GLTFLoaderClass) {
            const loaderModule = await import(
                "three/addons/loaders/GLTFLoader.js"
            );

            GLTFLoaderClass = loaderModule.GLTFLoader;
        }

        if (!mergeGeometries) {
            ({ mergeGeometries } = await import("three/addons/utils/BufferGeometryUtils.js"));
        }

        console.log("Three.js și GLTFLoader încărcate cu succes.");

        return THREE;

    } catch (error) {
        console.error(
            "Three.js / GLTFLoader nu a putut fi incarcat:",
            error
        );

        return null;
    }
}

    async function loadGlbModel(asset, kind = "monster", type = "goblin") {
        if (!asset?.path || !GLTFLoaderClass || !THREE) return null;
        try {
            const loader = new GLTFLoaderClass();
            const gltf = await loader.loadAsync(asset.path);
            const root = gltf.scene || gltf.scenes?.[0];
            if (!root) return null;
            root.traverse((obj) => {
                if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; }
            });
            root.scale.setScalar(Number(asset.scale) || 1);
            root.position.y = Number(asset.y) || 0;
            root.userData.assetKind = kind;
            root.userData.type = type;
            if (kind === "hero") {
                root.userData.armL = root.getObjectByName("ArmL");
                root.userData.armR = root.getObjectByName("ArmR");
                root.userData.legL = root.getObjectByName("LegL");
                root.userData.legR = root.getObjectByName("LegR");
                root.userData.cape = root.getObjectByName("Cape");
                root.userData.baseY = Number(asset.y) || 0;
            } else {
                root.userData.armL = root.getObjectByName("ArmL");
                root.userData.armR = root.getObjectByName("ArmR");
                root.userData.legL = root.getObjectByName("LegL");
                root.userData.legR = root.getObjectByName("LegR");
                root.userData.wingL = root.getObjectByName("WingL");
                root.userData.wingR = root.getObjectByName("WingR");
                root.userData.jaw = root.getObjectByName("Jaw");
                root.userData.tail = root.getObjectByName("Tail0");
                root.userData.legs = [...root.children].filter((obj) => /^Leg[LR]\d/.test(obj.name));
                root.userData.baseY = Number(asset.y) || 0;
            }
            prepareActorMaterials(root, kind, type);
            window.CastleQuizRig?.prepare(root, THREE, kind, type);
            return root;
        } catch (error) {
            console.warn(`Modelul 3D ${asset.path} nu s-a incarcat; folosesc fallback procedural.`, error);
            return null;
        }
    }

    async function createHeroModel() {
        const asset = window.CastleQuizAssets?.hero;
        const bundled = !asset?.path || asset.path === "assets/quiz3d/hero.glb";
        if (bundled && asset?.detailed !== false) {
            try {
                const detailed = window.CastleQuizHero?.create(THREE, mergeGeometries, { lowDetail });
                if (detailed) {
                    detailed.userData.authoredBaseY = detailed.userData.baseY || 0;
                    usingGlbHero = false; return detailed;
                }
            } catch (error) {
                console.warn("Cavalerul detaliat nu este disponibil; folosesc modelul de rezervă.", error);
            }
        }
        const glbHero = await loadGlbModel(asset, "hero", "hero");
        if (glbHero) { usingGlbHero = true; return glbHero; }
        usingGlbHero = false; return buildHero();
    }

    async function createMonsterModel(type = "goblin", boss = false) {
        const chosen = boss ? "dragon" : type;
        const asset = window.CastleQuizAssets?.monsters?.[chosen];
        // A custom GLB keeps priority. Bundled primitive assets remain a fallback.
        const bundled = !asset?.path || asset.path === `assets/quiz3d/${chosen}.glb`;
        if (bundled && asset?.detailed !== false) {
            try {
                const detailed = window.CastleQuizMonsters?.create(THREE, mergeGeometries, chosen, { lowDetail, boss });
                if (detailed) {
                    // Stand on the room floor or raised podium, rather than clipping through it.
                    const groundY = groundAt(0, boss ? -3.85 : -3.55);
                    detailed.userData.baseY += groundY;
                    detailed.userData.groundY = groundY;
                    usingGlbMonster = false; return detailed;
                }
            } catch (error) {
                console.warn(`Modelul detaliat ${chosen} nu este disponibil; folosesc modelul de rezervă.`, error);
            }
        }
        const glbMonster = await loadGlbModel(asset, "monster", chosen);
        if (glbMonster) { usingGlbMonster = true; return glbMonster; }
        usingGlbMonster = false; return buildMonster(chosen, boss);
    }

    function mat(color, roughness = 0.78, metalness = 0.04, emissive = 0x000000, emissiveIntensity = 0) {
        return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity });
    }

    function makeMesh(geometry, material, x = 0, y = 0, z = 0) {
        if (material?.userData?.castleSurface) surfaceUV(geometry, material.userData.castleSurface);
        const obj = new THREE.Mesh(geometry, material);
        obj.position.set(x, y, z);
        obj.castShadow = true;
        obj.receiveShadow = true;
        return obj;
    }

    function limb(length, radius, material) {
        const pivot = new THREE.Group();
        const body = makeMesh(new THREE.CapsuleGeometry(radius, Math.max(0.08, length - radius * 2), 5, 8), material, 0, -length * 0.48, 0);
        pivot.add(body);
        pivot.userData.limbLength = length;
        return pivot;
    }

    function addGlowEyes(group, y, z, spread = 0.16, color = 0xffd86a, size = 0.05) {
        const eyeMat = new THREE.MeshBasicMaterial({ color });
        [-spread, spread].forEach((x) => {
            const eye = makeMesh(new THREE.SphereGeometry(size, 10, 8), eyeMat, x, y, z);
            group.add(eye);
        });
    }

    function buildHero() {
        const rig = new THREE.Group();
        rig.name = "heroRig";
        const skin = mat(0xe6b88d);
        const tunic = mat(0x246884, 0.72);
        const boots = mat(0x3a2727);
        const capeMat = mat(0x7f2f42, 0.88);
        const hair = mat(0x3c2b25);

        const torso = makeMesh(new THREE.CapsuleGeometry(0.29, 0.56, 6, 10), tunic, 0, 1.18, 0);
        const head = makeMesh(new THREE.SphereGeometry(0.245, 18, 14), skin, 0, 1.92, -0.015);
        const hairCap = makeMesh(new THREE.SphereGeometry(0.252, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.48), hair, 0, 2.01, 0.015);
        const cape = makeMesh(new THREE.BoxGeometry(0.58, 0.82, 0.055), capeMat, 0, 1.22, 0.28);
        cape.rotation.x = -0.08;
        cape.name = "cape";

        const armL = limb(0.62, 0.09, tunic); armL.position.set(-0.36, 1.52, 0); armL.name = "armL";
        const armR = limb(0.62, 0.09, tunic); armR.position.set(0.36, 1.52, 0); armR.name = "armR";
        const legL = limb(0.74, 0.105, boots); legL.position.set(-0.16, 0.91, 0); legL.name = "legL";
        const legR = limb(0.74, 0.105, boots); legR.position.set(0.16, 0.91, 0); legR.name = "legR";

        rig.add(torso, head, hairCap, cape, armL, armR, legL, legR);
        addGlowEyes(rig, 1.94, -0.226, 0.078, 0x30251f, 0.024);
        rig.position.set(0, 0, 4.2);
        rig.userData = { armL, armR, legL, legR, cape, baseY: 0 };
        return rig;
    }

    function buildHumanoidMonster(type, color, boss) {
        const rig = new THREE.Group();
        const main = mat(color, type === "knight" ? 0.4 : 0.72, type === "knight" ? 0.72 : 0.07);
        const dark = mat(0x28242d, 0.88);
        const scale = boss ? 1.42 : 1;

        const torsoGeo = type === "golem" ? new THREE.BoxGeometry(0.92, 1.05, 0.62) : new THREE.CapsuleGeometry(0.40, 0.68, 6, 10);
        const torso = makeMesh(torsoGeo, main, 0, 1.13, 0);
        const head = makeMesh(type === "golem" ? new THREE.BoxGeometry(0.62, 0.57, 0.54) : new THREE.SphereGeometry(0.35, 16, 12), main, 0, 1.91, -0.03);
        const armL = limb(type === "golem" ? 0.9 : 0.72, type === "golem" ? 0.15 : 0.11, main); armL.position.set(-0.49, 1.52, 0); armL.name = "armL";
        const armR = limb(type === "golem" ? 0.9 : 0.72, type === "golem" ? 0.15 : 0.11, main); armR.position.set(0.49, 1.52, 0); armR.name = "armR";
        const legL = limb(0.74, 0.12, dark); legL.position.set(-0.19, 0.75, 0); legL.name = "legL";
        const legR = limb(0.74, 0.12, dark); legR.position.set(0.19, 0.75, 0); legR.name = "legR";
        rig.add(torso, head, armL, armR, legL, legR);

        if (type === "wizard") {
            const hat = makeMesh(new THREE.ConeGeometry(0.48, 0.92, 16), mat(0x302145), 0, 2.54, 0);
            rig.add(hat);
        } else if (type === "knight") {
            const helmet = makeMesh(new THREE.BoxGeometry(0.76, 0.53, 0.68), mat(0x687384, 0.38, 0.82), 0, 1.95, 0);
            const visor = makeMesh(new THREE.BoxGeometry(0.58, 0.12, 0.05), mat(0x272a31, 0.6, 0.4), 0, 1.94, -0.36);
            rig.add(helmet, visor);
        } else if (type === "demon") {
            [-0.22, 0.22].forEach((x) => {
                const horn = makeMesh(new THREE.ConeGeometry(0.1, 0.47, 8), dark, x, 2.43, 0);
                horn.rotation.z = x < 0 ? 0.22 : -0.22;
                rig.add(horn);
            });
        } else if (type === "goblin") {
            [-0.34, 0.34].forEach((x) => {
                const ear = makeMesh(new THREE.ConeGeometry(0.12, 0.48, 5), main, x, 1.97, 0);
                ear.rotation.z = x < 0 ? Math.PI / 2 : -Math.PI / 2;
                rig.add(ear);
            });
        }

        addGlowEyes(rig, 1.96, -0.34, 0.13, type === "wizard" ? 0xaedfff : 0xffc74f, 0.042);
        rig.scale.setScalar(scale);
        rig.userData = { armL, armR, legL, legR, baseY: 0, type };
        return rig;
    }

    function buildBat(color, boss) {
        const rig = new THREE.Group();
        const main = mat(color, 0.72);
        const body = makeMesh(new THREE.SphereGeometry(0.34, 16, 12), main, 0, 1.25, 0);
        const head = makeMesh(new THREE.SphereGeometry(0.22, 14, 10), main, 0, 1.44, -0.31);
        const wingGeo = new THREE.ConeGeometry(0.52, 1.08, 3);
        const wingL = makeMesh(wingGeo, main, -0.54, 1.34, 0); wingL.name = "wingL"; wingL.rotation.z = 1.35;
        const wingR = makeMesh(wingGeo, main, 0.54, 1.34, 0); wingR.name = "wingR"; wingR.rotation.z = -1.35;
        rig.add(body, head, wingL, wingR);
        addGlowEyes(rig, 1.48, -0.51, 0.08, 0xff5b65, 0.035);
        rig.scale.setScalar(boss ? 1.5 : 1.15);
        rig.userData = { wingL, wingR, baseY: 0.65, type: "bat" };
        return rig;
    }

    function buildSpider(color, boss) {
        const rig = new THREE.Group();
        const main = mat(color, 0.86);
        const dark = mat(0x261e26, 0.95);
        const abdomen = makeMesh(new THREE.SphereGeometry(0.46, 16, 12), main, 0, 0.67, 0.12);
        const head = makeMesh(new THREE.SphereGeometry(0.28, 14, 10), main, 0, 0.72, -0.42);
        rig.add(abdomen, head);
        const legs = [];
        for (let i = 0; i < 4; i++) {
            [-1, 1].forEach((side) => {
                const pivot = new THREE.Group();
                pivot.position.set(side * 0.35, 0.68, 0.35 - i * 0.25);
                const leg = makeMesh(new THREE.CylinderGeometry(0.035, 0.04, 1.0, 7), dark, side * 0.43, -0.12, 0);
                leg.rotation.z = side * 1.05;
                pivot.add(leg); rig.add(pivot); legs.push(pivot);
            });
        }
        addGlowEyes(rig, 0.78, -0.66, 0.09, 0xff5858, 0.032);
        rig.scale.setScalar(boss ? 1.42 : 1.18);
        rig.userData = { legs, baseY: 0, type: "spider" };
        return rig;
    }

    function buildGhost(color, boss) {
        const rig = new THREE.Group();
        const ghostMat = new THREE.MeshStandardMaterial({ color, roughness: 0.55, transparent: true, opacity: 0.82, emissive: color, emissiveIntensity: 0.18 });
        const body = makeMesh(new THREE.SphereGeometry(0.48, 18, 14), ghostMat, 0, 1.25, 0); body.scale.y = 1.45;
        const tail = makeMesh(new THREE.ConeGeometry(0.44, 0.92, 16), ghostMat, 0, 0.43, 0); tail.rotation.x = Math.PI;
        rig.add(body, tail);
        addGlowEyes(rig, 1.38, -0.43, 0.14, 0x20313b, 0.045);
        rig.scale.setScalar(boss ? 1.42 : 1.12);
        rig.userData = { baseY: 0.55, type: "ghost" };
        return rig;
    }

    function buildDragon(color, boss = true) {
        const rig = new THREE.Group();
        const main = mat(color, 0.65, 0.08);
        const dark = mat(0x35252a, 0.82);
        const belly = mat(0xd19155, 0.74);
        const body = makeMesh(new THREE.SphereGeometry(0.68, 20, 15), main, 0, 1.08, 0); body.scale.set(1.28, 1, 1.52);
        const chest = makeMesh(new THREE.SphereGeometry(0.46, 16, 12), belly, 0, 1.03, -0.54); chest.scale.set(0.72, 1.08, 0.35);
        const neck = makeMesh(new THREE.CylinderGeometry(0.25, 0.38, 0.72, 12), main, 0, 1.5, -0.45); neck.rotation.x = -0.38;
        const head = makeMesh(new THREE.BoxGeometry(0.72, 0.5, 0.76), main, 0, 1.82, -0.9);
        const jaw = makeMesh(new THREE.BoxGeometry(0.58, 0.16, 0.58), belly, 0, 1.64, -1.08); jaw.name = "jaw";
        const wingGeo = new THREE.ConeGeometry(0.86, 1.65, 3);
        const wingL = makeMesh(wingGeo, main, -1.05, 1.45, 0.2); wingL.name = "wingL"; wingL.rotation.z = 1.28;
        const wingR = makeMesh(wingGeo, main, 1.05, 1.45, 0.2); wingR.name = "wingR"; wingR.rotation.z = -1.28;
        const tail = makeMesh(new THREE.ConeGeometry(0.25, 1.65, 10), main, 0, 0.95, 1.36); tail.rotation.x = -Math.PI / 2; tail.name = "tail";
        rig.add(body, chest, neck, head, jaw, wingL, wingR, tail);
        [-0.23, 0.23].forEach((x) => {
            const horn = makeMesh(new THREE.ConeGeometry(0.09, 0.42, 8), dark, x, 2.2, -0.78);
            horn.rotation.x = -0.5; rig.add(horn);
        });
        addGlowEyes(rig, 1.89, -1.29, 0.19, 0xffd35c, 0.052);
        rig.scale.setScalar(boss ? 1.36 : 1.15);
        rig.userData = { wingL, wingR, jaw, tail, baseY: 0, type: "dragon" };
        return rig;
    }

    function buildMonster(type = "goblin", boss = false) {
        const color = MONSTER_COLORS[type] || MONSTER_COLORS.goblin;
        let rig;
        if (type === "bat") rig = buildBat(color, boss);
        else if (type === "spider") rig = buildSpider(color, boss);
        else if (type === "ghost") rig = buildGhost(color, boss);
        else if (type === "dragon") rig = buildDragon(color, true);
        else if (type === "skeleton") rig = buildHumanoidMonster("skeleton", color, boss);
        else rig = buildHumanoidMonster(type, color, boss);
        rig.position.set(0, rig.userData.baseY || 0, -3.2);
        return rig;
    }

    function addArch(z, stone) {
        const left = makeMesh(new THREE.BoxGeometry(0.5, 2.75, 0.68), stone, -2.9, 1.375, z);
        const right = makeMesh(new THREE.BoxGeometry(0.5, 2.75, 0.68), stone, 2.9, 1.375, z);
        const span = Math.PI / 13, gap = 0.009;
        const shape = new THREE.Shape();
        shape.absarc(0, 0, 3.15, gap, span - gap, false);
        shape.lineTo(Math.cos(span - gap) * 2.65, Math.sin(span - gap) * 2.65);
        shape.absarc(0, 0, 2.65, span - gap, gap, true);
        shape.closePath();
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.58, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.018, bevelSegments: 1, curveSegments: 3 });
        geometry.translate(0, 0, -0.29); surfaceUV(geometry, "stone");
        const blocks = new THREE.InstancedMesh(geometry, stone, 13);
        const transform = new THREE.Object3D();
        for (let i = 0; i < 13; i++) {
            transform.rotation.z = i * span; transform.updateMatrix();
            blocks.setMatrixAt(i, transform.matrix);
            blocks.setColorAt(i, new THREE.Color(0xffffff).multiplyScalar(0.86 + (i % 4) * 0.035));
        }
        blocks.position.set(0, 2.72, z); blocks.scale.y = 0.66;
        blocks.castShadow = true; blocks.receiveShadow = true;
        blocks.computeBoundingSphere();
        scene.add(left, right, blocks);
    }

    const ROOM_THEMES = [
        { id: "library", name: "Biblioteca blestemată", accent: 0xb98552 },
        { id: "dungeon", name: "Temnița", accent: 0x6f8290 },
        { id: "armory", name: "Sala armelor", accent: 0x8b98a8 },
        { id: "alchemy", name: "Laboratorul vrăjitorului", accent: 0x7b63a8 },
        { id: "crypt", name: "Cripta", accent: 0x668779 }
    ];

    function roomProp(geometry, material, x, y, z, parent = roomGroup) {
        const obj = makeMesh(geometry, material, x, y, z);
        parent.add(obj);
        return obj;
    }

    function buildBookshelf(x, z, flip = 1) {
        const wood = surface("wood", 0xd7c3aa);
        const shelf = new THREE.Group();
        shelf.position.set(x, 0, z);
        shelf.rotation.y = flip > 0 ? Math.PI / 2 : -Math.PI / 2;
        shelf.add(makeMesh(new THREE.BoxGeometry(1.05, 2.45, 0.08), wood, 0, 1.25, -0.17));
        for (const side of [-0.52, 0.52]) shelf.add(makeMesh(new THREE.BoxGeometry(0.08, 2.45, 0.45), wood, side, 1.25, 0));
        for (const height of [0.28, 0.96, 1.64, 2.46]) shelf.add(makeMesh(new THREE.BoxGeometry(1.05, 0.07, 0.45), wood, 0, height, 0));
        const bookColors = [0x7d3e48, 0x315d66, 0x73623e, 0x4e466f, 0x76512f];
        for (let row = 0; row < 3; row++) {
            for (let i = 0; i < 6; i++) {
                const h = 0.34 + ((i + row) % 3) * 0.055;
                const book = makeMesh(new THREE.BoxGeometry(0.12, h, 0.24), mat(bookColors[(i + row) % bookColors.length], 0.84), -0.37 + i * 0.15, 0.48 + row * 0.68, 0.02);
                book.rotation.z = (i % 3 - 1) * 0.035; shelf.add(book);
            }
        }
        roomGroup.add(shelf);
    }

    function buildRoom(index = 0, boss = false) {
        if (!scene) return;
        if (roomGroup) { scene.remove(roomGroup); disposeTree(roomGroup); }
        if (roomMoodLight) { scene.remove(roomMoodLight); roomMoodLight.dispose?.(); }
        flames = flames.filter(flame => !flame.userData.roomFlame);
        roomGroup = new THREE.Group();
        roomGroup.name = "encounterRoom";
        scene.add(roomGroup);

        if (currentWorld !== 'castle') {
            window.QuizWorldScenery.buildRoom({ THREE, scene, parent: roomGroup, world: currentWorld, index, boss, mat, makeMesh });
            return;
        }

        const theme = boss ? { id: "throne", name: "Sala Dragonului", accent: 0xd66b3d } : ROOM_THEMES[index % ROOM_THEMES.length];
        const stone = surface("stone", boss ? 0xc7b7a7 : 0xd6d0c3);
        const darkStone = surface("floor", boss ? 0xbab0a4 : 0xc9c4b9);
        const gold = mat(0x8f6d36, 0.5, 0.52);

        roomProp(new THREE.BoxGeometry(6.0, 0.16, 6.3), darkStone, 0, -0.08, -3.55);
        roomProp(new THREE.BoxGeometry(6.0, 0.25, 0.25), stone, 0, 4.72, -6.35);
        roomProp(new THREE.BoxGeometry(0.32, 4.8, 6.2), stone, -2.82, 2.35, -3.55);
        roomProp(new THREE.BoxGeometry(0.32, 4.8, 6.2), stone, 2.82, 2.35, -3.55);

        roomMoodLight = new THREE.PointLight(theme.accent, boss ? 5.5 : 3.4, boss ? 11 : 8, 2);
        roomMoodLight.position.set(0, boss ? 3.5 : 2.8, -3.8);
        roomMoodLight.userData.baseIntensity = roomMoodLight.intensity;
        scene.add(roomMoodLight);

        if (theme.id === "library") {
            buildBookshelf(-2.42, -3.8, 1); buildBookshelf(2.42, -3.8, -1);
            buildBookshelf(-2.42, -5.2, 1); buildBookshelf(2.42, -5.2, -1);
            const table = roomProp(new THREE.BoxGeometry(1.55, 0.12, 0.72), mat(0x553627, 0.88), 0, 0.82, -5.35);
            roomProp(new THREE.CylinderGeometry(0.08, 0.1, 0.8, 8), mat(0x553627), -0.55, 0.4, -5.35);
            roomProp(new THREE.CylinderGeometry(0.08, 0.1, 0.8, 8), mat(0x553627), 0.55, 0.4, -5.35);
            const book = roomProp(new THREE.BoxGeometry(0.58, 0.06, 0.42), mat(0x7b4a3b), 0, 0.91, -5.35); book.rotation.y = 0.18;
        } else if (theme.id === "dungeon") {
            for (const x of [-2.05, 2.05]) {
                const chainMat = mat(0x4b515a, 0.4, 0.75);
                for (let i = 0; i < 8; i++) {
                    const link = roomProp(new THREE.TorusGeometry(0.1, 0.025, 6, 10), chainMat, x, 4.25 - i * 0.28, -4.7);
                    link.rotation.x = i % 2 ? Math.PI / 2 : 0;
                }
            }
            const bars = mat(0x4f5660, 0.4, 0.78);
            for (let i = -2; i <= 2; i++) roomProp(new THREE.CylinderGeometry(0.045,0.045,2.8,8), bars, i*0.35,1.4,-6.08);
            roomProp(new THREE.BoxGeometry(1.7,0.09,0.09),bars,0,0.2,-6.08);
            roomProp(new THREE.BoxGeometry(1.7,0.09,0.09),bars,0,2.6,-6.08);
        } else if (theme.id === "armory") {
            const metal = mat(0x727a87, 0.36, 0.8);
            [-2.15, 2.15].forEach((x, side) => {
                for (let i = 0; i < 3; i++) {
                    const sword = roomProp(new THREE.BoxGeometry(0.06, 1.4, 0.08), metal, x, 1.0 + i*0.9, -4.7);
                    sword.rotation.z = (side ? -1 : 1) * (0.58 + i*0.12);
                    const guard = roomProp(new THREE.BoxGeometry(0.42,0.06,0.1),gold,x,0.72+i*0.9,-4.7); guard.rotation.z=sword.rotation.z;
                }
            });
            const shield = roomProp(new THREE.CylinderGeometry(0.48,0.48,0.11,12),mat(0x4d596b,0.48,0.62),0,2.2,-6.05); shield.rotation.x=Math.PI/2;
        } else if (theme.id === "alchemy") {
            const tableMat = mat(0x4b3028,0.9);
            roomProp(new THREE.BoxGeometry(4.3,0.16,0.65),tableMat,0,0.8,-5.65);
            for (let i=0;i<5;i++) {
                const c=[0x8e61d0,0x52a795,0xc26a5a,0x5d87c4,0xc0a251][i];
                const bottle = roomProp(new THREE.SphereGeometry(0.13+(i%2)*0.04,10,8),new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:0.35,roughness:0.45}),-1.45+i*0.72,1.02,-5.64);
                bottle.scale.y=1.25;
            }
            const cauldron = roomProp(new THREE.CylinderGeometry(0.52,0.38,0.42,14),mat(0x26282f,0.5,0.72),-1.9,0.35,-3.65);
            const glow = roomProp(new THREE.SphereGeometry(0.39,14,8),new THREE.MeshBasicMaterial({color:0x7c5ac5,transparent:true,opacity:0.52}),-1.9,0.59,-3.65); glow.scale.y=0.18;
        } else if (theme.id === "crypt") {
            const tomb = mat(0x5a5961,0.96);
            [-1.85,0,1.85].forEach((x,i)=>{
                const slab=roomProp(new THREE.BoxGeometry(1.05,0.34,1.85),tomb,x,0.19,-5.05+(i%2)*0.38); slab.rotation.y=(i-1)*0.07;
                const lid=roomProp(new THREE.BoxGeometry(1.12,0.12,1.92),mat(0x696872,0.95),x,0.42,-5.05+(i%2)*0.38); lid.rotation.y=slab.rotation.y;
            });
            for (const x of [-2.1,2.1]) roomProp(new THREE.ConeGeometry(0.18,1.25,8),mat(0x55545d),x,0.63,-3.25);
        } else {
            // Sala boss-ului: podium, tron, coloane, braziere și vitraliu incandescent.
            roomProp(new THREE.CylinderGeometry(2.15,2.45,0.34,12),stone,0,0.17,-5.35);
            roomProp(new THREE.BoxGeometry(1.35,1.9,0.54),mat(0x4a2528,0.78),0,1.25,-6.0);
            roomProp(new THREE.BoxGeometry(1.78,0.26,0.72),gold,0,2.15,-5.98);
            [-2.15,2.15].forEach((x)=>{
                roomProp(new THREE.CylinderGeometry(0.28,0.34,4.1,12),stone,x,2.05,-5.2);
                roomProp(new THREE.BoxGeometry(0.75,0.25,0.75),gold,x,4.1,-5.2);
                const brazier=roomProp(new THREE.CylinderGeometry(0.28,0.4,0.34,10),mat(0x3b3234,0.5,0.65),x,1.0,-3.1);
                const flame=roomProp(new THREE.ConeGeometry(0.22,0.7,8),new THREE.MeshBasicMaterial({color:0xffb65b}),x,1.45,-3.1); flame.userData.flame=true;
                flame.userData.roomFlame=true; flames.push(flame);
            });
            const windowMat = new THREE.MeshStandardMaterial({color:0x9f3c2f,emissive:0x9f3c2f,emissiveIntensity:0.5,transparent:true,opacity:0.72});
            const window=roomProp(new THREE.CircleGeometry(1.0,24),windowMat,0,3.35,-6.16);
            window.rotation.x=0;
        }
        roomGroup.userData.theme = theme;
    }

    function buildCastle() {
        scene.background = new THREE.Color(0x161c22);
        scene.fog = new THREE.FogExp2(0x161c22, 0.037);
        createEnvironment();
        scene.add(new THREE.HemisphereLight(0xb9c9d2, 0x5a4430, 0.85));
        const moon = new THREE.DirectionalLight(0xc4d8e9, 2.1);
        moon.position.set(3, 7, 5); moon.target.position.set(0, 0, -2);
        moon.castShadow = true; moon.shadow.mapSize.set(lowDetail ? 512 : 1024, lowDetail ? 512 : 1024);
        Object.assign(moon.shadow.camera, { left: -6, right: 6, top: 7, bottom: -7, near: 0.5, far: 24 });
        moon.shadow.bias = -0.0002; moon.shadow.normalBias = 0.035;
        scene.add(moon, moon.target);
        const fill = new THREE.DirectionalLight(0xffdfb4, 0.55); fill.position.set(-4, 3, 7); scene.add(fill);

        const stone = surface("stone", 0xd6d0c3);
        const stoneDark = surface("floor", 0xc9c4b9);
        // Three r185 shares this physical-lighting lookup outside material maps.
        // Capture its uniform for release when this castle's renderer shuts down.
        stoneDark.onBeforeCompile = shader => { lightingLookup = shader.uniforms.dfgLUT || null; };
        const floor = makeMesh(new THREE.PlaneGeometry(10, 34), stoneDark, 0, 0, -6); floor.rotation.x = -Math.PI / 2; scene.add(floor);
        scene.add(
            makeMesh(new THREE.BoxGeometry(0.55, 5.2, 34), stone, -3.25, 2.6, -6),
            makeMesh(new THREE.BoxGeometry(0.55, 5.2, 34), stone, 3.25, 2.6, -6),
            makeMesh(new THREE.BoxGeometry(7, 0.38, 34), stone, 0, 5.15, -6)
        );
        [2, -4, -10, -16].forEach((z) => addArch(z, stone));

        for (let z = 3; z > -17; z -= 3.6) {
            [-2.74, 2.74].forEach((x) => {
                const stem = makeMesh(new THREE.CylinderGeometry(0.045, 0.06, 0.62, 8), mat(0x5d3923), x, 1.97, z - 0.2);
                const flame = new THREE.Group(); flame.position.set(x, 2.42, z - 0.2);
                const outer = makeMesh(new THREE.ConeGeometry(0.11, 0.42, 7), new THREE.MeshBasicMaterial({ color: 0xffa53f, transparent: true, opacity: 0.8 }), 0, 0.02, 0);
                const core = makeMesh(new THREE.SphereGeometry(0.075, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe6a5 }), 0, -0.08, 0);
                core.scale.y = 1.5; flame.add(outer, core); flames.push(flame);
                const light = new THREE.PointLight(0xffb66c, 6.0, 5.3, 2); light.position.set(x, 2.42, z - 0.2);
                light.userData.baseIntensity = light.intensity; torchLights.push(light);
                scene.add(stem, flame, light);
            });
        }

        // pietre decorative pentru senzatia de miscare prin coridor
        const rubbleMat = mat(0x45434e, 0.98);
        for (let i = 0; i < 18; i++) {
            const side = i % 2 ? -1 : 1;
            const rock = makeMesh(new THREE.DodecahedronGeometry(0.08 + (i % 3) * 0.03, 0), rubbleMat, side * (2.2 + (i % 4) * 0.15), 0.08, 2.5 - i * 1.05);
            rock.rotation.set(i * 0.3, i * 0.5, i * 0.2); scene.add(rock);
        }

        door = new THREE.Group();
        const frame = surface("stone", 0xc8c0b2);
        const wood = surface("wood", 0xe3d2b8);
        const leftP = makeMesh(new THREE.BoxGeometry(0.46, 3.9, 0.58), frame, -1.66, 1.95, -6.8);
        const rightP = makeMesh(new THREE.BoxGeometry(0.46, 3.9, 0.58), frame, 1.66, 1.95, -6.8);
        const top = makeMesh(new THREE.BoxGeometry(3.78, 0.52, 0.58), frame, 0, 3.85, -6.8);
        const leaf = new THREE.Group(); leaf.name = "doorLeaf"; leaf.position.set(-1.38, 0, -6.65);
        leaf.add(makeMesh(new THREE.BoxGeometry(2.76, 3.3, 0.18), wood, 1.38, 1.65, 0));
        const iron = mat(0x5f6365, 0.4, 0.75);
        for (const y of [0.68, 2.56]) {
            leaf.add(makeMesh(new THREE.BoxGeometry(2.54, 0.1, 0.07), iron, 1.38, y, 0.13));
            for (const x of [0.24, 0.8, 1.96, 2.52]) leaf.add(makeMesh(new THREE.SphereGeometry(0.035, 6, 5), iron, x, y, 0.18));
        }
        const handle = makeMesh(new THREE.TorusGeometry(0.13, 0.025, 7, 16), iron, 2.32, 1.55, 0.15); leaf.add(handle);
        door.add(leftP, rightP, top, leaf); scene.add(door);

        const count = lowDetail ? 24 : 42, positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) positions.set([((i * 37) % 60) / 10 - 3, 0.5 + ((i * 19) % 42) / 10, 3 - ((i * 47) % 180) / 10], i * 3);
        const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        dustTexture = softTexture("rgba(255,255,255,0.9)");
        particles = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xe1d4b8, size: 0.045, map: dustTexture, transparent: true, opacity: 0.24, depthWrite: false }));
        particles.userData.basePositions = positions.slice();
        scene.add(particles);

        // Eroul este adaugat asincron in init() pentru a permite model GLB local.
    }

    function resize() {
        if (!renderer || !camera || !canvas) return;
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(2, Math.floor(rect.width));
        const height = Math.max(2, Math.floor(rect.height));
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowDetail ? 1.25 : 1.5));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    function groundAt(x, z) {
        if (!roomGroup) return 0;
        roomGroup.updateWorldMatrix(true, true);
        const ray = new THREE.Raycaster(new THREE.Vector3(x, 0.7, z), new THREE.Vector3(0, -1, 0), 0, 1);
        return Math.max(0, ray.intersectObject(roomGroup, true)[0]?.point.y || 0);
    }

    function resetHeroPose() {
        if (!hero) return;
        hero.rotation.set(0, 0, 0);
        for (const field of ["armL", "armR", "legL", "legR"]) hero.userData[field]?.rotation.set(0, 0, 0);
        delete hero.userData.floorSample;
    }

    function animateHero(t, delta) {
        if (!hero?.userData) return;
        if (["combat", "celebrate", "fallen"].includes(heroState)) return;
        if (hero.userData.detailedHero) {
            const last = hero.userData.floorSample;
            if (!last || Math.hypot(hero.position.x - last.x, hero.position.z - last.z) > 0.075) {
                hero.userData.groundY = groundAt(hero.position.x, hero.position.z);
                hero.userData.baseY = (hero.userData.authoredBaseY || 0) + hero.userData.groundY;
                hero.userData.floorSample = { x: hero.position.x, z: hero.position.z };
            }
        }
        const { armL, armR, legL, legR, cape } = hero.userData;
        const moving = heroState === "walk" || heroState === "run";
        const distance = heroPreviousPosition ? Math.hypot(hero.position.x - heroPreviousPosition.x, hero.position.z - heroPreviousPosition.z) : 0;
        if (!heroPreviousPosition) heroPreviousPosition = hero.position.clone();
        heroPreviousPosition.copy(hero.position);
        const blend = 1 - Math.exp(-delta * 12);
        if (moving && !reducedMotion()) {
            const previousStep = Math.floor(heroPhase / Math.PI);
            heroPhase += Math.min(distance, 0.5) * Math.PI * 2 / (heroState === "run" ? 1.95 : 1.45);
            if (Math.floor(heroPhase / Math.PI) !== previousStep) window.CastleQuizAudio?.footstep?.();
            const swing = Math.sin(heroPhase) * (heroState === "run" ? 0.64 : 0.4);
            if (armL) armL.rotation.x = swing * (hero.userData.armSwingL ?? 1);
            if (armR) armR.rotation.x = -swing * (hero.userData.armSwingR ?? 1);
            if (legL) legL.rotation.x = -swing * 0.78; if (legR) legR.rotation.x = swing * 0.78;
            const baseY = hero.userData.baseY || 0;
            hero.position.y = baseY + Math.abs(Math.sin(heroPhase)) * 0.022;
            if (cape) cape.rotation.x = -0.04 - Math.abs(Math.sin(heroPhase)) * 0.035;
        } else {
            if (armL) armL.rotation.x *= 1 - blend; if (armR) armR.rotation.x *= 1 - blend;
            if (legL) legL.rotation.x *= 1 - blend; if (legR) legR.rotation.x *= 1 - blend;
            const baseY = hero.userData.baseY || 0;
            if (heroState === "idle") hero.position.y += (baseY - hero.position.y) * blend;
            if (cape) cape.rotation.x += (-0.025 - cape.rotation.x) * blend;
        }
    }

    function animateMonster(t) {
        if (!monster?.userData || monsterState === "entrance" || monsterState === "combat" || reducedMotion()) return;
        const ud = monster.userData;
        const type = ud.type || "goblin";
        const previous = ud.previousPosition || monster.position.clone();
        const distance = Math.hypot(monster.position.x - previous.x, monster.position.z - previous.z);
        ud.previousPosition = previous.copy(monster.position);
        ud.gaitPhase = (ud.gaitPhase || 0) + Math.min(distance, 0.5) * 5;
        if (type === "bat") {
            if (ud.wingL) ud.wingL.rotation.z = (ud.wingRestL ?? 1.3) + Math.sin(t * 8) * 0.62;
            if (ud.wingR) ud.wingR.rotation.z = (ud.wingRestR ?? -1.3) - Math.sin(t * 8) * 0.62;
            monster.position.y = (ud.baseY ?? 0.65) + Math.sin(t * 3.2) * 0.18;
        } else if (type === "spider") {
            ud.legs?.forEach((leg, i) => { leg.rotation.y = Math.sin(t * 5 + i) * 0.18; });
            monster.position.y = (ud.baseY || 0) + Math.abs(Math.sin(t * 4)) * 0.009;
        } else if (type === "ghost") {
            monster.position.y = (ud.baseY || 0.55) + Math.sin(t * 2.2) * 0.16;
            monster.rotation.z = Math.sin(t * 1.4) * 0.04;
        } else if (type === "dragon") {
            if (ud.wingL) ud.wingL.rotation.z = (ud.wingRestL ?? 1.25) + Math.sin(t * 3.4) * 0.28;
            if (ud.wingR) ud.wingR.rotation.z = (ud.wingRestR ?? -1.25) - Math.sin(t * 3.4) * 0.28;
            if (ud.jaw) ud.jaw.rotation.x = Math.max(0, Math.sin(t * 2.1)) * 0.22;
            if (ud.tail) ud.tail.rotation[ud.tailAxis || "z"] = Math.sin(t * 2) * 0.12;
            monster.position.y = (ud.baseY || 0) + Math.sin(t * 2) * 0.012;
        } else {
            const armL = ud.armL, armR = ud.armR;
            if (armL && armR) {
                const moving = monsterState === "approach" || monsterState === "retreat";
                const swing = moving ? Math.sin(ud.gaitPhase) * 0.36 : Math.sin(t * 1.8) * 0.018;
                armL.rotation.x = swing; armR.rotation.x = -swing;
                if (ud.legL) ud.legL.rotation.x = -swing * 0.8;
                if (ud.legR) ud.legR.rotation.x = swing * 0.8;
                armL.rotation.z = 0.045 + Math.sin(t * 1.7) * 0.018;
                armR.rotation.z = -0.045 - Math.sin(t * 1.7) * 0.018;
                if (monsterState === "taunt") {
                    const progress = Math.min(1, Math.max(0, (t - (ud.tauntAt || 0)) / 1.4));
                    armR.rotation.x -= Math.sin(progress * Math.PI) * 0.5;
                }
            }
            monster.position.y = ud.baseY || 0;
        }
    }

    function renderLoop(time) {
        animationId = requestAnimationFrame(renderLoop);
        if (!renderer || !scene || !camera || document.hidden) return;
        const interval = lowDetail || reducedMotion() ? 1000 / 30 : 1000 / 60;
        if (time - lastRender < interval - 1) return;
        const delta = Math.min(0.05, Math.max(0.001, (time - (lastFrame || time - 16)) / 1000));
        lastFrame = lastRender = time;
        const t = (time - clockStart) / 1000;
        const motion = reducedMotion() ? 0 : 1;
        flames.forEach(flame => {
            const phase = flame.position.z + flame.position.x;
            const s = 1 + Math.sin(t * 5.3 + phase) * 0.035 * motion;
            flame.scale.set(s, 1 + Math.cos(t * 7.1 + phase) * 0.06 * motion, s);
        });
        torchLights.forEach(light => { light.intensity = light.userData.baseIntensity * (1 + Math.sin(t * 5.3 + light.position.z) * 0.035 * motion); });
        updateParticles(t, motion);
        animateHero(t, delta); animateMonster(t); updateFx(time, delta);
        if (heroShadow && hero) heroShadow.position.set(hero.position.x, (hero.userData.groundY || 0) + 0.014, hero.position.z);
        if (monsterShadow) {
            monsterShadow.visible = Boolean(monster);
            if (monster) {
                monsterShadow.position.set(monster.position.x, (monster.userData.groundY || 0) + 0.012, monster.position.z);
                monsterShadow.material.opacity = 0.32 / (1 + Math.max(0, monster.position.y - (monster.userData.groundY || 0)));
            }
        }
        if (roomMoodLight) roomMoodLight.intensity = roomMoodLight.userData.baseIntensity * (1 + Math.sin(t * 5) * 0.035 * ambientPulse * motion);
        ambientPulse = Math.max(0, ambientPulse - delta * 0.7);
        renderer.render(scene, camera);
    }

    function updateParticles(t, motion) {
        if (!particles || !motion) return;
        if (particles.isPoints) {
            const positions = particles.geometry.getAttribute("position");
            const base = particles.userData.basePositions;
            for (let i = 0; i < positions.count; i++) {
                positions.setX(i, base[i * 3] + Math.cos(t * 0.25 + i) * 0.025);
                positions.setY(i, base[i * 3 + 1] + Math.sin(t * 0.4 + i) * 0.05);
            }
            positions.needsUpdate = true;
        } else {
            particles.children.forEach(flake => {
                const data = flake.userData;
                data.baseY ??= flake.position.y;
                flake.position.y = data.snow
                    ? 0.5 + ((data.baseY - 0.5 - t * 0.28) % 4.5 + 4.5) % 4.5
                    : data.baseY + Math.sin(t * 0.4 + data.phase) * 0.08;
            });
        }
    }

    function tween(duration, updater, easing = (p) => p * p * (3 - 2 * p)) {
        activeTween?.cancel?.();
        if (!scene || !camera) return Promise.reject(CANCELLED);
        if (reducedMotion() || skipRequested) { updater(1); return Promise.resolve(); }
        return new Promise((resolve, reject) => {
            let cancelled = false;
            let frame = null;
            const start = performance.now();
            const token = { cancel(finish = false) {
                if (cancelled) return;
                cancelled = true; if (frame) cancelAnimationFrame(frame);
                if (activeTween === token) activeTween = null;
                if (finish && scene && camera) { updater(1); resolve(); } else reject(CANCELLED);
            } };
            activeTween = token;
            function step(now) {
                if (cancelled) return;
                const p = reducedMotion() ? 1 : Math.min(1, (now - start) / Math.max(1, duration));
                updater(easing(p));
                if (p < 1) frame = requestAnimationFrame(step);
                else { if (activeTween === token) activeTween = null; resolve(); }
            }
            frame = requestAnimationFrame(step);
        });
    }

    async function cameraShot(from, to, lookFrom, lookTo, duration = 700) {
        camera.position.set(...from);
        const look = new THREE.Vector3(...lookFrom);
        camera.lookAt(look);
        await tween(duration, (p) => {
            camera.position.set(
                from[0] + (to[0] - from[0]) * p,
                from[1] + (to[1] - from[1]) * p,
                from[2] + (to[2] - from[2]) * p
            );
            look.set(
                lookFrom[0] + (lookTo[0] - lookFrom[0]) * p,
                lookFrom[1] + (lookTo[1] - lookFrom[1]) * p,
                lookFrom[2] + (lookTo[2] - lookFrom[2]) * p
            );
            camera.lookAt(look);
        });
    }

    async function init(targetCanvas, world = 'castle') {
        dispose(false);
        const ticket = lifecycle;
        currentWorld = window.QuizWorlds?.normalize(world) || 'castle';
        canvas = targetCanvas;
        if (!canvas) return false;
        const loading = document.getElementById("castleLoading");
        loading?.classList.remove("ascuns");
        const lib = await loadThree();
        if (ticket !== lifecycle) return false;
        if (!lib) {
            if (loading) loading.textContent = "Scena 3D nu a putut fi incarcata. Quiz-ul poate continua fara animatie.";
            return false;
        }
        try {
        lowDetail = (canvas.getBoundingClientRect().width < 700) || (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency < 6);
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: lowDetail ? "low-power" : "high-performance" });
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;
        surfaces = window.CastleQuizMaterials?.create(THREE, renderer.capabilities.getMaxAnisotropy());
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.1, 60);
        camera.position.set(0.9, 2.15, 7.4);
        camera.lookAt(0, 1.3, -1.8);
        if (currentWorld === 'castle') buildCastle();
        else {
            createEnvironment();
            const environment = window.QuizWorldScenery.buildEnvironment({ THREE, scene, world: currentWorld, mat, makeMesh });
            // The same shared physical-lighting texture also belongs to outdoor scenes.
            environment.floor.material.onBeforeCompile = shader => { lightingLookup = shader.uniforms.dfgLUT || null; };
            door = environment.door;
            particles = environment.particles;
        }
        buildRoom(0, false);
        const loaded = await createHeroModel();
        if (ticket !== lifecycle) { disposeTree(loaded, true); return false; }
        hero = loaded;
        hero.position.set(-0.65, hero.userData?.baseY || 0, 4.2);
        heroPreviousPosition = hero.position.clone();
        scene.add(hero);
        heroShadow = groundShadow(1.35, 0.9); monsterShadow = groundShadow(1.8, 1.2);
        resize();
        resizeObserver = new ResizeObserver(resize); resizeObserver.observe(canvas);
        clockStart = performance.now(); lastFrame = lastRender = 0; initialized = true; renderLoop(clockStart);
        if (loading) loading.classList.add("ascuns");
        return true;
        } catch (error) {
            console.warn("Scena 3D nu este disponibilă; quiz-ul poate continua fără ea.", error);
            dispose(false);
            if (loading) { loading.classList.remove("ascuns"); loading.textContent = "Scena 3D nu este disponibilă. Poți continua quiz-ul."; }
            return false;
        }
    }

    async function playMonsterEntrance(type, boss = false) {
        if (!monster || !camera) return;
        const ud = monster.userData || {};
        if (boss || type === "dragon") {
            const wingL = ud.wingL, wingR = ud.wingR, jaw = ud.jaw;
            await tween(900, (p) => {
                monster.rotation.y = Math.sin(p * Math.PI) * 0.28;
                if (wingL) wingL.rotation.z = ud.detailedMonster ? (ud.wingRestL ?? 0) - Math.sin(p * Math.PI) * 0.55 : 0.35 + p * 1.05;
                if (wingR) wingR.rotation.z = ud.detailedMonster ? (ud.wingRestR ?? 0) + Math.sin(p * Math.PI) * 0.55 : -0.35 - p * 1.05;
                if (jaw) jaw.rotation.x = Math.sin(p * Math.PI) * 0.32;
                camera.position.y = 2.45 + Math.sin(p * Math.PI) * 0.45;
                camera.lookAt(0, 1.75, monster.position.z);
            });
            return;
        }
        if (type === "ghost") {
            const base = monster.userData.baseY || 0.5;
            const startY = base - 1.15;
            monster.position.y = startY;
            monster.scale.multiplyScalar(0.58);
            const targetScale = ud.detailedMonster ? 1 : (window.CastleQuizAssets?.monsters?.ghost?.scale || 1.08);
            await tween(1050, (p) => {
                monster.position.y = startY + p * 1.15;
                monster.rotation.y = Math.sin(p * Math.PI) * Math.PI * 0.35;
                const sc = targetScale * (0.58 + p * 0.42);
                monster.scale.setScalar(sc);
            });
            return;
        }
        if (type === "bat") {
            const startY = 3.7; monster.position.y = startY;
            await tween(1000, (p) => {
                monster.position.y = startY - p * (startY - (ud.baseY ?? 0.7));
                monster.position.x = Math.sin(p * Math.PI * 4) * (1-p) * 1.1;
                if (ud.wingL) ud.wingL.rotation.z = (ud.wingRestL ?? 0.45) + Math.sin(p * Math.PI * 8) * 0.75;
                if (ud.wingR) ud.wingR.rotation.z = (ud.wingRestR ?? -0.45) - Math.sin(p * Math.PI * 8) * 0.75;
            });
            return;
        }
        if (type === "spider") {
            const base = monster.userData.baseY || 0; monster.position.y = 3.5;
            await tween(1100, (p) => {
                monster.position.y = 3.5 - p * (3.5 - base);
                ud.legs?.forEach((leg, i) => leg.rotation.z = Math.sin(p * Math.PI * 5 + i) * Math.sin(p * Math.PI) * 0.22);
            });
            return;
        }
        if (type === "wizard") {
            const targetScale = ud.detailedMonster ? 1 : (window.CastleQuizAssets?.monsters?.wizard?.scale || 1);
            monster.scale.setScalar(0.08);
            magicRing(monster.position.clone().add(new THREE.Vector3(0, 0.25, 0)), 0xb793ff, 0.92);
            await tween(900, (p) => {
                monster.scale.setScalar(Math.max(0.08, targetScale * p));
                monster.rotation.y = (1-p) * Math.PI * 2;
            });
            return;
        }
        const startY = monster.position.y;
        await tween(720, (p) => {
            monster.position.y = startY + Math.sin(p * Math.PI) * 0.13;
            if (ud.armR) ud.armR.rotation.x = -Math.sin(p * Math.PI) * 1.25;
            monster.rotation.y = Math.sin(p * Math.PI) * 0.16;
        });
        monster.position.y = startY;
    }

    async function encounter(type, boss = false, index = 0) {
        if (!initialized) return;
        const ticket = lifecycle;
        encounterIndex = index;
        heroState = "walk"; monsterState = "idle";
        buildRoom(index, boss);
        resetHeroPose();
        if (monster) { scene.remove(monster); disposeTree(monster, true); monster = null; }
        const loaded = await createMonsterModel(type, boss);
        if (ticket !== lifecycle) { disposeTree(loaded, true); return; }
        monster = loaded;
        monster.position.x = 0;
        monster.position.y = monster.userData?.baseY || 0;
        monster.position.z = -8.0;
        monster.userData.previousPosition = monster.position.clone();
        scene.add(monster);

        const leaf = door?.getObjectByName("doorLeaf");
        if (leaf) leaf.rotation.y = 0;
        hero.position.set(-0.65, hero.userData?.baseY || 0, 4.2);
        heroPreviousPosition = hero.position.clone(); heroPhase = 0;
        camera.position.set(0.9, 2.15, 7.4); camera.lookAt(0, 1.3, -1.8);
        await tween(2100, (p) => {
            hero.position.z = 4.2 - p * 2.9;
            camera.position.x = 0.9 + Math.sin(p * Math.PI) * 0.18;
            camera.position.y = 2.15 + Math.sin(p * Math.PI) * 0.035;
            camera.position.z = 7.4 - p * 1.5;
            camera.lookAt(0, 1.3, -1.8);
        });
        heroState = "idle";
        window.CastleQuizAudio?.stopSteps?.();

        // reveal monster + dolly-in
        if (boss) {
            pulseScene("castle-boss-awaken", 900);
            ambientPulse = 1;
            magicRing(new THREE.Vector3(0, 0.18, -4.15), 0xff6f45, 1.05);
            burst(new THREE.Vector3(0, 1.15, -4.0), 0xff8a4b, 42, 2.0, 1.15, 0.065);
        }
        monsterState = "approach";
        await tween(boss ? 1300 : 950, (p) => {
            monster.position.z = -8 + p * (boss ? 4.15 : 4.45);
            monster.rotation.y = Math.sin(p * Math.PI) * (boss ? 0.34 : 0.12);
            camera.position.x = 0.9 + Math.sin(p * Math.PI) * 0.12;
            camera.position.y = 2.15 + p * (boss ? 0.25 : 0.03);
            camera.position.z = 5.9 - p * (boss ? 0.15 : 0.05);
            camera.lookAt(monster.position.x * 0.3, boss ? 1.65 : 1.35, -2.25);
        });
        monsterState = "entrance";
        await playMonsterEntrance(boss ? "dragon" : type, boss);
        monsterState = "taunt";
        monster.userData.tauntAt = (performance.now() - clockStart) / 1000;
        camera.position.set(0.9, boss ? 2.4 : 2.18, boss ? 5.75 : 5.85);
        camera.lookAt(0, boss ? 1.65 : 1.35, -2.25);
    }

    function heroCombat() {
        if (!hero?.userData.detailedHero || !monster) return null;
        return window.CastleQuizCombat?.create({
            THREE, hero, monster, camera, tween, reducedMotion, groundAt,
            isSkipping: () => skipRequested,
            audio: window.CastleQuizAudio,
            impact(kind, point) {
                if (!initialized || reducedMotion() || skipRequested) return;
                burst(point, kind === "shield" ? 0xffdba1 : 0xffc18b, 10, 0.9, 0.28, 0.018);
            }
        });
    }

    async function correct() {
        if (!initialized || !monster) return;
        const fight = heroCombat();
        if (fight) {
            heroState = monsterState = "combat";
            await fight.strike();
            heroState = "idle";
        }
        monsterState = "retreat";
        if (!fight) {
            pulseScene("castle-correct-flash", 760);
            magicRing(monster.position.clone().add(new THREE.Vector3(0, 1.05, 0)), 0x8ff0b5, 0.55);
            burst(monster.position.clone().add(new THREE.Vector3(0, 1.15, 0)), 0x8ff0b5, 34, 1.75, 0.9, 0.05);
        }
        const startX = monster.position.x;
        const startZ = monster.position.z;
        await cameraShot([0, 2.25, 6.15], [0.65, 2.05, 5.5], [0, 1.35, -2], [0, 1.15, -1.5], 380);
        await tween(780, (p) => {
            monster.position.x = startX + p * (monster.userData.type === "dragon" ? 0.8 : 1.7);
            monster.position.z = startZ - p * 0.65;
            monster.rotation.y = p * 0.95;
        });
        monsterState = "idle";
        const leaf = door?.getObjectByName("doorLeaf");
        if (leaf) {
            window.CastleQuizAudio?.door?.();
            await tween(640, (p) => { leaf.rotation.y = p * Math.PI * 0.52; });
        }
        await cameraShot([0.65, 2.05, 5.5], [0.9, 2.18, 5.85], [0, 1.15, -1.5], [0, 1.35, -2.25], 320);
    }

    async function wrong() {
        if (!initialized) return;
        const fight = heroCombat();
        if (fight) {
            heroState = monsterState = "combat";
            await fight.block();
            heroState = monsterState = "idle";
            return;
        }
        monsterState = "taunt";
        pulseScene("castle-wrong-impact", 650);
        ambientPulse = 0.7;
        if (hero) {
            burst(hero.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xff7f76, 28, 1.55, 0.72, 0.05);
            magicRing(hero.position.clone().add(new THREE.Vector3(0, 0.7, 0)), 0xff6f67, 0.5);
        }
        const baseX = camera.position.x;
        const baseY = camera.position.y;
        const baseHeroZ = hero?.position.z || 0;
        await tween(520, (p) => {
            camera.position.x = baseX + Math.sin(p * Math.PI * 4) * (1 - p) * 0.06;
            camera.position.y = baseY + Math.sin(p * Math.PI * 2) * (1 - p) * 0.018;
            if (hero) {
                hero.rotation.z = Math.sin(p * Math.PI) * -0.07;
                hero.position.z = baseHeroZ + Math.sin(p * Math.PI) * 0.1;
            }
        }, (p) => p);
        camera.position.x = baseX; camera.position.y = baseY;
        if (hero) { hero.rotation.z = 0; hero.position.z = baseHeroZ; }
        const baseMonsterScale = monster?.scale.x || 1;
        await tween(320, (p) => {
            if (monster) monster.scale.setScalar(baseMonsterScale * (1 + Math.sin(p * Math.PI) * 0.04));
        });
        if (monster) monster.scale.setScalar(baseMonsterScale);
    }

    async function nextRoom() {
        if (!initialized) return;
        monsterState = "idle";
        const leaf = door?.getObjectByName("doorLeaf");
        if (leaf && leaf.rotation.y < 1) {
            window.CastleQuizAudio?.door?.();
            await tween(420, p => { leaf.rotation.y = p * Math.PI * 0.52; });
        }
        heroState = "run";
        const startZ = hero.position.z;
        heroPreviousPosition = hero.position.clone();
        await tween(2200, (p) => {
            hero.position.z = startZ + (-5.7 - startZ) * p;
            camera.position.x = 0.9 - p * 0.45;
            camera.position.z = 5.85 - p * 5.5;
            camera.position.y = 2.18 - p * 0.18;
            camera.lookAt(hero.position.x, 1.1, hero.position.z - 1.4);
        });
        heroState = "idle";
        window.CastleQuizAudio?.stopSteps?.();
        await tween(160, p => { canvas.style.opacity = String(1 - p); });
        if (monster) { scene.remove(monster); disposeTree(monster, true); monster = null; }
        hero.position.set(-0.65, hero.userData?.baseY || 0, 4.2); heroPreviousPosition = hero.position.clone();
        camera.position.set(0.9, 2.15, 7.4); camera.lookAt(0, 1.3, -1.8);
        if (leaf) leaf.rotation.y = 0;
        await tween(160, p => { canvas.style.opacity = String(p); });
    }

    async function victory() {
        if (!initialized) return;
        heroState = "celebrate";
        pulseScene("castle-victory-glow", 1800);
        burst(new THREE.Vector3(0, 1.4, 0.5), 0xffda78, 58, 2.25, 1.4, 0.065);
        magicRing(new THREE.Vector3(0, 0.5, 0.4), 0xffd36f, 0.9);
        if (monster) { scene.remove(monster); disposeTree(monster, true); monster = null; }
        const leaf = door?.getObjectByName("doorLeaf"); if (leaf) leaf.rotation.y = Math.PI * 0.52;
        await cameraShot([0, 2.2, 6.2], [-1.45, 2.8, 4.7], [0, 1.25, 1.0], [0, 1.25, 0.7], 900);
        await tween(900, (p) => {
            hero.rotation.y = -p * 0.35;
            hero.position.y = (hero.userData.baseY || 0) + Math.sin(p * Math.PI) * 0.05;
            if (hero.userData.armL) hero.userData.armL.rotation.z = -p * 0.75;
            if (hero.userData.armR) hero.userData.armR.rotation.z = p * 0.75;
        });
        hero.position.y = hero.userData?.baseY || 0;
    }

    async function gameOver() {
        if (!initialized) return;
        heroState = "fallen";
        pulseScene("castle-gameover-fade", 1500);
        burst(new THREE.Vector3(0, 1.0, 1.0), 0x9a7280, 20, 1.0, 1.1, 0.04);
        await cameraShot([0, 2.25, 6.2], [1.2, 1.25, 6.9], [0, 1.2, 0.8], [0, 0.72, 1.2], 650);
        await tween(420, (p) => {
            hero.rotation.z = -p * 0.72;
            hero.position.y = (hero.userData.baseY || 0) - p * 0.18;
        });
    }

    function getRoomName(index = 0, boss = false) {
        return window.QuizWorlds?.room(currentWorld, index, boss).name || (boss ? "Sala Dragonului" : ROOM_THEMES[index % ROOM_THEMES.length].name);
    }

    function skip() { skipRequested = true; window.CastleQuizAudio?.stopSteps?.(); window.CastleQuizAudio?.stopCombat?.(); activeTween?.cancel?.(true); }

    function dispose(clearCanvas = true) {
        lifecycle++; skipRequested = false;
        window.CastleQuizAudio?.stopSteps?.();
        window.CastleQuizAudio?.stopCombat?.();
        activeTween?.cancel?.(); activeTween = null;
        if (animationId) cancelAnimationFrame(animationId); animationId = null;
        resizeObserver?.disconnect?.(); resizeObserver = null;
        disposeTree(scene, true);
        surfaces?.dispose(); surfaces = null;
        environmentTarget?.dispose(); environmentTarget = null;
        shadowTexture?.dispose(); shadowTexture = null;
        dustTexture?.dispose(); dustTexture = null;
        lightingLookup?.value?.dispose?.(); lightingLookup = null;
        if (clearCanvas && canvas) {
            try { renderer?.clear?.(); } catch (_) {}
        }
        renderer?.dispose?.();
        if (canvas) canvas.style.opacity = "";
        renderer = scene = camera = hero = monster = door = particles = roomGroup = roomMoodLight = fxGroup = null;
        fxBursts = []; ambientPulse = 0; usingGlbHero = false; usingGlbMonster = false;
        flames = []; torchLights = []; heroShadow = monsterShadow = null;
        heroPhase = 0; heroPreviousPosition = null; lastFrame = lastRender = 0;
        initialized = false; heroState = "idle"; monsterState = "idle";
    }

    function motionTask(action) {
        return async (...args) => {
            const ticket = lifecycle; skipRequested = false;
            try { return await action(...args); }
            catch (error) { if (error !== CANCELLED) throw error; }
            finally { if (ticket === lifecycle) skipRequested = false; }
        };
    }

    encounter = motionTask(encounter); correct = motionTask(correct); wrong = motionTask(wrong);
    nextRoom = motionTask(nextRoom); victory = motionTask(victory); gameOver = motionTask(gameOver);

    return { init, encounter, correct, wrong, nextRoom, victory, gameOver, getRoomName, skip, dispose };
})();
