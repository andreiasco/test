// Formular pentru crearea și editarea quiz-urilor animate.
const ADMIN_QUIZ_FORM_HTML = `
<section class="admin-section admin-quiz-section">
    <div class="admin-section-heading">
        <div>
            <h3>🎬 Creator quiz animat</h3>
            <p>Alege tipul jocului, apoi creează provocările. Toate modurile folosesc aventura din castel și cele 3 vieți.</p>
        </div>
    </div>

    <form id="quizAdminForm" class="quiz-admin-form">
        <input type="hidden" id="quizEditId" value="">

        <div class="quiz-mode-picker" role="radiogroup" aria-label="Tip quiz">
            <label class="quiz-mode-option"><input type="radio" name="quizMode" value="castle_choice" checked><span><b>🎯 Alege răspunsul</b><small>Întrebare cu 2–4 variante.</small></span></label>
            <label class="quiz-mode-option"><input type="radio" name="quizMode" value="castle_true_false"><span><b>✅ Adevărat / Fals</b><small>Doar afirmații adevărate sau false.</small></span></label>
            <label class="quiz-mode-option"><input type="radio" name="quizMode" value="castle_hangman"><span><b>🪢 Spânzurătoarea</b><small>Elevul descoperă cuvântul literă cu literă.</small></span></label>
            <label class="quiz-mode-option"><input type="radio" name="quizMode" value="castle_ordering"><span><b>🔀 Pune în ordine</b><small>Elevul reconstruiește ordinea corectă.</small></span></label>
        </div>
        <input type="hidden" id="quizGameMode" value="castle_choice">

        <div class="quiz-admin-grid quiz-admin-grid-main">
            <label>Titlu quiz<input id="quizTitlu" type="text" maxlength="120" required placeholder="Ex.: Aventura verbului"></label>
            <label>Clasa<select id="quizClasa" required><option value="5">Clasa a V-a</option><option value="6">Clasa a VI-a</option><option value="7">Clasa a VII-a</option><option value="8">Clasa a VIII-a</option><option value="general">General</option></select></label>
            <label>Dificultate<select id="quizDificultate"><option value="easy">Ușor</option><option value="medium" selected>Mediu</option><option value="hard">Greu</option></select></label>
            <label>Timp / provocare<select id="quizTimp"><option value="20">20 secunde</option><option value="30" selected>30 secunde</option><option value="45">45 secunde</option><option value="60">60 secunde</option><option value="90">90 secunde</option></select></label>
            <label class="quiz-admin-publish"><span>Vizibil elevilor</span><input id="quizPublicat" type="checkbox" checked></label>
        </div>

        <div id="quizModeDescription" class="quiz-admin-rule-card"></div>

        <div class="quiz-ai-generator">
            <div class="quiz-ai-generator-head">
                <div><h4>✨ Generează provocările cu AI</h4><p>AI-ul completează editorul. Verifică întrebările înainte să salvezi sau să publici.</p></div>
            </div>
            <div class="quiz-ai-generator-grid">
                <label>Tema quiz-ului<input id="quizAiTema" type="text" maxlength="180" placeholder="Ex.: Verbul, modurile și timpurile verbale"></label>
                <label>Număr provocări<select id="quizAiCount"><option>3</option><option>5</option><option selected>8</option><option>10</option><option>12</option></select></label>
            </div>
            <div class="quiz-ai-generator-actions">
                <button type="button" class="admin-btn" id="genereazaQuizAI">✨ Generează cu AI</button>
                <p id="quizAiStatus" class="quiz-ai-generator-status" aria-live="polite"></p>
            </div>
        </div>

        <label>Descriere / introducerea aventurii<textarea id="quizDescriere" rows="2" maxlength="300" placeholder="Ex.: Intră în castel și treci de toate provocările!"></textarea></label>

        <div class="quiz-question-editor-head">
            <div><h4 id="quizEditorHeading">Provocări</h4><p id="quizEditorHelp">Fiecare provocare reprezintă o întâlnire cu un monstru.</p></div>
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
