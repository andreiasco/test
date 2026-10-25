# Profesor AI online

`index.ts` este sursa Profesorului AI online. Funcția autentifică elevul, caută materialele relevante în site și apelează [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses).

- Modelul este `gpt-5.4-mini`, definit prin constanta `MODEL`.
- Cererea folosește `max_output_tokens: 4096` și `reasoning.effort: "low"`.
- Fiecare mesaj păstrează până la 8000 de caractere, pentru a include întrebarea și textul de studiu acceptate de interfață.
- `store: false` dezactivează păstrarea răspunsului pentru recuperare ulterioară prin Responses API.
- Metadatele OpenAI sunt convertite la `finish_reason: "STOP"` sau `"MAX_TOKENS"`; alte întreruperi folosesc `incomplete: true`, iar indisponibilitatea temporară folosește `temporary_error: true`.
- În lipsa materialelor relevante nu se face o cerere OpenAI. Dacă serviciul nu este disponibil, funcția afișează fragmentul de rezervă din site.

4096 este un plafon care include și tokenii de raționament, nu o garanție că orice răspuns încape. Un răspuns cu `finish_reason: "MAX_TOKENS"` sau `incomplete: true` este incomplet. Autentificarea și căutarea surselor păstrează comportamentul funcției existente. Utilizarea API-ului OpenAI se facturează separat de abonamentul ChatGPT.

## Publicare în Supabase

1. Deschide proiectul `eagjavifluwolqeuctzk` → **Edge Functions → ai-assistant**.
2. Păstrează o copie a codului și a setărilor publicate înainte de actualizare.
3. În editor, înlocuiește codul cu conținutul complet din `index.ts` și publică funcția prin **Deploy updates**.
4. Păstrează setările de autentificare ale funcției existente. Funcția validează sesiunea în cod folosind `auth.getUser(token)`.
5. În [Edge Function Secrets](https://supabase.com/dashboard/project/eagjavifluwolqeuctzk/functions/secrets), configurează sau reutilizează `OPENAI_API_KEY`, cu o cheie API OpenAI validă și facturare API activă. Păstrează variabilele Supabase furnizate de platformă. Valorile nu se introduc în repository sau în codul browserului.

Publicarea funcției este separată de publicarea site-ului. Site-ul trebuie actualizat și cu `js/site/ai-assistant.js` pentru mesajele despre răspunsuri incomplete.

## Verificare

Cu Node.js 24 și `jsdom` disponibil, din rădăcina repository-ului:

```sh
NODE_PATH="/workspace/.cloud-onboarding/test/node_modules${NODE_PATH:+:$NODE_PATH}" \
  node --test tests/ai-assistant-function.test.cjs tests/ai-online.test.cjs
```

Testele rulează handlerul funcției cu Supabase și OpenAI simulate; nu publică funcția și nu consumă cereri OpenAI. Acoperă mesajele lungi, istoricul, limitele de generare, întreruperile, refuzurile, indisponibilitatea, retry-ul limitat și lipsa cheii OpenAI.

După publicare, autentifică-te pe site și cere o explicație detaliată despre un material indexat. Verifică în răspunsul cererii `ai-assistant` că `source` este `site+openai`, textul este întreg, `finish_reason` este `STOP` și `incomplete` este `false`. Dacă apare `MAX_TOKENS` sau `incomplete: true`, interfața trebuie să afișeze mesajul de răspuns incomplet. Dacă apare `temporary_error: true`, verifică jurnalele funcției pentru indisponibilitatea OpenAI. Motivul `openai_not_configured` indică lipsa secretului, `rate_limit` indică HTTP 429, iar `openai_error` indică alte probleme de rețea, autorizare sau răspuns. Fragmentul de rezervă nu este un răspuns AI complet.
