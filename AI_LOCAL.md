# Configurația AI actuală

Profesorul AI pentru elevi răspunde online prin funcția Supabase `ai-assistant`; elevul nu descarcă un model și nu are nevoie de WebGPU. Această corecție refolosește contractul original `{messages}` → `{answer}`. Funcția nu este inclusă în depozit; configurarea ei, serviciul AI folosit, costurile, accesul la materiale și răspunsurile reale nu au fost verificate. Cheia serviciului AI se păstrează doar pe server. Nu se promite gratuitate nelimitată.

Generatorul de quiz-uri și fișe pentru administrator rămâne local și necesită activarea/descărcarea descrise mai jos. Notele despre asistentul elevilor din secțiunea istorică nu mai descriu comportamentul actual.

## Istoric: integrarea locală inițială

# AI local gratuit — variantă de test

Integrarea folosește WebLLM 0.2.85 și Qwen3-4B-q4f16_1-MLC. Inferența se face în browser, într-un Web Worker. Nu există cheie API, apel de inferență către Supabase/Gemini/OpenAI sau trecere automată la un serviciu plătit. Găzduirea, traficul și stocarea site-ului își păstrează condițiile existente.

## Utilizare

- Elev: autentificare → Cont → Profesor AI → Activează AI local → alege clasa → scrie întrebarea. Poate adăuga manual un text de studiu. Asistentul oferă fragmentele-sursă ca titluri, fără a pretinde că fiecare afirmație este verificată.
- Administrator: Admin → Quiz-uri → Activează AI local → clasa, tema și textul sursă → Generează cu AI sau Generează o fișă cu barem.
- Quiz-ul generat intră în editor ca material nou, cu publicarea debifată. Fișa și baremul sunt editabile și separate; baremul este într-o secțiune închisă inițial. Nimic nu este salvat sau publicat automat.
- Oprește AI întrerupe încărcarea/generarea și eliberează worker-ul. Modelul descărcat poate rămâne în memoria cache a browserului. Pentru a-l elimina, șterge datele site-ului din browser.

## Cerințe și limite

Prima activare este explicită și descarcă aproximativ 2,5 GB de model, plus componentele motorului. Sunt necesare HTTPS (sau localhost), WebGPU, shader-f16, suficient spațiu local și aproximativ 4 GB memorie grafică disponibilă. Memoria necesară variază cu dispozitivul. Nu toate telefoanele sau calculatoarele școlii sunt compatibile. Modelul și runtime-ul sunt descărcate de la jsDelivr, Hugging Face și serverele MLC, dar mesajele nu sunt trimise unui furnizor de inferență.

Un model local de această dimensiune poate greși în română și nu garantează conformitatea cu programa sau DOOM. Profesorul trebuie să verifice fiecare rezultat înainte de folosire. Generarea are o limită de 3 minute per răspuns; quiz-urile mai lungi sunt generate în loturi de două întrebări. Oprirea sau o eroare păstrează editorul existent.

## Materiale și acces

Citirile folosesc exclusiv clientul Supabase existent, cu sesiunea utilizatorului și politicile RLS deja instalate. Codul nu modifică politicile și nu expune o cheie de serviciu. Caută în `documente_ai.text_extras`, `limba_materiale.continut_ai` și coloanele `opere.continut_*`. Unele tabele pot lipsi sau pot fi inaccesibile; sursele disponibile rămân utilizabile. Dacă nu există text relevant, utilizatorul este invitat să adauge un fragment manual. Nu se generează un răspuns fără sursă.

Căutarea este lexicală, cu maximum 12 rezultate/tabel și trei fragmente de aproximativ 950 de caractere. Nu reprezintă citirea integrală a bibliotecii și nu înlocuiește OCR. Nu se schimbă indexarea documentelor. Promptul spune modelului să trateze sursele ca date, dar aceasta nu garantează fidelitatea răspunsurilor. Dialogul nu se salvează pe server sau în localStorage și este golit la deconectare.

## Verificare

`node --test tests/ai-local.test.cjs`

Test de integrare DOM (necesită `jsdom` disponibil în Node): `node tests/ai-dom-check.cjs`. Verifică alegerea clasei, afișarea sigură a textului, deconectarea în timpul generării, completarea editorului, starea de ciornă, baremul separat și rolul administratorului. Browserul Chromium nu a putut fi instalat în mediul de dezvoltare; randarea vizuală și inferența GPU rămân de verificat.

Verifică validarea quiz-urilor, separarea baremului, recuperarea surselor cu tabele indisponibile și eroarea pentru browser fără WebGPU. Verificările de interfață cu un motor simulat nu constituie verificarea calității modelului.

Înainte de publicare: testează pe un calculator compatibil descărcarea, un răspuns real în română, o fișă și fiecare tip de quiz; verifică accesul elevului la textele din Supabase. Performanța modelului și accesul la baza de date reală nu au fost confirmate în mediul de dezvoltare.

## Referințe

- https://webllm.mlc.ai/docs/
- https://github.com/mlc-ai/web-llm
- https://huggingface.co/mlc-ai/Qwen3-4B-q4f16_1-MLC

Instrucțiunile vechi despre Edge Functions din README și SUPABASE_AI_DOCUMENTE.md descriu integrarea anterioară. Nu sunt necesare pentru această variantă locală.
