// Componentă de layout: nav.js
const NAV_HTML = `




<nav aria-label="Navigare principală">
    <a class="alma-brand" href="${estePaginaAdmin ? "index.html" : ""}#acasa" aria-label="EDU ALMA — Acasă"><img src="assets/edu-alma-emblem.png?v=gold-rays-v2" alt="" width="48" height="48"><span><strong><em>EDU</em> ALMA</strong><small>Educație Digitală Utilă</small></span></a>
    <div class="nav-links">
        <a href="${estePaginaAdmin ? "index.html" : ""}#acasa">Acasă</a>
        <a href="${estePaginaAdmin ? "index.html" : ""}#elevi">Elevi</a>
        <a href="${estePaginaAdmin ? "index.html" : ""}#profesori">Profesori</a>
        <a href="${estePaginaAdmin ? "index.html" : ""}#scoala-altfel">Școala Altfel</a>
        <a href="${estePaginaAdmin ? "index.html" : ""}#revista">Reviste</a>
        <a id="quizNavLink" href="${estePaginaAdmin ? "index.html" : ""}#jocuri">Jocuri</a>
            <a href="${estePaginaAdmin ? "index.html" : ""}#harta">Harta literară</a>
            <a href="${estePaginaAdmin ? "index.html" : ""}#contact">Contribuții</a>
            <a href="${estePaginaAdmin ? "index.html" : ""}#abonamente">Acces la resurse</a>
            <a href="${estePaginaAdmin ? "index.html" : ""}#ajutor">Ajutor</a>
            <a id="adminLink" class="ascuns" href="admin.html">Panou admin</a>
        <details class="alma-more nav-overflow" hidden>
            <summary aria-label="Mai mult — navigare"><span aria-hidden="true">☰</span> Mai mult</summary>
            <div class="alma-more-menu"></div>
        </details>
    </div>
    <div class="nav-tools">

        <button id="searchToggle" class="search-toggle" type="button" aria-expanded="false" aria-controls="siteSearchPanel">
            Caută
        </button>

        <details class="account-menu">
            <summary>Cont</summary>

            <div class="account-actions">
            <span id="authStatus" class="auth-status">Neautentificat</span>

            <button id="loginButton" onclick="afiseazaLogin()">
                Autentificare / Înregistrare
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

        <div id="siteSearchPanel" class="search-container ascuns" role="search" aria-label="Caută în site">
        <label class="search-panel-label" for="searchInput">Ce vrei să descoperi?</label>
        <p class="search-panel-hint">Caută un autor, o operă sau o poezie.</p>

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
        <div id="profileElevContent">
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
        </div>
        <div id="profileProfesorContent" class="ascuns">
            <section class="profile-panel">
                <h3>Trimite un material pentru revistă</h3>
                <p class="profile-empty">Materialul va fi verificat de un administrator înainte de a fi folosit în revistă. Doar administratorii pot vedea fișierul trimis.</p>
                <label for="profesorMaterialTitlu">Titlu</label>
                <input type="text" id="profesorMaterialTitlu" placeholder="Titlul materialului">
                <label for="profesorMaterialDescriere">Descriere</label>
                <textarea id="profesorMaterialDescriere" rows="2" placeholder="Descriere scurtă (opțional)"></textarea>
                <label for="profesorMaterialFisier">Fișier (PDF sau DOCX)</label>
                <input type="file" id="profesorMaterialFisier" accept="application/pdf,.docx">
                <button class="admin-btn" type="button" onclick="trimiteMaterialRevista()">📤 Trimite spre revizuire</button>
                <p id="profesorMaterialStatus" class="profile-empty"></p>
            </section>
            <section class="profile-panel">
                <h3>Materialele mele trimise</h3>
                <div id="profesorListaMateriale"></div>
            </section>
        </div>
    </section>
</div>

`;
