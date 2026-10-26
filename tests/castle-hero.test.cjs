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
const context = { window: {} };
for (const file of ['castle-monsters-humanoids.js', 'castle-monsters-creatures.js', 'castle-monsters.js', 'castle-hero.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(rootPath, 'js/site', file), 'utf8'), context, { filename: file });
}

async function hero(lowDetail = false) {
    const [THREE, { mergeGeometries }] = await libraries;
    return { THREE, root: context.window.CastleQuizHero.create(THREE, mergeGeometries, { lowDetail }) };
}

function meshes(root) {
    const result = [];
    root.traverse(object => { if (object.isMesh) result.push(object); });
    return result;
}

function resources(root) {
    const result = { geometry: new Set(), material: new Set(), texture: new Set() };
    for (const mesh of meshes(root)) {
        result.geometry.add(mesh.geometry);
        for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
            result.material.add(material);
            for (const value of Object.values(material)) if (value?.isTexture) result.texture.add(value);
        }
    }
    return result;
}

function release(root) {
    for (const set of Object.values(resources(root))) for (const resource of set) resource.dispose();
}

function triangleCount(root) {
    return meshes(root).reduce((sum, mesh) => sum + (mesh.geometry.index?.count || mesh.geometry.getAttribute('position').count) / 3, 0);
}

function descendant(object, ancestor) {
    for (let node = object; node; node = node.parent) if (node === ancestor) return true;
    return false;
}

function closeMatrix(actual, expected, message) {
    actual.elements.forEach((value, i) => assert.ok(Math.abs(value - expected.elements[i]) < 1e-8, `${message} at ${i}`));
}

test('both hero detail levels have finite geometry, physical surfaces and a grounded human silhouette', async t => {
    const report = [];
    for (const lowDetail of [false, true]) {
        const { THREE, root } = await hero(lowDetail);
        assert.ok(root?.isGroup);
        assert.equal(root.userData.detailedHero, true);
        assert.equal(root.userData.type, 'hero');
        assert.equal(root.userData.front, '-Z');
        assert.equal(root.userData.baseY, 0);
        const parts = meshes(root);
        assert.ok(parts.length > 0 && parts.length < 70, `bounded draw calls: ${parts.length}`);
        for (const mesh of parts) {
            const position = mesh.geometry.getAttribute('position');
            assert.ok(position?.count > 0);
            for (const field of ['position', 'normal', 'uv']) {
                const attribute = mesh.geometry.getAttribute(field);
                assert.ok(attribute, `${field} exists`);
                assert.equal(attribute.count, position.count, `${field} matches vertex count`);
                for (const value of attribute.array) assert.ok(Number.isFinite(value), `${field} is finite`);
            }
            if (mesh.geometry.index) for (const index of mesh.geometry.index.array) assert.ok(index < position.count, 'valid vertex index');
            for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
                assert.ok(material.isMeshStandardMaterial);
                assert.ok(Number.isFinite(material.roughness) && Number.isFinite(material.metalness));
            }
        }
        const triangles = triangleCount(root);
        assert.ok(triangles < 25000, `triangle budget: ${triangles}`);
        const bounds = new THREE.Box3().setFromObject(root), size = bounds.getSize(new THREE.Vector3());
        assert.ok(size.y > 1.9 && size.y < 2.7, `human height: ${size.y}`);
        assert.ok(size.x > 0.8 && size.x < 2.2, `equipment width: ${size.x}`);
        assert.ok(size.z > 0.3 && size.z < 1.5, `body depth: ${size.z}`);
        assert.ok(Math.abs(bounds.min.y) < 0.005, `boots meet the floor: ${bounds.min.y}`);
        report.push({ lowDetail, meshes: parts.length, triangles, size: size.toArray() });
        release(root);
    }
    t.diagnostic(JSON.stringify(report));
});

test('helmet, sword and shield survive geometry merging and stay attached to their intended joints', async () => {
    const { THREE, root } = await hero();
    const ud = root.userData;
    for (const field of ['armL', 'armR', 'legL', 'legR', 'helmet', 'sword', 'shield']) {
        assert.ok(ud[field]?.isGroup, `${field} retains its joint Group`);
        assert.ok(descendant(ud[field], root), `${field} belongs to hero`);
        assert.ok(meshes(ud[field]).length, `${field} retains visible geometry`);
    }
    assert.ok(descendant(ud.sword, ud.armR), 'right hand holds sword');
    assert.ok(descendant(ud.shield, ud.armL), 'left arm holds shield');
    assert.equal(descendant(ud.helmet, ud.armL) || descendant(ud.helmet, ud.armR), false, 'helmet stays with torso');

    root.position.set(1.25, 0.3, -2.1); root.rotation.y = 0.42; root.scale.setScalar(1.17);
    root.updateWorldMatrix(true, true);
    const helmetBefore = ud.helmet.matrixWorld.clone();
    for (const [arm, equipment] of [[ud.armR, ud.sword], [ud.armL, ud.shield]]) {
        const pivotBefore = arm.getWorldPosition(new THREE.Vector3());
        const relative = new THREE.Matrix4().copy(arm.matrixWorld).invert().multiply(equipment.matrixWorld);
        const equipmentBefore = equipment.getWorldPosition(new THREE.Vector3());
        arm.rotation.x = 0.55; arm.rotation.z = 0.35;
        root.updateWorldMatrix(true, true);
        assert.ok(arm.getWorldPosition(new THREE.Vector3()).distanceTo(pivotBefore) < 1e-8, 'shoulder pivot remains anchored');
        closeMatrix(new THREE.Matrix4().copy(arm.matrixWorld).invert().multiply(equipment.matrixWorld), relative, 'equipment remains rigidly attached');
        assert.ok(equipment.getWorldPosition(new THREE.Vector3()).distanceTo(equipmentBefore) > 0.1, 'equipment follows the moving arm');
    }
    closeMatrix(ud.helmet.matrixWorld, helmetBefore, 'arm movement leaves helmet in place');
    release(root);
});

test('weapon and shield clear the floor through walking, running and victory poses', async () => {
    for (const lowDetail of [false, true]) {
        const { THREE, root } = await hero(lowDetail), ud = root.userData;
        for (const amplitude of [0.4, 0.64]) for (let phase = 0; phase <= 16; phase++) {
            const swing = Math.sin(phase / 16 * Math.PI * 2) * amplitude;
            ud.armL.rotation.set(swing * ud.armSwingL, 0, 0);
            ud.armR.rotation.set(-swing * ud.armSwingR, 0, 0);
            ud.legL.rotation.x = -swing * 0.78; ud.legR.rotation.x = swing * 0.78;
            root.updateWorldMatrix(true, true);
            assert.ok(new THREE.Box3().setFromObject(ud.sword).min.y > 0.03, 'sword clears floor during gait');
            assert.ok(new THREE.Box3().setFromObject(ud.shield).min.y > 0.3, 'shield clears floor during gait');
        }
        for (let progress = 0; progress <= 1; progress += 0.25) {
            ud.armL.rotation.set(0, 0, -progress * 0.75);
            ud.armR.rotation.set(0, 0, progress * 0.75);
            root.updateWorldMatrix(true, true);
            assert.ok(new THREE.Box3().setFromObject(ud.sword).min.y > 0.03, 'sword clears floor during victory');
            assert.ok(new THREE.Box3().setFromObject(ud.shield).min.y > 0.3, 'shield clears floor during victory');
        }
        release(root);
    }
});

test('elbows, wrists and knees articulate while hands keep a rigid grip on their equipment', async () => {
    const { THREE, root } = await hero(), ud = root.userData;
    for (const side of ['L', 'R']) for (const joint of ['forearm', 'hand', 'shin', 'foot']) {
        const object = ud[`${joint}${side}`];
        assert.ok(object?.isGroup, `${joint}${side} has an anatomical pivot`);
        assert.ok(object.children.some(child => child.isMesh), `${joint}${side} carries visible anatomy`);
    }
    assert.equal(ud.sword.parent, ud.handR, 'the sword follows the gauntlet instead of rotating separately');
    assert.equal(ud.shield.parent, ud.handL, 'the shield follows the supporting hand');
    for (const [side, equipment] of [['R', ud.sword], ['L', ud.shield]]) {
        const forearm = ud[`forearm${side}`], hand = ud[`hand${side}`];
        root.updateWorldMatrix(true, true);
        const elbow = forearm.getWorldPosition(new THREE.Vector3());
        const wristBefore = hand.getWorldPosition(new THREE.Vector3());
        equipment.updateMatrix(); const grip = equipment.matrix.clone();
        forearm.rotation.x = 0.7;
        root.updateWorldMatrix(true, true);
        assert.ok(forearm.getWorldPosition(new THREE.Vector3()).distanceTo(elbow) < 1e-8, 'elbow stays anchored while bending');
        assert.ok(hand.getWorldPosition(new THREE.Vector3()).distanceTo(wristBefore) > 0.1, 'forearm bend actually moves the wrist');
        const wrist = hand.getWorldPosition(new THREE.Vector3());
        const before = equipment.getWorldPosition(new THREE.Vector3());
        hand.rotation.x = 0.25; hand.rotation.z = -0.15;
        root.updateWorldMatrix(true, true);
        assert.ok(hand.getWorldPosition(new THREE.Vector3()).distanceTo(wrist) < 1e-8, 'wrist pivot remains anchored');
        closeMatrix(equipment.matrix, grip, 'equipment retains its fixed local grip');
        assert.ok(equipment.getWorldPosition(new THREE.Vector3()).distanceTo(before) > 1e-4, 'equipment moves with the hand');
    }
    for (const side of ['L', 'R']) {
        const shin = ud[`shin${side}`], foot = ud[`foot${side}`], thigh = ud[`leg${side}`];
        root.updateWorldMatrix(true, true);
        const knee = shin.getWorldPosition(new THREE.Vector3()), before = foot.getWorldPosition(new THREE.Vector3());
        const upperPlate = thigh.children.find(child => child.isMesh), upperWorld = upperPlate.matrixWorld.clone();
        shin.rotation.x = 0.65;
        root.updateWorldMatrix(true, true);
        assert.ok(shin.getWorldPosition(new THREE.Vector3()).distanceTo(knee) < 1e-8, 'knee remains anchored');
        assert.ok(foot.getWorldPosition(new THREE.Vector3()).distanceTo(before) > 0.2, 'lower leg bend moves the boot');
        closeMatrix(upperPlate.matrixWorld, upperWorld, 'bending the knee leaves the thigh plate in place');
    }
    release(root);
});

test('combat contact anchors follow their equipment and identify the blade tip and shield face', async () => {
    const { THREE, root } = await hero(), ud = root.userData;
    assert.ok(ud.swordTip?.isObject3D && descendant(ud.swordTip, ud.sword), 'blade tip is attached to sword');
    assert.ok(ud.shieldContact?.isObject3D && descendant(ud.shieldContact, ud.shield), 'shield contact is attached to shield');
    root.updateWorldMatrix(true, true);
    const bladeTip = ud.swordTip.getWorldPosition(new THREE.Vector3());
    const hilt = ud.sword.getWorldPosition(new THREE.Vector3());
    const swordBounds = new THREE.Box3().setFromObject(ud.sword, true);
    assert.ok(bladeTip.y < hilt.y - 0.5, 'resting blade points downward from grip');
    assert.ok(Math.abs(bladeTip.y - swordBounds.min.y) < 0.02, 'tip matches the end of blade geometry');
    assert.ok(swordBounds.distanceToPoint(bladeTip) < 0.02, 'blade tip lies on weapon geometry');
    const shieldPoint = ud.shieldContact.getWorldPosition(new THREE.Vector3());
    const shieldBounds = new THREE.Box3().setFromObject(ud.shield, true);
    assert.ok(shieldBounds.distanceToPoint(shieldPoint) < 0.03, 'contact lies on shield face');
    assert.ok(ud.shieldContact.position.z < 0, 'contact faces forward with hero');

    const tipLocal = ud.swordTip.position.clone(), contactLocal = ud.shieldContact.position.clone();
    ud.armR.rotation.set(-1.0, -0.25, 0.3); ud.armL.rotation.set(-0.8, 0.2, -0.3);
    root.updateWorldMatrix(true, true);
    assert.ok(ud.sword.worldToLocal(ud.swordTip.getWorldPosition(new THREE.Vector3())).distanceTo(tipLocal) < 1e-8);
    assert.ok(ud.shield.worldToLocal(ud.shieldContact.getWorldPosition(new THREE.Vector3())).distanceTo(contactLocal) < 1e-8);
    release(root);
});

test('mobile hero uses fewer triangles and owns resources independently of other actors', async () => {
    const { THREE, root: desktop } = await hero(), { root: mobile } = await hero(true);
    const [, { mergeGeometries }] = await libraries;
    const monster = context.window.CastleQuizMonsters.create(THREE, mergeGeometries, 'knight');
    assert.ok(triangleCount(mobile) < triangleCount(desktop) * 0.75, 'mobile profile materially reduces geometry');
    const owned = resources(desktop), mobileResources = resources(mobile), monsterResources = resources(monster);
    for (const [name, set] of Object.entries(owned)) {
        for (const resource of set) {
            assert.equal(mobileResources[name].has(resource), false, `separate hero ${name}`);
            assert.equal(monsterResources[name].has(resource), false, `separate monster ${name}`);
        }
    }
    let otherDisposals = 0, desktopDisposals = 0;
    for (const set of Object.values(owned)) for (const resource of set) resource.addEventListener('dispose', () => desktopDisposals++);
    for (const actor of [mobileResources, monsterResources]) for (const set of Object.values(actor)) {
        for (const resource of set) resource.addEventListener('dispose', () => otherDisposals++);
    }
    release(desktop);
    assert.equal(otherDisposals, 0, 'retiring hero leaves other actors alive');
    assert.equal(desktopDisposals, Object.values(owned).reduce((sum, set) => sum + set.size, 0), 'all owned resources are released');
    release(mobile); release(monster);
});

test('hero declines creation when shared model helpers are unavailable so the engine can fall back', async () => {
    const [THREE, { mergeGeometries }] = await libraries;
    const isolated = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(rootPath, 'js/site/castle-hero.js'), 'utf8'), isolated);
    assert.equal(isolated.window.CastleQuizHero.create(THREE, mergeGeometries), null);
});
