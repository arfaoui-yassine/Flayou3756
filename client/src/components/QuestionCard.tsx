import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
}

export function QuestionCard({ question, onAnswer, onSkip, isLoading = false }: QuestionCardProps) {
  const [startTime] = useState(Date.now());
  const [rating, setRating] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [openEndedAnswer, setOpenEndedAnswer] = useState("");
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);

  const handleSwipe = (direction: "left" | "right") => {
    setSwipeDirection(direction);
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full flex items-center justify-center p-4"
    >
      <Card className="w-full max-w-md bg-gradient-to-br from-gray-900 to-black border border-red-600/30 shadow-xl rounded-3xl p-8">
        {/* Question Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-red-500 mb-2">{ar.mission.questionNumber} 1/10</p>
          <h2 className="text-2xl font-bold text-white text-right leading-relaxed">{question.text}</h2>
        </div>

        {/* Swipe Questions */}
        {question.type === "swipe" && question.options && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSwipe("left")}
                disabled={isLoading}
                className="relative h-32 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center">
                  <span className="text-white font-bold text-center px-2">{question.options[0].labelAr}</span>
                </div>
                <motion.div
                  className="absolute inset-0 bg-black/20"
                  whileHover={{ backgroundColor: "rgba(0,0,0,0.3)" }}
                />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSwipe("right")}
                disabled={isLoading}
                className="relative h-32 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <span className="text-white font-bold text-center px-2">{question.options[1].labelAr}</span>
                </div>
                <motion.div
                  className="absolute inset-0 bg-black/20"
                  whileHover={{ backgroundColor: "rgba(0,0,0,0.3)" }}
                />
              </motion.button>
            </div>
          </div>
        )}

        {/* Rating Questions */}
        {question.type === "rating" && (
          <div className="space-y-6">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <motion.button
                  key={star}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRating(star)}
                  disabled={isLoading}
                >
                  <Star
                    size={48}
                    className={`transition-colors ${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-300"
                    }`}
                  />
                </motion.button>
              ))}
            </div>
            <Button
              onClick={handleRatingSubmit}
              disabled={rating === 0 || isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 rounded-xl"
            >
              {ar.mission.submit}
            </Button>
          </div>
        )}

        {/* Choice Questions */}
        {question.type === "choice" && question.options && (
          <div className="space-y-3">
            {question.options.map(option => (
              <motion.button
                key={option.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedOption(option.id)}
                className={`w-full p-4 rounded-xl font-semibold text-right transition-all ${
                  selectedOption === option.id
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-white text-gray-900 border-2 border-gray-200 hover:border-indigo-400"
                }`}
              >
                {option.labelAr}
              </motion.button>
            ))}
            <Button
              onClick={handleChoiceSubmit}
              disabled={!selectedOption || isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl mt-4"
            >
              {ar.mission.submit}
            </Button>
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
              className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-indigo-600 focus:outline-none resize-none text-right"
              rows={4}
            />
            <Button
              onClick={handleOpenEndedSubmit}
              disabled={!openEndedAnswer.trim() || isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 rounded-xl"
            >
              {ar.mission.submit}
            </Button>
          </div>
        )}

        {/* Skip Button */}
        <Button
          onClick={onSkip}
          disabled={isLoading}
          variant="ghost"
          className="w-full mt-4 text-gray-600 hover:text-gray-900"
        >
          {ar.mission.skip}
        </Button>
      </Card>
    </motion.div>
  );
}
