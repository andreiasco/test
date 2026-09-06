# Activare căutare AI în toate documentele

1. În Supabase Dashboard -> SQL Editor, rulează fișierul `supabase/migrations/20260907_documente_ai.sql`.
2. În Edge Functions -> `ai-assistant`, înlocuiește codul cu `supabase/functions/ai-assistant/index.ts` și fă Deploy.
3. Încarcă un PDF sau DOCX din panoul Admin. Textul extras va fi salvat și în `documente_ai`.
4. Profesorul AI caută atât în structura veche (`opere`, `limba_materiale`), cât și în indexul general `documente_ai`.

Observații:
- PDF-urile trebuie să conțină text selectabil. Pentru PDF scanat ca imagine este necesar OCR, care nu este inclus în această versiune.
- `.docx` este suportat. Formatul vechi `.doc` trebuie convertit la `.docx`.
- Upload-ul nu eșuează dacă indexarea generală AI eșuează; apare un avertisment în consolă.
