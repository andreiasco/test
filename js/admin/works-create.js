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


