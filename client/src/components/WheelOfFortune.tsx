import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ar } from "@/locales/ar";
import { Sparkles } from "lucide-react";

export interface WheelPrize {
  id: string;
  label: string;
  points: number;
  color: string;
}

interface WheelOfFortuneProps {
  prizes: WheelPrize[];
  onSpin: (result: number) => Promise<void>;
  userPoints: number;
  spinCost: number;
  isLoading?: boolean;
}

export function WheelOfFortune({
  prizes,
  onSpin,
  userPoints,
  spinCost,
  isLoading = false,
}: WheelOfFortuneProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lastWinner, setLastWinner] = useState<WheelPrize | null>(null);

  const handleSpin = async () => {
    if (userPoints < spinCost || isSpinning || isLoading) return;

    setIsSpinning(true);
    setLastWinner(null);
    const spins = 8 + Math.random() * 5; // More spins for excitement
    const randomIndex = Math.floor(Math.random() * prizes.length);
    
    // Calculate final rotation (aligned with pointer at top)
    const prizeAngle = 360 / prizes.length;
    const targetAngle = (prizes.length - randomIndex) * prizeAngle - (prizeAngle / 2);
    const newRotation = rotation + spins * 360 + targetAngle - (rotation % 360);

    setRotation(newRotation);

    await new Promise(resolve => setTimeout(resolve, 5000));

    setLastWinner(prizes[randomIndex]);

    try {
      await onSpin(randomIndex);
    } catch (error) {
      console.error("Spin failed:", error);
    } finally {
      setIsSpinning(false);
    }
  };

  // Vibrant palette inspired by the image but adapted for dark theme
  const vibrantColors = [
    "#FF3B30", // Red
    "#FF9500", // Orange
    "#FFCC00", // Yellow
    "#4CD964", // Green
    "#5AC8FA", // Sky Blue
    "#007AFF", // Blue
    "#5856D6", // Indigo
    "#FF2D55", // Pink
  ];

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Wheel Container with Glow Effect */}
      <div className="relative w-80 h-80 mx-auto mb-12 group">
        
        {/* Animated Outer Glow */}
        <div className="absolute inset-[-20px] rounded-full bg-[#ED1C24]/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        {/* Outer Ring with "Lights" */}
        <div className="absolute inset-[-10px] rounded-full border-[3px] border-[#222] flex items-center justify-center">
          {[...Array(24)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1.5 h-1.5 rounded-full ${
                isSpinning ? "animate-pulse" : ""
              }`}
              style={{
                transform: `rotate(${i * 15}deg) translateY(-148px)`,
                backgroundColor: i % 2 === 0 ? "#ED1C24" : "#FFF",
                boxShadow: i % 2 === 0 ? "0 0 8px #ED1C24" : "0 0 8px #FFF",
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>

        {/* Pointer — refined orange/red design from image */}
        <div className="absolute top-[-15px] left-1/2 transform -translate-x-1/2 z-30 filter drop-shadow-lg">
          <div className="w-8 h-10 bg-[#ED1C24] clip-path-pointer rounded-b-sm shadow-xl flex items-center justify-center pt-1">
            <div className="w-1.5 h-4 bg-white/30 rounded-full" />
          </div>
        </div>

        {/* The Wheel */}
        <motion.div
          animate={{ rotate: rotation }}
          transition={{
            duration: 5,
            ease: [0.2, 0.8, 0.2, 1], // Custom bounce-back feel at the end
          }}
          className="relative w-full h-full rounded-full border-[6px] border-[#111] overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-[#050505]"
          style={{
            background: `conic-gradient(${prizes
              .map(
                (_, i) =>
                  `${vibrantColors[i % vibrantColors.length]} ${(i * 360) / prizes.length}deg ${((i + 1) * 360) / prizes.length}deg`
              )
              .join(", ")})`,
          }}
        >
          {/* Inner Shadow for depth */}
          <div className="absolute inset-0 rounded-full shadow-[inset_0_0_60px_rgba(0,0,0,0.4)] z-10 pointer-events-none" />

          {/* Prize Content */}
          {prizes.map((prize, index) => {
            const angle = (index * 360) / prizes.length + 180 / prizes.length;
            return (
              <div
                key={prize.id}
                className="absolute w-full h-full flex items-center justify-center z-20"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <div
                  className="absolute flex flex-col items-center"
                  style={{
                    transform: `translateY(-100px) rotate(180deg)`,
                  }}
                >
                  <span className="text-white font-black text-xs tracking-tighter text-center px-2 drop-shadow-md">
                    {prize.label.split(" ")[0]}
                    <br />
                    <span className="opacity-80 font-bold text-[9px] uppercase">
                      {prize.label.split(" ").slice(1).join(" ")}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}

          {/* Division Lines */}
          <div className="absolute inset-0 z-0">
            {prizes.map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 w-[1px] h-1/2 bg-black/20 origin-top"
                style={{ transform: `rotate(${(i * 360) / prizes.length}deg)` }}
              />
            ))}
          </div>
        </motion.div>

        {/* Center Hub — Metallic/Glassy look */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-[#333] to-[#000] border-2 border-[#444] z-40 shadow-2xl flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-[#ED1C24] shadow-[0_0_10px_#ED1C24]" />
        </div>
      </div>

      {/* Action Area */}
      <div className="space-y-4">
        <button
          onClick={handleSpin}
          disabled={isSpinning || isLoading || userPoints < spinCost}
          className="group relative w-full overflow-hidden bg-[#ED1C24] hover:bg-[#D91920] disabled:bg-[#1A1A1A] disabled:text-[#555] text-white font-black py-5 px-8 transition-all text-xl uppercase tracking-widest shadow-2xl"
        >
          {/* Button Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          
          <div className="relative flex items-center justify-center gap-3">
            {isSpinning ? (
              <span className="animate-pulse">جاري الدوران...</span>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {ar.wheel.spin}
              </>
            )}
          </div>
        </button>

        {/* Status Messages */}
        <AnimatePresence mode="wait">
          {userPoints < spinCost ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[#ED1C24] text-xs font-bold text-center uppercase tracking-widest"
            >
              {ar.errors.insufficientPoints}
            </motion.p>
          ) : (
            !isSpinning && !lastWinner && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[#555] text-xs text-center uppercase tracking-widest"
              >
                جرب حظك بـ {spinCost} نقطة فقط
              </motion.p>
            )
          )}
        </AnimatePresence>

        {/* Winner Announcement — High Impact */}
        <AnimatePresence>
          {lastWinner && !isSpinning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="mt-10 p-1 bg-[#ED1C24]"
            >
              <div className="bg-black py-8 px-10 text-center border-2 border-transparent">
                <p className="label-red mb-4 !text-white animate-bounce">
                  {ar.wheel.youWon}
                </p>
                <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">
                  {lastWinner.label}
                </h2>
                {lastWinner.points > 0 && (
                  <div className="inline-block px-4 py-1 bg-[#ED1C24] text-white text-xs font-bold uppercase tracking-widest">
                    +{lastWinner.points} {ar.wheel.points}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .clip-path-pointer {
          clip-path: polygon(0% 0%, 100% 0%, 100% 70%, 50% 100%, 0% 70%);
        }
      `}} />
    </div>
  );
}
