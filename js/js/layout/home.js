// Componentă de layout: home.js
const HOME_HTML = `
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
`;
