// Componentă panou admin: language-chapter-form.js
const ADMIN_LANGUAGE_CHAPTER_FORM_HTML = `

    <div
        class="admin-box"
        style="margin-top:20px;">

        <h3>🔤 Adaugă capitol pentru Limba română</h3>

        <label for="limbaCapitolClasa">Clasa</label>
        <select id="limbaCapitolClasa">
            <option value="">Selectează clasa</option>
            <option value="5">Clasa a V-a</option>
            <option value="6">Clasa a VI-a</option>
            <option value="7">Clasa a VII-a</option>
            <option value="8">Clasa a VIII-a</option>
        </select>

        <input type="text" id="limbaCapitolTitlu" placeholder="Titlul capitolului">
        <textarea id="limbaCapitolDescriere" placeholder="Descrierea capitolului" rows="3"></textarea>
        <input type="number" id="limbaCapitolOrdine" placeholder="Ordine (opțional)" min="0">

        <button class="admin-btn" onclick="adaugaCapitolLimba()">➕ Adaugă capitol</button>
        <div id="limbaCapitolStatus" class="admin-status"></div>

    </div>
`;
