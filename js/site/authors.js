function randareResurseOpera(opera) {
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

                    return "";

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

                            📄 Descarcă rezumatul Word

                        </button>

                    `;

                }

                if (areLinkFilm) {
                    butoane += `
                        <a class="opera-link" href="${escapeHTML(opera.link_film)}" target="_blank" rel="noopener noreferrer">🎬 Film (filă nouă)</a>
                    `;
                }

                if (areLinkAudiobook) {
                    butoane += `
                        <a class="opera-link" href="${escapeHTML(opera.link_audiobook)}" target="_blank" rel="noopener noreferrer">🎧 Audiobook (filă nouă)</a>
                    `;
                }

                if (areLinkTestLectura) {
                    butoane += `
                        <a class="opera-link" href="${escapeHTML(opera.link_test_lectura)}" target="_blank" rel="noopener noreferrer">📝 Test de lectură (filă nouă)</a>
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


                return `

                    <details class="opera">

                        <summary class="opera-titlu">
                            📖 ${escapeHTML(opera.titlu)}
                        </summary>

                        <div class="opera-resurse">

                            ${personajeInstagramHTML}

                            ${butoane}

                        </div>

                    </details>

                `;

}

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

            stareBibliotecaCarti("Nu am putut încărca autorii.");
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

            stareBibliotecaCarti("Nu am putut încărca operele.");
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
        randareBibliotecaCarti(autori || [], opere || []);

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

                const html = randareResurseOpera(opera);
                if (html) opereHTML.push(html);

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
        stareBibliotecaCarti("Nu am putut încărca biblioteca de cărți.");

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


function stareBibliotecaCarti(message) {
    const list = document.getElementById('listaCarti');
    if (list) list.textContent = message;
}

function deschideCarteaDinRuta() {
    const hash = window.location.hash.slice(1);
    if (!hash.startsWith('carte-')) return;
    const card = document.getElementById(hash);
    if (!card) return;
    const resources = card.querySelector('details.opera');
    if (resources) resources.open = true;
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    card.focus({ preventScroll: true });
}

function randareBibliotecaCarti(autori, opere) {
    const list = document.getElementById('listaCarti');
    if (!list) return;
    const authors = new Map(autori.map(autor => [String(autor.id), autor]));
    const sorted = [...opere].sort((a, b) => String(a.titlu || '').localeCompare(String(b.titlu || ''), 'ro', { sensitivity: 'base' }) || String(a.id).localeCompare(String(b.id)));
    const groups = new Map();
    sorted.forEach(opera => {
        const category = String(authors.get(String(opera.autor_id))?.categorie || '').trim().toLowerCase();
        const key = ['proza', 'poezie', 'teatru'].includes(category) ? category : 'alte';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(opera);
    });
    const labels = { proza: 'Proză', poezie: 'Poezie', teatru: 'Dramă', alte: 'Alte opere' };
    const icons = { proza: 'prose', poezie: 'poetry', teatru: 'drama', alte: 'book' };
    list.innerHTML = Object.entries(labels).filter(([key]) => groups.has(key)).map(([key, label]) => {
        const cards = groups.get(key).map(opera => {
        const autor = authors.get(String(opera.autor_id));
        const resources = randareResurseOpera(opera);
        const id = 'carte-' + encodeURIComponent(String(opera.id));
        return `<article class="alma-feature-panel book-card" id="${escapeHTML(id)}" tabindex="-1">
            <h3>${escapeHTML(opera.titlu)}</h3>
            <p class="book-author">${escapeHTML(autor?.nume || 'Autor neprecizat')}</p>
            ${resources || '<p>Nu sunt încă disponibile resurse pentru această operă.</p>'}
            ${autor ? `<details class="book-author-info"><summary>Despre autor</summary>${autor.poza ? `<img src="${escapeHTML(autor.poza)}" alt="${escapeHTML(autor.nume)}" loading="lazy">` : ''}<p>${escapeHTML(autor.descriere || 'Nu există încă o descriere pentru acest autor.')}</p></details>` : ''}
        </article>`;
        }).join('');
        return `<div class="book-genre" role="region" aria-labelledby="carti-gen-${key}"><h2 id="carti-gen-${key}" class="book-genre-title"><span class="alma-icon">${almaIcon(icons[key])}</span>${label}</h2><div class="book-list">${cards}</div></div>`;
    }).join('') || '<p>Momentan nu există cărți disponibile.</p>';
    deschideCarteaDinRuta();
}
