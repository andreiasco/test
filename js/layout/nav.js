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

            <button id="aiAssistantButton" class="ascuns" type="button">
                🤖 Profesor AI
            </button>

            <button id="profileButton" class="ascuns" type="button">
                👤 Profilul meu
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

<div id="profileModal" class="profile-modal ascuns" role="dialog" aria-modal="true" aria-labelledby="profileTitle">
    <section class="profile-box">
        <button id="profileCloseButton" class="profile-close" type="button" aria-label="Închide profilul">×</button>
        <div class="profile-heading">
            <span class="profile-avatar">👤</span>
            <div>
                <h2 id="profileTitle">Profilul meu</h2>
                <p id="profileEmail" class="profile-email"></p>
            </div>
        </div>
        <div id="profileStats" class="profile-stats"></div>
        <div class="profile-content-grid">
            <section class="profile-panel">
                <h3>Insigne</h3>
                <div id="profileBadges" class="profile-badges"></div>
            </section>
            <section class="profile-panel">
                <h3>Recomandarea următoare</h3>
                <div id="profileRecommendation" class="profile-recommendation"></div>
            </section>
        </div>
        <section class="profile-panel profile-history-panel">
            <div class="profile-panel-heading"><h3>Ultimele aventuri</h3><span id="profileBestScore"></span></div>
            <div id="profileHistory" class="profile-history"></div>
        </section>
    </section>
</div>

`;
