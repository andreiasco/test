// Componentă de layout: quiz-page.js
const QUIZ_HTML = `
<div id="pagina-quiz" class="pagina">
<section id="quiz">
    <div class="quiz-page-heading">
        <span class="quiz-page-icon" aria-hidden="true">🏰</span>
        <div>
            <h2 class="titlu">Quiz-uri aventură</h2>
            <p class="subtitlu">Intră în castel, înfruntă monștrii și păstrează-ți cele 3 vieți până la final.</p>
        </div>
    </div>

    <div class="quiz-selectie" role="tablist" aria-label="Tipuri de quiz">
        <button class="quiz-tab interactive activ" type="button" data-quiz-tab="interactive">🏰 Aventură 3D</button>
        <button class="quiz-tab kahoot" type="button" data-quiz-tab="kahoot">🎯 Kahoot</button>
        <button class="quiz-tab wordwall" type="button" data-quiz-tab="wordwall">🧩 Wordwall</button>
    </div>

    <div id="interactive" class="quizuri quiz-interactive-section">
        <div id="quizInteractiveLista" class="interactive-quiz-list">
            <p class="quiz-empty">Se încarcă quiz-urile...</p>
        </div>

        <div id="quizPlayer" class="quiz-player castle-player ascuns">
            <div class="quiz-player-topbar castle-topbar">
                <button type="button" id="quizCloseButton" class="quiz-close-btn" aria-label="Ieși din quiz">← Ieși din castel</button>
                <strong id="quizPlayerTitle">Aventura din castel</strong>
                <span id="quizLiveScore">Scor: 0</span>
            </div>

            <div class="castle-hud" aria-live="polite">
                <div class="castle-lives-wrap">
                    <span class="castle-hud-label">Vieți</span>
                    <div id="quizLives" class="castle-lives" aria-label="3 vieți">❤️ ❤️ ❤️</div>
                </div>
                <div class="castle-progress-wrap">
                    <div class="quiz-progress-track"><div id="quizProgressBar"></div></div>
                    <span id="quizCounter">Monstrul 1</span>
                </div>
                <div class="castle-timer-wrap">
                    <span class="castle-hud-label">Timp</span>
                    <span id="quizTimer" class="quiz-timer">20s</span>
                </div>
            </div>

            <div id="castleScene" class="castle-scene" aria-label="Scenă 3D într-un castel">
                <canvas id="castleCanvas"></canvas>
                <div class="castle-vignette" aria-hidden="true"></div>
                <div id="castleLoading" class="castle-loading">Se pregătește castelul...</div>
                <div id="castleDialogue" class="castle-dialogue ascuns" aria-live="polite"></div>
                <button type="button" id="castleSkipAnimation" class="castle-skip ascuns">Sari animația »</button>
            </div>

            <div id="quizQuestionStage" class="castle-question-stage"></div>
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
