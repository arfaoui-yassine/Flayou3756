import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { ar } from "@/locales/ar";
import { BejiAvatar } from "./BejiAvatar";

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

export function QuestionCard({ question, onAnswer, onSkip, isLoading = false }: QuestionCardProps) {
  const [startTime] = useState(Date.now());
  const [rating, setRating] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [openEndedAnswer, setOpenEndedAnswer] = useState("");

  const handleAnswerClick = (answer: string) => {
    const responseTime = Date.now() - startTime;
    onAnswer(answer, responseTime);
  };

  const handleOpenEndedSubmit = () => {
    if (openEndedAnswer.trim()) {
      handleAnswerClick(openEndedAnswer);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* 
          ═══════════════════════════════════════════════
          CHRACTER-DRIVEN QUESTION LAYOUT
          ═══════════════════════════════════════════════ 
      */}
      <div className="relative bg-[#0A0A0A] border border-white/5 shadow-2xl rounded-sm overflow-hidden flex flex-col md:flex-row min-h-[160px]">
        
        {/* Character Section */}
        <div className="flex-shrink-0 bg-gradient-to-br from-[#111] to-[#000] p-6 flex items-center justify-center border-b md:border-b-0 md:border-l border-white/5">
          <BejiAvatar 
            mode={isLoading ? "thinking" : rating > 0 || selectedOption ? "happy" : "idle"} 
            className="scale-90"
          />
        </div>

        {/* Content Section */}
        <div className="flex-1 p-6 md:p-10 flex flex-col justify-center">
          
          {/* Thinking Overlay */}
          <AnimatePresence>
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4"
              >
                <div className="flex gap-2">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                      className="w-3 h-3 bg-[#ED1C24] rounded-full"
                    />
                  ))}
                </div>
                <p className="text-white font-bold text-lg tracking-tighter">نقراو إجابتك ...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Question Text */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {question.text}
            </h2>
          </div>

          {/* Interaction Zone */}
          <div className="w-full">
            {/* 1. Rating — Horizontal Stars */}
            {question.type === "rating" && (
              <div className="flex gap-4">
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
                      size={32}
                      className={`transition-all duration-300 ${
                        star <= rating
                          ? "fill-[#ED1C24] text-[#ED1C24] scale-110"
                          : "text-[#222] hover:text-[#444]"
                      }`}
                    />
                  </motion.button>
                ))}
              </div>
            )}

            {/* 2. Choices — Horizontal Pills */}
            {question.type === "choice" && question.options && (
              <div className="flex flex-wrap gap-3">
                {question.options.map(option => (
                  <motion.button
                    key={option.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedOption(option.id);
                      handleAnswerClick(option.id);
                    }}
                    disabled={isLoading}
                    className={`py-3 px-8 rounded-full border text-sm font-bold transition-all ${
                      selectedOption === option.id
                        ? "border-[#ED1C24] bg-[#ED1C24] text-white"
                        : "border-[#222] text-[#888] hover:border-[#444] hover:text-white"
                    }`}
                  >
                    {option.labelAr}
                  </motion.button>
                ))}
              </div>
            )}

            {/* 3. Swipe / Binary — Thumbs */}
            {question.type === "swipe" && question.options && (
              <div className="flex gap-4">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleAnswerClick(question.options![0].id)}
                  disabled={isLoading}
                  className="group flex items-center gap-3 bg-[#111] border border-[#222] hover:border-[#ED1C24]/50 py-3 px-10 transition-all"
                >
                  <ThumbsUp className="w-5 h-5 text-[#888] group-hover:text-white" />
                  <span className="text-white font-bold">{question.options[0].labelAr}</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleAnswerClick(question.options![1].id)}
                  disabled={isLoading}
                  className="group flex items-center gap-3 bg-[#111] border border-[#222] hover:border-[#444] py-3 px-10 transition-all"
                >
                  <ThumbsDown className="w-5 h-5 text-[#888] group-hover:text-white" />
                  <span className="text-white font-bold">{question.options[1].labelAr}</span>
                </motion.button>
              </div>
            )}

            {/* 4. Open Ended — Clean Input */}
            {question.type === "open_ended" && (
              <div className="relative flex items-center w-full">
                <input
                  type="text"
                  value={openEndedAnswer}
                  onChange={e => setOpenEndedAnswer(e.target.value)}
                  placeholder="اكتب هنا ..."
                  disabled={isLoading}
                  className="w-full bg-[#111] border border-[#222] focus:border-[#ED1C24] py-4 pr-12 pl-4 text-white outline-none transition-all font-bold placeholder:text-[#333]"
                  onKeyDown={e => e.key === "Enter" && handleOpenEndedSubmit()}
                />
                <button 
                  onClick={handleOpenEndedSubmit}
                  disabled={!openEndedAnswer.trim() || isLoading}
                  className="absolute right-4 text-[#ED1C24] disabled:text-[#333]"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer / Skip */}
      <div className="mt-8 flex justify-between items-center text-[#333] px-2">
        <p className="text-[10px] uppercase tracking-widest font-black">Powered by AI Analytics</p>
        <button
          onClick={onSkip}
          disabled={isLoading}
          className="text-xs font-bold hover:text-[#666] transition-colors uppercase tracking-widest"
        >
          {ar.mission.skip}
        </button>
      </div>
    </div>
  );
}
