const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const threeRoot = path.resolve(path.dirname(require.resolve('three')), '..');
const libraries = Promise.all([
    import(pathToFileURL(path.join(threeRoot, 'build/three.module.js')).href),
    import(pathToFileURL(path.join(threeRoot, 'examples/jsm/utils/BufferGeometryUtils.js')).href)
]);
const context = { window: {}, Float32Array };
for (const name of ['castle-monsters-humanoids', 'castle-monsters-creatures', 'castle-monsters', 'castle-hero', 'castle-defeat']) {
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'js/site', name + '.js'), 'utf8'), context);
}
const types = ['hero', 'goblin', 'skeleton', 'knight', 'golem', 'wizard', 'demon', 'bat', 'spider', 'ghost', 'dragon'];
async function fixture(type, options = {}) {
    const [THREE, { mergeGeometries }] = await libraries;
    const actor = type === 'hero' ? context.window.CastleQuizHero.create(THREE, mergeGeometries, { lowDetail: true }) : context.window.CastleQuizMonsters.create(THREE, mergeGeometries, type, { lowDetail: true });
    const floor = options.floor ?? 0;
    actor.position.set(0.8, floor + (actor.userData.baseY || 0), -1.1);
    const groundAt = () => floor;
    const bounds = () => { actor.updateWorldMatrix(true, true); return new THREE.Box3().setFromObject(actor, true); };
    const initial = bounds(), initialSize = initial.getSize(new THREE.Vector3());
    const frames = [], sounds = [];
    let calls = 0;
    const tween = options.tween || (async (duration, update, easing = p => p) => {
        calls++;
        for (let i = 0; i <= 12; i++) {
            update(easing(i / 12));
            const box = bounds();
            frames.push({ min: box.min.y, max: box.max.y });
            assert.ok(box.min.y >= floor - 0.00001, `${type}: rendered geometry does not penetrate the floor`);
        }
    });
    const effect = context.window.CastleQuizDefeat.create({ THREE, actor, tween, groundAt,
        reducedMotion: () => Boolean(options.reduced), isSkipping: () => Boolean(options.skip),
        audio: { impact: kind => sounds.push(kind), armour: () => sounds.push('armour') } });
    return { THREE, actor, effect, bounds, initialSize, frames, sounds, calls: () => calls };
}
function release(actor) {
    const resources = new Set();
    actor.traverse(object => {
        if (object.geometry) resources.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) if (material) {
            resources.add(material); Object.values(material).forEach(value => { if (value?.isTexture) resources.add(value); });
        }
    });
    resources.forEach(resource => resource.dispose());
}
function pose(actor) {
    const result = new Map();
    actor.traverse(object => { object.updateMatrix(); result.set(object, object.matrix.toArray()); });
    return result;
}

test('all rig types fall into a persistent lower pose grounded by their rendered meshes', async t => {
    for (const type of types) await t.test(type, async () => {
        const f = await fixture(type, { floor: 0.23 });
        try {
            const scale = f.actor.scale.clone(), sword = f.actor.userData.sword, shield = f.actor.userData.shield;
            const grips = [sword, shield].filter(Boolean).map(item => [item, item.parent, item.matrix.clone()]);
            await f.effect.fall();
            const final = f.bounds(), finalHeight = final.max.y - final.min.y;
            assert.ok(Math.abs(final.min.y - 0.242) < 1e-5, `${type}: corpse actually rests on the raised floor`);
            assert.equal(f.actor.userData.defeated, true); assert.equal(f.actor.userData.defeating, false);
            assert.ok(finalHeight < f.initialSize.y * 0.92, `${type}: body lowers from ${f.initialSize.y} to ${finalHeight}`);
            assert.deepEqual(f.actor.scale.toArray(), scale.toArray(), 'death does not squash the whole model');
            for (const [item, parent, matrix] of grips) {
                assert.equal(item.parent, parent, 'equipment remains attached to the same hand'); item.updateMatrix();
                assert.deepEqual(item.matrix.toArray(), matrix.toArray(), 'equipment never floats away from the grip');
            }
            const rest = pose(f.actor), calls = f.calls(), audio = f.sounds.length;
            await f.effect.fall();
            assert.equal(f.calls(), calls, 'later finalization does not replay death');
            assert.equal(f.sounds.length, audio);
            for (const [object, before] of rest) { object.updateMatrix(); assert.deepEqual(object.matrix.toArray(), before); }
            if (type === 'ghost') assert.equal(f.actor.visible, false, 'the ghost fades completely');
        } finally { release(f.actor); }
    });
});

test('reduced motion and skip still produce a grounded terminal pose without impact sounds', async () => {
    for (const type of ['hero', 'bat', 'dragon', 'spider', 'ghost']) for (const option of ['reduced', 'skip']) {
        const f = await fixture(type, { [option]: true });
        try {
            await f.effect.fall();
            assert.equal(f.calls(), 0); assert.equal(f.sounds.length, 0);
            assert.equal(f.actor.userData.defeated, true);
            assert.ok(Math.abs(f.bounds().min.y - 0.012) < 1e-5);
        } finally { release(f.actor); }
    }
});

test('a hero collapses out of a raised guard instead of holding equipment upright after death', async () => {
    const f = await fixture('hero');
    try {
        for (const side of ['L', 'R']) {
            f.actor.userData[`arm${side}`].rotation.x = 0.9;
            f.actor.userData[`forearm${side}`].rotation.x = 0.8;
        }
        await f.effect.fall();
        const bounds = f.bounds();
        assert.ok(bounds.max.y - bounds.min.y < 0.85, 'body, shield and sword all settle into a low resting pose');
        assert.ok(Math.abs(bounds.min.y - 0.012) < 1e-5, 'relaxed equipment never pushes through the ground');
    } finally { release(f.actor); }
});

test('cancellation restores all rig transforms, material visibility, and allows a later attempt', async () => {
    const cancelled = new Error('cancelled');
    let fail = true;
    const f = await fixture('ghost', { tween: async (duration, update) => { update(0.5); if (fail) throw cancelled; update(1); } });
    try {
        const original = pose(f.actor), materials = new Map();
        f.actor.traverse(object => { for (const material of Array.isArray(object.material) ? object.material : [object.material]) if (material) materials.set(material, { opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite }); });
        await assert.rejects(f.effect.fall(), error => error === cancelled);
        assert.ok(!f.actor.userData.defeated && !f.actor.userData.defeating);
        assert.equal(f.actor.visible, true);
        for (const [object, before] of original) { object.updateMatrix(); assert.deepEqual(object.matrix.toArray(), before); }
        for (const [material, before] of materials) for (const key of Object.keys(before)) assert.equal(material[key], before[key]);
        fail = false; await f.effect.fall(); assert.equal(f.actor.userData.defeated, true);
    } finally { release(f.actor); }
});
