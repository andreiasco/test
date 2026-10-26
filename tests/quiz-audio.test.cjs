const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const code = fs.readFileSync(path.join(__dirname, '../js/site/quiz-audio.js'), 'utf8');

function load({ unsupported = false } = {}) {
    const contexts = [];
    const listeners = new Map();
    const document = { hidden: false, addEventListener: (name, fn) => listeners.set(name, fn) };
    function param() {
        return { value: 0, setValueAtTime(value) { this.value = value; },
            exponentialRampToValueAtTime(value) { this.value = value; }, cancelScheduledValues() {} };
    }
    class Node {
        constructor() { this.connections = []; }
        connect(target) { this.connections.push(target); return target; }
        disconnect() { this.connections.length = 0; }
    }
    class Source extends Node {
        constructor(context) {
            super(); this.context = context; this.frequency = param(); this.stopAt = Infinity;
            this.started = false; this.ended = false;
        }
        start(at = this.context.currentTime) { this.started = true; this.startAt = at; }
        stop(at = this.context.currentTime) {
            if (this.ended) throw new Error('Source already ended');
            this.stopAt = at;
            if (at <= this.context.currentTime) { this.ended = true; this.onended?.(); }
        }
    }
    class AudioContext {
        constructor() {
            this.currentTime = 3; this.sampleRate = 8000; this.state = 'running';
            this.destination = new Node(); this.sources = []; this.gains = []; this.panners = [];
            this.resumeCalls = 0; this.suspendCalls = 0; contexts.push(this);
        }
        createGain() { const node = new Node(); node.gain = param(); this.gains.push(node); return node; }
        createDynamicsCompressor() {
            const node = new Node();
            for (const key of ['threshold', 'knee', 'ratio', 'attack', 'release']) node[key] = param();
            return node;
        }
        createConvolver() { return new Node(); }
        createBiquadFilter() { const node = new Node(); node.frequency = param(); node.Q = param(); return node; }
        createStereoPanner() { const node = new Node(); node.pan = param(); this.panners.push(node); return node; }
        createBuffer(channels, length) {
            const data = Array.from({ length: channels }, () => new Float32Array(length));
            return { getChannelData: channel => data[channel] };
        }
        createOscillator() { const source = new Source(this); this.sources.push(source); return source; }
        createBufferSource() { const source = new Source(this); this.sources.push(source); return source; }
        resume() { this.resumeCalls++; return Promise.resolve().then(() => { this.state = 'running'; }); }
        suspend() { this.suspendCalls++; return Promise.resolve().then(() => { this.state = 'suspended'; }); }
    }
    const window = unsupported ? {} : { AudioContext };
    vm.runInNewContext(code, { window, document, Math, Infinity });
    return { audio: window.CastleQuizAudio, contexts, document, visibility: () => listeners.get('visibilitychange')() };
}

test('audio is not created on page load and remains silent while disabled', () => {
    const { audio, contexts } = load();
    assert.equal(contexts.length, 0);
    audio.setEnabled(false);
    audio.steps(); audio.door(); audio.monster(true); audio.ambience(true); audio.correct();
    audio.swing(); audio.impact(); audio.impact('shield'); audio.armour();
    assert.equal(contexts.length, 0);
});

test('mute stops scheduled footsteps and all active sounds immediately', () => {
    const { audio, contexts } = load();
    audio.steps(8, 0.4); audio.correct(); audio.ambience(true);
    const context = contexts[0];
    assert.ok(context.sources.some(source => source.startAt > context.currentTime));
    const count = context.sources.length;
    audio.setEnabled(false);
    assert.ok(context.sources.every(source => source.ended));
    assert.equal(context.gains[0].gain.value, 0);
    audio.setEnabled(true);
    assert.equal(context.sources.length, count, 'unmuting does not restart stale sounds');
});

test('restarting ambience replaces the old sound bed instead of accumulating loops', () => {
    const { audio, contexts } = load();
    audio.ambience(true);
    const context = contexts[0];
    const first = context.sources.slice();
    const initialActive = first.filter(source => !source.ended).length;
    audio.ambience(true);
    assert.ok(first.every(source => source.ended));
    assert.equal(context.sources.filter(source => !source.ended).length, initialActive);
    audio.ambience(false);
    assert.ok(context.sources.every(source => source.ended));
    audio.victory();
    assert.ok(context.sources.some(source => !source.ended), 'the end cue works after ambience stops');
});

test('skipping movement cancels footsteps without cutting a separate feedback cue', () => {
    const { audio, contexts } = load();
    audio.steps(6, 0.35);
    const footsteps = contexts[0].sources.slice();
    audio.correct();
    const feedback = contexts[0].sources.slice(footsteps.length);
    audio.stopSteps();
    assert.ok(footsteps.every(source => source.ended));
    assert.ok(feedback.length > 0 && feedback.every(source => !source.ended));
});

test('individual footsteps alternate spatial placement and a new quiz starts from the first foot', () => {
    const { audio, contexts } = load();
    audio.footstep(); audio.footstep(); audio.footstep();
    const context = contexts[0];
    const positions = context.panners.map(node => node.pan.value);
    assert.ok(positions[0] < 0 && positions[2] > 0);
    assert.equal(positions[0], positions[1], 'impact and friction belong to the same foot');
    assert.equal(positions[0], positions[4], 'the third footfall returns to the first side');
    assert.equal(context.sources.length, 6);
    audio.dispose();
    audio.footstep();
    assert.equal(context.panners[6].pan.value, positions[0], 'dispose resets the first foot');
    audio.dispose();
});

test('animation-driven footsteps are not queued while the audio clock is suspended', async () => {
    const { audio, contexts } = load();
    const context = audio.ensure();
    context.state = 'suspended';
    audio.footstep(); audio.footstep(); audio.footstep();
    assert.equal(context.sources.length, 0);
    await Promise.resolve();
    assert.equal(context.state, 'running');
    assert.equal(context.sources.length, 0, 'unlocking does not replay past gait events');
    audio.footstep();
    assert.equal(context.sources.length, 2);
    assert.equal(contexts.length, 1);
    audio.dispose();
});

test('combat contacts do not queue while the audio clock is suspended', async () => {
    const { audio } = load();
    const context = audio.ensure();
    context.state = 'suspended';
    audio.swing(); audio.impact(); audio.impact('shield'); audio.armour();
    assert.equal(context.sources.length, 0);
    await Promise.resolve();
    assert.equal(context.sources.length, 0, 'unlocking never replays previous combat');
    audio.swing(); audio.impact(); audio.impact('shield'); audio.armour();
    assert.ok(context.sources.length > 0, 'fresh contacts play after the gesture unlock');
    assert.ok(context.sources.every(source => Number.isFinite(source.stopAt)), 'combat has no looping source');
    audio.dispose();
});

test('skipping combat cancels its sources and preserves feedback and ambience', () => {
    const { audio, contexts } = load();
    audio.swing(); audio.impact(); audio.impact('shield'); audio.armour();
    const context = contexts[0];
    const combat = context.sources.slice();
    audio.correct(); audio.wrong(); audio.ambience(true);
    const independent = context.sources.slice(combat.length);
    audio.stopCombat();
    assert.ok(combat.length > 0 && combat.every(source => source.ended));
    assert.ok(combat.every(source => source.connections.length === 0));
    assert.ok(independent.length > 0 && independent.every(source => !source.ended));
    audio.dispose();
});

test('mute, hidden pages and disposal silence combat without replaying it on return', async () => {
    for (const boundary of ['mute', 'hidden', 'dispose']) {
        const { audio, contexts, document, visibility } = load();
        audio.swing(); audio.impact(); audio.impact('shield'); audio.armour();
        const context = contexts[0];
        const count = context.sources.length;
        if (boundary === 'mute') audio.setEnabled(false);
        else if (boundary === 'hidden') { document.hidden = true; visibility(); }
        else audio.dispose();
        assert.ok(context.sources.every(source => source.ended), boundary);
        assert.equal(context.gains[0].gain.value, 0, `${boundary} also silences room reflections`);
        if (boundary === 'mute') audio.setEnabled(true);
        else if (boundary === 'hidden') { document.hidden = false; visibility(); }
        else audio.ensure();
        await Promise.resolve();
        assert.equal(context.sources.length, count, `${boundary} never restarts a prior contact`);
        audio.dispose();
    }
});

test('repeated combat remains bounded and ended layers release their audio graph', () => {
    const { audio, contexts } = load();
    for (let i = 0; i < 100; i++) { audio.swing(); audio.impact(); audio.armour(); }
    const context = contexts[0];
    const active = context.sources.filter(source => !source.ended);
    assert.ok(active.length > 0 && active.length < 100, 'a burst cannot accumulate hundreds of live voices');
    for (const source of active) {
        const output = source.connections[0];
        source.ended = true;
        source.onended();
        assert.equal(source.connections.length, 0, 'ended source disconnects');
        assert.equal(output.connections.length, 0, 'owned gain/filter disconnects');
        assert.equal(source.onended, null, 'ended source releases its callback');
    }
    assert.ok(context.panners.every(node => node.connections.length === 0), 'owned panners disconnect');
    audio.stopCombat();
    assert.ok(context.sources.every(source => source.ended));
    audio.impact('shield');
    assert.ok(context.sources.some(source => !source.ended), 'cleanup preserves future contacts');
    audio.dispose();
});

test('leaving the quiz releases its voices and can resume the same context without stale audio', async () => {
    const { audio, contexts } = load();
    audio.ambience(true); audio.steps(); audio.monster(true);
    const context = contexts[0];
    const count = context.sources.length;
    audio.dispose();
    assert.ok(context.sources.every(source => source.ended));
    assert.equal(context.suspendCalls, 1);
    audio.ensure();
    await Promise.resolve();
    assert.equal(contexts.length, 1, 'reopening does not allocate another AudioContext');
    assert.equal(context.state, 'running');
    assert.equal(context.sources.length, count);
});

test('hidden pages stop effects and only restore the requested ambience when visible', () => {
    const { audio, contexts, document, visibility } = load();
    audio.ambience(true); audio.steps();
    const previous = contexts[0].sources.slice();
    document.hidden = true; visibility();
    assert.ok(previous.every(source => source.ended));
    assert.equal(contexts[0].gains[0].gain.value, 0, 'hiding also silences the room reverb tail');
    audio.door(); audio.correct();
    assert.equal(contexts[0].sources.length, previous.length);
    document.hidden = false; visibility();
    assert.ok(contexts[0].sources.length > previous.length);
    assert.ok(previous.every(source => source.ended), 'old movement is not replayed on return');
    audio.dispose();
});

test('duplicate door calls from the quiz and scene produce one door event', () => {
    const { audio, contexts } = load();
    audio.door();
    const first = contexts[0].sources.length;
    audio.door();
    assert.equal(contexts[0].sources.length, first);
    contexts[0].currentTime += 1;
    audio.door();
    assert.ok(contexts[0].sources.length > first);
});

test('browsers without Web Audio still support quiz controls', () => {
    const { audio } = load({ unsupported: true });
    assert.equal(audio.ensure(), null);
    for (const method of ['footstep', 'steps', 'door', 'monster', 'swing', 'impact', 'armour', 'stopCombat', 'correct', 'wrong', 'victory', 'gameOver', 'click', 'tick', 'dispose']) {
        assert.doesNotThrow(() => audio[method]());
    }
});
