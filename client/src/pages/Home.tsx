import React from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowLeft, Disc3, ShoppingBag } from "lucide-react";

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-black">
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="max-w-2xl mx-auto px-5 pt-16 pb-8"
      >
        {/* Hero — Editorial Typography */}
        <motion.div variants={fadeUp} className="mb-20">
          <p className="label-red mb-6">Behavioral Intelligence Platform</p>

          <h1 className="text-6xl sm:text-7xl font-black text-white leading-[0.95] tracking-tight mb-6">
            شنوا
            <br />
            <span className="text-outline">رايك</span>
            <span className="text-[#ED1C24]">؟</span>
          </h1>

          <p className="text-[#888] text-lg max-w-md leading-relaxed mt-8">
            أعطينا رأيك، اكسب نقاط، واحصل على هدايا حقيقية.
            <br />
            كل جواب يحسب.
          </p>
        </motion.div>

        {/* Primary CTA — Answer Questions */}
        <motion.div variants={fadeUp} className="mb-4">
          <button
            onClick={() => setLocation("/quiz")}
            className="w-full group relative overflow-hidden bg-[#ED1C24] hover:bg-[#D91920] transition-colors py-6 px-8 flex items-center justify-between"
          >
            <div className="text-right">
              <span className="block text-white/70 text-xs font-medium uppercase tracking-widest mb-1">
                ابدأ الآن
              </span>
              <span className="block text-white text-2xl font-bold">
                جاوب على الأسئلة
              </span>
            </div>
            <ArrowLeft
              size={24}
              className="text-white group-hover:-translate-x-1 transition-transform"
            />
          </button>
        </motion.div>

        {/* Secondary Actions — Two columns */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4 mb-20">
          <button
            onClick={() => setLocation("/roue")}
            className="group border border-[#222] hover:border-[#444] transition-colors py-8 px-6 text-center"
          >
            <Disc3
              size={28}
              className="text-[#ED1C24] mx-auto mb-4 group-hover:rotate-180 transition-transform duration-700"
            />
            <span className="block text-white text-base font-semibold mb-1">
              روّح الحظ
            </span>
            <span className="block text-[#666] text-xs">
              دور واربح جوائز
            </span>
          </button>

          <button
            onClick={() => setLocation("/marchi")}
            className="group border border-[#222] hover:border-[#444] transition-colors py-8 px-6 text-center"
          >
            <ShoppingBag
              size={28}
              className="text-[#ED1C24] mx-auto mb-4 group-hover:scale-110 transition-transform"
            />
            <span className="block text-white text-base font-semibold mb-1">
              السوق
            </span>
            <span className="block text-[#666] text-xs">
              حوّل نقاطك لهدايا
            </span>
          </button>
        </motion.div>

        {/* Insight Teaser */}
        <motion.div variants={fadeUp} className="section-divider mb-12" />

        <motion.div variants={fadeUp} className="mb-8">
          <p className="label-red mb-4">Behavioral Insight</p>
          <p className="text-white/90 text-2xl sm:text-3xl font-light leading-relaxed italic">
            "المستخدمين كيفك يفضلو المحتوى المرئي 2x أكثر من النصوص"
          </p>
          <p className="text-[#555] text-sm mt-4">
            — بناءً على تحليل سلوك المستخدمين
          </p>
        </motion.div>

        {/* Footer tag */}
        <motion.div variants={fadeUp} className="section-divider mb-6" />
        <motion.p variants={fadeUp} className="text-[#333] text-xs text-center tracking-widest uppercase">
          Chnouwa Rayek? — رأيك يهمنا
        </motion.p>
      </motion.div>
    </div>
  );
}
