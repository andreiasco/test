// Deschiderea/închiderea panoului de administrare.
const ADMIN_PANEL_PREFIX_HTML = `

<section
    id="adminPanel"
    class="admin-panel ascuns">


    <div class="admin-header">

        <div>

            <h2>
                🔐 Panou administrator
            </h2>

            <p id="adminUser">
                Administrator conectat
            </p>

        </div>

        <button
            class="admin-btn logout-btn"
            onclick="logoutAdmin()">

            🚪 Deconectare

        </button>

    </div>
`;
const ADMIN_PANEL_SUFFIX_HTML = `

</section>
`;
