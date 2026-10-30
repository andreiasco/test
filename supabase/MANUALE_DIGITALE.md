# Manuale digitale

1. În Supabase → SQL Editor, rulează integral `supabase/manuale-digitale.sql` în proiectul configurat în site. Scriptul necesită tabela existentă `profiles` (rolul `admin`), creează tabela `edu_manuale_digitale` și configurează bucketul privat `ResurseEducationale`, cu limita existentă de 20 MB. Nu este necesar să rulezi din nou scriptul celorlalte colecții.
2. Reîncarcă site-ul și autentifică-te ca administrator. Deschide Panou administrator → Resurse elevi → Manuale digitale.
3. Completează titlul, clasa și materia; opțional descrierea, editura și autorii. Adaugă un fișier de maximum 20 MB sau un link HTTPS. Pentru manuale mai mari poți folosi un link HTTPS.
4. Bifează „Publică” și salvează. Fără această bifă manualul rămâne ciornă, vizibilă doar administratorilor.
5. Verifică pagina `index.html#manuale-digitale`: clasele sunt în ordine de la IX la XII, materiile și titlurile în ordine alfabetică românească. Filtrează după clasă și materie, apoi caută după titlu, materie, editură sau autor.
6. Deschiderea fișierelor folosește autentificarea și URL-uri semnate valabile 5 minute, ca celelalte resurse educaționale. Linkurile externe se deschid într-o filă nouă.
7. Verifică și editarea, retragerea și ștergerea unui manual în admin. Un vizitator nu poate vedea ciorne și nu poate modifica înregistrările.

Scriptul SQL poate fi rulat din nou. La actualizare șterge manualele din afara claselor IX–XII și păstrează manualele de liceu. Dacă rulezi ulterior `education-resources.sql`, acesta păstrează politica separată de citire pentru manuale.
