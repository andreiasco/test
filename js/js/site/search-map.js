// ======================================================
// CĂUTARE
// ======================================================

let dateCautare = [];
let autoriHarta = [];

const numeRegiuni = {
    banat: "Banat",
    crisana: "Crișana",
    maramures: "Maramureș",
    transilvania: "Transilvania",
    oltenia: "Oltenia",
    muntenia: "Muntenia",
    dobrogea: "Dobrogea",
    moldova: "Moldova",
    bucovina: "Bucovina",
    "tara-romaneasca": "Țara Românească"
};

const hartaMapareIdRegiune = {
    "RO-BA": "banat",
    "RO-CR": "crisana",
    "RO-MA": "maramures",
    "RO-TR": "transilvania",
    "RO-OL": "oltenia",
    "RO-MU": "muntenia",
    "RO-DO": "dobrogea",
    "RO-MO": "moldova",
    "RO-BC": "bucovina"
};

const hartaAliasRegiune = {
    banat: ["banat"],
    crisana: ["crisana"],
    maramures: ["maramures"],
    transilvania: ["transilvania"],
    oltenia: ["oltenia"],
    muntenia: ["muntenia"],
    dobrogea: ["dobrogea"],
    moldova: ["moldova"],
    bucovina: ["bucovina"],
    "tara-romaneasca": ["tara-romaneasca"]
};

function normalizareRegiune(valoare) {
    return String(valoare || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function obtineCheieRegiune(regiune) {
    if (!regiune) {
        return "";
    }

    const cheie = normalizareRegiune(regiune);
    if (hartaMapareIdRegiune[regiune]) {
        return hartaMapareIdRegiune[regiune];
    }

    return cheie;
}

function obtineRegiuniCompatibile(regiune) {
    const cheie = normalizareRegiune(regiune);
    const directe = hartaAliasRegiune[cheie] || hartaAliasRegiune[obtineCheieRegiune(regiune)] || [cheie];
    return [...new Set(directe.flatMap(valoare => [valoare, normalizareRegiune(valoare)]).filter(Boolean))];
}

function inchideHartaPopup() {
    const popup = document.getElementById("hartaPopup");
    document.querySelectorAll(".map-region-btn.is-active").forEach(regiune => {
        regiune.classList.remove("is-active");
        regiune.setAttribute("aria-pressed", "false");
    });

    if (popup) {
        popup.classList.add("ascuns");
    }
}

function deschideHartaPopup(regiune, element) {
    const popup = document.getElementById("hartaPopup");
    const titlu = document.getElementById("hartaPopupTitlu");
    const lista = document.getElementById("hartaPopupLista");
    const regiuneCheie = obtineCheieRegiune(regiune);
    const regiuniCompatibile = new Set(obtineRegiuniCompatibile(regiuneCheie));
    const autori = autoriHarta.filter(autor => {
        const autorRegiuni = obtineRegiuniCompatibile(autor.locul_nasterii);
        return autorRegiuni.some(regiuneAutor => regiuniCompatibile.has(regiuneAutor));
    });

    if (!popup || !titlu || !lista) {
        return;
    }

    document.querySelectorAll(".map-region-btn.is-active").forEach(regiuneActiva => {
        regiuneActiva.classList.remove("is-active");
        regiuneActiva.setAttribute("aria-pressed", "false");
    });

    if (element) {
        element.classList.add("is-active");
        element.setAttribute("aria-pressed", "true");
    }

    titlu.textContent = numeRegiuni[regiuneCheie] || regiuneCheie;
    lista.innerHTML = autori.length > 0
        ? `<ul>${autori.map(autor => `<li><a href="#literatura" onclick="navigheazaLaAutor(${autor.id}); return false;" style="text-decoration:none;color:inherit;cursor:pointer;"><strong style="text-decoration:underline">${escapeHTML(autor.nume)}</strong></a>${autor.localitate_nastere ? `<small>${escapeHTML(autor.localitate_nastere)}</small>` : ""}</li>`).join("")}</ul>`
        : "<p>Nu există încă autori înscriși în această regiune.</p>";
    popup.classList.remove("ascuns");

    if (element) {
        const isMobile = window.innerWidth <= 700;

        if (isMobile) {
            popup.style.left = "12px";
            popup.style.top = "12px";
            popup.style.width = "calc(100% - 24px)";
            popup.style.maxHeight = "calc(100vh - 24px)";
            return;
        }

        const bounds = element.getBoundingClientRect();
        const canvas = element.closest(".harta-canvas");
        if (!canvas) {
            return;
        }

        const canvasBounds = canvas.getBoundingClientRect();
        popup.style.left = `${Math.min(Math.max(bounds.left - canvasBounds.left, 12), canvasBounds.width - 340)}px`;
        popup.style.top = `${Math.min(Math.max(bounds.top - canvasBounds.top + 20, 12), canvasBounds.height - 250)}px`;
    }
}

function navigheazaLaAutor(autorId) {
    // Navighează la literatura și scrollează la autorul selectat
    inchideHartaPopup();
    window.location.hash = "#literatura";

    // Așteaptă ca pagina să se înccarce și apoi scrollează la autorul selectat
    setTimeout(() => {
        const autorCard = document.getElementById(`autor-${autorId}`);
        if (autorCard) {
            autorCard.scrollIntoView({ behavior: "smooth", block: "start" });
            deschideAutorPopup(null, autorCard);
        }
    }, 300);
}

function deschideAutorPopup(event, autorCard) {
    if (!autorCard || (event && event.target.closest("button, a, summary, input, select, textarea"))) {
        return;
    }

    const modal = document.getElementById("autorPopupModal");
    const content = document.getElementById("autorPopupContent");
    if (!modal || !content) {
        return;
    }

    content.innerHTML = autorCard.innerHTML;
    modal.classList.remove("ascuns");
    document.body.style.overflow = "hidden";
}

function inchideAutorPopup() {
    const modal = document.getElementById("autorPopupModal");
    const content = document.getElementById("autorPopupContent");
    if (!modal || !content) {
        return;
    }

    modal.classList.add("ascuns");
    content.replaceChildren();
    document.body.style.overflow = "";
}

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        const autorPopup = document.getElementById("autorPopupModal");
        if (autorPopup && !autorPopup.classList.contains("ascuns")) {
            inchideAutorPopup();
        }
    }
});

function initializeazaHarta(autori) {
    autoriHarta = autori || [];

    document.querySelectorAll(".map-region-btn").forEach(regiune => {
        if (regiune.dataset.hartaInitializata) {
            return;
        }

        regiune.dataset.hartaInitializata = "true";
        const regiuneCheie = hartaMapareIdRegiune[regiune.id] || regiune.dataset.regiune || "";
        if (regiuneCheie) {
            regiune.dataset.regiune = regiuneCheie;
        }

        regiune.addEventListener("click", () => deschideHartaPopup(regiune.dataset.regiune || regiune.id, regiune));
        regiune.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
                event.preventDefault();
                deschideHartaPopup(regiune.dataset.regiune || regiune.id, regiune);
            }
        });
    });

    const butonInchidere = document.querySelector(".harta-popup-inchide");
    if (butonInchidere && !butonInchidere.dataset.initializat) {
        butonInchidere.dataset.initializat = "true";
        butonInchidere.addEventListener("click", inchideHartaPopup);
    }

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            const popup = document.getElementById("hartaPopup");
            if (popup && !popup.classList.contains("ascuns")) {
                inchideHartaPopup();
            }
        }
    });

    document.addEventListener("click", event => {
        const popup = document.getElementById("hartaPopup");
        const hartăCanvas = document.querySelector(".harta-canvas");
        if (!popup || !hartăCanvas || popup.classList.contains("ascuns")) {
            return;
        }

        const clicInPopup = popup.contains(event.target);
        const clicPeRegiune = event.target.closest(".map-region-btn");
        if (!clicInPopup && !clicPeRegiune) {
            inchideHartaPopup();
        }
    });
}


function pregatesteDateCautare(autori, opere) {

    dateCautare = [];

    (autori || []).forEach(autor => {

        dateCautare.push({
            tip: "Autor",
            titlu: autor.nume || "",
            categorie: autor.categorie || "",
            autorId: autor.id
        });

    });


    (opere || []).forEach(opera => {

        const autor = (autori || []).find(
            a =>
                String(a.id) ===
                String(opera.autor_id)
        );

        dateCautare.push({
            tip: "Operă",
            titlu: opera.titlu || "",
            autorNume: autor
                ? autor.nume
                : "",
            categorie: autor
                ? autor.categorie
                : "",
            autorId: opera.autor_id,
            operaId: opera.id
        });

    });

}


function cautaSite(text) {

    const results =
        document.getElementById(
            "searchResults"
        );

    if (!results) {
        return;
    }


    const cautare =
        text
            .trim()
            .toLowerCase();


    if (!cautare) {

        results.innerHTML = "";
        results.classList.remove("activ");

        return;

    }


    const rezultate =
        dateCautare.filter(item => {

            const continut = [

                item.tip,
                item.titlu,
                item.autorNume,
                item.categorie

            ]
                .join(" ")
                .toLowerCase();

            return continut.includes(cautare);

        });


    if (rezultate.length === 0) {

        results.innerHTML = `
            <div class="search-no-results">
                🔍 Nu am găsit rezultate pentru
                „${escapeHTML(text)}”.
            </div>
        `;

        results.classList.add("activ");

        return;

    }


    results.innerHTML =
        rezultate
            .slice(0, 20)
            .map(item => `

                <div
                    class="search-result"
                    onclick="deschideRezultatCautare(
                        '${item.tip}',
                        '${item.autorId}',
                        '${item.operaId || ""}'
                    )">

                    <strong>
                        ${escapeHTML(item.titlu)}
                    </strong>

                    <small>
                        ${escapeHTML(item.tip)}
                        ${item.categorie
                    ? " • " +
                    escapeHTML(item.categorie)
                    : ""}
                        ${item.tip === "Operă" &&
                    item.autorNume
                    ? " • " +
                    escapeHTML(item.autorNume)
                    : ""}
                    </small>

                </div>

            `)
            .join("");


    results.classList.add("activ");

}


async function deschideRezultatCautare(
    tip,
    autorId,
    operaId
) {

    const input =
        document.getElementById(
            "searchInput"
        );

    const results =
        document.getElementById(
            "searchResults"
        );


    if (input) {
        input.value = "";
    }

    if (results) {
        results.classList.remove("activ");
        results.innerHTML = "";
    }


    if (tip === "Autor") {

        const { data: autor } =
            await supabaseClient
                .from("autori")
                .select("categorie")
                .eq("id", autorId)
                .single();


        if (!autor) {
            return;
        }


        const categorie =
            String(
                autor.categorie || ""
            )
                .trim()
                .toLowerCase();


        const sectiuni = {
            poezie: "poezie",
            proza: "proza",
            teatru: "teatru"
        };


        const ancora =
            sectiuni[categorie];


        if (ancora) {

            window.location.hash =
                ancora;

        }

        return;

    }


    if (tip === "Operă") {

        const { data: opera } =
            await supabaseClient
                .from("opere")
                .select("autor_id")
                .eq("id", operaId)
                .single();


        if (!opera) {
            return;
        }


        const { data: autor } =
            await supabaseClient
                .from("autori")
                .select("categorie")
                .eq("id", opera.autor_id)
                .single();


        if (!autor) {
            return;
        }


        const categorie =
            String(
                autor.categorie || ""
            )
                .trim()
                .toLowerCase();


        if (
            ["poezie", "proza", "teatru"]
                .includes(categorie)
        ) {

            window.location.hash =
                categorie;

        }

    }

}


