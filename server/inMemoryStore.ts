/**
 * In-memory data store for sessions and behavioral data
 * This replaces the database for the demo/hackathon
 */

interface InMemorySession {
  sessionId: string;
  profileLevel: number;
  trustScore: number;
  points: number;
  streak: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  questionsAnswered: number;
  lastAnswerTime?: Date;
}

interface InMemoryAnswer {
  sessionId: string;
  questionId: string;
  answer: string;
  responseTime: number;
  wasSkipped: boolean;
  pointsEarned: number;
  createdAt: Date;
}

interface InMemoryBehavioralMetrics {
  sessionId: string;
  avgResponseTime: number;
  skipRate: number;
  completionRate: number;
  dropOffPoints: number;
  trustScore: number;
  lastUpdated: Date;
}

interface InMemoryPurchase {
  id: string;
  sessionId: string;
  rewardId: string;
  pointsSpent: number;
  createdAt: Date;
}

interface InMemoryWheelSpin {
  id: string;
  sessionId: string;
  prizeId: string;
  pointsSpent: number;
  pointsWon: number;
  createdAt: Date;
}

class InMemoryStore {
  private sessions: Map<string, InMemorySession> = new Map();
  private answers: Map<string, InMemoryAnswer[]> = new Map();
  private behavioralMetrics: Map<string, InMemoryBehavioralMetrics> = new Map();
  private purchases: Map<string, InMemoryPurchase[]> = new Map();
  private wheelSpins: Map<string, InMemoryWheelSpin[]> = new Map();

  // Session Management
  createSession(sessionId: string): InMemorySession {
    const session: InMemorySession = {
      sessionId,
      profileLevel: 0,
      trustScore: 45,
      points: 0,
      streak: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      questionsAnswered: 0,
    };
    this.sessions.set(sessionId, session);
    this.answers.set(sessionId, []);
    this.purchases.set(sessionId, []);
    this.wheelSpins.set(sessionId, []);
    return session;
  }

  getSession(sessionId: string): InMemorySession | null {
    return this.sessions.get(sessionId) || null;
  }

  updateSession(sessionId: string, updates: Partial<InMemorySession>): InMemorySession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const updated = { ...session, ...updates, updatedAt: new Date() };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  // Answer Management
  addAnswer(answer: InMemoryAnswer): void {
    const answers = this.answers.get(answer.sessionId) || [];
    answers.push(answer);
    this.answers.set(answer.sessionId, answers);
  }

  getAnswers(sessionId: string): InMemoryAnswer[] {
    return this.answers.get(sessionId) || [];
  }

  // Behavioral Metrics
  setBehavioralMetrics(sessionId: string, metrics: InMemoryBehavioralMetrics): void {
    this.behavioralMetrics.set(sessionId, metrics);
  }

  getBehavioralMetrics(sessionId: string): InMemoryBehavioralMetrics | null {
    return this.behavioralMetrics.get(sessionId) || null;
  }

  // Purchase Management
  addPurchase(purchase: InMemoryPurchase): void {
    const purchases = this.purchases.get(purchase.sessionId) || [];
    purchases.push(purchase);
    this.purchases.set(purchase.sessionId, purchases);
  }

  getPurchases(sessionId: string): InMemoryPurchase[] {
    return this.purchases.get(sessionId) || [];
  }

  // Wheel Spin Management
  addWheelSpin(spin: InMemoryWheelSpin): void {
    const spins = this.wheelSpins.get(spin.sessionId) || [];
    spins.push(spin);
    this.wheelSpins.set(spin.sessionId, spins);
  }

  getWheelSpins(sessionId: string): InMemoryWheelSpin[] {
    return this.wheelSpins.get(sessionId) || [];
  }

  // Statistics
  getSessionStats(sessionId: string) {
    const session = this.getSession(sessionId);
    const answers = this.getAnswers(sessionId);
    const purchases = this.getPurchases(sessionId);
    const spins = this.getWheelSpins(sessionId);

    if (!session) return null;

    const skippedCount = answers.filter(a => a.wasSkipped).length;
    const avgResponseTime =
      answers.length > 0
        ? answers.reduce((sum, a) => sum + a.responseTime, 0) / answers.length
        : 0;

    return {
      ...session,
      totalAnswers: answers.length,
      skippedCount,
      avgResponseTime,
      totalPurchases: purchases.length,
      totalSpins: spins.length,
    };
  }

  // Debug: Print all sessions
  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  // Debug: Clear all data
  clearAll() {
    this.sessions.clear();
    this.answers.clear();
    this.behavioralMetrics.clear();
    this.purchases.clear();
    this.wheelSpins.clear();
  }
}

// Export singleton instance
export const inMemoryStore = new InMemoryStore();
