import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { ar } from "@/locales/ar";
import { Sparkles, Trophy, Star } from "lucide-react";
import confetti from "canvas-confetti";

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
  getWeightedIndex?: () => number;
}

export function WheelOfFortune({
  prizes,
  onSpin,
  userPoints,
  spinCost,
  isLoading = false,
  getWeightedIndex,
}: WheelOfFortuneProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lastWinner, setLastWinner] = useState<WheelPrize | null>(null);
  const [isDiweyat, setIsDiweyat] = useState(false);
  const [diweyatMessage, setDiweyatMessage] = useState("");
  const controls = useAnimation();

  const DIWEYAT_MESSAGES = [
    "إن شاء الله زَهرك حاضر",
    "ربي يفتحها في وجهك",
    "إن شاء الله فيها نصيبك",
    "ربي يسهّلها عليك",
  ];

  const handleSpin = async () => {
    if (userPoints < spinCost || isSpinning || isLoading) return;

    setIsSpinning(true);
    setLastWinner(null);
    setIsDiweyat(false);
    
    // Use weighted index if provided, otherwise random
    const randomIndex = getWeightedIndex
      ? getWeightedIndex()
      : Math.floor(Math.random() * prizes.length);
    
    // Epic 6-second spin duration
    const spinDuration = 6;
    const spins = 10 + Math.random() * 5; 
    
    const prizeAngle = 360 / prizes.length;
    const targetAngle = (prizes.length - randomIndex) * prizeAngle - (prizeAngle / 2);
    const totalRotation = rotation + spins * 360 + targetAngle - (rotation % 360);

    setRotation(totalRotation);

    // Trigger spin animation
    await controls.start({
      rotate: totalRotation,
      transition: {
        duration: spinDuration,
        ease: [0.15, 0, 0.15, 1],
      }
    });

    // Landing sequence
    const winner = prizes[randomIndex];
    const isLoss = winner.label === "دعيوات خير";

    if (isLoss) {
      const msg = DIWEYAT_MESSAGES[Math.floor(Math.random() * DIWEYAT_MESSAGES.length)];
      setDiweyatMessage(msg);
      setIsDiweyat(true);
    } else {
      setLastWinner(winner);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ED1C24", "#FFFFFF", "#FFCC00"]
      });
    }

    try {
      await onSpin(randomIndex);
    } catch (error) {
      console.error("Spin failed:", error);
    } finally {
      setIsSpinning(false);
    }
  };

  const vibrantColors = [
    "#FF1E1E", // Vibrant Red
    "#FF9100", // Vibrant Orange
    "#FFD000", // Gold
    "#00E676", // Neon Green
    "#00B0FF", // Bright Blue
    "#651FFF", // Deep Purple
    "#F50057", // Bright Pink
    "#00E5FF", // Cyan
  ];

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 
          ═══════════════════════════════════════════════
          THE EPIC WHEEL CONTAINER
          ═══════════════════════════════════════════════ 
      */}
      <div className="relative w-80 h-80 mx-auto mb-16 group">
        
        {/* Pulsing Aura Background */}
        <div className={`absolute inset-[-40px] rounded-full blur-[100px] transition-all duration-1000 ${
          isSpinning ? "bg-[#ED1C24]/30 scale-110 opacity-100" : "bg-[#ED1C24]/5 opacity-50"
        }`} />
        
        {/* Outer Decorative Ring with "Chasing Lights" */}
        <div className="absolute inset-[-15px] rounded-full border-[2px] border-white/10 flex items-center justify-center">
          {[...Array(36)].map((_, i) => (
            <motion.div
              key={i}
              animate={isSpinning ? {
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.5, 1],
              } : {}}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: i * 0.05,
              }}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                transform: `rotate(${i * 10}deg) translateY(-158px)`,
                backgroundColor: i % 3 === 0 ? "#ED1C24" : "#FFF",
                boxShadow: i % 3 === 0 ? "0 0 10px #ED1C24" : "0 0 5px #FFF",
              }}
            />
          ))}
        </div>

        {/* Refined Pointer Design */}
        <div className="absolute top-[-25px] left-1/2 transform -translate-x-1/2 z-50">
          <motion.div 
            animate={isSpinning ? {
              rotate: [0, -15, 0],
            } : {}}
            transition={{
              duration: 0.1,
              repeat: Infinity,
            }}
            className="w-10 h-14 bg-gradient-to-b from-[#ED1C24] to-[#990000] clip-path-pointer shadow-2xl flex items-center justify-center pt-2"
          >
            <Star className="w-4 h-4 text-white fill-white animate-pulse" />
          </motion.div>
        </div>

        {/* THE WHEEL OBJECT */}
        <motion.div
          animate={controls}
          className="relative w-full h-full rounded-full border-[8px] border-[#0A0A0A] overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)] bg-[#000]"
          style={{
            background: `conic-gradient(${prizes
              .map(
                (_, i) =>
                  `${vibrantColors[i % vibrantColors.length]} ${(i * 360) / prizes.length}deg ${((i + 1) * 360) / prizes.length}deg`
              )
              .join(", ")})`,
          }}
        >
          {/* Beveled edge effect */}
          <div className="absolute inset-0 rounded-full border-[10px] border-white/5 z-10 pointer-events-none" />

          {/* Prize Sections */}
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
                    transform: `translateY(-105px) rotate(180deg)`,
                  }}
                >
                  <span className="text-white font-black text-sm tracking-tighter text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {prize.label.split(" ")[0]}
                    <br />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">
                      {prize.label.split(" ").slice(1).join(" ")}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}

          {/* Separation Lines */}
          <div className="absolute inset-0 z-0">
            {prizes.map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 w-[2px] h-1/2 bg-black/30 origin-top"
                style={{ transform: `rotate(${(i * 360) / prizes.length}deg)` }}
              />
            ))}
          </div>
        </motion.div>

        {/* Premium Center Hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-[#222] via-[#000] to-[#222] border-[3px] border-white/10 z-40 shadow-2xl flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#ED1C24]/20 to-transparent animate-spin-slow" />
          <Trophy className="w-6 h-6 text-[#ED1C24] relative z-10 drop-shadow-[0_0_10px_rgba(237,28,36,0.5)]" />
        </div>
      </div>

      {/* 
          ═══════════════════════════════════════════════
          ACTION AREA
          ═══════════════════════════════════════════════ 
      */}
      <div className="space-y-6">
        <button
          onClick={handleSpin}
          disabled={isSpinning || isLoading || userPoints < spinCost}
          className="group relative w-full overflow-hidden bg-white hover:bg-white/90 disabled:bg-[#111] disabled:text-[#333] text-black font-black py-6 px-8 transition-all text-2xl uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
        >
          {/* Animated Shine */}
          <motion.div 
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent skew-x-[-20deg]" 
          />
          
          <div className="relative flex items-center justify-center gap-4">
            {isSpinning ? (
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-black rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.4s]" />
              </span>
            ) : (
              <>
                <Sparkles className="w-6 h-6 text-[#ED1C24]" />
                {ar.wheel.spin}
              </>
            )}
          </div>
        </button>

        {/* User Stats Display */}
        <div className="flex justify-between items-center px-4">
          <div className="text-left">
            <p className="text-[#444] text-[10px] uppercase tracking-widest mb-1">Cost to Spin</p>
            <p className="text-white font-bold">{spinCost} pts</p>
          </div>
          <div className="text-right">
            <p className="text-[#444] text-[10px] uppercase tracking-widest mb-1">Your Balance</p>
            <p className={`font-bold ${userPoints < spinCost ? "text-[#ED1C24]" : "text-white"}`}>
              {userPoints} pts
            </p>
          </div>
        </div>

        {/* WINNER ANNOUNCEMENT OVERLAY */}
        <AnimatePresence>
          {lastWinner && !isSpinning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="fixed inset-0 z-[100] flex items-center justify-center px-6 pointer-events-none"
            >
              <div className="relative w-full max-w-sm overflow-hidden border-2 border-[#ED1C24] bg-black p-12 text-center shadow-[0_0_100px_rgba(237,28,36,0.4)] pointer-events-auto">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ED1C24] to-transparent" />
                
                <motion.div
                  initial={{ rotate: -10, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="mb-6 flex justify-center"
                >
                  <div className="relative">
                    <Trophy className="w-16 h-16 text-[#FFD000] drop-shadow-[0_0_20px_rgba(255,208,0,0.5)]" />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-0 bg-[#FFD000]/20 blur-xl rounded-full" 
                    />
                  </div>
                </motion.div>

                <p className="label-red !text-white mb-2 animate-pulse tracking-[0.3em]">
                  {ar.wheel.youWon}
                </p>
                
                <h2 className="text-5xl font-black text-white mb-8 tracking-tighter leading-none">
                  {lastWinner.label}
                </h2>
                
                <button
                  onClick={() => setLastWinner(null)}
                  className="w-full border border-white/20 hover:border-white/40 text-white text-xs font-bold py-4 uppercase tracking-widest transition-all"
                >
                  {ar.close}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* DIWEYAT KHIR OVERLAY */}
        <AnimatePresence>
          {isDiweyat && !isSpinning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center px-6 pointer-events-none"
            >
              <div className="relative w-full max-w-sm overflow-hidden border border-white/10 bg-[#0A0A0A] p-12 text-center shadow-2xl pointer-events-auto">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <motion.div
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="mb-6 text-5xl"
                >
                  🤲
                </motion.div>

                <p className="text-[#555] text-xs uppercase tracking-[0.2em] font-black mb-3">دعيوات خير</p>
                
                <h2 className="text-2xl font-black text-white mb-8 leading-relaxed">
                  {diweyatMessage}
                </h2>
                
                <button
                  onClick={() => setIsDiweyat(false)}
                  className="w-full border border-[#222] hover:border-[#333] text-[#888] hover:text-white text-xs font-bold py-4 uppercase tracking-widest transition-all"
                >
                  حاول مرة أخرى
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .clip-path-pointer {
          clip-path: polygon(0% 0%, 100% 0%, 100% 70%, 50% 100%, 0% 70%);
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
      `}} />
    </div>
  );
}
