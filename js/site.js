console.log("SITE.JS SE ÎNCARCĂ");

// ======================================================
// SUPABASE
// ======================================================

const SUPABASE_URL =
    "https://eagjavifluwolqeuctzk.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_QSG9OFrCANpRxA-moQCQgQ_mtkx-hWX";

const BUCKET = "Pdf";
const IMAGINI_BUCKET = "Imagini";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ======================================================
// CONTAINER
// ======================================================

const site =
    document.getElementById("site");

const estePaginaAdmin =
    window.location.pathname.endsWith("admin.html");


// ======================================================
// HTML + CSS   
// ======================================================

site.innerHTML = `




<nav>

    <div class="nav-links">
        <a href="${estePaginaAdmin ? "index.html" : ""}#acasa">Acasă</a>
        <a href="${estePaginaAdmin ? "index.html" : ""}#limba">Limba română</a>
        <a href="${estePaginaAdmin ? "index.html" : ""}#literatura">Literatura română</a>
        <a href="${estePaginaAdmin ? "index.html" : ""}#quiz">Quiz-uri</a>
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


<main>

<div id="pagina-acasa" class="pagina activ home-page">

<header class="home-hero" id="acasa">
    <div class="home-hero-copy">
        <p class="home-kicker">Un loc pentru idei, povești și curiozitate</p>
        <h1>Cine suntem noi?</h1>
        <p class="home-lead">Suntem un profesor și trei IT-iști, uniți de aceeași pasiune: <strong>educația.</strong></p>
        <p class="home-intro">Ne-am dorit o educație mai aproape de copii, mai curioasă, mai creativă și, de ce nu, puțin mai veselă.</p>
        <a href="#functionalitati" class="home-cta">Descoperă lumea noastră ↓</a>
    </div>
    <div class="home-hero-art" aria-hidden="true"><span>📚</span><span>💡</span><span>✦</span></div>
</header>

<section class="home-story" id="despre-noi">
    <div class="home-section-heading"><span class="home-sprout">🌱</span><h2>Așa a început povestea noastră.</h2></div>
    <p class="home-story-line">Din multe idei, discuții, încercări și nopți târzii.</p>
    <div class="home-timeline" aria-label="Drumul proiectului">
        <div><span>💬</span><strong>multe idei</strong></div><i>→</i>
        <div><span>🗣️</span><strong>discuții</strong></div><i>→</i>
        <div><span>⚗️</span><strong>încercări</strong></div><i>→</i>
        <div><span>🌙</span><strong>nopți târzii</strong></div>
    </div>
    <div class="home-question">Și dintr-o întrebare simplă:<br><strong>„Cum ar fi dacă am face școala puțin altfel?”</strong></div>
</section>

<section class="home-explainer" aria-label="Ce este pe site">
    <article class="home-note note-wide"><span class="home-note-icon">✒️</span><div><h3>Am pornit de la limba și literatura română,</h3><p>pentru că aici poveștile ne-au fost cel mai aproape.</p></div></article>
    <article class="home-note"><span class="home-note-icon">📝</span><div><h3>Am creat:</h3><p>rezumate originale, rezumate ilustrate și rezumate editabile în Word.</p></div></article>
    <article class="home-note"><span class="home-note-icon">❤️</span><div><h3>Am adăugat</h3><p>fișe de lectură, personaje, valori morale și semnificații.</p></div></article>
    <article class="home-note"><span class="home-note-icon">📱</span><div><h3>Personajele au ieșit din carte</h3><p>și și-au primit propriul colț de lume pe Instagram.</p></div></article>
    <article class="home-note"><span class="home-note-icon">🎬</span><div><h3>Poveștile continuă cu:</h3><p>filme, audiobookuri și alte resurse.</p></div></article>
    <article class="home-note"><span class="home-note-icon">🏆</span><div><h3>Testele de lectură?</h3><p>Le-am transformat în jocuri și provocări!</p></div></article>
    <article class="home-note"><span class="home-note-icon">✅</span><div><h3>La gramatică:</h3><p>teste originale, pe clase și capitole, iar pentru clasa a VIII-a, teste pe tipuri de itemi.</p></div></article>
    <article class="home-note"><span class="home-note-icon">💼</span><div><h3>Și pentru profesori:</h3><p>analize SWOT, PIP-uri, modele și resurse, plus Revista Profesorilor.</p></div></article>
</section>

<section class="home-discovery" id="functionalitati">
    <div class="home-section-heading"><span class="home-sprout">✦</span><h2>Ce găsești aici?</h2></div>
    <p class="home-section-lead">Un spațiu în care ideile de lecție prind viață, iar învățarea devine o descoperire.</p>
    <div class="home-discovery-grid">
        <div><span>🧑‍🏫</span><p>idei pentru<br><strong>lecții</strong></p></div>
        <div><span>🧒</span><p>personaje<br><strong>de descoperit</strong></p></div>
        <div><span>📚</span><p>opere care<br><strong>prind viață</strong></p></div>
        <div><span>🎮</span><p>lecții care<br><strong>stârnesc curiozitatea</strong></p></div>
    </div>
</section>

<section class="home-values" id="how-to">
    <div class="home-section-heading"><span class="home-sprout">💡</span><h2>De ce facem toate acestea?</h2></div>
    <div class="home-values-grid">
        <div><span>🎯</span><p>Credem că educația poate fi <strong>riguroasă</strong> și, în același timp, <strong>caldă.</strong></p></div>
        <div><span>🛡️</span><p>Poate fi serioasă fără să fie rigidă.</p></div>
        <div><span>🎓</span><p>Poate respecta programa și, totuși, să lase loc <strong>imaginației.</strong></p></div>
        <div><span>💗</span><p>Înainte de a iubi o carte, trebuie să avem un motiv să o deschidem.</p></div>
        <div><span>💡</span><p>Înainte de a învăța, trebuie să ne trezim curiozitatea.</p></div>
        <div><span>⭐</span><p>Cea mai importantă lecție e cea care te face să vrei să afli mai mult.</p></div>
    </div>
</section>

<section class="home-welcome">
    <div class="home-welcome-book">📖</div>
    <div><p>Acesta este locul pe care încercăm să-l construim.</p><h2>Bine ai venit<br><small>în lumea noastră!</small></h2></div>
    <p>Sperăm să devină, încet-încet,<br>și lumea ta. 🌍</p>
</section>

</div>


<div id="pagina-limba" class="pagina">


<section id="limba">

    <h2 class="titlu">
        Limba română
    </h2>

    <p class="subtitlu">
        Alege clasa pentru a vedea capitolele și materialele disponibile.
    </p>

    <div class="cards clase-limba-selectie">

        <a class="card clasa-limba-box" href="#limba-clasa-5">
            <div class="icon">5</div>
            <h3>Clasa a V-a</h3>
            <p>Capitole și materiale pentru clasa a V-a.</p>
        </a>

        <a class="card clasa-limba-box" href="#limba-clasa-6">
            <div class="icon">6</div>
            <h3>Clasa a VI-a</h3>
            <p>Capitole și materiale pentru clasa a VI-a.</p>
        </a>

        <a class="card clasa-limba-box" href="#limba-clasa-7">
            <div class="icon">7</div>
            <h3>Clasa a VII-a</h3>
            <p>Capitole și materiale pentru clasa a VII-a.</p>
        </a>

        <a class="card clasa-limba-box" href="#limba-clasa-8">
            <div class="icon">8</div>
            <h3>Clasa a VIII-a</h3>
            <p>Capitole și materiale pentru clasa a VIII-a.</p>
        </a>

    </div>

</section>

<div id="limbaClase"></div>

</div>


<div id="pagina-literatura" class="pagina">


<section id="literatura">

    <h2 class="titlu">
        Literatura română
    </h2>

    <p class="subtitlu">
        Poezie, proză și teatru.
    </p>

    <div class="cards">

        <a class="card literatura-box" href="#poezie">
            <div class="icon">🌙</div>
            <h3>Poezia</h3>
            <p>
                Poezia exprimă sentimente și idei
                printr-un limbaj artistic.
            </p>
        </a>

        <a class="card literatura-box" href="#proza">
            <div class="icon">📖</div>
            <h3>Proza</h3>
            <p>
                Romanul, nuvela, povestirea și basmul
                sunt forme importante ale prozei.
            </p>
        </a>

        <a class="card literatura-box" href="#teatru">
            <div class="icon">🎭</div>
            <h3>Teatrul</h3>
            <p>
                Textele dramatice sunt construite
                în jurul personajelor și dialogului.
            </p>
        </a>

    </div>

</section>


<section>

    <div class="citat">

        <p>
            „Nu există altă avere mai prețioasă
            decât limba unui popor.”
        </p>

        <strong>
            — Nicolae Iorga
        </strong>

    </div>

</section>

<section id="poezie">

    <h2 class="titlu">
        Poezie 📜
    </h2>

    <p class="subtitlu">
        Autori și opere de poezie.
    </p>

    <div
        class="cards"
        id="poezieCards">
    </div>

</section>


<section id="proza">

    <h2 class="titlu">
        Proză 📖
    </h2>

    <p class="subtitlu">
        Autori și opere de proză.
    </p>

    <div
        class="cards"
        id="prozaCards">
    </div>

</section>


<section id="teatru">

    <h2 class="titlu">
        Teatru 🎭
    </h2>

    <p class="subtitlu">
        Autori și opere de teatru.
    </p>

    <div
        class="cards"
        id="teatruCards">
    </div>

</section>

</div>


<div id="pagina-quiz" class="pagina">

<section id="quiz">

    <h2 class="titlu">
        Quiz-uri 🎮
    </h2>

    <p class="subtitlu">
        Alege platforma pe care vrei să exersezi.
    </p>

    <div class="quiz-selectie">

        <button
            class="quiz-tab kahoot activ"
            onclick="arataQuiz('kahoot')">

            🎯 Kahoot

        </button>

        <button
            class="quiz-tab wordwall"
            onclick="arataQuiz('wordwall')">

            🧩 Wordwall

        </button>

    </div>


    <div id="kahoot" class="quizuri">

        <div class="kahoot-card">

            <h3>
                📝 Aplicarea regulilor în contexte noi
            </h3>

            <p>
                Exersează aplicarea regulilor de limbă română.
            </p>

            <a
                class="kahoot-link"
                href="https://play.kahoot.it/v2/?quizId=071aa0d4-21d3-426f-a7a3-4c8ab375d61b&hostId=abe4ceb9-8934-4647-a7f8-ee81f1f1ac7c"
                target="_blank"
                rel="noopener noreferrer">

                🎯 Deschide Kahoot

            </a>

        </div>


        <div class="kahoot-card">

            <h3>
                📚 Romanian Vocabulary in Context
            </h3>

            <p>
                Exersează vocabularul românesc.
            </p>

            <a
                class="kahoot-link"
                href="https://play.kahoot.it/v2/?quizId=bf406337-3185-409c-92c7-22471cf41e38&hostId=abe4ceb9-8934-4647-a7f8-ee81f1f1ac7c"
                target="_blank"
                rel="noopener noreferrer">

                🎯 Deschide Kahoot

            </a>

        </div>

    </div>


    <div
        id="wordwall"
        class="quizuri ascuns">

        <div class="quiz-card">

            <h3>
                🔤 Conjuncții de coordonare
            </h3>

            <iframe
                src="https://www.wordwall.net/resource/71605201/limba-rom%C3%A2n%C4%83/conjunc%C8%9Bii-coordonare"
                allowfullscreen>
            </iframe>

        </div>


        <div class="quiz-card">

            <h3>
                ✍️ Recapitulare – Verbul
            </h3>

            <iframe
                src="https://www.wordwall.net/resource/71415598/limba-rom%C3%A2n%C4%83/recapitulare-vi-viii-verbul"
                allowfullscreen>
            </iframe>

        </div>

    </div>

</section>

</div>


<div id="pagina-revista" class="pagina">

<section id="revista">

    <h2 class="titlu">Revista</h2>

    <p class="subtitlu">
        O secțiune nouă pentru articole și conținut editorial.
    </p>

    <div class="card" style="text-align:center;">
        <div class="icon">📰</div>
        <h3>În curând</h3>
        <p>
            Revista este în pregătire. Aici va fi adăugată o funcționalitate nouă.
        </p>
    </div>

</section>

</div>

</main>


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


    <div
        class="admin-box"
        style="margin-top:20px;">

        <h3>🔤 Adaugă capitol pentru Limba română</h3>

        <label for="limbaCapitolClasa">Clasa</label>
        <select id="limbaCapitolClasa">
            <option value="">Selectează clasa</option>
            <option value="5">Clasa a V-a</option>
            <option value="6">Clasa a VI-a</option>
            <option value="7">Clasa a VII-a</option>
            <option value="8">Clasa a VIII-a</option>
        </select>

        <input type="text" id="limbaCapitolTitlu" placeholder="Titlul capitolului">
        <textarea id="limbaCapitolDescriere" placeholder="Descrierea capitolului" rows="3"></textarea>
        <input type="number" id="limbaCapitolOrdine" placeholder="Ordine (opțional)" min="0">

        <button class="admin-btn" onclick="adaugaCapitolLimba()">➕ Adaugă capitol</button>
        <div id="limbaCapitolStatus" class="admin-status"></div>

    </div>


    <div
        class="admin-box"
        style="margin-top:20px;">

        <h3>📄 Adaugă material PDF pentru Limba română</h3>

        <label for="limbaMaterialCapitol">Capitol</label>
        <select id="limbaMaterialCapitol">
            <option value="">Selectează capitolul</option>
        </select>

        <input type="text" id="limbaMaterialTitlu" placeholder="Titlul materialului">
        <textarea id="limbaMaterialDescriere" placeholder="Descrierea materialului" rows="3"></textarea>
        <input type="number" id="limbaMaterialOrdine" placeholder="Ordine (opțional)" min="0">
        <input type="file" id="limbaMaterialPDF" accept="application/pdf">

        <button class="admin-btn" onclick="adaugaMaterialLimba()">➕ Încarcă materialul</button>
        <div id="limbaMaterialStatus" class="admin-status"></div>

    </div>


    <div
        class="admin-box"
        style="margin-top:20px;">

        <h3>📚 Capitole și materiale de limbă existente</h3>

        <button class="admin-btn" onclick="incarcaLimbaAdmin()">🔄 Reîmprospătează</button>
        <div id="listaLimbaAdmin"></div>

    </div>


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

        <div id="listaAutoriAdmin"></div>

    </div>


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

        <div id="listaOpereAdmin"></div>

    </div>


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

    </div>

</section>


<div
    id="loginModal"
    class="login-modal ascuns">

    <div class="login-box">

        <button
            class="inchide-login"
            onclick="inchideLogin()">

            ✕

        </button>

        <h2>🔐 Contul tău</h2>

        <div class="auth-tabs">
            <button id="loginTab" class="auth-tab activ" onclick="schimbaAuthForm('login')">Logare</button>
            <button id="registerTab" class="auth-tab" onclick="schimbaAuthForm('register')">Register</button>
        </div>

        <div id="loginForm" class="auth-form">
            <p>Intră în contul tău.</p>
            <input type="email" id="loginEmail" placeholder="Email">
            <input type="password" id="loginPassword" placeholder="Parolă">
            <button class="login-btn" onclick="loginUtilizator()">🔐 Logare</button>
            <button class="login-btn reset-btn" type="button" onclick="reseteazaParola()">🔑 Am uitat parola</button>
        </div>

        <div id="registerForm" class="auth-form ascuns">
            <p>Creează un cont de profesor sau elev.</p>
            <input type="email" id="registerEmail" placeholder="Email">
            <input type="password" id="registerPassword" placeholder="Parolă (minimum 6 caractere)">
            <select id="registerRole">
                <option value="elev">Elev</option>
                <option value="profesor">Profesor</option>
            </select>
            <button class="login-btn" onclick="inregistreazaUtilizator()">📝 Creează cont</button>
        </div>

        <p id="loginMesaj"></p>

    </div>

</div>


<footer>

    <h2>
        Limba și Literatura Română 📖
    </h2>

    <p>
        Un proiect dedicat frumuseții limbii române.
    </p>

    <p>
        © 2026
    </p>

</footer>

`;

// ======================================================
// BUTON SEARCH
// ======================================================

const searchToggle =
    document.getElementById("searchToggle");

const searchContainer =
    document.querySelector(".search-container");


searchToggle.addEventListener("click", function () {

    searchContainer.classList.toggle("ascuns");

    if (!searchContainer.classList.contains("ascuns")) {

        searchInput.focus();

    }

});


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text || "";

    return div.innerHTML;
}

function golesteCampuri(...iduri) {

    iduri.forEach(id => {

        const element = document.getElementById(id);

        if (element) {
            element.value = "";
        }

    });
}

// ======================================================
// CĂUTARE
// ======================================================

let dateCautare = [];


function pregatesteDateCautare(autori, opere) {

    dateCautare = [];

    (autori || []).forEach(autor => {

        dateCautare.push({
            tip: "Autor",
            titlu: autor.nume || "",
            categorie: autor.categorie || "",
            autorId: autor.id
        });

    });


    (opere || []).forEach(opera => {

        const autor = (autori || []).find(
            a =>
                String(a.id) ===
                String(opera.autor_id)
        );

        dateCautare.push({
            tip: "Operă",
            titlu: opera.titlu || "",
            autorNume: autor
                ? autor.nume
                : "",
            categorie: autor
                ? autor.categorie
                : "",
            autorId: opera.autor_id,
            operaId: opera.id
        });

    });

}


function cautaSite(text) {

    const results =
        document.getElementById(
            "searchResults"
        );

    if (!results) {
        return;
    }


    const cautare =
        text
            .trim()
            .toLowerCase();


    if (!cautare) {

        results.innerHTML = "";
        results.classList.remove("activ");

        return;

    }


    const rezultate =
        dateCautare.filter(item => {

            const continut = [

                item.tip,
                item.titlu,
                item.autorNume,
                item.categorie

            ]
                .join(" ")
                .toLowerCase();

            return continut.includes(cautare);

        });


    if (rezultate.length === 0) {

        results.innerHTML = `
            <div class="search-no-results">
                🔍 Nu am găsit rezultate pentru
                „${escapeHTML(text)}”.
            </div>
        `;

        results.classList.add("activ");

        return;

    }


    results.innerHTML =
        rezultate
            .slice(0, 20)
            .map(item => `

                <div
                    class="search-result"
                    onclick="deschideRezultatCautare(
                        '${item.tip}',
                        '${item.autorId}',
                        '${item.operaId || ""}'
                    )">

                    <strong>
                        ${escapeHTML(item.titlu)}
                    </strong>

                    <small>
                        ${escapeHTML(item.tip)}
                        ${item.categorie
                    ? " • " +
                    escapeHTML(item.categorie)
                    : ""}
                        ${item.tip === "Operă" &&
                    item.autorNume
                    ? " • " +
                    escapeHTML(item.autorNume)
                    : ""}
                    </small>

                </div>

            `)
            .join("");


    results.classList.add("activ");

}


async function deschideRezultatCautare(
    tip,
    autorId,
    operaId
) {

    const input =
        document.getElementById(
            "searchInput"
        );

    const results =
        document.getElementById(
            "searchResults"
        );


    if (input) {
        input.value = "";
    }

    if (results) {
        results.classList.remove("activ");
        results.innerHTML = "";
    }


    if (tip === "Autor") {

        const { data: autor } =
            await supabaseClient
                .from("autori")
                .select("categorie")
                .eq("id", autorId)
                .single();


        if (!autor) {
            return;
        }


        const categorie =
            String(
                autor.categorie || ""
            )
                .trim()
                .toLowerCase();


        const sectiuni = {
            poezie: "poezie",
            proza: "proza",
            teatru: "teatru"
        };


        const ancora =
            sectiuni[categorie];


        if (ancora) {

            window.location.hash =
                ancora;

        }

        return;

    }


    if (tip === "Operă") {

        const { data: opera } =
            await supabaseClient
                .from("opere")
                .select("autor_id")
                .eq("id", operaId)
                .single();


        if (!opera) {
            return;
        }


        const { data: autor } =
            await supabaseClient
                .from("autori")
                .select("categorie")
                .eq("id", opera.autor_id)
                .single();


        if (!autor) {
            return;
        }


        const categorie =
            String(
                autor.categorie || ""
            )
                .trim()
                .toLowerCase();


        if (
            ["poezie", "proza", "teatru"]
                .includes(categorie)
        ) {

            window.location.hash =
                categorie;

        }

    }

}


// ======================================================
// OBȚINE CALEA DIN URL
// ======================================================

function obtineCaleStorage(url) {

    if (!url) {
        return null;
    }

    try {

        const marker =
            "/storage/v1/object/";

        const index =
            url.indexOf(marker);

        if (index === -1) {

            return null;

        }


        const dupaMarker =
            url.substring(
                index + marker.length
            );


        const pozitii =
            dupaMarker.indexOf("/");


        if (pozitii === -1) {

            return null;

        }


        const cale =
            dupaMarker.substring(
                pozitii + 1
            );


        return decodeURIComponent(cale);

    } catch (error) {

        console.error(
            "Eroare extragere cale:",
            error
        );

        return null;
    }
}


// ======================================================
// ÎNCARCĂ AUTORII PE SITE
// ======================================================

async function incarcaAutori() {

    const containere = {
        poezie: document.getElementById("poezieCards"),
        proza: document.getElementById("prozaCards"),
        teatru: document.getElementById("teatruCards")
    };


    if (!containere.poezie || !containere.proza || !containere.teatru) {
        return;
    }


    Object.values(containere).forEach(container => {
        container.innerHTML =
            "<p style='text-align:center'>Se încarcă autorii...</p>";
    });


    try {

        const {
            data: autori,
            error: eroareAutori
        } =
            await supabaseClient
                .from("autori")
                .select("*")
                .order("nume", {
                    ascending: true
                });


        if (eroareAutori) {

            console.error(
                eroareAutori
            );

            Object.values(containere).forEach(container => {
                container.innerHTML =
                    "<p style='color:#c62828;text-align:center'>" +
                    "Nu am putut încărca autorii." +
                    "</p>";
            });

            return;
        }


        const {
            data: opere,
            error: eroareOpere
        } =
            await supabaseClient
                .from("opere")
                .select("*")
                .order("titlu", {
                    ascending: true
                });


        if (eroareOpere) {

            console.error(
                eroareOpere
            );

            Object.values(containere).forEach(container => {
                container.innerHTML =
                    "<p style='color:#c62828;text-align:center'>" +
                    "Nu am putut încărca operele." +
                    "</p>";
            });

            return;
        }

        pregatesteDateCautare(
            autori,
            opere
        );

        const carduri = {
            poezie: [],
            proza: [],
            teatru: []
        };


        for (
            const autor of autori || []
        ) {

            const opereAutor =
                (opere || []).filter(
                    opera =>
                        String(opera.autor_id) ===
                        String(autor.id)
                );


            const opereHTML = [];


            for (
                const opera of opereAutor
            ) {

                const areRezumat =
                    !!opera.pdf;

                const areAnalizaLiterara =
                    !!opera.pdf_analiza_literara;

                const areValori =
                    !!opera.pdf_valori_morale;

                const areCaracterizare =
                    !!opera.pdf_caracterizare;

                const areRezumatWord =
                    !!opera.rezumat_word;

                const areLinkFilm =
                    !!opera.link_film;

                const areLinkAudiobook =
                    !!opera.link_audiobook;

                const areLinkTestLectura =
                    !!opera.link_test_lectura;

                const areImaginePersonaje =
                    !!opera.personaje_instagram;

                const esteDocumentInstagram =
                    /\.pdf(?:$|[?#])/i.test(opera.personaje_instagram || "");


                if (
                    !areRezumat &&
                    !areAnalizaLiterara &&
                    !areValori &&
                    !areCaracterizare &&
                    !areRezumatWord &&
                    !areLinkFilm &&
                    !areLinkAudiobook &&
                    !areLinkTestLectura &&
                    !areImaginePersonaje
                ) {

                    continue;

                }


                let butoane = "";


                if (areRezumat) {

                    butoane += `

                        <button
                            class="opera-btn"
                            type="button"
                            onclick='deschidePDF(${JSON.stringify(opera.pdf)})'>

                            📕 Rezumat

                        </button>

                    `;

                }

                if (areAnalizaLiterara) {

                    butoane += `

                        <button
                            class="opera-btn"
                            type="button"
                            onclick='deschidePDF(${JSON.stringify(opera.pdf_analiza_literara)})'>

                            📚 Analiză literară

                        </button>

                    `;

                }


                if (areValori) {

                    butoane += `

                        <button
                            class="opera-btn"
                            type="button"
                            onclick='deschidePDF(${JSON.stringify(opera.pdf_valori_morale)})'>

                            ❤️ Valori morale

                        </button>

                    `;

                }


                if (areCaracterizare) {

                    butoane += `

                        <button
                            class="opera-btn"
                            type="button"
                            onclick='deschidePDF(${JSON.stringify(opera.pdf_caracterizare)})'>

                            👤 Personaje și semnificații

                        </button>

                    `;

                }

                if (areRezumatWord) {

                    butoane += `

                        <button
                            class="opera-btn"
                            type="button"
                            onclick='descarcaRezumatWord(${JSON.stringify(opera.rezumat_word)})'>

                            📄 Descarcă rezumatul scris

                        </button>

                    `;

                }

                if (areLinkFilm) {
                    butoane += `
                        <a class="opera-link" href="${escapeHTML(opera.link_film)}" target="_blank" rel="noopener noreferrer">🎬 Film</a>
                    `;
                }

                if (areLinkAudiobook) {
                    butoane += `
                        <a class="opera-link" href="${escapeHTML(opera.link_audiobook)}" target="_blank" rel="noopener noreferrer">🎧 Audiobook</a>
                    `;
                }

                if (areLinkTestLectura) {
                    butoane += `
                        <a class="opera-link" href="${escapeHTML(opera.link_test_lectura)}" target="_blank" rel="noopener noreferrer">📝 Test de lectură</a>
                    `;
                }

                const personajeInstagramHTML = areImaginePersonaje &&
                    !esteDocumentInstagram
                    ? `
                        <div class="personaje-instagram">
                            <img src="${escapeHTML(opera.personaje_instagram)}" alt="Personajele din ${escapeHTML(opera.titlu)}" loading="lazy">
                        </div>
                    `
                    : "";

                if (esteDocumentInstagram) {
                    butoane += `

                        <button
                            class="opera-btn personaje-instagram-btn"
                            type="button"
                            onclick='deschidePDF(${JSON.stringify(opera.personaje_instagram)})'>

                            📷 Instagramul personajelor

                        </button>

                    `;
                }


                opereHTML.push(`

                    <details class="opera">

                        <summary class="opera-titlu">
                            📖 ${escapeHTML(opera.titlu)}
                        </summary>

                        <div class="opera-resurse">

                            ${personajeInstagramHTML}

                            ${butoane}

                        </div>

                    </details>

                `);

            }


            if (
                opereHTML.length === 0
            ) {

                continue;

            }


            const pozaHTML =
                autor.poza
                    ? `

                    <img
                        src="${escapeHTML(autor.poza)}"
                        alt="${escapeHTML(autor.nume)}"
                        loading="lazy"
                        onerror="this.style.display='none';">

                    `
                    : "";


            const categorie =
                String(autor.categorie || "")
                    .trim()
                    .toLowerCase();

            if (!carduri[categorie]) {
                continue;
            }


            carduri[categorie].push(`

                <div class="card autor">

                    <div class="portret">

                        ${pozaHTML}

                    </div>

                    <div class="autor-descriere">

                        <h3 class="autor-nume">
                            ${escapeHTML(autor.nume)}
                        </h3>

                        <p>
                            ${escapeHTML(autor.descriere || "Nu există încă o descriere pentru acest autor.")}
                        </p>

                    </div>

                    <div class="opera-list">

                        ${opereHTML.join("")}

                    </div>

                </div>

            `);

        }


        Object.entries(containere).forEach(([categorie, container]) => {
            container.innerHTML =
                carduri[categorie].length > 0
                    ? carduri[categorie].join("")
                    : "<p style='text-align:center'>" +
                    "Momentan nu există materiale disponibile." +
                    "</p>";
        });


    } catch (error) {

        console.error(
            "Eroare încărcare autori:",
            error
        );

        Object.values(containere).forEach(container => {
            container.innerHTML =
                "<p style='color:#c62828;text-align:center'>" +
                "A apărut o eroare." +
                "</p>";
        });

    }
}

// ======================================================
// ÎNCARCĂ MATERIALELE DE LIMBĂ
// ======================================================

async function incarcaMaterialeLimba() {

    const container = document.getElementById("limbaClase");

    if (!container) {
        return;
    }

    container.innerHTML = "<p style='text-align:center'>Se încarcă materialele...</p>";

    try {
        const { data: clase, error: eroareClase } = await supabaseClient
            .from("limba_clase")
            .select("id, numar, titlu")
            .order("numar", { ascending: true });

        if (eroareClase) {
            throw eroareClase;
        }

        const { data: capitole, error: eroareCapitole } = await supabaseClient
            .from("limba_capitole")
            .select("id, clasa_id, titlu, descriere, ordine")
            .order("ordine", { ascending: true })
            .order("titlu", { ascending: true });

        if (eroareCapitole) {
            throw eroareCapitole;
        }

        const { data: materiale, error: eroareMateriale } = await supabaseClient
            .from("limba_materiale")
            .select("id, capitol_id, titlu, descriere, pdf, ordine")
            .order("ordine", { ascending: true })
            .order("titlu", { ascending: true });

        if (eroareMateriale) {
            throw eroareMateriale;
        }

        if (!clase || clase.length === 0) {
            container.innerHTML = "<p style='text-align:center'>Momentan nu există materiale pentru Limba română.</p>";
            return;
        }

        container.innerHTML = clase.map(clasa => {
            const capitoleClasa = (capitole || []).filter(
                capitol => String(capitol.clasa_id) === String(clasa.id)
            );

            const capitoleHTML = capitoleClasa.map(capitol => {
                const materialeCapitol = (materiale || []).filter(
                    material => String(material.capitol_id) === String(capitol.id)
                );

                const materialeHTML = materialeCapitol.length > 0
                    ? materialeCapitol.map(material => `
                        <div class="material-limba">
                            <div>
                                <strong>${escapeHTML(material.titlu)}</strong>
                                ${material.descriere ? `<p>${escapeHTML(material.descriere)}</p>` : ""}
                            </div>
                            <button class="opera-btn" type="button"
                                onclick='deschidePDF(${JSON.stringify(material.pdf)})'>
                                📄 Deschide PDF
                            </button>
                        </div>
                    `).join("")
                    : "<p>Nu există materiale în acest capitol.</p>";

                return `
                    <article class="capitol-limba">
                        <h4>${escapeHTML(capitol.titlu)}</h4>
                        ${capitol.descriere ? `<p>${escapeHTML(capitol.descriere)}</p>` : ""}
                        <div class="materiale-limba">${materialeHTML}</div>
                    </article>
                `;
            }).join("");

            return `
                <section id="limba-clasa-${clasa.numar}" class="limba-clasa">
                    <h2 class="titlu">${escapeHTML(clasa.titlu || `Clasa a ${clasa.numar}-a`)}</h2>
                    <p class="subtitlu limba-clasa-descriere">${escapeHTML(
                {
                    5: "Noțiuni de bază de gramatică, vocabular, ortografie și comunicare.",
                    6: "Consolidarea gramaticii, a vocabularului și a înțelegerii textului.",
                    7: "Sintaxa frazei, vocabularul și exprimarea clară în contexte diverse.",
                    8: "Recapitulare și aprofundare pentru comunicare și evaluarea de la finalul gimnaziului."
                }[clasa.numar] || "Gramatică, vocabular, ortografie și comunicare.")}</p>
                    <div class="capitole-limba">
                        ${capitoleHTML || "<p>Nu există capitole definite pentru această clasă.</p>"}
                    </div>
                </section>
            `;
        }).join("");
    } catch (error) {
        console.error("Eroare încărcare materiale Limba română:", error);
        container.innerHTML = "<p style='color:#c62828;text-align:center'>Nu am putut încărca materialele de limbă.</p>";
    }
}




// ======================================================
// DESCHIDE PDF PRIVAT CU URL SEMNAT
// ======================================================

async function deschidePDF(pdfUrl) {

    if (!pdfUrl) {

        alert(
            "PDF-ul nu există."
        );

        return;
    }

    try {

        const cale =
            obtineCalePDF(pdfUrl);


        console.log(
            "Referință PDF:",
            pdfUrl
        );

        console.log(
            "Cale PDF în Storage:",
            cale
        );


        if (!cale) {

            alert(
                "Nu am putut identifica fișierul PDF."
            );

            return;
        }


        const {
            data,
            error
        } =
            await supabaseClient
                .storage
                .from(BUCKET)
                .createSignedUrl(
                    cale,
                    60 * 60
                );


        if (error) {

            console.error(
                "Eroare URL semnat:",
                error
            );

            alert(
                "Nu am putut deschide PDF-ul: " +
                error.message
            );

            return;
        }


        if (
            !data ||
            !data.signedUrl
        ) {

            console.error(
                "Nu există signedUrl:",
                data
            );

            alert(
                "Supabase nu a returnat URL-ul PDF-ului."
            );

            return;
        }


        console.log(
            "URL PDF semnat:",
            data.signedUrl
        );


        window.open(
            data.signedUrl,
            "_blank"
        );


    } catch (error) {

        console.error(
            "Eroare deschidere PDF:",
            error
        );

        alert(
            "A apărut o eroare la deschiderea PDF-ului: " +
            error.message
        );

    }

}

async function obtineURLSemnat(valoare, optiuni = {}) {

    const cale = obtineCalePDF(valoare);

    if (!cale) {
        throw new Error("Nu am putut identifica fișierul din Storage.");
    }

    const { data, error } =
        await supabaseClient
            .storage
            .from(BUCKET)
            .createSignedUrl(cale, 60 * 60, optiuni);

    if (error) {
        throw error;
    }

    if (!data || !data.signedUrl) {
        throw new Error("Supabase nu a returnat URL-ul semnat.");
    }

    return data.signedUrl;
}

async function descarcaRezumatWord(wordUrl) {

    if (!wordUrl) {
        alert("Rezumatul Word nu există.");
        return;
    }

    try {

        const urlSemnat =
            await obtineURLSemnat(wordUrl, { download: true });

        const link = document.createElement("a");
        link.href = urlSemnat;
        link.download = "rezumat.docx";
        document.body.appendChild(link);
        link.click();
        link.remove();

    } catch (error) {
        console.error("Eroare descărcare rezumat Word:", error);
        alert("Nu am putut descărca rezumatul Word.");
    }
}


// ======================================================
