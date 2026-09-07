// Componentă de layout: literature-page.js
const LITERATURE_HTML = `

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
`;
