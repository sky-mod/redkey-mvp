// components/ReportBuilder.tsx
"use client";

import { useState } from "react";

export function ReportBuilder() {
  const [notes, setNotes] = useState("");
  const [severity, setSeverity] = useState<"critical" | "high" | "medium" | "low">("medium");
  const [aiReport, setAiReport] = useState("");
  const [programHandle, setProgramHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  async function generateReport() {
    if (notes.trim().length < 10) {
      setStatus({ type: "error", msg: "Min 10 znaków w notatkach" });
      return;
    }

    setLoading(true);
    setStatus({ type: "info", msg: "🤖 Grok myśli…" });

    try {
      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, severity })
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: "error", msg: data.error || "Generate failed" });
        return;
      }

      setAiReport(data.data.report);
      setStatus({ type: "success", msg: "✅ Raport gotowy!" });
    } catch (error: any) {
      setStatus({ type: "error", msg: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function submitH1() {
    if (!programHandle.trim()) {
      setStatus({ type: "error", msg: "Wpisz H1 program handle" });
      return;
    }

    if (!aiReport.trim()) {
      setStatus({ type: "error", msg: "Najpierw generate raport" });
      return;
    }

    setLoading(true);
    setStatus({ type: "info", msg: "📤 Wysyłam do HackerOne…" });

    try {
      const res = await fetch("/api/report/hackerone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programHandle: programHandle.trim(),
          report: {
            title: `RedKey Auto Report - ${severity}`,
            vulnerability_information: aiReport,
            severity
          }
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: "error", msg: data.error || "Submit failed" });
        return;
      }

      setStatus({ type: "success", msg: `✅ ${data.data.message}` });
      setNotes("");
      setAiReport("");
      setProgramHandle("");
    } catch (error: any) {
      setStatus({ type: "error", msg: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 text-sm">
      <textarea
        className="w-full min-h-[140px] rounded bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm"
        placeholder="Notatki, output tools, steps, POC… wszystko co masz"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        disabled={loading}
      />

      <div className="flex gap-2">
        <select
          value={severity}
          onChange={e => setSeverity(e.target.value as any)}
          disabled={loading}
          className="px-3 py-2 rounded bg-neutral-900 border border-neutral-700 text-xs"
        >
          <option value="critical">🔴 Critical</option>
          <option value="high">🟠 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>

        <button
          onClick={generateReport}
          disabled={loading || notes.trim().length < 10}
          className="rounded bg-neutral-800 px-4 py-2 hover:bg-neutral-700 disabled:opacity-50 text-xs font-medium"
        >
          🤖 Generate Grok
        </button>
      </div>

      {status && (
        <div className={`text-xs p-2 rounded ${
          status.type === "success"
            ? "bg-green-950 text-green-200"
            : status.type === "error"
            ? "bg-red-950 text-red-200"
            : "bg-blue-950 text-blue-200"
        }`}>
          {status.msg}
        </div>
      )}

      {aiReport && (
        <div className="space-y-2">
          <label className="block font-medium">Gotowy raport (edit OK)</label>
          <textarea
            className="w-full min-h-[180px] rounded bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm"
            value={aiReport}
            onChange={e => setAiReport(e.target.value)}
            disabled={loading}
          />
        </div>
      )}

      {aiReport && (
        <div className="space-y-2">
          <input
            className="w-full rounded bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm"
            placeholder="H1 program handle (np. uber, shopify)"
            value={programHandle}
            onChange={e => setProgramHandle(e.target.value)}
            disabled={loading}
          />
          <button
            onClick={submitH1}
            disabled={loading || !aiReport.trim() || !programHandle.trim()}
            className="w-full rounded bg-red-500 px-4 py-2 text-sm font-semibold hover:bg-red-400 disabled:opacity-50"
          >
            {loading ? "Wysyłam…" : "🎯 One-click submit H1"}
          </button>
        </div>
      )}
    </div>
  );
}
