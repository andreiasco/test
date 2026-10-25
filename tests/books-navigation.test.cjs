const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const escapeHTML = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const almaIcon = name => `<svg data-icon="${name}"></svg>`;

test('book library sorts titles and reuses every author-view resource', () => {
    const list = { innerHTML: '' };
    const context = vm.createContext({ escapeHTML, almaIcon, document: { getElementById: () => list }, window: { location: { hash: '#carti' } } });
    vm.runInContext(read('js/site/authors.js'), context);
    const book = { id: 42, autor_id: 7, titlu: 'Zmeul', pdf: 'rezumat.pdf', pdf_analiza_literara: 'analiza.pdf', pdf_valori_morale: 'valori.pdf', pdf_caracterizare: 'personaje.pdf', rezumat_word: 'rezumat.docx', link_film: 'https://example.org/film', link_audiobook: 'https://example.org/audio', link_test_lectura: 'https://example.org/test', personaje_instagram: 'instagram.pdf' };
    context.randareBibliotecaCarti([{ id: 7, nume: 'Autor', descriere: 'Biografie', categorie: 'proza' }], [book, { id: 43, autor_id: 7, titlu: 'Alba' }]);
    assert.ok(list.innerHTML.indexOf('Alba') < list.innerHTML.indexOf('Zmeul'));
    assert.ok(list.innerHTML.includes(context.randareResurseOpera(book)));
    assert.match(list.innerHTML, /Biografie/);
    assert.match(list.innerHTML, /Nu sunt încă disponibile resurse/);
    assert.match(list.innerHTML, /id="carte-42"/);
    assert.equal((list.innerHTML.match(/id="carti-gen-proza"/g) || []).length, 1);
    assert.ok(!list.innerHTML.includes('class="alma-eyebrow"'));
});

test('direct book route opens and focuses the matching work after data renders', () => {
    const details = { open: false };
    let scrolled = false, focused = false;
    const card = { querySelector: () => details, scrollIntoView() { scrolled = true; }, focus() { focused = true; } };
    const list = { innerHTML: '' };
    const context = vm.createContext({ escapeHTML, almaIcon, document: { getElementById: id => id === 'listaCarti' ? list : id === 'carte-42' ? card : null }, window: { location: { hash: '#carte-42' } } });
    vm.runInContext(read('js/site/authors.js'), context);
    context.randareBibliotecaCarti([], [{ id: 42, titlu: 'Carte' }]);
    assert.ok(details.open && scrolled && focused);
});

test('search result for a book selects its own route without querying its author', async () => {
    const elements = { searchInput: { value: 'carte' }, searchResults: { classList: { remove() {} }, innerHTML: '' }, searchToggle: { setAttribute() {} } };
    let route;
    const context = vm.createContext({ document: { addEventListener() {}, getElementById: id => elements[id], querySelector: () => ({ classList: { add() {} } }) }, window: { location: { hash: '' } }, afiseazaPagina: value => { route = value; } });
    vm.runInContext(read('js/site/search-map.js'), context);
    await context.deschideRezultatCautare('Operă', 7, 42);
    assert.equal(route, '#carte-42');
    assert.equal(context.window.location.hash, '#carte-42');
    assert.equal(elements.searchInput.value, '');
});

test('author search opens the matching author popup even on the same page', async () => {
    const card = { innerHTML: '<h3>Autor căutat</h3>', scrollIntoView() {} };
    const content = { innerHTML: '' };
    let opened = false;
    const modal = { classList: { remove() { opened = true; } } };
    const context = vm.createContext({
        document: {
            addEventListener() {}, querySelectorAll: () => [], querySelector: () => null,
            getElementById: id => ({ 'autor-7': card, autorPopupContent: content, autorPopupModal: modal })[id],
            body: { style: {} }
        },
        window: { location: { hash: '#literatura' }, requestAnimationFrame: fn => fn() },
        afiseazaPagina() {}
    });
    vm.runInContext(read('js/site/search-map.js'), context);
    await context.deschideRezultatCautare('Autor', 7, '');
    assert.ok(opened);
    assert.equal(content.innerHTML, card.innerHTML);
    assert.equal(context.document.body.style.overflow, 'hidden');
});
