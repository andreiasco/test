// Admin navigation mirrors the public libraries; shared content has two entry points.
const ADMIN_LIBRARY_NAV = {
    elevi: [
        { page: 'autori', title: 'Autori', icon: 'user', id: 'adminTabAutori' },
        { page: 'opere', title: 'Opere', icon: 'book', id: 'adminTabOpere' },
        { page: 'limba', title: 'Limba română', icon: 'magazine', id: 'adminTabLimba' },
        ...EDUCATION_COLLECTIONS.filter(item => item.parent === 'elevi').map(item => ({ page: 'resurse-' + item.key, title: item.title, icon: item.icon, id: 'admin-tab-' + item.key }))
    ],
    profesori: [
        { page: 'limba', title: 'Limba română', icon: 'magazine', id: 'adminTabLimbaProfesori' },
        ...EDUCATION_COLLECTIONS.filter(item => item.parent === 'profesori').map(item => ({ page: 'resurse-' + item.key, title: item.title, icon: item.icon, id: 'admin-tab-' + item.key }))
    ]
};
const ADMIN_PRIMARY_NAV = [
    { group: 'elevi', title: 'Resurse elevi', subtitle: 'Literatură și învățare', icon: 'cap' },
    { group: 'profesori', title: 'Resurse profesori', subtitle: 'Evaluare și predare', icon: 'folder' },
    { page: 'revista', title: 'Reviste', subtitle: 'Creații, contribuții și numere', icon: 'magazine', id: 'adminTabRevista' },
    { page: 'quiz', title: 'Jocuri', subtitle: 'Aventuri și quiz-uri', icon: 'game', id: 'adminTabQuiz' },
    { page: 'pdf', title: 'PDF-uri', subtitle: 'Stocare și indexare AI', icon: 'file', id: 'adminTabPdf' },
    { page: 'cont', title: 'Cont', subtitle: 'Statistici, roluri și jurnal', icon: 'shield', id: 'adminTabCont' }
];
function adminNavigationButton(item) {
    const target = item.group ? `data-admin-group="${item.group}" aria-expanded="false" aria-controls="admin-resources-${item.group}"` : `id="${item.id}" data-admin-tab="${item.page}" aria-selected="false"`;
    return `<button type="button" class="admin-object-tab" ${target}><span class="admin-object-tab-icon">${almaIcon(item.icon)}</span><span><b>${item.title}</b>${item.subtitle ? `<small>${item.subtitle}</small>` : ''}</span></button>`;
}
const ADMIN_PANEL_PREFIX_HTML = `
<section id="adminPanel" class="admin-panel ascuns">
    <div class="admin-header"><div><span class="admin-eyebrow">Administrare conținut</span><h2>Panou administrator</h2><p id="adminUser">Administrator conectat</p></div><button class="admin-btn logout-btn" onclick="logoutAdmin()">Deconectare</button></div>
    <nav class="admin-object-nav" aria-label="Secțiuni administrare">${ADMIN_PRIMARY_NAV.map(adminNavigationButton).join('')}</nav>
    ${Object.entries(ADMIN_LIBRARY_NAV).map(([group, items]) => `<div class="admin-resource-subnav" id="admin-resources-${group}" data-admin-subnav="${group}" hidden aria-label="${group === 'elevi' ? 'Resurse elevi' : 'Resurse profesori'}"><p class="admin-subnav-label">${group === 'elevi' ? 'Resurse elevi' : 'Resurse profesori'}</p>${items.map(adminNavigationButton).join('')}</div>`).join('')}
`;
const ADMIN_PANEL_SUFFIX_HTML = `</section>`;
