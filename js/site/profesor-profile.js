// Tab de cont pentru rolul profesor - fara continut momentan.
let rolContActiv = null;
let profilProfesorUser = null;

function activeazaProfilProfesor(user) {
    rolContActiv = "profesor";
    profilProfesorUser = user;
    document.getElementById("profileButton")?.classList.remove("ascuns");
}

function deschideProfilProfesor() {
    if (!profilProfesorUser) {
        afiseazaLogin();
        return;
    }
    const email = document.getElementById("profileEmail");
    if (email) email.textContent = profilProfesorUser.email || "Profesor conectat";
    document.getElementById("profileElevContent")?.classList.add("ascuns");
    document.getElementById("profileProfesorContent")?.classList.remove("ascuns");
    document.getElementById("profileModal")?.classList.remove("ascuns");
    incarcaMaterialeProfesor();
}

// ======================================================
// MATERIALE TRIMISE SPRE REVISTĂ
// ======================================================

async function trimiteMaterialRevista() {
    if (!profilProfesorUser) {
        afiseazaLogin();
        return;
    }

    const titlu = document.getElementById("profesorMaterialTitlu")?.value.trim();
    const descriere = document.getElementById("profesorMaterialDescriere")?.value.trim();
    const fisier = document.getElementById("profesorMaterialFisier")?.files[0];
    const status = document.getElementById("profesorMaterialStatus");

    const tipValid = fisier && (
        fisier.type === "application/pdf" || /\.pdf$/i.test(fisier.name) ||
        fisier.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || /\.docx$/i.test(fisier.name)
    );

    if (!titlu || !tipValid) {
        if (status) {
            status.textContent = "Completează titlul și alege un fișier PDF sau DOCX valid.";
            status.style.color = "#c62828";
        }
        return;
    }

    try {
        if (status) {
            status.textContent = "Se trimite materialul...";
            status.style.color = "#7b2450";
        }

        const nume = fisier.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
        const cale = `${profilProfesorUser.id}/${Date.now()}_${nume}`;

        const { error: uploadError } = await supabaseClient.storage
            .from("RevistaSubmisii")
            .upload(cale, fisier, { upsert: false });
        if (uploadError) throw uploadError;

        const { error } = await supabaseClient.from("reviste_materiale").insert({
            profesor_id: profilProfesorUser.id,
            titlu,
            descriere: descriere || null,
            storage_path: cale,
            nume_fisier: fisier.name
        });
        if (error) throw error;

        if (status) {
            status.textContent = "Materialul a fost trimis spre revizuire.";
            status.style.color = "#2e7d32";
        }
        golesteCampuri("profesorMaterialTitlu", "profesorMaterialDescriere");
        const fisierInput = document.getElementById("profesorMaterialFisier");
        if (fisierInput) fisierInput.value = "";

        await incarcaMaterialeProfesor();
    } catch (error) {
        console.error("Trimitere material revistă:", error);
        if (status) {
            status.textContent = "Nu am putut trimite materialul: " + error.message;
            status.style.color = "#c62828";
        }
    }
}

async function incarcaMaterialeProfesor() {
    const container = document.getElementById("profesorListaMateriale");
    if (!container || !profilProfesorUser) return;
    container.innerHTML = "<p>Se încarcă...</p>";

    try {
        const { data, error } = await supabaseClient
            .from("reviste_materiale")
            .select("id, titlu, descriere, stare, motiv_respingere, creat_la")
            .eq("profesor_id", profilProfesorUser.id)
            .order("creat_la", { ascending: false });
        if (error) throw error;

        if (!data || !data.length) {
            container.innerHTML = "<p class=\"profile-empty\">Nu ai trimis încă niciun material.</p>";
            return;
        }

        const etichetaStare = { in_asteptare: "⏳ În așteptare", acceptat: "✅ Acceptat", refuzat: "❌ Refuzat" };

        container.innerHTML = data.map(material => `
            <div class="profile-panel">
                <strong>${escapeHTML(material.titlu)}</strong>
                <p>${etichetaStare[material.stare] || material.stare}</p>
                ${material.stare === "refuzat" && material.motiv_respingere ? `<p style="color:#c62828">Motiv: ${escapeHTML(material.motiv_respingere)}</p>` : ""}
            </div>`).join("");
    } catch (error) {
        console.error("Eroare încărcare materiale profesor:", error);
        container.innerHTML = `<p style="color:#c62828">${escapeHTML(error.message)}</p>`;
    }
}
