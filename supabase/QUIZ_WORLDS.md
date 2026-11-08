# Niveluri vizuale pentru quiz-uri


Rulează `supabase/quiz-worlds.sql` în SQL Editor al proiectului Supabase, apoi reîncarcă site-ul. Scriptul adaugă numai coloana `quizzes.world_theme`, cu valoarea implicită `castle` și o constrângere pentru cele patru opțiuni. Nu schimbă întrebările, tipurile, punctajele, rolurile sau politicile existente.

În **Panou administrator → Jocuri**, formularul are secțiunea **Nivelul aventurii**. Decorul este independent de tipul întrebărilor și poate fi schimbat și la editarea unui quiz existent. Selectarea decorului nu resetează provocările. Previziualizarea și butonul Testează folosesc nivelul ales, într-o fereastră separată a panoului.

| Nivel | Camere obișnuite | Cameră finală |
| --- | --- | --- |
| Castel | Biblioteca, Temnița, Sala armelor, Laboratorul, Cripta | Sala Dragonului |
| Zăpadă | Grotă, Refugiu, Pod înghețat, Sala cristalelor | Palatul de gheață |
| Deșert | Dune, Oază, Templu, Obeliscuri | Sanctuarul Soarelui |
| Junglă | Luminiș, Ruine cu liane, Pod între arbori, Cascadă | Arborele străvechi |

Camerele se succed în ordinea provocărilor, apoi se repetă dacă quiz-ul este mai lung. Ultima provocare folosește camera finală. Personajele, cele trei vieți, cele patru tipuri de întrebări și mecanica de punctaj sunt comune tuturor nivelurilor. Decorurile noi sunt procedurale, fără asset-uri externe suplimentare.

Quiz-urile vechi fără o valoare pentru nivel folosesc castelul. Până la aplicarea SQL, citirea quiz-urilor vechi rămâne disponibilă, dar salvarea nivelului cere configurarea coloanei noi. Dacă WebGL nu este disponibil, întrebările pot fi jucate fără scena 3D.

Testele automate verifică selecția, editarea, payloadul de salvare, compatibilitatea cu quiz-urile vechi și construirea tuturor camerelor folosind contractul obiectelor Three.js. Randarea efectivă WebGL și persistența în proiectul Supabase trebuie verificate în browser după aplicarea SQL; migrarea nu a fost executată automat.
