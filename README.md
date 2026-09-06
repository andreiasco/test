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

## Quiz-uri interactive animate

Versiunea include un sistem nativ de quiz-uri administrabile din panoul de administrator.

### Activare în Supabase
1. Deschide proiectul Supabase > SQL Editor.
2. Rulează `supabase/quizzes.sql` o singură dată.
3. Verifică faptul că utilizatorul administrator are `role = 'admin'` în tabelul `profiles` (site-ul folosește deja această verificare pentru panoul admin).

### Pentru administrator
În `admin.html` există secțiunea **Quiz-uri interactive**. Administratorul poate:
- crea titlul, descrierea și clasa;
- alege timpul pe întrebare;
- adăuga oricâte întrebări;
- introduce 2–4 variante și marca răspunsul corect;
- adăuga o explicație opțională;
- salva ca publicat sau ciornă;
- edita, publica/ascunde și șterge quiz-uri existente.

### Pentru utilizator
În pagina `#quiz`, fila **Quiz interactiv** încarcă quiz-urile publicate din Supabase. Player-ul include progres, cronometru, punctaj cu bonus de timp, feedback animat și ecran final. Kahoot și Wordwall au fost păstrate ca file separate.

## Quiz aventură 3D în castel

Versiunea actuală include un creator de quiz pentru administrator și un player tip aventură:

- elevul începe cu exact 3 vieți;
- fiecare întrebare este o întâlnire cu un monstru;
- răspuns greșit = pierderea unei vieți;
- după greșeală monstrul poate spune „De data aceasta te iert. Te las să treci mai departe.”;
- la 0 vieți quiz-ul se termină imediat (Game Over);
- ultima întrebare este tratată automat ca boss final (dragon);
- la final se calculează scorul și bonusul pentru viețile rămase;
- administratorul poate alege tipul întrebării (alegere multiplă / adevărat-fals), monstrul, replicile și explicația;
- există previzualizare înainte de publicare.

### Activare Supabase

Rulează `supabase/quizzes.sql` în Supabase > SQL Editor. Scriptul poate fi rulat și dacă tabela `quizzes` exista deja; adaugă noile coloane `game_mode`, `difficulty` și `lives`.

### 3D

Motorul este în `js/site/castle-3d.js` și creează procedural castelul, personajul și monștrii. Three.js este încărcat ca modul din CDN. Dacă WebGL/Three.js nu se poate încărca, întrebările rămân utilizabile, doar scena 3D nu este randată.

## Castel Quiz 3D v2 – animație cinematică

Motorul `js/site/castle-3d.js` a fost actualizat cu riguri 3D articulate și animații procedurale:

- personaj cu animații idle / mers / alergare;
- animații distincte pentru goblin, liliac, schelet, păianjen, cavaler, fantomă, golem, vrăjitor, demon și dragon;
- boss dragon cu aripi, coadă și maxilar animate;
- mișcări cinematice de cameră la întâlnirea cu monstrul, răspuns corect/greșit, trecerea în camera următoare, victorie și game over;
- torțe, particule de praf, ceață și coridor cu arcade pentru mai multă profunzime;
- fallback complet procedural: quiz-ul nu depinde de fișiere 3D externe pentru a funcționa.

### Asset-uri 3D opționale

Arhitectura poate fi extinsă ulterior cu modele `.glb`/`.gltf`. Pentru asset-uri externe se recomandă numai modele cu licență clară (de exemplu CC0). Pachetele Kenney Mini Dungeon și Animated Characters sunt CC0 și pot fi folosite ca punct de plecare.

## Etapa 3 – Castel 3D cu camere tematice

Motorul `js/site/castle-3d.js` a fost extins cu camere procedurale distincte pentru întâlnirile din quiz:

- Biblioteca blestemată – rafturi, cărți și masă;
- Temnița – lanțuri și gratii;
- Sala armelor – săbii și scut;
- Laboratorul vrăjitorului – recipiente luminoase și cazan;
- Cripta – sarcofage și decor funerar stilizat;
- Sala Dragonului – cameră specială pentru boss-ul final, cu podium, tron, coloane, braziere și iluminare proprie.

Camerele sunt selectate automat după numărul întrebării. Ultima întrebare folosește întotdeauna Sala Dragonului. Logica de quiz și editorul Admin rămân compatibile cu versiunea anterioară.

## Etapa 4 – animație cinematică extinsă
- efecte de particule pentru răspuns corect/greșit;
- inele magice și impulsuri de lumină;
- intrare specială pentru boss-ul Dragon;
- tranziții de cameră mai dramatice și efect de viteză între camere;
- efecte distincte pentru victorie și Game Over;
- respectă `prefers-reduced-motion`.


## Etapa 5 – quiz cinematic multi-mod

- Deplasarea prin castel este mai lungă și are mai multe cadre de cameră.
- `js/site/quiz-audio.js` generează procedural pași, uși, atmosferă, răspuns corect/greșit, boss, victorie și game over prin Web Audio API.
- Administratorul poate crea patru tipuri de quiz: `castle_choice`, `castle_true_false`, `castle_hangman`, `castle_ordering`.
- Spânzurătoarea pierde o viață la fiecare literă greșită; 0 vieți încheie jocul.
- Ordonarea folosește elemente selectabile prin tap/click și verifică ordinea exactă.
- Toate modurile folosesc aventura 3D, 3 vieți și boss final.

## Etapa 6 – personaje GLB + animații cinematice

Quiz-ul Castel folosește acum modele 3D locale `.glb` pentru erou și toate tipurile de monștri. Fișierele sunt în `assets/quiz3d/`, iar configurarea lor este în `js/site/castle-assets.js`.

Modele incluse: erou, goblin, liliac, schelet, păianjen, cavaler, fantomă, golem, vrăjitor, demon și dragon. Modelele sunt construite din piese separate, astfel încât motorul poate anima brațe, picioare, aripi, maxilar și alte componente.

`js/site/castle-3d.js` încarcă modelele prin GLTFLoader. Dacă un model nu se poate încărca, quiz-ul revine automat la modelul procedural, fără să blocheze întrebarea.

Au fost adăugate intrări cinematice diferite: fantoma apare de jos și se rotește, liliacul coboară în zbor, păianjenul coboară de sus, vrăjitorul apare printr-un efect de portal, iar dragonul are o secvență specială pentru boss.

Modelele din `assets/quiz3d/` au fost generate special pentru acest proiect și nu necesită descărcări externe de asset-uri 3D.

## Etapa 7 – AI pentru utilizatori autentificați și administrator

Versiunea include două integrări AI separate:

1. **Profesor AI pentru utilizatori autentificați**
   - butonul `🤖 Profesor AI` apare în meniul Cont numai după autentificare;
   - poate explica noțiuni de limba și literatura română și poate propune exerciții;
   - în quiz, după un răspuns greșit apare `💡 Explică-mi cu AI`;
   - utilizatorii obișnuiți au implicit maximum 30 de cereri AI/zi; administratorul 80/zi.

2. **Generator AI pentru administrator**
   - în Creatorul de quiz apare `✨ Generează cu AI`;
   - administratorul alege tipul quiz-ului, clasa, dificultatea, tema și numărul de provocări;
   - sunt suportate toate cele patru moduri: alegere multiplă, adevărat/fals, spânzurătoarea și ordonarea;
   - AI-ul completează editorul, dar NU salvează și NU publică automat. Administratorul verifică rezultatul și apasă manual Salvează.

### Configurare Supabase + OpenAI

1. Rulează `supabase/ai.sql` în **Supabase > SQL Editor**.
2. În **Supabase > Edge Functions > Secrets** adaugă:
   - `OPENAI_API_KEY` = cheia ta OpenAI;
   - opțional `OPENAI_MODEL` = modelul dorit. Dacă lipsește, funcțiile folosesc `gpt-5-mini`.
3. Publică cele două Edge Functions:
   - `supabase/functions/ai-assistant/index.ts`
   - `supabase/functions/ai-generate-quiz/index.ts`
4. Funcțiile validează explicit sesiunea Supabase în backend. Dacă folosești CLI și gateway-ul proiectului nu acceptă tokenul utilizatorului, le poți publica cu `--no-verify-jwt`; verificarea utilizatorului rămâne făcută în cod prin `admin.auth.getUser(token)`.
5. Nu introduce niciodată `OPENAI_API_KEY` în `index.html`, `admin.html`, `config.js` sau alte fișiere livrate browserului.

Exemplu CLI:

```bash
supabase functions deploy ai-assistant --no-verify-jwt
supabase functions deploy ai-generate-quiz --no-verify-jwt
supabase secrets set OPENAI_API_KEY=CHEIA_TA
```

### Fișiere AI adăugate

- `js/layout/ai-assistant.js` – interfața Profesorului AI;
- `js/site/ai-assistant.js` – logica browserului;
- `supabase/functions/_shared/ai-common.ts` – autentificare, limite și apel OpenAI;
- `supabase/functions/ai-assistant/index.ts` – profesorul AI;
- `supabase/functions/ai-generate-quiz/index.ts` – generatorul de quiz;
- `supabase/ai.sql` – tabel privat pentru limitarea utilizării.

Cheia OpenAI rămâne exclusiv în secretele Edge Functions. Tabelul `ai_usage` are RLS activ și nu are politici pentru browser; este accesat doar de backend cu service role.

## Panou administrator separat pe obiecte

Panoul de administrator este împărțit acum în secțiuni independente, accesibile din meniul intern:

- **Autori** – adăugare și administrare autori;
- **Opere** – adăugare și administrare opere și resurse asociate;
- **Limba română** – capitole și materiale;
- **PDF-uri** – fișierele PDF din storage;
- **Quiz-uri** – creatorul de quiz, generatorul AI și lista quiz-urilor existente.

Navigarea este gestionată de `js/admin/panel-navigation.js`. Ultima secțiune deschisă este păstrată pe durata sesiunii browserului.
