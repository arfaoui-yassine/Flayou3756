import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

export interface SessionData {
  sessionId: string;
  points: number;
  trustScore: number;
  profileLevel: number;
  streak: number;
}

interface SessionContextType {
  session: SessionData | null;
  isLoading: boolean;
  updatePoints: (newPoints: number) => void;
  updateTrustScore: (newScore: number) => void;
  updateProfileLevel: (newLevel: number) => void;
  addPoints: (pointsToAdd: number) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const createSessionMutation = trpc.session.create.useMutation();
  const getSessionQuery = trpc.session.get.useQuery(
    { sessionId: session?.sessionId || "" },
    { enabled: !!session?.sessionId }
  );

  useEffect(() => {
    const initSession = async () => {
      try {
        const storedSessionId = localStorage.getItem("sessionId");

        if (storedSessionId) {
          // Try to get existing session
          // Note: Using direct API call instead of query hook
          const sessionData = await fetch(`/api/trpc/session.get?input=${JSON.stringify({ sessionId: storedSessionId })}`).then(r => r.json()).catch(() => null);
          if (sessionData?.result?.data) {
            setSession({
              sessionId: storedSessionId,
              points: sessionData.points,
              trustScore: parseFloat(sessionData.trustScore.toString()),
              profileLevel: sessionData.profileLevel,
              streak: sessionData.streak,
            });
          } else {
            // Session expired, create new one
            const result = await createSessionMutation.mutateAsync();
            localStorage.setItem("sessionId", result.sessionId);
            setSession({
              sessionId: result.sessionId,
              points: 0,
              trustScore: 45,
              profileLevel: 0,
              streak: 0,
            });
          }
        } else {
          // Create new session
          const result = await createSessionMutation.mutateAsync();
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
  }, [createSessionMutation]);

  const updatePoints = (newPoints: number) => {
    setSession(prev => (prev ? { ...prev, points: newPoints } : null));
  };

  const addPoints = (pointsToAdd: number) => {
    setSession(prev => (prev ? { ...prev, points: prev.points + pointsToAdd } : null));
  };

  const updateTrustScore = (newScore: number) => {
    setSession(prev => (prev ? { ...prev, trustScore: newScore } : null));
  };

  const updateProfileLevel = (newLevel: number) => {
    setSession(prev => (prev ? { ...prev, profileLevel: newLevel } : null));
  };

  return (
    <SessionContext.Provider
      value={{
        session,
        isLoading,
        updatePoints,
        updateTrustScore,
        updateProfileLevel,
        addPoints,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionContext must be used within SessionProvider");
  }
  return context;
}
