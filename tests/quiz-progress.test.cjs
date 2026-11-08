const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const source = fs.readFileSync(path.join(__dirname, '../js/site/progress.js'), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const user = { id: 'student-one', email: 'student@example.test' };
const empty = { quizuri: [], materiale: [], totalPuncte: 0, quizuriCastigate: 0, raspunsuriCorecte: 0 };

function fixture({ local, cloud, cloudError = null, role = 'elev' } = {}) {
    const dom = new JSDOM('<!doctype html><body><button id="profileButton"></button><div id="profileEmail"></div><div id="profileStats"></div><div id="profileBadges"></div><div id="profileRecommendation"></div><div id="profileHistory"></div><div id="profileBestScore"></div></body>', { url: 'https://example.test', runScripts: 'outside-only' });
    const w = dom.window, calls = { writes: [], reads: 0, leaderboard: 0 };
    w.console.warn = () => {};
    w.rolUtilizatorCurent = role;
    w.QuizLeaderboard = { submit: () => calls.leaderboard++ };
    w.supabaseClient = {
        from(table) {
            assert.equal(table, 'user_progress');
            return {
                select(column) {
                    assert.equal(column, 'progress_data');
                    return { eq(column, id) {
                        assert.equal(column, 'user_id'); assert.equal(id, user.id);
                        return { async maybeSingle() {
                            calls.reads++;
                            return { data: cloud === undefined ? null : { progress_data: cloud }, error: cloudError };
                        } };
                    } };
                },
                async upsert(payload, options) {
                    assert.deepEqual(plain(options), { onConflict: 'user_id' });
                    calls.writes.push(plain(payload));
                    return { error: null };
                }
            };
        },
        rpc() { assert.fail('personal progress cannot submit or import leaderboard results'); }
    };
    if (local !== undefined) w.localStorage.setItem(`romana-progress-${user.id}`, typeof local === 'string' ? local : JSON.stringify(local));
    const ctx = dom.getInternalVMContext(), evaluate = code => vm.runInContext(code, ctx);
    evaluate(source);
    return { w, calls, evaluate, close: () => w.close(),
        load: () => plain(w.incarcaProgresElev(user)),
        activate: () => w.actualizeazaProfilElev(user),
        state: () => plain(evaluate('progresElev')),
        saved: () => JSON.parse(w.localStorage.getItem(`romana-progress-${user.id}`)) };
}

test('legacy local points and bonuses are recalculated from correct answers without losing cumulative counts or materials', () => {
    const local = { quizuri: [{ quizId: 'quiz-a', title: 'Aventura', score: 1500, correct: 6, total: 8, won: true, date: '1.1.2026', extra: 'keep' }], materiale: [{ id: 'pdf-a', title: 'Material' }], totalPuncte: 8800, raspunsuriCorecte: 70, quizuriCastigate: 9, preference: 'keep' };
    const f = fixture({ local });
    try {
        const result = f.load();
        assert.equal(result.quizuri[0].score, 6);
        assert.equal(result.quizuri[0].extra, 'keep');
        assert.equal(result.totalPuncte, 70); assert.equal(result.raspunsuriCorecte, 70);
        assert.equal(result.quizuriCastigate, 9); assert.equal(result.preference, 'keep');
        assert.deepEqual(result.materiale, local.materiale);
        assert.equal(f.calls.writes.length, 0); assert.equal(f.calls.leaderboard, 0);
    } finally { f.close(); }
});

test('legacy cloud progress follows the same one-point rule and updates the local copy and displayed profile', async () => {
    const f = fixture({ cloud: { quizuri: [{ title: 'Gramatică', score: 2100, correct: 12, total: 14, won: true }], materiale: [{ id: 'pdf' }], totalPuncte: 70000, raspunsuriCorecte: 120, quizuriCastigate: 10 } });
    try {
        await f.activate();
        assert.equal(f.state().quizuri[0].score, 12); assert.equal(f.state().totalPuncte, 120);
        assert.equal(f.saved().totalPuncte, 120); assert.equal(f.saved().raspunsuriCorecte, 120);
        assert.match(f.w.document.getElementById('profileHistory').textContent, /12 puncte/);
        assert.equal(f.w.document.getElementById('profileBestScore').textContent, 'Record: 12 puncte');
        assert.equal(f.calls.writes.length, 0); assert.equal(f.calls.leaderboard, 0);
    } finally { f.close(); }
});

test('missing cumulative counts are recovered from history, including records with no total field', () => {
    const f = fixture({ local: { quizuri: [{ correct: 4, total: 5, score: 1300, won: true }, { correct: 2, score: 200 }], totalPuncte: 1500, materiale: [] } });
    try {
        const result = f.load();
        assert.deepEqual(result.quizuri.map(item => item.score), [4, 2]);
        assert.equal(result.raspunsuriCorecte, 6); assert.equal(result.totalPuncte, 6);
        assert.equal(result.quizuriCastigate, 1);
    } finally { f.close(); }
});

test('a completed quiz records correct answers only, ignores supplied bonuses, and keeps lifetime totals beyond the 30-result history', async () => {
    const quizuri = Array.from({ length: 30 }, (_, i) => ({ quizId: `old-${i}`, title: 'Anterior', score: 1200, correct: 2, total: 3, won: true }));
    const f = fixture({ cloud: { quizuri, materiale: [{ id: 'read' }], totalPuncte: 100000, raspunsuriCorecte: 150, quizuriCastigate: 60 } });
    try {
        await f.activate();
        f.w.inregistreazaRezultatQuiz({ quizId: 'new', title: 'Curent', score: 99999, correct: 3, total: 4, won: false });
        const result = f.state();
        assert.equal(result.quizuri.length, 30); assert.equal(result.quizuri.at(-1).quizId, 'old-28');
        assert.equal(result.quizuri[0].score, 3); assert.equal(result.quizuri[0].correct, 3);
        assert.equal(result.totalPuncte, 153); assert.equal(result.raspunsuriCorecte, 153);
        assert.equal(result.quizuriCastigate, 60); assert.deepEqual(result.materiale, [{ id: 'read' }]);
        assert.equal(f.saved().totalPuncte, 153); assert.equal(f.calls.writes.at(-1).progress_data.totalPuncte, 153);
        assert.equal(f.calls.leaderboard, 0);
    } finally { f.close(); }
});

for (const role of ['profesor', 'admin', null]) {
    test(`${role} accounts do not accumulate student progress`, async () => {
        const f = fixture({ role });
        try {
            await f.activate();
            f.w.inregistreazaRezultatQuiz({ quizId: 'quiz', score: 99, correct: 3, total: 4, won: true });
            assert.deepEqual(f.state(), empty); assert.equal(f.calls.writes.length, 0);
        } finally { f.close(); }
    });
}

test('malformed local and cloud data use safe fallback without restoring old bonus totals', async () => {
    for (const local of ['{invalid', { quizuri: 'wrong', totalPuncte: 9900 }, null]) {
        const f = fixture({ local });
        try { assert.deepEqual(f.load(), empty); } finally { f.close(); }
    }
    const f = fixture({ local: { quizuri: [{ correct: 3, total: 4, score: 1200 }], materiale: [], totalPuncte: 1200 }, cloud: { quizuri: 'invalid', totalPuncte: 9000 } });
    try {
        await f.activate();
        assert.equal(f.state().totalPuncte, 3); assert.equal(f.saved().quizuri[0].score, 3);
    } finally { f.close(); }
});

test('invalid counts cannot create negative, fractional, infinite or over-total points', async () => {
    const f = fixture({ cloud: { quizuri: [null, 'invalid', { correct: -1, total: 5 }, { correct: 1.5, total: 5 }, { correct: 'Infinity', total: 5 }, { correct: 10, total: 4 }], materiale: 'invalid', raspunsuriCorecte: -20 } });
    try {
        await f.activate();
        assert.deepEqual(f.state().quizuri.map(item => item.score), [0, 0, 0, 4]);
        assert.equal(f.state().totalPuncte, 4); assert.deepEqual(f.state().materiale, []);
        f.w.inregistreazaRezultatQuiz({ correct: 9, total: 2, score: 900 });
        assert.equal(f.state().quizuri[0].score, 2); assert.equal(f.state().totalPuncte, 6);
    } finally { f.close(); }
});

test('a cloud read failure retains the normalized local progress and record badge uses the new scale', async () => {
    const f = fixture({ local: { quizuri: [{ correct: 10, total: 12, score: 1900 }], materiale: [], totalPuncte: 1900 }, cloudError: new Error('offline') });
    try {
        await f.activate();
        assert.equal(f.state().totalPuncte, 10);
        const record = plain(f.w.insigneProfil()).find(item => item.title === 'Record personal');
        assert.equal(record.obtinuta, true); assert.equal(record.text, 'Obține 10 puncte într-un quiz.');
        assert.equal(f.calls.writes.length, 0); assert.equal(f.calls.leaderboard, 0);
    } finally { f.close(); }
});

test('local storage quota errors do not interrupt profile rendering, new quiz points or cloud persistence', async () => {
    const f = fixture({ cloud: { ...empty, quizuri: [{ title: 'Anterior', correct: 2, total: 3, score: 1200 }], raspunsuriCorecte: 2 } });
    try {
        Object.getPrototypeOf(f.w.localStorage).setItem = () => { throw new f.w.DOMException('Quota exceeded', 'QuotaExceededError'); };
        await assert.doesNotReject(f.activate());
        assert.equal(f.state().totalPuncte, 2);
        assert.match(f.w.document.getElementById('profileHistory').textContent, /2 puncte/);
        assert.doesNotThrow(() => f.w.inregistreazaRezultatQuiz({ quizId: 'new', title: 'Curent', score: 300, correct: 3, total: 4, won: true }));
        assert.equal(f.state().totalPuncte, 5); assert.equal(f.state().quizuri[0].score, 3);
        assert.equal(f.calls.writes.at(-1).progress_data.totalPuncte, 5);
        assert.match(f.w.document.getElementById('profileHistory').textContent, /3 puncte/);
    } finally { f.close(); }
});
