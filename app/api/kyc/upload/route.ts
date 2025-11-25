// app/api/kyc/upload/route.ts
import { NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { apiError, apiSuccess } from "@/app/api/helpers/error";
import { kycFormSchema } from "@/lib/validators";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const formData = await req.formData();
    const file = formData.get("selfie") as File | null;
    const role = formData.get("role") as string;

    // Validacja
    if (!file) {
      return apiError("Brak pliku selfie", 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError("Tylko JPEG/PNG/WebP", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return apiError("Max 5MB", 400);
    }

    if (!["ethical_hacker", "pentester", "dev", "lekarz", "slusarz"].includes(role)) {
      return apiError("Niewłaściwa rola", 400);
    }

    const supabase = getServerSupabase();

    // Upload do Supabase Storage
    const filePath = `kyc/${user.id}/${Date.now()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("kyc-selfies")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      return apiError(`Upload failed: ${uploadError.message}`, 500, uploadError);
    }

    // Public URL
    const { data: publicUrlData } = supabase.storage
      .from("kyc-selfies")
      .getPublicUrl(filePath);

    // Upsert profile
    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        role,
        selfie_url: publicUrlData.publicUrl,
        kyc_status: "pending"
      },
      { onConflict: "user_id" }
    );

    if (upsertError) {
      return apiError(`Profile update failed: ${upsertError.message}`, 500, upsertError);
    }

    return apiSuccess({
      message: "KYC wysłane, oczekiwanie na weryfikację",
      selfie_url: publicUrlData.publicUrl
    });
  } catch (error: any) {
    return apiError(error.message || "KYC upload failed", 500, error);
  }
}
