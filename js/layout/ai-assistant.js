// Asistent AI disponibil doar utilizatorilor autentificați.
const AI_ASSISTANT_HTML = `
<button id="aiAssistantButton" class="ai-assistant-launcher" type="button" aria-label="Deschide Profesor AI" aria-controls="aiAssistant" aria-expanded="false">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="7" width="16" height="13" rx="4"/><path d="M12 3v4M8 12h.01M16 12h.01M8 16h8"/></svg>
    <span>Profesor AI</span>
</button>
<section id="aiAssistant" class="ai-assistant ascuns" aria-label="Asistent AI pentru limba română">
    <button type="button" id="aiAssistantClose" class="ai-assistant-close" aria-label="Închide asistentul">×</button>
    <div class="ai-assistant-head">
        <span class="ai-assistant-avatar" aria-hidden="true">🤖</span>
        <div><strong>Profesor AI</strong><small>Limba și literatura română</small></div>
    </div>
    <p class="ai-assistant-status">Asistent online, fără descărcarea unui model. Întrebările și textul de studiu sunt trimise serverului pentru răspuns.</p>
    <label class="ai-study-label">Clasa
        <select id="aiAssistantGrade"><option value="">Alege clasa</option><option value="5">a V-a</option><option value="6">a VI-a</option><option value="7">a VII-a</option><option value="8">a VIII-a</option></select>
    </label>
    <details class="ai-study-label"><summary>Text de studiu (opțional)</summary><textarea id="aiStudyText" maxlength="6000" rows="3" placeholder="Copiază un fragment din lecție pentru a oferi context întrebării."></textarea></details>
    <div id="aiAssistantMessages" class="ai-assistant-messages" aria-live="polite">
        <div class="ai-message ai-message-bot">Bună! Îți pot explica o lecție, te pot ajuta să înțelegi o greșeală sau îți pot crea exerciții de antrenament.</div>
    </div>
    <p class="ai-assistant-status">Alege o sugestie pentru a completa mesajul, adapteaz-o și apasă „Trimite”.</p>
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
