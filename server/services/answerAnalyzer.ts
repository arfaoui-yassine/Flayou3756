/**
 * AI Answer Quality Analyzer
 * Uses OpenRouter (tencent/hy3-preview:free) to asynchronously analyze
 * user answer quality and generate a performance report in Tunisian Arabic.
 */

import { ENV } from "../_core/env";
import { inMemoryStore } from "../inMemoryStore";
import type { AIPerformanceReport } from "../inMemoryStore";

interface AnswerForAnalysis {
  questionId: string;
  questionText: string;
  questionType: string;
  answer: string;
  responseTime: number;
  wasSkipped: boolean;
}

/**
 * Call OpenRouter API with the tencent/hy3-preview:free model.
 */
async function callOpenRouter(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = ENV.openRouterApiKey;
  if (!apiKey || apiKey === "your-openrouter-api-key-here") {
    throw new Error("OPENROUTER_API_KEY is not configured in .env");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Chnouwa Rayek",
    },
    body: JSON.stringify({
      model: "tencent/hy3-preview:free",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  console.log("[AI Analysis] Raw OpenRouter response:", JSON.stringify(data).substring(0, 500));
  
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    console.warn("[AI Analysis] Empty content. Full response:", JSON.stringify(data));
    throw new Error("Empty response from OpenRouter");
  }

  return content;
}

/**
 * Generate a fallback report from behavioral data alone (no LLM needed).
 */
function generateFallbackReport(
  answersData: AnswerForAnalysis[],
  sessionStats: { trustScore: number; points: number; questionsAnswered: number }
): AIPerformanceReport {
  const skippedCount = answersData.filter(a => a.wasSkipped).length;
  const answeredOnly = answersData.filter(a => !a.wasSkipped);
  const avgTime = answeredOnly.length > 0
    ? answeredOnly.reduce((sum, a) => sum + a.responseTime, 0) / answeredOnly.length / 1000
    : 0;
  const skipRate = answersData.length > 0 ? skippedCount / answersData.length : 0;
  const openEndedAnswers = answeredOnly.filter(a => a.questionType === "open_ended");
  const avgOpenLength = openEndedAnswers.length > 0
    ? openEndedAnswers.reduce((sum, a) => sum + a.answer.length, 0) / openEndedAnswers.length
    : 0;

  // Calculate score from behavioral metrics
  let score = 50;
  if (avgTime >= 2 && avgTime <= 5) score += 15;
  else if (avgTime >= 1) score += 5;
  else score -= 10;
  if (skipRate < 0.1) score += 15;
  else if (skipRate < 0.3) score += 5;
  else score -= 10;
  if (avgOpenLength > 20) score += 10;
  else if (avgOpenLength > 5) score += 5;
  score += Math.min(10, sessionStats.trustScore / 10);
  score = Math.max(0, Math.min(100, Math.round(score)));

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (avgTime >= 2 && avgTime <= 5) strengths.push("وقت الإجابة متاعك مثالي — تفكر قبل ما تجاوب");
  if (skipRate < 0.1) strengths.push("تجاوب على أغلب الأسئلة بدون تخطي");
  if (avgOpenLength > 15) strengths.push("إجاباتك المفتوحة فيها تفاصيل كافية");
  if (sessionStats.trustScore > 60) strengths.push("نقاط الثقة متاعك عالية — أداء مستقر");

  if (avgTime < 1.5) improvements.push("خذ وقتك أكثر في الإجابة — سرعة كبيرة تنقص من الجودة");
  if (skipRate > 0.3) improvements.push("حاول ما تخطيش أسئلة برشة");
  if (avgOpenLength < 10 && openEndedAnswers.length > 0) improvements.push("أعطي إجابات أطول في الأسئلة المفتوحة");
  if (strengths.length === 0) strengths.push("بديت مليح — كمّل وتحسّن!");

  const engagementLevel = skipRate < 0.15 ? "عالي" : skipRate < 0.4 ? "متوسط" : "منخفض";
  const answerDepth = avgOpenLength > 20 ? "عميق" : avgOpenLength > 5 ? "متوسط" : "سطحي";
  const consistencyRating = avgTime >= 1.5 && avgTime <= 8 ? "ثابت" : "متقلب";

  const summaryParts: string[] = [];
  if (score >= 70) summaryParts.push("أداء ممتاز! جاوبت بجودة عالية ووقت مناسب.");
  else if (score >= 45) summaryParts.push("أداء مقبول. فما مجال للتحسن.");
  else summaryParts.push("لازم تحسّن شوية. خذ وقتك وجاوب بتركيز.");
  summaryParts.push(`جاوبت على ${answeredOnly.length} سؤال بمعدل ${avgTime.toFixed(1)} ثوان.`);

  return {
    status: "ready",
    generatedAt: new Date(),
    overallScore: score,
    summary: summaryParts.join(" "),
    strengths,
    improvements,
    engagementLevel,
    answerDepth,
    consistencyRating,
  };
}

/**
 * Trigger async AI analysis of answer quality for a session.
 * This is fire-and-forget — it sets status to "pending" immediately
 * and updates to "ready" when the LLM responds.
 */
export function triggerAnswerAnalysis(
  sessionId: string,
  answersData: AnswerForAnalysis[],
  sessionStats: { trustScore: number; points: number; questionsAnswered: number }
): void {
  // Set pending status immediately
  inMemoryStore.setAIReport(sessionId, { status: "pending" });

  // Run analysis in background
  analyzeAnswers(sessionId, answersData, sessionStats).catch((error) => {
    console.error("[AI Analysis] Failed, using fallback:", error);
    // Use behavioral fallback instead of showing error
    const fallback = generateFallbackReport(answersData, sessionStats);
    inMemoryStore.setAIReport(sessionId, fallback);
  });
}

async function analyzeAnswers(
  sessionId: string,
  answersData: AnswerForAnalysis[],
  sessionStats: { trustScore: number; points: number; questionsAnswered: number }
): Promise<void> {
  // Only analyze if there are enough answers
  if (answersData.length < 3) {
    inMemoryStore.setAIReport(sessionId, {
      status: "ready",
      generatedAt: new Date(),
      overallScore: 0,
      summary: "لازم تجاوب على 3 أسئلة على الأقل باش نقدرو نعطيوك تقرير.",
      strengths: [],
      improvements: ["جاوب على أسئلة أكثر"],
      engagementLevel: "مبتدئ",
      answerDepth: "غير كافي",
      consistencyRating: "—",
    });
    return;
  }

  const skippedCount = answersData.filter(a => a.wasSkipped).length;
  const answeredOnly = answersData.filter(a => !a.wasSkipped);
  const avgTime = answeredOnly.length > 0
    ? answeredOnly.reduce((sum, a) => sum + a.responseTime, 0) / answeredOnly.length / 1000
    : 0;

  // Build the prompt
  const answersContext = answersData.map((a, i) => (
    `${i + 1}. Question: "${a.questionText}" (${a.questionType})
   Answer: ${a.wasSkipped ? "[SKIPPED]" : `"${a.answer}"`}
   Response time: ${(a.responseTime / 1000).toFixed(1)}s`
  )).join("\n");

  const systemPrompt = `You are a behavioral analyst. Analyze user answer quality and return a JSON report.

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{"overall_score":75,"summary":"Arabic text here","strengths":["point1","point2"],"improvements":["point1","point2"],"engagement_level":"عالي","answer_depth":"متوسط","consistency_rating":"ثابت"}

Rules:
- overall_score: 0-100
- summary: 2-3 sentences in Tunisian Arabic (Derja)
- strengths: list in Tunisian Arabic
- improvements: list in Tunisian Arabic
- engagement_level: عالي or متوسط or منخفض
- answer_depth: عميق or متوسط or سطحي
- consistency_rating: ثابت or متقلب or غير كافي`;

  const userPrompt = `Answers to analyze:
${answersContext}

Stats: ${answersData.length} total, ${skippedCount} skipped, ${avgTime.toFixed(1)}s avg time, trust=${sessionStats.trustScore}/100, points=${sessionStats.points}`;

  try {
    console.log(`[AI Analysis] Sending ${answersData.length} answers to OpenRouter...`);
    const content = await callOpenRouter(systemPrompt, userPrompt);

    // Extract JSON from the response (handle potential markdown wrapping)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in LLM response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const report: AIPerformanceReport = {
      status: "ready",
      generatedAt: new Date(),
      overallScore: Math.max(0, Math.min(100, parsed.overall_score ?? 50)),
      summary: parsed.summary ?? "لم يتم تحليل الإجابات بنجاح.",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      engagementLevel: parsed.engagement_level ?? "متوسط",
      answerDepth: parsed.answer_depth ?? "متوسط",
      consistencyRating: parsed.consistency_rating ?? "غير كافي",
    };

    inMemoryStore.setAIReport(sessionId, report);
    console.log(`[AI Analysis] Report ready for session ${sessionId}: score=${report.overallScore}`);
  } catch (error) {
    console.error("[AI Analysis] LLM error, using behavioral fallback:", error);
    // Fall back to behavioral analysis instead of showing error
    const fallback = generateFallbackReport(answersData, sessionStats);
    inMemoryStore.setAIReport(sessionId, fallback);
  }
}

