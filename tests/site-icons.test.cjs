const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function context() {
    const ctx = vm.createContext({});
    vm.runInContext(read('js/layout/catalog-pages.js'), ctx);
    vm.runInContext(read('js/site/icons.js'), ctx);
    return ctx;
}
function files(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(item => item.isDirectory() ? files(path.join(dir, item.name)) : [path.join(dir, item.name)]);
}
test('every existing UI emoji has an SVG equivalent in the shared icon family', () => {
    const ctx = context();
    const icons = vm.runInContext('SITE_EMOJI_ICONS', ctx);
    for (const file of files(path.join(root, 'js')).filter(file => file.endsWith('.js') && !file.endsWith('icons.js'))) {
        const text = fs.readFileSync(file, 'utf8');
        for (const [emoji] of text.matchAll(/[\u{1F000}-\u{1FAFF}\u2600-\u27ff\u2300-\u23ff](?:\uFE0F)?/gu)) {
            const icon = icons.get(emoji.replace(/\uFE0F/g, ''));
            assert.ok(icon, `${file}: no icon for ${emoji}`);
            const svg = ctx.almaIcon(icon.name);
            assert.ok(svg.includes('stroke-width="1.7"'));
            assert.equal(vm.runInContext(`Boolean(ALMA_ICONS[${JSON.stringify(icon.name)}])`, ctx), true);
        }
    }
});
test('icon conversion retains labels, supports variation selectors and distinguishes lives and sound states', () => {
    const ctx = context();
    const parts = ctx.fragmentePictograme('📄 Descarcă rezumatul Word');
    assert.equal(parts[0].name, 'file');
    assert.equal(parts[1], ' Descarcă rezumatul Word');
    assert.equal(ctx.fragmentePictograme('❤️')[0].name, 'heart');
    assert.equal(ctx.fragmentePictograme('🖤')[0].name, 'heartEmpty');
    assert.equal(ctx.fragmentePictograme('🔊')[0].name, 'sound');
    assert.equal(ctx.fragmentePictograme('🔇')[0].name, 'muted');
    assert.equal(ctx.fragmentePictograme('Text fără pictograme')[0], 'Text fără pictograme');
});
test('both site entry points initialize shared icons after assembling the layout', () => {
    for (const file of ['index.html', 'admin.html']) {
        const html = read(file);
        assert.ok(html.indexOf('js/site/icons.js') > html.indexOf('js/core/layout.js'));
    }
});
