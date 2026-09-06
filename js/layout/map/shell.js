// Structura paginii Hartă, fără traseele SVG.
const MAP_PREFIX_HTML = `

<div id="pagina-harta" class="pagina">

<section id="harta">

    <h2 class="titlu">
        Harta regiunilor istorice 🗺️
    </h2>

    <p class="subtitlu">
        Explorează regiunile istorice ale României și autorii asociați fiecărei zone.
    </p>

    <div class="harta-layout">
        <div class="harta-canvas">
            <svg viewBox="0 0 2000 1400" class="romania-map">

                <g id="romania-regions">

                    `;
const MAP_SUFFIX_HTML = `

                </g>
            </svg>

            <div id="hartaPopup" class="harta-popup ascuns" role="dialog" aria-modal="false" aria-labelledby="hartaPopupTitlu">
                <button type="button" class="harta-popup-inchide" aria-label="Închide popup-ul">×</button>
                <h3 id="hartaPopupTitlu"></h3>
                <div id="hartaPopupLista"></div>
            </div>
        </div>
    </div>

</section>

</div>
`;
