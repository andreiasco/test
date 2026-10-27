const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
test('merged 3D engine retains world selection and both particle formats', async () => {
    const ctx = context({ performance: { now: () => 0 } });
    const source = read('js/site/castle-3d.js').replace(
        'return { init, encounter, correct, wrong, nextRoom, victory, gameOver, getRoomName, showMap, skip, dispose };',
        'return { init, getRoomName, testParticles(value, t, motion) { particles = value; updateParticles(t, motion); particles = null; } };'
    );
    vm.runInContext(source, ctx);
    const engine = ctx.window.CastleQuiz3D;
    for (const world of ['castle', 'snow', 'desert', 'jungle', 'unknown']) {
        await engine.init(null, world);
        assert.equal(engine.getRoomName(0), ctx.quizWorldRoom(world, 0).name);
    }
    const flake = { position: { y: 3 }, userData: { snow: true, phase: 0 } };
    engine.testParticles({ children: [flake] }, 2, 1);
    assert.ok(flake.position.y < 3);
    const y = flake.position.y;
    engine.testParticles({ children: [flake] }, 3, 0);
    assert.equal(flake.position.y, y);
    const positions = { count: 1, setX(i, value) { this.x = value; }, setY(i, value) { this.y = value; } };
    engine.testParticles({ isPoints: true, geometry: { getAttribute: () => positions }, userData: { basePositions: [1, 2, 3] } }, 0, 1);
    assert.equal(positions.x, 1.025);
    assert.equal(positions.y, 2);
    assert.equal(positions.needsUpdate, true);
    assert.match(source, /if \(currentWorld === 'castle'\) buildCastle\(\);\s*else\s*\{[\s\S]*?QuizWorldScenery\.buildEnvironment/);
    for (const file of ['index.html', 'admin.html']) {
        const html = read(file);
        const scenery = html.indexOf('src="js/site/quiz-world-scenery.js"');
        assert.ok(scenery >= 0 && scenery < html.indexOf('src="js/site/castle-3d.js"'), file);
    }
});
function context(extra = {}) {
    const ctx = vm.createContext({ window: {}, ...extra });
    vm.runInContext(read('js/layout/quiz-worlds.js'), ctx);
    return ctx;
}
test('all four worlds have distinct room cycles and final rooms; unknown legacy values use the castle', () => {
    const ctx = context();
    for (const world of ['castle','snow','desert','jungle']) {
        const meta = ctx.quizWorldMeta(world);
        assert.ok(meta.rooms.length >= 4);
        assert.equal(new Set(meta.rooms.map(room => room.id)).size, meta.rooms.length);
        assert.equal(ctx.quizWorldRoom(world, meta.rooms.length).id, meta.rooms[0].id);
        assert.equal(ctx.quizWorldRoom(world, 0, true).id, meta.boss.id);
    }
    assert.equal(ctx.normalizeQuizWorld(undefined), 'castle');
    assert.equal(ctx.normalizeQuizWorld('__proto__'), 'castle');
    assert.equal(ctx.quizWorldRoom('castle', 0).name, 'Biblioteca blestemată');
});
test('question normalization retains the selected visual world without changing the question type', () => {
    const ctx = context(); vm.runInContext(read('js/site/quiz.js'), ctx);
    const quiz = { game_mode: 'castle_choice', questions: [{ text: 'Întrebare', answers: ['A','B'], correctIndex: 1 }] };
    for (const world of ['castle','snow','desert','jungle']) {
        const normalized = ctx.normalizeazaQuiz({ ...quiz, world_theme: world });
        assert.equal(normalized.world_theme, world);
        assert.equal(normalized.questions[0].type, 'multiple_choice');
        assert.equal(normalized.questions[0].correctIndex, 1);
    }
    assert.equal(ctx.normalizeazaQuiz(quiz).world_theme, 'castle');
});
test('legacy schema reads fall back only for the missing world column', async () => {
    const ctx = context(); let calls = 0;
    const result = await ctx.incarcaQuizuriCuNivel(async columns => {
        calls++;
        return columns.includes('world_theme') ? { error: { code: '42703', message: 'column world_theme does not exist' } } : { data: [{ id: 1 }] };
    });
    assert.equal(calls, 2); assert.equal(result.data[0].id, 1);
    calls = 0;
    await ctx.incarcaQuizuriCuNivel(async () => { calls++; return { error: { code: '42501', message: 'permission denied' } }; });
    assert.equal(calls, 1);
});
function editor() {
    const fields = Object.fromEntries(['quizTitlu','quizEditId','quizDescriere','quizClasa','quizDificultate','quizTimp','quizPublicat','quizGameMode','quizWorldTheme','quizWorldDescription','quizWorldRooms','quizQuestionsEditor','anuleazaEditareQuiz'].map(id => [id, { value: '', checked: false, innerHTML: '', textContent: '', classList: { remove() {} } }]));
    Object.assign(fields.quizTitlu, { value: 'Test' }); Object.assign(fields.quizGameMode, { value: 'castle_choice' });
    const ctx = context({ document: { getElementById: id => fields[id] || null, querySelectorAll: () => [] } });
    vm.runInContext(read('js/layout/catalog-pages.js'), ctx);
    vm.runInContext(read('js/admin/quiz-manage.js'), ctx);
    ctx.colecteazaIntrebariQuizAdmin = () => [{ type: 'multiple_choice', text: 'Întrebare', answers: ['A','B'], correctIndex: 0 }];
    return {ctx,fields};
}
test('changing the visual level retains questions and editor payload includes the level', () => {
    const {ctx,fields} = editor(); fields.quizQuestionsEditor.innerHTML = 'existing-questions';
    fields.quizWorldTheme.value = 'snow'; ctx.actualizeazaNivelQuizAdmin();
    assert.match(fields.quizWorldDescription.textContent, /gheață/);
    assert.equal(fields.quizQuestionsEditor.innerHTML, 'existing-questions');
    assert.equal(ctx.construiesteQuizDinFormular().world_theme, 'snow');
    assert.equal(ctx.construiesteQuizDinFormular().questions.length, 1);
});
test('editing and saving an existing quiz restores and persists its visual world', async () => {
    const {ctx,fields} = editor();
    vm.runInContext("quizAdminData = [{id:12,title:'Jungla',world_theme:'jungle',questions:[{text:'Întrebare'}]}]", ctx);
    ctx.seteazaModQuizAdmin = () => {};
    ctx.adaugaEditorIntrebareQuiz = () => {};
    ctx.afiseazaMesajQuizAdmin = () => {};
    ctx.editeazaQuizAdmin(12);
    assert.equal(fields.quizWorldTheme.value, 'jungle');
    assert.match(fields.quizWorldRooms.innerHTML, /cascad/);
    let saved;
    ctx.utilizatorAutentificat = async () => ({ id: 'admin' });
    ctx.supabaseClient = { from: () => ({ update(payload) { saved = payload; return { eq: async () => ({ error: null }) }; } }) };
    ctx.reseteazaFormularQuizAdmin = () => {};
    ctx.incarcaQuizuriAdmin = async () => {};
    await ctx.salveazaQuizAdmin({ preventDefault() {} });
    assert.equal(saved.world_theme, 'jungle');
    assert.equal(saved.questions[0].text, 'Întrebare');
});

// Geometry smoke tests: run every procedural room using the Three.js object contract.
function fakeThree() {
    class Vector { set(x,y,z) { Object.assign(this,{x,y,z}); return this; } }
    class Group {
        constructor() { this.children=[];this.position=new Vector();this.rotation=new Vector();this.scale=new Vector();this.userData={};this.shadow={mapSize:{set(){}}}; }
        add(...objects) { this.children.push(...objects); }
        getObjectByName(name) { if(this.name===name)return this; for(const child of this.children){const found=child.getObjectByName?.(name);if(found)return found;} }
        traverse(fn) { fn(this);this.children.forEach(child=>child.traverse(fn)); }
    }
    class Mesh extends Group { constructor(geometry,material){super();this.geometry=geometry;this.material=material;} }
    class Geometry { constructor(...args){this.args=args;} }
    class Material { constructor(options){Object.assign(this,options);} }
    return { Group,Mesh,BoxGeometry:Geometry,ConeGeometry:Geometry,CylinderGeometry:Geometry,DodecahedronGeometry:Geometry,SphereGeometry:Geometry,TorusGeometry:Geometry,MeshStandardMaterial:Material,MeshBasicMaterial:Material,HemisphereLight:Group,DirectionalLight:Group,PointLight:Group,Color:Geometry,FogExp2:Geometry };
}
test('snow, desert and jungle build gateways, weather and distinct themed rooms including the boss', () => {
    const ctx=context(); vm.runInContext(read('js/site/quiz-world-scenery.js'),ctx);
    const THREE=fakeThree();
    const makeMesh=(geometry,material,x,y,z)=>{const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);return mesh;};
    const mat=color=>new THREE.MeshStandardMaterial({color});
    const signatures=new Set();
    for(const world of ['snow','desert','jungle']) {
        const scene=new THREE.Group();
        const environment=ctx.window.QuizWorldScenery.buildEnvironment({THREE,scene,world,makeMesh,mat});
        assert.ok(environment.door.getObjectByName('doorLeaf'));
        assert.equal(environment.particles.children.length,42);
        const rooms=ctx.quizWorldMeta(world).rooms;
        for(let index=0;index<=rooms.length;index++) {
            const parent=new THREE.Group(),boss=index===rooms.length;
            ctx.window.QuizWorldScenery.buildRoom({THREE,scene,world,parent,index,boss,makeMesh,mat});
            assert.equal(parent.name,world+'-'+ctx.quizWorldRoom(world,index,boss).id);
            assert.ok(parent.children.length>5);
            signatures.add(parent.children.map(child=>child.name||'light').sort().join('|'));
        }
    }
    assert.equal(signatures.size,15,'rooms must differ in their props, not just their colours');
});

test('admin preview moves the existing player outside the hidden main and restores it on close', () => {
    const classes = () => ({ remove() {}, add() {} });
    const parent = { insertBefore(node) { node.parentNode=this; } };
    const player = { parentNode: parent, nextSibling: null };
    const focus = { restored: false, focus() { this.restored=true; } };
    const modal = { classList: classes(), focus() {} };
    const content = { appendChild(node) { node.parentNode=this; } };
    const document = { activeElement: focus, body: { style: { overflow: '' } }, getElementById: id => ({quizPlayer:player,adminQuizPreview:modal,adminQuizPreviewContent:content})[id] };
    const ctx=context({document});vm.runInContext(read('js/site/quiz.js'),ctx);
    ctx.deschideContainerQuizPreview();
    assert.equal(player.parentNode,content);assert.equal(document.body.style.overflow,'hidden');
    ctx.inchideContainerQuizPreview();
    assert.equal(player.parentNode,parent);assert.equal(document.body.style.overflow,'');assert.ok(focus.restored);
});

test('demo SQL contains all 12 world/mode combinations and 60 playable questions', () => {
    const sql = read('supabase/quiz-worlds-test-data.sql');
    const match = sql.match(/\$quiz_demo\$\s*([\s\S]*?)\s*\$quiz_demo\$::jsonb/);
    assert.ok(match);
    const records = JSON.parse(match[1]);
    assert.equal(records.length, 12);
    const ctx = context(); vm.runInContext(read('js/site/quiz.js'), ctx);
    const combinations = new Set();
    for (const row of records) {
        const normalized = ctx.normalizeazaQuiz(row);
        assert.equal(normalized.questions.length, 5, row.title);
        assert.equal(normalized.world_theme, row.world_theme);
        assert.equal(normalized.questions.filter(question => question.boss).length, 1);
        assert.equal(normalized.questions[4].boss, true);
        assert.ok(row.title.startsWith('[TEST]'));
        combinations.add(row.world_theme + '/' + row.game_mode);
    }
    for (const world of ['snow','desert','jungle']) for (const mode of ['castle_choice','castle_true_false','castle_hangman','castle_ordering']) assert.ok(combinations.has(world + '/' + mode));
});
