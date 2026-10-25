// Componentă panou admin: account-panel.js
const ADMIN_ACCOUNT_PANEL_HTML = `

    <div class="admin-box">
        <h3>📊 Statistici platformă</h3>
        <button class="admin-btn" onclick="incarcaContAdmin()">🔄 Reîmprospătează</button>
        <div id="adminContStatistici" class="admin-stats-grid"></div>
        <div id="adminContStorage" class="admin-stats-grid" style="margin-top:10px;"></div>
        <details class="admin-disclosure"><summary><strong>Documente indexate pentru AI</strong><span class="admin-disclosure-indicator" aria-hidden="true">+</span></summary>
        <div id="adminContDocumenteAI" class="admin-disclosure-content"></div></details>
    </div>

    <div class="admin-box" style="margin-top:20px;">
        <h3>🧑‍🤝‍🧑 Gestionare roluri</h3>
        <p>Schimbă rolul unui utilizator (elev, profesor sau administrator).</p>
        <div id="adminContRoluri"></div>
    </div>

    <div class="admin-box" style="margin-top:20px;">
        <details class="admin-disclosure"><summary><strong>Jurnal de acțiuni administrative</strong><span class="admin-disclosure-indicator" aria-hidden="true">+</span></summary>
        <div id="adminContJurnal" class="admin-disclosure-content"></div></details>
    </div>
`;
