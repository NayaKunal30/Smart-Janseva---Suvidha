import { useState, useCallback, useEffect, useRef } from 'react';

export function useAccessibility() {
    const [highContrast, setHighContrast] = useState(() => localStorage.getItem('sj-high-contrast') === '1');
    const [screenReader, setScreenReader] = useState(() => localStorage.getItem('sj-screen-reader') === '1');
    const [seniorMode, setSeniorMode] = useState(() => localStorage.getItem('sj-senior-mode') === '1');
    const lastSpokenRef = useRef<string>('');

    const toggleHighContrast = useCallback(() => {
        setHighContrast((prev) => {
            const next = !prev;
            localStorage.setItem('sj-high-contrast', next ? '1' : '0');
            document.documentElement.classList.toggle('high-contrast', next);
            return next;
        });
    }, []);

    const toggleScreenReader = useCallback(() => {
        setScreenReader((prev) => {
            const next = !prev;
            localStorage.setItem('sj-screen-reader', next ? '1' : '0');
            if (next) {
                speak('Screen reader enabled');
            } else {
                window.speechSynthesis.cancel();
            }
            return next;
        });
    }, []);

    const toggleSeniorMode = useCallback(() => {
        const next = !seniorMode;
        setSeniorMode(next);
        localStorage.setItem('sj-senior-mode', next ? '1' : '0');
        window.dispatchEvent(new CustomEvent('sj-mode-change'));
        return next;
    }, [seniorMode]);

    const speak = useCallback((text: string) => {
        if (!text || !('speechSynthesis' in window)) return;

        // Don't repeat the same text immediately
        if (text === lastSpokenRef.current && window.speechSynthesis.speaking) return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        // Try to detect language or default to English/Hindi
        const lang = document.documentElement.lang || 'en-IN';
        utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';

        utterance.rate = 0.9;
        utterance.pitch = 1;

        lastSpokenRef.current = text;
        window.speechSynthesis.speak(utterance);
    }, []);

    useEffect(() => {
        // Apply initial classes
        document.documentElement.classList.toggle('high-contrast', highContrast);
        document.documentElement.classList.toggle('sj-senior-mode', seniorMode);

        if (!screenReader) return;

        const handleFocus = (e: FocusEvent) => {
            if (!screenReader) return;
            const target = e.target as HTMLElement;
            const text = target.ariaLabel || target.title || target.innerText || target.getAttribute('placeholder');
            if (text) speak(text);
        };

        const handleTouch = (e: TouchEvent) => {
            if (!screenReader) return;
            const target = e.target as HTMLElement;
            const text = target.ariaLabel || target.title || target.innerText || target.getAttribute('placeholder');
            if (text) speak(text);
        };

        window.addEventListener('focusin', handleFocus);
        window.addEventListener('touchstart', handleTouch);

        return () => {
            window.removeEventListener('focusin', handleFocus);
            window.removeEventListener('touchstart', handleTouch);
        };
    }, [highContrast, screenReader, speak]);

    return {
        highContrast,
        screenReader,
        seniorMode,
        toggleHighContrast,
        toggleScreenReader,
        toggleSeniorMode,
        speak
    };
}
