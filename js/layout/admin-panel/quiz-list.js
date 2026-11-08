// Listă de administrare a quiz-urilor interactive.
const ADMIN_QUIZ_LIST_HTML = `
<section class="admin-section admin-quiz-list-section">
    <div class="admin-section-heading">
        <div>
            <h3>📋 Quiz-uri create</h3>
            <p>Editează, publică sau șterge quiz-urile existente.</p>
        </div>
    </div>
    <div id="quizAdminLista" class="quiz-admin-list">
        <p class="quiz-empty">Se încarcă quiz-urile...</p>
    </div>
</section>
<section class="admin-section quiz-leaderboard" data-quiz-leaderboard data-quiz-leaderboard-admin aria-labelledby="quizAdminLeaderboardTitle" hidden>
    <div class="quiz-leaderboard-heading">
        <div><h3 id="quizAdminLeaderboardTitle">Clasamentul jocurilor</h3><p>1 punct pentru fiecare răspuns corect. Resetarea golește clasamentul pentru toți elevii.</p></div>
        <div class="quiz-leaderboard-actions">
            <button type="button" class="quiz-leaderboard-refresh" data-leaderboard-refresh>Actualizează</button>
            <button type="button" class="quiz-leaderboard-reset" data-leaderboard-reset>Golește clasamentul</button>
        </div>
    </div>
    <p class="quiz-leaderboard-admin-status" data-leaderboard-admin-status role="status"></p>
    <div data-leaderboard-content aria-live="polite"><p class="quiz-leaderboard-message">Se încarcă clasamentul...</p></div>
</section>
`;
