// app/api/report/hackerone/route.ts
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/supabase/auth";
import { apiError, apiSuccess } from "@/app/api/helpers/error";
import { ReportSubmission } from "@/lib/types";

async function submitH1Report(
  handle: string,
  report: ReportSubmission
) {
  const u = process.env.HACKERONE_API_USERNAME;
  const t = process.env.HACKERONE_API_TOKEN;
  if (!u || !t) throw new Error("Brak H1 credów");

  const token = Buffer.from(`${u}:${t}`).toString("base64");

  const payload = {
    data: {
      type: "report",
      attributes: {
        title: report.title,
        vulnerability_information: report.vulnerability_information,
        severity_rating: report.severity
      }
    }
  };

  const res = await fetch(
    `https://api.hackerone.com/v1/hackers/programs/${handle}/reports`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${token}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json"
      },
      body: JSON.stringify(payload)
    }
  );

  if (!res.ok) {
    const errorData = await res.text();
    throw new Error(`H1 API error: ${res.status} - ${errorData}`);
  }

  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { programHandle, report } = await req.json();

    if (!programHandle || !report?.title || !report?.vulnerability_information) {
      return apiError("Brakuje danych raportu", 400);
    }

    const data = await submitH1Report(programHandle, report);

    return apiSuccess({
      message: "Raport wysłany do HackerOne! 🎯",
      report_id: data.data?.id
    });
  } catch (error: any) {
    return apiError(error.message || "H1 submit failed", 500, error);
  }
}
