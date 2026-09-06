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
        // 4. EXTRAGEM TEXTUL PENTRU PROFESORUL AI
        // ==================================================

        let continutAI = "";
        try {
            continutAI = await extrageTextDinFisierPDF(fisier);
        } catch (eroareText) {
            console.warn("PDF-ul a fost acceptat, dar textul nu a putut fi extras:", eroareText);
        }

        // ==================================================
        // 5. UPLOAD NOUL PDF
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
        // 6. ACTUALIZĂM BAZA DE DATE + TEXTUL AI
        // ==================================================

        const coloanaTextAI = MAPARE_TEXT_OPERA[coloana];
        const valoriUpdate = {
            [coloana]: valoareNoua
        };

        if (coloanaTextAI) {
            valoriUpdate[coloanaTextAI] = continutAI || null;
        }

        const {
            error: updateError
        } = await supabaseClient
            .from("opere")
            .update(valoriUpdate)
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



