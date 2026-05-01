import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ar } from "@/locales/ar";

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
    const spins = 5 + Math.random() * 5; // 5-10 full rotations
    const randomIndex = Math.floor(Math.random() * prizes.length);
    const newRotation = spins * 360 + (randomIndex * 360) / prizes.length;

    setRotation(newRotation);
    setLastWinner(prizes[randomIndex]);

    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      await onSpin(randomIndex);
    } catch (error) {
      console.error("Spin failed:", error);
    } finally {
      setIsSpinning(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Wheel Container */}
      <Card className="bg-gradient-to-br from-gray-900 to-black border border-red-600/30 shadow-xl rounded-3xl p-8">
        {/* Wheel */}
        <div className="relative w-64 h-64 mx-auto mb-8">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-red-500" />
          </div>

          {/* Wheel Circle */}
          <motion.div
            animate={{ rotate: rotation }}
            transition={{
              duration: 3,
              ease: "easeOut",
            }}
            className="w-full h-full rounded-full shadow-2xl overflow-hidden"
            style={{
              background: `conic-gradient(${prizes.map((p, i) => `${p.color} ${(i * 360) / prizes.length}deg ${((i + 1) * 360) / prizes.length}deg`).join(", ")})`,
            }}
          >
            {/* Prize Labels */}
            {prizes.map((prize, index) => {
              const angle = (index * 360) / prizes.length + 180 / prizes.length;
              const radians = (angle * Math.PI) / 180;
              const x = 50 + 35 * Math.cos(radians);
              const y = 50 + 35 * Math.sin(radians);

              return (
                <div
                  key={prize.id}
                  className="absolute w-full h-full flex items-center justify-center"
                  style={{
                    transform: `rotate(${angle}deg)`,
                  }}
                >
                  <div
                    className="absolute text-white font-bold text-sm text-center"
                    style={{
                      transform: `translateY(-${64 - 10}px) rotate(${-angle}deg)`,
                    }}
                  >
                    {prize.label}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Info */}
        <div className="text-center space-y-4">
          <div>
            <p className="text-sm text-gray-600">{ar.wheel.spinCost}</p>
            <p className="text-2xl font-bold text-indigo-600">{spinCost} نقطة</p>
          </div>

          {/* Spin Button */}
          <Button
            onClick={handleSpin}
            disabled={isSpinning || isLoading || userPoints < spinCost}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 rounded-xl text-lg"
          >
            {isSpinning ? ar.wheel.spin : ar.wheel.spin}
          </Button>

          {/* Points Warning */}
          {userPoints < spinCost && (
            <p className="text-sm text-red-600">{ar.errors.insufficientPoints}</p>
          )}
        </div>
      </Card>

      {/* Winner Display */}
      {lastWinner && !isSpinning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-6 text-center shadow-xl"
        >
          <p className="text-white font-bold text-lg mb-2">{ar.wheel.youWon}! 🎉</p>
          <p className="text-white text-2xl font-bold">{lastWinner.label}</p>
          {lastWinner.points > 0 && (
            <p className="text-white text-sm mt-2">+{lastWinner.points} {ar.wheel.points}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
