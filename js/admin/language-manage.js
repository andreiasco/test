// ======================================================
// ADMIN LIMBA ROMÂNĂ
// ======================================================

async function incarcaLimbaAdmin() {
    const lista = document.getElementById("listaLimbaAdmin");
    const select = document.getElementById("limbaMaterialCapitol");

    if (!lista) {
        return;
    }

    lista.innerHTML = "<p>Se încarcă...</p>";

    try {
        const { data: clase, error: claseError } = await supabaseClient
            .from("limba_clase").select("id, numar, titlu").order("numar");
        if (claseError) throw claseError;

        const { data: capitole, error: capitoleError } = await supabaseClient
            .from("limba_capitole").select("id, clasa_id, titlu, descriere, ordine")
            .order("ordine").order("titlu");
        if (capitoleError) throw capitoleError;

        const { data: materiale, error: materialeError } = await supabaseClient
            .from("limba_materiale").select("id, capitol_id, titlu, descriere, pdf, ordine, continut_ai")
            .order("ordine").order("titlu");
        if (materialeError) throw materialeError;

        if (select) {
            select.innerHTML = '<option value="">Selectează capitolul</option>';
            (capitole || []).forEach(capitol => {
                const clasa = (clase || []).find(item => String(item.id) === String(capitol.clasa_id));
                const option = document.createElement("option");
                option.value = capitol.id;
                option.textContent = `${clasa ? clasa.titlu : "Clasă"} - ${capitol.titlu}`;
                select.appendChild(option);
            });
        }

        lista.innerHTML = (clase || []).map(clasa => {
            const capitoleClasa = (capitole || []).filter(item => String(item.clasa_id) === String(clasa.id));
            return `<div class="admin-opera"><strong>${escapeHTML(clasa.titlu)}</strong>
                ${capitoleClasa.length ? capitoleClasa.map(capitol => {
                const materialeCapitol = (materiale || []).filter(item => String(item.capitol_id) === String(capitol.id));
                return `<div class="admin-autor"><h4>${escapeHTML(capitol.titlu)}</h4>
                        <p>${escapeHTML(capitol.descriere || "")}</p>
                        ${materialeCapitol.map(material => `<div>
                            <strong>${escapeHTML(material.titlu)}</strong> ${material.pdf ? "✔ PDF" : "✖ PDF lipsă"}
                            <span>${material.continut_ai ? " • 🤖 AI indexat" : " • ⚠ AI neindexat"}</span>
                            <input type="file" id="limbaMaterialNou-${material.id}" accept="application/pdf">
                            <button class="admin-btn" type="button" onclick="inlocuiesteMaterialLimba(${material.id})">Înlocuiește PDF</button>
                            <button class="admin-btn" type="button" onclick="indexeazaMaterialLimba(${material.id})">🤖 Indexează PDF pentru AI</button>
                            <button class="admin-btn sterge-opera-btn" type="button" onclick="stergeMaterialLimba(${material.id})">Șterge material</button>
                        </div>`).join("") || "<p>Nu există materiale.</p>"}
                        <button class="admin-btn sterge-opera-btn" type="button" onclick="stergeCapitolLimba(${capitol.id})">Șterge capitol</button>
                    </div>`;
            }).join("") : "<p>Nu există capitole.</p>"}
            </div>`;
        }).join("") || "<p>Nu există clase configurate.</p>";
    } catch (error) {
        console.error("Eroare încărcare admin Limba română:", error);
        lista.innerHTML = `<p style="color:#c62828">${escapeHTML(error.message)}</p>`;
    }
}

async function adaugaCapitolLimba() {
    const clasaNumar = document.getElementById("limbaCapitolClasa").value;
    const titlu = document.getElementById("limbaCapitolTitlu").value.trim();
    const descriere = document.getElementById("limbaCapitolDescriere").value.trim();
    const ordine = Number(document.getElementById("limbaCapitolOrdine").value) || 0;
    const status = document.getElementById("limbaCapitolStatus");

    if (!clasaNumar || !titlu) {
        status.textContent = "Selectează clasa și completează titlul capitolului.";
        status.style.color = "#c62828";
        return;
    }

    try {
        const { data: clasa, error: clasaError } = await supabaseClient
            .from("limba_clase").select("id").eq("numar", Number(clasaNumar)).single();
        if (clasaError) throw clasaError;

        const { error } = await supabaseClient.from("limba_capitole").insert({
            clasa_id: clasa.id, titlu, descriere: descriere || null, ordine
        });
        if (error) throw error;
        status.textContent = "Capitolul a fost adăugat.";
        status.style.color = "#2e7d32";
        golesteCampuri("limbaCapitolTitlu", "limbaCapitolDescriere", "limbaCapitolOrdine");
        await incarcaLimbaAdmin();
    } catch (error) {
        status.textContent = "Nu am putut adăuga capitolul: " + error.message;
        status.style.color = "#c62828";
    }
}

async function adaugaMaterialLimba() {
    const capitolId = document.getElementById("limbaMaterialCapitol").value;
    const titlu = document.getElementById("limbaMaterialTitlu").value.trim();
    const descriere = document.getElementById("limbaMaterialDescriere").value.trim();
    const ordine = Number(document.getElementById("limbaMaterialOrdine").value) || 0;
    const fisier = document.getElementById("limbaMaterialPDF").files[0];
    const status = document.getElementById("limbaMaterialStatus");

    if (!capitolId || !titlu || !fisier || (fisier.type !== "application/pdf" && !/\.pdf$/i.test(fisier.name))) {
        status.textContent = "Selectează capitolul, titlul și un fișier PDF valid.";
        status.style.color = "#c62828";
        return;
    }

    let cale = null;
    try {
        const user = await utilizatorAutentificat();
        if (!user) throw new Error("Trebuie să fii autentificat ca administrator.");
        status.textContent = "Se citește PDF-ul pentru Profesorul AI...";
        const continutAI = await extrageTextDinFisierPDF(fisier);
        const nume = fisier.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
        cale = `limba/${capitolId}/${Date.now()}_${nume}`;
        const { error: uploadError } = await supabaseClient.storage.from(BUCKET).upload(cale, fisier, { contentType: "application/pdf", upsert: false });
        if (uploadError) throw uploadError;
        const { error } = await supabaseClient.from("limba_materiale").insert({
            capitol_id: Number(capitolId), titlu, descriere: descriere || null, pdf: `storage://${BUCKET}/${cale}`, ordine, continut_ai: continutAI || null
        });
        if (error) throw error;
        status.textContent = "Materialul a fost încărcat.";
        status.style.color = "#2e7d32";
        golesteCampuri("limbaMaterialTitlu", "limbaMaterialDescriere", "limbaMaterialOrdine", "limbaMaterialPDF");
        await incarcaLimbaAdmin();
    } catch (error) {
        if (cale) await supabaseClient.storage.from(BUCKET).remove([cale]);
        status.textContent = "Nu am putut încărca materialul: " + error.message;
        status.style.color = "#c62828";
    }
}

async function inlocuiesteMaterialLimba(materialId) {
    const input = document.getElementById(`limbaMaterialNou-${materialId}`);
    const fisier = input && input.files[0];
    if (!fisier || (fisier.type !== "application/pdf" && !/\.pdf$/i.test(fisier.name))) return alert("Selectează un PDF valid.");
    let caleNoua = null;
    try {
        const { data: material, error } = await supabaseClient.from("limba_materiale").select("pdf, capitol_id").eq("id", materialId).single();
        if (error) throw error;
        const continutAI = await extrageTextDinFisierPDF(fisier);
        const nume = fisier.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
        caleNoua = `limba/${material.capitol_id}/${Date.now()}_${nume}`;
        const upload = await supabaseClient.storage.from(BUCKET).upload(caleNoua, fisier, { contentType: "application/pdf", upsert: false });
        if (upload.error) throw upload.error;
        const update = await supabaseClient.from("limba_materiale").update({ pdf: `storage://${BUCKET}/${caleNoua}`, continut_ai: continutAI || null }).eq("id", materialId);
        if (update.error) throw update.error;
        const veche = obtineCaleResursa(material.pdf, BUCKET);
        if (veche) await supabaseClient.storage.from(BUCKET).remove([veche]);
        await incarcaLimbaAdmin();
    } catch (error) {
        if (caleNoua) await supabaseClient.storage.from(BUCKET).remove([caleNoua]);
        alert("Nu am putut înlocui PDF-ul: " + error.message);
    }
}

async function stergeMaterialLimba(materialId) {
    if (!confirm("Sigur vrei să ștergi materialul?")) return;
    const { data: material, error } = await supabaseClient.from("limba_materiale").select("pdf").eq("id", materialId).single();
    if (error) return alert(error.message);
    const result = await supabaseClient.from("limba_materiale").delete().eq("id", materialId);
    if (result.error) return alert(result.error.message);
    const cale = obtineCaleResursa(material.pdf, BUCKET);
    if (cale) await supabaseClient.storage.from(BUCKET).remove([cale]);
    await incarcaLimbaAdmin();
}

async function stergeCapitolLimba(capitolId) {
    if (!confirm("Sigur vrei să ștergi capitolul și materialele lui?")) return;
    const { data: materiale } = await supabaseClient.from("limba_materiale").select("pdf").eq("capitol_id", capitolId);
    const result = await supabaseClient.from("limba_capitole").delete().eq("id", capitolId);
    if (result.error) return alert(result.error.message);
    const cai = (materiale || []).map(material => obtineCaleResursa(material.pdf, BUCKET)).filter(Boolean);
    if (cai.length) await supabaseClient.storage.from(BUCKET).remove(cai);
    await incarcaLimbaAdmin();
}


