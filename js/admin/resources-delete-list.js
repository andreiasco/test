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


