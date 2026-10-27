const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function fixture(target = 'ȘCOALĂ') {
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
    w.CastleQuiz3D = { correct: async () => { calls.correct++; }, wrong: async () => { calls.wrong++; }, dispose() {} };
    w.almaIcon = () => '';
    run('js/layout/quiz-worlds.js'); run('js/site/hangman-view.js'); run('js/site/quiz.js');
    w.afiseazaDialogCastel = async () => { calls.dialogue++; };
    w.finalizeazaQuiz = async (...args) => { calls.final.push(args); };
    w.question = { type: 'hangman', text: 'Ghicește cuvântul', target, monster: 'goblin' };
    w.monsterInfo = { name: 'Goblin', icon: '●' };
    evaluate(`quizActiv = { id: 'hangman-test', game_mode: 'castle_hangman', world_theme: 'castle', questions: [window.question] };
      quizIndexIntrebare = 0; quizVieti = 6; quizScor = 0; quizCorecte = 0;
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
        interval: () => interval, close: () => dom.window.close()
    };
}

test('the initial drawing uses six attempts and hides only the guessable letters', () => {
    const f = fixture('ȘCOALĂ-26 „ROMÂNĂ”');
    try {
        const view = f.view(); assert.ok(view);
        assert.equal(view.dataset.misses, '0'); assert.equal(view.dataset.result, 'playing');
        assert.equal(view.dataset.maxMistakes, '6'); assert.equal(f.state().lives, 6);
        assert.equal(f.document.querySelectorAll('[data-hangman-part][data-visible="true"]').length, 0);
        const hidden = [...f.document.querySelectorAll('.hangman-tile[data-revealed="false"]')];
        assert.equal(hidden.length, 12);
        hidden.forEach(tile => assert.equal(tile.textContent.trim(), '_'));
        for (const text of ['ȘCOALĂ','ROMÂNĂ']) {
            assert.ok(!f.stage().textContent.includes(text)); assert.ok(!f.stage().innerHTML.includes(text));
        }
        assert.ok(f.stage().textContent.includes('26'));
        assert.equal(f.document.querySelectorAll('[data-letter]').length, 31);
        assert.equal(new Set([...f.document.querySelectorAll('[id]')].map(node => node.id)).size, f.document.querySelectorAll('[id]').length);
    } finally { f.close(); }
});

test('Romanian diacritic aliases reveal matching letters once and preserve six attempts', async () => {
    const f = fixture();
    try {
        await f.guess('ș');
        for (const letter of ['S','Ș']) {
            assert.equal(f.key(letter).disabled, true); assert.equal(f.key(letter).dataset.keyState, 'correct');
            assert.match(f.key(letter).getAttribute('aria-label'), /găsită/);
        }
        assert.ok([...f.document.querySelectorAll('.hangman-tile[data-revealed="true"]')].some(tile => tile.textContent === 'Ș'));
        await f.guess('A');
        for (const letter of ['A','Ă','Â']) assert.equal(f.key(letter).disabled, true);
        const before = f.state(); await f.guess('Ă'); await f.guess('Ș');
        assert.deepEqual(f.state(), before); assert.equal(f.calls.wrong, 0); assert.equal(f.state().lives, 6);
    } finally { f.close(); }
});

test('physical keyboard input is scoped to the board and ignores repeat or editing shortcuts', () => {
    const f = fixture();
    try {
        f.key('S').focus(); f.key('S').dispatchEvent(new f.w.KeyboardEvent('keydown', { key:'ș', bubbles:true }));
        assert.ok(f.state().hangman.guessed.includes('S'));
        assert.ok(f.document.activeElement.matches('[data-letter]:not(:disabled)'));
        const before = f.state();
        const send = (target,key,options={}) => target.dispatchEvent(new f.w.KeyboardEvent('keydown', { key,bubbles:true,...options }));
        for (const options of [{repeat:true},{ctrlKey:true},{metaKey:true},{altKey:true}]) send(f.key('B'),'B',options);
        send(f.stage(),'B');
        const field = f.document.createElement('input'); f.view().appendChild(field); send(field,'B');
        assert.deepEqual(f.state(), before);
    } finally { f.close(); }
});

test('invalid guesses cannot mark a key, spend an attempt or call a monster reaction', async () => {
    const f = fixture();
    try {
        const before = f.state();
        for (const value of ['', 'AA', '1', '-', '🙂', 'Shift', null]) await f.guess(value);
        assert.deepEqual(f.state(),before); assert.equal(f.calls.wrong,0); assert.equal(f.calls.correct,0);
    } finally { f.close(); }
});

test('a phrase with numbers, spaces and punctuation wins after its letters are discovered', async () => {
    const f = fixture('„ȘCOALĂ” — 26!');
    try {
        for (const letter of ['Ș','C','O','A','L']) await f.guess(letter);
        assert.equal(f.view().dataset.result,'won'); assert.equal(f.state().score,100); assert.equal(f.state().lives,6);
        assert.equal(f.document.querySelectorAll('.hangman-tile[data-revealed="false"]').length,0);
        assert.ok(f.stage().textContent.includes('26')); assert.equal(f.calls.correct,0); assert.equal(f.calls.dialogue,0);
    } finally { f.close(); }
});

test('each new wrong letter costs one attempt and reveals one part without combat', async () => {
    const f = fixture();
    try {
        await f.guess('B');
        assert.equal(f.state().lives,5); assert.equal(f.state().hangman.misses,1);
        assert.equal(f.view().dataset.misses,'1');
        assert.equal(f.document.querySelectorAll('[data-hangman-part][data-visible="true"]').length,1);
        assert.equal(f.key('B').dataset.keyState,'wrong'); assert.match(f.key('B').getAttribute('aria-label'),/greșită/);
        await f.guess('B'); assert.equal(f.state().lives,5);
        await f.guess('Z'); assert.equal(f.state().lives,4);
        assert.equal(f.document.querySelectorAll('[data-hangman-part][data-visible="true"]').length,2);
        assert.equal(f.key('B').disabled,true); assert.equal(f.key('O').disabled,false);
        assert.equal(f.calls.wrong,0); assert.equal(f.calls.dialogue,0);
    } finally { f.close(); }
});

test('solving a word locks the completed view and awards its score once', async () => {
    const f = fixture('AĂ');
    try {
        await f.guess('A');
        assert.equal(f.view().dataset.result,'won'); assert.equal(f.state().score,100); assert.equal(f.state().correct,1);
        assert.ok([...f.document.querySelectorAll('[data-letter]')].every(button => button.disabled));
        assert.equal(f.document.querySelectorAll('.hangman-tile[data-revealed="false"]').length,0);
        await f.guess('Ă'); await f.guess('Z');
        assert.equal(f.state().score,100); assert.equal(f.calls.correct,0);
        assert.ok(f.document.querySelector('#quizFeedback #quizNextButton'));
    } finally { f.close(); }
});

test('six mistakes complete the drawing and game over happens exactly once', async () => {
    const f = fixture('CASĂ');
    try {
        for (const [index,letter] of [...'BDEFGH'].entries()) {
            await f.guess(letter);
            assert.equal(f.state().lives,5-index);
            assert.equal(f.document.querySelectorAll('[data-hangman-part][data-visible="true"]').length,index+1);
        }
        assert.equal(f.view().dataset.result,'lost'); assert.equal(f.view().dataset.maxMistakes,'6');
        assert.ok([...f.document.querySelectorAll('[data-letter]')].every(button => button.disabled));
        assert.deepEqual(f.calls.final,[[false,true]]);
        await f.guess('Z'); assert.equal(f.calls.final.length,1); assert.equal(f.calls.wrong,0);
    } finally { f.close(); }
});

test('a new word resets the drawing, guessed keys and all six attempts', async () => {
    const f = fixture();
    try {
        await f.guess('B'); assert.equal(f.state().lives,5);
        f.w.question = {...f.w.question,target:'CARTE'};
        f.evaluate('quizActiv.questions = [window.question]; randareProvocare(window.question, false, window.monsterInfo); quizRaspunsBlocat = false;');
        assert.equal(f.state().lives,6); assert.equal(f.state().hangman.guessed.length,0);
        assert.equal(f.view().dataset.misses,'0'); assert.equal(f.view().dataset.maxMistakes,'6');
        assert.equal(f.document.querySelectorAll('[data-hangman-part][data-visible="true"]').length,0);
        assert.equal(f.key('B').disabled,false);
    } finally { f.close(); }
});

test('wrong-letter feedback retains the exact remaining seconds without a 3D reaction', async () => {
    const f = fixture();
    try {
        f.w.pornesteTimerQuiz(30); f.evaluate('quizTimpRamas = 7;');
        await f.guess('B');
        assert.ok(f.interval()); assert.equal(f.state().time,7);
        f.interval().callback(); assert.equal(f.state().time,6);
        assert.equal(f.calls.wrong,0); assert.equal(f.calls.dialogue,0);
    } finally { f.close(); }
});

test('timeout spends one attempt, locks the word and allows continuing without a monster', async () => {
    const f = fixture();
    try {
        await f.w.expiraProvocare();
        assert.equal(f.state().lives,5); assert.equal(f.view().dataset.result,'lost');
        assert.ok([...f.document.querySelectorAll('[data-letter]')].every(button => button.disabled));
        await f.guess('B'); assert.equal(f.state().lives,5);
        assert.ok(f.document.querySelector('#quizFeedback #quizNextButton')); assert.equal(f.interval(),null);
        assert.equal(f.calls.wrong,0); assert.equal(f.calls.dialogue,0);
    } finally { f.close(); }
});

test('untrusted target text cannot create active markup in the illustrated view', () => {
    const f = fixture('<img src=x onerror="alert(1)">');
    try {
        assert.equal(f.stage().querySelectorAll('img,script,iframe').length,0);
        assert.equal(f.stage().querySelectorAll('[onerror],[onclick]').length,0);
        assert.ok(!f.stage().innerHTML.includes('<img'));
    } finally { f.close(); }
});

test('keyboard focus moves to an available letter after a wrong key is replaced', async () => {
    const f = fixture();
    try {
        f.key('B').focus(); await f.guess('B');
        assert.ok(f.document.activeElement.matches('[data-letter]:not(:disabled)'));
    } finally { f.close(); }
});

test('hangman questions require a guessable letter rather than punctuation or numbers only', () => {
    const f = fixture();
    try {
        assert.equal(f.w.normalizeazaIntrebariQuiz([{text:'Întrebare',target:'2026 — !'}],'castle_hangman').length,0);
        assert.equal(f.w.normalizeazaIntrebariQuiz([{text:'Întrebare',target:'ȘCOALĂ — 26'}],'castle_hangman').length,1);
    } finally { f.close(); }
});
