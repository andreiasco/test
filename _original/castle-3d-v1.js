// ======================================================
// MOTOR 3D - CASTEL QUIZ
// Scenă procedurală Three.js, fără modele externe.
// ======================================================

window.CastleQuiz3D = (() => {
    let THREE = null;
    let renderer = null;
    let scene = null;
    let camera = null;
    let canvas = null;
    let animationId = null;
    let resizeObserver = null;
    let hero = null;
    let monster = null;
    let door = null;
    let clockStart = performance.now();
    let activeTween = null;
    let initialized = false;

    const monsterPalette = {
        goblin: 0x5b8f3a,
        bat: 0x4f465c,
        skeleton: 0xd8d0bd,
        spider: 0x382d36,
        knight: 0x4a5261,
        ghost: 0x8ab9c9,
        golem: 0x7c6754,
        wizard: 0x5d3b78,
        demon: 0x8b2f3b,
        dragon: 0xa6382f
    };

    async function loadThree() {
        if (THREE) return THREE;
        try {
            THREE = await import("https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js");
            return THREE;
        } catch (error) {
            console.error("Three.js nu a putut fi încărcat:", error);
            return null;
        }
    }

    function material(color, roughness = 0.8, metalness = 0.05) {
        return new THREE.MeshStandardMaterial({ color, roughness, metalness });
    }

    function mesh(geometry, mat, x = 0, y = 0, z = 0) {
        const obj = new THREE.Mesh(geometry, mat);
        obj.position.set(x, y, z);
        obj.castShadow = true;
        obj.receiveShadow = true;
        return obj;
    }

    function buildHero() {
        const group = new THREE.Group();
        const body = mesh(new THREE.CapsuleGeometry(0.26, 0.6, 6, 10), material(0x285f78), 0, 0.78, 0);
        const head = mesh(new THREE.SphereGeometry(0.24, 18, 14), material(0xe7b98b), 0, 1.48, 0);
        const cape = mesh(new THREE.BoxGeometry(0.54, 0.74, 0.08), material(0x6e2434), 0, 0.86, 0.26);
        group.add(body, head, cape);
        group.position.set(0, 0, 4.3);
        return group;
    }

    function addEyes(group, y, z, spread = 0.18, color = 0xffd35c) {
        const eyeMat = new THREE.MeshBasicMaterial({ color });
        [-spread, spread].forEach((x) => {
            const eye = mesh(new THREE.SphereGeometry(0.045, 10, 8), eyeMat, x, y, z);
            group.add(eye);
        });
    }

    function buildMonster(type = "goblin", boss = false) {
        const group = new THREE.Group();
        const color = monsterPalette[type] || monsterPalette.goblin;
        const scale = boss ? 1.25 : 1;
        const mainMat = material(color, 0.72, type === "knight" ? 0.6 : 0.08);
        const darkMat = material(0x24212a, 0.9, 0.02);

        if (type === "bat") {
            const body = mesh(new THREE.SphereGeometry(0.36, 14, 10), mainMat, 0, 1.35, 0);
            const wingGeo = new THREE.ConeGeometry(0.48, 0.95, 3);
            const left = mesh(wingGeo, mainMat, -0.55, 1.38, 0);
            left.rotation.z = Math.PI / 2;
            const right = mesh(wingGeo, mainMat, 0.55, 1.38, 0);
            right.rotation.z = -Math.PI / 2;
            group.add(body, left, right);
            addEyes(group, 1.42, -0.32, 0.11, 0xff5858);
        } else if (type === "skeleton") {
            const skull = mesh(new THREE.SphereGeometry(0.34, 14, 12), mainMat, 0, 1.75, 0);
            const torso = mesh(new THREE.BoxGeometry(0.58, 0.65, 0.22), mainMat, 0, 1.05, 0);
            const spine = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8), mainMat, 0, 0.52, 0);
            group.add(skull, torso, spine);
            addEyes(group, 1.82, -0.29, 0.12, 0x23212a);
        } else if (type === "spider") {
            const abdomen = mesh(new THREE.SphereGeometry(0.48, 16, 12), mainMat, 0, 0.7, 0.1);
            const head = mesh(new THREE.SphereGeometry(0.29, 14, 10), mainMat, 0, 0.78, -0.45);
            group.add(abdomen, head);
            for (let i = 0; i < 4; i++) {
                const z = 0.42 - i * 0.25;
                [-1, 1].forEach((side) => {
                    const leg = mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.05, 7), darkMat, side * 0.58, 0.58, z);
                    leg.rotation.z = side * (Math.PI / 3);
                    group.add(leg);
                });
            }
            addEyes(group, 0.86, -0.69, 0.1, 0xff4f4f);
        } else if (type === "ghost") {
            const body = mesh(new THREE.SphereGeometry(0.52, 18, 14), mainMat, 0, 1.2, 0);
            body.scale.y = 1.5;
            const tail = mesh(new THREE.ConeGeometry(0.48, 0.9, 16), mainMat, 0, 0.38, 0);
            tail.rotation.x = Math.PI;
            group.add(body, tail);
            addEyes(group, 1.35, -0.47, 0.16, 0x20313b);
        } else if (type === "dragon") {
            const body = mesh(new THREE.SphereGeometry(0.62, 18, 14), mainMat, 0, 1.05, 0);
            body.scale.set(1.3, 1, 1.5);
            const head = mesh(new THREE.BoxGeometry(0.75, 0.52, 0.72), mainMat, 0, 1.55, -0.65);
            const hornMat = material(0x30282b);
            [-0.23, 0.23].forEach((x) => {
                const horn = mesh(new THREE.ConeGeometry(0.09, 0.42, 8), hornMat, x, 1.95, -0.52);
                horn.rotation.x = -0.45;
                group.add(horn);
            });
            const wingGeo = new THREE.ConeGeometry(0.65, 1.25, 3);
            const wingL = mesh(wingGeo, mainMat, -0.92, 1.38, 0.2); wingL.rotation.z = 1.35;
            const wingR = mesh(wingGeo, mainMat, 0.92, 1.38, 0.2); wingR.rotation.z = -1.35;
            group.add(body, head, wingL, wingR);
            addEyes(group, 1.62, -1.03, 0.2, 0xffd35c);
        } else {
            const bodyGeo = type === "golem" ? new THREE.BoxGeometry(0.9, 1.18, 0.65) : new THREE.CapsuleGeometry(0.43, 0.72, 6, 10);
            const body = mesh(bodyGeo, mainMat, 0, 0.88, 0);
            const head = mesh(new THREE.SphereGeometry(0.37, 16, 12), mainMat, 0, 1.68, -0.02);
            group.add(body, head);
            addEyes(group, 1.75, -0.35, 0.14, type === "wizard" ? 0xb7e8ff : 0xffd35c);
            if (type === "wizard") {
                const hat = mesh(new THREE.ConeGeometry(0.48, 0.9, 16), material(0x2d2142), 0, 2.35, 0);
                group.add(hat);
            }
            if (type === "knight") {
                const helmet = mesh(new THREE.BoxGeometry(0.78, 0.48, 0.72), material(0x59616e, 0.45, 0.8), 0, 1.72, 0);
                group.add(helmet);
            }
            if (type === "demon") {
                [-0.22, 0.22].forEach((x) => {
                    const horn = mesh(new THREE.ConeGeometry(0.1, 0.46, 8), darkMat, x, 2.18, 0);
                    group.add(horn);
                });
            }
        }

        group.scale.setScalar(scale);
        group.position.set(0, 0, -3.2);
        return group;
    }

    function buildCastle() {
        scene.background = new THREE.Color(0x090b16);
        scene.fog = new THREE.Fog(0x090b16, 7, 24);

        const ambient = new THREE.HemisphereLight(0x7d8bb0, 0x17121d, 1.25);
        scene.add(ambient);
        const moon = new THREE.DirectionalLight(0x8298d4, 1.25);
        moon.position.set(2, 6, 5);
        moon.castShadow = true;
        scene.add(moon);

        const stone = material(0x34333f, 0.95, 0.02);
        const floorMat = material(0x262531, 0.98, 0.01);
        const floor = mesh(new THREE.PlaneGeometry(10, 28), floorMat, 0, 0, -4);
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);

        const wallL = mesh(new THREE.BoxGeometry(0.55, 5, 28), stone, -3.2, 2.5, -4);
        const wallR = mesh(new THREE.BoxGeometry(0.55, 5, 28), stone, 3.2, 2.5, -4);
        const ceiling = mesh(new THREE.BoxGeometry(7, 0.4, 28), stone, 0, 5, -4);
        scene.add(wallL, wallR, ceiling);

        for (let z = 3; z > -14; z -= 4) {
            [-2.72, 2.72].forEach((x) => {
                const torchStem = mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.6, 8), material(0x5f4634), x, 2.05, z);
                torchStem.rotation.x = Math.PI / 2;
                const flame = mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffa33d }), x, 2.22, z - 0.22);
                flame.userData.flame = true;
                const light = new THREE.PointLight(0xff8c32, 2.2, 5, 2);
                light.position.set(x, 2.2, z - 0.15);
                scene.add(torchStem, flame, light);
            });
        }

        door = new THREE.Group();
        const doorFrameMat = material(0x57505b);
        const doorMat = material(0x3c271e);
        const leftPillar = mesh(new THREE.BoxGeometry(0.45, 3.8, 0.55), doorFrameMat, -1.65, 1.9, -6.8);
        const rightPillar = mesh(new THREE.BoxGeometry(0.45, 3.8, 0.55), doorFrameMat, 1.65, 1.9, -6.8);
        const top = mesh(new THREE.BoxGeometry(3.75, 0.5, 0.55), doorFrameMat, 0, 3.75, -6.8);
        const leaf = mesh(new THREE.BoxGeometry(2.75, 3.25, 0.28), doorMat, 0, 1.62, -6.65);
        leaf.name = "doorLeaf";
        door.add(leftPillar, rightPillar, top, leaf);
        scene.add(door);

        hero = buildHero();
        scene.add(hero);
    }

    function resize() {
        if (!renderer || !camera || !canvas) return;
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(2, Math.floor(rect.width));
        const height = Math.max(2, Math.floor(rect.height));
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    function renderLoop(time) {
        animationId = requestAnimationFrame(renderLoop);
        if (!renderer || !scene || !camera) return;
        const t = (time - clockStart) / 1000;
        scene.traverse((obj) => {
            if (obj.userData?.flame) {
                const s = 0.9 + Math.sin(t * 9 + obj.position.z) * 0.12;
                obj.scale.set(s, 1.1 + Math.cos(t * 8) * 0.1, s);
            }
        });
        if (monster) {
            monster.position.y = Math.sin(t * 2.2) * 0.06;
            monster.rotation.y = Math.sin(t * 1.1) * 0.08;
        }
        if (hero) hero.position.y = Math.abs(Math.sin(t * 4)) * 0.025;
        renderer.render(scene, camera);
    }

    function tween(duration, updater) {
        if (activeTween?.cancel) activeTween.cancel();
        return new Promise((resolve) => {
            const start = performance.now();
            let cancelled = false;
            activeTween = {
                cancel() { cancelled = true; updater(1); resolve(); }
            };
            function frame(now) {
                if (cancelled) return;
                const p = Math.min(1, (now - start) / Math.max(1, duration));
                const eased = 1 - Math.pow(1 - p, 3);
                updater(eased);
                if (p < 1) requestAnimationFrame(frame);
                else { activeTween = null; resolve(); }
            }
            requestAnimationFrame(frame);
        });
    }

    async function init(targetCanvas) {
        canvas = targetCanvas;
        const loading = document.getElementById("castleLoading");
        const lib = await loadThree();
        if (!lib || !canvas) {
            if (loading) loading.textContent = "Modul 3D indisponibil. Quiz-ul poate continua în modul simplificat.";
            return false;
        }
        dispose(false);
        canvas = targetCanvas;
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(54, 1, 0.1, 60);
        camera.position.set(0, 2.25, 7.7);
        camera.lookAt(0, 1.25, -1.5);
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        buildCastle();
        resize();
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(canvas);
        clockStart = performance.now();
        renderLoop(clockStart);
        initialized = true;
        if (loading) loading.classList.add("ascuns");
        return true;
    }

    async function encounter(type, boss = false, index = 0) {
        if (!initialized) return;
        if (monster) scene.remove(monster);
        monster = buildMonster(type, boss);
        monster.position.z = -7.2;
        scene.add(monster);

        const startHeroZ = 4.3;
        hero.position.z = startHeroZ;
        camera.position.set(0, 2.25, 7.7);
        camera.lookAt(0, 1.25, -1.5);

        await tween(1050, (p) => {
            hero.position.z = startHeroZ - p * 2.5;
            camera.position.z = 7.7 - p * 1.15;
        });
        await tween(700, (p) => {
            monster.position.z = -7.2 + p * 3.7;
        });
        if (index > 0) {
            await tween(350, (p) => { camera.position.x = Math.sin(p * Math.PI) * 0.18; });
            camera.position.x = 0;
        }
    }

    async function correct() {
        if (!initialized || !monster) return;
        const startZ = monster.position.z;
        await tween(600, (p) => {
            monster.position.x = p * 3.3;
            monster.rotation.y = p * 1.4;
            monster.position.z = startZ - p * 0.8;
        });
        const leaf = door?.getObjectByName("doorLeaf");
        if (leaf) await tween(500, (p) => { leaf.scale.x = Math.max(0.04, 1 - p); });
    }

    async function wrong() {
        if (!initialized) return;
        const base = camera.position.x;
        await tween(420, (p) => {
            camera.position.x = base + Math.sin(p * Math.PI * 6) * (1 - p) * 0.18;
            if (hero) hero.rotation.z = Math.sin(p * Math.PI) * -0.12;
        });
        camera.position.x = base;
        if (hero) hero.rotation.z = 0;
    }

    async function nextRoom() {
        if (!initialized) return;
        const leaf = door?.getObjectByName("doorLeaf");
        if (leaf) leaf.scale.x = 1;
        if (monster) {
            scene.remove(monster);
            monster = null;
        }
        await tween(700, (p) => {
            hero.position.z = 1.8 - p * 1.4;
            camera.position.z = 6.55 - p * 0.8;
        });
    }

    async function victory() {
        if (!initialized) return;
        await tween(900, (p) => {
            camera.position.y = 2.25 + p * 1.1;
            camera.position.z = 5.7 - p * 0.7;
            if (hero) hero.rotation.y = p * Math.PI * 2;
        });
    }

    async function gameOver() {
        if (!initialized) return;
        await tween(700, (p) => {
            camera.position.y = 2.25 - p * 0.65;
            camera.position.z = 6.2 + p * 0.7;
            if (hero) hero.rotation.z = -p * 0.65;
        });
    }

    function skip() {
        activeTween?.cancel?.();
    }

    function dispose(clearCanvas = true) {
        activeTween?.cancel?.();
        activeTween = null;
        if (animationId) cancelAnimationFrame(animationId);
        animationId = null;
        resizeObserver?.disconnect?.();
        resizeObserver = null;
        if (scene) {
            scene.traverse((obj) => {
                obj.geometry?.dispose?.();
                if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose?.());
                else obj.material?.dispose?.();
            });
        }
        renderer?.dispose?.();
        if (clearCanvas && canvas) {
            const context = canvas.getContext("2d");
            context?.clearRect?.(0, 0, canvas.width, canvas.height);
        }
        renderer = scene = camera = hero = monster = door = null;
        initialized = false;
    }

    return { init, encounter, correct, wrong, nextRoom, victory, gameOver, skip, dispose };
})();
