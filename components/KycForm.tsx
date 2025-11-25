// components/KycForm.tsx
"use client";

import { useState } from "react";
import type { UserRole } from "@/lib/types";

const roles: Array<{ value: UserRole; label: string }> = [
  { value: "ethical_hacker", label: "🔓 Ethical hacker" },
  { value: "pentester", label: "🛡️ Pentester" },
  { value: "dev", label: "💻 Dev" },
  { value: "lekarz", label: "⚕️ Lekarz" },
  { value: "slusarz", label: "🔑 Ślusarz" }
];

export function KycForm() {
  const [role, setRole] = useState<UserRole>("ethical_hacker");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    if (!file) {
      setStatus({ type: "error", msg: "Wrzuć selfie" });
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("role", role);
      fd.append("selfie", file);

      const res = await fetch("/api/kyc/upload", {
        method: "POST",
        body: fd
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: "error", msg: data.error || "Upload failed" });
        return;
      }

      setStatus({
        type: "success",
        msg: "✅ KYC wysłane, czekamy na weryfikację"
      });
      setFile(null);
    } catch (error: any) {
      setStatus({ type: "error", msg: error.message || "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="space-y-1 text-sm">
        <label className="block font-medium">Deklaracja roli</label>
        <select
          value={role}
          onChange={e => setRole(e.target.value as UserRole)}
          disabled={loading}
          className="w-full rounded bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm disabled:opacity-50"
        >
          {roles.map(r => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1 text-sm">
        <label className="block font-medium">Selfie (KYC)</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          disabled={loading}
          className="w-full text-xs disabled:opacity-50"
        />
        <p className="text-xs text-gray-400">Max 5MB, JPEG/PNG/WebP</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-red-500 px-4 py-2 text-sm font-semibold hover:bg-red-400 disabled:opacity-50"
      >
        {loading ? "Wysyłam…" : "Wyślij KYC"}
      </button>

      {status && (
        <div className={`text-xs p-2 rounded ${
          status.type === "success"
            ? "bg-green-950 text-green-200"
            : "bg-red-950 text-red-200"
        }`}>
          {status.msg}
        </div>
      )}
    </form>
  );
}
