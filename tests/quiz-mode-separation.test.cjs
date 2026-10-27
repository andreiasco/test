const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const turn = () => new Promise(resolve => setImmediate(resolve));

function quiz(mode, id = mode) {
    const questions = mode === 'castle_hangman'
        ? [{ text: 'Descoperă cuvântul.', target: 'ABC' }, { text: 'Alt cuvânt.', target: 'CARTE' }]
        : mode === 'castle_ordering'
            ? [{ text: 'Formează propoziția.', items: ['Ana', 'are', 'mere'] }, { text: 'Ordonează.', items: ['Unu', 'doi'] }]
            : [{ text: 'Verbul exprimă o acțiune.', answers: mode === 'castle_true_false' ? ['Da', 'Nu', 'Altceva'] : ['Corect', 'Greșit'], correctIndex: 0 }, { text: 'A doua cerință.', answers: ['Adevărat', 'Fals'], correctIndex: 1 }];
    return { id, title: 'Exercițiul clasei', game_mode: mode, world_theme: 'jungle', lives: 3, seconds_per_question: 30,
        questions: questions.map(question => ({ ...question, monster: 'demon', boss: true })) };
}
function fixture() {
    const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://example.test/', runScripts: 'outside-only' });
    const w = dom.window, ctx = dom.getInternalVMContext();
    const evaluate = code => vm.runInContext(code, ctx);
    const run = file => evaluate(read(file));
    run('js/layout/quiz-worlds.js'); run('js/layout/quiz-page.js'); evaluate('document.body.innerHTML = QUIZ_HTML');
    const calls = { engine: [], dialogue: 0, audio: [], results: [] };
    let interval = null, serial = 0;
    w.setInterval = callback => { interval = { id: ++serial, callback }; return interval.id; };
    w.clearInterval = id => { if (interval?.id === id) interval = null; };
    w.supabaseClient = { auth: { getSession: async () => ({ data: { session: { user: { id: 'student' } } } }) } };
    w.afiseazaLogin = () => assert.fail('authenticated student should keep access');
    w.almaIcon = () => '';
    w.CastleQuizAudio = new Proxy({}, { get: (_, name) => (...args) => calls.audio.push({ name, args }) });
    w.CastleQuiz3D = Object.fromEntries(['init','encounter','nextRoom','correct','wrong','victory','gameOver','skip','dispose','showMap'].map(name => [name, async (...args) => { calls.engine.push(name); return name === 'init'; }]));
    w.CastleQuiz3D.getRoomName = () => 'Camera monstrului';
    run('js/site/hangman-view.js'); run('js/site/quiz.js');
    w.afiseazaDialogCastel = async () => { calls.dialogue++; };
    w.inregistreazaRezultatQuiz = result => calls.results.push(result);
    w.initializeazaQuizPlayer();
    const el = id => w.document.getElementById(id);
    const state = () => JSON.parse(evaluate('JSON.stringify({ mode:quizActiv?.game_mode, index:quizIndexIntrebare, lives:quizVieti, score:quizScor, locked:quizRaspunsBlocat, correct:quizCorecte, hangman:hangmanState&&{target:hangmanState.target,misses:hangmanState.misses,result:hangmanState.result,maxMistakes:hangmanState.maxMistakes} })'));
    const guess = letter => evaluate(`ghicesteLitera(${JSON.stringify(letter)}, quizActiv.questions[quizIndexIntrebare], false, QUIZ_MONSTERS.goblin)`);
    return { w, calls, evaluate, el, state, guess, interval: () => interval,
        launch: (mode, id) => w.pornesteQuizCuDate(quiz(mode, id)), close: () => dom.window.close() };
}
function actionCalls(calls) { return calls.engine.filter(name => name !== 'dispose'); }

for (const mode of ['castle_ordering', 'castle_hangman', 'castle_true_false']) {
    test(`${mode} launches its own exercise without loading or narrating a 3D encounter`, async () => {
        const f = fixture();
        try {
            await f.launch(mode);
            assert.deepEqual(actionCalls(f.calls), []);
            assert.equal(f.calls.dialogue, 0);
            assert.equal(f.el('castleScene').hidden, true);
            assert.equal(f.el('quizRouteHud').hidden, true);
            assert.equal(f.el('quizWorldLabel').hidden, true);
            assert.equal(f.el('quizPlayer').dataset.gameMode, mode);
            assert.ok(f.el('quizPlayer').classList.contains('quiz-standalone'));
            assert.equal(f.el('quizQuestionStage').querySelectorAll('.castle-monster-title').length, 0);
            assert.ok(!/demon|dragon|cavaler|monstru|boss/i.test(f.el('quizQuestionStage').textContent));
            assert.ok(f.interval());
            assert.equal(f.state().lives, mode === 'castle_hangman' ? 6 : 3);
        } finally { f.close(); }
    });
}

test('true or false always presents exactly Adevărat and Fals, then continues without combat', async () => {
    const f = fixture();
    try {
        await f.launch('castle_true_false');
        const buttons = [...f.el('quizQuestionStage').querySelectorAll('[data-answer-index]')];
        assert.equal(buttons.length, 2);
        assert.deepEqual(buttons.map(button => button.querySelector('strong').textContent), ['Adevărat', 'Fals']);
        assert.equal(f.el('quizQuestionStage').querySelectorAll('.ordering-chip,[data-letter]').length, 0);
        await f.w.raspundeQuiz(0);
        assert.equal(f.state().score, 100); assert.ok(f.el('quizNextButton'));
        await f.w.urmatoareaIntrebareQuiz();
        assert.equal(f.state().index, 1); assert.equal(f.state().lives, 3);
        assert.deepEqual(actionCalls(f.calls), []); assert.equal(f.calls.dialogue, 0);
        await f.w.raspundeQuiz(1); await f.w.urmatoareaIntrebareQuiz();
        assert.ok(!f.el('quizRezultat').classList.contains('ascuns'));
        assert.deepEqual(actionCalls(f.calls), []);
        assert.ok(!/traseu|castel|dragon/i.test(f.el('quizRezultat').textContent));
    } finally { f.close(); }
});

test('word ordering uses just the word controls and checks the actual arranged sequence', async () => {
    const f = fixture();
    try {
        await f.launch('castle_ordering');
        assert.equal(f.el('quizQuestionStage').querySelectorAll('[data-answer-index],[data-letter]').length, 0);
        assert.deepEqual([...f.el('orderingPool').children].map(node => node.textContent).sort(), ['Ana','are','mere'].sort());
        for (const text of ['Ana', 'are', 'mere']) [...f.el('orderingPool').children].find(node => node.textContent === text).click();
        assert.deepEqual([...f.el('orderingAnswer').children].map(node => node.textContent), ['Ana','are','mere']);
        f.el('orderingSubmit').click(); await turn();
        assert.equal(f.state().score, 100); assert.equal(f.state().locked, true);
        assert.ok(f.el('quizNextButton'));
        f.el('quizNextButton').click(); await turn();
        assert.equal(f.state().index, 1);
        assert.deepEqual(actionCalls(f.calls), []); assert.equal(f.calls.dialogue, 0);
    } finally { f.close(); }
});

test('six wrong hangman letters draw exactly one body part each and the sixth ends the game', async () => {
    const f = fixture();
    try {
        await f.launch('castle_hangman');
        assert.equal(f.el('quizQuestionStage').querySelectorAll('.hangman-play').length, 1);
        assert.equal(f.el('quizQuestionStage').querySelectorAll('[data-answer-index],.ordering-chip').length, 0);
        for (const [index, letter] of [...'DEFGHI'].entries()) {
            await f.guess(letter);
            assert.equal(f.state().lives, 5 - index);
            assert.equal(f.el('quizQuestionStage').querySelectorAll('[data-hangman-part][data-visible="true"]').length, index + 1);
            await f.guess(letter);
            assert.equal(f.state().lives, 5 - index, 'a repeated wrong key never costs a second life');
        }
        assert.equal(f.state().hangman.result, 'lost');
        assert.ok(!f.el('quizRezultat').classList.contains('ascuns'));
        assert.deepEqual(actionCalls(f.calls), []); assert.equal(f.calls.dialogue, 0);
        f.el('quizRetryButton').click(); await turn();
        assert.equal(f.state().lives, 6); assert.equal(f.state().index, 0);
        assert.equal(f.el('quizQuestionStage').querySelectorAll('[data-hangman-part][data-visible="true"]').length, 0);
    } finally { f.close(); }
});

test('a new hangman word starts with six attempts and a fresh drawing after an earlier mistake', async () => {
    const f = fixture();
    try {
        await f.launch('castle_hangman'); await f.guess('Z');
        assert.equal(f.state().lives, 5);
        for (const letter of 'ABC') await f.guess(letter);
        assert.equal(f.state().hangman.result, 'won'); assert.equal(f.state().score, 100);
        await f.w.urmatoareaIntrebareQuiz();
        assert.equal(f.state().index, 1); assert.equal(f.state().hangman.target, 'CARTE');
        assert.equal(f.state().lives, 6); assert.equal(f.state().hangman.maxMistakes, 6);
        assert.equal(f.el('quizQuestionStage').querySelectorAll('[data-hangman-part][data-visible="true"]').length, 0);
        assert.equal(f.el('quizQuestionStage').querySelector('[data-letter="Z"]').disabled, false);
    } finally { f.close(); }
});

test('switching from an adventure to a plain exercise cleans up the old map and ignores its late route events', async () => {
    const f = fixture();
    try {
        await f.launch('castle_choice');
        assert.deepEqual(actionCalls(f.calls), ['init', 'encounter']);
        const canvas = f.el('castleCanvas');
        canvas.dispatchEvent(new f.w.CustomEvent('castle-route', { detail: { phase:'encounter', index:0, total:2, overview:false, completed:[] } }));
        assert.equal(f.el('quizRouteHud').hidden, false);
        const disposed = f.calls.engine.filter(name => name === 'dispose').length;
        await f.launch('castle_ordering');
        assert.ok(f.calls.engine.filter(name => name === 'dispose').length > disposed);
        const before = f.state(), actionCount = actionCalls(f.calls).length;
        canvas.dispatchEvent(new f.w.CustomEvent('castle-route', { detail: { phase:'encounter', index:1, total:2, overview:true, completed:[0] } }));
        f.el('quizMapToggle').click();
        assert.equal(f.el('quizRouteHud').hidden, true);
        assert.equal(f.el('castleScene').hidden, true);
        assert.deepEqual(f.state(), before); assert.equal(actionCalls(f.calls).length, actionCount);
        await f.launch('castle_choice', 'fresh-adventure');
        assert.equal(f.el('castleScene').hidden, false);
        assert.ok(!f.el('quizPlayer').classList.contains('quiz-standalone'));
        assert.equal(f.state().lives, 3);
    } finally { f.close(); }
});

test('choose-answer and its legacy mode keep the knight encounters and answer-driven combat', async t => {
    for (const mode of ['castle_choice','castle_adventure']) await t.test(mode, async () => {
        const f = fixture();
        try {
            await f.launch(mode);
            assert.deepEqual(actionCalls(f.calls),['init','encounter']);
            assert.equal(f.el('castleScene').hidden,false);
            assert.ok(!f.el('quizPlayer').classList.contains('quiz-standalone'));
            assert.ok(f.el('quizQuestionStage').querySelector('.castle-monster-title'));
            assert.ok(f.calls.dialogue>0);
            await f.w.raspundeQuiz(1);
            assert.equal(f.calls.engine.filter(name=>name==='wrong').length,1);
            assert.equal(f.state().lives,2);
            await f.w.urmatoareaIntrebareQuiz();
            assert.equal(f.calls.engine.filter(name=>name==='nextRoom').length,1);
            await f.w.raspundeQuiz(1);
            assert.equal(f.calls.engine.filter(name=>name==='correct').length,1);
            await f.w.urmatoareaIntrebareQuiz();
            assert.equal(f.calls.engine.filter(name=>name==='victory').length,1);
        } finally { f.close(); }
    });
});

test('canonical true/false buttons retain the correct meaning when stored answers were reversed', async () => {
    const f=fixture();
    try {
        const raw=quiz('castle_true_false');
        raw.questions=[{text:'Verbul este un substantiv.',answers:['Fals','Adevărat'],correctIndex:0}];
        await f.w.pornesteQuizCuDate(raw);
        assert.deepEqual([...f.el('quizQuestionStage').querySelectorAll('[data-answer-index] strong')].map(node=>node.textContent),['Adevărat','Fals']);
        await f.w.raspundeQuiz(1);
        assert.equal(f.state().score,100);
        assert.equal(f.state().lives,3);
        assert.deepEqual(actionCalls(f.calls),[]);
    } finally { f.close(); }
});

test('a standalone exercise can start, answer, continue and close when the 3D module is absent', async () => {
    const f=fixture();
    try {
        delete f.w.CastleQuiz3D;
        await f.launch('castle_true_false');
        assert.equal(f.el('castleScene').hidden,true);
        assert.equal(f.state().locked,false);
        await f.w.raspundeQuiz(0);
        assert.equal(f.state().score,100); assert.ok(f.el('quizNextButton'));
        await f.w.urmatoareaIntrebareQuiz();
        assert.equal(f.state().index,1); assert.equal(f.state().locked,false);
        f.w.inchideQuizPlayer();
        assert.ok(f.el('quizPlayer').classList.contains('ascuns'));
        assert.equal(f.interval(),null); assert.equal(f.state().mode,undefined);
        assert.deepEqual(f.calls.engine,[]);
    } finally { f.close(); }
});

test('graded word ordering locks its chips and actions even when click events are dispatched directly', async () => {
    const f=fixture();
    try {
        await f.launch('castle_ordering');
        for(const text of ['Ana','are','mere']) [...f.el('orderingPool').children].find(node=>node.textContent===text).click();
        f.el('orderingSubmit').click(); await turn();
        assert.equal(f.state().score,100); assert.equal(f.state().locked,true);
        const controls=[...f.el('quizQuestionStage').querySelectorAll('.ordering-chip,#orderingReset,#orderingSubmit')];
        assert.equal(controls.length,5);
        assert.ok(controls.every(button=>button.disabled),'all ordering controls are disabled after grading');
        const bank={pool:f.el('orderingPool').innerHTML,answer:f.el('orderingAnswer').innerHTML},before=f.state();
        for(const button of controls) button.dispatchEvent(new f.w.MouseEvent('click',{bubbles:true}));
        await turn();
        assert.equal(f.el('orderingPool').innerHTML,bank.pool);
        assert.equal(f.el('orderingAnswer').innerHTML,bank.answer);
        assert.deepEqual(f.state(),before,'queued or programmatic input cannot rearrange or grade a completed answer twice');
        assert.ok(f.el('quizNextButton'));
    } finally { f.close(); }
});
