import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BejiAvatarProps {
  mode?: "idle" | "pointing" | "thinking" | "happy";
  className?: string;
}

/**
 * A placeholder for the platform's character.
 * For now, it renders a subtle placeholder that mimics the character's presence
 * until the USER provides the actual images.
 */
export function BejiAvatar({ mode = "idle", className = "" }: BejiAvatarProps) {
  return (
    <div className={`relative ${className}`}>
      <motion.div
        animate={{ 
          y: [0, -4, 0],
          scale: mode === "happy" ? [1, 1.05, 1] : 1
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-[#222] to-[#000] border-2 border-white/5 shadow-2xl overflow-hidden relative"
      >
        {/* Placeholder Head Silhouette */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pt-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#333] rounded-full mb-[-10px] relative z-10" />
          <div className="w-20 h-24 sm:w-24 sm:h-28 bg-[#222] rounded-t-3xl" />
        </div>
        
        {/* Status Indicator */}
        <AnimatePresence>
          {mode === "thinking" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-2 right-2 flex gap-1"
            >
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  className="w-1.5 h-1.5 bg-[#ED1C24] rounded-full"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Glow behind */}
        <div className="absolute inset-0 bg-[#ED1C24]/5 blur-xl pointer-events-none" />
      </motion.div>

      {/* Shadow */}
      <div className="w-full h-2 bg-black/40 blur-md rounded-full mt-2 mx-auto scale-75" />
    </div>
  );
}
