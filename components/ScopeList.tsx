// components/ScopeList.tsx
"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { BountyScope } from "@/lib/types";

export function ScopeList() {
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [scopes, setScopes] = useState<BountyScope[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    loadScopes();
  }, []);

  async function loadScopes() {
    const { data: { user } } = await supabaseBrowser.auth.getUser();
    if (!user) return;

    const { data } = await supabaseBrowser
      .from("bounty_scopes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setScopes(data || []);
  }

  async function syncH1() {
    if (!handle.trim()) {
      setStatus("⚠️ Wpisz H1 program handle");
      return;
    }

    setLoading(true);
    setStatus("📡 Zaciągam scope z HackerOne…");

    try {
      const res = await fetch("/api/scope/hackerone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: handle.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(`❌ ${data.error || "Failed"}`);
        return;
      }

      setStatus(`✅ ${data.message}`);
      setHandle("");
      await loadScopes();
    } catch (error: any) {
      setStatus(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function syncBugcrowd() {
    setLoading(true);
    setStatus("📡 Zaciągam scope z Bugcrowd…");

    try {
      const res = await fetch("/api/scope/bugcrowd", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setStatus(`❌ ${data.error || "Failed"}`);
        return;
      }

      setStatus("✅ Scope zaciągnięty z Bugcrowd");
      await loadScopes();
    } catch (error: any) {
      setStatus(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-col md:flex-row gap-2">
        <input
          className="flex-1 rounded bg-neutral-900 border border-neutral-700 px-3 py-2"
          placeholder="H1 program handle (np. uber, shopify)"
          value={handle}
          onChange={e => setHandle(e.target.value)}
          disabled={loading}
        />
        <button
          onClick={syncH1}
          disabled={loading || !handle.trim()}
          className="rounded bg-neutral-800 px-3 py-2 hover:bg-neutral-700 disabled:opacity-50 text-xs font-medium"
        >
          Zaciągnij z H1
        </button>
        <button
          onClick={syncBugcrowd}
          disabled={loading}
          className="rounded bg-neutral-800 px-3 py-2 hover:bg-neutral-700 disabled:opacity-50 text-xs font-medium"
        >
          Zaciągnij z Bugcrowd
        </button>
      </div>

      {status && (
        <div className="text-xs p-2 rounded bg-neutral-800 text-gray-300">
          {status}
        </div>
      )}

      {scopes.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">{scopes.length} program(ów) zaciągnięte</p>
          <div className="space-y-1">
            {scopes.map(scope => (
              <div
                key={scope.id}
                className="text-xs bg-neutral-900 p-2 rounded border border-neutral-800 flex justify-between items-start"
              >
                <div>
                  <p className="font-medium">
                    {scope.platform.toUpperCase()} - {scope.program_identifier}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {new Date(scope.created_at).toLocaleDateString("pl-PL")}
                  </p>
                </div>
                <span className="text-green-400 text-xs">✓</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400">
          Brak zaciągniętych scope'ów. Zaciągnij ze swoich programów.
        </p>
      )}
    </div>
  );
}
