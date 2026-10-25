// Presentation-only icon conversion. Keep data, handlers and user-authored text intact.
const SITE_EMOJI_GROUPS = [
    ['shield', 'Protecție', '🛡'], ['save', 'Salvează', '💾'], ['trash', 'Șterge', '🗑'],
    ['tick', 'Confirmat', '✔ ✅ ✓'], ['close', 'Închide sau respins', '✖ ❌ ✕'],
    ['warning', 'Atenție', '⚠'], ['clock', 'În așteptare', '⏳'],
    ['ai', 'Asistent AI', '🤖 🧠'], ['eye', 'Vizualizează', '👁'], ['eyeOff', 'Ascunde', '🙈'],
    ['book', 'Carte', '📖 📕 📚'], ['monster', 'Monstru', '👹 😈'], ['bat', 'Liliac', '🦇'],
    ['skull', 'Vieți epuizate', '💀'], ['spider', 'Păianjen', '🕷'], ['ghost', 'Fantomă', '👻'],
    ['rock', 'Golem', '🪨'], ['wizard', 'Vrăjitor', '🧙'], ['dragon', 'Dragon', '🐉'],
    ['target', 'Țintă', '🎯'], ['rope', 'Spânzurătoarea', '🪢'], ['shuffle', 'Pune în ordine', '🔀'],
    ['heart', 'Viață sau valoare', '❤'], ['heartEmpty', 'Viață pierdută', '🖤'],
    ['edit', 'Editează', '✏ ✍'], ['user', 'Persoană', '👤 🧑'], ['users', 'Persoane', '👥 🤝'],
    ['file', 'Document', '📄 📝 🗒 📋'], ['film', 'Film sau aventură', '🎬'], ['audio', 'Audiobook', '🎧'],
    ['magazine', 'Publicație', '📰'], ['book', 'Limba română', '🔤'], ['folder', 'Dosar', '📁'],
    ['game', 'Joc', '🎮'], ['bulb', 'Explicație', '💡'], ['lock', 'Autentificare', '🔐'],
    ['key', 'Parolă', '🔑'], ['menu', 'Meniu', '☰'], ['logout', 'Ieșire', '🚪'],
    ['moon', 'Temă întunecată', '🌙'], ['sun', 'Temă luminoasă', '☀ 🌞'], ['upload', 'Trimite material', '📤 📮'],
    ['castle', 'Castel', '🏰'], ['puzzle', 'Activitate', '🧩'], ['sound', 'Sunet pornit', '🔊'],
    ['muted', 'Sunet oprit', '🔇'], ['chart', 'Statistici', '📊'], ['refresh', 'Reîmprospătează', '🔄'],
    ['image', 'Imagine', '🖼'], ['plus', 'Adaugă', '➕'], ['sparkles', 'Generare AI', '✨'],
    ['map', 'Hartă', '🗺'], ['camera', 'Imaginea personajelor', '📷'], ['leaf', 'Progres', '🌱'],
    ['trophy', 'Rezultat', '🏆'], ['gift', 'Bonus', '🎁'], ['search', 'Caută', '🔍']
];
const SITE_EMOJI_ICONS = new Map(SITE_EMOJI_GROUPS.flatMap(([name, label, symbols]) => symbols.split(' ').map(symbol => [symbol, { name, label }])));
const SITE_EMOJI_PATTERN = /[\u{1F000}-\u{1FAFF}\u2600-\u27ff\u2300-\u23ff](?:\uFE0F)?/gu;

function fragmentePictograme(text) {
    const parts = [];
    let start = 0;
    for (const match of text.matchAll(SITE_EMOJI_PATTERN)) {
        const icon = SITE_EMOJI_ICONS.get(match[0].replace(/\uFE0F/g, ''));
        if (!icon) continue;
        if (match.index > start) parts.push(text.slice(start, match.index));
        parts.push(icon);
        start = match.index + match[0].length;
    }
    if (start < text.length) parts.push(text.slice(start));
    return parts;
}

function initializeazaPictogrameSite() {
    const excluded = 'script, style, textarea, pre, code, svg, [contenteditable], .ai-message, [data-preserve-text]';
    function convertText(node) {
        if (!node.parentElement || node.parentElement.closest(excluded)) return;
        const parts = fragmentePictograme(node.data);
        if (!parts.some(part => typeof part !== 'string')) return;
        // Native option rendering cannot contain SVG. Keep its readable text and value.
        if (node.parentElement.closest('option')) {
            node.data = parts.filter(part => typeof part === 'string').join('').trim();
            return;
        }
        const fragment = document.createDocumentFragment();
        parts.forEach(part => {
            if (typeof part === 'string') fragment.appendChild(document.createTextNode(part));
            else {
                const template = document.createElement('template');
                template.innerHTML = almaIcon(part.name);
                const icon = template.content.firstElementChild;
                icon.classList.add('site-inline-icon');
                icon.removeAttribute('aria-hidden');
                icon.setAttribute('role', 'img');
                icon.setAttribute('aria-label', part.label);
                icon.setAttribute('focusable', 'false');
                fragment.appendChild(icon);
            }
        });
        node.replaceWith(fragment);
    }
    function convert(root) {
        if (root.nodeType === Node.TEXT_NODE) return convertText(root);
        if (root.nodeType !== Node.ELEMENT_NODE || root.closest(excluded)) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const texts = [];
        while (walker.nextNode()) texts.push(walker.currentNode);
        texts.forEach(convertText);
    }
    convert(document.body);
    new MutationObserver(mutations => {
        const roots = new Set();
        mutations.forEach(mutation => {
            if (mutation.type === 'characterData') roots.add(mutation.target);
            else mutation.addedNodes.forEach(node => roots.add(node));
        });
        roots.forEach(convert);
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
}
if (typeof document !== 'undefined') initializeazaPictogrameSite();
