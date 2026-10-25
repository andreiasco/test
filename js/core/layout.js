// ======================================================
// ASAMBLARE LAYOUT DIN COMPONENTE
// ======================================================

site.innerHTML = [
    NAV_HTML,
    HOME_HTML,
    ALMA_HUBS_HTML,
    EDUCATION_PAGES_HTML,
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

// Keep navigation on one row; move only the links that do not fit into More.
(function initializeazaNavigareAdaptiva() {
    const container = document.querySelector('nav .nav-links');
    const more = container?.querySelector('.nav-overflow');
    const menu = more?.querySelector('.alma-more-menu');
    if (!menu) return;
    const links = Array.from(container.querySelectorAll(':scope > a'));
    let frame;

    function actualizeaza() {
        const focused = document.activeElement;
        links.forEach(link => container.insertBefore(link, more));
        more.hidden = false;
        const visible = links.filter(link => getComputedStyle(link).display !== 'none');
        const gap = parseFloat(getComputedStyle(container).columnGap) || 0;
        const widths = visible.map(link => link.getBoundingClientRect().width);
        const available = container.clientWidth;
        let used = widths.reduce((sum, width) => sum + width, 0) + Math.max(0, visible.length - 1) * gap;
        if (used <= available) {
            more.hidden = true;
            more.open = false;
        } else {
            used += more.getBoundingClientRect().width + gap;
            let count = visible.length;
            while (count > 0 && used > available) {
                count--;
                used -= widths[count] + gap;
            }
            visible.slice(count).forEach(link => menu.appendChild(link));
        }
        if (focused && links.includes(focused)) {
            if (menu.contains(focused)) more.open = true;
            focused.focus({ preventScroll: true });
        }
    }
    function schedule() {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(actualizeaza);
    }
    new ResizeObserver(schedule).observe(container);
    const visibilityObserver = new MutationObserver(schedule);
    links.forEach(link => visibilityObserver.observe(link, { attributes: true, attributeFilter: ['class', 'hidden'] }));
    document.fonts?.ready.then(schedule);
    window.addEventListener('resize', schedule);
    menu.addEventListener('click', event => {
        if (event.target.closest('a')) more.open = false;
    });
    document.addEventListener('click', event => {
        if (!more.contains(event.target)) more.open = false;
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && more.open) {
            more.open = false;
            more.querySelector('summary').focus();
        }
    });
    schedule();
})();

