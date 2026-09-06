// ======================================================
// QUIZ-URI INTERACTIVE - LISTARE + PLAYER ANIMAT
// ======================================================

let quizuriPublice = [];
let quizActiv = null;
let quizIndexIntrebare = 0;
let quizScor = 0;
let quizTimerId = null;
let quizTimpRamas = 0;
let quizRaspunsBlocat = false;

function escapeQuizHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function normalizeazaIntrebariQuiz(raw) {
    if (!Array.isArray(raw)) return [];

    return raw
        .map((item) => ({
            text: String(item?.text || "").trim(),
            answers: Array.isArray(item?.answers)
                ? item.answers.map((answer) => String(answer || "").trim()).filter(Boolean)
                : [],
            correctIndex: Number(item?.correctIndex),
            explanation: String(item?.explanation || "").trim()
        }))
        .filter((item) =>
            item.text &&
            item.answers.length >= 2 &&
            Number.isInteger(item.correctIndex) &&
            item.correctIndex >= 0 &&
            item.correctIndex < item.answers.length
        );
}

async function incarcaQuizuri() {
    const lista = document.getElementById("quizInteractiveLista");
    if (!lista) return;

    lista.innerHTML = '<p class="quiz-empty">Se încarcă quiz-urile...</p>';

    try {
        const { data, error } = await supabaseClient
            .from("quizzes")
            .select("id,title,description,grade,seconds_per_question,questions,published,created_at")
            .eq("published", true)
            .order("created_at", { ascending: false });

        if (error) throw error;

        quizuriPublice = (data || [])
            .map((quiz) => ({ ...quiz, questions: normalizeazaIntrebariQuiz(quiz.questions) }))
            .filter((quiz) => quiz.questions.length > 0);

        randareListaQuizuri();
    } catch (error) {
        console.error("Eroare încărcare quiz-uri:", error);
        lista.innerHTML = '<p class="quiz-empty quiz-error">Quiz-urile interactive nu au putut fi încărcate.</p>';
    }
}

function randareListaQuizuri() {
    const lista = document.getElementById("quizInteractiveLista");
    if (!lista) return;

    if (!quizuriPublice.length) {
        lista.innerHTML = `
            <div class="quiz-empty-state">
                <span aria-hidden="true">🎮</span>
                <h3>În curând apar quiz-uri noi</h3>
                <p>Administratorul nu a publicat încă niciun quiz interactiv.</p>
            </div>`;
        return;
    }

    lista.innerHTML = quizuriPublice.map((quiz, index) => {
        const grade = quiz.grade === "general" ? "General" : `Clasa a ${quiz.grade}-a`;
        return `
            <article class="interactive-quiz-card" style="--quiz-delay:${Math.min(index * 70, 420)}ms">
                <div class="interactive-quiz-icon" aria-hidden="true">🧠</div>
                <div class="interactive-quiz-copy">
                    <div class="interactive-quiz-meta">
                        <span>${escapeQuizHtml(grade)}</span>
                        <span>${quiz.questions.length} întrebări</span>
                        <span>${Number(quiz.seconds_per_question) || 20}s / întrebare</span>
                    </div>
                    <h3>${escapeQuizHtml(quiz.title)}</h3>
                    <p>${escapeQuizHtml(quiz.description || "Testează-ți cunoștințele într-un quiz interactiv.")}</p>
                </div>
                <button type="button" class="quiz-start-btn" data-quiz-id="${escapeQuizHtml(quiz.id)}">
                    ▶ Începe quiz-ul
                </button>
            </article>`;
    }).join("");

    lista.querySelectorAll("[data-quiz-id]").forEach((button) => {
        button.addEventListener("click", () => pornesteQuiz(button.dataset.quizId));
    });
}

function pornesteQuiz(id) {
    const quiz = quizuriPublice.find((item) => String(item.id) === String(id));
    if (!quiz) return;

    opresteTimerQuiz();
    quizActiv = quiz;
    quizIndexIntrebare = 0;
    quizScor = 0;
    quizRaspunsBlocat = false;

    document.getElementById("quizInteractiveLista")?.classList.add("ascuns");
    document.getElementById("quizPlayer")?.classList.remove("ascuns");
    document.getElementById("quizRezultat")?.classList.add("ascuns");
    document.getElementById("quizQuestionStage")?.classList.remove("ascuns");

    const title = document.getElementById("quizPlayerTitle");
    if (title) title.textContent = quiz.title;

    randareIntrebareQuiz();
}

function randareIntrebareQuiz() {
    if (!quizActiv) return;

    const question = quizActiv.questions[quizIndexIntrebare];
    if (!question) {
        finalizeazaQuiz();
        return;
    }

    quizRaspunsBlocat = false;
    const total = quizActiv.questions.length;
    const progress = ((quizIndexIntrebare) / total) * 100;

    const progressBar = document.getElementById("quizProgressBar");
    if (progressBar) progressBar.style.width = `${progress}%`;

    const counter = document.getElementById("quizCounter");
    if (counter) counter.textContent = `Întrebarea ${quizIndexIntrebare + 1} din ${total}`;

    const score = document.getElementById("quizLiveScore");
    if (score) score.textContent = `Scor: ${quizScor}`;

    const stage = document.getElementById("quizQuestionStage");
    if (!stage) return;

    const letters = ["A", "B", "C", "D"];
    stage.innerHTML = `
        <div class="quiz-question-card quiz-enter">
            <p class="quiz-question-label">Alege răspunsul corect</p>
            <h3>${escapeQuizHtml(question.text)}</h3>
            <div class="quiz-answer-grid">
                ${question.answers.map((answer, index) => `
                    <button type="button" class="quiz-answer-btn" data-answer-index="${index}">
                        <span>${letters[index] || index + 1}</span>
                        <strong>${escapeQuizHtml(answer)}</strong>
                    </button>`).join("")}
            </div>
            <div id="quizFeedback" class="quiz-feedback" aria-live="polite"></div>
        </div>`;

    stage.querySelectorAll("[data-answer-index]").forEach((button) => {
        button.addEventListener("click", () => raspundeQuiz(Number(button.dataset.answerIndex)));
    });

    pornesteTimerQuiz(Number(quizActiv.seconds_per_question) || 20);
}

function pornesteTimerQuiz(seconds) {
    opresteTimerQuiz();
    quizTimpRamas = Math.max(5, Math.min(120, Number(seconds) || 20));
    actualizeazaTimerQuiz();

    quizTimerId = window.setInterval(() => {
        quizTimpRamas -= 1;
        actualizeazaTimerQuiz();

        if (quizTimpRamas <= 0) {
            opresteTimerQuiz();
            raspundeQuiz(-1, true);
        }
    }, 1000);
}

function actualizeazaTimerQuiz() {
    const timer = document.getElementById("quizTimer");
    if (!timer) return;
    timer.textContent = `${quizTimpRamas}s`;
    timer.classList.toggle("quiz-timer-warning", quizTimpRamas <= 5);
}

function opresteTimerQuiz() {
    if (quizTimerId) {
        window.clearInterval(quizTimerId);
        quizTimerId = null;
    }
}

function raspundeQuiz(index, expirat = false) {
    if (quizRaspunsBlocat || !quizActiv) return;
    quizRaspunsBlocat = true;
    opresteTimerQuiz();

    const question = quizActiv.questions[quizIndexIntrebare];
    const corect = index === question.correctIndex;
    const buttons = document.querySelectorAll("#quizQuestionStage .quiz-answer-btn");

    buttons.forEach((button, buttonIndex) => {
        button.disabled = true;
        if (buttonIndex === question.correctIndex) button.classList.add("corect");
        if (buttonIndex === index && !corect) button.classList.add("gresit");
    });

    if (corect) {
        const bonusTimp = Math.max(0, quizTimpRamas);
        quizScor += 100 + bonusTimp * 2;
    }

    const feedback = document.getElementById("quizFeedback");
    if (feedback) {
        const titlu = expirat ? "⏰ Timpul a expirat" : (corect ? "✨ Corect!" : "💡 Nu chiar");
        const explicatie = question.explanation
            ? `<p>${escapeQuizHtml(question.explanation)}</p>`
            : "";
        feedback.innerHTML = `
            <div class="quiz-feedback-box ${corect ? "corect" : "gresit"}">
                <strong>${titlu}</strong>
                ${explicatie}
                <button type="button" id="quizNextButton">
                    ${quizIndexIntrebare + 1 < quizActiv.questions.length ? "Următoarea întrebare →" : "Vezi rezultatul 🏆"}
                </button>
            </div>`;
        document.getElementById("quizNextButton")?.addEventListener("click", urmatoareaIntrebareQuiz);
    }

    const score = document.getElementById("quizLiveScore");
    if (score) score.textContent = `Scor: ${quizScor}`;
}

function urmatoareaIntrebareQuiz() {
    quizIndexIntrebare += 1;
    if (quizIndexIntrebare >= quizActiv.questions.length) {
        finalizeazaQuiz();
    } else {
        randareIntrebareQuiz();
    }
}

function finalizeazaQuiz() {
    opresteTimerQuiz();
    if (!quizActiv) return;

    const total = quizActiv.questions.length;
    const rezultat = document.getElementById("quizRezultat");
    const stage = document.getElementById("quizQuestionStage");
    const progressBar = document.getElementById("quizProgressBar");

    if (progressBar) progressBar.style.width = "100%";
    if (stage) stage.classList.add("ascuns");
    if (!rezultat) return;

    const maxBase = total * 100;
    const procent = Math.min(100, Math.round((quizScor / Math.max(1, maxBase)) * 100));
    let mesaj = "Continuă să exersezi — fiecare încercare te ajută!";
    let medalie = "🌱";
    if (procent >= 90) { mesaj = "Excelent! Ai stăpânit foarte bine acest quiz."; medalie = "🏆"; }
    else if (procent >= 70) { mesaj = "Foarte bine! Mai ai doar puțin până la perfecțiune."; medalie = "⭐"; }
    else if (procent >= 50) { mesaj = "Bun început! O nouă încercare îți poate ridica scorul."; medalie = "🎯"; }

    rezultat.innerHTML = `
        <div class="quiz-result-card quiz-result-pop">
            <div class="quiz-result-medal" aria-hidden="true">${medalie}</div>
            <p>Quiz finalizat</p>
            <h3>${escapeQuizHtml(quizActiv.title)}</h3>
            <div class="quiz-result-score">${quizScor} <small>puncte</small></div>
            <p>${escapeQuizHtml(mesaj)}</p>
            <div class="quiz-result-actions">
                <button type="button" id="quizRetryButton">↻ Încearcă din nou</button>
                <button type="button" id="quizBackButton" class="secondary">← Alte quiz-uri</button>
            </div>
        </div>`;
    rezultat.classList.remove("ascuns");

    document.getElementById("quizRetryButton")?.addEventListener("click", () => pornesteQuiz(quizActiv.id));
    document.getElementById("quizBackButton")?.addEventListener("click", inchideQuizPlayer);
}

function inchideQuizPlayer() {
    opresteTimerQuiz();
    quizActiv = null;
    document.getElementById("quizPlayer")?.classList.add("ascuns");
    document.getElementById("quizInteractiveLista")?.classList.remove("ascuns");
}

function initializeazaQuizPlayer() {
    document.getElementById("quizCloseButton")?.addEventListener("click", inchideQuizPlayer);
}
