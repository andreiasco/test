// Room details share a small number of draw calls and leave the duel lane clear.
window.CastleQuizAtmosphere = (() => {
    function decorate({ THREE, parent, world = "castle", index = 0, boss = false, lowDetail = false, surface, flames = [] }) {
        if (!THREE || !parent) return null;
        const previous = parent.getObjectByName("atmosphere-details");
        if (previous) return previous;
        const details = new THREE.Group(); details.name = "atmosphere-details";
        parent.add(details);
        const batches = new Map(), owned = new Map();
        const segments = lowDetail ? 10 : 16;

        function material(key, color, options = {}) {
            if (!owned.has(key)) owned.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.92, ...options }));
            return owned.get(key);
        }
        function textured(kind, color) {
            const key = `${kind}-${color}`;
            if (!owned.has(key)) owned.set(key, surface?.(kind, color)?.clone() || material(`${key}-plain`, color));
            return owned.get(key);
        }
        function add(geometry, mat, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0]) {
            const transform = new THREE.Object3D();
            transform.position.fromArray(position); transform.scale.fromArray(scale); transform.rotation.set(...rotation); transform.updateMatrix();
            const data = geometry.index ? geometry.toNonIndexed() : geometry.clone();
            geometry.dispose(); data.applyMatrix4(transform.matrix);
            if (!data.getAttribute("normal")) data.computeVertexNormals();
            if (!data.getAttribute("uv")) data.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(data.getAttribute("position").count * 2), 2));
            if (!batches.has(mat)) batches.set(mat, []);
            batches.get(mat).push(data);
        }
        const sphere = (mat, position, scale) => add(new THREE.SphereGeometry(1, lowDetail ? 8 : 12, lowDetail ? 5 : 8), mat, position, scale);
        function tube(points, radius, mat, radial = 6) {
            const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
            add(new THREE.TubeGeometry(curve, lowDetail ? 5 : 9, radius, radial, false), mat);
        }
        function lathe(profile, mat, position, scale = [1, 1, 1]) {
            add(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments), mat, position, scale);
        }
        function box(size, mat, position) { add(new THREE.BoxGeometry(...size), mat, position); }

        function flameShape(height, width) {
            const profile = [[0, -0.46], [0.55, -0.38], [0.96, -0.2], [0.85, 0.02], [0.52, 0.20], [0.35, 0.34], [0.12, 0.45], [0, 0.59]];
            const geometry = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r * width, y * height)), lowDetail ? 9 : 14);
            const positions = geometry.getAttribute("position");
            for (let i = 0; i < positions.count; i++) {
                const y = positions.getY(i), lift = Math.max(0, y / height);
                positions.setXYZ(i, positions.getX(i) + lift * lift * height * 0.24, y, positions.getZ(i) * 0.82);
            }
            geometry.computeVertexNormals(); return geometry;
        }
        // Keep engine-owned flame roots and their animation references intact.
        for (const flame of flames) {
            if (flame.userData.atmosphereRefined) continue;
            flame.userData.atmosphereRefined = true;
            if (flame.isGroup) {
                const meshes = flame.children.filter(child => child.isMesh);
                if (meshes[0]) { meshes[0].geometry.dispose(); meshes[0].geometry = flameShape(0.4, 0.105); meshes[0].castShadow = false; meshes[0].material.depthWrite = false; }
                if (meshes[1]) { meshes[1].geometry.dispose(); meshes[1].geometry = flameShape(0.23, 0.064); meshes[1].position.y = -0.055; meshes[1].scale.set(1, 1, 1); meshes[1].castShadow = false; }
            } else if (flame.isMesh) {
                flame.geometry.dispose(); flame.geometry = flameShape(0.7, 0.22); flame.castShadow = false;
                flame.material.transparent = true; flame.material.opacity = 0.78; flame.material.depthWrite = false; flame.material.needsUpdate = true;
                const core = new THREE.Mesh(flameShape(0.43, 0.12), new THREE.MeshBasicMaterial({ color: 0xffe6b0, depthWrite: false }));
                core.position.y = -0.08; flame.add(core);
            }
        }

        if (world === "castle") {
            const stone = textured("stone", 0xaaa397), wood = textured("wood", 0xa18461);
            const iron = material("iron", 0x383a3a, { roughness: 0.63, metalness: 0.55 });
            const grime = material("mortar", 0x59594e);
            // A lower stone course and pilaster feet make walls meet the floor.
            for (const side of [-1, 1]) {
                box([0.17, 0.23, 5.8], stone, [side * 2.59, 0.115, -3.55]);
                for (const z of [-2.0, -5.7]) {
                    box([0.3, 0.14, 0.58], stone, [side * 2.48, 0.07, z]);
                    box([0.22, 0.16, 0.44], stone, [side * 2.51, 0.20, z]);
                }
            }
            // Curved oak casks, metal hoops and bung holes replace toy crates.
            for (const [side, z, size] of [[1, -2.25, 0.78], [-1, -5.6, 0.65]]) {
                const x = side * 2.09;
                lathe([[0.24, 0], [0.29, 0.08], [0.33, 0.38], [0.30, 0.68], [0.24, 0.76]], wood, [x, 0, z], [size, size, size]);
                for (const [r, y] of [[0.273, 0.07], [0.324, 0.27], [0.318, 0.51], [0.272, 0.69]]) {
                    lathe([[r, y], [r + 0.004, y + 0.045]], iron, [x, 0, z], [size, size, size]);
                }
                add(new THREE.CylinderGeometry(0.24, 0.24, 0.025, segments), wood, [x, 0.752 * size, z], [size, size, size]);
                add(new THREE.CylinderGeometry(0.026, 0.026, 0.014, 7), iron, [x + 0.07, 0.77 * size, z + 0.03]);
            }
            // Sconces attach to the masonry; their cups support the torch stems.
            for (const side of [-1, 1]) for (const z of [2.8, -0.8, -4.4]) {
                box([0.075, 0.33, 0.19], iron, [side * 2.94, 2.02, z]);
                tube([[side * 2.94, 1.89, z], [side * 2.80, 1.80, z], [side * 2.74, 1.87, z]], 0.026, iron);
                lathe([[0.08, 0], [0.11, 0.07], [0.095, 0.11]], iron, [side * 2.74, 2.17, z]);
            }
            const chips = lowDetail ? 8 : 15;
            for (let i = 0; i < chips; i++) {
                const side = i % 2 ? -1 : 1, z = -1.0 - ((i * 17) % 47) / 10;
                add(new THREE.DodecahedronGeometry(0.045 + i % 3 * 0.013, 0), i % 3 ? stone : grime, [side * (2.16 + i % 4 * 0.09), 0.024, z], [1.4, 0.55, 1], [i, i * 0.3, 0]);
            }
            if (boss) {
                const circle = parent.children.find(object => object.geometry?.type === "CircleGeometry");
                if (circle) circle.visible = false;
                const amber = material("window-amber", 0x9c8160, { emissive: 0x73532f, emissiveIntensity: 0.16, roughness: 0.6 });
                const smoke = material("window-smoke", 0x607577, { emissive: 0x3e5255, emissiveIntensity: 0.1, roughness: 0.65 });
                for (let pane = 0; pane < 8; pane++) add(new THREE.CircleGeometry(0.97, 5, pane * Math.PI / 4 + 0.015, Math.PI / 4 - 0.03), pane % 3 ? amber : smoke, [0, 3.35, -6.13]);
                add(new THREE.TorusGeometry(1.035, 0.075, 7, lowDetail ? 20 : 32), stone, [0, 3.35, -6.09]);
                tube([[0, 2.39, -6.07], [0, 3.35, -6.07], [0, 4.31, -6.07]], 0.029, iron);
                tube([[-0.91, 3.23, -6.07], [0, 3.23, -6.07], [0.91, 3.23, -6.07]], 0.025, iron);
                for (const side of [-1, 1]) tube([[0, 3.23, -6.07], [side * 0.31, 3.72, -6.07], [side * 0.36, 4.18, -6.07]], 0.023, iron);
            }
        } else if (world === "snow") {
            const snow = material("snow", 0xd0dde0, { roughness: 1 });
            const rock = material("wet-rock", 0x566775, { roughness: 0.73 });
            for (let i = 0; i < (lowDetail ? 4 : 7); i++) {
                const side = i % 2 ? -1 : 1, x = side * (2.08 + (i % 3) * 0.13), z = -1.6 - i * 0.63;
                add(new THREE.IcosahedronGeometry(0.35, lowDetail ? 0 : 1), rock, [x, 0.26, z], [1, 0.68, 0.85], [0.2, i * 0.7, 0.1]);
                sphere(snow, [x - side * 0.05, 0.40, z], [0.37, 0.13, 0.32]);
                sphere(snow, [side * 2.31, 0.14, z - 0.26], [0.47, 0.11, 0.51]);
            }
        } else if (world === "desert") {
            const clay = material("clay", 0x966b4d), rim = material("clay-rim", 0x77533b);
            const sand = material("sand-ripple", 0xbda176, { roughness: 1 });
            for (const [x, z, size] of [[-2.05, -3.1, 0.9], [2.14, -5.2, 1.08]]) {
                lathe([[0.08, 0.09], [0.16, 0.10], [0.22, 0.24], [0.20, 0.40], [0.11, 0.48], [0.10, 0.57]], clay, [x, 0, z], [size, size, size]);
                lathe([[0.12, 0.54], [0.12, 0.58], [0.083, 0.58], [0.083, 0.535]], rim, [x, 0, z], [size, size, size]);
                for (const side of [-1, 1]) tube([[x + side * 0.15 * size, 0.41 * size, z], [x + side * 0.28 * size, 0.37 * size, z], [x + side * 0.18 * size, 0.23 * size, z]], 0.018 * size, clay);
            }
            for (const side of [-1, 1]) for (let i = 0; i < (lowDetail ? 6 : 11); i++) {
                const x = side * (1.74 + (i % 3) * 0.16), z = -1.7 - i * 0.34;
                tube([[x, 0.094, z], [x + side * 0.16, 0.10, z - 0.08], [x + side * 0.42, 0.094, z - 0.035]], 0.009, sand, 4);
            }
        } else if (world === "jungle") {
            const leaf = material("fern-leaf", 0x4b7250, { side: THREE.DoubleSide });
            const stem = material("root", 0x554934), moss = material("moss", 0x475d3b);
            for (let i = 0; i < (lowDetail ? 4 : 7); i++) {
                const side = i % 2 ? -1 : 1, x = side * (2.06 + (i % 3) * 0.15), z = -1.5 - i * 0.62;
                tube([[x, 0.10, z], [x + side * 0.25, 0.19, z - 0.35], [x + side * 0.42, 0.10, z - 0.65]], 0.045, stem);
                sphere(moss, [x + side * 0.07, 0.11, z - 0.08], [0.22, 0.07, 0.31]);
                for (let frond = 0; frond < 5; frond++) {
                    const angle = frond / 5 * Math.PI * 2;
                    const tip = [x + Math.cos(angle) * 0.27, 0.52 + frond % 2 * 0.09, z + Math.sin(angle) * 0.27];
                    tube([[x, 0.12, z], [(x + tip[0]) / 2, 0.41, (z + tip[2]) / 2], tip], 0.008, stem, 4);
                    for (let j = 1; j < 5; j++) {
                        const p = j / 5, cx = x + (tip[0] - x) * p, cy = 0.12 + (tip[1] - 0.12) * Math.sin(p * Math.PI / 2), cz = z + (tip[2] - z) * p;
                        const width = 0.068 * Math.sin(p * Math.PI), dx = Math.cos(angle + Math.PI / 2) * width, dz = Math.sin(angle + Math.PI / 2) * width;
                        const geometry = new THREE.BufferGeometry();
                        geometry.setAttribute("position", new THREE.Float32BufferAttribute([cx - dx, cy - 0.025, cz - dz, cx, cy + 0.008, cz, cx + dx, cy - 0.025, cz + dz, cx + Math.cos(angle) * 0.065, cy + 0.015, cz + Math.sin(angle) * 0.065], 3));
                        geometry.setIndex([0, 1, 3, 1, 2, 3]); geometry.computeVertexNormals(); add(geometry, leaf);
                    }
                }
            }
        }

        // One static mesh per material, rather than one draw call per leaf or stone.
        for (const [mat, geometries] of batches) {
            const count = geometries.reduce((sum, geometry) => sum + geometry.getAttribute("position").count, 0);
            const geometry = new THREE.BufferGeometry();
            for (const [field, width] of [["position", 3], ["normal", 3], ["uv", 2]]) {
                const data = new Float32Array(count * width); let at = 0;
                for (const part of geometries) { data.set(part.getAttribute(field).array, at); at += part.getAttribute(field).array.length; }
                geometry.setAttribute(field, new THREE.BufferAttribute(data, width));
            }
            geometries.forEach(part => part.dispose());
            const mesh = new THREE.Mesh(geometry, mat); mesh.name = `detail-${mat.name || mat.color.getHexString()}`;
            mesh.castShadow = true; mesh.receiveShadow = true; details.add(mesh);
        }
        details.userData.world = world; details.userData.roomIndex = index;
        return details;
    }
    return { decorate };
})();
