// Pivoți de umăr și șold pentru modelele GLB construite din piese separate.
// Poziția de repaus, culorile și transformarea modelului rămân cele din asset.
window.CastleQuizRig = (() => {
    const HUMANOIDS = new Set(["goblin", "skeleton", "knight", "golem", "wizard", "demon"]);
    const LIMBS = [
        ["armL", "ArmL", "HandL"],
        ["armR", "ArmR", "HandR"],
        ["legL", "LegL", "BootL"],
        ["legR", "LegR", "BootR"]
    ];

    function jointFor(root, THREE, name, accessoryName) {
        const mesh = root.getObjectByName(name);
        if (!mesh?.isMesh || mesh.isSkinnedMesh || !mesh.parent || !mesh.geometry) return null;
        mesh.geometry.computeBoundingBox();
        const box = mesh.geometry.boundingBox;
        if (!box || box.isEmpty()) return null;

        // Capătul superior al piesei este articulația, nu centrul geometriei.
        const shoulder = new THREE.Vector3(
            (box.min.x + box.max.x) / 2,
            box.max.y,
            (box.min.z + box.max.z) / 2
        );
        mesh.localToWorld(shoulder);
        const parent = mesh.parent;
        parent.worldToLocal(shoulder);

        const accessory = root.getObjectByName(accessoryName);
        const pivot = new THREE.Group();
        pivot.name = `${name}Pivot`;
        pivot.position.copy(shoulder);
        parent.add(pivot);
        pivot.updateWorldMatrix(true, false);
        pivot.attach(mesh);
        if (accessory && accessory !== mesh && !accessory.isSkinnedMesh) pivot.attach(accessory);
        return pivot;
    }

    function prepare(root, THREE, kind, type) {
        if (!root || !THREE || (kind !== "hero" && !HUMANOIDS.has(type))) return root;
        if (root.userData.castleRigPrepared) return root;
        root.updateWorldMatrix(true, true);
        let prepared = false;
        for (const [field, name, accessoryName] of LIMBS) {
            const pivot = jointFor(root, THREE, name, accessoryName);
            if (pivot) {
                root.userData[field] = pivot;
                prepared = true;
            }
        }
        if (prepared) root.userData.castleRigPrepared = true;
        return root;
    }

    return { prepare };
})();
