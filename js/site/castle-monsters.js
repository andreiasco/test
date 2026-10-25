// Sculpted fantasy creatures. Shared geometry helpers keep articulated models small
// enough for the mobile scene; no external model or texture downloads are needed.
window.CastleQuizMonsters = (() => {
    function kit(THREE, mergeGeometries, lowDetail) {
        const segments = lowDetail ? 12 : 18;
        const materials = new Map(), textures = new Map();

        function grain(kind) {
            if (textures.has(kind)) return textures.get(kind);
            const size = 64, data = new Uint8Array(size * size * 4);
            let seed = 173;
            for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
                seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
                const noise = (seed >>> 24) / 255;
                const weave = kind === "cloth" ? (x % 3 === 0 || y % 3 === 0 ? 0.28 : 0) : 0;
                const scales = kind === "scale" ? Math.sin((x + (Math.floor(y / 8) % 2) * 4) * Math.PI / 8) * Math.sin(y * Math.PI / 8) * 0.25 : 0;
                const value = Math.round(128 + (noise - 0.5) * 70 + weave * 100 + scales * 100);
                const offset = (y * size + x) * 4;
                data[offset] = data[offset + 1] = data[offset + 2] = value; data[offset + 3] = 255;
            }
            const texture = new THREE.DataTexture(data, size, size);
            texture.name = `creature-${kind}-relief`;
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.magFilter = THREE.LinearFilter;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.generateMipmaps = true; texture.needsUpdate = true;
            textures.set(kind, texture);
            return texture;
        }

        function material(kind, color, options = {}) {
            const key = `${kind}:${color}:${JSON.stringify(options)}`;
            if (materials.has(key)) return materials.get(key);
            const metal = kind === "metal", eye = kind === "eye";
            const roughness = metal ? 0.36 : eye ? 0.18 : kind === "bone" ? 0.72 : 0.88;
            const detail = !eye && kind !== "shadow";
            const result = new THREE.MeshStandardMaterial({
                color, roughness, metalness: metal ? 0.78 : 0,
                envMapIntensity: metal ? 0.85 : 0.3,
                ...(detail ? { bumpMap: grain(kind), bumpScale: kind === "stone" ? 0.035 : kind === "cloth" ? 0.009 : 0.014 } : {}),
                ...options
            });
            result.name = `creature-${kind}`;
            materials.set(key, result);
            return result;
        }

        function group(parent, name, position = [0, 0, 0]) {
            const result = new THREE.Group(); result.name = name;
            result.position.fromArray(position); parent?.add(result); return result;
        }
        function add(parent, geometry, mat, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0]) {
            const mesh = new THREE.Mesh(geometry, mat);
            mesh.position.fromArray(position); mesh.scale.fromArray(scale); mesh.rotation.set(...rotation);
            mesh.castShadow = true; mesh.receiveShadow = true; parent?.add(mesh); return mesh;
        }
        function sphere(parent, mat, position, scale) {
            return add(parent, new THREE.SphereGeometry(1, lowDetail ? 10 : 14, lowDetail ? 7 : 10), mat, position, scale);
        }
        function bone(parent, mat, start, end, radiusStart = 0.05, radiusEnd = radiusStart) {
            const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
            const direction = b.clone().sub(a), length = direction.length();
            const mesh = add(parent, new THREE.CylinderGeometry(radiusEnd, radiusStart, length, lowDetail ? 7 : 10), mat, a.clone().add(b).multiplyScalar(0.5).toArray());
            if (length) mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.divideScalar(length));
            return mesh;
        }
        function taper(parent, mat, points, radii, sides = 8) {
            const positions = [], uv = [], indices = [];
            const vectors = points.map(point => new THREE.Vector3(...point));
            for (let i = 0; i < vectors.length; i++) {
                const tangent = vectors[Math.min(i + 1, vectors.length - 1)].clone().sub(vectors[Math.max(0, i - 1)]).normalize();
                const reference = Math.abs(tangent.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
                const side = new THREE.Vector3().crossVectors(tangent, reference).normalize();
                const up = new THREE.Vector3().crossVectors(side, tangent).normalize();
                for (let j = 0; j <= sides; j++) {
                    const angle = j / sides * Math.PI * 2;
                    const vertex = vectors[i].clone().addScaledVector(side, Math.cos(angle) * radii[i]).addScaledVector(up, Math.sin(angle) * radii[i]);
                    positions.push(vertex.x, vertex.y, vertex.z); uv.push(j / sides, i / (vectors.length - 1));
                    if (i && j < sides) {
                        const a = (i - 1) * (sides + 1) + j, b = i * (sides + 1) + j;
                        indices.push(a, b, a + 1, a + 1, b, b + 1);
                    }
                }
            }
            // Close the root and tip so horns, digits and tails cast solid shadows.
            for (const ring of [0, vectors.length - 1]) {
                const center = positions.length / 3; positions.push(...vectors[ring].toArray()); uv.push(0.5, ring ? 1 : 0);
                for (let j = 0; j < sides; j++) {
                    const a = ring * (sides + 1) + j;
                    if (ring) indices.push(center, a + 1, a); else indices.push(center, a, a + 1);
                }
            }
            return membrane(parent, mat, positions, indices, uv);
        }
        function membrane(parent, mat, vertices, indices, coords) {
            const flat = Array.isArray(vertices[0]) ? vertices.flat() : vertices;
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute("position", new THREE.Float32BufferAttribute(flat, 3));
            geometry.setAttribute("uv", new THREE.Float32BufferAttribute(coords || flat.flatMap((_, i) => i % 3 === 0 ? [flat[i], flat[i + 1]] : []), 2));
            geometry.setIndex(indices); geometry.computeVertexNormals();
            return add(parent, geometry, mat);
        }
        function lathe(parent, mat, profile, position = [0, 0, 0], scale = [1, 1, 1]) {
            return add(parent, new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments), mat, position, scale);
        }
        function finish(root) {
            // Merge only siblings. Animated joint Groups retain their pivots and children.
            const parents = []; root.traverse(object => { if (object.isGroup) parents.push(object); });
            for (const parent of parents) {
                const batches = new Map();
                for (const mesh of parent.children.filter(child => child.isMesh)) {
                    if (Array.isArray(mesh.material)) continue;
                    if (!batches.has(mesh.material)) batches.set(mesh.material, []);
                    batches.get(mesh.material).push(mesh);
                }
                for (const [mat, meshes] of batches) {
                    if (meshes.length < 2) continue;
                    const prepared = meshes.map(mesh => {
                        mesh.updateMatrix();
                        const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
                        geometry.applyMatrix4(mesh.matrix);
                        if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
                        if (!geometry.getAttribute("uv")) geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(geometry.getAttribute("position").count * 2), 2));
                        for (const name of Object.keys(geometry.attributes)) if (!["position", "normal", "uv"].includes(name)) geometry.deleteAttribute(name);
                        return geometry;
                    });
                    const combined = mergeGeometries(prepared, false);
                    prepared.forEach(geometry => geometry.dispose());
                    if (!combined) continue;
                    for (const mesh of meshes) { parent.remove(mesh); mesh.geometry.dispose(); }
                    const mesh = add(parent, combined, mat); mesh.name = `${parent.name}-${mat.name}`;
                }
            }
            root.userData.detailedMonster = true;
            return root;
        }
        return { THREE, lowDetail, segments, group, material, add, sphere, bone, taper, lathe, membrane, finish };
    }

    function create(THREE, mergeGeometries, type, options = {}) {
        if (typeof mergeGeometries !== "function") return null;
        const k = kit(THREE, mergeGeometries, Boolean(options.lowDetail));
        const root = window.CastleQuizMonsterHumanoids?.build(k, type) || window.CastleQuizMonsterCreatures?.build(k, type);
        if (!root) return null;
        root.userData.type = type;
        root.userData.baseY ??= 0;
        root.position.y = root.userData.baseY;
        return k.finish(root);
    }
    return { create };
})();
