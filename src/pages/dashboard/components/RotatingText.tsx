import type { ReactElement } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import './RotatingText.scss';

/**
 * Default marketing taglines used when consumers do not provide a custom text array.
 * Keeping this constant outside the component avoids recreation on every render.
 */
export const DEFAULT_ROTATING_TEXTS: string[] = [
  'Say what you mean… without getting fired.',
  'Your thoughts, but HR-approved.',
  'Convert chaos into corporate calm.',
  "Because ‘WTF’ isn’t email-friendly.",
  'Turn frustration into professionalism 💼',
  'Think it. We’ll corporate it.',
  'From savage to salary-safe.',
];

type RotatingTextProps = {
  texts?: string[];
  interval?: number;
};

const EXIT_PHASE_MS = 190;

/**
 * Displays one line at a time and cycles through provided taglines with a fade/slide animation.
 * @param texts Optional list of taglines to rotate through.
 * @param interval Delay between transitions in milliseconds (default: 2500).
 * @returns Animated rotating text banner or null when no texts are available.
 */
function RotatingText({ texts = DEFAULT_ROTATING_TEXTS, interval = 2500 }: RotatingTextProps): ReactElement | null {
  // Tracks the currently visible item in the rotating sequence.
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  // Keeps the current animation class explicit so the single-line transition remains predictable.
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'exit'>('enter');
  // Stores timer handles to guarantee cleanup on unmount and prevent lag from stacked timers.
  const exitTimeoutRef = useRef<number | null>(null);

  // Normalizes incoming texts by removing blank items to prevent empty animations and flicker.
  const safeTexts = useMemo<string[]>(() => texts.filter((text) => text.trim().length > 0), [texts]);

  useEffect(() => {
    // Resets index and phase when the text source changes so rotation restarts cleanly.
    setCurrentIndex(0);
    setAnimationPhase('enter');
  }, [safeTexts]);

  useEffect(() => {
    // When no text is available, no interval should run and nothing should render.
    if (!safeTexts.length) {
      return undefined;
    }

    const rotationIntervalId = window.setInterval(() => {
      // Starts by fading/sliding out the current line from the reserved text space.
      setAnimationPhase('exit');

      // Switches to next text halfway through so enter transition starts immediately after exit.
      exitTimeoutRef.current = window.setTimeout(() => {
        setCurrentIndex((previousIndex) => (previousIndex + 1) % safeTexts.length);
        setAnimationPhase('enter');
      }, EXIT_PHASE_MS);
    }, interval);

    return () => {
      window.clearInterval(rotationIntervalId);
      // Clears any pending phase timers to prevent delayed updates after unmount.
      if (exitTimeoutRef.current !== null) window.clearTimeout(exitTimeoutRef.current);
    };
  }, [interval, safeTexts]);

  if (!safeTexts.length) {
    return null;
  }

  return (
    <div className="rotating-text" aria-live="polite">
      {/* Single-line renderer avoids overlap issues while preserving slide + fade animation. */}
      <p className={`rotating-text__line ${animationPhase === 'exit' ? 'rotating-text__line--exit' : 'rotating-text__line--enter'}`}>
        {safeTexts[currentIndex]}
      </p>
    </div>
  );
}

export default RotatingText;
