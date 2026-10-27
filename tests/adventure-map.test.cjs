const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');

const threePath = path.resolve(path.dirname(require.resolve('three')), '..');
const libraries = Promise.all([
    import(pathToFileURL(path.join(threePath, 'build/three.module.js')).href),
    import(pathToFileURL(path.join(threePath, 'examples/jsm/utils/BufferGeometryUtils.js')).href)
]);
// Browser code and Three share one typed-array realm. Preserve that in the VM
// so mergeGeometries compares the actual array types rather than VM realms.
const context = { window: {}, Float32Array };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'js/site/adventure-map.js'), 'utf8'), context);
const worlds = ['castle', 'snow', 'desert', 'jungle'];
const monsters = ['goblin', 'skeleton', 'bat', 'spider', 'knight', 'ghost', 'golem', 'wizard', 'demon', 'dragon'];

async function create(count, options = {}) {
    const [THREE, { mergeGeometries }] = await libraries;
    const parent = new THREE.Group();
    const questions = Array.from({ length: count }, (_, index) => ({ monster: monsters[index % monsters.length] }));
    return { THREE, parent, map: context.window.CastleQuizAdventureMap.create({ THREE, parent, questions, mergeGeometries, ...options }) };
}

function meshes(root) { const found = []; root.traverse(object => { if (object.isMesh) found.push(object); }); return found; }
function release(root) {
    const resources = new Set();
    root.traverse(object => {
        if (object.geometry) resources.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) if (material) resources.add(material);
        object.shadow?.dispose?.();
    });
    resources.forEach(resource => resource.dispose());
}
function close(a, b, message, epsilon = 1e-6) { assert.ok(a.distanceTo(b) < epsilon, `${message}: ${a.toArray()} versus ${b.toArray()}`); }

test('routes preserve every question and join the spawn and successive encounters without gaps or reversed arrival headings', async () => {
    for (const world of worlds) for (const count of [1, 5, 50]) {
        const { THREE, parent, map } = await create(count, { world });
        assert.equal(map.root.parent, parent);
        assert.equal(map.nodes.length, count);
        assert.equal(map.paths.length, count);
        assert.equal(map.previews.length, count);
        for (let index = 0; index < count; index++) {
            const curve = map.paths[index];
            close(curve.getPointAt(0), index ? map.paths[index - 1].getPointAt(1) : map.spawn, `${world}/${count}/${index}: connected departure`);
            close(curve.getPointAt(1), map.nodes[index].clone().add(new THREE.Vector3(-0.65, 0, -0.2)), `${world}/${count}/${index}: duel arrival`);
            assert.ok(curve.getTangentAt(1).dot(new THREE.Vector3(0, 0, -1)) > 0.99, 'knight arrives facing the waiting foe');
            assert.ok(curve.getLength() > 6 && curve.getLength() < 20, 'walking distance stays playable');
            let previousZ = Infinity;
            for (let sample = 0; sample <= 40; sample++) {
                const point = curve.getPointAt(sample / 40);
                assert.equal(point.y, 0, 'road stays grounded');
                assert.ok(map.bounds.containsPoint(point), 'walking remains on the map terrain');
                assert.ok(point.z <= previousZ + 1e-6, 'trail does not double back through a completed duel');
                previousZ = point.z;
            }
        }
        release(parent);
    }
});

test('all themes have finite geometry and bounded rendering costs even for fifty encounters', async t => {
    for (const world of worlds) for (const lowDetail of [false, true]) {
        const { parent, map } = await create(50, { world, lowDetail });
        const parts = meshes(map.root), geometries = new Set(parts.map(mesh => mesh.geometry));
        assert.ok(parts.length <= 70, `${world}: detail geometry is batched`);
        assert.ok(geometries.size <= 25, `${world}: future foes reuse cached geometry`);
        let triangles = 0;
        for (const mesh of parts) {
            const positions = mesh.geometry.getAttribute('position');
            for (const name of ['position', 'normal', 'uv']) {
                const attribute = mesh.geometry.getAttribute(name);
                assert.equal(attribute?.count, positions.count, `${world}: matching ${name}`);
                for (const value of attribute.array) assert.ok(Number.isFinite(value), `${world}: finite ${name}`);
            }
            if (mesh.geometry.index) for (const index of mesh.geometry.index.array) assert.ok(index < positions.count, 'indices reference real vertices');
            triangles += (mesh.geometry.index?.count || positions.count) / 3 * (mesh.isInstancedMesh ? mesh.count : 1);
        }
        assert.ok(triangles < 75000, `${world}: bounded total triangles ${triangles}`);
        assert.equal(map.previews[0].geometry, map.previews[10].geometry, 'repeated monster types share one silhouette');
        t.diagnostic(`${world}/${lowDetail ? 'mobile' : 'desktop'}: ${parts.length} meshes, ${geometries.size} geometries, ${triangles} triangles`);
        release(parent);
    }
});

test('activating a stop removes its placeholder and won/passed markers remain distinct without mutating other stops', async () => {
    const { THREE, parent, map } = await create(5);
    const pads = map.root.getObjectByName('encounter-pads');
    const color = index => { const result = new THREE.Color(); pads.getColorAt(index, result); return result.getHex(); };
    const untouched = color(3);
    map.mark(0, 'active');
    assert.equal(map.previews[0].visible, false, 'a full model replaces the token rather than overlapping it');
    assert.equal(map.previews[1].visible, true);
    map.mark(0, 'won'); map.mark(1, 'passed');
    assert.equal(map.status[0], 'cleared');
    assert.equal(map.status[1], 'passed');
    assert.notEqual(color(0), color(1), 'correct and traversed encounters have different colors');
    assert.equal(color(3), untouched);
    map.mark(0, 'pending');
    assert.equal(map.previews[0].visible, true);
    assert.doesNotThrow(() => map.mark(-1, 'won'));
    assert.doesNotThrow(() => map.mark(50, 'active'));
    release(parent);
});

test('overview keeps current and upcoming stops inside the camera at desktop and narrow phone aspect ratios', async () => {
    for (const count of [1, 5, 8, 50]) {
        const { THREE, parent, map } = await create(count);
        for (const index of [0, Math.floor(count / 2), count - 1]) for (const aspect of [16 / 9, 1, 320 / 600]) {
            const origin = map.nodes[index].clone();
            const view = map.getOverview(aspect, index, origin);
            const camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 300);
            camera.position.copy(view.position); camera.lookAt(view.target); camera.updateMatrixWorld();
            assert.ok(view.position.toArray().every(Number.isFinite));
            assert.ok(view.target.toArray().every(Number.isFinite));
            const selected = count <= 5 ? map.nodes : map.nodes.slice(Math.max(0, index - 1), Math.min(count, index + 3));
            for (const node of selected) for (const offset of [new THREE.Vector3(-0.65, 2.2, -0.2), new THREE.Vector3(0, 2.2, -3.55)]) {
                const screen = node.clone().add(offset).sub(origin).project(camera);
                assert.ok(Math.abs(screen.x) < 1 && Math.abs(screen.y) < 1 && screen.z > -1 && screen.z < 1, `${count}/${index}/${aspect}: visible knight and foe ${screen.toArray()}`);
            }
            if (index === 0) {
                const gate = map.spawn.clone().add(new THREE.Vector3(0, 3.3, 1)).sub(origin).project(camera);
                assert.ok(Math.abs(gate.x) < 1 && Math.abs(gate.y) < 1, 'entrance and spawn stay visible on the initial overview');
            }
        }
        release(parent);
    }
});

test('lighting follows the active stop and preserves light/target alignment when the map is rebased for combat', async () => {
    const { THREE, parent, map } = await create(50);
    const lights = []; map.root.traverse(object => { if (object.isLight) lights.push(object); });
    const sun = lights.find(light => light.isDirectionalLight);
    assert.ok(sun?.castShadow);
    assert.equal(sun.parent, map.root);
    assert.equal(sun.target.parent, map.root, 'the target must move with the light during rebasing');
    const stop = map.nodes[49].clone();
    map.focus(stop); map.root.position.copy(stop).negate(); parent.updateMatrixWorld(true);
    close(sun.target.getWorldPosition(new THREE.Vector3()), new THREE.Vector3(), 'target lands at the rebased combat origin');
    close(sun.getWorldPosition(new THREE.Vector3()), new THREE.Vector3(5, 11, 6), 'sun remains beside the active hero instead of the map entrance');
    assert.ok(sun.shadow.camera.far < 40, 'shadow camera covers the local encounter instead of an entire long route');
    release(parent);
});

test('travel and duel lanes have ground underneath and no scenery at body height', async () => {
    for (const world of worlds) {
        const { THREE, parent, map } = await create(5, { world });
        const scenery = meshes(map.root).filter(mesh => !map.previews.includes(mesh));
        parent.updateMatrixWorld(true);
        const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0);
        const check = point => {
            ray.set(point.clone().add(new THREE.Vector3(0, 3, 0)), down);
            const hit = ray.intersectObjects(scenery, false)[0];
            assert.ok(hit, `${world}: continuous ground`);
            assert.ok(Math.abs(hit.point.y) < 0.035, `${world}: no obstacle under walking feet ${hit.point.toArray()}`);
        };
        for (const curve of map.paths) for (let sample = 0; sample <= 20; sample++) check(curve.getPointAt(sample / 20));
        for (const node of map.nodes) for (const x of [-1, 0, 1]) for (const z of [-4, -2, 0]) check(node.clone().add(new THREE.Vector3(x, 0, z)));
        release(parent);
    }
});

test('a textured road owns the supplied material so retiring a map releases it exactly once', async () => {
    const [THREE] = await libraries;
    const road = new THREE.MeshStandardMaterial({ color: 0xb8a17c });
    let retired = 0; road.addEventListener('dispose', () => retired++);
    const { parent, map } = await create(3, { surface: () => road });
    assert.ok(meshes(map.root).some(mesh => mesh.material === road), 'supplied surface belongs to the scene cleanup traversal');
    assert.equal(retired, 0, 'the road stays alive while its map is active');
    release(parent);
    assert.equal(retired, 1);
});

test('the full final dragon stays above the island footprint with room for its retreat', async () => {
    const [THREE, { mergeGeometries }] = await libraries;
    const actorContext = { window: {}, Float32Array, Uint8Array };
    for (const file of ['castle-monsters-humanoids.js', 'castle-monsters-creatures.js', 'castle-monsters.js']) {
        vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'js/site', file), 'utf8'), actorContext);
    }
    for (const count of [1, 5, 50]) {
        const { parent, map } = await create(count);
        const dragon = actorContext.window.CastleQuizMonsters.create(THREE, mergeGeometries, 'dragon', { boss: true });
        dragon.position.copy(map.nodes.at(-1)).add(new THREE.Vector3(0.8, 0, -4.5));
        const body = new THREE.Box3().setFromObject(dragon);
        assert.ok(body.min.x > map.bounds.min.x + 1 && body.max.x < map.bounds.max.x - 1, 'spread wings keep clearance from both island edges');
        assert.ok(body.min.z > map.bounds.min.z + 1 && body.max.z < map.bounds.max.z - 1, 'dragon and tail remain on land after stepping back');
        release(dragon); release(parent);
    }
});
