// Navigation and resource hubs share the existing library, accounts and storage.
const ALMA_ICONS = {
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
function almaCategory(id, title, description, icon, items) {
    return `<details class="alma-category" id="${id}"><summary><span class="alma-icon">${almaIcon(icon)}</span><span><strong>${title}</strong><small>${description}</small></span><span class="alma-chevron" aria-hidden="true">+</span></summary><div class="alma-submenu">${items.map(([name, text, href]) => `<div class="alma-resource"><div><h3>${name}</h3><p>${text}</p></div>${href ? `<a class="alma-text-link" href="${href}">Explorează </a>` : '<span class="alma-status">În pregătire</span>'}</div>`).join('')}</div></details>`;
}
function almaPage(id, eyebrow, title, lead, content) {
    return `<div id="pagina-${id}" class="pagina alma-page"><section id="${id}"><a class="alma-back" href="#acasa"> Acasă</a><p class="alma-eyebrow">${eyebrow}</p><h1 class="titlu">${title}</h1><p class="subtitlu">${lead}</p>${content}</section></div>`;
}
const ALMA_STUDENT_CATEGORIES = [
    almaCategory('rezumate-literare', 'Rezumate literare', 'Autori, opere și lumi de descoperit.', 'book', [
        ['Literatură română și universală', 'Descoperă autorii, operele și resursele disponibile în biblioteca literară.', '#literatura'],
        ['Poezie', 'Texte poetice, rezumate și resurse asociate autorilor.', '#poezie'],
        ['Proză', 'Romane, nuvele, povestiri și basme.', '#proza'],
        ['Teatru', 'Personaje, dialog și texte dramatice.', '#teatru']
    ]),
    almaCategory('biblioteca-vizuala', 'Biblioteca vizuală', 'Teorie, scheme și explicații pe înțelesul tău.', 'magazine', [
        ['Limba română, clasele V–VIII', 'Capitolele și materialele existente, organizate pe clase.', '#limba'],
        ['Fișe vizuale și scheme colorate', 'Noțiuni-cheie, exemple, excepții și greșeli frecvente. Colecție dedicată în pregătire.']
    ]),
    almaCategory('evaluarea-nationala', 'Evaluarea Națională', 'Pregătire pas cu pas pentru examen.', 'cap', [
        ['Materiale pentru clasa a VIII-a', 'Consultă materialele disponibile în biblioteca de limba română.', '#limba-clasa-8'],
        ['Antrenament pentru examen', 'Vocabular, gramatică, receptarea textului, redactare și teste-model. Colecție dedicată în pregătire.']
    ]),
    almaCategory('exercitii-recapitulari', 'Exerciții și recapitulări', 'Înțelege, exersează și urmărește-ți progresul.', 'check', [
        ['Materiale pe clase', 'Fișierele existente pentru clasele a V-a, a VI-a, a VII-a și a VIII-a.', '#limba'],
        ['Jocuri și provocări', 'Exersează prin quiz-uri și aventuri educaționale.', '#jocuri'],
        ['Fișe pe competențe', 'O colecție separată de fișe pentru consolidarea cunoștințelor este în pregătire.']
    ])
].join('');
const ALMA_TEACHER_CATEGORIES = [
    almaCategory('teste-evaluari', 'Teste și evaluări', 'Instrumente pentru fiecare etapă a învățării.', 'check', [
        ['Biblioteca de materiale existentă', 'Consultă materialele pe clase și capitole.', '#limba'],
        ['Teste inițiale, pe unități și module', 'Variante paralele, teste și bareme într-o colecție dedicată.']
    ]),
    almaCategory('adaptari-ces', 'Adaptări CES', 'Resurse diferențiate și sprijin pentru învățare.', 'book', [
        ['Teste și fișe diferențiate', 'Adaptări asociate materialelor standard, pentru nevoi diferite de învățare.']
    ]),
    almaCategory('analiza-diagnoza', 'Analiză și diagnoză', 'De la rezultate la pașii următori.', 'chart', [
        ['Centralizatoare și modele SWOT', 'Analiza rezultatelor, puncte tari și puncte slabe.']
    ]),
    almaCategory('planificare-remediala', 'Planificare remedială', 'Un parcurs adaptat dificultăților identificate.', 'folder', [
        ['Planificări pe competențe', 'Modele de planuri de intervenție și activități de recuperare.']
    ]),
    almaCategory('fise-remediale', 'Fișe remediale', 'Exerciții diferențiate, cu un scop clar.', 'magazine', [
        ['Fișe de lucru', 'Activități legate de rezultatele evaluării și de planul remedial.']
    ]),
    almaCategory('planificari-proiectari', 'Planificări și proiectări', 'Mai mult timp pentru predare.', 'folder', [
        ['Documente didactice', 'Planificări calendaristice și proiectări pe unități.'],
        ['Revista profesorilor', 'Descoperă revista și posibilitatea de a trimite materiale spre revizuire.', '#revista']
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
    almaPage('elevi', 'ÎNVAȚĂ ÎN RITMUL TĂU', 'Biblioteca elevului', 'Rezumate, lecții, exerciții și pregătire pentru examene. Alege o categorie pentru a vedea resursele.', `<div class="alma-category-list">${ALMA_STUDENT_CATEGORIES}</div>`),
    almaPage('profesori', 'IDEI BUNE PENTRU LECȚII REUȘITE', 'Biblioteca profesorului', 'Evaluare, diagnoză, remedial și resurse didactice. Colecțiile noi sunt marcate „În pregătire”.', `<div class="alma-category-list">${ALMA_TEACHER_CATEGORIES}</div>`),
    almaPage('scoala-altfel', 'ÎNVĂȚAREA IESE DIN TIPARE', 'Școala Altfel', 'Proiecte inovatoare, escape game-uri și vânători de comori.', `<div class="alma-category-list">${ALMA_SCHOOL_CATEGORIES}</div>`),
    almaPage('profesor-ai', 'UN SPRIJIN PENTRU ÎNVĂȚARE', 'Profesor AI', 'Explicații și exerciții de limba și literatura română, adaptate clasei tale.', `<div class="alma-feature-panel"><span class="alma-icon">${almaIcon('ai')}</span><h2>Întreabă. Înțelege. Încearcă din nou.</h2><p>Alege clasa, formulează întrebarea și, dacă dorești, adaugă un fragment de studiu. Asistentul este disponibil după autentificare.</p><button class="alma-primary" type="button" onclick="almaDeschideAsistent()">Deschide Profesor AI</button><p class="alma-action-status" role="status"></p><small>Răspunsurile sunt generate cu AI și trebuie verificate în materialul de studiu. Disponibilitatea depinde de serviciul conectat.</small></div>`),
    almaPage('abonamente', 'ACCES LA RESURSE', 'Biblioteci pentru elevi și profesori', 'Resursele existente își păstrează regulile actuale de acces.', `<div class="alma-two-columns"><article class="alma-feature-panel"><h2>Biblioteca elevului</h2><p>Rezumate, fișe vizuale, recapitulări, exerciții și pregătire pentru Evaluarea Națională.</p><a class="alma-text-link" href="#elevi">Explorează biblioteca</a></article><article class="alma-feature-panel"><h2>Biblioteca profesorului</h2><p>Teste, bareme, adaptări CES, analiză, remedial și proiecte pentru Școala Altfel.</p><a class="alma-text-link" href="#profesori">Explorează biblioteca</a></article></div><p class="alma-notice">Pachetele de abonament, prețurile și plata online nu sunt încă disponibile. Categoriile noi vor fi completate treptat.</p>`),
    almaPage('ajutor', 'TE ORIENTEZI UȘOR', 'Cum folosești EDU ALMA', 'Totul începe cu un subiect care îți stârnește curiozitatea.', `<div class="alma-category-list">${almaCategory('ajutor-biblioteci', 'Găsește un material', 'Alege biblioteca și apoi categoria dorită.', 'book', [['Pentru elevi', 'Literatură, limba română și exerciții.', '#elevi'], ['Pentru profesori', 'Resurse pentru pregătirea lecțiilor.', '#profesori']])}${almaCategory('ajutor-cont', 'Contul tău', 'Autentificare, progres și contribuții.', 'cap', [['Elevi', 'Din meniul Cont poți accesa profilul și progresul după autentificare.'], ['Profesori', 'Din profilul de profesor poți trimite materiale pentru revistă spre revizuire.']])}</div>`),
    almaPage('contact', 'SĂ PĂSTRĂM LEGĂTURA', 'Contact și contribuții', 'EDU ALMA crește prin ideile celor care iubesc educația.', `<div class="alma-feature-panel"><h2>Contribuie la revista digitală</h2><p>Profesorii autentificați pot trimite materiale spre revizuire din Cont Profilul meu. Contribuțiile sunt verificate înainte de publicare.</p><a class="alma-text-link" href="#revista">Descoperă revista</a><p class="alma-notice">Datele publice de contact vor fi adăugate în această secțiune.</p></div>`)
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
