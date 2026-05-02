import React, { useState } from "react";
import { motion } from "framer-motion";
import { ar } from "@/locales/ar";
import { useLocation } from "wouter";
import { LogOut } from "lucide-react";

interface UserProfile {
  sessionId: string;
  level: number;
  trustScore: number;
  totalPoints: number;
  questionsAnswered: number;
  joinDate: string;
  sessionTime: number;
  streak: number;
  averageResponseTime: number;
}

const mockProfile: UserProfile = {
  sessionId: "session_123",
  level: 2,
  trustScore: 68,
  totalPoints: 450,
  questionsAnswered: 28,
  joinDate: "2026-04-15",
  sessionTime: 145,
  streak: 7,
  averageResponseTime: 3.2,
};

const levelNames = ["مبتدئ", "متوسط", "متقدم", "خبير"];

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const [profile] = useState<UserProfile>(mockProfile);
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("sessionId");
    setLocation("/");
  };

  const getTrustLabel = (score: number) => {
    if (score < 40) return { text: ar.trustLevel.low, color: "text-[#ED1C24]" };
    if (score < 70) return { text: ar.trustLevel.medium, color: "text-[#888]" };
    return { text: ar.trustLevel.high, color: "text-white" };
  };

  const trust = getTrustLabel(profile.trustScore);

  return (
    <div className="min-h-screen">
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="max-w-2xl mx-auto px-5 pt-12 pb-8"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="mb-16">
          <p className="label-red mb-3">Profile</p>
          <h1 className="text-5xl font-bold text-white">{ar.profile.title}</h1>
        </motion.div>

        {/* Points — Hero stat */}
        <motion.div variants={fadeUp} className="mb-16">
          <p className="text-[#555] text-xs uppercase tracking-widest mb-3">
            {ar.profile.totalPoints}
          </p>
          <div className="flex items-baseline gap-3">
            <span className="text-7xl font-black text-white">{profile.totalPoints}</span>
            <span className="text-[#555] text-lg">نقطة</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs px-2 py-1 border border-[#333] text-[#888]">
              المستوى {profile.level} — {levelNames[profile.level]}
            </span>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="section-divider mb-12" />

        {/* Trust Score */}
        <motion.div variants={fadeUp} className="mb-12">
          <p className="text-[#555] text-xs uppercase tracking-widest mb-4">
            {ar.profile.trustScore}
          </p>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-3xl font-bold ${trust.color}`}>
              {profile.trustScore}
              <span className="text-[#333] text-lg font-normal">/100</span>
            </span>
            <span className={`text-sm font-medium ${trust.color}`}>{trust.text}</span>
          </div>
          {/* Trust bar */}
          <div className="h-[3px] bg-[#1A1A1A] w-full">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${profile.trustScore}%` }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="h-full bg-[#ED1C24]"
            />
          </div>
          <p className="text-[#333] text-xs mt-3">
            بناءً على سرعة الإجابة • الاستقرار • الاكتمال
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="section-divider mb-12" />

        {/* Activity Stats */}
        <motion.div variants={fadeUp} className="mb-12">
          <p className="text-[#555] text-xs uppercase tracking-widest mb-6">
            النشاط
          </p>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[#888] text-sm">{ar.profile.questionsAnswered}</span>
              <span className="text-white text-xl font-bold">{profile.questionsAnswered}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#888] text-sm">{ar.session.streak}</span>
              <span className="text-white text-xl font-bold">{profile.streak} أيام</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#888] text-sm">متوسط الإجابة</span>
              <span className="text-white text-xl font-bold">{profile.averageResponseTime}ث</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="section-divider mb-8" />

        {/* Actions */}
        <motion.div variants={fadeUp} className="space-y-3">
          <button
            onClick={() => setLocation("/quiz")}
            className="w-full bg-[#ED1C24] hover:bg-[#D91920] text-white font-semibold py-4 transition-colors"
          >
            استمر في الإجابة
          </button>

          <button
            onClick={() => setShowLogout(true)}
            className="w-full border border-[#222] hover:border-[#444] text-[#888] hover:text-white py-4 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            {ar.profile.logout}
          </button>
        </motion.div>
      </motion.div>

      {/* Logout Modal */}
      {showLogout && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-5 z-50"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm border border-[#222] bg-black p-8"
          >
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-3">
                هل متأكد من الخروج؟
              </h2>
              <p className="text-[#666] text-sm mb-8">
                ستفقد جلستك الحالية
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogout(false)}
                  className="flex-1 border border-[#333] text-[#888] hover:text-white hover:border-[#555] py-3 transition-colors text-sm font-medium"
                >
                  {ar.cancel}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-[#ED1C24] hover:bg-[#D91920] text-white py-3 transition-colors text-sm font-semibold"
                >
                  {ar.profile.logout}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
