import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ar } from "@/locales/ar";
import { useLocation } from "wouter";
import { LogOut, Brain, TrendingUp, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";

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
  const [showLogout, setShowLogout] = useState(false);

  // Get session from localStorage
  const sessionId = typeof window !== "undefined" ? localStorage.getItem("sessionId") : null;

  // Fetch session data from server
  const sessionQuery = trpc.session.get.useQuery(
    { sessionId: sessionId ?? "" },
    { enabled: !!sessionId, refetchInterval: 5000 }
  );

  // Fetch AI report
  const reportQuery = trpc.analytics.report.useQuery(
    { sessionId: sessionId ?? "" },
    {
      enabled: !!sessionId,
      refetchInterval: 5000,
    }
  );

  const session = sessionQuery.data;
  const report = reportQuery.data;

  const handleLogout = () => {
    localStorage.removeItem("sessionId");
    setLocation("/");
  };

  const getTrustLabel = (score: number) => {
    if (score < 40) return { text: ar.trustLevel.low, color: "text-[#ED1C24]" };
    if (score < 70) return { text: ar.trustLevel.medium, color: "text-[#888]" };
    return { text: ar.trustLevel.high, color: "text-white" };
  };

  const trustScore = session?.trustScore ?? 45;
  const trust = getTrustLabel(trustScore);
  const points = session?.points ?? 0;
  const level = Math.min(3, Math.floor(trustScore / 25));
  const questionsAnswered = session?.questionsAnswered ?? 0;

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-400";
    if (score >= 50) return "text-amber-400";
    return "text-[#ED1C24]";
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 75) return "bg-emerald-400";
    if (score >= 50) return "bg-amber-400";
    return "bg-[#ED1C24]";
  };

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
            <span className="text-7xl font-black text-white">{points}</span>
            <span className="text-[#555] text-lg">نقطة</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs px-2 py-1 border border-[#333] text-[#888]">
              المستوى {level} — {levelNames[level]}
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
              {trustScore}
              <span className="text-[#333] text-lg font-normal">/100</span>
            </span>
            <span className={`text-sm font-medium ${trust.color}`}>{trust.text}</span>
          </div>
          {/* Trust bar */}
          <div className="h-[3px] bg-[#1A1A1A] w-full">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${trustScore}%` }}
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
              <span className="text-white text-xl font-bold">{questionsAnswered}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#888] text-sm">{ar.session.streak}</span>
              <span className="text-white text-xl font-bold">{session?.streak ?? 0} أيام</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="section-divider mb-12" />

        {/* AI Performance Report */}
        <motion.div variants={fadeUp} className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Brain size={16} className="text-[#ED1C24]" />
            <p className="text-[#555] text-xs uppercase tracking-widest">
              تقرير الذكاء الاصطناعي
            </p>
          </div>

          <AnimatePresence mode="sync">
            {/* No report yet */}
            {(!report || report.status === "none") && (
              <motion.div
                key="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border border-[#1A1A1A] p-6 text-center"
              >
                <Sparkles size={24} className="text-[#333] mx-auto mb-3" />
                <p className="text-[#555] text-sm">
                  {"message" in (report ?? {}) ? (report as any).message : "جاوب على 5 أسئلة على الأقل باش تحصل على تقرير AI."}
                </p>
              </motion.div>
            )}

            {/* Pending — analyzing */}
            {report?.status === "pending" && (
              <motion.div
                key="pending"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border border-[#222] p-6 text-center"
              >
                <RefreshCw size={20} className="text-[#ED1C24] mx-auto mb-3 animate-spin" />
                <p className="text-[#888] text-sm font-medium">جاري تحليل إجاباتك...</p>
                <p className="text-[#444] text-xs mt-1">الذكاء الاصطناعي يقيّم أداءك</p>
              </motion.div>
            )}

            {/* Error */}
            {report?.status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border border-[#ED1C24]/20 p-6 text-center"
              >
                <AlertCircle size={20} className="text-[#ED1C24] mx-auto mb-3" />
                <p className="text-[#888] text-sm">ما نجمناش نحللو إجاباتك. حاول مرة أخرى.</p>
              </motion.div>
            )}

            {/* Ready — show full report */}
            {report?.status === "ready" && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                {/* Overall Score */}
                <div className="border border-[#222] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[#555] text-xs uppercase tracking-widest">الأداء العام</span>
                    <span className={`text-3xl font-black ${getScoreColor(report.overallScore ?? 0)}`}>
                      {report.overallScore}
                      <span className="text-[#333] text-sm font-normal">/100</span>
                    </span>
                  </div>
                  <div className="h-[3px] bg-[#1A1A1A] w-full mb-4">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${report.overallScore ?? 0}%` }}
                      transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                      className={`h-full ${getScoreBarColor(report.overallScore ?? 0)}`}
                    />
                  </div>
                  <p className="text-[#888] text-sm leading-relaxed" dir="rtl">
                    {report.summary}
                  </p>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="border border-[#1A1A1A] p-4 text-center">
                    <p className="text-[#444] text-[10px] uppercase tracking-widest mb-2">المشاركة</p>
                    <p className="text-white text-sm font-bold">{report.engagementLevel}</p>
                  </div>
                  <div className="border border-[#1A1A1A] p-4 text-center">
                    <p className="text-[#444] text-[10px] uppercase tracking-widest mb-2">العمق</p>
                    <p className="text-white text-sm font-bold">{report.answerDepth}</p>
                  </div>
                  <div className="border border-[#1A1A1A] p-4 text-center">
                    <p className="text-[#444] text-[10px] uppercase tracking-widest mb-2">الاتساق</p>
                    <p className="text-white text-sm font-bold">{report.consistencyRating}</p>
                  </div>
                </div>

                {/* Strengths */}
                {report.strengths && report.strengths.length > 0 && (
                  <div className="border border-[#1A1A1A] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp size={14} className="text-emerald-400" />
                      <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest">نقاط القوة</p>
                    </div>
                    <ul className="space-y-2" dir="rtl">
                      {report.strengths.map((s: string, i: number) => (
                        <li key={i} className="text-[#888] text-sm flex items-start gap-2">
                          <span className="text-emerald-400/60 mt-0.5">●</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {report.improvements && report.improvements.length > 0 && (
                  <div className="border border-[#1A1A1A] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={14} className="text-amber-400" />
                      <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest">نقاط التحسين</p>
                    </div>
                    <ul className="space-y-2" dir="rtl">
                      {report.improvements.map((s: string, i: number) => (
                        <li key={i} className="text-[#888] text-sm flex items-start gap-2">
                          <span className="text-amber-400/60 mt-0.5">●</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Generated timestamp */}
                <p className="text-[#333] text-[10px] text-center uppercase tracking-widest pt-2">
                  🤖 تم إنشاء التقرير بواسطة الذكاء الاصطناعي
                </p>
              </motion.div>
            )}
          </AnimatePresence>
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
