// ======================================================
// CONTUL ADMINISTRATORULUI - STATISTICI, ROLURI, JURNAL
// ======================================================

let adminContProfiluri = [];

async function inregistreazaActiuneAdmin(actiune, tipTinta, etichetaTinta, detalii = {}) {
    try {
        const { data } = await supabaseClient.auth.getUser();
        const user = data?.user;
        if (!user) return;

        await supabaseClient.from("admin_audit_log").insert({
            admin_id: user.id,
            admin_email: user.email || null,
            actiune: String(actiune),
            tip_tinta: tipTinta ? String(tipTinta) : null,
            eticheta_tinta: etichetaTinta != null ? String(etichetaTinta) : null,
            detalii
        });
    } catch (error) {
        console.warn("Nu am putut înregistra acțiunea în jurnalul admin.", error);
    }
}

function formateazaBytesAdmin(bytes) {
    if (!bytes) return "0 MB";
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
}

async function calculeazaSpatiuStocare(bucket, folder = "") {
    const { data, error } = await supabaseClient.storage.from(bucket).list(folder, { limit: 1000 });
    if (error) throw error;

    let bytes = 0;
    let count = 0;

    for (const item of data || []) {
        const cale = folder ? `${folder}/${item.name}` : item.name;
        if (item.metadata) {
            bytes += Number(item.metadata.size || 0);
            count += 1;
        } else {
            const subfolder = await calculeazaSpatiuStocare(bucket, cale);
            bytes += subfolder.bytes;
            count += subfolder.count;
        }
    }

    return { bytes, count };
}

async function incarcaStatisticiContAdmin() {
    const statsBox = document.getElementById("adminContStatistici");
    const storageBox = document.getElementById("adminContStorage");
    if (!statsBox || !storageBox) return;

    statsBox.innerHTML = "<p>Se încarcă...</p>";
    storageBox.innerHTML = "<p>Se încarcă...</p>";

    const { data: profiluri, error } = await supabaseClient.from("profiles").select("role");

    if (error) {
        statsBox.innerHTML = `<p style="color:#c62828">${escapeHTML(error.message)}</p>`;
    } else {
        const total = profiluri?.length || 0;
        const perRol = { elev: 0, profesor: 0, admin: 0 };
        (profiluri || []).forEach(profil => {
            if (perRol[profil.role] !== undefined) perRol[profil.role] += 1;
        });
        statsBox.innerHTML = `
            <div class="admin-stat-card"><strong>${total}</strong><span>utilizatori total</span></div>
            <div class="admin-stat-card"><strong>${perRol.elev}</strong><span>elevi</span></div>
            <div class="admin-stat-card"><strong>${perRol.profesor}</strong><span>profesori</span></div>
            <div class="admin-stat-card"><strong>${perRol.admin}</strong><span>administratori</span></div>`;
    }

    try {
        const [pdfInfo, imaginiInfo] = await Promise.all([
            calculeazaSpatiuStocare(BUCKET),
            calculeazaSpatiuStocare(IMAGINI_BUCKET)
        ]);

        storageBox.innerHTML = `
            <div class="admin-stat-card"><strong>${formateazaBytesAdmin(pdfInfo.bytes)}</strong><span>PDF-uri (${pdfInfo.count} fișiere)</span></div>
            <div class="admin-stat-card"><strong>${formateazaBytesAdmin(imaginiInfo.bytes)}</strong><span>Imagini (${imaginiInfo.count} fișiere)</span></div>`;
    } catch (storageError) {
        storageBox.innerHTML = `<p style="color:#c62828">Spațiul de stocare nu a putut fi calculat: ${escapeHTML(storageError.message)}</p>`;
    }
}

async function incarcaDocumenteAIContAdmin() {
    const container = document.getElementById("adminContDocumenteAI");
    if (!container) return;
    container.innerHTML = "<p>Se încarcă...</p>";

    const { data, error } = await supabaseClient
        .from("documente_ai")
        .select("titlu, categorie, tip_fisier, updated_at")
        .order("updated_at", { ascending: false })
        .limit(8);

    if (error) {
        container.innerHTML = `<p style="color:#c62828">Indexul AI nu este disponibil. ${escapeHTML(error.message)}</p>`;
        return;
    }

    if (!data || !data.length) {
        container.innerHTML = "<p>Nu există încă documente indexate.</p>";
        return;
    }

    container.innerHTML = data.map(document => `
        <div class="admin-audit-row">
            <div>
                <strong>${escapeHTML(document.titlu || "Document")}</strong>
                <small>${escapeHTML(document.categorie || document.tip_fisier || "")}</small>
            </div>
            <time>${new Date(document.updated_at).toLocaleString("ro-RO")}</time>
        </div>`).join("");
}

async function incarcaRoluriContAdmin() {
    const container = document.getElementById("adminContRoluri");
    if (!container) return;
    container.innerHTML = "<p>Se încarcă...</p>";

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, email, role, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        container.innerHTML = `<p style="color:#c62828">${escapeHTML(error.message)}</p>`;
        return;
    }

    adminContProfiluri = data || [];

    if (!adminContProfiluri.length) {
        container.innerHTML = "<p>Nu există utilizatori.</p>";
        return;
    }

    container.innerHTML = adminContProfiluri.map(profil => {
        const email = escapeHTML(profil.email || profil.id);

        if (profil.role === "admin") {
            return `
                <div class="admin-role-row" data-profil-id="${escapeHTML(profil.id)}">
                    <span>${email}</span>
                    <span>🛡️ Administrator</span>
                </div>`;
        }

        return `
            <div class="admin-role-row" data-profil-id="${escapeHTML(profil.id)}">
                <span>${email}</span>
                <select data-rol-select>
                    <option value="elev" ${profil.role === "elev" ? "selected" : ""}>Elev</option>
                    <option value="profesor" ${profil.role === "profesor" ? "selected" : ""}>Profesor</option>
                </select>
                <button type="button" class="admin-btn" data-salveaza-rol>💾 Salvează</button>
                <button type="button" class="admin-btn danger" data-sterge-cont>🗑️ Șterge cont</button>
            </div>`;
    }).join("");

    container.querySelectorAll("[data-salveaza-rol]").forEach(button => {
        button.addEventListener("click", () => {
            const row = button.closest("[data-profil-id]");
            const id = row?.dataset.profilId;
            const select = row?.querySelector("[data-rol-select]");
            if (id && select) schimbaRolUtilizator(id, select.value);
        });
    });

    container.querySelectorAll("[data-sterge-cont]").forEach(button => {
        button.addEventListener("click", () => {
            const row = button.closest("[data-profil-id]");
            const id = row?.dataset.profilId;
            const profil = adminContProfiluri.find(p => String(p.id) === String(id));
            if (id) stergeContUtilizator(id, profil?.email);
        });
    });
}

async function schimbaRolUtilizator(id, rolNou) {
    const profil = adminContProfiluri.find(p => String(p.id) === String(id));

    const { error } = await supabaseClient.from("profiles").update({ role: rolNou }).eq("id", id);

    if (error) {
        alert("Rolul nu a putut fi schimbat: " + error.message);
        return;
    }

    await inregistreazaActiuneAdmin("Rol schimbat", "utilizator", profil?.email || id, { rol_nou: rolNou });
    await incarcaRoluriContAdmin();
    await incarcaJurnalContAdmin();
}

async function stergeContUtilizator(id, email) {
    if (!confirm(`Sigur vrei să ștergi definitiv contul „${email || id}”? Această acțiune este ireversibilă.`)) {
        return;
    }

    const { error } = await supabaseClient.rpc("sterge_cont_utilizator", { target_id: id });

    if (error) {
        alert("Contul nu a putut fi șters: " + error.message);
        return;
    }

    await inregistreazaActiuneAdmin("Cont șters", "utilizator", email || id);
    await incarcaRoluriContAdmin();
    await incarcaJurnalContAdmin();
    await incarcaStatisticiContAdmin();
}


async function incarcaJurnalContAdmin() {
    const container = document.getElementById("adminContJurnal");
    if (!container) return;
    container.innerHTML = "<p>Se încarcă...</p>";

    const { data, error } = await supabaseClient
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

    if (error) {
        container.innerHTML = `<p style="color:#c62828">Jurnalul nu a putut fi încărcat. (${escapeHTML(error.message)})</p>`;
        return;
    }

    if (!data || !data.length) {
        container.innerHTML = "<p>Nu există încă acțiuni înregistrate.</p>";
        return;
    }

    container.innerHTML = data.map(intrare => `
        <div class="admin-audit-row">
            <div>
                <strong>${escapeHTML(intrare.actiune)}</strong>
                ${intrare.eticheta_tinta ? `<small>${escapeHTML(intrare.tip_tinta || "")}: ${escapeHTML(intrare.eticheta_tinta)}</small>` : ""}
                <small>${escapeHTML(intrare.admin_email || "")}</small>
            </div>
            <time>${new Date(intrare.created_at).toLocaleString("ro-RO")}</time>
        </div>`).join("");
}

async function incarcaContAdmin() {
    await Promise.all([
        incarcaStatisticiContAdmin(),
        incarcaDocumenteAIContAdmin(),
        incarcaRoluriContAdmin(),
        incarcaJurnalContAdmin()
    ]);
}
