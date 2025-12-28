"use client";

import { useFormStatus } from "react-dom";

export function RunAnalysisButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Running analysis..." : "Run AI planning analysis"}
    </button>
  );
}
