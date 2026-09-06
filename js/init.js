// INITIALIZARE
// ======================================================

function afiseazaPagina(hash = window.location.hash) {

    const ancora = hash.replace("#", "") || "acasa";
    const pagini = {
        acasa: "pagina-acasa",
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
        revista: "pagina-revista"
    };

    const paginaId = pagini[ancora] || "pagina-acasa";
    const esteRutaPrincipala = [
        "acasa",
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

    const element = document.getElementById(ancora);

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
if (typeof incarcaQuizuri === "function") incarcaQuizuri();

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
