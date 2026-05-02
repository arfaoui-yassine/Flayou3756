import React, { useState } from "react";
import { motion } from "framer-motion";

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
 * VS-style brand battle: two brands side by side.
 * Tap to choose. Selected one glows, other fades.
 */
export function SwipeChoice({ options, onChoice, disabled = false }: SwipeChoiceProps) {
  const [chosen, setChosen] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    if (disabled || chosen) return;
    setChosen(id);
    onChoice(id);
  };

  return (
    <div className="py-4">
      <div className="flex items-stretch gap-3">
        {/* Option A */}
        <motion.button
          whileTap={!chosen ? { scale: 0.95 } : {}}
          onClick={() => handleSelect(options[0].id)}
          disabled={disabled || !!chosen}
          animate={
            chosen === options[0].id
              ? { scale: 1.05, borderColor: "#ED1C24" }
              : chosen
              ? { opacity: 0.3, scale: 0.95 }
              : {}
          }
          transition={{ duration: 0.3 }}
          className={`flex-1 flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all ${
            chosen === options[0].id
              ? "border-[#ED1C24] bg-[#ED1C24]/10"
              : "border-[#1a1a1a] bg-[#0f0f0f] hover:border-[#333]"
          }`}
        >
          {options[0].imageUrl ? (
            <img
              src={options[0].imageUrl}
              alt={options[0].labelAr}
              className="w-16 h-16 object-contain"
              draggable={false}
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-[#555] text-2xl font-black">
              {options[0].labelAr.charAt(0)}
            </div>
          )}
          <span className="text-white font-bold text-sm">{options[0].labelAr}</span>

          {/* Checkmark when selected */}
          {chosen === options[0].id && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-6 h-6 rounded-full bg-[#ED1C24] flex items-center justify-center"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
        </motion.button>

        {/* VS Badge */}
        <div className="flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-[#111] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0">
            <span className="text-[#ED1C24] text-xs font-black">VS</span>
          </div>
        </div>

        {/* Option B */}
        <motion.button
          whileTap={!chosen ? { scale: 0.95 } : {}}
          onClick={() => handleSelect(options[1].id)}
          disabled={disabled || !!chosen}
          animate={
            chosen === options[1].id
              ? { scale: 1.05, borderColor: "#ED1C24" }
              : chosen
              ? { opacity: 0.3, scale: 0.95 }
              : {}
          }
          transition={{ duration: 0.3 }}
          className={`flex-1 flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all ${
            chosen === options[1].id
              ? "border-[#ED1C24] bg-[#ED1C24]/10"
              : "border-[#1a1a1a] bg-[#0f0f0f] hover:border-[#333]"
          }`}
        >
          {options[1].imageUrl ? (
            <img
              src={options[1].imageUrl}
              alt={options[1].labelAr}
              className="w-16 h-16 object-contain"
              draggable={false}
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-[#555] text-2xl font-black">
              {options[1].labelAr.charAt(0)}
            </div>
          )}
          <span className="text-white font-bold text-sm">{options[1].labelAr}</span>

          {/* Checkmark when selected */}
          {chosen === options[1].id && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-6 h-6 rounded-full bg-[#ED1C24] flex items-center justify-center"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
        </motion.button>
      </div>
    </div>
  );
}
