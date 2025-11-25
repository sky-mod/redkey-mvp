// app/api/helpers/error.ts
import { NextResponse } from "next/server";

export function apiError(message: string, status: number = 400, error?: any) {
  console.error(`[API Error ${status}]`, message, error);
  return NextResponse.json(
    {
      ok: false,
      error: message,
      ...(process.env.NODE_ENV === "development" && error && { debug: error.message })
    },
    { status }
  );
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(
    { ok: true, data },
    { status }
  );
}

export function apiMessage(message: string, status: number = 200) {
  return NextResponse.json(
    { ok: true, message },
    { status }
  );
}
