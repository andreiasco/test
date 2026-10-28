// The active game owns one viewport; leaving restores the page's scroll state.
window.QuizViewport = (() => {
    let session = null, frame = null;
    const setClass = (element, name, value) => {
        if (element.classList.contains(name) !== value) element.classList.toggle(name, value);
    };
    const visible = element => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
    function otherOverlay(player) {
        return [...document.querySelectorAll('#aiAssistant,[aria-modal="true"],[role="dialog"]')]
            .some(element => element !== player && !element.contains(player) && !player.contains(element) && visible(element));
    }
    function onKeyDown(event) {
        if (!session || event.defaultPrevented || otherOverlay(session.player)) return;
        const player = session.player;
        if (event.key === 'Escape') {
            event.preventDefault(); player.querySelector('#quizCloseButton')?.click(); return;
        }
        if (event.key !== 'Tab') return;
        const items = [...player.querySelectorAll('button,a[href],input,select,textarea,summary,[tabindex]:not([tabindex="-1"])')]
            .filter(element => !element.disabled && element.getAttribute('aria-disabled') !== 'true' && visible(element));
        if (!items.length) { event.preventDefault(); player.focus({ preventScroll: true }); return; }
        const first = items[0], last = items[items.length - 1], active = document.activeElement;
        if (!player.contains(active) || event.shiftKey && active === first || !event.shiftKey && active === last) {
            event.preventDefault(); (event.shiftKey ? last : first).focus({ preventScroll: true });
        }
    }
    function refresh() {
        if (!session || frame !== null) return;
        frame = requestAnimationFrame(() => {
            frame = null;
            if (!session) return;
            const player = session.player, viewport = window.visualViewport;
            player.style.setProperty('--quiz-viewport-height', `${Math.round(viewport?.height || window.innerHeight)}px`);
            player.style.setProperty('--quiz-viewport-top', `${Math.round(viewport?.offsetTop || 0)}px`);
            const result = player.querySelector('#quizRezultat');
            const stage = player.querySelector('#quizQuestionStage');
            setClass(player, 'quiz-view-result', Boolean(result && !result.classList.contains('ascuns')));
            setClass(player, 'quiz-view-feedback', Boolean(player.querySelector('#quizNextButton')));
            setClass(player, 'quiz-view-map', Boolean(stage?.hidden));
            for (const prompt of player.querySelectorAll('.quiz-question-card > h3')) {
                const scrollable = prompt.scrollHeight > prompt.clientHeight + 1;
                if (scrollable) prompt.setAttribute('tabindex', '0'); else prompt.removeAttribute('tabindex');
            }
        });
    }
    function leave() {
        if (!session) return;
        const { player, overflow, rootOverflow, observer, focus, attributes } = session;
        session = null;
        if (frame !== null) cancelAnimationFrame(frame); frame = null;
        observer.disconnect();
        window.removeEventListener('resize', refresh);
        window.visualViewport?.removeEventListener('resize', refresh);
        window.visualViewport?.removeEventListener('scroll', refresh);
        document.removeEventListener('keydown', onKeyDown);
        document.body.style.overflow = overflow;
        document.documentElement.style.overflow = rootOverflow;
        player.classList.remove('quiz-viewport', 'quiz-view-result', 'quiz-view-feedback', 'quiz-view-map');
        player.style.removeProperty('--quiz-viewport-height'); player.style.removeProperty('--quiz-viewport-top');
        for (const [name, value] of Object.entries(attributes)) {
            if (value === null) player.removeAttribute(name); else player.setAttribute(name, value);
        }
        if (focus?.isConnected && !player.contains(focus)) focus.focus?.({ preventScroll: true });
    }
    function enter(player) {
        if (!player) return;
        if (session?.player === player) { refresh(); return; }
        leave();
        const observer = new MutationObserver(refresh);
        const attributes = Object.fromEntries(['role', 'aria-modal', 'aria-labelledby', 'tabindex'].map(name => [name, player.getAttribute(name)]));
        session = { player, observer, attributes, focus: document.activeElement, overflow: document.body.style.overflow, rootOverflow: document.documentElement.style.overflow };
        document.body.style.overflow = 'hidden'; document.documentElement.style.overflow = 'hidden';
        player.classList.add('quiz-viewport');
        player.setAttribute('role', 'dialog'); player.setAttribute('aria-modal', 'true');
        player.setAttribute('aria-labelledby', 'quizPlayerTitle'); player.setAttribute('tabindex', '-1');
        observer.observe(player, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
        window.addEventListener('resize', refresh);
        window.visualViewport?.addEventListener('resize', refresh);
        window.visualViewport?.addEventListener('scroll', refresh);
        document.addEventListener('keydown', onKeyDown);
        (player.querySelector('#quizCloseButton') || player).focus({ preventScroll: true });
        refresh();
    }
    return { enter, leave, refresh };
})();
