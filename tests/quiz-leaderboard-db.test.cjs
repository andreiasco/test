const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');

const migration = fs.readFileSync(path.join(__dirname, '../supabase/quiz-leaderboard.sql'), 'utf8');
const ids = {
    first: '11111111-1111-4111-8111-111111111111',
    second: '22222222-2222-4222-8222-222222222222',
    admin: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    teacher: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    quiz: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    hidden: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
};
const attempt = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

test('shared leaderboard enforces points, idempotency and admin-only clearing in PostgreSQL', async t => {
    const db = new PGlite();
    try {
        await db.exec(`
            create role anon;
            create role authenticated;
            create schema auth;
            create table auth.users(id uuid primary key, email text);
            create function auth.uid() returns uuid language sql stable as
                $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
            grant usage on schema auth to anon, authenticated;
            grant execute on function auth.uid() to anon, authenticated;
            create table public.profiles(id uuid primary key references auth.users(id), role text);
            create table public.quizzes(id uuid primary key, questions jsonb, published boolean);
            create table public.user_progress(user_id uuid primary key, progress_data jsonb);
        `);
        for (const [name, role] of [['first', 'elev'], ['second', 'elev'], ['admin', 'admin'], ['teacher', 'profesor']]) {
            await db.query('insert into auth.users values ($1, $2)', [ids[name], `${name}@private.test`]);
            await db.query('insert into public.profiles values ($1, $2)', [ids[name], role]);
        }
        await db.query('insert into public.quizzes values ($1, $2, true), ($3, $2, false)', [ids.quiz, JSON.stringify([{}, {}, {}]), ids.hidden]);
        await db.query('insert into public.user_progress values ($1, $2)', [ids.first, JSON.stringify({ totalPuncte: 2 })]);
        await db.exec(migration);
        await db.exec(migration); // Setup is repeatable without losing scores or permissions.

        async function login(user, role = 'authenticated') {
            await db.exec('reset role');
            await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user || '']);
            await db.exec(`set role ${role}`);
        }
        async function submit(n, correct, total = 3, quiz = ids.quiz) {
            return db.query('select public.submit_quiz_score($1, $2, $3, $4)', [attempt(n), quiz, correct, total]);
        }
        async function board() {
            return (await db.query('select * from public.get_quiz_leaderboard()')).rows.map(row => ({
                ...row, points: Number(row.points), games: Number(row.games)
            }));
        }
        const denied = fn => assert.rejects(fn, error => error.code === '42501');
        const invalid = fn => assert.rejects(fn, error => error.code === '22023');

        await t.test('anonymous access, even with a claimed user ID, cannot execute RPCs', async () => {
            await login(ids.first, 'anon');
            await denied(() => board());
            await denied(() => submit(1, 2));
            await denied(() => db.query('select public.reset_quiz_leaderboard()'));
            await login(null);
            await denied(() => board());
            await denied(() => submit(1, 2));
        });

        await t.test('only students can add results and invalid results never create points', async () => {
            for (const id of [ids.admin, ids.teacher]) {
                await login(id);
                await denied(() => submit(1, 2));
            }
            await login(ids.first);
            await invalid(() => submit(1, -1));
            await invalid(() => submit(1, 4));
            await invalid(() => submit(1, 1, 2));
            await invalid(() => submit(1, 1, 0));
            await invalid(() => submit(1, 1, 3, ids.hidden));
            await invalid(() => db.query('select public.submit_quiz_score(null, $1, 1, 3)', [ids.quiz]));
            await invalid(() => db.query('select public.submit_quiz_score($1, $2, null, 3)', [attempt(1), ids.quiz]));
            assert.deepEqual(await board(), []);
        });

        await t.test('each correct answer adds exactly one point; repeated attempts and retries add none', async () => {
            await submit(1, 2);
            await submit(1, 2);
            await submit(1, 3);
            assert.deepEqual(await board(), [{ user_id: ids.first, display_name: 'Elev 11111111', points: 2, games: 1 }]);
            await submit(2, 1);
            await submit(3, 0);
            assert.deepEqual(await board(), [{ user_id: ids.first, display_name: 'Elev 11111111', points: 3, games: 3 }]);
        });

        await t.test('scores are shared, sorted deterministically and never expose email addresses', async () => {
            await login(ids.second);
            await submit(1, 3); // An existing receipt cannot be claimed by another student.
            assert.equal((await board()).length, 1);
            await submit(4, 3);
            assert.deepEqual((await board()).map(row => row.user_id), [ids.first, ids.second]);
            await submit(5, 1);
            const rows = await board();
            assert.deepEqual(rows.map(row => row.points), [4, 3]);
            assert.deepEqual(rows.map(row => row.user_id), [ids.second, ids.first]);
            assert.equal(JSON.stringify(rows).includes('@'), false);
            await login(ids.teacher);
            assert.deepEqual(await board(), rows);
        });

        await t.test('students cannot clear the leaderboard or bypass RPCs with direct writes', async () => {
            await login(ids.first);
            await denied(() => db.query('select public.reset_quiz_leaderboard()'));
            await denied(() => db.query('update public.quiz_leaderboard_entries set points = 9000'));
            await denied(() => db.query('delete from public.quiz_leaderboard_entries'));
            await denied(() => db.query('insert into public.quiz_leaderboard_entries values ($1, 9000, 1)', [ids.teacher]));
            await denied(() => db.query('delete from public.quiz_score_receipts'));
            await denied(() => db.query('select * from public.quiz_score_receipts'));
            assert.deepEqual((await board()).map(row => row.points), [4, 3]);
        });

        await t.test('row-level security still hides all rows and blocks inserts if a table grant is added', async () => {
            await db.exec('reset role');
            assert.deepEqual((await db.query("select relrowsecurity from pg_class where relname in ('quiz_leaderboard_entries', 'quiz_score_receipts')")).rows,
                [{ relrowsecurity: true }, { relrowsecurity: true }]);
            await db.exec('grant select, insert, update, delete on public.quiz_leaderboard_entries, public.quiz_score_receipts to authenticated');
            try {
                await login(ids.first);
                assert.deepEqual((await db.query('select * from public.quiz_leaderboard_entries')).rows, []);
                assert.deepEqual((await db.query('select * from public.quiz_score_receipts')).rows, []);
                await denied(() => db.query('insert into public.quiz_leaderboard_entries values ($1, 9000, 1)', [ids.teacher]));
                assert.equal((await db.query('update public.quiz_leaderboard_entries set points = 9000')).affectedRows, 0);
                assert.equal((await db.query('delete from public.quiz_leaderboard_entries')).affectedRows, 0);
                assert.deepEqual((await board()).map(row => row.points), [4, 3]);
            } finally {
                await db.exec('reset role');
                await db.exec('revoke all on public.quiz_leaderboard_entries, public.quiz_score_receipts from authenticated');
            }
        });

        await t.test('admin clearing is shared, preserves personal progress and rejects old attempt replays', async () => {
            await login(ids.admin);
            await db.query('select public.reset_quiz_leaderboard()');
            assert.deepEqual(await board(), []);
            await login(ids.first);
            await submit(1, 2);
            assert.deepEqual(await board(), []);
            await submit(6, 1);
            assert.deepEqual(await board(), [{ user_id: ids.first, display_name: 'Elev 11111111', points: 1, games: 1 }]);
            await db.exec('reset role');
            assert.deepEqual((await db.query('select progress_data from public.user_progress')).rows, [{ progress_data: { totalPuncte: 2 } }]);
        });
    } finally {
        await db.close();
    }
});
