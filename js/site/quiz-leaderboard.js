// Shared scores are read and changed through authenticated Supabase functions.
(function () {
    let userId = null, role = null, revision = 0, request = 0;
    let rows = [], phase = "signed-out", resetting = false, adminMessage = "";
    const submissions = new Map();
    const sections = () => [...document.querySelectorAll("[data-quiz-leaderboard]")];
    const node = (tag, className, text) => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    };
    const nonnegative = value => Math.max(0, Number(value) || 0);
    const pointsLabel = value => `${value} ${value === 1 ? "punct" : "puncte"}`;

    function render() {
        sections().forEach(section => {
            const admin = section.hasAttribute("data-quiz-leaderboard-admin");
            section.hidden = admin && role !== "admin";
            section.querySelectorAll("[data-leaderboard-refresh]").forEach(button => {
                button.disabled = !userId || phase === "loading" || resetting;
                if (button.dataset.bound !== "1") {
                    button.dataset.bound = "1";
                    button.addEventListener("click", refresh);
                }
            });
            section.querySelectorAll("[data-leaderboard-reset]").forEach(button => {
                button.hidden = role !== "admin";
                button.disabled = role !== "admin" || resetting || phase === "loading";
                button.textContent = resetting ? "Se golește..." : "Golește clasamentul";
                if (button.dataset.bound !== "1") {
                    button.dataset.bound = "1";
                    button.addEventListener("click", reset);
                }
            });
            const status = section.querySelector("[data-leaderboard-admin-status]");
            if (status) status.textContent = adminMessage;
            const content = section.querySelector("[data-leaderboard-content]");
            if (!content) return;
            content.setAttribute("aria-busy", String(phase === "loading" || resetting));
            content.replaceChildren();
            if (phase !== "ready" || !rows.length) {
                const copy = phase === "signed-out" ? "Conectează-te pentru a vedea clasamentul."
                    : phase === "loading" ? "Se încarcă clasamentul..."
                        : phase === "error" ? "Clasamentul nu poate fi încărcat momentan. Încearcă din nou."
                            : "Clasamentul este gol. Finalizează un joc pentru a aduna primele puncte.";
                content.append(node("p", `quiz-leaderboard-message${phase === "error" ? " quiz-leaderboard-error" : ""}`, copy));
                if (phase === "error") {
                    const retry = node("button", "", "Încearcă din nou"); retry.type = "button";
                    retry.addEventListener("click", refresh); content.append(retry);
                }
                return;
            }
            const list = node("ol", "quiz-leaderboard-list");
            list.setAttribute("aria-label", "Participanți în ordinea punctajului");
            rows.forEach((entry, index) => {
                const current = entry.user_id === userId;
                const item = node("li", `quiz-leaderboard-row${current ? " is-current" : ""}`);
                item.append(node("span", "quiz-leaderboard-rank", String(index + 1)));
                const name = node("div", "quiz-leaderboard-name", String(entry.display_name || "Elev"));
                if (current) name.append(node("small", "quiz-leaderboard-you", "Tu"));
                item.append(name);
                const points = node("div", "quiz-leaderboard-points");
                points.append(node("strong", "", pointsLabel(nonnegative(entry.points))));
                const games = nonnegative(entry.games);
                points.append(node("small", "", `${games} ${games === 1 ? "joc finalizat" : "jocuri finalizate"}`));
                item.append(points); list.append(item);
            });
            content.append(list);
        });
    }

    async function refresh() {
        if (!userId) { phase = "signed-out"; rows = []; render(); return false; }
        const ownRevision = revision, ownRequest = ++request;
        phase = "loading"; render();
        try {
            const { data, error } = await supabaseClient.rpc("get_quiz_leaderboard");
            if (error) throw error;
            if (ownRevision !== revision || ownRequest !== request) return false;
            rows = Array.isArray(data) ? data : []; phase = "ready"; render(); return true;
        } catch (error) {
            if (ownRevision !== revision || ownRequest !== request) return false;
            rows = []; phase = "error"; render(); return false;
        }
    }

    function setUser(user, nextRole) {
        const nextId = user?.id || null;
        if (nextId === userId && (nextRole || null) === role) { render(); return; }
        userId = nextId; role = nextRole || null; revision++; request++;
        rows = []; resetting = false; adminMessage = ""; submissions.clear();
        document.querySelectorAll(".quiz-leaderboard-save").forEach(element => element.remove());
        phase = userId ? "loading" : "signed-out"; render();
        if (userId) void refresh();
    }

    async function reset() {
        if (!userId || role !== "admin" || resetting || phase === "loading") return false;
        if (!window.confirm("Golești clasamentul pentru toți elevii? Punctele din clasament vor fi șterse.")) return false;
        const ownRevision = revision;
        resetting = true; request++; adminMessage = ""; render();
        try {
            const { error } = await supabaseClient.rpc("reset_quiz_leaderboard");
            if (error) throw error;
            if (ownRevision !== revision) return false;
            rows = []; phase = "ready"; adminMessage = "Clasamentul a fost golit.";
            await refresh(); return true;
        } catch (error) {
            if (ownRevision === revision) adminMessage = "Clasamentul nu a putut fi golit. Încearcă din nou.";
            return false;
        } finally {
            if (ownRevision === revision) { resetting = false; render(); }
        }
    }

    function showSaveStatus(result, state, card) {
        if (!card?.isConnected || !card.closest("#quizRezultat") || card.closest("#quizRezultat").classList.contains("ascuns")) return;
        let status = card.querySelector(".quiz-leaderboard-save");
        if (status && status.dataset.attemptId !== result.attemptId) return;
        if (!status) {
            status = node("div", "quiz-leaderboard-save"); status.dataset.attemptId = result.attemptId;
            status.setAttribute("role", "status");
            card.insertBefore(status, card.querySelector(".quiz-result-actions"));
        }
        status.replaceChildren(node("p", "", state === "pending" ? "Se salvează punctele în clasament..."
            : state === "saved" ? "Punctele au fost adăugate în clasament."
                : "Punctele nu au fost salvate în clasament. Încearcă din nou."));
        if (state === "failed") {
            const retry = node("button", "", "Reîncearcă salvarea"); retry.type = "button";
            retry.addEventListener("click", () => { void submit(result); }); status.append(retry);
        }
    }

    function submit(result) {
        if (!userId || role !== "elev" || !result?.attemptId) return Promise.resolve(false);
        const previous = submissions.get(result.attemptId);
        if (previous && previous.state !== "failed") return previous.promise;
        const ownRevision = revision;
        const resultCard = document.querySelector("#quizRezultat .quiz-result-card");
        const entry = { state: "pending", promise: null };
        submissions.set(result.attemptId, entry); showSaveStatus(result, "pending", resultCard);
        entry.promise = (async () => {
            try {
                const { error } = await supabaseClient.rpc("submit_quiz_score", {
                    p_attempt_id: result.attemptId, p_quiz_id: result.quizId,
                    p_correct: result.correct, p_total: result.total
                });
                if (error) throw error;
                if (ownRevision !== revision) return false;
                entry.state = "saved"; showSaveStatus(result, "saved", resultCard); void refresh(); return true;
            } catch (error) {
                if (ownRevision === revision) { entry.state = "failed"; showSaveStatus(result, "failed", resultCard); }
                return false;
            }
        })();
        return entry.promise;
    }

    window.QuizLeaderboard = { setUser, refresh, submit, reset };
    window.incarcaClasamentQuiz = refresh;
    render();
})();
