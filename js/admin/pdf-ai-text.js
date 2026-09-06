// ======================================================
// TEXT PDF PENTRU PROFESORUL AI
// Necesită PDF.js, deja inclus în index.html/admin.html.
// Funcționează pentru PDF-uri care conțin text selectabil.
// PDF-urile scanate ca imagini necesită OCR și nu sunt indexate aici.
// ======================================================

function normalizeazaTextPDF(text) {
    return String(text || "")
        .replace(/\u0000/g, "")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
}

async function extrageTextDinBufferPDF(arrayBuffer) {
    if (!window.pdfjsLib) {
        throw new Error("PDF.js nu este încărcat.");
    }

    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const documentPDF = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pagini = [];

    for (let paginaNumar = 1; paginaNumar <= documentPDF.numPages; paginaNumar += 1) {
        const pagina = await documentPDF.getPage(paginaNumar);
        const content = await pagina.getTextContent();
        const textPagina = content.items
            .map(item => typeof item.str === "string" ? item.str : "")
            .join(" ")
            .trim();

        if (textPagina) {
            pagini.push(`[Pagina ${paginaNumar}]\n${textPagina}`);
        }
    }

    return normalizeazaTextPDF(pagini.join("\n\n"));
}

async function extrageTextDinFisierPDF(fisier) {
    if (!fisier) return "";

    const estePDF =
        fisier.type === "application/pdf" ||
        /\.pdf$/i.test(fisier.name || "");

    if (!estePDF) return "";

    const buffer = await fisier.arrayBuffer();
    return extrageTextDinBufferPDF(buffer);
}

function parseazaReferintaStorage(valoare) {
    if (!valoare || typeof valoare !== "string") return null;

    if (valoare.startsWith("storage://")) {
        const rest = valoare.substring("storage://".length);
        const separator = rest.indexOf("/");
        if (separator === -1) return null;
        return {
            bucket: rest.substring(0, separator),
            cale: decodeURIComponent(rest.substring(separator + 1))
        };
    }

    return null;
}

async function extrageTextDinReferintaPDF(valoare) {
    const ref = parseazaReferintaStorage(valoare);
    if (!ref) {
        throw new Error("Referința PDF nu este o adresă Storage recunoscută.");
    }

    const { data, error } = await supabaseClient
        .storage
        .from(ref.bucket)
        .createSignedUrl(ref.cale, 60 * 10);

    if (error) throw error;
    if (!data?.signedUrl) throw new Error("Nu am putut genera URL-ul PDF-ului.");

    const response = await fetch(data.signedUrl);
    if (!response.ok) throw new Error("PDF-ul nu a putut fi descărcat pentru indexare.");

    const buffer = await response.arrayBuffer();
    return extrageTextDinBufferPDF(buffer);
}

const MAPARE_TEXT_OPERA = {
    pdf: "continut_rezumat",
    pdf_analiza_literara: "continut_analiza_literara",
    pdf_valori_morale: "continut_valori_morale",
    pdf_caracterizare: "continut_caracterizare"
};

async function indexeazaPDFuriOpera(operaId) {
    const status = document.getElementById(`inlocuireStatus-${operaId}`);

    try {
        if (status) {
            status.textContent = "Se citesc PDF-urile pentru Profesorul AI...";
            status.style.color = "#7b2450";
        }

        const { data: opera, error } = await supabaseClient
            .from("opere")
            .select("id, pdf, pdf_analiza_literara, pdf_valori_morale, pdf_caracterizare")
            .eq("id", operaId)
            .single();

        if (error) throw error;

        const update = {};
        let indexate = 0;
        let faraText = 0;

        for (const [coloanaPDF, coloanaText] of Object.entries(MAPARE_TEXT_OPERA)) {
            const referinta = opera?.[coloanaPDF];
            if (!referinta) continue;

            try {
                const text = await extrageTextDinReferintaPDF(referinta);
                if (text) {
                    update[coloanaText] = text;
                    indexate += 1;
                } else {
                    faraText += 1;
                }
            } catch (err) {
                console.warn(`Nu am indexat ${coloanaPDF}:`, err);
                faraText += 1;
            }
        }

        if (Object.keys(update).length) {
            const rezultat = await supabaseClient
                .from("opere")
                .update(update)
                .eq("id", operaId);
            if (rezultat.error) throw rezultat.error;
        }

        if (status) {
            status.textContent = indexate
                ? `AI: ${indexate} PDF-uri indexate${faraText ? `; ${faraText} fără text selectabil` : ""}.`
                : "Nu am găsit text selectabil în PDF-uri. Dacă sunt scanate, este necesar OCR.";
            status.style.color = indexate ? "#2e7d32" : "#c62828";
        }

        await incarcaOpereAdmin();
    } catch (error) {
        console.error("Indexare PDF operă:", error);
        if (status) {
            status.textContent = "Indexarea a eșuat: " + error.message;
            status.style.color = "#c62828";
        }
    }
}

async function indexeazaMaterialLimba(materialId) {
    try {
        const { data: material, error } = await supabaseClient
            .from("limba_materiale")
            .select("id, pdf")
            .eq("id", materialId)
            .single();

        if (error) throw error;
        if (!material?.pdf) throw new Error("Materialul nu are PDF.");

        const text = await extrageTextDinReferintaPDF(material.pdf);
        if (!text) {
            alert("Nu am găsit text selectabil. PDF-ul poate fi scanat ca imagine.");
            return;
        }

        const rezultat = await supabaseClient
            .from("limba_materiale")
            .update({ continut_ai: text })
            .eq("id", materialId);

        if (rezultat.error) throw rezultat.error;

        alert("PDF-ul a fost indexat pentru Profesorul AI.");
        await incarcaLimbaAdmin();
    } catch (error) {
        console.error("Indexare material Limba română:", error);
        alert("Nu am putut indexa PDF-ul: " + error.message);
    }
}
