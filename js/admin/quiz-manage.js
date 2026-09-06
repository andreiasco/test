// ======================================================
// ADMIN - CREATOR QUIZ AVENTURĂ ÎN CASTEL
// ======================================================

let quizAdminData = [];
let quizQuestionCounter = 0;

const ADMIN_MONSTERS = [
    ["goblin", "👹 Goblin"], ["bat", "🦇 Liliac uriaș"], ["skeleton", "💀 Schelet"],
    ["spider", "🕷️ Păianjen uriaș"], ["knight", "🛡️ Cavaler blestemat"], ["ghost", "👻 Fantomă"],
    ["golem", "🪨 Golem"], ["wizard", "🧙 Vrăjitor întunecat"], ["demon", "😈 Demon"], ["dragon", "🐉 Dragon"]
];

function escapeAdminQuizHtml(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function adminMonsterOptions(selected = "goblin") {
    return ADMIN_MONSTERS.map(([value, label]) => `<option value="${value}" ${value === selected ? "selected" : ""}>${label}</option>`).join("");
}

function adaugaEditorIntrebareQuiz(question = null) {
    const container = document.getElementById("quizQuestionsEditor");
    if (!container) return;
    const index = quizQuestionCounter++;
    const type = question?.type === "true_false" ? "true_false" : "multiple_choice";
    const answers = Array.isArray(question?.answers) ? [...question.answers] : ["", "", "", ""];
    while (answers.length < 4) answers.push("");
    const correctIndex = Number.isInteger(Number(question?.correctIndex)) ? Number(question.correctIndex) : 0;
    const card = document.createElement("article");
    card.className = "quiz-question-editor castle-question-editor-admin";
    card.dataset.questionEditor = String(index);
    card.innerHTML = `
        <div class="quiz-question-editor-title">
            <strong>Scena <span class="quiz-editor-number"></span> · întâlnire cu monstrul</strong>
            <button type="button" class="quiz-remove-question" aria-label="Șterge scena">✕</button>
        </div>
        <div class="quiz-admin-scene-grid">
            <label>Tip întrebare
                <select class="quiz-q-type"><option value="multiple_choice" ${type === "multiple_choice" ? "selected" : ""}>Alegere multiplă</option><option value="true_false" ${type === "true_false" ? "selected" : ""}>Adevărat / Fals</option></select>
            </label>
            <label>Monstru
                <select class="quiz-q-monster">${adminMonsterOptions(question?.monster || "goblin")}</select>
            </label>
        </div>
        <label>Întrebare<textarea class="quiz-q-text" rows="2" maxlength="400" required>${escapeAdminQuizHtml(question?.text || "")}</textarea></label>
        <div class="quiz-answer-editors">
            ${[0,1,2,3].map((answerIndex) => `<label class="quiz-answer-editor-row" data-answer-row="${answerIndex}">
                <input type="radio" name="quiz-correct-${index}" value="${answerIndex}" ${correctIndex === answerIndex ? "checked" : ""}>
                <span>${String.fromCharCode(65 + answerIndex)}</span>
                <input class="quiz-q-answer" type="text" maxlength="220" value="${escapeAdminQuizHtml(answers[answerIndex] || "")}" placeholder="Varianta ${String.fromCharCode(65 + answerIndex)}">
            </label>`).join("")}
        </div>
        <label>Explicație după răspuns <span class="quiz-optional">(opțional)</span><textarea class="quiz-q-explanation" rows="2" maxlength="400">${escapeAdminQuizHtml(question?.explanation || "")}</textarea></label>
        <div class="quiz-admin-dialog-grid">
            <label>Replica la răspuns corect<input class="quiz-q-correct-message" type="text" maxlength="180" value="${escapeAdminQuizHtml(question?.correctMessage || "Corect! Poți trece mai departe.")}"></label>
            <label>Replica la răspuns greșit<input class="quiz-q-wrong-message" type="text" maxlength="180" value="${escapeAdminQuizHtml(question?.wrongMessage || "De data aceasta te iert. Te las să treci mai departe.")}"></label>
        </div>`;

    const typeSelect = card.querySelector(".quiz-q-type");
    const syncType = () => {
        const tf = typeSelect.value === "true_false";
        const inputs = card.querySelectorAll(".quiz-q-answer");
        const rows = card.querySelectorAll("[data-answer-row]");
        if (tf) {
            inputs[0].value = "Adevărat"; inputs[1].value = "Fals";
            rows[2].classList.add("ascuns"); rows[3].classList.add("ascuns");
            if (Number(card.querySelector('input[type="radio"]:checked')?.value) > 1) card.querySelector('input[type="radio"][value="0"]').checked = true;
        } else { rows[2].classList.remove("ascuns"); rows[3].classList.remove("ascuns"); }
    };
    typeSelect.addEventListener("change", syncType); syncType();
    card.querySelector(".quiz-remove-question")?.addEventListener("click", () => {
        if (container.querySelectorAll(".quiz-question-editor").length <= 1) return afiseazaMesajQuizAdmin("Quiz-ul trebuie să aibă cel puțin o scenă.", true);
        card.remove(); renumeroteazaEditoareQuiz();
    });
    container.appendChild(card); renumeroteazaEditoareQuiz();
}

function renumeroteazaEditoareQuiz() {
    document.querySelectorAll("#quizQuestionsEditor .quiz-question-editor").forEach((card, index) => {
        const n = card.querySelector(".quiz-editor-number"); if (n) n.textContent = String(index + 1);
        card.classList.toggle("quiz-boss-editor", index === document.querySelectorAll("#quizQuestionsEditor .quiz-question-editor").length - 1);
    });
}

function colecteazaIntrebariQuizAdmin() {
    const cards = [...document.querySelectorAll("#quizQuestionsEditor .quiz-question-editor")];
    if (!cards.length) throw new Error("Adaugă cel puțin o întrebare.");
    return cards.map((card, i) => {
        const type = card.querySelector(".quiz-q-type")?.value || "multiple_choice";
        const text = card.querySelector(".quiz-q-text")?.value.trim() || "";
        let rawAnswers = [...card.querySelectorAll(".quiz-q-answer")].map((x) => x.value.trim());
        if (type === "true_false") rawAnswers = ["Adevărat", "Fals"];
        const selected = Number(card.querySelector('input[type="radio"]:checked')?.value ?? 0);
        if (!text) throw new Error(`Completează întrebarea din scena ${i + 1}.`);
        if (!rawAnswers[0] || !rawAnswers[1]) throw new Error(`Scena ${i + 1} trebuie să aibă cel puțin două răspunsuri.`);
        const answers = rawAnswers.filter(Boolean);
        let correctIndex = selected;
        if (type !== "true_false") {
            const selectedText = rawAnswers[selected];
            if (!selectedText) throw new Error(`Răspunsul corect din scena ${i + 1} este gol.`);
            correctIndex = rawAnswers.slice(0, selected + 1).filter(Boolean).length - 1;
        } else correctIndex = Math.min(1, selected);
        return {
            type, text, answers, correctIndex,
            monster: card.querySelector(".quiz-q-monster")?.value || "goblin",
            explanation: card.querySelector(".quiz-q-explanation")?.value.trim() || "",
            correctMessage: card.querySelector(".quiz-q-correct-message")?.value.trim() || "Corect! Poți trece mai departe.",
            wrongMessage: card.querySelector(".quiz-q-wrong-message")?.value.trim() || "De data aceasta te iert. Te las să treci mai departe.",
            boss: i === cards.length - 1
        };
    });
}

function afiseazaMesajQuizAdmin(text, error = false) {
    const el = document.getElementById("quizAdminMesaj"); if (!el) return;
    el.textContent = text; el.classList.toggle("error", error); el.classList.toggle("success", !error && Boolean(text));
}

function construiesteQuizDinFormular() {
    const title = document.getElementById("quizTitlu")?.value.trim() || "";
    if (!title) throw new Error("Completează titlul quiz-ului.");
    return {
        id: document.getElementById("quizEditId")?.value || `preview-${Date.now()}`,
        title,
        description: document.getElementById("quizDescriere")?.value.trim() || "",
        grade: document.getElementById("quizClasa")?.value || "general",
        difficulty: document.getElementById("quizDificultate")?.value || "medium",
        game_mode: document.getElementById("quizGameMode")?.value || "castle_adventure",
        seconds_per_question: Math.max(5, Math.min(120, Number(document.getElementById("quizTimp")?.value || 20))),
        lives: 3,
        published: Boolean(document.getElementById("quizPublicat")?.checked),
        questions: colecteazaIntrebariQuizAdmin()
    };
}

async function salveazaQuizAdmin(event) {
    event.preventDefault();
    try {
        const user = await utilizatorAutentificat(); if (!user) throw new Error("Trebuie să fii autentificat ca administrator.");
        const quiz = construiesteQuizDinFormular(); const editId = document.getElementById("quizEditId")?.value || "";
        const payload = { title: quiz.title, description: quiz.description, grade: quiz.grade, difficulty: quiz.difficulty, game_mode: quiz.game_mode, lives: 3, seconds_per_question: quiz.seconds_per_question, questions: quiz.questions, published: quiz.published, created_by: user.id, updated_at: new Date().toISOString() };
        afiseazaMesajQuizAdmin(editId ? "Se actualizează aventura..." : "Se salvează aventura...");
        const response = editId ? await supabaseClient.from("quizzes").update(payload).eq("id", editId) : await supabaseClient.from("quizzes").insert(payload);
        if (response.error) throw response.error;
        afiseazaMesajQuizAdmin(editId ? "Aventura a fost actualizată." : "Quiz-ul aventură a fost creat.");
        reseteazaFormularQuizAdmin(); await incarcaQuizuriAdmin(); if (typeof incarcaQuizuri === "function") await incarcaQuizuri();
    } catch (error) { console.error(error); afiseazaMesajQuizAdmin(error.message || "Quiz-ul nu a putut fi salvat.", true); }
}

function reseteazaFormularQuizAdmin() {
    const form = document.getElementById("quizAdminForm"); if (!form) return; form.reset();
    document.getElementById("quizEditId").value = ""; document.getElementById("quizPublicat").checked = true; document.getElementById("quizTimp").value = "20"; document.getElementById("quizDificultate").value = "medium";
    document.getElementById("quizQuestionsEditor").innerHTML = ""; quizQuestionCounter = 0; adaugaEditorIntrebareQuiz(); document.getElementById("anuleazaEditareQuiz")?.classList.add("ascuns");
}

async function incarcaQuizuriAdmin() {
    const lista = document.getElementById("quizAdminLista"); if (!lista) return;
    lista.innerHTML = '<p class="quiz-empty">Se încarcă quiz-urile...</p>';
    const user = await utilizatorAutentificat(); if (!user) { lista.innerHTML = '<p class="quiz-empty">Conectează-te ca administrator.</p>'; return; }
    const { data, error } = await supabaseClient.from("quizzes").select("id,title,description,grade,seconds_per_question,questions,published,created_at,game_mode,difficulty,lives").order("created_at", { ascending: false });
    if (error) { console.error(error); lista.innerHTML = '<p class="quiz-empty quiz-error">Lista nu a putut fi încărcată. Rulează actualizarea supabase/quizzes.sql.</p>'; return; }
    quizAdminData = data || []; randareQuizuriAdmin();
}

function randareQuizuriAdmin() {
    const lista = document.getElementById("quizAdminLista"); if (!lista) return;
    if (!quizAdminData.length) { lista.innerHTML = '<p class="quiz-empty">Nu există încă quiz-uri create.</p>'; return; }
    lista.innerHTML = quizAdminData.map((quiz) => `<article class="quiz-admin-list-item"><div><div class="quiz-admin-list-meta"><span>🏰 Aventură</span><span>${quiz.grade === "general" ? "General" : `Clasa a ${quiz.grade}-a`}</span><span>${Array.isArray(quiz.questions) ? quiz.questions.length : 0} monștri</span><span>❤️ 3 vieți</span><span class="${quiz.published ? "published" : "draft"}">${quiz.published ? "Publicat" : "Ciornă"}</span></div><h4>${escapeAdminQuizHtml(quiz.title)}</h4><p>${escapeAdminQuizHtml(quiz.description || "Fără descriere")}</p></div><div class="quiz-admin-item-actions"><button type="button" class="admin-btn secondary" data-quiz-preview="${quiz.id}">▶ Testează</button><button type="button" class="admin-btn secondary" data-quiz-edit="${quiz.id}">✏️ Editează</button><button type="button" class="admin-btn secondary" data-quiz-toggle="${quiz.id}">${quiz.published ? "🙈 Ascunde" : "👁 Publică"}</button><button type="button" class="admin-btn danger" data-quiz-delete="${quiz.id}">🗑 Șterge</button></div></article>`).join("");
    lista.querySelectorAll("[data-quiz-edit]").forEach((b) => b.addEventListener("click", () => editeazaQuizAdmin(b.dataset.quizEdit)));
    lista.querySelectorAll("[data-quiz-preview]").forEach((b) => b.addEventListener("click", () => previzualizeazaQuizSalvat(b.dataset.quizPreview)));
    lista.querySelectorAll("[data-quiz-toggle]").forEach((b) => b.addEventListener("click", () => comutaPublicareQuizAdmin(b.dataset.quizToggle)));
    lista.querySelectorAll("[data-quiz-delete]").forEach((b) => b.addEventListener("click", () => stergeQuizAdmin(b.dataset.quizDelete)));
}

function editeazaQuizAdmin(id) {
    const quiz = quizAdminData.find((q) => String(q.id) === String(id)); if (!quiz) return;
    document.getElementById("quizEditId").value = quiz.id; document.getElementById("quizTitlu").value = quiz.title || ""; document.getElementById("quizDescriere").value = quiz.description || ""; document.getElementById("quizClasa").value = quiz.grade || "general"; document.getElementById("quizTimp").value = String(quiz.seconds_per_question || 20); document.getElementById("quizDificultate").value = quiz.difficulty || "medium"; document.getElementById("quizGameMode").value = quiz.game_mode || "castle_adventure"; document.getElementById("quizPublicat").checked = Boolean(quiz.published);
    const editor = document.getElementById("quizQuestionsEditor"); editor.innerHTML = ""; quizQuestionCounter = 0; (Array.isArray(quiz.questions) && quiz.questions.length ? quiz.questions : [null]).forEach(adaugaEditorIntrebareQuiz); document.getElementById("anuleazaEditareQuiz")?.classList.remove("ascuns"); afiseazaMesajQuizAdmin(`Editezi: ${quiz.title}`); document.getElementById("quizAdminForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deschidePreviewQuiz(quiz) {
    window.location.hash = "quiz";
    setTimeout(() => pornesteQuizCuDate(quiz, true), 80);
}

function previzualizeazaQuizDinFormular() {
    try { deschidePreviewQuiz(construiesteQuizDinFormular()); } catch (error) { afiseazaMesajQuizAdmin(error.message, true); }
}
function previzualizeazaQuizSalvat(id) { const quiz = quizAdminData.find((q) => String(q.id) === String(id)); if (quiz) deschidePreviewQuiz(quiz); }

async function comutaPublicareQuizAdmin(id) {
    const quiz = quizAdminData.find((q) => String(q.id) === String(id)); if (!quiz) return;
    const { error } = await supabaseClient.from("quizzes").update({ published: !quiz.published, updated_at: new Date().toISOString() }).eq("id", id); if (error) return alert("Nu am putut schimba starea quiz-ului: " + error.message); await incarcaQuizuriAdmin(); if (typeof incarcaQuizuri === "function") await incarcaQuizuri();
}
async function stergeQuizAdmin(id) {
    const quiz = quizAdminData.find((q) => String(q.id) === String(id)); if (!quiz || !window.confirm(`Ștergi definitiv quiz-ul „${quiz.title}”?`)) return;
    const { error } = await supabaseClient.from("quizzes").delete().eq("id", id); if (error) return alert("Quiz-ul nu a putut fi șters: " + error.message); if (document.getElementById("quizEditId")?.value === String(id)) reseteazaFormularQuizAdmin(); await incarcaQuizuriAdmin(); if (typeof incarcaQuizuri === "function") await incarcaQuizuri();
}

function initializeazaQuizAdmin() {
    const form = document.getElementById("quizAdminForm"); if (!form || form.dataset.initialized === "true") return; form.dataset.initialized = "true";
    form.addEventListener("submit", salveazaQuizAdmin); document.getElementById("adaugaIntrebareQuiz")?.addEventListener("click", () => adaugaEditorIntrebareQuiz()); document.getElementById("previzualizeazaQuizAdmin")?.addEventListener("click", previzualizeazaQuizDinFormular); document.getElementById("anuleazaEditareQuiz")?.addEventListener("click", () => { reseteazaFormularQuizAdmin(); afiseazaMesajQuizAdmin(""); }); if (!document.querySelector("#quizQuestionsEditor .quiz-question-editor")) adaugaEditorIntrebareQuiz();
}
