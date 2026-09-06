// ======================================================
// QUIZ AVENTURĂ - LISTARE + PLAYER CU 3 VIEȚI
// ======================================================

let quizuriPublice = [];
let quizActiv = null;
let quizIndexIntrebare = 0;
let quizScor = 0;
let quizVieti = 3;
let quizCorecte = 0;
let quizTimerId = null;
let quizTimpRamas = 0;
let quizRaspunsBlocat = false;
let quizEstePreview = false;

const QUIZ_MONSTERS = {
    goblin: { name: "Goblinul", icon: "👹" },
    bat: { name: "Liliacul uriaș", icon: "🦇" },
    skeleton: { name: "Scheletul", icon: "💀" },
    spider: { name: "Păianjenul uriaș", icon: "🕷️" },
    knight: { name: "Cavalerul blestemat", icon: "🛡️" },
    ghost: { name: "Fantoma", icon: "👻" },
    golem: { name: "Golemul", icon: "🪨" },
    wizard: { name: "Vrăjitorul întunecat", icon: "🧙" },
    demon: { name: "Demonul castelului", icon: "😈" },
    dragon: { name: "Dragonul", icon: "🐉" }
};

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
    return raw.map((item, index) => {
        const type = item?.type === "true_false" ? "true_false" : "multiple_choice";
        let answers = Array.isArray(item?.answers) ? item.answers.map((a) => String(a || "").trim()).filter(Boolean) : [];
        if (type === "true_false" && answers.length < 2) answers = ["Adevărat", "Fals"];
        return {
            type,
            text: String(item?.text || "").trim(),
            answers,
            correctIndex: Number(item?.correctIndex),
            explanation: String(item?.explanation || "").trim(),
            monster: String(item?.monster || "goblin"),
            correctMessage: String(item?.correctMessage || "Corect! Poți trece mai departe.").trim(),
            wrongMessage: String(item?.wrongMessage || "De data aceasta te iert. Te las să treci mai departe.").trim(),
            boss: Boolean(item?.boss)
        };
    }).filter((item) => item.text && item.answers.length >= 2 && Number.isInteger(item.correctIndex) && item.correctIndex >= 0 && item.correctIndex < item.answers.length);
}

function normalizeazaQuiz(quiz) {
    const questions = normalizeazaIntrebariQuiz(quiz?.questions);
    if (questions.length) questions[questions.length - 1].boss = true;
    return {
        ...quiz,
        game_mode: quiz?.game_mode || "castle_adventure",
        difficulty: quiz?.difficulty || "medium",
        lives: 3,
        questions
    };
}

async function incarcaQuizuri() {
    const lista = document.getElementById("quizInteractiveLista");
    if (!lista) return;
    lista.innerHTML = '<p class="quiz-empty">Se încarcă quiz-urile...</p>';
    try {
        const { data, error } = await supabaseClient
            .from("quizzes")
            .select("id,title,description,grade,seconds_per_question,questions,published,created_at,game_mode,difficulty,lives")
            .eq("published", true)
            .order("created_at", { ascending: false });
        if (error) throw error;
        quizuriPublice = (data || []).map(normalizeazaQuiz).filter((quiz) => quiz.questions.length > 0);
        randareListaQuizuri();
    } catch (error) {
        console.error("Eroare încărcare quiz-uri:", error);
        lista.innerHTML = '<p class="quiz-empty quiz-error">Quiz-urile nu au putut fi încărcate. Dacă ai actualizat site-ul, rulează și noul supabase/quizzes.sql.</p>';
    }
}

function randareListaQuizuri() {
    const lista = document.getElementById("quizInteractiveLista");
    if (!lista) return;
    if (!quizuriPublice.length) {
        lista.innerHTML = `<div class="quiz-empty-state"><span>🏰</span><h3>Castelul așteaptă primul quiz</h3><p>Administratorul nu a publicat încă o aventură.</p></div>`;
        return;
    }
    const difficultyLabel = { easy: "Ușor", medium: "Mediu", hard: "Greu" };
    lista.innerHTML = quizuriPublice.map((quiz, index) => {
        const grade = quiz.grade === "general" ? "General" : `Clasa a ${quiz.grade}-a`;
        return `<article class="interactive-quiz-card castle-quiz-card" style="--quiz-delay:${Math.min(index * 70, 420)}ms">
            <div class="interactive-quiz-icon">🏰</div>
            <div class="interactive-quiz-copy">
                <div class="interactive-quiz-meta"><span>${escapeQuizHtml(grade)}</span><span>${quiz.questions.length} monștri</span><span>❤️ 3 vieți</span><span>${difficultyLabel[quiz.difficulty] || "Mediu"}</span></div>
                <h3>${escapeQuizHtml(quiz.title)}</h3>
                <p>${escapeQuizHtml(quiz.description || "Traversează castelul și răspunde corect ca să ajungi la boss-ul final.")}</p>
            </div>
            <button type="button" class="quiz-start-btn" data-quiz-id="${escapeQuizHtml(quiz.id)}">⚔️ Intră în castel</button>
        </article>`;
    }).join("");
    lista.querySelectorAll("[data-quiz-id]").forEach((button) => button.addEventListener("click", () => pornesteQuiz(button.dataset.quizId)));
}

function pornesteQuiz(id) {
    const quiz = quizuriPublice.find((item) => String(item.id) === String(id));
    if (quiz) pornesteQuizCuDate(quiz, false);
}

async function pornesteQuizCuDate(rawQuiz, preview = false) {
    const quiz = normalizeazaQuiz(rawQuiz);
    if (!quiz.questions.length) return;
    opresteTimerQuiz();
    quizActiv = quiz;
    quizEstePreview = preview;
    quizIndexIntrebare = 0;
    quizScor = 0;
    quizVieti = 3;
    quizCorecte = 0;
    quizRaspunsBlocat = true;

    document.getElementById("quizInteractiveLista")?.classList.add("ascuns");
    document.getElementById("quizPlayer")?.classList.remove("ascuns");
    document.getElementById("quizRezultat")?.classList.add("ascuns");
    document.getElementById("quizQuestionStage")?.classList.remove("ascuns");
    const title = document.getElementById("quizPlayerTitle");
    if (title) title.textContent = preview ? `PREVIEW · ${quiz.title}` : quiz.title;
    actualizeazaHudQuiz();
    const canvas = document.getElementById("castleCanvas");
    if (window.CastleQuiz3D && canvas) await CastleQuiz3D.init(canvas);
    await afiseazaDialogCastel("🏰", "Intră în castel. Ai 3 vieți. Fiecare răspuns greșit te costă o viață.", 1300);
    await randareIntrebareQuiz();
}

function actualizeazaHudQuiz() {
    const lives = document.getElementById("quizLives");
    if (lives) {
        const text = `${"❤️ ".repeat(Math.max(0, quizVieti))}${"🖤 ".repeat(Math.max(0, 3 - quizVieti))}`.trim();
        lives.textContent = text;
        lives.setAttribute("aria-label", `${quizVieti} vieți rămase`);
    }
    const score = document.getElementById("quizLiveScore");
    if (score) score.textContent = `Scor: ${quizScor}`;
    if (quizActiv) {
        const counter = document.getElementById("quizCounter");
        if (counter) counter.textContent = `Monstrul ${Math.min(quizIndexIntrebare + 1, quizActiv.questions.length)} / ${quizActiv.questions.length}`;
        const progressBar = document.getElementById("quizProgressBar");
        if (progressBar) progressBar.style.width = `${(quizIndexIntrebare / quizActiv.questions.length) * 100}%`;
    }
}

async function afiseazaDialogCastel(icon, text, duration = 0) {
    const box = document.getElementById("castleDialogue");
    if (!box) return;
    box.innerHTML = `<span class="castle-dialogue-icon">${escapeQuizHtml(icon)}</span><p>${escapeQuizHtml(text)}</p>`;
    box.classList.remove("ascuns");
    if (duration > 0) {
        await new Promise((resolve) => setTimeout(resolve, duration));
        box.classList.add("ascuns");
    }
}

async function randareIntrebareQuiz() {
    if (!quizActiv || quizVieti <= 0) return;
    const question = quizActiv.questions[quizIndexIntrebare];
    if (!question) return finalizeazaQuiz(true);
    quizRaspunsBlocat = true;
    actualizeazaHudQuiz();

    const stage = document.getElementById("quizQuestionStage");
    const info = QUIZ_MONSTERS[question.monster] || QUIZ_MONSTERS.goblin;
    const boss = quizIndexIntrebare === quizActiv.questions.length - 1 || question.boss;
    const roomName = window.CastleQuiz3D?.getRoomName?.(quizIndexIntrebare, boss) || (boss ? "Sala Dragonului" : "Castel");
    if (stage) stage.innerHTML = `<div class="castle-transition-card"><strong>🚪 ${escapeQuizHtml(roomName)}</strong><span>Personajul înaintează spre următoarea confruntare...</span></div>`;
    const skip = document.getElementById("castleSkipAnimation");
    skip?.classList.remove("ascuns");
    if (window.CastleQuiz3D) await CastleQuiz3D.encounter(boss ? "dragon" : question.monster, boss, quizIndexIntrebare);
    skip?.classList.add("ascuns");

    await afiseazaDialogCastel(boss ? "🐉" : info.icon, boss ? "Ai ajuns la boss-ul final! Răspunde corect ca să cucerești castelul." : `${info.name}: „Ca să treci mai departe, răspunde la întrebarea mea!”`, 1100);
    randareCardIntrebare(question, boss, info);
    quizRaspunsBlocat = false;
    pornesteTimerQuiz(Number(quizActiv.seconds_per_question) || 20);
}

function randareCardIntrebare(question, boss, info) {
    const stage = document.getElementById("quizQuestionStage");
    if (!stage) return;
    const letters = ["A", "B", "C", "D"];
    stage.innerHTML = `<div class="quiz-question-card castle-question-card quiz-enter">
        <div class="castle-monster-title"><span>${boss ? "🐉" : info.icon}</span><div><small>${boss ? "BOSS FINAL" : escapeQuizHtml(info.name)}</small><strong>${question.type === "true_false" ? "Adevărat sau fals?" : "Alege răspunsul corect"}</strong></div></div>
        <h3>${escapeQuizHtml(question.text)}</h3>
        <div class="quiz-answer-grid">${question.answers.map((answer, index) => `<button type="button" class="quiz-answer-btn" data-answer-index="${index}"><span>${question.type === "true_false" ? (index === 0 ? "✓" : "✕") : letters[index]}</span><strong>${escapeQuizHtml(answer)}</strong></button>`).join("")}</div>
        <div id="quizFeedback" class="quiz-feedback" aria-live="polite"></div>
    </div>`;
    stage.querySelectorAll("[data-answer-index]").forEach((button) => button.addEventListener("click", () => raspundeQuiz(Number(button.dataset.answerIndex))));
}

function pornesteTimerQuiz(seconds) {
    opresteTimerQuiz();
    quizTimpRamas = Math.max(5, Math.min(120, Number(seconds) || 20));
    actualizeazaTimerQuiz();
    quizTimerId = window.setInterval(() => {
        quizTimpRamas -= 1;
        actualizeazaTimerQuiz();
        if (quizTimpRamas <= 0) { opresteTimerQuiz(); raspundeQuiz(-1, true); }
    }, 1000);
}

function actualizeazaTimerQuiz() {
    const timer = document.getElementById("quizTimer");
    if (!timer) return;
    timer.textContent = `${quizTimpRamas}s`;
    timer.classList.toggle("quiz-timer-warning", quizTimpRamas <= 5);
}

function opresteTimerQuiz() {
    if (quizTimerId) window.clearInterval(quizTimerId);
    quizTimerId = null;
}

async function raspundeQuiz(index, expirat = false) {
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
        quizScor += 100;
        quizCorecte += 1;
        actualizeazaHudQuiz();
        if (window.CastleQuiz3D) await CastleQuiz3D.correct();
        await afiseazaFeedbackAventura(true, question, expirat);
    } else {
        quizVieti -= 1;
        actualizeazaHudQuiz();
        document.getElementById("quizLives")?.classList.add("castle-life-hit");
        setTimeout(() => document.getElementById("quizLives")?.classList.remove("castle-life-hit"), 600);
        if (window.CastleQuiz3D) await CastleQuiz3D.wrong();
        if (quizVieti <= 0) {
            await afiseazaDialogCastel("💀", "Ai rămas fără vieți. Aventura se încheie aici.", 900);
            return finalizeazaQuiz(false, true);
        }
        await afiseazaDialogCastel("👹", question.wrongMessage || "De data aceasta te iert. Te las să treci mai departe.", 1100);
        await afiseazaFeedbackAventura(false, question, expirat);
    }
}

async function afiseazaFeedbackAventura(corect, question, expirat) {
    const feedback = document.getElementById("quizFeedback");
    if (!feedback) return;
    const titlu = corect ? (question.correctMessage || "Corect! Poți trece.") : (expirat ? "Timpul a expirat — pierzi o viață." : "Răspuns greșit — pierzi o viață.");
    const explicatie = question.explanation ? `<p>${escapeQuizHtml(question.explanation)}</p>` : "";
    feedback.innerHTML = `<div class="quiz-feedback-box ${corect ? "corect" : "gresit"}"><strong>${escapeQuizHtml(titlu)}</strong>${explicatie}<button type="button" id="quizNextButton">${quizIndexIntrebare + 1 < quizActiv.questions.length ? "🚪 Continuă aventura" : "🏆 Vezi finalul"}</button></div>`;
    document.getElementById("quizNextButton")?.addEventListener("click", urmatoareaIntrebareQuiz);
}

async function urmatoareaIntrebareQuiz() {
    quizRaspunsBlocat = true;
    if (window.CastleQuiz3D) await CastleQuiz3D.nextRoom();
    quizIndexIntrebare += 1;
    if (quizIndexIntrebare >= quizActiv.questions.length) finalizeazaQuiz(true);
    else randareIntrebareQuiz();
}

async function finalizeazaQuiz(victorie = true, gameOver = false) {
    opresteTimerQuiz();
    if (!quizActiv) return;
    quizRaspunsBlocat = true;
    const total = quizActiv.questions.length;
    const stage = document.getElementById("quizQuestionStage");
    const rezultat = document.getElementById("quizRezultat");
    const progressBar = document.getElementById("quizProgressBar");
    if (victorie && progressBar) progressBar.style.width = "100%";
    if (stage) stage.classList.add("ascuns");
    if (!rezultat) return;
    if (gameOver) await window.CastleQuiz3D?.gameOver?.();
    else await window.CastleQuiz3D?.victory?.();
    const bonus = victorie ? quizVieti * 200 + 300 : 0;
    const totalScore = quizScor + bonus;
    quizScor = totalScore;
    actualizeazaHudQuiz();
    rezultat.innerHTML = `<div class="quiz-result-card quiz-result-pop castle-result ${gameOver ? "game-over" : "victory"}">
        <div class="quiz-result-medal">${gameOver ? "💀" : "🏆"}</div>
        <p>${gameOver ? "GAME OVER" : "CASTEL CUCERIT!"}</p>
        <h3>${escapeQuizHtml(quizActiv.title)}</h3>
        <div class="quiz-result-score">${totalScore} <small>puncte</small></div>
        <div class="castle-result-stats"><span>✅ ${quizCorecte} / ${total} corecte</span><span>❤️ ${quizVieti} vieți rămase</span>${victorie ? `<span>🎁 +${bonus} bonus final</span>` : ""}</div>
        <p>${gameOver ? "Monștrii castelului te-au oprit. Încearcă din nou și vezi dacă poți ajunge mai departe!" : "Ai trecut de toți monștrii și ai învins boss-ul final!"}</p>
        <div class="quiz-result-actions"><button type="button" id="quizRetryButton">↻ Încearcă din nou</button><button type="button" id="quizBackButton" class="secondary">← Ieși din castel</button></div>
    </div>`;
    rezultat.classList.remove("ascuns");
    document.getElementById("quizRetryButton")?.addEventListener("click", () => pornesteQuizCuDate(quizActiv, quizEstePreview));
    document.getElementById("quizBackButton")?.addEventListener("click", inchideQuizPlayer);
}

function inchideQuizPlayer() {
    opresteTimerQuiz();
    window.CastleQuiz3D?.dispose?.();
    quizActiv = null;
    document.getElementById("quizPlayer")?.classList.add("ascuns");
    document.getElementById("quizInteractiveLista")?.classList.remove("ascuns");
    document.getElementById("quizQuestionStage")?.classList.remove("ascuns");
    document.getElementById("quizRezultat")?.classList.add("ascuns");
}

function initializeazaQuizPlayer() {
    document.getElementById("quizCloseButton")?.addEventListener("click", inchideQuizPlayer);
    document.getElementById("castleSkipAnimation")?.addEventListener("click", () => CastleQuiz3D?.skip?.());
}
