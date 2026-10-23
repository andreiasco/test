// INITIALIZARE
// ======================================================

function afiseazaPagina(hash = window.location.hash) {

    const ancora = hash.replace("#", "") || "acasa";
    const pagini = {
        acasa: "pagina-acasa",
        elevi: "pagina-elevi",
        profesori: "pagina-profesori",
        "scoala-altfel": "pagina-scoala-altfel",
        jocuri: "pagina-quiz",
        "profesor-ai": "pagina-profesor-ai",
        abonamente: "pagina-abonamente",
        ajutor: "pagina-ajutor",
        contact: "pagina-contact",
        "rezumate-literare": "pagina-elevi",
        "biblioteca-vizuala": "pagina-elevi",
        "evaluarea-nationala": "pagina-elevi",
        "exercitii-recapitulari": "pagina-elevi",
        "teste-evaluari": "pagina-profesori",
        "adaptari-ces": "pagina-profesori",
        "analiza-diagnoza": "pagina-profesori",
        "planificare-remediala": "pagina-profesori",
        "fise-remediale": "pagina-profesori",
        "planificari-proiectari": "pagina-profesori",
        "escape-games": "pagina-scoala-altfel",
        "vanatori-comori": "pagina-scoala-altfel",
        "clase-mici": "pagina-scoala-altfel",
        "pachete-profesori": "pagina-scoala-altfel",
        "despre-noi": "pagina-acasa",
        functionalitati: "pagina-acasa",
        "how-to": "pagina-acasa",
        limba: "pagina-limba",
        "limba-clasa-5": "pagina-limba",
        "limba-clasa-6": "pagina-limba",
        "limba-clasa-7": "pagina-limba",
        "limba-clasa-8": "pagina-limba",
        literatura: "pagina-literatura",
        poezie: "pagina-literatura",
        proza: "pagina-literatura",
        teatru: "pagina-literatura",
        quiz: "pagina-quiz",
        harta: "pagina-harta",
        revista: "pagina-revista",
        "numere-publicate": "pagina-revista"
    };

    const paginaId = pagini[ancora] || "pagina-acasa";
    const esteRutaPrincipala = [
        "acasa", "elevi", "profesori", "scoala-altfel", "jocuri", "profesor-ai", "abonamente", "ajutor", "contact",
        "limba",
        "literatura",
        "quiz",
        "harta",
        "revista"
    ].includes(ancora);

    document.querySelectorAll(".pagina").forEach(
        pagina => pagina.classList.toggle(
            "activ",
            pagina.id === paginaId
        )
    );

    document.querySelectorAll('.nav-links a').forEach(link => {
        const target = (link.hash || '').slice(1);
        const studentRoute = ['pagina-limba', 'pagina-literatura'].includes(paginaId) && target === 'elevi';
        const gameRoute = paginaId === 'pagina-quiz' && target === 'jocuri';
        const samePage = pagini[target] === paginaId;
        const homeLink = ancora === 'despre-noi' ? 'despre-noi' : 'acasa';
        const currentPage = samePage && (paginaId !== 'pagina-acasa' || target === homeLink);
        if (currentPage || studentRoute || gameRoute) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });
    const element = document.getElementById(ancora);
    if (element?.matches('details.alma-category')) element.open = true;

    if (element && !esteRutaPrincipala) {
        window.requestAnimationFrame(
            () => element.scrollIntoView({ behavior: "smooth" })
        );
    } else {
        window.scrollTo(0, 0);
    }
}

window.addEventListener("hashchange", () => afiseazaPagina());
afiseazaPagina();

incarcaAutori();
incarcaMaterialeLimba();
if (typeof initializeazaQuizPlayer === "function") initializeazaQuizPlayer();
if (typeof initializeazaAiAssistant === "function") initializeazaAiAssistant();
if (typeof incarcaQuizuri === "function") incarcaQuizuri();
if (typeof incarcaRevista === "function") incarcaRevista();

verificaSesiunea();

// ======================================================
// INITIALIZARE CĂUTARE
// ======================================================

const searchInput =
    document.getElementById(
        "searchInput"
    );


if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            cautaSite(
                this.value
            );

        }
    );

}


document.addEventListener(
    "click",
    function (event) {

        const container =
            document.querySelector(
                ".search-container"
            );

        const results =
            document.getElementById(
                "searchResults"
            );

        const accountMenu =
            document.querySelector(
                ".account-menu"
            );


        if (
            container &&
            results &&
            !container.contains(event.target) &&
            !searchToggle.contains(event.target)
        ) {

            container.classList.add(
                "ascuns"
            );

            searchToggle.setAttribute("aria-expanded", "false");
            results.classList.remove(
                "activ"
            );

        }

        if (
            accountMenu &&
            !accountMenu.contains(event.target)
        ) {
            accountMenu.removeAttribute("open");
        }

    }
);

console.log(
    "Site inițializat."
);

console.log(
    "Bucket PDF privat:",
    BUCKET
);

console.log(
    "Bucket imagini public:",
    IMAGINI_BUCKET
);

// ======================================================
// ACCESIBILITATE FORMULARE
// Asociază automat un <label> real câmpurilor generate dinamic
// care nu au deja unul. Eticheta este ascunsă doar vizual.
// ======================================================
(function initEticheteFormulare() {
    let formLabelCounter = 0;

    function textEticheta(control) {
        return (
            control.getAttribute("aria-label") ||
            control.getAttribute("placeholder") ||
            control.getAttribute("name") ||
            control.id ||
            (control.tagName === "SELECT" ? "Selectează o opțiune" : "Câmp formular")
        ).replace(/[-_]+/g, " ").trim();
    }

    function areEticheta(control) {
        if (control.closest("label")) return true;
        if (!control.id) return false;
        return Array.from(document.querySelectorAll("label[for]"))
            .some((label) => label.htmlFor === control.id);
    }

    function asiguraEtichete(root = document) {
        const selector = 'input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="image"]), select, textarea';
        const controls = [];

        if (root.nodeType === 1 && root.matches?.(selector)) controls.push(root);
        if (root.querySelectorAll) controls.push(...root.querySelectorAll(selector));

        controls.forEach((control) => {
            if (areEticheta(control)) return;

            if (!control.id) {
                formLabelCounter += 1;
                control.id = `form-field-${formLabelCounter}`;
            }

            const label = document.createElement("label");
            label.className = "sr-only auto-form-label";
            label.htmlFor = control.id;
            label.textContent = textEticheta(control);
            control.parentNode?.insertBefore(label, control);
        });
    }

    const porneste = () => {
        asiguraEtichete(document);
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) asiguraEtichete(node);
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", porneste, { once: true });
    } else {
        porneste();
    }
})();
