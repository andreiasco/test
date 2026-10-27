const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function fixture(target = 'ȘCOALĂ', lives = 3) {
    const dom = new JSDOM(`<!doctype html><body>
      <div id="quizInteractiveLista"></div><div id="quizPlayer">
      <div id="quizLives"></div><span id="quizLiveScore"></span>
      <span id="quizCounter"></span><div id="quizProgressBar"></div>
      <span id="quizTimer"></span><div id="quizQuestionStage"></div>
      <div id="quizRezultat" class="ascuns"></div></div></body>`, {
        url: 'https://example.test/', runScripts: 'outside-only'
    });
    const w = dom.window, context = dom.getInternalVMContext();
    const evaluate = code => vm.runInContext(code, context);
    const run = file => evaluate(read(file));
    let interval = null, nextInterval = 1;
    w.setInterval = callback => { interval = { id: nextInterval++, callback }; return interval.id; };
    w.clearInterval = id => { if (interval?.id === id) interval = null; };
    const calls = { correct: 0, wrong: 0, dialogue: 0, final: [] };
    w.CastleQuizAudio = new Proxy({}, { get: () => () => {} });
    w.CastleQuiz3D = {
        correct: async () => { calls.correct++; },
        wrong: async () => { calls.wrong++; }, dispose() {}
    };
    w.almaIcon = () => '';
    run('js/layout/quiz-worlds.js');
    run('js/site/hangman-view.js');
    run('js/site/quiz.js');
    w.afiseazaDialogCastel = async () => { calls.dialogue++; };
    w.finalizeazaQuiz = async (...args) => { calls.final.push(args); };
    w.question = { type: 'hangman', text: 'Ghicește cuvântul', target, monster: 'goblin' };
    w.monsterInfo = { name: 'Goblin', icon: '●' };
    evaluate(`quizActiv = { id: 'hangman-test', game_mode: 'castle_hangman', world_theme: 'castle', questions: [window.question] };
      quizIndexIntrebare = 0; quizVieti = ${lives}; quizScor = 0; quizCorecte = 0;
      randareProvocare(window.question, false, window.monsterInfo); quizRaspunsBlocat = false;`);
    return {
        w, calls, evaluate, document: w.document,
        stage: () => w.document.getElementById('quizQuestionStage'),
        view: () => w.document.querySelector('.hangman-play'),
        key: letter => [...w.document.querySelectorAll('[data-letter]')].find(button => button.dataset.letter === letter),
        state: () => JSON.parse(evaluate(`JSON.stringify({ lives: quizVieti, score: quizScor, correct: quizCorecte,
          locked: quizRaspunsBlocat, time: quizTimpRamas, active: Boolean(quizActiv),
          hangman: hangmanState && { ...hangmanState, guessed: [...hangmanState.guessed] } })`)),
        guess: letter => w.ghicesteLitera(letter, w.question, false, w.monsterInfo),
        interval: () => interval,
        close: () => dom.window.close()
    };
}

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

test('the initial drawing and tiles describe the game without exposing the hidden answer', () => {
    const f = fixture('ȘCOALĂ-26 „ROMÂNĂ”');
    try {
        const view = f.view(); assert.ok(view, 'illustrated hangman exists');
        assert.equal(view.dataset.misses, '0'); assert.equal(view.dataset.result, 'playing');
        assert.equal(view.dataset.maxMistakes, '3');
        assert.equal(f.document.querySelectorAll('[data-hangman-part][data-visible="true"]').length, 0);
        const hidden = [...f.document.querySelectorAll('.hangman-tile[data-revealed="false"]')];
        assert.equal(hidden.length, 12, 'only letters are hidden; punctuation and digits remain readable');
        hidden.forEach(tile => assert.equal(tile.textContent.trim(), '_'));
        assert.ok(!f.stage().textContent.includes('ȘCOALĂ'));
        assert.ok(!f.stage().innerHTML.includes('ȘCOALĂ'));
        assert.ok(!f.stage().innerHTML.includes('ROMÂNĂ'));
        assert.ok(f.stage().textContent.includes('26'), 'non-letter content is not an impossible guess');
        assert.equal(f.document.querySelectorAll('[data-letter]').length, 31);
        assert.equal(new Set([...f.document.querySelectorAll('[id]')].map(node => node.id)).size, f.document.querySelectorAll('[id]').length);
    } finally { f.close(); }
});

test('Romanian diacritic aliases reveal matching letters once and show the used key state', async () => {
    const f = fixture();
    try {
        await f.guess('ș');
        for (const letter of ['S', 'Ș']) {
            assert.equal(f.key(letter).disabled, true);
            assert.equal(f.key(letter).dataset.keyState, 'correct');
            assert.match(f.key(letter).getAttribute('aria-label'), /găsită/);
        }
        assert.ok([...f.document.querySelectorAll('.hangman-tile[data-revealed="true"]')].some(tile => tile.textContent === 'Ș'));
        await f.guess('A');
        for (const letter of ['A', 'Ă', 'Â']) assert.equal(f.key(letter).disabled, true);
        const before = f.state();
        await f.guess('Ă'); await f.guess('Ș');
        assert.deepEqual(f.state(), before, 'normalized duplicate letters have no side effects');
        assert.equal(f.calls.wrong, 0); assert.equal(f.state().lives, 3);
    } finally { f.close(); }
});

test('physical keyboard input is scoped to the hangman controls and ignores repeat or editing shortcuts', async () => {
    const f = fixture();
    try {
        f.key('S').focus();
        f.key('S').dispatchEvent(new f.w.KeyboardEvent('keydown', { key: 'ș', bubbles: true }));
        assert.ok(f.state().hangman.guessed.includes('S'));
        assert.ok(f.document.activeElement.matches('[data-letter]:not(:disabled)'), 'focus survives replacing the used key');
        const before = f.state();
        const send = (target, key, options = {}) => target.dispatchEvent(new f.w.KeyboardEvent('keydown', { key, bubbles: true, ...options }));
        send(f.key('B'), 'B', { repeat: true });
        send(f.key('B'), 'B', { ctrlKey: true });
        send(f.key('B'), 'B', { metaKey: true });
        send(f.key('B'), 'B', { altKey: true });
        send(f.stage(), 'B');
        const field = f.document.createElement('input'); f.view().appendChild(field);
        send(field, 'B');
        assert.deepEqual(f.state(), before, 'typing outside the active controls never spends a life');
    } finally { f.close(); }
});

test('invalid guess values cannot mark a key, spend a life or start a reaction', async () => {
    const f = fixture();
    try {
        const before = f.state();
        for (const value of ['', 'AA', '1', '-', '🙂', 'Shift', null]) await f.guess(value);
        assert.deepEqual(f.state(), before);
        assert.equal(f.calls.wrong, 0); assert.equal(f.calls.correct, 0);
    } finally { f.close(); }
});

test('a phrase with numbers, spaces and punctuation wins after its letters are discovered', async () => {
    const f = fixture('„ȘCOALĂ” — 26!');
    try {
        for (const letter of ['Ș', 'C', 'O', 'A', 'L']) await f.guess(letter);
        assert.equal(f.view().dataset.result, 'won');
        assert.equal(f.state().score, 100); assert.equal(f.state().lives, 3);
        assert.equal(f.document.querySelectorAll('.hangman-tile[data-revealed="false"]').length, 0);
        assert.ok(f.stage().textContent.includes('26'));
        assert.equal(f.calls.correct, 1);
    } finally { f.close(); }
});

test('a wrong guess updates the drawing and locks input before the awaited reaction, with one life per new letter', async () => {
    const f = fixture(); const reaction = deferred();
    try {
        f.w.CastleQuiz3D.wrong = () => { f.calls.wrong++; return reaction.promise; };
        const pending = f.guess('B');
        assert.equal(f.state().lives, 2); assert.equal(f.state().hangman.misses, 1);
        assert.equal(f.view().dataset.misses, '1');
        assert.ok(f.document.querySelectorAll('[data-hangman-part][data-visible="true"]').length > 0, 'new parts are shown before 3D completes');
        assert.equal(f.key('B').dataset.keyState, 'wrong');
        assert.match(f.key('B').getAttribute('aria-label'), /greșită/);
        assert.ok([...f.document.querySelectorAll('[data-letter]')].every(button => button.disabled));
        await f.guess('B'); await f.guess('Z');
        assert.equal(f.calls.wrong, 1); assert.equal(f.state().lives, 2);
        reaction.resolve(); await pending;
        await f.guess('B');
        assert.equal(f.state().lives, 2); assert.equal(f.calls.wrong, 1);
        assert.equal(f.key('B').disabled, true); assert.equal(f.key('O').disabled, false);
    } finally { reaction.resolve(); f.close(); }
});

test('solving the word locks the completed view immediately and awards its score once', async () => {
    const f = fixture('AĂ'); const reaction = deferred();
    try {
        f.w.CastleQuiz3D.correct = () => { f.calls.correct++; return reaction.promise; };
        const pending = f.guess('A');
        assert.equal(f.view().dataset.result, 'won');
        assert.equal(f.state().score, 100); assert.equal(f.state().correct, 1);
        assert.ok([...f.document.querySelectorAll('[data-letter]')].every(button => button.disabled));
        assert.equal(f.document.querySelectorAll('.hangman-tile[data-revealed="false"]').length, 0);
        await f.guess('Ă'); await f.guess('Z');
        assert.equal(f.state().score, 100); assert.equal(f.calls.correct, 1);
        reaction.resolve(); await pending;
        assert.ok(f.document.querySelector('#quizFeedback #quizNextButton'), 'the completed round can continue normally');
    } finally { reaction.resolve(); f.close(); }
});

test('the final allowed error completes the lost drawing before game-over reactions finish', async () => {
    const f = fixture('CASĂ', 1); const reaction = deferred();
    try {
        f.w.CastleQuiz3D.wrong = () => reaction.promise;
        const pending = f.guess('Z');
        assert.equal(f.state().lives, 0); assert.equal(f.view().dataset.result, 'lost');
        assert.equal(f.view().dataset.maxMistakes, '1');
        assert.equal(f.document.querySelectorAll('[data-hangman-part][data-visible="true"]').length, 6);
        assert.ok([...f.document.querySelectorAll('[data-letter]')].every(button => button.disabled));
        assert.equal(f.calls.final.length, 0);
        reaction.resolve(); await pending;
        assert.equal(f.calls.final.length, 1);
        assert.deepEqual(f.calls.final[0], [false, true]);
    } finally { reaction.resolve(); f.close(); }
});

test('starting a new word resets its drawing and guesses while retaining the adventure life budget', async () => {
    const f = fixture();
    try {
        await f.guess('B');
        f.w.question = { ...f.w.question, target: 'CARTE' };
        f.evaluate('quizActiv.questions = [window.question]; randareProvocare(window.question, false, window.monsterInfo); quizRaspunsBlocat = false;');
        assert.equal(f.state().lives, 2); assert.equal(f.state().hangman.guessed.length, 0);
        assert.equal(f.view().dataset.misses, '0'); assert.equal(f.view().dataset.maxMistakes, '2');
        assert.equal(f.document.querySelectorAll('[data-hangman-part][data-visible="true"]').length, 0);
        assert.equal(f.key('B').disabled, false);
    } finally { f.close(); }
});

test('leaving the quiz while a reaction is pending cannot repaint or resume the abandoned round', async () => {
    const f = fixture(); const reaction = deferred();
    try {
        f.w.CastleQuiz3D.wrong = () => reaction.promise;
        const pending = f.guess('B');
        f.w.inchideQuizPlayer();
        const afterExit = f.stage().innerHTML, dialogueCalls = f.calls.dialogue;
        reaction.resolve(); await pending;
        assert.equal(f.state().active, false); assert.equal(f.stage().innerHTML, afterExit);
        assert.equal(f.calls.dialogue, dialogueCalls); assert.equal(f.calls.final.length, 0);
        assert.equal(f.interval(), null);
    } finally { reaction.resolve(); f.close(); }
});

test('wrong-letter feedback pauses the timer and resumes the exact remaining seconds', async () => {
    const f = fixture(); const reaction = deferred();
    try {
        f.w.pornesteTimerQuiz(30);
        f.evaluate('quizTimpRamas = 7;');
        const firstTimer = f.interval().id;
        f.w.CastleQuiz3D.wrong = () => reaction.promise;
        const pending = f.guess('B');
        assert.equal(f.interval(), null); assert.equal(f.state().time, 7);
        reaction.resolve(); await pending;
        assert.ok(f.interval()); assert.notEqual(f.interval().id, firstTimer);
        assert.equal(f.state().time, 7, 'resuming does not reset to the normal minimum duration');
        f.interval().callback(); assert.equal(f.state().time, 6);
    } finally { reaction.resolve(); f.close(); }
});

test('timer expiry closes and locks the current word before the delayed penalty reaction', async () => {
    const f = fixture(); const reaction = deferred();
    try {
        f.w.CastleQuiz3D.wrong = () => reaction.promise;
        const pending = f.w.expiraProvocare();
        assert.equal(f.state().lives, 2, 'one timeout costs one adventure life');
        assert.equal(f.view().dataset.result, 'lost');
        assert.ok([...f.document.querySelectorAll('[data-letter]')].every(button => button.disabled));
        await f.guess('B'); assert.equal(f.state().lives, 2);
        reaction.resolve(); await pending;
        assert.ok(f.document.querySelector('#quizFeedback #quizNextButton'));
        assert.equal(f.interval(), null);
    } finally { reaction.resolve(); f.close(); }
});

test('an old reaction cannot replace a newly started word or its active input', async () => {
    const f = fixture(); const reaction = deferred();
    try {
        f.w.CastleQuiz3D.wrong = () => reaction.promise;
        const pending = f.guess('B');
        f.w.question = { ...f.w.question, target: 'CARTE' };
        f.evaluate('quizActiv.questions = [window.question]; randareProvocare(window.question, false, window.monsterInfo); quizRaspunsBlocat = false;');
        const fresh = f.stage().innerHTML;
        reaction.resolve(); await pending;
        assert.equal(f.state().hangman.target, 'CARTE');
        assert.equal(f.stage().innerHTML, fresh);
        assert.equal(f.calls.dialogue, 0);
        assert.equal(f.state().locked, false);
        assert.equal(f.key('B').disabled, false);
    } finally { reaction.resolve(); f.close(); }
});

test('untrusted target text cannot create active markup in the illustrated view', () => {
    const f = fixture('<img src=x onerror="alert(1)">');
    try {
        assert.equal(f.stage().querySelectorAll('img,script,iframe').length, 0);
        assert.equal(f.stage().querySelectorAll('[onerror],[onclick]').length, 0);
        assert.ok(!f.stage().innerHTML.includes('<img'));
    } finally { f.close(); }
});

test('keyboard focus stays in the board during a pending mistake and returns to available input', async () => {
    const f = fixture(); const reaction = deferred();
    try {
        f.key('B').focus();
        f.w.CastleQuiz3D.wrong = () => reaction.promise;
        const pending = f.guess('B');
        assert.equal(f.document.activeElement, f.view());
        reaction.resolve(); await pending;
        assert.ok(f.document.activeElement.matches('[data-letter]:not(:disabled)'));
    } finally { reaction.resolve(); f.close(); }
});

test('hangman questions require a guessable letter rather than only visible punctuation or numbers', () => {
    const f = fixture();
    try {
        assert.equal(f.w.normalizeazaIntrebariQuiz([{ text: 'Întrebare', target: '2026 — !' }], 'castle_hangman').length, 0);
        assert.equal(f.w.normalizeazaIntrebariQuiz([{ text: 'Întrebare', target: 'ȘCOALĂ — 26' }], 'castle_hangman').length, 1);
    } finally { f.close(); }
});
