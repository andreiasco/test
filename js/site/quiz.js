// ======================================================
// PATRU JOCURI: AVENTURĂ 3D, ADEVĂRAT/FALS, SPÂNZURĂTOAREA ȘI ORDONARE
// ======================================================
let quizuriPublice = []; let quizActiv = null; let quizIndexIntrebare = 0; let quizScor = 0; let quizVieti = 3; let quizCorecte = 0; let quizTimerId = null; let quizTimpRamas = 0; let quizRaspunsBlocat = false; let quizEstePreview = false; let quizSoundEnabled = true; let hangmanState = null;
let quizPreviewPlacement = null;
let quizLaunchVersion = 0;
let quizRouteState = null;
let quizRouteToggleBusy = false;
let quizRoutePausedTimer = null;
let quizRouteAdvance = null;
let quizDialogueVersion = 0;

function deschideContainerQuizPreview() {
    if (quizPreviewPlacement) return;
    const player = document.getElementById('quizPlayer');
    const modal = document.getElementById('adminQuizPreview');
    const content = document.getElementById('adminQuizPreviewContent');
    if (!player || !modal || !content) return;
    quizPreviewPlacement = { parent: player.parentNode, next: player.nextSibling, focus: document.activeElement, overflow: document.body.style.overflow };
    content.appendChild(player); modal.classList.remove('ascuns'); document.body.style.overflow = 'hidden';
    modal.focus({ preventScroll: true });
}
function inchideContainerQuizPreview() {
    if (!quizPreviewPlacement) return;
    const state = quizPreviewPlacement; quizPreviewPlacement = null;
    const player = document.getElementById('quizPlayer');
    if (player) state.parent.insertBefore(player, state.next?.parentNode === state.parent ? state.next : null);
    document.getElementById('adminQuizPreview')?.classList.add('ascuns');
    document.body.style.overflow = state.overflow;
    state.focus?.focus?.({ preventScroll: true });
}
const QUIZ_MONSTERS = { goblin: { name: "Goblinul", icon: "👹" }, bat: { name: "Liliacul uriaș", icon: "🦇" }, skeleton: { name: "Scheletul", icon: "💀" }, spider: { name: "Păianjenul uriaș", icon: "🕷️" }, knight: { name: "Cavalerul blestemat", icon: "🛡️" }, ghost: { name: "Fantoma", icon: "👻" }, golem: { name: "Golemul", icon: "🪨" }, wizard: { name: "Vrăjitorul întunecat", icon: "🧙" }, demon: { name: "Demonul", icon: "😈" }, dragon: { name: "Dragonul", icon: "🐉" } };
const QUIZ_MODES = { castle_choice: { label: "Alege răspunsul", icon: "🎯", type: "multiple_choice" }, castle_true_false: { label: "Adevărat / Fals", icon: "✅", type: "true_false" }, castle_hangman: { label: "Spânzurătoarea", icon: "🪢", type: "hangman" }, castle_ordering: { label: "Pune în ordine", icon: "🔀", type: "ordering" }, castle_adventure: { label: "Alege răspunsul", icon: "🎯", type: "multiple_choice" } };
function escapeQuizHtml(v) { return String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function stripDiacritics(s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase(); }
function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }
function modeMeta(q = quizActiv) { return QUIZ_MODES[q?.game_mode] || QUIZ_MODES.castle_choice; }
function quizHasAdventure(q = quizActiv) { return modeMeta(q).type === "multiple_choice"; }
function quizLivesForMode(q = quizActiv) { return modeMeta(q).type === "hangman" ? 6 : 3; }
function normalizeazaIntrebariQuiz(raw, gameMode) {
    if (!Array.isArray(raw)) return [];
    const forced = QUIZ_MODES[gameMode]?.type;
    return raw.map(item => {
        const type = forced || item?.type || "multiple_choice";
        const base = { type, text: String(item?.text || "").trim(), explanation: String(item?.explanation || "").trim(), monster: String(item?.monster || "goblin"), correctMessage: String(item?.correctMessage || "Corect! Poți trece mai departe.").trim(), wrongMessage: String(item?.wrongMessage || "De data aceasta te iert. Te las să treci mai departe.").trim(), boss: type === "multiple_choice" && Boolean(item?.boss) };
        if (type === "multiple_choice" || type === "true_false") {
            const answers = Array.isArray(item?.answers) ? item.answers.map(a => String(a || "").trim()).filter(Boolean) : [];
            base.answers = type === "true_false" ? ["Adevărat", "Fals"] : answers;
            base.correctIndex = Number(item?.correctIndex);
            if (type === "true_false") {
                const selected = stripDiacritics(answers[base.correctIndex] || "");
                if (["ADEVARAT", "TRUE", "DA"].includes(selected)) base.correctIndex = 0;
                if (["FALS", "FALSE", "NU"].includes(selected)) base.correctIndex = 1;
            }
        } else if (type === "hangman") base.target = String(item?.target || item?.answer || "").trim();
        else if (type === "ordering") base.items = (Array.isArray(item?.items) ? item.items : Array.isArray(item?.answers) ? item.answers : []).map(x => String(x || "").trim()).filter(Boolean);
        return base;
    }).filter(q => {
        if (!q.text) return false;
        if (q.type === "hangman") return q.target.length >= 2 && [...q.target].some(hangmanGuessable);
        if (q.type === "ordering") return q.items.length >= 2;
        return q.answers?.length >= 2 && Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < q.answers.length;
    });
}
function normalizeazaQuiz(q) {
    const game_mode = QUIZ_MODES[q?.game_mode] ? q.game_mode : "castle_choice";
    const questions = normalizeazaIntrebariQuiz(q?.questions, game_mode);
    if (questions.length && quizHasAdventure({ game_mode })) questions[questions.length - 1].boss = true;
    return { ...q, game_mode, world_theme: normalizeQuizWorld(q?.world_theme), difficulty: q?.difficulty || "medium", lives: quizLivesForMode({ game_mode }), questions };
}
async function incarcaQuizuri() { const lista = document.getElementById("quizInteractiveLista"); if (!lista) return; lista.innerHTML = '<p class="quiz-empty">Se încarcă quiz-urile...</p>'; try { const { data, error } = await incarcaQuizuriCuNivel(columns => supabaseClient.from("quizzes").select(columns).eq("published", true).order("created_at", { ascending: false })); if (error) throw error; quizuriPublice = (data || []).map(normalizeazaQuiz).filter(q => q.questions.length); randareListaQuizuri(); } catch (e) { console.error(e); lista.innerHTML = '<p class="quiz-empty quiz-error">Quiz-urile nu au putut fi încărcate.</p>'; } }
function randareListaQuizuri() {
    const lista = document.getElementById("quizInteractiveLista");
    if (!lista) return;
    if (!quizuriPublice.length) {
        lista.innerHTML = '<div class="quiz-empty-state"><span>🏰</span><h3>Aventurile așteaptă primul quiz</h3><p>Administratorul nu a publicat încă un quiz.</p></div>';
        return;
    }
    const diff = { easy: "Ușor", medium: "Mediu", hard: "Greu" };
    const groups = new Map();
    quizuriPublice.forEach(q => {
        const meta = modeMeta(q);
        if (!groups.has(meta.type)) groups.set(meta.type, { meta, quizzes: [] });
        groups.get(meta.type).quizzes.push(q);
    });
    const order = ["multiple_choice", "true_false", "hangman", "ordering"];
    lista.innerHTML = order.filter(type => groups.has(type)).map(type => {
        const { meta, quizzes } = groups.get(type);
        const cards = quizzes.map((q, i) => {
            const m = modeMeta(q), adventure = quizHasAdventure(q), grade = q.grade === "general" ? "General" : `Clasa a ${q.grade}-a`;
            const world = adventure ? `<span class="quiz-world-badge">${almaIcon(quizWorldMeta(q.world_theme).icon)}${quizWorldMeta(q.world_theme).label}</span>` : "";
            const lifeLabel = m.type === "hangman" ? "6 vieți pentru fiecare cuvânt" : "3 vieți";
            return `<article class="interactive-quiz-card castle-quiz-card" style="--quiz-delay:${Math.min(i * 70, 420)}ms"><div class="interactive-quiz-icon">${m.icon}</div><div class="interactive-quiz-copy"><div class="interactive-quiz-meta"><span>${escapeQuizHtml(grade)}</span><span>${m.label}</span>${world}<span>${q.questions.length} provocări</span><span>❤️ ${lifeLabel}</span><span>${diff[q.difficulty] || "Mediu"}</span></div><h3>${escapeQuizHtml(q.title)}</h3><p>${escapeQuizHtml(q.description || (adventure ? "Explorează nivelul și treci de toate provocările." : "Exersează în ritmul jocului ales."))}</p></div><button type="button" class="quiz-start-btn" data-quiz-id="${escapeQuizHtml(q.id)}">${adventure ? "🎬 Începe aventura" : "▶ Începe jocul"}</button></article>`;
        }).join("");
        return `<details class="alma-category quiz-type-menu"><summary><span class="alma-icon" aria-hidden="true">${meta.icon}</span><span><strong>${meta.label}</strong><small>${quizzes.length} ${quizzes.length === 1 ? 'quiz disponibil' : 'quiz-uri disponibile'}</small></span><span class="alma-chevron" aria-hidden="true">+</span></summary><div class="quiz-type-list">${cards}</div></details>`;
    }).join("");
    lista.querySelectorAll("[data-quiz-id]").forEach(b => b.addEventListener("click", () => pornesteQuiz(b.dataset.quizId)));
}
function seteazaAccesQuiz(esteAutentificat) {
    // Browsing games is direct; starting an adventure still requires a session.
    document.getElementById("pagina-quiz")?.classList.remove("ascuns");
    document.getElementById("quizNavLink")?.classList.remove("ascuns");
    if (!esteAutentificat && quizActiv) inchideQuizPlayer();
}
async function pornesteQuiz(id) { const { data } = await supabaseClient.auth.getSession(); if (!data?.session) { afiseazaLogin(); return; } const q = quizuriPublice.find(x => String(x.id) === String(id)); if (q) pornesteQuizCuDate(q, false); }
async function pornesteQuizCuDate(raw, preview = false) {
    const launchVersion = ++quizLaunchVersion;
    const { data } = await supabaseClient.auth.getSession();
    if (launchVersion !== quizLaunchVersion) return;
    if (!data?.session) { inchideContainerQuizPreview(); afiseazaLogin(); return; }
    const q = normalizeazaQuiz(raw);
    if (!q.questions.length) return;
    const adventure = quizHasAdventure(q);
    opresteTimerQuiz();
    if (!adventure) window.CastleQuiz3D?.dispose?.();
    CastleQuizAudio?.ensure?.(); CastleQuizAudio?.ambience?.(quizSoundEnabled && adventure);
    quizActiv = q; quizEstePreview = preview; quizIndexIntrebare = 0; quizScor = 0;
    quizVieti = quizLivesForMode(q); quizCorecte = 0; quizRaspunsBlocat = true; hangmanState = null;
    resetTraseuQuiz(); leagaTraseuQuiz();
    document.getElementById("quizInteractiveLista")?.classList.add("ascuns");
    const player = document.getElementById("quizPlayer");
    if (player) {
        player.classList.remove("ascuns"); player.classList.toggle("quiz-standalone", !adventure);
        player.dataset.world = q.world_theme; player.dataset.gameMode = q.game_mode;
    }
    const scene = document.getElementById("castleScene");
    if (scene) { scene.hidden = !adventure; scene.setAttribute("aria-label", "Hartă 3D a aventurii — " + quizWorldMeta(q.world_theme).label); }
    const worldLabel = document.getElementById("quizWorldLabel");
    if (worldLabel) { worldLabel.hidden = !adventure; worldLabel.textContent = adventure ? quizWorldMeta(q.world_theme).label : ""; }
    document.getElementById("castleDialogue")?.classList.add("ascuns");
    document.getElementById("castleSkipAnimation")?.classList.add("ascuns");
    document.getElementById("quizRezultat")?.classList.add("ascuns");
    const stage = document.getElementById("quizQuestionStage");
    if (stage) { stage.hidden = false; stage.classList.remove("ascuns"); stage.onkeydown = null; stage.replaceChildren(); }
    const title = document.getElementById("quizPlayerTitle");
    if (title) title.textContent = (preview ? "PREVIEW · " : "") + q.title;
    const label = document.getElementById("quizModeLabel");
    if (label) label.textContent = modeMeta(q).icon + " " + modeMeta(q).label;
    actualizeazaHudQuiz();
    window.QuizViewport?.enter?.(player);
    const canvas = document.getElementById("castleCanvas");
    if (adventure && window.CastleQuiz3D && canvas) await CastleQuiz3D.init(canvas, q.world_theme, { questions: q.questions });
    if (quizActiv !== q || quizLaunchVersion !== launchVersion) return;
    if (adventure) await afiseazaDialogCastel("world", "Urmează traseul din " + quizWorldMeta(q.world_theme).label + ". La fiecare oprire te așteaptă un adversar și o provocare. Ai 3 vieți.", 1700);
    if (quizActiv !== q || quizLaunchVersion !== launchVersion) return;
    await randareIntrebareQuiz();
}
function resetTraseuQuiz() {
    if (quizRoutePausedTimer) {
        const stage = document.getElementById("quizQuestionStage");
        if (stage) stage.hidden = quizRoutePausedTimer.hidden;
    }
    quizRouteState = null; quizRouteToggleBusy = false; quizRoutePausedTimer = null; quizRouteAdvance = null;
    const hud = document.getElementById("quizRouteHud"), toggle = document.getElementById("quizMapToggle");
    if (hud) hud.hidden = true;
    if (toggle) { toggle.disabled = true; toggle.textContent = "Vezi harta"; toggle.setAttribute("aria-pressed", "false"); }
    document.getElementById("quizRouteStops")?.replaceChildren();
}

function randareTraseuQuiz(detail) {
    const hud = document.getElementById("quizRouteHud"), stops = document.getElementById("quizRouteStops"), status = document.getElementById("quizRouteStatus"), toggle = document.getElementById("quizMapToggle");
    if (!hud || !stops || !status || !toggle) return;
    if (!quizActiv || !quizHasAdventure() || !detail || detail.phase === "unavailable") { resetTraseuQuiz(); return; }
    const total = quizActiv.questions.length;
    if (!total) { resetTraseuQuiz(); return; }
    const index = Math.max(0, Math.min(total - 1, Math.floor(Number(detail.index) || 0)));
    const completed = new Set((Array.isArray(detail.completed) ? detail.completed : []).map(Number).filter(value => Number.isInteger(value) && value >= 0 && value < total));
    const overview = Boolean(detail.overview || detail.phase === "overview");
    quizRouteState = { ...detail, index, total, overview, completed: [...completed] };
    hud.hidden = false;
    const captions = {
        travelling: `Pe drum spre întâlnirea ${index + 1} din ${total}`,
        encounter: `Întâlnirea ${index + 1} din ${total}`,
        combat: "Confruntare în desfășurare",
        resolved: `${completed.size} din ${total} întâlniri parcurse`,
        overview: `Harta traseului · ${completed.size} din ${total} întâlniri parcurse`,
        finished: "Traseu încheiat"
    };
    status.textContent = captions[detail.phase] || `Întâlnirea ${index + 1} din ${total}`;
    toggle.textContent = overview ? "Revino la confruntare" : "Vezi harta";
    toggle.setAttribute("aria-pressed", String(overview));
    const questionReady = !quizRaspunsBlocat || Boolean(quizRoutePausedTimer) || Boolean(document.getElementById("quizNextButton"));
    toggle.disabled = quizRouteToggleBusy || !questionReady || !["encounter", "resolved", "overview"].includes(detail.phase);
    const nodes = quizActiv.questions.map((question, position) => {
        const boss = Boolean(question.boss || position === total - 1);
        const type = boss ? "dragon" : Object.prototype.hasOwnProperty.call(QUIZ_MONSTERS, question.monster) ? question.monster : "goblin";
        const name = QUIZ_MONSTERS[type].name;
        const current = position === index && detail.phase !== "finished";
        const passed = completed.has(position) && detail.outcomes?.[position] === "passed";
        const node = document.createElement("li");
        node.className = `quiz-route-stop${current ? " is-current" : ""}${completed.has(position) ? passed ? " is-passed" : " is-complete" : " is-future"}${boss ? " is-boss" : ""}`;
        node.dataset.routeIndex = String(position);
        if (current) node.setAttribute("aria-current", "step");
        const state = completed.has(position) ? passed ? "parcursă" : "câștigată" : current ? "întâlnirea curentă" : "urmează";
        node.setAttribute("aria-label", `${position + 1}. ${name}${boss ? ", adversarul final" : ""}, ${state}`);
        const marker = document.createElement("span"); marker.className = "quiz-route-marker"; marker.textContent = completed.has(position) && !passed ? "✓" : String(position + 1); marker.setAttribute("aria-hidden", "true");
        const label = document.createElement("span"); label.className = "quiz-route-name"; label.textContent = boss ? "Dragonul final" : name; label.setAttribute("aria-hidden", "true");
        node.append(marker, label); return node;
    });
    stops.replaceChildren(...nodes);
    const current = stops.querySelector('[aria-current="step"]');
    if (current) stops.scrollLeft = Math.max(0, current.offsetLeft - stops.clientWidth / 2 + current.offsetWidth / 2);
}

function leagaTraseuQuiz() {
    const canvas = document.getElementById("castleCanvas"), toggle = document.getElementById("quizMapToggle");
    if (canvas && !canvas.dataset.quizRouteBound) {
        canvas.addEventListener("castle-route", event => {
            if (["travelling", "combat", "finished", "unavailable"].includes(event.detail?.phase) && quizRoutePausedTimer) {
                const lease = quizRoutePausedTimer;
                const stage = document.getElementById("quizQuestionStage");
                if (stage) stage.hidden = lease.hidden;
                quizRoutePausedTimer = null;
                if (event.detail.phase === "unavailable" && lease.quiz === quizActiv && lease.index === quizIndexIntrebare) {
                    quizRaspunsBlocat = lease.locked;
                    if (lease.seconds !== null && !lease.locked) pornesteTimerQuiz(lease.seconds, true);
                }
            }
            randareTraseuQuiz(event.detail);
        });
        canvas.dataset.quizRouteBound = "true";
    }
    if (toggle && !toggle.dataset.quizRouteBound) {
        toggle.addEventListener("click", async () => {
            if (toggle.disabled || quizRouteToggleBusy || !quizActiv || !window.CastleQuiz3D?.showMap) return;
            const activeQuiz = quizActiv, wasOverview = Boolean(quizRouteState?.overview);
            quizRouteToggleBusy = true; toggle.disabled = true;
            if (!wasOverview) {
                const stage = document.getElementById("quizQuestionStage");
                quizRoutePausedTimer = { quiz: activeQuiz, index: quizIndexIntrebare, seconds: quizTimerId ? quizTimpRamas : null, locked: quizRaspunsBlocat, hidden: Boolean(stage?.hidden) };
                opresteTimerQuiz(); quizRaspunsBlocat = true;
                if (stage) stage.hidden = true;
            }
            let result;
            try { result = await CastleQuiz3D.showMap(); }
            catch (error) { console.warn("Harta traseului nu a putut fi afișată.", error); }
            finally {
                if (quizActiv === activeQuiz) {
                    quizRouteToggleBusy = false;
                    const lease = quizRoutePausedTimer;
                    const overview = typeof result === "boolean" ? result : Boolean(quizRouteState?.overview);
                    if (!overview && lease?.quiz === activeQuiz && lease.index === quizIndexIntrebare) {
                        quizRoutePausedTimer = null; quizRaspunsBlocat = lease.locked;
                        const stage = document.getElementById("quizQuestionStage");
                        if (stage) stage.hidden = lease.hidden;
                        if (lease.seconds !== null && !lease.locked) pornesteTimerQuiz(lease.seconds, true);
                    }
                    if (quizRouteState) randareTraseuQuiz(quizRouteState);
                }
            }
        });
        toggle.dataset.quizRouteBound = "true";
    }
}

function actualizeazaHudQuiz() { const lives = document.getElementById("quizLives"); if (lives) { lives.textContent = `${"❤️ ".repeat(Math.max(0, quizVieti))}${"🖤 ".repeat(Math.max(0, quizLivesForMode() - quizVieti))}`.trim(); lives.setAttribute("aria-label", `${quizVieti} vieți rămase`); } const score = document.getElementById("quizLiveScore"); if (score) score.textContent = `Scor: ${quizScor}`; if (quizActiv) { const counter = document.getElementById("quizCounter"); if (counter) counter.textContent = `Provocarea ${Math.min(quizIndexIntrebare + 1, quizActiv.questions.length)} / ${quizActiv.questions.length}`; const bar = document.getElementById("quizProgressBar"); if (bar) bar.style.width = `${(quizIndexIntrebare / quizActiv.questions.length) * 100}%`; } }
async function afiseazaDialogCastel(icon, text, duration = 0) {
    const box = document.getElementById("castleDialogue");
    if (!box) return;
    const activeQuiz = quizActiv, dialogueVersion = ++quizDialogueVersion;
    box.innerHTML = `<span class="castle-dialogue-icon">${icon === "world" ? almaIcon(quizWorldMeta(quizActiv?.world_theme).icon) : escapeQuizHtml(icon)}</span><p>${escapeQuizHtml(text)}</p>`;
    box.classList.remove("ascuns");
    if (duration > 0) {
        await new Promise(resolve => setTimeout(resolve, duration));
        if (quizActiv === activeQuiz && dialogueVersion === quizDialogueVersion) box.classList.add("ascuns");
    }
}
async function randareIntrebareQuiz() {
    if (!quizActiv || quizVieti <= 0) return;
    const activeQuiz = quizActiv, index = quizIndexIntrebare, launchVersion = quizLaunchVersion;
    const current = () => quizActiv === activeQuiz && quizIndexIntrebare === index && quizLaunchVersion === launchVersion;
    const q = activeQuiz.questions[index];
    if (!q) return finalizeazaQuiz(true);
    quizRaspunsBlocat = true; actualizeazaHudQuiz();
    const stage = document.getElementById("quizQuestionStage"), info = QUIZ_MONSTERS[q.monster] || QUIZ_MONSTERS.goblin;
    if (stage) stage.onkeydown = null;
    if (!quizHasAdventure(activeQuiz)) {
        randareProvocare(q, false, info); quizRaspunsBlocat = false;
        pornesteTimerQuiz(Number(activeQuiz.seconds_per_question) || 30); return;
    }
    const boss = index === activeQuiz.questions.length - 1 || q.boss;
    const room = window.CastleQuiz3D?.getRoomName?.(index, boss) || quizWorldRoom(activeQuiz.world_theme, index, boss).name;
    if (stage) stage.innerHTML = `<div class="castle-transition-card cinematic-travel"><strong>🎬 ${escapeQuizHtml(room)}</strong><span>Personajul urmează traseul spre următorul adversar...</span><div class="cinematic-dots"><i></i><i></i><i></i></div></div>`;
    const skip = document.getElementById("castleSkipAnimation");
    skip?.classList.remove("ascuns");
    if (window.CastleQuiz3D) await CastleQuiz3D.encounter(boss ? "dragon" : q.monster, boss, index);
    if (!current()) return;
    skip?.classList.add("ascuns"); CastleQuizAudio?.monster?.(boss);
    await afiseazaDialogCastel(boss ? "🐉" : info.icon, boss ? "Ai ajuns la adversarul final! Treci de ultima provocare ca să închei aventura." : `${info.name}: „Dovedește că meriți să treci!”`, 1500);
    if (!current()) return;
    randareProvocare(q, boss, info); quizRaspunsBlocat = false;
    pornesteTimerQuiz(Number(activeQuiz.seconds_per_question) || 30);
    if (quizRouteState) randareTraseuQuiz(quizRouteState);
}
function shellCard(q, boss, info, body) {
    const meta = modeMeta();
    const heading = quizHasAdventure() ? `<div class="castle-monster-title"><span>${boss ? "🐉" : info.icon}</span><div><small>${boss ? "BOSS FINAL" : escapeQuizHtml(info.name)}</small><strong>${meta.icon} ${meta.label}</strong></div></div>` : `<div class="quiz-simple-title">${meta.icon} ${meta.label}</div>`;
    return `<div class="quiz-question-card castle-question-card quiz-enter">${heading}<h3>${escapeQuizHtml(q.text)}</h3>${body}<div id="quizFeedback" class="quiz-feedback" aria-live="polite"></div></div>`;
}
function randareProvocare(q, boss, info) {
    const stage = document.getElementById("quizQuestionStage"); if (!stage) return; if (q.type === "multiple_choice" || q.type === "true_false") { const letters = ["A", "B", "C", "D"]; stage.innerHTML = shellCard(q, boss, info, `<div class="quiz-answer-grid">${q.answers.map((a, i) => `<button type="button" class="quiz-answer-btn" data-answer-index="${i}"><span>${q.type === "true_false" ? (i === 0 ? "✓" : "✕") : letters[i]}</span><strong>${escapeQuizHtml(a)}</strong></button>`).join("")}</div>`); stage.querySelectorAll("[data-answer-index]").forEach(b => b.addEventListener("click", () => raspundeQuiz(Number(b.dataset.answerIndex)))); }
    else if (q.type === "hangman") { quizVieti = 6; actualizeazaHudQuiz(); hangmanState = { guessed: new Set(), target: q.target, misses: 0, maxMistakes: 6, result: "playing", pending: false, lastGuess: null }; renderHangman(q, boss, info); }
    else renderOrdering(q, boss, info);
}
function hangmanGuessable(character) { return /^[A-Z]$/.test(stripDiacritics(character)); }
function hangmanMask(target, guessed) { return [...String(target).normalize("NFC")].map(ch => !hangmanGuessable(ch) || guessed.has(stripDiacritics(ch)) ? ch : "_").join(" "); }
function hangmanSolved(target, guessed) { return [...String(target).normalize("NFC")].every(ch => !hangmanGuessable(ch) || guessed.has(stripDiacritics(ch))); }
function renderHangman(q, boss, info) {
    const stage = document.getElementById("quizQuestionStage"), state = hangmanState;
    if (!stage || !state) return;
    const redraw = Boolean(state.rendered);
    const focusWasInside = stage.contains(document.activeElement);
    const focusedLetter = document.activeElement?.dataset?.letter || state.focusLetter;
    if (focusWasInside && focusedLetter) state.focusLetter = focusedLetter;
    const locked = state.pending || state.result !== "playing";
    const alphabet = "AĂÂBCDEFGHIÎJKLMNOPQRSȘTȚUVWXYZ";
    const markup = window.CastleQuizHangmanView?.render({
        target: q.target, guessed: state.guessed, misses: state.misses,
        maxMistakes: state.maxMistakes, remaining: quizVieti, locked,
        result: state.result, lastGuess: state.lastGuess, timedOut: state.timedOut
    }) || `<div class="hangman-play" tabindex="-1"><div class="hangman-word" aria-label="Cuvânt de ghicit">${escapeQuizHtml(hangmanMask(q.target, state.guessed))}</div><div class="hangman-keyboard">${[...alphabet].map(l => `<button type="button" data-letter="${l}" ${locked || state.guessed.has(stripDiacritics(l)) ? "disabled" : ""}>${l}</button>`).join("")}</div><p class="hangman-note">O literă greșită costă o viață.</p></div>`;
    stage.innerHTML = shellCard(q, boss, info, markup);
    if (redraw) stage.querySelector(".quiz-enter")?.classList.remove("quiz-enter");
    state.rendered = true;
    stage.querySelectorAll("[data-letter]").forEach(button => button.addEventListener("click", () => ghicesteLitera(button.dataset.letter, q, boss, info)));
    stage.onkeydown = event => {
        if (event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
        if (!event.target.closest?.(".hangman-play") || event.target.closest("input,textarea,select,[contenteditable=true]")) return;
        if ([...String(event.key).normalize("NFC")].length !== 1 || !hangmanGuessable(event.key)) return;
        event.preventDefault(); ghicesteLitera(event.key, q, boss, info);
    };
    if (focusWasInside) {
        const next = [...stage.querySelectorAll("[data-letter]:not(:disabled)")].find(button => button.dataset.letter === focusedLetter) || stage.querySelector("[data-letter]:not(:disabled)") || stage.querySelector(".hangman-play");
        next?.focus?.({ preventScroll: true });
    }
}
async function ghicesteLitera(letter, q, boss, info) {
    const state = hangmanState, activeQuiz = quizActiv, index = quizIndexIntrebare;
    const raw = String(letter || "").normalize("NFC"), key = stripDiacritics(raw);
    if (quizRaspunsBlocat || !state || state.result !== "playing" || quizVieti <= 0 || activeQuiz?.questions?.[index] !== q) return;
    if ([...raw].length !== 1 || !hangmanGuessable(raw) || state.guessed.has(key)) return;
    const current = () => quizActiv === activeQuiz && quizIndexIntrebare === index && hangmanState === state;
    CastleQuizAudio?.click?.(); state.guessed.add(key); state.lastGuess = key;
    if (stripDiacritics(q.target).includes(key)) {
        if (!hangmanSolved(q.target, state.guessed)) { renderHangman(q, boss, info); return; }
        quizRaspunsBlocat = true; state.result = "won"; state.pending = true;
        opresteTimerQuiz(); quizScor += 100; quizCorecte++; actualizeazaHudQuiz();
        renderHangman(q, boss, info); CastleQuizAudio?.correct?.();
        if (quizHasAdventure()) await window.CastleQuiz3D?.correct?.();
        if (current()) return afiseazaFeedbackAventura(true, q, false);
        return;
    }
    const resumeTimer = Boolean(quizTimerId), remainingTime = quizTimpRamas;
    opresteTimerQuiz(); quizRaspunsBlocat = true; state.pending = true;
    state.misses++; quizVieti--; if (quizVieti <= 0) state.result = "lost";
    actualizeazaHudQuiz(); renderHangman(q, boss, info); CastleQuizAudio?.wrong?.();
    document.getElementById("quizLives")?.classList.add("castle-life-hit");
    setTimeout(() => { if (current()) document.getElementById("quizLives")?.classList.remove("castle-life-hit"); }, 600);
    if (quizHasAdventure()) await window.CastleQuiz3D?.wrong?.({ fatal: quizVieti <= 0 });
    if (!current()) return;
    if (quizVieti <= 0) return finalizeazaQuiz(false, true);
    if (quizHasAdventure()) await afiseazaDialogCastel(info.icon, q.wrongMessage || "Ai pierdut o viață, dar poți continua să ghicești.", 900);
    if (!current()) return;
    state.pending = false; state.lastGuess = null; quizRaspunsBlocat = false; renderHangman(q, boss, info);
    if (resumeTimer) pornesteTimerQuiz(remainingTime, true);
    if (quizRouteState) randareTraseuQuiz(quizRouteState);
}
function renderOrdering(q, boss, info) {
    const stage = document.getElementById("quizQuestionStage"); if (!stage) return;
    const activeQuiz = quizActiv, index = quizIndexIntrebare;
    const editable = () => !quizRaspunsBlocat && quizActiv === activeQuiz && quizIndexIntrebare === index;
    const shuffled = shuffle(q.items).map((text, i) => ({ id: i + "-" + Math.random(), text }));
    stage.innerHTML = shellCard(q, boss, info, `<div class="ordering-game"><div id="orderingPool" class="ordering-pool" aria-label="Cuvinte disponibile">${shuffled.map(x => `<button type="button" class="ordering-chip" data-order-id="${escapeQuizHtml(x.id)}" data-text="${escapeQuizHtml(x.text)}">${escapeQuizHtml(x.text)}</button>`).join("")}</div><div id="orderingAnswer" class="ordering-answer" aria-label="Ordinea aleasă"><span>Atinge cuvintele în ordinea corectă</span></div><div class="ordering-actions"><button type="button" id="orderingReset" class="secondary">↺ Resetează</button><button type="button" id="orderingSubmit">✓ Verifică ordinea</button></div></div>`);
    const pool = stage.querySelector("#orderingPool"), answer = stage.querySelector("#orderingAnswer");
    stage.querySelectorAll(".ordering-chip").forEach(button => button.addEventListener("click", () => {
        if (!editable()) return;
        CastleQuizAudio?.click?.();
        const destination = button.parentElement === pool ? answer : pool;
        if (destination === answer) answer.querySelector("span")?.remove();
        destination.appendChild(button);
    }));
    stage.querySelector("#orderingReset")?.addEventListener("click", () => {
        if (!editable()) return;
        answer.querySelectorAll(".ordering-chip").forEach(button => pool.appendChild(button));
        answer.innerHTML = '<span>Atinge cuvintele în ordinea corectă</span>';
    });
    stage.querySelector("#orderingSubmit")?.addEventListener("click", () => verificaOrdine(q));
}
async function verificaOrdine(q) { if (quizRaspunsBlocat) return; const chosen = [...document.querySelectorAll("#orderingAnswer .ordering-chip")].map(b => b.dataset.text); if (chosen.length !== q.items.length) { const f = document.getElementById("quizFeedback"); if (f) f.innerHTML = '<div class="quiz-feedback-box gresit"><strong>Așază toate elementele înainte să verifici.</strong></div>'; return; } const ok = chosen.every((x, i) => x === q.items[i]); await raspundeRezultatGeneric(ok, q, false); }
function pornesteTimerQuiz(seconds, resume = false) { opresteTimerQuiz(); quizTimpRamas = resume ? Math.max(0, Math.floor(Number(seconds) || 0)) : Math.max(10, Math.min(120, Number(seconds) || 30)); actualizeazaTimerQuiz(); if (quizTimpRamas <= 0) { expiraProvocare(); return; } quizTimerId = setInterval(() => { quizTimpRamas--; actualizeazaTimerQuiz(); if (quizTimpRamas <= 5 && quizTimpRamas > 0) CastleQuizAudio?.tick?.(); if (quizTimpRamas <= 0) { opresteTimerQuiz(); expiraProvocare(); } }, 1000); }
function actualizeazaTimerQuiz() { const t = document.getElementById("quizTimer"); if (!t) return; t.textContent = `${quizTimpRamas}s`; t.classList.toggle("quiz-timer-warning", quizTimpRamas <= 5); }
function opresteTimerQuiz() { if (quizTimerId) clearInterval(quizTimerId); quizTimerId = null; }
async function expiraProvocare() { if (quizRaspunsBlocat || !quizActiv) return; const q = quizActiv.questions[quizIndexIntrebare]; if (q.type === "hangman") return raspundeRezultatGeneric(false, q, true, true); if (q.type === "ordering") return raspundeRezultatGeneric(false, q, true); return raspundeQuiz(-1, true); }
async function raspundeQuiz(index, expirat = false) { if (quizRaspunsBlocat || !quizActiv) return; quizRaspunsBlocat = true; opresteTimerQuiz(); const q = quizActiv.questions[quizIndexIntrebare], ok = index === q.correctIndex; document.querySelectorAll("#quizQuestionStage .quiz-answer-btn").forEach((b, i) => { b.disabled = true; if (i === q.correctIndex) b.classList.add("corect"); if (i === index && !ok) b.classList.add("gresit"); }); await raspundeRezultatGeneric(ok, q, expirat); }
async function raspundeRezultatGeneric(ok, q, expirat = false, hangmanTimeout = false) {
    const activeQuiz = quizActiv, index = quizIndexIntrebare;
    const current = () => quizActiv === activeQuiz && quizIndexIntrebare === index;
    quizRaspunsBlocat = true; opresteTimerQuiz();
    document.querySelectorAll("#quizQuestionStage .ordering-game button").forEach(button => { button.disabled = true; });
    if (ok) {
        quizScor += 100; quizCorecte++; actualizeazaHudQuiz(); CastleQuizAudio?.correct?.();
        if (quizHasAdventure()) await window.CastleQuiz3D?.correct?.();
        if (current()) return afiseazaFeedbackAventura(true, q, expirat);
        return;
    }
    quizVieti--; actualizeazaHudQuiz();
    if (hangmanTimeout && hangmanState) {
        hangmanState.result = "lost"; hangmanState.pending = true; hangmanState.timedOut = true;
        renderHangman(q, q.boss, QUIZ_MONSTERS[q.monster] || QUIZ_MONSTERS.goblin);
    }
    CastleQuizAudio?.wrong?.(); document.getElementById("quizLives")?.classList.add("castle-life-hit");
    setTimeout(() => { if (current()) document.getElementById("quizLives")?.classList.remove("castle-life-hit"); }, 600);
    if (quizHasAdventure()) await window.CastleQuiz3D?.wrong?.({ fatal: quizVieti <= 0 });
    if (!current()) return;
    if (quizVieti <= 0) {
        if (current()) return finalizeazaQuiz(false, true);
        return;
    }
    if (quizHasAdventure()) await afiseazaDialogCastel("👹", q.wrongMessage || "De data aceasta te iert. Te las să treci mai departe.", 1200);
    if (current()) return afiseazaFeedbackAventura(false, q, expirat);
}
function quizExpectedAnswer(q) { if (q.type === "ordering") return q.items.join(" → "); if (q.type === "hangman") return q.target; if ((q.type === "multiple_choice" || q.type === "true_false") && q.answers?.length) return q.answers[q.correctIndex] || ""; return ""; }
async function explicaQuizCuAI(q) {
    const { data } = await supabaseClient.auth.getSession();
    if (!data?.session) { afiseazaLogin(); return; }
    openAiAssistant();
    const grade = document.getElementById("aiAssistantGrade");
    if (grade && ["5", "6", "7", "8"].includes(String(quizActiv?.grade))) grade.value = String(quizActiv.grade);
    const source = document.getElementById("aiStudyText");
    if (source) source.value = `Cerință: ${q.text}\nRăspunsul corect din quiz: ${quizExpectedAnswer(q)}\nExplicația profesorului: ${q.explanation || "Nu este disponibilă."}`;
    const input = document.getElementById("aiAssistantInput");
    if (input) input.value = "Ajută-mă să înțeleg răspunsul corect din acest quiz, pe baza explicației profesorului.";
    const status = document.getElementById("aiAssistantStatus");
    if (status) status.textContent = 'Verifică clasa și apasă „Trimite”. Profesorul AI răspunde online.';
}

function afiseazaFeedbackAventura(ok, q, expirat) { const f = document.getElementById("quizFeedback"); if (!f) return; let answerHint = ""; if (!ok && q.type === "ordering") answerHint = `<p><b>Ordinea corectă:</b> ${escapeQuizHtml(q.items.join(" → "))}</p>`; if (!ok && q.type === "hangman") answerHint = `<p><b>Răspuns:</b> ${escapeQuizHtml(q.target)}</p>`; if (!ok && (q.type === "multiple_choice" || q.type === "true_false")) answerHint = `<p><b>Răspuns corect:</b> ${escapeQuizHtml(quizExpectedAnswer(q))}</p>`; const title = ok ? (quizHasAdventure() ? q.correctMessage || "Corect! Poți trece." : "Corect!") : (expirat ? "Timpul a expirat — pierzi o viață." : "Greșit — pierzi o viață."); f.innerHTML = `<div class="quiz-feedback-box ${ok ? "corect" : "gresit"}"><strong>${escapeQuizHtml(title)}</strong>${answerHint}${q.explanation ? `<p>${escapeQuizHtml(q.explanation)}</p>` : ""}${!ok ? `<button type="button" id="quizAiExplainButton" class="quiz-ai-explain">💡 Explică-mi cu AI</button><div id="quizAiExplanation" class="quiz-ai-explanation ascuns"></div>` : ""}<button type="button" id="quizNextButton">${quizIndexIntrebare + 1 < quizActiv.questions.length ? quizHasAdventure() ? "Continuă traseul" : q.type === "hangman" ? "Următorul cuvânt" : "Următoarea provocare" : "🏆 Vezi rezultatul"}</button></div>`; document.getElementById("quizAiExplainButton")?.addEventListener("click", () => { document.getElementById("quizAiExplanation")?.classList.remove("ascuns"); explicaQuizCuAI(q); }); document.getElementById("quizNextButton")?.addEventListener("click", urmatoareaIntrebareQuiz); if (quizRouteState) randareTraseuQuiz(quizRouteState); }
async function urmatoareaIntrebareQuiz() {
    if (!quizActiv || quizRouteAdvance) return;
    const transition = { quiz: quizActiv, index: quizIndexIntrebare, launch: quizLaunchVersion };
    quizRouteAdvance = transition; quizRaspunsBlocat = true;
    const button = document.getElementById("quizNextButton"); if (button) button.disabled = true;
    try {
        if (quizHasAdventure() && window.CastleQuiz3D) await CastleQuiz3D.nextRoom();
        if (quizActiv !== transition.quiz || quizIndexIntrebare !== transition.index || quizLaunchVersion !== transition.launch) return;
        quizIndexIntrebare++; hangmanState = null;
        if (quizIndexIntrebare >= quizActiv.questions.length) return await finalizeazaQuiz(true);
        return await randareIntrebareQuiz();
    } finally { if (quizRouteAdvance === transition) quizRouteAdvance = null; }
}
async function finalizeazaQuiz(victorie = true, gameOver = false) {
    opresteTimerQuiz(); if (!quizActiv) return;
    const activeQuiz = quizActiv, launchVersion = quizLaunchVersion, preview = quizEstePreview;
    quizRaspunsBlocat = true; CastleQuizAudio?.ambience?.(false);
    gameOver ? CastleQuizAudio?.gameOver?.() : CastleQuizAudio?.victory?.();
    const total = activeQuiz.questions.length, stage = document.getElementById("quizQuestionStage"), rez = document.getElementById("quizRezultat"), bar = document.getElementById("quizProgressBar");
    if (victorie && bar) bar.style.width = "100%";
    stage?.classList.toggle("ascuns", !(gameOver && modeMeta(activeQuiz).type === "hangman")); if (!rez) return;
    if (quizHasAdventure(activeQuiz)) {
        if (gameOver) await window.CastleQuiz3D?.gameOver?.(); else await window.CastleQuiz3D?.victory?.();
    }
    if (quizActiv !== activeQuiz || quizLaunchVersion !== launchVersion) return;
    const bonus = victorie ? quizVieti * 200 + 300 : 0, totalScore = quizScor + bonus;
    quizScor = totalScore; actualizeazaHudQuiz();
    if (!preview && typeof inregistreazaRezultatQuiz === "function") {
        inregistreazaRezultatQuiz({ quizId: activeQuiz.id, title: activeQuiz.title, score: totalScore, correct: quizCorecte, total, won: victorie });
    }
    rez.innerHTML = `<div class="quiz-result-card quiz-result-pop castle-result ${gameOver ? "game-over" : "victory"}"><div class="quiz-result-medal">${gameOver ? "💀" : "🏆"}</div><p>${gameOver ? "JOC ÎNCHEIAT" : quizHasAdventure(activeQuiz) ? "TRASEU ÎNCHEIAT!" : "JOC ÎNCHEIAT!"}</p><h3>${escapeQuizHtml(activeQuiz.title)}</h3><div class="quiz-result-score">${totalScore} <small>puncte</small></div><div class="castle-result-stats"><span>✅ ${quizCorecte} / ${total} provocări câștigate</span><span>❤️ ${quizVieti} vieți rămase</span>${victorie ? `<span>🎁 +${bonus} bonus final</span>` : ""}</div><div class="quiz-result-actions"><button type="button" id="quizRetryButton">↻ Încearcă din nou</button><button type="button" id="quizBackButton" class="secondary">← Înapoi la jocuri</button></div></div>`;
    rez.classList.remove("ascuns");
    document.getElementById("quizRetryButton")?.addEventListener("click", () => pornesteQuizCuDate(activeQuiz, preview));
    document.getElementById("quizBackButton")?.addEventListener("click", inchideQuizPlayer);
}
function inchideQuizPlayer() { quizLaunchVersion++; window.QuizViewport?.leave?.(); opresteTimerQuiz(); CastleQuizAudio?.dispose?.(); window.CastleQuiz3D?.dispose?.(); quizActiv = null; hangmanState = null; quizRaspunsBlocat = true; resetTraseuQuiz(); const stage = document.getElementById("quizQuestionStage"); if (stage) stage.onkeydown = null; document.getElementById("quizPlayer")?.classList.add("ascuns"); document.getElementById("quizInteractiveLista")?.classList.remove("ascuns"); stage?.classList.remove("ascuns"); document.getElementById("quizRezultat")?.classList.add("ascuns"); inchideContainerQuizPreview(); }
function initializeazaQuizPlayer() {
    leagaTraseuQuiz();
    const bind = (id, handler) => {
        const button = document.getElementById(id);
        if (!button || button.dataset.quizPlayerBound) return;
        button.addEventListener("click", handler); button.dataset.quizPlayerBound = "true";
    };
    bind("quizCloseButton", inchideQuizPlayer);
    bind("castleSkipAnimation", () => window.CastleQuiz3D?.skip?.());
    bind("quizSoundToggle", event => {
        quizSoundEnabled = !quizSoundEnabled; CastleQuizAudio?.setEnabled?.(quizSoundEnabled);
        CastleQuizAudio?.ambience?.(quizSoundEnabled && Boolean(quizActiv) && quizHasAdventure());
        event.currentTarget.textContent = quizSoundEnabled ? "🔊 Sunet" : "🔇 Sunet";
        event.currentTarget.setAttribute("aria-pressed", String(quizSoundEnabled));
    });
}
