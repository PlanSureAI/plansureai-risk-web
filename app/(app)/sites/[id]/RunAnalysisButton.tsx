"use client";

import { useFormStatus } from "react-dom";

export function RunAnalysisButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:opacity-80"
    >
      {pending ? "Running full analysis..." : "Run full analysis"}
    </button>
  );
}
