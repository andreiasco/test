// Collapse creation tools while keeping the existing field IDs and handlers.
function adminDisclosure(title, icon, content) {
    return `<details class="admin-disclosure"><summary><span class="alma-icon">${almaIcon(icon)}</span><strong>${title}</strong><span class="admin-disclosure-indicator" aria-hidden="true">+</span></summary><div class="admin-disclosure-content">${content.replace(/<h3>[\s\S]*?<\/h3>/, '')}</div></details>`;
}
// Asamblează panoul de administrare pe obiecte separate.
const ADMIN_PANEL_HTML = [
    ADMIN_PANEL_PREFIX_HTML,

    `<div class="admin-object-pages" id="adminObjectPages">`,

    `<section class="admin-object-page" data-admin-page="autori" aria-labelledby="adminTabAutori">
        <div class="admin-object-page-heading"><div><span class="admin-object-kicker">Literatură</span><h3>👤 Administrare autori</h3><p>Creează autori și gestionează autorii existenți.</p></div></div>`,
    adminDisclosure('Adaugă autor', 'user', ADMIN_AUTHOR_FORM_HTML),
    ADMIN_AUTHORS_LIST_HTML,
    `</section>`,

    `<section class="admin-object-page" data-admin-page="opere" aria-labelledby="adminTabOpere" hidden>
        <div class="admin-object-page-heading"><div><span class="admin-object-kicker">Literatură</span><h3>📚 Administrare opere</h3><p>Adaugă opere, resurse și gestionează operele existente.</p></div></div>`,
    adminDisclosure('Adaugă operă', 'book', ADMIN_WORK_FORM_HTML),
    ADMIN_WORKS_LIST_HTML,
    `</section>`,

    `<section class="admin-object-page" data-admin-page="limba" aria-labelledby="adminTabLimba" hidden>
        <div class="admin-object-page-heading"><div><span class="admin-object-kicker">Limba română</span><h3>🔤 Capitole și materiale</h3><p>Administrează separat structura materiei și materialele PDF.</p></div></div>`,
    adminDisclosure('Adaugă capitol', 'plus', ADMIN_LANGUAGE_CHAPTER_FORM_HTML),
    adminDisclosure('Adaugă material PDF', 'file', ADMIN_LANGUAGE_MATERIAL_FORM_HTML),
    ADMIN_LANGUAGE_LIST_HTML,
    `</section>`,

    `<section class="admin-object-page" data-admin-page="pdf" aria-labelledby="adminTabPdf" hidden>
        <div class="admin-object-page-heading"><div><span class="admin-object-kicker">Fișiere</span><h3>📁 Administrare PDF-uri</h3><p>Vezi și gestionează fișierele PDF stocate în proiect.</p></div></div>`,
    ADMIN_PDF_LIST_HTML,
    `</section>`,

    `<section class="admin-object-page" data-admin-page="quiz" aria-labelledby="adminTabQuiz" hidden>
        <div class="admin-object-page-heading"><div><span class="admin-object-kicker">Quiz & AI</span><h3>🎮 Administrare quiz-uri</h3><p>Creează, generează cu AI, testează și publică quiz-uri.</p></div></div>`,
    ADMIN_QUIZ_FORM_HTML,
    ADMIN_QUIZ_LIST_HTML,
    `</section>`,

    `<section class="admin-object-page" data-admin-page="revista" aria-labelledby="adminTabRevista" hidden>
        <div class="admin-object-page-heading"><div><span class="admin-object-kicker">Revistă</span><h3>📰 Revista școlii</h3><p>Revizuiește materialele trimise de profesori și publică numerele revistei.</p></div></div>`,
    ADMIN_MAGAZINE_PANEL_HTML,
    editorEducationalHTML(EDUCATION_COLLECTIONS.find(collection => collection.key === 'creatii-elevi')),
    `</section>`,

    `<section class="admin-object-page" data-admin-page="cont" aria-labelledby="adminTabCont" hidden>
        <div class="admin-object-page-heading"><div><span class="admin-object-kicker">Administrator</span><h3>🛡️ Contul administratorului</h3><p>Statistici platformă, spațiu de stocare, roluri utilizatori și jurnal de acțiuni.</p></div></div>`,
    ADMIN_ACCOUNT_PANEL_HTML,
    `</section>`,

    ...EDUCATION_COLLECTIONS.filter(collection => collection.parent !== 'revista').map(collection => `<section class="admin-object-page" data-admin-page="resurse-${collection.key}" aria-labelledby="admin-tab-${collection.key}" hidden>${editorEducationalHTML(collection)}</section>`),

    `</div>`,
    ADMIN_PANEL_SUFFIX_HTML,
    `<div id="adminQuizPreview" class="admin-quiz-preview ascuns" role="dialog" aria-modal="true" aria-label="Previzualizare aventură" tabindex="-1"><div id="adminQuizPreviewContent"></div></div>`
].join("");
