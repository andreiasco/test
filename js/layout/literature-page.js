// Componentă de layout: literature-page.js
const LITERATURE_HTML = `

<div id="pagina-literatura" class="pagina alma-page">


<section id="literatura">
    <a class="alma-back" href="#elevi"> Biblioteca elevului</a>

    <p class="alma-eyebrow">BIBLIOTECA DUPĂ AUTORI</p>
    <h1 class="titlu">
        Autori și operele lor
    </h1>

    <p class="subtitlu">
        Descoperă autorii de poezie, proză și dramă, biografiile și resursele asociate operelor lor.
    </p>

</section>

<section id="poezie">

    <h2 class="book-genre-title">
        <span class="alma-icon">${almaIcon('poetry')}</span>Poezie
    </h2>

    <p class="subtitlu">
        Poezia exprimă sentimente și idei printr-un limbaj artistic.
    </p>

    <div
        class="cards"
        id="poezieCards">
    </div>

</section>


<section id="proza">

    <h2 class="book-genre-title">
        <span class="alma-icon">${almaIcon('prose')}</span>Proză
    </h2>

    <p class="subtitlu">
        Romanul, nuvela, povestirea și basmul sunt forme importante ale prozei.
    </p>

    <div
        class="cards"
        id="prozaCards">
    </div>

</section>


<section id="teatru">

    <h2 class="book-genre-title">
        <span class="alma-icon">${almaIcon('drama')}</span>Dramă
    </h2>

    <p class="subtitlu">
        Textele dramatice sunt construite în jurul personajelor și dialogului.
    </p>

    <div
        class="cards"
        id="teatruCards">
    </div>

</section>

</div>
<div id="pagina-carti" class="pagina alma-page">
    <section id="carti">
        <a class="alma-back" href="#elevi">Biblioteca elevului</a>
        <p class="alma-eyebrow">BIBLIOTECA DUPĂ TITLU</p>
        <h1 class="titlu">Opere literare</h1>
        <p class="subtitlu">Proză, poezie și dramă, cu opere în ordine alfabetică în fiecare categorie. Alege un titlu pentru rezumate, analize și celelalte resurse disponibile.</p>
        <div id="listaCarti" class="book-list"><p>Se încarcă operele...</p></div>
    </section>
</div>
`;
