const HOME_HTML = `
<main>
<div id="pagina-acasa" class="pagina activ home-page">
<header class="alma-hero" id="acasa">
    <div class="alma-hero-copy"><p class="alma-eyebrow">EDU ALMA · ÎNVAȚĂ ALTFEL</p>
    <h1>Descoperă.<br>Înțelege. <span>Exersează.</span></h1>
    <p>O platformă pentru elevi și profesori, în care literatura, resursele didactice și jocurile interactive se întâlnesc.</p>
    <div class="alma-hero-actions"><a class="alma-primary" href="#elevi">Biblioteca elevului</a><a class="alma-secondary" href="#profesori">Biblioteca profesorului</a></div>
    <div class="alma-audiences"><span>Pentru elevi</span><span>Pentru profesori</span><span>Din pasiune pentru educație</span></div></div>
    <div class="alma-hero-seal"><img src="assets/edu-alma-emblem.png" width="360" height="360" alt="Sigla EDU ALMA — Activități, Lecții, Materiale, Aplicații"><p>Educația prinde viață!</p></div>
</header>
<section class="alma-home-explore" id="functionalitati"><div class="alma-section-heading"><div><p class="alma-eyebrow">UN LOC PENTRU FIECARE CURIOZITATE</p><h2>Ce vrei să descoperi astăzi?</h2></div><p>Alege un punct de plecare.<br>Noi îți aducem ideile mai aproape.</p></div>
<div class="alma-home-grid"><a class="alma-home-tile" href="#rezumate-literare"><span class="alma-icon">${almaIcon('book')}</span><h3>Biblioteca literară</h3><p>Descoperă operele și resursele după titlu sau autor.</p></a>
<a class="alma-home-tile" href="#biblioteca-vizuala"><span class="alma-icon">${almaIcon('magazine')}</span><h3>Biblioteca vizuală</h3><p>Fișe vizuale și scheme pentru recapitulare.</p></a>
<a class="alma-home-tile" href="#teste-evaluari"><span class="alma-icon">${almaIcon('check')}</span><h3>Evaluare și teste</h3><p>Materiale pe clase, teste și bareme.</p></a>
<a class="alma-home-tile" href="#analiza-diagnoza"><span class="alma-icon">${almaIcon('chart')}</span><h3>Analiză și diagnoză</h3><p>Centralizatoare și modele de analiză a rezultatelor.</p></a>
<a class="alma-home-tile" href="#evaluarea-nationala"><span class="alma-icon">${almaIcon('cap')}</span><h3>Evaluarea Națională</h3><p>Exerciții și teste pentru pregătirea examenului.</p></a>
<a class="alma-home-tile" href="#scoala-altfel"><span class="alma-icon">${almaIcon('puzzle')}</span><h3>Școala Altfel</h3><p>Jocuri disponibile și activități în pregătire.</p></a>
<a class="alma-home-tile" href="#jocuri"><span class="alma-icon">${almaIcon('game')}</span><h3>Jocuri interactive</h3><p>Quiz-uri și aventuri educaționale.</p></a>
<a class="alma-home-tile" href="#profesor-ai"><span class="alma-icon">${almaIcon('ai')}</span><h3>Profesor AI</h3><p>Asistență educațională digitală.</p></a></div>
<div class="alma-home-grid alma-home-secondary">
<a class="alma-home-tile" href="#harta"><span class="alma-icon">${almaIcon('map')}</span><h3>Harta literară</h3><p>Descoperă regiunile și autorii lor.</p></a>
<a class="alma-home-tile" href="#revista"><span class="alma-icon">${almaIcon('magazine')}</span><h3>Reviste digitale</h3><p>Consultă revista profesorilor și informațiile despre contribuții.</p></a>
</div>
</section>
<section class="alma-library-intro"><div class="alma-section-heading"><div><p class="alma-eyebrow">RESURSE PENTRU PARCURSUL TĂU</p><h2>Două biblioteci. Aceeași pasiune.</h2></div></div><div class="alma-two-columns"><a class="alma-library-card" href="#elevi">${almaIcon('cap')}<h3>Biblioteca elevului</h3><p>Opere, autori, materiale de limba română și jocuri. Descoperă materialele publicate în fiecare categorie.</p><span>Explorează pentru tine</span></a><a class="alma-library-card" href="#profesori">${almaIcon('folder')}<h3>Biblioteca profesorului</h3><p>Materiale pe clase, evaluări, remedial și revista profesorilor.</p><span>Explorează biblioteca</span></a></div></section>
<section class="home-story" id="despre-noi">
    <p class="alma-eyebrow">CINE CONSTRUIEȘTE EDU ALMA</p>
    <div class="home-section-heading"><h2>Experiență la catedră, idei puse în practică.</h2></div>
    <p class="alma-about-intro">Suntem un profesor și trei IT-iști. Am pornit de la limba și literatura română și lucrăm împreună pentru a transforma experiența de la clasă în resurse digitale ușor de folosit.</p>
    <div class="home-question">Ne ghidează o idee simplă:<br><strong>Rigoarea lecției poate merge mână în mână cu imaginația.</strong></div>
</section>

<section class="home-values" id="how-to">
    <p class="alma-eyebrow">DE LA RESURSĂ LA EXERSARE</p>
    <div class="home-section-heading"><h2>Cum folosești platforma?</h2></div>
    <div class="home-values-grid">
        <div><span class="alma-icon">${almaIcon('folder')}</span><h3>1. Alege ce ai nevoie</h3><p>Intră în biblioteca pentru elevi sau profesori, din secțiunea de mai sus. Pentru un autor sau o operă anume, folosește „Caută” din bara de navigare.</p></div>
        <div><span class="alma-icon">${almaIcon('book')}</span><h3>2. Lucrează cu materialul</h3><p>Deschide resursa aleasă pentru a o consulta. Dacă un material solicită autentificare, intră în cont pentru a continua.</p></div>
        <div><span class="alma-icon">${almaIcon('game')}</span><h3>3. Verifică ce ai înțeles</h3><p>Alege un quiz din „Jocuri” și autentifică-te pentru a începe aventura. Folosește explicațiile primite după răspuns pentru a reveni la noțiunile care mai cer exercițiu.</p></div>
    </div>
</section>

</div>
`;
