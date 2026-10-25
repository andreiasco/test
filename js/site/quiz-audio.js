// Ambianță și efecte procedurale pentru castel. Fără descărcări audio.
window.CastleQuizAudio = (() => {
    let ctx = null, master = null, room = null, noiseBuffer = null;
    let enabled = true, ambienceWanted = false, lastDoorAt = -Infinity;
    let suspendedByDispose = false;
    let nextFootLeft = true;
    const voices = new Set();
    const MAX_VOICES = 64;

    function audible() { return enabled && !document.hidden; }
    function cleanVoice(voice) {
        if (!voices.delete(voice)) return;
        voice.source.onended = null;
        voice.source.disconnect();
        voice.nodes.forEach(node => node.disconnect());
    }
    function track(source, nodes, kind = "effect") {
        if (voices.size >= MAX_VOICES) stopVoice(voices.values().next().value);
        const voice = { source, nodes, kind };
        voices.add(voice);
        source.onended = () => cleanVoice(voice);
        return voice;
    }
    function stopVoice(voice) {
        if (!voice) return;
        try { voice.source.stop(ctx.currentTime); } catch (_) { /* Deja încheiat. */ }
        cleanVoice(voice);
    }
    function stopKind(kind) { [...voices].filter(voice => voice.kind === kind).forEach(stopVoice); }
    function stopAll() { [...voices].forEach(stopVoice); }

    function ensure() {
        if (!enabled) return null;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        if (!ctx || ctx.state === "closed") {
            if (ctx) stopAll();
            ctx = new AC();
            lastDoorAt = -Infinity;
            master = ctx.createGain();
            master.gain.value = 0.2;
            if (ctx.createDynamicsCompressor) {
                const limiter = ctx.createDynamicsCompressor();
                limiter.threshold.value = -18;
                limiter.knee.value = 12;
                limiter.ratio.value = 4;
                limiter.attack.value = 0.006;
                limiter.release.value = 0.18;
                master.connect(limiter); limiter.connect(ctx.destination);
            } else master.connect(ctx.destination);

            // Reflexii timpurii și o coadă scurtă, filtrată, de încăpere din piatră.
            room = ctx.createConvolver();
            const impulse = ctx.createBuffer(2, Math.ceil(ctx.sampleRate * 0.85), ctx.sampleRate);
            for (let channel = 0; channel < 2; channel++) {
                const data = impulse.getChannelData(channel);
                for (let i = 0; i < data.length; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3.2) * 0.18;
                }
                [0.047, 0.091, 0.163].forEach((time, index) => {
                    data[Math.floor((time + channel * 0.006) * ctx.sampleRate)] += 0.48 / (index + 1);
                });
            }
            room.buffer = impulse;
            const damp = ctx.createBiquadFilter();
            damp.type = "lowpass"; damp.frequency.value = 2200;
            const roomLevel = ctx.createGain();
            roomLevel.gain.value = 0.23;
            room.connect(damp); damp.connect(roomLevel); roomLevel.connect(master);

            noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
            const data = noiseBuffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        }
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(0.2, ctx.currentTime);
        if (suspendedByDispose || ctx.state === "suspended") {
            suspendedByDispose = false;
            ctx.resume().catch(() => {});
        }
        return ctx;
    }

    function route(gain, pan = 0, reflection = 0.24) {
        const nodes = [gain];
        let output = gain;
        if (ctx.createStereoPanner) {
            const panner = ctx.createStereoPanner();
            panner.pan.value = pan;
            gain.connect(panner); output = panner; nodes.push(panner);
        }
        output.connect(master);
        const send = ctx.createGain();
        send.gain.value = reflection;
        output.connect(send); send.connect(room); nodes.push(send);
        return nodes;
    }

    function tone(frequency, duration, volume, { type = "sine", slide = null, delay = 0, pan = 0, kind = "effect", reflection = 0.24 } = {}) {
        if (!audible()) return;
        const c = ensure(); if (!c) return;
        const at = c.currentTime + delay;
        const oscillator = c.createOscillator();
        const gain = c.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(Math.max(30, frequency), at);
        if (slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, slide), at + duration);
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), at + Math.min(0.018, duration * 0.25));
        gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
        oscillator.connect(gain);
        track(oscillator, route(gain, pan, reflection), kind);
        oscillator.start(at); oscillator.stop(at + duration + 0.025);
    }

    function noise(duration, volume, { delay = 0, frequency = 700, filterType = "bandpass", pan = 0, kind = "effect", reflection = 0.28, loop = false } = {}) {
        if (!audible()) return null;
        const c = ensure(); if (!c) return null;
        const at = c.currentTime + delay;
        const source = c.createBufferSource();
        source.buffer = noiseBuffer; source.loop = true;
        const filter = c.createBiquadFilter();
        filter.type = filterType; filter.frequency.value = frequency; filter.Q.value = 0.65;
        const gain = c.createGain();
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(volume, at + (loop ? 0.7 : Math.min(0.012, duration * 0.2)));
        if (!loop) gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
        source.connect(filter); filter.connect(gain);
        track(source, [filter, ...route(gain, pan, reflection)], kind);
        source.start(at, Math.random() * 2);
        if (!loop) source.stop(at + duration + 0.025);
        return gain;
    }

    function stopSteps() { stopKind("step"); }
    function playFootstep(delay = 0) {
        if (!audible()) return;
        const pan = nextFootLeft ? -0.19 : 0.19;
        nextFootLeft = !nextFootLeft;
        // Talpa lovește piatra, urmată de o frecare scurtă; fiecare pas diferă ușor.
        tone(78 + Math.random() * 18, 0.1 + Math.random() * 0.025, 0.11 + Math.random() * 0.025,
            { slide: 44 + Math.random() * 8, delay, pan, kind: "step", reflection: 0.32 });
        noise(0.065 + Math.random() * 0.02, 0.055 + Math.random() * 0.018,
            { frequency: 580 + Math.random() * 400, delay: delay + 0.012, pan, kind: "step" });
    }
    function footstep() {
        if (!audible()) return;
        const c = ensure();
        // Într-un context blocat de autoplay, ceasul audio nu înaintează.
        // Pașii declanșați de animație nu trebuie strânși pentru redare simultană.
        if (!c || c.state !== "running") return;
        playFootstep();
    }
    function steps(count = 8, interval = 0.36) {
        stopSteps();
        if (!audible()) return;
        const total = Math.max(0, Math.min(24, Math.floor(Number(count) || 0)));
        const spacing = Math.max(0.2, Math.min(1, Number(interval) || 0.36));
        for (let i = 0; i < total; i++) {
            const delay = i * spacing + (i ? Math.random() * 0.018 : 0);
            playFootstep(delay);
        }
    }
    function door() {
        if (!audible()) return;
        const c = ensure(); if (!c || c.currentTime - lastDoorAt < 0.3) return;
        lastDoorAt = c.currentTime;
        noise(0.65, 0.065, { frequency: 310, reflection: 0.36 });
        tone(84, 0.58, 0.045, { type: "triangle", slide: 51, reflection: 0.32 });
        tone(57, 0.16, 0.12, { delay: 0.48, slide: 38 });
        noise(0.1, 0.045, { delay: 0.49, frequency: 520 });
    }
    function monster(boss = false) {
        noise(boss ? 0.95 : 0.48, boss ? 0.11 : 0.065, { frequency: boss ? 220 : 360, reflection: 0.33 });
        tone(boss ? 53 : 83, boss ? 0.8 : 0.42, boss ? 0.075 : 0.045,
            { type: "triangle", slide: boss ? 32 : 61, reflection: 0.3 });
    }
    function bell(frequency, delay, volume) {
        tone(frequency, 0.58, volume, { delay, reflection: 0.32 });
        tone(frequency * 2.67, 0.23, volume * 0.18, { delay, reflection: 0.25 });
    }
    function correct() { bell(440, 0, 0.065); bell(660, 0.11, 0.05); }
    function wrong() { tone(116, 0.2, 0.075, { slide: 76 }); noise(0.12, 0.025, { frequency: 430 }); }
    function victory() { [261.63, 329.63, 392, 523.25].forEach((frequency, i) => bell(frequency, i * 0.13, 0.055)); }
    function gameOver() { [196, 155.56, 130.81].forEach((frequency, i) => tone(frequency, 0.5, 0.055, { delay: i * 0.18, type: "triangle" })); }
    function click() { noise(0.025, 0.025, { frequency: 1300, reflection: 0.08 }); }
    function tick() { tone(720, 0.035, 0.018, { reflection: 0.06 }); }

    function ambience(on = true) {
        ambienceWanted = Boolean(on);
        stopKind("ambient");
        if (!ambienceWanted || !audible()) return;
        const c = ensure(); if (!c) return;
        const windGain = noise(1, 0.025, { frequency: 430, filterType: "lowpass", loop: true, kind: "ambient", reflection: 0.1 });
        const rumble = c.createOscillator();
        const rumbleGain = c.createGain();
        rumble.type = "sine"; rumble.frequency.value = 46;
        rumbleGain.gain.value = 0.013;
        rumble.connect(rumbleGain);
        track(rumble, route(rumbleGain, 0, 0.08), "ambient"); rumble.start();
        if (windGain) {
            const breeze = c.createOscillator();
            const depth = c.createGain();
            breeze.frequency.value = 0.11; depth.gain.value = 0.007;
            breeze.connect(depth); depth.connect(windGain.gain);
            track(breeze, [depth], "ambient"); breeze.start();
        }
    }
    function setEnabled(value) {
        enabled = Boolean(value);
        if (!enabled) {
            ambience(false); stopAll();
            if (master && ctx) {
                master.gain.cancelScheduledValues(ctx.currentTime);
                master.gain.setValueAtTime(0, ctx.currentTime);
            }
        } else ensure();
    }
    function dispose() {
        ambience(false); stopAll(); lastDoorAt = -Infinity; nextFootLeft = true;
        if (master && ctx) {
            master.gain.cancelScheduledValues(ctx.currentTime);
            master.gain.setValueAtTime(0, ctx.currentTime);
            suspendedByDispose = true;
            ctx.suspend().catch(() => {});
        }
    }
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stopAll();
            if (master && ctx) {
                master.gain.cancelScheduledValues(ctx.currentTime);
                master.gain.setValueAtTime(0, ctx.currentTime);
            }
        }
        else if (ambienceWanted && enabled && ctx) ambience(true);
    });
    return { ensure, footstep, steps, stopSteps, door, monster, correct, wrong, victory, gameOver, click, tick, ambience, setEnabled, dispose };
})();
