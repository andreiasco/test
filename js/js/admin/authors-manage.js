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

                    <label for="autorLocNastereEdit-${autor.id}">Locul nașterii</label>
                    <select id="autorLocNastereEdit-${autor.id}"
                        onchange="this.nextElementSibling.classList.toggle('ascuns', this.value !== 'other')">
                        <option value="">Neselectat</option>
                        <option value="banat" ${autor.locul_nasterii === "banat" ? "selected" : ""}>Banat</option>
                        <option value="crisana" ${autor.locul_nasterii === "crisana" ? "selected" : ""}>Crișana</option>
                        <option value="maramures" ${autor.locul_nasterii === "maramures" ? "selected" : ""}>Maramureș</option>
                        <option value="transilvania" ${autor.locul_nasterii === "transilvania" ? "selected" : ""}>Transilvania</option>
                        <option value="oltenia" ${autor.locul_nasterii === "oltenia" ? "selected" : ""}>Oltenia</option>
                        <option value="muntenia" ${autor.locul_nasterii === "muntenia" ? "selected" : ""}>Muntenia</option>
                        <option value="dobrogea" ${autor.locul_nasterii === "dobrogea" ? "selected" : ""}>Dobrogea</option>
                        <option value="moldova" ${autor.locul_nasterii === "moldova" ? "selected" : ""}>Moldova</option>
                        <option value="bucovina" ${autor.locul_nasterii === "bucovina" ? "selected" : ""}>Bucovina</option>
                        <option value="tara-romaneasca" ${autor.locul_nasterii === "tara-romaneasca" ? "selected" : ""}>Țara Românească</option>
                        <option value="other" ${autor.locul_nasterii && !["banat", "crisana", "maramures", "transilvania", "oltenia", "muntenia", "dobrogea", "moldova", "bucovina", "tara-romaneasca"].includes(autor.locul_nasterii) ? "selected" : ""}>Other / internațional</option>
                    </select>
                    <input type="text" id="autorLocNastereOtherEdit-${autor.id}"
                        class="${autor.locul_nasterii && !["banat", "crisana", "maramures", "transilvania", "oltenia", "muntenia", "dobrogea", "moldova", "bucovina", "tara-romaneasca"].includes(autor.locul_nasterii) ? "" : "ascuns"}"
                        value="${escapeHTML(autor.locul_nasterii && !["banat", "crisana", "maramures", "transilvania", "oltenia", "muntenia", "dobrogea", "moldova", "bucovina", "tara-romaneasca"].includes(autor.locul_nasterii) ? autor.locul_nasterii : "")}"
                        placeholder="Locul nașterii (internațional)">

                    <button class="admin-btn" type="button" onclick="actualizeazaLocNastereAutor(${autor.id})">
                        Salvează locul nașterii
                    </button>

                    <label for="autorLocalitatNastereEdit-${autor.id}">Localitatea de naștere</label>
                    <input type="text" id="autorLocalitatNastereEdit-${autor.id}"
                        placeholder="Ex: Constanța, București, Lancrăm, Alba"
                        value="${escapeHTML(autor.localitate_nastere || "")}">

                    <button class="admin-btn" type="button" onclick="actualizeazaLocalitatNastereAutor(${autor.id})">
                        Salvează localitatea
                    </button>

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

async function actualizeazaLocNastereAutor(autorId) {
    const select = document.getElementById(`autorLocNastereEdit-${autorId}`);
    const other = document.getElementById(`autorLocNastereOtherEdit-${autorId}`);
    const locatie = select.value === "other" ? other.value.trim() : select.value;

    if (!locatie) {
        alert("Selectează regiunea sau completează locul internațional al nașterii.");
        return;
    }

    const { error } = await supabaseClient
        .from("autori")
        .update({ locul_nasterii: locatie })
        .eq("id", autorId);

    if (error) {
        alert("Nu am putut actualiza locul nașterii: " + error.message);
        return;
    }

    await incarcaAutoriAdmin();
    await incarcaAutori();
}

async function actualizeazaLocalitatNastereAutor(autorId) {
    const input = document.getElementById(`autorLocalitatNastereEdit-${autorId}`);
    const localitate = input.value.trim();

    if (!localitate) {
        alert("Completează localitatea de naștere.");
        return;
    }

    const { error } = await supabaseClient
        .from("autori")
        .update({ localitate_nastere: localitate })
        .eq("id", autorId);

    if (error) {
        alert("Nu am putut actualiza localitatea: " + error.message);
        return;
    }

    alert("Localitatea a fost salvată cu succes!");
    await incarcaAutoriAdmin();
    await incarcaAutori();
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


