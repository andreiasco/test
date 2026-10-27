// Componentă de layout: quiz-page.js
const QUIZ_HTML = `
<div id="pagina-quiz" class="pagina">
<section id="quiz">
    <span id="jocuri" aria-hidden="true"></span>
    <div class="quiz-page-heading">
        <span class="quiz-page-icon" aria-hidden="true">🏰</span>
        <div>
            <h2 class="titlu">Jocuri și quiz-uri</h2>
            <p class="subtitlu">Alege răspunsul în aventura 3D, descoperă cuvinte, pune-le în ordine sau joacă Adevărat / Fals.</p>
        </div>
    </div>

    <div id="interactive" class="quizuri quiz-interactive-section">
        <div id="quizInteractiveLista" class="interactive-quiz-list">
            <p class="quiz-empty">Se încarcă quiz-urile...</p>
        </div>

        <div id="quizPlayer" class="quiz-player castle-player ascuns">
            <div class="quiz-player-topbar castle-topbar">
                <button type="button" id="quizCloseButton" class="quiz-close-btn" aria-label="Ieși din quiz">← Ieși din joc</button>
                <div class="quiz-player-title-wrap"><strong id="quizPlayerTitle">Joc interactiv</strong><small id="quizModeLabel">Alege un mod de joc</small><small id="quizWorldLabel">Castel</small></div>
                <div class="castle-topbar-actions"><button type="button" id="quizSoundToggle" class="quiz-sound-btn" aria-pressed="true">🔊 Sunet</button><span id="quizLiveScore">Scor: 0</span></div>
            </div>

            <div class="castle-hud" aria-live="polite">
                <div class="castle-lives-wrap">
                    <span class="castle-hud-label">Vieți</span>
                    <div id="quizLives" class="castle-lives" aria-label="3 vieți">❤️ ❤️ ❤️</div>
                </div>
                <div class="castle-progress-wrap">
                    <div class="quiz-progress-track"><div id="quizProgressBar"></div></div>
                    <span id="quizCounter">Provocarea 1</span>
                </div>
                <div class="castle-timer-wrap">
                    <span class="castle-hud-label">Timp</span>
                    <span id="quizTimer" class="quiz-timer">20s</span>
                </div>
            </div>

            <section id="quizRouteHud" class="quiz-route-hud" aria-label="Traseul aventurii" hidden>
                <div class="quiz-route-heading">
                    <div><span class="quiz-route-eyebrow">Traseul aventurii</span><p id="quizRouteStatus" role="status" aria-live="polite"></p></div>
                    <button type="button" id="quizMapToggle" class="quiz-route-toggle" aria-controls="castleCanvas" aria-pressed="false" disabled>Vezi harta</button>
                </div>
                <ol id="quizRouteStops" class="quiz-route-stops" aria-label="Întâlniri pe traseu"></ol>
            </section>

            <div id="castleScene" class="castle-scene" aria-label="Hartă 3D a aventurii">
                <canvas id="castleCanvas"></canvas>
                <div class="castle-vignette" aria-hidden="true"></div>
                <div id="castleLoading" class="castle-loading">Se pregătește nivelul...</div>
                <div id="castleDialogue" class="castle-dialogue ascuns" aria-live="polite"></div>
                <button type="button" id="castleSkipAnimation" class="castle-skip ascuns">Sari animația »</button>
            </div>

            <div id="quizQuestionStage" class="castle-question-stage"></div>
            <div id="quizRezultat" class="quiz-result ascuns"></div>
        </div>
    </div>

</section>
</div>`;
