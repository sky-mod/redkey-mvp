// app/error.tsx
"use client";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-redkey-bg flex items-center justify-center p-4">
      <div className="bg-redkey-card border border-neutral-800 rounded-lg p-8 max-w-md w-full space-y-4">
        <h1 className="text-xl font-bold text-red-500">❌ Coś się sypie</h1>
        <p className="text-sm text-gray-300">{error.message}</p>
        {error.digest && (
          <code className="block text-xs bg-black/50 p-2 rounded text-gray-400">
            {error.digest}
          </code>
        )}
        <button
          onClick={() => reset()}
          className="w-full rounded bg-red-500 px-4 py-2 text-sm font-semibold hover:bg-red-400"
        >
          Spróbuj jeszcze raz
        </button>
      </div>
    </div>
  );
}
