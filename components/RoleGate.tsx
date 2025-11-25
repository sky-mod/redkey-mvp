// components/RoleGate.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { UserRole } from "@/lib/types";

interface RoleGateProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
}

export function RoleGate({ children, allowedRoles, fallback }: RoleGateProps) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabaseBrowser.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabaseBrowser
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      setRole(data?.role ?? null);
      setLoading(false);
    }

    checkRole();
  }, []);

  if (loading) return <div className="text-sm text-gray-400">Loading...</div>;
  if (!role || !allowedRoles.includes(role)) {
    return fallback ?? <div className="text-sm text-red-400">Access denied</div>;
  }

  return <>{children}</>;
}
