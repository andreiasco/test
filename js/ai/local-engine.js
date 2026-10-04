// No remote inference, API keys, or automatic fallback to a paid service.
(() => {
    const root = new URL('.', document.currentScript.src);
    let worker, engine, loading, busy = false, generation = 0, cancelLoad, cancelCompletion;
    function stop() {
        generation++;
        cancelLoad?.(new Error('Activarea AI a fost oprită.'));
        cancelLoad = null;
        cancelCompletion?.(new Error('Generarea a fost oprită.'));
        cancelCompletion = null;
        worker?.terminate();
        worker = engine = loading = null;
        busy = false;
    }
    async function activate(progress = () => {}) {
        if (engine) return;
        if (loading) throw new Error('Modelul se încarcă deja. Așteaptă finalizarea.');
        const ticket = generation;
        loading = Promise.race([
            (async () => {
                if (!window.isSecureContext || !navigator.gpu) throw new Error('AI-ul local necesită un browser cu WebGPU, pe HTTPS. Încearcă Chrome sau Edge actualizat, pe calculator.');
                const adapter = await navigator.gpu.requestAdapter();
                if (!adapter || !adapter.features.has('shader-f16')) throw new Error('Placa grafică nu are suportul necesar pentru acest model AI. Poți folosi în continuare materialele și quiz-urile site-ului.');
                progress('Se pregătește modelul. Prima descărcare poate dura câteva minute…');
                const lib = await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.85/lib/index.js');
                if (ticket !== generation) throw new Error('Activare oprită.');
                worker = new Worker(new URL('worker.js', root), { type: 'module' });
                const loaded = await lib.CreateWebWorkerMLCEngine(worker, 'Qwen3-4B-q4f16_1-MLC', {
                    initProgressCallback: p => progress(`Încărcare AI: ${Math.round((p.progress || 0) * 100)}%`)
                }, { context_window_size: 4096 });
                if (ticket !== generation) throw new Error('Activare oprită.');
                engine = loaded;
                progress('AI local activ. Poți începe.');
            })(),
            new Promise((_, reject) => { cancelLoad = reject; })
        ]);
        try { await loading; }
        catch (error) { if (ticket === generation) stop(); throw error; }
        finally { if (ticket === generation) { loading = null; cancelLoad = null; } }
    }
    async function complete(messages, { json = false, maxTokens = 1100 } = {}) {
        if (!engine) throw new Error('Apasă mai întâi „Activează AI local”.');
        if (busy) throw new Error('AI-ul lucrează la o altă cerere. Așteaptă sau apasă „Oprește AI”.');
        busy = true;
        const ticket = generation;
        let timer;
        try {
            const completion = engine.chat.completions.create({
                messages, temperature: 0.35, max_tokens: maxTokens,
                extra_body: { enable_thinking: false },
                ...(json ? { response_format: { type: 'json_object' } } : {})
            });
            const response = await Promise.race([completion, new Promise((_, reject) => {
                cancelCompletion = reject;
                timer = setTimeout(() => { stop(); reject(new Error('Generarea a durat prea mult. Reactivează AI-ul și încearcă o cerere mai scurtă.')); }, 180000);
            })]);
            if (ticket !== generation) throw new Error('Generarea a fost oprită.');
            const choice = response.choices?.[0];
            if (choice?.finish_reason === 'length') throw new Error('Răspunsul a depășit lungimea disponibilă. Cere un rezultat mai scurt.');
            const text = choice?.message?.content?.trim();
            if (!text) throw new Error('Modelul nu a produs un răspuns. Reformulează cererea.');
            return json ? JSON.parse(text) : text;
        } finally { clearTimeout(timer); if (ticket === generation) { busy = false; cancelCompletion = null; } }
    }
    window.SchoolAI = { activate, stop, complete, get ready() { return Boolean(engine); } };
    document.addEventListener('click', async event => {
        const start = event.target.closest('[data-ai-activate]');
        const stopButton = event.target.closest('[data-ai-stop]');
        if (!start && !stopButton) return;
        const status = document.getElementById((start || stopButton).dataset.aiStatus);
        if (stopButton) { stop(); if (status) status.textContent = 'AI oprit. Îl poți activa din nou.'; return; }
        start.disabled = true;
        const timer = setTimeout(() => stop(), 600000);
        try { await activate(message => { if (status) status.textContent = message; }); if (status) status.textContent = 'AI local activ.'; }
        catch (error) { if (status) status.textContent = error.message || 'Modelul nu s-a încărcat. Verifică spațiul liber, conexiunea și memoria grafică.'; }
        finally { clearTimeout(timer); start.disabled = false; }
    });
})();
