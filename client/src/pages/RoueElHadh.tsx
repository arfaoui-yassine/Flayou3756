import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WheelOfFortune } from "@/components/WheelOfFortune";
import { ar } from "@/locales/ar";
import { useLocation } from "wouter";
import { ArrowRight, Gamepad2, Trophy, Lightbulb } from "lucide-react";

interface WheelPrize {
  id: string;
  label: string;
  points: number;
  color: string;
}

const wheelPrizes: WheelPrize[] = [
  { id: "p1", label: "50 نقطة", points: 50, color: "#FF6B6B" },
  { id: "p2", label: "100 نقطة", points: 100, color: "#4ECDC4" },
  { id: "p3", label: "25 نقطة", points: 25, color: "#FFE66D" },
  { id: "p4", label: "150 نقطة", points: 150, color: "#95E1D3" },
  { id: "p5", label: "صندوق غامض", points: 0, color: "#C7CEEA" },
  { id: "p6", label: "200 نقطة", points: 200, color: "#FF8B94" },
  { id: "p7", label: "75 نقطة", points: 75, color: "#B4A7D6" },
  { id: "p8", label: "خصم مجاني", points: 0, color: "#FFB4B4" },
];

export default function RoueElHadh() {
  const [, setLocation] = useLocation();
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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => setLocation("/")}
            variant="ghost"
            className="text-red-500 hover:text-red-600"
          >
            <ArrowRight className="mr-2" size={20} />
            {ar.back}
          </Button>
          <h1 className="text-4xl font-bold text-white">Rouet el Hadh</h1>
          <div className="w-20" />
        </div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-red-600 to-red-700 rounded-3xl p-6 text-white shadow-xl"
        >
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm opacity-90">{ar.wheel.spinCost}</p>
              <p className="text-3xl font-bold mt-2">{spinCost} نقطة</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">رصيدك</p>
              <p className="text-3xl font-bold mt-2">{userPoints} نقطة</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Wheel Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl p-8 shadow-lg">
            <div className="flex justify-center">
              <WheelOfFortune
                prizes={wheelPrizes}
                onSpin={handleSpin}
                userPoints={userPoints}
                spinCost={spinCost}
              />
            </div>
          </Card>
        </motion.div>

        {/* History Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl p-6 shadow-lg h-full">
            <h2 className="text-xl font-bold text-white mb-6 text-right">
              سجل الدورات
            </h2>

            {spinHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-600/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Gamepad2 size={32} className="text-red-500" />
                </div>
                <p className="text-gray-300 font-semibold">لم تدر الحظ بعد</p>
                <p className="text-sm text-gray-500 mt-2">ابدأ الآن و اربح جوائز!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {spinHistory.map((entry, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-right">
                        <p className="font-bold text-white">{entry.prize}</p>
                        <p className="text-xs text-gray-500 mt-1">{entry.date}</p>
                      </div>
                      <div className={`text-lg font-bold ${entry.points > 0 ? "text-green-500" : "text-gray-500"}`}>
                        {entry.points > 0 ? `+${entry.points}` : "خصم"}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Info Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-4xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* How to Play */}
        <Card className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 shadow-md">
          <div className="mb-4">
            <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
              <Gamepad2 size={24} className="text-red-500" />
            </div>
          </div>
          <h3 className="font-bold text-white mb-2 text-right">كيفية اللعب</h3>
          <p className="text-sm text-gray-400 text-right">
            استخدم 50 نقطة لتدوير الحظ و اربح جوائز كبيرة
          </p>
        </Card>

        {/* Prizes */}
        <Card className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 shadow-md">
          <div className="mb-4">
            <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
              <Trophy size={24} className="text-red-500" />
            </div>
          </div>
          <h3 className="font-bold text-white mb-2 text-right">الجوائز</h3>
          <p className="text-sm text-gray-400 text-right">
            اربح نقاط إضافية أو صناديق غامضة
          </p>
        </Card>

        {/* Tips */}
        <Card className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 shadow-md">
          <div className="mb-4">
            <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
              <Lightbulb size={24} className="text-red-500" />
            </div>
          </div>
          <h3 className="font-bold text-white mb-2 text-right">نصيحة</h3>
          <p className="text-sm text-gray-400 text-right">
            كلما أجبت على أسئلة أكثر، كسبت نقاط أكثر للدوران
          </p>
        </Card>
      </motion.div>

      {/* Prize Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="max-w-4xl mx-auto mt-8"
      >
        <Card className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6 text-right">
            توزيع الجوائز
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {wheelPrizes.map((prize, index) => (
              <motion.div
                key={prize.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="text-center p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-3"
                  style={{ backgroundColor: `${prize.color}40` }}
                />
                <p className="font-bold text-white text-sm">{prize.label}</p>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Action Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="max-w-4xl mx-auto mt-8 mb-8"
      >
        <Button
          onClick={() => setLocation("/quiz")}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 rounded-2xl text-lg"
        >
          استمر في الإجابة لكسب نقاط أكثر
        </Button>
      </motion.div>
    </div>
  );
}
