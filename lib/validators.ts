// lib/validators.ts
import { z } from "zod";

export const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_test_"),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_test_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  STRIPE_PRICE_ID_MONTHLY_99: z.string().startsWith("price_"),
  HACKERONE_API_USERNAME: z.string(),
  HACKERONE_API_TOKEN: z.string(),
  BUGCROWD_API_TOKEN: z.string(),
  XAI_API_KEY: z.string(),
  ANTHROPIC_API_KEY: z.string()
});

export function validateEnv() {
  const env = process.env;
  try {
    return envSchema.parse(env);
  } catch (error: any) {
    console.error("❌ Brak wymaganych zmiennych środowiskowych:");
    console.error(error.errors);
    throw new Error("Konfiguracja nie pasuje do schematu");
  }
}

export const kycFormSchema = z.object({
  role: z.enum(["ethical_hacker", "pentester", "dev", "lekarz", "slusarz"]),
  selfie: z.instanceof(File)
    .refine(file => file.size <= 5 * 1024 * 1024, "Max 5MB")
    .refine(
      file => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
      "Tylko JPEG/PNG/WebP"
    )
});

export const reportSchema = z.object({
  notes: z.string().min(10, "Min 10 znaków"),
  programHandle: z.string().min(2),
  severity: z.enum(["critical", "high", "medium", "low"])
});
