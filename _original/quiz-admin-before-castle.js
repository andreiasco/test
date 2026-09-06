// ======================================================
// ADMIN - CRUD QUIZ-URI INTERACTIVE
// ======================================================

let quizAdminData = [];
let quizQuestionCounter = 0;

function escapeAdminQuizHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function adaugaEditorIntrebareQuiz(question = null) {
    const container = document.getElementById("quizQuestionsEditor");
    if (!container) return;

    const index = quizQuestionCounter++;
    const answers = Array.isArray(question?.answers) ? question.answers : ["", "", "", ""];
    while (answers.length < 4) answers.push("");
    const correctIndex = Number.isInteger(Number(question?.correctIndex)) ? Number(question.correctIndex) : 0;

    const card = document.createElement("article");
    card.className = "quiz-question-editor";
    card.dataset.questionEditor = String(index);
    card.innerHTML = `
        <div class="quiz-question-editor-title">
            <strong>Întrebarea <span class="quiz-editor-number"></span></strong>
            <button type="button" class="quiz-remove-question" aria-label="Șterge întrebarea">✕</button>
        </div>
        <label>
            Întrebare
            <textarea class="quiz-q-text" rows="2" maxlength="400" required>${escapeAdminQuizHtml(question?.text || "")}</textarea>
        </label>
        <div class="quiz-answer-editors">
            ${[0,1,2,3].map((answerIndex) => `
                <label class="quiz-answer-editor-row">
                    <input type="radio" name="quiz-correct-${index}" value="${answerIndex}" ${correctIndex === answerIndex ? "checked" : ""}>
                    <span>${String.fromCharCode(65 + answerIndex)}</span>
                    <input class="quiz-q-answer" type="text" maxlength="220" value="${escapeAdminQuizHtml(answers[answerIndex] || "")}" placeholder="Varianta ${String.fromCharCode(65 + answerIndex)}${answerIndex < 2 ? " (obligatorie)" : " (opțională)"}">
                </label>`).join("")}
        </div>
        <label>
            Explicație după răspuns <span class="quiz-optional">(opțional)</span>
            <textarea class="quiz-q-explanation" rows="2" maxlength="400">${escapeAdminQuizHtml(question?.explanation || "")}</textarea>
        </label>`;

    card.querySelector(".quiz-remove-question")?.addEventListener("click", () => {
        const editors = container.querySelectorAll(".quiz-question-editor");
        if (editors.length <= 1) {
            afiseazaMesajQuizAdmin("Quiz-ul trebuie să aibă cel puțin o întrebare.", true);
            return;
        }
        card.remove();
        renumeroteazaEditoareQuiz();
    });

    container.appendChild(card);
    renumeroteazaEditoareQuiz();
}

function renumeroteazaEditoareQuiz() {
    document.querySelectorAll("#quizQuestionsEditor .quiz-question-editor").forEach((card, index) => {
        const number = card.querySelector(".quiz-editor-number");
        if (number) number.textContent = String(index + 1);
    });
}

function colecteazaIntrebariQuizAdmin() {
    const cards = [...document.querySelectorAll("#quizQuestionsEditor .quiz-question-editor")];
    if (!cards.length) throw new Error("Adaugă cel puțin o întrebare.");

    return cards.map((card, questionIndex) => {
        const text = card.querySelector(".quiz-q-text")?.value.trim() || "";
        const rawAnswers = [...card.querySelectorAll(".quiz-q-answer")].map((input) => input.value.trim());
        const selected = card.querySelector('input[type="radio"]:checked');
        const originalCorrect = Number(selected?.value ?? 0);
        const explanation = card.querySelector(".quiz-q-explanation")?.value.trim() || "";

        if (!text) throw new Error(`Completează textul întrebării ${questionIndex + 1}.`);
        if (!rawAnswers[0] || !rawAnswers[1]) throw new Error(`Întrebarea ${questionIndex + 1} trebuie să aibă cel puțin variantele A și B.`);
        if (!rawAnswers[originalCorrect]) throw new Error(`Răspunsul corect selectat la întrebarea ${questionIndex + 1} este gol.`);

        const answers = [];
        let correctIndex = -1;
        rawAnswers.forEach((answer, index) => {
            if (!answer) return;
            if (index === originalCorrect) correctIndex = answers.length;
            answers.push(answer);
        });

        if (correctIndex < 0) throw new Error(`Selectează un răspuns corect valid la întrebarea ${questionIndex + 1}.`);
        return { text, answers, correctIndex, explanation };
    });
}

function afiseazaMesajQuizAdmin(text, error = false) {
    const message = document.getElementById("quizAdminMesaj");
    if (!message) return;
    message.textContent = text;
    message.classList.toggle("error", error);
    message.classList.toggle("success", !error && Boolean(text));
}

async function salveazaQuizAdmin(event) {
    event.preventDefault();

    try {
        const user = await utilizatorAutentificat();
        if (!user) throw new Error("Trebuie să fii autentificat ca administrator.");

        const title = document.getElementById("quizTitlu")?.value.trim() || "";
        const description = document.getElementById("quizDescriere")?.value.trim() || "";
        const grade = document.getElementById("quizClasa")?.value || "general";
        const seconds = Number(document.getElementById("quizTimp")?.value || 20);
        const published = Boolean(document.getElementById("quizPublicat")?.checked);
        const editId = document.getElementById("quizEditId")?.value || "";
        const questions = colecteazaIntrebariQuizAdmin();

        if (!title) throw new Error("Completează titlul quiz-ului.");

        const payload = {
            title,
            description,
            grade,
            seconds_per_question: Math.max(5, Math.min(120, seconds)),
            questions,
            published,
            created_by: user.id,
            updated_at: new Date().toISOString()
        };

        afiseazaMesajQuizAdmin(editId ? "Se actualizează quiz-ul..." : "Se salvează quiz-ul...");

        let response;
        if (editId) {
            response = await supabaseClient.from("quizzes").update(payload).eq("id", editId);
        } else {
            response = await supabaseClient.from("quizzes").insert(payload);
        }

        if (response.error) throw response.error;

        afiseazaMesajQuizAdmin(editId ? "Quiz actualizat cu succes." : "Quiz creat cu succes.");
        reseteazaFormularQuizAdmin();
        await incarcaQuizuriAdmin();
        if (typeof incarcaQuizuri === "function") await incarcaQuizuri();
    } catch (error) {
        console.error("Eroare salvare quiz:", error);
        afiseazaMesajQuizAdmin(error.message || "Quiz-ul nu a putut fi salvat.", true);
    }
}

function reseteazaFormularQuizAdmin() {
    const form = document.getElementById("quizAdminForm");
    if (!form) return;
    form.reset();
    document.getElementById("quizEditId").value = "";
    document.getElementById("quizPublicat").checked = true;
    document.getElementById("quizTimp").value = "20";
    document.getElementById("quizQuestionsEditor").innerHTML = "";
    quizQuestionCounter = 0;
    adaugaEditorIntrebareQuiz();
    document.getElementById("anuleazaEditareQuiz")?.classList.add("ascuns");
}

async function incarcaQuizuriAdmin() {
    const lista = document.getElementById("quizAdminLista");
    if (!lista) return;

    lista.innerHTML = '<p class="quiz-empty">Se încarcă quiz-urile...</p>';

    const user = await utilizatorAutentificat();
    if (!user) {
        lista.innerHTML = '<p class="quiz-empty">Conectează-te ca administrator.</p>';
        return;
    }

    const { data, error } = await supabaseClient
        .from("quizzes")
        .select("id,title,description,grade,seconds_per_question,questions,published,created_at")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Eroare listare quiz admin:", error);
        lista.innerHTML = '<p class="quiz-empty quiz-error">Lista nu a putut fi încărcată.</p>';
        return;
    }

    quizAdminData = data || [];
    randareQuizuriAdmin();
}

function randareQuizuriAdmin() {
    const lista = document.getElementById("quizAdminLista");
    if (!lista) return;

    if (!quizAdminData.length) {
        lista.innerHTML = '<p class="quiz-empty">Nu există încă quiz-uri create.</p>';
        return;
    }

    lista.innerHTML = quizAdminData.map((quiz) => {
        const count = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
        const grade = quiz.grade === "general" ? "General" : `Clasa a ${quiz.grade}-a`;
        return `
            <article class="quiz-admin-list-item">
                <div>
                    <div class="quiz-admin-list-meta">
                        <span>${escapeAdminQuizHtml(grade)}</span>
                        <span>${count} întrebări</span>
                        <span class="${quiz.published ? "published" : "draft"}">${quiz.published ? "Publicat" : "Ciornă"}</span>
                    </div>
                    <h4>${escapeAdminQuizHtml(quiz.title)}</h4>
                    <p>${escapeAdminQuizHtml(quiz.description || "Fără descriere")}</p>
                </div>
                <div class="quiz-admin-item-actions">
                    <button type="button" class="admin-btn secondary" data-quiz-edit="${escapeAdminQuizHtml(quiz.id)}">✏️ Editează</button>
                    <button type="button" class="admin-btn secondary" data-quiz-toggle="${escapeAdminQuizHtml(quiz.id)}">${quiz.published ? "🙈 Ascunde" : "👁 Publică"}</button>
                    <button type="button" class="admin-btn danger" data-quiz-delete="${escapeAdminQuizHtml(quiz.id)}">🗑 Șterge</button>
                </div>
            </article>`;
    }).join("");

    lista.querySelectorAll("[data-quiz-edit]").forEach((button) => {
        button.addEventListener("click", () => editeazaQuizAdmin(button.dataset.quizEdit));
    });
    lista.querySelectorAll("[data-quiz-toggle]").forEach((button) => {
        button.addEventListener("click", () => comutaPublicareQuizAdmin(button.dataset.quizToggle));
    });
    lista.querySelectorAll("[data-quiz-delete]").forEach((button) => {
        button.addEventListener("click", () => stergeQuizAdmin(button.dataset.quizDelete));
    });
}

function editeazaQuizAdmin(id) {
    const quiz = quizAdminData.find((item) => String(item.id) === String(id));
    if (!quiz) return;

    document.getElementById("quizEditId").value = quiz.id;
    document.getElementById("quizTitlu").value = quiz.title || "";
    document.getElementById("quizDescriere").value = quiz.description || "";
    document.getElementById("quizClasa").value = quiz.grade || "general";
    document.getElementById("quizTimp").value = String(quiz.seconds_per_question || 20);
    document.getElementById("quizPublicat").checked = Boolean(quiz.published);

    const editor = document.getElementById("quizQuestionsEditor");
    editor.innerHTML = "";
    quizQuestionCounter = 0;
    (Array.isArray(quiz.questions) && quiz.questions.length ? quiz.questions : [null]).forEach(adaugaEditorIntrebareQuiz);

    document.getElementById("anuleazaEditareQuiz")?.classList.remove("ascuns");
    afiseazaMesajQuizAdmin(`Editezi: ${quiz.title}`);
    document.getElementById("quizAdminForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function comutaPublicareQuizAdmin(id) {
    const quiz = quizAdminData.find((item) => String(item.id) === String(id));
    if (!quiz) return;

    const { error } = await supabaseClient
        .from("quizzes")
        .update({ published: !quiz.published, updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) {
        alert("Nu am putut schimba starea quiz-ului: " + error.message);
        return;
    }

    await incarcaQuizuriAdmin();
    if (typeof incarcaQuizuri === "function") await incarcaQuizuri();
}

async function stergeQuizAdmin(id) {
    const quiz = quizAdminData.find((item) => String(item.id) === String(id));
    if (!quiz) return;
    if (!window.confirm(`Ștergi definitiv quiz-ul „${quiz.title}”?`)) return;

    const { error } = await supabaseClient.from("quizzes").delete().eq("id", id);
    if (error) {
        alert("Quiz-ul nu a putut fi șters: " + error.message);
        return;
    }

    if (document.getElementById("quizEditId")?.value === String(id)) reseteazaFormularQuizAdmin();
    await incarcaQuizuriAdmin();
    if (typeof incarcaQuizuri === "function") await incarcaQuizuri();
}

function initializeazaQuizAdmin() {
    const form = document.getElementById("quizAdminForm");
    if (!form || form.dataset.initialized === "true") return;
    form.dataset.initialized = "true";

    form.addEventListener("submit", salveazaQuizAdmin);
    document.getElementById("adaugaIntrebareQuiz")?.addEventListener("click", () => adaugaEditorIntrebareQuiz());
    document.getElementById("anuleazaEditareQuiz")?.addEventListener("click", () => {
        reseteazaFormularQuizAdmin();
        afiseazaMesajQuizAdmin("");
    });

    if (!document.querySelector("#quizQuestionsEditor .quiz-question-editor")) adaugaEditorIntrebareQuiz();
}
