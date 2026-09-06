// Formular pentru crearea și editarea quiz-urilor interactive.
const ADMIN_QUIZ_FORM_HTML = `
<section class="admin-section admin-quiz-section">
    <div class="admin-section-heading">
        <div>
            <h3>🎮 Quiz-uri interactive</h3>
            <p>Creează quiz-uri animate care apar automat în pagina Quiz-uri.</p>
        </div>
    </div>

    <form id="quizAdminForm" class="quiz-admin-form">
        <input type="hidden" id="quizEditId" value="">

        <div class="quiz-admin-grid">
            <label>
                Titlu quiz
                <input id="quizTitlu" type="text" maxlength="120" required placeholder="Ex.: Verbul – recapitulare">
            </label>

            <label>
                Clasa
                <select id="quizClasa" required>
                    <option value="5">Clasa a V-a</option>
                    <option value="6">Clasa a VI-a</option>
                    <option value="7">Clasa a VII-a</option>
                    <option value="8">Clasa a VIII-a</option>
                    <option value="general">General</option>
                </select>
            </label>

            <label>
                Timp / întrebare
                <select id="quizTimp">
                    <option value="15">15 secunde</option>
                    <option value="20" selected>20 secunde</option>
                    <option value="30">30 secunde</option>
                    <option value="45">45 secunde</option>
                    <option value="60">60 secunde</option>
                </select>
            </label>

            <label class="quiz-admin-publish">
                <span>Vizibil elevilor</span>
                <input id="quizPublicat" type="checkbox" checked>
            </label>
        </div>

        <label>
            Descriere
            <textarea id="quizDescriere" rows="2" maxlength="300" placeholder="Ce exersează acest quiz?"></textarea>
        </label>

        <div class="quiz-question-editor-head">
            <div>
                <h4>Întrebări</h4>
                <p>Selectează răspunsul corect pentru fiecare întrebare.</p>
            </div>
            <button type="button" class="admin-btn" id="adaugaIntrebareQuiz">➕ Adaugă întrebare</button>
        </div>

        <div id="quizQuestionsEditor" class="quiz-questions-editor"></div>

        <p id="quizAdminMesaj" class="admin-message" aria-live="polite"></p>

        <div class="quiz-admin-actions">
            <button type="submit" class="admin-btn">💾 Salvează quiz-ul</button>
            <button type="button" class="admin-btn secondary ascuns" id="anuleazaEditareQuiz">Anulează editarea</button>
        </div>
    </form>
</section>
`;
