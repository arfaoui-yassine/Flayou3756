import React, { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { ar } from "@/locales/ar";

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
  isAISuggested?: boolean;
}

export function QuestionCard({ question, onAnswer, onSkip, isLoading = false }: QuestionCardProps) {
  const [startTime] = useState(Date.now());
  const [rating, setRating] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [openEndedAnswer, setOpenEndedAnswer] = useState("");

  const handleSwipe = (direction: "left" | "right") => {
    const responseTime = Date.now() - startTime;
    const selectedOpt = question.options?.[direction === "left" ? 0 : 1];
    if (selectedOpt) {
      onAnswer(selectedOpt.id, responseTime);
    }
  };

  const handleRatingSubmit = () => {
    const responseTime = Date.now() - startTime;
    onAnswer(rating.toString(), responseTime);
  };

  const handleChoiceSubmit = () => {
    if (selectedOption) {
      const responseTime = Date.now() - startTime;
      onAnswer(selectedOption, responseTime);
    }
  };

  const handleOpenEndedSubmit = () => {
    if (openEndedAnswer.trim()) {
      const responseTime = Date.now() - startTime;
      onAnswer(openEndedAnswer, responseTime);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="w-full max-w-md mx-auto"
    >
      {/* Question Text — Big, Bold */}
      <div className="mb-12 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white leading-snug">
          {question.text}
        </h2>
      </div>

      {/* Swipe Questions */}
      {question.type === "swipe" && question.options && (
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSwipe("left")}
            disabled={isLoading}
            className="h-28 border border-[#333] hover:border-[#ED1C24] transition-colors flex items-center justify-center"
          >
            <span className="text-white font-semibold text-lg">
              {question.options[0].labelAr}
            </span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSwipe("right")}
            disabled={isLoading}
            className="h-28 border border-[#333] hover:border-[#ED1C24] transition-colors flex items-center justify-center"
          >
            <span className="text-white font-semibold text-lg">
              {question.options[1].labelAr}
            </span>
          </motion.button>
        </div>
      )}

      {/* Rating Questions */}
      {question.type === "rating" && (
        <div className="space-y-8">
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map(star => (
              <motion.button
                key={star}
                whileTap={{ scale: 0.85 }}
                onClick={() => setRating(star)}
                disabled={isLoading}
                className="p-1"
              >
                <Star
                  size={40}
                  className={`transition-colors ${
                    star <= rating
                      ? "fill-[#ED1C24] text-[#ED1C24]"
                      : "text-[#333] hover:text-[#555]"
                  }`}
                />
              </motion.button>
            ))}
          </div>
          <button
            onClick={handleRatingSubmit}
            disabled={rating === 0 || isLoading}
            className="w-full bg-[#ED1C24] hover:bg-[#D91920] disabled:bg-[#333] disabled:text-[#666] text-white font-semibold py-4 transition-colors"
          >
            {ar.mission.submit}
          </button>
        </div>
      )}

      {/* Choice Questions */}
      {question.type === "choice" && question.options && (
        <div className="space-y-3">
          {question.options.map(option => (
            <motion.button
              key={option.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedOption(option.id)}
              className={`w-full py-4 px-6 text-right font-medium transition-all border ${
                selectedOption === option.id
                  ? "border-[#ED1C24] text-white bg-[#ED1C24]/10"
                  : "border-[#333] text-[#ccc] hover:border-[#555]"
              }`}
            >
              {option.labelAr}
            </motion.button>
          ))}
          <button
            onClick={handleChoiceSubmit}
            disabled={!selectedOption || isLoading}
            className="w-full bg-[#ED1C24] hover:bg-[#D91920] disabled:bg-[#333] disabled:text-[#666] text-white font-semibold py-4 mt-4 transition-colors"
          >
            {ar.mission.submit}
          </button>
        </div>
      )}

      {/* Open-ended Questions */}
      {question.type === "open_ended" && (
        <div className="space-y-4">
          <textarea
            value={openEndedAnswer}
            onChange={e => setOpenEndedAnswer(e.target.value)}
            placeholder={ar.mission.write}
            disabled={isLoading}
            className="w-full p-5 bg-transparent border border-[#333] focus:border-[#ED1C24] text-white placeholder:text-[#555] resize-none outline-none transition-colors text-right"
            rows={4}
          />
          <button
            onClick={handleOpenEndedSubmit}
            disabled={!openEndedAnswer.trim() || isLoading}
            className="w-full bg-[#ED1C24] hover:bg-[#D91920] disabled:bg-[#333] disabled:text-[#666] text-white font-semibold py-4 transition-colors"
          >
            {ar.mission.submit}
          </button>
        </div>
      )}

      {/* Skip */}
      <button
        onClick={onSkip}
        disabled={isLoading}
        className="w-full mt-6 text-[#555] hover:text-[#888] text-sm font-medium transition-colors"
      >
        {ar.mission.skip} ←
      </button>
    </motion.div>
  );
}
