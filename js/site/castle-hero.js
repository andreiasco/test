// The playable knight faces -Z. His equipment follows the same joint Groups as his limbs.
window.CastleQuizHero = (() => {
    function create(THREE, mergeGeometries, options = {}) {
        if (!window.CastleQuizModelKit?.create || typeof mergeGeometries !== "function") return null;
        const k = window.CastleQuizModelKit.create(THREE, mergeGeometries, Boolean(options.lowDetail));
        const root = k.group(null, "armoredHero");
        const steel = k.material("metal", 0x8997a2, { roughness: 0.37, bumpScale: 0.003 });
        const polished = k.material("metal", 0xc5cbd0, { roughness: 0.25, bumpScale: 0.002 });
        const edge = k.material("metal", 0x53636e, { roughness: 0.48, bumpScale: 0.004 });
        const gold = k.material("metal", 0xb39a61, { roughness: 0.43, bumpScale: 0.003 });
        const blue = k.material("cloth", 0x264e68, { roughness: 0.96 });
        const leather = k.material("leather", 0x493b31, { roughness: 0.92 });
        const dark = k.material("shadow", 0x19212a, { roughness: 0.98 });
        const wood = k.material("wood", 0x68503a, { roughness: 0.9 });
        const sides = k.lowDetail ? 12 : 20;

        function oval(parent, material, position, scale) {
            return k.add(parent, new THREE.SphereGeometry(1, k.lowDetail ? 9 : 14, k.lowDetail ? 6 : 9), material, position, scale);
        }
        function rivet(parent, position, material = gold, radius = 0.012) {
            return k.add(parent, new THREE.SphereGeometry(radius, k.lowDetail ? 5 : 7, 4), material, position, [1, 1, 0.65]);
        }
        function ring(parent, material, radius, width, position, scale = [1, 1, 1]) {
            return k.add(parent, new THREE.TorusGeometry(radius, width, 5, sides), material, position, scale, [Math.PI / 2, 0, 0]);
        }
        function facet(parent, material, points, triangles) {
            const positions = [], uv = [];
            for (const index of triangles) { positions.push(...points[index]); uv.push(points[index][0], points[index][1]); }
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
            geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
            geometry.computeVertexNormals();
            return k.add(parent, geometry, material);
        }

        // A fitted cuirass, with a ridge and separate overlapping waist plates.
        const cuirass = new THREE.LatheGeometry([[0.19,1.02],[0.225,1.10],[0.25,1.22],[0.30,1.43],[0.315,1.55],[0.26,1.63],[0.12,1.71]].map(([r,y]) => new THREE.Vector2(r,y)), sides);
        const positions = cuirass.getAttribute("position");
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i), z = positions.getZ(i), y = positions.getY(i);
            const ridge = z < 0 ? Math.max(0, 1 - Math.abs(x) / 0.3) * 0.025 * Math.sin((y - 1.02) / 0.69 * Math.PI) : 0;
            positions.setZ(i, z * 0.68 - ridge);
        }
        cuirass.computeVertexNormals(); k.add(root, cuirass, steel);
        k.lathe(root, dark, [[0.18,0.87],[0.22,1.02],[0.23,1.15]], [0,0,0], [1,1,0.8]);
        for (let i = 0; i < 3; i++) {
            const y = 0.94 + i * 0.085;
            k.lathe(root, i === 2 ? polished : steel, [[0.265 - i*0.013,y],[0.25-i*0.013,y+0.075]], [0,0,0], [1,1,0.78]);
        }
        ring(root, leather, 0.233, 0.026, [0,1.105,0], [1,1,0.75]);
        k.add(root, new THREE.BoxGeometry(0.082,0.061,0.025), gold, [0,1.10,-0.19]);
        k.lathe(root, edge, [[0.115,1.67],[0.155,1.72],[0.13,1.78]], [0,0,0], [1,1,0.92]);
        ring(root, polished, 0.133, 0.015, [0,1.758,0], [1,1,0.9]);

        // Back details stay visible in the normal over-the-shoulder camera.
        k.taper(root, polished, [[0,1.15,0.153],[0,1.36,0.205],[0,1.57,0.203]], [0.012,0.016,0.012], 6);
        for (const side of [-1,1]) {
            k.bone(root, leather, [side*0.18,1.61,0.16], [side*0.095,1.12,0.16], 0.018,0.018);
            for (const [x,y,z] of [[0.17,1.58,0.18],[0.12,1.23,0.182],[0.15,1.56,-0.193]]) rivet(root,[side*x,y,z]);
        }
        // A split surcoat hem gives a cloth accent without concealing the armor.
        for (const side of [-1,1]) {
            const panel = [[side*0.025,1.02,-0.18],[side*0.18,1.02,-0.17],[side*0.205,0.72,-0.13],[side*0.035,0.69,-0.16]];
            const indices = side < 0 ? [0,2,1,0,3,2] : [0,1,2,0,2,3];
            k.membrane(root, blue, panel, indices);
        }

        const helmet = k.group(root, "Helmet", [0,1.93,-0.008]);
        oval(helmet, steel, [0,0.005,0], [0.19,0.19,0.18]);
        k.lathe(helmet, edge, [[0.17,-0.14],[0.19,-0.10],[0.196,-0.045]], [0,0,0.005], [1,1,0.92]);
        // Curved visor, its central ridge, recessed eye slit and breathing vents.
        const mask = [[-0.17,0.035,-0.151],[0,0.036,-0.214],[0.17,0.035,-0.151],[-0.145,-0.13,-0.158],[0,-0.158,-0.209],[0.145,-0.13,-0.158]];
        facet(helmet, polished, mask, [0,1,3,1,4,3,1,2,4,2,5,4]);
        k.bone(helmet, dark, [-0.147,0.052,-0.155], [0,0.056,-0.217], 0.012,0.013);
        k.bone(helmet, dark, [0,0.056,-0.217], [0.147,0.052,-0.155], 0.013,0.012);
        k.bone(helmet, polished, [-0.15,0.076,-0.16], [0,0.083,-0.219], 0.014,0.013);
        k.bone(helmet, polished, [0,0.083,-0.219], [0.15,0.076,-0.16], 0.013,0.014);
        k.bone(helmet, edge, [0,0.035,-0.22], [0,-0.145,-0.215], 0.012,0.012);
        for (const side of [-1,1]) {
            for (let slot = 0; slot < 3; slot++) {
                const x = side * (0.06 + slot * 0.028), z = -0.215 + Math.abs(x) * 0.33;
                k.bone(helmet, dark, [x,-0.045,z-0.002], [x,-0.091,z+0.001], 0.004,0.004);
            }
            rivet(helmet, [side*0.177,-0.006,-0.077], gold, 0.014);
        }
        k.taper(helmet, polished, [[0,0.12,-0.14],[0,0.19,-0.04],[0,0.19,0.04],[0,0.10,0.16]], [0.015,0.014,0.014,0.012], 6);
        // Neck protection overlaps the back of the gorget.
        const nape = new THREE.CylinderGeometry(0.17,0.23,0.115,sides,1,true,-Math.PI/2,Math.PI);
        k.add(helmet,nape,steel,[0,-0.17,0.03]);

        for (const [side,suffix] of [[-1,"L"],[1,"R"]]) {
            const arm = k.group(root, `Arm${suffix}`, [side*0.345,1.60,0]);
            root.userData[`arm${suffix}`] = arm;
            const elbow = [side*0.04,-0.32,-0.025];
            const wrist = [side*0.045,-0.60,side < 0 ? -0.19 : -0.065];
            k.bone(arm,dark,[0,-0.025,0],elbow,0.09,0.067);
            k.bone(arm,leather,elbow,wrist,0.066,0.051);
            oval(arm,steel,[side*0.025,-0.03,0],[0.16,0.13,0.165]);
            oval(arm,polished,[side*0.032,-0.13,-0.005],[0.138,0.075,0.15]);
            k.bone(arm,steel,[side*0.028,-0.14,-0.002],[side*0.04,-0.28,-0.018],0.087,0.075);
            oval(arm,polished,elbow,[0.09,0.076,0.09]);
            k.bone(arm,steel,[elbow[0],elbow[1]-0.045,elbow[2]],wrist,0.082,0.059);
            const hand = [wrist[0],-0.66,wrist[2]-0.012];
            oval(arm,leather,hand,[0.061,0.082,0.061]);
            oval(arm,steel,[hand[0],hand[1]+0.025,hand[2]+0.039],[0.064,0.062,0.028]);
            for(let finger=0;finger<3;finger++) oval(arm,polished,[hand[0]+(finger-1)*0.033,hand[1]-0.028,hand[2]-0.034],[0.018,0.032,0.024]);
            rivet(arm,[side*0.14,-0.04,0.08],gold,0.011);

            const leg = k.group(root,`Leg${suffix}`,[side*0.145,1.00,0]);
            root.userData[`leg${suffix}`] = leg;
            k.bone(leg,blue,[0,-0.015,0],[0,-0.86,0],0.105,0.064);
            oval(leg,steel,[0,-0.22,-0.015],[0.12,0.245,0.115]);
            oval(leg,polished,[side*0.014,-0.46,-0.058],[0.112,0.09,0.12]);
            k.bone(leg,steel,[0,-0.52,-0.01],[0,-0.84,-0.006],0.089,0.067);
            k.bone(leg,polished,[0,-0.52,-0.095],[0,-0.84,-0.073],0.012,0.009);
            oval(leg,leather,[0,-0.915,-0.055],[0.095,0.085,0.16]);
            oval(leg,steel,[0,-0.925,-0.095],[0.103,0.075,0.19]);
            for(let plate=0;plate<2;plate++) oval(leg,polished,[0,-0.9+plate*0.035,-0.14+plate*0.057],[0.104,0.022,0.067]);
        }

        const sword = k.group(root.userData.armR,"Sword",[0.045,-0.66,-0.076]);
        sword.rotation.z = 0.31;
        k.bone(sword,leather,[0,-0.055,0],[0,0.085,0],0.026,0.025);
        oval(sword,gold,[0,0.112,0],[0.043,0.032,0.026]);
        k.taper(sword,polished,[[-0.145,-0.09,0],[-0.09,-0.076,0],[0,-0.076,0],[0.09,-0.076,0],[0.145,-0.09,0]],[0.013,0.015,0.018,0.015,0.013],6);
        const blade = [[-0.036,-0.1,0],[0,-0.1,0.018],[0.036,-0.1,0],[0,-0.1,-0.018],[-0.029,-0.65,0],[0,-0.65,0.014],[0.029,-0.65,0],[0,-0.65,-0.014],[0,-0.78,0]];
        facet(sword,polished,blade,[0,4,1,1,4,5,1,5,2,2,5,6,2,6,3,3,6,7,3,7,0,0,7,4,4,8,5,5,8,6,6,8,7,7,8,4,0,1,3,1,2,3]);

        const shield = k.group(root.userData.armL,"Shield",[-0.055,-0.46,-0.32]);
        shield.rotation.y = 0.28; shield.rotation.z = -0.055;
        const outline = [[0,0.365],[-0.255,0.32],[-0.275,0.075],[-0.23,-0.20],[0,-0.455],[0.23,-0.20],[0.275,0.075],[0.255,0.32]];
        const front = [[0,0,-0.10],...outline.map(([x,y])=>[x,y,-0.015])];
        const back = [[0,0,0.035],...outline.map(([x,y])=>[x,y,0.02])];
        const frontIndices=[],backIndices=[],sidePoints=[],sideIndices=[];
        for(let i=0;i<outline.length;i++) {
            const a=i+1,b=(i+1)%outline.length+1;
            frontIndices.push(0,b,a); backIndices.push(0,a,b);
            const n=sidePoints.length; sidePoints.push(front[a],front[b],back[a],back[b]);
            sideIndices.push(n,n+1,n+2,n+1,n+3,n+2);
        }
        k.membrane(shield,blue,front,frontIndices);
        k.membrane(shield,wood,back,backIndices);
        k.membrane(shield,steel,sidePoints,sideIndices);
        const rim=[...outline.map(([x,y])=>[x,y,-0.02]),[outline[0][0],outline[0][1],-0.02]];
        k.taper(shield,polished,rim,rim.map(()=>0.015),6);
        for (const i of [1,2,3,5,6,7]) {
            const [x,y]=outline[i]; rivet(shield,[x*0.91,y*0.91,-0.027],gold,0.009);
            rivet(shield,[x*0.91,y*0.91,0.036],steel,0.009);
        }
        // Heraldry on the front, and a proper grip and straps on the visible back.
        k.membrane(shield,gold,[[-0.021,0.29,-0.108],[0.021,0.29,-0.108],[0.021,-0.30,-0.108],[-0.021,-0.30,-0.108]],[0,1,2,0,2,3]);
        k.membrane(shield,gold,[[0,0.18,-0.113],[-0.08,0.05,-0.113],[0,-0.08,-0.113],[0.08,0.05,-0.113]],[0,2,1,0,3,2]);
        k.bone(shield,leather,[-0.12,-0.13,0.075],[0.115,-0.13,0.075],0.024,0.024);
        for(const y of [-0.23,0.16]) {
            k.taper(shield,leather,[[-0.15,y,0.035],[-0.08,y,0.115],[0.08,y,0.115],[0.15,y,0.035]],[0.016,0.016,0.016,0.016],6);
        }

        const swordTip = k.group(sword, "SwordTip", [0,-0.78,0]);
        const shieldContact = k.group(shield, "ShieldContact", [0,0,-0.10]);
        Object.assign(root.userData, {
            detailedHero:true, type:"hero", front:"-Z", baseY:0,
            helmet, sword, shield, swordTip, shieldContact, armSwingL:0.28, armSwingR:0.5
        });
        return k.finish(root);
    }
    return { create };
})();
