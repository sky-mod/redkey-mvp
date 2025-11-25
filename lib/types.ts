// lib/types.ts
export type UserRole = "ethical_hacker" | "pentester" | "dev" | "lekarz" | "slusarz";
export type KycStatus = "pending" | "verified" | "rejected";
export type PlatformType = "hackerone" | "bugcrowd";

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  kyc_status: KycStatus;
  selfie_url: string | null;
  created_at: string;
}

export interface BountyScope {
  id: string;
  user_id: string;
  platform: PlatformType;
  program_identifier: string;
  scope_json: Record<string, any>;
  created_at: string;
}

export interface StripeSubscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: "active" | "canceled" | "past_due";
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  encrypted_payload: Record<string, any>;
  created_at: string;
}

export interface ApiResponse<T> {
  ok?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface H1ScopeResponse {
  data: Array<{
    type: string;
    attributes: {
      asset_type: string;
      asset_identifier: string;
      eligible_for_bounty: boolean;
      instruction: string | null;
    };
  }>;
}

export interface ReportSubmission {
  title: string;
  vulnerability_information: string;
  severity: "critical" | "high" | "medium" | "low" | "informational";
  poc_required?: boolean;
}
