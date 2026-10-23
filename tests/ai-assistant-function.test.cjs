const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');

const file = path.join(__dirname, '../supabase/functions/ai-assistant/index.ts');
const source = fs.readFileSync(file, 'utf8').replace(
    /^import \{ createClient \} from "https:\/\/esm\.sh\/@supabase\/supabase-js@2";\s*/,
    ''
);
const script = new vm.Script(stripTypeScriptTypes(source, { mode: 'strip' }), { filename: file });

function load({ answer = 'Mihai Eminescu a fost un poet român.', finishReason = 'STOP', apiKey = true, sources = true } = {}) {
    let handler;
    const requests = [];
    const env = {
        SUPABASE_URL: 'https://project.test',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
        ...(apiKey ? { GEMINI_API_KEY: 'test-gemini-key' } : {})
    };
    const tables = {
        autori: sources ? [{ id: 1, nume: 'Mihai Eminescu', descriere: 'Mihai Eminescu a fost un poet român.', categorie: 'poezie' }] : []
    };
    const supabase = {
        auth: { getUser: async () => ({ data: { user: { id: 'student' } }, error: null }) },
        from(table) {
            return {
                select() { return this; },
                limit: async () => ({ data: tables[table] || [], error: null })
            };
        }
    };
    script.runInNewContext({
        Deno: { env: { get: key => env[key] }, serve(fn) { handler = fn; } },
        createClient: () => supabase,
        Response,
        console,
        setTimeout,
        fetch: async (url, options) => {
            requests.push({ url, body: JSON.parse(options.body) });
            return Response.json({ candidates: [{ content: { parts: [{ text: answer }] }, finishReason }] });
        }
    });
    return { handler, requests };
}

function request(messages, authenticated = true) {
    return new Request('https://project.test/functions/v1/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authenticated ? { Authorization: 'Bearer test-session' } : {}) },
        body: JSON.stringify({ messages })
    });
}

test('function retains the study text and question and allows longer answers', async () => {
    const answer = 'O explicație completă, cu diacritice. '.repeat(80) + 'SFÂRȘITUL RĂSPUNSULUI.';
    const { handler, requests } = load({ answer });
    const content = 'Clasa: 6. Mihai Eminescu.\nText de studiu:\n' + 'Mihai Eminescu, poezie. '.repeat(300).slice(0, 6000)
        + '\nÎntrebarea elevului: explică figurile de stil din acest text.';
    assert.ok(content.length > 6000 && content.length < 8000);
    const response = await handler(request([{ role: 'user', content }]));
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(requests.length, 1);
    assert.equal(requests[0].body.contents[0].parts[0].text, content);
    assert.equal(requests[0].body.generationConfig.maxOutputTokens, 4096);
    assert.equal(result.answer, answer);
    assert.equal(result.finish_reason, 'STOP');
    assert.equal(result.source, 'site+gemini');
});

test('function preserves partial text and MAX_TOKENS metadata for the client', async () => {
    const answer = 'Poezia descrie natura prin';
    const { handler, requests } = load({ answer, finishReason: 'MAX_TOKENS' });
    const result = await (await handler(request([{ role: 'user', content: 'Explică poezia lui Mihai Eminescu.' }]))).json();
    assert.equal(result.answer, answer);
    assert.equal(result.finish_reason, 'MAX_TOKENS');
    assert.equal(requests.length, 1, 'a truncated answer must not trigger extra automatic inference');
});

test('function keeps the larger input bounded without dropping ordinary student questions', async () => {
    const { handler, requests } = load();
    const content = 'Mihai Eminescu ' + 'x'.repeat(9000);
    await handler(request([{ role: 'user', content }]));
    assert.equal(requests[0].body.contents[0].parts[0].text, content.slice(0, 8000));
});

test('function requires authentication before searching or generating', async () => {
    const { handler, requests } = load();
    const response = await handler(request([{ role: 'user', content: 'Mihai Eminescu' }], false));
    assert.equal(response.status, 401);
    assert.equal(requests.length, 0);
});

test('missing provider configuration is marked as a temporary fallback', async () => {
    const { handler, requests } = load({ apiKey: false });
    const result = await (await handler(request([{ role: 'user', content: 'Mihai Eminescu' }]))).json();
    assert.equal(result.temporary_error, true);
    assert.equal(result.source, 'site');
    assert.match(result.answer, /fragmentul relevant/);
    assert.equal(requests.length, 0);
});

test('no matching site sources avoids a provider request', async () => {
    const { handler, requests } = load({ sources: false });
    const result = await (await handler(request([{ role: 'user', content: 'Mihai Eminescu' }]))).json();
    assert.equal(result.source, 'site');
    assert.match(result.answer, /Nu am găsit/);
    assert.equal(requests.length, 0);
});
