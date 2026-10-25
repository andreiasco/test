-- 18 materiale text de test: două în fiecare dintre cele nouă colecții solicitate.
-- Rulează după education-resources.sql, în Supabase > SQL Editor.
-- Sunt publicate, marcate [TEST], fără fișiere atașate.
-- Rularea repetată nu dublează și nu suprascrie materialele deja existente.
begin;

-- Fișe vizuale
insert into public.edu_fise_vizuale
    (id, title, description, body, grade, sort_order, published, topic, sheet_type, worked_example)
values
    ('69417828-83d7-5625-8ecc-e6fd30b49d1e', '[TEST] Substantivul — schemă de recapitulare', 'Material demonstrativ pentru testarea paginii, filtrelor și afișării. Poate fi editat sau șters din administrare.', 'SUBSTANTIVUL
Denumește ființe, lucruri, fenomene ale naturii și noțiuni.

Fel: comun (carte) sau propriu (Ana).
Număr: singular (elev) sau plural (elevi).
Gen: masculin, feminin sau neutru.', '5', 99991, true, 'Gramatică', 'Schemă', 'În enunțul „Ana citește o carte”, Ana este substantiv propriu, iar carte este substantiv comun. Ambele sunt la singular.'),
    ('2b0a286f-69f6-5cf0-a319-dde75550dbfe', '[TEST] Sinonime în context', 'Material demonstrativ pentru testarea paginii, filtrelor și afișării. Poate fi editat sau șters din administrare.', 'SINONIMELE
Cuvinte cu sens asemănător, care se aleg în funcție de context.

Exemple: vesel — bucuros; repede — iute.
Înlocuirea trebuie să păstreze sensul enunțului.', '6', 99992, true, 'Vocabular', 'Exemple comentate', '„Copilul este vesel.” → „Copilul este bucuros.”
În acest context, cele două adjective exprimă o stare asemănătoare.')
on conflict (id) do nothing;

-- Pregătire pentru Evaluarea Națională
insert into public.edu_antrenament_examen
    (id, title, description, body, grade, sort_order, published, exam_area, duration_minutes, answers)
values
    ('cdf0ef0a-94fa-581a-9b3f-cabff2bfff26', '[TEST] Citește și identifică informațiile', 'Material demonstrativ pentru testarea paginii, filtrelor și afișării. Poate fi editat sau șters din administrare.', 'Text original: „Mara a găsit un caiet în pod. Pe prima pagină era desenată o hartă a satului. Fata a coborât să-i arate bunicului descoperirea.”

1. Cine găsește caietul?
2. Unde este găsit?
3. Ce reprezintă desenul?
4. Cui dorește Mara să-i arate caietul?

Exercițiu demonstrativ, nu subiect oficial de examen.', '8', 99991, true, 'Receptarea textului', 10, '1. Mara.
2. În pod.
3. O hartă a satului.
4. Bunicului.'),
    ('c7c745d0-e59d-500c-9e21-851e34e1c678', '[TEST] Acordul dintre subiect și predicat', 'Material demonstrativ pentru testarea paginii, filtrelor și afișării. Poate fi editat sau șters din administrare.', 'Completează cu forma corectă a verbului:
1. Elevii ... în bibliotecă. (citește / citesc)
2. Cartea ... pe masă. (este / sunt)
3. Eu ... zilnic. (exersez / exersează)

Explică alegerea pentru primul enunț.
Exercițiu demonstrativ; nu reproduce un subiect oficial.', '8', 99992, true, 'Gramatică', 8, '1. citesc; 2. este; 3. exersez.
Subiectul „elevii” este la persoana a III-a, plural; verbul se acordă cu acesta.')
on conflict (id) do nothing;

-- Exerciții pe competențe
insert into public.edu_exercitii_competente
    (id, title, description, body, grade, sort_order, published, competence, difficulty, answers)
values
    ('6a6c6165-852f-5b73-a3ed-8a36ca05a856', '[TEST] Ideea principală a unui text', 'Material demonstrativ pentru testarea paginii, filtrelor și afișării. Poate fi editat sau șters din administrare.', 'Text original: „În fiecare vineri, elevii se întâlnesc în bibliotecă. Fiecare prezintă o carte și citește un fragment preferat.”

Formulează ideea principală într-un singur enunț. Evită detaliile secundare.', '6', 99991, true, 'Identificarea ideii principale', 'Consolidare', 'Răspuns posibil: Elevii se întâlnesc săptămânal pentru a împărtăși lecturi. Sunt acceptate formulări echivalente care păstrează informația esențială.'),
    ('e46e2863-4821-5efd-a0e3-a48e0c4b8de7', '[TEST] Descrierea unui loc preferat', 'Material demonstrativ pentru testarea paginii, filtrelor și afișării. Poate fi editat sau șters din administrare.', 'Scrie un paragraf de 5–7 enunțuri despre un loc preferat.
Include două detalii vizuale, un sunet și o impresie personală.
Recitește textul și verifică legătura dintre enunțuri.', '7', 99992, true, 'Redactarea unui text descriptiv', 'Aplicare', 'Autoevaluare: am numit locul; am inclus cele trei detalii solicitate; am exprimat o impresie; enunțurile se leagă logic; am verificat ortografia și punctuația. Nu există un singur răspuns corect.')
on conflict (id) do nothing;

-- Teste și bareme
insert into public.edu_teste_bareme
    (id, title, description, body, grade, sort_order, published, evaluation_type, duration_minutes, max_score, rubric)
values
    ('9c67cf3f-5c6d-50d8-8909-46234e4916f0', '[TEST] Mini-test despre substantiv', 'Material demonstrativ pentru testarea paginii, filtrelor și afișării. Poate fi editat sau șters din administrare.', '1. Identifică substantivele din „Elevul deschide caietul.”
2. Scrie pluralul substantivului „carte”.
3. Alcătuiește un enunț cu un substantiv propriu.

Test demonstrativ: 9 puncte pentru sarcini și 1 punct din oficiu.', '5', 99991, true, 'Pe unitate', 15, 10, '1. elevul, caietul: câte 2 puncte (4 p).
2. cărți: 2 p.
3. enunț corect: 1 p; substantiv propriu: 1 p; majusculă: 1 p (3 p).
Din oficiu: 1 p. Total: 10 p.'),
    ('60808aef-e98c-5ee6-81e7-2e14a8e79168', '[TEST] Lectură — informații și idee principală', 'Material demonstrativ pentru testarea paginii, filtrelor și afișării. Poate fi editat sau șters din administrare.', 'Text original: „Ana și Vlad au amenajat un colț de lectură. Au adus cărți, perne și o lampă. Acum colegii citesc acolo în pauze.”

1. Numește cele două personaje.
2. Menționează două obiecte aduse.
3. Formulează ideea principală.

Test demonstrativ.', '6', 99992, true, 'Inițială', 20, 10, '1. Ana și Vlad: câte 1 p (2 p).
2. Oricare două dintre cărți, perne, lampă: câte 1 p (2 p).
3. Ideea amenajării unui colț de lectură: 3 p; exprimare clară: 1 p; enunț corect: 1 p (5 p).
Din oficiu: 1 p. Total: 10 p.')
on conflict (id) do nothing;

-- Adaptări CES
insert into public.edu_resurse_ces
    (id, title, description, body, grade, sort_order, published, support_type, adaptation_notes)
values
    ('3e4d51b8-9e76-5add-be2e-7dd3e2646228', '[TEST] Cerințe scurte despre un enunț', 'Material demonstrativ pentru testarea paginii, filtrelor și afișării. Poate fi editat sau șters din administrare.', 'Citește: „Pisica doarme pe scaun.”

1. Cine doarme? Alege: pisica / scaunul.
2. Unde doarme? Alege: pe scaun / în grădină.
3. Spune sau scrie răspunsul.

Răspunsuri: pisica; pe scaun.', '5', 99991, true, 'Cerințe simplificate', 'Prezintă câte o sarcină pe rând și citește-o la cerere. Pot fi folosite imagini. Exemplu demonstrativ, de adaptat la nevoile elevului; nu constituie un plan individualizat.'),
    ('4bedf0bd-2faa-5a56-887c-6e61a64af51e', '[TEST] Construirea unui enunț pe pași', 'Material demonstrativ pentru testarea paginii, filtrelor și afișării. Poate fi editat sau șters din administrare.', 'Cuvinte de sprijin: copilul / citește / cartea.

Pasul 1: alege cine face acțiunea.
Pasul 2: alege acțiunea.
Pasul 3: completează cu obiectul și citește enunțul.

Exemplu: „Copilul citește cartea.”', '6', 99992, true, 'Activitate pe pași', 'Folosește cartonașe cu text mare și lasă elevului timp să le ordoneze. Acceptă răspuns oral sau scris. Dificultatea și sprijinul se ajustează individual.')
on conflict (id) do nothing;

-- Analiză și diagnoză
insert into public.edu_centralizatoare_swot
    (id, title, description, body, grade, sort_order, published, analysis_type, purpose, strengths, weaknesses, opportunities, threats)
values
    ('32feea34-32c2-5601-a429-dedf927f0329', '[TEST] Analiza lecturii — exemplu SWOT', 'Material demonstrativ pentru testarea paginii, filtrelor și afișării. Poate fi editat sau șters din administrare.', 'Exemplu fictiv pentru verificarea matricei SWOT. Nu descrie o clasă reală.

Măsură posibilă: două activități de extragere a ideii principale, urmate de o verificare scurtă.', '6', 99991, true, 'Analiză SWOT', 'Alegerea activităților de consolidare a lecturii', 'Elevii identifică personajele și locul acțiunii.', 'Formularea ideii principale necesită sprijin.', 'Lectură în perechi și texte scurte.', 'Timp redus pentru exersare individuală.'),
    ('03a35b87-5270-5488-a0c5-8572942a5cba', '[TEST] Centralizator demonstrativ al rezultatelor', 'Material demonstrativ pentru testarea paginii, filtrelor și afișării. Poate fi editat sau șters din administrare.', 'DATE FICTIVE

Competență | Reușit | Necesită sprijin
Informații explicite | 14 | 4
Ideea principală | 10 | 8
Justificarea opiniei | 8 | 10

Total exemplu: 18 elevi pentru fiecare competență. Numerele sunt fictive.', '7', 99992, true, 'Centralizator', 'Identificarea competențelor care necesită intervenție', '', '', '', '')
on conflict (id) do nothing;

-- Planuri de intervenție
insert into public.edu_planuri_interventie
    (id, title, description, body, grade, sort_order, published, objective, duration_weeks, success_criteria)
values
    ('66a48b7a-c177-55d6-b1f4-f9c83da01d88', '[TEST] Plan pentru identificarea ideii principale', 'Material demonstrativ pentru testarea paginii, filtrelor și afișării. Poate fi editat sau șters din administrare.', '1. Citirea unui text scurt și sublinierea informațiilor esențiale.
2. Formularea ideii principale în perechi.
3. Aplicarea individuală pe un text nou.
4. Feedback și reluarea dificultăților observate.

Model demonstrativ, adaptabil clasei.', '6', 99991, true, 'Formularea ideii principale pentru două texte scurte', 2, 'Elevul formulează pentru fiecare text un enunț care păstrează informația esențială și omite detaliile secundare. Profesorul stabilește sprijinul și criteriile finale.'),
    ('566c2ade-a53d-5040-aa65-8a99a9b759e5', '[TEST] Plan pentru un paragraf coerent', 'Material demonstrativ pentru testarea paginii, filtrelor și afișării. Poate fi editat sau șters din administrare.', 'Săptămâna 1: ordonarea unor enunțuri și folosirea conectorilor.
Săptămâna 2: redactarea ghidată a unui paragraf.
Săptămâna 3: redactare individuală, revizuire și feedback.

Model demonstrativ; ritmul se ajustează după evaluare.', '7', 99992, true, 'Redactarea unui paragraf cu o idee centrală și enunțuri legate logic', 3, 'Paragraful are o idee centrală, minimum două detalii relevante și legături logice între enunțuri. Se verifică separat ortografia și punctuația.')
on conflict (id) do nothing;

-- Fișe remediale
insert into public.edu_activitati_remediale
    (id, title, description, body, grade, sort_order, published, competence, difficulty, answers)
values
    ('684ac61d-9f7a-544e-9918-946271640b12', '[TEST] Idee principală sau detaliu?', 'Material demonstrativ pentru testarea paginii, filtrelor și afișării. Poate fi editat sau șters din administrare.', 'Text original: „Andrei a plantat un copac. A săpat o groapă, a așezat rădăcinile și a udat pământul.”

Alege ideea principală:
A. Andrei a udat pământul.
B. Andrei a plantat un copac.

Scrie apoi un detaliu care susține ideea principală.', '6', 99991, true, 'Distingerea ideii principale de detalii', 'Cu sprijin', 'B. Enunțul A descrie doar un pas. Detaliu posibil: a săpat o groapă. Se acceptă și celelalte acțiuni secundare din text.'),
    ('bf50ddbe-8ec2-5fbc-850d-cce5b34b9b4f', '[TEST] Leagă enunțurile într-un paragraf', 'Material demonstrativ pentru testarea paginii, filtrelor și afișării. Poate fi editat sau șters din administrare.', 'Ordonează logic enunțurile:
A. La final, au prezentat afișul colegilor.
B. Elevii au ales tema proiectului.
C. Apoi au selectat informațiile și au realizat afișul.

Transcrie paragraful și subliniază două indicii ale succesiunii.', '7', 99992, true, 'Organizarea logică a unui text', 'Consolidare', 'Ordinea: B, C, A. Indicii: „Apoi” și „La final”.')
on conflict (id) do nothing;

-- Planificări și proiectări
insert into public.edu_documente_planificare
    (id, title, description, body, grade, sort_order, published, document_type, school_year, unit_title)
values
    ('d4e68d3f-42a4-5391-934d-f5ec37cec27a', '[TEST] Structură de proiectare pentru o unitate', 'Material demonstrativ pentru testarea paginii, filtrelor și afișării. Poate fi editat sau șters din administrare.', 'MODEL ORIENTATIV

1. Competențe vizate: de completat potrivit programei.
2. Conținuturi: texte suport și activități de lectură.
3. Activități: lectură ghidată, discuții, exerciții și reflecție.
4. Resurse: texte, fișe și instrumente de evaluare.
5. Evaluare: verificare inițială, feedback și sarcină finală.

Nu este o planificare oficială și necesită adaptare.', '6', 99991, true, 'Proiectare pe unitate', '2026–2027', 'Lectura și ideea principală'),
    ('b7f88f88-8959-563f-9bd7-aedd668ffe90', '[TEST] Schiță pentru o lecție de vocabular', 'Material demonstrativ pentru testarea paginii, filtrelor și afișării. Poate fi editat sau șters din administrare.', 'MODEL ORIENTATIV

Tema: sinonime în context.
Obiectiv: alegerea unui cuvânt cu sens asemănător într-un enunț.
Etape: activarea cunoștințelor; analizarea exemplelor; exersare ghidată; aplicare individuală; feedback.
Resurse: enunțuri și cartonașe cu perechi de cuvinte.
Evaluare: trei înlocuiri explicate oral sau în scris.

Document demonstrativ, de adaptat clasei.', '5', 99992, true, 'Proiect de lecție', '2026–2027', 'Sinonime în context')
on conflict (id) do nothing;

commit;

-- Verificare: 9 rânduri, cu 2 materiale în fiecare colecție.
select 'Fișe vizuale' as colectie, count(*) as materiale_test, count(*) filter (where published) as publicate from public.edu_fise_vizuale where id in ('69417828-83d7-5625-8ecc-e6fd30b49d1e', '2b0a286f-69f6-5cf0-a319-dde75550dbfe')
union all
select 'Pregătire pentru Evaluarea Națională' as colectie, count(*) as materiale_test, count(*) filter (where published) as publicate from public.edu_antrenament_examen where id in ('cdf0ef0a-94fa-581a-9b3f-cabff2bfff26', 'c7c745d0-e59d-500c-9e21-851e34e1c678')
union all
select 'Exerciții pe competențe' as colectie, count(*) as materiale_test, count(*) filter (where published) as publicate from public.edu_exercitii_competente where id in ('6a6c6165-852f-5b73-a3ed-8a36ca05a856', 'e46e2863-4821-5efd-a0e3-a48e0c4b8de7')
union all
select 'Teste și bareme' as colectie, count(*) as materiale_test, count(*) filter (where published) as publicate from public.edu_teste_bareme where id in ('9c67cf3f-5c6d-50d8-8909-46234e4916f0', '60808aef-e98c-5ee6-81e7-2e14a8e79168')
union all
select 'Adaptări CES' as colectie, count(*) as materiale_test, count(*) filter (where published) as publicate from public.edu_resurse_ces where id in ('3e4d51b8-9e76-5add-be2e-7dd3e2646228', '4bedf0bd-2faa-5a56-887c-6e61a64af51e')
union all
select 'Analiză și diagnoză' as colectie, count(*) as materiale_test, count(*) filter (where published) as publicate from public.edu_centralizatoare_swot where id in ('32feea34-32c2-5601-a429-dedf927f0329', '03a35b87-5270-5488-a0c5-8572942a5cba')
union all
select 'Planuri de intervenție' as colectie, count(*) as materiale_test, count(*) filter (where published) as publicate from public.edu_planuri_interventie where id in ('66a48b7a-c177-55d6-b1f4-f9c83da01d88', '566c2ade-a53d-5040-aa65-8a99a9b759e5')
union all
select 'Fișe remediale' as colectie, count(*) as materiale_test, count(*) filter (where published) as publicate from public.edu_activitati_remediale where id in ('684ac61d-9f7a-544e-9918-946271640b12', 'bf50ddbe-8ec2-5fbc-850d-cce5b34b9b4f')
union all
select 'Planificări și proiectări' as colectie, count(*) as materiale_test, count(*) filter (where published) as publicate from public.edu_documente_planificare where id in ('d4e68d3f-42a4-5391-934d-f5ec37cec27a', 'b7f88f88-8959-563f-9bd7-aedd668ffe90')
order by colectie;
