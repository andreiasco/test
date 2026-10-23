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
            <svg viewBox="0 0 2000 1400" class="romania-map" role="group" aria-label="Harta interactivă a regiunilor istorice ale României">

                <g id="romania-regions">

                    `;
const MAP_SUFFIX_HTML = `

                </g>
                <g class="map-region-labels-svg" aria-hidden="true">
                    <text x="320" y="798">BANAT</text>
                    <text x="400" y="462">CRIȘANA</text>
                    <text x="700" y="154" font-size="29">MARAMUREȘ</text>
                    <text x="860" y="588">TRANSILVANIA</text>
                    <text x="640" y="1106">OLTENIA</text>
                    <text x="1220" y="1064">MUNTENIA</text>
                    <text x="1700" y="1036" transform="rotate(-78 1700 1036)">DOBROGEA</text>
                    <text x="1440" y="476">MOLDOVA</text>
                    <text x="1100" y="210" font-size="29">BUCOVINA</text>
                </g>
            </svg>
        </div>
            <aside id="hartaPopup" class="harta-popup is-empty" aria-labelledby="hartaPopupTitlu">
                <p class="harta-panel-eyebrow">DESCOPERĂ ROMÂNIA</p>
                <button type="button" class="harta-popup-inchide" aria-label="Închide popup-ul">×</button>
                <h3 id="hartaPopupTitlu">Fiecare regiune are o poveste</h3>
                <div id="hartaPopupLista" aria-live="polite"><p>Selectează o regiune de pe hartă pentru a descoperi autorii și locurile în care s-au născut.</p></div>
            </aside>
    </div>

</section>

</div>
`;
