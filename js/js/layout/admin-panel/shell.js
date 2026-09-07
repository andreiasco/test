// Deschiderea/închiderea panoului de administrare și navigarea pe obiecte.
const ADMIN_PANEL_PREFIX_HTML = `
<section id="adminPanel" class="admin-panel ascuns">
    <div class="admin-header">
        <div>
            <span class="admin-eyebrow">Administrare conținut</span>
            <h2>🔐 Panou administrator</h2>
            <p id="adminUser">Administrator conectat</p>
        </div>
        <button class="admin-btn logout-btn" onclick="logoutAdmin()">🚪 Deconectare</button>
    </div>

    <nav class="admin-object-nav" aria-label="Secțiuni administrare">
        <button type="button" class="admin-object-tab is-active" id="adminTabAutori" data-admin-tab="autori" aria-selected="true">
            <span class="admin-object-tab-icon">👤</span><span><b>Autori</b><small>Profiluri și biografii</small></span>
        </button>
        <button type="button" class="admin-object-tab" id="adminTabOpere" data-admin-tab="opere" aria-selected="false">
            <span class="admin-object-tab-icon">📚</span><span><b>Opere</b><small>Opere și resurse</small></span>
        </button>
        <button type="button" class="admin-object-tab" id="adminTabLimba" data-admin-tab="limba" aria-selected="false">
            <span class="admin-object-tab-icon">🔤</span><span><b>Limba română</b><small>Capitole și materiale</small></span>
        </button>
        <button type="button" class="admin-object-tab" id="adminTabPdf" data-admin-tab="pdf" aria-selected="false">
            <span class="admin-object-tab-icon">📁</span><span><b>PDF-uri</b><small>Fișiere încărcate</small></span>
        </button>
        <button type="button" class="admin-object-tab" id="adminTabQuiz" data-admin-tab="quiz" aria-selected="false">
            <span class="admin-object-tab-icon">🎮</span><span><b>Quiz-uri</b><small>Creator, AI și publicare</small></span>
        </button>
    </nav>
`;
const ADMIN_PANEL_SUFFIX_HTML = `
</section>
`;
