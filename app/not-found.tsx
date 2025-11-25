// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-redkey-bg flex items-center justify-center p-4">
      <div className="bg-redkey-card border border-neutral-800 rounded-lg p-8 max-w-md w-full space-y-4 text-center">
        <h1 className="text-3xl font-bold text-red-500">404</h1>
        <p className="text-gray-300">Strona nie istnieje</p>
        <Link
          href="/dashboard/bug-bounty-pro"
          className="inline-block rounded bg-red-500 px-4 py-2 text-sm font-semibold hover:bg-red-400"
        >
          Wróć do workspace
        </Link>
      </div>
    </div>
  );
}
