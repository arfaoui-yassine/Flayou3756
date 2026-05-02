import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QuestionCard } from "@/components/QuestionCard";
import { BejiAvatar } from "@/components/BejiAvatar";
import { trpc } from "@/lib/trpc";
import { ar } from "@/locales/ar";

interface Question {
  id: string;
  type: "swipe" | "rating" | "choice" | "open_ended";
  text: string;
  options?: Array<{ id: string; label: string; labelAr: string }>;
  difficulty: string;
  pointsValue: number;
}

export default function QuizPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [points, setPoints] = useState(0);
  const [trustScore, setTrustScore] = useState(45);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Merged reward state: appreciation + score in one screen
  const [rewardPhase, setRewardPhase] = useState<null | "showing">(null);
  const [lastEarned, setLastEarned] = useState(0);

  const submitAnswerMutation = trpc.submit.answer.useMutation();
  const trackEventMutation = trpc.behavior.trackEvent.useMutation();
  const createSessionMutation = trpc.session.create.useMutation();

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

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      const storedSessionId = localStorage.getItem("sessionId");
      if (storedSessionId) {
        setSessionId(storedSessionId);
      } else {
        try {
          const result = await createSessionMutation.mutateAsync();
          localStorage.setItem("sessionId", result.sessionId);
          setSessionId(result.sessionId);
        } catch (error) {
          console.error("Failed to create session:", error);
        }
      }
    };
    initSession();
  }, []);

  // Load next question
  useEffect(() => {
    const loadQuestion = async () => {
      if (!sessionId) return;

      try {
        setIsLoading(true);
        const mockQuestions: Question[] = [
          {
            id: "q1",
            type: "swipe",
            text: "أنهي براند تفضل؟",
            options: [
              { id: "opt1", label: "Boga", labelAr: "بوقة", imageUrl: "/assets/brands/boga.png" },
              { id: "opt2", label: "Fanta", labelAr: "فانتا", imageUrl: "/assets/brands/fanta.png" },
            ],
            difficulty: "easy",
            pointsValue: 10,
          },
          {
            id: "q2",
            type: "swipe",
            text: "أنهي شراب تختار؟",
            options: [
              { id: "opt1", label: "Hamoud", labelAr: "حمود", imageUrl: "/assets/brands/hamoud.png" },
              { id: "opt2", label: "Coca-Cola", labelAr: "كوكا كولا", imageUrl: "/assets/brands/coca.png" },
            ],
            difficulty: "easy",
            pointsValue: 10,
          },
          {
            id: "q3",
            type: "rating",
            text: "قيّم رضاك عن جوميا",
            difficulty: "easy",
            pointsValue: 10,
          },
          {
            id: "q4",
            type: "choice",
            text: "أنهي منصة تسوق تفضل؟",
            options: [
              { id: "opt1", label: "Jumia", labelAr: "جوميا" },
              { id: "opt2", label: "Glovo", labelAr: "جلوفو" },
              { id: "opt3", label: "Carrefour", labelAr: "كارفور" },
            ],
            difficulty: "easy",
            pointsValue: 15,
          },
          {
            id: "q5",
            type: "open_ended",
            text: "أنهي فئة منتجات تفضل؟",
            difficulty: "medium",
            pointsValue: 20,
          },
        ];

        const randomQuestion = mockQuestions[Math.floor(Math.random() * mockQuestions.length)];
        setCurrentQuestion(randomQuestion);
      } catch (error) {
        console.error("Failed to load question:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId && !currentQuestion && !rewardPhase) {
      loadQuestion();
    }
  }, [sessionId, currentQuestion, rewardPhase]);

  const handleAnswer = async (answer: string, responseTime: number) => {
    if (!sessionId || !currentQuestion) return;

    try {
      setIsLoading(true);
      const result = await submitAnswerMutation.mutateAsync({
        sessionId,
        questionId: currentQuestion.id,
        answer,
        responseTime,
        wasSkipped: false,
      });

      setIsLoading(false);

      // Single merged reward screen: appreciation + score together
      setLastEarned(result.pointsEarned);
      setPoints(result.totalPoints);
      setTrustScore(result.newTrustScore);
      setQuestionsAnswered(prev => prev + 1);

      // Quick pause to let the card's speech bubble show (0.8s)
      await new Promise(resolve => setTimeout(resolve, 800));

      // Show merged reward screen
      setRewardPhase("showing");
      setCurrentQuestion(null);

      // Auto-advance to next question after 2.5s
      setTimeout(() => {
        setRewardPhase(null);
      }, 2500);
    } catch (error) {
      console.error("Failed to submit answer:", error);
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!sessionId || !currentQuestion) return;

    try {
      setIsLoading(true);
      await trackEventMutation.mutateAsync({
        sessionId,
        eventType: "question_skipped",
      });
      setCurrentQuestion(null);
    } catch (error) {
      console.error("Failed to track skip:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (questionsAnswered / 10) * 100;

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
          {questionsAnswered}/10
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
                <p className="text-[#555] text-xs">
                  رصيدك: {points} نقطة
                </p>
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

          {/* Loading between questions */}
          {isLoading && !currentQuestion && !rewardPhase && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="w-6 h-6 border-2 border-[#333] border-t-[#ED1C24] rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[#555] text-xs">{ar.loading}</p>
            </motion.div>
          )}

          {/* Completion */}
          {questionsAnswered >= 10 && !currentQuestion && !rewardPhase && (
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
