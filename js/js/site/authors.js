// ======================================================
// ÎNCARCĂ AUTORII PE SITE
// ======================================================

async function incarcaAutori() {

    const containere = {
        poezie: document.getElementById("poezieCards"),
        proza: document.getElementById("prozaCards"),
        teatru: document.getElementById("teatruCards")
    };


    if (!containere.poezie || !containere.proza || !containere.teatru) {
        return;
    }


    Object.values(containere).forEach(container => {
        container.innerHTML =
            "<p style='text-align:center'>Se încarcă autorii...</p>";
    });


    try {

        const {
            data: autori,
            error: eroareAutori
        } =
            await supabaseClient
                .from("autori")
                .select("*")
                .order("nume", {
                    ascending: true
                });


        if (eroareAutori) {

            console.error(
                eroareAutori
            );

            Object.values(containere).forEach(container => {
                container.innerHTML =
                    "<p style='color:#c62828;text-align:center'>" +
                    "Nu am putut încărca autorii." +
                    "</p>";
            });

            return;
        }


        const {
            data: opere,
            error: eroareOpere
        } =
            await supabaseClient
                .from("opere")
                .select("*")
                .order("titlu", {
                    ascending: true
                });


        if (eroareOpere) {

            console.error(
                eroareOpere
            );

            Object.values(containere).forEach(container => {
                container.innerHTML =
                    "<p style='color:#c62828;text-align:center'>" +
                    "Nu am putut încărca operele." +
                    "</p>";
            });

            return;
        }

        pregatesteDateCautare(
            autori,
            opere
        );

        initializeazaHarta(autori);

        const carduri = {
            poezie: [],
            proza: [],
            teatru: []
        };


        for (
            const autor of autori || []
        ) {

            const opereAutor =
                (opere || []).filter(
                    opera =>
                        String(opera.autor_id) ===
                        String(autor.id)
                );


            const opereHTML = [];


            for (
                const opera of opereAutor
            ) {

                const areRezumat =
                    !!opera.pdf;

                const areAnalizaLiterara =
                    !!opera.pdf_analiza_literara;

                const areValori =
                    !!opera.pdf_valori_morale;

                const areCaracterizare =
                    !!opera.pdf_caracterizare;

                const areRezumatWord =
                    !!opera.rezumat_word;

                const areLinkFilm =
                    !!opera.link_film;

                const areLinkAudiobook =
                    !!opera.link_audiobook;

                const areLinkTestLectura =
                    !!opera.link_test_lectura;

                const areImaginePersonaje =
                    !!opera.personaje_instagram;

                const esteDocumentInstagram =
                    /\.pdf(?:$|[?#])/i.test(opera.personaje_instagram || "");


                if (
                    !areRezumat &&
                    !areAnalizaLiterara &&
                    !areValori &&
                    !areCaracterizare &&
                    !areRezumatWord &&
                    !areLinkFilm &&
                    !areLinkAudiobook &&
                    !areLinkTestLectura &&
                    !areImaginePersonaje
                ) {

                    continue;

                }


                let butoane = "";


                if (areRezumat) {

                    butoane += `

                        <button
                            class="opera-btn"
                            type="button"
                            onclick='deschidePDF(${JSON.stringify(opera.pdf)})'>

                            📕 Rezumat

                        </button>

                    `;

                }

                if (areAnalizaLiterara) {

                    butoane += `

                        <button
                            class="opera-btn"
                            type="button"
                            onclick='deschidePDF(${JSON.stringify(opera.pdf_analiza_literara)})'>

                            📚 Analiză literară

                        </button>

                    `;

                }


                if (areValori) {

                    butoane += `

                        <button
                            class="opera-btn"
                            type="button"
                            onclick='deschidePDF(${JSON.stringify(opera.pdf_valori_morale)})'>

                            ❤️ Valori morale

                        </button>

                    `;

                }


                if (areCaracterizare) {

                    butoane += `

                        <button
                            class="opera-btn"
                            type="button"
                            onclick='deschidePDF(${JSON.stringify(opera.pdf_caracterizare)})'>

                            👤 Personaje și semnificații

                        </button>

                    `;

                }

                if (areRezumatWord) {

                    butoane += `

                        <button
                            class="opera-btn"
                            type="button"
                            onclick='descarcaRezumatWord(${JSON.stringify(opera.rezumat_word)})'>

                            📄 Descarcă rezumatul scris

                        </button>

                    `;

                }

                if (areLinkFilm) {
                    butoane += `
                        <a class="opera-link" href="${escapeHTML(opera.link_film)}" target="_blank" rel="noopener noreferrer">🎬 Film</a>
                    `;
                }

                if (areLinkAudiobook) {
                    butoane += `
                        <a class="opera-link" href="${escapeHTML(opera.link_audiobook)}" target="_blank" rel="noopener noreferrer">🎧 Audiobook</a>
                    `;
                }

                if (areLinkTestLectura) {
                    butoane += `
                        <a class="opera-link" href="${escapeHTML(opera.link_test_lectura)}" target="_blank" rel="noopener noreferrer">📝 Test de lectură</a>
                    `;
                }

                const personajeInstagramHTML = areImaginePersonaje &&
                    !esteDocumentInstagram
                    ? `
                        <div class="personaje-instagram">
                            <img src="${escapeHTML(opera.personaje_instagram)}" alt="Personajele din ${escapeHTML(opera.titlu)}" loading="lazy">
                        </div>
                    `
                    : "";

                if (esteDocumentInstagram) {
                    butoane += `

                        <button
                            class="opera-btn personaje-instagram-btn"
                            type="button"
                            onclick='deschidePDF(${JSON.stringify(opera.personaje_instagram)})'>

                            📷 Instagramul personajelor

                        </button>

                    `;
                }


                opereHTML.push(`

                    <details class="opera">

                        <summary class="opera-titlu">
                            📖 ${escapeHTML(opera.titlu)}
                        </summary>

                        <div class="opera-resurse">

                            ${personajeInstagramHTML}

                            ${butoane}

                        </div>

                    </details>

                `);

            }


            if (
                opereHTML.length === 0
            ) {

                continue;

            }


            const pozaHTML =
                autor.poza
                    ? `

                    <img
                        src="${escapeHTML(autor.poza)}"
                        alt="${escapeHTML(autor.nume)}"
                        loading="lazy"
                        onerror="this.style.display='none';">

                    `
                    : "";


            const categorie =
                String(autor.categorie || "")
                    .trim()
                    .toLowerCase();

            if (!carduri[categorie]) {
                continue;
            }


            carduri[categorie].push(`

                <div class="card autor" id="autor-${autor.id}" onclick="deschideAutorPopup(event, this)">

                    <div class="portret">

                        ${pozaHTML}

                    </div>

                    <div class="autor-descriere">

                        <h3 class="autor-nume">
                            ${escapeHTML(autor.nume)}
                        </h3>

                        <p>
                            ${escapeHTML(autor.descriere || "Nu există încă o descriere pentru acest autor.")}
                        </p>

                    </div>

                    <div class="opera-list">

                        ${opereHTML.join("")}

                    </div>

                </div>

            `);

        }


        Object.entries(containere).forEach(([categorie, container]) => {
            container.innerHTML =
                carduri[categorie].length > 0
                    ? carduri[categorie].join("")
                    : "<p style='text-align:center'>" +
                    "Momentan nu există materiale disponibile." +
                    "</p>";
        });


    } catch (error) {

        console.error(
            "Eroare încărcare autori:",
            error
        );

        Object.values(containere).forEach(container => {
            container.innerHTML =
                "<p style='color:#c62828;text-align:center'>" +
                "A apărut o eroare." +
                "</p>";
        });

    }
}

