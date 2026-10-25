const HOME_HTML = `
<main>
<div id="pagina-acasa" class="pagina activ home-page">
<header class="alma-hero" id="acasa">
    <div class="alma-hero-copy"><p class="alma-eyebrow">EDU ALMA · ÎNVAȚĂ ALTFEL</p>
    <h1>Descoperă.<br>Înțelege. <span>Exersează.</span></h1>
    <p>O platformă pentru elevi și profesori, în care literatura, resursele didactice și jocurile interactive se întâlnesc.</p>
    <div class="alma-hero-actions"><a class="alma-primary" href="#elevi">Biblioteca elevului</a><a class="alma-secondary" href="#profesori">Sunt profesor</a></div>
    <div class="alma-audiences"><span>Pentru elevi</span><span>Pentru profesori</span><span>Din pasiune pentru educație</span></div></div>
    <div class="alma-hero-seal"><img src="assets/edu-alma-emblem.png" width="360" height="360" alt="Sigla EDU ALMA — Activități, Lecții, Materiale, Aplicații"><p>Educația prinde viață!</p></div>
</header>
<section class="alma-home-explore" id="functionalitati"><div class="alma-section-heading"><div><p class="alma-eyebrow">UN LOC PENTRU FIECARE CURIOZITATE</p><h2>Ce vrei să descoperi astăzi?</h2></div><p>Alege un punct de plecare.<br>Noi îți aducem ideile mai aproape.</p></div>
<div class="alma-home-grid"><a class="alma-home-tile" href="#literatura"><span class="alma-icon">${almaIcon('book')}</span><h3>Biblioteca literară</h3><p>Rezumate, autori, opere și analize.</p></a>
<a class="alma-home-tile" href="#biblioteca-vizuala"><span class="alma-icon">${almaIcon('magazine')}</span><h3>Biblioteca vizuală</h3><p>Teorie în fișe vizuale și recapitulări.</p></a>
<a class="alma-home-tile" href="#teste-evaluari"><span class="alma-icon">${almaIcon('check')}</span><h3>Evaluare și teste</h3><p>Materiale pe clase și competențe.</p></a>
<a class="alma-home-tile" href="#analiza-diagnoza"><span class="alma-icon">${almaIcon('chart')}</span><h3>Diagnoză și remedial</h3><p>Analiză, planificări și sprijin pentru învățare.</p></a>
<a class="alma-home-tile" href="#evaluarea-nationala"><span class="alma-icon">${almaIcon('cap')}</span><h3>Evaluarea Națională</h3><p>Antrenament, exerciții și recapitulări.</p></a>
<a class="alma-home-tile" href="#scoala-altfel"><span class="alma-icon">${almaIcon('puzzle')}</span><h3>Școala Altfel</h3><p>Escape game-uri, vânători și proiecte.</p></a>
<a class="alma-home-tile" href="#jocuri"><span class="alma-icon">${almaIcon('game')}</span><h3>Jocuri interactive</h3><p>Quiz-uri și aventuri educaționale.</p></a>
<a class="alma-home-tile" href="#profesor-ai"><span class="alma-icon">${almaIcon('ai')}</span><h3>Profesor AI</h3><p>Asistență educațională digitală.</p></a></div>
<div class="alma-complementary"><a href="#harta">${almaIcon('map')}<span><strong>Harta literară</strong><small>Descoperă regiunile și autorii lor.</small></span></a><a href="#revista">${almaIcon('magazine')}<span><strong>Reviste digitale</strong><small>Idei și creații care merită împărtășite.</small></span></a></div>
</section>
<section class="alma-library-intro"><div class="alma-section-heading"><div><p class="alma-eyebrow">RESURSE PENTRU PARCURSUL TĂU</p><h2>Două biblioteci. Aceeași pasiune.</h2></div></div><div class="alma-two-columns"><a class="alma-library-card" href="#elevi">${almaIcon('cap')}<h3>Biblioteca elevului</h3><p>Rezumate, fișe vizuale, recapitulări, exerciții și pregătire pentru Evaluarea Națională.</p><span>Explorează pentru tine</span></a><a class="alma-library-card" href="#profesori">${almaIcon('folder')}<h3>Biblioteca profesorului</h3><p>Teste, bareme, adaptări CES, analiză, remedial și proiecte pentru Școala Altfel.</p><span>Pregătește următoarea lecție</span></a></div></section>
<section class="alma-identity"><p class="alma-eyebrow">EDUCAȚIE DIGITALĂ UTILĂ</p><h2>EDU <span>ALMA</span></h2><div class="alma-initials"><div><strong>A</strong><span>Activități</span></div><div><strong>L</strong><span>Lecții</span></div><div><strong>M</strong><span>Materiale</span></div><div><strong>A</strong><span>Aplicații</span></div></div><p>Creativitate · Interactivitate · Resurse pentru elevi și profesori</p></section>
<section class="home-story" id="despre-noi"><p class="alma-eyebrow">O ECHIPĂ. O PASIUNE COMUNĂ.</p><div class="home-section-heading"><h2>Așa a început povestea noastră.</h2></div><p class="alma-about-intro">Suntem un profesor și trei IT-iști, uniți de aceeași pasiune: educația. Construim un spațiu în care învățarea devine descoperire.</p>
    <div class="home-timeline" aria-label="Drumul proiectului">
        <div><span aria-hidden="true">01</span><strong>multe idei</strong></div>
        <div><span aria-hidden="true">02</span><strong>discuții</strong></div>
        <div><span aria-hidden="true">03</span><strong>încercări</strong></div>
        <div><span aria-hidden="true">04</span><strong>nopți târzii</strong></div>
    </div>
    <div class="home-question">Și dintr-o întrebare simplă:<br><strong>„Cum ar fi dacă am face școala puțin altfel?”</strong></div>
</section>

<section class="home-explainer" aria-label="Ce este pe site">
    <article class="home-note note-wide"><span class="alma-icon home-note-icon">${almaIcon('book')}</span><div><h3>Am pornit de la limba și literatura română,</h3><p>pentru că aici poveștile ne-au fost cel mai aproape.</p></div></article>
    <article class="home-note"><span class="alma-icon home-note-icon">${almaIcon('magazine')}</span><div><h3>Am creat:</h3><p>rezumate originale, rezumate ilustrate și rezumate editabile în Word.</p></div></article>
    <article class="home-note"><span class="alma-icon home-note-icon">${almaIcon('folder')}</span><div><h3>Am adăugat</h3><p>fișe de lectură, personaje, valori morale și semnificații.</p></div></article>
    <article class="home-note"><span class="alma-icon home-note-icon">${almaIcon('cap')}</span><div><h3>Personajele au ieșit din carte</h3><p>și și-au primit propriul colț de lume pe Instagram.</p></div></article>
    <article class="home-note"><span class="alma-icon home-note-icon">${almaIcon('magazine')}</span><div><h3>Poveștile continuă cu:</h3><p>filme, audiobookuri și alte resurse.</p></div></article>
    <article class="home-note"><span class="alma-icon home-note-icon">${almaIcon('game')}</span><div><h3>Testele de lectură?</h3><p>Le-am transformat în jocuri și provocări!</p></div></article>
    <article class="home-note"><span class="alma-icon home-note-icon">${almaIcon('book')}</span><div><h3>La gramatică:</h3><p>teste originale, pe clase și capitole, iar pentru clasa a VIII-a, teste pe tipuri de itemi.</p></div></article>
    <article class="home-note"><span class="alma-icon home-note-icon">${almaIcon('folder')}</span><div><h3>Și pentru profesori:</h3><p>analize SWOT, PIP-uri, modele și resurse, plus Revista Profesorilor.</p></div></article>
</section>

<section class="home-discovery" id="idei-lectii">
    <div class="home-section-heading"><h2>Ce găsești aici?</h2></div>
    <p class="home-section-lead">Un spațiu în care ideile de lecție prind viață, iar învățarea devine o descoperire.</p>
    <div class="home-discovery-grid">
        <div><span class="alma-icon">${almaIcon('check')}</span><p>idei pentru<br><strong>lecții</strong></p></div>
        <div><span class="alma-icon">${almaIcon('cap')}</span><p>personaje<br><strong>de descoperit</strong></p></div>
        <div><span class="alma-icon">${almaIcon('book')}</span><p>opere care<br><strong>prind viață</strong></p></div>
        <div><span class="alma-icon">${almaIcon('puzzle')}</span><p>lecții care<br><strong>stârnesc curiozitatea</strong></p></div>
    </div>
</section>

<section class="home-values" id="how-to">
    <div class="home-section-heading"><h2>De ce facem toate acestea?</h2></div>
    <div class="home-values-grid">
        <div><span class="alma-icon">${almaIcon('cap')}</span><p>Credem că educația poate fi <strong>riguroasă</strong> și, în același timp, <strong>caldă.</strong></p></div>
        <div><span class="alma-icon">${almaIcon('check')}</span><p>Poate fi serioasă fără să fie rigidă.</p></div>
        <div><span class="alma-icon">${almaIcon('puzzle')}</span><p>Poate respecta programa și, totuși, să lase loc <strong>imaginației.</strong></p></div>
        <div><span class="alma-icon">${almaIcon('book')}</span><p>Înainte de a iubi o carte, trebuie să avem un motiv să o deschidem.</p></div>
        <div><span class="alma-icon">${almaIcon('chart')}</span><p>Înainte de a învăța, trebuie să ne trezim curiozitatea.</p></div>
        <div><span class="alma-icon">${almaIcon('folder')}</span><p>Cea mai importantă lecție e cea care te face să vrei să afli mai mult.</p></div>
    </div>
</section>


</div>
`;
