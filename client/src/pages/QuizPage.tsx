import React, { useState, useEffect, useCallback } from "react";
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
  topic?: string;
  isAISuggested?: boolean;
}

export default function QuizPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionQueue, setQuestionQueue] = useState<Question[]>([]);
  const [points, setPoints] = useState(0);
  const [trustScore, setTrustScore] = useState(45);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Merged reward state: appreciation + score in one screen
  const [rewardPhase, setRewardPhase] = useState<null | "showing">(null);
  const [lastEarned, setLastEarned] = useState(0);
  const [isAISource, setIsAISource] = useState(false);

  const submitAnswerMutation = trpc.submit.answer.useMutation();
  const trackEventMutation = trpc.behavior.trackEvent.useMutation();
  const createSessionMutation = trpc.session.create.useMutation();
  const getSuggestedMutation = trpc.missions.getSuggested.useMutation();

  // Fetch a batch of questions from the n8n workflow
  const fetchQuestions = useCallback(async (sid: string) => {
    try {
      setIsLoading(true);
      const result = await getSuggestedMutation.mutateAsync({ sessionId: sid });
      setIsAISource(result.source === "ai");

      if (result.questions.length > 0) {
        // Set the first question as current, rest go into queue
        setCurrentQuestion(result.questions[0]);
        setQuestionQueue(result.questions.slice(1));
      }
    } catch (error) {
      console.error("Failed to fetch suggested questions:", error);
      setCurrentQuestion(null);
    } finally {
      setIsLoading(false);
    }
  }, [getSuggestedMutation]);

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
      try {
        // Always create a fresh server-side session to avoid stale localStorage references
        const result = await createSessionMutation.mutateAsync();
        localStorage.setItem("sessionId", result.sessionId);
        setSessionId(result.sessionId);
      } catch (error) {
        console.error("Failed to create session:", error);
      }
    };
    initSession();
  }, []);

  // Load questions when session is ready
  useEffect(() => {
    if (sessionId && !currentQuestion && questionQueue.length === 0 && questionsAnswered < 10 && !rewardPhase) {
      fetchQuestions(sessionId);
    }
  }, [sessionId, rewardPhase]);

  // Serve next question from queue or fetch new batch
  const loadNextQuestion = useCallback(() => {
    if (questionQueue.length > 0) {
      setCurrentQuestion(questionQueue[0]);
      setQuestionQueue(prev => prev.slice(1));
    } else if (sessionId && questionsAnswered < 10) {
      fetchQuestions(sessionId);
    }
  }, [questionQueue, sessionId, questionsAnswered, fetchQuestions]);

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
        // Load next question after reward animation
        setTimeout(() => loadNextQuestion(), 100);
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
      await submitAnswerMutation.mutateAsync({
        sessionId,
        questionId: currentQuestion.id,
        answer: "",
        responseTime: 0,
        wasSkipped: true,
      });
      setQuestionsAnswered(prev => prev + 1);
      setCurrentQuestion(null);
      setTimeout(() => loadNextQuestion(), 100);
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

      {/* Question counter + AI badge */}
      <div className="flex justify-between items-center px-5 py-3 max-w-lg mx-auto w-full flex-shrink-0">
        <span className="text-[#555] text-xs font-medium tracking-wide">
          {questionsAnswered}/10
        </span>

        {/* AI Source indicator */}
        {currentQuestion?.isAISuggested && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[10px] font-medium text-[#ED1C24]/70 bg-[#ED1C24]/10 px-2 py-0.5 rounded-full flex items-center gap-1"
          >
            <span>🤖</span>
            <span>سؤال مخصص ليك</span>
          </motion.span>
        )}

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
                isAISuggested={currentQuestion.isAISuggested}
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
