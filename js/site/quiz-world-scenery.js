// Procedural scenery in the castle's low-poly, cinematic style.
// Camera paths, character positions and doorLeaf contract stay identical.
window.QuizWorldScenery = (() => {
    const PALETTES = {
        snow: { sky: 0x102739, fog: 0.032, ground: 0xc9e2eb, rock: 0x527b94, accent: 0x9de5fa, wood: 0x53667a, leaf: 0x285b62, light: 0xb9e9ff },
        desert: { sky: 0x332224, fog: 0.026, ground: 0xb58b59, rock: 0x9b7047, accent: 0xe8be72, wood: 0x6b4634, leaf: 0x4e7952, light: 0xffdfad },
        jungle: { sky: 0x0b2420, fog: 0.045, ground: 0x344c39, rock: 0x596a53, accent: 0x9bd890, wood: 0x4e3c2a, leaf: 0x2d7650, light: 0xb5e8b3 }
    };
    function tools({ THREE, makeMesh, mat, parent, palette }) {
        const materials = new Map();
        const material = color => { if (!materials.has(color)) materials.set(color, mat(color, 0.88)); return materials.get(color); };
        function mesh(geometry, color, x, y, z, name) {
            const obj = makeMesh(geometry, material(color), x, y, z); if (name) obj.name = name; parent.add(obj); return obj;
        }
        const box = (w,h,d,color,x,y,z,name) => mesh(new THREE.BoxGeometry(w,h,d),color,x,y,z,name);
        const cone = (r,h,color,x,y,z,name) => mesh(new THREE.ConeGeometry(r,h,7),color,x,y,z,name);
        const stone = (r,color,x,y,z,name) => mesh(new THREE.DodecahedronGeometry(r,0),color,x,y,z,name);
        const cylinder = (r,h,color,x,y,z,name) => mesh(new THREE.CylinderGeometry(r,r*1.12,h,8),color,x,y,z,name);
        function tree(x,z,s=1,pine=false) {
            cylinder(.12*s,2.7*s,palette.wood,x,1.35*s,z,'tree-trunk');
            if (pine) {
                for (let n=0;n<3;n++) { cone((.75-n*.16)*s,1.2*s,palette.leaf,x,(1.8+n*.55)*s,z,'pine'); cone((.71-n*.16)*s,.58*s,0xe4f3f5,x,(2.1+n*.55)*s,z,'snow-cap'); }
            } else {
                for (let n=0;n<3;n++) { const crown=stone(.9*s,palette.leaf,x+(n-1)*.45*s,(3+(n%2)*.3)*s,z,'canopy'); crown.scale.set(1.35,.62,1.1); }
            }
        }
        function palm(x,z,s=1) {
            const trunk=cylinder(.13*s,2.5*s,palette.wood,x,1.25*s,z,'palm'); trunk.rotation.z=.12;
            for(let i=0;i<6;i++) { const frond=cone(.34*s,1.9*s,palette.leaf,x,2.5*s,z,'palm-frond'); frond.rotation.z=1.1; frond.rotation.y=i*Math.PI/3; }
        }
        function crystal(x,y,z,s=1) { const obj=cone(.24*s,1.2*s,palette.accent,x,y+.6*s,z,'ice-crystal'); obj.rotation.z=x>0?-.18:.18; return obj; }
        function pool(x,z,w=1.5,d=1.5) { const water=box(w,.04,d,0x478f9d,x,.08,z,'water'); water.material = new THREE.MeshStandardMaterial({color:0x478f9d,roughness:.22,metalness:.28,transparent:true,opacity:.8}); return water; }
        function vine(x,z,length=2.5) {
            const v=cylinder(.035,length,palette.leaf,x,3.8-length/2,z,'hanging-vine'); v.rotation.z=Math.sin(z)*.15; return v;
        }
        return { mesh,box,cone,stone,cylinder,tree,palm,crystal,pool,vine };
    }
    function buildEnvironment(context) {
        const { THREE, scene, world } = context;
        const palette=PALETTES[world];
        const parent=new THREE.Group(); parent.name='environment-'+world; scene.add(parent);
        const t=tools({...context,parent,palette});
        scene.background=new THREE.Color(palette.sky); scene.fog=new THREE.FogExp2(palette.sky,palette.fog);
        scene.add(new THREE.HemisphereLight(palette.light,palette.ground,1.8));
        const light=new THREE.DirectionalLight(palette.light,2.0); light.position.set(4,8,5); light.castShadow=true; light.shadow.mapSize.set(1024,1024); scene.add(light);
        const floor=t.box(11,.16,34,palette.ground,0,-.12,-6,'trail-floor');
        for(let i=0;i<8;i++) for(const side of [-1,1]) {
            const x=side*(3.3+(i%2)*.45),z=3-i*2.8;
            if(world==='snow') {
                if(i%2) t.tree(x,z,.8+(i%3)*.1,true); else {const ice=t.stone(.8,palette.rock,x,.65,z,'glacier-rock');ice.scale.y=1.8;t.crystal(x*.83,.05,z,.8);}
            } else if(world==='desert') {
                const dune=t.stone(1.3,palette.ground,x,.15,z,'sand-dune');dune.scale.set(1.5,.45,1.35);
                if(i%3===0) { t.cylinder(.17,1.3,palette.leaf,x,.65,z,'cactus');t.box(.6,.14,.15,palette.leaf,x,.85,z,'cactus-arm'); }
                if(i%3===1) t.box(.55,2.9,.6,palette.rock,x,1.45,z,'ruined-pillar');
            } else { t.tree(x,z,1+(i%3)*.12); t.vine(x*.8,z,2+(i%3)*.35); const bush=t.stone(.6,palette.leaf,x*.85,.25,z,'fern');bush.scale.y=.5; }
        }
        const door=new THREE.Group(); door.name='world-gateway';
        const gate=tools({...context,parent:door,palette});
        gate.box(.45,3.9,.6,palette.rock,-1.66,1.95,-6.8,'gateway-left');gate.box(.45,3.9,.6,palette.rock,1.66,1.95,-6.8,'gateway-right');gate.box(3.8,.5,.6,palette.rock,0,3.85,-6.8,'gateway-top');
        gate.box(2.76,3.3,.3,world==='snow'?0x8fc4d9:palette.wood,0,1.65,-6.65,'doorLeaf');
        if(world==='jungle') for(const x of [-1.7,1.7]) gate.vine(x,-6.5,2.5);
        scene.add(door);
        const particles=new THREE.Group(); particles.name='weather-'+world;
        const geometry=new THREE.SphereGeometry(world === 'snow' ? .035 : .018,5,4);
        const material=new THREE.MeshBasicMaterial({color:world==='snow'?0xe5f8ff:palette.accent,transparent:true,opacity:world === 'snow' ? .7 : .35});
        for(let i=0;i<42;i++) {
            const flake=new THREE.Mesh(geometry,material); flake.position.set(((i*37)%64)/10-3.2,.5+((i*19)%45)/10,3-((i*47)%180)/10);
            flake.userData={ dust:world!=='snow', snow:world==='snow', phase:i*.67 }; particles.add(flake);
        }
        scene.add(particles);
        return {door,particles,floor};
    }
    function buildRoom(context) {
        const { THREE, world, parent, index, boss }=context;
        const palette=PALETTES[world],t=tools({...context,palette});
        const room=window.QuizWorlds.room(world,index,boss);
        parent.name=world+'-'+room.id;
        t.box(6,.16,6.3,palette.ground,0,.01,-3.55,'room-floor');
        if(world==='snow') {
            if(room.id==='ice-cave') {
                for(const x of [-2.5,2.5]) for(let i=0;i<5;i++) {const ice=t.stone(.55,palette.rock,x,1.0+i*.45,-5.8+i*.6,'cave-ice');ice.scale.set(.65,1.8,1);t.crystal(x*.88,0,-3-i*.5,.7);}
                for(let i=0;i<7;i++){const stalactite=t.cone(.15,.7+(i%3)*.25,palette.accent,-2.2+i*.72,4.2,-5.7,'icicle');stalactite.rotation.z=Math.PI;}
            } else if(room.id==='snow-refuge') {
                t.box(4.7,.22,1.7,palette.wood,0,.16,-5.4,'refuge-deck');
                for(const x of [-2.2,2.2]) t.box(.22,3,.22,palette.wood,x,1.5,-5.7,'shelter-post');
                const roof=t.cone(3,1.1,0xe4f3f5,0,3.3,-5.7,'snow-roof');roof.scale.z=.6;
                t.box(1.4,.16,.55,palette.wood,-1.5,.7,-4.8,'refuge-bench');t.box(.8,.7,.8,palette.wood,1.7,.35,-4.8,'supply-crate');
            } else if(room.id==='frozen-bridge') {
                t.pool(-1.8,-3.8,1.3,5); t.pool(1.8,-3.8,1.3,5);
                for(let i=0;i<13;i++)t.box(2,.1,.3,0xe0eff4,0,.15,-1.2-i*.38,'ice-bridge-tile');
                for(const x of [-1.15,1.15]){t.box(.1,.12,5,palette.accent,x,1.0,-3.6,'ice-railing');for(let i=0;i<4;i++)t.cylinder(.06,1,palette.rock,x,.5,-1.4-i*1.4,'bridge-post');}
            } else if(room.id==='crystal-hall') {
                for(const x of [-2.1,2.1])for(let i=0;i<5;i++) t.crystal(x,0,-2-i*.8,1+(i%3)*.45);
                t.box(4.8,.2,.8,0x87b6cc,0,.2,-5.8,'crystal-plinth');
            } else {
                t.cylinder(1.5,.4,0xa0cfdf,0,.2,-5.5,'ice-dais');
                for(const x of [-2.2,2.2]){t.crystal(x,0,-5.6,3);t.crystal(x,0,-3.5,2);}
                t.box(1.3,2,.4,0x8eb9d0,0,1.4,-6,'frozen-throne');
            }
        } else if(world==='desert') {
            if(room.id==='dunes') {
                for(const side of [-1,1])for(let i=0;i<3;i++){const dune=t.stone(1.1,palette.ground,side*2.4,.25,-2-i*1.5,'room-dune');dune.scale.set(.8,.6,1.4);}
                t.box(.45,1.7,.55,palette.rock,-1.7,.85,-5.5,'buried-marker');
            } else if(room.id==='oasis') {
                t.pool(-1.7,-4,1.9,3.8);t.palm(-2.0,-5.4);t.palm(2.1,-4.8,.9);t.palm(2.3,-2.5,.7);
                for(let i=0;i<4;i++)t.stone(.28,palette.rock,-2.4+i*.45,.2,-2.2,'oasis-rock');
            } else if(room.id==='sand-temple') {
                for(const x of [-2,2])for(const z of [-2.3,-5.4]){t.cylinder(.25,3,palette.rock,x,1.5,z,'sandstone-column');t.box(.8,.22,.8,palette.accent,x,3,z,'column-capital');}
                t.box(4.8,.45,.6,palette.rock,0,3.4,-5.6,'temple-lintel');
                for(let i=0;i<5;i++)t.box(.12,.6,.05,palette.accent,-1.6+i*.8,2.3,-5.95,'wall-glyph');
            } else if(room.id==='obelisks') {
                for(const x of [-2,2])for(let i=0;i<3;i++){t.box(.4,2.1,.4,palette.rock,x,1.05,-2-i*1.7,'obelisk');t.cone(.31,.5,palette.accent,x,2.35,-2-i*1.7,'obelisk-tip');}
            } else {
                for(let i=0;i<3;i++)t.box(4.8-i*.6,.2,2-i*.3,palette.rock,0,.1+i*.2,-5.5,'sun-steps');
                const sun=t.mesh(new THREE.TorusGeometry(.9,.12,8,24),palette.accent,0,2.9,-6,'sun-emblem');
                for(const x of [-2.1,2.1])t.cylinder(.3,3.5,palette.rock,x,1.75,-5.3,'sanctuary-pillar');
            }
        } else {
            if(room.id==='clearing') {
                for(const x of [-2.2,2.2]){t.tree(x,-5.2,.9);for(let i=0;i<3;i++)t.stone(.4,palette.leaf,x,.2,-2.5-i*.7,'undergrowth');}
                t.cylinder(.7,.3,palette.wood,-1.8,.15,-3,'tree-stump');
            } else if(room.id==='vine-ruins') {
                for(const x of [-2.2,2.2]){for(let i=0;i<4;i++)t.box(.65,.55,1,palette.rock,x,.28+i*.56,-4.5,'mossy-ruin');t.vine(x,-4.2,2.4);}
                t.box(4.6,.35,.7,palette.rock,0,3.1,-5.6,'ruin-lintel');for(let i=0;i<5;i++)t.vine(-1.8+i*.9,-5.5,1.1+(i%2)*.7);
            } else if(room.id==='canopy-bridge') {
                for(let i=0;i<14;i++)t.box(2,.12,.28,palette.wood,0,.14,-1.2-i*.35,'jungle-bridge-plank');
                for(const x of [-1.2,1.2]){t.box(.055,.07,5,palette.wood,x,1.15,-3.5,'rope-railing');for(let i=0;i<5;i++)t.vine(x,-1.5-i,3.6);}
                t.tree(-2.4,-5,1.2);t.tree(2.4,-5,1.2);
            } else if(room.id==='waterfall') {
                t.pool(-1.9,-4,1.7,3.5);
                for(let i=0;i<5;i++)t.stone(.55,palette.rock,-2.4,.4+i*.65,-5.5,'waterfall-cliff');
                const water=t.box(.9,3,.09,0x75b6bf,-1.9,1.55,-5.25,'waterfall');water.material=new THREE.MeshStandardMaterial({color:0x75b6bf,transparent:true,opacity:.68,roughness:.25});
                t.tree(2.2,-4.5);
            } else {
                t.cylinder(.85,4.5,palette.wood,0,2.25,-6,'ancient-tree');
                for(const x of [-2,-1,1,2]){const root=t.box(.25,.3,2,palette.wood,x*.6,.1,-5.3,'ancient-root');root.rotation.y=x*.3;}
                for(const x of [-2,0,2]){const crown=t.stone(1.5,palette.leaf,x,4.4,-5.8,'ancient-crown');crown.scale.y=.5;}
                for(const x of [-2.2,2.2])t.vine(x,-5.5,3.8);
            }
        }
        const mood=new THREE.PointLight(palette.accent,boss?3.8:2.6,10,2);mood.position.set(0,3.3,-4.2);parent.add(mood);
        parent.userData.theme=room;
        return room;
    }
    return {buildEnvironment,buildRoom};
})();
