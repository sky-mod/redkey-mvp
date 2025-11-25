// app/api/ai/chat/route.ts
import { NextRequest } from "next/server";
import { grokChat } from "@/lib/ai/grok";
import { claudeChat } from "@/lib/ai/claude";
import { apiError, apiSuccess } from "@/app/api/helpers/error";

const AI_TIMEOUT = 30000; // 30s

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("AI timeout")), ms)
    )
  ]);
}

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || prompt.trim().length < 3) {
      return apiError("Prompt musi mieć min 3 znaki", 400);
    }

    let answer: string;
    let engine: string;

    try {
      answer = await withTimeout(grokChat(prompt), AI_TIMEOUT);
      engine = "grok";
    } catch (grokError: any) {
      console.warn(`⚠️ Grok failed: ${grokError.message}, fallback to Claude`);
      try {
        answer = await withTimeout(claudeChat(prompt), AI_TIMEOUT);
        engine = "claude";
      } catch (claudeError: any) {
        return apiError("Obie AI modele nie odpowiadają", 503, claudeError);
      }
    }

    return apiSuccess({ engine, answer });
  } catch (error: any) {
    return apiError(error.message || "AI request failed", 500, error);
  }
}
