const educationAdminData = new Map();
const educationEditorBusy = new Set();
const educationCollection = key => EDUCATION_COLLECTIONS.find(collection => collection.key === key);
const educationForm = key => document.querySelector(`[data-education-form="${key}"]`);
function educationEditorStatus(key, text, error = false) {
    const status = document.querySelector(`[data-education-editor-status="${key}"]`);
    if (status) { status.textContent = text; status.className = 'admin-message ' + (error ? 'error' : 'success'); }
}
async function educationAdminUser() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    const user = data?.session?.user;
    if (!user || await obtineRolUtilizator(user) !== 'admin') throw new Error('Este necesar un cont de administrator.');
    return user;
}
async function educationRemoveFile(path) {
    try { const { error } = await supabaseClient.storage.from(EDUCATION_BUCKET).remove([path]); return !error; } catch { return false; }
}
function resetEditorEducational(key) {
    const form = educationForm(key); if (!form) return;
    form.reset(); form.elements.namedItem('id').value = '';
    form.querySelector('[data-current-file]').textContent = '';
    educationEditorStatus(key, '');
}
function randareListaEditorEducational(key) {
    const collection = educationCollection(key);
    const list = document.querySelector(`[data-education-admin-list="${key}"]`);
    if (!list || !collection) return;
    const query = (document.querySelector(`[data-education-admin-search="${key}"]`)?.value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const rows = (educationAdminData.get(key) || []).filter(row => row.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(query));
    list.innerHTML = rows.map(row => `<article class="admin-opera"><h4>${escapeHTML(row.title)}</h4><p>${row.published ? 'Publicat' : 'Ciornă'}${row.grade ? ' · Clasa ' + escapeHTML(row.grade) : ''}</p>${row.description ? `<p>${escapeHTML(row.description)}</p>` : ''}
        <div class="education-actions"><button type="button" class="admin-btn secondary" data-edu-edit="${escapeHTML(row.id)}">Editează</button><button type="button" class="admin-btn secondary" data-edu-publish="${escapeHTML(row.id)}">${row.published ? 'Retrage' : 'Publică'}</button><button type="button" class="admin-btn danger" data-edu-delete="${escapeHTML(row.id)}">Șterge</button></div></article>`).join('') || '<p>Nu există conținut pentru selecția curentă.</p>';
}
async function incarcaEditorEducational(key) {
    const collection = educationCollection(key); if (!collection) return;
    initializeazaEditoareEducationale(false);
    const setup = document.querySelector(`[data-education-setup="${key}"]`);
    try {
        await educationAdminUser();
        const { data, error } = await supabaseClient.from(collection.table).select('*').order('sort_order').order('title');
        if (error) throw error;
        educationAdminData.set(key, data || []);
        setup.textContent = ''; randareListaEditorEducational(key);
    } catch (error) {
        educationAdminData.delete(key);
        setup.textContent = 'Colecția nu poate fi încărcată. Pentru prima utilizare rulează ' + (collection.setupSql || 'supabase/education-resources.sql') + ' în SQL Editor, apoi reîmprospătează.';
        document.querySelector(`[data-education-admin-list="${key}"]`).textContent = 'Lista nu este disponibilă momentan.';
        console.error(error);
    }
}
function editeazaResursaEducationala(key, id) {
    if (educationEditorBusy.has(key)) return;
    const collection = educationCollection(key), form = educationForm(key);
    const row = (educationAdminData.get(key) || []).find(item => String(item.id) === String(id));
    if (!row) return;
    resetEditorEducational(key);
    ['id','title','description','body','grade','external_url','sort_order', ...collection.fields.map(field => field.name)].forEach(name => {
        const control = form.elements.namedItem(name); if (control) control.value = row[name] ?? '';
    });
    form.elements.namedItem('published').checked = row.published;
    form.querySelector('[data-current-file]').textContent = row.file_name ? 'Fișier curent: ' + row.file_name : 'Fără fișier atașat.';
    document.querySelector(`[data-education-editor="${key}"]`).open = true;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    form.elements.namedItem('title').focus({ preventScroll: true });
    educationEditorStatus(key, 'Editezi: ' + row.title);
}
function colecteazaResursaEducationala(collection, form, previous) {
    const field = name => form.elements.namedItem(name);
    const value = name => field(name)?.value.trim() || '';
    const rawUrl = value('external_url');
    const payload = { title: value('title'), description: value('description'), body: value('body'), grade: value('grade') || null,
        sort_order: Number(value('sort_order')) || 0, published: field('published').checked,
        external_url: rawUrl ? educationSafeUrl(rawUrl) : null,
        file_path: field('remove_file').checked ? null : previous?.file_path || null,
        file_name: field('remove_file').checked ? null : previous?.file_name || null };
    if (!payload.title) throw new Error('Completează titlul.');
    if (rawUrl && !payload.external_url) throw new Error('Linkul trebuie să înceapă cu https://, fără date de autentificare.');
    collection.fields.forEach(config => {
        const input = value(config.name);
        if (config.required && !input) throw new Error('Completează: ' + config.label);
        if (config.kind === 'number') {
            if (input && (!Number.isFinite(Number(input)) || Number(input) < 1 || Number(input) > 10000)) throw new Error('Verifică: ' + config.label);
            payload[config.name] = input ? Number(input) : null;
        } else {
            if (config.options && input && !config.options.includes(input)) throw new Error('Alege o valoare validă pentru ' + config.label);
            payload[config.name] = input;
        }
    });
    if (collection.key === 'creatii-elevi' && !payload.author_credit) throw new Error('Completează autorul sau pseudonimul creației.');
    const file = field('file').files[0];
    const extension = file?.name.split('.').pop().toLowerCase();
    if (file && (file.size > 20 * 1024 * 1024 || !['pdf','doc','docx','xls','xlsx','ppt','pptx','png','jpg','jpeg','webp'].includes(extension))) throw new Error('Alege un format acceptat, de cel mult 20 MB.');
    if (collection.key === 'manuale-digitale') {
        if (!educationGrades(collection).map(String).includes(payload.grade)) throw new Error('Alege clasa manualului.');
        if (!payload.file_path && !file && !payload.external_url) throw new Error('Adaugă fișierul manualului sau un link HTTPS.');
    }
    if (!payload.body && !payload.file_path && !file && !payload.external_url) throw new Error('Adaugă conținut, un fișier sau un link.');
    return { payload, file, extension };
}
async function salveazaResursaEducationala(key, event) {
    event.preventDefault(); if (educationEditorBusy.has(key)) return;
    const collection = educationCollection(key), form = educationForm(key);
    const id = form.elements.namedItem('id').value;
    const previous = (educationAdminData.get(key) || []).find(row => String(row.id) === id);
    let input;
    try { input = colecteazaResursaEducationala(collection, form, previous); } catch (error) { educationEditorStatus(key, error.message, true); return; }
    educationEditorBusy.add(key);
    const controls = Array.from(form.elements).filter(control => !control.disabled); controls.forEach(control => { control.disabled = true; });
    let uploaded = null, saved = false;
    try {
        await educationAdminUser(); educationEditorStatus(key, 'Se salvează...');
        if (input.file) {
            uploaded = `${key}/${crypto.randomUUID()}.${input.extension}`;
            const { error } = await supabaseClient.storage.from(EDUCATION_BUCKET).upload(uploaded, input.file, { upsert: false });
            if (error) throw error;
            input.payload.file_path = uploaded; input.payload.file_name = input.file.name;
        }
        const query = id ? supabaseClient.from(collection.table).update(input.payload).eq('id', id) : supabaseClient.from(collection.table).insert(input.payload);
        const { data, error } = await query.select('id').single();
        if (error || !data) throw error || new Error('Salvarea nu a fost confirmată.');
        saved = true;
        const warning = previous?.file_path && previous.file_path !== input.payload.file_path && !await educationRemoveFile(previous.file_path);
        resetEditorEducational(key); educationEditorStatus(key, warning ? 'Salvat. Fișierul vechi nu a putut fi curățat.' : 'Salvat.');
        await incarcaEditorEducational(key); await incarcaColectieEducationala(collection);
    } catch (error) {
        const warning = uploaded && !saved && !await educationRemoveFile(uploaded);
        educationEditorStatus(key, error.message + (warning ? ' Fișierul încărcat nu a putut fi curățat.' : ''), true);
    } finally { educationEditorBusy.delete(key); controls.forEach(control => { control.disabled = false; }); }
}
async function actiuneResursaEducationala(key, id, action, button) {
    if (educationEditorBusy.has(key)) return;
    const collection = educationCollection(key);
    const row = (educationAdminData.get(key) || []).find(item => String(item.id) === id);
    if (!row || (action === 'delete' && !confirm(`Ștergi „${row.title}”?`))) return;
    educationEditorBusy.add(key); button.disabled = true;
    try {
        await educationAdminUser();
        const query = action === 'delete' ? supabaseClient.from(collection.table).delete().eq('id', id) : supabaseClient.from(collection.table).update({ published: !row.published }).eq('id', id);
        const { data, error } = await query.select('id').single();
        if (error || !data) throw error || new Error('Acțiunea nu a fost confirmată.');
        const warning = action === 'delete' && row.file_path && !await educationRemoveFile(row.file_path);
        const form = educationForm(key);
        if (form.elements.namedItem('id').value === id) {
            if (action === 'delete') resetEditorEducational(key);
            else form.elements.namedItem('published').checked = !row.published;
        }
        educationEditorStatus(key, warning ? 'Șters. Fișierul nu a putut fi curățat din stocare.' : 'Modificare salvată.');
        await incarcaEditorEducational(key); await incarcaColectieEducationala(collection);
    } catch (error) { educationEditorStatus(key, error.message, true); }
    finally { educationEditorBusy.delete(key); button.disabled = false; }
}
function incarcaCreatiiEleviAdmin() { return incarcaEditorEducational('creatii-elevi'); }
function initializeazaEditoareEducationale(loadVisible = true) {
    EDUCATION_COLLECTIONS.forEach(collection => {
        const key = collection.key, form = educationForm(key);
        if (!form || form.dataset.initialized) return;
        form.dataset.initialized = 'true'; form.addEventListener('submit', event => salveazaResursaEducationala(key, event));
        document.querySelector(`[data-education-reset="${key}"]`).addEventListener('click', () => { if (!educationEditorBusy.has(key)) resetEditorEducational(key); });
        document.querySelector(`[data-education-refresh="${key}"]`).addEventListener('click', () => incarcaEditorEducational(key));
        document.querySelector(`[data-education-admin-search="${key}"]`).addEventListener('input', () => randareListaEditorEducational(key));
        document.querySelector(`[data-education-admin-list="${key}"]`).addEventListener('click', event => {
            const button = event.target.closest('button'); if (!button) return;
            if (button.dataset.eduEdit) editeazaResursaEducationala(key, button.dataset.eduEdit);
            if (button.dataset.eduPublish) actiuneResursaEducationala(key, button.dataset.eduPublish, 'publish', button);
            if (button.dataset.eduDelete) actiuneResursaEducationala(key, button.dataset.eduDelete, 'delete', button);
        });
    });
    if (loadVisible) {
        const active = document.querySelector('.admin-object-page.is-active');
        const key = active?.dataset.adminPage?.replace(/^resurse-/, '');
        if (educationCollection(key)) incarcaEditorEducational(key);
    }
}
