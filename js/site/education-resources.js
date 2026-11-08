const EDUCATION_BUCKET = 'ResurseEducationale';
const educationPublished = new Map();
function educationSafeUrl(value) {
    try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; } catch { return ''; }
}
function educationContent(label, text, collapsible = false) {
    if (!text) return '';
    const body = `<div class="education-text" data-preserve-text>${escapeHTML(text)}</div>`;
    return collapsible ? `<details class="education-answer"><summary>${label}</summary>${body}</details>` : `<div class="education-content"><h3>${label}</h3>${body}</div>`;
}
function educationCard(collection, resource) {
    const url = educationSafeUrl(resource.external_url);
    const facts = collection.fields.filter(field => field.kind !== 'textarea' && resource[field.name]).map(field => `<div><dt>${field.label}</dt><dd>${escapeHTML(resource[field.name])}</dd></div>`).join('');
    const swotFields = ['strengths','weaknesses','opportunities','threats'];
    const explanations = collection.fields.filter(field => field.kind === 'textarea' && !swotFields.includes(field.name)).map(field => educationContent(field.label, resource[field.name], ['answers','rubric'].includes(field.name))).join('');
    const matrix = collection.key === 'centralizatoare-swot' && swotFields.some(name => resource[name]) ? `<div class="education-swot">${collection.fields.filter(field => swotFields.includes(field.name)).map(field => educationContent(field.label, resource[field.name] || 'Nespecificat')).join('')}</div>` : '';
    return `<article class="alma-feature-panel education-card education-card-${collection.key}">
        ${resource.grade ? `<p class="alma-eyebrow">${escapeHTML(educationGradeLabel(resource.grade))}</p>` : ''}<h2>${escapeHTML(resource.title)}</h2>
        ${resource.description ? `<p>${escapeHTML(resource.description)}</p>` : ''}
        ${facts ? `<dl class="education-facts">${facts}</dl>` : ''}
        ${educationContent(collection.bodyLabel, resource.body)}${explanations}${matrix}
        <div class="education-actions">${resource.file_path ? `<button type="button" class="opera-btn" data-education-open="${escapeHTML(resource.id)}" data-collection="${collection.key}">${/\.pdf$/i.test(resource.file_name) ? 'Deschide PDF' : 'Descarcă fișierul'} — ${escapeHTML(resource.file_name)}</button>` : ''}${url ? `<a class="opera-link" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">Deschide linkul (filă nouă)</a>` : ''}</div><p class="education-file-status" role="status"></p>
    </article>`;
}
function educationSortManuals(rows) {
    const alphabet = new Intl.Collator('ro', { sensitivity: 'base', numeric: true });
    return [...rows].sort((a, b) => Number(a.grade) - Number(b.grade) || alphabet.compare(a.subject, b.subject) || alphabet.compare(a.title, b.title));
}
function educationManualGroups(collection, rows) {
    return educationGrades(collection).map(grade => {
        const manuals = rows.filter(row => String(row.grade) === String(grade));
        if (!manuals.length) return '';
        const subjects = [...new Set(manuals.map(row => row.subject))];
        return `<section class="education-manual-grade"><h2>${educationGradeLabel(grade)}</h2>${subjects.map(subject => `<div class="education-manual-subject"><h3>${escapeHTML(subject)}</h3><div class="education-list">${manuals.filter(row => row.subject === subject).map(row => educationCard(collection, row)).join('')}</div></div>`).join('')}</section>`;
    }).join('');
}
function randareColectieEducationala(collection) {
    const list = document.querySelector(`[data-education-list="${collection.key}"]`);
    if (!list) return;
    const controls = document.querySelector(`[data-education-filters="${collection.key}"]`);
    const grade = controls?.querySelector('[data-education-grade]')?.value || '';
    const type = controls?.querySelector('[data-education-type]');
    const query = (controls?.querySelector('[data-education-search]')?.value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const resources = (educationPublished.get(collection.key) || []).filter(row => collection.key !== 'manuale-digitale' || educationGrades(collection).map(String).includes(String(row.grade)));
    if (collection.key === 'manuale-digitale' && type) {
        const selection = type.value;
        const subjects = [...new Set(resources.filter(row => !grade || String(row.grade) === grade).map(row => row.subject))].sort(new Intl.Collator('ro', { sensitivity: 'base' }).compare);
        type.innerHTML = '<option value="">Toate materiile</option>' + subjects.map(subject => `<option value="${escapeHTML(subject)}">${escapeHTML(subject)}</option>`).join('');
        type.value = subjects.includes(selection) ? selection : '';
    }
    const filtered = resources.filter(row => (!grade || String(row.grade) === grade || !row.grade) && (!type?.value || row[type.dataset.educationType] === type.value) && `${row.title} ${row.subject || ''} ${row.publisher || ''} ${row.authors || ''} ${row.description || ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(query));
    list.innerHTML = (collection.key === 'manuale-digitale' ? educationManualGroups(collection, educationSortManuals(filtered)) : filtered.map(row => educationCard(collection, row)).join('')) || `<p class="alma-notice">${resources.length ? 'Nu există rezultate pentru filtrele alese.' : 'Nu au fost publicate încă resurse în această colecție.'}</p>`;
    const count = document.querySelector(`[data-education-count="${collection.key}"]`);
    if (count) count.textContent = `${filtered.length} resurse afișate`;
}
async function incarcaColectieEducationala(collection) {
    const list = document.querySelector(`[data-education-list="${collection.key}"]`);
    if (!list) return;
    try {
        const { data, error } = await supabaseClient.from(collection.table).select('*').eq('published', true).order('sort_order').order('title');
        if (error) throw error;
        educationPublished.set(collection.key, data || []); randareColectieEducationala(collection);
    } catch (error) {
        educationPublished.delete(collection.key);
        list.innerHTML = '<p class="alma-notice">Colecția nu este disponibilă momentan. Încearcă din nou mai târziu.</p>';
        console.error(error);
    }
}
async function deschideResursaEducationala(key, id, button) {
    const row = (educationPublished.get(key) || []).find(item => String(item.id) === String(id));
    if (!row?.file_path) return;
    button.disabled = true;
    const status = button.closest('.education-card').querySelector('.education-file-status');
    try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        if (!data?.session) { afiseazaLogin(); return; }
        const pdf = /\.pdf$/i.test(row.file_name);
        const { data: signed, error: signError } = await supabaseClient.storage.from(EDUCATION_BUCKET).createSignedUrl(row.file_path, 300, pdf ? {} : { download: row.file_name });
        if (signError) throw signError;
        if (pdf) await deschidePrevizualizarePDF(signed.signedUrl, true);
        else { const link = document.createElement('a'); link.href = signed.signedUrl; link.download = row.file_name; document.body.appendChild(link); link.click(); link.remove(); }
        status.textContent = '';
    } catch (error) { status.textContent = 'Nu am putut deschide fișierul. Încearcă din nou.'; console.error(error); }
    finally { button.disabled = false; }
}
function initializeazaResurseEducationale() {
    EDUCATION_COLLECTIONS.forEach(collection => {
        const list = document.querySelector(`[data-education-list="${collection.key}"]`);
        if (!list || list.dataset.initialized) return;
        list.dataset.initialized = 'true';
        list.addEventListener('click', event => { const button = event.target.closest('[data-education-open]'); if (button) deschideResursaEducationala(collection.key, button.dataset.educationOpen, button); });
        document.querySelector(`[data-education-filters="${collection.key}"]`)?.addEventListener('input', () => randareColectieEducationala(collection));
    });
    // Load only the visible collection; subsequent hash changes load on demand.
    const load = () => { const collection = EDUCATION_COLLECTIONS.find(item => window.location.hash === '#' + item.key); if (collection) incarcaColectieEducationala(collection); };
    window.addEventListener('hashchange', load); load();
}
