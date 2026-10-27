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
                <radialGradient id="${id}-head" cx=".32" cy=".3" r=".8"><stop stop-color="#e8c3a0"/><stop offset=".6" stop-color="#c59c7b"/><stop offset="1" stop-color="#86654f"/></radialGradient>
                <linearGradient id="${id}-skin" x2="1" y2=".2"><stop stop-color="#97715a"/><stop offset=".4" stop-color="#dbb28e"/><stop offset=".7" stop-color="#c59b79"/><stop offset="1" stop-color="#87634d"/></linearGradient>
                <linearGradient id="${id}-coat" x2="1" y2=".2"><stop stop-color="#263c44"/><stop offset=".24" stop-color="#526d74"/><stop offset=".5" stop-color="#657e83"/><stop offset=".73" stop-color="#3e5962"/><stop offset="1" stop-color="#263b42"/></linearGradient>
                <linearGradient id="${id}-sleeve" x2="1" y2=".15"><stop stop-color="#263d46"/><stop offset=".45" stop-color="#687f85"/><stop offset="1" stop-color="#344e58"/></linearGradient>
                <linearGradient id="${id}-leg" x2="1" y2="0"><stop stop-color="#292f33"/><stop offset=".3" stop-color="#586065"/><stop offset=".58" stop-color="#656d70"/><stop offset="1" stop-color="#30383e"/></linearGradient>
                <linearGradient id="${id}-boot" x2=".8" y2="1"><stop stop-color="#6d5744"/><stop offset=".45" stop-color="#483a30"/><stop offset="1" stop-color="#24272a"/></linearGradient>
                <filter id="${id}-figure-shadow" x="-.3" y="-.1" width="1.6" height="1.3"><feDropShadow dx="1.3" dy="1.6" stdDeviation="1" flood-color="#0b1215" flood-opacity=".4"/></filter>
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
            <path d="M279 75V116" stroke="#141b1c" stroke-width="8" opacity=".38"/>
            <path d="M276 62V115" stroke="url(#${id}-rope)" stroke-width="6" stroke-linecap="round"/>
            <path d="M273 69L279 73M273 77L279 81M273 85L279 89M273 93L279 97M273 101L279 105M273 109L279 113" stroke="#675339" stroke-width="1.4" opacity=".8"/>
            <path d="M271 61Q276 56 281 61V69Q276 74 271 69Z" fill="none" stroke="url(#${id}-rope)" stroke-width="3"/>
            <path d="M274 114Q264 123 267 141Q276 156 285 141Q288 124 278 114" fill="none" stroke="url(#${id}-rope)" stroke-width="3.5"/>
            <g class="hangman-mannequin${result === "won" ? " hangman-mannequin-saved" : ""}" filter="url(#${id}-figure-shadow)">
                ${part("head",1,`
                    <path d="M272 139L271.5 149Q275.7 153 280.7 149L280 139Z" fill="url(#${id}-skin)"/>
                    <path d="M272 141Q276 145 280 141L280.2 145Q276 147 271.8 144Z" fill="#87664f" opacity=".45"/>
                    <path d="M268.5 128Q266.1 125.8 266.1 131.4Q266 135.3 269.4 135.5M283.4 128Q286 126 285.5 132Q285.2 135 282.8 135.4" fill="url(#${id}-skin)" stroke="#96765d" stroke-width=".55"/>
                    <path d="M267.8 124.7Q268.4 118 275.9 117.6Q283.7 118.1 284.3 125.4L283 136Q281.7 142.9 276 144Q270.2 142.5 268.9 136.4Z" fill="url(#${id}-head)"/>
                    <path d="M268 127Q264.8 119.4 271.4 116.3Q277.2 113.8 282.5 118.1Q286 121.4 283.9 128.1L282.2 123.9Q276.8 124.1 273.8 120.6Q272.1 125.8 269.1 125.7L269 129Z" fill="#463c35"/>
                    <path d="M269 122.5Q270.8 116.6 276.7 117.2M274.3 118.7Q279 118.2 282.1 122.1" fill="none" stroke="#82705b" stroke-width=".65" opacity=".75"/>
                    <path d="M270.5 129.5Q272.2 128.6 274.2 129.3M278.2 129.4Q280.3 128.6 281.8 129.8" fill="none" stroke="#5e4b3c" stroke-width=".8" stroke-linecap="round"/>
                    <path d="M270.7 131.2Q272.4 130.1 274 131.4M278.3 131.4Q280.1 130.4 281.5 131.5" fill="none" stroke="#453e35" stroke-width=".6"/>
                    <circle cx="272.6" cy="131.1" r=".45" fill="#303c3d"/><circle cx="279.8" cy="131.4" r=".45" fill="#303c3d"/>
                    <path d="M276 130.6L274.9 135.4Q276.1 136.4 277.2 135.5" fill="none" stroke="#9b775d" stroke-width=".65" stroke-linecap="round"/>
                    <path d="M273.7 138.4Q276 139.4 278.5 138.5" fill="none" stroke="#88614d" stroke-width=".7" stroke-linecap="round"/>
                    <path d="M270.3 134.2L272.1 135.3M280 135.4L281.6 134.6M274.6 141Q276 141.8 277.3 141.1" fill="none" stroke="#e9c8a5" stroke-width=".55" opacity=".7"/>
                `)}
                ${part("torso",2,`
                    <path d="M270.8 147Q266.2 149.4 259.7 151.5Q255.8 154.7 257.3 164L261.8 179.5L260.4 199.2L263.1 205.8Q275.8 210 288.6 205L292.1 199L290.5 179.3L295.1 163.8Q296.7 154.4 292.8 151.4L280.8 147L276 151.2Z" fill="url(#${id}-coat)" stroke="#2b4249" stroke-width=".6"/>
                    <path d="M271 146.6L275.8 151.4L271.4 158.4L267.2 149M280.5 146.7L276 151.4L280.6 158.5L285.1 149.5" fill="#8a9b9c" stroke="#465d64" stroke-width=".65"/>
                    <path d="M275.7 154L276.2 201.1" stroke="#263c45" stroke-width="1.2" opacity=".65"/>
                    <path d="M277.1 155L277.5 200.8" stroke="#a4b1af" stroke-width=".55" opacity=".45"/>
                    <path d="M261 160Q268 161 271.5 164M280.8 162Q286 159.8 291.1 160.5M263 181Q267.5 185 270.2 184.3M282.2 186L289.5 181.6M263 195.8L271.5 198M280.4 198.3L288.8 194.5" fill="none" stroke="#203c46" stroke-width=".8" opacity=".6"/>
                    <path d="M260.8 165.5L263.2 178M289.6 165.6L287.8 176.7M265.3 189L266.2 194.9" fill="none" stroke="#a1b0af" stroke-width=".65" opacity=".35"/>
                    <path d="M280.8 166H288V174Q284.5 176.3 281 173.9Z" fill="#48636b" stroke="#8b9d9e" stroke-width=".5"/>
                    ${[160,171,182,193].map(y=>`<circle cx="276.4" cy="${y}" r=".65" fill="#bdc3b6"/>`).join("")}
                    <path d="M261.2 200.7Q276 204.2 290.8 200.5L289.1 206Q276 209.4 262.9 206Z" fill="#514438"/>
                    <path d="M262.1 201.9Q276 205.2 290.1 201.8" fill="none" stroke="#90785a" stroke-width=".65"/>
                    <rect x="273" y="202.5" width="6.5" height="5" rx=".6" fill="#b9a77d"/><rect x="274.4" y="203.6" width="3.5" height="2.7" rx=".2" fill="#574b3d"/>
                `)}
                ${part("arm-left",3,`
                    <path d="M260.1 152.8Q254.8 152.2 252.6 160.2L248.7 179.4Q247.7 183.6 248.6 188L244.4 207L251.1 209L257 187.3Q258.5 183.4 258.5 179.8L264 163.7Q265.4 157 260.1 152.8Z" fill="url(#${id}-sleeve)" stroke="#293e46" stroke-width=".6"/>
                    <path d="M255.5 158.4L252 177.8M252.5 184.8L248.7 201.9" fill="none" stroke="#a1b0ad" stroke-width=".75" opacity=".55"/>
                    <path d="M249.5 179.8L255.3 182M249.2 183L254.4 185.5M248.8 189.2L253.6 190M247.1 201.5L252 203.2" fill="none" stroke="#273e48" stroke-width=".8"/>
                    <path d="M244.4 204.5L251.8 206.4L250.6 210.1L243.6 208.4Z" fill="#9ba9a6" stroke="#465c63" stroke-width=".5"/>
                    <path d="M244.3 208.2L250.2 209.8L249.8 214.1Q250.3 218 248.6 221.4Q247.6 222.3 246.7 220.8Q245.6 222.1 244.6 220.4Q243.6 221.1 242.8 219.5L241.9 215.1Q240.7 217.4 239.7 216.5Q239.2 215.6 240.3 212.5L243.4 210.1Z" fill="url(#${id}-skin)" stroke="#8e6c55" stroke-width=".5"/>
                    <path d="M244 214.6L244.6 219.2M246.1 214.9L246.7 220M248 215.3L248.5 219.8M242.7 212.8L241.8 215" fill="none" stroke="#926e56" stroke-width=".45" stroke-linecap="round"/>
                `)}
                ${part("arm-right",4,`
                    <path d="M291.9 152.7Q297.6 152.1 299.8 160L303.6 178.9Q304.5 182.5 303.9 186.8L308.7 206.7L302 209L295.9 187Q294.7 183.3 294.7 179.4L289.4 163.6Q287.8 157.3 291.9 152.7Z" fill="url(#${id}-sleeve)" stroke="#293e46" stroke-width=".6"/>
                    <path d="M294.3 157.9L299.4 178.8M299.4 185L304.8 202.6" fill="none" stroke="#a7b3ae" stroke-width=".75" opacity=".5"/>
                    <path d="M297.3 182.5L302.7 179.8M298.1 186L303.6 183.2M299 190.6L304.1 189.2M301.5 204L306.3 202.4" fill="none" stroke="#263d46" stroke-width=".8"/>
                    <path d="M301.6 206.3L308.5 204.9L309.5 208.6L302.9 210.5Z" fill="#8c9fa0" stroke="#465c63" stroke-width=".5"/>
                    <path d="M303.1 210.3L308.8 208.9L309.8 211.6Q312.4 214 312.7 216.2Q312.1 218 310.5 215.6L310.2 219.5Q309.9 221.5 308.5 220.7Q307.4 222.4 306.3 221Q305.1 222.1 304.2 220.3Q302.9 217.7 303.5 214.8Z" fill="url(#${id}-skin)" stroke="#896750" stroke-width=".5"/>
                    <path d="M305.4 215.1L304.8 219.7M307.5 214.7L306.8 220.1M309.3 214.2L308.9 219.6M309.8 212.1L310.7 214.4" fill="none" stroke="#926e56" stroke-width=".45" stroke-linecap="round"/>
                `)}
                ${part("leg-left",5,`
                    <path d="M263.4 206.1L276 207.8L275.2 226Q275.1 232.1 272.3 237.4L271.7 260.5L261.3 260.3L260.6 237.8Q260.8 232.4 262 226.6Z" fill="url(#${id}-leg)" stroke="#2b3339" stroke-width=".6"/>
                    <path d="M265.1 209.7L266.4 228.5L264.8 236.5L265.9 255.7" fill="none" stroke="#8a9290" stroke-width=".8" opacity=".55"/>
                    <path d="M263 210.7L267.3 215.1M261.7 231.4L271.7 234.4M261.9 236.7L268.9 238M263.2 249.8L269.7 252.4M262 257.5L270.7 257.9" fill="none" stroke="#2c373e" stroke-width=".8"/>
                    <path d="M261.5 258.7L271.3 258.9L271.8 270.9L273 275Q266.4 277.6 254.2 275.4L253.7 271.5Q254 268.9 260.2 267.6Z" fill="url(#${id}-boot)" stroke="#2a2d2d" stroke-width=".7"/>
                    <path d="M254.1 273.3Q262.5 275 272 273L273 276.4Q263 279 254.3 276.5Z" fill="#282c2b"/>
                    <path d="M262.5 261.5L269.6 262M262 264L269.8 264.5M259.6 270Q264.1 268.7 270.5 270M255.2 273.9L269.8 274.8" fill="none" stroke="#9b846a" stroke-width=".6" opacity=".65"/>
                `)}
                ${part("leg-right",6,`
                    <path d="M276 207.8L288.6 206L291 226.7Q292.3 231.5 291.4 237.8L291 260.4L280.4 260.6L279.8 237.8Q277.1 232.5 276.9 226Z" fill="url(#${id}-leg)" stroke="#2b3339" stroke-width=".6"/>
                    <path d="M284.3 210.2L286 228.6L285.9 236.7L285.8 255.7" fill="none" stroke="#89938f" stroke-width=".8" opacity=".5"/>
                    <path d="M284.7 215.2L288.7 211.4M280.5 233.8L290.1 231.5M282.4 237.7L290.7 236.6M282.3 251.8L289.5 249.7M281.1 257.9L289.9 257.5" fill="none" stroke="#2c373e" stroke-width=".8"/>
                    <path d="M280.8 259L290.6 258.8L291.7 267.5Q297.5 268.6 298.8 271.4L298.2 275.7Q286.7 278.2 279.6 275L280.6 270.7Z" fill="url(#${id}-boot)" stroke="#2a2d2d" stroke-width=".7"/>
                    <path d="M280 273Q289.5 275.4 298.6 273.6L298.2 276.7Q288.8 279.2 279.1 276.2Z" fill="#282c2b"/>
                    <path d="M282.3 261.9L289.4 261.4M282.1 264.5L289.7 264M281.2 270Q287.8 268.8 292.4 270.5M282.3 274.4L297.4 274.8" fill="none" stroke="#9b846a" stroke-width=".6" opacity=".65"/>
                `)}
            </g>
            <path d="M47 288L55 280L67 282L72 290L65 294H51Z" fill="#666b65"/><path d="M350 294L357 285L371 288L377 297H356Z" fill="#555e5b"/>
            <path d="M52 281L57 284L66 283M358 287L361 292L371 289" stroke="#92998d" stroke-opacity=".5" fill="none"/>
        </svg>`;
    }

    function render({ target = "", guessed = new Set(), misses = 0, maxMistakes = 6, remaining = 6, locked = false, result = "playing", lastGuess = null, timedOut = false } = {}) {
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
