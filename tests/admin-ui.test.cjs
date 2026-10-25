const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createAdmin() {
    const events = {}, inputEvents = {}, observers = [];
    const row = title => ({ hidden: false, matches: () => true, querySelector: () => ({ textContent: title }) });
    const list = { children: [row('Ștefan'), row('Eminescu')] };
    const status = { textContent: '' };
    const input = { value: '', dataset: { adminFilter: 'lista' }, addEventListener: (type, fn) => { inputEvents[type] = fn; } };
    const page = { dataset: { adminPage: 'autori' }, classList: { toggle() {} } };
    const panel = {
        dataset: {}, contains: () => true,
        addEventListener: (type, fn) => { events[type] = fn; },
        querySelectorAll: selector => selector === '[data-admin-page]' ? [page] : selector === '[data-admin-filter]' ? [input] : [],
        querySelector: () => status
    };
    const ctx = vm.createContext({
        document: { readyState: 'complete', getElementById: id => id === 'adminPanel' ? panel : list },
        window: {}, sessionStorage: { getItem: () => null, setItem() {} },
        MutationObserver: class { constructor(fn) { observers.push(fn); } observe() {} }
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/admin/panel-navigation.js'), 'utf8'), ctx);
    return { list, status, input, inputEvents, events, observers, row };
}
test('admin filters ignore accents, survive list refreshes and restore all rows when cleared', () => {
    const { list, input, inputEvents, observers, row, status } = createAdmin();
    input.value = 'stefan'; inputEvents.input();
    assert.deepEqual(list.children.map(row => row.hidden), [false, true]);
    assert.equal(status.textContent, '1 din 2 rezultate');
    list.children = [row('Eminescu'), row('ȘTEFAN')]; observers[0]();
    assert.deepEqual(list.children.map(row => row.hidden), [true, false]);
    input.value = ''; inputEvents.input();
    assert.ok(list.children.every(row => !row.hidden));
    assert.equal(status.textContent, '');
});
test('invalid fields expand all enclosing admin panels before focusing', () => {
    const { events } = createAdmin();
    const outer = { open: false, parentElement: { closest: () => null } };
    const inner = { open: false, parentElement: { closest: () => outer } };
    events.invalid({ target: { closest: () => inner } });
    assert.ok(inner.open && outer.open);
});

test('admin primary navigation mirrors the site and groups all library tools', () => {
    const ctx = vm.createContext({});
    for (const file of ['js/layout/education-config.js', 'js/layout/catalog-pages.js', 'js/layout/admin-panel/shell.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), ctx);
    const primary = vm.runInContext('ADMIN_PRIMARY_NAV', ctx);
    assert.deepEqual(Array.from(primary, item => item.title), ['Resurse elevi', 'Resurse profesori', 'Reviste', 'Jocuri', 'PDF-uri', 'Cont']);
    const groups = vm.runInContext('ADMIN_LIBRARY_NAV', ctx);
    assert.ok(groups.elevi.some(item => item.page === 'autori'));
    assert.ok(groups.elevi.some(item => item.page === 'opere'));
    assert.ok(groups.elevi.some(item => item.page === 'limba'));
    assert.ok(groups.profesori.some(item => item.page === 'limba'));
    assert.equal(groups.profesori.filter(item => item.page.startsWith('resurse-')).length, 6);
});

test('shared language library keeps only the chosen parent group open', () => {
    const subnavs = ['elevi', 'profesori'].map(parent => ({ dataset: { adminSubnav: parent }, hidden: true, querySelectorAll() { return this.tabs; } }));
    const tabs = subnavs.map(subnav => ({ dataset: { adminTab: 'limba' }, classList: { toggle(_, enabled) { this.active = enabled; } }, setAttribute() {}, closest: () => subnav }));
    subnavs.forEach((subnav, index) => { subnav.tabs = [tabs[index]]; });
    const page = { dataset: { adminPage: 'limba' }, classList: { toggle() {} } };
    const panel = { dataset: {}, querySelectorAll: selector => ({ '[data-admin-page]': [page], '[data-admin-tab]': tabs, '[data-admin-subnav]': subnavs, '[data-admin-group]': [] })[selector] || [] };
    const ctx = vm.createContext({ document: { readyState: 'loading', addEventListener() {}, getElementById: () => panel }, window: {}, sessionStorage: { getItem: () => null, setItem() {} } });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/admin/panel-navigation.js'), 'utf8'), ctx);
    ctx.window.activeazaPaginaAdmin('limba', { group: 'profesori', load: false, scroll: false });
    assert.deepEqual(subnavs.map(group => group.hidden), [true, false]);
    assert.deepEqual(tabs.map(tab => tab.classList.active), [false, true]);
    ctx.window.activeazaPaginaAdmin('limba', { group: 'elevi', load: false, scroll: false });
    assert.deepEqual(subnavs.map(group => group.hidden), [false, true]);
});
