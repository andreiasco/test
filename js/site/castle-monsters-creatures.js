/* Authored fantasy creatures. Coordinates face +Z, toward the player. */
(function () {
    "use strict";

    function eyes(k, parent, dark, glow, x, y, z, size) {
        for (const side of [-1, 1]) {
            k.sphere(parent, dark, [side * x, y, z], [size * 1.45, size * 0.88, size * 0.65]);
            k.sphere(parent, glow, [side * x, y, z + size * 0.45], [size * 0.7, size * 0.52, size * 0.4]);
        }
    }

    function bat(k) {
        const root = k.group(null, "detailed-bat");
        const fur = k.material("skin", 0x59483b, { roughness: 0.95 });
        const wing = k.material("leather", 0x443238, { roughness: 0.9, side: k.THREE.DoubleSide });
        const ribs = k.material("skin", 0x786051);
        const innerEar = k.material("skin", 0x986e64);
        const dark = k.material("shadow", 0x151114);
        const eye = k.material("eye", 0x9c6c3f, { emissive: 0x492711, emissiveIntensity: 0.25 });
        const tooth = k.material("bone", 0xd7c9a5);

        k.sphere(root, fur, [0, 0.03, -0.04], [0.18, 0.28, 0.19]);
        k.sphere(root, fur, [0, 0.22, 0.12], [0.19, 0.18, 0.15]);
        k.sphere(root, ribs, [0, 0.15, 0.25], [0.115, 0.07, 0.075]);
        k.sphere(root, dark, [0, 0.18, 0.306], [0.055, 0.029, 0.022]);
        eyes(k, root, dark, eye, 0.102, 0.245, 0.24, 0.02);
        for (const side of [-1, 1]) {
            const ear = k.group(root, "bat-ear", [side * 0.13, 0.32, 0.09]);
            // A closed, cupped leaf has a rounded rim and thickness in profile.
            const outline = [[-0.07, 0], [0.04, 0], [0.095, 0.15], [0.08, 0.28], [0.025, 0.36], [-0.03, 0.3], [-0.07, 0.18], [-0.08, 0.07]];
            const earVertices = [[side * 0.005, 0.17, -0.005], [side * 0.005, 0.17, -0.055]];
            for (const z of [0.025, -0.025]) for (const [x, y] of outline) earVertices.push([side * x, y, z - y * 0.06]);
            const earTriangles = [];
            for (let i = 0; i < outline.length; i++) {
                const a = 2 + i, b = 2 + (i + 1) % outline.length;
                earTriangles.push(0, a, b, 1, b + outline.length, a + outline.length, a, a + outline.length, b, b, a + outline.length, b + outline.length);
            }
            if (side < 0) for (let i = 0; i < earTriangles.length; i += 3) [earTriangles[i + 1], earTriangles[i + 2]] = [earTriangles[i + 2], earTriangles[i + 1]];
            k.membrane(ear, fur, earVertices, earTriangles);
            const innerVertices = [[side * 0.005, 0.17, 0.002], ...outline.map(([x, y]) => [side * x * 0.68, y * 0.83 + 0.025, 0.014 - y * 0.045])];
            const innerTriangles = [];
            for (let i = 1; i <= outline.length; i++) {
                const next = i % outline.length + 1;
                innerTriangles.push(...(side < 0 ? [0, next, i] : [0, i, next]));
            }
            k.membrane(ear, innerEar, innerVertices, innerTriangles);
            k.sphere(ear, fur, [side * -0.025, 0.022, 0.025], [0.035, 0.055, 0.03]);
            k.taper(root, tooth, [[side * 0.065, 0.13, 0.288], [side * 0.062, 0.077, 0.29]], [0.014, 0], 6);
            k.bone(root, fur, [side * 0.08, -0.15, -0.07], [side * 0.11, -0.32, -0.04], 0.035, 0.022);
            for (let toe = 0; toe < 3; toe++) {
                const tx = side * 0.11 + (toe - 1) * 0.019;
                k.taper(root, dark, [[tx, -0.31, -0.04], [tx, -0.35, 0.025], [tx, -0.33, 0.045]], [0.009, 0.007, 0], 5);
            }
            const g = k.group(root, side < 0 ? "wingL" : "wingR", [side * 0.135, 0.13, -0.015]);
            const point = (x, y, z) => [side * x, y, z];
            const wrist = point(0.37, 0.17, 0.03);
            const edge = [point(0.05, 0, 0), point(0.49, 0.34, 0.1), point(1.31, 0.24, -0.08), point(1.08, 0.055, -0.31), point(1.08, -0.015, -0.48), point(0.83, -0.035, -0.42), point(0.72, -0.14, -0.65), point(0.5, -0.12, -0.47), point(0.28, -0.24, -0.53), point(0.15, -0.19, -0.29), point(0.03, -0.24, -0.14)];
            const vertices = [wrist, ...edge];
            const triangles = [];
            for (let i = 1; i < vertices.length - 1; i++) triangles.push(0, i, i + 1);
            k.membrane(g, wing, vertices, triangles);
            k.bone(g, ribs, [0, 0, 0], point(0.23, 0.1, 0.09), 0.043, 0.032);
            k.bone(g, ribs, point(0.23, 0.1, 0.09), wrist, 0.032, 0.025);
            for (const index of [2, 4, 6, 8, 10]) {
                const tip = edge[index];
                const knuckle = wrist.map((v, i) => v * 0.34 + tip[i] * 0.66 + (i === 1 ? 0.022 : 0));
                k.bone(g, ribs, wrist, knuckle, 0.021, 0.012);
                k.bone(g, ribs, knuckle, tip, 0.012, 0.004);
            }
            k.taper(g, dark, [wrist, point(0.43, 0.32, 0.12), point(0.46, 0.3, 0.17)], [0.022, 0.012, 0], 6);
            root.userData[side < 0 ? "wingL" : "wingR"] = g;
        }
        root.userData.wingRestL = 0;
        root.userData.wingRestR = 0;
        root.userData.baseY = 1.1;
        root.userData.focusY = 1.25;
        return root;
    }

    function spider(k) {
        const root = k.group(null, "detailed-spider");
        const shell = k.material("skin", 0x302b29, { roughness: 0.76 });
        const abdomen = k.material("skin", 0x4b3c32, { roughness: 0.94 });
        const joint = k.material("leather", 0x171b1b);
        const stripe = k.material("skin", 0x837361);
        const eye = k.material("eye", 0x59492e, { roughness: 0.13, emissive: 0x21170a, emissiveIntensity: 0.18 });
        k.sphere(root, abdomen, [0, 0.59, -0.34], [0.36, 0.32, 0.47]);
        k.sphere(root, shell, [0, 0.55, 0.19], [0.255, 0.21, 0.3]);
        // Broken pale markings follow the abdomen, rather than floating above it.
        for (let i = 0; i < 4; i++) {
            const z = -0.12 - i * 0.15;
            k.sphere(root, stripe, [0, 0.875 - Math.abs(z + 0.36) * 0.15, z], [0.048 + i * 0.003, 0.012, 0.055]);
        }
        for (let i = 0; i < 4; i++) {
            const x = (i - 1.5) * 0.094;
            const y = 0.63 + (i === 1 || i === 2 ? 0.025 : -0.012);
            k.sphere(root, joint, [x, y, 0.426], [0.039, 0.041, 0.022]);
            k.sphere(root, eye, [x, y, 0.444], [0.025, 0.027, 0.018]);
            k.sphere(root, eye, [x * 1.03, y + 0.069, 0.404], [0.017, 0.018, 0.014]);
        }
        root.userData.legs = [];
        for (const side of [-1, 1]) {
            for (let i = 0; i < 4; i++) {
                const z = 0.34 - i * 0.18;
                const leg = k.group(root, `spider-leg-${side}-${i}`, [side * 0.18, 0.55, z]);
                const spread = [0.62, 0.83, 0.86, 0.7][i];
                const fore = [0.57, 0.21, -0.25, -0.66][i];
                const elbow = [side * spread * 0.68, 0.22, fore * 0.47];
                const knee = [side * spread, 0.12, fore * 0.76];
                const ankle = [side * (spread + 0.1), -0.49, fore];
                const toe = [side * (spread + 0.075), -0.542, fore + 0.045];
                k.sphere(leg, joint, [0, 0, 0], [0.074, 0.07, 0.08]);
                k.bone(leg, shell, [0, 0, 0], elbow, 0.064, 0.047);
                k.sphere(leg, joint, elbow, [0.055, 0.054, 0.055]);
                k.bone(leg, shell, elbow, knee, 0.048, 0.042);
                k.sphere(leg, joint, knee, [0.049, 0.048, 0.049]);
                k.bone(leg, shell, knee, ankle, 0.04, 0.015);
                k.taper(leg, joint, [ankle, toe], [0.016, 0.002], 5);
                if (!k.lowDetail) {
                    for (let hair = 0; hair < 3; hair++) {
                        const t = 0.23 + hair * 0.22;
                        const p = elbow.map((v, a) => v * (1 - t) + knee[a] * t);
                        k.bone(leg, shell, p, [p[0], p[1] + 0.065, p[2] - 0.02], 0.005, 0.001);
                    }
                }
                root.userData.legs.push(leg);
            }
            k.taper(root, shell, [[side * 0.115, 0.44, 0.42], [side * 0.14, 0.29, 0.54], [side * 0.06, 0.29, 0.6]], [0.069, 0.038, 0.003], 8);
            k.taper(root, abdomen, [[side * 0.2, 0.47, 0.35], [side * 0.3, 0.36, 0.5], [side * 0.27, 0.32, 0.64]], [0.039, 0.026, 0.009], 7);
        }
        root.userData.baseY = 0;
        root.userData.focusY = 0.65;
        return root;
    }

    function ghostCloth(k, parent, material) {
        const sides = k.lowDetail ? 20 : 32;
        const rings = [[0.08, 0.12], [0.26, 0.19], [0.5, 0.25], [0.8, 0.28], [1.04, 0.34], [1.24, 0.37], [1.4, 0.24], [1.48, 0.18]];
        const positions = [], uv = [], indices = [];
        rings.forEach(([height, radius], ring) => {
            for (let i = 0; i <= sides; i++) {
                const angle = i / sides * Math.PI * 2;
                const fold = Math.cos(angle * 7 + height * 1.2) * 0.026 + Math.sin(angle * 11) * 0.008;
                const hem = ring === 0 ? Math.sin(angle * 5) * 0.07 : 0;
                const sway = (1.48 - height) * (1.48 - height) * 0.09;
                positions.push(Math.cos(angle) * (radius + fold) + sway, height + hem, Math.sin(angle) * (radius * 0.64 + fold) - 0.045);
                uv.push(i / sides, height / 1.48);
                if (ring && i < sides) {
                    const a = (ring - 1) * (sides + 1) + i;
                    const b = ring * (sides + 1) + i;
                    indices.push(a, b, a + 1, a + 1, b, b + 1);
                }
            }
        });
        const geometry = new k.THREE.BufferGeometry();
        geometry.setAttribute("position", new k.THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute("uv", new k.THREE.Float32BufferAttribute(uv, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        k.add(parent, geometry, material);
    }

    function ghost(k) {
        const root = k.group(null, "detailed-ghost");
        const cloth = k.material("cloth", 0xb2c0b8, { roughness: 0.98, side: k.THREE.DoubleSide });
        const hood = k.material("cloth", 0x899d98, { roughness: 0.99 });
        const face = k.material("shadow", 0x101c20, { roughness: 1 });
        const eye = k.material("eye", 0x99ddd2, { emissive: 0x64b8b2, emissiveIntensity: 1.15 });
        ghostCloth(k, root, cloth);
        const head = k.group(root, "ghost-hood", [0, 1.5, 0]);
        k.sphere(head, hood, [0, 0.09, -0.065], [0.3, 0.37, 0.245]);
        k.sphere(head, face, [0, 0.05, 0.16], [0.211, 0.273, 0.04]);
        k.add(head, new k.THREE.TorusGeometry(0.245, 0.055, 7, k.lowDetail ? 18 : 28), cloth, [0, 0.05, 0.178], [0.88, 1.23, 0.88]);
        for (const side of [-1, 1]) {
            k.sphere(head, eye, [side * 0.078, 0.095, 0.2], [0.038, 0.014, 0.012]);
            const sleeve = k.group(root, "ghost-sleeve", [side * 0.26, 1.22, 0]);
            k.taper(sleeve, cloth, [[0, 0, 0], [side * 0.19, -0.1, 0.025], [side * 0.3, -0.35, 0.08], [side * 0.32, -0.48, 0.075]], [0.15, 0.14, 0.1, 0.015], k.lowDetail ? 10 : 14);
            for (let fold = 0; fold < 3; fold++) {
                k.taper(sleeve, cloth, [[side * (0.25 + fold * 0.024), -0.32, 0.07], [side * (0.32 + fold * 0.025), -0.5 - fold * 0.032, 0.09]], [0.036, 0], 6);
            }
        }
        root.userData.head = head;
        root.userData.baseY = 0.35;
        root.userData.focusY = 1.35;
        return root;
    }

    function dragon(k) {
        const root = k.group(null, "detailed-dragon");
        const skin = k.material("scale", 0x633d32, { roughness: 0.8 });
        const ridge = k.material("scale", 0x8a5840);
        const belly = k.material("scale", 0xb29262, { roughness: 0.92 });
        const horn = k.material("bone", 0xb8a17c);
        const claw = k.material("bone", 0x463d35);
        const dark = k.material("shadow", 0x211b19);
        const mouth = k.material("skin", 0x422b29, { roughness: 0.95 });
        const iris = k.material("eye", 0xdbaa3b, { emissive: 0x8c410e, emissiveIntensity: 0.45, roughness: 0.18 });
        const membrane = k.material("leather", 0x855342, { side: k.THREE.DoubleSide, roughness: 0.96 });

        k.sphere(root, skin, [0, 1.12, -0.32], [0.48, 0.56, 0.8]);
        k.sphere(root, skin, [0, 1.3, 0.25], [0.39, 0.48, 0.48]);
        k.taper(root, skin, [[0, 1.29, 0.25], [0, 1.62, 0.43], [0, 1.97, 0.48], [0, 2.15, 0.73]], [0.32, 0.26, 0.21, 0.21], k.lowDetail ? 12 : 18);
        // A single curved ventral strip follows the chest and neck surface.
        // Separate spheres would repeatedly disappear inside the red torso.
        const bellyRows = [[0.68, 0.13], [0.8, 0.18], [0.94, 0.21], [1.08, 0.225], [1.22, 0.23], [1.36, 0.225], [1.5, 0.205], [1.64, 0.18], [1.78, 0.16], [1.92, 0.145]];
        const front = (x, y) => {
            let z = -1;
            for (const [cy, cz, rx, ry, rz] of [[1.12, -0.32, 0.48, 0.56, 0.8], [1.3, 0.25, 0.39, 0.48, 0.48]]) {
                const square = 1 - (x / rx) ** 2 - ((y - cy) / ry) ** 2;
                if (square >= 0) z = Math.max(z, cz + rz * Math.sqrt(square));
            }
            if (y >= 1.29) {
                const t = Math.min(1, Math.max(0, (y - 1.29) / (1.97 - 1.29)));
                const r = 0.32 - t * 0.11, cz = 0.25 + t * 0.23;
                z = Math.max(z, cz + Math.sqrt(Math.max(0, r * r - x * x)));
            }
            return z + 0.012;
        };
        const bellyVertices = [], bellyTriangles = [];
        const columns = 8;
        bellyRows.forEach(([y, width], row) => {
            for (let column = 0; column <= columns; column++) {
                const x = (column / columns * 2 - 1) * width;
                bellyVertices.push([x, y, front(x, y)]);
                if (row && column < columns) {
                    const a = (row - 1) * (columns + 1) + column;
                    const b = row * (columns + 1) + column;
                    bellyTriangles.push(a, a + 1, b, a + 1, b + 1, b);
                }
            }
        });
        k.membrane(root, belly, bellyVertices, bellyTriangles);
        const seam = k.material("scale", 0x816a48, { roughness: 0.95 });
        for (const [y, width] of bellyRows.slice(1, -1)) {
            const vertices = [], triangles = [];
            for (let column = 0; column <= columns; column++) {
                const x = (column / columns * 2 - 1) * width * 0.98;
                for (const dy of [-0.005, 0.005]) vertices.push([x, y + dy, front(x, y + dy) + 0.002]);
                if (column < columns) {
                    const a = column * 2;
                    triangles.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
                }
            }
            k.membrane(root, seam, vertices, triangles);
        }
        const head = k.group(root, "dragon-head", [0, 2.12, 0.69]);
        k.sphere(head, skin, [0, 0.07, 0.11], [0.255, 0.23, 0.36]);
        k.sphere(head, skin, [0, -0.015, 0.39], [0.22, 0.125, 0.34]);
        k.sphere(head, ridge, [0, 0.025, 0.64], [0.24, 0.105, 0.15]);
        // Flattened upper lip and recessed mouth leave space for the hinged jaw.
        k.sphere(head, dark, [0, -0.115, 0.43], [0.199, 0.026, 0.305]);
        for (const side of [-1, 1]) {
            k.sphere(head, dark, [side * 0.162, 0.077, 0.694], [0.043, 0.025, 0.029]);
            const socket = k.group(head, "dragon-eye", [side * 0.214, 0.105, 0.245]);
            socket.rotation.y = side * 0.35;
            k.sphere(socket, dark, [0, 0, 0], [0.063, 0.052, 0.046]);
            k.sphere(socket, iris, [0, 0, 0.028], [0.041, 0.039, 0.031]);
            k.sphere(socket, dark, [0, 0.002, 0.056], [0.007, 0.032, 0.005]);
            k.bone(head, ridge, [side * 0.12, 0.17, 0.36], [side * 0.27, 0.18, 0.19], 0.053, 0.065);
            k.taper(head, horn, [[side * 0.16, 0.23, -0.02], [side * 0.23, 0.43, -0.15], [side * 0.25, 0.58, -0.31]], [0.085, 0.055, 0], 9);
            k.taper(head, skin, [[side * 0.22, 0.03, -0.07], [side * 0.38, 0.13, -0.25], [side * 0.42, 0.05, -0.36]], [0.11, 0.07, 0], 8);
            for (let tooth = 0; tooth < 5; tooth++) {
                const z = 0.24 + tooth * 0.09;
                k.taper(head, horn, [[side * (0.17 + tooth * 0.004), -0.1, z], [side * (0.16 + tooth * 0.004), -0.168, z + 0.009]], [0.018, 0], 6);
            }
        }
        k.taper(head, ridge, [[0, 0.235, 0.28], [0, 0.32, 0.15], [0, 0.37, 0.01]], [0.062, 0.04, 0], 7);
        const jaw = k.group(head, "dragon-jaw", [0, -0.102, 0.045]);
        k.sphere(jaw, skin, [0, -0.084, 0.35], [0.204, 0.087, 0.305]);
        k.sphere(jaw, mouth, [0, -0.023, 0.35], [0.17, 0.018, 0.26]);
        k.sphere(jaw, belly, [0, -0.15, 0.31], [0.143, 0.03, 0.24]);
        for (const side of [-1, 1]) for (let tooth = 0; tooth < 4; tooth++) {
            const z = 0.21 + tooth * 0.105;
            k.taper(jaw, horn, [[side * 0.165, -0.032, z], [side * 0.158, 0.027, z + 0.005]], [0.015, 0], 6);
        }

        const legs = [];
        for (const side of [-1, 1]) {
            for (const rear of [false, true]) {
                const leg = k.group(root, rear ? "dragon-hind-leg" : "dragon-fore-leg", [side * (rear ? 0.35 : 0.31), rear ? 0.97 : 1.04, rear ? -0.8 : 0.42]);
                const knee = [side * 0.17, -0.39, rear ? 0.25 : -0.11];
                const ankle = [side * 0.15, -0.79, rear ? 0.07 : 0.02];
                k.sphere(leg, skin, [side * 0.045, -0.16, rear ? 0.1 : -0.035], [rear ? 0.22 : 0.15, 0.29, 0.19]);
                k.bone(leg, skin, [0, 0, 0], knee, rear ? 0.18 : 0.13, 0.105);
                k.sphere(leg, ridge, knee, [0.12, 0.13, 0.12]);
                k.bone(leg, skin, knee, ankle, 0.095, 0.066);
                const footY = rear ? -0.89 : -0.96;
                k.sphere(leg, skin, [side * 0.15, footY, 0.13], [0.135, 0.08, 0.2]);
                k.bone(leg, skin, ankle, [side * 0.15, footY, 0.11], 0.07, 0.09);
                for (let toe = 0; toe < 3; toe++) {
                    const x = side * 0.15 + (toe - 1) * 0.085;
                    k.bone(leg, ridge, [x, footY, 0.12], [x, footY - 0.015, 0.3], 0.041, 0.027);
                    k.taper(leg, claw, [[x, footY - 0.01, 0.27], [x, footY - 0.02, 0.36], [x, footY - 0.058, 0.39]], [0.031, 0.021, 0], 7);
                }
                legs.push(leg);
            }
            const wing = k.group(root, side < 0 ? "wingL" : "wingR", [side * 0.31, 1.46, -0.1]);
            const p = (x, y, z) => [side * x, y, z];
            const elbow = p(0.46, 0.42, -0.02);
            const wrist = p(0.85, 0.68, -0.11);
            const edge = [p(0, 0, 0), elbow, wrist, p(2.1, 0.58, -0.35), p(1.82, 0.25, -0.47), p(1.82, -0.02, -0.69), p(1.39, 0.04, -0.77), p(1.13, -0.25, -1.03), p(0.86, -0.1, -0.89), p(0.55, -0.39, -1.01), p(0.36, -0.17, -0.66), p(0.04, -0.43, -0.66)];
            const vertices = [wrist, ...edge];
            const triangles = [];
            for (let i = 1; i < vertices.length - 1; i++) {
                if (i === 2 || i === 3) continue;
                triangles.push(0, i, i + 1);
            }
            triangles.push(0, vertices.length - 1, 1);
            k.membrane(wing, membrane, vertices, triangles);
            k.bone(wing, skin, [0, 0, 0], elbow, 0.112, 0.073);
            k.sphere(wing, ridge, elbow, [0.084, 0.084, 0.084]);
            k.bone(wing, skin, elbow, wrist, 0.073, 0.055);
            for (const index of [3, 5, 7, 9, 11]) {
                const tip = edge[index];
                const joint = wrist.map((v, a) => v * 0.42 + tip[a] * 0.58 + (a === 1 ? 0.055 : 0));
                k.bone(wing, ridge, wrist, joint, 0.037, 0.023);
                k.bone(wing, ridge, joint, tip, 0.023, 0.007);
            }
            k.taper(wing, horn, [wrist, p(0.91, 0.89, 0.03), p(0.92, 0.89, 0.16)], [0.049, 0.028, 0], 8);
            root.userData[side < 0 ? "wingL" : "wingR"] = wing;
        }
        const tail = k.group(root, "dragon-tail", [0, 1.03, -0.95]);
        k.taper(tail, skin, [[0, 0, 0], [0.1, -0.15, -0.5], [0.35, -0.35, -0.95], [0.62, -0.49, -1.26], [0.78, -0.39, -1.49], [0.79, -0.27, -1.61]], [0.24, 0.18, 0.12, 0.073, 0.038, 0], k.lowDetail ? 10 : 14);
        for (let i = 0; i < 8; i++) {
            const z = 0.28 - i * 0.17;
            const y = 1.65 - Math.abs(z + 0.2) * 0.21;
            k.taper(root, horn, [[0, y, z], [0, y + 0.19 - i * 0.01, z - 0.12], [0, y + 0.21 - i * 0.01, z - 0.19]], [0.07, 0.035, 0], 7);
        }
        for (let i = 0; i < 4; i++) {
            const z = -0.2 - i * 0.22;
            const x = Math.max(0, -z - 0.3) * 0.55;
            const y = -0.03 + z * 0.3;
            k.taper(tail, horn, [[x, y + 0.1, z], [x, y + 0.26, z - 0.12]], [0.05 - i * 0.008, 0], 6);
        }
        root.userData.head = head;
        root.userData.jaw = jaw;
        root.userData.tail = tail;
        root.userData.tailAxis = "y";
        root.userData.legs = legs;
        root.userData.wingRestL = 0;
        root.userData.wingRestR = 0;
        root.userData.baseY = 0;
        root.userData.focusY = 1.6;
        return root;
    }

    function build(k, type) {
        const builder = { bat, spider, ghost, dragon }[type];
        if (!builder) return null;
        const root = builder(k);
        root.userData.type = type;
        root.userData.detailedMonster = true;
        return root;
    }

    window.CastleQuizMonsterCreatures = { build };
})();
