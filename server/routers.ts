import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import { getRandomMockQuestion, getAllMockRewards, getRandomWheelPrize, wheelPrizes } from "./mocks";
import { calculateTrustScoreFromBehavior, calculatePointsEarned, getTrustLevel } from "./services/scoringService";
import { inMemoryStore } from "./inMemoryStore";
import type { BehaviorData } from "./services/scoringService";

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
      .query(async ({ input }) => {
        const question = getRandomMockQuestion();
        return {
          id: question.id,
          type: question.type,
          text: question.textAr, // Use Arabic text
          options: question.options,
          difficulty: question.difficulty,
          pointsValue: question.pointsValue,
        };
      }),

    getAll: publicProcedure.query(async () => {
      const questions = [getRandomMockQuestion(), getRandomMockQuestion(), getRandomMockQuestion()];
      return questions.map(q => ({
        id: q.id,
        type: q.type,
        text: q.textAr,
        options: q.options,
        difficulty: q.difficulty,
        pointsValue: q.pointsValue,
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
      .mutation(async ({ input }) => {
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

        return {
          pointsEarned,
          totalPoints: newPoints,
          newTrustScore,
          questionsAnswered: answers.length,
        };
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
