// ======================================================
// ASAMBLARE LAYOUT DIN COMPONENTE
// ======================================================

site.innerHTML = [
    NAV_HTML,
    HOME_HTML,
    LANGUAGE_HTML,
    LITERATURE_HTML,
    MAP_HTML,
    QUIZ_HTML,
    MAGAZINE_HTML,
    ADMIN_PANEL_HTML,
    LOGIN_MODAL_HTML,
    PDF_MODAL_HTML,
    AUTHOR_MODAL_HTML,
    AI_ASSISTANT_HTML,
    FOOTER_HTML,
].join("");


const loculNasteriiSelect = document.getElementById("autorLoculNasterii");
const loculNasteriiOther = document.getElementById("autorLocNastereOther");

if (loculNasteriiSelect && loculNasteriiOther) {
    loculNasteriiSelect.addEventListener("change", () => {
        loculNasteriiOther.classList.toggle(
            "ascuns",
            loculNasteriiSelect.value !== "other"
        );
        if (loculNasteriiSelect.value === "other") {
            loculNasteriiOther.focus();
        }
    });
}

