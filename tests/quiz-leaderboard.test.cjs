const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const turn = () => new Promise(resolve => setImmediate(resolve));
function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }
function fixture() {
    const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://example.test/', runScripts: 'outside-only' });
    const w = dom.window, context = dom.getInternalVMContext();
    const run = file => vm.runInContext(read(file), context);
    run('js/layout/quiz-page.js'); run('js/layout/admin-panel/quiz-list.js');
    vm.runInContext('document.body.innerHTML = QUIZ_HTML + ADMIN_QUIZ_LIST_HTML', context);
    let handler = async () => ({ data: [], error: null });
    const calls = [], confirmations = [];
    w.supabaseClient = { rpc: async (name, args) => { calls.push({ name, args: args && JSON.parse(JSON.stringify(args)) }); return handler(name, args); } };
    w.confirm = message => { confirmations.push(message); return true; };
    run('js/site/quiz-leaderboard.js');
    const boards = () => [...w.document.querySelectorAll('[data-quiz-leaderboard]')];
    const result = () => {
        const holder = w.document.getElementById('quizRezultat'); holder.classList.remove('ascuns');
        holder.innerHTML = '<div class="quiz-result-card"><div class="quiz-result-actions"><button>Înapoi</button></div></div>';
        return holder;
    };
    return { w, calls, confirmations, api: w.QuizLeaderboard, boards, result, close: () => w.close(),
        rpc: next => { handler = next; },
        login: async (role = 'elev', id = 'student-a') => { w.QuizLeaderboard.setUser({ id }, role); await turn(); },
        content: () => boards()[0].querySelector('[data-leaderboard-content]') };
}
const score = { attemptId: 'attempt-a', quizId: 'quiz-a', correct: 2, total: 3 };

test('ranking asks signed-out users to connect and never exposes admin reset', async () => {
    const f = fixture();
    try {
        assert.match(f.content().textContent, /Conectează-te/);
        assert.equal(f.boards()[1].hidden, true);
        assert.equal(await f.api.reset(), false);
        assert.equal(await f.api.refresh(), false);
        assert.equal(await f.api.submit(score), false);
        assert.deepEqual(f.calls, []);
    } finally { f.close(); }
});

test('authenticated views show shared totals, safe aliases, current user and single-point grammar', async () => {
    const f = fixture();
    try {
        f.rpc(async () => ({ data: [
            { user_id: 'student-a', display_name: '<img src=x onerror=alert(1)>', points: 8, games: 3 },
            { user_id: 'student-b', display_name: 'Mihai', points: 1, games: 1 }
        ] }));
        await f.login();
        assert.equal(f.content().querySelectorAll('li').length, 2);
        assert.equal(f.content().querySelectorAll('img').length, 0);
        assert.match(f.content().textContent, /<img src=x onerror=alert\(1\)>/);
        assert.match(f.content().textContent, /8 puncte/);
        assert.match(f.content().textContent, /1 punct/);
        assert.match(f.content().textContent, /1 joc finalizat/);
        assert.equal(f.content().querySelector('.is-current .quiz-leaderboard-you').textContent, 'Tu');
        assert.equal(f.boards()[1].hidden, true);
        assert.equal(await f.api.reset(), false);
        assert.equal(f.confirmations.length, 0);
        assert.equal(typeof f.w.incarcaClasamentQuiz, 'function');
    } finally { f.close(); }
});

test('failed ranking requests show an actionable retry and an empty state after successful retry', async () => {
    const f = fixture();
    try {
        f.rpc(async () => ({ error: { message: 'unavailable' } })); await f.login();
        assert.match(f.content().textContent, /nu poate fi încărcat/);
        f.rpc(async () => ({ data: [] })); f.content().querySelector('button').click(); await turn();
        assert.match(f.content().textContent, /Clasamentul este gol/);
    } finally { f.close(); }
});

test('pending ranking responses cannot repopulate the board after logout or a different user login', async () => {
    const f = fixture();
    try {
        const old = deferred(); f.rpc(() => old.promise); await f.login();
        f.api.setUser(null, null);
        old.resolve({ data: [{ user_id: 'student-a', display_name: 'Veche', points: 99, games: 1 }] }); await turn();
        assert.match(f.content().textContent, /Conectează-te/); assert.doesNotMatch(f.content().textContent, /Veche/);
        const next = deferred(); f.rpc(() => next.promise); await f.login('admin', 'admin-a');
        f.rpc(async () => ({ data: [{ user_id: 'student-b', display_name: 'Nou', points: 2, games: 1 }] }));
        await f.login('elev', 'student-b'); next.resolve({ data: [{ user_id: 'student-a', display_name: 'Veche', points: 99, games: 1 }] }); await turn();
        assert.match(f.content().textContent, /Nou/); assert.doesNotMatch(f.content().textContent, /Veche/);
        assert.equal(f.boards()[1].hidden, true);
    } finally { f.close(); }
});

test('only an admin can confirm a reset, pending clicks do not duplicate it and both boards refresh', async () => {
    const f = fixture();
    try {
        let rows = [{ user_id: 'student-a', display_name: 'Ana', points: 5, games: 1 }];
        const saving = deferred();
        f.rpc(name => name === 'reset_quiz_leaderboard' ? saving.promise : Promise.resolve({ data: rows }));
        await f.login('admin', 'admin-a');
        assert.equal(f.boards()[1].hidden, false);
        f.w.confirm = () => false; assert.equal(await f.api.reset(), false);
        assert.equal(f.calls.filter(call => call.name === 'reset_quiz_leaderboard').length, 0);
        f.w.confirm = message => { f.confirmations.push(message); return true; };
        const pending = f.api.reset(); assert.equal(await f.api.reset(), false);
        assert.equal(f.boards()[1].querySelector('[data-leaderboard-reset]').disabled, true);
        rows = []; saving.resolve({ data: null }); assert.equal(await pending, true);
        assert.equal(f.calls.filter(call => call.name === 'reset_quiz_leaderboard').length, 1);
        assert.equal(f.confirmations.length, 1);
        for (const board of f.boards()) assert.match(board.querySelector('[data-leaderboard-content]').textContent, /Clasamentul este gol/);
        assert.match(f.boards()[1].querySelector('[data-leaderboard-admin-status]').textContent, /a fost golit/);
    } finally { f.close(); }
});

test('a rejected reset retains entries and reports failure without announcing successful deletion', async () => {
    const f = fixture();
    try {
        f.rpc(async name => name === 'reset_quiz_leaderboard' ? { error: { message: 'forbidden' } }
            : { data: [{ user_id: 'a', display_name: 'Ana', points: 2, games: 1 }] });
        await f.login('admin', 'admin-a'); assert.equal(await f.api.reset(), false);
        assert.match(f.content().textContent, /Ana/);
        assert.match(f.boards()[1].querySelector('[data-leaderboard-admin-status]').textContent, /nu a putut fi golit/);
        assert.equal(f.boards()[1].querySelector('[data-leaderboard-reset]').disabled, false);
    } finally { f.close(); }
});

test('a pending admin reset cannot overwrite another user session when it completes', async () => {
    const f = fixture();
    try {
        const write = deferred();
        f.rpc(name => name === 'reset_quiz_leaderboard' ? write.promise : Promise.resolve({ data: [] }));
        await f.login('admin', 'admin-a'); const pending = f.api.reset();
        await f.login('elev', 'student-b'); write.resolve({ data: null }); assert.equal(await pending, false);
        assert.equal(f.boards()[1].hidden, true);
        assert.equal(f.boards()[1].querySelector('[data-leaderboard-admin-status]').textContent, '');
        assert.match(f.content().textContent, /Clasamentul este gol/);
    } finally { f.close(); }
});

test('completed student games submit once by attempt ID, pass counts instead of arbitrary bonus scores and refresh shared totals', async () => {
    const f = fixture();
    try {
        let saved = false;
        const write = deferred();
        f.rpc(name => name === 'submit_quiz_score' ? write.promise : Promise.resolve({ data: saved ? [{ user_id: 'student-a', display_name: 'Ana', points: 2, games: 1 }] : [] }));
        await f.login(); const result = f.result();
        const first = f.api.submit({ ...score, score: 9000 }); const second = f.api.submit(score);
        assert.equal(first, second); assert.match(result.textContent, /Se salvează/);
        assert.deepEqual(f.calls.find(call => call.name === 'submit_quiz_score').args,
            { p_attempt_id: 'attempt-a', p_quiz_id: 'quiz-a', p_correct: 2, p_total: 3 });
        saved = true; write.resolve({ data: null }); assert.equal(await first, true); await turn();
        assert.match(result.textContent, /au fost adăugate/); assert.match(f.content().textContent, /2 puncte/);
        assert.equal(await f.api.submit(score), true);
        assert.equal(f.calls.filter(call => call.name === 'submit_quiz_score').length, 1);
    } finally { f.close(); }
});

test('failed result saves offer retry with the same attempt ID so backend idempotence can protect ambiguous failures', async () => {
    const f = fixture();
    try {
        let fail = true;
        f.rpc(async name => name === 'submit_quiz_score' && fail ? { error: { message: 'network' } } : { data: [] });
        await f.login(); const result = f.result();
        assert.equal(await f.api.submit(score), false); assert.match(result.textContent, /nu au fost salvate/);
        fail = false; result.querySelector('.quiz-leaderboard-save button').click(); await turn();
        assert.match(result.textContent, /au fost adăugate/);
        const writes = f.calls.filter(call => call.name === 'submit_quiz_score');
        assert.equal(writes.length, 2); assert.equal(writes[0].args.p_attempt_id, writes[1].args.p_attempt_id);
    } finally { f.close(); }
});

test('an earlier result save cannot attach feedback to a restarted game result', async () => {
    const f = fixture();
    try {
        const write = deferred();
        f.rpc(name => name === 'submit_quiz_score' ? write.promise : Promise.resolve({ data: [] }));
        await f.login(); f.result(); const pending = f.api.submit(score);
        const nextResult = f.result(); write.resolve({ data: null }); await pending; await turn();
        assert.equal(nextResult.querySelector('.quiz-leaderboard-save'), null);
    } finally { f.close(); }
});

test('teacher and admin practice results never contribute student leaderboard points', async () => {
    const f = fixture();
    try {
        for (const role of ['profesor', 'admin']) { await f.login(role); f.result(); assert.equal(await f.api.submit(score), false); }
        assert.equal(f.calls.filter(call => call.name === 'submit_quiz_score').length, 0);
    } finally { f.close(); }
});
