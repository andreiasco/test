const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');

const rootPath = path.resolve(__dirname, '..');
const threePath = path.resolve(path.dirname(require.resolve('three')), '..');
const libraries = Promise.all([
    import(pathToFileURL(path.join(threePath, 'build/three.module.js')).href),
    import(pathToFileURL(path.join(threePath, 'examples/jsm/utils/BufferGeometryUtils.js')).href)
]);
const types = ['goblin', 'skeleton', 'knight', 'golem', 'wizard', 'demon', 'bat', 'spider', 'ghost', 'dragon'];
const context = { window: {} };
for (const file of ['castle-monsters-humanoids.js', 'castle-monsters-creatures.js', 'castle-monsters.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(rootPath, 'js/site', file), 'utf8'), context, { filename: file });
}

async function build(type, lowDetail = false) {
    const [THREE, { mergeGeometries }] = await libraries;
    return { THREE, root: context.window.CastleQuizMonsters.create(THREE, mergeGeometries, type, { lowDetail }) };
}

function meshes(root) {
    const result = [];
    root.traverse(object => { if (object.isMesh) result.push(object); });
    return result;
}

function resources(root) {
    const geometry = new Set(), material = new Set(), texture = new Set();
    for (const mesh of meshes(root)) {
        geometry.add(mesh.geometry);
        for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
            material.add(mat);
            for (const value of Object.values(mat)) if (value?.isTexture) texture.add(value);
        }
    }
    return { geometry, material, texture };
}

function release(root) {
    const owned = resources(root);
    for (const set of Object.values(owned)) for (const item of set) item.dispose();
}

for (const lowDetail of [false, true]) {
    test(`all ten ${lowDetail ? 'mobile' : 'desktop'} monsters have finite, bounded renderable geometry`, async t => {
        const counts = [];
        for (const type of types) {
            const { THREE, root } = await build(type, lowDetail);
            assert.ok(root?.isGroup, `${type}: root group`);
            assert.equal(root.userData.detailedMonster, true, type);
            assert.equal(root.userData.type, type);
            const parts = meshes(root);
            assert.ok(parts.length > 0 && parts.length <= 90, `${type}: bounded draw calls (${parts.length})`);
            let triangles = 0;
            for (const mesh of parts) {
                const geometry = mesh.geometry;
                const position = geometry.getAttribute('position');
                assert.ok(position?.count > 0, `${type}: position data`);
                for (const field of ['position', 'normal', 'uv']) {
                    const attribute = geometry.getAttribute(field);
                    assert.ok(attribute, `${type}: ${field} attribute`);
                    assert.equal(attribute.count, position.count, `${type}: matching ${field} count`);
                    for (const number of attribute.array) assert.ok(Number.isFinite(number), `${type}: finite ${field}`);
                }
                if (geometry.index) for (const index of geometry.index.array) assert.ok(index < position.count, `${type}: index in range`);
                triangles += (geometry.index?.count || position.count) / 3;
                for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
                    assert.ok(mat?.isMaterial, `${type}: usable material`);
                    assert.ok(Number.isFinite(mat.roughness) && Number.isFinite(mat.metalness), `${type}: finite surface response`);
                }
            }
            assert.ok(triangles < (type === 'dragon' ? 45000 : 35000), `${type}: triangle budget (${triangles})`);
            root.updateWorldMatrix(true, true);
            const bounds = new THREE.Box3().setFromObject(root);
            const size = bounds.getSize(new THREE.Vector3());
            assert.ok([size.x, size.y, size.z].every(value => value > 0.1 && value < 9), `${type}: plausible dimensions ${size.toArray()}`);
            assert.ok(bounds.min.y > -0.18, `${type}: no substantial geometry below the floor (${bounds.min.y})`);
            if (!['bat', 'ghost'].includes(type)) assert.ok(bounds.min.y < 0.3, `${type}: feet meet floor (${bounds.min.y})`);
            counts.push({ type, meshes: parts.length, triangles });
            release(root);
        }
        t.diagnostic(JSON.stringify(counts));
    });
}

test('animated joints retain attached geometry and stationary pivots after static mesh merging', async () => {
    for (const type of types) {
        const { THREE, root } = await build(type);
        root.position.set(0.5, root.userData.baseY, -3.5);
        root.rotation.y = 0.23;
        root.updateWorldMatrix(true, true);
        const joints = ['armL', 'armR', 'legL', 'legR', 'wingL', 'wingR', 'jaw', 'tail']
            .flatMap(field => root.userData[field] ? [[field, root.userData[field]]] : []);
        for (const [i, joint] of (root.userData.legs || []).entries()) joints.push([`leg${i}`, joint]);
        if (type !== 'ghost') assert.ok(joints.length > 0, `${type}: animation references`);
        for (const [field, joint] of joints) {
            assert.ok(joint.isGroup, `${type} ${field}: group pivot survives merging`);
            assert.ok(root.getObjectById(joint.id), `${type} ${field}: attached to actor`);
            const part = meshes(joint).find(mesh => mesh.geometry.getAttribute('position').count > 0);
            assert.ok(part, `${type} ${field}: visible geometry follows pivot`);
            const pivot = joint.getWorldPosition(new THREE.Vector3());
            const local = part.matrix.clone();
            const vertex = new THREE.Vector3().fromBufferAttribute(part.geometry.getAttribute('position'), 0);
            const before = part.localToWorld(vertex.clone());
            const axis = field.startsWith('wing') ? 'z' : field === 'tail' ? (root.userData.tailAxis || 'z') : 'x';
            joint.rotation[axis] += 0.6;
            root.updateWorldMatrix(true, true);
            assert.ok(joint.getWorldPosition(new THREE.Vector3()).distanceTo(pivot) < 1e-8, `${type} ${field}: anchored joint`);
            assert.deepEqual(part.matrix.elements, local.elements, `${type} ${field}: geometry stays attached`);
            assert.ok(part.localToWorld(vertex.clone()).distanceTo(before) > 1e-6, `${type} ${field}: geometry actually moves`);
        }
        release(root);
    }
});

test('mobile geometry is lighter and independent actor resources can be released separately', async () => {
    for (const type of types) {
        const { root: desktop } = await build(type);
        const { root: mobile } = await build(type, true);
        const count = root => meshes(root).reduce((sum, mesh) => sum + (mesh.geometry.index?.count || mesh.geometry.getAttribute('position').count), 0);
        assert.ok(count(mobile) < count(desktop), `${type}: mobile reduces triangle count`);
        const a = resources(desktop), b = resources(mobile);
        for (const field of ['geometry', 'material', 'texture']) {
            for (const item of a[field]) assert.equal(b[field].has(item), false, `${type}: actor-owned ${field}`);
        }
        let mobileDisposals = 0;
        for (const set of Object.values(b)) for (const item of set) item.addEventListener('dispose', () => mobileDisposals++);
        release(desktop);
        assert.equal(mobileDisposals, 0, `${type}: retiring another monster leaves this actor alive`);
        release(mobile);
    }
});

test('unsupported monster types decline creation so the engine can use its existing fallback', async () => {
    const { root } = await build('unsupported-monster');
    assert.equal(root, null);
});

test('tapered horns have outward-facing side normals for back-face culling and lighting', async () => {
    const [THREE, { mergeGeometries }] = await libraries;
    const isolated = { window: {
        CastleQuizMonsterHumanoids: { build(k) {
            const root = k.group(null, 'horn-normal-check');
            k.taper(root, k.material('bone', 0xc7bda8), [[0, 0, 0], [0, 1, 0], [0, 2, 0]], [0.2, 0.15, 0.05], 12);
            return root;
        } }
    } };
    vm.runInNewContext(fs.readFileSync(path.join(rootPath, 'js/site/castle-monsters.js'), 'utf8'), isolated);
    const root = isolated.window.CastleQuizMonsters.create(THREE, mergeGeometries, 'probe');
    const geometry = meshes(root)[0].geometry;
    const position = geometry.getAttribute('position'), normal = geometry.getAttribute('normal');
    let checked = 0;
    for (let i = 0; i < position.count; i++) {
        if (Math.abs(position.getY(i) - 1) > 1e-6) continue;
        const radial = new THREE.Vector3(position.getX(i), 0, position.getZ(i)).normalize();
        const surfaceNormal = new THREE.Vector3().fromBufferAttribute(normal, i);
        assert.ok(surfaceNormal.dot(radial) > 0.9, 'side surface faces outward');
        checked++;
    }
    assert.ok(checked >= 12, 'checked an entire horn cross section');
    release(root);
});
