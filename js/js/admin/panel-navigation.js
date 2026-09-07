// Navigare internă pentru panoul de administrare separat pe obiecte.
(function () {
    const LOADERS = {
        autori: ["incarcaAutoriAdmin"],
        opere: ["incarcaListaAutoriSelect", "incarcaOpereAdmin"],
        limba: ["incarcaLimbaAdmin"],
        pdf: ["incarcaListaPDF"],
        quiz: ["incarcaQuizuriAdmin"]
    };

    function ruleazaLoader(name) {
        const fn = window[name];
        if (typeof fn === "function") {
            try {
                const result = fn();
                if (result && typeof result.catch === "function") {
                    result.catch(error => console.error(`Eroare la ${name}:`, error));
                }
            } catch (error) {
                console.error(`Eroare la ${name}:`, error);
            }
        }
    }

    function activeazaPaginaAdmin(pageName, options = {}) {
        const panel = document.getElementById("adminPanel");
        if (!panel) return;

        const validPages = Array.from(panel.querySelectorAll("[data-admin-page]"))
            .map(el => el.dataset.adminPage);
        const target = validPages.includes(pageName) ? pageName : "autori";

        panel.querySelectorAll("[data-admin-page]").forEach(page => {
            const active = page.dataset.adminPage === target;
            page.hidden = !active;
            page.classList.toggle("is-active", active);
        });

        panel.querySelectorAll("[data-admin-tab]").forEach(tab => {
            const active = tab.dataset.adminTab === target;
            tab.classList.toggle("is-active", active);
            tab.setAttribute("aria-selected", String(active));
        });

        try { sessionStorage.setItem("admin-active-page", target); } catch (_) {}

        if (options.load !== false) {
            (LOADERS[target] || []).forEach(ruleazaLoader);
        }

        if (options.scroll !== false) {
            const heading = panel.querySelector(`[data-admin-page="${target}"] .admin-object-page-heading`);
            heading?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    function initializeazaNavigareAdmin() {
        const panel = document.getElementById("adminPanel");
        if (!panel || panel.dataset.navigationReady === "1") return;
        panel.dataset.navigationReady = "1";

        panel.addEventListener("click", event => {
            const tab = event.target.closest("[data-admin-tab]");
            if (!tab || !panel.contains(tab)) return;
            activeazaPaginaAdmin(tab.dataset.adminTab);
        });

        let initial = "autori";
        try { initial = sessionStorage.getItem("admin-active-page") || initial; } catch (_) {}
        activeazaPaginaAdmin(initial, { load: false, scroll: false });
    }

    window.activeazaPaginaAdmin = activeazaPaginaAdmin;
    window.initializeazaNavigareAdmin = initializeazaNavigareAdmin;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeazaNavigareAdmin, { once: true });
    } else {
        initializeazaNavigareAdmin();
    }
})();
