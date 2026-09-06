// Motor audio procedural pentru quiz. Nu necesită fișiere audio externe.
window.CastleQuizAudio = (() => {
    let ctx = null;
    let master = null;
    let ambienceTimer = null;
    let enabled = true;

    function ensure() {
        if (!enabled) return null;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        if (!ctx) {
            ctx = new AC();
            master = ctx.createGain();
            master.gain.value = 0.18;
            master.connect(ctx.destination);
        }
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
        return ctx;
    }

    function tone(freq = 220, duration = 0.12, type = "sine", volume = 0.16, slideTo = null, delay = 0) {
        const c = ensure(); if (!c || !master) return;
        const now = c.currentTime + delay;
        const osc = c.createOscillator(); const gain = c.createGain();
        osc.type = type; osc.frequency.setValueAtTime(Math.max(30, freq), now);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), now + duration);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(gain); gain.connect(master); osc.start(now); osc.stop(now + duration + 0.03);
    }

    function noise(duration = 0.18, volume = 0.08, delay = 0) {
        const c = ensure(); if (!c || !master) return;
        const length = Math.max(1, Math.floor(c.sampleRate * duration));
        const buffer = c.createBuffer(1, length, c.sampleRate); const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
        const source = c.createBufferSource(); const gain = c.createGain();
        source.buffer = buffer; gain.gain.value = volume; source.connect(gain); gain.connect(master); source.start(c.currentTime + delay);
    }

    function steps(count = 8, interval = 0.36) { for (let i = 0; i < count; i++) { tone(82 + (i % 2) * 14, 0.07, "triangle", 0.09, 55, i * interval); noise(0.045, 0.035, i * interval); } }
    function door() { tone(78, 0.55, "sawtooth", 0.10, 42); noise(0.55, 0.055); }
    function monster(boss = false) { tone(boss ? 72 : 105, boss ? 0.95 : 0.48, "sawtooth", boss ? 0.16 : 0.10, boss ? 38 : 62); if (boss) { tone(145, 0.6, "square", 0.06, 70, 0.15); noise(0.8, 0.06); } }
    function correct() { tone(523, 0.12, "sine", 0.11); tone(659, 0.14, "sine", 0.12, null, 0.11); tone(784, 0.22, "sine", 0.13, null, 0.23); }
    function wrong() { tone(180, 0.2, "square", 0.12, 110); tone(92, 0.28, "sawtooth", 0.08, 55, 0.12); }
    function victory() { [523,659,784,1047].forEach((f,i)=>tone(f,0.32,"sine",0.12,null,i*0.14)); }
    function gameOver() { [220,174,130,98].forEach((f,i)=>tone(f,0.34,"triangle",0.10,null,i*0.18)); }
    function click() { tone(420, 0.05, "sine", 0.05); }
    function tick() { tone(840, 0.035, "square", 0.035); }

    function ambience(on = true) {
        if (ambienceTimer) clearInterval(ambienceTimer); ambienceTimer = null;
        if (!on || !enabled) return;
        ensure();
        ambienceTimer = setInterval(() => {
            if (document.hidden) return;
            tone(55 + Math.random() * 12, 1.6, "sine", 0.018, 42);
            if (Math.random() > 0.55) noise(0.45, 0.012, 0.3);
        }, 2600);
    }

    function setEnabled(value) { enabled = Boolean(value); if (!enabled) ambience(false); else ensure(); }
    function dispose() { ambience(false); }
    return { ensure, steps, door, monster, correct, wrong, victory, gameOver, click, tick, ambience, setEnabled, dispose };
})();
