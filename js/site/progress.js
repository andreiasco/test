// Profilul elevului si progresul quiz-urilor.
let profilElevUser = null;
let progresElev = null;

function cheieProgresElev(user) {
    return `romana-progress-${user?.id || "anonim"}`;
}

function progresGol() {
    return {
        quizuri: [],
        materiale: [],
        totalPuncte: 0,
        quizuriCastigate: 0,
        raspunsuriCorecte: 0
    };
}

function incarcaProgresElev(user) {
    try {
        const salvat = JSON.parse(localStorage.getItem(cheieProgresElev(user)) || "null");
        return salvat && Array.isArray(salvat.quizuri) ? { ...progresGol(), ...salvat } : progresGol();
    } catch (error) {
        console.warn("Progresul local nu a putut fi citit.", error);
        return progresGol();
    }
}

async function sincronizeazaProgresSupabase(user, progresLocal) {
    if (!user || typeof supabaseClient === "undefined") return progresLocal;

    try {
        const { data, error } = await supabaseClient
            .from("user_progress")
            .select("progress_data")
            .eq("user_id", user.id)
            .maybeSingle();

        if (error) throw error;

        if (data?.progress_data && typeof data.progress_data === "object") {
            return { ...progresGol(), ...data.progress_data };
        }

        if (progresLocal.quizuri.length || progresLocal.materiale.length) {
            await salveazaProgresSupabase(user, progresLocal);
        }
    } catch (error) {
        console.warn("Progresul Supabase nu este disponibil. Se folosește copia locală.", error);
    }

    return progresLocal;
}

async function salveazaProgresSupabase(user, progres) {
    const { error } = await supabaseClient
        .from("user_progress")
        .upsert({ user_id: user.id, progress_data: progres }, { onConflict: "user_id" });

    if (error) throw error;
}

function salveazaProgresElev() {
    if (!profilElevUser || !progresElev) return;
    localStorage.setItem(cheieProgresElev(profilElevUser), JSON.stringify(progresElev));
    salveazaProgresSupabase(profilElevUser, progresElev).catch(error => {
        console.warn("Progresul nu a putut fi sincronizat în Supabase.", error);
    });
}

function escapeProfil(text) {
    return String(text ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function insigneProfil() {
    const quizuri = progresElev?.quizuri?.length || 0;
    const corecte = progresElev?.raspunsuriCorecte || 0;
    const castigate = progresElev?.quizuriCastigate || 0;
    const materiale = progresElev?.materiale?.length || 0;
    const record = Math.max(...(progresElev?.quizuri || []).map(item => item.score), 0);
    return [
        { icon: "🌱", title: "Primul pas", text: "Finalizează primul quiz.", obtinuta: quizuri >= 1 },
        { icon: "🏰", title: "Exploratorul castelului", text: "Cucerește un quiz.", obtinuta: castigate >= 1 },
        { icon: "🎯", title: "Ținta atinsă", text: "Strânge 10 răspunsuri corecte.", obtinuta: corecte >= 10 },
        { icon: "🏆", title: "Record personal", text: "Obține peste 1.000 de puncte.", obtinuta: record >= 1000 },
        { icon: "📚", title: "Cititor curios", text: "Parcurge 3 materiale.", obtinuta: materiale >= 3 }
    ];
}

async function actualizeazaProfilElev(user) {
    profilElevUser = user;
    progresElev = incarcaProgresElev(user);
    const button = document.getElementById("profileButton");
    if (button) button.classList.remove("ascuns");
    randareProfilElev();
    const progresCloud = await sincronizeazaProgresSupabase(user, progresElev);
    if (profilElevUser?.id !== user.id) return;
    progresElev = progresCloud;
    localStorage.setItem(cheieProgresElev(user), JSON.stringify(progresElev));
    randareProfilElev();
}

function randareProfilElev() {
    const email = document.getElementById("profileEmail");
    const stats = document.getElementById("profileStats");
    const badges = document.getElementById("profileBadges");
    const recommendation = document.getElementById("profileRecommendation");
    const history = document.getElementById("profileHistory");
    const bestScore = document.getElementById("profileBestScore");
    if (!email || !stats || !badges || !recommendation || !history || !bestScore || !progresElev) return;

    const quizuri = progresElev.quizuri || [];
    const record = Math.max(...quizuri.map(item => item.score), 0);
    const materiale = progresElev.materiale || [];
    email.textContent = profilElevUser?.email || "Elev conectat";
    stats.innerHTML = `
        <div><strong>${quizuri.length}</strong><span>quiz-uri finalizate</span></div>
        <div><strong>${materiale.length}</strong><span>materiale parcurse</span></div>
        <div><strong>${progresElev.totalPuncte || 0}</strong><span>puncte adunate</span></div>
        <div><strong>${record}</strong><span>cel mai bun scor</span></div>`;

    badges.innerHTML = insigneProfil().map(badge => `
        <div class="profile-badge ${badge.obtinuta ? "is-earned" : "is-locked"}">
            <span>${badge.icon}</span><div><strong>${badge.title}</strong><small>${badge.obtinuta ? "Obținută" : badge.text}</small></div>
        </div>`).join("");

    const ultimul = quizuri[0];
    recommendation.innerHTML = ultimul
        ? `<strong>Continuă aventura</strong><p>Ai obținut ${ultimul.score} puncte la „${escapeProfil(ultimul.title)}”. Încearcă un quiz nou și depășește-ți recordul.</p>`
        : `<strong>Începe cu o aventură</strong><p>Deschide secțiunea Quiz-uri și finalizează primul tău quiz pentru a începe să construiești progresul.</p>`;

    bestScore.textContent = record ? `Record: ${record} puncte` : "Încă nu există rezultate";
    history.innerHTML = quizuri.length
        ? quizuri.slice(0, 5).map(item => `<div class="profile-history-item"><span>${item.won ? "🏆" : "💀"}</span><div><strong>${escapeProfil(item.title)}</strong><small>${item.score} puncte · ${item.correct}/${item.total} corecte</small></div><time>${escapeProfil(item.date)}</time></div>`).join("")
        : `<p class="profile-empty">Finalizează un quiz pentru ca rezultatele tale să apară aici.</p>`;
}

function deschideProfilElev() {
    if (!profilElevUser) {
        afiseazaLogin();
        return;
    }
    randareProfilElev();
    document.getElementById("profileProfesorContent")?.classList.add("ascuns");
    document.getElementById("profileElevContent")?.classList.remove("ascuns");
    document.getElementById("profileModal")?.classList.remove("ascuns");
}

function inchideProfilElev() {
    document.getElementById("profileModal")?.classList.add("ascuns");
}

function reseteazaProfilElev() {
    profilElevUser = null;
    progresElev = null;
}

function inregistreazaRezultatQuiz(rezultat) {
    if (rolUtilizatorCurent !== "elev" || !profilElevUser || !rezultat) return;
    if (!progresElev) progresElev = incarcaProgresElev(profilElevUser);
    progresElev.quizuri.unshift({
        quizId: String(rezultat.quizId || ""),
        title: rezultat.title || "Quiz fără titlu",
        score: Number(rezultat.score) || 0,
        correct: Number(rezultat.correct) || 0,
        total: Number(rezultat.total) || 0,
        won: Boolean(rezultat.won),
        date: new Date().toLocaleDateString("ro-RO")
    });
    progresElev.quizuri = progresElev.quizuri.slice(0, 30);
    progresElev.totalPuncte += Number(rezultat.score) || 0;
    progresElev.raspunsuriCorecte += Number(rezultat.correct) || 0;
    if (rezultat.won) progresElev.quizuriCastigate += 1;
    salveazaProgresElev();
    randareProfilElev();
}

function esteMaterialParcurs(materialId) {
    return Boolean(progresElev?.materiale?.some(material => String(material.id) === String(materialId)));
}

function marcheazaMaterialParcurs(materialId, titlu) {
    if (!profilElevUser) {
        afiseazaLogin();
        return;
    }
    if (!progresElev) progresElev = incarcaProgresElev(profilElevUser);
    const index = progresElev.materiale.findIndex(material => String(material.id) === String(materialId));
    if (index >= 0) {
        progresElev.materiale.splice(index, 1);
    } else {
        progresElev.materiale.unshift({ id: String(materialId), title: String(titlu || "Material"), date: new Date().toLocaleDateString("ro-RO") });
    }
    salveazaProgresElev();
    document.querySelectorAll(`[data-material-id="${CSS.escape(String(materialId))}"]`).forEach(button => {
        const parcurs = esteMaterialParcurs(materialId);
        button.classList.toggle("is-complete", parcurs);
        button.textContent = parcurs ? "✓ Parcurs" : "○ Marchează parcurs";
        button.setAttribute("aria-pressed", String(parcurs));
    });
    randareProfilElev();
}

document.getElementById("profileButton")?.addEventListener("click", () => {
    if (typeof rolContActiv !== "undefined" && rolContActiv === "profesor" && typeof deschideProfilProfesor === "function") {
        deschideProfilProfesor();
        return;
    }
    deschideProfilElev();
});
document.getElementById("profileCloseButton")?.addEventListener("click", inchideProfilElev);
document.getElementById("profileModal")?.addEventListener("click", event => {
    if (event.target.id === "profileModal") inchideProfilElev();
});
