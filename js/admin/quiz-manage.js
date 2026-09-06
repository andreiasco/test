// ======================================================
// ADMIN - CREATOR QUIZ ANIMAT MULTI-MOD
// ======================================================
let quizAdminData = [];
let quizQuestionCounter = 0;

const ADMIN_MONSTERS = [
    ["goblin", "👹 Goblin"], ["bat", "🦇 Liliac uriaș"], ["skeleton", "💀 Schelet"],
    ["spider", "🕷️ Păianjen uriaș"], ["knight", "🛡️ Cavaler blestemat"], ["ghost", "👻 Fantomă"],
    ["golem", "🪨 Golem"], ["wizard", "🧙 Vrăjitor întunecat"], ["demon", "😈 Demon"], ["dragon", "🐉 Dragon"]
];
const QUIZ_MODE_META = {
    castle_choice: { icon: "🎯", label: "Alege răspunsul", type: "multiple_choice", help: "Scrie întrebarea, variantele și marchează răspunsul corect." },
    castle_true_false: { icon: "✅", label: "Adevărat / Fals", type: "true_false", help: "Scrie afirmația și selectează dacă este adevărată sau falsă." },
    castle_hangman: { icon: "🪢", label: "Spânzurătoarea", type: "hangman", help: "Scrie indiciul și cuvântul/expresia pe care elevul trebuie să o descopere." },
    castle_ordering: { icon: "🔀", label: "Pune în ordine", type: "ordering", help: "Scrie elementele în ordinea corectă, separate prin virgulă sau pe rânduri diferite." }
};

function escapeAdminQuizHtml(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function currentQuizMode() { return document.getElementById("quizGameMode")?.value || "castle_choice"; }
function adminMonsterOptions(selected = "goblin") {
    return ADMIN_MONSTERS.map(([value, label]) => `<option value="${value}" ${value === selected ? "selected" : ""}>${label}</option>`).join("");
}
function modeQuestionType(mode = currentQuizMode()) { return QUIZ_MODE_META[mode]?.type || "multiple_choice"; }

function syncQuizModeUI(rebuild = false) {
    const selected = document.querySelector('input[name="quizMode"]:checked')?.value || "castle_choice";
    const hidden = document.getElementById("quizGameMode"); if (hidden) hidden.value = selected;
    const meta = QUIZ_MODE_META[selected];
    const desc = document.getElementById("quizModeDescription");
    if (desc) desc.innerHTML = `<strong>${meta.icon} ${meta.label}</strong><span>❤️❤️❤️ 3 vieți</span><span>❌ Greșeală = −1 viață</span><span>💀 0 vieți = joc încheiat</span><span>🐉 Ultima provocare = boss final</span>`;
    const heading = document.getElementById("quizEditorHeading"); if (heading) heading.textContent = `${meta.icon} Provocări · ${meta.label}`;
    const help = document.getElementById("quizEditorHelp"); if (help) help.textContent = meta.help;
    if (rebuild) {
        const existing = document.querySelectorAll("#quizQuestionsEditor .quiz-question-editor").length;
        if (existing && !window.confirm("Schimbarea tipului va reseta provocările deja introduse. Continui?")) {
            const old = hidden?.dataset.previous || "castle_choice";
            const oldRadio = document.querySelector(`input[name="quizMode"][value="${old}"]`);
            if (oldRadio) oldRadio.checked = true;
            if (hidden) hidden.value = old;
            syncQuizModeUI(false);
            return;
        }
        if (hidden) hidden.dataset.previous = selected;
        const editor = document.getElementById("quizQuestionsEditor"); if (editor) editor.innerHTML = "";
        quizQuestionCounter = 0; adaugaEditorIntrebareQuiz();
    } else if (hidden) hidden.dataset.previous = selected;
}

function adaugaEditorIntrebareQuiz(question = null) {
    const container = document.getElementById("quizQuestionsEditor"); if (!container) return;
    const index = quizQuestionCounter++;
    const mode = currentQuizMode();
    const type = modeQuestionType(mode);
    const answers = Array.isArray(question?.answers) ? [...question.answers] : ["", "", "", ""];
    while (answers.length < 4) answers.push("");
    const correctIndex = Number.isInteger(Number(question?.correctIndex)) ? Number(question.correctIndex) : 0;
    const target = String(question?.target || question?.answer || "");
    const orderItems = Array.isArray(question?.items) ? question.items : (Array.isArray(question?.answers) ? question.answers : []);
    let specific = "";
    if (type === "multiple_choice") {
        specific = `<div class="quiz-answer-editors">${[0,1,2,3].map((a) => `<label class="quiz-answer-editor-row"><input type="radio" name="quiz-correct-${index}" value="${a}" ${correctIndex===a?"checked":""}><span>${String.fromCharCode(65+a)}</span><input class="quiz-q-answer" name="quiz-answer-${index}-${a}" type="text" maxlength="220" value="${escapeAdminQuizHtml(answers[a]||"")}" placeholder="Varianta ${String.fromCharCode(65+a)}"></label>`).join("")}</div>`;
    } else if (type === "true_false") {
        specific = `<div class="quiz-tf-admin"><label><input type="radio" name="quiz-correct-${index}" value="0" ${correctIndex!==1?"checked":""}> ✅ Adevărat</label><label><input type="radio" name="quiz-correct-${index}" value="1" ${correctIndex===1?"checked":""}> ❌ Fals</label></div>`;
    } else if (type === "hangman") {
        specific = `<label>Cuvânt / expresie corectă<input class="quiz-q-target" name="quiz-target-${index}" type="text" maxlength="80" required value="${escapeAdminQuizHtml(target)}" placeholder="Ex.: SUBSTANTIV"></label><small class="quiz-admin-hint">Diacriticele sunt acceptate. Spațiile și cratimele se afișează automat.</small>`;
    } else {
        specific = `<label>Elementele în ordinea corectă<textarea class="quiz-q-order" name="quiz-order-${index}" rows="3" maxlength="500" required placeholder="Ex.: introducere, cuprins, încheiere">${escapeAdminQuizHtml(orderItems.join(", "))}</textarea></label><small class="quiz-admin-hint">Separă elementele prin virgulă sau scrie fiecare element pe un rând nou.</small>`;
    }
    const card = document.createElement("article");
    card.className = "quiz-question-editor castle-question-editor-admin"; card.dataset.questionEditor = String(index);
    card.innerHTML = `<div class="quiz-question-editor-title"><strong>Scena <span class="quiz-editor-number"></span> · întâlnire cu monstrul</strong><button type="button" class="quiz-remove-question" aria-label="Șterge scena">✕</button></div>
        <div class="quiz-admin-scene-grid"><label>Monstru<select class="quiz-q-monster" name="quiz-monster-${index}">${adminMonsterOptions(question?.monster || "goblin")}</select></label><div class="quiz-mode-badge">${QUIZ_MODE_META[mode].icon} ${QUIZ_MODE_META[mode].label}</div></div>
        <label>${type === "hangman" ? "Indiciu / cerință" : type === "ordering" ? "Cerință" : type === "true_false" ? "Afirmație" : "Întrebare"}<textarea class="quiz-q-text" name="quiz-text-${index}" rows="2" maxlength="400" required>${escapeAdminQuizHtml(question?.text || "")}</textarea></label>
        ${specific}
        <label>Explicație după provocare <span class="quiz-optional">(opțional)</span><textarea class="quiz-q-explanation" name="quiz-explanation-${index}" rows="2" maxlength="400">${escapeAdminQuizHtml(question?.explanation || "")}</textarea></label>
        <div class="quiz-admin-dialog-grid"><label>Replica la succes<input class="quiz-q-correct-message" name="quiz-correct-message-${index}" type="text" maxlength="180" value="${escapeAdminQuizHtml(question?.correctMessage || "Corect! Poți trece mai departe.")}"></label><label>Replica la greșeală<input class="quiz-q-wrong-message" name="quiz-wrong-message-${index}" type="text" maxlength="180" value="${escapeAdminQuizHtml(question?.wrongMessage || "De data aceasta te iert. Te las să treci mai departe.")}"></label></div>`;
    card.querySelector(".quiz-remove-question")?.addEventListener("click", () => {
        if (container.querySelectorAll(".quiz-question-editor").length <= 1) return afiseazaMesajQuizAdmin("Quiz-ul trebuie să aibă cel puțin o provocare.", true);
        card.remove(); renumeroteazaEditoareQuiz();
    });
    container.appendChild(card); renumeroteazaEditoareQuiz();
}

function renumeroteazaEditoareQuiz() {
    const cards = [...document.querySelectorAll("#quizQuestionsEditor .quiz-question-editor")];
    cards.forEach((card, index) => { const n=card.querySelector(".quiz-editor-number"); if(n)n.textContent=String(index+1); card.classList.toggle("quiz-boss-editor", index===cards.length-1); });
}
function parseOrderItems(value) { return String(value||"").split(/\n|,/).map(x=>x.trim()).filter(Boolean); }

function colecteazaIntrebariQuizAdmin() {
    const cards=[...document.querySelectorAll("#quizQuestionsEditor .quiz-question-editor")]; if(!cards.length) throw new Error("Adaugă cel puțin o provocare.");
    const mode=currentQuizMode(); const type=modeQuestionType(mode);
    return cards.map((card,i)=>{
        const text=card.querySelector(".quiz-q-text")?.value.trim()||""; if(!text) throw new Error(`Completează cerința din scena ${i+1}.`);
        const base={type,text,monster:card.querySelector(".quiz-q-monster")?.value||"goblin",explanation:card.querySelector(".quiz-q-explanation")?.value.trim()||"",correctMessage:card.querySelector(".quiz-q-correct-message")?.value.trim()||"Corect! Poți trece mai departe.",wrongMessage:card.querySelector(".quiz-q-wrong-message")?.value.trim()||"De data aceasta te iert. Te las să treci mai departe.",boss:i===cards.length-1};
        if(type==="multiple_choice"){
            const raw=[...card.querySelectorAll(".quiz-q-answer")].map(x=>x.value.trim()); const selected=Number(card.querySelector('input[type="radio"]:checked')?.value??0); const selectedText=raw[selected];
            if(raw.filter(Boolean).length<2) throw new Error(`Scena ${i+1} trebuie să aibă cel puțin două variante.`); if(!selectedText) throw new Error(`Răspunsul corect din scena ${i+1} este gol.`);
            base.answers=raw.filter(Boolean); base.correctIndex=raw.slice(0,selected+1).filter(Boolean).length-1;
        } else if(type==="true_false") { base.answers=["Adevărat","Fals"]; base.correctIndex=Number(card.querySelector('input[type="radio"]:checked')?.value??0); }
        else if(type==="hangman") { base.target=card.querySelector(".quiz-q-target")?.value.trim()||""; if(base.target.length<2) throw new Error(`Completează cuvântul pentru scena ${i+1}.`); }
        else { base.items=parseOrderItems(card.querySelector(".quiz-q-order")?.value); if(base.items.length<2) throw new Error(`Scena ${i+1} trebuie să conțină cel puțin două elemente de ordonat.`); }
        return base;
    });
}

function afiseazaMesajQuizAdmin(text,error=false){const el=document.getElementById("quizAdminMesaj");if(!el)return;el.textContent=text;el.classList.toggle("error",error);el.classList.toggle("success",!error&&Boolean(text));}
function construiesteQuizDinFormular(){const title=document.getElementById("quizTitlu")?.value.trim()||"";if(!title)throw new Error("Completează titlul quiz-ului.");return{id:document.getElementById("quizEditId")?.value||`preview-${Date.now()}`,title,description:document.getElementById("quizDescriere")?.value.trim()||"",grade:document.getElementById("quizClasa")?.value||"general",difficulty:document.getElementById("quizDificultate")?.value||"medium",game_mode:currentQuizMode(),seconds_per_question:Math.max(10,Math.min(120,Number(document.getElementById("quizTimp")?.value||30))),lives:3,published:Boolean(document.getElementById("quizPublicat")?.checked),questions:colecteazaIntrebariQuizAdmin()};}

async function salveazaQuizAdmin(event){event.preventDefault();try{const user=await utilizatorAutentificat();if(!user)throw new Error("Trebuie să fii autentificat ca administrator.");const quiz=construiesteQuizDinFormular();const editId=document.getElementById("quizEditId")?.value||"";const payload={title:quiz.title,description:quiz.description,grade:quiz.grade,difficulty:quiz.difficulty,game_mode:quiz.game_mode,lives:3,seconds_per_question:quiz.seconds_per_question,questions:quiz.questions,published:quiz.published,created_by:user.id,updated_at:new Date().toISOString()};afiseazaMesajQuizAdmin(editId?"Se actualizează quiz-ul...":"Se salvează quiz-ul...");const response=editId?await supabaseClient.from("quizzes").update(payload).eq("id",editId):await supabaseClient.from("quizzes").insert(payload);if(response.error)throw response.error;afiseazaMesajQuizAdmin(editId?"Quiz-ul a fost actualizat.":"Quiz-ul a fost creat.");reseteazaFormularQuizAdmin();await incarcaQuizuriAdmin();if(typeof incarcaQuizuri==="function")await incarcaQuizuri();}catch(error){console.error(error);afiseazaMesajQuizAdmin(error.message||"Quiz-ul nu a putut fi salvat.",true);}}

function seteazaModQuizAdmin(mode){const valid=QUIZ_MODE_META[mode]?mode:"castle_choice";const radio=document.querySelector(`input[name="quizMode"][value="${valid}"]`);if(radio)radio.checked=true;const hidden=document.getElementById("quizGameMode");if(hidden){hidden.value=valid;hidden.dataset.previous=valid;}syncQuizModeUI(false);}
function reseteazaFormularQuizAdmin(){const form=document.getElementById("quizAdminForm");if(!form)return;form.reset();document.getElementById("quizEditId").value="";document.getElementById("quizPublicat").checked=true;document.getElementById("quizTimp").value="30";document.getElementById("quizDificultate").value="medium";seteazaModQuizAdmin("castle_choice");document.getElementById("quizQuestionsEditor").innerHTML="";quizQuestionCounter=0;adaugaEditorIntrebareQuiz();document.getElementById("anuleazaEditareQuiz")?.classList.add("ascuns");}

async function incarcaQuizuriAdmin(){const lista=document.getElementById("quizAdminLista");if(!lista)return;lista.innerHTML='<p class="quiz-empty">Se încarcă quiz-urile...</p>';const user=await utilizatorAutentificat();if(!user){lista.innerHTML='<p class="quiz-empty">Conectează-te ca administrator.</p>';return;}const{data,error}=await supabaseClient.from("quizzes").select("id,title,description,grade,seconds_per_question,questions,published,created_at,game_mode,difficulty,lives").order("created_at",{ascending:false});if(error){console.error(error);lista.innerHTML='<p class="quiz-empty quiz-error">Lista nu a putut fi încărcată. Rulează actualizarea supabase/quizzes.sql.</p>';return;}quizAdminData=data||[];randareQuizuriAdmin();}
function randareQuizuriAdmin(){const lista=document.getElementById("quizAdminLista");if(!lista)return;if(!quizAdminData.length){lista.innerHTML='<p class="quiz-empty">Nu există încă quiz-uri create.</p>';return;}lista.innerHTML=quizAdminData.map(q=>{const meta=QUIZ_MODE_META[q.game_mode]||QUIZ_MODE_META.castle_choice;return`<article class="quiz-admin-list-item"><div><div class="quiz-admin-list-meta"><span>${meta.icon} ${meta.label}</span><span>${q.grade==="general"?"General":`Clasa a ${q.grade}-a`}</span><span>${Array.isArray(q.questions)?q.questions.length:0} provocări</span><span>❤️ 3 vieți</span><span class="${q.published?"published":"draft"}">${q.published?"Publicat":"Ciornă"}</span></div><h4>${escapeAdminQuizHtml(q.title)}</h4><p>${escapeAdminQuizHtml(q.description||"Fără descriere")}</p></div><div class="quiz-admin-item-actions"><button type="button" class="admin-btn secondary" data-quiz-preview="${q.id}">▶ Testează</button><button type="button" class="admin-btn secondary" data-quiz-edit="${q.id}">✏️ Editează</button><button type="button" class="admin-btn secondary" data-quiz-toggle="${q.id}">${q.published?"🙈 Ascunde":"👁 Publică"}</button><button type="button" class="admin-btn danger" data-quiz-delete="${q.id}">🗑 Șterge</button></div></article>`}).join("");lista.querySelectorAll("[data-quiz-edit]").forEach(b=>b.addEventListener("click",()=>editeazaQuizAdmin(b.dataset.quizEdit)));lista.querySelectorAll("[data-quiz-preview]").forEach(b=>b.addEventListener("click",()=>previzualizeazaQuizSalvat(b.dataset.quizPreview)));lista.querySelectorAll("[data-quiz-toggle]").forEach(b=>b.addEventListener("click",()=>comutaPublicareQuizAdmin(b.dataset.quizToggle)));lista.querySelectorAll("[data-quiz-delete]").forEach(b=>b.addEventListener("click",()=>stergeQuizAdmin(b.dataset.quizDelete)));}

function editeazaQuizAdmin(id){const q=quizAdminData.find(x=>String(x.id)===String(id));if(!q)return;document.getElementById("quizEditId").value=q.id;document.getElementById("quizTitlu").value=q.title||"";document.getElementById("quizDescriere").value=q.description||"";document.getElementById("quizClasa").value=q.grade||"general";document.getElementById("quizTimp").value=String(q.seconds_per_question||30);document.getElementById("quizDificultate").value=q.difficulty||"medium";document.getElementById("quizPublicat").checked=Boolean(q.published);seteazaModQuizAdmin(q.game_mode||"castle_choice");const editor=document.getElementById("quizQuestionsEditor");editor.innerHTML="";quizQuestionCounter=0;(Array.isArray(q.questions)&&q.questions.length?q.questions:[null]).forEach(adaugaEditorIntrebareQuiz);document.getElementById("anuleazaEditareQuiz")?.classList.remove("ascuns");afiseazaMesajQuizAdmin(`Editezi: ${q.title}`);document.getElementById("quizAdminForm")?.scrollIntoView({behavior:"smooth",block:"start"});}
function deschidePreviewQuiz(quiz){window.location.hash="quiz";setTimeout(()=>pornesteQuizCuDate(quiz,true),80);}function previzualizeazaQuizDinFormular(){try{deschidePreviewQuiz(construiesteQuizDinFormular());}catch(error){afiseazaMesajQuizAdmin(error.message,true);}}function previzualizeazaQuizSalvat(id){const q=quizAdminData.find(x=>String(x.id)===String(id));if(q)deschidePreviewQuiz(q);}
async function comutaPublicareQuizAdmin(id){const q=quizAdminData.find(x=>String(x.id)===String(id));if(!q)return;const{error}=await supabaseClient.from("quizzes").update({published:!q.published,updated_at:new Date().toISOString()}).eq("id",id);if(error)return alert("Nu am putut schimba starea quiz-ului: "+error.message);await incarcaQuizuriAdmin();if(typeof incarcaQuizuri==="function")await incarcaQuizuri();}
async function stergeQuizAdmin(id){const q=quizAdminData.find(x=>String(x.id)===String(id));if(!q||!window.confirm(`Ștergi definitiv quiz-ul „${q.title}”?`))return;const{error}=await supabaseClient.from("quizzes").delete().eq("id",id);if(error)return alert("Quiz-ul nu a putut fi șters: "+error.message);if(document.getElementById("quizEditId")?.value===String(id))reseteazaFormularQuizAdmin();await incarcaQuizuriAdmin();if(typeof incarcaQuizuri==="function")await incarcaQuizuri();}

function initializeazaQuizAdmin(){const form=document.getElementById("quizAdminForm");if(!form||form.dataset.initialized==="true")return;form.dataset.initialized="true";form.addEventListener("submit",salveazaQuizAdmin);document.querySelectorAll('input[name="quizMode"]').forEach(r=>r.addEventListener("change",()=>syncQuizModeUI(true)));document.getElementById("adaugaIntrebareQuiz")?.addEventListener("click",()=>adaugaEditorIntrebareQuiz());document.getElementById("previzualizeazaQuizAdmin")?.addEventListener("click",previzualizeazaQuizDinFormular);document.getElementById("anuleazaEditareQuiz")?.addEventListener("click",()=>{reseteazaFormularQuizAdmin();afiseazaMesajQuizAdmin("");});seteazaModQuizAdmin("castle_choice");if(!document.querySelector("#quizQuestionsEditor .quiz-question-editor"))adaugaEditorIntrebareQuiz();}

// ======================================================
// ADMIN - GENERATOR QUIZ CU AI
// ======================================================
function statusQuizAI(text, error = false) {
    const el = document.getElementById("quizAiStatus");
    if (!el) return;
    el.textContent = text || "";
    el.classList.toggle("error", error);
    el.classList.toggle("success", !error && Boolean(text));
}

function aplicaQuizGeneratAI(payload) {
    const mode = payload?.game_mode && QUIZ_MODE_META[payload.game_mode] ? payload.game_mode : currentQuizMode();
    seteazaModQuizAdmin(mode);
    if (payload?.title) document.getElementById("quizTitlu").value = payload.title;
    if (payload?.description) document.getElementById("quizDescriere").value = payload.description;
    const questions = Array.isArray(payload?.questions) ? payload.questions : [];
    if (!questions.length) throw new Error("AI-ul nu a returnat provocări valide.");
    const editor = document.getElementById("quizQuestionsEditor");
    if (editor) editor.innerHTML = "";
    quizQuestionCounter = 0;
    questions.forEach(adaugaEditorIntrebareQuiz);
    renumeroteazaEditoareQuiz();
}

async function genereazaQuizCuAI() {
    const button = document.getElementById("genereazaQuizAI");
    const tema = document.getElementById("quizAiTema")?.value.trim() || "";
    if (tema.length < 3) return statusQuizAI("Scrie tema quiz-ului.", true);
    const { data: sessionData } = await supabaseClient.auth.getSession();
    if (!sessionData?.session) return statusQuizAI("Trebuie să fii autentificat.", true);
    const role = await obtineRolUtilizator(sessionData.session.user);
    if (role !== "admin") return statusQuizAI("Generatorul AI este disponibil doar administratorului.", true);

    const count = Math.max(3, Math.min(12, Number(document.getElementById("quizAiCount")?.value || 8)));
    const body = {
        topic: tema,
        count,
        game_mode: currentQuizMode(),
        grade: document.getElementById("quizClasa")?.value || "general",
        difficulty: document.getElementById("quizDificultate")?.value || "medium"
    };
    if (button) button.disabled = true;
    statusQuizAI("AI-ul pregătește provocările...");
    try {
        const { data, error } = await supabaseClient.functions.invoke("ai-generate-quiz", { body });
        if (error) throw error;
        aplicaQuizGeneratAI(data?.quiz);
        statusQuizAI(`Au fost generate ${data.quiz.questions.length} provocări. Verifică-le înainte de salvare.`);
    } catch (error) {
        console.error("Generate quiz AI:", error);
        statusQuizAI("Nu am putut genera quiz-ul. Verifică funcția AI din Supabase.", true);
    } finally {
        if (button) button.disabled = false;
    }
}

(function attachQuizAIWhenReady(){
    const form = document.getElementById("quizAdminForm");
    if (!form) return;
    document.getElementById("genereazaQuizAI")?.addEventListener("click", genereazaQuizCuAI);
})();
