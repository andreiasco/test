// Componentă de layout: pdf-modal.js
const PDF_MODAL_HTML = `

<div
    id="pdfPreviewModal"
    class="pdf-preview-modal ascuns"
    role="dialog"
    aria-modal="true"
    aria-labelledby="pdfPreviewTitlu">

    <div class="pdf-preview-box">
        <div class="pdf-preview-header">
            <h2 id="pdfPreviewTitlu">Vizualizare material</h2>
            <div class="pdf-preview-actions">
                <button
                    id="pdfPreviewDownload"
                    type="button"
                    class="pdf-preview-download ascuns"
                    onclick="descarcaPDFPrevizualizat()">Descarcă</button>
                <button
                    type="button"
                    class="pdf-preview-inchide"
                    onclick="inchidePrevizualizarePDF()"
                    aria-label="Închide previzualizarea">×</button>
            </div>
        </div>

        <div
            id="pdfPreviewPages"
            class="pdf-preview-pages"
            aria-label="Paginile materialului PDF"
            oncontextmenu="return false;"></div>
    </div>

</div>
`;
