import React, { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";

interface SwipeOption {
  id: string;
  label: string;
  labelAr: string;
  imageUrl?: string;
}

interface SwipeChoiceProps {
  options: [SwipeOption, SwipeOption];
  onChoice: (optionId: string) => void;
  disabled?: boolean;
}

/**
 * Tinder-style swipe-to-choose between two brand cards.
 * Swipe right → option A, swipe left → option B.
 * Shows both brand cards stacked, top card is draggable.
 */
export function SwipeChoice({ options, onChoice, disabled = false }: SwipeChoiceProps) {
  const [chosen, setChosen] = useState<string | null>(null);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacityLeft = useTransform(x, [-150, 0], [1, 0]);
  const opacityRight = useTransform(x, [0, 150], [0, 1]);

  const SWIPE_THRESHOLD = 100;

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (disabled || chosen) return;

    if (info.offset.x > SWIPE_THRESHOLD) {
      // Swiped right → choose first option (right side in RTL)
      setChosen(options[0].id);
      onChoice(options[0].id);
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      // Swiped left → choose second option
      setChosen(options[1].id);
      onChoice(options[1].id);
    }
  };

  return (
    <div className="relative w-full py-3">
      {/* Swipe hint labels */}
      <div className="flex justify-between items-center mb-3 px-2">
        <motion.span
          style={{ opacity: opacityLeft }}
          className="text-[#ED1C24] text-xs font-black uppercase tracking-wider"
        >
          ← {options[1].labelAr}
        </motion.span>
        <span className="text-[#333] text-[10px] uppercase tracking-widest">اسحب للاختيار</span>
        <motion.span
          style={{ opacity: opacityRight }}
          className="text-[#ED1C24] text-xs font-black uppercase tracking-wider"
        >
          {options[0].labelAr} →
        </motion.span>
      </div>

      {/* Card Stack */}
      <div className="relative h-36 flex items-center justify-center">

        {/* Background card (option B) — slightly visible behind */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full max-w-[260px] h-32 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl flex items-center justify-center gap-4 p-4">
            {options[1].imageUrl ? (
              <img
                src={options[1].imageUrl}
                alt={options[1].labelAr}
                className="w-16 h-16 object-contain"
                draggable={false}
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-[#333] text-2xl font-black">
                {options[1].labelAr.charAt(0)}
              </div>
            )}
            <span className="text-[#555] font-bold text-lg">{options[1].labelAr}</span>
          </div>
        </div>

        {/* Top card (option A) — draggable */}
        <motion.div
          drag={!disabled && !chosen ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.9}
          onDragEnd={handleDragEnd}
          style={{ x, rotate }}
          animate={
            chosen === options[0].id
              ? { x: 300, opacity: 0, rotate: 15 }
              : chosen === options[1].id
              ? { x: -300, opacity: 0, rotate: -15 }
              : {}
          }
          transition={{ duration: 0.4 }}
          className="absolute w-full max-w-[260px] h-32 bg-[#111] border border-[#2a2a2a] rounded-xl flex items-center justify-center gap-4 p-4 cursor-grab active:cursor-grabbing shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
        >
          {/* Glow edges on drag */}
          <motion.div
            style={{ opacity: opacityRight }}
            className="absolute inset-0 rounded-xl border-2 border-[#ED1C24]/50 pointer-events-none"
          />
          <motion.div
            style={{ opacity: opacityLeft }}
            className="absolute inset-0 rounded-xl border-2 border-[#ED1C24]/50 pointer-events-none"
          />

          {options[0].imageUrl ? (
            <img
              src={options[0].imageUrl}
              alt={options[0].labelAr}
              className="w-16 h-16 object-contain"
              draggable={false}
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-[#444] text-2xl font-black">
              {options[0].labelAr.charAt(0)}
            </div>
          )}
          <span className="text-white font-bold text-lg select-none">{options[0].labelAr}</span>
        </motion.div>
      </div>

      {/* Tap fallback for accessibility */}
      {!chosen && !disabled && (
        <div className="flex gap-2 mt-3">
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => {
                setChosen(opt.id);
                onChoice(opt.id);
              }}
              className="flex-1 text-[#444] hover:text-white text-xs font-bold py-2 border border-[#1a1a1a] hover:border-[#333] transition-all rounded text-center"
            >
              {opt.labelAr}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
