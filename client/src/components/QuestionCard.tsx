import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send } from "lucide-react";
import { ar } from "@/locales/ar";
import { BejiAvatar, BejiMode } from "./BejiAvatar";
import { SwipeChoice } from "./SwipeChoice";
import { useSound, pickRandom, SOUNDS, BUBBLE_TEXT } from "@/hooks/useSound";

export interface Question {
  id: string;
  type: "swipe" | "rating" | "choice" | "open_ended";
  text: string;
  options?: Array<{ id: string; label: string; labelAr: string; imageUrl?: string }>;
  difficulty: string;
  pointsValue: number;
}

interface QuestionCardProps {
  question: Question;
  onAnswer: (answer: string, responseTime: number) => void;
  onSkip: () => void;
  isLoading?: boolean;
}

function getBejiMode(type: Question["type"], hasAnswered: boolean, isImpatient: boolean): BejiMode {
  if (hasAnswered) return "grateful";
  if (isImpatient) return "pointing"; // looks like he's demanding an answer
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

  // Sound & bubble state
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [isImpatient, setIsImpatient] = useState(false);
  const impatientTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPlayedImpatient = useRef(false);

  // Preload all sounds
  const thankSound1 = useSound(SOUNDS.thank[0]);
  const thankSound2 = useSound(SOUNDS.thank[1]);
  const impatientSound1 = useSound(SOUNDS.impatient[0]);
  const impatientSound2 = useSound(SOUNDS.impatient[1]);

  const thankSounds = [
    { play: thankSound1.play, text: BUBBLE_TEXT.thank[0] },
    { play: thankSound2.play, text: BUBBLE_TEXT.thank[1] },
  ];
  const impatientSounds = [
    { play: impatientSound1.play, text: BUBBLE_TEXT.impatient[0] },
    { play: impatientSound2.play, text: BUBBLE_TEXT.impatient[1] },
  ];

  const bejiMode = getBejiMode(question.type, hasAnswered, isImpatient);

  // Idle timer — after 5s, Beji gets impatient
  useEffect(() => {
    if (hasAnswered || isLoading) return;

    impatientTimerRef.current = setTimeout(() => {
      if (!hasPlayedImpatient.current) {
        hasPlayedImpatient.current = true;
        setIsImpatient(true);
        const chosen = pickRandom(impatientSounds);
        setBubbleText(chosen.text);
        chosen.play();
      }
    }, 5000);

    return () => {
      if (impatientTimerRef.current) {
        clearTimeout(impatientTimerRef.current);
      }
    };
  }, [hasAnswered, isLoading]);

  const handleAnswerClick = useCallback((answer: string) => {
    setHasAnswered(true);
    setIsImpatient(false);

    // Clear impatient timer
    if (impatientTimerRef.current) {
      clearTimeout(impatientTimerRef.current);
    }

    // Play thank you sound + show bubble
    const chosen = pickRandom(thankSounds);
    setBubbleText(chosen.text);
    chosen.play();

    const responseTime = Date.now() - startTime;
    onAnswer(answer, responseTime);
  }, [startTime, onAnswer]);

  const handleOpenEndedSubmit = () => {
    if (openEndedAnswer.trim()) {
      handleAnswerClick(openEndedAnswer);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4">
      <div className="relative" style={{ overflow: "visible" }}>

        {/* BEJI — Breaking out from the top-left corner */}
        <div
          className="absolute z-30"
          style={{ top: "-170px", left: "-10px" }}
        >
          {/* Shake animation when impatient */}
          <motion.div
            animate={isImpatient ? {
              x: [0, -3, 3, -3, 3, 0],
              transition: { duration: 0.4, repeat: 2 }
            } : {}}
          >
            <BejiAvatar mode={bejiMode} size="lg" />
          </motion.div>
        </div>

        {/* Speech bubble — shows appreciation or impatient text */}
        <AnimatePresence>
          {bubbleText && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
              className={`absolute z-40 whitespace-nowrap text-xs font-black px-3 py-1.5 rounded-lg shadow-lg ${
                hasAnswered
                  ? "bg-white text-black"
                  : "bg-[#ED1C24] text-white"
              }`}
              style={{ top: "-150px", left: "130px" }}
            >
              {bubbleText}
              {/* Triangle pointer */}
              <div className={`absolute top-1/2 -left-1.5 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[6px] ${
                hasAnswered ? "border-r-white" : "border-r-[#ED1C24]"
              }`} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Question Card */}
        <div className="relative bg-[#0A0A0A]/90 border border-white/5 shadow-2xl">

          {/* Question Text */}
          <div className="px-6 pt-6 pb-2">
            <h2 className="text-lg sm:text-xl font-black text-white leading-tight text-center">
              {question.text}
            </h2>
          </div>

          {/* Interaction Zone */}
          <div className="px-4 pb-4">

            {/* Swipe — Brand Cards */}
            {question.type === "swipe" && question.options && question.options.length >= 2 && (
              <SwipeChoice
                options={[question.options[0], question.options[1]]}
                onChoice={(id) => handleAnswerClick(id)}
                disabled={isLoading || hasAnswered}
              />
            )}

            {/* Rating — Stars */}
            {question.type === "rating" && (
              <div className="flex gap-3 justify-center py-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <motion.button
                    key={star}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => {
                      setRating(star);
                      handleAnswerClick(star.toString());
                    }}
                    disabled={isLoading || hasAnswered}
                    className="p-1"
                  >
                    <Star
                      size={32}
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
              <div className="flex gap-2 py-3">
                {question.options.map(option => (
                  <motion.button
                    key={option.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedOption(option.id);
                      handleAnswerClick(option.id);
                    }}
                    disabled={isLoading || hasAnswered}
                    className={`flex-1 py-2.5 px-2 rounded-full border text-xs font-bold transition-all text-center truncate ${selectedOption === option.id
                      ? "border-[#ED1C24] bg-[#ED1C24] text-white"
                      : "border-[#222] text-[#888] hover:border-[#444] hover:text-white"
                      }`}
                  >
                    {option.labelAr}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Open Ended — Input */}
            {question.type === "open_ended" && (
              <div className="relative flex items-center w-full py-3">
                <input
                  type="text"
                  value={openEndedAnswer}
                  onChange={e => setOpenEndedAnswer(e.target.value)}
                  placeholder="اكتب هنا ..."
                  disabled={isLoading || hasAnswered}
                  className="w-full bg-[#111] border border-[#222] focus:border-[#ED1C24] py-3.5 pr-4 pl-12 text-white outline-none transition-all font-bold placeholder:text-[#333] text-right text-sm"
                  onKeyDown={e => e.key === "Enter" && handleOpenEndedSubmit()}
                />
                <button
                  onClick={handleOpenEndedSubmit}
                  disabled={!openEndedAnswer.trim() || isLoading || hasAnswered}
                  className="absolute left-3 text-[#ED1C24] disabled:text-[#333] transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skip */}
      <div className="mt-4 flex justify-end px-1">
        <button
          onClick={onSkip}
          disabled={isLoading || hasAnswered}
          className="text-[#333] text-xs font-bold hover:text-[#666] transition-colors uppercase tracking-widest"
        >
          {ar.mission.skip}
        </button>
      </div>
    </div>
  );
}
