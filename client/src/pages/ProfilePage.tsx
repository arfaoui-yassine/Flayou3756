import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ar } from "@/locales/ar";
import { useLocation } from "wouter";
import { ArrowRight, LogOut, Award, TrendingUp, Target, Zap, Calendar, Lock } from "lucide-react";

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

const levelColors = [
  "from-gray-400 to-gray-600",
  "from-blue-400 to-blue-600",
  "from-purple-400 to-purple-600",
  "from-yellow-400 to-yellow-600",
];

const levelNames = ["Débutant", "Intermédiaire", "Avancé", "Expert"];

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const [profile] = useState<UserProfile>(mockProfile);
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("sessionId");
    setLocation("/");
  };

  const getTrustLevelLabel = (score: number) => {
    if (score < 40) return ar.trustLevel.low;
    if (score < 70) return ar.trustLevel.medium;
    return ar.trustLevel.high;
  };

  const getTrustLevelColor = (score: number) => {
    if (score < 40) return "text-red-600";
    if (score < 70) return "text-yellow-600";
    return "text-green-600";
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
          <h1 className="text-4xl font-bold text-white">{ar.profile.title}</h1>
          <div className="w-20" />
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Level & Trust Score Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Level Card */}
          <Card className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl p-8 shadow-lg">
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 mb-6"
              >
                <Award size={40} className="text-white" />
              </motion.div>

              <p className="text-gray-400 text-sm mb-2">{ar.profile.level}</p>
              <p className="text-5xl font-bold text-white mb-2">{profile.level}</p>
              <p className="text-xl text-red-500 font-semibold">
                {levelNames[profile.level]}
              </p>

              <div className="mt-6 bg-red-600/10 border border-red-600/20 rounded-xl p-4">
                <p className="text-gray-400 text-sm">النقاط المطلوبة للمستوى التالي</p>
                <p className="text-2xl font-bold text-red-500 mt-1">
                  {(profile.level + 1) * 200 - profile.totalPoints}
                </p>
              </div>
            </div>
          </Card>

          {/* Trust Score Card */}
          <Card className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl p-8 shadow-lg">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity }}
                className="inline-block mb-6"
              >
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-white">{profile.trustScore}</p>
                    <p className="text-white text-sm">/ 100</p>
                  </div>
                </div>
              </motion.div>

              <p className="text-gray-400 text-sm mb-2">{ar.profile.trustScore}</p>
              <p className={`text-2xl font-bold ${getTrustLevelColor(profile.trustScore)}`}>
                {getTrustLevelLabel(profile.trustScore)}
              </p>

              <div className="mt-6 bg-green-600/10 border border-green-600/20 rounded-xl p-4">
                <p className="text-gray-400 text-sm">الثقة بناءً على</p>
                <p className="text-sm text-gray-300 mt-2">
                  سرعة الإجابة • الاستقرار • الاكتمال
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Total Points */}
          <Card className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-red-600/20 rounded-lg p-3">
                <Award size={24} className="text-red-500" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">{ar.profile.totalPoints}</p>
            <p className="text-3xl font-bold text-white">{profile.totalPoints}</p>
          </Card>

          {/* Questions Answered */}
          <Card className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-red-600/20 rounded-lg p-3">
                <Target size={24} className="text-red-500" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">{ar.profile.questionsAnswered}</p>
            <p className="text-3xl font-bold text-white">{profile.questionsAnswered}</p>
          </Card>

          {/* Streak */}
          <Card className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-red-600/20 rounded-lg p-3">
                <Zap size={24} className="text-red-500" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">{ar.session.streak}</p>
            <p className="text-3xl font-bold text-white">{profile.streak} أيام</p>
          </Card>

          {/* Avg Response Time */}
          <Card className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-red-600/20 rounded-lg p-3">
                <TrendingUp size={24} className="text-red-500" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">متوسط الإجابة</p>
            <p className="text-3xl font-bold text-white">{profile.averageResponseTime}ث</p>
          </Card>
        </motion.div>

        {/* Detailed Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6 text-right">
              إحصائيات تفصيلية
            </h2>

            <div className="space-y-4">
              {/* Session Time */}
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                <div>
                  <p className="text-gray-400 text-sm">وقت الجلسة الإجمالي</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {Math.floor(profile.sessionTime / 60)}س {profile.sessionTime % 60}د
                  </p>
                </div>
                <div className="bg-red-600/20 rounded-lg p-3">
                  <Calendar size={24} className="text-red-500" />
                </div>
              </div>

              {/* Join Date */}
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                <div>
                  <p className="text-gray-400 text-sm">تاريخ الانضمام</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {new Date(profile.joinDate).toLocaleDateString("ar-TN")}
                  </p>
                </div>
                <div className="bg-red-600/20 rounded-lg p-3">
                  <Calendar size={24} className="text-red-500" />
                </div>
              </div>

              {/* Session ID */}
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                <div>
                  <p className="text-gray-400 text-sm">معرّف الجلسة</p>
                  <p className="text-sm font-mono text-gray-300 mt-1 text-left">
                    {profile.sessionId}
                  </p>
                </div>
                <div className="bg-red-600/20 rounded-lg p-3">
                  <Lock size={24} className="text-red-500" />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Button
            onClick={() => setLocation("/quiz")}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 rounded-2xl text-lg"
          >
            استمر في الإجابة
          </Button>

          <Button
            onClick={() => setShowLogout(true)}
            variant="outline"
            className="w-full border-2 border-red-600 text-red-600 hover:bg-red-950/30 font-bold py-4 rounded-2xl text-lg"
          >
            <LogOut size={20} className="mr-2" />
            {ar.profile.logout}
          </Button>
        </motion.div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogout && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-red-600/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                <LogOut size={32} className="text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                هل متأكد من الخروج؟
              </h2>
              <p className="text-gray-400 mb-8">
                ستفقد جلستك الحالية. يمكنك العودة لاحقاً.
              </p>

              <div className="flex gap-4">
                <Button
                  onClick={() => setShowLogout(false)}
                  variant="outline"
                  className="flex-1 rounded-lg border-2 border-white/20 text-white hover:bg-white/5"
                >
                  {ar.cancel}
                </Button>
                <Button
                  onClick={handleLogout}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
                >
                  {ar.profile.logout}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
