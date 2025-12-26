"use client"

import { useState } from "react"
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowser"

type RiskRationaleSectionProps = {
  siteId: string
  siteName: string | null
  address: string | null
  localPlanningAuthority: string | null
  riskStatus: string | null
  objectionLikelihood: string | null
  keyPlanningConsiderations: string | null
}

export function RiskRationaleSection({
  siteId,
  siteName,
  address,
  localPlanningAuthority,
  riskStatus,
  objectionLikelihood,
  keyPlanningConsiderations,
}: RiskRationaleSectionProps) {
  const [riskRationale, setRiskRationale] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleGenerateRiskRationale() {
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
        risk_status: riskStatus ?? "",
        objection_likelihood: objectionLikelihood ?? "",
        key_planning_considerations: keyPlanningConsiderations ?? "",
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-risk-rationale`,
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
        console.error("Failed to generate risk rationale", await res.text())
        return
      }

      const data = await res.json()
      if (data?.rationale) {
        setRiskRationale(data.rationale)
      }
    } catch (error) {
      console.error("Error calling generate-risk-rationale", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
      <label className="block space-y-1 text-sm text-zinc-800">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Why this isn't Red / What moves it to Green
        </span>
        <textarea
          value={riskRationale}
          onChange={(e) => setRiskRationale(e.target.value)}
          rows={6}
          placeholder="Click 'Generate Risk Rationale' to create an AI explanation..."
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
        />
      </label>

      <button
        type="button"
        onClick={handleGenerateRiskRationale}
        disabled={isGenerating}
        className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {isGenerating ? "Generating..." : "Generate Risk Rationale"}
      </button>
    </section>
  )
}
