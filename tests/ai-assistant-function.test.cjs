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

function load({ answer = 'Mihai Eminescu a fost un poet român.', status = 'completed', incompleteReason = null, apiKey = true, sources = true, providerBody, providerStatus = 200, networkError = false } = {}) {
    let handler;
    const requests = [];
    const env = {
        SUPABASE_URL: 'https://project.test',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
        GEMINI_API_KEY: 'test-legacy-key',
        ...(apiKey ? { OPENAI_API_KEY: 'test-openai-key' } : {})
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
        setTimeout(callback) { queueMicrotask(callback); },
        fetch: async (url, options) => {
            requests.push({ url, headers: options.headers, body: JSON.parse(options.body) });
            if (networkError) throw new Error('Simulated provider connection failure');
            return Response.json(providerBody || {
                status,
                output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: answer }] }],
                incomplete_details: incompleteReason ? { reason: incompleteReason } : null
            }, { status: providerStatus });
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
    assert.equal(requests[0].url, 'https://api.openai.com/v1/responses');
    assert.equal(requests[0].headers.Authorization, 'Bearer test-openai-key');
    assert.equal(requests[0].headers['x-goog-api-key'], undefined);
    assert.equal(requests[0].body.input[0].content, content);
    assert.equal(requests[0].body.input[0].role, 'user');
    assert.equal(requests[0].body.model, 'gpt-5.4-mini');
    assert.equal(requests[0].body.max_output_tokens, 4096);
    assert.equal(requests[0].body.reasoning.effort, 'low');
    assert.equal(requests[0].body.store, false);
    assert.match(requests[0].body.instructions, /EXCLUSIV pe baza surselor/);
    assert.equal(result.answer, answer);
    assert.equal(result.finish_reason, 'STOP');
    assert.equal(result.source, 'site+openai');
    assert.equal(result.incomplete, false);
});

test('function preserves partial text and MAX_TOKENS metadata for the client', async () => {
    const answer = 'Poezia descrie natura prin';
    const { handler, requests } = load({ answer, status: 'incomplete', incompleteReason: 'max_output_tokens' });
    const result = await (await handler(request([{ role: 'user', content: 'Explică poezia lui Mihai Eminescu.' }]))).json();
    assert.equal(result.answer, answer);
    assert.equal(result.finish_reason, 'MAX_TOKENS');
    assert.equal(result.incomplete, true);
    assert.equal(requests.length, 1, 'a truncated answer must not trigger extra automatic inference');
});

test('function keeps the larger input bounded without dropping ordinary student questions', async () => {
    const { handler, requests } = load();
    const content = 'Mihai Eminescu ' + 'x'.repeat(9000);
    await handler(request([{ role: 'user', content }]));
    assert.equal(requests[0].body.input[0].content, content.slice(0, 8000));
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
    assert.equal(result.reason, 'openai_not_configured');
    assert.match(result.answer, /fragmentul relevant/);
    assert.equal(requests.length, 0);
});

test('function preserves assistant conversation roles for the OpenAI input contract', async () => {
    const { handler, requests } = load();
    await handler(request([
        { role: 'user', content: 'Mihai Eminescu' },
        { role: 'assistant', content: 'A fost un poet român.' },
        { role: 'user', content: 'Explică poezia lui Mihai Eminescu.' }
    ]));
    assert.deepEqual(requests[0].body.input.map(message => message.role), ['user', 'assistant', 'user']);
    assert.equal(requests[0].body.input[1].content, 'A fost un poet român.');
});

test('function extracts text output and excludes reasoning and tool items', async () => {
    const { handler } = load({ providerBody: {
        status: 'completed',
        output: [
            { type: 'reasoning', summary: [{ type: 'summary_text', text: 'Internal summary' }] },
            { type: 'function_call', arguments: 'Private tool data' },
            { type: 'message', role: 'assistant', content: [
                { type: 'output_text', text: 'Prima parte.' },
                { type: 'output_text', text: 'Ultima parte.' }
            ] }
        ]
    } });
    const result = await (await handler(request([{ role: 'user', content: 'Mihai Eminescu' }]))).json();
    assert.equal(result.answer, 'Prima parte.\nUltima parte.');
    assert.equal(result.source, 'site+openai');
});

test('function preserves a filtered partial answer and marks it incomplete', async () => {
    const { handler } = load({ answer: 'Text parțial', status: 'incomplete', incompleteReason: 'content_filter' });
    const result = await (await handler(request([{ role: 'user', content: 'Mihai Eminescu' }]))).json();
    assert.equal(result.answer, 'Text parțial');
    assert.equal(result.finish_reason, 'CONTENT_FILTER');
    assert.equal(result.incomplete, true);
});

test('function displays the model refusal instead of treating it as missing text', async () => {
    const { handler } = load({ providerBody: {
        status: 'completed',
        output: [{ type: 'message', role: 'assistant', content: [{ type: 'refusal', refusal: 'Nu pot răspunde acestei cereri.' }] }]
    } });
    const result = await (await handler(request([{ role: 'user', content: 'Mihai Eminescu' }]))).json();
    assert.equal(result.answer, 'Nu pot răspunde acestei cereri.');
    assert.equal(result.temporary_error, undefined);
});

test('failed or empty OpenAI responses use the site fallback and are not labelled as successful AI', async () => {
    for (const providerBody of [
        { status: 'failed', output: [] },
        { status: 'completed', output: [] },
        { status: 'queued', output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Not final' }] }] }
    ]) {
        const { handler } = load({ providerBody });
        const result = await (await handler(request([{ role: 'user', content: 'Mihai Eminescu' }]))).json();
        assert.equal(result.temporary_error, true);
        assert.equal(result.source, 'site');
        assert.equal(result.reason, 'openai_error');
    }
});

test('OpenAI authentication errors do not trigger retries or Gemini fallback', async () => {
    const { handler, requests } = load({ providerStatus: 401, providerBody: { error: { code: 'invalid_api_key' } } });
    const result = await (await handler(request([{ role: 'user', content: 'Mihai Eminescu' }]))).json();
    assert.equal(result.reason, 'openai_error');
    assert.equal(result.temporary_error, true);
    assert.equal(requests.length, 1);
    assert.ok(requests.every(request => request.url === 'https://api.openai.com/v1/responses'));
});

test('OpenAI rate limiting retries at most once and returns a temporary error', async () => {
    const { handler, requests } = load({ providerStatus: 429, providerBody: { error: { code: 'rate_limit_exceeded' } } });
    const result = await (await handler(request([{ role: 'user', content: 'Mihai Eminescu' }]))).json();
    assert.equal(result.reason, 'rate_limit');
    assert.equal(result.temporary_error, true);
    assert.equal(requests.length, 2);
    assert.ok(requests.every(request => request.url === 'https://api.openai.com/v1/responses'));
});

test('OpenAI network failures return the site fallback without trying another provider', async () => {
    const { handler, requests } = load({ networkError: true });
    const result = await (await handler(request([{ role: 'user', content: 'Mihai Eminescu' }]))).json();
    assert.equal(result.reason, 'openai_error');
    assert.equal(result.source, 'site');
    assert.equal(result.temporary_error, true);
    assert.equal(requests.length, 1);
});

test('no matching site sources avoids a provider request', async () => {
    const { handler, requests } = load({ sources: false });
    const result = await (await handler(request([{ role: 'user', content: 'Mihai Eminescu' }]))).json();
    assert.equal(result.source, 'site');
    assert.match(result.answer, /Nu am găsit/);
    assert.equal(requests.length, 0);
});
