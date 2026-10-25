function campEditorEducational(collection, field) {
    const id = `edu-${collection.key}-${field.name}`;
    const required = field.name === 'author_credit' ? ' required' : '';
    const control = field.kind === 'select' ? `<select id="${id}" name="${field.name}"><option value="">Alege...</option>${field.options.map(option => `<option>${option}</option>`).join('')}</select>`
        : field.kind === 'textarea' ? `<textarea id="${id}" name="${field.name}" rows="4" maxlength="10000"></textarea>`
        : `<input id="${id}" name="${field.name}" type="${field.kind}" ${field.kind === 'number' ? 'min="1" max="10000"' : 'maxlength="300"'}${required}>`;
    return `<label for="${id}">${field.label}${control}</label>`;
}
function editorEducationalHTML(collection) {
    const key = collection.key;
    return `<div class="admin-object-page-heading"><div><span class="admin-object-kicker">${EDUCATION_PARENTS[collection.parent]}</span><h3>${collection.title}</h3><p>${collection.intro}</p></div></div>
    <p data-education-setup="${key}" class="admin-status" role="status"></p>
    <details class="admin-disclosure" data-education-editor="${key}"><summary><strong>Adaugă sau editează: ${collection.title}</strong><span class="admin-disclosure-indicator" aria-hidden="true">+</span></summary><div class="admin-disclosure-content">
    <form data-education-form="${key}" class="quiz-admin-form">
        <input name="id" type="hidden">
        <label>Titlu<input name="title" maxlength="180" required></label>
        ${collection.parent !== 'revista' ? '<label>Clasa<select name="grade"><option value="">Toate clasele</option><option value="5">a V-a</option><option value="6">a VI-a</option><option value="7">a VII-a</option><option value="8">a VIII-a</option></select></label>' : ''}
        <label>Prezentare scurtă<textarea name="description" rows="2" maxlength="600"></textarea></label>
        <label>${collection.bodyLabel}<textarea name="body" rows="5" maxlength="30000"></textarea></label>
        <div class="education-editor-fields">${collection.fields.map(field => campEditorEducational(collection, field)).join('')}</div>
        <details class="admin-disclosure" open><summary>Fișier și link</summary><div class="admin-disclosure-content">
            <label>Fișier (maximum 20 MB)<input name="file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp"></label>
            <p data-current-file class="admin-filter-status"></p>
            <label><input name="remove_file" type="checkbox"> Elimină fișierul existent la salvare</label>
            <label>Link extern HTTPS<input name="external_url" type="url" placeholder="https://..."></label>
        </div></details>
        <label>Ordine de afișare<input name="sort_order" type="number" value="0" min="0" max="100000"></label>
        <label><input name="published" type="checkbox"> Publică pe pagina „${collection.title}”</label>
        <p>Adaugă conținut, un fișier sau un link. Ciornele sunt vizibile doar în administrare. Deschiderea fișierelor publicate necesită autentificare.</p>
        <div class="education-actions"><button type="submit" class="admin-btn">Salvează</button><button type="button" class="admin-btn secondary" data-education-reset="${key}">Anulează / Formular nou</button></div>
    </form></div></details>
    <p data-education-editor-status="${key}" class="admin-message" role="status"></p>
    <div class="admin-box"><div class="education-actions"><h3>${collection.title} — conținut existent</h3><button class="admin-btn secondary" type="button" data-education-refresh="${key}">Reîmprospătează</button><a class="opera-link" href="index.html#${key}" target="_blank" rel="noopener noreferrer">Vezi pagina</a></div>
        <label>Filtrează după titlu<input type="search" data-education-admin-search="${key}" placeholder="Caută..."></label><div class="education-list" data-education-admin-list="${key}"></div>
    </div>`;
}
