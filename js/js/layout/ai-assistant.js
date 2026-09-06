// Asistent AI disponibil doar utilizatorilor autentificați.
const AI_ASSISTANT_HTML = `
<section id="aiAssistant" class="ai-assistant ascuns" aria-label="Asistent AI pentru limba română">
    <button type="button" id="aiAssistantClose" class="ai-assistant-close" aria-label="Închide asistentul">×</button>
    <div class="ai-assistant-head">
        <span class="ai-assistant-avatar" aria-hidden="true">🤖</span>
        <div><strong>Profesor AI</strong><small>Limba și literatura română</small></div>
    </div>
    <div id="aiAssistantMessages" class="ai-assistant-messages" aria-live="polite">
        <div class="ai-message ai-message-bot">Bună! Îți pot explica o lecție, te pot ajuta să înțelegi o greșeală sau îți pot crea exerciții de antrenament.</div>
    </div>
    <div class="ai-quick-actions" aria-label="Întrebări rapide">
        <button type="button" data-ai-prompt="Explică-mi pe scurt o noțiune de gramatică pe care ți-o voi spune.">📚 Explică o lecție</button>
        <button type="button" data-ai-prompt="Creează-mi 3 exerciții scurte de limba română potrivite clasei mele, fără să-mi dai răspunsurile imediat.">🧠 Dă-mi exerciții</button>
        <button type="button" data-ai-prompt="Ajută-mă să înțeleg de ce am greșit la o întrebare de quiz. Îți voi spune întrebarea și răspunsul meu.">💡 Explică o greșeală</button>
    </div>
    <form id="aiAssistantForm" class="ai-assistant-form">
        <label for="aiAssistantInput" class="sr-only">Mesaj pentru Profesorul AI</label>
        <textarea id="aiAssistantInput" maxlength="1200" rows="2" placeholder="Întreabă ceva despre limba sau literatura română..."></textarea>
        <button type="submit" id="aiAssistantSend">Trimite</button>
    </form>
    <p id="aiAssistantStatus" class="ai-assistant-status"></p>
</section>`;
