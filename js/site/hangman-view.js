// A small, self-contained word-game scene. All answer text is escaped before rendering.
window.CastleQuizHangmanView = (() => {
    let serial = 0;
    const alphabet = "AĂÂBCDEFGHIÎJKLMNOPQRSȘTȚUVWXYZ";
    const fold = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const escape = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
    const number = (value, fallback, min, max) => Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Math.floor(Number(value)))) : fallback;

    function scene(id, parts, freshFrom, result) {
        const part = (name, index, markup) => `<g data-hangman-part="${name}" data-visible="${parts >= index}" visibility="${parts >= index ? "visible" : "hidden"}" class="hangman-figure-part${parts >= index && index > freshFrom ? " hangman-part-new" : ""}">${markup}</g>`;
        return `<svg class="hangman-illustration" viewBox="0 0 430 320" aria-hidden="true" focusable="false">
            <defs>
                <linearGradient id="${id}-wall" x2="0" y2="1"><stop stop-color="#3d4544"/><stop offset="1" stop-color="#252b2b"/></linearGradient>
                <linearGradient id="${id}-wood" x2="1" y2="0"><stop stop-color="#5c3b23"/><stop offset=".3" stop-color="#93663b"/><stop offset=".55" stop-color="#ae8050"/><stop offset="1" stop-color="#72502f"/></linearGradient>
                <linearGradient id="${id}-beam" x2="0" y2="1"><stop stop-color="#b58b58"/><stop offset=".22" stop-color="#987044"/><stop offset="1" stop-color="#634126"/></linearGradient>
                <linearGradient id="${id}-rope" x2="1" y2="0"><stop stop-color="#776246"/><stop offset=".48" stop-color="#d1ba89"/><stop offset="1" stop-color="#8d754f"/></linearGradient>
                <linearGradient id="${id}-head" x2="1" y2=".4"><stop stop-color="#c6a77e"/><stop offset=".55" stop-color="#dfc297"/><stop offset="1" stop-color="#a88760"/></linearGradient>
                <linearGradient id="${id}-coat" x2="1" y2=".3"><stop stop-color="#34535b"/><stop offset=".45" stop-color="#647a7b"/><stop offset="1" stop-color="#30464c"/></linearGradient>
                <linearGradient id="${id}-leg" x2="1" y2="0"><stop stop-color="#353d40"/><stop offset=".5" stop-color="#626768"/><stop offset="1" stop-color="#30383b"/></linearGradient>
                <radialGradient id="${id}-light" cx=".14" cy=".17" r=".85"><stop stop-color="#b89a60" stop-opacity=".18"/><stop offset="1" stop-color="#b89a60" stop-opacity="0"/></radialGradient>
                <pattern id="${id}-stone" width="96" height="48" patternUnits="userSpaceOnUse"><path d="M0 0H96M0 48H96M48 0V24M0 24H96M0 24V48M96 24V48" fill="none" stroke="#101719" stroke-opacity=".4" stroke-width="2"/><path d="M2 2H94M2 26H94" stroke="#9ba097" stroke-opacity=".07"/></pattern>
                <pattern id="${id}-grain" width="18" height="76" patternUnits="userSpaceOnUse"><path d="M4 0Q0 22 5 43T5 76M12 0Q17 29 11 52T13 76" fill="none" stroke="#2f2319" stroke-opacity=".22" stroke-width="1"/><path d="M8 0Q12 26 8 47T9 76" fill="none" stroke="#e4bf82" stroke-opacity=".17"/></pattern>
            </defs>
            <rect width="430" height="320" rx="18" fill="url(#${id}-wall)"/>
            <rect width="430" height="286" rx="18" fill="url(#${id}-stone)"/>
            <rect width="430" height="320" rx="18" fill="url(#${id}-light)"/>
            <path d="M0 268Q207 257 430 271V320H0Z" fill="#3e4140"/>
            <path d="M0 287L430 283M77 267L50 320M230 264L239 320M371 268L407 320" stroke="#202827" stroke-width="2" opacity=".6"/>
            <ellipse cx="211" cy="289" rx="149" ry="16" fill="#0c1315" opacity=".42"/>
            <path d="M89 283H321L334 292H76Z" fill="#775332"/>
            <path d="M76 292H334V303H76Z" fill="#503723"/>
            <path d="M91 283H321L327 288H85Z" fill="#ac8050"/>
            <path d="M113 56L125 48H142V282H113Z" fill="#493323"/>
            <path d="M113 56H135V287H113Z" fill="url(#${id}-wood)"/>
            <path d="M113 56H135V287H113Z" fill="url(#${id}-grain)"/>
            <path d="M135 56L142 49V280L135 287Z" fill="#463120"/>
            <path d="M103 49H307L317 56H111Z" fill="#bd955e"/>
            <path d="M103 49H307V74H103Z" fill="url(#${id}-beam)"/>
            <path d="M307 49L317 56V81L307 74Z" fill="#503823"/>
            <path d="M103 74H307L317 81H113Z" fill="#483323"/>
            <path d="M113 127L170 74H188L127 139Z" fill="#493321"/>
            <path d="M116 122L170 71H182L127 133Z" fill="url(#${id}-beam)"/>
            <path d="M120 120L173 71M121 131L180 75" stroke="#d4ae73" stroke-opacity=".3"/>
            <path d="M116 52H132V82H116Z" fill="#374142"/>
            <path d="M109 263H140V279H109Z" fill="#333c3c"/>
            ${[[123,59],[123,75],[123,270],[173,77],[124,123],[292,61]].map(([x,y])=>`<circle cx="${x+1}" cy="${y+1}" r="3.6" fill="#222a2b"/><circle cx="${x}" cy="${y}" r="2.7" fill="#7e8580"/><path d="M${x-1} ${y-1}L${x+1} ${y+1}" stroke="#d3d1b3" stroke-width=".8"/>`).join("")}
            <ellipse cx="123" cy="192" rx="5" ry="12" fill="none" stroke="#35291e" stroke-opacity=".45"/>
            <ellipse cx="123" cy="192" rx="2" ry="7" fill="none" stroke="#d2a66b" stroke-opacity=".4"/>
            <path d="M279 75V127" stroke="#141b1c" stroke-width="8" opacity=".38"/>
            <path d="M276 62V126" stroke="url(#${id}-rope)" stroke-width="6" stroke-linecap="round"/>
            <path d="M273 69L279 73M273 77L279 81M273 85L279 89M273 93L279 97M273 101L279 105M273 109L279 113M273 117L279 121" stroke="#675339" stroke-width="1.4" opacity=".8"/>
            <path d="M271 61Q276 56 281 61V69Q276 74 271 69Z" fill="none" stroke="url(#${id}-rope)" stroke-width="3"/>
            <path d="M274 125Q262 136 267 156Q276 171 285 156Q291 136 278 125" fill="none" stroke="url(#${id}-rope)" stroke-width="4"/>
            <g class="hangman-mannequin${result === "won" ? " hangman-mannequin-saved" : ""}">
                ${part("head",1,`<path d="M271 156H281V170H271Z" fill="#ae8e66"/><ellipse cx="276" cy="143" rx="17" ry="20" fill="url(#${id}-head)"/><path d="M262 136Q266 120 280 124Q289 127 291 139Q276 133 262 136Z" fill="#5a4938"/><path d="M268 144H271M281 144H284" stroke="#594b3c" stroke-width="1.8" stroke-linecap="round"/><path d="M273 154Q276 155 279 154" fill="none" stroke="#876c50" stroke-width="1.2"/>`)}
                ${part("torso",2,`<path d="M268 166Q257 168 256 181L263 215Q275 222 289 215L296 181Q295 168 284 166Z" fill="url(#${id}-coat)"/><path d="M276 170V212" stroke="#9ba6a0" stroke-opacity=".34"/><path d="M262 208Q276 211 290 208L289 216Q276 221 263 216Z" fill="#534432"/><rect x="272" y="210" width="8" height="6" rx="1" fill="#b59d68"/>`)}
                ${part("arm-left",3,`<path d="M260 176L248 194L245 209" fill="none" stroke="#314951" stroke-width="12" stroke-linecap="round"/><path d="M260 175L250 193L248 204" fill="none" stroke="#718383" stroke-width="4" stroke-linecap="round"/><ellipse cx="244" cy="212" rx="5.5" ry="7.5" fill="url(#${id}-head)"/>`)}
                ${part("arm-right",4,`<path d="M292 176L304 194L307 209" fill="none" stroke="#344c53" stroke-width="12" stroke-linecap="round"/><path d="M291 175L301 193L304 204" fill="none" stroke="#7d8a86" stroke-width="4" stroke-linecap="round"/><ellipse cx="308" cy="212" rx="5.5" ry="7.5" fill="url(#${id}-head)"/>`)}
                ${part("leg-left",5,`<path d="M270 217L267 237L264 258" fill="none" stroke="url(#${id}-leg)" stroke-width="13" stroke-linecap="round"/><path d="M269 223L266 249" stroke="#8c918b" stroke-opacity=".35" stroke-width="2"/><path d="M258 254H269L270 267Q264 272 253 268L253 263Z" fill="#3d332a"/><path d="M254 267H269" stroke="#8c7455" stroke-width="2"/>`)}
                ${part("leg-right",6,`<path d="M282 217L285 237L288 258" fill="none" stroke="url(#${id}-leg)" stroke-width="13" stroke-linecap="round"/><path d="M283 223L286 249" stroke="#8c918b" stroke-opacity=".35" stroke-width="2"/><path d="M283 254H294L299 263V268Q289 272 282 267Z" fill="#3d332a"/><path d="M283 267H298" stroke="#8c7455" stroke-width="2"/>`)}
            </g>
            <path d="M47 288L55 280L67 282L72 290L65 294H51Z" fill="#666b65"/><path d="M350 294L357 285L371 288L377 297H356Z" fill="#555e5b"/>
            <path d="M52 281L57 284L66 283M358 287L361 292L371 289" stroke="#92998d" stroke-opacity=".5" fill="none"/>
        </svg>`;
    }

    function render({ target = "", guessed = new Set(), misses = 0, maxMistakes = 3, remaining = 3, locked = false, result = "playing", lastGuess = null, timedOut = false } = {}) {
        const id = `quiz-hangman-${++serial}`;
        const budget = number(maxMistakes, 6, 1, 99), errors = number(misses, 0, 0, budget), lives = number(remaining, budget - errors, 0, 99);
        const outcome = ["won", "lost"].includes(result) ? result : "playing";
        const selected = new Set(Array.from(guessed || [], fold));
        const answer = String(target ?? "").normalize("NFC"), normalized = fold(answer);
        const currentLetter = typeof lastGuess === "object" && lastGuess ? lastGuess.letter || lastGuess.key || "" : lastGuess;
        const newError = Boolean(currentLetter && !normalized.includes(fold(currentLetter)));
        const parts = Math.min(6, Math.ceil(errors / budget * 6));
        const freshFrom = newError ? Math.ceil(Math.max(0, errors - 1) / budget * 6) : parts;
        const automatic = character => !/^[A-Z]$/.test(fold(character));
        const visible = character => automatic(character) || selected.has(fold(character)) || outcome === "lost";
        const tokens = answer.match(/\S+|\s+/gu) || [];
        const word = tokens.map(token => /^\s+$/u.test(token) ? '<span class="hangman-word-gap" aria-hidden="true"></span>' : `<span class="hangman-token">${[...token].map(character => automatic(character)
            ? `<span class="hangman-punctuation" aria-hidden="true">${escape(character)}</span>`
            : `<span class="hangman-tile${visible(character) ? " hangman-tile-revealed" : ""}" data-revealed="${visible(character)}" aria-hidden="true">${visible(character) ? escape(character.toUpperCase()) : "_"}</span>`).join("")}</span>`).join("");
        const mask = [...answer].map(character => visible(character) ? character.toUpperCase() : "_").join(" ");
        const status = outcome === "won" ? "Cuvânt descoperit" : timedOut ? "Timpul a expirat" : outcome === "lost" ? "Provocare încheiată" : lives === 1 ? "O încercare rămasă" : `${lives} încercări rămase`;
        const keyboard = [...alphabet].map(letter => {
            const used = selected.has(fold(letter)), correct = normalized.includes(fold(letter));
            const state = used ? correct ? "correct" : "wrong" : "unused";
            const label = used ? `${letter}, literă ${correct ? "găsită" : "greșită"}` : `Alege litera ${letter}`;
            return `<button type="button" data-letter="${letter}" data-key-state="${state}" aria-label="${escape(label)}" class="hangman-key hangman-key-${state}"${used || locked || outcome !== "playing" ? " disabled" : ""}><span>${letter}</span>${used ? `<span class="hangman-key-mark" aria-hidden="true">${correct ? "✓" : "×"}</span>` : ""}</button>`;
        }).join("");
        return `<div class="hangman-play" tabindex="-1" data-misses="${errors}" data-max-mistakes="${budget}" data-result="${outcome}" data-timed-out="${Boolean(timedOut)}">
            <figure class="hangman-scene" aria-labelledby="${id}-caption">${scene(id, parts, freshFrom, outcome)}<figcaption id="${id}-caption"><span>Spânzurătoarea</span><span>${errors} / ${budget} greșeli</span></figcaption></figure>
            <div class="hangman-controls"><div class="hangman-status" role="status"><span class="hangman-status-dot" aria-hidden="true"></span>${status}</div>
                <div class="hangman-word" role="group" aria-label="Cuvânt de ghicit">${word}<span class="hangman-sr-only">${escape(mask)}</span></div>
                <div class="hangman-keyboard" role="group" aria-label="Alege o literă">${keyboard}</div>
                <p class="hangman-note">O literă greșită costă o viață. Poți folosi și tastatura.</p>
            </div>
        </div>`;
    }
    return { render };
})();
