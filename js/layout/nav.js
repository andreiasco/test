// Componentă de layout: nav.js
const NAV_HTML = `




<nav>

    <div class="nav-links">
        <a href="${estePaginaAdmin ? "index.html" : ""}#acasa">Acasă</a>
        <a href="${estePaginaAdmin ? "index.html" : ""}#limba">Limba română</a>
        <a href="${estePaginaAdmin ? "index.html" : ""}#literatura">Literatura română</a>
        <a href="${estePaginaAdmin ? "index.html" : ""}#quiz">Quiz-uri</a>
        <a href="${estePaginaAdmin ? "index.html" : ""}#harta">Hartă</a>
        <a href="${estePaginaAdmin ? "index.html" : ""}#revista">Revista</a>
        <a id="adminLink" class="ascuns" href="admin.html">Panou admin</a>
    </div>
    
    <div class="nav-tools">

        <button id="searchToggle" class="search-toggle">
            🔍 Search
        </button>

        <details class="account-menu">
            <summary>⚙️ Cont</summary>

            <div class="account-actions">
            <span id="authStatus" class="auth-status">Signed out</span>

            <button onclick="afiseazaLogin()">
                🔐 Logare / Register
            </button>

            <button id="logoutButton" class="ascuns" onclick="logoutUtilizator()">
                🚪 Deconectare
            </button>

            <button class="theme-btn" onclick="schimbaTema()">
                🌙 Mod întunecat
            </button>
            </div>
        </details>

        <div class="search-container ascuns">

        <input
            type="search"
            id="searchInput"
            class="search-input"
            placeholder="Caută autori, opere, poezii..."
            autocomplete="off">

        <div id="searchResults" class="search-results"></div>

        </div>

    </div>

</nav>

`;
