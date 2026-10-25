// Componentă panou admin: works-list.js
const ADMIN_WORKS_LIST_HTML = `

    <div
        class="admin-box"
        style="margin-top:20px;">

        <h3>
            📚 Opere existente
        </h3>

        <button
            class="admin-btn"
            onclick="incarcaOpereAdmin()">

            🔄 Reîmprospătează

        </button>

        <label for="filtru-listaOpereAdmin">Filtrează opere</label><input type="search" id="filtru-listaOpereAdmin" data-admin-filter="listaOpereAdmin" placeholder="Scrie un nume sau un titlu...">
<p data-admin-filter-status="listaOpereAdmin" class="admin-filter-status" role="status"></p>
<div id="listaOpereAdmin"></div>

    </div>
`;
