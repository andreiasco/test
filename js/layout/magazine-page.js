// Componentă de layout: magazine-page.js
const MAGAZINE_HTML = `

<div id="pagina-revista" class="pagina">

<section id="revista">

    <p class="alma-eyebrow">IDEILE MERITĂ ÎMPĂRTĂȘITE</p><h2 class="titlu">Reviste digitale</h2>

    <p class="subtitlu">
        Consultă revista profesorilor și informațiile despre contribuții. Descoperă și creațiile originale ale elevilor.
    </p>

    <div class="alma-category-list alma-magazine-menu">
        ${almaCategory('revista-elevilor', 'Revista elevilor', 'Poezii, proză, compuneri, recenzii și desene.', 'book', [['Creații originale', 'Poezii, proză, compuneri, recenzii și desene.', '#creatii-elevi']])}
        ${almaCategory('revista-profesorilor', 'Revista profesorilor', 'Articole, cercetări și bune practici.', 'magazine', [['Numere publicate', 'Consultă arhiva revistei profesorilor.', '#numere-publicate'], ['Trimiterea unui material', 'Profesorii autentificați pot trimite PDF sau DOCX din Cont → Profilul meu, pentru revizuire.', null, 'Din profil'], ['Adeverințe de publicare', 'Informații despre adeverințe și stadiul funcției de emitere.', '#informatii-adeverinte'], ['Regulament editorial', 'Cum funcționează trimiterea, verificarea și publicarea contribuțiilor.', '#reguli-publicare']] )}
    </div>

</section>

</div>

<div id="pagina-numere-publicate" class="pagina">
<section id="numere-publicate">
    <a class="alma-text-link" href="#revista">← Înapoi la Reviste digitale</a>
    <p class="alma-eyebrow">REVISTA PROFESORILOR</p>
    <h2 class="titlu">Numere publicate</h2>
    <p class="subtitlu">Consultă și citește numerele publicate ale revistei profesorilor.</p>
    <div id="listaNumereRevistaSite" class="revista-lista">
        <p>Se încarcă...</p>
    </div>

</section>

</div>

</main>
`;
