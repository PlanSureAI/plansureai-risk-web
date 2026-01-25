"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabaseBrowser";
import Link from "next/link";

export default function FinanceClient({ siteId }: { siteId: string }) {
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
      cost_plan_professional: false,
      drawings_set: "NONE",
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
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    async function loadSiteData() {
      const { data: site } = await supabase
        .from("sites")
        .select("address, postcode, local_planning_authority")
        .eq("id", siteId)
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
  }, [siteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch(
        "https://empowering-cooperation-production.up.railway.app/api/evaluate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
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
        <Link href={`/sites/${siteId}`} className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block">
          ← Back to Site
        </Link>

        <div className="space-y-6">
          {/* Verdict Header */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
            <div className="text-6xl mb-4">
              {response.verdict === "PASS" ? "✅" :
               response.verdict === "FATAL" ? "❌" :
               response.verdict === "GATING" ? "🚧" : "⚠️"}
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">
              {response.verdict === "PASS" ? "Finance-Ready!" :
               response.verdict === "FATAL" ? "Not Fundable" :
               response.verdict === "GATING" ? "Critical Items Blocking" : "Fixable Issues"}
            </h2>
            <p className="text-zinc-600">{response.summary}</p>
            <div className="mt-4">
              <span className="text-sm font-medium text-zinc-500">
                {response.confidence}% Confidence ({response.confidence_level})
              </span>
            </div>
          </div>

          {/* Blocking Items */}
          {response.blocking_items?.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="font-semibold text-zinc-900 mb-4">What You Need to Fix:</h3>
              <div className="space-y-4">
                {response.blocking_items.map((item: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-zinc-900">{item.issue}</h4>
                      <span className="text-xs font-semibold text-zinc-500 uppercase">
                        {item.severity}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 mb-2">{item.action_required}</p>
                    {(item.estimated_time || item.estimated_cost) && (
                      <div className="flex gap-4 text-xs text-zinc-500">
                        {item.estimated_time && <span>⏱️ {item.estimated_time}</span>}
                        {item.estimated_cost && <span>💰 {item.estimated_cost}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
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
      <Link href={`/sites/${siteId}`} className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block">
        ← Back to Site
      </Link>

      <h1 className="text-3xl font-bold mb-6">Finance Readiness Assessment</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Site Section */}
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

        {/* Planning Section */}
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
          </div>
        </div>

        {/* Financial Section */}
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
                    financial: { ...prev.financial, budget_total: Number(e.target.value) },
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Equity Available *</label>
              <input
                type="number"
                required
                value={formData.financial.equity_available}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    financial: { ...prev.financial, equity_available: Number(e.target.value) },
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
                    financial: { ...prev.financial, income_verified: e.target.checked },
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
