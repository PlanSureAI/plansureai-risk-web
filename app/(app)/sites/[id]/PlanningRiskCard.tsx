"use client";

import { useEffect, useState } from "react";
import type { RiskScore } from "@/app/lib/planningRiskScoring";

type Props = {
  siteId: string;
};

function riskLevelClasses(level: RiskScore["level"]) {
  switch (level) {
    case "low":
      return "border-emerald-300 bg-emerald-50 text-emerald-800";
    case "medium":
      return "border-amber-300 bg-amber-50 text-amber-800";
    case "high":
      return "border-orange-300 bg-orange-50 text-orange-800";
    case "critical":
      return "border-rose-300 bg-rose-50 text-rose-800";
    default:
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
  }
}

function severityDot(severity: string) {
  const color =
    severity === "critical"
      ? "bg-rose-500"
      : severity === "high"
        ? "bg-orange-400"
        : severity === "medium"
          ? "bg-amber-400"
          : "bg-emerald-500";
  return <span className={`mt-1 h-2 w-2 rounded-full ${color}`} />;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function PlanningRiskCard({ siteId }: Props) {
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [showMitigation, setShowMitigation] = useState(false);
  const [shouldAutoGenerate, setShouldAutoGenerate] = useState(false);
  const [autoTriggered, setAutoTriggered] = useState(false);

  useEffect(() => {
    void loadRiskScore();
  }, [siteId]);

  async function loadRiskScore() {
    const res = await fetch(`/api/sites/${siteId}/risk-score`);
    if (!res.ok) {
      if (res.status === 404) {
        setShouldAutoGenerate(true);
      }
      return;
    }
    const data = (await res.json()) as RiskScore & { calculated?: boolean };
    if (data.calculated === false) {
      setShouldAutoGenerate(true);
      return;
    }
    const { calculated: _calculated, ...risk } = data;
    setRiskScore(risk);
  }

  async function generateRiskScore() {
    setLoading(true);
    const res = await fetch(`/api/sites/${siteId}/risk-score`, { method: "POST" });
    if (res.ok) {
      const data = (await res.json()) as RiskScore;
      setRiskScore(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!riskScore) return;
    const calculatedAt = new Date(riskScore.calculatedAt).getTime();
    if (!Number.isFinite(calculatedAt)) return;
    const ageMs = Date.now() - calculatedAt;
    if (ageMs > 7 * 24 * 60 * 60 * 1000) {
      setShouldAutoGenerate(true);
    }
  }, [riskScore]);

  useEffect(() => {
    if (!shouldAutoGenerate || loading || autoTriggered) return;
    setAutoTriggered(true);
    void generateRiskScore().finally(() => {
      setShouldAutoGenerate(false);
    });
  }, [shouldAutoGenerate, loading, autoTriggered]);

  if (!riskScore) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-zinc-900">Planning Risk Assessment</h3>
        <p className="mt-1 text-sm text-zinc-600">
          Analyze constraints, policies, and recent approvals to assess development viability.
        </p>
        <button
          type="button"
          onClick={generateRiskScore}
          disabled={loading}
          className="mt-4 inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {loading ? "Analyzing..." : "Generate Risk Score"}
        </button>
      </div>
    );
  }

  const confidenceValue = Number.isFinite(riskScore.confidence)
    ? Math.max(0, Math.min(100, riskScore.confidence))
    : 0;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start gap-4">
        <div
          className={`flex h-24 w-24 flex-col items-center justify-center rounded-lg border-2 ${riskLevelClasses(
            riskScore.level
          )}`}
        >
          <div className="text-3xl font-bold">{riskScore.score}</div>
          <div className="text-[10px] font-semibold uppercase">{riskScore.level}</div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-zinc-900">Planning Risk Assessment</h3>
          <p className="mt-1 text-sm text-zinc-600">{riskScore.tagline}</p>
          <p className="mt-2 text-xs text-zinc-500">
            Last updated: {formatDate(riskScore.calculatedAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={generateRiskScore}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:text-zinc-400"
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {riskScore.topRisks.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-zinc-900">Key Risk Factors</h4>
          <ul className="mt-3 space-y-3">
            {riskScore.topRisks.map((risk) => (
              <li key={risk.id} className="flex gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                {severityDot(risk.severity)}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <strong className="text-sm font-semibold text-zinc-900">{risk.title}</strong>
                    <span className="text-xs text-zinc-500">{risk.impact} pts</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-600">{risk.description}</p>
                  {risk.mitigation ? (
                    <p className="mt-2 text-xs text-blue-600">{risk.mitigation}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {riskScore.positiveFactors.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-zinc-900">Positive Signals</h4>
          <ul className="mt-3 space-y-2">
            {riskScore.positiveFactors.map((factor) => (
              <li key={factor.id} className="flex items-start gap-2 text-sm text-zinc-700">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>{factor.title}</span>
                <span className="ml-auto text-xs text-zinc-500">+{factor.impact} pts</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setShowFullAnalysis(true)}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
        >
          View Full Analysis
        </button>
        <button
          type="button"
          onClick={() => setShowMitigation(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Generate Mitigation Plan
        </button>
      </div>

      <div className="mt-6 rounded-lg bg-zinc-50 p-3">
        <div className="flex items-center justify-between text-xs text-zinc-600">
          <span>Analysis Confidence</span>
          <span className="font-semibold">{confidenceValue}%</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-zinc-200">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all"
            style={{ width: `${confidenceValue}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {confidenceValue < 70
            ? "Limited data available. Consider adding policy or history inputs."
            : "High confidence based on comprehensive inputs."}
        </p>
      </div>

      {showFullAnalysis ? (
        <FullRiskAnalysisModal
          riskScore={riskScore}
          onClose={() => setShowFullAnalysis(false)}
        />
      ) : null}
      {showMitigation ? (
        <MitigationPlanModal onClose={() => setShowMitigation(false)} />
      ) : null}
    </div>
  );
}

function FullRiskAnalysisModal({
  riskScore,
  onClose,
}: {
  riskScore: RiskScore;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-zinc-900">Full Risk Analysis</h3>
          <button type="button" onClick={onClose} className="text-sm text-zinc-500">
            Close
          </button>
        </div>
        <p className="mt-2 text-sm text-zinc-600">{riskScore.tagline}</p>
        <div className="mt-4 space-y-3">
          {riskScore.allRisks.length === 0 && (
            <p className="text-sm text-zinc-600">No risks identified from current data.</p>
          )}
          {riskScore.allRisks.map((risk) => (
            <div key={risk.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <div className="flex items-start justify-between text-sm font-semibold text-zinc-900">
                <span>{risk.title}</span>
                <span className="text-xs text-zinc-500">{risk.impact} pts</span>
              </div>
              <p className="mt-1 text-xs text-zinc-600">{risk.description}</p>
              {risk.mitigation ? (
                <p className="mt-2 text-xs text-blue-600">{risk.mitigation}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MitigationPlanModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-zinc-900">Mitigation Plan</h3>
          <button type="button" onClick={onClose} className="text-sm text-zinc-500">
            Close
          </button>
        </div>
        <p className="mt-2 text-sm text-zinc-600">
          Mitigation plans are coming next. We will tailor actions to the risks on this site.
        </p>
        <div className="mt-4 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
          Add planning reports, site access notes, and policy context to improve the plan.
        </div>
      </div>
    </div>
  );
}
