const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

function fixture() {
    const dom = new JSDOM(`<!doctype html><body>
        <div id="authStatus"></div><button id="logoutButton" class="ascuns"></button>
        <button id="loginButton"></button><button id="profileButton" class="ascuns"></button>
        <div id="adminPanel" class="ascuns"></div><div id="adminUser"></div><a id="adminLink" class="ascuns"></a>
    </body>`, { url: 'https://example.test/admin.html', runScripts: 'outside-only' });
    const w = dom.window, context = dom.getInternalVMContext();
    const calls = { leaderboard: [], quiz: [], studentProfiles: [], adminLoaders: 0 };
    let lookup = async () => ({ data: { role: 'elev' } });
    w.supabaseClient = {
        from: () => ({ select: () => ({ eq: (_, id) => ({ maybeSingle: () => lookup(id) }) }) }),
        auth: { onAuthStateChange: () => {} }
    };
    w.setInterval = () => 1;
    w.estePaginaAdmin = true;
    w.QuizLeaderboard = { setUser: (user, role) => calls.leaderboard.push({ id: user?.id || null, role }) };
    w.seteazaAccesQuiz = active => calls.quiz.push(active);
    w.actualizeazaProfilElev = user => calls.studentProfiles.push(user.id);
    for (const name of ['incarcaListaPDF', 'incarcaAutoriAdmin', 'incarcaOpereAdmin', 'incarcaListaAutoriSelect', 'incarcaLimbaAdmin']) {
        w[name] = () => { calls.adminLoaders++; };
    }
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/core/auth.js'), 'utf8'), context);
    return {
        w, calls, el: id => w.document.getElementById(id),
        role: () => vm.runInContext('rolUtilizatorCurent', context),
        lookup: handler => { lookup = handler; }, close: () => w.close()
    };
}

test('a role lookup completing after logout cannot restore leaderboard access or the old role', async () => {
    const f = fixture();
    try {
        const role = deferred(); f.lookup(() => role.promise);
        const pending = f.w.actualizeazaStareAutentificare({ id: 'old-admin', email: 'old@example.test' });
        f.w.actualizeazaStareDelogata();
        role.resolve({ data: { role: 'admin' } }); await pending;
        assert.deepEqual(f.calls.leaderboard, [{ id: null, role: null }]);
        assert.equal(f.role(), null);
        assert.equal(f.el('authStatus').textContent, 'Neautentificat');
        assert.equal(f.el('logoutButton').classList.contains('ascuns'), true);
        assert.deepEqual(f.calls.quiz, [false]);
    } finally { f.close(); }
});

test('a newer login owns role, profile and leaderboard identity regardless of lookup completion order', async () => {
    const f = fixture();
    try {
        const first = deferred(), second = deferred();
        f.lookup(id => id === 'student-a' ? first.promise : second.promise);
        const old = f.w.actualizeazaStareAutentificare({ id: 'student-a', email: 'first@example.test' });
        const current = f.w.actualizeazaStareAutentificare({ id: 'student-b', email: 'second@example.test' });
        second.resolve({ data: { role: 'elev' } }); await current;
        first.resolve({ data: { role: 'admin' } }); await old;
        assert.deepEqual(f.calls.leaderboard, [{ id: 'student-b', role: 'elev' }]);
        assert.deepEqual(f.calls.studentProfiles, ['student-b']);
        assert.equal(f.role(), 'elev');
        assert.equal(f.el('authStatus').textContent, 'Conectat: second@example.test');
        assert.deepEqual(f.calls.quiz, [true]);
    } finally { f.close(); }
});

test('a pending admin panel lookup cannot reveal controls or load data after logout', async () => {
    const f = fixture();
    try {
        const role = deferred(); f.lookup(() => role.promise);
        const pending = f.w.afiseazaAdmin({ id: 'old-admin', email: 'old@example.test' });
        f.w.actualizeazaStareDelogata();
        role.resolve({ data: { role: 'admin' } }); await pending;
        assert.equal(f.el('adminPanel').classList.contains('ascuns'), true);
        assert.equal(f.el('adminLink').classList.contains('ascuns'), true);
        assert.equal(f.calls.adminLoaders, 0);
        assert.equal(f.el('adminUser').textContent, '');
    } finally { f.close(); }
});

test('a pending admin panel lookup cannot replace a newer student session', async () => {
    const f = fixture();
    try {
        const role = deferred(); f.lookup(() => role.promise);
        const old = f.w.afiseazaAdmin({ id: 'old-admin', email: 'old@example.test' });
        f.lookup(async () => ({ data: { role: 'elev' } }));
        await f.w.actualizeazaStareAutentificare({ id: 'student-b', email: 'new@example.test' });
        role.resolve({ data: { role: 'admin' } }); await old;
        assert.equal(f.el('adminPanel').classList.contains('ascuns'), true);
        assert.equal(f.el('adminLink').classList.contains('ascuns'), true);
        assert.equal(f.calls.adminLoaders, 0);
        assert.deepEqual(f.calls.leaderboard, [{ id: 'student-b', role: 'elev' }]);
        assert.equal(f.role(), 'elev');
    } finally { f.close(); }
});

test('parallel authenticated state and admin panel checks still show the current administrator', async () => {
    const f = fixture();
    try {
        f.lookup(async () => ({ data: { role: 'admin' } }));
        const user = { id: 'current-admin', email: 'current@example.test' };
        await Promise.all([f.w.actualizeazaStareAutentificare(user), f.w.afiseazaAdmin(user)]);
        assert.equal(f.el('adminPanel').classList.contains('ascuns'), false);
        assert.equal(f.el('adminLink').classList.contains('ascuns'), false);
        assert.equal(f.el('adminUser').textContent, 'Conectat ca: current@example.test');
        assert.equal(f.calls.adminLoaders, 5);
        assert.deepEqual(f.calls.leaderboard, [{ id: 'current-admin', role: 'admin' }]);
        assert.equal(f.role(), 'admin');
    } finally { f.close(); }
});
