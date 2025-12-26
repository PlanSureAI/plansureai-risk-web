"use client"

import { useState } from "react"
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowser"

type Killer = {
  risk: string
  impact: string
  mitigation: string
}

type SiteKillersSectionProps = {
  siteId: string
  siteName: string | null
  address: string | null
  localPlanningAuthority: string | null
  aiOutcome: string | null
  aiRiskSummary: string | null
  keyPlanningConsiderations: string | null
  objectionLikelihood: string | null
}

export function SiteKillersSection({
  siteId,
  siteName,
  address,
  localPlanningAuthority,
  aiOutcome,
  aiRiskSummary,
  keyPlanningConsiderations,
  objectionLikelihood,
}: SiteKillersSectionProps) {
  const [killers, setKillers] = useState<Killer[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleGenerateSiteKillers() {
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
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-site-killers`,
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
        console.error("Failed to generate site killers", await res.text())
        return
      }

      const data = await res.json()
      if (data?.killers) {
        setKillers(data.killers)
      }
    } catch (error) {
      console.error("Error calling generate-site-killers", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          What Kills This Site?
        </p>
        <button
          type="button"
          onClick={handleGenerateSiteKillers}
          disabled={isGenerating}
          className="inline-flex items-center rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {isGenerating ? "Analyzing..." : "Analyze Risks"}
        </button>
      </div>

      {killers.length > 0 && (
        <div className="space-y-4">
          {killers.map((killer, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-red-100 bg-red-50 p-3 space-y-2"
            >
              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                  {idx + 1}
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-red-900">{killer.risk}</p>
                  <p className="text-sm text-red-800">
                    <span className="font-medium">Impact:</span> {killer.impact}
                  </p>
                  <p className="text-sm text-red-700">
                    <span className="font-medium">Mitigation:</span> {killer.mitigation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {killers.length === 0 && !isGenerating && (
        <p className="text-sm text-zinc-500">
          Click 'Analyze Risks' to identify the top 3 planning risks that could block consent.
        </p>
      )}
    </section>
  )
}
