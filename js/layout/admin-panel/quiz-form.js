// Formular pentru crearea și editarea celor patru tipuri de quiz.
const ADMIN_QUIZ_FORM_HTML = `
<section class="admin-section admin-quiz-section">
    <div class="admin-section-heading">
        <div>
            <h3>Creator de jocuri și quiz-uri</h3>
            <p>Alege tipul jocului și creează provocările. Alege răspunsul include aventura 3D, iar Spânzurătoarea are 6 vieți pentru fiecare cuvânt.</p>
        </div>
    </div>

    <form id="quizAdminForm" class="quiz-admin-form">
        <input type="hidden" id="quizEditId" value="">

        <div class="quiz-mode-picker" role="radiogroup" aria-label="Tip quiz">
            <label class="quiz-mode-option"><input type="radio" name="quizMode" value="castle_choice" checked><span><b>🎯 Alege răspunsul</b><small>Întrebări cu variante și lupte între erou și monștri.</small></span></label>
            <label class="quiz-mode-option"><input type="radio" name="quizMode" value="castle_true_false"><span><b>✅ Adevărat / Fals</b><small>Doar afirmații adevărate sau false.</small></span></label>
            <label class="quiz-mode-option"><input type="radio" name="quizMode" value="castle_hangman"><span><b>🪢 Spânzurătoarea</b><small>Desen și cuvânt de descoperit, cu 6 vieți.</small></span></label>
            <label class="quiz-mode-option"><input type="radio" name="quizMode" value="castle_ordering"><span><b>🔀 Pune în ordine</b><small>Cuvinte de așezat în ordinea corectă.</small></span></label>
        </div>
        <input type="hidden" id="quizGameMode" value="castle_choice">

        <fieldset class="quiz-world-picker" id="quizWorldPicker"><legend>Nivelul aventurii</legend>
            <label for="quizWorldTheme">Decor 3D<select id="quizWorldTheme">${Object.entries(QUIZ_WORLDS).map(([key, world]) => `<option value="${key}">${world.label}</option>`).join('')}</select></label>
            <p id="quizWorldDescription" class="quiz-world-description">${QUIZ_WORLDS.castle.description}</p>
            <div id="quizWorldRooms" class="quiz-world-rooms"></div>
            <p class="quiz-admin-hint">Eroul urmează traseul și întâlnește monștrii. Alegerea decorului păstrează întrebările deja introduse.</p>
        </fieldset>

        <div class="quiz-admin-grid quiz-admin-grid-main">
            <label>Titlu quiz<input id="quizTitlu" type="text" maxlength="120" required placeholder="Ex.: Aventura verbului"></label>
            <label>Clasa<select id="quizClasa" required><option value="5">Clasa a V-a</option><option value="6">Clasa a VI-a</option><option value="7">Clasa a VII-a</option><option value="8">Clasa a VIII-a</option><option value="general">General</option></select></label>
            <label>Dificultate<select id="quizDificultate"><option value="easy">Ușor</option><option value="medium" selected>Mediu</option><option value="hard">Greu</option></select></label>
            <label>Timp / provocare<select id="quizTimp"><option value="20">20 secunde</option><option value="30" selected>30 secunde</option><option value="45">45 secunde</option><option value="60">60 secunde</option><option value="90">90 secunde</option></select></label>
            <label class="quiz-admin-publish"><span>Vizibil elevilor</span><input id="quizPublicat" type="checkbox" checked></label>
        </div>

        <div id="quizModeDescription" class="quiz-admin-rule-card"></div>

        <details class="quiz-ai-generator admin-disclosure"><summary><strong>Generare cu AI (opțional)</strong><span class="admin-disclosure-indicator" aria-hidden="true">+</span></summary><div class="admin-disclosure-content">
            <div class="quiz-ai-generator-head">
                <div><h4>✨ Generează provocările cu AI</h4><p>AI-ul completează editorul. Verifică întrebările înainte să salvezi sau să publici.</p></div>
            </div>
            <div class="ai-local-card">
        <strong>AI local, pe acest calculator</strong>
        <p>Prima activare descarcă aproximativ 2,5 GB. Ai nevoie de un calculator cu memorie grafică suficientă (circa 4 GB) și de un browser compatibil. Mesajele sunt procesate local. Răspunsurile pot conține greșeli.</p>
        <button type="button" data-ai-activate data-ai-status="quizLocalStatus">Activează AI local</button>
        <button type="button" data-ai-stop data-ai-status="quizLocalStatus">Oprește AI</button>
        <p id="quizLocalStatus" role="status"></p>
    </div>
            <div class="quiz-ai-generator-grid">
                <label>Tema quiz-ului<input id="quizAiTema" type="text" maxlength="180" placeholder="Ex.: Verbul, modurile și timpurile verbale"></label>
                <label>Număr provocări<select id="quizAiCount"><option>3</option><option>5</option><option selected>8</option><option>10</option><option>12</option></select></label>
            </div>
            <label>Text sursă / repere pentru AI<textarea id="quizAiSource" rows="3" maxlength="6000" placeholder="Copiază teoria sau fragmentul pe baza căruia vrei să generezi. Dacă lași gol, caut în materialele site-ului."></textarea></label>
            <div class="quiz-ai-generator-actions">
                <button type="button" class="admin-btn" id="genereazaQuizAI">✨ Generează cu AI</button>
                <button type="button" class="admin-btn secondary" id="genereazaFisaAI">Generează o fișă cu barem</button>
                <p id="quizAiStatus" class="quiz-ai-generator-status" aria-live="polite"></p>
            </div>
            <section id="aiWorksheetResult" class="ascuns" aria-label="Fișă generată">
                <p>Propunere editabilă. Verifică exactitatea și punctajul înainte de folosire.</p>
                <label>Fișa elevului<textarea id="aiWorksheetText" rows="16"></textarea></label>
                <details><summary>Barem de corectare și notare</summary><textarea id="aiWorksheetAnswers" rows="12" aria-label="Barem editabil"></textarea></details>
            </section>
        </div></details>

        <label>Descriere / introducere<textarea id="quizDescriere" rows="2" maxlength="300" placeholder="Ex.: Intră în aventură și treci de toate provocările!"></textarea></label>

        <div class="quiz-question-editor-head">
            <div><h4 id="quizEditorHeading">Provocări</h4><p id="quizEditorHelp">Scrie cerințele și răspunsurile potrivite tipului de joc.</p></div>
            <button type="button" class="admin-btn" id="adaugaIntrebareQuiz">➕ Adaugă provocare</button>
        </div>
        <div id="quizQuestionsEditor" class="quiz-questions-editor"></div>
        <p id="quizAdminMesaj" class="admin-message" aria-live="polite"></p>
        <div class="quiz-admin-actions">
            <button type="button" class="admin-btn secondary" id="previzualizeazaQuizAdmin">▶ Previzualizare</button>
            <button type="submit" class="admin-btn">💾 Salvează quiz-ul</button>
            <button type="button" class="admin-btn secondary ascuns" id="anuleazaEditareQuiz">Anulează editarea</button>
        </div>
    </form>
</section>`;
