import React, { useEffect } from 'react';
import Lenis from 'lenis';

export default function SmoothScrollProvider({ children }) {
  useEffect(() => {
    // Initialize Lenis for buttery-smooth portal scrolling
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 2.0,
      prevent: (node) => {
        if (!node) return false;
        const el = node instanceof Element ? node : node.parentElement;
        if (!el) return false;

        // Fast path for tagged elements or common scrollable classes
        if (
          el.hasAttribute?.('data-lenis-prevent') ||
          Boolean(el.closest?.('[data-lenis-prevent]')) ||
          Boolean(el.closest?.('[role="dialog"]')) ||
          Boolean(el.closest?.('.fixed')) ||
          Boolean(el.closest?.('.overflow-y-auto')) ||
          Boolean(el.closest?.('.overflow-auto')) ||
          Boolean(el.closest?.('.overflow-x-auto')) ||
          Boolean(el.closest?.('.overflow-scroll'))
        ) {
          return true;
        }

        // Dynamic check for any element with active scrollable overflow
        let curr = el;
        while (curr && curr !== document.body && curr !== document.documentElement) {
          const style = window.getComputedStyle(curr);
          if (
            (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
            curr.scrollHeight > curr.clientHeight
          ) {
            return true;
          }
          if (
            (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
            curr.scrollWidth > curr.clientWidth
          ) {
            return true;
          }
          curr = curr.parentElement;
        }

        return false;
      },
    });

    let animationFrameId;

    function raf(time) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }

    animationFrameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
