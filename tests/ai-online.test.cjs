const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const session = userId => ({ data: { session: { user: { id: userId } } } });

function createAssistant(t, result, options = {}) {
    const dom = new JSDOM('<body></body>', { url: 'https://example.test/', runScripts: 'outside-only' });
    t.after(() => dom.window.close());
    const window = dom.window;
    const run = file => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), dom.getInternalVMContext());
    run('js/layout/ai-assistant.js');
    vm.runInContext('document.body.innerHTML = AI_ASSISTANT_HTML', dom.getInternalVMContext());
    const calls = [];
    window.supabaseClient = {
        auth: { getSession: options.getSession || (async () => session('student-1')) },
        functions: { invoke: options.invoke || (async (name, request) => {
            calls.push({ name, request });
            return { data: result };
        }) },
    };
    window.afiseazaLogin = () => {};
    run('js/site/ai-assistant.js');
    window.initializeazaAiAssistant();
    const element = id => window.document.getElementById(id);
    element('aiAssistantGrade').value = '6';
    return { window, element, calls };
}

test('online assistant preserves a long complete answer and renders it as text', async t => {
    const answer = 'Explicație completă, cu diacritice.\n'.repeat(400) + '<script>nu se execută</script> Final.';
    const { window, element, calls } = createAssistant(t, { answer, finish_reason: 'STOP' });
    await window.sendAiAssistantMessage('Explică-mi verbul.');
    const messages = element('aiAssistantMessages');
    assert.equal(messages.lastElementChild.textContent, answer);
    assert.equal(messages.querySelectorAll('script').length, 0);
    assert.match(element('aiAssistantStatus').textContent, /Răspuns generat cu AI/);
    assert.equal(element('aiAssistantSend').disabled, false);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].name, 'ai-assistant');
});

test('online assistant labels MAX_TOKENS output as incomplete without discarding it', async t => {
    const answer = 'Verbul este partea de vorbire care exprimă';
    const { window, element, calls } = createAssistant(t, { answer, finish_reason: 'MAX_TOKENS' });
    await window.sendAiAssistantMessage('Explică-mi verbul.');
    assert.equal(element('aiAssistantMessages').lastElementChild.textContent, answer);
    assert.match(element('aiAssistantStatus').textContent, /Răspuns incomplet/);
    assert.match(element('aiAssistantStatus').textContent, /întrebare mai precisă/);
    assert.doesNotMatch(element('aiAssistantStatus').textContent, /Răspuns generat cu AI/);
    assert.equal(element('aiAssistantSend').disabled, false);
    assert.equal(calls.length, 1, 'truncation must not trigger another inference request automatically');
});

test('online assistant distinguishes a temporary fallback from generated AI output', async t => {
    const answer = 'Modulul AI este temporar indisponibil. Fragment din material: Verbul exprimă o acțiune.';
    const { window, element, calls } = createAssistant(t, { answer, source: 'site', temporary_error: true });
    await window.sendAiAssistantMessage('Explică-mi verbul.');
    assert.equal(element('aiAssistantMessages').lastElementChild.textContent, answer);
    assert.match(element('aiAssistantStatus').textContent, /temporar indisponibil/);
    assert.doesNotMatch(element('aiAssistantStatus').textContent, /Răspuns generat cu AI/);
    assert.equal(element('aiAssistantSend').disabled, false);
    assert.equal(calls.length, 1);
});

test('logout during a truncated response does not reveal the response or overwrite status', async t => {
    let resolve;
    const { window, element } = createAssistant(t, null, {
        invoke: () => new Promise(done => { resolve = done; }),
    });
    const pending = window.sendAiAssistantMessage('Explică-mi verbul.');
    await new Promise(done => setImmediate(done));
    assert.equal(element('aiAssistantSend').disabled, true);
    window.setAiAccess(false);
    element('aiAssistantStatus').textContent = 'Deconectat.';
    resolve({ data: { answer: 'Răspuns privat întrerupt', finish_reason: 'MAX_TOKENS' } });
    await pending;
    assert.equal(element('aiAssistantMessages').textContent, '');
    assert.equal(element('aiAssistantStatus').textContent, 'Deconectat.');
    assert.equal(element('aiAssistantSend').disabled, false);
});

test('changing the authenticated user suppresses a response belonging to the previous user', async t => {
    let sessionChecks = 0;
    const { window, element } = createAssistant(t, { answer: 'Răspunsul primului elev', finish_reason: 'MAX_TOKENS' }, {
        getSession: async () => session(++sessionChecks === 1 ? 'student-1' : 'student-2'),
    });
    await window.sendAiAssistantMessage('Explică-mi verbul.');
    assert.doesNotMatch(element('aiAssistantMessages').textContent, /Răspunsul primului elev/);
    assert.doesNotMatch(element('aiAssistantStatus').textContent, /Răspuns incomplet/);
    assert.equal(element('aiAssistantSend').disabled, false);
});
