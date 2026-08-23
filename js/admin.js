// ADAUGĂ AUTOR + IMAGINE
// ======================================================

async function adaugaAutor() {

    const initiale =
        document
            .getElementById("autorInitiale")
            .value
            .trim();


    const nume =
        document
            .getElementById("autorNume")
            .value
            .trim();


    const categorie =
        document
            .getElementById("autorCategorie")
            .value;


    const pozaInput =
        document.getElementById(
            "autorPoza"
        );


    const poza =
        pozaInput.files[0];


    const descriere =
        document
            .getElementById("autorDescriere")
            .value
            .trim();


    const status =
        document.getElementById(
            "autorStatus"
        );


    if (!initiale || !nume) {

        status.textContent =
            "Completează inițialele și numele autorului.";

        status.style.color =
            "#c62828";

        return;

    }


    if (!categorie) {

        status.textContent =
            "Selectează genul literar al autorului.";

        status.style.color =
            "#c62828";

        return;

    }


    if (!poza) {

        status.textContent =
            "Selectează imaginea autorului.";

        status.style.color =
            "#c62828";

        return;

    }


    if (
        !poza.type.startsWith(
            "image/"
        )
    ) {

        status.textContent =
            "Fișierul selectat nu este o imagine.";

        status.style.color =
            "#c62828";

        return;

    }


    const user =
        await utilizatorAutentificat();


    if (!user) {

        status.textContent =
            "Trebuie să fii autentificat.";

        status.style.color =
            "#c62828";

        return;

    }


    try {

        status.textContent =
            "Se încarcă imaginea...";

        status.style.color =
            "#7b2450";


        const extensie =
            poza.name
                .split(".")
                .pop()
                .toLowerCase();


        const numeCurat =
            nume
                .normalize("NFD")
                .replace(
                    /[\u0300-\u036f]/g,
                    ""
                )
                .replace(
                    /[^a-zA-Z0-9]/g,
                    "_"
                )
                .toLowerCase();


        const caleImagine =
            `autori/${Date.now()}_${numeCurat}.${extensie}`;


        const {
            error: uploadError
        } =
            await supabaseClient
                .storage
                .from(IMAGINI_BUCKET)
                .upload(
                    caleImagine,
                    poza,
                    {
                        contentType:
                            poza.type,

                        upsert:
                            false
                    }
                );


        if (uploadError) {

            throw uploadError;

        }


        const {
            data: publicUrlData
        } =
            supabaseClient
                .storage
                .from(IMAGINI_BUCKET)
                .getPublicUrl(
                    caleImagine
                );


        const urlImagine =
            publicUrlData.publicUrl;


        status.textContent =
            "Se salvează autorul...";


        const {
            error: autorError
        } =
            await supabaseClient
                .from("autori")
                .insert([
                    {
                        initiale:
                            initiale,

                        nume:
                            nume,

                        categorie:
                            categorie,

                        poza:
                            urlImagine,

                        descriere:
                            descriere
                    }
                ]);


        if (autorError) {

            await supabaseClient
                .storage
                .from(IMAGINI_BUCKET)
                .remove([
                    caleImagine
                ]);


            throw autorError;

        }


        status.textContent =
            "Autorul a fost adăugat cu succes!";

        status.style.color =
            "#2e7d32";


        document
            .getElementById(
                "autorInitiale"
            )
            .value = "";


        document
            .getElementById(
                "autorNume"
            )
            .value = "";


        document
            .getElementById(
                "autorCategorie"
            )
            .value = "";


        document
            .getElementById(
                "autorPoza"
            )
            .value = "";


        document
            .getElementById(
                "autorDescriere"
            )
            .value = "";


        await incarcaAutoriAdmin();
        await incarcaListaAutoriSelect();
        await incarcaAutori();


    } catch (error) {

        console.error(
            "Eroare adăugare autor:",
            error
        );

        status.textContent =
            "A apărut o eroare: " +
            error.message;

        status.style.color =
            "#c62828";

    }
}


// ======================================================
// ÎNCARCĂ AUTORII ÎN SELECT
// ======================================================

async function incarcaListaAutoriSelect() {

    const select =
        document.getElementById(
            "operaAutor"
        );


    if (!select) {
        return;
    }


    const {
        data: autori,
        error
    } =
        await supabaseClient
            .from("autori")
            .select(
                "id, initiale, nume"
            )
            .order(
                "nume",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            error
        );

        return;

    }


    select.innerHTML = `

        <option value="">
            Selectează autorul
        </option>

    `;


    (autori || []).forEach(
        autor => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                autor.id;


            option.textContent =
                `${autor.initiale || ""} - ${autor.nume || ""}`;


            select.appendChild(
                option
            );

        }
    );

}


// ======================================================
// ADAUGĂ OPERĂ
// ======================================================

async function adaugaOpera() {

    const autorId =
        document
            .getElementById("operaAutor")
            .value;


    const titlu =
        document
            .getElementById("operaTitlu")
            .value
            .trim();


    const rezumat =
        document
            .getElementById("operaRezumat")
            .files[0];

    const analizaLiterara =
        document
            .getElementById("operaAnalizaLiterara")
            .files[0];


    const valoriMorale =
        document
            .getElementById("operaValoriMorale")
            .files[0];


    const caracterizare =
        document
            .getElementById("operaCaracterizare")
            .files[0];

    const rezumatWord =
        document
            .getElementById("operaRezumatWord")
            .files[0];

    const linkFilm =
        document
            .getElementById("operaLinkFilm")
            .value
            .trim();

    const linkAudiobook =
        document
            .getElementById("operaLinkAudiobook")
            .value
            .trim();

    const linkTestLectura =
        document
            .getElementById("operaLinkTestLectura")
            .value
            .trim();

    const personajeInstagram =
        document
            .getElementById("operaPersonajeInstagram")
            .files[0];


    const status =
        document.getElementById(
            "operaStatus"
        );


    if (!autorId) {

        status.textContent =
            "Selectează autorul.";

        status.style.color =
            "#c62828";

        return;

    }


    if (!titlu) {

        status.textContent =
            "Introdu titlul operei.";

        status.style.color =
            "#c62828";

        return;

    }


    const areResursa = [
        rezumat,
        analizaLiterara,
        valoriMorale,
        caracterizare,
        rezumatWord,
        linkFilm,
        linkAudiobook,
        linkTestLectura,
        personajeInstagram
    ].some(Boolean);

    if (!areResursa) {

        status.textContent =
            "Adaugă cel puțin o resursă pentru operă.";

        status.style.color =
            "#c62828";

        return;

    }

    const linkuriExterne = [
        linkFilm,
        linkAudiobook,
        linkTestLectura
    ];

    if (linkuriExterne.some(link => link && !/^https?:\/\//i.test(link))) {
        status.textContent =
            "Linkurile trebuie să înceapă cu http:// sau https://.";

        status.style.color =
            "#c62828";

        return;
    }


    const user =
        await utilizatorAutentificat();


    if (!user) {

        status.textContent =
            "Trebuie să fii autentificat.";

        status.style.color =
            "#c62828";

        return;

    }


    const fisiereIncarcate = [];
    const imaginiIncarcate = [];


    try {

        async function incarcaFisier(
            fisier,
            prefix
        ) {

            if (!fisier) {

                return null;

            }


            if (
                fisier.type !==
                "application/pdf" &&
                !fisier.name
                    .toLowerCase()
                    .endsWith(".pdf")
            ) {

                throw new Error(
                    `"${fisier.name}" nu este PDF.`
                );

            }


            const numeCurat =
                fisier.name
                    .normalize("NFD")
                    .replace(
                        /[\u0300-\u036f]/g,
                        ""
                    )
                    .replace(
                        /[^a-zA-Z0-9._-]/g,
                        "_"
                    );


            const cale =
                `${autorId}/${Date.now()}_${prefix}_${numeCurat}`;


            const {
                error
            } =
                await supabaseClient
                    .storage
                    .from(BUCKET)
                    .upload(
                        cale,
                        fisier,
                        {
                            contentType:
                                "application/pdf",

                            upsert:
                                false
                        }
                    );


            if (error) {

                throw error;

            }


            fisiereIncarcate.push(
                cale
            );


            return cale;

        }


        status.textContent =
            "Se încarcă PDF-urile...";

        status.style.color =
            "#7b2450";


        const caleRezumat =
            await incarcaFisier(
                rezumat,
                "rezumat"
            );

        const caleAnalizaLiterara =
            await incarcaFisier(
                analizaLiterara,
                "analiza_literara"
            );


        const caleValori =
            await incarcaFisier(
                valoriMorale,
                "valori_morale"
            );


        const caleCaracterizare =
            await incarcaFisier(
                caracterizare,
                "caracterizare"
            );

        let caleRezumatWord = null;

        if (rezumatWord) {

            if (
                !/\.(doc|docx|pdf)$/i.test(rezumatWord.name)
            ) {
                throw new Error("Rezumatul scris trebuie să fie .doc, .docx sau .pdf.");
            }

            const numeRezumat =
                rezumatWord.name
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-zA-Z0-9._-]/g, "_");

            caleRezumatWord =
                `${autorId}/${Date.now()}_rezumat_scris_${numeRezumat}`;

            const { error: wordError } =
                await supabaseClient
                    .storage
                    .from(BUCKET)
                    .upload(
                        caleRezumatWord,
                        rezumatWord,
                        {
                            contentType:
                                rezumatWord.name.toLowerCase().endsWith(".pdf")
                                    ? "application/pdf"
                                    : rezumatWord.type ||
                                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                            upsert: false
                        }
                    );

            if (wordError) {
                throw wordError;
            }

            fisiereIncarcate.push(caleRezumatWord);
        }

        let documentPersonajeUrl = null;

        if (personajeInstagram) {

            if (
                personajeInstagram.type !== "application/pdf" &&
                !/\.pdf$/i.test(personajeInstagram.name)
            ) {
                throw new Error("Documentul personajelor trebuie să fie PDF.");
            }

            const numeDocument = personajeInstagram.name
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-zA-Z0-9._-]/g, "_");

            const caleDocumentPersonaje =
                `${autorId}/${Date.now()}_personaje_instagram_${numeDocument}`;

            const { error: documentError } =
                await supabaseClient
                    .storage
                    .from(BUCKET)
                    .upload(
                        caleDocumentPersonaje,
                        personajeInstagram,
                        {
                            contentType: "application/pdf",
                            upsert: false
                        }
                    );

            if (documentError) {
                throw documentError;
            }

            fisiereIncarcate.push(caleDocumentPersonaje);
            documentPersonajeUrl =
                `storage://${BUCKET}/${caleDocumentPersonaje}`;
        }


        // Salvăm URL-uri interne compatibile cu
        // deschiderea prin URL semnat.
        const pdf =
            caleRezumat
                ? `storage://${BUCKET}/${caleRezumat}`
                : null;


        const pdfValoriMorale =
            caleValori
                ? `storage://${BUCKET}/${caleValori}`
                : null;

        const pdfAnalizaLiterara =
            caleAnalizaLiterara
                ? `storage://${BUCKET}/${caleAnalizaLiterara}`
                : null;


        const pdfCaracterizare =
            caleCaracterizare
                ? `storage://${BUCKET}/${caleCaracterizare}`
                : null;


        const {
            error
        } =
            await supabaseClient
                .from("opere")
                .insert([
                    {
                        autor_id:
                            Number(autorId),

                        titlu:
                            titlu,

                        pdf:
                            pdf,

                        pdf_analiza_literara:
                            pdfAnalizaLiterara,

                        pdf_valori_morale:
                            pdfValoriMorale,

                        pdf_caracterizare:
                            pdfCaracterizare,

                        rezumat_word:
                            caleRezumatWord
                                ? `storage://${BUCKET}/${caleRezumatWord}`
                                : null,

                        link_film:
                            linkFilm || null,

                        link_audiobook:
                            linkAudiobook || null,

                        link_test_lectura:
                            linkTestLectura || null,

                        personaje_instagram:
                            documentPersonajeUrl
                    }
                ]);


        if (error) {

            throw error;

        }


        status.textContent =
            "Opera a fost adăugată cu succes!";

        status.style.color =
            "#2e7d32";


        golesteCampuri(
            "operaAutor",
            "operaTitlu",
            "operaRezumat",
            "operaAnalizaLiterara",
            "operaValoriMorale",
            "operaCaracterizare",
            "operaRezumatWord",
            "operaLinkFilm",
            "operaLinkAudiobook",
            "operaLinkTestLectura",
            "operaPersonajeInstagram"
        );


        await incarcaOpereAdmin();
        await incarcaListaPDF();
        await incarcaAutori();


    } catch (error) {

        console.error(
            "Eroare adăugare operă:",
            error
        );


        if (
            fisiereIncarcate.length > 0
        ) {

            await supabaseClient
                .storage
                .from(BUCKET)
                .remove(
                    fisiereIncarcate
                );

        }

        if (imaginiIncarcate.length > 0) {

            await supabaseClient
                .storage
                .from(IMAGINI_BUCKET)
                .remove(imaginiIncarcate);

        }


        status.textContent =
            "A apărut o eroare: " +
            error.message;

        status.style.color =
            "#c62828";

    }
}


// ======================================================
// CONVERTEȘTE REFERINȚA PDF ÎN CALE STORAGE
// ======================================================

function obtineCalePDF(valoare) {

    if (!valoare) {

        return null;

    }


    // ==================================================
    // FORMATUL FOLOSIT LA ÎNCĂRCARE
    //
    // storage://Pdf/123/fisier.pdf
    // ==================================================

    const prefix =
        `storage://${BUCKET}/`;


    if (
        valoare.startsWith(prefix)
    ) {

        return decodeURIComponent(
            valoare.substring(
                prefix.length
            )
        );

    }


    // ==================================================
    // DACĂ ÎN BAZA DE DATE EXISTĂ UN URL SUPABASE
    // ==================================================

    if (
        valoare.includes(
            "/storage/v1/object/"
        )
    ) {

        return obtineCaleStorage(
            valoare
        );

    }


    // ==================================================
    // DACĂ VALOAREA ESTE DEJA O CALE STORAGE
    //
    // ex:
    // 123/rezumat_document.pdf
    // ==================================================

    if (
        !valoare.startsWith("http://") &&
        !valoare.startsWith("https://")
    ) {

        return valoare;

    }


    return null;

}


// ======================================================
// LISTĂ AUTORI ADMIN
// ======================================================

async function incarcaAutoriAdmin() {

    const container =
        document.getElementById(
            "listaAutoriAdmin"
        );


    if (!container) {
        return;
    }


    const {
        data: autori,
        error
    } = await supabaseClient
        .from("autori")
        .select("*")
        .order("nume", {
            ascending: true
        });

    if (error) {

        container.innerHTML =
            `<p style="color:#c62828">
                ${escapeHTML(error.message)}
            </p>`;

        return;

    }


    if (
        !autori ||
        autori.length === 0
    ) {

        container.innerHTML =
            "<p>Nu există autori.</p>";

        return;

    }


    container.innerHTML =
        autori.map(
            autor => `

                <div class="admin-autor">

                    <strong>
                        ${escapeHTML(
                autor.initiale
            )}
                        -
                        ${escapeHTML(
                autor.nume
            )}
                    </strong>

                    <p>
                        Gen literar:
                        <b>${escapeHTML(
                autor.categorie || "Neclasificat"
            )}</b>
                    </p>

                    <p>
                        ${escapeHTML(
                autor.descriere
            )}
                    </p>

                    <label>
                        Descriere autor:
                    </label>

                    <textarea
                        id="autorDescriereEdit-${autor.id}"
                        rows="4">${escapeHTML(
                autor.descriere
            )}</textarea>

                    <button
                        class="admin-btn"
                        type="button"
                        onclick="actualizeazaDescriereAutor(${autor.id})">

                        💾 Salvează descrierea

                    </button>

                    <div
                        id="autorStatus-${autor.id}"
                        class="admin-status">
                    </div>

                    <small>
                        ID: ${autor.id}
                    </small>

                </div>

            `
        ).join("");

}


// ======================================================
// ACTUALIZEAZĂ DESCRIEREA AUTORULUI
// ======================================================

async function actualizeazaDescriereAutor(autorId) {

    const descriereInput =
        document.getElementById(
            `autorDescriereEdit-${autorId}`
        );

    const status =
        document.getElementById(
            `autorStatus-${autorId}`
        );


    if (!descriereInput || !status) {
        return;
    }


    const user =
        await utilizatorAutentificat();


    if (!user) {

        status.textContent =
            "Trebuie să fii autentificat ca administrator.";

        status.style.color =
            "#c62828";

        return;

    }


    status.textContent =
        "Se salvează descrierea...";

    status.style.color =
        "#7b2450";


    try {

        const {
            error
        } =
            await supabaseClient
                .from("autori")
                .update({
                    descriere:
                        descriereInput.value.trim()
                })
                .eq(
                    "id",
                    autorId
                );


        if (error) {
            throw error;
        }


        status.textContent =
            "Descrierea a fost actualizată.";

        status.style.color =
            "#2e7d32";


        await incarcaAutori();

    } catch (error) {

        console.error(
            "Eroare actualizare descriere autor:",
            error
        );

        status.textContent =
            "Nu am putut actualiza descrierea: " +
            error.message;

        status.style.color =
            "#c62828";

    }
}


// ======================================================
// LISTĂ OPERE ADMIN
// ======================================================

async function incarcaOpereAdmin() {

    const container =
        document.getElementById("listaOpereAdmin");

    if (!container) {
        return;
    }

    try {

        const {
            data: opere,
            error: eroareOpere
        } = await supabaseClient
            .from("opere")
            .select("*")
            .order("titlu", {
                ascending: true
            });

        if (eroareOpere) {
            throw eroareOpere;
        }

        const {
            data: autori,
            error: eroareAutori
        } = await supabaseClient
            .from("autori")
            .select("id, initiale, nume");

        if (eroareAutori) {
            throw eroareAutori;
        }

        if (!opere || opere.length === 0) {

            container.innerHTML =
                "<p>Nu există opere.</p>";

            return;
        }

        container.innerHTML =
            opere.map(opera => {

                const autor =
                    (autori || []).find(
                        a =>
                            String(a.id) ===
                            String(opera.autor_id)
                    );

                return `

                    <div class="admin-opera">

                        <strong>
                            📖 ${escapeHTML(opera.titlu)}
                        </strong>

                        <p>
                            Autor:
                            <b>
                                ${escapeHTML(
                    autor
                        ? autor.nume
                        : "Necunoscut"
                )}
                            </b>
                        </p>


                        <!-- =========================
                             REZUMAT
                        ========================== -->

                        <p>
                            Rezumat:
                            ${opera.pdf
                        ? "✔ Există"
                        : "✖ Lipsește"
                    }
                        </p>

                        <input
                            type="file"
                            id="pdfRezumat-${opera.id}"
                            accept="application/pdf">

                        <button
                            class="admin-btn"
                            type="button"
                            onclick="inlocuiestePDF(
                                ${opera.id},
                                'pdf',
                                'pdfRezumat-${opera.id}'
                            )">

                            📕 Înlocuiește rezumatul

                        </button>

                        <p>
                            Analiză literară:
                            ${opera.pdf_analiza_literara
                        ? "✔ Există"
                        : "✖ Lipsește"
                    }
                        </p>

                        <input
                            type="file"
                            id="pdfAnalizaLiterara-${opera.id}"
                            accept="application/pdf">

                        <button
                            class="admin-btn"
                            type="button"
                            onclick="inlocuiestePDF(
                                ${opera.id},
                                'pdf_analiza_literara',
                                'pdfAnalizaLiterara-${opera.id}'
                            )">

                            📚 Înlocuiește analiza literară

                        </button>


                        <!-- =========================
                             VALORI MORALE
                        ========================== -->

                        <p>
                            Valori morale:
                            ${opera.pdf_valori_morale
                        ? "✔ Există"
                        : "✖ Lipsește"
                    }
                        </p>

                        <input
                            type="file"
                            id="pdfValori-${opera.id}"
                            accept="application/pdf">

                        <button
                            class="admin-btn"
                            type="button"
                            onclick="inlocuiestePDF(
                                ${opera.id},
                                'pdf_valori_morale',
                                'pdfValori-${opera.id}'
                            )">

                            ❤️ Înlocuiește valorile morale

                        </button>


                        <!-- =========================
                             CARACTERIZARE
                        ========================== -->

                        <p>
                            Caracterizare:
                            ${opera.pdf_caracterizare
                        ? "✔ Există"
                        : "✖ Lipsește"
                    }
                        </p>

                        <input
                            type="file"
                            id="pdfCaracterizare-${opera.id}"
                            accept="application/pdf">

                        <button
                            class="admin-btn"
                            type="button"
                            onclick="inlocuiestePDF(
                                ${opera.id},
                                'pdf_caracterizare',
                                'pdfCaracterizare-${opera.id}'
                            )">

                            👤 Înlocuiește caracterizarea

                        </button>

                        <p>
                            Rezumat scris:
                            ${opera.rezumat_word
                        ? "✔ Există"
                        : "✖ Lipsește"
                    }
                        </p>

                        <input
                            type="file"
                            id="rezumatWord-${opera.id}"
                            accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf">

                        <button
                            class="admin-btn"
                            type="button"
                            onclick="inlocuiesteFisierOpera(
                                ${opera.id},
                                'rezumat_word',
                                'rezumatWord-${opera.id}',
                                'Pdf',
                                'word'
                            )">

                            📄 Înlocuiește rezumatul scris

                        </button>

                        <p>
                            Film:
                            ${opera.link_film ? "✔ Există" : "✖ Lipsește"}
                        </p>

                        <input
                            type="url"
                            id="linkFilm-${opera.id}"
                            placeholder="https://...">

                        <button
                            class="admin-btn"
                            type="button"
                            onclick="inlocuiesteLinkOpera(${opera.id}, 'link_film', 'linkFilm-${opera.id}')">

                            🎬 Înlocuiește linkul filmului

                        </button>

                        <p>
                            Audiobook:
                            ${opera.link_audiobook ? "✔ Există" : "✖ Lipsește"}
                        </p>

                        <input
                            type="url"
                            id="linkAudiobook-${opera.id}"
                            placeholder="https://...">

                        <button
                            class="admin-btn"
                            type="button"
                            onclick="inlocuiesteLinkOpera(${opera.id}, 'link_audiobook', 'linkAudiobook-${opera.id}')">

                            🎧 Înlocuiește linkul audiobookului

                        </button>

                        <p>
                            Test de lectură:
                            ${opera.link_test_lectura ? "✔ Există" : "✖ Lipsește"}
                        </p>

                        <input
                            type="url"
                            id="linkTestLectura-${opera.id}"
                            placeholder="https://...">

                        <button
                            class="admin-btn"
                            type="button"
                            onclick="inlocuiesteLinkOpera(${opera.id}, 'link_test_lectura', 'linkTestLectura-${opera.id}')">

                            📝 Înlocuiește linkul testului

                        </button>

                        <p>
                            Document personaje Instagram:
                            ${opera.personaje_instagram ? "✔ Există" : "✖ Lipsește"}
                        </p>

                        <input
                            type="file"
                            id="personajeInstagram-${opera.id}"
                            accept="application/pdf">

                        <button
                            class="admin-btn"
                            type="button"
                            onclick="inlocuiesteFisierOpera(
                                ${opera.id},
                                'personaje_instagram',
                                'personajeInstagram-${opera.id}',
                                'Pdf',
                                'pdf'
                            )">

                            📄 Înlocuiește documentul Instagram

                        </button>


                        <div
                            id="inlocuireStatus-${opera.id}"
                            class="admin-status">
                        </div>


                        <hr>


                        <button
                            class="admin-btn sterge-opera-btn"
                            type="button"
                            onclick="stergeOpera(${opera.id})">

                            🗑️ Șterge opera

                        </button>

                    </div>

                `;

            }).join("");


    } catch (error) {

        console.error(error);

        container.innerHTML =
            `<p style="color:#c62828">
                ${escapeHTML(error.message)}
            </p>`;
    }
}

// ======================================================
// ÎNLOCUIEȘTE UN PDF EXISTENT
// ======================================================

async function inlocuiestePDF(
    operaId,
    coloana,
    inputId
) {

    const coloanePermise = [
        "pdf",
        "pdf_analiza_literara",
        "pdf_valori_morale",
        "pdf_caracterizare"
    ];

    if (!coloanePermise.includes(coloana)) {

        alert("Coloana PDF nu este permisă.");

        return;
    }


    const input =
        document.getElementById(inputId);

    const status =
        document.getElementById(
            `inlocuireStatus-${operaId}`
        );


    if (!input || !input.files[0]) {

        if (status) {
            status.textContent =
                "Selectează un fișier PDF.";
            status.style.color =
                "#c62828";
        }

        return;
    }


    const fisier =
        input.files[0];


    if (
        fisier.type !== "application/pdf" &&
        !fisier.name
            .toLowerCase()
            .endsWith(".pdf")
    ) {

        if (status) {
            status.textContent =
                "Fișierul selectat nu este PDF.";
            status.style.color =
                "#c62828";
        }

        return;
    }


    const user =
        await utilizatorAutentificat();


    if (!user) {

        if (status) {
            status.textContent =
                "Trebuie să fii administrator.";
            status.style.color =
                "#c62828";
        }

        return;
    }


    try {

        if (status) {
            status.textContent =
                "Se încarcă noul PDF...";
            status.style.color =
                "#7b2450";
        }


        // ==================================================
        // 1. OBȚINEM OPERA EXISTENTĂ
        // ==================================================

        const {
            data: opera,
            error: eroareOpera
        } = await supabaseClient
            .from("opere")
            .select("*")
            .eq("id", operaId)
            .single();


        if (eroareOpera) {
            throw eroareOpera;
        }


        // ==================================================
        // 2. PĂSTRĂM CALEA VECHIULUI PDF
        // ==================================================

        const valoareVeche =
            opera[coloana];

        const caleVeche =
            obtineCalePDF(
                valoareVeche
            );


        // ==================================================
        // 3. NUME NOU PDF
        // ==================================================

        const numeCurat =
            fisier.name
                .normalize("NFD")
                .replace(
                    /[\u0300-\u036f]/g,
                    ""
                )
                .replace(
                    /[^a-zA-Z0-9._-]/g,
                    "_"
                );


        const caleNoua =
            `${opera.autor_id}/${Date.now()}_${coloana}_${numeCurat}`;


        // ==================================================
        // 4. UPLOAD NOUL PDF
        // ==================================================

        const {
            error: uploadError
        } = await supabaseClient
            .storage
            .from(BUCKET)
            .upload(
                caleNoua,
                fisier,
                {
                    contentType:
                        "application/pdf",

                    upsert:
                        false
                }
            );


        if (uploadError) {
            throw uploadError;
        }


        const valoareNoua =
            `storage://${BUCKET}/${caleNoua}`;


        // ==================================================
        // 5. ACTUALIZĂM BAZA DE DATE
        // ==================================================

        const {
            error: updateError
        } = await supabaseClient
            .from("opere")
            .update({
                [coloana]:
                    valoareNoua
            })
            .eq(
                "id",
                operaId
            );


        // Dacă UPDATE-ul eșuează,
        // ștergem noul fișier.
        if (updateError) {

            await supabaseClient
                .storage
                .from(BUCKET)
                .remove([
                    caleNoua
                ]);

            throw updateError;
        }


        // ==================================================
        // 6. ȘTERGEM VECHIUL PDF
        // ==================================================

        if (caleVeche) {

            const {
                error: deleteOldError
            } = await supabaseClient
                .storage
                .from(BUCKET)
                .remove([
                    caleVeche
                ]);


            if (deleteOldError) {

                console.warn(
                    "Noul PDF a fost salvat, dar vechiul PDF nu a putut fi șters:",
                    deleteOldError
                );

            }
        }


        // ==================================================
        // 7. SUCCES
        // ==================================================

        if (status) {

            status.textContent =
                "PDF-ul a fost înlocuit cu succes!";

            status.style.color =
                "#2e7d32";
        }


        input.value = "";


        await incarcaOpereAdmin();
        await incarcaListaPDF();
        await incarcaAutori();


    } catch (error) {

        console.error(
            "Eroare înlocuire PDF:",
            error
        );


        if (status) {

            status.textContent =
                "Nu am putut înlocui PDF-ul: " +
                error.message;

            status.style.color =
                "#c62828";
        }

    }
}

function obtineCaleResursa(valoare, bucket) {

    if (!valoare) {
        return null;
    }

    const referintaStorage = `storage://${bucket}/`;

    if (valoare.startsWith(referintaStorage)) {
        return decodeURIComponent(
            valoare.substring(referintaStorage.length)
        );
    }

    const markerPublic = `/storage/v1/object/public/${bucket}/`;
    const indexPublic = valoare.indexOf(markerPublic);

    if (indexPublic !== -1) {
        return decodeURIComponent(
            valoare.substring(indexPublic + markerPublic.length)
        );
    }

    return null;
}

async function inlocuiesteFisierOpera(
    operaId,
    coloana,
    inputId,
    bucket,
    tipFisier
) {

    const coloanePermise = [
        "rezumat_word",
        "personaje_instagram"
    ];

    if (!coloanePermise.includes(coloana)) {
        alert("Resursa nu este permisă.");
        return;
    }

    const input = document.getElementById(inputId);
    const status = document.getElementById(`inlocuireStatus-${operaId}`);
    const fisier = input && input.files[0];

    if (!fisier) {
        status.textContent = "Selectează un fișier.";
        status.style.color = "#c62828";
        return;
    }

    const esteRezumatScris = tipFisier === "word";
    const esteDocumentPDF = tipFisier === "pdf";
    const extensieValida = esteRezumatScris
        ? /\.(doc|docx|pdf)$/i.test(fisier.name)
        : esteDocumentPDF
            ? /\.pdf$/i.test(fisier.name) || fisier.type === "application/pdf"
            : fisier.type.startsWith("image/");

    if (!extensieValida) {
        status.textContent = esteRezumatScris
            ? "Fișierul trebuie să fie .doc, .docx sau .pdf."
            : esteDocumentPDF
                ? "Fișierul selectat nu este un PDF valid."
                : "Fișierul selectat nu este o imagine validă.";
        status.style.color = "#c62828";
        return;
    }

    const user = await utilizatorAutentificat();

    if (!user) {
        status.textContent = "Trebuie să fii administrator.";
        status.style.color = "#c62828";
        return;
    }

    let caleNoua = null;

    try {

        status.textContent = "Se încarcă noul fișier...";
        status.style.color = "#7b2450";

        const { data: opera, error: operaError } =
            await supabaseClient
                .from("opere")
                .select(coloana + ", autor_id")
                .eq("id", operaId)
                .single();

        if (operaError) {
            throw operaError;
        }

        const numeCurat = fisier.name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9._-]/g, "_");

        caleNoua = tipFisier === "word"
            ? `${opera.autor_id}/${Date.now()}_rezumat_word_${numeCurat}`
            : esteDocumentPDF
                ? `${opera.autor_id}/${Date.now()}_personaje_instagram_${numeCurat}`
                : `personaje/${Date.now()}_${opera.autor_id}_${numeCurat}`;

        const { error: uploadError } =
            await supabaseClient
                .storage
                .from(bucket)
                .upload(caleNoua, fisier, {
                    contentType: fisier.type || (
                        esteRezumatScris
                            ? /\.pdf$/i.test(fisier.name)
                                ? "application/pdf"
                                : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            : esteDocumentPDF
                                ? "application/pdf"
                                : "image/png"
                    ),
                    upsert: false
                });

        if (uploadError) {
            throw uploadError;
        }

        const valoareNoua = tipFisier === "word" || esteDocumentPDF
            ? `storage://${bucket}/${caleNoua}`
            : supabaseClient
                .storage
                .from(bucket)
                .getPublicUrl(caleNoua)
                .data
                .publicUrl;

        const { error: updateError } =
            await supabaseClient
                .from("opere")
                .update({ [coloana]: valoareNoua })
                .eq("id", operaId);

        if (updateError) {
            await supabaseClient.storage.from(bucket).remove([caleNoua]);
            throw updateError;
        }

        const caleVeche = obtineCaleResursa(opera[coloana], bucket);

        if (caleVeche) {
            const { error: deleteError } =
                await supabaseClient
                    .storage
                    .from(bucket)
                    .remove([caleVeche]);

            if (deleteError) {
                console.warn("Noua resursă a fost salvată, dar cea veche nu a putut fi ștearsă:", deleteError);
            }
        }

        input.value = "";
        status.textContent = "Resursa a fost înlocuită cu succes!";
        status.style.color = "#2e7d32";

        await incarcaOpereAdmin();
        await incarcaAutori();

    } catch (error) {

        if (caleNoua) {
            await supabaseClient.storage.from(bucket).remove([caleNoua]);
        }

        console.error("Eroare înlocuire resursă:", error);
        status.textContent = "Nu am putut înlocui resursa: " + error.message;
        status.style.color = "#c62828";
    }
}

async function inlocuiesteLinkOpera(operaId, coloana, inputId) {

    const coloanePermise = [
        "link_film",
        "link_audiobook",
        "link_test_lectura"
    ];

    if (!coloanePermise.includes(coloana)) {
        alert("Linkul nu este permis.");
        return;
    }

    const input = document.getElementById(inputId);
    const status = document.getElementById(`inlocuireStatus-${operaId}`);
    const valoare = input && input.value.trim();

    if (!valoare || !/^https?:\/\//i.test(valoare)) {
        status.textContent = "Introdu un link care începe cu http:// sau https://.";
        status.style.color = "#c62828";
        return;
    }

    const user = await utilizatorAutentificat();

    if (!user) {
        status.textContent = "Trebuie să fii administrator.";
        status.style.color = "#c62828";
        return;
    }

    try {

        status.textContent = "Se salvează noul link...";
        status.style.color = "#7b2450";

        const { error } = await supabaseClient
            .from("opere")
            .update({ [coloana]: valoare })
            .eq("id", operaId);

        if (error) {
            throw error;
        }

        input.value = "";
        status.textContent = "Linkul a fost înlocuit cu succes!";
        status.style.color = "#2e7d32";

        await incarcaOpereAdmin();
        await incarcaAutori();

    } catch (error) {
        console.error("Eroare înlocuire link:", error);
        status.textContent = "Nu am putut înlocui linkul: " + error.message;
        status.style.color = "#c62828";
    }
}



// ======================================================
// ȘTERGE OPERĂ + PDF-URI
// ======================================================

async function stergeOpera(operaId) {

    const confirmare =
        confirm(
            "Sigur vrei să ștergi această operă și toate PDF-urile ei?"
        );


    if (!confirmare) {
        return;
    }


    const user =
        await utilizatorAutentificat();


    if (!user) {

        alert(
            "Trebuie să fii autentificat."
        );

        return;

    }


    try {

        const {
            data: opera,
            error: eroareOpera
        } =
            await supabaseClient
                .from("opere")
                .select("*")
                .eq(
                    "id",
                    operaId
                )
                .single();


        if (eroareOpera) {

            throw eroareOpera;

        }


        const fisiere = [
            obtineCalePDF(
                opera.pdf
            ),
            obtineCalePDF(
                opera.pdf_analiza_literara
            ),
            obtineCalePDF(
                opera.pdf_valori_morale
            ),
            obtineCalePDF(
                opera.pdf_caracterizare
            ),
            obtineCalePDF(
                opera.personaje_instagram
            )
        ]
            .filter(Boolean);


        const {
            error: deleteDbError
        } =
            await supabaseClient
                .from("opere")
                .delete()
                .eq(
                    "id",
                    operaId
                );


        if (deleteDbError) {

            throw deleteDbError;

        }


        if (
            fisiere.length > 0
        ) {

            const {
                error: deleteStorageError
            } =
                await supabaseClient
                    .storage
                    .from(BUCKET)
                    .remove(
                        fisiere
                    );


            if (deleteStorageError) {

                console.error(
                    "Opera a fost ștearsă din DB, dar PDF-urile nu:",
                    deleteStorageError
                );

            }

        }


        alert(
            "Opera a fost ștearsă cu succes."
        );


        await incarcaOpereAdmin();
        await incarcaListaPDF();
        await incarcaAutori();


    } catch (error) {

        console.error(
            "Eroare ștergere operă:",
            error
        );

        alert(
            "Nu am putut șterge opera: " +
            error.message
        );

    }
}


// ======================================================
// LISTĂ PDF
// ======================================================

async function incarcaListaPDF() {

    const container =
        document.getElementById(
            "listaPDF"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "<p>Se încarcă...</p>";


    try {

        const fisiere =
            await listeazaToatePDFurile(
                ""
            );


        if (
            fisiere.length === 0
        ) {

            container.innerHTML =
                "<p>Nu există PDF-uri.</p>";

            return;

        }


        container.innerHTML =
            fisiere.map(
                fisier => `

                    <div class="pdf-item">

                        <span>
                            📕 ${escapeHTML(
                    fisier
                )}
                        </span>

                    </div>

                `
            )
                .join("");


    } catch (error) {

        console.error(
            error
        );

        container.innerHTML =
            "<p style='color:#c62828'>" +
            "Nu am putut încărca lista PDF-urilor." +
            "</p>";

    }
}


// ======================================================
// LISTARE RECURSIVĂ PDF-URI
// ======================================================

async function listeazaToatePDFurile(
    folder
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .storage
            .from(BUCKET)
            .list(
                folder,
                {
                    limit: 1000
                }
            );


    if (error) {

        throw error;

    }


    let rezultat = [];


    for (
        const item of data || []
    ) {

        const cale =
            folder
                ? `${folder}/${item.name}`
                : item.name;


        if (
            item.metadata
        ) {

            if (
                item.name
                    .toLowerCase()
                    .endsWith(".pdf")
            ) {

                rezultat.push(
                    cale
                );

            }

        } else {

            const subfolder =
                await listeazaToatePDFurile(
                    cale
                );


            rezultat =
                rezultat.concat(
                    subfolder
                );

        }

    }


    return rezultat;
}


// ======================================================
// DARK MODE
// ======================================================

function schimbaTema() {

    document.body.classList.toggle(
        "dark"
    );

}


// ======================================================
// QUIZ
// ======================================================

function arataQuiz(tip) {

    const kahoot =
        document.getElementById(
            "kahoot"
        );


    const wordwall =
        document.getElementById(
            "wordwall"
        );


    const butoane =
        document.querySelectorAll(
            ".quiz-tab"
        );


    if (tip === "kahoot") {

        kahoot.classList.remove(
            "ascuns"
        );

        wordwall.classList.add(
            "ascuns"
        );

        butoane[0].classList.add(
            "activ"
        );

        butoane[1].classList.remove(
            "activ"
        );

    } else {

        kahoot.classList.add(
            "ascuns"
        );

        wordwall.classList.remove(
            "ascuns"
        );

        butoane[0].classList.remove(
            "activ"
        );

        butoane[1].classList.add(
            "activ"
        );

    }
}


// ======================================================
// LOGIN MODAL
// ======================================================

function afiseazaLogin() {

    document
        .getElementById(
            "loginModal"
        )
        .classList.remove(
            "ascuns"
        );


    document
        .getElementById(
            "loginEmail"
        )
        .focus();

}


function inchideLogin() {

    document
        .getElementById(
            "loginModal"
        )
        .classList.add(
            "ascuns"
        );


    document
        .getElementById(
            "loginMesaj"
        )
        .textContent = "";

}


// ======================================================
// LOGIN ȘI REGISTER
// ======================================================

function schimbaAuthForm(formular) {

    const esteRegister = formular === "register";

    document.getElementById("loginForm").classList.toggle("ascuns", esteRegister);
    document.getElementById("registerForm").classList.toggle("ascuns", !esteRegister);
    document.getElementById("loginTab").classList.toggle("activ", !esteRegister);
    document.getElementById("registerTab").classList.toggle("activ", esteRegister);
    document.getElementById("loginMesaj").textContent = "";

}

async function loginUtilizator() {

    const email =
        document
            .getElementById(
                "loginEmail"
            )
            .value
            .trim();


    const password =
        document
            .getElementById(
                "loginPassword"
            )
            .value;


    const mesaj =
        document.getElementById(
            "loginMesaj"
        );


    if (
        !email ||
        !password
    ) {

        mesaj.textContent =
            "Completează emailul și parola.";

        mesaj.style.color =
            "#c62828";

        return;

    }


    mesaj.textContent =
        "Se verifică datele...";

    mesaj.style.color =
        "#7b2450";


    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .signInWithPassword({
                    email:
                        email,

                    password:
                        password
                });


        if (error) {

            throw error;

        }


        if (
            !data ||
            !data.user
        ) {

            throw new Error(
                "Autentificarea nu a reușit."
            );

        }


        inchideLogin();

        actualizeazaStareAutentificare(data.user);


    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        mesaj.textContent =
            "Email sau parolă incorectă.";

        mesaj.style.color =
            "#c62828";

    }
}

async function inregistreazaUtilizator() {

    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const role = document.getElementById("registerRole").value;
    const mesaj = document.getElementById("loginMesaj");

    if (!email || !password || !["elev", "profesor"].includes(role)) {
        mesaj.textContent = "Completează toate câmpurile și alege un rol valid.";
        mesaj.style.color = "#c62828";
        return;
    }

    if (password.length < 6) {
        mesaj.textContent = "Parola trebuie să aibă minimum 6 caractere.";
        mesaj.style.color = "#c62828";
        return;
    }

    mesaj.textContent = "Se creează contul...";
    mesaj.style.color = "#7b2450";

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role
                }
            }
        });

        if (error) {
            throw error;
        }

        if (data.session && data.user) {
            inchideLogin();
            actualizeazaStareAutentificare(data.user);
        } else {
            mesaj.textContent = "Cont creat. Verifică emailul pentru confirmare, apoi conectează-te.";
            mesaj.style.color = "#2e7d32";
        }
    } catch (error) {
        console.error("Register error:", error);
        mesaj.textContent = "Nu am putut crea contul: " + error.message;
        mesaj.style.color = "#c62828";
    }
}

function loginAdmin() {
    return loginUtilizator();
}


// ======================================================
// RESETARE PAROLĂ
// ======================================================

async function reseteazaParola() {

    const email =
        document
            .getElementById(
                "loginEmail"
            )
            .value
            .trim();


    const mesaj =
        document.getElementById(
            "loginMesaj"
        );


    if (!email) {

        mesaj.textContent =
            "Introdu emailul pentru resetarea parolei.";

        mesaj.style.color =
            "#c62828";

        return;

    }


    mesaj.textContent =
        "Se trimite emailul de resetare...";

    mesaj.style.color =
        "#7b2450";


    try {

        const {
            error
        } =
            await supabaseClient.auth
                .resetPasswordForEmail(
                    email,
                    {
                        redirectTo:
                            window.location.origin +
                            "/reset-password.html"
                    }
                );


        if (error) {

            throw error;

        }


        mesaj.textContent =
            "Emailul de resetare a fost trimis. Verifică Inbox și Spam.";

        mesaj.style.color =
            "#2e7d32";


    } catch (error) {

        console.error(
            "Eroare resetare parolă:",
            error
        );

        mesaj.textContent =
            "Nu am putut trimite emailul: " +
            error.message;

        mesaj.style.color =
            "#c62828";

    }
}


// ======================================================
// AFIȘEAZĂ ADMIN
// ======================================================

async function obtineRolUtilizator(user) {

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Profile error:", error);
        return null;
    }

    return data ? data.role : null;
}

function actualizeazaStareAutentificare(user) {

    const status = document.getElementById("authStatus");
    const logoutButton = document.getElementById("logoutButton");

    if (!status || !logoutButton) {
        return;
    }

    status.textContent = "Signed in: " + (user.email || "utilizator");
    status.classList.add("signed-in");
    logoutButton.classList.remove("ascuns");

}

function actualizeazaStareDelogata() {

    const status = document.getElementById("authStatus");
    const logoutButton = document.getElementById("logoutButton");

    if (!status || !logoutButton) {
        return;
    }

    status.textContent = "Signed out";
    status.classList.remove("signed-in");
    logoutButton.classList.add("ascuns");

}

async function afiseazaAdmin(user) {

    const panel =
        document.getElementById(
            "adminPanel"
        );


    const adminUser =
        document.getElementById(
            "adminUser"
        );

    const adminLink =
        document.getElementById("adminLink");


    if (
        !panel ||
        !adminUser
    ) {

        return;

    }


    const role = await obtineRolUtilizator(user);

    if (role !== "admin") {
        panel.classList.add("ascuns");

        if (adminLink) {
            adminLink.classList.add("ascuns");
        }

        if (estePaginaAdmin) {
            window.location.replace("index.html");
        }

        return;
    }

    panel.classList.toggle("ascuns", !estePaginaAdmin);

    if (adminLink) {
        adminLink.classList.remove("ascuns");
    }


    adminUser.textContent =
        "Conectat ca: " +
        user.email;


    incarcaListaPDF();
    incarcaAutoriAdmin();
    incarcaOpereAdmin();
    incarcaListaAutoriSelect();

}


// ======================================================
// LOGOUT
// ======================================================

async function logoutUtilizator() {

    try {

        const {
            error
        } =
            await supabaseClient.auth
                .signOut();


        if (error) {

            throw error;

        }


        document.getElementById("adminPanel").classList.add("ascuns");
        actualizeazaStareDelogata();

        if (estePaginaAdmin) {
            window.location.replace("index.html");
        }


    } catch (error) {

        console.error(
            error
        );

        alert(
            "Nu am putut realiza deconectarea."
        );

    }
}

function logoutAdmin() {
    return logoutUtilizator();
}


// ======================================================
// UTILIZATOR AUTENTIFICAT
// ======================================================

async function utilizatorAutentificat() {

    const {
        data,
        error
    } =
        await supabaseClient.auth
            .getSession();


    if (error) {

        console.error(
            error
        );

        return null;

    }


    if (
        !data ||
        !data.session
    ) {

        return null;

    }


    const user = data.session.user;
    const role = await obtineRolUtilizator(user);

    if (role !== "admin") {
        return null;
    }

    return user;
}


// ======================================================
// VERIFICĂ SESIUNEA
// ======================================================

async function verificaSesiunea() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .getSession();


        if (error) {

            throw error;

        }


        if (
            data &&
            data.session
        ) {

            actualizeazaStareAutentificare(data.session.user);

            afiseazaAdmin(
                data.session.user
            );

        } else {

            actualizeazaStareDelogata();

            if (estePaginaAdmin) {
                window.location.replace("index.html");
            }

        }


    } catch (error) {

        console.error(
            "Session error:",
            error
        );

    }
}


// ======================================================
// AUTH STATE
// ======================================================

supabaseClient.auth.onAuthStateChange(
    (event, session) => {

        console.log(
            "Auth:",
            event
        );


        if (session) {

            actualizeazaStareAutentificare(session.user);

            afiseazaAdmin(
                session.user
            );

        } else {

            actualizeazaStareDelogata();

            const panel =
                document.getElementById(
                    "adminPanel"
                );


            if (panel) {

                panel.classList.add(
                    "ascuns"
                );

            }

            const adminLink =
                document.getElementById("adminLink");

            if (adminLink) {
                adminLink.classList.add("ascuns");
            }

            if (estePaginaAdmin) {
                window.location.replace("index.html");
            }

        }

    }
);


// ======================================================
// TASTE LOGIN
// ======================================================

document.addEventListener(
    "keydown",
    function (event) {

        const modal =
            document.getElementById(
                "loginModal"
            );


        if (
            event.key === "Enter" &&
            modal &&
            !modal.classList.contains(
                "ascuns"
            )
        ) {

            loginAdmin();

        }


        if (
            event.key === "Escape" &&
            modal &&
            !modal.classList.contains(
                "ascuns"
            )
        ) {

            inchideLogin();

        }

    }
);


// ======================================================
