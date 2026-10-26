// Short, grounded combat gestures. Contact is solved against rendered geometry,
// then every temporary pose is restored so quiz navigation can reuse the actors.
window.CastleQuizCombat = (() => {
    function create({ THREE, hero, monster, camera, tween, reducedMotion, groundAt = () => 0, audio, impact, isSkipping = () => false, setPhase }) {
        const h = hero?.userData, m = monster?.userData;
        if (!h?.sword || !h?.shield || !h.armR || !h.armL || !monster) return null;
        const clamp = THREE.MathUtils.clamp;
        const live = () => !reducedMotion?.() && !isSkipping();
        const pointOf = object => object.getWorldPosition(new THREE.Vector3());
        const tip = () => h.swordTip ? pointOf(h.swordTip) : h.sword.localToWorld(new THREE.Vector3(0, -0.78, 0));
        const mass = { bat: 0.4, goblin: 0.7, skeleton: 0.75, spider: 0.65, ghost: 0.5, knight: 1.3, wizard: 0.85, demon: 1.5, golem: 2.5, dragon: 3 }[m.type] || 1;
        const phase = name => { h.combatPhase = name; setPhase?.(name); };

        function snapshot() {
            const poses = new Map();
            for (const actor of [hero, monster]) actor.traverse(object => {
                if (object === actor || object.isGroup) poses.set(object, { p: object.position.clone(), q: object.quaternion.clone(), s: object.scale.clone() });
            });
            if (camera) poses.set(camera, { p: camera.position.clone(), q: camera.quaternion.clone(), s: camera.scale.clone() });
            const heights = { baseY: h.baseY, groundY: h.groundY }, oldPhase = h.combatPhase;
            return { poses, restore() {
                poses.forEach((pose, object) => { object.position.copy(pose.p); object.quaternion.copy(pose.q); object.scale.copy(pose.s); });
                Object.assign(h, heights);
                if (oldPhase === undefined) delete h.combatPhase; else h.combatPhase = oldPhase;
                hero.updateWorldMatrix(true, true); monster.updateWorldMatrix(true, true);
            } };
        }

        function place(actor, position, offset, bob = 0) {
            actor.position.copy(position);
            const floor = groundAt(position.x, position.z);
            actor.position.y = floor + offset + bob;
            if (actor === hero) { h.groundY = floor; h.baseY = floor + offset; }
        }

        function stride(actor, p, distance, arms = true) {
            const data = actor.userData, wave = Math.sin(p * distance * 5) * Math.sin(p * Math.PI);
            if (data.legL) data.legL.rotation.x = wave * 0.48;
            if (data.legR) data.legR.rotation.x = -wave * 0.48;
            if (arms && data.armL) data.armL.rotation.x = -wave * 0.25 * (data.armSwingL ?? 1);
            if (arms && data.armR) data.armR.rotation.x = wave * 0.25 * (data.armSwingR ?? 1);
            data.legs?.forEach((leg, i) => { leg.rotation.y = Math.sin(p * distance * 5 + i) * Math.sin(p * Math.PI) * 0.16; });
            if (data.wingL) data.wingL.rotation.z = (data.wingRestL ?? 0) + wave * 0.35;
            if (data.wingR) data.wingR.rotation.z = (data.wingRestR ?? 0) - wave * 0.35;
        }

        function surface(actor, x, y, direction = -1) {
            actor.updateWorldMatrix(true, true);
            const box = new THREE.Box3().setFromObject(actor);
            const origin = new THREE.Vector3(x, y, direction < 0 ? box.max.z + 1 : box.min.z - 1);
            const ray = new THREE.Raycaster(origin, new THREE.Vector3(0, 0, direction), 0, box.max.z - box.min.z + 2);
            return ray.intersectObject(actor, true)[0]?.point.clone() || null;
        }

        function swordPose(shoulder, elbow = 0.58, wrist = 0.12, spread = -0.08) {
            h.armR.rotation.set(shoulder, 0, spread);
            if (h.forearmR) h.forearmR.rotation.x = elbow;
            if (h.handR) h.handR.rotation.set(wrist, 0, -0.08);
        }

        function footState() {
            hero.updateWorldMatrix(true, true);
            return ["L", "R"].map(side => {
                const foot = h[`foot${side}`], shin = h[`shin${side}`], leg = h[`leg${side}`];
                if (!foot || !shin || !leg) return null;
                const position = pointOf(foot);
                return { foot, shin, leg, position, clearance: position.y - groundAt(position.x, position.z) };
            }).filter(Boolean);
        }

        function plant(feet, goals = feet.map(foot => foot.position)) {
            hero.updateWorldMatrix(true, true);
            feet.forEach((f, index) => {
                const goal = hero.worldToLocal(goals[index].clone()).sub(f.leg.position), a = f.shin.position, b = f.foot.position;
                const upper = Math.hypot(a.y, a.z), lower = Math.hypot(b.y, b.z);
                const distance = clamp(Math.hypot(goal.y, goal.z), Math.abs(upper - lower) + 0.001, upper + lower - 0.0001);
                const angle = Math.atan2(-goal.z, -goal.y);
                const thigh = angle + Math.acos(clamp((upper * upper + distance * distance - lower * lower) / (2 * upper * distance), -1, 1));
                const calf = angle - Math.acos(clamp((lower * lower + distance * distance - upper * upper) / (2 * lower * distance), -1, 1));
                f.leg.rotation.x = thigh - Math.atan2(-a.z, -a.y);
                f.shin.rotation.x = calf - Math.atan2(-b.z, -b.y) - f.leg.rotation.x;
                f.foot.rotation.x = -f.leg.rotation.x - f.shin.rotation.x;
            });
        }

        async function walk(from, to, offset, onProgress, backward = false) {
            const distance = Math.hypot(to.x - from.x, to.z - from.z), feet = footState();
            const cycles = Math.max(1, Math.ceil(distance / 0.56)), path = to.clone().sub(from); path.y = 0;
            let step = 0;
            await tween(Math.max(320, distance / (backward ? 1.65 : 1.85) * 1000), p => {
                place(hero, from.clone().lerp(to, p), offset, -Math.sin(p * Math.PI) * 0.055);
                if (feet.length === 2) {
                    const goals = feet.map((f, i) => {
                        const u = p * cycles + i * 0.5, fraction = u - Math.floor(u), swing = clamp((fraction - 0.52) / 0.48, 0, 1);
                        const travelled = (Math.floor(u) + swing * swing * (3 - 2 * swing)) / cycles;
                        const goal = f.position.clone().addScaledVector(path, travelled);
                        goal.y = groundAt(goal.x, goal.z) + f.clearance + Math.sin(swing * Math.PI) * 0.065;
                        return goal;
                    });
                    plant(feet, goals);
                } else stride(hero, p, distance);
                if (live() && Math.floor(p * cycles * 2) > step) { step = Math.floor(p * cycles * 2); audio?.footstep?.(); }
                onProgress?.(p);
            }, p => p);
        }

        function cameraFocus(target, p, original, side = 1) {
            if (!camera) return;
            const sideX = clamp(target.x + side * 2, -2.35, 2.35);
            camera.position.lerpVectors(original, new THREE.Vector3(sideX, target.y + 0.75, target.z + 3.8), p);
            camera.lookAt(target);
        }

        async function strike() {
            if (!live()) return;
            const saved = snapshot(), from = hero.position.clone(), enemyFrom = monster.position.clone();
            const offset = h.authoredBaseY ?? from.y - groundAt(from.x, from.z);
            try {
                const box = new THREE.Box3().setFromObject(monster), size = box.getSize(new THREE.Vector3());
                const targetY = box.min.y + size.y * 0.58;
                const target = surface(monster, monster.position.x, targetY);
                if (!target) return;
                // Shoulder and elbow aim the rigid hand/weapon assembly. The
                // blade's local transform never changes during an attack.
                let end = from.clone(), shoulder = 0;
                const elbow = m.type === "spider" ? 0.32 : 0.58, wrist = 0.12;
                for (let iteration = 0; iteration < 5; iteration++) {
                    place(hero, end, offset, -0.035);
                    let lo = -0.35, hi = 1.8;
                    for (let i = 0; i < 24; i++) {
                        shoulder = (lo + hi) / 2; swordPose(shoulder, elbow, wrist);
                        hero.updateWorldMatrix(true, true);
                        if (tip().y < target.y) lo = shoulder; else hi = shoulder;
                    }
                    const difference = target.clone().sub(tip());
                    end.x += difference.x; end.z += difference.z;
                }
                place(hero, end, offset, -0.035); swordPose(shoulder, elbow, wrist);
                const joints = [h.armR, h.forearmR, h.handR].filter(Boolean);
                const contactPose = new Map(joints.map(joint => [joint, joint.quaternion.clone()]));
                const camFrom = camera?.position.clone(), camQuaternion = camera?.quaternion.clone();
                const originalYaw = hero.rotation.y;
                saved.restore(); phase("approach");
                await walk(from, end, offset, p => cameraFocus(target, p * 0.85, camFrom));
                const feet = footState(), restPose = new Map(joints.map(joint => [joint, joint.quaternion.clone()]));
                swordPose(shoulder + 0.48, 1.0, -0.12, -0.42);
                const windup = new Map(joints.map(joint => [joint, joint.quaternion.clone()]));
                phase("windup");
                await tween(330, p => {
                    for (const [joint, q] of windup) joint.quaternion.slerpQuaternions(restPose.get(joint), q, p);
                    hero.rotation.y = originalYaw - 0.18 * p;
                    place(hero, end, offset, -0.035 * p); plant(feet);
                    cameraFocus(target, 0.85 + p * 0.15, camFrom);
                });
                phase("release"); if (live()) audio?.swing?.();
                await tween(190, p => {
                    const cut = p * p;
                    for (const [joint, q] of contactPose) joint.quaternion.slerpQuaternions(windup.get(joint), q, cut);
                    hero.rotation.y = originalYaw - 0.18 * (1 - cut);
                    place(hero, end, offset, -0.035); plant(feet);
                }, p => p);
                hero.updateWorldMatrix(true, true); phase("contact");
                if (live()) { audio?.impact?.("blade"); impact?.("blade", target.clone(), { attackerPoint: tip(), mass }); }
                await tween(75, () => { plant(feet); }, p => p);
                const recoilCam = camera?.position.clone(), enemyYaw = monster.rotation.y;
                phase("followThrough");
                await tween(260, p => {
                    const recoil = Math.sin(p * Math.PI);
                    monster.position.z = enemyFrom.z - recoil * 0.20 / Math.sqrt(mass);
                    monster.rotation.y = enemyYaw - recoil * 0.13 / Math.sqrt(mass);
                    monster.rotation.x = recoil * 0.045 / Math.sqrt(mass);
                    h.armR.rotation.x = shoulder - recoil * 0.16;
                    if (h.forearmR) h.forearmR.rotation.x = elbow - recoil * 0.11;
                    if (h.handR) h.handR.rotation.x = wrist + recoil * 0.08;
                    hero.rotation.y = originalYaw + recoil * 0.07;
                    place(hero, end, offset, -0.035); plant(feet);
                    if (camera) camera.position.x = recoilCam.x + Math.sin(p * Math.PI * 2) * (1 - p) * 0.006;
                }, p => p);
                phase("recover"); if (live()) audio?.armour?.();
                const recovery = new Map(joints.map(joint => [joint, joint.quaternion.clone()]));
                await walk(end, from, offset, p => {
                    const eased = p * p * (3 - 2 * p);
                    for (const [joint, q] of recovery) joint.quaternion.slerpQuaternions(q, saved.poses.get(joint).q, eased);
                    hero.rotation.y = originalYaw;
                    cameraFocus(target, 1 - p, camFrom);
                    if (camera) { const aimed = camera.quaternion.clone(); camera.quaternion.slerpQuaternions(camQuaternion, aimed, 1 - p); }
                }, true);
            } finally { saved.restore(); }
        }

        async function block() {
            if (!live()) return;
            const saved = snapshot(), from = monster.position.clone(), heroFrom = hero.position.clone();
            const offset = from.y - groundAt(from.x, from.z), type = m.type;
            try {
                const guard = type === "spider" ? -0.28 : type === "dragon" ? 1.15 : type === "goblin" ? 0.35 : 0.7;
                const elbowGuard = type === "spider" ? 0.15 : 0.38;
                const attackArm = m.armR;
                const pose = (p, attack = p) => {
                    h.armL.rotation.x = guard * p; h.armL.rotation.z = -0.12 * p;
                    if (h.forearmL) h.forearmL.rotation.x = elbowGuard * p;
                    if (h.handL) h.handL.rotation.x = -0.06 * p;
                    h.armR.rotation.x = 0.15 * p;
                    if (attackArm) attackArm.rotation.x = -1.1 * attack;
                    if (type === "dragon" && m.head) m.head.rotation.x = attack * 0.9;
                    if (m.jaw && type === "dragon") m.jaw.rotation.x = attack * 0.18;
                };
                pose(1); hero.updateWorldMatrix(true, true); monster.updateWorldMatrix(true, true);
                const hand = attackArm?.getObjectByName("Hand");
                const attackGuess = () => hand ? new THREE.Box3().setFromObject(hand).getCenter(new THREE.Vector3())
                    : type === "dragon" && m.head ? m.head.localToWorld(new THREE.Vector3(0, -0.1, 0.65))
                    : attackArm ? attackArm.localToWorld(new THREE.Vector3(0, -0.73, 0.06))
                    : monster.localToWorld(new THREE.Vector3(0, type === "spider" ? 0.6 : type === "bat" ? 0.2 : 1.3, type === "spider" ? 0.48 : 0.2));
                const shieldBox = new THREE.Box3().setFromObject(h.shield, true), center = shieldBox.getCenter(new THREE.Vector3());
                let end = from.clone(), contact = null;
                // Re-solve after moving across a floor/bridge/podium boundary.
                for (let iteration = 0; iteration < 4; iteration++) {
                    place(monster, end, offset); monster.updateWorldMatrix(true, true);
                    const guess = attackGuess(), y = clamp(guess.y, shieldBox.min.y + 0.06, shieldBox.max.y - 0.06);
                    const attacker = surface(monster, guess.x, y);
                    contact = null;
                    // The tapered shield's lowest section is narrower and not
                    // necessarily at its world-space bounding-box center.
                    for (let i = 0; i <= 32 && !contact; i++) {
                        const shift = Math.ceil(i / 2) * (shieldBox.max.x - shieldBox.min.x) / 32 * (i % 2 ? 1 : -1);
                        contact = surface(h.shield, center.x + shift, y, 1);
                    }
                    if (!attacker || !contact) return;
                    end.add(new THREE.Vector3(contact.x - attacker.x, 0, contact.z - attacker.z));
                }
                const distance = from.distanceTo(end);
                const camFrom = camera?.position.clone();
                const camQuaternion = camera?.quaternion.clone();
                saved.restore();
                const feet = footState(); phase("guard");
                await tween(280, p => { pose(p, p * 0.25); plant(feet); cameraFocus(contact, p * 0.25, camFrom, -1); });
                phase("approach"); let released = false;
                await tween(Math.max(420, distance / 1.85 * 1000), p => {
                    place(monster, from.clone().lerp(end, p), offset);
                    const release = clamp((p - 0.80) / 0.20, 0, 1);
                    stride(monster, p, distance, false); pose(1, 0.25 + release * release * 0.75);
                    if (live() && release > 0 && !released) { released = true; audio?.swing?.(); }
                    plant(feet);
                    cameraFocus(contact, 0.25 + p * 0.75, camFrom, -1);
                }, p => p);
                monster.updateWorldMatrix(true, true); hero.updateWorldMatrix(true, true);
                const actual = surface(monster, contact.x, contact.y);
                phase("contact");
                if (live() && actual) { audio?.impact?.("shield"); impact?.("shield", contact.clone(), { attackerPoint: actual, shieldPoint: contact.clone(), mass }); }
                await tween(70, () => { plant(feet); }, p => p);
                const impactCam = camera?.position.clone();
                phase("followThrough");
                await tween(250, p => {
                    const recoil = Math.sin(p * Math.PI);
                    hero.position.z = heroFrom.z + recoil * (0.07 + Math.min(0.055, mass * 0.025)); hero.rotation.z = -recoil * 0.03;
                    h.armL.rotation.x = guard - recoil * 0.13;
                    if (h.forearmL) h.forearmL.rotation.x = elbowGuard - recoil * 0.12;
                    plant(feet);
                    if (camera) camera.position.x = impactCam.x + Math.sin(p * Math.PI * 2) * (1 - p) * 0.009;
                }, p => p);
                phase("recover");
                await tween(Math.max(420, distance / 1.65 * 1000), p => {
                    place(monster, end.clone().lerp(from, p), offset);
                    stride(monster, p, distance, false); pose(1 - p);
                    hero.position.copy(heroFrom); hero.rotation.z = 0; plant(feet);
                    cameraFocus(contact, 1 - p, camFrom, -1);
                    if (camera) { const aimed = camera.quaternion.clone(); camera.quaternion.slerpQuaternions(camQuaternion, aimed, 1 - p); }
                }, p => p);
                if (live()) audio?.armour?.();
            } finally { saved.restore(); }
        }
        return { strike, block };
    }
    return { create };
})();
