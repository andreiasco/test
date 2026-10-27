const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));

function fixture() {
    const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only', url: 'https://example.test/' });
    const w = dom.window, context = dom.getInternalVMContext();
    const evaluate = code => vm.runInContext(code, context);
    const run = file => evaluate(read(file));
    run('js/layout/quiz-worlds.js'); run('js/layout/admin-panel/quiz-form.js');
    evaluate('document.body.innerHTML = ADMIN_QUIZ_FORM_HTML + \'<div id="quizAdminLista"></div>\'');
    w.almaIcon = () => '';
    run('js/admin/quiz-manage.js'); w.initializeazaQuizAdmin();
    const el = id => w.document.getElementById(id);
    el('quizTitlu').value = 'Joc de limba română';
    function mode(value, question) {
        w.seteazaModQuizAdmin(value); el('quizQuestionsEditor').replaceChildren();
        w.adaugaEditorIntrebareQuiz(question);
    }
    return { w, evaluate, el, mode, close: () => w.close() };
}

test('admin enables map, foes, dialogue and final-boss tools only for the answer-choice adventure', () => {
    const f = fixture();
    try {
        f.el('quizWorldTheme').value = 'jungle';
        assert.equal(f.el('quizWorldPicker').hidden, false);
        assert.ok(f.w.document.querySelector('.quiz-q-monster'));
        assert.ok(f.w.document.querySelector('.quiz-dialog-settings'));
        assert.ok(f.w.document.querySelector('.quiz-boss-editor'));
        for (const mode of ['castle_ordering', 'castle_true_false', 'castle_hangman']) {
            f.mode(mode, { text: 'Cerință', target: 'ȘCOALĂ', items: ['unu', 'doi'], correctIndex: 1 });
            assert.equal(f.el('quizWorldPicker').hidden, true, mode);
            assert.equal(f.el('quizWorldPicker').disabled, true, mode);
            assert.equal(f.el('quizWorldTheme').value, 'jungle', 'switching presentation keeps the saved visual choice');
            assert.equal(f.w.document.querySelector('.quiz-q-monster'), null, mode);
            assert.equal(f.w.document.querySelector('.quiz-dialog-settings'), null, mode);
            assert.equal(f.w.document.querySelector('.quiz-boss-editor'), null, mode);
            assert.doesNotMatch(f.el('quizModeDescription').textContent, /dragon|boss|monstru/i);
            const question = f.w.colecteazaIntrebariQuizAdmin()[0];
            assert.equal(Object.hasOwn(question, 'boss'), false);
            assert.equal(Object.hasOwn(question, 'monster'), false);
            assert.equal(Object.hasOwn(question, 'wrongMessage'), false);
            if (mode === 'castle_true_false') {
                assert.deepEqual(plain(question.answers), ['Adevărat', 'Fals']);
                assert.equal(question.correctIndex, 1);
            }
        }
        f.mode('castle_choice', { text: 'Cerință', answers: ['A', 'B'], correctIndex: 0, monster: 'knight' });
        assert.equal(f.el('quizWorldPicker').hidden, false);
        assert.equal(f.el('quizWorldPicker').disabled, false);
        const choice = f.w.colecteazaIntrebariQuizAdmin()[0];
        assert.equal(choice.monster, 'knight');
        assert.equal(choice.boss, true);
        assert.equal(f.el('quizWorldTheme').value, 'jungle');
    } finally { f.close(); }
});

test('hangman preview and create/update payloads keep six lives while other modes retain three', async () => {
    const f = fixture();
    try {
        f.mode('castle_hangman', { text: 'Locul în care învățăm', target: 'ȘCOALĂ' });
        assert.match(f.el('quizModeDescription').textContent, /6 vieți pentru fiecare cuvânt/);
        assert.equal(f.w.construiesteQuizDinFormular().lives, 6);
        const saved = [];
        f.w.utilizatorAutentificat = async () => ({ id: 'admin' });
        f.w.supabaseClient = { from: () => ({
            insert: async payload => { saved.push({ operation: 'insert', payload }); return { error: null }; },
            update: payload => ({ eq: async (_, id) => { saved.push({ operation: 'update', id, payload }); return { error: null }; } })
        }) };
        f.w.reseteazaFormularQuizAdmin = () => {};
        f.w.incarcaQuizuriAdmin = async () => {};
        await f.w.salveazaQuizAdmin({ preventDefault() {} });
        f.el('quizEditId').value = 'existing-hangman';
        await f.w.salveazaQuizAdmin({ preventDefault() {} });
        assert.deepEqual(saved.map(value => value.operation), ['insert', 'update']);
        assert.ok(saved.every(value => value.payload.lives === 6));
        assert.ok(saved.every(value => value.payload.questions[0].target === 'ȘCOALĂ'));
        for (const mode of ['castle_choice', 'castle_ordering', 'castle_true_false']) {
            f.mode(mode, { text: 'Cerință', answers: ['A', 'B'], correctIndex: 0, items: ['unu', 'doi'] });
            assert.equal(f.w.construiesteQuizDinFormular().lives, 3, mode);
        }
    } finally { f.close(); }
});

test('admin list describes standalone games without a world badge or adventure-only life count', () => {
    const f = fixture();
    try {
        f.evaluate(`quizAdminData = [
            {id:'hangman',game_mode:'castle_hangman',title:'Cuvinte',world_theme:'snow',lives:3,questions:[{}]},
            {id:'choice',game_mode:'castle_choice',title:'Lupta',world_theme:'desert',questions:[{}]}
        ]`);
        f.w.randareQuizuriAdmin();
        const rows = f.el('quizAdminLista').querySelectorAll('article');
        assert.match(rows[0].textContent, /6 vieți \/ cuvânt/);
        assert.equal(rows[0].querySelector('.quiz-world-badge'), null);
        assert.match(rows[1].textContent, /3 vieți/);
        assert.equal(rows[1].querySelector('.quiz-world-badge').textContent, 'Deșert');
    } finally { f.close(); }
});
