-- Opțional: elimină numai quiz-urile de test cu aceste titluri, niveluri și tipuri.
-- Nu elimină alte quiz-uri și nu modifică structura tabelei.
begin;
delete from public.quizzes where (title,world_theme,game_mode) in (
    ('[TEST] Zăpadă — Alege răspunsul', 'snow', 'castle_choice'),
    ('[TEST] Zăpadă — Adevărat / Fals', 'snow', 'castle_true_false'),
    ('[TEST] Zăpadă — Spânzurătoarea', 'snow', 'castle_hangman'),
    ('[TEST] Zăpadă — Pune în ordine', 'snow', 'castle_ordering'),
    ('[TEST] Deșert — Alege răspunsul', 'desert', 'castle_choice'),
    ('[TEST] Deșert — Adevărat / Fals', 'desert', 'castle_true_false'),
    ('[TEST] Deșert — Spânzurătoarea', 'desert', 'castle_hangman'),
    ('[TEST] Deșert — Pune în ordine', 'desert', 'castle_ordering'),
    ('[TEST] Junglă — Alege răspunsul', 'jungle', 'castle_choice'),
    ('[TEST] Junglă — Adevărat / Fals', 'jungle', 'castle_true_false'),
    ('[TEST] Junglă — Spânzurătoarea', 'jungle', 'castle_hangman'),
    ('[TEST] Junglă — Pune în ordine', 'jungle', 'castle_ordering')
);
commit;
