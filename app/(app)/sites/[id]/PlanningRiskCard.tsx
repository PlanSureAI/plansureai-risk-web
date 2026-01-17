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
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

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
    setLastRefreshed(new Date());
  }

  async function generateRiskScore() {
    setLoading(true);
    setToast(null);

    try {
      const res = await fetch(`/api/sites/${siteId}/risk-score`, { method: "POST" });

      if (res.ok) {
        const data = (await res.json()) as RiskScore;
        setRiskScore(data);
        setLastRefreshed(new Date());

        // Show success toast
        setToast({
          message: "Risk analysis updated successfully",
          type: "success",
        });

        // Auto-hide toast after 3 seconds
        setTimeout(() => setToast(null), 3000);
      } else {
        throw new Error(`Failed to generate risk score: ${res.status}`);
      }
    } catch (error) {
      console.error("Error generating risk score:", error);

      // Show error toast
      setToast({
        message: "Failed to update risk analysis",
        type: "error",
      });

      // Auto-hide toast after 5 seconds
      setTimeout(() => setToast(null), 5000);
    } finally {
      setLoading(false);
    }
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

  // Skeleton loader component
  if (!riskScore && loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="animate-pulse">
          <div className="flex gap-4">
            <div className="h-24 w-24 rounded-lg bg-zinc-200"></div>
            <div className="flex-1 space-y-3">
              <div className="h-5 w-2/3 rounded bg-zinc-200"></div>
              <div className="h-4 w-full rounded bg-zinc-200"></div>
              <div className="h-3 w-1/3 rounded bg-zinc-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
    <>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 shadow-lg ${
            toast.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

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
            <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
              <span>Last updated: {formatDate(riskScore.calculatedAt)}</span>
              {lastRefreshed && (
                <span className="flex items-center gap-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Refreshed {formatDate(lastRefreshed.toISOString())}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={generateRiskScore}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:text-zinc-400"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className="h-3 w-3 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>

        {riskScore?.topRisks?.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-zinc-900">Key Risk Factors</h4>
            <ul className="mt-3 space-y-3">
            {riskScore.topRisks.map((risk) => (
              <li key={risk.id} className="flex gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                {severityDot(risk.severity)}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <strong className="text-sm font-semibold text-zinc-900">{risk.title}</strong>
                    <span className="text-xs text-zinc-500">-{risk.impact} pts</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-600">{risk.description}</p>
                  {risk.mitigation ? (
                    <p className="mt-2 text-xs text-blue-600">{risk.mitigation}</p>
                  ) : null}
                  {risk.policy ? (
                    <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-2">
                      <p className="text-xs font-semibold text-blue-900">
                        📋 {risk.policy.plan} {risk.policy.number}
                      </p>
                      <p className="mt-1 text-xs text-blue-700">{risk.policy.text}</p>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

        {riskScore?.positiveFactors?.length > 0 && (
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
              className="h-2 rounded-full bg-blue-600 transition-all duration-500"
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

    </>
  );
}

// Placeholder components - replace with your actual implementations if they exist
function FullRiskAnalysisModal({
  riskScore,
  onClose,
}: {
  riskScore: RiskScore;
  onClose: () => void;
}) {
  return null;
}

function MitigationPlanModal({ onClose }: { onClose: () => void }) {
  return null;
}
