"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabaseBrowser";
import Link from "next/link";

const accessRightsOptions = ["FULL", "UNCLEAR", "NONE"] as const;
const contaminationRiskOptions = ["LOW", "UNKNOWN", "HIGH"] as const;
const floodZoneOptions = ["ZONE_1", "ZONE_2", "ZONE_3", "UNKNOWN"] as const;
const groundConditionsOptions = ["GOOD", "UNKNOWN", "POOR"] as const;
const drawingsSetOptions = ["FULL", "PARTIAL", "NONE"] as const;

export default function FinanceClient({ siteId }: { siteId?: string }) {
  const params = useParams();
  const resolvedSiteId =
    siteId ?? (Array.isArray(params?.id) ? params?.id[0] : params?.id);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [formData, setFormData] = useState({
    site: { address: "", postcode: "", local_authority: "" },
    planning: { status: "PENDING", reference: "", refused: false },
    land: {
      ownership_confirmed: false,
      access_rights: "UNCLEAR",
      contamination_risk: "UNKNOWN",
      flood_zone: "UNKNOWN",
      ground_conditions: "UNKNOWN",
    },
    technical: {
      cost_plan_exists: false,
      cost_plan_professional: null as boolean | null,
      drawings_set: "PARTIAL",
      spec_document: false,
    },
    financial: {
      budget_total: 0,
      equity_available: 0,
      income_verified: false,
    },
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSiteData() {
      if (!resolvedSiteId) return;

      const { data: site } = await supabase
        .from("sites")
        .select("address, postcode, local_planning_authority")
        .eq("id", resolvedSiteId)
        .single();

      if (site) {
        setFormData((prev) => ({
          ...prev,
          site: {
            address: site.address || "",
            postcode: site.postcode || "",
            local_authority: site.local_planning_authority || "",
          },
        }));
      }
    }
    loadSiteData();
  }, [resolvedSiteId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    const payload = {
      ...formData,
      planning: {
        ...formData.planning,
        reference: formData.planning.reference.trim() || null,
      },
      technical: {
        ...formData.technical,
        cost_plan_professional: formData.technical.cost_plan_exists
          ? formData.technical.cost_plan_professional
          : null,
      },
    };

    try {
      const res = await fetch(
        "https://empowering-cooperation-production.up.railway.app/api/evaluate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error?.message || data.message || "Evaluation failed");
      } else {
        setResponse(data);
      }
    } catch (err) {
      setError("Failed to connect to evaluation service");
    } finally {
      setLoading(false);
    }
  };

  if (response) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href={`/sites/${resolvedSiteId ?? ""}`}
          className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block"
        >
          ← Back to Site
        </Link>

        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
            <div className="text-6xl mb-4">
              {response.verdict === "PASS"
                ? "✅"
                : response.verdict === "FATAL"
                ? "❌"
                : response.verdict === "GATING"
                ? "🚧"
                : "⚠️"}
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">
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

          {response.blocking_items?.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="font-semibold text-zinc-900 mb-4">
                What You Need to Fix:
              </h3>
              <div className="space-y-4">
                {response.blocking_items.map((item: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-zinc-900">{item.issue}</h4>
                      <span className="text-xs font-semibold text-zinc-500 uppercase">
                        {item.severity}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 mb-2">
                      {item.action_required}
                    </p>
                    {(item.estimated_time || item.estimated_cost) && (
                      <div className="flex gap-4 text-xs text-zinc-500">
                        {item.estimated_time && (
                          <span>⏱️ {item.estimated_time}</span>
                        )}
                        {item.estimated_cost && (
                          <span>💰 {item.estimated_cost}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => setResponse(null)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Run Another Assessment
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-zinc-200 text-zinc-900 rounded-lg hover:bg-zinc-300 font-semibold"
            >
              Print Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href={`/sites/${resolvedSiteId ?? ""}`}
        className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block"
      >
        ← Back to Site
      </Link>

      <h1 className="text-3xl font-bold mb-6">Finance Readiness Assessment</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Site Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Address *</label>
              <input
                type="text"
                required
                value={formData.site.address}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    site: { ...prev.site, address: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Postcode *</label>
              <input
                type="text"
                required
                value={formData.site.postcode}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    site: { ...prev.site, postcode: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Local Authority *</label>
              <input
                type="text"
                required
                value={formData.site.local_authority}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    site: { ...prev.site, local_authority: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Planning</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status *</label>
              <select
                value={formData.planning.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    planning: { ...prev.planning, status: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="GRANTED">Granted</option>
                <option value="PENDING">Pending</option>
                <option value="NOT_APPLIED">Not Applied</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reference</label>
              <input
                type="text"
                value={formData.planning.reference}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    planning: { ...prev.planning, reference: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Refused</label>
              <select
                value={formData.planning.refused ? "yes" : "no"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    planning: {
                      ...prev.planning,
                      refused: e.target.value === "yes",
                    },
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Land</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Ownership confirmed
              </label>
              <select
                value={formData.land.ownership_confirmed ? "yes" : "no"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    land: {
                      ...prev.land,
                      ownership_confirmed: e.target.value === "yes",
                    },
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Access rights</label>
              <select
                value={formData.land.access_rights}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    land: { ...prev.land, access_rights: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                {accessRightsOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Contamination risk
              </label>
              <select
                value={formData.land.contamination_risk}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    land: {
                      ...prev.land,
                      contamination_risk: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                {contaminationRiskOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Flood zone</label>
              <select
                value={formData.land.flood_zone}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    land: { ...prev.land, flood_zone: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                {floodZoneOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Ground conditions
              </label>
              <select
                value={formData.land.ground_conditions}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    land: { ...prev.land, ground_conditions: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                {groundConditionsOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Technical</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Cost plan exists
              </label>
              <select
                value={formData.technical.cost_plan_exists ? "yes" : "no"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    technical: {
                      ...prev.technical,
                      cost_plan_exists: e.target.value === "yes",
                    },
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Cost plan professional
              </label>
              <select
                value={
                  formData.technical.cost_plan_professional === null
                    ? "unknown"
                    : formData.technical.cost_plan_professional
                    ? "yes"
                    : "no"
                }
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    technical: {
                      ...prev.technical,
                      cost_plan_professional:
                        e.target.value === "unknown"
                          ? null
                          : e.target.value === "yes",
                    },
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
                disabled={!formData.technical.cost_plan_exists}
              >
                <option value="unknown">Unknown</option>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Drawings set</label>
              <select
                value={formData.technical.drawings_set}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    technical: { ...prev.technical, drawings_set: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                {drawingsSetOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Spec document</label>
              <select
                value={formData.technical.spec_document ? "yes" : "no"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    technical: {
                      ...prev.technical,
                      spec_document: e.target.value === "yes",
                    },
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Financial</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Total Budget *</label>
              <input
                type="number"
                required
                value={formData.financial.budget_total}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    financial: {
                      ...prev.financial,
                      budget_total: Number(e.target.value),
                    },
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Equity Available *
              </label>
              <input
                type="number"
                required
                value={formData.financial.equity_available}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    financial: {
                      ...prev.financial,
                      equity_available: Number(e.target.value),
                    },
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.financial.income_verified}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    financial: {
                      ...prev.financial,
                      income_verified: e.target.checked,
                    },
                  }))
                }
              />
              <label className="text-sm">Income Verified</label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
        >
          {loading ? "Evaluating..." : "Get Finance Readiness Assessment"}
        </button>
      </form>
    </div>
  );
}
