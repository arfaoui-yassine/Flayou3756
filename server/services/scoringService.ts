/**
 * Scoring Service: Calculates trust scores based on behavioral metrics
 */

export interface BehaviorData {
  avgResponseTime: number; // milliseconds
  skipRate: number; // 0-1
  completionRate: number; // 0-1
  totalQuestionsAnswered: number;
  totalQuestionsSkipped: number;
  sessionContinuity: number; // 0-1
}

export interface TrustScoreFactors {
  profileDepth: number; // 0-20
  consistency: number; // 0-20
  effort: number; // 0-20
  behavior: number; // 0-20
  sessionContinuity: number; // 0-20
}

/**
 * Calculate trust score based on multiple factors
 * Total score: 0-100
 */
export function calculateTrustScore(factors: TrustScoreFactors): number {
  const total =
    factors.profileDepth +
    factors.consistency +
    factors.effort +
    factors.behavior +
    factors.sessionContinuity;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, total));
}

/**
 * Calculate profile depth score (0-20)
 * Based on profile level and completeness
 */
export function calculateProfileDepthScore(profileLevel: number, fieldsCompleted: number, totalFields: number = 5): number {
  const levelScore = (profileLevel / 3) * 10; // 0-10 based on level (0-3)
  const completionScore = (fieldsCompleted / totalFields) * 10; // 0-10 based on completion
  return Math.min(20, levelScore + completionScore);
}

/**
 * Calculate consistency score (0-20)
 * Based on answer patterns and time consistency
 */
export function calculateConsistencyScore(
  avgResponseTime: number,
  responseTimeVariance: number,
  answerConsistency: number // 0-1
): number {
  // Ideal response time: 2-5 seconds
  const idealTime = 3500; // milliseconds
  const timeDeviation = Math.abs(avgResponseTime - idealTime);
  const timeScore = Math.max(0, 10 - (timeDeviation / 1000) * 2); // 0-10

  // Lower variance = more consistent
  const varianceScore = Math.max(0, 10 - (responseTimeVariance / 1000) * 1); // 0-10

  return Math.min(20, timeScore + varianceScore * answerConsistency);
}

/**
 * Calculate effort score (0-20)
 * Based on number of questions answered and time invested
 */
export function calculateEffortScore(
  totalQuestionsAnswered: number,
  totalSessionTime: number // seconds
): number {
  // Reward for answering more questions
  const questionsScore = Math.min(10, (totalQuestionsAnswered / 20) * 10); // 0-10

  // Reward for time invested
  const timeScore = Math.min(10, (totalSessionTime / 600) * 10); // 0-10 (max 10 minutes)

  return questionsScore + timeScore;
}

/**
 * Calculate behavior score (0-20)
 * Based on skip rate, completion rate, and answer quality
 */
export function calculateBehaviorScore(
  skipRate: number, // 0-1
  completionRate: number, // 0-1
  avgResponseTime: number // milliseconds
): number {
  // Penalize high skip rate
  const skipPenalty = skipRate * 10; // 0-10 penalty

  // Reward high completion rate
  const completionBonus = completionRate * 10; // 0-10 bonus

  // Penalize very fast responses (likely random)
  const speedPenalty = avgResponseTime < 1000 ? 5 : 0; // 0-5 penalty

  const score = 10 + completionBonus - skipPenalty - speedPenalty;
  return Math.max(0, Math.min(20, score));
}

/**
 * Calculate session continuity score (0-20)
 * Based on session duration and no drop-offs
 */
export function calculateSessionContinuityScore(
  sessionDuration: number, // seconds
  dropOffCount: number,
  totalQuestionsAnswered: number
): number {
  // Reward longer sessions
  const durationScore = Math.min(10, (sessionDuration / 600) * 10); // 0-10

  // Penalize drop-offs
  const dropOffRate = totalQuestionsAnswered > 0 ? dropOffCount / totalQuestionsAnswered : 0;
  const dropOffPenalty = dropOffRate * 10; // 0-10 penalty

  const score = durationScore - dropOffPenalty + 10;
  return Math.max(0, Math.min(20, score));
}

/**
 * Calculate overall trust score from behavior data
 */
export function calculateTrustScoreFromBehavior(
  behaviorData: BehaviorData,
  profileLevel: number = 0,
  fieldsCompleted: number = 0
): number {
  const factors: TrustScoreFactors = {
    profileDepth: calculateProfileDepthScore(profileLevel, fieldsCompleted),
    consistency: calculateConsistencyScore(
      behaviorData.avgResponseTime,
      behaviorData.avgResponseTime * 0.3, // Assume 30% variance
      1 - behaviorData.skipRate
    ),
    effort: calculateEffortScore(
      behaviorData.totalQuestionsAnswered,
      behaviorData.totalQuestionsAnswered * 30 // Assume 30 seconds per question
    ),
    behavior: calculateBehaviorScore(
      behaviorData.skipRate,
      behaviorData.completionRate,
      behaviorData.avgResponseTime
    ),
    sessionContinuity: calculateSessionContinuityScore(
      behaviorData.totalQuestionsAnswered * 30,
      0,
      behaviorData.totalQuestionsAnswered
    ),
  };

  return calculateTrustScore(factors);
}

/**
 * Get trust level based on score
 */
export function getTrustLevel(score: number): "low" | "medium" | "high" {
  if (score < 30) return "low";
  if (score < 70) return "medium";
  return "high";
}

/**
 * Calculate points earned based on response quality
 */
export function calculatePointsEarned(
  basePoints: number,
  responseTime: number, // milliseconds
  trustScore: number,
  isVerified: boolean = false
): number {
  let points = basePoints;

  // Bonus for verified users
  if (isVerified) {
    points *= 1.2; // 20% bonus
  }

  // Bonus for thoughtful responses (3-5 seconds)
  if (responseTime >= 2000 && responseTime <= 5000) {
    points *= 1.1; // 10% bonus
  }

  // Penalty for too fast responses
  if (responseTime < 1000) {
    points *= 0.8; // 20% penalty
  }

  // Bonus based on trust score
  if (trustScore >= 70) {
    points *= 1.15; // 15% bonus
  } else if (trustScore < 30) {
    points *= 0.9; // 10% penalty
  }

  return Math.floor(points);
}
