# Colecții dedicate

## Configurare

În **Supabase → SQL Editor**, rulează în ordine:

1. `education-resources.sql`: creează cele zece colecții educaționale de bază, cu tabele distincte, RLS și bucketul privat `ResurseEducationale`.
2. `manuale-digitale.sql`: adaugă colecția Manuale digitale și accesul la fișierele sale. Vezi [instrucțiunile](MANUALE_DIGITALE.md).
3. Reîncarcă site-ul și panoul administratorului.

Aceste scripturi nu au fost executate automat. Autorii, operele, clasele și capitolele existente, quiz-urile, contribuțiile profesorilor și numerele revistei nu sunt modificate.

## Organizare

| Acces în administrare | Colecție | Câmpuri specifice |
| --- | --- | --- |
| Resurse elevi | Fișe vizuale | Temă și formatul fișei |
| Resurse elevi | Evaluarea Națională | Domeniu, timp recomandat, rezolvări |
| Resurse elevi | Exerciții pe competențe | Competență, nivel, răspunsuri |
| Resurse profesori | Teste și bareme | Tip evaluare, durată, punctaj, barem |
| Resurse profesori | Adaptări CES | Tipul sprijinului, recomandări |
| Resurse profesori | Analiză și diagnoză | Centralizator/SWOT, scop |
| Resurse profesori | Planuri de intervenție | Obiectiv, săptămâni, criterii de progres |
| Resurse profesori | Fișe remediale | Competență, nivel, răspunsuri |
| Resurse profesori | Planificări | Tip document, an școlar, unitate |
| Revistă | Revista elevilor | Autor/pseudonim, tipul creației, notă |

Fiecare colecție are propriul formular, propria listă și propria pagină. Codul reutilizează funcțiile de salvare și afișare, fără selector comun de categorie. În panoul Revistă, instrumentele existente pentru contribuțiile profesorilor și publicarea numerelor rămân disponibile.

## Pagini statice

`#informatii-adeverinte` explică faptul că platforma nu emite automat adeverințe. `#reguli-publicare` descrie trimiterea și revizuirea contribuțiilor. Niciuna nu are tabelă sau editor de materiale. Aceste pagini nu pretind existența unui regulament oficial ori a unor termene neanunțate.

## Publicare și fișiere

Materialele noi sunt ciorne implicit. Numai administratorii pot scrie în tabele și în bucket; vizitatorii văd numai înregistrările publicate. Fișierele publicate se deschid după autentificare, prin URL semnat pentru 5 minute. Retragerea nu invalidează un URL deja semnat înainte de expirarea lui.

Sunt acceptate PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX și PNG/JPG/JPEG/WEBP, maximum 20 MB. La editare poți păstra, înlocui sau elimina atașamentul. Dacă salvarea eșuează, încărcarea nouă este curățată; fișierul anterior nu este șters înainte de confirmarea salvării.

Verifică după aplicarea SQL: creează o ciornă, public-o, filtreaz-o în pagina publică, deschide atașamentul autentificat, editează, retrage și șterge resursa de verificare. Conturile fără rol admin nu trebuie să poată scrie.
