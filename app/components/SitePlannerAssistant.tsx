"use client";

import { useState } from "react";

type Props = {
  siteId: string;
  documentId: string;
  contextType?: "summary" | "compare";
};

const SUGGESTIONS = [
  "What are the main planning risks here?",
  "What should I do before spending more on this site?",
  "How do the fees and route impact my next steps?",
];

export default function SitePlannerAssistant({
  siteId,
  documentId,
  contextType = "summary",
}: Props) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [interactionId, setInteractionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [comment, setComment] = useState("");

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);
    setFeedbackSent(false);
    setInteractionId(null);
    try {
      const res = await fetch("/api/planner-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          documentId,
          question,
          contextType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setAnswer(data.answer);
      setInteractionId(data.interactionId);
    } catch (err) {
      setAnswer(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const sendFeedback = async (answerQuality: number) => {
    if (!interactionId) return;
    await fetch("/api/planner-assistant/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interactionId,
        answerQuality,
        comment: comment.trim() || undefined,
      }),
    });
    setFeedbackSent(true);
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Ask the planner
          </p>
          <p className="text-sm text-zinc-700">
            Need next steps? Ask the planner AI about this site.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
        >
          Ask about next steps
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-3 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setQuestion(suggestion)}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <textarea
            rows={3}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
            placeholder="Ask a question about this planning document..."
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={ask}
              disabled={loading}
              className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Asking…" : "Ask"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-800"
            >
              Close
            </button>
          </div>

          {answer && (
            <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-800">
              <p className="font-semibold text-zinc-900">Planner response</p>
              <p>{answer}</p>

              {!feedbackSent && interactionId && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Was this useful?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => sendFeedback(5)}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => sendFeedback(2)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                    >
                      No
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    className="w-full rounded-md border border-zinc-200 px-2 py-1 text-xs"
                    placeholder="What was missing? (optional)"
                  />
                </div>
              )}

              {feedbackSent && (
                <p className="text-xs text-zinc-500">Thanks for the feedback.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
