// ======================================================
// ÎNCARCĂ MATERIALELE DE LIMBĂ
// ======================================================

async function incarcaMaterialeLimba() {

    const container = document.getElementById("limbaClase");

    if (!container) {
        return;
    }

    container.innerHTML = "<p style='text-align:center'>Se încarcă materialele...</p>";

    try {
        const { data: clase, error: eroareClase } = await supabaseClient
            .from("limba_clase")
            .select("id, numar, titlu")
            .order("numar", { ascending: true });

        if (eroareClase) {
            throw eroareClase;
        }

        const { data: capitole, error: eroareCapitole } = await supabaseClient
            .from("limba_capitole")
            .select("id, clasa_id, titlu, descriere, ordine")
            .order("ordine", { ascending: true })
            .order("titlu", { ascending: true });

        if (eroareCapitole) {
            throw eroareCapitole;
        }

        const { data: materiale, error: eroareMateriale } = await supabaseClient
            .from("limba_materiale")
            .select("id, capitol_id, titlu, descriere, pdf, ordine")
            .order("ordine", { ascending: true })
            .order("titlu", { ascending: true });

        if (eroareMateriale) {
            throw eroareMateriale;
        }

        if (!clase || clase.length === 0) {
            container.innerHTML = "<p style='text-align:center'>Momentan nu există materiale pentru Limba română.</p>";
            return;
        }

        container.innerHTML = clase.map(clasa => {
            const capitoleClasa = (capitole || []).filter(
                capitol => String(capitol.clasa_id) === String(clasa.id)
            );

            const capitoleHTML = capitoleClasa.map(capitol => {
                const materialeCapitol = (materiale || []).filter(
                    material => String(material.capitol_id) === String(capitol.id)
                );

                const materialeHTML = materialeCapitol.length > 0
                    ? materialeCapitol.map(material => `
                        <div class="material-limba">
                            <div>
                                <strong>${escapeHTML(material.titlu)}</strong>
                                ${material.descriere ? `<p>${escapeHTML(material.descriere)}</p>` : ""}
                            </div>
                            <button class="opera-btn" type="button"
                                onclick='deschidePDF(${JSON.stringify(material.pdf)})'>
                                📄 Deschide PDF
                            </button>
                        </div>
                    `).join("")
                    : "<p>Nu există materiale în acest capitol.</p>";

                return `
                    <article class="capitol-limba">
                        <h4>${escapeHTML(capitol.titlu)}</h4>
                        ${capitol.descriere ? `<p>${escapeHTML(capitol.descriere)}</p>` : ""}
                        <div class="materiale-limba">${materialeHTML}</div>
                    </article>
                `;
            }).join("");

            return `
                <section id="limba-clasa-${clasa.numar}" class="limba-clasa">
                    <h2 class="titlu">${escapeHTML(clasa.titlu || `Clasa a ${clasa.numar}-a`)}</h2>
                    <p class="subtitlu limba-clasa-descriere">${escapeHTML(
                {
                    5: "Noțiuni de bază de gramatică, vocabular, ortografie și comunicare.",
                    6: "Consolidarea gramaticii, a vocabularului și a înțelegerii textului.",
                    7: "Sintaxa frazei, vocabularul și exprimarea clară în contexte diverse.",
                    8: "Recapitulare și aprofundare pentru comunicare și evaluarea de la finalul gimnaziului."
                }[clasa.numar] || "Gramatică, vocabular, ortografie și comunicare.")}</p>
                    <div class="capitole-limba">
                        ${capitoleHTML || "<p>Nu există capitole definite pentru această clasă.</p>"}
                    </div>
                </section>
            `;
        }).join("");
    } catch (error) {
        console.error("Eroare încărcare materiale Limba română:", error);
        container.innerHTML = "<p style='color:#c62828;text-align:center'>Nu am putut încărca materialele de limbă.</p>";
    }
}




