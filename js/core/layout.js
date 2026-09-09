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

// Inaltimea reala a navbarului (variaza cand meniul se rupe pe mai multe randuri),
// folosita ca variabila CSS pentru a evita suprapunerea barei sticky peste continut.
(function sincronizeazaInaltimeNav() {
    const nav = document.querySelector("nav");
    if (!nav) return;

    const actualizeaza = () => {
        document.documentElement.style.setProperty("--site-nav-height", `${nav.offsetHeight}px`);
    };

    actualizeaza();
    window.addEventListener("resize", actualizeaza);
    window.addEventListener("orientationchange", actualizeaza);
})();

