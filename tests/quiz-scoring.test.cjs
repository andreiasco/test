const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const turn = () => new Promise(resolve => setImmediate(resolve));

function makeQuiz(mode, count = 3) {
    const question = mode === 'castle_hangman' ? { target: 'AB' }
        : mode === 'castle_ordering' ? { items: ['Ana', 'are', 'mere'] }
        : { answers: mode === 'castle_true_false' ? ['Adevărat', 'Fals'] : ['Corect', 'Greșit'], correctIndex: 0 };
    return { id: `score-${mode}`, title: 'Punctajul meu', game_mode: mode, world_theme: 'castle',
        seconds_per_question: 30, questions: Array.from({ length: count }, (_, index) => ({
            ...question, text: `Provocarea ${index + 1}`, monster: 'goblin'
        })) };
}

function fixture() {
    const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://example.test/', runScripts: 'outside-only' });
    const w = dom.window, context = dom.getInternalVMContext();
    const evaluate = source => vm.runInContext(source, context);
    const run = file => evaluate(read(file));
    run('js/layout/quiz-worlds.js'); run('js/layout/quiz-page.js');
    evaluate('document.body.innerHTML = QUIZ_HTML');
    w.supabaseClient = { auth: { getSession: async () => ({ data: { session: { user: { id: 'student' } } } }) } };
    w.CastleQuizAudio = new Proxy({}, { get: () => () => {} });
    w.CastleQuiz3D = Object.fromEntries(['init', 'encounter', 'nextRoom', 'correct', 'wrong', 'victory', 'gameOver', 'dispose']
        .map(name => [name, async () => name === 'init']));
    w.CastleQuiz3D.getRoomName = () => 'Întâlnirea cu monstrul';
    w.almaIcon = () => '';
    let timer = null, serial = 0;
    w.setInterval = callback => { timer = { id: ++serial, callback }; return timer.id; };
    w.clearInterval = id => { if (timer?.id === id) timer = null; };
    run('js/site/hangman-view.js'); run('js/site/quiz.js');
    w.afiseazaDialogCastel = async () => {};
    const saved = [], submitted = [];
    w.inregistreazaRezultatQuiz = result => saved.push(plain(result));
    w.QuizLeaderboard = { submit: result => {
        assert.ok(!w.document.getElementById('quizRezultat').classList.contains('ascuns'), 'the leaderboard submits after the result is displayed');
        submitted.push(plain(result));
    } };
    w.initializeazaQuizPlayer();
    const el = id => w.document.getElementById(id);
    const state = () => plain(evaluate('({score:quizScor, correct:quizCorecte, lives:quizVieti, index:quizIndexIntrebare, locked:quizRaspunsBlocat})'));
    async function respond(correct) {
        const question = evaluate('quizActiv.questions[quizIndexIntrebare]');
        if (question.type === 'hangman') {
            if (!correct) return w.expiraProvocare();
            for (const letter of 'AB') await w.ghicesteLitera(letter, question, false, { icon: '', name: '' });
        } else if (question.type === 'ordering') {
            for (const word of correct ? [...question.items] : [...question.items].reverse()) {
                [...el('orderingPool').querySelectorAll('.ordering-chip')].find(button => button.dataset.text === word).click();
            }
            await w.verificaOrdine(question);
        } else await w.raspundeQuiz(correct ? 0 : 1);
    }
    async function repeatCorrect() {
        const question = evaluate('quizActiv.questions[quizIndexIntrebare]');
        if (question.type === 'hangman') await w.ghicesteLitera('B', question, false, { icon: '', name: '' });
        else if (question.type === 'ordering') await w.verificaOrdine(question);
        else await w.raspundeQuiz(0);
    }
    return { w, el, saved, submitted, state, evaluate, respond, repeatCorrect,
        launch: (mode, count = 3, preview = false) => w.pornesteQuizCuDate(makeQuiz(mode, count), preview),
        next: () => w.urmatoareaIntrebareQuiz(), close: () => dom.window.close() };
}

function assertFinal(f, score, correct, total, won) {
    assert.equal(f.state().score, score);
    assert.equal(f.state().correct, correct);
    assert.equal(f.el('quizLiveScore').textContent, `Scor: ${score}`);
    assert.equal(parseInt(f.el('quizRezultat').querySelector('.quiz-result-score').textContent, 10), score);
    assert.ok(!f.el('quizRezultat').classList.contains('ascuns'));
    assert.match(f.el('quizRezultat').textContent, new RegExp(`${correct}\\s*×\\s*1\\s*=\\s*${score}`));
    assert.ok(!/bonus/i.test(f.el('quizRezultat').textContent), 'the result does not award a life or completion bonus');
    assert.deepEqual(f.saved, [{ quizId: `score-${f.evaluate('quizActiv.game_mode')}`, title: 'Punctajul meu',
        score, correct, total, won }]);
    assert.deepEqual(f.submitted, [{ attemptId: f.evaluate('quizAttemptId'),
        quizId: `score-${f.evaluate('quizActiv.game_mode')}`, correct, total }]);
    assert.match(f.submitted[0].attemptId, /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i);
}

for (const mode of ['castle_choice', 'castle_true_false', 'castle_ordering', 'castle_hangman']) {
    test(`${mode}: two correct challenges and one failed challenge finish with exactly 2 points`, async () => {
        const f = fixture();
        try {
            await f.launch(mode);
            await f.respond(true);
            assert.equal(f.state().score, 1);
            await f.repeatCorrect();
            assert.equal(f.state().score, 1, 'repeating a locked answer cannot award its points twice');
            await f.next(); await f.respond(false);
            assert.equal(f.state().score, 1, 'wrong answers and timeouts add no points');
            assert.ok(f.el('quizNextButton'));
            await f.next(); await f.respond(true);
            assert.equal(f.state().score, 2);
            await f.next();
            assertFinal(f, 2, 2, 3, true);
            assert.equal(f.state().lives, mode === 'castle_hangman' ? 6 : 2);
        } finally { f.close(); }
    });
}

test('a perfect quiz ends at correct answers × 1 regardless of the remaining lives', async () => {
    const f = fixture();
    try {
        await f.launch('castle_true_false', 4);
        for (let question = 0; question < 4; question++) { await f.respond(true); await f.next(); }
        assertFinal(f, 4, 4, 4, true);
        assert.equal(f.state().lives, 3, 'unused lives have no extra point value');
    } finally { f.close(); }
});

test('game over retains only the points from challenges answered correctly before losing the last life', async () => {
    const f = fixture();
    try {
        await f.launch('castle_choice', 5);
        await f.respond(true); await f.next();
        for (let error = 0; error < 3; error++) {
            await f.respond(false);
            if (error < 2) await f.next();
        }
        await f.w.finalizeazaQuiz(false, true);
        assertFinal(f, 1, 1, 5, false);
        assert.equal(f.state().lives, 0);
    } finally { f.close(); }
});

test('admin preview calculates the same final total without saving a student result', async () => {
    const f = fixture();
    try {
        await f.launch('castle_hangman', 2, true);
        for (let question = 0; question < 2; question++) { await f.respond(true); await f.next(); }
        assert.equal(f.state().score, 2);
        assert.equal(parseInt(f.el('quizRezultat').querySelector('.quiz-result-score').textContent, 10), 2);
        assert.match(f.el('quizRezultat').textContent, /2\s*×\s*1\s*=\s*2/);
        assert.deepEqual(f.saved, []);
        assert.deepEqual(f.submitted, []);
    } finally { f.close(); }
});

test('retry clears the previous total and starts a new one-point attempt', async () => {
    const f = fixture();
    try {
        await f.launch('castle_true_false', 1);
        await f.respond(true); await f.next();
        assertFinal(f, 1, 1, 1, true);
        const firstAttempt = f.submitted[0].attemptId;
        f.el('quizRetryButton').click(); await turn();
        assert.deepEqual(f.state(), { score: 0, correct: 0, lives: 3, index: 0, locked: false });
        assert.equal(f.el('quizLiveScore').textContent, 'Scor: 0');
        assert.ok(f.el('quizRezultat').classList.contains('ascuns'));
        assert.notEqual(f.evaluate('quizAttemptId'), firstAttempt);
        await f.respond(true); assert.equal(f.state().score, 1);
        assert.equal(f.saved.length, 1, 'the unfinished retry has not saved another result');
        assert.equal(f.submitted.length, 1, 'the unfinished retry has not submitted another result');
        await f.next();
        assert.equal(f.saved.length, 2);
        assert.equal(f.submitted.length, 2);
        assert.notEqual(f.submitted[1].attemptId, firstAttempt);
        assert.equal(f.saved[1].score, 1);
    } finally { f.close(); }
});

test('concurrent and repeated finalization record and submit the completed attempt once', async () => {
    const f = fixture();
    try {
        await f.launch('castle_choice', 1);
        await f.respond(true);
        let finishAnimation;
        f.w.CastleQuiz3D.victory = () => new Promise(resolve => { finishAnimation = resolve; });
        const completing = f.next();
        await turn();
        assert.equal(typeof finishAnimation, 'function');
        await Promise.all([f.w.finalizeazaQuiz(true), f.w.finalizeazaQuiz(true)]);
        assert.deepEqual(f.saved, [], 'the first finalizer waits for its victory animation');
        assert.deepEqual(f.submitted, []);
        finishAnimation(); await completing;
        await f.w.finalizeazaQuiz(true);
        assertFinal(f, 1, 1, 1, true);
    } finally { f.close(); }
});
