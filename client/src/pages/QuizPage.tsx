import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QuestionCard, Question } from "@/components/QuestionCard";
import { BejiAvatar } from "@/components/BejiAvatar";
import { ar } from "@/locales/ar";

// ─── 10 Static Demo Questions ─────────────────────────────────────
// Written in Tunisian Darija. Covers: brand preference, satisfaction,
// habits, and open-ended — typical for Tunisian market surveys.
const DEMO_QUESTIONS: Question[] = [
  // Q1 — Brand Swipe: Boga vs Fanta (images only, no text in options)
  {
    id: "q1-boga-fanta",
    type: "swipe",
    text: "أشنوّا تحب تشرب?",
    options: [
      { id: "boga", label: "Boga", labelAr: "بوقا", imageUrl: "/assets/beji/boga.jfif" },
      { id: "fanta", label: "Fanta", labelAr: "فانتا", imageUrl: "/assets/beji/fanta.png" },
    ],
    difficulty: "easy",
    pointsValue: 10,
  },

  // Q2 — Choice: Shopping frequency
  {
    id: "q2-shopping-freq",
    type: "choice",
    text: "قدّاش تمشي للسوبرمارشي?",
    options: [
      { id: "daily", label: "Daily", labelAr: "كل يوم" },
      { id: "weekly", label: "Weekly", labelAr: "مرّة فالأسبوع" },
      { id: "monthly", label: "Monthly", labelAr: "مرّة فالشهر" },
      { id: "rarely", label: "Rarely", labelAr: "نادراً" },
    ],
    difficulty: "easy",
    pointsValue: 10,
  },

  // Q3 — Rating: Mobile network satisfaction
  {
    id: "q3-network-rating",
    type: "rating",
    text: "كيفاش تلقى الرّيزو متاع تيليفونك?",
    difficulty: "easy",
    pointsValue: 15,
  },

  // Q4 — Choice: Payment method
  {
    id: "q4-payment-method",
    type: "choice",
    text: "كيفاش تحب تخلّص?",
    options: [
      { id: "cash", label: "Cash", labelAr: "كاش" },
      { id: "card", label: "Card", labelAr: "كارط" },
      { id: "mobile", label: "Mobile", labelAr: "موبايل" },
      { id: "edinar", label: "E-Dinar", labelAr: "إي-دينار" },
    ],
    difficulty: "easy",
    pointsValue: 10,
  },

  // Q5 — Swipe: Netflix vs Spotify
  {
    id: "q5-netflix-spotify",
    type: "swipe",
    text: "وين تقضّي وقتك أكثر?",
    options: [
      { id: "netflix", label: "Netflix", labelAr: "نتفليكس", imageUrl: "/assets/beji/netflix.png" },
      { id: "spotify", label: "Spotify", labelAr: "سبوتيفاي", imageUrl: "/assets/beji/spotify.png" },
    ],
    difficulty: "easy",
    pointsValue: 10,
  },

  // Q6 — Rating: Delivery service satisfaction
  {
    id: "q6-delivery-rating",
    type: "rating",
    text: "قدّاش راضي على خدمة التوصيل?",
    difficulty: "medium",
    pointsValue: 15,
  },

  // Q7 — Choice: Social media platform
  {
    id: "q7-social-media",
    type: "choice",
    text: "أشنوّا أكثر تطبيقة تستعملها?",
    options: [
      { id: "facebook", label: "Facebook", labelAr: "فيسبوك" },
      { id: "instagram", label: "Instagram", labelAr: "انستا" },
      { id: "tiktok", label: "TikTok", labelAr: "تيكتوك" },
      { id: "youtube", label: "YouTube", labelAr: "يوتيوب" },
    ],
    difficulty: "easy",
    pointsValue: 10,
  },

  // Q8 — Swipe: Carrefour vs Glovo (online vs offline)
  {
    id: "q8-carrefour-glovo",
    type: "swipe",
    text: "تحب تشري من الحانوت وإلاّ أونلاين?",
    options: [
      { id: "carrefour", label: "Carrefour", labelAr: "كارفور", imageUrl: "/assets/beji/carrefour.png" },
      { id: "glovo", label: "Glovo", labelAr: "قلوفو", imageUrl: "/assets/beji/glovo.png" },
    ],
    difficulty: "easy",
    pointsValue: 10,
  },

  // Q9 — Open ended: Product feedback
  {
    id: "q9-open-feedback",
    type: "open_ended",
    text: "شنوّة الحاجة إلّي تحب تتبدّل في حيّك?",
    difficulty: "hard",
    pointsValue: 25,
  },

  // Q10 — Rating: Overall satisfaction
  {
    id: "q10-overall-rating",
    type: "rating",
    text: "بشكل عام، قدّاش أنت راضي على حياتك اليومية?",
    difficulty: "easy",
    pointsValue: 15,
  },
];

export default function QuizPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [points, setPoints] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Merged reward state
  const [rewardPhase, setRewardPhase] = useState<null | "showing">(null);
  const [lastEarned, setLastEarned] = useState(0);

  const currentQuestion =
    currentIndex < DEMO_QUESTIONS.length && !rewardPhase
      ? DEMO_QUESTIONS[currentIndex]
      : null;

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = "";
    };
  }, []);

  const advanceToNext = useCallback(() => {
    setRewardPhase(null);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const handleAnswer = useCallback(
    async (answer: string, responseTime: number) => {
      if (!currentQuestion) return;

      setIsLoading(true);

      // Simulate a tiny server delay for realism
      await new Promise((resolve) => setTimeout(resolve, 300));

      const earned = currentQuestion.pointsValue;
      setLastEarned(earned);
      setPoints((prev) => prev + earned);
      setQuestionsAnswered((prev) => prev + 1);
      setIsLoading(false);

      // Let the thank-you bubble show briefly
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Show merged reward screen
      setRewardPhase("showing");

      // Auto-advance after 2.5s
      setTimeout(() => advanceToNext(), 2500);
    },
    [currentQuestion, advanceToNext]
  );

  const handleSkip = useCallback(() => {
    setQuestionsAnswered((prev) => prev + 1);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const progress = (questionsAnswered / DEMO_QUESTIONS.length) * 100;
  const isComplete = currentIndex >= DEMO_QUESTIONS.length && !rewardPhase;

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      {/* Progress bar */}
      <div className="h-[2px] bg-[#1A1A1A] w-full flex-shrink-0">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full bg-[#ED1C24]"
        />
      </div>

      {/* Question counter */}
      <div className="flex justify-between items-center px-5 py-3 max-w-lg mx-auto w-full flex-shrink-0">
        <span className="text-[#555] text-xs font-medium tracking-wide">
          {Math.min(questionsAnswered + 1, DEMO_QUESTIONS.length)}/{DEMO_QUESTIONS.length}
        </span>
        <span className="text-[#555] text-xs font-medium">
          {points} نقطة
        </span>
      </div>

      {/* Main content — centered, no scroll */}
      <div className="flex-1 flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          {/* Question Card */}
          {currentQuestion && !rewardPhase && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full"
            >
              <QuestionCard
                question={currentQuestion}
                onAnswer={handleAnswer}
                onSkip={handleSkip}
                isLoading={isLoading}
              />
            </motion.div>
          )}

          {/* Merged Reward Screen: Beji grateful + Score */}
          {rewardPhase === "showing" && (
            <motion.div
              key="reward"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full flex flex-col items-center text-center gap-4"
            >
              <BejiAvatar mode="grateful" size="lg" />

              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <p className="text-[#ED1C24] text-4xl sm:text-5xl font-black mb-1">
                  +{lastEarned}
                </p>
                <p className="text-white text-sm font-bold mb-1">شكراً على جوابك!</p>
                <p className="text-[#555] text-xs">رصيدك: {points} نقطة</p>
              </motion.div>

              {/* Auto-progress indicator */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.5, ease: "linear" }}
                className="h-[2px] bg-[#ED1C24]/40 mt-4 max-w-[120px]"
              />
            </motion.div>
          )}

          {/* Completion */}
          {isComplete && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-sm mx-auto w-full"
            >
              <BejiAvatar mode="grateful" size="lg" className="mx-auto mb-4" />
              <p className="label-red mb-3">Mission Complete</p>
              <h2 className="text-3xl font-bold text-white mb-3">مبروك!</h2>
              <p className="text-[#888] text-sm mb-6">أكملت جميع الأسئلة بنجاح</p>

              <div className="border border-[#222] py-5 px-6 mb-6">
                <p className="text-[#555] text-xs uppercase tracking-widest mb-1">إجمالي النقاط</p>
                <p className="text-white text-4xl font-bold">{points}</p>
              </div>

              <button
                onClick={() => (window.location.href = "/")}
                className="w-full bg-[#ED1C24] hover:bg-[#D91920] text-white font-semibold py-3.5 transition-colors text-sm"
              >
                {ar.buttons.goHome}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
