// ======================================================
// DARK MODE
// ======================================================
function schimbaTema() {
    document.body.classList.toggle("dark");
}

// ======================================================
// QUIZ - TABURI
// ======================================================
function arataQuiz(tip) {
    const tipValid = ["interactive", "kahoot", "wordwall"].includes(tip) ? tip : "interactive";

    document.querySelectorAll("#quiz .quizuri").forEach((panel) => {
        panel.classList.toggle("ascuns", panel.id !== tipValid);
    });

    document.querySelectorAll("#quiz .quiz-tab").forEach((button) => {
        const active = button.dataset.quizTab === tipValid;
        button.classList.toggle("activ", active);
        button.setAttribute("aria-selected", String(active));
    });
}

function initializeazaTaburiQuiz() {
    document.querySelectorAll("#quiz [data-quiz-tab]").forEach((button) => {
        button.addEventListener("click", () => arataQuiz(button.dataset.quizTab));
    });
}

initializeazaTaburiQuiz();
