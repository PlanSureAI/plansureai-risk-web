"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/app/lib/supabaseBrowser";

type SiteData = {
  id: string;
  site_name: string | null;
  address: string | null;
  postcode: string | null;
  local_planning_authority: string | null;
  risk_profile: {
    overallRiskScore: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
    summary?: string;
    flags?: { id: string; level: string; title: string; message: string }[];
  } | null;
  ai_outcome: string | null;
  ai_risk_summary: string | null;
  key_planning_considerations: string | null;
  objection_likelihood: string | null;
  planning_confidence_score: number | null;
};

type FinanceAssessment = {
  verdict: "PASS" | "FIXABLE" | "GATING" | "FATAL";
  confidence: number;
  confidence_level?: string | null;
  summary?: string | null;
  blocking_items?: Array<{
    issue: string;
    severity: "GATING" | "FATAL" | "FIXABLE";
    action_required: string;
    estimated_time?: string | null;
    estimated_cost?: string | null;
  }> | null;
  next_steps?: string | null;
  updated_at?: string | null;
};

type AssessmentClientProps = {
  siteId: string;
};

export default function AssessmentClient({ siteId }: AssessmentClientProps) {
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [site, setSite] = useState<SiteData | null>(null);
  const [finance, setFinance] = useState<FinanceAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [form, setForm] = useState({
    planning_status: "PENDING",
    budget_total: "",
    equity_available: "",
    income_verified: false,
  });
  const hasPlanning = Boolean(site?.risk_profile || site?.ai_risk_summary);
  const hasFinance = Boolean(finance);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!siteId) {
        setLoadError("Missing site id.");
        setLoading(false);
        return;
      }
      setLoadError(null);
      setLoading(true);

      const { data: siteData, error: siteError } = await supabase
        .from("sites")
        .select(
          "id, site_name, address, postcode, local_planning_authority, risk_profile, ai_outcome, ai_risk_summary, key_planning_considerations, objection_likelihood, planning_confidence_score"
        )
        .eq("id", siteId)
        .maybeSingle();

      if (!isMounted) return;

      if (siteError || !siteData) {
        setLoadError(siteError?.message || "Site not found.");
        setLoading(false);
        return;
      }

      const { data: financeData } = await supabase
        .from("finance_assessments")
        .select("verdict, confidence, confidence_level, summary, blocking_items, next_steps, updated_at")
        .eq("site_id", siteId)
        .maybeSingle();

      if (!isMounted) return;

      setSite(siteData as SiteData);
      setFinance((financeData as FinanceAssessment) ?? null);
      setLoading(false);
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [siteId, supabase]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-64 rounded bg-zinc-200" />
            <div className="h-4 w-96 rounded bg-zinc-100" />
            <div className="h-32 w-full rounded bg-zinc-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!site || loadError) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {loadError || "Unable to load assessment."}
        </div>
        <Link href="/sites" className="mt-4 inline-flex text-sm text-blue-600 hover:text-blue-800">
          ← Back to Sites
        </Link>
      </div>
    );
  }

  const planningScore = site.risk_profile?.overallRiskScore ?? 0;
  const planningVerdict =
    planningScore < 30
      ? "LENDABLE"
      : planningScore < 60
      ? "NOT_YET"
      : "FATAL";

  const financeVerdict = finance?.verdict ?? null;

  const combinedVerdict = useMemo(() => {
    if (planningVerdict === "FATAL" || financeVerdict === "FATAL") return "FATAL";
    if (planningVerdict === "NOT_YET" || financeVerdict === "GATING" || financeVerdict === "FIXABLE") {
      return "NOT_YET";
    }
    if (!financeVerdict) return "NOT_YET";
    return "LENDABLE";
  }, [planningVerdict, financeVerdict]);

  const combinedConfidence = useMemo(() => {
    const scores = [site.planning_confidence_score, finance?.confidence].filter(
      (value) => typeof value === "number"
    ) as number[];

    if (scores.length === 0) return null;
    const total = scores.reduce((sum, value) => sum + value, 0);
    return Math.round(total / scores.length);
  }, [finance?.confidence, site.planning_confidence_score]);

  const verdictBadge = useMemo(() => {
    if (combinedVerdict === "LENDABLE") {
      return { label: "✅ LENDABLE", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    if (combinedVerdict === "FATAL") {
      return { label: "❌ FATAL", className: "bg-rose-50 text-rose-700 border-rose-200" };
    }
    return { label: "⚠️ NOT YET", className: "bg-amber-50 text-amber-700 border-amber-200" };
  }, [combinedVerdict]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/sites/${site.id}/finance-assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planning_status: form.planning_status,
          budget_total: Number(form.budget_total),
          equity_available: Number(form.equity_available),
          income_verified: form.income_verified,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to run finance assessment");
      }

      router.refresh();
      const { data: financeData } = await supabase
        .from("finance_assessments")
        .select("verdict, confidence, confidence_level, summary, blocking_items, next_steps, updated_at")
        .eq("site_id", site.id)
        .maybeSingle();
      setFinance((financeData as FinanceAssessment) ?? null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to run finance assessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setExportError(null);
    setIsExporting(true);

    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `${site.site_name || "combined-assessment"}-assessment.pdf`
        .toLowerCase()
        .replace(/\s+/g, "-");
      pdf.save(fileName);
    } catch (error) {
      setExportError("Unable to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/sites/${site.id}`} className="text-sm text-blue-600 hover:text-blue-800">
          ← Back to Site
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          {exportError ? <span className="text-xs text-rose-600">{exportError}</span> : null}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          >
            {isExporting ? "Preparing PDF..." : "Download Unified PDF"}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="mb-3 font-semibold text-zinc-900">Assessment Progress:</h3>
        <div className="space-y-2 text-sm text-zinc-700">
          <div className="flex items-center gap-2">
            <span>{hasPlanning ? "✅" : "⏸️"}</span>
            <span>Planning Risk Assessment</span>
            {!hasPlanning ? (
              <Link href={`/sites/${site.id}/risk`} className="ml-auto">
                <span className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                  Run Assessment
                </span>
              </Link>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span>{hasFinance ? "✅" : "⏸️"}</span>
            <span>Finance Readiness Check</span>
            {!hasFinance ? (
              <span className="ml-auto text-xs text-zinc-600">Complete form below</span>
            ) : null}
          </div>
        </div>
      </div>

      <div ref={reportRef} className="mt-6 space-y-8">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                PlanSureAI Combined Assessment
              </p>
              <h1 className="text-3xl font-semibold text-zinc-900">
                {site.site_name || "Untitled Site"}
              </h1>
              <p className="text-sm text-zinc-600">
                {site.address || "No address"}
                {site.postcode ? `, ${site.postcode}` : ""}
              </p>
              <p className="text-xs text-zinc-500">{site.local_planning_authority || ""}</p>
            </div>
            <div
              className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold ${verdictBadge.className}`}
            >
              {verdictBadge.label}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase text-zinc-500">Planning risk score</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">{planningScore}/100</p>
              <p className="mt-1 text-xs text-zinc-500">Verdict: {planningVerdict.replace("_", " ")}</p>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase text-zinc-500">Finance verdict</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {financeVerdict || "Not run"}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {finance?.confidence ? `${finance.confidence}% confidence` : "Run assessment"}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase text-zinc-500">Combined confidence</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {combinedConfidence !== null ? `${combinedConfidence}%` : "—"}
              </p>
              <p className="mt-1 text-xs text-zinc-500">Planning + Finance blend</p>
            </div>
          </div>

          {site.ai_risk_summary ? (
            <p className="mt-6 text-sm text-zinc-600">{site.ai_risk_summary}</p>
          ) : null}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-zinc-900">Planning Risk</h2>
              <p className="mt-2 text-sm text-zinc-600">{site.ai_risk_summary || "No summary available."}</p>
              {site.key_planning_considerations ? (
                <div className="mt-4 rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-600">
                  <strong className="block text-xs uppercase text-zinc-500">Key constraints</strong>
                  <p className="mt-2 whitespace-pre-line">{site.key_planning_considerations}</p>
                </div>
              ) : null}
              {site.objection_likelihood ? (
                <p className="mt-4 text-sm text-zinc-500">
                  Objection likelihood: <span className="font-medium text-zinc-700">{site.objection_likelihood}</span>
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-zinc-900">Finance Readiness</h2>
              {finance ? (
                <>
                  <p className="mt-2 text-sm text-zinc-600">{finance.summary || "No finance summary."}</p>
                  {finance.blocking_items && finance.blocking_items.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {finance.blocking_items.map((item, idx) => (
                        <div key={idx} className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                          <div className="flex items-center justify-between text-sm font-semibold text-zinc-900">
                            <span>{item.issue}</span>
                            <span className="text-xs text-zinc-500">{item.severity}</span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-600">{item.action_required}</p>
                          {item.estimated_time || item.estimated_cost ? (
                            <p className="mt-2 text-xs text-zinc-500">
                              {item.estimated_time ? `⏱️ ${item.estimated_time}` : ""} {" "}
                              {item.estimated_cost ? `💰 ${item.estimated_cost}` : ""}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="mt-2 text-sm text-zinc-600">
                  No finance assessment yet. Complete the form to generate results.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-zinc-900">Action Plan</h2>
              <ol className="mt-4 space-y-3 text-sm text-zinc-600">
                <li>1. Address any high-severity planning constraints.</li>
                <li>2. Resolve finance gating items and confirm equity availability.</li>
                <li>3. Prepare mitigation evidence for lender submission.</li>
              </ol>
              {finance?.next_steps ? (
                <p className="mt-4 text-xs text-zinc-500">Next steps: {finance.next_steps}</p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-zinc-900">Next Steps</h2>
              <ul className="mt-4 space-y-2 text-sm text-zinc-600">
                <li>• Validate planning route and secure pre-app feedback.</li>
                <li>• Compile cost plan and confirm income verification.</li>
                <li>• Re-run finance readiness once updates are complete.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Run Finance Assessment</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Provide the minimum finance inputs to generate an assessment and save it to this site.
          </p>

          {formError ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
              {formError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-4">
            <label className="flex flex-col gap-2 text-sm">
              Planning status
              <select
                className="rounded-md border border-zinc-200 px-3 py-2"
                value={form.planning_status}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, planning_status: event.target.value }))
                }
              >
                <option value="GRANTED">Granted</option>
                <option value="PENDING">Pending</option>
                <option value="NOT_APPLIED">Not applied</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Budget total
              <input
                type="number"
                className="rounded-md border border-zinc-200 px-3 py-2"
                value={form.budget_total}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, budget_total: event.target.value }))
                }
                min={0}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Equity available
              <input
                type="number"
                className="rounded-md border border-zinc-200 px-3 py-2"
                value={form.equity_available}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, equity_available: event.target.value }))
                }
                min={0}
                required
              />
            </label>
            <label className="flex items-center gap-2 text-sm pt-6">
              <input
                type="checkbox"
                checked={form.income_verified}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, income_verified: event.target.checked }))
                }
              />
              Income verified
            </label>
            <div className="md:col-span-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isSubmitting ? "Running..." : "Run Finance Readiness"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
