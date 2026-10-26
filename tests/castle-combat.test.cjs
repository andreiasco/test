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
for (const file of [
    'castle-monsters-humanoids.js', 'castle-monsters-creatures.js',
    'castle-monsters.js', 'castle-hero.js', 'castle-combat.js'
]) {
    vm.runInNewContext(fs.readFileSync(path.join(rootPath, 'js/site', file), 'utf8'), context, { filename: file });
}
const types = ['goblin', 'skeleton', 'knight', 'golem', 'wizard', 'demon', 'bat', 'spider', 'ghost', 'dragon'];

function release(...roots) {
    const geometries = new Set(), materials = new Set(), textures = new Set();
    for (const root of roots) root.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
            if (!material) continue;
            materials.add(material);
            for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
        }
    });
    for (const set of [geometries, materials, textures]) for (const resource of set) resource.dispose();
}

function snapshot(...roots) {
    const result = new Map();
    for (const root of roots) root.traverse(object => {
        object.updateMatrix();
        result.set(object, object.matrix.toArray());
    });
    return result;
}

function assertRestored(before, ...roots) {
    const after = snapshot(...roots);
    assert.equal(after.size, before.size, 'combat does not leave helper objects in actor hierarchies');
    for (const [object, matrix] of before) {
        assert.ok(after.has(object), `${object.name}: original object remains attached`);
        after.get(object).forEach((value, i) => assert.ok(
            Math.abs(value - matrix[i]) < 1e-9,
            `${object.name || object.type}: local pose restored at matrix element ${i} (${value} vs ${matrix[i]})`
        ));
    }
}

// Measure the rendered model itself, independently of combat's collision targets.
function surfaceDistance(THREE, root, point) {
    root.updateWorldMatrix(true, true);
    const triangle = new THREE.Triangle();
    const closest = new THREE.Vector3();
    let distanceSq = Infinity;
    root.traverse(object => {
        if (!object.isMesh || !object.visible || distanceSq < 1e-12) return;
        const geometry = object.geometry;
        const position = geometry.getAttribute('position');
        const index = geometry.index;
        const count = index ? index.count : position.count;
        for (let offset = 0; offset < count; offset += 3) {
            for (const [vertex, shift] of [[triangle.a, 0], [triangle.b, 1], [triangle.c, 2]]) {
                vertex.fromBufferAttribute(position, index ? index.getX(offset + shift) : offset + shift)
                    .applyMatrix4(object.matrixWorld);
            }
            triangle.closestPointToPoint(point, closest);
            distanceSq = Math.min(distanceSq, closest.distanceToSquared(point));
            if (distanceSq < 1e-12) break;
        }
    });
    return Math.sqrt(distanceSq);
}

async function fixture(type = 'goblin', options = {}) {
    const [THREE, { mergeGeometries }] = await libraries;
    const lowDetail = options.lowDetail ?? true;
    const hero = context.window.CastleQuizHero.create(THREE, mergeGeometries, { lowDetail });
    const monster = context.window.CastleQuizMonsters.create(THREE, mergeGeometries, type, { lowDetail });
    const floor = options.floor ?? 0.2;
    const groundAt = options.groundAt || (() => floor);
    const enemyZ = type === 'dragon' ? -3.85 : -3.55;
    hero.userData.groundY = groundAt(-0.65, 1.3);
    monster.userData.groundY = groundAt(0, enemyZ);
    hero.position.set(-0.65, hero.userData.baseY + hero.userData.groundY, 1.3);
    monster.position.set(0, monster.userData.baseY + monster.userData.groundY, enemyZ);
    const camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.1, 60);
    camera.position.set(0.9, 2.18, 5.85);
    camera.lookAt(0, 1.35, -2.25);
    const effects = [], sounds = [];
    let tweenCalls = 0;
    let skipping = false;
    const tween = async (duration, update, easing = value => value) => {
        tweenCalls++;
        for (let frame = 0; frame <= 16; frame++) {
            if (options.cancelAt?.(tweenCalls, frame)) throw options.cancelError;
            if (options.cancelAfterImpact && effects.length && frame === 5) throw options.cancelError;
            if (options.skipAt?.(tweenCalls, frame)) skipping = true;
            update(easing(skipping || options.reducedMotion ? 1 : frame / 16));
            hero.updateWorldMatrix(true, true);
            monster.updateWorldMatrix(true, true);
            options.onFrame?.({ hero, monster, camera, tweenCalls, frame });
            await Promise.resolve();
            if (skipping || options.reducedMotion) break;
        }
    };
    const combat = context.window.CastleQuizCombat.create({
        THREE, hero, monster, camera, tween,
        reducedMotion: () => Boolean(options.reducedMotion),
        isSkipping: () => skipping || Boolean(options.skipInitially),
        groundAt,
        audio: new Proxy({}, { get: (_, name) => (...args) => sounds.push({ name, args }) }),
        impact(kind, point, metadata) {
            hero.updateWorldMatrix(true, true);
            monster.updateWorldMatrix(true, true);
            const effect = { kind, point: point.clone(), metadata };
            effects.push(effect);
            options.onImpact?.({ THREE, hero, monster, camera, effect });
        }
    });
    return { THREE, hero, monster, camera, combat, effects, sounds, tweenCalls: () => tweenCalls };
}

test('legacy actors without sword and shield decline combat so the existing quiz fallback remains usable', async () => {
    const [THREE] = await libraries;
    const legacy = new THREE.Group();
    assert.equal(context.window.CastleQuizCombat.create({
        THREE, hero: legacy, monster: new THREE.Group(), camera: new THREE.PerspectiveCamera(),
        tween: async (_, update) => update(1), reducedMotion: () => false, groundAt: () => 0
    }), null);
});

test('the real sword reaches each monster surface before one impact and all equipment poses are restored', async t => {
    for (const type of types) await t.test(type, async () => {
        let contact;
        const f = await fixture(type, { onImpact({ THREE, hero, monster, effect }) {
            assert.equal(effect.kind, 'blade');
            assert.ok(hero.userData.swordTip?.isObject3D, 'authored blade-tip anchor exists');
            const tip = hero.userData.swordTip.getWorldPosition(new THREE.Vector3());
            contact = {
                tipDistance: tip.distanceTo(effect.point),
                surfaceDistance: surfaceDistance(THREE, monster, effect.point)
            };
            assert.ok(contact.tipDistance < 0.15, `visible sword reaches impact (${contact.tipDistance}m)`);
            assert.ok(contact.surfaceDistance < 0.025, `impact lies on visible monster (${contact.surfaceDistance}m)`);
        } });
        const before = snapshot(f.hero, f.monster, f.camera);
        try {
            assert.ok(f.combat, 'equipped hero supports combat');
            await f.combat.strike();
            assert.equal(f.effects.length, 1, 'one impact per strike');
            assert.ok(contact, 'contact was inspected before recoil');
            assertRestored(before, f.hero, f.monster, f.camera);
        } finally { release(f.hero, f.monster); }
    });
});

test('monster attacks actually approach the shield before a single block impact', async t => {
    for (const type of types) await t.test(type, async () => {
        const f = await fixture(type, { onImpact({ THREE, hero, monster, effect }) {
            assert.equal(effect.kind, 'shield');
            assert.ok(hero.userData.shieldContact?.isObject3D, 'authored shield anchor exists');
            const shieldDistance = surfaceDistance(THREE, hero.userData.shield, effect.point);
            const attackerDistance = surfaceDistance(THREE, monster, effect.point);
            assert.ok(shieldDistance < 0.025, `impact lies on visible shield (${shieldDistance}m)`);
            assert.ok(attackerDistance < 0.15, `visible attacker reaches shield (${attackerDistance}m)`);
            if (effect.metadata?.attackerPoint) assert.ok(
                effect.metadata.attackerPoint.distanceTo(effect.point) < 0.15,
                'reported attacking point agrees with shield contact'
            );
        } });
        const before = snapshot(f.hero, f.monster, f.camera);
        try {
            await f.combat.block();
            assert.equal(f.effects.length, 1, 'one impact per block');
            assertRestored(before, f.hero, f.monster, f.camera);
        } finally { release(f.hero, f.monster); }
    });
});

test('cancelling windup, contact travel or recovery restores actor joints and camera without swallowing cancellation', async t => {
    for (const action of ['strike', 'block']) for (const phase of [1, 2, 3]) await t.test(`${action}, phase ${phase}`, async () => {
        const error = new Error('deliberate combat cancellation');
        const f = await fixture('knight', { cancelError: error, cancelAt: (call, frame) => call === phase && frame === 5 });
        const before = snapshot(f.hero, f.monster, f.camera);
        try {
            await assert.rejects(f.combat[action](), actual => actual === error);
            assertRestored(before, f.hero, f.monster, f.camera);
            assert.ok(f.effects.length <= 1, 'cancellation never duplicates an impact');
        } finally { release(f.hero, f.monster); }
    });
});

test('cancelling after contact restores the pose and preserves exactly one completed impact', async t => {
    for (const action of ['strike', 'block']) await t.test(action, async () => {
        const error = new Error('cancel during impact recovery');
        const f = await fixture('knight', { cancelError: error, cancelAfterImpact: true });
        const before = snapshot(f.hero, f.monster, f.camera);
        try {
            await assert.rejects(f.combat[action](), actual => actual === error);
            assert.equal(f.effects.length, 1, 'contact already completed once before cancellation');
            assertRestored(before, f.hero, f.monster, f.camera);
        } finally { release(f.hero, f.monster); }
    });
});

test('contact remains attached to visible geometry when actors cross from a raised podium to the trail', async t => {
    for (const action of ['strike', 'block']) await t.test(action, async () => {
        const f = await fixture('dragon', {
            groundAt: (_, z) => z < -2 ? 0.34 : 0,
            onImpact({ THREE, hero, monster, effect }) {
                const attackingPoint = action === 'strike'
                    ? hero.userData.swordTip.getWorldPosition(new THREE.Vector3())
                    : effect.metadata?.attackerPoint;
                assert.ok(attackingPoint?.isVector3, 'actual attacking point is available');
                assert.ok(attackingPoint.distanceTo(effect.point) < 0.15, 'terrain height is included in solved contact');
                const target = action === 'strike' ? monster : hero.userData.shield;
                assert.ok(surfaceDistance(THREE, target, effect.point) < 0.025, 'impact remains on the visible target');
            }
        });
        const before = snapshot(f.hero, f.monster, f.camera);
        try {
            await f.combat[action]();
            assert.equal(f.effects.length, 1);
            assertRestored(before, f.hero, f.monster, f.camera);
        } finally { release(f.hero, f.monster); }
    });
});

test('desktop geometry preserves low shield and raised-platform contact', async t => {
    for (const type of ['spider', 'dragon']) await t.test(type, async () => {
        const f = await fixture(type, {
            lowDetail: false,
            groundAt: (_, z) => type === 'dragon' && z < -2 ? 0.34 : 0,
            onImpact({ THREE, hero, monster, effect }) {
                assert.ok(surfaceDistance(THREE, hero.userData.shield, effect.point) < 0.025, 'contact lies on the detailed shield');
                assert.ok(surfaceDistance(THREE, monster, effect.point) < 0.15, 'detailed attacker reaches the shield');
            }
        });
        const before = snapshot(f.hero, f.monster, f.camera);
        try {
            await f.combat.block();
            assert.equal(f.effects.length, 1);
            assertRestored(before, f.hero, f.monster, f.camera);
        } finally { release(f.hero, f.monster); }
    });
});

test('reduced motion and skipped combat avoid impact effects and retain the starting pose', async t => {
    for (const action of ['strike', 'block']) for (const mode of ['reduced', 'skipInitially', 'skipDuring']) await t.test(`${action}, ${mode}`, async () => {
        const f = await fixture('dragon', {
            reducedMotion: mode === 'reduced', skipInitially: mode === 'skipInitially',
            skipAt: mode === 'skipDuring' ? (call, frame) => call === 1 && frame === 3 : undefined
        });
        const before = snapshot(f.hero, f.monster, f.camera);
        try {
            await f.combat[action]();
            assert.equal(f.effects.length, 0, 'skipped combat creates no impact');
            assertRestored(before, f.hero, f.monster, f.camera);
        } finally { release(f.hero, f.monster); }
    });
});

test('repeated strike and block preserve authored scale and raised-floor poses without accumulating recoil', async () => {
    const f = await fixture('golem', { floor: 0.34 });
    f.hero.scale.set(1.02, 1.03, 1.01);
    f.monster.scale.setScalar(1.04);
    f.hero.rotation.y = -0.06;
    f.monster.rotation.y = 0.11;
    f.hero.userData.armL.rotation.x = 0.035;
    f.camera.rotateZ(0.025);
    const before = snapshot(f.hero, f.monster, f.camera);
    try {
        for (let attempt = 0; attempt < 3; attempt++) {
            await f.combat.strike();
            await f.combat.block();
            assertRestored(before, f.hero, f.monster, f.camera);
        }
        assert.equal(f.effects.length, 6, 'each completed attack produces exactly one impact');
    } finally { release(f.hero, f.monster); }
});
