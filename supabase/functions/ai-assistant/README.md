# Profesor AI online

`index.ts` este sursa funcției Supabase existente, furnizată pentru această remediere. Modificările pentru răspunsurile întrerupte sunt:

- `generationConfig.maxOutputTokens`: 600 → 4096;
- limita fiecărui mesaj trimis modelului: 1000 → 8000 de caractere, pentru a păstra întrebarea și textul de studiu acceptate de interfață;
- metadatele `finish_reason` și `temporary_error` sunt păstrate, iar interfața le folosește pentru a distinge răspunsurile incomplete și fragmentele de rezervă.

4096 este un plafon, nu o garanție că orice răspuns încape. Un răspuns cu `finish_reason: "MAX_TOKENS"` este incomplet. Modelul, autentificarea și căutarea surselor păstrează configurația furnizată pentru funcția existentă.

## Publicare în Supabase

1. Deschide proiectul `eagjavifluwolqeuctzk` → **Edge Functions → ai-assistant**.
2. Păstrează o copie a codului și a setărilor publicate înainte de actualizare.
3. În editor, înlocuiește codul cu conținutul complet din `index.ts` și publică funcția prin **Deploy updates**.
4. Păstrează setările de autentificare ale funcției existente. Funcția validează sesiunea în cod folosind `auth.getUser(token)`.
5. Păstrează secretele existente `GEMINI_API_KEY` și variabilele Supabase furnizate de platformă. Valorile nu se introduc în repository sau în codul browserului.

Publicarea funcției este separată de publicarea site-ului. Site-ul trebuie actualizat și cu `js/site/ai-assistant.js` pentru mesajele despre răspunsuri incomplete.

## Verificare

Cu Node.js 24 și `jsdom` disponibil, din rădăcina repository-ului:

```sh
NODE_PATH="/workspace/.cloud-onboarding/test/node_modules${NODE_PATH:+:$NODE_PATH}" \
  node --test tests/ai-assistant-function.test.cjs tests/ai-online.test.cjs
```

Testele rulează handlerul funcției cu Supabase și Gemini simulate; nu publică funcția și nu consumă cereri Gemini.

După publicare, autentifică-te pe site și cere o explicație detaliată despre un material indexat. Verifică în răspunsul cererii `ai-assistant` că textul este întreg și `finish_reason` este `STOP`. Dacă apare `MAX_TOKENS`, interfața trebuie să afișeze mesajul de răspuns incomplet. Dacă apare `temporary_error: true`, verifică jurnalele funcției pentru indisponibilitatea Gemini; fragmentul de rezervă nu este un răspuns AI complet.
