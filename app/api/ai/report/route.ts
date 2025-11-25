// app/api/ai/report/route.ts
import { NextRequest } from "next/server";
import { grokChat } from "@/lib/ai/grok";
import { claudeChat } from "@/lib/ai/claude";
import { apiError, apiSuccess } from "@/app/api/helpers/error";
import { requireUser } from "@/lib/supabase/auth";
import { reportSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { notes, severity } = await req.json();

    if (!notes || notes.trim().length < 10) {
      return apiError("Notatki muszą mieć min 10 znaków", 400);
    }

    const prompt = `
You are a senior bug bounty hunter with 10+ years experience.

Generate a professional vulnerability report in English from the provided notes:

NOTES:
${notes}

REQUIRED FORMAT:
1. **Summary** - Brief vulnerability description (2-3 sentences)
2. **Steps to Reproduce** - Clear numbered steps
3. **Impact** - Business/security impact assessment
4. **Severity**: ${severity || "medium"}
5. **Suggested Remediation** - Concrete fixes

Keep it concise, technical, and ready for H1/Bugcrowd submission. NO markdown, plain text.
`;

    let report: string;
    try {
      report = await grokChat(prompt);
    } catch {
      report = await claudeChat(prompt);
    }

    return apiSuccess({ report, generated_at: new Date().toISOString() });
  } catch (error: any) {
    return apiError(error.message || "Report generation failed", 500, error);
  }
}
