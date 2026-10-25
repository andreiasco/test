// Componentă de layout: magazine-page.js
const MAGAZINE_HTML = `

<div id="pagina-revista" class="pagina">

<section id="revista">

    <p class="alma-eyebrow">IDEILE MERITĂ ÎMPĂRTĂȘITE</p><h2 class="titlu">Reviste digitale</h2>

    <p class="subtitlu">
        Numerele publicate ale revistei școlii.
    </p>

    <div class="alma-category-list alma-magazine-menu">
        ${almaCategory('revista-elevilor', 'Revista elevilor', 'Poezii, proză, compuneri, recenzii și desene.', 'book', [['Creații originale', 'O publicație dedicată elevilor este în pregătire.']])}
        ${almaCategory('revista-profesorilor', 'Revista profesorilor', 'Articole, cercetări și bune practici.', 'magazine', [['Numere publicate', 'Consultă arhiva revistei disponibilă mai jos.', '#numere-publicate'], ['Trimite spre publicare', 'Profesorii autentificați pot trimite PDF sau DOCX din Cont → Profilul meu, pentru revizuire.'], ['Adeverințe de publicare', 'Emiterea automată a adeverințelor nu este încă disponibilă.'], ['Arhivă și regulament', 'Arhiva publicată este disponibilă mai jos. Regulamentul editorial va fi adăugat.']] )}
    </div>
    <h3 id="numere-publicate" class="alma-archive-title">Numere publicate</h3>
    <div id="listaNumereRevistaSite" class="revista-lista">
        <p>Se încarcă...</p>
    </div>

</section>

</div>

</main>
`;
