// All reads use the signed-in Supabase client and its existing RLS policies.
(() => {
    const normalize = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const stopWords = new Set('despre pentru care este sunt unui unei acest aceasta explica explica-mi te rog vreau lectie lectia scurt exercitii clasa raspuns raspunsul spune'.split(' '));
    function terms(query) {
        return [...new Set((normalize(query).match(/[a-z]{3,}/g) || []).filter(w => !stopWords.has(w)).map(w => w.length > 6 ? w.slice(0, -2) : w))].slice(0, 8);
    }
    function rank(documents, query) {
        const words = terms(query);
        if (!words.length) return [];
        const chunks = [];
        for (const doc of documents) {
            const content = String(doc.text || '').slice(0, 80000);
            for (let offset = 0; offset < content.length; offset += 700) {
                const text = content.slice(offset, offset + 950);
                const body = normalize(text), title = normalize(doc.title);
                const score = words.reduce((n, w) => n + (title.includes(w) ? 3 : 0) + (body.includes(w) ? 2 : 0), 0);
                if (score) chunks.push({ title: doc.title, text, score });
            }
        }
        return chunks.sort((a, b) => b.score - a.score).slice(0, 3);
    }
    async function find(query) {
        // Query-derived filters are letters only, never raw PostgREST syntax.
        const words = terms(query).slice(0, 5);
        if (!words.length) return [];
        const specs = [
            ['documente_ai', 'titlu,text_extras', ['titlu', 'text_extras']],
            ['limba_materiale', 'titlu,continut_ai', ['titlu', 'continut_ai']],
            ['opere', 'titlu,continut_rezumat,continut_analiza_literara,continut_valori_morale,continut_caracterizare', ['titlu', 'continut_rezumat', 'continut_analiza_literara', 'continut_valori_morale', 'continut_caracterizare']]
        ];
        // Titles often include accents. Also try the literal words from the question.
        const literal = (String(query).toLowerCase().match(/[a-zăâîșțşţ]{3,}/g) || []).filter(w => words.some(t => normalize(w).startsWith(t))).slice(0, 5);
        const search = [...new Set([...words, ...literal])];
        const results = await Promise.allSettled(specs.map(async ([table, fields, columns]) => {
            const filters = columns.flatMap(col => search.map(word => `${col}.ilike.%${word}%`)).join(',');
            return await supabaseClient.from(table).select(fields).or(filters).limit(12);
        }));
        const documents = [];
        let readable = 0;
        results.forEach((result, index) => {
            if (result.status !== 'fulfilled' || result.value.error) return;
            readable++;
            for (const row of result.value.data || []) {
                for (const col of specs[index][2].filter(c => c !== 'titlu')) {
                    if (row[col]) documents.push({ title: row.titlu || 'Material al site-ului', text: row[col] });
                }
            }
        });
        if (!readable) throw new Error('Textele materialelor nu sunt accesibile. Poți copia un fragment în câmpul „Text de studiu”. Profesorul poate verifica indexarea și permisiunile materialelor.');
        return rank(documents, query);
    }
    window.AIMaterials = { find, rank };
})();
