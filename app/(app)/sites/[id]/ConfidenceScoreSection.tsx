"use client"

import { useState } from "react"
import { createSupabaseBrowserClient } from "@/app/lib/supabaseBrowser"

type ConfidenceScoreSectionProps = {
  siteId: string
  siteName: string | null
  address: string | null
  localPlanningAuthority: string | null
  aiOutcome: string | null
  aiRiskSummary: string | null
  keyPlanningConsiderations: string | null
  objectionLikelihood: string | null
}

export function ConfidenceScoreSection({
  siteId,
  siteName,
  address,
  localPlanningAuthority,
  aiOutcome,
  aiRiskSummary,
  keyPlanningConsiderations,
  objectionLikelihood,
}: ConfidenceScoreSectionProps) {
  const [score, setScore] = useState<number | null>(null)
  const [reasons, setReasons] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleGenerateConfidenceScore() {
    try {
      setIsGenerating(true)

      const supabase = createSupabaseBrowserClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("No active session")
      }

      const payload = {
        site_id: siteId,
        site_name: siteName ?? "",
        address: address ?? "",
        local_planning_authority: localPlanningAuthority ?? "",
        ai_outcome: aiOutcome ?? "",
        ai_risk_summary: aiRiskSummary ?? "",
        key_planning_considerations: keyPlanningConsiderations ?? "",
        objection_likelihood: objectionLikelihood ?? "",
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-confidence-score`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify(payload),
        }
      )

      if (!res.ok) {
        console.error("Failed to generate confidence score", await res.text())
        return
      }

      const data = await res.json()
      if (data?.score !== undefined && data?.reasons) {
        setScore(data.score)
        setReasons(data.reasons)
      }
    } catch (error) {
      console.error("Error calling generate-confidence-score", error)
    } finally {
      setIsGenerating(false)
    }
  }

  function getConfidenceBand(score: number) {
    if (score >= 80) return { label: "High", color: "text-green-700 bg-green-50" }
    if (score >= 55) return { label: "Moderate", color: "text-amber-700 bg-amber-50" }
    return { label: "Low", color: "text-red-700 bg-red-50" }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Planning Confidence Score
        </p>
        <button
          type="button"
          onClick={handleGenerateConfidenceScore}
          disabled={isGenerating}
          className="inline-flex items-center rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {isGenerating ? "Generating..." : "Generate Score"}
        </button>
      </div>

      {score !== null && (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900">{score}%</span>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                getConfidenceBand(score).color
              }`}
            >
              {getConfidenceBand(score).label} confidence
            </span>
          </div>

          <ul className="space-y-2">
            {reasons.map((reason, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-zinc-700">
                <span className="text-zinc-400">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-zinc-500 italic">
            Confidence reflects planning policy alignment, access constraints, and known objections
            from similar schemes.
          </p>
        </div>
      )}

      {score === null && !isGenerating && (
        <p className="text-sm text-zinc-500">
          Click 'Generate Score' to calculate planning confidence based on site analysis.
        </p>
      )}
    </section>
  )
}
