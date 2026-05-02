import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import { getRandomMockQuestion, getAllMockRewards, getRandomWheelPrize, wheelPrizes, getQuestionById, mockQuestions } from "./mocks";
import { calculateTrustScoreFromBehavior, calculatePointsEarned, getTrustLevel } from "./services/scoringService";
import { inMemoryStore } from "./inMemoryStore";
import type { SuggestedQuestion } from "./inMemoryStore";
import type { BehaviorData } from "./services/scoringService";
import { ENV } from "./_core/env";
import { triggerAnswerAnalysis } from "./services/answerAnalyzer";

type WorkflowSnapshot = {
  user_id: string;
  session_id: string;
  level: number;
  xp: number;
  completed_missions: string[];
  recent_topics: string[];
  skip_rate: number;
  avg_time_on_question_sec: number;
  engagement_score: number;
  preferred_difficulty: "easy" | "medium" | "hard";
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const buildWorkflowSnapshot = (params: {
  sessionId: string;
  trustScore: number;
  points: number;
  userId?: string | null;
}): WorkflowSnapshot => {
  const answers = inMemoryStore.getAnswers(params.sessionId);
  const totalAnswers = answers.length;
  const skippedCount = answers.filter(answer => answer.wasSkipped).length;
  const avgResponseTimeMs =
    totalAnswers > 0
      ? answers.reduce((sum, answer) => sum + answer.responseTime, 0) / totalAnswers
      : 0;

  const recentTopics = answers
    .slice(-5)
    .map(answer => getQuestionById(answer.questionId)?.type ?? "unknown");

  const difficultyCounts: Record<"easy" | "medium" | "hard", number> = {
    easy: 0,
    medium: 0,
    hard: 0,
  };

  answers.forEach(answer => {
    const difficulty = getQuestionById(answer.questionId)?.difficulty;
    if (difficulty) {
      difficultyCounts[difficulty] += 1;
    }
  });

  const preferredDifficulty = (Object.entries(difficultyCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "easy") as "easy" | "medium" | "hard";

  const skipRate = totalAnswers > 0 ? skippedCount / totalAnswers : 0;
  const avgTimeOnQuestionSec = avgResponseTimeMs / 1000;
  const completionRate = totalAnswers > 0 ? (totalAnswers - skippedCount) / totalAnswers : 0;
  const engagementScore = clamp(Math.round(params.trustScore), 0, 100);
  const level = clamp(Math.floor(params.trustScore / 20), 0, 5);

  return {
    user_id: params.userId ?? `guest:${params.sessionId}`,
    session_id: params.sessionId,
    level,
    xp: params.points,
    completed_missions: totalAnswers >= 10 ? ["quiz"] : [],
    recent_topics: recentTopics,
    skip_rate: Number(skipRate.toFixed(4)),
    avg_time_on_question_sec: Number(avgTimeOnQuestionSec.toFixed(2)),
    engagement_score: engagementScore,
    preferred_difficulty: preferredDifficulty,
  };
};

interface N8nSuggestedQuestion {
  question: string;
  possible_answers: string;
  topic: string;
  difficulty: string;
  reason: string;
  xp_reward: number;
}

interface N8nWebhookResponse {
  suggested_questions: N8nSuggestedQuestion[];
  total: number;
}

/**
 * Parse the possible_answers string from n8n into structured options.
 * Format: "1 (label), 2 (label), ..." or comma-separated values
 */
const parsePossibleAnswers = (
  raw: string
): Array<{ id: string; label: string; labelAr: string }> | undefined => {
  if (!raw || raw.trim() === "") return undefined;

  // Split by Arabic comma or regular comma
  const parts = raw.split(/[،,]/).map(s => s.trim()).filter(Boolean);
  if (parts.length < 2) return undefined;

  return parts.map((part, idx) => {
    // Try to extract number prefix like "1 (text)" or "1- text"
    const match = part.match(/^\d+\s*[\-\(\)]?\s*(.+?)\)?$/);
    const label = match ? match[1].trim() : part.trim();
    return {
      id: `ai_opt_${idx}`,
      label,
      labelAr: label, // Already in Arabic from the workflow
    };
  });
};

/**
 * Convert an n8n suggested question into the app's SuggestedQuestion format.
 */
const convertN8nQuestion = (
  q: N8nSuggestedQuestion,
  index: number
): SuggestedQuestion => {
  const options = parsePossibleAnswers(q.possible_answers);
  const difficulty = (["easy", "medium", "hard"].includes(q.difficulty)
    ? q.difficulty
    : "easy") as "easy" | "medium" | "hard";

  // Determine question type based on options
  let type: "swipe" | "rating" | "choice" | "open_ended";
  if (!options || options.length === 0) {
    type = "open_ended";
  } else if (options.length === 2) {
    type = "swipe";
  } else {
    type = "choice";
  }

  return {
    id: `ai_q_${Date.now()}_${index}`,
    type,
    text: q.question,
    options,
    difficulty,
    pointsValue: q.xp_reward || 15,
    topic: q.topic,
    isAISuggested: true,
  };
};

/**
 * Send the workflow snapshot to n8n and return the suggested questions.
 * Returns null if the webhook is unavailable or returns an error.
 */
const fetchSuggestedQuestions = async (
  snapshot: WorkflowSnapshot
): Promise<SuggestedQuestion[] | null> => {
  if (!ENV.n8nWorkflowUrl) {
    console.warn("[Workflow] N8N_WORKFLOW_URL not configured");
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(ENV.n8nWorkflowUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(snapshot),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.warn(`[Workflow] N8N responded ${response.status}: ${body}`);
      return null;
    }

    const data = (await response.json()) as N8nWebhookResponse;

    if (!data.suggested_questions || !Array.isArray(data.suggested_questions)) {
      console.warn("[Workflow] Invalid response format:", data);
      return null;
    }

    const questions = data.suggested_questions.map((q, i) =>
      convertN8nQuestion(q, i)
    );

    console.log(
      `[Workflow] Received ${questions.length} suggested questions from n8n`
    );
    return questions;
  } catch (error) {
    console.warn("[Workflow] N8N request failed", error);
    return null;
  }
};

/**
 * Fire-and-forget snapshot send (used on answer submission).
 */
const sendWorkflowSnapshot = async (snapshot: WorkflowSnapshot) => {
  if (!ENV.n8nWorkflowUrl) {
    console.warn("[Workflow] N8N_WORKFLOW_URL not configured");
    return;
  }

  try {
    const response = await fetch(ENV.n8nWorkflowUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(snapshot),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.warn(`[Workflow] N8N responded ${response.status}: ${body}`);
    }
  } catch (error) {
    console.warn("[Workflow] N8N request failed", error);
  }
};

/**
 * Get fallback mock questions that the user hasn't seen yet.
 */
const getUnseenMockQuestions = (sessionId: string, count: number): SuggestedQuestion[] => {
  // Get IDs of questions already answered in this session
  const answeredIds = new Set(
    inMemoryStore.getAnswers(sessionId).map(a => a.questionId)
  );

  // Filter and shuffle remaining questions
  const unseen = mockQuestions
    .filter(q => !answeredIds.has(q.id))
    .sort(() => 0.5 - Math.random())
    .slice(0, count);

  // If all questions have been seen, reshuffle the full pool
  const pool = unseen.length > 0 ? unseen : [...mockQuestions].sort(() => 0.5 - Math.random()).slice(0, count);

  return pool.map(q => ({
    id: q.id,
    type: q.type,
    text: q.textAr,
    options: q.options,
    difficulty: q.difficulty,
    pointsValue: q.pointsValue,
    isAISuggested: false,
  }));
};

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Session Management
  session: router({
    create: publicProcedure.mutation(async () => {
      const sessionId = nanoid();
      inMemoryStore.createSession(sessionId);
      return { sessionId };
    }),

    get: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const session = inMemoryStore.getSession(input.sessionId);
        return session || null;
      }),
  }),

  // Mission/Question Management
  missions: router({
    getNext: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input, ctx }) => {
        // Try to serve a cached AI-suggested question first
        const cached = inMemoryStore.getNextSuggestedQuestion(input.sessionId);
        if (cached) return cached;

        // No cached suggestions — try fetching from n8n
        const session = inMemoryStore.getSession(input.sessionId);
        if (session) {
          const snapshot = buildWorkflowSnapshot({
            sessionId: input.sessionId,
            trustScore: session.trustScore,
            points: session.points,
            userId: ctx.user?.openId ?? null,
          });

          const suggestions = await fetchSuggestedQuestions(snapshot);
          if (suggestions && suggestions.length > 0) {
            inMemoryStore.setSuggestedQuestions(input.sessionId, suggestions);
            return inMemoryStore.getNextSuggestedQuestion(input.sessionId)!;
          }
        }

        // Fallback to unseen mock question
        const unseen = getUnseenMockQuestions(input.sessionId, 1);
        return unseen[0] ?? getUnseenMockQuestions(input.sessionId, 1)[0];
      }),

    getSuggested: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const session = inMemoryStore.getSession(input.sessionId);
        if (!session) {
          throw new Error("Session not found");
        }

        // Build snapshot from current session state
        const snapshot = buildWorkflowSnapshot({
          sessionId: input.sessionId,
          trustScore: session.trustScore,
          points: session.points,
          userId: ctx.user?.openId ?? null,
        });

        // Fetch from n8n workflow
        const suggestions = await fetchSuggestedQuestions(snapshot);

        if (suggestions && suggestions.length > 0) {
          // Cache the suggestions
          inMemoryStore.setSuggestedQuestions(input.sessionId, suggestions);
          return {
            questions: suggestions,
            source: "ai" as const,
            total: suggestions.length,
          };
        }

        // Fallback to unseen mock questions
        const fallback = getUnseenMockQuestions(input.sessionId, 5);
        return {
          questions: fallback,
          source: "fallback" as const,
          total: fallback.length,
        };
      }),

    getAll: publicProcedure.query(async () => {
      const shuffled = [...mockQuestions].sort(() => 0.5 - Math.random()).slice(0, 3);
      return shuffled.map(q => ({
        id: q.id,
        type: q.type,
        text: q.textAr,
        options: q.options,
        difficulty: q.difficulty,
        pointsValue: q.pointsValue,
        isAISuggested: false,
      }));
    }),
  }),

  // Answer Submission
  submit: router({
    answer: publicProcedure
      .input(
        z.object({
          sessionId: z.string(),
          questionId: z.string(),
          answer: z.string(),
          responseTime: z.number(), // milliseconds
          wasSkipped: z.boolean().default(false),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const session = inMemoryStore.getSession(input.sessionId);
        if (!session) {
          throw new Error("Session not found");
        }

        // Calculate points earned (base 10 points)
        const pointsEarned = calculatePointsEarned(10, input.responseTime, 45, false);

        // Add answer to store
        inMemoryStore.addAnswer({
          sessionId: input.sessionId,
          questionId: input.questionId,
          answer: input.answer,
          responseTime: input.responseTime,
          wasSkipped: input.wasSkipped,
          pointsEarned,
          createdAt: new Date(),
        });

        // Update session
        const answers = inMemoryStore.getAnswers(input.sessionId);
        const avgResponseTime =
          answers.length > 0
            ? answers.reduce((sum, a) => sum + a.responseTime, 0) / answers.length
            : 0;
        const skipRate = answers.length > 0 ? (answers.filter(a => a.wasSkipped).length / answers.length) * 100 : 0;
        const completionRate = answers.length > 0 ? ((answers.length - answers.filter(a => a.wasSkipped).length) / answers.length) * 100 : 0;

        const newTrustScore = calculateTrustScoreFromBehavior({
          avgResponseTime,
          skipRate: skipRate / 100,
          completionRate: completionRate / 100,
          totalQuestionsAnswered: answers.length,
          totalQuestionsSkipped: answers.filter(a => a.wasSkipped).length,
          sessionContinuity: 0.8,
        });

        const newPoints = session.points + pointsEarned;
        const updatedSession = inMemoryStore.updateSession(input.sessionId, {
          points: newPoints,
          trustScore: newTrustScore,
          questionsAnswered: answers.length,
        });

        // Invalidate cached suggestions so next fetch gets fresh ones
        inMemoryStore.invalidateSuggestedQuestions(input.sessionId);

        const snapshot = buildWorkflowSnapshot({
          sessionId: input.sessionId,
          trustScore: newTrustScore,
          points: newPoints,
          userId: ctx.user?.openId ?? null,
        });

        void sendWorkflowSnapshot(snapshot);

        // Trigger async AI analysis after 5+ answers
        if (answers.length >= 5) {
          const answersForAnalysis = answers.map(a => {
            const question = getQuestionById(a.questionId);
            return {
              questionId: a.questionId,
              questionText: question?.textAr ?? a.questionId,
              questionType: question?.type ?? "unknown",
              answer: a.answer,
              responseTime: a.responseTime,
              wasSkipped: a.wasSkipped,
            };
          });
          triggerAnswerAnalysis(input.sessionId, answersForAnalysis, {
            trustScore: newTrustScore,
            points: newPoints,
            questionsAnswered: answers.length,
          });
        }

        return {
          pointsEarned,
          totalPoints: newPoints,
          newTrustScore,
          questionsAnswered: answers.length,
        };
      }),
  }),

  analytics: router({
    snapshot: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input, ctx }) => {
        const session = inMemoryStore.getSession(input.sessionId);
        if (!session) {
          throw new Error("Session not found");
        }

        return buildWorkflowSnapshot({
          sessionId: input.sessionId,
          trustScore: session.trustScore,
          points: session.points,
          userId: ctx.user?.openId ?? null,
        });
      }),

    // AI Performance Report
    report: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const session = inMemoryStore.getSession(input.sessionId);
        if (!session) {
          return {
            status: "none" as const,
            message: "ابدأ بالإجابة على الأسئلة باش تحصل على تقرير AI.",
          };
        }

        const report = inMemoryStore.getAIReport(input.sessionId);
        if (!report) {
          return {
            status: "none" as const,
            message: "لازم تجاوب على 5 أسئلة على الأقل باش تحصل على تقرير.",
          };
        }

        return report;
      }),
  }),

  // Behavior Tracking
  behavior: router({
    trackEvent: publicProcedure
      .input(
        z.object({
          sessionId: z.string(),
          eventType: z.enum(["question_skipped", "question_abandoned", "session_completed"]),
        })
      )
      .mutation(async ({ input }) => {
        const session = inMemoryStore.getSession(input.sessionId);
        if (!session) {
          throw new Error("Session not found");
        }

        // Handle event
        if (input.eventType === "question_skipped") {
          // Already handled in answer submission
        } else if (input.eventType === "question_abandoned") {
          // Track abandonment
        } else if (input.eventType === "session_completed") {
          inMemoryStore.updateSession(input.sessionId, { isActive: false });
        }

        return { success: true };
      }),
  }),

  // Rewards Management
  rewards: router({
    getAll: publicProcedure.query(async () => {
      return getAllMockRewards();
    }),

    purchase: publicProcedure
      .input(
        z.object({
          sessionId: z.string(),
          rewardId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const session = inMemoryStore.getSession(input.sessionId);
        if (!session) {
          throw new Error("Session not found");
        }

        const reward = getAllMockRewards().find(r => r.id === input.rewardId);
        if (!reward) {
          throw new Error("Reward not found");
        }

        if (session.points < reward.pointsCost) {
          throw new Error("Insufficient points");
        }

        // Add purchase
        inMemoryStore.addPurchase({
          id: nanoid(),
          sessionId: input.sessionId,
          rewardId: input.rewardId,
          pointsSpent: reward.pointsCost,
          createdAt: new Date(),
        });

        // Update session points
        const newPoints = session.points - reward.pointsCost;
        inMemoryStore.updateSession(input.sessionId, { points: newPoints });

        return {
          success: true,
          newPoints,
          reward: reward.nameAr,
        };
      }),

    getPurchaseHistory: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const purchases = inMemoryStore.getPurchases(input.sessionId);
        return purchases.map(p => ({
          ...p,
          reward: getAllMockRewards().find(r => r.id === p.rewardId),
        }));
      }),
  }),

  // Wheel of Fortune
  wheel: router({
    spin: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ input }) => {
        const session = inMemoryStore.getSession(input.sessionId);
        if (!session) {
          throw new Error("Session not found");
        }

        const spinCost = 50;
        if (session.points < spinCost) {
          throw new Error("Insufficient points for spin");
        }

        // Get random prize
        const prize = getRandomWheelPrize();

        // Add spin
        inMemoryStore.addWheelSpin({
          id: nanoid(),
          sessionId: input.sessionId,
          prizeId: prize.id,
          pointsSpent: spinCost,
          pointsWon: prize.points,
          createdAt: new Date(),
        });

        // Update session
        const newPoints = session.points - spinCost + prize.points;
        inMemoryStore.updateSession(input.sessionId, { points: newPoints });

        return {
          prize: prize.label,
          pointsWon: prize.points,
          newPoints,
          prizeIndex: wheelPrizes.findIndex(p => p.id === prize.id),
        };
      }),

    getHistory: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const spins = inMemoryStore.getWheelSpins(input.sessionId);
        return spins.slice(0, 10).map(s => ({
          prize: wheelPrizes.find(p => p.id === s.prizeId)?.label || "Unknown",
          pointsWon: s.pointsWon,
          date: s.createdAt.toLocaleTimeString("ar-TN"),
        }));
      }),
  }),
});

export type AppRouter = typeof appRouter;

// Re-export for compatibility
export { appRouter as default };
