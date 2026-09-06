// Asamblează panoul de administrare pe obiecte separate.
const ADMIN_PANEL_HTML = [
    ADMIN_PANEL_PREFIX_HTML,

    `<div class="admin-object-pages" id="adminObjectPages">`,

    `<section class="admin-object-page" data-admin-page="autori" aria-labelledby="adminTabAutori">
        <div class="admin-object-page-heading"><div><span class="admin-object-kicker">Literatură</span><h3>👤 Administrare autori</h3><p>Creează autori și gestionează autorii existenți.</p></div></div>`,
    ADMIN_AUTHOR_FORM_HTML,
    ADMIN_AUTHORS_LIST_HTML,
    `</section>`,

    `<section class="admin-object-page" data-admin-page="opere" aria-labelledby="adminTabOpere" hidden>
        <div class="admin-object-page-heading"><div><span class="admin-object-kicker">Literatură</span><h3>📚 Administrare opere</h3><p>Adaugă opere, resurse și gestionează operele existente.</p></div></div>`,
    ADMIN_WORK_FORM_HTML,
    ADMIN_WORKS_LIST_HTML,
    `</section>`,

    `<section class="admin-object-page" data-admin-page="limba" aria-labelledby="adminTabLimba" hidden>
        <div class="admin-object-page-heading"><div><span class="admin-object-kicker">Limba română</span><h3>🔤 Capitole și materiale</h3><p>Administrează separat structura materiei și materialele PDF.</p></div></div>`,
    ADMIN_LANGUAGE_CHAPTER_FORM_HTML,
    ADMIN_LANGUAGE_MATERIAL_FORM_HTML,
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

    `</div>`,
    ADMIN_PANEL_SUFFIX_HTML
].join("");
