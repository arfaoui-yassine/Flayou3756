import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, sessions, behavioralMetrics, questions, answers, rewards, purchases, wheelSpins } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Session queries
export async function createSession(sessionId: string, userId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(sessions).values({
    sessionId,
    userId,
    profileLevel: 0,
    trustScore: "45",
    points: 0,
    streak: 0,
  });
  
  return result;
}

export async function getSessionBySessionId(sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(sessions).where(eq(sessions.sessionId, sessionId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSessionPoints(sessionId: number, pointsToAdd: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  if (!session.length) throw new Error("Session not found");
  
  const currentPoints = session[0].points;
  await db.update(sessions).set({ points: currentPoints + pointsToAdd }).where(eq(sessions.id, sessionId));
}

export async function updateSessionTrustScore(sessionId: number, newTrustScore: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(sessions).set({ trustScore: newTrustScore.toString() }).where(eq(sessions.id, sessionId));
}

// Question queries
export async function getAllQuestions() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(questions);
}

export async function getRandomQuestion(limit: number = 1) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(questions).limit(limit);
}

// Answer queries
export async function createAnswer(sessionId: number, questionId: number, answer: string, responseTime: number, wasSkipped: boolean, pointsEarned: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(answers).values({
    sessionId,
    questionId,
    answer,
    responseTime,
    wasSkipped,
    pointsEarned,
    trustImpact: "0",
  });
}

// Behavioral metrics queries
export async function getOrCreateBehavioralMetrics(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(behavioralMetrics).where(eq(behavioralMetrics.sessionId, sessionId)).limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  await db.insert(behavioralMetrics).values({
    sessionId,
    avgResponseTime: "0",
    skipRate: "0",
    completionRate: "0",
    totalQuestionsAnswered: 0,
    totalQuestionsSkipped: 0,
    totalSessionTime: 0,
  });
  
  const created = await db.select().from(behavioralMetrics).where(eq(behavioralMetrics.sessionId, sessionId)).limit(1);
  return created[0];
}

export async function updateBehavioralMetrics(sessionId: number, metrics: Partial<typeof behavioralMetrics.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(behavioralMetrics).set(metrics).where(eq(behavioralMetrics.sessionId, sessionId));
}

// Reward queries
export async function getAllRewards() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(rewards).where(eq(rewards.isActive, true));
}

export async function getRewardsByTrustLevel(trustLevel: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(rewards).where(
    and(
      eq(rewards.isActive, true),
      eq(rewards.trustRequired, trustLevel as any)
    )
  );
}

// Purchase queries
export async function createPurchase(sessionId: number, rewardId: number, pointsSpent: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(purchases).values({
    sessionId,
    rewardId,
    pointsSpent,
    status: "completed",
  });
}

// Wheel spin queries
export async function createWheelSpin(sessionId: number, pointsSpent: number, prizeWon: string, spinResult: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(wheelSpins).values({
    sessionId,
    pointsSpent,
    prizeWon,
    spinResult,
  });
}

export async function getWheelSpinHistory(sessionId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(wheelSpins).where(eq(wheelSpins.sessionId, sessionId)).orderBy(desc(wheelSpins.createdAt)).limit(limit);
}
