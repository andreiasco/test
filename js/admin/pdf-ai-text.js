// ======================================================
// TEXT PDF / DOCX PENTRU PROFESORUL AI
// ======================================================
//
// Necesită:
// - PDF.js pentru PDF-uri cu text selectabil
// - Mammoth.js pentru fișiere DOCX
//
// PDF-urile generate ca imagini nu pot fi citite de PDF.js.
// Pentru rezumat, dacă PDF-ul nu are text, sistemul încearcă
// automat fișierul rezumat_word în format .docx.
//
// Fișierele .doc vechi nu sunt acceptate.
// Ele trebuie convertite în .docx.
// ======================================================


// ======================================================
// NORMALIZARE TEXT
// ======================================================

function normalizeazaTextAI(text) {
    return String(text || "")
        .replace(/\u0000/g, "")
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
}

function normalizeazaTextPDF(text) {
    return normalizeazaTextAI(text);
}


// ======================================================
// EXTRAGERE TEXT DIN PDF
// ======================================================

async function extrageTextDinBufferPDF(arrayBuffer) {
    if (!window.pdfjsLib) {
        throw new Error("PDF.js nu este încărcat.");
    }

    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const documentPDF = await window.pdfjsLib.getDocument({
        data: arrayBuffer
    }).promise;

    const pagini = [];

    for (
        let paginaNumar = 1;
        paginaNumar <= documentPDF.numPages;
        paginaNumar += 1
    ) {
        const pagina = await documentPDF.getPage(paginaNumar);

        const content = await pagina.getTextContent();

        const textPagina = content.items
            .map(item =>
                typeof item.str === "string"
                    ? item.str
                    : ""
            )
            .join(" ")
            .trim();

        if (textPagina) {
            pagini.push(
                `[Pagina ${paginaNumar}]\n${textPagina}`
            );
        }
    }

    return normalizeazaTextAI(
        pagini.join("\n\n")
    );
}


async function extrageTextDinFisierPDF(fisier) {
    if (!fisier) return "";

    const estePDF =
        fisier.type === "application/pdf" ||
        /\.pdf$/i.test(fisier.name || "");

    if (!estePDF) {
        return "";
    }

    const buffer = await fisier.arrayBuffer();

    return extrageTextDinBufferPDF(buffer);
}


// ======================================================
// EXTRAGERE TEXT DIN DOCX
// ======================================================

async function extrageTextDinBufferDOCX(arrayBuffer) {
    if (!window.mammoth) {
        throw new Error(
            "Mammoth.js nu este încărcat."
        );
    }

    const rezultat =
        await window.mammoth.extractRawText({
            arrayBuffer: arrayBuffer
        });

    return normalizeazaTextAI(
        rezultat?.value || ""
    );
}


async function extrageTextDinFisierDOCX(fisier) {
    if (!fisier) return "";

    const nume = String(
        fisier.name || ""
    );

    if (/\.doc$/i.test(nume)) {
        throw new Error(
            "Formatul .doc vechi nu este acceptat. " +
            "Salvează documentul ca .docx."
        );
    }

    const esteDOCX =
        /\.docx$/i.test(nume) ||
        fisier.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (!esteDOCX) {
        return "";
    }

    const buffer =
        await fisier.arrayBuffer();

    return extrageTextDinBufferDOCX(
        buffer
    );
}


// ======================================================
// STORAGE
// ======================================================

function parseazaReferintaStorage(valoare) {
    if (
        !valoare ||
        typeof valoare !== "string"
    ) {
        return null;
    }

    if (
        valoare.startsWith("storage://")
    ) {
        const rest =
            valoare.substring(
                "storage://".length
            );

        const separator =
            rest.indexOf("/");

        if (separator === -1) {
            return null;
        }

        return {
            bucket:
                rest.substring(
                    0,
                    separator
                ),

            cale:
                decodeURIComponent(
                    rest.substring(
                        separator + 1
                    )
                )
        };
    }

    return null;
}


function extensieDinReferinta(valoare) {
    const text =
        String(valoare || "")
            .split("?")[0]
            .toLowerCase();

    if (text.endsWith(".docx")) {
        return "docx";
    }

    if (text.endsWith(".doc")) {
        return "doc";
    }

    if (text.endsWith(".pdf")) {
        return "pdf";
    }

    return "";
}


async function descarcaReferintaCaBuffer(
    valoare
) {
    if (
        !valoare ||
        typeof valoare !== "string"
    ) {
        throw new Error(
            "Referința fișierului lipsește."
        );
    }

    let url = valoare;

    const ref =
        parseazaReferintaStorage(
            valoare
        );

    if (ref) {
        const {
            data,
            error
        } = await supabaseClient
            .storage
            .from(ref.bucket)
            .createSignedUrl(
                ref.cale,
                60 * 10
            );

        if (error) {
            throw error;
        }

        if (!data?.signedUrl) {
            throw new Error(
                "Nu am putut genera URL-ul temporar al fișierului."
            );
        }

        url = data.signedUrl;

    } else if (
        !/^https?:\/\//i.test(
            valoare
        )
    ) {
        throw new Error(
            "Referința fișierului nu este recunoscută."
        );
    }

    const response =
        await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Fișierul nu a putut fi descărcat (${response.status}).`
        );
    }

    return response.arrayBuffer();
}


// ======================================================
// PDF DIN STORAGE
// ======================================================

async function extrageTextDinReferintaPDF(
    valoare
) {
    const buffer =
        await descarcaReferintaCaBuffer(
            valoare
        );

    return extrageTextDinBufferPDF(
        buffer
    );
}


// ======================================================
// DOCX DIN STORAGE
// ======================================================

async function extrageTextDinReferintaDOCX(
    valoare
) {
    const extensie =
        extensieDinReferinta(
            valoare
        );

    if (extensie === "doc") {
        throw new Error(
            "Fișierul este în format .doc vechi. " +
            "Convertește-l în .docx."
        );
    }

    if (
        extensie &&
        extensie !== "docx"
    ) {
        throw new Error(
            "Fișierul Word trebuie să fie .docx."
        );
    }

    const buffer =
        await descarcaReferintaCaBuffer(
            valoare
        );

    return extrageTextDinBufferDOCX(
        buffer
    );
}


// ======================================================
// MAPARE COLOANE OPERE
// ======================================================

const MAPARE_TEXT_OPERA = {

    pdf:
        "continut_rezumat",

    pdf_analiza_literara:
        "continut_analiza_literara",

    pdf_valori_morale:
        "continut_valori_morale",

    pdf_caracterizare:
        "continut_caracterizare"
};


// ======================================================
// INDEXARE OPERĂ
// ======================================================

async function indexeazaPDFuriOpera(
    operaId
) {
    const status =
        document.getElementById(
            `inlocuireStatus-${operaId}`
        );

    try {

        if (status) {
            status.textContent =
                "Se citesc materialele pentru Profesorul AI...";

            status.style.color =
                "#7b2450";
        }


        // ----------------------------------------------
        // CITIM OPERA
        // ----------------------------------------------

        const {
            data: opera,
            error
        } = await supabaseClient
            .from("opere")
            .select(`
                id,
                pdf,
                pdf_analiza_literara,
                pdf_valori_morale,
                pdf_caracterizare,
                rezumat_word
            `)
            .eq("id", operaId)
            .single();


        if (error) {
            throw error;
        }


        const update = {};

        let pdfIndexate = 0;

        let docxIndexate = 0;

        let faraText = 0;

        const erori = [];


        // ==================================================
        // 1. ÎNCERCĂM PDF-URILE
        // ==================================================

        for (
            const [
                coloanaPDF,
                coloanaText
            ]
            of Object.entries(
                MAPARE_TEXT_OPERA
            )
        ) {

            const referinta =
                opera?.[coloanaPDF];

            if (!referinta) {
                continue;
            }


            try {

                const text =
                    await extrageTextDinReferintaPDF(
                        referinta
                    );


                if (text) {

                    update[
                        coloanaText
                    ] = text;

                    pdfIndexate += 1;

                    console.log(
                        `AI: ${coloanaPDF} indexat din PDF.`
                    );

                } else {

                    faraText += 1;

                    console.warn(
                        `${coloanaPDF} nu conține text selectabil.`
                    );
                }


            } catch (err) {

                console.warn(
                    `Nu am indexat ${coloanaPDF}:`,
                    err
                );

                faraText += 1;

                erori.push(
                    `${coloanaPDF}: ${err.message}`
                );
            }
        }


        // ==================================================
        // 2. FALLBACK DOCX PENTRU REZUMAT
        // ==================================================
        //
        // Dacă PDF-ul rezumatului este o imagine
        // și nu avem continut_rezumat,
        // încercăm rezumat_word.
        // ==================================================

        if (
            !update.continut_rezumat &&
            opera?.rezumat_word
        ) {

            try {

                const extensie =
                    extensieDinReferinta(
                        opera.rezumat_word
                    );


                if (
                    extensie === "doc"
                ) {

                    erori.push(
                        "rezumat_word este .doc; convertește-l în .docx."
                    );

                } else {

                    const textWord =
                        await extrageTextDinReferintaDOCX(
                            opera.rezumat_word
                        );


                    if (textWord) {

                        update.continut_rezumat =
                            textWord;

                        docxIndexate += 1;

                        console.log(
                            "AI: rezumatul a fost indexat din DOCX."
                        );

                    } else {

                        erori.push(
                            "Fișierul rezumat_word nu conține text."
                        );
                    }
                }


            } catch (err) {

                console.warn(
                    "Nu am indexat rezumat_word:",
                    err
                );

                erori.push(
                    `rezumat_word: ${err.message}`
                );
            }
        }


        // ==================================================
        // 3. SALVARE ÎN SUPABASE
        // ==================================================

        if (
            Object.keys(update).length
        ) {

            const rezultat =
                await supabaseClient
                    .from("opere")
                    .update(update)
                    .eq(
                        "id",
                        operaId
                    );


            if (rezultat.error) {
                throw rezultat.error;
            }
        }


        // ==================================================
        // 4. MESAJ ADMIN
        // ==================================================

        if (status) {

            if (
                Object.keys(update).length
            ) {

                const parti = [];


                if (pdfIndexate) {
                    parti.push(
                        `${pdfIndexate} PDF`
                    );
                }


                if (docxIndexate) {
                    parti.push(
                        `${docxIndexate} DOCX`
                    );
                }


                status.textContent =
                    `AI: indexare reușită (${parti.join(" + ")}).`;


                if (faraText) {

                    status.textContent +=
                        ` ${faraText} PDF-uri nu au avut text selectabil.`;
                }


                status.style.color =
                    "#2e7d32";


            } else {

                status.textContent =
                    "Nu am găsit text indexabil. " +
                    "Dacă PDF-ul este format din imagini, " +
                    "adaugă un fișier .docx pentru rezumat.";


                if (erori.length) {

                    status.textContent +=
                        " Detalii: " +
                        erori.join("; ");
                }


                status.style.color =
                    "#c62828";
            }
        }


        // ==================================================
        // 5. REÎNCĂRCARE LISTĂ ADMIN
        // ==================================================

        if (
            typeof incarcaOpereAdmin ===
            "function"
        ) {

            await incarcaOpereAdmin();
        }


    } catch (error) {

        console.error(
            "Indexare operă pentru AI:",
            error
        );


        if (status) {

            status.textContent =
                "Indexarea a eșuat: " +
                error.message;

            status.style.color =
                "#c62828";
        }
    }
}


// ======================================================
// INDEXARE MATERIAL LIMBA ROMÂNĂ
// ======================================================

async function indexeazaMaterialLimba(
    materialId
) {

    try {

        const {
            data: material,
            error
        } = await supabaseClient
            .from("limba_materiale")
            .select(
                "id, pdf"
            )
            .eq(
                "id",
                materialId
            )
            .single();


        if (error) {
            throw error;
        }


        if (!material?.pdf) {

            throw new Error(
                "Materialul nu are PDF."
            );
        }


        const text =
            await extrageTextDinReferintaPDF(
                material.pdf
            );


        if (!text) {

            alert(
                "Nu am găsit text selectabil în PDF. " +
                "PDF-ul poate fi format din imagini."
            );

            return;
        }


        const rezultat =
            await supabaseClient
                .from(
                    "limba_materiale"
                )
                .update({
                    continut_ai: text
                })
                .eq(
                    "id",
                    materialId
                );


        if (rezultat.error) {
            throw rezultat.error;
        }


        alert(
            "PDF-ul a fost indexat pentru Profesorul AI."
        );


        if (
            typeof incarcaLimbaAdmin ===
            "function"
        ) {

            await incarcaLimbaAdmin();
        }


    } catch (error) {

        console.error(
            "Indexare material Limba română:",
            error
        );


        alert(
            "Nu am putut indexa PDF-ul: " +
            error.message
        );
    }
}


// ======================================================
// EXPUNERE GLOBALĂ
// ======================================================

window.PDFAI = {

    normalizeazaTextAI,

    normalizeazaTextPDF,

    extrageTextDinBufferPDF,

    extrageTextDinFisierPDF,

    extrageTextDinReferintaPDF,

    extrageTextDinBufferDOCX,

    extrageTextDinFisierDOCX,

    extrageTextDinReferintaDOCX,

    indexeazaPDFuriOpera,

    indexeazaMaterialLimba
};


// ======================================================
// INDEX GENERAL DOCUMENTE PENTRU PROFESORUL AI
// ======================================================
// Salvează textul extras din orice PDF/DOCX încărcat în tabelul
// documente_ai. Dacă tabelul nu a fost creat încă, upload-ul normal
// continuă, iar în consolă apare doar un avertisment.

function tipDocumentAI(fisierSauNume) {
    const nume = typeof fisierSauNume === "string"
        ? fisierSauNume
        : String(fisierSauNume?.name || "");
    const lower = nume.toLowerCase().split("?")[0];
    if (lower.endsWith(".pdf")) return "pdf";
    if (lower.endsWith(".docx")) return "docx";
    if (lower.endsWith(".doc")) return "doc";
    if (lower.endsWith(".txt")) return "txt";
    return "";
}

async function extrageTextDinFisierAI(fisier) {
    if (!fisier) return "";
    const tip = tipDocumentAI(fisier);

    if (tip === "pdf") return extrageTextDinFisierPDF(fisier);
    if (tip === "docx") return extrageTextDinFisierDOCX(fisier);
    if (tip === "txt") return normalizeazaTextAI(await fisier.text());
    if (tip === "doc") {
        throw new Error("Formatul .doc vechi nu poate fi citit. Convertește documentul în .docx.");
    }
    return "";
}

async function salveazaDocumentAI({
    sourceKey,
    sourceType,
    sourceId,
    title,
    category,
    file,
    storageRef,
    text,
    metadata = {}
}) {
    const continut = normalizeazaTextAI(text || "");
    if (!sourceKey || !continut) return { skipped: true };

    const payload = {
        source_key: String(sourceKey),
        source_type: String(sourceType || "document"),
        source_id: sourceId == null ? null : String(sourceId),
        titlu: String(title || file?.name || "Document"),
        categorie: category ? String(category) : null,
        nume_fisier: file?.name ? String(file.name) : null,
        tip_fisier: tipDocumentAI(file || storageRef) || null,
        storage_ref: storageRef ? String(storageRef) : null,
        text_extras: continut,
        metadata: metadata || {},
        updated_at: new Date().toISOString()
    };

    const { error } = await supabaseClient
        .rpc("upsert_document_ai", { p_document: payload });

    if (error) {
        console.warn("Documentul a fost salvat, dar indexul general AI nu a putut fi actualizat:", error);
        return { error };
    }

    return { ok: true };
}

async function stergeDocumenteAISursa(sourceType, sourceId) {
    if (!sourceType || sourceId == null) return;
    const { error } = await supabaseClient
        .rpc("delete_documente_ai_source", {
            p_source_type: String(sourceType),
            p_source_id: String(sourceId)
        });
    if (error) console.warn("Nu am putut curăța indexul AI:", error);
}


// ======================================================
// BACKFILL: DOCUMENTELE DEJA ÎNCĂRCATE
// ======================================================

async function extrageTextDinReferintaAI(valoare) {
    const tip = extensieDinReferinta(valoare);
    if (tip === "pdf") return extrageTextDinReferintaPDF(valoare);
    if (tip === "docx") return extrageTextDinReferintaDOCX(valoare);
    if (tip === "doc") return "";
    return "";
}

async function indexeazaToateDocumenteleAI() {
    const status = document.getElementById("aiDocumenteStatus");
    const scrieStatus = (mesaj, eroare = false) => {
        if (status) {
            status.textContent = mesaj;
            status.style.color = eroare ? "#c62828" : "#2e7d32";
        }
    };

    try {
        scrieStatus("Se indexează documentele existente...");
        let indexate = 0;
        let sarite = 0;

        const { data: opere, error: opereError } = await supabaseClient
            .from("opere")
            .select("id, autor_id, titlu, pdf, pdf_analiza_literara, pdf_valori_morale, pdf_caracterizare, rezumat_word, personaje_instagram, continut_rezumat, continut_analiza_literara, continut_valori_morale, continut_caracterizare")
            .limit(1000);
        if (opereError) throw opereError;

        const configurariOpera = [
            ["pdf", "Rezumat", "continut_rezumat"],
            ["pdf_analiza_literara", "Analiză literară", "continut_analiza_literara"],
            ["pdf_valori_morale", "Valori morale", "continut_valori_morale"],
            ["pdf_caracterizare", "Caracterizare", "continut_caracterizare"],
            ["rezumat_word", "Rezumat scris", null],
            ["personaje_instagram", "Personaje", null]
        ];

        for (const opera of opere || []) {
            for (const [coloana, categorie, coloanaText] of configurariOpera) {
                const ref = opera[coloana];
                if (!ref) continue;
                let text = coloanaText ? String(opera[coloanaText] || "") : "";
                if (!text) {
                    try { text = await extrageTextDinReferintaAI(ref); }
                    catch (e) { console.warn(`Nu am putut citi ${coloana} pentru opera ${opera.id}:`, e); }
                }
                if (!text) { sarite += 1; continue; }
                const rezultat = await salveazaDocumentAI({
                    sourceKey: `opera:${opera.id}:${coloana}`,
                    sourceType: "opera",
                    sourceId: opera.id,
                    title: `${opera.titlu || "Operă"} — ${categorie}`,
                    category: categorie,
                    storageRef: ref,
                    text,
                    metadata: { opera_titlu: opera.titlu || null, autor_id: opera.autor_id }
                });
                if (rezultat?.ok) indexate += 1; else sarite += 1;
            }
        }

        const { data: materiale, error: materialeError } = await supabaseClient
            .from("limba_materiale")
            .select("id, capitol_id, titlu, descriere, pdf, continut_ai")
            .limit(1000);
        if (materialeError) throw materialeError;

        for (const material of materiale || []) {
            if (!material.pdf) continue;
            let text = String(material.continut_ai || "");
            if (!text) {
                try { text = await extrageTextDinReferintaAI(material.pdf); }
                catch (e) { console.warn(`Nu am putut citi materialul ${material.id}:`, e); }
            }
            if (!text) { sarite += 1; continue; }
            const rezultat = await salveazaDocumentAI({
                sourceKey: `limba_material:${material.id}:pdf`,
                sourceType: "limba_material",
                sourceId: material.id,
                title: material.titlu || "Material Limba română",
                category: "Limba română",
                storageRef: material.pdf,
                text,
                metadata: { capitol_id: material.capitol_id, descriere: material.descriere || null }
            });
            if (rezultat?.ok) indexate += 1; else sarite += 1;
        }

        scrieStatus(`Indexare terminată: ${indexate} documente disponibile pentru Profesorul AI${sarite ? `, ${sarite} fără text citibil` : ""}.`);
        return { indexate, sarite };
    } catch (error) {
        console.error("Indexare generală AI:", error);
        scrieStatus("Indexarea documentelor a eșuat: " + (error?.message || error), true);
        return { error };
    }
}

window.indexeazaToateDocumenteleAI = indexeazaToateDocumenteleAI;
