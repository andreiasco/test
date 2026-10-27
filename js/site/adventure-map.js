// A reusable trail map. Coordinates stay canonical while the engine rebases root.
window.CastleQuizAdventureMap = (() => {
    const palettes = {
        castle: { land: 0x687b51, edge: 0x665848, road: 0xb6a17e, line: 0xe0cd9d, stone: 0x9b9f91, leaf: 0x3f6549, wood: 0x65503b, water: 0x447c87, sky: 0x263c43 },
        snow: { land: 0xc5dce0, edge: 0x637d8d, road: 0x91b4c0, line: 0xe9f2df, stone: 0x83abbc, leaf: 0x375a62, wood: 0x5b6260, water: 0x4d96b1, sky: 0x224457 },
        desert: { land: 0xc0a16c, edge: 0x8c6847, road: 0x96724c, line: 0xf0d8a1, stone: 0xa5815d, leaf: 0x657c4d, wood: 0x735037, water: 0x4c9290, sky: 0x534238 },
        jungle: { land: 0x466747, edge: 0x4b4937, road: 0x957e51, line: 0xcabf83, stone: 0x7c8870, leaf: 0x28613c, wood: 0x55412e, water: 0x377d76, sky: 0x203f37 }
    };
    function create({ THREE, parent, world = "castle", questions = [], lowDetail = false, surface, mergeGeometries }) {
        const palette = palettes[world] || palettes.castle;
        const count = Math.max(1, Array.isArray(questions) ? questions.length : 1);
        const root = new THREE.Group(); root.name = "adventure-map"; parent?.add(root);
        const nodes = Array.from({ length: count }, (_, index) => new THREE.Vector3(index ? (index % 2 ? 4.4 : -4.4) : 0, 0, -index * 12));
        const arrival = index => nodes[index].clone().add(new THREE.Vector3(-0.65, 0, -0.2));
        const spawn = arrival(0).add(new THREE.Vector3(0, 0, 7.2));
        const paths = nodes.map((node, index) => {
            const from = index ? arrival(index - 1) : spawn.clone(), to = arrival(index);
            const points = index ? [from, from.clone().add(new THREE.Vector3(0, 0, -3)), new THREE.Vector3((from.x + to.x) / 2, 0, (from.z + to.z) / 2), to.clone().add(new THREE.Vector3(0, 0, 3)), to] : [from, from.clone().lerp(to, 0.5), to];
            const curve = new THREE.CatmullRomCurve3(points, false, "centripetal"); curve.arcLengthDivisions = 160;
            return curve;
        });
        const bounds = new THREE.Box3(new THREE.Vector3(-13, -1.5, nodes.at(-1).z - 11), new THREE.Vector3(13, 6.5, 12));
        const center = bounds.getCenter(new THREE.Vector3()), extent = bounds.getSize(new THREE.Vector3());
        const materials = new Map(), batches = new Map();
        function material(name, color, options = {}) {
            if (!materials.has(name)) materials.set(name, new THREE.MeshStandardMaterial({ color, roughness: 0.92, ...options }));
            return materials.get(name);
        }
        const land = material("map-earth", palette.land), edge = material("map-edge", palette.edge);
        const road = material("map-road", palette.road), line = material("map-road-edge", palette.line);
        const stone = material("map-stone", palette.stone), leaf = material("map-leaf", palette.leaf);
        const wood = material("map-wood", palette.wood), water = material("map-water", palette.water, { roughness: 0.42, metalness: 0.12 });
        const gold = material("map-gold", 0xc6a96b, { metalness: 0.32, roughness: 0.55, side: THREE.DoubleSide });
        const label = material("map-number", 0xffedb6, { emissive: 0x8e713e, emissiveIntensity: 0.18 });
        const red = material("map-banner", 0x9f493e, { side: THREE.DoubleSide });
        if (surface && world === "castle") {
            const textured = surface("floor", 0xc2b596);
            if (textured) { materials.get("map-road").dispose(); materials.set("map-road", textured); }
        }
        function mesh(geometry, mat, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0], owner = root) {
            const result = new THREE.Mesh(geometry, mat); result.position.fromArray(position); result.scale.fromArray(scale); result.rotation.set(...rotation);
            result.receiveShadow = true; result.castShadow = true; owner.add(result); return result;
        }
        function add(geometry, mat, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0]) {
            const transform = new THREE.Object3D(); transform.position.fromArray(position); transform.scale.fromArray(scale); transform.rotation.set(...rotation); transform.updateMatrix();
            const prepared = geometry.index ? geometry.toNonIndexed() : geometry.clone(); geometry.dispose(); prepared.applyMatrix4(transform.matrix);
            if (!prepared.getAttribute("normal")) prepared.computeVertexNormals();
            if (!prepared.getAttribute("uv")) prepared.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(prepared.getAttribute("position").count * 2), 2));
            for (const name of Object.keys(prepared.attributes)) if (!["position", "normal", "uv"].includes(name)) prepared.deleteAttribute(name);
            if (!batches.has(mat)) batches.set(mat, []); batches.get(mat).push(prepared);
        }
        const box = (size, mat, position, rotation) => add(new THREE.BoxGeometry(...size), mat, position, [1, 1, 1], rotation);
        const rock = (radius, mat, position, scale = [1, 1, 1]) => add(new THREE.DodecahedronGeometry(radius, 0), mat, position, scale);
        const cylinder = (radius, height, mat, position) => add(new THREE.CylinderGeometry(radius, radius * 1.12, height, lowDetail ? 7 : 10), mat, position);
        const ground = mesh(new THREE.PlaneGeometry(extent.x, extent.z), land, [center.x, 0, center.z], [1, 1, 1], [-Math.PI / 2, 0, 0]);
        ground.name = "map-ground";
        const foundation = mesh(new THREE.BoxGeometry(extent.x, 1.1, extent.z), edge, [center.x, -0.57, center.z]); foundation.castShadow = false;
        // The dark water lip and inset terrain give the route the silhouette of a map island.
        mesh(new THREE.BoxGeometry(extent.x + 1.1, 0.12, extent.z + 1.1), water, [center.x, -1.18, center.z]).castShadow = false;

        function ribbon(curve, width, y, mat, offset = 0) {
            const steps = Math.max(12, Math.ceil(curve.getLength() * (lowDetail ? 1.4 : 2)));
            const positions = [], uv = [], indices = [];
            for (let i = 0; i <= steps; i++) {
                const t = i / steps, point = curve.getPointAt(t), tangent = curve.getTangentAt(t);
                const side = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize(); point.addScaledVector(side, offset);
                for (const sign of [1, -1]) { const vertex = point.clone().addScaledVector(side, sign * width / 2); positions.push(vertex.x, y, vertex.z); uv.push(sign > 0 ? 0 : 1, t * curve.getLength() / 2.4); }
                if (i < steps) { const a = i * 2, b = a + 2; indices.push(a, a + 1, b, a + 1, b + 1, b); }
            }
            const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
            add(geometry, mat);
        }
        for (const path of paths) { ribbon(path, 2.4, 0.012, materials.get("map-road")); ribbon(path, 0.12, 0.016, line, -1.2); ribbon(path, 0.12, 0.016, line, 1.2); }

        const checkpointMaterial = material("map-checkpoints", 0xffffff, { roughness: 0.82 });
        const checkpoints = new THREE.InstancedMesh(new THREE.CylinderGeometry(2.25, 2.25, 0.018, lowDetail ? 16 : 24), checkpointMaterial, count);
        checkpoints.name = "encounter-pads"; checkpoints.receiveShadow = true; root.add(checkpoints);
        const transform = new THREE.Object3D(), status = Array(count).fill("pending");
        nodes.forEach((node, index) => {
            transform.position.set(node.x, 0.006, node.z - 1.75); transform.updateMatrix(); checkpoints.setMatrixAt(index, transform.matrix); checkpoints.setColorAt(index, new THREE.Color(index === count - 1 ? 0x96714f : 0x8e9577));
        });
        const digitSegments = { 0:"abcedf", 1:"bc", 2:"abged", 3:"abgcd", 4:"fgbc", 5:"afgcd", 6:"afgecd", 7:"abc", 8:"abcdefg", 9:"abfgcd" };
        const segmentShape = { a:[0,0.34,0.37,0.075], b:[0.2,0.17,0.075,0.30], c:[0.2,-0.17,0.075,0.30], d:[0,-0.34,0.37,0.075], e:[-0.2,-0.17,0.075,0.30], f:[-0.2,0.17,0.075,0.30], g:[0,0,0.37,0.075] };
        function number(value, x, z) {
            const text = String(value);
            [...text].forEach((digit, i) => {
                for (const segment of digitSegments[digit] || "") {
                    const [sx, sy, width, height] = segmentShape[segment];
                    box([width, 0.035, height], label, [x + (i - (text.length - 1) / 2) * 0.58 + sx, 0.075, z - sy]);
                }
            });
        }
        nodes.forEach((node, index) => {
            cylinder(0.7, 0.08, stone, [node.x + 2.9, 0.035, node.z - 1.8]); number(index + 1, node.x + 2.9, node.z - 1.8);
            // Short banners make stops recognizable even when their numbers are small.
            cylinder(0.045, 1.65, wood, [node.x + 3.7, 0.82, node.z - 1.9]);
            const flag = new THREE.BufferGeometry(); flag.setAttribute("position", new THREE.Float32BufferAttribute([0,0,0,0.72,-0.15,0,0,-0.5,0], 3)); flag.computeVertexNormals();
            add(flag, index === count - 1 ? red : gold, [node.x + 3.7, 1.6, node.z - 1.9]);
        });

        function pine(x, z, scale = 1) {
            cylinder(0.13 * scale, 1.4 * scale, wood, [x, 0.7 * scale, z]);
            for (let level = 0; level < 3; level++) add(new THREE.ConeGeometry((0.8 - level * 0.14) * scale, 1.35 * scale, lowDetail ? 6 : 9), leaf, [x, (1.3 + level * 0.56) * scale, z]);
            if (world === "snow") for (let level = 0; level < 3; level++) add(new THREE.ConeGeometry((0.7 - level * 0.13) * scale, 0.58 * scale, 7), land, [x, (1.65 + level * 0.56) * scale, z]);
        }
        function leafyTree(x, z, scale = 1) {
            cylinder(0.16 * scale, 2.2 * scale, wood, [x, 1.1 * scale, z]);
            for (let i = 0; i < 3; i++) rock(0.95 * scale, leaf, [x + (i - 1) * 0.55 * scale, (2.4 + (i % 2) * 0.35) * scale, z], [1.2, 0.85, 1]);
        }
        function palm(x, z) {
            cylinder(0.13, 2.2, wood, [x, 1.1, z]);
            for (let i = 0; i < 6; i++) add(new THREE.ConeGeometry(0.22, 1.7, 6), leaf, [x, 2.2, z], [1, 1, 1], [0.1, i * Math.PI / 3, 1.1]);
        }
        function tower(x, z, height = 2.6) {
            cylinder(0.68, height, stone, [x, height / 2, z]);
            cylinder(0.83, 0.2, stone, [x, height + 0.08, z]);
            for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; box([0.30,0.4,0.30], stone, [x + Math.cos(a) * 0.63, height + 0.35, z + Math.sin(a) * 0.63]); }
        }
        nodes.forEach((node, index) => {
            for (const side of [-1, 1]) {
                const x = side * (8.4 + (index % 2) * 0.4), z = node.z - 1.5;
                rock(0.6, stone, [x + side, 0.4, z + 2], [1.2, 0.8, 1.1]);
                if (world === "desert") {
                    if (index % 2) palm(x, z); else { cylinder(0.19, 1.5, leaf, [x, 0.75, z]); box([0.75,0.15,0.2], leaf, [x, 0.95, z]); }
                    rock(1.2, land, [x + side, 0.23, z - 2.6], [1.7, 0.35, 1.2]);
                } else if (world === "snow") { pine(x, z, 0.95); rock(1.1, stone, [x + side * 1.5, 0.6, z - 3], [0.8, 1.5, 0.9]); }
                else if (world === "jungle") { leafyTree(x, z, 1.15); leafyTree(x + side * 1.8, z - 4, 0.85); }
                else { pine(x, z, 0.9); if (index % 3 === 1) tower(x + side * 1.6, z - 3.5, 2.2); }
            }
        });
        // Start gate and final landmark sit outside the combat areas.
        for (const side of [-1, 1]) {
            const x = spawn.x + side * 1.9;
            if (world === "castle") tower(x, spawn.z + 1, 2.8);
            else box([0.55,2.6,0.65], stone, [x, 1.3, spawn.z + 1]);
        }
        box([4.5,0.45,0.7], stone, [spawn.x, 2.7, spawn.z + 1]);
        const last = nodes.at(-1);
        for (const side of [-1, 1]) {
            if (world === "castle") tower(last.x + side * 2.3, last.z - 7.8, 4.0);
            else if (world === "snow") add(new THREE.ConeGeometry(0.9, 4.5, 5), stone, [last.x + side * 2.8, 2.25, last.z - 7.5]);
            else if (world === "desert") { box([0.7,3.6,0.7], stone, [last.x + side * 2.3, 1.8, last.z - 7.5]); add(new THREE.ConeGeometry(0.58,0.8,4), gold, [last.x + side * 2.3,4,last.z-7.5]); }
            else leafyTree(last.x + side * 2.7, last.z - 8, 1.8);
        }
        if (world === "castle") box([4.6,2.8,0.7], stone, [last.x,1.4,last.z-8]);
        if (world === "desert") add(new THREE.TorusGeometry(1.05,0.1,6,lowDetail?16:24), gold, [last.x,2.5,last.z-8]);

        // Small silhouettes preview future foes without loading fifty full rigs.
        const previewMaterial = material("map-foes", 0xffffff, { vertexColors: true, roughness: 0.84 });
        const previewCache = new Map();
        function previewGeometry(type) {
            if (previewCache.has(type)) return previewCache.get(type);
            const pieces = [];
            function part(geometry, color, position, scale = [1,1,1], rotation = [0,0,0]) {
                const obj = new THREE.Object3D(); obj.position.fromArray(position); obj.scale.fromArray(scale); obj.rotation.set(...rotation); obj.updateMatrix();
                const data = geometry.index ? geometry.toNonIndexed() : geometry.clone(); geometry.dispose(); data.applyMatrix4(obj.matrix);
                if (!data.getAttribute("normal")) data.computeVertexNormals();
                const c = new THREE.Color(color), colors = new Float32Array(data.getAttribute("position").count * 3);
                for (let i=0;i<colors.length;i+=3) { colors[i]=c.r; colors[i+1]=c.g; colors[i+2]=c.b; }
                data.setAttribute("color",new THREE.BufferAttribute(colors,3));
                if (!data.getAttribute("uv")) data.setAttribute("uv",new THREE.BufferAttribute(new Float32Array(data.getAttribute("position").count*2),2));
                for(const name of Object.keys(data.attributes))if(!["position","normal","color","uv"].includes(name))data.deleteAttribute(name);
                pieces.push(data);
            }
            const colors = { goblin:0x6f8251,skeleton:0xd2c9a8,knight:0x7b8994,golem:0x747d6a,wizard:0x6c537e,demon:0x8b4d3e,ghost:0xbdcec8,bat:0x65514b,spider:0x55483d,dragon:0x92563b };
            const color = colors[type] || colors.goblin;
            if (type === "spider") {
                part(new THREE.SphereGeometry(1,7,5),color,[0,0.52,0],[0.42,0.3,0.5]);
                for(const side of[-1,1])for(let i=0;i<4;i++)part(new THREE.CylinderGeometry(.035,.06,.95,5),color,[side*.58,.43,(i-1.5)*.27],[1,1,1],[0,0,side*.8]);
            } else if (type === "bat" || type === "dragon") {
                const scale=type==="dragon"?1.45:1;
                part(new THREE.SphereGeometry(1,7,5),color,[0,.95*scale,0],[.25*scale,.47*scale,.32*scale]);
                part(new THREE.SphereGeometry(.24,7,5),color,[0,1.35*scale,.24*scale]);
                for(const side of[-1,1])part(new THREE.ConeGeometry(.45,1.5,3),color,[side*.8*scale,1.3*scale,-.03],[scale,.5*scale,.2*scale],[0,0,side*-Math.PI/2]);
            } else {
                part(new THREE.CapsuleGeometry(.24,.66,3,6),color,[0,1.0,0]);
                part(new THREE.SphereGeometry(.25,7,5),color,[0,1.7,0]);
                for(const side of[-1,1]){part(new THREE.CylinderGeometry(.07,.1,.65,5),color,[side*.36,.95,0],[1,1,1],[0,0,side*.12]);part(new THREE.CylinderGeometry(.08,.1,.65,5),color,[side*.13,.32,0]);}
                if(type==="wizard")part(new THREE.ConeGeometry(.31,.55,6),color,[0,2.05,0]);
                if(type==="demon"||type==="goblin")for(const side of[-1,1])part(new THREE.ConeGeometry(.07,.35,5),0xd9c7a1,[side*.19,1.99,0],[1,1,1],[0,0,side*-.28]);
            }
            const combined = merge(pieces); pieces.forEach(piece=>piece.dispose()); previewCache.set(type,combined); return combined;
        }
        const previews = nodes.map((node,index)=>{
            const boss=index===count-1||Boolean(questions[index]?.boss),type=boss?"dragon":String(questions[index]?.monster||"goblin");
            const preview=mesh(previewGeometry(type),previewMaterial,[node.x,0,node.z-3.55]);preview.castShadow=false;preview.name=`map-foe-${index}`;return preview;
        });
        function merge(parts) {
            if (typeof mergeGeometries === "function") return mergeGeometries(parts, false);
            const result = new THREE.BufferGeometry();
            for(const name of Object.keys(parts[0].attributes)){
                const attributes=parts.map(part=>part.getAttribute(name)),size=attributes[0].itemSize;
                const array=new Float32Array(attributes.reduce((sum,attribute)=>sum+attribute.array.length,0));let offset=0;
                attributes.forEach(attribute=>{array.set(attribute.array,offset);offset+=attribute.array.length;});result.setAttribute(name,new THREE.BufferAttribute(array,size));
            }
            return result;
        }
        for(const [mat,parts]of batches){const combined=merge(parts);parts.forEach(part=>part.dispose());if(combined)mesh(combined,mat).name="map-detail-batch";}

        const ambient = new THREE.HemisphereLight(world === "desert" ? 0xffe7bf : 0xc5e2e9, palette.edge, 1.7); root.add(ambient);
        const sun = new THREE.DirectionalLight(world === "jungle" ? 0xd9edc7 : 0xffe2b7, 2.25); sun.castShadow=true;
        sun.shadow.mapSize.set(lowDetail?512:1024,lowDetail?512:1024);Object.assign(sun.shadow.camera,{left:-10,right:10,top:11,bottom:-11,near:.5,far:36});
        sun.shadow.bias=-.0002;sun.shadow.normalBias=.035;root.add(sun,sun.target);
        function focus(point){sun.position.copy(point).add(new THREE.Vector3(5,11,6));sun.target.position.copy(point);sun.target.updateWorldMatrix(true,false);}
        focus(nodes[0]);
        function mark(index, value) {
            if(!nodes[index])return;
            if(value==="won")value="cleared";
            status[index]=["active","cleared","passed","failed","pending"].includes(value)?value:"pending";
            const color={active:0xd5b66d,cleared:0x74a581,passed:0xac945e,failed:0xac735d,pending:index===count-1?0x96714f:0x8e9577}[status[index]];
            checkpoints.setColorAt(index,new THREE.Color(color));checkpoints.instanceColor.needsUpdate=true;
            previews[index].visible=status[index]==="pending";
        }
        function getOverview(aspect = 1.5, index = 0, origin = new THREE.Vector3()) {
            const current = Math.min(count - 1, Math.max(0, Math.floor(Number(index) || 0)));
            // Long adventures show a nearby stretch so the knight stays readable.
            const selected = count <= 5 ? nodes : nodes.slice(Math.max(0,current-1),Math.min(count,current+3));
            const view = new THREE.Box3(
                new THREE.Vector3(bounds.min.x, bounds.min.y, selected.at(-1).z - 11),
                new THREE.Vector3(bounds.max.x, bounds.max.y, selected[0].z + (selected[0] === nodes[0] ? 12 : 7))
            );
            const target = view.getCenter(new THREE.Vector3()); target.y = 0.4;
            const direction = new THREE.Vector3(0.43, 0.89, 0.82).normalize();
            const right = new THREE.Vector3(direction.z, 0, -direction.x).normalize();
            const up = new THREE.Vector3().crossVectors(direction, right);
            const halfFov = Math.tan(48 * Math.PI / 360), safeAspect = Math.max(0.4, Number(aspect) || 1.5);
            let distance = 17;
            // Fit corners in camera space: an oblique view turns route length into
            // horizontal spread too, especially on phones. Include the start gate,
            // island edges and final landmark, not only the numbered floor pads.
            for (const x of [view.min.x, view.max.x]) for (const y of [view.min.y, view.max.y]) for (const z of [view.min.z, view.max.z]) {
                const delta = new THREE.Vector3(x, y, z).sub(target), depth = delta.dot(direction);
                distance = Math.max(distance, depth + Math.abs(delta.dot(right)) / (halfFov * safeAspect * 0.9), depth + Math.abs(delta.dot(up)) / (halfFov * 0.9));
            }
            const position = target.clone().addScaledVector(direction, distance);
            return{position:position.sub(origin),target:target.sub(origin)};
        }
        root.userData.mapWorld=world;root.userData.mapCount=count;
        return {root,nodes,spawn,paths,bounds,ground,mark,getOverview,focus,status,previews,palette};
    }
    return { create };
})();
