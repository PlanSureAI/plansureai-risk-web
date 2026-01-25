"use client";

import { useMemo, useState } from "react";

const API_BASE = "https://empowering-cooperation-production.up.railway.app";

const planningStatusOptions = [
  "GRANTED",
  "PENDING",
  "NOT_APPLIED",
] as const;
const accessRightsOptions = ["FULL", "UNCLEAR", "NONE"] as const;
const contaminationRiskOptions = ["LOW", "UNKNOWN", "HIGH"] as const;
const floodZoneOptions = ["ZONE_1", "ZONE_2", "ZONE_3", "UNKNOWN"] as const;
const groundConditionsOptions = ["GOOD", "UNKNOWN", "POOR"] as const;
const drawingsSetOptions = ["FULL", "PARTIAL", "NONE"] as const;

type SiteData = {
  id: string;
  site_name?: string | null;
  address?: string | null;
  postcode?: string | null;
  local_planning_authority?: string | null;
};

type FinanceClientProps = {
  site: SiteData;
};

export default function FinanceClient({ site }: FinanceClientProps) {
  const [form, setForm] = useState(() => ({
    site: {
      address: site.address ?? "",
      postcode: site.postcode ?? "",
      local_authority: site.local_planning_authority ?? "",
    },
    planning: {
      status: "PENDING" as (typeof planningStatusOptions)[number],
      reference: "",
      refused: false,
    },
    land: {
      ownership_confirmed: false,
      access_rights: "UNCLEAR" as (typeof accessRightsOptions)[number],
      contamination_risk: "UNKNOWN" as (typeof contaminationRiskOptions)[number],
      flood_zone: "UNKNOWN" as (typeof floodZoneOptions)[number],
      ground_conditions: "UNKNOWN" as (typeof groundConditionsOptions)[number],
    },
    technical: {
      cost_plan_exists: false,
      cost_plan_professional: null as boolean | null,
      drawings_set: "PARTIAL" as (typeof drawingsSetOptions)[number],
      spec_document: false,
    },
    financial: {
      budget_total: "" as unknown as number | "",
      equity_available: "" as unknown as number | "",
      income_verified: false,
    },
  }));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any | null>(null);

  const payload = useMemo(() => {
    return {
      ...form,
      planning: {
        ...form.planning,
        reference: form.planning.reference.trim() || null,
      },
      financial: {
        budget_total:
          form.financial.budget_total === ""
            ? 0
            : Number(form.financial.budget_total),
        equity_available:
          form.financial.equity_available === ""
            ? 0
            : Number(form.financial.equity_available),
      },
      technical: {
        ...form.technical,
        cost_plan_professional: form.technical.cost_plan_exists
          ? form.technical.cost_plan_professional
          : null,
      },
    };
  }, [form]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResponse(null);

    try {
      const response = await fetch(`${API_BASE}/api/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          data?.error?.message ||
          "Request failed. Check the console for details.";
        setError(message);
        setResponse(data);
        return;
      }

      setResponse(data);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function setValue(path: string, value: string | number | boolean | null) {
    setForm((prev) => {
      const next = structuredClone(prev) as typeof prev;
      const parts = path.split(".");
      let cursor: any = next;
      for (let i = 0; i < parts.length - 1; i += 1) {
        cursor = cursor[parts[i]];
      }
      cursor[parts[parts.length - 1]] = value as any;
      return next;
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Finance Readiness</h1>
        <p className="text-sm text-muted-foreground">
          Submit a lightweight finance readiness check to the Railway API.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-8">
        <section className="space-y-4 rounded-xl border border-border/60 bg-background p-6">
          <h2 className="text-lg font-semibold">Site</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              Address
              <input
                className="rounded-md border border-border/60 bg-background px-3 py-2"
                value={form.site.address}
                onChange={(event) =>
                  setValue("site.address", event.target.value)
                }
                placeholder="10 High Street"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Postcode
              <input
                className="rounded-md border border-border/60 bg-background px-3 py-2"
                value={form.site.postcode}
                onChange={(event) =>
                  setValue("site.postcode", event.target.value)
                }
                placeholder="SW1A 1AA"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Local authority
              <input
                className="rounded-md border border-border/60 bg-background px-3 py-2"
                value={form.site.local_authority}
                onChange={(event) =>
                  setValue("site.local_authority", event.target.value)
                }
                placeholder="Westminster"
              />
            </label>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border/60 bg-background p-6">
          <h2 className="text-lg font-semibold">Planning</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              Status
              <select
                className="rounded-md border border-border/60 bg-background px-3 py-2"
                value={form.planning.status}
                onChange={(event) =>
                  setValue("planning.status", event.target.value)
                }
              >
                {planningStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Reference (optional)
              <input
                className="rounded-md border border-border/60 bg-background px-3 py-2"
                value={form.planning.reference}
                onChange={(event) =>
                  setValue("planning.reference", event.target.value)
                }
                placeholder="21/00001/FUL"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Refused
              <select
                className="rounded-md border border-border/60 bg-background px-3 py-2"
                value={form.planning.refused ? "yes" : "no"}
                onChange={(event) =>
                  setValue("planning.refused", event.target.value === "yes")
                }
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </label>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border/60 bg-background p-6">
          <h2 className="text-lg font-semibold">Land</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              Ownership confirmed
              <select
                className="rounded-md border border-border/60 bg-background px-3 py-2"
                value={form.land.ownership_confirmed ? "yes" : "no"}
                onChange={(event) =>
                  setValue(
                    "land.ownership_confirmed",
                    event.target.value === "yes"
                  )
                }
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Access rights
              <select
                className="rounded-md border border-border/60 bg-background px-3 py-2"
                value={form.land.access_rights}
                onChange={(event) =>
                  setValue("land.access_rights", event.target.value)
                }
              >
                {accessRightsOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Contamination risk
              <select
                className="rounded-md border border-border/60 bg-background px-3 py-2"
                value={form.land.contamination_risk}
                onChange={(event) =>
                  setValue("land.contamination_risk", event.target.value)
                }
              >
                {contaminationRiskOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Flood zone
              <select
                className="rounded-md border border-border/60 bg-background px-3 py-2"
                value={form.land.flood_zone}
                onChange={(event) =>
                  setValue("land.flood_zone", event.target.value)
                }
              >
                {floodZoneOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Ground conditions
              <select
                className="rounded-md border border-border/60 bg-background px-3 py-2"
                value={form.land.ground_conditions}
                onChange={(event) =>
                  setValue("land.ground_conditions", event.target.value)
                }
              >
                {groundConditionsOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border/60 bg-background p-6">
          <h2 className="text-lg font-semibold">Technical</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              Cost plan exists
              <select
                className="rounded-md border border-border/60 bg-background px-3 py-2"
                value={form.technical.cost_plan_exists ? "yes" : "no"}
                onChange={(event) =>
                  setValue(
                    "technical.cost_plan_exists",
                    event.target.value === "yes"
                  )
                }
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Cost plan professional
              <select
                className="rounded-md border border-border/60 bg-background px-3 py-2"
                value={
                  form.technical.cost_plan_professional === null
                    ? "unknown"
                    : form.technical.cost_plan_professional
                    ? "yes"
                    : "no"
                }
                onChange={(event) => {
                  const value = event.target.value;
                  setValue(
                    "technical.cost_plan_professional",
                    value === "unknown" ? null : value === "yes"
                  );
                }}
                disabled={!form.technical.cost_plan_exists}
              >
                <option value="unknown">Unknown</option>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Drawings set
              <select
                className="rounded-md border border-border/60 bg-background px-3 py-2"
                value={form.technical.drawings_set}
                onChange={(event) =>
                  setValue("technical.drawings_set", event.target.value)
                }
              >
                {drawingsSetOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Spec document
              <select
                className="rounded-md border border-border/60 bg-background px-3 py-2"
                value={form.technical.spec_document ? "yes" : "no"}
                onChange={(event) =>
                  setValue(
                    "technical.spec_document",
                    event.target.value === "yes"
                  )
                }
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </label>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border/60 bg-background p-6">
          <h2 className="text-lg font-semibold">Financial</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              Budget total
              <input
                type="number"
                className="rounded-md border border-border/60 bg-background px-3 py-2"
                value={form.financial.budget_total}
                onChange={(event) =>
                  setValue("financial.budget_total", event.target.value)
                }
                placeholder="500000"
                min={0}
                step="1000"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Equity available
              <input
                type="number"
                className="rounded-md border border-border/60 bg-background px-3 py-2"
                value={form.financial.equity_available}
                onChange={(event) =>
                  setValue("financial.equity_available", event.target.value)
                }
                placeholder="125000"
                min={0}
                step="1000"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Income verified
              <select
                className="rounded-md border border-border/60 bg-background px-3 py-2"
                value={form.financial.income_verified ? "yes" : "no"}
                onChange={(event) =>
                  setValue(
                    "financial.income_verified",
                    event.target.value === "yes"
                  )
                }
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </label>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Run finance readiness"}
          </button>
          {error ? (
            <span className="text-sm text-destructive">{error}</span>
          ) : null}
        </div>
      </form>

      <section className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-6">
        <h2 className="text-lg font-semibold">Results</h2>
        {!response ? (
          <p className="text-sm text-muted-foreground">
            Submit the form to see the Railway evaluation response.
          </p>
        ) : null}

        {response ? (
          <div className="mt-4 space-y-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
              <div className="mb-4 text-6xl">
                {response.verdict === "PASS"
                  ? "✅"
                  : response.verdict === "FATAL"
                  ? "❌"
                  : response.verdict === "GATING"
                  ? "🚧"
                  : "⚠️"}
              </div>
              <h2 className="mb-2 text-2xl font-bold text-zinc-900">
                {response.verdict === "PASS"
                  ? "Finance-Ready!"
                  : response.verdict === "FATAL"
                  ? "Not Fundable"
                  : response.verdict === "GATING"
                  ? "Critical Items Blocking"
                  : "Fixable Issues"}
              </h2>
              <p className="text-zinc-600">{response.summary}</p>
              <div className="mt-4">
                <span className="text-sm font-medium text-zinc-500">
                  {response.confidence}% Confidence ({response.confidence_level})
                </span>
              </div>
            </div>

            {response.blocking_items?.length > 0 ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="mb-4 font-semibold text-zinc-900">
                  What You Need to Fix:
                </h3>
                <div className="space-y-4">
                  {response.blocking_items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="border-l-4 border-blue-500 py-2 pl-4"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <h4 className="font-semibold text-zinc-900">
                          {item.issue}
                        </h4>
                        <span className="text-xs font-semibold uppercase text-zinc-500">
                          {item.severity}
                        </span>
                      </div>
                      <p className="mb-2 text-sm text-zinc-600">
                        {item.action_required}
                      </p>
                      {item.estimated_time || item.estimated_cost ? (
                        <div className="flex gap-4 text-xs text-zinc-500">
                          {item.estimated_time ? (
                            <span>⏱️ {item.estimated_time}</span>
                          ) : null}
                          {item.estimated_cost ? (
                            <span>💰 {item.estimated_cost}</span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => setResponse(null)}
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Run Another Assessment
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg bg-zinc-200 px-6 py-3 font-semibold text-zinc-900 hover:bg-zinc-300"
              >
                Print Report
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
