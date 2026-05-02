import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { WheelOfFortune } from "@/components/WheelOfFortune";

interface WheelPrize {
  id: string;
  label: string;
  points: number;
  color: string;
}

// Weights control probability. Higher weight = higher chance.
const wheelPrizes: WheelPrize[] = [
  { id: "lose1", label: "دعيوات خير",      points: 0,    color: "#1A1A1A" },
  { id: "p1",    label: "200Mo إنترنت",    points: 30,   color: "#1A1A1A" },
  { id: "lose2", label: "دعيوات خير",      points: 0,    color: "#111111" },
  { id: "p2",    label: "1dt كاش",         points: 0,    color: "#111111" },
  { id: "lose3", label: "دعيوات خير",      points: 0,    color: "#1A1A1A" },
  { id: "p3",    label: "5dt كاش",         points: 0,    color: "#1A1A1A" },
  { id: "lose4", label: "دعيوات خير",      points: 0,    color: "#111111" },
  { id: "p4",    label: "كاش تليفون",      points: 0,    color: "#111111" },
  { id: "p5",    label: "40G إنترنت",      points: 50,   color: "#1A1A1A" },
  { id: "p6",    label: "سمارتفون",        points: 0,    color: "#111111" },
];

const WEIGHTED_POOL: number[] = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
  6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
  5, 5, 5, 5, 5, 5, 5, 5,
  8, 8, 8, 8, 8,
  7, 7, 7,
  9,
];

export default function RoueElHadh() {
  const [userPoints, setUserPoints] = useState(350);
  const spinCost = 50;

  // Lock scroll on this page
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = "";
    };
  }, []);

  const handleSpin = async (resultIndex: number) => {
    const prize = wheelPrizes[resultIndex];
    const newPoints = Math.max(0, userPoints - spinCost + prize.points);
    setUserPoints(newPoints);
  };

  const getWeightedIndex = () =>
    WEIGHTED_POOL[Math.floor(Math.random() * WEIGHTED_POOL.length)];

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-8 pb-2 max-w-lg mx-auto w-full">
        <p className="text-[#ED1C24] text-[10px] uppercase tracking-[0.2em] font-black mb-1">عَمّ الباجي</p>
        <h1 className="text-3xl font-bold text-white mb-3">دوّر العجلة</h1>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-[#555]">تكلفة: <span className="text-white font-semibold">{spinCost} نقطة</span></span>
          <div className="w-px h-3 bg-[#333]" />
          <span className="text-[#555]">رصيدك: <span className="text-white font-semibold">{userPoints} نقطة</span></span>
        </div>
      </div>

      {/* Wheel — centered in remaining space */}
      <div className="flex-1 flex items-center justify-center px-4">
        <WheelOfFortune
          prizes={wheelPrizes}
          onSpin={handleSpin}
          userPoints={userPoints}
          spinCost={spinCost}
          getWeightedIndex={getWeightedIndex}
        />
      </div>
    </div>
  );
}
