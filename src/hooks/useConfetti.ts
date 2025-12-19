/**
 * Confetti Hook
 *
 * Provides celebratory confetti effects for achievements.
 */

import confetti from 'canvas-confetti';
import { useCallback } from 'react';

interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x?: number; y?: number };
  colors?: string[];
}

export function useConfetti() {
  /**
   * Fire confetti for earning a badge
   */
  const fireBadge = useCallback((options?: ConfettiOptions) => {
    confetti({
      particleCount: options?.particleCount ?? 100,
      spread: options?.spread ?? 70,
      origin: { y: options?.origin?.y ?? 0.6, x: options?.origin?.x ?? 0.5 },
      colors: options?.colors ?? ['#FFD700', '#FFA500', '#FF6347', '#9370DB', '#20B2AA'],
    });
  }, []);

  /**
   * Fire confetti for completing a journey
   */
  const fireJourney = useCallback((options?: ConfettiOptions) => {
    // Fire from left
    confetti({
      particleCount: options?.particleCount ?? 75,
      spread: options?.spread ?? 100,
      origin: { x: 0.1, y: options?.origin?.y ?? 0.5 },
      colors: options?.colors ?? ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107'],
    });

    // Fire from right
    setTimeout(() => {
      confetti({
        particleCount: options?.particleCount ?? 75,
        spread: options?.spread ?? 100,
        origin: { x: 0.9, y: options?.origin?.y ?? 0.5 },
        colors: options?.colors ?? ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107'],
      });
    }, 150);
  }, []);

  /**
   * Fire confetti for streak achievements
   */
  const fireStreak = useCallback((options?: ConfettiOptions) => {
    const count = 3;
    const defaults = {
      particleCount: Math.floor((options?.particleCount ?? 80) / count),
      spread: options?.spread ?? 60,
      origin: { y: options?.origin?.y ?? 0.7 },
      colors: options?.colors ?? ['#FF4500', '#FF6347', '#FF7F50', '#FFA07A'],
    };

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        confetti({
          ...defaults,
          origin: { ...defaults.origin, x: 0.2 + (i * 0.3) },
        });
      }, i * 100);
    }
  }, []);

  /**
   * Fire confetti for story completion
   */
  const fireStory = useCallback((options?: ConfettiOptions) => {
    confetti({
      particleCount: options?.particleCount ?? 60,
      spread: options?.spread ?? 80,
      origin: { y: options?.origin?.y ?? 0.5, x: options?.origin?.x ?? 0.5 },
      colors: options?.colors ?? ['#9C27B0', '#E91E63', '#673AB7', '#3F51B5'],
    });
  }, []);

  /**
   * Fire confetti burst from center (generic celebration)
   */
  const fireCelebration = useCallback((options?: ConfettiOptions) => {
    confetti({
      particleCount: options?.particleCount ?? 150,
      spread: options?.spread ?? 120,
      origin: { y: options?.origin?.y ?? 0.5, x: options?.origin?.x ?? 0.5 },
      colors: options?.colors ?? [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      ],
    });
  }, []);

  /**
   * Fire continuous confetti shower (for major achievements)
   */
  const fireShower = useCallback((duration: number = 3000) => {
    const end = Date.now() + duration;

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  return {
    fireBadge,
    fireJourney,
    fireStreak,
    fireStory,
    fireCelebration,
    fireShower,
  };
}
