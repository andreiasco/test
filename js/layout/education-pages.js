function paginaColectieEducationala(collection) {
    const filter = collection.fields.find(field => field.kind === 'select');
    return `<div id="pagina-${collection.key}" class="pagina alma-page education-${collection.key}"><section id="${collection.key}">
        <a class="alma-back" href="#${collection.parent}">← ${EDUCATION_PARENTS[collection.parent]}</a>
        <p class="alma-eyebrow">${EDUCATION_PARENTS[collection.parent]}</p>
        <h1 class="titlu education-title"><span class="alma-icon">${almaIcon(collection.icon)}</span>${collection.title}</h1>
        <p class="subtitlu">${collection.intro}</p>
        <div class="education-filters" data-education-filters="${collection.key}">
            ${collection.parent !== 'revista' ? `<label>Clasa<select data-education-grade><option value="">Toate clasele</option>${[5,6,7,8].map(grade => `<option value="${grade}">Clasa a ${grade}-a</option>`).join('')}</select></label>` : ''}
            ${filter ? `<label>${filter.label}<select data-education-type="${filter.name}"><option value="">Toate</option>${filter.options.map(option => `<option>${option}</option>`).join('')}</select></label>` : ''}
            <label>Caută în colecție<input type="search" data-education-search placeholder="Titlu sau subiect..."></label>
        </div>
        <p data-education-count="${collection.key}" role="status"></p>
        <div class="education-list" data-education-list="${collection.key}"><p>Se încarcă...</p></div>
    </section></div>`;
}
const EDUCATION_PAGES_HTML = EDUCATION_COLLECTIONS.map(paginaColectieEducationala).join('') + `
<div id="pagina-informatii-adeverinte" class="pagina alma-page"><section id="informatii-adeverinte">
    <a class="alma-back" href="#revista">← Reviste digitale</a><p class="alma-eyebrow">PUBLICAREA CONTRIBUȚIILOR</p>
    <h1 class="titlu">Adeverințe de publicare</h1><p class="subtitlu">Ce oferă în prezent platforma și unde urmărești contribuția trimisă.</p>
    <article class="alma-feature-panel"><h2>Trimiterea unui material nu reprezintă o adeverință</h2><p>Profesorii pot trimite contribuții din Cont → Profilul meu. Materialele sunt revizuite înainte de publicare; starea unei contribuții este afișată în profil.</p>
    <h2>Emiterea adeverințelor</h2><p>Platforma nu emite și nu distribuie automat adeverințe individuale. O confirmare de trimitere sau acceptare nu este o adeverință.</p><a class="alma-text-link" href="#numere-publicate">Consultă numerele publicate</a></article>
</section></div>
<div id="pagina-reguli-publicare" class="pagina alma-page"><section id="reguli-publicare">
    <a class="alma-back" href="#revista">← Reviste digitale</a><p class="alma-eyebrow">CUM FUNCȚIONEAZĂ CONTRIBUȚIILE</p>
    <h1 class="titlu">Trimitere și revizuire editorială</h1><p class="subtitlu">Pașii disponibili în platformă pentru revista profesorilor.</p>
    <div class="education-steps"><article class="alma-feature-panel"><h2>1. Trimite contribuția</h2><p>Autentifică-te ca profesor, deschide Cont → Profilul meu și completează formularul pentru revistă, cu un fișier PDF sau DOCX.</p></article>
    <article class="alma-feature-panel"><h2>2. Urmărește revizuirea</h2><p>Administratorul verifică materialul și îl acceptă sau îl respinge. Urmărește starea contribuției în profilul tău.</p></article>
    <article class="alma-feature-panel"><h2>3. Consultă publicația</h2><p>Numerele revistei sunt publicate de administrator în arhivă. Acceptarea unui material nu publică automat un număr de revistă.</p><a class="alma-text-link" href="#numere-publicate">Deschide arhiva</a></article></div>
    <p class="alma-notice">Aceste explicații descriu funcțiile platformei. Un regulament editorial detaliat și termenele de publicare nu au fost anunțate pe site.</p>
</section></div>`;
