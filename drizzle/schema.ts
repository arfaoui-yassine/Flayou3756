import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Session table: Tracks user sessions with behavioral metrics
 */
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(),
  profileLevel: int("profileLevel").default(0).notNull(),
  trustScore: decimal("trustScore", { precision: 5, scale: 2 }).default("45").notNull(),
  points: int("points").default(0).notNull(),
  streak: int("streak").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

/**
 * Behavioral metrics: Aggregated user behavior data
 */
export const behavioralMetrics = mysqlTable("behavioral_metrics", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").references(() => sessions.id).notNull(),
  avgResponseTime: decimal("avgResponseTime", { precision: 6, scale: 2 }).default("0").notNull(),
  skipRate: decimal("skipRate", { precision: 5, scale: 4 }).default("0").notNull(),
  completionRate: decimal("completionRate", { precision: 5, scale: 4 }).default("0").notNull(),
  dropOffPoints: text("dropOffPoints"),
  totalQuestionsAnswered: int("totalQuestionsAnswered").default(0).notNull(),
  totalQuestionsSkipped: int("totalQuestionsSkipped").default(0).notNull(),
  totalSessionTime: int("totalSessionTime").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BehavioralMetrics = typeof behavioralMetrics.$inferSelect;
export type InsertBehavioralMetrics = typeof behavioralMetrics.$inferInsert;

/**
 * Questions: Mocked questions for the survey engine
 */
export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  questionId: varchar("questionId", { length: 64 }).notNull().unique(),
  type: mysqlEnum("type", ["swipe", "rating", "choice", "open_ended"]).notNull(),
  questionText: text("questionText").notNull(),
  questionTextAr: text("questionTextAr").notNull(),
  options: text("options"),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium").notNull(),
  pointsValue: int("pointsValue").default(10).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;

/**
 * Answers: User responses to questions
 */
export const answers = mysqlTable("answers", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").references(() => sessions.id).notNull(),
  questionId: int("questionId").references(() => questions.id).notNull(),
  answer: text("answer").notNull(),
  responseTime: int("responseTime").notNull(),
  wasSkipped: boolean("wasSkipped").default(false).notNull(),
  pointsEarned: int("pointsEarned").default(0).notNull(),
  trustImpact: decimal("trustImpact", { precision: 5, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = typeof answers.$inferInsert;

/**
 * Rewards: Mocked reward offers (Jumia, Glovo, etc.)
 */
export const rewards = mysqlTable("rewards", {
  id: int("id").autoincrement().primaryKey(),
  rewardId: varchar("rewardId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }).notNull(),
  description: text("description"),
  descriptionAr: text("descriptionAr"),
  pointsCost: int("pointsCost").notNull(),
  category: mysqlEnum("category", ["mobile_recharge", "discount", "voucher", "other"]).notNull(),
  platform: varchar("platform", { length: 64 }),
  trustRequired: mysqlEnum("trustRequired", ["low", "medium", "high"]).default("low").notNull(),
  imageUrl: varchar("imageUrl", { length: 512 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = typeof rewards.$inferInsert;

/**
 * Purchases: Track reward purchases
 */
export const purchases = mysqlTable("purchases", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").references(() => sessions.id).notNull(),
  rewardId: int("rewardId").references(() => rewards.id).notNull(),
  pointsSpent: int("pointsSpent").notNull(),
  status: mysqlEnum("status", ["completed", "pending", "failed"]).default("completed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = typeof purchases.$inferInsert;

/**
 * Wheel spins: Track Rouet el Hadh spins
 */
export const wheelSpins = mysqlTable("wheel_spins", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").references(() => sessions.id).notNull(),
  pointsSpent: int("pointsSpent").notNull(),
  prizeWon: text("prizeWon").notNull(),
  spinResult: int("spinResult").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WheelSpin = typeof wheelSpins.$inferSelect;
export type InsertWheelSpin = typeof wheelSpins.$inferInsert;
