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

    const loculNasteriiSelect = document
        .getElementById("autorLoculNasterii");
    const loculNasteriiOther = document
        .getElementById("autorLocNastereOther");
    const loculNasterii = loculNasteriiSelect.value === "other"
        ? loculNasteriiOther.value.trim()
        : loculNasteriiSelect.value;


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

    if (!loculNasterii) {
        status.textContent = "Selectează regiunea sau completează locul internațional al nașterii.";
        status.style.color = "#c62828";
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

                        locul_nasterii:
                            loculNasterii,

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

        document.getElementById("autorLoculNasterii").value = "";
        document.getElementById("autorLocNastereOther").value = "";
        document.getElementById("autorLocNastereOther").classList.add("ascuns");


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


