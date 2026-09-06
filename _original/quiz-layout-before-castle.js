// Componentă de layout: quiz-page.js
const QUIZ_HTML = `
<div id="pagina-quiz" class="pagina">
<section id="quiz">
    <div class="quiz-page-heading">
        <span class="quiz-page-icon" aria-hidden="true">🎮</span>
        <div>
            <h2 class="titlu">Quiz-uri</h2>
            <p class="subtitlu">Învață prin joc, răspunde contra-cronometru și strânge cât mai multe puncte.</p>
        </div>
    </div>

    <div class="quiz-selectie" role="tablist" aria-label="Tipuri de quiz">
        <button class="quiz-tab interactive activ" type="button" data-quiz-tab="interactive">✨ Quiz interactiv</button>
        <button class="quiz-tab kahoot" type="button" data-quiz-tab="kahoot">🎯 Kahoot</button>
        <button class="quiz-tab wordwall" type="button" data-quiz-tab="wordwall">🧩 Wordwall</button>
    </div>

    <div id="interactive" class="quizuri quiz-interactive-section">
        <div id="quizInteractiveLista" class="interactive-quiz-list">
            <p class="quiz-empty">Se încarcă quiz-urile...</p>
        </div>

        <div id="quizPlayer" class="quiz-player ascuns">
            <div class="quiz-player-topbar">
                <button type="button" id="quizCloseButton" class="quiz-close-btn" aria-label="Închide quiz-ul">← Înapoi</button>
                <strong id="quizPlayerTitle">Quiz</strong>
                <span id="quizLiveScore">Scor: 0</span>
            </div>

            <div class="quiz-progress-track" aria-hidden="true"><div id="quizProgressBar"></div></div>
            <div class="quiz-player-info">
                <span id="quizCounter">Întrebarea 1</span>
                <span id="quizTimer" class="quiz-timer">20s</span>
            </div>

            <div id="quizQuestionStage"></div>
            <div id="quizRezultat" class="quiz-result ascuns"></div>
        </div>
    </div>

    <div id="kahoot" class="quizuri ascuns">
        <div class="kahoot-card">
            <h3>📝 Aplicarea regulilor în contexte noi</h3>
            <p>Exersează aplicarea regulilor de limbă română.</p>
            <a class="kahoot-link" href="https://play.kahoot.it/v2/?quizId=071aa0d4-21d3-426f-a7a3-4c8ab375d61b&hostId=abe4ceb9-8934-4647-a7f8-ee81f1f1ac7c" target="_blank" rel="noopener noreferrer">🎯 Deschide Kahoot</a>
        </div>
        <div class="kahoot-card">
            <h3>📚 Romanian Vocabulary in Context</h3>
            <p>Exersează vocabularul românesc.</p>
            <a class="kahoot-link" href="https://play.kahoot.it/v2/?quizId=bf406337-3185-409c-92c7-22471cf41e38&hostId=abe4ceb9-8934-4647-a7f8-ee81f1f1ac7c" target="_blank" rel="noopener noreferrer">🎯 Deschide Kahoot</a>
        </div>
    </div>

    <div id="wordwall" class="quizuri ascuns">
        <div class="quiz-card">
            <h3>🔤 Conjuncții de coordonare</h3>
            <iframe src="https://www.wordwall.net/resource/71605201/limba-rom%C3%A2n%C4%83/conjunc%C8%9Bii-coordonare" title="Conjuncții de coordonare" allowfullscreen></iframe>
        </div>
        <div class="quiz-card">
            <h3>✍️ Recapitulare – Verbul</h3>
            <iframe src="https://www.wordwall.net/resource/71415598/limba-rom%C3%A2n%C4%83/recapitulare-vi-viii-verbul" title="Recapitulare verb" allowfullscreen></iframe>
        </div>
    </div>
</section>
</div>`;
