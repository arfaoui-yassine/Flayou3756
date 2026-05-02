import React from "react";
import { motion } from "framer-motion";

export type BejiMode = "idle" | "waving" | "thinking" | "writing" | "pointing" | "grateful";

interface BejiAvatarProps {
  mode?: BejiMode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * Available poses (transparent PNGs):
 * - talking (hands open, explaining) → idle, waving
 * - grateful (hand on heart) → grateful, thinking
 * - writing (clipboard) → writing
 * - pointing (finger point) → pointing
 */
const BEJI_IMAGES: Record<BejiMode, string> = {
  idle: "/assets/beji/beji-talking.png",
  waving: "/assets/beji/beji-talking.png",
  thinking: "/assets/beji/beji-talking.png",
  writing: "/assets/beji/beji-writing.png",
  pointing: "/assets/beji/beji-pointing.png",
  grateful: "/assets/beji/beji-grateful.png",
};

const SIZE_CLASSES = {
  sm: "w-24 h-24",
  md: "w-36 h-36",
  lg: "w-48 h-48",
  xl: "w-56 h-56",
};

/**
 * Aam Lbeji — The platform's main character.
 * Transparent PNG images, designed to "pop out" of containers.
 */
export function BejiAvatar({ mode = "idle", className = "", size = "md" }: BejiAvatarProps) {
  return (
    <div className={`flex-shrink-0 pointer-events-none select-none ${SIZE_CLASSES[size]} ${className}`}>
      <motion.img
        key={BEJI_IMAGES[mode]}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        src={BEJI_IMAGES[mode]}
        alt="عم الباجي"
        className="w-full h-full object-contain object-bottom"
        style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.6))" }}
        draggable={false}
      />
    </div>
  );
}
