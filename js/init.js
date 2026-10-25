// INITIALIZARE
// ======================================================

function afiseazaPagina(hash = window.location.hash) {

    const ancora = hash.replace("#", "") || "acasa";
    const pagini = {
        ...Object.fromEntries([...EDUCATION_COLLECTIONS.map(collection => collection.key), ...EDUCATION_STATIC_ROUTES].map(key => [key, 'pagina-' + key])),
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
        carti: "pagina-carti",
        poezie: "pagina-literatura",
        proza: "pagina-literatura",
        teatru: "pagina-literatura",
        quiz: "pagina-quiz",
        harta: "pagina-harta",
        revista: "pagina-revista",
        "numere-publicate": "pagina-numere-publicate"
    };

    const paginaId = ancora.startsWith('carte-') ? 'pagina-carti' : (pagini[ancora] || "pagina-acasa");
    const esteRutaPrincipala = [
        "acasa", "elevi", "profesori", "scoala-altfel", "jocuri", "profesor-ai", "abonamente", "ajutor", "contact",
        "limba",
        "literatura",
        "carti",
        "quiz",
        "harta",
        "revista",
        "numere-publicate"
    ].includes(ancora) || [...EDUCATION_COLLECTIONS.map(item => item.key), ...EDUCATION_STATIC_ROUTES].includes(ancora);

    document.querySelectorAll(".pagina").forEach(pagina => {
        const active = pagina.id === paginaId;
        if (!active) {
            pagina.querySelectorAll?.('details[open]').forEach(details => {
                details.open = false;
            });
        }
        pagina.classList.toggle('activ', active);
    });
    document.querySelectorAll('nav details[open]').forEach(menu => { menu.open = false; });

    document.querySelectorAll('.nav-links a').forEach(link => {
        const target = (link.hash || '').slice(1);
        const studentRoute = ['pagina-limba', 'pagina-literatura', 'pagina-carti'].includes(paginaId) && target === 'elevi';
        const gameRoute = paginaId === 'pagina-quiz' && target === 'jocuri';
        const magazineRoute = paginaId === 'pagina-numere-publicate' && target === 'revista';
        const samePage = pagini[target] === paginaId;
        const homeLink = ancora === 'despre-noi' ? 'despre-noi' : 'acasa';
        const educationPage = EDUCATION_COLLECTIONS.find(collection => ancora === collection.key);
        const materialRoute = educationPage?.parent === target || (EDUCATION_STATIC_ROUTES.includes(ancora) && target === 'revista');
        const currentPage = samePage && (paginaId !== 'pagina-acasa' || target === homeLink);
        if (currentPage || studentRoute || gameRoute || magazineRoute || materialRoute) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });
    const element = document.getElementById(ancora);
    if (ancora.startsWith('carte-') && typeof deschideCarteaDinRuta === 'function') {
        window.requestAnimationFrame(deschideCarteaDinRuta);
        return;
    }
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
if (typeof initializeazaResurseEducationale === "function") initializeazaResurseEducationale();

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
