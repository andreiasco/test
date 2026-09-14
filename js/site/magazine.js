// ======================================================
// REVISTA - lista numerelor publicate (public + descărcare autentificată)
// ======================================================

let revistaNumereSiteCache = [];

async function incarcaRevista() {
    const container = document.getElementById("listaNumereRevistaSite");
    if (!container) return;
    container.innerHTML = "<p>Se încarcă...</p>";

    try {
        const { data, error } = await supabaseClient
            .from("reviste_numere")
            .select("id, titlu, descriere, storage_path, nume_fisier, publicat_la")
            .order("publicat_la", { ascending: false });
        if (error) throw error;

        revistaNumereSiteCache = data || [];

        if (!revistaNumereSiteCache.length) {
            container.innerHTML = `
                <div class="card" style="text-align:center;">
                    <div class="icon">📰</div>
                    <h3>În curând</h3>
                    <p>Nu există încă niciun număr publicat. Revino în curând!</p>
                </div>`;
            return;
        }

        container.innerHTML = revistaNumereSiteCache.map(numar => `
            <div class="card">
                <h3>${escapeHTML(numar.titlu)}</h3>
                ${numar.descriere ? `<p>${escapeHTML(numar.descriere)}</p>` : ""}
                <small>${new Date(numar.publicat_la).toLocaleDateString("ro-RO")}</small><br>
                <button class="admin-btn" type="button" onclick="deschideNumarRevista(${numar.id})">📖 Deschide</button>
            </div>`).join("");
    } catch (error) {
        console.error("Eroare încărcare revistă:", error);
        container.innerHTML = `<p style="color:#c62828">Revista nu a putut fi încărcată momentan.</p>`;
    }
}

async function deschideNumarRevista(id) {
    const numar = revistaNumereSiteCache.find(item => item.id === id);
    if (!numar) return;

    const { data: sesiuneData } = await supabaseClient.auth.getSession();
    if (!sesiuneData?.session) {
        alert("Autentifică-te pentru a deschide revista.");
        afiseazaLogin();
        return;
    }

    try {
        const { data, error } = await supabaseClient.storage
            .from("RevistaNumere")
            .createSignedUrl(numar.storage_path, 5 * 60);
        if (error) throw error;
        window.open(data.signedUrl, "_blank", "noopener");
    } catch (error) {
        console.error("Eroare deschidere revistă:", error);
        alert("Nu am putut deschide revista: " + error.message);
    }
}

window.incarcaRevista = incarcaRevista;
window.deschideNumarRevista = deschideNumarRevista;
