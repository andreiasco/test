// Componentă panou admin: pdf-list.js
const ADMIN_PDF_LIST_HTML = `

    <div
        class="admin-box"
        style="margin-top:20px;">

        <h3>
            📁 PDF-uri din bucket
        </h3>

        <button
            class="admin-btn"
            onclick="incarcaListaPDF()">

            🔄 Reîmprospătează lista

        </button>

        <div
            id="listaPDF"
            class="lista-pdf">
        </div>

    </div>`;
