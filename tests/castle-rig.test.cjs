const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');

const rootPath = path.resolve(__dirname, '..');
const threePath = path.resolve(path.dirname(require.resolve('three')), '..');
const three = import(pathToFileURL(path.join(threePath, 'build/three.module.js')).href);
const loader = import(pathToFileURL(path.join(threePath, 'examples/jsm/loaders/GLTFLoader.js')).href);
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(rootPath, 'js/site/castle-rig.js'), 'utf8'), context);
const { prepare } = context.window.CastleQuizRig;

async function asset(type) {
    const THREE = await three;
    const { GLTFLoader } = await loader;
    const data = fs.readFileSync(path.join(rootPath, 'assets/quiz3d', `${type}.glb`));
    const bytes = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    const gltf = await new GLTFLoader().parseAsync(bytes, '');
    const root = gltf.scene;
    root.position.set(1.25, 0.3, -2.1);
    root.rotation.y = 0.42;
    root.scale.setScalar(1.17);
    root.userData.marker = 'keep';
    root.updateWorldMatrix(true, true);
    return { THREE, root };
}

function close(actual, expected, message) {
    assert.equal(actual.length, expected.length, message);
    actual.forEach((value, i) => assert.ok(Math.abs(value - expected[i]) < 1e-8, `${message} at ${i}: ${value} ≠ ${expected[i]}`));
}

function meshSnapshot(root) {
    const result = new Map();
    root.traverse(object => {
        if (object.isMesh) result.set(object, {
            world: object.matrixWorld.toArray(),
            color: object.geometry.getAttribute('color')?.array.slice(),
            material: object.material
        });
    });
    return result;
}

test('preparing the actual hero GLB preserves rest pose, root transform, materials and vertex colors', async () => {
    const { THREE, root } = await asset('hero');
    const before = meshSnapshot(root);
    const rootMatrix = root.matrixWorld.toArray();
    const cape = root.getObjectByName('Cape');
    root.userData.cape = cape;
    assert.equal(prepare(root, THREE, 'hero', 'hero'), root);
    root.updateWorldMatrix(true, true);
    close(root.matrixWorld.toArray(), rootMatrix, 'root transform');
    assert.equal(root.userData.marker, 'keep');
    assert.equal(root.userData.cape, cape);
    for (const [mesh, original] of before) {
        close(mesh.matrixWorld.toArray(), original.world, `${mesh.name} rest pose`);
        assert.deepEqual(mesh.geometry.getAttribute('color')?.array, original.color);
        assert.equal(mesh.material, original.material);
    }
});

test('hero hands and boots remain attached while limbs swing around stationary shoulder and hip points', async () => {
    const { THREE, root } = await asset('hero');
    prepare(root, THREE, 'hero', 'hero');
    for (const [field, limbName, accessoryName] of [
        ['armL', 'ArmL', 'HandL'], ['armR', 'ArmR', 'HandR'],
        ['legL', 'LegL', 'BootL'], ['legR', 'LegR', 'BootR']
    ]) {
        const pivot = root.userData[field];
        const mesh = root.getObjectByName(limbName);
        const accessory = root.getObjectByName(accessoryName);
        assert.ok(pivot.isGroup);
        assert.equal(mesh.parent, pivot);
        assert.equal(accessory.parent, pivot);
        const relative = mesh.worldToLocal(accessory.getWorldPosition(new THREE.Vector3())).toArray();
        const endpoint = new THREE.Vector3(0, mesh.geometry.boundingBox.max.y, 0);
        const shoulder = mesh.localToWorld(endpoint.clone()).toArray();
        const accessoryBefore = accessory.getWorldPosition(new THREE.Vector3()).toArray();
        pivot.rotation.x = 0.65;
        root.updateWorldMatrix(true, true);
        close(mesh.worldToLocal(accessory.getWorldPosition(new THREE.Vector3())).toArray(), relative, `${accessoryName} stays attached`);
        close(mesh.localToWorld(endpoint.clone()).toArray(), shoulder, `${limbName} joint stays anchored`);
        assert.notDeepEqual(accessory.getWorldPosition(new THREE.Vector3()).toArray(), accessoryBefore);
    }
});

test('preparing an already animated hero is idempotent', async () => {
    const { THREE, root } = await asset('hero');
    prepare(root, THREE, 'hero', 'hero');
    const joints = ['armL', 'armR', 'legL', 'legR'].map(field => root.userData[field]);
    joints[0].rotation.x = 0.4;
    root.updateWorldMatrix(true, true);
    const before = meshSnapshot(root);
    prepare(root, THREE, 'hero', 'hero');
    root.updateWorldMatrix(true, true);
    assert.deepEqual(['armL', 'armR', 'legL', 'legR'].map(field => root.userData[field]), joints);
    for (const [mesh, original] of before) close(mesh.matrixWorld.toArray(), original.world, `${mesh.name} repeated preparation`);
});

test('all humanoid GLBs receive anchored limb joints without changing their rest poses', async () => {
    for (const type of ['goblin', 'skeleton', 'knight', 'golem', 'wizard', 'demon']) {
        const { THREE, root } = await asset(type);
        const before = meshSnapshot(root);
        prepare(root, THREE, 'monster', type);
        root.updateWorldMatrix(true, true);
        for (const field of ['armL', 'armR', 'legL', 'legR']) assert.ok(root.userData[field].isGroup, `${type} ${field}`);
        for (const [mesh, original] of before) close(mesh.matrixWorld.toArray(), original.world, `${type} ${mesh.name} rest pose`);
    }
});

test('non-humanoid assets retain their original hierarchy and animation references', async () => {
    for (const type of ['bat', 'spider', 'ghost', 'dragon']) {
        const { THREE, root } = await asset(type);
        root.userData.wingL = root.getObjectByName('WingL');
        const refs = { ...root.userData };
        const parents = new Map();
        root.traverse(object => parents.set(object, object.parent));
        prepare(root, THREE, 'monster', type);
        assert.deepEqual(root.userData, refs);
        root.traverse(object => assert.equal(object.parent, parents.get(object)));
    }
});
