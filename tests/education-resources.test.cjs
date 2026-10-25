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
    assert.equal(collections.length, 10);
    assert.equal(new Set(collections.map(item => item.table)).size, 10);
    const sql = read('supabase/education-resources.sql');
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
    const controls = Object.fromEntries(['id','title','description','body','grade','sort_order','external_url','published','remove_file','file','evaluation_type','duration_minutes','max_score','rubric','author_credit','creation_type','author_note'].map(name => [name, { value: values[name] || '', checked: false, disabled: false, files: [] }]));
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
test('cleanup targets only the old catalog schema, refuses nonempty buckets and never deletes storage objects directly', () => {
    const sql = read('supabase/remove-old-catalog-materials.sql');
    assert.match(sql, /drop table if exists public\.catalog_materials;/);
    assert.match(sql, /raise exception/);
    assert.ok(!/delete from storage\.objects/i.test(sql));
    assert.ok(!/drop table[^;]*edu_/i.test(sql));
    assert.ok(!/drop table[^;]*(autori|opere|quizzes|reviste)/i.test(sql));
    assert.ok(!/drop[^;]*cascade/i.test(sql));
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
