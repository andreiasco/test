// ======================================================
// DESCHIDE PDF PRIVAT CU URL SEMNAT
// ======================================================

async function deschidePDF(pdfUrl) {

    if (!pdfUrl) {

        alert(
            "PDF-ul nu există."
        );

        return;
    }

    try {

        const cale =
            obtineCalePDF(pdfUrl);


        console.log(
            "Referință PDF:",
            pdfUrl
        );

        console.log(
            "Cale PDF în Storage:",
            cale
        );


        if (!cale) {

            alert(
                "Nu am putut identifica fișierul PDF."
            );

            return;
        }


        const {
            data,
            error
        } =
            await supabaseClient
                .storage
                .from(BUCKET)
                .createSignedUrl(
                    cale,
                    60 * 60
                );


        if (error) {

            console.error(
                "Eroare URL semnat:",
                error
            );

            alert(
                "Nu am putut deschide PDF-ul: " +
                error.message
            );

            return;
        }


        if (
            !data ||
            !data.signedUrl
        ) {

            console.error(
                "Nu există signedUrl:",
                data
            );

            alert(
                "Supabase nu a returnat URL-ul PDF-ului."
            );

            return;
        }


        console.log(
            "URL PDF semnat:",
            data.signedUrl
        );


        const { data: sesiuneData, error: sesiuneError } = await supabaseClient.auth.getSession();
        if (sesiuneError) {
            throw sesiuneError;
        }

        await deschidePrevizualizarePDF(data.signedUrl, Boolean(sesiuneData.session));


    } catch (error) {

        console.error(
            "Eroare deschidere PDF:",
            error
        );

        alert(
            "A apărut o eroare la deschiderea PDF-ului: " +
            error.message
        );

    }

}

let pdfPreviewRenderId = 0;
let pdfPreviewDownloadUrl = "";

async function deschidePrevizualizarePDF(signedUrl, esteAutentificat = false) {
    const modal = document.getElementById("pdfPreviewModal");
    const pages = document.getElementById("pdfPreviewPages");
    const titlu = document.getElementById("pdfPreviewTitlu");
    const downloadButton = document.getElementById("pdfPreviewDownload");
    if (!modal || !pages || !downloadButton || !window.pdfjsLib) {
        return;
    }

    const renderId = ++pdfPreviewRenderId;
    pdfPreviewDownloadUrl = esteAutentificat ? signedUrl : "";
    downloadButton.classList.toggle("ascuns", !esteAutentificat);
    titlu.textContent = esteAutentificat ? "Vizualizare material" : "Previzualizare material";
    pages.innerHTML = "<p class=\"pdf-preview-loading\">Se încarcă previzualizarea...</p>";
    modal.classList.remove("ascuns");
    document.body.style.overflow = "hidden";

    try {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        const response = await fetch(signedUrl);
        if (!response.ok) {
            throw new Error("PDF-ul nu a putut fi încărcat.");
        }

        const documentData = await response.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: documentData }).promise;
        pages.innerHTML = "";

        const numarPaginiAfisate = esteAutentificat ? pdf.numPages : Math.min(pdf.numPages, 1);
        for (let pageNumber = 1; pageNumber <= numarPaginiAfisate; pageNumber += 1) {
            if (renderId !== pdfPreviewRenderId) {
                return;
            }

            const page = await pdf.getPage(pageNumber);
            const initialViewport = page.getViewport({ scale: 1 });
            const availableWidth = Math.max(pages.clientWidth - 32, 1);
            const scale = Math.min(1.5, availableWidth / initialViewport.width);
            const viewport = page.getViewport({ scale });
            const pageWrapper = document.createElement("div");
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d", { alpha: false });
            pageWrapper.className = "pdf-preview-page-wrapper";
            if (!esteAutentificat) {
                pageWrapper.style.maxHeight = `${Math.ceil(viewport.height * .25)}px`;
            }
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            canvas.className = "pdf-preview-page";
            canvas.setAttribute("aria-label", `Pagina ${pageNumber} din ${pdf.numPages}`);
            pageWrapper.appendChild(canvas);
            pages.appendChild(pageWrapper);

            await page.render({ canvasContext: context, viewport }).promise;
        }

        if (!esteAutentificat) {
            const notice = document.createElement("div");
            notice.className = "pdf-preview-notice";
            notice.innerHTML = `
                <strong>Previzualizare limitată</strong>
                <span>Autentifică-te pentru a deschide materialul complet.</span>
                <button type="button" onclick="inchidePrevizualizarePDF(); afiseazaLogin()">Autentificare</button>
            `;
            pages.appendChild(notice);
        }
    } catch (error) {
        console.error("Eroare previzualizare PDF:", error);
        pages.innerHTML = "<p class=\"pdf-preview-error\">Nu am putut încărca previzualizarea acestui material.</p>";
    }
}

function inchidePrevizualizarePDF() {
    const modal = document.getElementById("pdfPreviewModal");
    const pages = document.getElementById("pdfPreviewPages");
    if (!modal || !pages) {
        return;
    }

    pdfPreviewRenderId += 1;
    pdfPreviewDownloadUrl = "";
    pages.replaceChildren();
    modal.classList.add("ascuns");
    document.body.style.overflow = "";
}

async function descarcaPDFPrevizualizat() {
    if (!pdfPreviewDownloadUrl) {
        return;
    }

    try {
        const response = await fetch(pdfPreviewDownloadUrl);
        if (!response.ok) {
            throw new Error("PDF-ul nu a putut fi descărcat.");
        }

        const blobUrl = URL.createObjectURL(await response.blob());
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = "material.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error("Eroare descărcare PDF:", error);
        alert("Nu am putut descărca materialul.");
    }
}

async function obtineURLSemnat(valoare, optiuni = {}) {

    const cale = obtineCalePDF(valoare);

    if (!cale) {
        throw new Error("Nu am putut identifica fișierul din Storage.");
    }

    const { data, error } =
        await supabaseClient
            .storage
            .from(BUCKET)
            .createSignedUrl(cale, 60 * 60, optiuni);

    if (error) {
        throw error;
    }

    if (!data || !data.signedUrl) {
        throw new Error("Supabase nu a returnat URL-ul semnat.");
    }

    return data.signedUrl;
}

async function descarcaRezumatWord(wordUrl) {

    if (!wordUrl) {
        alert("Rezumatul Word nu există.");
        return;
    }

    try {

        const urlSemnat =
            await obtineURLSemnat(wordUrl, { download: true });

        const link = document.createElement("a");
        link.href = urlSemnat;
        link.download = "rezumat.docx";
        document.body.appendChild(link);
        link.click();
        link.remove();

    } catch (error) {
        console.error("Eroare descărcare rezumat Word:", error);
        alert("Nu am putut descărca rezumatul Word.");
    }
}


// ======================================================
