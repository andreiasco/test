// Componentă panou admin: magazine-panel.js
const ADMIN_MAGAZINE_PANEL_HTML = `

    <div class="admin-box">
        <h3>📮 Materiale trimise de profesori</h3>
        <button class="admin-btn" onclick="incarcaRevistaAdmin()">🔄 Reîmprospătează</button>
        <p id="revistaMaterialeStatus" class="admin-status" aria-live="polite"></p>
        <div id="listaRevistaMateriale" class="lista-pdf"></div>
    </div>

    <div class="admin-box" style="margin-top:20px;">
        <h3>📰 Publică un număr de revistă</h3>
        <label for="revistaNumarTitlu">Titlu</label>
        <input type="text" id="revistaNumarTitlu" placeholder="Ex: Revista clasei a VII-a, ediția 1">
        <label for="revistaNumarDescriere">Descriere</label>
        <textarea id="revistaNumarDescriere" rows="2" placeholder="Descriere scurtă (opțional)"></textarea>
        <label for="revistaNumarFisier">Fișier PDF</label>
        <input type="file" id="revistaNumarFisier" accept="application/pdf">
        <button class="admin-btn" onclick="adaugaNumarRevista()">➕ Publică în tabul Revistă</button>
        <p id="revistaNumarStatus" class="admin-status" aria-live="polite"></p>
    </div>

    <div class="admin-box" style="margin-top:20px;">
        <h3>📚 Numere publicate</h3>
        <div id="listaNumereRevista" class="lista-pdf"></div>
    </div>
`;
