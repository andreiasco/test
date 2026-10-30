// Persistent, grounded defeat poses. Equipment stays attached to the actor's rig.
window.CastleQuizDefeat = (() => {
    const pending = new WeakMap();
    function create({ THREE, actor, tween, groundAt = () => 0, audio, reducedMotion = () => false, isSkipping = () => false, onGround }) {
        if (!THREE || !actor || typeof tween !== "function") return null;
        const data = actor.userData, type = data.type || "hero";
        const hero = type === "hero" || Boolean(data.detailedHero);
        const front = hero ? -1 : 1;
        const clamp = THREE.MathUtils.clamp;
        const ease = value => value * value * (3 - 2 * value);
        const box = new THREE.Box3(), size = new THREE.Vector3(), center = new THREE.Vector3();
        const geometries = [];
        actor.traverse(object => { if (object.isMesh) geometries.push(object); });
        if (!geometries.length) return null;

        function floorBounds() {
            actor.updateWorldMatrix(true, true);
            box.setFromObject(actor, true);
            box.getCenter(center);
            const floor = Math.max(groundAt(actor.position.x, actor.position.z), groundAt(center.x, center.z),
                groundAt(box.min.x, box.min.z), groundAt(box.max.x, box.max.z));
            return Number.isFinite(floor) ? floor : 0;
        }
        function allPoses() {
            const poses = new Map();
            actor.traverse(object => {
                if (object === actor || object.isGroup) poses.set(object, { position: object.position.clone(), rotation: object.rotation.clone(), quaternion: object.quaternion.clone(), scale: object.scale.clone() });
            });
            return poses;
        }
        function materials() {
            const result = new Map();
            for (const object of geometries) for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
                if (material && !result.has(material)) result.set(material, { opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite });
            }
            return result;
        }

        async function perform() {
            if (data.defeated) return;
            const poses = allPoses(), start = poses.get(actor), paint = materials(), wasVisible = actor.visible;
            const initialFloor = floorBounds(), initialGap = Math.max(0, box.min.y - initialFloor - 0.012);
            const previous = { baseY: data.baseY, groundY: data.groundY };
            data.defeating = true;
            const direction = new THREE.Vector3(0, 0, -front).applyAxisAngle(new THREE.Vector3(0, 1, 0), start.rotation.y);
            const rootTilt = type === "dragon" ? [-0.02, -1.47] : type === "spider" ? [0.01, -0.03] : type === "bat" ? [-1.38, -0.10] : type === "ghost" ? [-1.15, 0.16] : [-front * 1.43, hero ? -0.18 : 0.2];
            const joint = (object, x = 0, y = 0, z = 0, blend = 1) => {
                const rest = poses.get(object); if (!rest) return;
                object.rotation.set(rest.rotation.x + x * blend, rest.rotation.y + y * blend, rest.rotation.z + z * blend);
            };
            const relax = (object, x, y, z, blend) => {
                const rest = poses.get(object); if (!rest) return;
                joint(object, x - rest.rotation.x, y - rest.rotation.y, z - rest.rotation.z, blend);
            };
            function pose(progress) {
                const bend = Math.sin(Math.min(1, progress / 0.6) * Math.PI) * 0.7;
                const fall = ease(clamp((progress - 0.22) / 0.65, 0, 1));
                actor.position.copy(start.position).addScaledVector(direction, (type === "dragon" ? 0.17 : 0.30) * fall);
                actor.rotation.set(start.rotation.x + rootTilt[0] * fall - front * Math.sin(progress * Math.PI) * 0.12,
                    start.rotation.y + Math.sin(progress * Math.PI) * 0.055,
                    start.rotation.z + rootTilt[1] * fall);
                if (["bat", "dragon"].includes(type)) {
                    joint(data.wingL, 0, type === "dragon" ? -1.45 * fall : 0, type === "bat" ? -1.12 * fall : 0);
                    joint(data.wingR, 0, type === "dragon" ? 1.45 * fall : 0, type === "bat" ? 1.12 * fall : 0);
                    joint(data.head, type === "dragon" ? 0.65 : 0.14, 0, -0.12, fall);
                    joint(data.jaw, 0.16, 0, 0, fall);
                    data.legs?.forEach((leg, i) => joint(leg, (i < 2 ? 0.55 : -0.38) * fall, 0, (i % 2 ? -1 : 1) * 0.53 * fall));
                } else if (type === "spider") {
                    data.legs?.forEach((leg, i) => joint(leg, 0, (i % 4 - 1.5) * 0.28 * fall, (i < 4 ? -1 : 1) * 0.34 * fall));
                } else {
                    const knee = -front * (bend + 0.12 * fall);
                    joint(data.legL, knee, 0, 0.09 * fall);
                    joint(data.legR, knee * 0.65, 0, -0.16 * fall);
                    joint(data.shinL, -knee * 1.7); joint(data.shinR, -knee * 1.3);
                    joint(data.footL, -knee * 0.2); joint(data.footR, knee * 0.1);
                    // Release the guard as the body settles; a dead actor must
                    // not keep its shield raised or its sword in an attack pose.
                    relax(data.armL, front * 0.18, -0.04, -0.42, fall);
                    relax(data.armR, front * 0.16, 0.04, 0.40, fall);
                    relax(data.forearmL, 0.04, 0, 0, fall); relax(data.forearmR, 0.06, 0, 0, fall);
                    relax(data.handL, 0, 0, 0, fall); relax(data.handR, 0, 0, 0, fall);
                    const head = data.head || actor.getObjectByName("Head"); joint(head, -front * 0.17, 0.08, 0.14, fall);
                }
                if (data.tail) joint(data.tail, 0, data.tailAxis === "y" ? 0.23 * fall : 0, data.tailAxis === "y" ? 0 : 0.17 * fall);
                const floor = floorBounds();
                const airborne = initialGap * (1 - ease(clamp(progress / 0.87, 0, 1)));
                actor.position.y += floor + 0.012 + airborne - box.min.y;
                data.groundY = floor;
                if (type === "ghost") {
                    const opacity = 1 - ease(clamp((progress - 0.22) / 0.78, 0, 1));
                    for (const [material, rest] of paint) { material.transparent = true; material.depthWrite = false; material.opacity = rest.opacity * opacity; }
                }
                actor.updateWorldMatrix(true, true);
            }
            try {
                if (reducedMotion() || isSkipping()) pose(1);
                else {
                    await tween(180, p => pose(p * 0.2), p => p);
                    await tween(300, p => pose(0.2 + ease(p) * 0.32), p => p);
                    await tween(type === "dragon" || type === "golem" ? 850 : type === "spider" ? 400 : 590, p => pose(0.52 + p * 0.38), p => p * p);
                    if (!isSkipping()) { audio?.impact?.("body"); if (hero || type === "knight") audio?.armour?.(); onGround?.(actor); }
                    await tween(210, p => pose(0.9 + ease(p) * 0.1), p => p);
                    pose(1);
                }
                if (type === "ghost") actor.visible = false;
                floorBounds(); box.getSize(size);
                data.defeated = true; data.defeating = false;
                data.defeatHeight = size.y; data.defeatFloor = data.groundY;
            } catch (error) {
                for (const [object, rest] of poses) { object.position.copy(rest.position); object.quaternion.copy(rest.quaternion); object.scale.copy(rest.scale); }
                for (const [material, rest] of paint) Object.assign(material, rest);
                Object.assign(data, previous); actor.visible = wasVisible; delete data.defeating;
                throw error;
            }
        }
        return { fall() {
            if (data.defeated) return Promise.resolve();
            if (pending.has(actor)) return pending.get(actor);
            const task = perform().finally(() => pending.delete(actor)); pending.set(actor, task); return task;
        } };
    }
    return { create };
})();
