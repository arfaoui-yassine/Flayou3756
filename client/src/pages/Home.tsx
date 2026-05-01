import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ar } from "@/locales/ar";
import { useLocation } from "wouter";
import { MessageCircle, Zap, Gift, Dice5, Target, ArrowRight } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();

  const handleStart = () => {
    setLocation("/quiz");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        {/* Hero Section */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="mb-12 text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl mx-auto flex items-center justify-center mb-8 shadow-2xl">
            <Target size={48} className="text-white" />
          </div>

          <h1 className="text-6xl font-bold text-white mb-4 leading-tight">
            {ar.home.title}
          </h1>
          <p className="text-xl text-white/90 mb-3">{ar.home.subtitle}</p>
          <p className="text-lg text-white/70">{ar.home.tagline}</p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:border-red-600/30 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-red-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={28} className="text-red-500" />
                </div>
                <div className="text-right">
                  <h3 className="text-white font-bold mb-1 text-lg">أسئلة سريعة</h3>
                  <p className="text-white/70 text-sm">أجب على أسئلة بسيطة و سريعة</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:border-red-600/30 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-red-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap size={28} className="text-red-500" />
                </div>
                <div className="text-right">
                  <h3 className="text-white font-bold mb-1 text-lg">اكسب نقاط</h3>
                  <p className="text-white/70 text-sm">احصل على نقاط مع كل إجابة</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:border-red-600/30 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-red-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Gift size={28} className="text-red-500" />
                </div>
                <div className="text-right">
                  <h3 className="text-white font-bold mb-1 text-lg">هدايا حقيقية</h3>
                  <p className="text-white/70 text-sm">حول نقاطك لهدايا و مكافآت</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:border-red-600/30 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-red-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Dice5 size={28} className="text-red-500" />
                </div>
                <div className="text-right">
                  <h3 className="text-white font-bold mb-1 text-lg">Rouet el Hadh</h3>
                  <p className="text-white/70 text-sm">دور الحظ و اربح جوائز كبيرة</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={handleStart}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 rounded-2xl text-lg shadow-2xl flex items-center justify-center gap-2 group"
          >
            {ar.home.startButton}
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-white/50 text-sm mt-8"
        >
          Chnouwa Rayek? - رأيك يهمنا
        </motion.p>
      </motion.div>
    </div>
  );
}
