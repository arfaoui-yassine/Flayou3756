import React, { useState, useEffect, useCallback } from "react";
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
  const [showReward, setShowReward] = useState(false);
  const [lastReward, setLastReward] = useState<{ points: number; trustScore: number } | null>(null);
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
      // The server already falls back to mocks, but just in case
      setCurrentQuestion(null);
    } finally {
      setIsLoading(false);
    }
  }, [getSuggestedMutation]);

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
    if (sessionId && !currentQuestion && questionQueue.length === 0 && questionsAnswered < 10) {
      fetchQuestions(sessionId);
    }
  }, [sessionId]);

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

      setLastReward({
        points: result.pointsEarned,
        trustScore: result.newTrustScore,
      });
      setShowReward(true);
      setPoints(result.totalPoints);
      setTrustScore(result.newTrustScore);
      setQuestionsAnswered(prev => prev + 1);

      setTimeout(() => {
        setCurrentQuestion(null);
        setShowReward(false);
        // Load next question after reward animation
        setTimeout(() => loadNextQuestion(), 100);
      }, 1500);
    } catch (error) {
      console.error("Failed to submit answer:", error);
    } finally {
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
    <div className="min-h-screen bg-black flex flex-col">
      {/* Progress — Thin line at very top */}
      <div className="h-[2px] bg-[#1A1A1A] w-full">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full bg-[#ED1C24]"
        />
      </div>

      {/* Question counter + AI badge */}
      <div className="flex justify-between items-center px-5 py-4 max-w-md mx-auto w-full">
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
                isAISuggested={currentQuestion.isAISuggested}
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
