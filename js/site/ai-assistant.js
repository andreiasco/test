// ======================================================
// ASISTENT AI - doar pentru utilizatori autentificați
// ======================================================
const aiAssistantHistory = [];
let aiAssistantBusy = false;

function escapeAiHtml(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function setAiAccess(enabled) {
    const button = document.getElementById("aiAssistantButton");
    if (button) button.classList.toggle("ascuns", !enabled);
    if (!enabled) document.getElementById("aiAssistant")?.classList.add("ascuns");
}

function openAiAssistant() {
    document.getElementById("aiAssistant")?.classList.remove("ascuns");
    document.getElementById("aiAssistantInput")?.focus();
}
function closeAiAssistant() { document.getElementById("aiAssistant")?.classList.add("ascuns"); }

function addAiMessage(role, text) {
    const list = document.getElementById("aiAssistantMessages");
    if (!list) return;
    const div = document.createElement("div");
    div.className = `ai-message ${role === "user" ? "ai-message-user" : "ai-message-bot"}`;
    div.innerHTML = escapeAiHtml(text).replace(/\n/g, "<br>");
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
}

async function sendAiAssistantMessage(message) {
    const text = String(message || "").trim();
    if (!text || aiAssistantBusy) return;
    const status = document.getElementById("aiAssistantStatus");
    const send = document.getElementById("aiAssistantSend");
    const input = document.getElementById("aiAssistantInput");
    const { data: sessionData } = await supabaseClient.auth.getSession();
    if (!sessionData?.session) {
        setAiAccess(false);
        afiseazaLogin();
        return;
    }

    addAiMessage("user", text);
    aiAssistantHistory.push({ role: "user", content: text });
    if (aiAssistantHistory.length > 10) aiAssistantHistory.splice(0, aiAssistantHistory.length - 10);
    if (input) input.value = "";
    aiAssistantBusy = true;
    if (send) send.disabled = true;
    if (status) status.textContent = "Profesorul AI pregătește răspunsul...";

    try {
        const { data, error } = await supabaseClient.functions.invoke("ai-assistant", {
            body: { messages: aiAssistantHistory }
        });
        if (error) throw error;
        const answer = String(data?.answer || "Nu am primit un răspuns.").trim();
        addAiMessage("assistant", answer);
        aiAssistantHistory.push({ role: "assistant", content: answer });
        if (aiAssistantHistory.length > 10) aiAssistantHistory.splice(0, aiAssistantHistory.length - 10);
        if (status) status.textContent = data?.remaining_today != null ? `Întrebări AI rămase astăzi: ${data.remaining_today}` : "";
    } catch (error) {
        console.error("AI assistant:", error);
        addAiMessage("assistant", "Nu pot răspunde momentan. Verifică dacă funcția AI este instalată în Supabase și încearcă din nou.");
        if (status) status.textContent = "AI indisponibil momentan.";
    } finally {
        aiAssistantBusy = false;
        if (send) send.disabled = false;
    }
}

function initializeazaAiAssistant() {
    const form = document.getElementById("aiAssistantForm");
    if (!form || form.dataset.initialized === "true") return;
    form.dataset.initialized = "true";
    document.getElementById("aiAssistantButton")?.addEventListener("click", openAiAssistant);
    document.getElementById("aiAssistantClose")?.addEventListener("click", closeAiAssistant);
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        sendAiAssistantMessage(document.getElementById("aiAssistantInput")?.value);
    });
    document.querySelectorAll("[data-ai-prompt]").forEach(button => button.addEventListener("click", () => {
        const input = document.getElementById("aiAssistantInput");
        if (input) { input.value = button.dataset.aiPrompt || ""; input.focus(); }
    }));
}

window.setAiAccess = setAiAccess;
window.openAiAssistant = openAiAssistant;
window.sendAiAssistantMessage = sendAiAssistantMessage;
