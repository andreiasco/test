const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

function rawQuiz(mode = 'castle_choice', world = 'castle', id = 'route-test') {
    const common = { text: 'ÎNTREBARE SECRETĂ', monster: 'goblin' };
    const question = mode === 'castle_hangman' ? { ...common, target: 'RĂSPUNS SECRET' }
        : mode === 'castle_ordering' ? { ...common, items: ['ELEMENT SECRET A', 'ELEMENT SECRET B'] }
        : { ...common, answers: ['VARIANTĂ SECRETĂ A', 'VARIANTĂ SECRETĂ B'], correctIndex: 1 };
    return { id, title: `Aventura ${id}`, world_theme: world, game_mode: mode, seconds_per_question: 30,
        questions: [question, { ...question, monster: 'knight' }, { ...question, monster: 'dragon' }] };
}

function fixture() {
    const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://example.test/', runScripts: 'outside-only' });
    const w = dom.window, context = dom.getInternalVMContext();
    const evaluate = code => vm.runInContext(code, context);
    const run = file => evaluate(read(file));
    run('js/layout/quiz-worlds.js');
    run('js/layout/quiz-page.js');
    evaluate('document.body.innerHTML = QUIZ_HTML');
    const preview = w.document.createElement('div'); preview.id = 'adminQuizPreview'; preview.className = 'ascuns';
    preview.innerHTML = '<div id="adminQuizPreviewContent"></div>'; w.document.body.appendChild(preview);
    const calls = { login: 0, init: [], encounter: [], next: 0, showMap: 0, final: [] };
    let interval = null, intervalSerial = 0;
    w.setInterval = callback => { interval = { id: ++intervalSerial, callback }; return interval.id; };
    w.clearInterval = id => { if (interval?.id === id) interval = null; };
    w.supabaseClient = { auth: { getSession: async () => ({ data: { session: { user: { id: 'student' } } } }) } };
    w.afiseazaLogin = () => calls.login++;
    w.almaIcon = () => '';
    w.CastleQuizAudio = new Proxy({}, { get: () => () => {} });
    w.CastleQuiz3D = {
        async init(canvas, world, options) { calls.init.push({ canvas, world, options }); w.initOptions = options; return true; },
        async encounter(...args) { calls.encounter.push(args); },
        async nextRoom() { calls.next++; },
        async showMap() { calls.showMap++; },
        correct: async () => {}, wrong: async () => {}, victory: async () => {}, gameOver: async () => {},
        getRoomName: index => `Întâlnirea ${index + 1}`, skip() {}, dispose() {}
    };
    run('js/site/hangman-view.js');
    run('js/site/quiz.js');
    const finish = w.finalizeazaQuiz;
    w.afiseazaDialogCastel = async () => {};
    w.finalizeazaQuiz = async (...args) => calls.final.push(args);
    w.initializeazaQuizPlayer();
    const el = id => w.document.getElementById(id);
    const emit = detail => el('castleCanvas').dispatchEvent(new w.CustomEvent('castle-route', { detail }));
    const state = () => clone(evaluate('({active: quizActiv && {id:quizActiv.id, world:quizActiv.world_theme}, index:quizIndexIntrebare, locked:quizRaspunsBlocat, score:quizScor, lives:quizVieti, preview:quizEstePreview})'));
    return { w, calls, evaluate, el, emit, state, interval: () => interval,
        launch: (raw = rawQuiz(), previewMode = false) => w.pornesteQuizCuDate(raw, previewMode),
        finish: (...args) => finish(...args),
        close: () => dom.window.close() };
}

test('choose-answer adventures launch the map with normalized questions in every selected world', async t => {
    for (const [mode, world, type] of [
        ['castle_choice', 'castle', 'multiple_choice'], ['castle_choice', 'snow', 'multiple_choice'],
        ['castle_choice', 'desert', 'multiple_choice'], ['castle_choice', 'jungle', 'multiple_choice']
    ]) await t.test(`${mode} in ${world}`, async () => {
        const f = fixture();
        try {
            await f.launch(rawQuiz(mode, world));
            assert.equal(f.calls.init.length, 1);
            const init = f.calls.init[0];
            assert.equal(init.canvas, f.el('castleCanvas'));
            assert.equal(init.world, world);
            assert.ok(init.options?.questions, 'the route receives questions rather than only a world label');
            assert.equal(f.evaluate('quizActiv.questions === window.initOptions.questions'), true);
            assert.equal(init.options.questions.length, 3);
            assert.ok(init.options.questions.every(question => question.type === type));
            assert.equal(init.options.questions.at(-1).boss, true);
            assert.deepEqual(clone(f.calls.encounter[0]), ['goblin', false, 0]);
            assert.equal(f.state().lives, 3);
            assert.equal(f.state().locked, false);
            assert.ok(f.interval(), 'the question timer starts after reaching the first monster');
        } finally { f.close(); }
    });
});

test('walking to an encounter gates question input and its timer until arrival', async () => {
    const f = fixture(), arrival = deferred();
    try {
        f.w.CastleQuiz3D.encounter = async (...args) => { f.calls.encounter.push(args); await arrival.promise; };
        const pending = f.launch();
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(f.state().locked, true);
        assert.equal(f.interval(), null, 'travel time is not deducted from the answer timer');
        assert.equal(f.el('quizQuestionStage').querySelectorAll('[data-answer-index]').length, 0);
        arrival.resolve(); await pending;
        assert.equal(f.state().locked, false);
        assert.ok(f.interval());
        assert.equal(f.el('quizQuestionStage').querySelectorAll('[data-answer-index]').length, 2);
    } finally { arrival.resolve(); f.close(); }
});

test('route events show linear current/completed/passed stops without revealing questions or allowing jumps', async () => {
    const f = fixture();
    try {
        await f.launch();
        f.emit({ phase: 'encounter', index: 1, total: 3, world: 'castle', completed: [0], outcomes: { 0: 'won' }, overview: false });
        const hud = f.el('quizRouteHud'), stops = [...f.el('quizRouteStops').children];
        assert.ok(!hud.hidden);
        assert.equal(stops.length, 3);
        assert.ok(stops[0].classList.contains('is-complete'));
        assert.equal(stops[1].getAttribute('aria-current'), 'step');
        assert.ok(stops[2].classList.contains('is-future'));
        assert.ok(stops[2].classList.contains('is-boss'));
        assert.equal(f.el('quizRouteStops').querySelectorAll('button,a,[tabindex="0"]').length, 0, 'future nodes are informational');
        assert.ok(!/SECRET/.test(hud.textContent));
        const before = f.state(), encounters = f.calls.encounter.length;
        stops[2].click();
        assert.deepEqual(f.state(), before); assert.equal(f.calls.encounter.length, encounters);
        f.emit({ phase: 'resolved', index: 1, total: 3, world: 'castle', completed: [0, 1], outcomes: { 0: 'won', 1: 'passed' }, overview: false });
        assert.ok(f.el('quizRouteStops').children[1].classList.contains('is-passed'));
        f.emit({ phase: 'unavailable', index: 0, total: 3, world: 'castle', completed: [], outcomes: {}, overview: false });
        assert.equal(hud.hidden, true, 'the existing quiz can continue without a WebGL map');
    } finally { f.close(); }
});

test('the map toggle respects travel/combat locks and is not duplicated by repeated initialization', async () => {
    const f = fixture();
    try {
        await f.launch();
        f.w.initializeazaQuizPlayer(); f.w.initializeazaQuizPlayer();
        const detail = { index: 0, total: 3, world: 'castle', completed: [], outcomes: {}, overview: false };
        const button = f.el('quizMapToggle');
        for (const phase of ['travelling', 'combat', 'finished']) {
            f.emit({ ...detail, phase });
            assert.equal(button.disabled, true, `${phase}: camera controls wait for the action to finish`);
            button.click();
        }
        assert.equal(f.calls.showMap, 0);
        f.emit({ ...detail, phase: 'encounter' });
        assert.equal(button.disabled, false); button.click();
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(f.calls.showMap, 1, 'one click invokes one map transition');
        f.emit({ ...detail, phase: 'overview', overview: true });
        assert.match(button.textContent, /Revino/i);
        f.w.inchideQuizPlayer();
        assert.equal(f.el('quizRouteHud').hidden, true);
    } finally { f.close(); }
});

test('signed-out visitors cannot initialize a route and the admin preview retains its player placement', async () => {
    const f = fixture();
    try {
        f.w.supabaseClient.auth.getSession = async () => ({ data: { session: null } });
        await f.launch();
        assert.equal(f.calls.login, 1); assert.equal(f.calls.init.length, 0); assert.equal(f.state().active, null);
        assert.equal(f.el('quizRouteHud').hidden, true);
        f.w.supabaseClient.auth.getSession = async () => ({ data: { session: { user: { id: 'admin' } } } });
        const originalParent = f.el('quizPlayer').parentNode;
        f.w.deschideContainerQuizPreview(); await f.launch(rawQuiz(), true);
        assert.equal(f.el('quizPlayer').parentNode, f.el('adminQuizPreviewContent'));
        assert.equal(f.state().preview, true);
        assert.equal(f.calls.init.length, 1); assert.equal(f.calls.init[0].options.questions.length, 3);
        f.w.inchideQuizPlayer(); f.w.inchideContainerQuizPreview();
        assert.equal(f.el('quizPlayer').parentNode, originalParent);
    } finally { f.close(); }
});

test('an abandoned path transition cannot advance an exited or newly restarted quiz', async t => {
    for (const restart of [false, true]) await t.test(restart ? 'restart' : 'exit', async () => {
        const f = fixture(), travel = deferred();
        try {
            await f.launch();
            f.w.CastleQuiz3D.nextRoom = async () => { f.calls.next++; await travel.promise; };
            const pending = f.w.urmatoareaIntrebareQuiz();
            await new Promise(resolve => setImmediate(resolve));
            f.w.inchideQuizPlayer();
            if (restart) await f.launch(rawQuiz('castle_choice', 'snow', 'new-quiz'));
            const before = f.state(), encounterCount = f.calls.encounter.length;
            travel.resolve(); await pending;
            assert.deepEqual(f.state(), before);
            assert.equal(f.calls.encounter.length, encounterCount, 'the old travel completion does not open another encounter');
            if (!restart) assert.ok(f.el('quizPlayer').classList.contains('ascuns'));
        } finally { travel.resolve(); f.close(); }
    });
});

test('repeated continue actions share one path transition and advance only one stop', async () => {
    const f = fixture(), travel = deferred();
    try {
        await f.launch();
        f.w.CastleQuiz3D.nextRoom = async () => { f.calls.next++; await travel.promise; };
        const first = f.w.urmatoareaIntrebareQuiz();
        const second = f.w.urmatoareaIntrebareQuiz();
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(f.calls.next, 1, 'a second click cannot start overlapping travel');
        travel.resolve(); await Promise.all([first, second]);
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(f.state().index, 1); assert.equal(f.calls.encounter.length, 2);
    } finally { travel.resolve(); f.close(); }
});

test('overview pauses answers and resumes the exact remaining time only after returning', async () => {
    const f = fixture(), entering = deferred(), returning = deferred();
    try {
        await f.launch();
        const detail = { index: 0, total: 3, world: 'castle', completed: [], outcomes: {} };
        f.emit({ ...detail, phase: 'encounter', overview: false });
        const tick = f.interval().callback;
        for (let i = 0; i < 7; i++) tick();
        assert.equal(f.el('quizTimer').textContent, '23s');
        f.w.CastleQuiz3D.showMap = async () => {
            f.calls.showMap++;
            const first = f.calls.showMap === 1;
            await (first ? entering.promise : returning.promise);
            f.emit({ ...detail, phase: first ? 'overview' : 'encounter', overview: first });
            return first;
        };
        f.el('quizMapToggle').click();
        assert.equal(f.state().locked, true);
        assert.equal(f.interval(), null);
        assert.equal(f.el('quizQuestionStage').hidden, true);
        assert.equal(f.el('quizMapToggle').disabled, true);
        await f.w.raspundeQuiz(1);
        assert.equal(f.state().score, 0, 'hidden answer callbacks cannot change the score');
        entering.resolve(); await new Promise(resolve => setImmediate(resolve));
        assert.equal(f.interval(), null);
        assert.equal(f.el('quizQuestionStage').hidden, true);
        assert.equal(f.el('quizMapToggle').disabled, false);
        f.el('quizMapToggle').click();
        assert.equal(f.interval(), null, 'the timer waits for the return camera transition');
        returning.resolve(); await new Promise(resolve => setImmediate(resolve));
        assert.equal(f.el('quizQuestionStage').hidden, false);
        assert.equal(f.state().locked, false);
        assert.equal(f.el('quizTimer').textContent, '23s');
        assert.ok(f.interval());
        f.interval().callback(); assert.equal(f.el('quizTimer').textContent, '22s');
    } finally { entering.resolve(); returning.resolve(); f.close(); }
});

test('choose-answer timeouts after map browsing lose one life and allow the next stop', async t => {
    for (const mode of ['castle_choice']) await t.test(mode, async () => {
        const f = fixture(), reaction = deferred();
        let wrongCalls = 0;
        try {
            await f.launch(rawQuiz(mode));
            const detail = { index: 0, total: 3, world: 'castle', completed: [], outcomes: {} };
            f.emit({ ...detail, phase: 'encounter', overview: false });
            const tick = f.interval().callback;
            for (let i = 0; i < 28; i++) tick();
            assert.equal(f.el('quizTimer').textContent, '2s');
            let overview = false;
            f.w.CastleQuiz3D.showMap = async () => {
                overview = !overview;
                f.emit({ ...detail, phase: 'encounter', overview }); return overview;
            };
            f.el('quizMapToggle').click(); await new Promise(resolve => setImmediate(resolve));
            assert.equal(f.interval(), null);
            assert.equal(f.state().lives, 3);
            f.el('quizMapToggle').click(); await new Promise(resolve => setImmediate(resolve));
            assert.equal(f.el('quizTimer').textContent, '2s');
            assert.ok(f.interval());
            f.w.CastleQuiz3D.wrong = async () => { wrongCalls++; await reaction.promise; };
            const resumedTick = f.interval().callback;
            resumedTick(); resumedTick();
            assert.equal(f.el('quizTimer').textContent, '0s');
            assert.equal(f.state().lives, 2, 'expiry applies one penalty after the paused timer resumes');
            assert.equal(f.state().locked, true);
            assert.equal(f.interval(), null);
            assert.equal(wrongCalls, 1);
            assert.ok([...f.el('quizQuestionStage').querySelectorAll('[data-answer-index]')].every(button => button.disabled));
            await f.w.expiraProvocare(); await f.w.raspundeQuiz(1);
            assert.equal(f.state().lives, 2, 'a queued expiry or click cannot repeat the penalty');
            assert.equal(f.state().score, 0); assert.equal(wrongCalls, 1);
            reaction.resolve(); await new Promise(resolve => setImmediate(resolve));
            assert.match(f.el('quizFeedback').textContent, /Timpul a expirat/);
            assert.ok(f.el('quizNextButton'));
            assert.equal(f.interval(), null);
            f.el('quizNextButton').click(); await new Promise(resolve => setImmediate(resolve));
            assert.equal(f.state().index, 1, 'the expired encounter can advance along the route');
            assert.equal(f.state().lives, 2); assert.ok(f.interval());
        } finally { reaction.resolve(); f.close(); }
    });
});

test('a refused camera transition keeps the visible view and its answer lock consistent', async () => {
    const f = fixture();
    try {
        await f.launch();
        const detail = { index: 0, total: 3, world: 'castle', completed: [], outcomes: {} };
        f.emit({ ...detail, phase: 'encounter', overview: false });
        f.w.CastleQuiz3D.showMap = async () => undefined;
        f.el('quizMapToggle').click(); await new Promise(resolve => setImmediate(resolve));
        assert.equal(f.el('quizQuestionStage').hidden, false);
        assert.equal(f.state().locked, false); assert.ok(f.interval());
        f.w.CastleQuiz3D.showMap = async () => {
            f.emit({ ...detail, phase: 'overview', overview: true }); return true;
        };
        f.el('quizMapToggle').click(); await new Promise(resolve => setImmediate(resolve));
        f.w.CastleQuiz3D.showMap = async () => undefined;
        f.el('quizMapToggle').click(); await new Promise(resolve => setImmediate(resolve));
        assert.equal(f.el('quizQuestionStage').hidden, true, 'refusing a return leaves the overview open');
        assert.equal(f.state().locked, true); assert.equal(f.interval(), null);
    } finally { f.close(); }
});

test('camera controls wait for encounter dialogue and ready question input', async () => {
    const f = fixture(), dialogue = deferred();
    try {
        const detail = { index: 0, total: 3, world: 'castle', completed: [], outcomes: {}, overview: false };
        f.w.CastleQuiz3D.encounter = async () => f.emit({ ...detail, phase: 'encounter' });
        f.w.afiseazaDialogCastel = async icon => { if (icon !== 'world') await dialogue.promise; };
        const pending = f.launch();
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(f.state().locked, true);
        assert.equal(f.el('quizMapToggle').disabled, true);
        f.el('quizMapToggle').click(); assert.equal(f.calls.showMap, 0);
        dialogue.resolve(); await pending;
        assert.equal(f.state().locked, false);
        assert.equal(f.el('quizMapToggle').disabled, false);
        assert.ok(f.interval());
    } finally { dialogue.resolve(); f.close(); }
});

test('completed-answer feedback enables map browsing while retaining the answer lock', async () => {
    const f = fixture();
    try {
        await f.launch();
        const detail = { index: 0, total: 3, world: 'castle', completed: [], outcomes: {}, overview: false };
        f.emit({ ...detail, phase: 'encounter' });
        f.w.CastleQuiz3D.correct = async () => f.emit({ ...detail, phase: 'resolved' });
        await f.w.raspundeQuiz(1);
        assert.equal(f.state().locked, true);
        assert.ok(f.el('quizNextButton'));
        assert.equal(f.el('quizMapToggle').disabled, false);
        assert.equal(f.interval(), null);
    } finally { f.close(); }
});

test('arrival and encounter dialogue from an old run cannot unlock a new quiz', async t => {
    for (const phase of ['arrival', 'dialogue']) await t.test(phase, async () => {
        const f = fixture(), wait = deferred();
        try {
            if (phase === 'arrival') f.w.CastleQuiz3D.encounter = async () => wait.promise;
            else f.w.afiseazaDialogCastel = async icon => { if (icon !== 'world') await wait.promise; };
            const pending = f.launch();
            await new Promise(resolve => setImmediate(resolve));
            f.w.inchideQuizPlayer();
            f.w.CastleQuiz3D.encounter = async () => {};
            f.w.afiseazaDialogCastel = async () => {};
            await f.launch(rawQuiz('castle_hangman', 'jungle', 'new-adventure'));
            const state = f.state(), stage = f.el('quizQuestionStage').innerHTML;
            wait.resolve(); await pending;
            assert.deepEqual(f.state(), state);
            assert.equal(f.el('quizQuestionStage').innerHTML, stage);
            assert.equal(f.el('quizQuestionStage').querySelectorAll('[data-answer-index]').length, 0);
        } finally { wait.resolve(); f.close(); }
    });
});

test('an abandoned ending cannot apply its bonus or result to a restarted route', async () => {
    const f = fixture(), ending = deferred();
    try {
        await f.launch();
        f.w.CastleQuiz3D.victory = async () => ending.promise;
        const pending = f.finish(true);
        await new Promise(resolve => setImmediate(resolve));
        f.w.inchideQuizPlayer(); await f.launch(rawQuiz('castle_choice', 'snow', 'fresh-route'));
        const state = f.state();
        ending.resolve(); await pending;
        assert.deepEqual(f.state(), state);
        assert.ok(f.el('quizRezultat').classList.contains('ascuns'));
    } finally { ending.resolve(); f.close(); }
});

test('reinitializing the route does not duplicate sound, skip, or close listeners', async () => {
    const f = fixture();
    try {
        await f.launch();
        f.w.initializeazaQuizPlayer(); f.w.initializeazaQuizPlayer();
        let skipped = 0, disposed = 0;
        f.w.CastleQuiz3D.skip = () => skipped++;
        f.w.CastleQuiz3D.dispose = () => disposed++;
        f.el('quizSoundToggle').click();
        assert.equal(f.evaluate('quizSoundEnabled'), false);
        f.el('castleSkipAnimation').click(); assert.equal(skipped, 1);
        f.el('quizCloseButton').click(); assert.equal(disposed, 1);
    } finally { f.close(); }
});
