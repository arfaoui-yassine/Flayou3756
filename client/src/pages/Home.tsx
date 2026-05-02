import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowLeft, Disc3, ShoppingBag } from "lucide-react";
import { BejiAvatar } from "@/components/BejiAvatar";

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function Home() {
  const [, setLocation] = useLocation();

  // Lock body scroll on this page only
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="flex-1 flex flex-col max-w-lg mx-auto w-full px-5 pt-10 pb-4 gap-5"
      >
        {/* Hero — Compact character + title */}
        <motion.div variants={fadeUp} className="relative flex items-end gap-4" style={{ overflow: "visible" }}>
          {/* Beji breaking out from left */}
          <div className="flex-shrink-0 relative" style={{ width: 100, height: 110 }}>
            <div className="absolute" style={{ bottom: 0, left: -10 }}>
              <BejiAvatar mode="waving" size="md" />
            </div>
          </div>

          {/* Text block */}
          <div className="flex-1 pb-1">
            <p className="text-[#ED1C24] text-[10px] uppercase tracking-[0.2em] font-black mb-1">عَمّ الباجي</p>
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-[1.05] tracking-tight">
              شنوا رايك؟
              <br />
              <span className="text-[#ED1C24]">عَمّ الباجي</span>
            </h1>
            <p className="text-[#666] text-xs mt-2 leading-relaxed">
              كل جواب يربحك ويربحنا
            </p>
          </div>
        </motion.div>

        {/* Primary CTA */}
        <motion.div variants={fadeUp}>
          <button
            onClick={() => setLocation("/quiz")}
            className="w-full group relative overflow-hidden bg-[#ED1C24] hover:bg-[#D91920] transition-colors py-5 px-6 flex items-center justify-between"
          >
            <div className="text-right">
              <span className="block text-white/70 text-[10px] font-medium uppercase tracking-widest mb-0.5">
                ابدأ الآن
              </span>
              <span className="block text-white text-xl font-bold">
                جاوب على الأسئلة
              </span>
            </div>
            <ArrowLeft
              size={22}
              className="text-white group-hover:-translate-x-1 transition-transform"
            />
          </button>
        </motion.div>

        {/* Secondary Actions */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setLocation("/roue")}
            className="group border border-[#222] hover:border-[#444] transition-colors py-6 px-4 text-center"
          >
            <Disc3
              size={24}
              className="text-[#ED1C24] mx-auto mb-3 group-hover:rotate-180 transition-transform duration-700"
            />
            <span className="block text-white text-sm font-semibold mb-0.5">
              دوّر العجلة
            </span>
            <span className="block text-[#555] text-xs">
              دور واربح جوائز
            </span>
          </button>

          <button
            onClick={() => setLocation("/marchi")}
            className="group border border-[#222] hover:border-[#444] transition-colors py-6 px-4 text-center"
          >
            <ShoppingBag
              size={24}
              className="text-[#ED1C24] mx-auto mb-3 group-hover:scale-110 transition-transform"
            />
            <span className="block text-white text-sm font-semibold mb-0.5">
              السوق
            </span>
            <span className="block text-[#555] text-xs">
              حوّل نقاطك لهدايا
            </span>
          </button>
        </motion.div>

        {/* Footer tag */}
        <motion.p
          variants={fadeUp}
          className="text-[#2a2a2a] text-[10px] text-center tracking-widest uppercase mt-auto"
        >
          Chnouwa Rayek? — رأيك يهمنا
        </motion.p>
      </motion.div>
    </div>
  );
}
