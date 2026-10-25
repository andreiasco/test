// Componentă panou admin: authors-list.js
const ADMIN_AUTHORS_LIST_HTML = `

    <div
        class="admin-box"
        style="margin-top:20px;">

        <h3>
            👥 Autori existenți
        </h3>

        <button
            class="admin-btn"
            onclick="incarcaAutoriAdmin()">

            🔄 Reîmprospătează

        </button>

        <label for="filtru-listaAutoriAdmin">Filtrează autori</label><input type="search" id="filtru-listaAutoriAdmin" data-admin-filter="listaAutoriAdmin" placeholder="Scrie un nume sau un titlu...">
<p data-admin-filter-status="listaAutoriAdmin" class="admin-filter-status" role="status"></p>
<div id="listaAutoriAdmin"></div>

    </div>
`;
