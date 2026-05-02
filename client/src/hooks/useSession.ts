import { useEffect, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";

export interface SessionData {
  sessionId: string;
  points: number;
  trustScore: number;
  profileLevel: number;
  streak: number;
}

export function useSession() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get or create session
  useEffect(() => {
    const initSession = async () => {
      try {
        // Check if session exists in localStorage
        const storedSessionId = localStorage.getItem("sessionId");

        if (storedSessionId) {
          // Get existing session
          const sessionQuery = trpc.session.get.useQuery({ sessionId: storedSessionId });
          if (sessionQuery.data) {
            setSession({
              sessionId: storedSessionId,
              points: sessionQuery.data.points,
              trustScore: parseFloat(sessionQuery.data.trustScore.toString()),
              profileLevel: sessionQuery.data.profileLevel,
              streak: sessionQuery.data.streak,
            });
          }
        } else {
          // Create new session
          const createMutation = trpc.session.create.useMutation();
          const result = await createMutation.mutateAsync();
          localStorage.setItem("sessionId", result.sessionId);
          
          setSession({
            sessionId: result.sessionId,
            points: 0,
            trustScore: 45,
            profileLevel: 0,
            streak: 0,
          });
        }
      } catch (error) {
        console.error("Failed to initialize session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  const updatePoints = useCallback((newPoints: number) => {
    setSession(prev => prev ? { ...prev, points: newPoints } : null);
  }, []);

  const updateTrustScore = useCallback((newScore: number) => {
    setSession(prev => prev ? { ...prev, trustScore: newScore } : null);
  }, []);

  const updateProfileLevel = useCallback((newLevel: number) => {
    setSession(prev => prev ? { ...prev, profileLevel: newLevel } : null);
  }, []);

  return {
    session,
    isLoading,
    updatePoints,
    updateTrustScore,
    updateProfileLevel,
  };
}
