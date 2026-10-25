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
                    <text x="280" y="826">BANAT</text>
                    <text x="371" y="437">CRIȘANA</text>
                    <text x="693" y="133" font-size="29">MARAMUREȘ</text>
                    <text x="850" y="568">TRANSILVANIA</text>
                    <text x="670" y="1105">OLTENIA</text>
                    <text x="1206" y="1054">MUNTENIA</text>
                    <text x="1728" y="1057" transform="rotate(-78 1728 1057)">DOBROGEA</text>
                    <text x="1411" y="448">MOLDOVA</text>
                    <text x="1090" y="173" font-size="29">BUCOVINA</text>
                </g>
            </svg>
        </div>
            <aside id="hartaPopup" class="harta-popup is-empty" aria-labelledby="hartaPopupTitlu">
                <p class="harta-panel-eyebrow">DESCOPERĂ ROMÂNIA</p>
                <button type="button" class="harta-popup-inchide" aria-label="Închide popup-ul">×</button>
                <h3 id="hartaPopupTitlu">Fiecare regiune are o poveste</h3>
                <div id="hartaPopupLista" aria-live="polite"><p>Selectează o regiune de pe hartă pentru a descoperi autorii și locurile în care <span class='harta-birth-phrase'>s-au născut.</span></p></div>
            </aside>
    </div>

</section>

</div>
`;
