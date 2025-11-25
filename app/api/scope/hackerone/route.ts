// app/api/scope/hackerone/route.ts
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/supabase/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/app/api/helpers/error";

async function retryFetch<T>(
  fn: () => Promise<T>,
  retries: number = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error("Max retries exceeded");
}

async function fetchH1Scope(handle: string) {
  const u = process.env.HACKERONE_API_USERNAME;
  const t = process.env.HACKERONE_API_TOKEN;
  if (!u || !t) throw new Error("Brak H1 credów");

  const token = Buffer.from(`${u}:${t}`).toString("base64");

  const res = await fetch(
    `https://api.hackerone.com/v1/hackers/programs/${handle}/structured_scopes`,
    {
      headers: {
        Authorization: `Basic ${token}`,
        Accept: "application/json"
      }
    }
  );

  if (!res.ok) {
    throw new Error(`H1 API error: ${res.status}`);
  }

  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { handle } = await req.json();

    if (!handle || handle.trim().length < 2) {
      return apiError("Program handle wymagany", 400);
    }

    const scope = await retryFetch(() => fetchH1Scope(handle));
    const supabase = getServerSupabase();

    await supabase.from("bounty_scopes").insert({
      user_id: user.id,
      platform: "hackerone",
      program_identifier: handle,
      scope_json: scope
    });

    return apiSuccess({
      message: `Zaciągnięto scope dla ${handle}`,
      assets_count: scope.data?.length || 0
    });
  } catch (error: any) {
    return apiError(error.message || "Scope pull failed", 500, error);
  }
}
