const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

function renderLayout() {
    const scripts = [...read('index.html').matchAll(/<script src="(js\/layout\/[^"]+)"/g)].map(m => m[1]);
    const context = vm.createContext({ estePaginaAdmin: false });
    scripts.forEach(file => vm.runInContext(read(file), context, { filename: file }));
    const html = vm.runInContext('[NAV_HTML, HOME_HTML, ALMA_HUBS_HTML, EDUCATION_PAGES_HTML, LANGUAGE_HTML, LITERATURE_HTML, MAP_HTML, QUIZ_HTML, MAGAZINE_HTML, ADMIN_PANEL_HTML, LOGIN_MODAL_HTML, PDF_MODAL_HTML, AUTHOR_MODAL_HTML, AI_ASSISTANT_HTML, FOOTER_HTML].join("")', context);
    return { context, html };
}

test('assembled navigation has unique IDs and all static link destinations exist', () => {
    const { html } = renderLayout();
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, 'duplicate IDs in assembled layout');
    for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) {
        // These four anchors are rendered from Supabase class records by language.js.
        if (/^limba-clasa-[5-8]$/.test(target)) continue;
        assert.ok(ids.includes(target), `missing destination: ${target}`);
    }
});

test('new hubs and original libraries each select exactly one correct page', () => {
    const { context, html } = renderLayout();
    let active = [];
    const pages = [...html.matchAll(/\bid="(pagina-[^"]+)"/g)].map(([, id]) => ({ id, classList: { toggle(name, enabled) { if (enabled) active.push(id); } } }));
    context.document = { querySelectorAll: selector => selector === '.pagina' ? pages : [], getElementById: () => null };
    context.window = { location: { hash: '' }, scrollTo() {}, requestAnimationFrame(fn) { fn(); } };
    vm.runInContext(read('js/init.js').split('window.addEventListener("hashchange"')[0], context);
    const expected = {
        acasa: 'pagina-acasa', elevi: 'pagina-elevi', profesori: 'pagina-profesori',
        'scoala-altfel': 'pagina-scoala-altfel', jocuri: 'pagina-quiz',
        'profesor-ai': 'pagina-profesor-ai', abonamente: 'pagina-abonamente',
        ajutor: 'pagina-ajutor', contact: 'pagina-contact', literatura: 'pagina-literatura',
        limba: 'pagina-limba', harta: 'pagina-harta', revista: 'pagina-revista', quiz: 'pagina-quiz', carti: 'pagina-carti',
        'biblioteca-vizuala': 'pagina-elevi', 'analiza-diagnoza': 'pagina-profesori',
        'numere-publicate': 'pagina-numere-publicate', 'limba-clasa-8': 'pagina-limba'
    };
    for (const [route, page] of Object.entries(expected)) {
        active = [];
        context.afiseazaPagina(`#${route}`);
        assert.deepEqual(active, [page], `incorrect page for #${route}`);
    }
});

test('both entry points load local assets and catalog before dependent layouts', () => {
    for (const file of ['index.html', 'admin.html']) {
        const html = read(file);
        assert.ok(html.indexOf('js/layout/catalog-pages.js') < html.indexOf('js/layout/home.js'));
        for (const [, asset] of html.matchAll(/(?:src|href)="((?:js|css|assets)\/[^"]+)"/g)) {
            assert.ok(fs.existsSync(path.join(root, asset)), `missing asset: ${asset}`);
        }
    }
    assert.ok(fs.statSync(path.join(root, 'assets/edu-alma-emblem.png')).size > 0);
});

test('signed-out visitors can browse games but starting an adventure still prompts login', async () => {
    let loginPrompts = 0;
    const hidden = new Set(['pagina-quiz', 'quizNavLink']);
    const context = vm.createContext({
        document: { getElementById: id => ({ classList: { remove: name => { if (name === 'ascuns') hidden.delete(id); } } }) },
        supabaseClient: { auth: { getSession: async () => ({ data: { session: null } }) } },
        afiseazaLogin: () => { loginPrompts++; }
    });
    vm.runInContext(read('js/site/quiz.js'), context);
    context.seteazaAccesQuiz(false);
    assert.equal(hidden.size, 0);
    await context.pornesteQuiz('example');
    assert.equal(loginPrompts, 1);
});
