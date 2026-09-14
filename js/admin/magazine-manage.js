// ======================================================
// ADMIN REVISTA - materiale trimise de profesori + numere publicate
// ======================================================

let revistaMaterialeCache = [];
let revistaNumereCache = [];

async function incarcaRevistaAdmin() {
    const container = document.getElementById("listaRevistaMateriale");
    if (!container) return;
    container.innerHTML = "<p>Se încarcă...</p>";

    try {
        const { data: materiale, error } = await supabaseClient
            .from("reviste_materiale")
            .select("id, profesor_id, titlu, descriere, nume_fisier, storage_path, stare, motiv_respingere, creat_la")
            .order("creat_la", { ascending: false });
        if (error) throw error;

        revistaMaterialeCache = materiale || [];

        const profesorIds = [...new Set(revistaMaterialeCache.map(m => m.profesor_id))];
        let profesori = [];
        if (profesorIds.length) {
            const { data: profiluri } = await supabaseClient
                .from("profiles").select("id, email").in("id", profesorIds);
            profesori = profiluri || [];
        }

        if (!revistaMaterialeCache.length) {
            container.innerHTML = "<p>Nu există materiale trimise de profesori.</p>";
            return;
        }

        const etichetaStare = { in_asteptare: "⏳ În așteptare", acceptat: "✅ Acceptat", refuzat: "❌ Refuzat" };

        container.innerHTML = revistaMaterialeCache.map(material => {
            const profesor = profesori.find(p => p.id === material.profesor_id);
            return `
                <div class="admin-audit-row" id="revistaMaterial-${material.id}">
                    <div>
                        <strong>${escapeHTML(material.titlu)}</strong>
                        <small>${escapeHTML(profesor?.email || "Profesor necunoscut")} • ${new Date(material.creat_la).toLocaleString("ro-RO")}</small>
                        ${material.descriere ? `<p>${escapeHTML(material.descriere)}</p>` : ""}
                        ${material.stare === "refuzat" && material.motiv_respingere ? `<p style="color:#c62828">Motiv respingere: ${escapeHTML(material.motiv_respingere)}</p>` : ""}
                        <span>${etichetaStare[material.stare] || material.stare}</span>
                        ${material.stare === "in_asteptare" ? `
                            <div id="revistaRefuzForm-${material.id}" class="ascuns" style="margin-top:8px;">
                                <label for="revistaMotiv-${material.id}">Motiv respingere (opțional)</label>
                                <input type="text" id="revistaMotiv-${material.id}" placeholder="Motivul respingerii">
                                <button class="admin-btn" type="button" onclick="confirmaRefuzMaterial(${material.id})">Confirmă refuzul</button>
                                <button class="admin-btn" type="button" onclick="ascundeFormularRefuz(${material.id})">Renunță</button>
                            </div>
                        ` : ""}
                    </div>
                    <div>
                        <button class="admin-btn" type="button" onclick="descarcaMaterialRevista(${material.id})">👁 Deschide</button>
                        ${material.stare === "in_asteptare" ? `
                            <button class="admin-btn" type="button" onclick="acceptaMaterialRevista(${material.id})">✅ Acceptă</button>
                            <button class="admin-btn" type="button" onclick="afiseazaFormularRefuz(${material.id})">❌ Refuză</button>
                        ` : ""}
                        <button class="admin-btn sterge-opera-btn" type="button" onclick="stergeMaterialRevista(${material.id})">🗑 Șterge</button>
                    </div>
                </div>`;
        }).join("");
    } catch (error) {
        console.error("Eroare încărcare materiale revistă:", error);
        container.innerHTML = `<p style="color:#c62828">${escapeHTML(error.message)}</p>`;
    }
}

function scrieStatusRevistaMateriale(mesaj, eroare = false) {
    const status = document.getElementById("revistaMaterialeStatus");
    if (!status) return;
    status.textContent = mesaj;
    status.style.color = eroare ? "#c62828" : "#2e7d32";
}

function afiseazaFormularRefuz(id) {
    document.getElementById(`revistaRefuzForm-${id}`)?.classList.remove("ascuns");
}

function ascundeFormularRefuz(id) {
    document.getElementById(`revistaRefuzForm-${id}`)?.classList.add("ascuns");
}

async function confirmaRefuzMaterial(id) {
    const motiv = document.getElementById(`revistaMotiv-${id}`)?.value.trim() || null;
    await actualizeazaStareMaterialRevista(id, "refuzat", motiv);
}

async function descarcaMaterialRevista(id) {
    const material = revistaMaterialeCache.find(m => m.id === id);
    if (!material) return;

    try {
        const { data, error } = await supabaseClient.storage
            .from("RevistaSubmisii")
            .createSignedUrl(material.storage_path, 5 * 60);
        if (error) throw error;
        await deschidePrevizualizarePDF(data.signedUrl, true);
    } catch (error) {
        scrieStatusRevistaMateriale("Nu am putut deschide materialul: " + error.message, true);
    }
}

async function acceptaMaterialRevista(id) {
    await actualizeazaStareMaterialRevista(id, "acceptat");
}


async function actualizeazaStareMaterialRevista(id, stare, motiv = null) {
    try {
        const user = await utilizatorAutentificat();
        if (!user) throw new Error("Trebuie să fii autentificat ca administrator.");

        const { error } = await supabaseClient
            .from("reviste_materiale")
            .update({ stare, motiv_respingere: motiv, actualizat_la: new Date().toISOString(), actualizat_de: user.id })
            .eq("id", id);
        if (error) throw error;

        const material = revistaMaterialeCache.find(m => m.id === id);
        if (typeof inregistreazaActiuneAdmin === "function") {
            await inregistreazaActiuneAdmin(
                stare === "acceptat" ? "Material revistă acceptat" : "Material revistă refuzat",
                "reviste_materiale",
                material?.titlu || id,
                { motiv }
            );
        }

        scrieStatusRevistaMateriale(
            stare === "acceptat" ? "Materialul a fost acceptat." : "Materialul a fost refuzat."
        );

        await incarcaRevistaAdmin();
    } catch (error) {
        console.error("Actualizare material revistă:", error);
        scrieStatusRevistaMateriale("Nu am putut actualiza materialul: " + error.message, true);
    }
}

async function stergeMaterialRevista(id) {
    const material = revistaMaterialeCache.find(m => m.id === id);
    if (!material) return;
    if (!confirm("Sigur vrei să ștergi acest material?")) return;

    try {
        await supabaseClient.storage.from("RevistaSubmisii").remove([material.storage_path]);

        const { error } = await supabaseClient.from("reviste_materiale").delete().eq("id", id);
        if (error) throw error;

        if (typeof inregistreazaActiuneAdmin === "function") {
            await inregistreazaActiuneAdmin("Material revistă șters", "reviste_materiale", material.titlu || id);
        }

        scrieStatusRevistaMateriale("Materialul a fost șters.");
        await incarcaRevistaAdmin();
    } catch (error) {
        console.error("Ștergere material revistă:", error);
        scrieStatusRevistaMateriale("Nu am putut șterge materialul: " + error.message, true);
    }
}

// ======================================================
// NUMERE PUBLICATE ALE REVISTEI
// ======================================================

async function incarcaNumereRevistaAdmin() {
    const container = document.getElementById("listaNumereRevista");
    if (!container) return;
    container.innerHTML = "<p>Se încarcă...</p>";

    try {
        const { data, error } = await supabaseClient
            .from("reviste_numere")
            .select("id, titlu, descriere, nume_fisier, storage_path, publicat_la")
            .order("publicat_la", { ascending: false });
        if (error) throw error;

        revistaNumereCache = data || [];

        if (!revistaNumereCache.length) {
            container.innerHTML = "<p>Nu există numere publicate.</p>";
            return;
        }

        container.innerHTML = revistaNumereCache.map(numar => `
            <div class="admin-audit-row">
                <div>
                    <strong>${escapeHTML(numar.titlu)}</strong>
                    <small>${new Date(numar.publicat_la).toLocaleDateString("ro-RO")}</small>
                    ${numar.descriere ? `<p>${escapeHTML(numar.descriere)}</p>` : ""}
                </div>
                <div>
                    <button class="admin-btn" type="button" onclick="deschideNumarRevistaAdmin(${numar.id})">📖 Deschide</button>
                    <button class="admin-btn sterge-opera-btn" type="button" onclick="stergeNumarRevista(${numar.id})">🗑 Șterge</button>
                </div>
            </div>`).join("");
    } catch (error) {
        console.error("Eroare încărcare numere revistă:", error);
        container.innerHTML = `<p style="color:#c62828">${escapeHTML(error.message)}</p>`;
    }
}

async function deschideNumarRevistaAdmin(id) {
    const numar = revistaNumereCache.find(n => n.id === id);
    if (!numar) return;

    try {
        const { data, error } = await supabaseClient.storage
            .from("RevistaNumere")
            .createSignedUrl(numar.storage_path, 5 * 60);
        if (error) throw error;
        await deschidePrevizualizarePDF(data.signedUrl, true);
    } catch (error) {
        console.error("Deschidere număr revistă:", error);
        scrieStatusRevistaMateriale("Nu am putut deschide numărul: " + error.message, true);
    }
}

async function adaugaNumarRevista() {
    const titlu = document.getElementById("revistaNumarTitlu").value.trim();
    const descriere = document.getElementById("revistaNumarDescriere").value.trim();
    const fisier = document.getElementById("revistaNumarFisier").files[0];
    const status = document.getElementById("revistaNumarStatus");

    if (!titlu || !fisier || (fisier.type !== "application/pdf" && !/\.pdf$/i.test(fisier.name))) {
        status.textContent = "Completează titlul și alege un fișier PDF valid.";
        status.style.color = "#c62828";
        return;
    }

    try {
        const user = await utilizatorAutentificat();
        if (!user) throw new Error("Trebuie să fii autentificat ca administrator.");

        status.textContent = "Se încarcă fișierul...";
        status.style.color = "#7b2450";

        const nume = fisier.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
        const cale = `${Date.now()}_${nume}`;

        const { error: uploadError } = await supabaseClient.storage
            .from("RevistaNumere")
            .upload(cale, fisier, { contentType: "application/pdf", upsert: false });
        if (uploadError) throw uploadError;

        const { error } = await supabaseClient.from("reviste_numere").insert({
            titlu, descriere: descriere || null, storage_path: cale, nume_fisier: fisier.name, creat_de: user.id
        });
        if (error) throw error;

        if (typeof inregistreazaActiuneAdmin === "function") {
            await inregistreazaActiuneAdmin("Număr de revistă publicat", "reviste_numere", titlu);
        }

        status.textContent = "Numărul a fost publicat în tabul Revistă.";
        status.style.color = "#2e7d32";
        golesteCampuri("revistaNumarTitlu", "revistaNumarDescriere");
        document.getElementById("revistaNumarFisier").value = "";

        await incarcaNumereRevistaAdmin();
    } catch (error) {
        status.textContent = "Nu am putut publica numărul: " + error.message;
        status.style.color = "#c62828";
    }
}

async function stergeNumarRevista(id) {
    const numar = revistaNumereCache.find(n => n.id === id);
    if (!numar) return;
    if (!confirm("Sigur vrei să ștergi acest număr de revistă?")) return;

    try {
        await supabaseClient.storage.from("RevistaNumere").remove([numar.storage_path]);

        const { error } = await supabaseClient.from("reviste_numere").delete().eq("id", id);
        if (error) throw error;

        if (typeof inregistreazaActiuneAdmin === "function") {
            await inregistreazaActiuneAdmin("Număr de revistă șters", "reviste_numere", numar.titlu || id);
        }

        await incarcaNumereRevistaAdmin();
    } catch (error) {
        alert("Nu am putut șterge numărul: " + error.message);
    }
}
