import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { ar } from "@/locales/ar";
import { BejiAvatar, BejiMode } from "./BejiAvatar";

export interface Question {
  id: string;
  type: "swipe" | "rating" | "choice" | "open_ended";
  text: string;
  options?: Array<{ id: string; label: string; labelAr: string }>;
  difficulty: string;
  pointsValue: number;
}

interface QuestionCardProps {
  question: Question;
  onAnswer: (answer: string, responseTime: number) => void;
  onSkip: () => void;
  isLoading?: boolean;
}

function getBejiMode(type: Question["type"], isLoading: boolean, hasAnswered: boolean): BejiMode {
  if (hasAnswered) return "grateful";
  if (isLoading) return "writing";
  switch (type) {
    case "rating": return "thinking";
    case "choice": return "pointing";
    case "swipe": return "idle";
    case "open_ended": return "thinking";
    default: return "idle";
  }
}

export function QuestionCard({ question, onAnswer, onSkip, isLoading = false }: QuestionCardProps) {
  const [startTime] = useState(Date.now());
  const [rating, setRating] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [openEndedAnswer, setOpenEndedAnswer] = useState("");
  const [hasAnswered, setHasAnswered] = useState(false);

  const bejiMode = getBejiMode(question.type, isLoading, hasAnswered);

  const handleAnswerClick = (answer: string) => {
    setHasAnswered(true);
    const responseTime = Date.now() - startTime;
    onAnswer(answer, responseTime);
  };

  const handleOpenEndedSubmit = () => {
    if (openEndedAnswer.trim()) {
      handleAnswerClick(openEndedAnswer);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* 
        Outer wrapper — overflow-visible so Beji can break out.
        Position relative to anchor the absolute Beji.
      */}
      <div className="relative" style={{ overflow: "visible" }}>

        {/* BEJI — Breaking out from the top-left corner */}
        <div
          className="absolute z-30"
          style={{
            top: "-160px",
            left: "-10px",
          }}
        >
          <BejiAvatar mode={bejiMode} size="xl" />
        </div>

        {/* The Question Card */}
        <div className="relative bg-[#0A0A0A]/90 border border-white/5 shadow-2xl">

          {/* Question Text — offset right to make room for Beji */}
          <div className="pr-6 pl-48 sm:pl-56 pt-8 pb-4">
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {question.text}
            </h2>
          </div>

          {/* Loading Overlay */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm z-40 flex flex-col items-center justify-center gap-3"
              >
                <div className="flex gap-2">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                      className="w-2.5 h-2.5 bg-[#ED1C24] rounded-full"
                    />
                  ))}
                </div>
                <p className="text-white/80 font-bold text-sm">نقراو إجابتك ...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success / Appreciation Overlay */}
          <AnimatePresence>
            {hasAnswered && !isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#0A0A0A] z-50 flex flex-col items-center justify-center text-center p-8"
              >
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-[#ED1C24] text-xs uppercase tracking-[0.2em] font-black mb-2">Excellent</p>
                  <h3 className="text-3xl font-black text-white mb-2">شكراً على جوابك!</h3>
                  <p className="text-[#555] text-sm">قاعدين نحسبو في نقاطك...</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interaction Zone */}
          <div className="px-6 pb-6">

            {/* Rating — Stars */}
            {question.type === "rating" && (
              <div className="flex gap-3 justify-center py-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <motion.button
                    key={star}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => {
                      setRating(star);
                      handleAnswerClick(star.toString());
                    }}
                    disabled={isLoading}
                    className="p-1"
                  >
                    <Star
                      size={36}
                      className={`transition-all duration-200 ${star <= rating
                        ? "fill-[#ED1C24] text-[#ED1C24]"
                        : "text-[#333] hover:text-[#555]"
                        }`}
                    />
                  </motion.button>
                ))}
              </div>
            )}

            {/* Choices — Horizontal Pills */}
            {question.type === "choice" && question.options && (
              <div className="flex flex-wrap gap-3 py-4">
                {question.options.map(option => (
                  <motion.button
                    key={option.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedOption(option.id);
                      handleAnswerClick(option.id);
                    }}
                    disabled={isLoading}
                    className={`py-3 px-6 rounded-full border text-sm font-bold transition-all ${selectedOption === option.id
                      ? "border-[#ED1C24] bg-[#ED1C24] text-white"
                      : "border-[#222] text-[#888] hover:border-[#444] hover:text-white"
                      }`}
                  >
                    {option.labelAr}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Swipe / Binary — Thumbs */}
            {question.type === "swipe" && question.options && (
              <div className="flex gap-3 py-4">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleAnswerClick(question.options![0].id)}
                  disabled={isLoading}
                  className="group flex-1 flex items-center justify-center gap-3 bg-[#111] border border-[#222] hover:border-[#ED1C24]/50 py-4 transition-all"
                >
                  <ThumbsUp className="w-5 h-5 text-[#888] group-hover:text-white" />
                  <span className="text-white font-bold">{question.options[0].labelAr}</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleAnswerClick(question.options![1].id)}
                  disabled={isLoading}
                  className="group flex-1 flex items-center justify-center gap-3 bg-[#111] border border-[#222] hover:border-[#444] py-4 transition-all"
                >
                  <ThumbsDown className="w-5 h-5 text-[#888] group-hover:text-white" />
                  <span className="text-white font-bold">{question.options[1].labelAr}</span>
                </motion.button>
              </div>
            )}

            {/* Open Ended — Input */}
            {question.type === "open_ended" && (
              <div className="relative flex items-center w-full py-4">
                <input
                  type="text"
                  value={openEndedAnswer}
                  onChange={e => setOpenEndedAnswer(e.target.value)}
                  placeholder="اكتب هنا ..."
                  disabled={isLoading}
                  className="w-full bg-[#111] border border-[#222] focus:border-[#ED1C24] py-4 pr-5 pl-14 text-white outline-none transition-all font-bold placeholder:text-[#333] text-right"
                  onKeyDown={e => e.key === "Enter" && handleOpenEndedSubmit()}
                />
                <button
                  onClick={handleOpenEndedSubmit}
                  disabled={!openEndedAnswer.trim() || isLoading}
                  className="absolute left-4 text-[#ED1C24] disabled:text-[#333] transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skip */}
      <div className="mt-8 flex justify-between items-center px-1">
        <p className="text-[#222] text-[10px] uppercase tracking-widest font-black">Powered by AI Analytics</p>
        <button
          onClick={onSkip}
          disabled={isLoading}
          className="text-[#333] text-xs font-bold hover:text-[#666] transition-colors uppercase tracking-widest"
        >
          {ar.mission.skip}
        </button>
      </div>
    </div>
  );
}
