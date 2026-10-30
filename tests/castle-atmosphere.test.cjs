const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const threePath = path.resolve(path.dirname(require.resolve('three')), '..');
const library = import(pathToFileURL(path.join(threePath, 'build/three.module.js')).href);
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'js/site/castle-atmosphere.js'), 'utf8'), context);

function meshes(root) { const result = []; root.traverse(object => { if (object.isMesh) result.push(object); }); return result; }
function release(root) {
    const geometries = new Set(), materials = new Set();
    for (const mesh of meshes(root)) { geometries.add(mesh.geometry); materials.add(mesh.material); }
    geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose());
}

test('all room details have finite renderable geometry, bounded draw calls and a clear central duel lane', async t => {
    const THREE = await library;
    for (const world of ['castle', 'snow', 'desert', 'jungle']) for (const lowDetail of [false, true]) {
        const parent = new THREE.Group();
        const details = context.window.CastleQuizAtmosphere.decorate({ THREE, parent, world, lowDetail });
        const parts = meshes(details);
        assert.ok(parts.length > 0 && parts.length <= 8, `${world}: merged material budget`);
        let triangles = 0;
        for (const mesh of parts) {
            const positions = mesh.geometry.getAttribute('position');
            for (const name of ['position', 'normal', 'uv']) {
                const values = mesh.geometry.getAttribute(name);
                assert.equal(values.count, positions.count, `${world}: matching ${name}`);
                for (const value of values.array) assert.ok(Number.isFinite(value), `${world}: finite ${name}`);
            }
            for (let i = 0; i < positions.count; i++) {
                if (positions.getY(i) < 1 && positions.getZ(i) > -5) assert.ok(Math.abs(positions.getX(i)) > 1.35, `${world}: open combat lane`);
            }
            triangles += positions.count / 3;
        }
        assert.ok(triangles < 18000, `${world}: bounded detail triangles ${triangles}`);
        t.diagnostic(`${world}/${lowDetail ? 'mobile' : 'desktop'}: ${parts.length} meshes, ${triangles} triangles`);
        release(parent);
    }
});

test('redecoration is idempotent and torch animation references survive a single geometry refinement', async () => {
    const THREE = await library, parent = new THREE.Group();
    const flame = new THREE.Group();
    const geometry = new THREE.ConeGeometry(0.1, 0.4, 7), coreGeometry = new THREE.SphereGeometry(0.08, 8, 6);
    flame.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial()), new THREE.Mesh(coreGeometry, new THREE.MeshBasicMaterial()));
    const flamePosition = flame.position.clone();
    let discarded = 0; geometry.addEventListener('dispose', () => discarded++); coreGeometry.addEventListener('dispose', () => discarded++);
    const first = context.window.CastleQuizAtmosphere.decorate({ THREE, parent, flames: [flame] });
    const refined = flame.children.map(mesh => mesh.geometry);
    const second = context.window.CastleQuizAtmosphere.decorate({ THREE, parent, flames: [flame] });
    assert.equal(first, second); assert.equal(discarded, 2);
    assert.deepEqual(flame.children.map(mesh => mesh.geometry), refined);
    assert.deepEqual(flame.position, flamePosition);
    assert.equal(flame.children.length, 2);
    release(parent); release(flame);
});

test('boss window becomes framed panes and new room materials are independent between encounters', async () => {
    const THREE = await library, a = new THREE.Group(), b = new THREE.Group();
    const window = new THREE.Mesh(new THREE.CircleGeometry(1, 16), new THREE.MeshStandardMaterial()); a.add(window);
    const first = context.window.CastleQuizAtmosphere.decorate({ THREE, parent: a, boss: true });
    const second = context.window.CastleQuizAtmosphere.decorate({ THREE, parent: b, boss: true });
    assert.equal(window.visible, false, 'old flat glowing disc is replaced');
    const resourcesA = new Set(meshes(first).flatMap(mesh => [mesh.geometry, mesh.material]));
    for (const mesh of meshes(second)) {
        assert.equal(resourcesA.has(mesh.geometry), false); assert.equal(resourcesA.has(mesh.material), false);
    }
    let otherDisposals = 0;
    for (const mesh of meshes(second)) { mesh.geometry.addEventListener('dispose', () => otherDisposals++); mesh.material.addEventListener('dispose', () => otherDisposals++); }
    release(a); assert.equal(otherDisposals, 0, 'retiring one room does not retire the next'); release(b);
});
