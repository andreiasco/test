const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const escapeHTML = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function context(extra = {}) {
    const ctx = vm.createContext({ URL, escapeHTML, console: { error() {} }, ...extra });
    for (const file of ['js/layout/education-config.js', 'js/layout/catalog-pages.js', 'js/layout/education-pages.js', 'js/site/education-resources.js', 'js/admin/education-editors.js']) vm.runInContext(read(file), ctx);
    return ctx;
}
test('all collections have separate tables and routes; informative pages have no editors or tables', () => {
    const ctx = context();
    const collections = vm.runInContext('EDUCATION_COLLECTIONS', ctx);
    const html = vm.runInContext('EDUCATION_PAGES_HTML', ctx);
    assert.equal(collections.length, 11);
    assert.equal(new Set(collections.map(item => item.table)).size, 11);
    const sql = read('supabase/education-resources.sql') + read('supabase/manuale-digitale.sql');
    let active;
    const pages = collections.map(item => ({ id: 'pagina-' + item.key, classList: { toggle(_, enabled) { if (enabled) active = item.key; } } }));
    ctx.document = { querySelectorAll: selector => selector === '.pagina' ? pages : [], getElementById: () => null };
    ctx.window = { location: { hash: '' }, scrollTo() {} };
    vm.runInContext(read('js/init.js').split('window.addEventListener("hashchange"')[0], ctx);
    for (const collection of collections) {
        assert.ok(html.includes(`id="pagina-${collection.key}"`));
        assert.ok(sql.includes('create table if not exists public.' + collection.table));
        for (const field of collection.fields) assert.ok(sql.includes(field.name + ' '));
        active = null; ctx.afiseazaPagina('#' + collection.key); assert.equal(active, collection.key);
    }
    for (const key of ['informatii-adeverinte', 'reguli-publicare']) {
        assert.ok(html.includes(`id="pagina-${key}"`));
        assert.ok(!collections.some(item => item.key === key));
    }
    assert.ok(!html.includes('pagina-materiale-'));
});
test('test pages show duration, score and a collapsed rubric; student practice keeps answers collapsed', () => {
    const ctx = context();
    const tests = vm.runInContext('EDUCATION_COLLECTIONS.find(item => item.key === "teste-bareme")', ctx);
    const html = ctx.educationCard(tests, { title: '<script>bad</script>', duration_minutes: 45, max_score: 10, body: 'Întrebări', rubric: 'Barem', external_url: 'javascript:bad()' });
    assert.match(html, /Durata \(minute\)/); assert.match(html, /Punctaj maxim/);
    assert.match(html, /<details class="education-answer"><summary>Barem/);
    assert.ok(html.includes('&lt;script&gt;')); assert.ok(!html.includes('javascript:'));
    const practice = vm.runInContext('EDUCATION_COLLECTIONS.find(item => item.key === "exercitii-competente")', ctx);
    assert.match(ctx.educationCard(practice, { title: 'Exercițiu', answers: 'Răspuns' }), /<details class="education-answer">/);
});
function fakeForm(values = {}) {
    const controls = Object.fromEntries(['id','title','description','body','grade','sort_order','external_url','published','remove_file','file','evaluation_type','duration_minutes','max_score','rubric','author_credit','creation_type','author_note','subject','publisher','authors'].map(name => [name, { value: values[name] || '', checked: false, disabled: false, files: [] }]));
    const elements = Object.values(controls); elements.namedItem = name => controls[name];
    return { controls, elements, reset() {}, querySelector: () => ({ textContent: '' }) };
}
test('specialized editor collects test fields and rejects invalid durations and missing creation credits', () => {
    const ctx = context();
    const tests = vm.runInContext('EDUCATION_COLLECTIONS.find(item => item.key === "teste-bareme")', ctx);
    const form = fakeForm({ title: 'Test', body: 'Cerințe', duration_minutes: '45', max_score: '10', evaluation_type: 'Inițială', rubric: 'Barem' });
    const { payload } = ctx.colecteazaResursaEducationala(tests, form);
    assert.equal(payload.duration_minutes, 45); assert.equal(payload.max_score, 10); assert.equal(payload.rubric, 'Barem'); assert.equal(payload.published, false);
    form.controls.duration_minutes.value = '-1'; assert.throws(() => ctx.colecteazaResursaEducationala(tests, form), /Durata/);
    const creations = vm.runInContext('EDUCATION_COLLECTIONS.find(item => item.key === "creatii-elevi")', ctx);
    assert.throws(() => ctx.colecteazaResursaEducationala(creations, fakeForm({ title: 'Poezie', body: 'Versuri' })), /autorul/);
});
test('a signed-out visitor cannot request a private resource URL', async () => {
    let login = 0;
    const ctx = context({ afiseazaLogin() { login++; }, supabaseClient: { auth: { getSession: async () => ({ data: { session: null } }) } } });
    vm.runInContext("educationPublished.set('fise-vizuale', [{id:'1',file_path:'private.pdf'}])", ctx);
    const button = { disabled: false, closest: () => ({ querySelector: () => ({ textContent: '' }) }) };
    await ctx.deschideResursaEducationala('fise-vizuale', '1', button);
    assert.equal(login, 1); assert.equal(button.disabled, false);
});

function savingContext(role, failDatabase) {
    const form = fakeForm({ id: '1', title: 'Test', body: 'Cerințe', evaluation_type: 'Inițială' });
    form.controls.file.files = [{ name: 'test.pdf', size: 1000 }];
    const status = { textContent: '', className: '' }, uploads = [], removes = [], writes = [];
    const query = { update(payload) { writes.push(payload); return this; }, eq() { return this; }, select() { return this; }, async single() { return failDatabase ? { error: { message: 'DB unavailable' } } : { data: { id: '1' } }; } };
    const ctx = context({
        document: { querySelector: selector => selector.includes('data-education-form') ? form : status },
        crypto: { randomUUID: () => '11111111-1111-4111-8111-111111111111' },
        obtineRolUtilizator: async () => role,
        supabaseClient: { auth: { getSession: async () => ({ data: { session: { user: { id: 'admin' } } } }) }, from: () => query,
            storage: { from: () => ({ async upload(path) { uploads.push(path); return {}; }, async remove(paths) { removes.push(...paths); return {}; } }) } }
    });
    vm.runInContext("educationAdminData.set('teste-bareme', [{id:'1',file_path:'original.pdf',file_name:'original.pdf'}])", ctx);
    ctx.incarcaEditorEducational = async () => {};
    ctx.incarcaColectieEducationala = async () => {};
    return { ctx, form, status, uploads, removes, writes };
}
test('a failed save removes only the new attachment and keeps the original attached', async () => {
    const { ctx, form, uploads, removes, writes, status } = savingContext('admin', true);
    await ctx.salveazaResursaEducationala('teste-bareme', { preventDefault() {} });
    assert.equal(writes.length, 1); assert.equal(uploads.length, 1);
    assert.deepEqual(removes, uploads); assert.ok(!removes.includes('original.pdf'));
    assert.ok(form.elements.every(control => !control.disabled));
    assert.match(status.textContent, /DB unavailable/);
});
test('a non-admin cannot upload or save content in a dedicated collection', async () => {
    const { ctx, uploads, writes, status } = savingContext('elev', false);
    await ctx.salveazaResursaEducationala('teste-bareme', { preventDefault() {} });
    assert.equal(uploads.length, 0); assert.equal(writes.length, 0);
    assert.match(status.textContent, /administrator/);
});

test('manuals appear between visual library and exam, with a student admin panel and required metadata', () => {
    const ctx = context();
    const categories = vm.runInContext('ALMA_STUDENT_CATEGORIES', ctx);
    assert.ok(categories.indexOf('biblioteca-vizuala') < categories.indexOf('manuale-digitale-catalog'));
    assert.ok(categories.indexOf('manuale-digitale-catalog') < categories.indexOf('evaluarea-nationala'));
    vm.runInContext(read('js/layout/admin-panel/education-editors.js'), ctx);
    vm.runInContext(read('js/layout/admin-panel/shell.js'), ctx);
    assert.ok(vm.runInContext('ADMIN_LIBRARY_NAV.elevi.some(item => item.page === "resurse-manuale-digitale")', ctx));
    const collection = vm.runInContext('EDUCATION_COLLECTIONS.find(item => item.key === "manuale-digitale")', ctx);
    assert.deepEqual(Array.from(collection.grades), [9,10,11,12]);
    const form = fakeForm({ title: 'Manual', grade: '9', subject: 'Matematică', external_url: 'https://example.com/manual' });
    assert.equal(ctx.colecteazaResursaEducationala(collection, form).payload.subject, 'Matematică');
    form.controls.subject.value = '';
    assert.throws(() => ctx.colecteazaResursaEducationala(collection, form), /Materia/);
    form.controls.subject.value = 'Matematică'; form.controls.grade.value = '';
    assert.throws(() => ctx.colecteazaResursaEducationala(collection, form), /clasa/);
    form.controls.grade.value = '8';
    assert.throws(() => ctx.colecteazaResursaEducationala(collection, form), /clasa/);
    form.controls.grade.value = '9'; form.controls.external_url.value = ''; form.controls.body.value = 'Descriere';
    assert.throws(() => ctx.colecteazaResursaEducationala(collection, form), /fișierul manualului/);
    const html = ctx.editorEducationalHTML(collection);
    assert.match(html, /name="subject"[^>]*required/);
    assert.match(html, /name="grade" required/);
});
test('manual sorting is numeric by class and Romanian alphabetical by subject and title; headings escape text', () => {
    const ctx = context();
    const rows = [
        { grade:'10',subject:'Biologie',title:'Liceu' },
        { grade:'9',subject:'Științe',title:'Științe' },
        { grade:'9',subject:'Matematică',title:'Z' },
        { grade:'12',subject:'Comunicare',title:'Clasa XII' },
        { grade:'9',subject:'Matematică',title:'A' }
    ];
    assert.deepEqual(Array.from(ctx.educationSortManuals(rows), row => row.title), ['A','Z','Științe','Liceu','Clasa XII']);
    const collection = vm.runInContext('EDUCATION_COLLECTIONS.find(item => item.key === "manuale-digitale")', ctx);
    const html = ctx.educationManualGroups(collection, [{grade:'9',subject:'<img src=x>',title:'Manual'}]);
    assert.ok(html.includes('&lt;img src=x&gt;')); assert.ok(!html.includes('<img src=x>'));
    const sql = read('supabase/manuale-digitale.sql');
    assert.match(sql, /enable row level security/);
    assert.match(sql, /manuale_digitale_files_read/);
    assert.match(sql, /published and file_path = storage.objects.name/);
});
