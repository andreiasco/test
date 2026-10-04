const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function load(file, extra = {}) {
    const context = vm.createContext({ window: {}, console, ...extra });
    vm.runInContext(fs.readFileSync(file, 'utf8'), context);
    return context;
}
const question = { text: 'Întrebare?', explanation: 'Explicație.', answers: ['A', 'B', 'C', 'D'], correctIndex: 2 };
test('quiz validation rejects ambiguous options and out-of-range answers', () => {
    const { window: { AIGenerators: g } } = load('js/ai/generators.js');
    assert.equal(g.validateQuestion(question, 'castle_choice').correctIndex, 2);
    assert.throws(() => g.validateQuestion({ ...question, answers: ['A', ' a '] }, 'castle_choice'));
    assert.throws(() => g.validateQuestion({ ...question, correctIndex: 4 }, 'castle_choice'));
    assert.throws(() => g.validateQuestion({ ...question, correctIndex: '2' }, 'castle_choice'));
    assert.throws(() => g.validateQuestion({ ...question, explanation: '' }, 'castle_choice'));
    assert.equal(g.validateQuestion({ ...question, correctIndex: 1 }, 'castle_true_false').answers[1], 'Fals');
    assert.equal(g.validateQuestion({ ...question, target: 'școală' }, 'castle_hangman').target, 'școală');
    assert.throws(() => g.validateQuestion({ ...question, target: '<script>' }, 'castle_hangman'));
    assert.throws(() => g.validateQuestion({ ...question, items: ['unu, doi', 'trei'] }, 'castle_ordering'));
});
test('batched generator preserves exact count and fails atomically on malformed response', async () => {
    let counter = 0;
    const { window: { AIGenerators: g } } = load('js/ai/generators.js', { SchoolAI: { complete: async () => {
        const count = counter === 0 ? 2 : 1;
        return { questions: Array.from({ length: count }, () => ({ ...question, text: `Întrebare ${++counter}?` })) };
    } } });
    const result = await g.quiz({ topic: 'Tema', grade: '6', count: 3, game_mode: 'castle_choice' }, () => {});
    assert.equal(result.questions.length, 3);
    await assert.rejects(g.quiz({ grade: 'general', count: 3, game_mode: 'castle_choice' }, () => {}));
    const malformed = load('js/ai/generators.js', { SchoolAI: { complete: async () => ({ questions: [question] }) } });
    await assert.rejects(malformed.window.AIGenerators.quiz({ grade: '6', count: 3, game_mode: 'castle_choice' }, () => {}));
});
test('worksheet keeps student text and answer key separate', async () => {
    const { window: { AIGenerators: g } } = load('js/ai/generators.js', { SchoolAI: { complete: async () => ({ exercises: Array.from({ length: 5 }, (_, i) => ({ requirement: `Cerință ${i}`, answer: `SOLUTIE ${i}` })) }) } });
    const result = await g.worksheet({ grade: '8', topic: 'Tema' });
    assert.ok(result.text.includes('100 de puncte'));
    assert.ok(!result.text.includes('SOLUTIE'));
    assert.ok(result.answers.includes('SOLUTIE 4'));
});
test('retrieval ranks accent-insensitively, handles missing tables, and sanitizes filters', async () => {
    const filters = [];
    const db = { from(table) { return { select() { return this; }, or(value) { filters.push(value); return this; }, async limit() {
        return table === 'opere' ? { data: [{ titlu: 'Pădurea', continut_rezumat: 'Un text despre pădure și natură.' }] } : { error: { message: 'not available' } };
    } }; } };
    const { window: { AIMaterials: m } } = load('js/ai/materials.js', { supabaseClient: db });
    assert.ok((await m.find('pădurea')).length > 0);
    await m.find('pădure),id.gt.0');
    assert.ok(filters.every(f => !f.includes(')') && !f.includes('.gt.')));
    assert.equal(m.rank([{ title: 'Verbul', text: 'Verbul exprimă acțiunea.' }], 'astronomie').length, 0);
});
test('unsupported browser gives actionable error without downloading a model', async () => {
    const context = load('js/ai/local-engine.js', { URL, setTimeout, clearTimeout, navigator: {}, document: { currentScript: { src: 'https://example.org/js/ai/local-engine.js' }, addEventListener() {} } });
    await assert.rejects(context.window.SchoolAI.activate(), /WebGPU/);
    assert.equal(context.window.SchoolAI.ready, false);
    await assert.rejects(context.window.SchoolAI.complete([]), /Activează/);
});
test('stopping an unfinished activation releases the caller immediately', async () => {
    const context = load('js/ai/local-engine.js', {
        URL, setTimeout, clearTimeout,
        window: {isSecureContext: true},
        navigator: {gpu:{requestAdapter: () => new Promise(() => {})}},
        document:{currentScript:{src:'https://example.org/js/ai/local-engine.js'},addEventListener(){}}
    });
    const promise = context.window.SchoolAI.activate();
    context.window.SchoolAI.stop();
    await assert.rejects(promise, /oprită/);
    assert.equal(context.window.SchoolAI.ready, false);
});
