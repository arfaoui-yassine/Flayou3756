import React, { useState } from "react";
import { motion } from "framer-motion";
import { WheelOfFortune } from "@/components/WheelOfFortune";

interface WheelPrize {
  id: string;
  label: string;
  points: number;
  color: string;
}

const wheelPrizes: WheelPrize[] = [
  { id: "p1", label: "50 نقطة", points: 50, color: "#1A1A1A" },
  { id: "p2", label: "100 نقطة", points: 100, color: "#111111" },
  { id: "p3", label: "25 نقطة", points: 25, color: "#1A1A1A" },
  { id: "p4", label: "150 نقطة", points: 150, color: "#111111" },
  { id: "p5", label: "صندوق غامض", points: 0, color: "#1A1A1A" },
  { id: "p6", label: "200 نقطة", points: 200, color: "#111111" },
  { id: "p7", label: "75 نقطة", points: 75, color: "#1A1A1A" },
  { id: "p8", label: "خصم مجاني", points: 0, color: "#111111" },
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
    const newPoints = userPoints - spinCost + prize.points;
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

  return (
    <div className="min-h-screen">
      <motion.div
        initial="initial"
        animate="animate"
        className="max-w-2xl mx-auto px-5 pt-12 pb-8"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="mb-4">
          <p className="label-red mb-3">Lucky Wheel</p>
          <h1 className="text-5xl font-bold text-white">روّح الحظ</h1>
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
