// Navigare internă pentru panoul de administrare separat pe obiecte.
(function () {
    const lastGroupPages = {};
    const LOADERS = {
        autori: ["incarcaAutoriAdmin"],
        opere: ["incarcaListaAutoriSelect", "incarcaOpereAdmin"],
        limba: ["incarcaLimbaAdmin"],
        pdf: ["incarcaListaPDF"],
        quiz: ["incarcaQuizuriAdmin"],
        revista: ["incarcaRevistaAdmin", "incarcaNumereRevistaAdmin", "incarcaCreatiiEleviAdmin"],
        cont: ["incarcaContAdmin"]
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
            if (!active) page.querySelectorAll?.('details[open]').forEach(details => {
                // Keep editing tools and their values; reset only read-only disclosures.
                if (!details.querySelector('input, select, textarea, form')) details.open = false;
            });
            page.hidden = !active;
            page.classList.toggle("is-active", active);
        });

        const subnavs = Array.from(panel.querySelectorAll('[data-admin-subnav]'));
        const parents = subnavs.filter(subnav => Array.from(subnav.querySelectorAll('[data-admin-tab]')).some(tab => tab.dataset.adminTab === target)).map(subnav => subnav.dataset.adminSubnav);
        let preferred = options.group || panel.dataset.adminNavGroup;
        if (!preferred) { try { preferred = sessionStorage.getItem('admin-active-group'); } catch (_) {} }
        const resourceParent = parents.includes(preferred) ? preferred : parents[0] || null;
        panel.dataset.adminNavGroup = resourceParent || '';
        if (resourceParent) lastGroupPages[resourceParent] = target;

        panel.querySelectorAll("[data-admin-tab]").forEach(tab => {
            const group = tab.closest('[data-admin-subnav]')?.dataset.adminSubnav;
            const active = tab.dataset.adminTab === target && (!group || group === resourceParent);
            tab.classList.toggle("is-active", active);
            tab.setAttribute("aria-selected", String(active));
        });

        subnavs.forEach(subnav => {
            subnav.hidden = subnav.dataset.adminSubnav !== resourceParent;
        });
        panel.querySelectorAll('[data-admin-group]').forEach(button => {
            const selected = button.dataset.adminGroup === resourceParent;
            button.classList.toggle('is-active', selected);
            button.setAttribute('aria-expanded', String(selected));
        });

        try { sessionStorage.setItem("admin-active-page", target); sessionStorage.setItem('admin-active-group', resourceParent || ''); } catch (_) { }

        if (options.load !== false) {
            if (target.startsWith("resurse-") && typeof incarcaEditorEducational === "function") incarcaEditorEducational(target.slice(8));
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
            const group = event.target.closest('[data-admin-group]');
            if (group && panel.contains(group)) {
                const subnav = panel.querySelector(`[data-admin-subnav="${group.dataset.adminGroup}"]`);
                const target = subnav?.querySelector('[data-admin-tab]');
                const remembered = lastGroupPages[group.dataset.adminGroup];
                if (target) activeazaPaginaAdmin(remembered || target.dataset.adminTab, { scroll: false, group: group.dataset.adminGroup });
                return;
            }
            const tab = event.target.closest("[data-admin-tab]");
            if (!tab || !panel.contains(tab)) return;
            activeazaPaginaAdmin(tab.dataset.adminTab, {
                group: tab.closest('[data-admin-subnav]')?.dataset.adminSubnav,
                scroll: false
            });
        });

        const normalize = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        panel.querySelectorAll('[data-admin-filter]').forEach(input => {
            const list = document.getElementById(input.dataset.adminFilter);
            const status = panel.querySelector(`[data-admin-filter-status="${input.dataset.adminFilter}"]`);
            if (!list) return;
            const applyFilter = () => {
                const query = normalize(input.value);
                const rows = Array.from(list.children).filter(row => row.matches('.admin-autor, .admin-opera'));
                let visible = 0;
                rows.forEach(row => {
                    const title = row.querySelector('summary, .admin-opera-titlu');
                    const matches = normalize(title?.textContent || row.textContent).includes(query);
                    row.hidden = !matches;
                    if (matches) visible++;
                });
                if (status) status.textContent = query && rows.length ? `${visible} din ${rows.length} rezultate` : '';
            };
            input.addEventListener('input', applyFilter);
            // Retain the active filter when a refresh or save replaces the list.
            new MutationObserver(applyFilter).observe(list, { childList: true, subtree: true });
            applyFilter();
        });

        panel.addEventListener('invalid', event => {
            let details = event.target.closest('details');
            while (details) {
                details.open = true;
                details = details.parentElement?.closest('details');
            }
        }, true);

        let initial = "autori";
        try { initial = sessionStorage.getItem("admin-active-page") || initial; } catch (_) { }
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
