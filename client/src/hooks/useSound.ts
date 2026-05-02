import { useRef, useCallback } from "react";

/**
 * Lightweight sound hook. Preloads on first call, plays on demand.
 * Safe for mobile — only plays after user interaction.
 */
export function useSound(src: string, volume = 1) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.volume = volume;
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {
      // Silently fail if autoplay is blocked
    });
  }, [src, volume]);

  return { play };
}

/**
 * Pick a random item from an array.
 */
export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Sound asset paths
export const SOUNDS = {
  // Thank you / appreciation (after answering)
  thank: [
    "/assets/sounds/yaatik_sahha.mp3",
    "/assets/sounds/ykather_khirk.mp3",
  ],
  // Impatient / hurry up (after 5s idle)
  impatient: [
    "/assets/sounds/hayahethnee.mp3",
    "/assets/sounds/lem3ala9_woslou lel khala9.mp3",
  ],
} as const;

// Text displayed in bubbles matching each sound
export const BUBBLE_TEXT = {
  thank: ["يعطيك الصحّة!", "يكثّر خيرك!"],
  impatient: ["هيّا هات هْنَا!", "ازربلي روحك!"],
} as const;
