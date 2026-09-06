// Formular pentru crearea și editarea quiz-urilor tip aventură în castel.
const ADMIN_QUIZ_FORM_HTML = `
<section class="admin-section admin-quiz-section">
    <div class="admin-section-heading">
        <div>
            <h3>🏰 Creator quiz aventură</h3>
            <p>Creează un quiz în care elevul traversează un castel cu 3 vieți și întâlnește câte un monstru la fiecare întrebare.</p>
        </div>
    </div>

    <form id="quizAdminForm" class="quiz-admin-form">
        <input type="hidden" id="quizEditId" value="">

        <div class="quiz-admin-grid quiz-admin-grid-main">
            <label>
                Titlu quiz
                <input id="quizTitlu" type="text" maxlength="120" required placeholder="Ex.: Aventura verbului">
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
                Dificultate
                <select id="quizDificultate">
                    <option value="easy">Ușor</option>
                    <option value="medium" selected>Mediu</option>
                    <option value="hard">Greu</option>
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

            <label>
                Tip aventură
                <select id="quizGameMode">
                    <option value="castle_adventure" selected>🏰 Castel cu monștri</option>
                </select>
            </label>

            <label class="quiz-admin-publish">
                <span>Vizibil elevilor</span>
                <input id="quizPublicat" type="checkbox" checked>
            </label>
        </div>

        <div class="quiz-admin-rule-card">
            <strong>Regulile aventurii</strong>
            <span>❤️❤️❤️ 3 vieți</span>
            <span>❌ Răspuns greșit = −1 viață</span>
            <span>💀 0 vieți = quiz încheiat</span>
            <span>🐉 Ultimul monstru devine boss final</span>
        </div>

        <label>
            Descriere / introducerea aventurii
            <textarea id="quizDescriere" rows="2" maxlength="300" placeholder="Ex.: Intră în castel și învinge monștrii gramaticii!"></textarea>
        </label>

        <div class="quiz-question-editor-head">
            <div>
                <h4>Scene și monștri</h4>
                <p>Fiecare întrebare reprezintă o întâlnire cu un monstru.</p>
            </div>
            <button type="button" class="admin-btn" id="adaugaIntrebareQuiz">➕ Adaugă monstru</button>
        </div>

        <div id="quizQuestionsEditor" class="quiz-questions-editor"></div>

        <p id="quizAdminMesaj" class="admin-message" aria-live="polite"></p>

        <div class="quiz-admin-actions">
            <button type="button" class="admin-btn secondary" id="previzualizeazaQuizAdmin">▶ Previzualizare</button>
            <button type="submit" class="admin-btn">💾 Salvează quiz-ul</button>
            <button type="button" class="admin-btn secondary ascuns" id="anuleazaEditareQuiz">Anulează editarea</button>
        </div>
    </form>
</section>
`;
