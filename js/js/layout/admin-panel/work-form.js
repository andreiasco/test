// Componentă panou admin: work-form.js
const ADMIN_WORK_FORM_HTML = `

    <div
        class="admin-box"
        style="margin-top:20px;">

        <h3>
            📚 Adaugă operă
        </h3>

        <label>
            Autor:
        </label>

        <select id="operaAutor">

            <option value="">
                Selectează autorul
            </option>

        </select>

        <input
            type="text"
            id="operaTitlu"
            placeholder="Titlul operei">

        <label>
            📖 Rezumat PDF
        </label>

        <input
            type="file"
            id="operaRezumat"
            accept="application/pdf">

        <label>
            📚 Analiză literară PDF
        </label>

        <input
            type="file"
            id="operaAnalizaLiterara"
            accept="application/pdf">

        <label>
            💡 Valori morale PDF
        </label>

        <input
            type="file"
            id="operaValoriMorale"
            accept="application/pdf">

        <label>
            👤 Personaje și semnificații PDF
        </label>

        <input
            type="file"
            id="operaCaracterizare"
            accept="application/pdf">

        <label>
            📄 Rezumat scris pentru descărcare
        </label>

        <input
            type="file"
            id="operaRezumatWord"
            accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf">

        <label>
            🎬 Link extern film
        </label>

        <input
            type="url"
            id="operaLinkFilm"
            placeholder="https://...">

        <label>
            🎧 Link extern audiobook
        </label>

        <input
            type="url"
            id="operaLinkAudiobook"
            placeholder="https://...">

        <label>
            📝 Link extern test de lectură
        </label>

        <input
            type="url"
            id="operaLinkTestLectura"
            placeholder="https://...">

        <label>
            📄 Document personaje pentru Instagram (PDF)
        </label>

        <input
            type="file"
            id="operaPersonajeInstagram"
            accept="application/pdf">

        <button
            class="admin-btn"
            onclick="adaugaOpera()">

            ➕ Adaugă operă

        </button>

        <div
            id="operaStatus"
            class="admin-status">
        </div>

    </div>
`;
