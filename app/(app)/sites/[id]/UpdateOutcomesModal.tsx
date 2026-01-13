"use client";

import { useEffect, useState } from "react";
import type {
  FundingOutcome,
  OutcomesBundle,
  PerformanceOutcome,
  PlanningOutcome,
} from "./outcomesTypes";

type Props = {
  siteId: string;
  initialPlanning?: PlanningOutcome | null;
  initialFunding?: FundingOutcome | null;
  initialPerformance?: PerformanceOutcome | null;
  onSaved?: (next: OutcomesBundle) => void;
};

type PlanningForm = {
  planning_ref: string;
  decision: string;
  decision_date: string;
  authority_name: string;
  notes: string;
};

type FundingForm = {
  lender_name: string;
  decision: string;
  ltc_percent: string;
  gdv_ltv_percent: string;
  interest_rate_percent: string;
  approved_loan_amount: string;
  decision_date: string;
  notes: string;
};

type PerformanceForm = {
  status: string;
  actual_gdv: string;
  actual_build_cost: string;
  build_start_date: string;
  build_completion_date: string;
  sale_completion_date: string;
  notes: string;
};

const PLANNING_DECISIONS = [
  { value: "", label: "Not set" },
  { value: "approved", label: "Approved" },
  { value: "refused", label: "Refused" },
  { value: "pending", label: "Pending" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "appeal", label: "Appeal" },
];

const FUNDING_DECISIONS = [
  { value: "", label: "Not set" },
  { value: "approved", label: "Approved" },
  { value: "refused", label: "Refused" },
  { value: "declined", label: "Declined" },
  { value: "terms_changed", label: "Terms changed" },
];

const PERFORMANCE_STATUSES = [
  { value: "", label: "Not set" },
  { value: "not_started", label: "Not started" },
  { value: "on_site", label: "On site" },
  { value: "completed", label: "Completed" },
  { value: "sold", label: "Sold" },
  { value: "held", label: "Held" },
];

const emptyToNull = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const toNullableNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
};

const toFormValue = (value: string | number | null | undefined) =>
  value == null ? "" : String(value);

const buildPlanningForm = (data?: PlanningOutcome | null): PlanningForm => ({
  planning_ref: toFormValue(data?.planning_ref),
  decision: toFormValue(data?.decision),
  decision_date: toFormValue(data?.decision_date),
  authority_name: toFormValue(data?.authority_name),
  notes: toFormValue(data?.notes),
});

const buildFundingForm = (data?: FundingOutcome | null): FundingForm => ({
  lender_name: toFormValue(data?.lender_name),
  decision: toFormValue(data?.decision),
  ltc_percent: toFormValue(data?.ltc_percent),
  gdv_ltv_percent: toFormValue(data?.gdv_ltv_percent),
  interest_rate_percent: toFormValue(data?.interest_rate_percent),
  approved_loan_amount: toFormValue(data?.approved_loan_amount),
  decision_date: toFormValue(data?.decision_date),
  notes: toFormValue(data?.notes),
});

const buildPerformanceForm = (data?: PerformanceOutcome | null): PerformanceForm => ({
  status: toFormValue(data?.status),
  actual_gdv: toFormValue(data?.actual_gdv),
  actual_build_cost: toFormValue(data?.actual_build_cost),
  build_start_date: toFormValue(data?.build_start_date),
  build_completion_date: toFormValue(data?.build_completion_date),
  sale_completion_date: toFormValue(data?.sale_completion_date),
  notes: toFormValue(data?.notes),
});

export function UpdateOutcomesModal({
  siteId,
  initialPlanning,
  initialFunding,
  initialPerformance,
  onSaved,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [planningForm, setPlanningForm] = useState<PlanningForm>(() =>
    buildPlanningForm(initialPlanning)
  );
  const [fundingForm, setFundingForm] = useState<FundingForm>(() =>
    buildFundingForm(initialFunding)
  );
  const [performanceForm, setPerformanceForm] = useState<PerformanceForm>(() =>
    buildPerformanceForm(initialPerformance)
  );

  const loadOutcomes = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const response = await fetch(`/api/sites/${siteId}/outcomes`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to load outcomes.");
      }
      const data = (await response.json()) as {
        planning: PlanningOutcome | null;
        funding: FundingOutcome | null;
        performance: PerformanceOutcome | null;
      };
      setPlanningForm(buildPlanningForm(data.planning));
      setFundingForm(buildFundingForm(data.funding));
      setPerformanceForm(buildPerformanceForm(data.performance));
    } catch (error) {
      setStatusMessage("Could not load outcomes. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setStatusMessage(null);
  };

  useEffect(() => {
    if (isOpen) {
      void loadOutcomes();
    }
  }, [isOpen]);

  const saveOutcomes = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    const payload = {
      planning: {
        scheme_id: siteId,
        planning_ref: emptyToNull(planningForm.planning_ref),
        decision: emptyToNull(planningForm.decision),
        decision_date: emptyToNull(planningForm.decision_date),
        authority_name: emptyToNull(planningForm.authority_name),
        notes: emptyToNull(planningForm.notes),
      },
      funding: {
        scheme_id: siteId,
        lender_name: emptyToNull(fundingForm.lender_name),
        decision: emptyToNull(fundingForm.decision),
        ltc_percent: toNullableNumber(fundingForm.ltc_percent),
        gdv_ltv_percent: toNullableNumber(fundingForm.gdv_ltv_percent),
        interest_rate_percent: toNullableNumber(fundingForm.interest_rate_percent),
        approved_loan_amount: toNullableNumber(fundingForm.approved_loan_amount),
        decision_date: emptyToNull(fundingForm.decision_date),
        notes: emptyToNull(fundingForm.notes),
      },
      performance: {
        scheme_id: siteId,
        status: emptyToNull(performanceForm.status),
        actual_gdv: toNullableNumber(performanceForm.actual_gdv),
        actual_build_cost: toNullableNumber(performanceForm.actual_build_cost),
        build_start_date: emptyToNull(performanceForm.build_start_date),
        build_completion_date: emptyToNull(performanceForm.build_completion_date),
        sale_completion_date: emptyToNull(performanceForm.sale_completion_date),
        notes: emptyToNull(performanceForm.notes),
      },
    };

    try {
      const response = await fetch(`/api/sites/${siteId}/outcomes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to save outcomes.");
      }
      const updated = (await response.json()) as OutcomesBundle | null;
      if (updated && onSaved) {
        onSaved(updated);
      }
      setStatusMessage("Outcomes saved.");
    } catch (error) {
      setStatusMessage("Failed to save outcomes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Outcomes
          </p>
          <h2 className="mt-1 text-sm font-semibold text-zinc-900">
            Record planning, funding, and delivery results
          </h2>
        </div>
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
        >
          Update outcomes
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-3xl rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Update outcomes
                </p>
                <h3 className="text-lg font-semibold text-zinc-900">
                  Capture scheme results
                </h3>
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-zinc-500 hover:text-zinc-800"
                onClick={handleClose}
              >
                Close
              </button>
            </div>

            {isLoading && (
              <p className="mt-4 text-sm text-zinc-500">Loading outcomes…</p>
            )}

            {!isLoading && (
              <div className="mt-4 space-y-4">
                <details open className="rounded-lg border border-zinc-200 px-4 py-3">
                  <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
                    Planning outcome
                  </summary>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="text-xs font-medium text-zinc-600">
                      Decision
                      <select
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                        value={planningForm.decision}
                        onChange={(event) =>
                          setPlanningForm((prev) => ({
                            ...prev,
                            decision: event.target.value,
                          }))
                        }
                      >
                        {PLANNING_DECISIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs font-medium text-zinc-600">
                      Decision date
                      <input
                        type="date"
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                        value={planningForm.decision_date}
                        onChange={(event) =>
                          setPlanningForm((prev) => ({
                            ...prev,
                            decision_date: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="text-xs font-medium text-zinc-600">
                      Planning reference
                      <input
                        type="text"
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                        value={planningForm.planning_ref}
                        onChange={(event) =>
                          setPlanningForm((prev) => ({
                            ...prev,
                            planning_ref: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="text-xs font-medium text-zinc-600">
                      Authority name
                      <input
                        type="text"
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                        value={planningForm.authority_name}
                        onChange={(event) =>
                          setPlanningForm((prev) => ({
                            ...prev,
                            authority_name: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="text-xs font-medium text-zinc-600 md:col-span-2">
                      Notes
                      <textarea
                        className="mt-1 min-h-[90px] w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                        value={planningForm.notes}
                        onChange={(event) =>
                          setPlanningForm((prev) => ({
                            ...prev,
                            notes: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                </details>

                <details className="rounded-lg border border-zinc-200 px-4 py-3">
                  <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
                    Funding outcome
                  </summary>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="text-xs font-medium text-zinc-600">
                      Lender name
                      <input
                        type="text"
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                        value={fundingForm.lender_name}
                        onChange={(event) =>
                          setFundingForm((prev) => ({
                            ...prev,
                            lender_name: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="text-xs font-medium text-zinc-600">
                      Decision
                      <select
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                        value={fundingForm.decision}
                        onChange={(event) =>
                          setFundingForm((prev) => ({
                            ...prev,
                            decision: event.target.value,
                          }))
                        }
                      >
                        {FUNDING_DECISIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs font-medium text-zinc-600">
                      LTC %
                      <input
                        type="number"
                        step="0.01"
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                        value={fundingForm.ltc_percent}
                        onChange={(event) =>
                          setFundingForm((prev) => ({
                            ...prev,
                            ltc_percent: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="text-xs font-medium text-zinc-600">
                      LTV on GDV %
                      <input
                        type="number"
                        step="0.01"
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                        value={fundingForm.gdv_ltv_percent}
                        onChange={(event) =>
                          setFundingForm((prev) => ({
                            ...prev,
                            gdv_ltv_percent: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="text-xs font-medium text-zinc-600">
                      Interest %
                      <input
                        type="number"
                        step="0.01"
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                        value={fundingForm.interest_rate_percent}
                        onChange={(event) =>
                          setFundingForm((prev) => ({
                            ...prev,
                            interest_rate_percent: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="text-xs font-medium text-zinc-600">
                      Approved loan amount
                      <input
                        type="number"
                        step="0.01"
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                        value={fundingForm.approved_loan_amount}
                        onChange={(event) =>
                          setFundingForm((prev) => ({
                            ...prev,
                            approved_loan_amount: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="text-xs font-medium text-zinc-600">
                      Decision date
                      <input
                        type="date"
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                        value={fundingForm.decision_date}
                        onChange={(event) =>
                          setFundingForm((prev) => ({
                            ...prev,
                            decision_date: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="text-xs font-medium text-zinc-600 md:col-span-2">
                      Notes
                      <textarea
                        className="mt-1 min-h-[90px] w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                        value={fundingForm.notes}
                        onChange={(event) =>
                          setFundingForm((prev) => ({
                            ...prev,
                            notes: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                </details>

                <details className="rounded-lg border border-zinc-200 px-4 py-3">
                  <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
                    Performance outcome
                  </summary>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="text-xs font-medium text-zinc-600">
                      Status
                      <select
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                        value={performanceForm.status}
                        onChange={(event) =>
                          setPerformanceForm((prev) => ({
                            ...prev,
                            status: event.target.value,
                          }))
                        }
                      >
                        {PERFORMANCE_STATUSES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs font-medium text-zinc-600">
                      Actual GDV
                      <input
                        type="number"
                        step="0.01"
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                        value={performanceForm.actual_gdv}
                        onChange={(event) =>
                          setPerformanceForm((prev) => ({
                            ...prev,
                            actual_gdv: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="text-xs font-medium text-zinc-600">
                      Actual build cost
                      <input
                        type="number"
                        step="0.01"
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                        value={performanceForm.actual_build_cost}
                        onChange={(event) =>
                          setPerformanceForm((prev) => ({
                            ...prev,
                            actual_build_cost: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="text-xs font-medium text-zinc-600">
                      Build start date
                      <input
                        type="date"
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                        value={performanceForm.build_start_date}
                        onChange={(event) =>
                          setPerformanceForm((prev) => ({
                            ...prev,
                            build_start_date: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="text-xs font-medium text-zinc-600">
                      Build completion date
                      <input
                        type="date"
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                        value={performanceForm.build_completion_date}
                        onChange={(event) =>
                          setPerformanceForm((prev) => ({
                            ...prev,
                            build_completion_date: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="text-xs font-medium text-zinc-600">
                      Sale completion date
                      <input
                        type="date"
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                        value={performanceForm.sale_completion_date}
                        onChange={(event) =>
                          setPerformanceForm((prev) => ({
                            ...prev,
                            sale_completion_date: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="text-xs font-medium text-zinc-600 md:col-span-2">
                      Notes
                      <textarea
                        className="mt-1 min-h-[90px] w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
                        value={performanceForm.notes}
                        onChange={(event) =>
                          setPerformanceForm((prev) => ({
                            ...prev,
                            notes: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                </details>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={isSaving}
                onClick={saveOutcomes}
                className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save outcomes"}
              </button>
              {statusMessage && (
                <p className="text-xs text-zinc-600">{statusMessage}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
