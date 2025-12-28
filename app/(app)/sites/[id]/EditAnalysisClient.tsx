"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";

type EditAnalysisClientProps = {
  siteId: string;
  initialStatus: string | null;
  initialOutcome: string | null;
  initialObjectionLikelihood: string | null;
  initialKeyPlanningConsiderations: string | null;
  initialPlanningSummary: string | null;
  initialDecisionSummary: string | null;
  action: (formData: FormData) => Promise<void>;
};

export function EditAnalysisClient({
  siteId,
  initialStatus,
  initialOutcome,
  initialObjectionLikelihood,
  initialKeyPlanningConsiderations,
  initialPlanningSummary,
  initialDecisionSummary,
  action,
}: EditAnalysisClientProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleAction(formData: FormData) {
    setMessage(null);
    setIsError(false);

    try {
      await action(formData);
      setMessage("Analysis saved");
      setIsError(false);
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong");
      setIsError(true);
    }
  }

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(() => {
      handleAction(formData);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-6 inline-flex items-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        {open ? "Close editor" : "Edit analysis"}
      </button>

      {open &&
        createPortal(
          <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-zinc-900">
              Edit planning analysis
            </h2>

            {message && (
              <p
                className={`mt-2 text-xs ${
                  isError ? "text-red-600" : "text-emerald-600"
                }`}
              >
                {message}
              </p>
            )}

            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <input type="hidden" name="id" value={siteId} />

              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-1 text-sm text-zinc-800">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Status
                  </span>
                  <input
                    name="status"
                    defaultValue={initialStatus ?? ""}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
                  />
                </label>

                <label className="space-y-1 text-sm text-zinc-800">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Outcome
                  </span>
                  <input
                    name="planning_outcome"
                    defaultValue={initialOutcome ?? ""}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
                  />
                </label>

                <label className="space-y-1 text-sm text-zinc-800">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Objection likelihood
                  </span>
                  <input
                    name="objection_likelihood"
                    defaultValue={initialObjectionLikelihood ?? ""}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
                  />
                </label>
              </div>

              <label className="block space-y-1 text-sm text-zinc-800">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Key planning considerations
                </span>
                <textarea
                  name="key_planning_considerations"
                  defaultValue={initialKeyPlanningConsiderations ?? ""}
                  rows={4}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
                />
              </label>

              <label className="block space-y-1 text-sm text-zinc-800">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Planning summary
                </span>
                <textarea
                  name="planning_summary"
                  defaultValue={initialPlanningSummary ?? ""}
                  rows={4}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
                />
              </label>

              <label className="block space-y-1 text-sm text-zinc-800">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Decision summary
                </span>
                <textarea
                  name="decision_summary"
                  defaultValue={initialDecisionSummary ?? ""}
                  rows={4}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
                />
              </label>

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {isPending ? "Saving…" : "Save analysis"}
              </button>
            </form>
          </section>,
          document.body
        )}
    </>
  );
}
