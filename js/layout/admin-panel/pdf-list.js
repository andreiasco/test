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

        <button
            class="admin-btn"
            onclick="indexeazaToateDocumenteleAI()">

            🤖 Indexează toate documentele pentru AI

        </button>

        <p id="aiDocumenteStatus" class="admin-status" aria-live="polite"></p>

        <div
            id="listaPDF"
            class="lista-pdf">
        </div>

    </div>`;
