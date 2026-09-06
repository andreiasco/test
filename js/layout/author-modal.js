// Componentă de layout: author-modal.js
const AUTHOR_MODAL_HTML = `

<div
    id="autorPopupModal"
    class="autor-popup-modal ascuns"
    role="dialog"
    aria-modal="true"
    aria-labelledby="autorPopupTitlu">

    <div class="autor-popup-box">
        <button
            type="button"
            class="autor-popup-inchide"
            onclick="inchideAutorPopup()"
            aria-label="Închide autorul">×</button>
        <div id="autorPopupContent"></div>
    </div>

</div>
`;
