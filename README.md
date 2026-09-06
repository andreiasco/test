# Site modularizat

Structura proiectului a fost reorganizată fără schimbarea logicii existente. Fișierele mari `js/site.js`, `js/admin.js` și `css/site.css` au fost împărțite pe responsabilități.

## JavaScript

- `js/core/config.js` — Supabase, bucket-uri și referințe globale
- `js/core/layout.js` — structura HTML generată de aplicație
- `js/core/theme-quiz.js` — temă și quiz
- `js/core/auth.js` — login, register, resetare parolă, roluri și sesiune
- `js/site/ui-helpers.js` — search toggle și helper-e UI
- `js/site/search-map.js` — căutare și harta autorilor
- `js/site/storage.js` — utilitare pentru căile Storage
- `js/site/authors.js` — încărcarea autorilor și operelor pe site
- `js/site/language.js` — materialele de Limba română
- `js/site/pdf.js` — preview, URL-uri semnate și descărcări PDF/Word
- `js/admin/authors-create.js` — adăugare autori
- `js/admin/authors-select.js` — popularea selectului de autori
- `js/admin/works-create.js` — adăugare opere și resurse
- `js/admin/authors-manage.js` — administrarea autorilor existenți
- `js/admin/language-manage.js` — administrarea materialelor de Limba română
- `js/admin/works-list.js` — lista și administrarea operelor
- `js/admin/resources-replace.js` — înlocuirea PDF-urilor și resurselor
- `js/admin/resources-delete-list.js` — ștergere și listare resurse PDF
- `js/init.js` — rutare și inițializarea paginii

Ordinea scripturilor din `index.html` și `admin.html` este importantă și a fost actualizată.

## CSS

`css/site.css` este acum un fișier-index cu `@import`, iar stilurile sunt împărțite în:

- `css/base/` — reset și responsive
- `css/components/` — navigație, search, hero, carduri, autori, quiz, login, butoane etc.
- `css/pages/` — home, admin și hartă
- `css/themes/` — stilurile comune și dark mode

`css/admin.css` a rămas separat deoarece este deja foarte mic.

## Copii originale

Fișierele mari originale sunt păstrate în `_original/` doar ca backup și nu sunt încărcate de pagini.

## Verificări efectuate

- toate modulele JavaScript trec verificarea de sintaxă (`node --check`)
- conținutul JavaScript modularizat este identic, în aceeași ordine, cu fișierele originale
- referințele locale din `index.html` și `admin.html` indică fișiere existente
- nu mai există referințe active la vechile `js/site.js` și `js/admin.js`

## Etapa 2 – layout împărțit în componente

Fișierul `js/core/layout.js`, care avea aproximativ 1.040 de linii, este acum doar asamblorul componentelor de layout.

Componentele principale sunt în `js/layout/`:
- `nav.js` – bara de navigare și instrumentele de cont/căutare;
- `home.js` – pagina Acasă;
- `language-page.js` – pagina Limba română;
- `literature-page.js` – pagina Literatura română;
- `map-page.js` – asamblarea paginii Hartă;
- `quiz-page.js` – pagina Quiz;
- `magazine-page.js` – pagina Revista;
- `login-modal.js`, `pdf-modal.js`, `author-modal.js` – ferestre modale;
- `footer.js` – footerul;
- `admin-panel.js` – asamblează componentele panoului admin.

### Harta
SVG-ul mare al României a fost separat în `js/layout/map/`. Fiecare regiune istorică are propriul fișier (`ro-ba.js`, `ro-cr.js`, `ro-ma.js`, `ro-tr.js`, `ro-ol.js`, `ro-mu.js`, `ro-do.js`, `ro-mo.js`, `ro-bc.js`), iar `shell.js` conține structura paginii fără traseele SVG.

### Panoul admin
Markup-ul panoului de administrare a fost separat în `js/layout/admin-panel/`:
- `author-form.js` – formular autor;
- `work-form.js` – formular operă;
- `language-chapter-form.js` – formular capitol;
- `language-material-form.js` – formular material;
- `language-list.js` – lista capitole/materiale;
- `authors-list.js` – lista autorilor;
- `works-list.js` – lista operelor;
- `pdf-list.js` – lista PDF-urilor;
- `shell.js` – cadrul panoului.

`index.html` și `admin.html` au fost actualizate cu ordinea corectă de încărcare. Fișierul vechi de layout din prima etapă este păstrat ca backup în `_original/layout-stage1.js`.
