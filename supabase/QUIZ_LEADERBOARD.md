# Clasamentul jocurilor

Rulează o singură dată [quiz-leaderboard.sql](quiz-leaderboard.sql) în SQL Editor din Supabase, după crearea tabelelor `profiles` și `quizzes`. Scriptul poate fi rulat din nou. Nu importă scorurile vechi, care puteau conține bonusuri.

Fiecare elev acumulează câte **1 punct pentru fiecare răspuns corect** din jocurile finalizate după activare. Nu există bonus de final. Clasamentul este comun între dispozitive și poate fi citit de utilizatorii autentificați. Elevii sunt afișați prin identificatori de forma `Elev 12345678`, fără adrese de email.

Clientul folosește trei funcții Supabase:

- `submit_quiz_score(p_attempt_id, p_quiz_id, p_correct, p_total)` salvează o singură dată rezultatul unei încercări, numai pentru rolul `elev`. Validează quiz-ul publicat și numărul de întrebări; punctajul este numărul răspunsurilor corecte.
- `get_quiz_leaderboard()` întoarce `user_id`, `display_name`, `points` și `games`, în ordinea descrescătoare a punctelor. Egalitățile au o ordine stabilă după identificatorul elevului.
- `reset_quiz_leaderboard()` golește clasamentul numai dacă profilul utilizatorului are rolul `admin`. Progresul personal din `user_progress` rămâne disponibil. Identificatorii tehnici ai încercărilor deja primite sunt păstrați pentru a împiedica reapariția punctelor la retrimiterea lor.

Tabelele interne au RLS activ și nu acordă acces direct clienților. Salvarea și golirea folosesc aceeași blocare tranzacțională, astfel încât un rezultat nu poate fi salvat parțial peste o resetare.

Testele rulează funcțiile și permisiunile în PostgreSQL prin PGlite:

```sh
NODE_PATH=/cale/catre/helper/node_modules node --test tests/quiz-leaderboard-db.test.cjs
```

Helperul trebuie să aibă instalat `@electric-sql/pglite@0.3.14`; nu este o dependență a site-ului.
