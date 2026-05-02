import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QuestionCard } from "@/components/QuestionCard";
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
  const [showReward, setShowReward] = useState(false);
  const [lastReward, setLastReward] = useState<{ points: number; trustScore: number } | null>(null);

  const submitAnswerMutation = trpc.submit.answer.useMutation();
  const trackEventMutation = trpc.behavior.trackEvent.useMutation();
  const createSessionMutation = trpc.session.create.useMutation();

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
              { id: "opt1", label: "Hamoud Frères", labelAr: "حمود فريرز" },
              { id: "opt2", label: "Boga", labelAr: "بوقة" },
            ],
            difficulty: "easy",
            pointsValue: 10,
          },
          {
            id: "q2",
            type: "rating",
            text: "قيّم رضاك عن جوميا",
            difficulty: "easy",
            pointsValue: 10,
          },
          {
            id: "q3",
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
            id: "q4",
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

    if (sessionId && !currentQuestion) {
      loadQuestion();
    }
  }, [sessionId, currentQuestion]);

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

      // Phase 1: Stop loading — QuestionCard shows "grateful" Beji
      setIsLoading(false);

      // Let the user see Beji's grateful reaction for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Phase 2: Show points reward
      setLastReward({
        points: result.pointsEarned,
        trustScore: result.newTrustScore,
      });
      setShowReward(true);
      setPoints(result.totalPoints);
      setTrustScore(result.newTrustScore);
      setQuestionsAnswered(questionsAnswered + 1);

      // Phase 3: After 2s, move to next question
      setTimeout(() => {
        setCurrentQuestion(null);
        setShowReward(false);
      }, 2000);
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
    <div className="min-h-screen flex flex-col">
      {/* Progress — Thin line at very top */}
      <div className="h-[2px] bg-[#1A1A1A] w-full">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full bg-[#ED1C24]"
        />
      </div>

      {/* Question counter */}
      <div className="flex justify-between items-center px-5 py-4 max-w-md mx-auto w-full">
        <span className="text-[#555] text-xs font-medium tracking-wide">
          {questionsAnswered}/10
        </span>
        <span className="text-[#555] text-xs font-medium">
          {points} نقطة
        </span>
      </div>

      {/* Main content — centered */}
      <div className="flex-1 flex items-center justify-center px-5 py-8">
        <AnimatePresence mode="wait">
          {currentQuestion && !showReward && (
            <div key={currentQuestion.id}>
              <QuestionCard
                question={currentQuestion}
                onAnswer={handleAnswer}
                onSkip={handleSkip}
                isLoading={isLoading}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Reward — Simple text fade */}
        <AnimatePresence>
          {showReward && lastReward && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <p className="text-[#ED1C24] text-5xl font-bold mb-3">
                +{lastReward.points}
              </p>
              <p className="text-[#888] text-sm">{ar.mission.thankYou}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {isLoading && !currentQuestion && !showReward && (
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#333] border-t-[#ED1C24] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#555] text-sm">{ar.loading}</p>
          </div>
        )}

        {/* Completion */}
        {questionsAnswered >= 10 && !currentQuestion && !showReward && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-sm mx-auto"
          >
            <p className="label-red mb-4">Mission Complete</p>
            <h2 className="text-4xl font-bold text-white mb-4">مبروك!</h2>
            <p className="text-[#888] mb-8">أكملت جميع الأسئلة بنجاح</p>

            <div className="border border-[#222] py-6 px-8 mb-8">
              <p className="text-[#555] text-xs uppercase tracking-widest mb-2">إجمالي النقاط</p>
              <p className="text-white text-5xl font-bold">{points}</p>
            </div>

            <button
              onClick={() => (window.location.href = "/")}
              className="w-full bg-[#ED1C24] hover:bg-[#D91920] text-white font-semibold py-4 transition-colors"
            >
              {ar.buttons.goHome}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
