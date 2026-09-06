// Componentă panou admin: author-form.js
const ADMIN_AUTHOR_FORM_HTML = `

    <div class="admin-box">

        <h3>
            👤 Adaugă autor
        </h3>

        <input
            type="text"
            id="autorInitiale"
            placeholder="Inițiale">

        <input
            type="text"
            id="autorNume"
            placeholder="Numele autorului">

        <label for="autorCategorie">
            Gen literar
        </label>

        <select id="autorCategorie">
            <option value="">Selectează genul literar</option>
            <option value="poezie">Poezie</option>
            <option value="proza">Proză</option>
            <option value="teatru">Teatru</option>
        </select>

        <label for="autorLoculNasterii">
            Locul nașterii
        </label>

        <select id="autorLoculNasterii">
            <option value="">Selectează regiunea</option>
            <option value="banat">Banat</option>
            <option value="crisana">Crișana</option>
            <option value="maramures">Maramureș</option>
            <option value="transilvania">Transilvania</option>
            <option value="oltenia">Oltenia</option>
            <option value="muntenia">Muntenia</option>
            <option value="dobrogea">Dobrogea</option>
            <option value="moldova">Moldova</option>
            <option value="bucovina">Bucovina</option>
            <option value="tara-romaneasca">Țara Românească</option>
            <option value="other">Other / internațional</option>
        </select>

        <input
            type="text"
            id="autorLocNastereOther"
            class="ascuns"
            placeholder="Locul nașterii (internațional)">

        <label>
            🖼️ Imagine autor
        </label>

        <input
            type="file"
            id="autorPoza"
            accept="image/*">

        <textarea
            id="autorDescriere"
            placeholder="Descrierea autorului"
            rows="4"></textarea>

        <button
            class="admin-btn"
            onclick="adaugaAutor()">

            ➕ Adaugă autor

        </button>

        <div
            id="autorStatus"
            class="admin-status">
        </div>

    </div>
`;
