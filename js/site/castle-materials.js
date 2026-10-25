// Suprafețe PBR generate local: piatră, dale și lemn, fără descărcări de texturi.
window.CastleQuizMaterials = (() => {
    const SIZE = 512;
    const SURFACES = {
        stone: { roughness: 0.95, bumpScale: 0.065, seed: 2187 },
        floor: { roughness: 0.88, bumpScale: 0.045, seed: 6031 },
        wood: { roughness: 0.86, bumpScale: 0.022, seed: 9277 }
    };

    function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
    function noise(x, y, seed) {
        let value = Math.imul((x | 0) ^ seed, 374761393) ^ Math.imul(y | 0, 668265263);
        value = Math.imul(value ^ (value >>> 13), 1274126177);
        return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
    }

    function grain(x, y, cells, seed) {
        const px = x / SIZE * cells, py = y / SIZE * cells;
        const ix = Math.floor(px), iy = Math.floor(py);
        let fx = px - ix, fy = py - iy;
        fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
        const sample = (dx, dy) => noise((ix + dx) % cells, (iy + dy) % cells, seed);
        const top = sample(0, 0) * (1 - fx) + sample(1, 0) * fx;
        const bottom = sample(0, 1) * (1 - fx) + sample(1, 1) * fx;
        return top * (1 - fy) + bottom * fy;
    }

    function stonePixel(x, y, kind) {
        const floor = kind === "floor";
        const seed = SURFACES[kind].seed;
        const columns = floor ? 3 : 4, rows = floor ? 4 : 6;
        const width = SIZE / columns, height = SIZE / rows;
        const row = Math.floor(y / height);
        const offset = row % 2 ? width / 2 : 0;
        const shiftedX = (x + offset) % SIZE;
        const column = Math.floor(shiftedX / width);
        const dx = shiftedX - column * width, dy = y - row * height;
        const block = noise(column, row, seed);
        const coarse = grain(x, y, 16, seed + 1);
        const fine = noise(x, y, seed + 2);
        const edge = Math.min(dx, width - dx, dy, height - dy);
        const joint = (floor ? 3.2 : 2.6) + (coarse - 0.5) * 2;
        const bevel = clamp((edge - joint) / (floor ? 3.5 : 4.5), 0, 1);
        const inside = edge > joint;
        let level = (floor ? 153 : 148) + block * 27 + (coarse - 0.5) * 12 + (fine - 0.5) * 8;
        let bump = 139 + bevel * 22 + (coarse - 0.5) * 14 + (fine - 0.5) * 9;
        let roughness = 210 + (coarse - 0.5) * 27 + (fine - 0.5) * 13;

        if (!inside) {
            level = 82 + (coarse - 0.5) * 10 + fine * 7;
            bump = 58 + fine * 13;
            roughness = 244;
        } else {
            // Marginile rotunjite și porii rămân discreți la distanță.
            level += (1 - bevel) * 5;
            if (fine > 0.994) { level -= 14; bump -= 18; }
            if (floor) {
                const wear = Math.max(0, 1 - Math.abs(dx - width / 2) / (width / 2));
                roughness -= wear * 19;
                level += wear * 3;
            }
        }
        return [level + 7, level + 3, level - 4, bump, roughness];
    }

    function woodPixel(x, y) {
        const seed = SURFACES.wood.seed;
        const width = SIZE / 4;
        const plank = Math.floor(x / width), dx = x - plank * width;
        const phase = y / SIZE * Math.PI * 2;
        const plankNoise = noise(plank, 0, seed);
        const knotX = width * (0.28 + noise(plank, 1, seed) * 0.44);
        const knotY = SIZE * (0.22 + noise(plank, 2, seed) * 0.56);
        const rawY = Math.abs(y - knotY), knotDY = Math.min(rawY, SIZE - rawY);
        const knotRadius = Math.sqrt((dx - knotX) ** 2 + knotDY ** 2 * 0.14);
        const knot = clamp(1 - knotRadius / 31, 0, 1);
        const curvedX = dx + Math.sin(phase + plank) * 3.5 + Math.sin(phase * 3) * 1.5;
        const rings = Math.sin(curvedX * 0.43 + Math.sin(phase * 2) * 1.8 + knot * Math.sin(knotRadius * 0.5) * 2.8);
        const fibres = Math.sin(curvedX * 1.7 + Math.cos(phase * 4) * 0.7);
        const fine = noise(x, y, seed + 3);
        const broad = grain(x, y, 8, seed + 4);
        const seam = Math.min(dx, width - dx) < 2.1;
        const shade = rings * 4.5 + fibres * 1.6 + (fine - 0.5) * 6 + (broad - 0.5) * 12;
        let level = 112 + plankNoise * 17 + shade - knot * 13;
        let bump = 147 + rings * 9 + fibres * 3 + (fine - 0.5) * 5 - knot * 8;
        let roughness = 207 + rings * 10 + (broad - 0.5) * 25;
        if (seam) { level = 58 + fine * 5; bump = 73 + fine * 8; roughness = 245; }
        return [level + 7, level - 17, level - 40, bump, roughness];
    }

    function createCanvases(kind) {
        const canvases = [0, 1, 2].map(() => {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = SIZE;
            return canvas;
        });
        const contexts = canvases.map(canvas => canvas.getContext("2d", { alpha: false }));
        if (contexts.some(context => !context)) throw new Error("Texturile castelului necesită Canvas 2D.");
        const images = contexts.map(context => context.createImageData(SIZE, SIZE));
        for (let y = 0; y < SIZE; y++) {
            for (let x = 0; x < SIZE; x++) {
                const pixel = kind === "wood" ? woodPixel(x, y) : stonePixel(x, y, kind);
                const i = (y * SIZE + x) * 4;
                images[0].data[i] = pixel[0];
                images[0].data[i + 1] = pixel[1];
                images[0].data[i + 2] = pixel[2];
                for (let map = 1; map < 3; map++) {
                    images[map].data[i] = images[map].data[i + 1] = images[map].data[i + 2] = pixel[map + 2];
                }
                images[0].data[i + 3] = images[1].data[i + 3] = images[2].data[i + 3] = 255;
            }
        }
        contexts.forEach((context, index) => context.putImageData(images[index], 0, 0));
        return canvases;
    }

    function create(THREE, anisotropy = 1) {
        const baseCanvases = new Map();
        const textureSets = new Map();
        const filtering = clamp(Math.floor(Number(anisotropy) || 1), 1, 8);

        function material(kind, color = 0xffffff, repeatX = 1, repeatY = 1) {
            const settings = SURFACES[kind];
            if (!settings) throw new TypeError(`Suprafață de castel necunoscută: ${kind}`);
            const rx = clamp(Number(repeatX) || 1, 0.125, 64);
            const ry = clamp(Number(repeatY) || 1, 0.125, 64);
            const key = `${kind}:${rx}:${ry}`;
            if (!baseCanvases.has(kind)) {
                try { baseCanvases.set(kind, createCanvases(kind)); }
                catch (error) {
                    baseCanvases.set(kind, null);
                    console.warn("Texturile castelului nu sunt disponibile; folosesc materiale simple.", error);
                }
            }
            if (!baseCanvases.get(kind)) {
                return new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: settings.roughness });
            }
            if (!textureSets.has(key)) {
                const textures = baseCanvases.get(kind).map((canvas, index) => {
                    const texture = new THREE.CanvasTexture(canvas);
                    texture.name = `castle-${kind}-${["albedo", "bump", "roughness"][index]}`;
                    texture.colorSpace = index === 0 ? THREE.SRGBColorSpace : THREE.NoColorSpace;
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(rx, ry);
                    texture.anisotropy = filtering;
                    texture.minFilter = THREE.LinearMipmapLinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    texture.needsUpdate = true;
                    return texture;
                });
                textureSets.set(key, textures);
            }
            const [map, bumpMap, roughnessMap] = textureSets.get(key);
            return new THREE.MeshStandardMaterial({
                color, map, bumpMap, roughnessMap,
                metalness: 0,
                roughness: settings.roughness,
                bumpScale: settings.bumpScale
            });
        }

        function dispose() {
            for (const textures of textureSets.values()) textures.forEach(texture => texture.dispose());
            textureSets.clear();
            for (const canvases of baseCanvases.values()) canvases?.forEach(canvas => { canvas.width = canvas.height = 1; });
            baseCanvases.clear();
        }

        return { material, dispose };
    }

    return { create };
})();
