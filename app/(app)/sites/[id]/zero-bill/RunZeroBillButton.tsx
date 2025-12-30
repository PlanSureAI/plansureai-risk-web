"use client";

import { useFormStatus } from "react-dom";

export function RunZeroBillButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
    >
      {pending ? "Running Zero-Bill analysis..." : "Run Zero-Bill assessment"}
    </button>
  );
}
