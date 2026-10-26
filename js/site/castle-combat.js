// Short, grounded combat gestures. Contact is solved against rendered geometry,
// then every temporary pose is restored so quiz navigation can reuse the actors.
window.CastleQuizCombat = (() => {
    function create({ THREE, hero, monster, camera, tween, reducedMotion, groundAt = () => 0, audio, impact, isSkipping = () => false }) {
        const h = hero?.userData, m = monster?.userData;
        if (!h?.sword || !h?.shield || !h.armR || !h.armL || !monster) return null;
        const clamp = THREE.MathUtils.clamp;
        const live = () => !reducedMotion?.() && !isSkipping();
        const pointOf = object => object.getWorldPosition(new THREE.Vector3());
        const tip = () => h.swordTip ? pointOf(h.swordTip) : h.sword.localToWorld(new THREE.Vector3(0, -0.78, 0));

        function snapshot() {
            const poses = new Map();
            for (const actor of [hero, monster]) actor.traverse(object => {
                if (object === actor || object.isGroup) poses.set(object, { p: object.position.clone(), q: object.quaternion.clone(), s: object.scale.clone() });
            });
            if (camera) poses.set(camera, { p: camera.position.clone(), q: camera.quaternion.clone(), s: camera.scale.clone() });
            const heights = { baseY: h.baseY, groundY: h.groundY };
            return { poses, restore() {
                poses.forEach((pose, object) => { object.position.copy(pose.p); object.quaternion.copy(pose.q); object.scale.copy(pose.s); });
                Object.assign(h, heights); hero.updateWorldMatrix(true, true); monster.updateWorldMatrix(true, true);
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

        function aimSword(target) {
            hero.updateWorldMatrix(true, true);
            const local = h.sword.parent.worldToLocal(target.clone()).sub(h.sword.position).normalize();
            const blade = h.swordTip?.position.clone().normalize() || new THREE.Vector3(0, -1, 0);
            h.sword.quaternion.setFromUnitVectors(blade, local);
            hero.updateWorldMatrix(true, true);
        }

        function cameraFocus(target, p, original, side = 1) {
            if (!camera) return;
            camera.position.lerpVectors(original, new THREE.Vector3(target.x + side * 1.8, target.y + 0.85, target.z + 4.2), p);
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
                // Solve the grip height and blade reach before moving into range.
                h.armR.rotation.z = -0.12;
                let end = from.clone();
                const length = h.swordTip?.position.length() || 0.78;
                for (let iteration = 0; iteration < 3; iteration++) {
                    place(hero, end, offset);
                    let lo = 0, hi = 1.65;
                    for (let i = 0; i < 18; i++) {
                        h.armR.rotation.x = (lo + hi) / 2; hero.updateWorldMatrix(true, true);
                        if (pointOf(h.sword).y < target.y + 0.18) lo = h.armR.rotation.x; else hi = h.armR.rotation.x;
                    }
                    const grip = pointOf(h.sword), dy = target.y - grip.y;
                    const reach = Math.sqrt(Math.max(0.035, length * length - dy * dy));
                    end.x += target.x - grip.x; end.z += target.z + reach - grip.z;
                }
                place(hero, end, offset); aimSword(target);
                const armContact = h.armR.quaternion.clone(), swordContact = h.sword.quaternion.clone();
                const armWindup = new THREE.Quaternion().setFromEuler(new THREE.Euler(h.armR.rotation.x + 0.5, 0.08, -0.48));
                const swordWindup = new THREE.Quaternion().setFromEuler(new THREE.Euler(-2.2, 0.15, 0.25));
                const distance = from.distanceTo(end), camFrom = camera?.position.clone();
                saved.restore();
                let step = 0;
                await tween(Math.max(420, distance * 185), p => {
                    place(hero, from.clone().lerp(end, p), offset, Math.abs(Math.sin(p * distance * 5)) * Math.sin(p * Math.PI) * 0.018);
                    stride(hero, p, distance);
                    cameraFocus(target, p, camFrom);
                    if (live() && Math.floor(p * 3) > step) { step = Math.floor(p * 3); audio?.footstep?.(); }
                });
                const armRest = h.armR.quaternion.clone(), swordRest = h.sword.quaternion.clone();
                await tween(240, p => { h.armR.quaternion.slerpQuaternions(armRest, armWindup, p); h.sword.quaternion.slerpQuaternions(swordRest, swordWindup, p); hero.rotation.y = p * 0.12; });
                if (live()) audio?.swing?.();
                await tween(155, p => { h.armR.quaternion.slerpQuaternions(armWindup, armContact, p); h.sword.quaternion.slerpQuaternions(swordWindup, swordContact, p); hero.rotation.y = (1 - p) * 0.12; }, p => p);
                hero.updateWorldMatrix(true, true);
                if (live()) { audio?.impact?.("blade"); impact?.("blade", target.clone(), { attackerPoint: tip() }); }
                const armContactX = h.armR.rotation.x, recoilCam = camera?.position.clone(), enemyYaw = monster.rotation.y;
                await tween(175, p => {
                    const recoil = Math.sin(p * Math.PI);
                    monster.position.z = enemyFrom.z - recoil * 0.13; monster.rotation.y = enemyYaw - recoil * 0.12;
                    h.armR.rotation.x = armContactX + recoil * 0.04;
                    if (camera) camera.position.x = recoilCam.x + Math.sin(p * Math.PI * 3) * (1 - p) * 0.012;
                }, p => p);
                if (live()) audio?.armour?.();
                await tween(Math.max(380, distance * 150), p => {
                    place(hero, end.clone().lerp(from, p), offset);
                    h.armR.quaternion.slerpQuaternions(armContact, saved.poses.get(h.armR).q, p);
                    h.sword.quaternion.slerpQuaternions(swordContact, saved.poses.get(h.sword).q, p);
                    stride(hero, p, distance, false);
                    cameraFocus(target, 1 - p, camFrom);
                });
            } finally { saved.restore(); }
        }

        async function block() {
            if (!live()) return;
            const saved = snapshot(), from = monster.position.clone(), heroFrom = hero.position.clone();
            const offset = from.y - groundAt(from.x, from.z), type = m.type;
            try {
                const guard = type === "spider" ? -0.15 : type === "dragon" ? 1.15 : type === "goblin" ? 0.35 : 0.7;
                const attackArm = m.armR;
                const pose = p => {
                    h.armL.rotation.x = guard * p; h.armL.rotation.z = -0.12 * p;
                    h.armR.rotation.x = 0.15 * p;
                    if (attackArm) attackArm.rotation.x = -1.1 * p;
                    if (type === "dragon" && m.head) m.head.rotation.x = p * 0.9;
                    if (m.jaw && type === "dragon") m.jaw.rotation.x = p * 0.18;
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
                saved.restore();
                await tween(230, p => { pose(p); cameraFocus(contact, p * 0.25, camFrom, -1); });
                if (live()) audio?.swing?.();
                await tween(Math.max(360, distance * 165), p => {
                    place(monster, from.clone().lerp(end, p), offset);
                    stride(monster, p, distance, false); pose(1);
                    cameraFocus(contact, 0.25 + p * 0.75, camFrom, -1);
                });
                monster.updateWorldMatrix(true, true); hero.updateWorldMatrix(true, true);
                const actual = surface(monster, contact.x, contact.y);
                if (live() && actual) { audio?.impact?.("shield"); impact?.("shield", contact.clone(), { attackerPoint: actual, shieldPoint: contact.clone() }); }
                const impactCam = camera?.position.clone();
                await tween(165, p => {
                    const recoil = Math.sin(p * Math.PI);
                    hero.position.z = heroFrom.z + recoil * 0.055; hero.rotation.z = -recoil * 0.035;
                    h.armL.rotation.x = guard - recoil * 0.09;
                    if (camera) camera.position.x = impactCam.x + Math.sin(p * Math.PI * 3) * (1 - p) * 0.023;
                }, p => p);
                await tween(Math.max(390, distance * 135), p => {
                    place(monster, end.clone().lerp(from, p), offset);
                    stride(monster, p, distance, false); pose(1 - p);
                    hero.position.copy(heroFrom); hero.rotation.z = 0;
                    cameraFocus(contact, 1 - p, camFrom, -1);
                });
                if (live()) audio?.armour?.();
            } finally { saved.restore(); }
        }
        return { strike, block };
    }
    return { create };
})();
