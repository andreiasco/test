// Personaje fantasy cu anatomie și articulații proprii. Fețele privesc spre +Z.
window.CastleQuizMonsterHumanoids = (() => {
    function body(k, type, scale = 1) {
        const root = k.group(null, `${type}Monster`);
        const figure = k.group(root, "Anatomy");
        figure.scale.setScalar(scale);
        root.userData.type = type;
        root.userData.baseY = 0;
        root.userData.focusY = 1.3 * scale;
        root.userData.front = "+Z";
        return { root, figure };
    }

    function oval(k, parent, material, position, scale, detail = 12) {
        return k.add(parent, new k.THREE.SphereGeometry(1, k.lowDetail ? 8 : detail, k.lowDetail ? 6 : 8), material, position, scale);
    }

    function link(k, root, figure, field, name, position) {
        const pivot = k.group(figure, name, position);
        root.userData[field] = pivot;
        return pivot;
    }

    function palm(k, parent, material, at, { bone = false, fingers = 4, size = 1 } = {}) {
        const hand = k.group(parent, "Hand", at);
        oval(k, hand, material, [0, -0.02 * size, 0], [0.065 * size, 0.085 * size, 0.035 * size], 10);
        for (let finger = 0; finger < fingers; finger++) {
            const x = (finger - (fingers - 1) / 2) * 0.033 * size;
            const length = (finger === 0 || finger === fingers - 1 ? 0.095 : 0.12) * size;
            const radius = (bone ? 0.012 : 0.016) * size;
            k.bone(hand, material, [x, -0.07 * size, 0.012 * size], [x, -0.07 * size - length * 0.6, 0.027 * size], radius, radius * 0.8);
            k.bone(hand, material, [x, -0.07 * size - length * 0.6, 0.027 * size], [x, -0.07 * size - length, 0.055 * size], radius * 0.8, radius * 0.5);
        }
        k.bone(hand, material, [0.06 * size, 0, 0], [0.1 * size, -0.055 * size, 0.045 * size], 0.022 * size, 0.013 * size);
        return hand;
    }

    function limbs(k, root, figure, skin, clothing, boots, { armY = 1.55, armX = 0.35, hipY = 0.92, muscular = false } = {}) {
        for (const [side, suffix] of [[-1, "L"], [1, "R"]]) {
            const arm = link(k, root, figure, `arm${suffix}`, `Arm${suffix}`, [side * armX, armY, 0]);
            k.bone(arm, clothing, [0, 0, 0], [side * 0.035, -0.33, 0.025], muscular ? 0.13 : 0.105, 0.082);
            oval(k, arm, skin, [side * 0.035, -0.34, 0.025], [0.085, 0.09, 0.085], 10);
            k.bone(arm, skin, [side * 0.035, -0.35, 0.025], [side * 0.015, -0.64, 0.07], 0.08, 0.052);
            palm(k, arm, skin, [side * 0.015, -0.69, 0.075]);
            const leg = link(k, root, figure, `leg${suffix}`, `Leg${suffix}`, [side * 0.16, hipY, 0]);
            k.bone(leg, clothing, [0, 0, 0], [0, -0.37, 0.025], muscular ? 0.14 : 0.12, 0.09);
            oval(k, leg, clothing, [0, -0.38, 0.025], [0.095, 0.09, 0.095], 10);
            k.bone(leg, boots, [0, -0.4, 0.02], [0, -0.77, 0], 0.09, 0.075);
            oval(k, leg, boots, [0, -hipY + 0.08, 0.1], [0.115, 0.08, 0.21], 12);
        }
    }

    function face(k, parent, skin, eye, dark, y, { goblin = false, demon = false } = {}) {
        const head = k.group(parent, "Head", [0, y, goblin ? 0.12 : 0.025]);
        oval(k, head, skin, [0, 0, 0], [goblin ? 0.245 : 0.205, 0.225, 0.18], 16);
        oval(k, head, skin, [0, -0.13, 0.035], [0.155, 0.115, 0.155], 12);
        for (const side of [-1, 1]) {
            oval(k, head, dark, [side * 0.092, 0.005, 0.153], [0.067, 0.047, 0.035], 10);
            oval(k, head, eye, [side * 0.092, 0.002, 0.181], [0.033, 0.027, 0.016], 10);
            oval(k, head, dark, [side * 0.092, 0.001, 0.195], [0.01, 0.022, 0.007], 8);
            k.bone(head, skin, [side * 0.035, 0.065, 0.175], [side * 0.17, 0.045, 0.13], 0.042, 0.037);
            oval(k, head, skin, [side * 0.15, -0.075, 0.105], [0.075, 0.068, 0.095], 10);
            if (goblin || demon) {
                k.taper(head, skin, [[side * 0.18, 0.02, -0.01], [side * (goblin ? 0.32 : 0.26), 0.08, -0.025], [side * (goblin ? 0.44 : 0.32), 0.14, -0.08]], [0.085, 0.05, 0.002], 8);
            } else oval(k, head, skin, [side * 0.204, -0.025, -0.005], [0.036, 0.07, 0.045], 10);
        }
        oval(k, head, skin, [0, -0.025, 0.18], [goblin ? 0.064 : 0.04, 0.095, goblin ? 0.095 : 0.065], 10);
        oval(k, head, skin, [0, -0.075, goblin ? 0.25 : 0.213], [goblin ? 0.075 : 0.052, 0.043, 0.055], 10);
        oval(k, head, dark, [0, -0.145, 0.18], [0.084, 0.016, 0.027], 10);
        return head;
    }

    function goblin(k) {
        const { root, figure } = body(k, "goblin", 0.78);
        const skin = k.material("skin", 0x77825a), darkSkin = k.material("skin", 0x606c47);
        const leather = k.material("leather", 0x594631), dark = k.material("shadow", 0x201c14);
        const eye = k.material("eye", 0xb9a969, { emissive: 0x76622c, emissiveIntensity: 0.1 });
        const tooth = k.material("bone", 0xd9ccaa);
        k.lathe(figure, skin, [[0.16,0.84],[0.24,1.01],[0.31,1.25],[0.34,1.43],[0.23,1.56],[0.11,1.61]], [0,0,0.045], [1,1,0.72]);
        oval(k, figure, darkSkin, [0, 1.5, -0.065], [0.30, 0.19, 0.18]);
        k.bone(figure, skin, [0,1.51,0.06], [0,1.75,0.13], 0.12,0.11);
        limbs(k, root, figure, skin, darkSkin, leather, { armY:1.52, armX:0.36 });
        const head = face(k, figure, skin, eye, dark, 1.86, { goblin:true });
        for (const x of [-0.063,0.063]) k.add(head, new k.THREE.ConeGeometry(0.017,0.092,7), tooth, [x,-0.105,0.215], [1,1,1], [0,0,x<0?-0.12:0.12]);
        k.lathe(figure, leather, [[0.20,0.73],[0.25,0.81],[0.27,0.98],[0.25,1.04]], [0,0,0], [1,1,0.82]);
        const belt = k.material("leather", 0x342b20), buckle = k.material("metal", 0x8e8055);
        k.lathe(figure, belt, [[0.26,0.98],[0.265,1.05]], [0,0,0], [1,1,0.82]);
        k.add(figure, new k.THREE.TorusGeometry(0.06,0.015,5,10), buckle, [0,1.015,0.23]);
        k.bone(figure, leather, [-0.23,1.52,0.18],[0.20,1.05,0.22],0.035,0.035);
        root.userData.focusY = 1.1;
        return root;
    }

    function skeleton(k) {
        const { root, figure } = body(k, "skeleton");
        const bone = k.material("bone", 0xc9c4af), dark = k.material("shadow", 0x232522);
        for (let i=0;i<8;i++) {
            const y=1.02+i*0.078;
            oval(k,figure,bone,[0,y,-0.085],[0.06,0.045,0.055],8);
            k.bone(figure,bone,[-0.07,y,-0.075],[0.07,y,-0.075],0.018,0.018);
        }
        for(let row=0;row<6;row++)for(const side of[-1,1]) {
            const y=1.12+row*0.075, width=0.21+Math.sin((row+1)/7*Math.PI)*0.075;
            k.taper(figure,bone,[[0,y,0.18],[side*width*0.7,y+0.035,0.15],[side*width,y+0.025,-0.015],[side*width*0.82,y-0.015,-0.13],[side*0.045,y-0.04,-0.14]],[0.021,0.023,0.024,0.022,0.018],6);
        }
        k.bone(figure,bone,[0,1.16,0.18],[0,1.55,0.16],0.035,0.03);
        for(const side of[-1,1]) {
            k.bone(figure,bone,[0,1.57,0.015],[side*0.30,1.59,-0.015],0.034,0.032);
            k.taper(figure,bone,[[side*0.03,0.99,-0.06],[side*0.21,1.04,-0.04],[side*0.24,0.91,0.04],[side*0.12,0.85,0.1],[side*0.04,0.91,0.05]],[0.045,0.06,0.055,0.04,0.032],7);
        }
        k.bone(figure,bone,[0,1.59,-0.06],[0,1.73,-0.04],0.055,0.05);
        const skull = k.group(figure,"Head",[0,1.91,0]);
        oval(k,skull,bone,[0,0.035,-0.025],[0.19,0.23,0.17],16);
        for(const side of[-1,1]) {
            oval(k,skull,bone,[side*0.13,-0.075,0.075],[0.075,0.075,0.08],10);
            oval(k,skull,dark,[side*0.084,0.025,0.143],[0.068,0.066,0.038],12);
            k.add(skull,new k.THREE.TorusGeometry(0.069,0.014,5,12),bone,[side*0.084,0.025,0.178],[1,0.94,0.65]);
            k.bone(skull,bone,[side*0.025,0.105,0.15],[side*0.15,0.089,0.12],0.026,0.025);
        }
        k.membrane(skull,dark,[[0,-0.015,0.185],[-0.029,-0.095,0.193],[0.029,-0.095,0.193]],[0,1,2]);
        oval(k,skull,dark,[0,-0.145,0.13],[0.12,0.035,0.055],10);
        const jaw=k.group(skull,"Jaw",[0,-0.13,0.02]);
        k.taper(jaw,bone,[[-0.15,0.015,-0.03],[-0.13,-0.10,0.11],[0,-0.115,0.16],[0.13,-0.10,0.11],[0.15,0.015,-0.03]],[0.026,0.025,0.028,0.025,0.026],7);
        for(let i=0;i<6;i++) k.add(skull,new k.THREE.BoxGeometry(0.026,0.04,0.032),bone,[(i-2.5)*0.032,-0.15,0.168]);
        for(const[side,suffix]of[[-1,"L"],[1,"R"]]) {
            const arm=link(k,root,figure,`arm${suffix}`,`Arm${suffix}`,[side*0.31,1.58,0]);
            oval(k,arm,bone,[0,-0.015,0],[0.07,0.075,0.07],8);
            k.bone(arm,bone,[0,-0.05,0],[side*0.025,-0.34,0.025],0.041,0.033);
            oval(k,arm,bone,[side*0.025,-0.35,0.025],[0.05,0.05,0.05],8);
            for(const offset of[-0.025,0.025]) k.bone(arm,bone,[side*0.025+offset,-0.39,0.025],[offset,-0.65,0.055],0.022,0.018);
            palm(k,arm,bone,[0,-0.70,0.055],{bone:true,size:0.85});
            const leg=link(k,root,figure,`leg${suffix}`,`Leg${suffix}`,[side*0.145,0.92,0]);
            k.bone(leg,bone,[0,-0.015,0],[0,-0.37,0.025],0.055,0.038);
            oval(k,leg,bone,[0,-0.39,0.025],[0.06,0.055,0.055],8);
            for(const offset of[-0.028,0.028]) k.bone(leg,bone,[offset,-0.43,0.015],[offset*0.6,-0.8,0],offset<0?0.031:0.02,0.02);
            oval(k,leg,bone,[0,-0.84,0.04],[0.065,0.045,0.095],8);
            for(let toe=0;toe<4;toe++) k.bone(leg,bone,[(toe-1.5)*0.029,-0.893,0.075],[(toe-1.5)*0.033,-0.896,0.2-Math.abs(toe-1.5)*0.022],0.015,0.01);
        }
        root.userData.jaw=jaw; return root;
    }

    function knight(k) {
        const {root,figure}=body(k,"knight");
        const steel=k.material("metal",0x7f898d,{roughness:0.5,metalness:0.78}), edge=k.material("metal",0xaaa791,{roughness:0.44,metalness:0.74});
        const leather=k.material("leather",0x3d332a), dark=k.material("shadow",0x20282c), cloth=k.material("cloth",0x534541);
        k.lathe(figure,steel,[[0.18,0.91],[0.25,1.02],[0.34,1.28],[0.34,1.49],[0.23,1.60],[0.12,1.64]],[0,0,0],[1,1,0.73]);
        oval(k,figure,steel,[0,1.34,0.18],[0.265,0.29,0.10],16);
        for(const y of[1.01,1.09,1.17]) k.lathe(figure,edge,[[0.24,y],[0.26,y+0.055]],[0,0,0],[1,1,0.8]);
        k.lathe(figure,steel,[[0.13,1.58],[0.145,1.72]],[0,0,0],[1,1,0.9]);
        const head=k.group(figure,"Head",[0,1.91,0]);
        oval(k,head,steel,[0,0,0],[0.235,0.235,0.205],16);
        oval(k,head,dark,[0,0.005,0.194],[0.183,0.036,0.027],12);
        k.add(head,new k.THREE.BoxGeometry(0.39,0.045,0.035),edge,[0,0.06,0.205]);
        k.add(head,new k.THREE.BoxGeometry(0.032,0.18,0.045),edge,[0,-0.035,0.223]);
        for(const side of[-1,1]) {
            oval(k,head,steel,[side*0.16,-0.10,0.09],[0.075,0.14,0.115],10);
            for(let slit=0;slit<3;slit++) k.add(head,new k.THREE.BoxGeometry(0.018,0.052,0.013),dark,[side*(0.066+slit*0.03),-0.095,0.205]);
        }
        k.bone(head,edge,[0,0.18,-0.115],[0,0.24,0.09],0.026,0.025);
        for(const[side,suffix]of[[-1,"L"],[1,"R"]]) {
            const arm=link(k,root,figure,`arm${suffix}`,`Arm${suffix}`,[side*0.36,1.57,0]);
            k.bone(arm,leather,[0,0,0],[side*0.035,-0.65,0.05],0.095,0.065);
            oval(k,arm,steel,[side*0.015,-0.045,0],[0.18,0.145,0.17],14);
            oval(k,arm,steel,[side*0.025,-0.24,0.015],[0.115,0.20,0.115],12);
            oval(k,arm,edge,[side*0.03,-0.38,0.05],[0.12,0.09,0.12],12);
            oval(k,arm,steel,[side*0.015,-0.53,0.035],[0.09,0.17,0.10],12);
            palm(k,arm,steel,[0,-0.70,0.075],{size:0.93});
            const leg=link(k,root,figure,`leg${suffix}`,`Leg${suffix}`,[side*0.16,0.92,0]);
            k.bone(leg,cloth,[0,0,0],[0,-0.78,0],0.10,0.075);
            oval(k,leg,steel,[0,-0.19,0.02],[0.135,0.25,0.115],12);
            oval(k,leg,edge,[0,-0.40,0.06],[0.125,0.11,0.12],12);
            oval(k,leg,steel,[0,-0.62,0.025],[0.105,0.23,0.10],12);
            oval(k,leg,steel,[0,-0.84,0.12],[0.13,0.08,0.235],12);
        }
        const sword=k.group(root.userData.armR,"Sword",[0,-0.63,0.12]);
        sword.rotation.z=-0.12;
        k.bone(sword,leather,[0,-0.12,0],[0,0.02,0],0.028,0.028);
        k.bone(sword,edge,[-0.13,0.04,0],[0.13,0.04,0],0.022,0.022);
        const blade=new k.THREE.Shape(); blade.moveTo(-0.035,0.065);blade.lineTo(-0.035,0.71);blade.lineTo(0,0.83);blade.lineTo(0.035,0.71);blade.lineTo(0.035,0.065);blade.closePath();
        k.add(sword,new k.THREE.ExtrudeGeometry(blade,{depth:0.018,bevelEnabled:false}),edge,[0,0,0]);
        const shape=new k.THREE.Shape();shape.moveTo(-0.24,0.30);shape.lineTo(0.24,0.30);shape.lineTo(0.22,-0.16);shape.quadraticCurveTo(0,-0.45,-0.22,-0.16);shape.closePath();
        k.add(root.userData.armL,new k.THREE.ExtrudeGeometry(shape,{depth:0.055,bevelEnabled:true,bevelSize:0.015,bevelThickness:0.015,bevelSegments:1,curveSegments:5}),steel,[-0.04,-0.43,0.22]);
        oval(k,root.userData.armL,edge,[-0.04,-0.42,0.29],[0.075,0.075,0.04],12);
        return root;
    }

    function wizard(k) {
        const {root,figure}=body(k,"wizard");
        const robe=k.material("cloth",0x454358), trim=k.material("cloth",0x817254), skin=k.material("skin",0xc6b299);
        const dark=k.material("shadow",0x23232b), eye=k.material("eye",0x9db5bd), beard=k.material("cloth",0xb8b9b1), boots=k.material("leather",0x453a30);
        const profile=[[0.42,0.10],[0.43,0.27],[0.36,0.75],[0.25,1.07],[0.32,1.40],[0.23,1.57],[0.12,1.65]];
        const geometry=new k.THREE.LatheGeometry(profile.map(([x,y])=>new k.THREE.Vector2(x,y)),k.lowDetail?12:24);
        const positions=geometry.getAttribute("position");
        for(let i=0;i<positions.count;i++) {
            const x=positions.getX(i),z=positions.getZ(i),y=positions.getY(i),angle=Math.atan2(z,x);
            const amount=1+Math.sin(angle*10)*(0.025+Math.max(0,1-y/1.65)*0.055);
            positions.setXYZ(i,x*amount,y,z*amount*0.82);
        }
        geometry.computeVertexNormals();k.add(figure,geometry,robe);
        limbs(k,root,figure,skin,robe,boots,{armY:1.53,armX:0.32});
        for(const arm of[root.userData.armL,root.userData.armR]) {
            k.bone(arm,robe,[0,-0.04,0],[0,-0.52,0.055],0.145,0.105);
            k.add(arm,new k.THREE.TorusGeometry(0.103,0.016,5,12),trim,[0,-0.53,0.055],[1,1,1],[Math.PI/2,0,0]);
        }
        oval(k,figure,robe,[0,1.93,-0.045],[0.255,0.29,0.22],16);
        const head=face(k,figure,skin,eye,dark,1.91);
        k.taper(head,beard,[[-0.12,-0.07,0.14],[-0.10,-0.18,0.18],[-0.045,-0.38,0.16],[0,-0.46,0.13]],[0.075,0.09,0.045,0.002],8);
        k.taper(head,beard,[[0.12,-0.07,0.14],[0.10,-0.18,0.18],[0.045,-0.38,0.16],[0,-0.46,0.13]],[0.075,0.09,0.045,0.002],8);
        k.add(figure,new k.THREE.TorusGeometry(0.27,0.037,6,18),robe,[0,2.14,-0.02],[1,1,1],[Math.PI/2,0,0]);
        k.taper(figure,robe,[[0,2.13,-0.02],[0.015,2.34,-0.015],[0.13,2.51,-0.055],[0.23,2.56,-0.12]],[0.25,0.15,0.07,0.002],k.lowDetail?9:12);
        k.lathe(figure,trim,[[0.257,1.02],[0.262,1.08]],[0,0,0],[1,1,0.84]);
        const staff=k.group(root.userData.armR,"Staff",[0.03,0,0.12]);
        const wood=k.material("wood",0x65503b), metal=k.material("metal",0x8f815d);
        k.taper(staff,wood,[[0,-1.50,0],[0.015,-0.7,0],[0,0.15,0.015],[0.055,0.78,0]],[0.027,0.033,0.035,0.045],8);
        for(const x of[-0.08,0.08]) k.bone(staff,metal,[0.055,0.69,0],[0.055+x,0.89,0],0.018,0.014);
        k.add(staff,new k.THREE.OctahedronGeometry(0.105,0),k.material("eye",0x8b83ab,{emissive:0x5b5485,emissiveIntensity:0.25}),[0.055,0.88,0]);
        root.userData.focusY=1.4;return root;
    }

    function rock(k,parent,material,position,scale,seed=1) {
        const geometry=new k.THREE.DodecahedronGeometry(1,k.lowDetail?0:1);
        const vertices=geometry.getAttribute("position");
        for(let i=0;i<vertices.count;i++) {
            const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i);
            const variation=1+Math.sin(x*8.3+y*5.7+z*9.1+seed)*0.065;
            vertices.setXYZ(i,x*variation,y*variation,z*variation);
        }
        geometry.computeVertexNormals();return k.add(parent,geometry,material,position,scale);
    }

    function golem(k) {
        const {root,figure}=body(k,"golem",1.02);
        const stone=k.material("stone",0x788078), darker=k.material("stone",0x5e675f), moss=k.material("stone",0x6d7758);
        const dark=k.material("shadow",0x2c332c), eye=k.material("eye",0xb5a16b,{emissive:0x77632d,emissiveIntensity:0.2});
        rock(k,figure,stone,[0,1.39,0],[0.43,0.39,0.29],1);
        rock(k,figure,darker,[0,1.08,0],[0.33,0.28,0.24],2);
        rock(k,figure,moss,[0,0.91,-0.02],[0.32,0.18,0.23],3);
        rock(k,figure,stone,[0,1.97,0],[0.28,0.30,0.24],4);
        for(const side of[-1,1]) {
            rock(k,figure,darker,[side*0.135,2.04,0.17],[0.16,0.07,0.12],5+side);
            oval(k,figure,dark,[side*0.105,1.98,0.22],[0.065,0.055,0.035],8);
            oval(k,figure,eye,[side*0.105,1.98,0.245],[0.027,0.023,0.015],8);
        }
        rock(k,figure,stone,[0,1.91,0.24],[0.065,0.11,0.075],10);
        k.taper(figure,dark,[[-0.14,1.80,0.205],[0,1.78,0.24],[0.14,1.81,0.205]],[0.014,0.018,0.014],5);
        for(const[side,suffix]of[[-1,"L"],[1,"R"]]) {
            const arm=link(k,root,figure,`arm${suffix}`,`Arm${suffix}`,[side*0.47,1.61,0]);
            rock(k,arm,stone,[side*0.035,-0.08,0],[0.23,0.21,0.22],11+side);
            rock(k,arm,moss,[side*0.04,-0.31,0],[0.18,0.18,0.17],12+side);
            rock(k,arm,darker,[side*0.035,-0.51,0.04],[0.17,0.23,0.17],13+side);
            rock(k,arm,stone,[side*0.02,-0.74,0.07],[0.18,0.15,0.15],14+side);
            for(let finger=0;finger<3;finger++)rock(k,arm,darker,[(finger-1)*0.09,-0.88,0.09],[0.05,0.10,0.05],finger+side*3);
            const leg=link(k,root,figure,`leg${suffix}`,`Leg${suffix}`,[side*0.19,0.93,0]);
            rock(k,leg,stone,[0,-0.18,0],[0.18,0.25,0.19],16+side);
            rock(k,leg,darker,[0,-0.47,0.015],[0.15,0.19,0.16],17+side);
            rock(k,leg,moss,[0,-0.64,0.025],[0.145,0.18,0.15],18+side);
            rock(k,leg,stone,[0,-0.83,0.10],[0.19,0.10,0.25],19+side);
        }
        root.userData.focusY=1.45;return root;
    }

    function demon(k) {
        const {root,figure}=body(k,"demon");
        const skin=k.material("scale",0x794b40), shadow=k.material("scale",0x57382f), dark=k.material("shadow",0x251f1c);
        const horn=k.material("bone",0xa99c7d), hoof=k.material("leather",0x332c26), eye=k.material("eye",0xd8b16b,{emissive:0x8e4c1f,emissiveIntensity:0.15});
        oval(k,figure,skin,[0,1.36,0],[0.35,0.32,0.23],16);
        for(const side of[-1,1]) {
            oval(k,figure,skin,[side*0.16,1.44,0.17],[0.205,0.17,0.115],12);
            oval(k,figure,shadow,[side*0.13,1.12,0.15],[0.105,0.22,0.09],12);
        }
        oval(k,figure,shadow,[0,0.95,0],[0.27,0.19,0.20],12);
        k.bone(figure,skin,[0,1.55,-0.015],[0,1.76,0],0.14,0.11);
        face(k,figure,skin,eye,dark,1.94,{demon:true});
        for(const side of[-1,1]) {
            k.taper(figure,horn,[[side*0.16,2.10,-0.015],[side*0.28,2.32,-0.10],[side*0.29,2.51,-0.19],[side*0.16,2.61,-0.15]],[0.075,0.055,0.025,0.002],9);
            const tooth=k.add(figure,new k.THREE.ConeGeometry(0.018,0.11,7),horn,[side*0.065,1.79,0.245]);tooth.rotation.z=side*0.12;
        }
        for(const[side,suffix]of[[-1,"L"],[1,"R"]]) {
            const arm=link(k,root,figure,`arm${suffix}`,`Arm${suffix}`,[side*0.39,1.57,0]);
            oval(k,arm,skin,[side*0.015,-0.04,0],[0.18,0.15,0.16],12);
            k.bone(arm,skin,[side*0.01,-0.11,0],[side*0.04,-0.35,0.02],0.125,0.085);
            oval(k,arm,shadow,[side*0.045,-0.36,0.02],[0.09,0.09,0.09],10);
            k.bone(arm,skin,[side*0.045,-0.4,0.025],[side*0.02,-0.65,0.065],0.095,0.055);
            const hand=palm(k,arm,skin,[side*0.02,-0.69,0.07],{size:1.12});
            for(let finger=0;finger<4;finger++)k.taper(hand,horn,[[(finger-1.5)*0.037,-0.18,0.055],[(finger-1.5)*0.037,-0.225,0.08],[(finger-1.5)*0.037,-0.245,0.10]],[0.014,0.008,0.001],5);
            const leg=link(k,root,figure,`leg${suffix}`,`Leg${suffix}`,[side*0.17,0.98,0]);
            k.bone(leg,skin,[0,0,0],[0,-0.34,-0.07],0.15,0.10);
            oval(k,leg,shadow,[0,-0.35,-0.07],[0.11,0.12,0.10],10);
            k.bone(leg,skin,[0,-0.38,-0.08],[0,-0.68,-0.15],0.11,0.07);
            k.bone(leg,shadow,[0,-0.68,-0.15],[0,-0.88,0.065],0.07,0.06);
            for(const half of[-1,1]) oval(k,leg,hoof,[half*0.055,-0.91,0.135],[0.051,0.07,0.16],10);
        }
        const tail=k.group(figure,"Tail",[0,0.95,-0.16]);
        k.taper(tail,skin,[[0,0,0],[0.12,-0.18,-0.4],[0.28,-0.34,-0.76],[0.44,-0.18,-1.03]],[0.08,0.06,0.035,0.008],8);
        k.membrane(tail,shadow,[[0.44,-0.18,-1.03],[0.34,-0.05,-1.12],[0.44,-0.18,-1.29],[0.54,-0.05,-1.12]],[0,1,2,0,2,3]);
        root.userData.tail=tail;root.userData.focusY=1.4;return root;
    }

    const builders={goblin,skeleton,knight,wizard,golem,demon};
    return { build(k,type) { return builders[type]?.(k) || null; } };
})();
