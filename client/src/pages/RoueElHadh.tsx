import React, { useState } from "react";
import { motion } from "framer-motion";
import { WheelOfFortune } from "@/components/WheelOfFortune";

interface WheelPrize {
  id: string;
  label: string;
  points: number;
  color: string;
}

// Weights control probability. Higher weight = higher chance.
// Total weight = 100
const wheelPrizes: WheelPrize[] = [
  { id: "lose1", label: "دعيوات خير",      points: 0,    color: "#1A1A1A" }, // w:25
  { id: "p1",    label: "200Mo إنترنت",    points: 30,   color: "#1A1A1A" }, // w:15
  { id: "lose2", label: "دعيوات خير",      points: 0,    color: "#111111" }, // w:25
  { id: "p2",    label: "1dt كاش",         points: 0,    color: "#111111" }, // w:12
  { id: "lose3", label: "دعيوات خير",      points: 0,    color: "#1A1A1A" }, // w:25
  { id: "p3",    label: "5dt كاش",         points: 0,    color: "#1A1A1A" }, // w:8
  { id: "lose4", label: "دعيوات خير",      points: 0,    color: "#111111" }, // w:10 (last slice)
  { id: "p4",    label: "كاش تليفون",      points: 0,    color: "#111111" }, // w:3
  { id: "p5",    label: "40G إنترنت",      points: 50,   color: "#1A1A1A" }, // w:5
  { id: "p6",    label: "سمارتفون",        points: 0,    color: "#111111" }, // w:1 (ultra-rare)
];

// Index pools weighted for spin outcome (out of 100 draws)
const WEIGHTED_POOL: number[] = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // lose1 ×25
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, // lose2 ×25
  4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, // lose3 ×25
  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,                                                 // lose4 ×10
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,                                 // 200Mo ×15
  3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,                                           // 1dt ×12
  5, 5, 5, 5, 5, 5, 5, 5,                                                        // 5dt ×8
  8, 8, 8, 8, 8,                                                                  // 40G ×5
  7, 7, 7,                                                                        // كاش تليفون ×3
  9,                                                                              // سمارتفون ×1
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function RoueElHadh() {
  const [userPoints, setUserPoints] = useState(350);
  const [spinHistory, setSpinHistory] = useState<Array<{ prize: string; points: number; date: string }>>([]);
  const spinCost = 50;

  const handleSpin = async (resultIndex: number) => {
    const prize = wheelPrizes[resultIndex];
    const newPoints = Math.max(0, userPoints - spinCost + prize.points);
    setUserPoints(newPoints);

    setSpinHistory(prev => [
      {
        prize: prize.label,
        points: prize.points,
        date: new Date().toLocaleTimeString("ar-TN"),
      },
      ...prev.slice(0, 9),
    ]);
  };

  // Expose weighted pool to WheelOfFortune via a prop resolver
  const getWeightedIndex = () =>
    WEIGHTED_POOL[Math.floor(Math.random() * WEIGHTED_POOL.length)];

  return (
    <div className="min-h-screen">
      <motion.div
        initial="initial"
        animate="animate"
        className="max-w-2xl mx-auto px-5 pt-12 pb-8"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="mb-4">
          <p className="label-red mb-3">عَمّ الباجي</p>
          <h1 className="text-5xl font-bold text-white">دوّر العجلة</h1>
        </motion.div>

        {/* Cost + Balance */}
        <motion.div variants={fadeUp} className="flex items-center gap-6 text-sm mb-12">
          <div>
            <span className="text-[#555]">تكلفة الدورة: </span>
            <span className="text-white font-semibold">{spinCost} نقطة</span>
          </div>
          <div className="w-px h-4 bg-[#333]" />
          <div>
            <span className="text-[#555]">رصيدك: </span>
            <span className="text-white font-semibold">{userPoints} نقطة</span>
          </div>
        </motion.div>

        {/* Wheel */}
        <motion.div variants={fadeUp} className="mb-12">
          <WheelOfFortune
            prizes={wheelPrizes}
            onSpin={handleSpin}
            userPoints={userPoints}
            spinCost={spinCost}
            getWeightedIndex={getWeightedIndex}
          />
        </motion.div>

        {/* Spin History */}
        {spinHistory.length > 0 && (
          <motion.div variants={fadeUp}>
            <div className="section-divider mb-8" />
            <p className="label-red mb-6">History</p>

            <div className="space-y-2">
              {spinHistory.map((entry, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between py-3 border-b border-[#151515]"
                >
                  <span className="text-white text-sm font-medium">{entry.prize}</span>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-semibold ${entry.points > 0 ? "text-[#ED1C24]" : "text-[#555]"}`}>
                      {entry.points > 0 ? `+${entry.points}` : "—"}
                    </span>
                    <span className="text-[#333] text-xs">{entry.date}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
