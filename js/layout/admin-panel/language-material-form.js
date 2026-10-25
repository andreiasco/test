// Componentă panou admin: language-material-form.js
const ADMIN_LANGUAGE_MATERIAL_FORM_HTML = `

    <div
        class="admin-box"
        style="margin-top:20px;">

        <h3>📄 Adaugă material PDF pentru Limba română</h3>

        <label for="limbaMaterialCapitol">Capitol</label>
        <select id="limbaMaterialCapitol">
            <option value="">Selectează capitolul</option>
        </select>

        <label for="limbaMaterialTitlu">Titlul materialului</label>
        <input type="text" id="limbaMaterialTitlu" placeholder="Titlul materialului">
        <label for="limbaMaterialDescriere">Descriere</label>
        <textarea id="limbaMaterialDescriere" placeholder="Descrierea materialului" rows="3"></textarea>
        <label for="limbaMaterialOrdine">Ordine de afișare (opțional)</label>
        <input type="number" id="limbaMaterialOrdine" placeholder="Ordine (opțional)" min="0">
        <label for="limbaMaterialPDF">Fișier PDF</label>
        <input type="file" id="limbaMaterialPDF" accept="application/pdf">

        <button class="admin-btn" onclick="adaugaMaterialLimba()">➕ Încarcă materialul</button>
        <div id="limbaMaterialStatus" class="admin-status"></div>

    </div>
`;
