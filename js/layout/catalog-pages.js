// Navigation and resource hubs share the existing library, accounts and storage.
const ALMA_ICONS = {
    snowflake: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-1-1-4m13 9-4 1 1 4M4 14l4 1-1 4m13-9-4-1 1-4"/>',
    user: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    users: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6m1 5a5 5 0 0 1 3 5"/>',
    save: '<path d="M4 3h13l4 4v14H3V3h1Zm3 0v6h10V3M7 21v-8h10v8"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
    tick: '<path d="m5 12 4 4L19 6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    warning: '<path d="m12 3 10 18H2L12 3Zm0 6v5m0 3h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="m3 3 18 18M10 5c7-1 12 7 12 7a20 20 0 0 1-4 4M6 6a20 20 0 0 0-4 6s4 7 10 7a12 12 0 0 0 5-1M10 10a3 3 0 0 0 4 4"/>',
    shield: '<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Zm-4 9 3 3 5-6"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    rope: '<path d="M16 21c5-1 5-6 2-9L9 3C5-1 0 4 4 8l9 9c1 1 3-1 2-2L6 6M8 10l3-3m0 6 3-3m0 6 3-3"/>',
    shuffle: '<path d="M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 4-3 5-6m2-3c2-3 3-3 5-3h3m-4-4 4 4-4 4"/>',
    heart: '<path d="M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1C-1 10 7 17 12 21c5-4 13-11 8-16Z"/>',
    heartEmpty: '<path d="M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1C-1 10 7 17 12 21c5-4 13-11 8-16ZM5 3l14 18"/>',
    edit: '<path d="m4 16 12-12 4 4L8 20l-5 1 1-5Zm10-10 4 4"/>',
    file: '<path d="M5 3h9l5 5v13H5V3Zm9 0v6h5M8 13h8m-8 4h6"/>',
    film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4m10-6h4m-4 6h4m-11-6 4 3-4 3V9Z"/>',
    audio: '<path d="M3 14v-3a9 9 0 0 1 18 0v3M3 12h4v8H3v-8Zm14 0h4v8h-4v-8Z"/>',
    bulb: '<path d="M9 18h6m-5 3h4M8 14a7 7 0 1 1 8 0l-1 4H9l-1-4Z"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
    key: '<circle cx="8" cy="8" r="5"/><path d="m12 12 9 9m-5-5 3-3m0 6 3-3"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    logout: '<path d="M9 3H3v18h6m4-15 6 6-6 6m-5-6h13"/>',
    moon: '<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
    upload: '<path d="M4 15v6h16v-6M12 16V3m-5 5 5-5 5 5"/>',
    castle: '<path d="M3 3v5h6V3m6 0v5h6V3M3 6v15h18V6M9 21v-6a3 3 0 0 1 6 0v6M9 8h6"/>',
    sound: '<path d="m11 4-5 5H2v6h4l5 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    muted: '<path d="m11 4-5 5H2v6h4l5 5V4Zm5 5 6 6m0-6-6 6"/>',
    refresh: '<path d="M20 7a9 9 0 0 0-16 1M20 2v5h-5M4 17a9 9 0 0 0 16-1M4 22v-5h5"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><path d="m3 17 6-6 4 4 3-3 5 5"/>',
    plus: '<path d="M12 4v16M4 12h16"/>',
    sparkles: '<path d="m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6ZM20 2v4m-2-2h4"/>',
    camera: '<path d="m8 5 2-2h4l2 2h5v16H3V5h5Z"/><circle cx="12" cy="13" r="4"/>',
    leaf: '<path d="M20 3c-2 9-2 16-10 16C0 19 1 6 20 3ZM4 21 16 9"/>',
    trophy: '<path d="M7 3h10v6a5 5 0 0 1-10 0V3Zm0 2H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4m-5 2v7m-5 0h10"/>',
    gift: '<path d="M3 8h18v5H3V8Zm2 5v8h14v-8M12 8v13m0-13C4 8 4 1 8 3l4 5Zm0 0c8 0 8-7 4-5l-4 5Z"/>',
    search: '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
    skull: '<path d="M7 17C0 12 4 3 12 3s12 9 5 14v4H7v-4Z"/><circle cx="8" cy="11" r="2"/><circle cx="16" cy="11" r="2"/><path d="m11 16 1-2 1 2m-3 3v2m4-2v2"/>',
    ghost: '<path d="M4 21V10a8 8 0 0 1 16 0v11l-4-3-4 3-4-3-4 3ZM9 9v2m6-2v2m-5 4h4"/>',
    spider: '<circle cx="12" cy="13" r="4"/><circle cx="12" cy="7" r="2"/><path d="m8 10-4-4V3m4 10H2m6 2-4 3v3m12-11 4-4V3m-4 10h6m-6 2 4 3v3"/>',
    bat: '<path d="m10 8 2 2 2-2 1 3c3-4 5-5 7-5l-2 9-4-1-2 4h-4l-2-4-4 1-2-9c2 0 4 1 7 5l1-3Z"/>',
    monster: '<path d="m5 8-2-5 6 3h6l6-3-2 5v7a7 7 0 0 1-14 0V8Zm3 3h1m6 0h1m-7 5h6m-5 0v2m4-2v2"/>',
    rock: '<path d="m8 3 10 2 4 10-6 6H5l-3-9 6-9Zm0 0 3 8 11 4m-11-4 5 10"/>',
    wizard: '<path d="m12 2 7 14H5l7-14ZM3 16h18M8 16v2a4 4 0 0 0 8 0v-2M9 10h6"/>',
    dragon: '<path d="M3 20c7 0 2-8 7-10V3l5 4 5-1 1 5-5 3v4l-5 3H3Zm7-10L3 7l2 8m11-4h.01M12 3l4 1"/>',
    poetry: '<path d="M20 3c-6 0-12 4-12 10v3h3c6 0 10-6 9-13ZM4 21l12-12M8 16v-5m0 5h5"/>',
    prose: '<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1m0-14c3-2 6-2 9-1v14c-3-1-6-1-9 1V6ZM6 9l3 1m-3 3 3 1m6-4 3-1m-3 5 3-1"/>',
    drama: '<path d="M3 4h12v6c0 4-3 7-6 8-3-1-6-4-6-8V4Zm4 4h.01M11 8h.01M6 12c2 2 4 2 6 0M15 7h6v7c0 3-2 6-5 7-2-.7-4-2-5-4m6-6h.01m-2 6c1-1 2-1 3 0"/>',
    book: '<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1m0-14c3-2 6-2 9-1v14c-3-1-6-1-9 1V6Z"/>',
    folder: '<path d="M3 7V5h6l2 3h10v12H3V7Z"/>',
    puzzle: '<path d="M8 3h8v5c6-3 6 7 0 4v9H8v-5c-6 3-6-7 0-4V3Z"/>',
    magazine: '<path d="M5 3h14v18H5V3Zm3 4h8M8 11h8M8 15h3m3 0h2M8 18h8"/>',
    game: '<path d="M7 7h10c5 0 6 13 2 13l-4-4H9l-4 4C1 20 2 7 7 7Zm1 3v5m-2-2.5h4m5-.5h.01M18 14h.01"/>',
    ai: '<rect x="4" y="7" width="16" height="13" rx="4"/><path d="M12 3v4M8 12h.01M16 12h.01M8 16h8"/>',
    map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/>',
    cap: '<path d="m2 8 10-5 10 5-10 5L2 8Zm4 2v7c4 3 8 3 12 0v-7m4-2v9"/>',
    chart: '<path d="M4 3v18h17M8 16v-4m5 4V8m5 8V5"/>',
    check: '<path d="M8 3h8l4 4v14H4V3h4Zm0 10 3 3 6-6"/>'
};
function almaIcon(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ALMA_ICONS[name] || ALMA_ICONS.book}</svg>`;
}
function almaCategory(id, title, description, icon, items, introduction = '') {
    return `<details class="alma-category" id="${id}"><summary><span class="alma-icon">${almaIcon(icon)}</span><span><strong>${title}</strong><small>${description}</small></span><span class="alma-chevron" aria-hidden="true">+</span></summary><div class="alma-submenu">${introduction}${items.map(([name, text, href, status = 'În pregătire', action = 'Explorează']) => `<div class="alma-resource"><div><h3>${name}</h3><p>${text}</p></div>${href ? `<a class="alma-text-link" href="${href}" aria-label="${action}: ${name}">${action}</a>` : `<span class="alma-status">${status}</span>`}</div>`).join('')}</div></details>`;
}
function almaPage(id, eyebrow, title, lead, content) {
    return `<div id="pagina-${id}" class="pagina alma-page"><section id="${id}"><a class="alma-back" href="#acasa"> Acasă</a><p class="alma-eyebrow">${eyebrow}</p><h1 class="titlu">${title}</h1><p class="subtitlu">${lead}</p>${content}</section></div>`;
}
const ALMA_STUDENT_CATEGORIES = [
    almaCategory('rezumate-literare', 'Literatură', 'Descoperă literatura după titlul operei sau după autor, cu rezumate, analize și resurse asociate.', 'book', [
        ['Opere', 'Opere în ordine alfabetică, grupate în proză, poezie și dramă, cu toate resursele disponibile.', '#carti'],
        ['Autori', 'Descoperă autorii, biografiile și operele lor, grupate pe genuri literare.', '#literatura']
    ], `<figure class="literature-quote"><blockquote><p>„Nu există altă avere mai prețioasă decât limba unui popor.”</p></blockquote><figcaption>— Nicolae Iorga</figcaption></figure>`),
    almaCategory('biblioteca-vizuala', 'Biblioteca vizuală', 'Fișe și scheme vizuale pentru învățare și recapitulare.', 'magazine', [
        ['Fișe vizuale și scheme colorate', 'Noțiuni-cheie, exemple și scheme pentru recapitulare.', '#fise-vizuale']
    ]),
    almaCategory('evaluarea-nationala', 'Evaluarea Națională', 'Materiale dedicate pregătirii pentru examen.', 'cap', [
        ['Antrenament pentru examen', 'Vocabular, gramatică, receptarea textului, redactare și teste-model.', '#antrenament-examen']
    ]),
    almaCategory('exercitii-recapitulari', 'Exerciții și recapitulări', 'Înțelege, exersează și urmărește-ți progresul.', 'check', [
        ['Limba română, clasele V–VIII', 'Alege clasa, apoi capitolul, pentru a consulta materialele disponibile de limba română. Biblioteca include toate materialele, fără un filtru separat pentru exerciții.', '#limba'],
        ['Jocuri și provocări', 'Exersează prin quiz-uri și aventuri educaționale.', '#jocuri'],
        ['Fișe pe competențe', 'Exerciții și fișe pentru consolidarea cunoștințelor.', '#exercitii-competente']
    ])
].join('');
const ALMA_TEACHER_CATEGORIES = [
    almaCategory('teste-evaluari', 'Teste și evaluări', 'Materiale pe clase și o colecție dedicată de evaluări.', 'check', [
        ['Materiale de limba română pe clase', 'Consultă toate materialele disponibile de limba română, pe clase și capitole.', '#limba'],
        ['Teste inițiale, pe unități și module', 'Variante paralele, teste și bareme într-o colecție dedicată.', '#teste-bareme']
    ]),
    almaCategory('adaptari-ces', 'Adaptări CES', 'Resurse diferențiate și sprijin pentru învățare.', 'book', [
        ['Teste și fișe diferențiate', 'Adaptări asociate materialelor standard, pentru nevoi diferite de învățare.', '#resurse-ces']
    ]),
    almaCategory('analiza-diagnoza', 'Analiză și diagnoză', 'De la rezultate la pașii următori.', 'chart', [
        ['Centralizatoare și modele SWOT', 'Analiza rezultatelor, puncte tari și puncte slabe.', '#centralizatoare-swot']
    ]),
    almaCategory('planificare-remediala', 'Planificare remedială', 'Un parcurs adaptat dificultăților identificate.', 'folder', [
        ['Planificări pe competențe', 'Modele de planuri de intervenție și activități de recuperare.', '#planuri-interventie']
    ]),
    almaCategory('fise-remediale', 'Fișe remediale', 'Exerciții diferențiate, cu un scop clar.', 'magazine', [
        ['Fișe de lucru', 'Activități legate de rezultatele evaluării și de planul remedial.', '#activitati-remediale']
    ]),
    almaCategory('planificari-proiectari', 'Planificări și proiectări', 'Documente pentru planificarea lecțiilor.', 'folder', [
        ['Documente didactice', 'Planificări calendaristice și proiectări pe unități.', '#documente-planificare']
    ]),
    almaCategory('publicatii-profesori', 'Revista profesorilor', 'Numere publicate și informații despre trimiterea contribuțiilor.', 'magazine', [
        ['Revista profesorilor', 'Consultă arhiva și află cum trimiți un material spre revizuire.', '#revista']
    ])
].join('');
const ALMA_SCHOOL_CATEGORIES = [
    almaCategory('escape-games', 'Escape game-uri educaționale', 'Enigme, puzzle-uri și aventuri de echipă.', 'puzzle', [
        ['Portal către Fantazia', 'O aventură tematică bazată pe enigme și descoperire.'],
        ['Aventuri interactive disponibile', 'Explorează jocurile și quiz-urile deja existente.', '#jocuri']
    ]),
    almaCategory('vanatori-comori', 'Vânători de comori', 'Ieșim din tipare și pornim în explorare.', 'map', [
        ['Stații, rute și indicii', 'Provocări pentru explorare și învățare în echipă.']
    ]),
    almaCategory('clase-mici', 'Activități pentru clasele mici', 'Curiozitate și creativitate, de la primii pași.', 'cap', [
        ['Scânteiuța și ouăle curcubeu', 'Activități tematice pentru cei mici.']
    ]),
    almaCategory('pachete-profesori', 'Pachete pentru profesori', 'Tot ce ai nevoie pentru o activitate.', 'folder', [
        ['Scenarii și materiale imprimabile', 'Proiect, ghid, fișe, inventar, diplome și raport de activitate.']
    ])
].join('');
const ALMA_HUBS_HTML = [
    almaPage('elevi', 'ÎNVAȚĂ ÎN RITMUL TĂU', 'Biblioteca elevului', 'Descoperă resursele literare, materialele de limba română și jocurile disponibile. Materialele din fiecare colecție apar pe măsură ce sunt publicate.', `<div class="alma-category-list">${ALMA_STUDENT_CATEGORIES}</div>`),
    almaPage('profesori', 'IDEI BUNE PENTRU LECȚII REUȘITE', 'Biblioteca profesorului', 'Evaluare, diagnoză, remedial și resurse didactice. Alege o categorie pentru a vedea materialele publicate.', `<div class="alma-category-list">${ALMA_TEACHER_CATEGORIES}</div>`),
    almaPage('scoala-altfel', 'ÎNVĂȚAREA IESE DIN TIPARE', 'Școala Altfel', 'Descoperă activitățile propuse și jocurile disponibile. Colecțiile viitoare sunt marcate „În pregătire”.', `<div class="alma-category-list">${ALMA_SCHOOL_CATEGORIES}</div>`),
    almaPage('profesor-ai', 'UN SPRIJIN PENTRU ÎNVĂȚARE', 'Profesor AI', 'Explicații și exerciții de limba și literatura română, adaptate clasei tale.', `<div class="alma-feature-panel"><span class="alma-icon">${almaIcon('ai')}</span><h2>Întreabă. Înțelege. Încearcă din nou.</h2><p>Alege clasa, formulează întrebarea și, dacă dorești, adaugă un fragment de studiu. Asistentul este disponibil după autentificare.</p><button class="alma-primary" type="button" onclick="almaDeschideAsistent()">Deschide Profesor AI</button><p class="alma-action-status" role="status"></p><small>Răspunsurile sunt generate cu AI și trebuie verificate în materialul de studiu. Disponibilitatea depinde de serviciul conectat.</small></div>`),
    almaPage('abonamente', 'ACCES LA RESURSE', 'Acces la biblioteci', 'Consultă bibliotecile disponibile și informațiile despre acces.', `<div class="alma-two-columns"><article class="alma-feature-panel"><h2>Biblioteca elevului</h2><p>Opere, autori, materiale de limba română și jocuri. Colecțiile sunt completate de administrator.</p><a class="alma-text-link" href="#elevi">Explorează biblioteca</a></article><article class="alma-feature-panel"><h2>Biblioteca profesorului</h2><p>Materiale pe clase și acces la revistă. Consultă colecțiile de evaluare, adaptări CES și remedial.</p><a class="alma-text-link" href="#profesori">Explorează biblioteca</a></article></div><p class="alma-notice">Pachetele de abonament, prețurile și plata online nu sunt încă disponibile. Categoriile noi vor fi completate treptat.</p>`),
    almaPage('ajutor', 'TE ORIENTEZI UȘOR', 'Cum folosești EDU ALMA', 'Totul începe cu un subiect care îți stârnește curiozitatea.', `<div class="alma-category-list">${almaCategory('ajutor-biblioteci', 'Găsește un material', 'Alege biblioteca și apoi categoria dorită.', 'book', [['Pentru elevi', 'Literatură, limba română și exerciții.', '#elevi'], ['Pentru profesori', 'Resurse pentru pregătirea lecțiilor.', '#profesori']])}${almaCategory('ajutor-cont', 'Contul tău', 'Autentificare, progres și contribuții.', 'cap', [['Elevi', 'Din Cont → Profilul meu poți vedea progresul după autentificare.', null, 'Din profil'], ['Profesori', 'Din Cont → Profilul meu poți trimite materiale pentru revistă spre revizuire.', null, 'Din profil']])}</div>`),
    almaPage('contact', 'SĂ PĂSTRĂM LEGĂTURA', 'Contribuții la revistă', 'EDU ALMA crește prin ideile celor care iubesc educația.', `<div class="alma-feature-panel"><h2>Contribuie la revista digitală</h2><p>Profesorii autentificați pot trimite materiale spre revizuire din Cont → Profilul meu. Contribuțiile sunt verificate înainte de publicare.</p><a class="alma-text-link" href="#revista">Descoperă revista</a><p class="alma-notice">Datele publice de contact vor fi adăugate în această secțiune.</p></div>`)
].join('');

async function almaUserOrLogin() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
        document.querySelector('.pagina.activ .alma-action-status')?.replaceChildren(document.createTextNode('Nu am putut verifica sesiunea. Încearcă din nou.'));
        return null;
    }
    if (!data?.session) { afiseazaLogin(); return null; }
    return data.session.user;
}

async function almaDeschideAsistent() {
    if (!await almaUserOrLogin()) return;
    openAiAssistant();
}
