const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
function router() {
    const disclosures = {};
    const pages = ['elevi','profesori','scoala-altfel','quiz','carti','literatura','ajutor','revista','teste-bareme'].map(key => {
        const details = { open: false };
        disclosures[key] = details;
        return { id: 'pagina-' + key, querySelectorAll: () => details.open ? [details] : [], classList: { toggle() {} } };
    });
    const menu = { open: true };
    const category = { open: false, matches: () => true, scrollIntoView() {} };
    const ctx = vm.createContext({ document: { querySelectorAll: selector => selector === '.pagina' ? pages : selector === 'nav details[open]' ? [menu] : [], getElementById: id => id === 'rezumate-literare' ? category : null }, window: { location: { hash: '' }, scrollTo() {}, requestAnimationFrame: fn => fn() } });
    vm.runInContext(read('js/layout/education-config.js'), ctx);
    vm.runInContext(read('js/init.js').split('window.addEventListener("hashchange"')[0], ctx);
    return { ctx, disclosures, menu, category };
}
test('leaving and returning closes accordions across public pages, including books and answers', () => {
    const { ctx, disclosures, menu } = router();
    for (const route of ['elevi','profesori','scoala-altfel','quiz','carti','literatura','ajutor','revista','teste-bareme']) {
        ctx.afiseazaPagina('#' + route);
        disclosures[route].open = true;
        ctx.afiseazaPagina('#acasa');
        assert.equal(disclosures[route].open, false, route);
        ctx.afiseazaPagina('#' + route);
        assert.equal(disclosures[route].open, false, route);
    }
    assert.equal(menu.open, false);
});
test('within-page navigation retains disclosures and an explicit category link opens its target', () => {
    const { ctx, disclosures, category } = router();
    ctx.afiseazaPagina('#elevi');
    disclosures.elevi.open = true;
    ctx.afiseazaPagina('#rezumate-literare');
    assert.equal(disclosures.elevi.open, true);
    assert.equal(category.open, true);
});
