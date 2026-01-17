"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Filter,
  Plus,
  Save,
  Search,
  Trash2,
  X,
  Edit2,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/app/lib/supabaseBrowser";

type Policy = {
  id: string;
  local_planning_authority: string;
  policy_number: string;
  policy_title: string;
  policy_text: string;
  policy_type: string;
  constraint_types: string[];
  local_plan_name: string;
  local_plan_year: number | null;
  policy_url: string | null;
};

const POLICY_TYPES = [
  "heritage",
  "design",
  "trees",
  "flooding",
  "parking",
  "neighbors",
  "access",
  "environment",
  "other",
];

const CONSTRAINT_TYPES = [
  "conservation_area",
  "listed_building_nearby",
  "article_4_direction",
  "TPO",
  "ancient_woodland",
  "flood_zone_2",
  "flood_zone_3",
  "AONB",
  "national_park",
  "green_belt",
  "SSSI",
];

const PLAN_NAME_DEFAULT = "Cornwall Local Plan";

export default function PoliciesAdminClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>([]);
  const [councils, setCouncils] = useState<string[]>([]);
  const [selectedCouncil, setSelectedCouncil] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<Partial<Policy>>({
    local_planning_authority: "Cornwall Council",
    policy_number: "",
    policy_title: "",
    policy_text: "",
    policy_type: "heritage",
    constraint_types: [],
    local_plan_name: PLAN_NAME_DEFAULT,
    local_plan_year: 2016,
    policy_url: "",
  });

  useEffect(() => {
    void fetchPolicies();
  }, []);

  useEffect(() => {
    filterPolicies();
  }, [policies, selectedCouncil, searchQuery]);

  async function fetchPolicies() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("local_plan_policies")
        .select("*")
        .order("local_planning_authority")
        .order("policy_number");

      if (error) throw error;

      setPolicies((data ?? []) as Policy[]);
      const uniqueCouncils = [
        ...new Set((data ?? []).map((policy) => policy.local_planning_authority)),
      ];
      setCouncils(uniqueCouncils);
    } catch (error) {
      console.error("Error fetching policies:", error);
      alert("Failed to load policies");
    } finally {
      setLoading(false);
    }
  }

  function filterPolicies() {
    let filtered = policies;

    if (selectedCouncil !== "all") {
      filtered = filtered.filter(
        (policy) => policy.local_planning_authority === selectedCouncil
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (policy) =>
          policy.policy_number.toLowerCase().includes(query) ||
          policy.policy_title.toLowerCase().includes(query) ||
          policy.policy_text.toLowerCase().includes(query)
      );
    }

    setFilteredPolicies(filtered);
  }

  function toggleConstraint(value: string) {
    const current = formData.constraint_types ?? [];
    if (current.includes(value)) {
      setFormData({
        ...formData,
        constraint_types: current.filter((item) => item !== value),
      });
      return;
    }
    setFormData({
      ...formData,
      constraint_types: [...current, value],
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const constraintTypes = formData.constraint_types ?? [];
      if (constraintTypes.length === 0) {
        alert("Please select at least one constraint type");
        return;
      }

      const { data, error } = await supabase
        .from("local_plan_policies")
        .insert([formData])
        .select()
        .single();

      if (error) throw error;

      setPolicies([...policies, data as Policy]);
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding policy:", error);
      alert("Error adding policy");
    }
  }

  async function handleUpdate(id: string, updates: Partial<Policy>) {
    try {
      const { error } = await supabase
        .from("local_plan_policies")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setPolicies(
        policies.map((policy) => (policy.id === id ? { ...policy, ...updates } : policy))
      );
      setEditingId(null);
    } catch (error) {
      console.error("Error updating policy:", error);
      alert("Error updating policy");
    }
  }

  async function handleDelete(id: string, policyNumber: string) {
    if (!confirm(`Are you sure you want to delete ${policyNumber}?`)) return;

    try {
      const { error } = await supabase.from("local_plan_policies").delete().eq("id", id);

      if (error) throw error;

      setPolicies(policies.filter((policy) => policy.id !== id));
    } catch (error) {
      console.error("Error deleting policy:", error);
      alert("Error deleting policy");
    }
  }

  function resetForm() {
    setFormData({
      local_planning_authority:
        selectedCouncil !== "all" ? selectedCouncil : "Cornwall Council",
      policy_number: "",
      policy_title: "",
      policy_text: "",
      policy_type: "heritage",
      constraint_types: [],
      local_plan_name: PLAN_NAME_DEFAULT,
      local_plan_year: 2016,
      policy_url: "",
    });
  }

  function loadTemplate(template: string) {
    const templates: Record<string, Partial<Policy>> = {
      heritage: {
        policy_type: "heritage",
        policy_title: "Historic Environment",
        policy_text:
          "Development affecting heritage assets must sustain and enhance their significance. Heritage impact assessments required for applications affecting listed buildings and conservation areas.",
      },
      design: {
        policy_type: "design",
        policy_title: "Design and Development Quality",
        policy_text:
          "Development must be of high quality design and have regard to local character and setting. Materials, scale, and detailing must be appropriate to the context.",
      },
      trees: {
        policy_type: "trees",
        policy_title: "Trees and Landscaping",
        policy_text:
          "Development must protect existing trees and provide appropriate replacement planting. Tree surveys required where protected trees may be affected.",
      },
      flooding: {
        policy_type: "flooding",
        policy_title: "Flood Risk Management",
        policy_text:
          "Development in flood zones requires flood risk assessments. Sustainable drainage systems (SuDS) required for major developments.",
      },
    };

    if (templates[template]) {
      setFormData({
        ...formData,
        ...templates[template],
      });
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planning Policies</h1>
          <p className="mt-1 text-gray-600">
            Manage local plan policies for risk assessment.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Policy
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex flex-1 items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={selectedCouncil}
            onChange={(e) => setSelectedCouncil(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Councils</option>
            {councils.map((council) => (
              <option key={council} value={council}>
                {council}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-1 items-center gap-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search policies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-6"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Add New Policy</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => loadTemplate("heritage")}
                className="rounded border px-2 py-1 text-xs hover:bg-white"
              >
                Heritage Template
              </button>
              <button
                type="button"
                onClick={() => loadTemplate("design")}
                className="rounded border px-2 py-1 text-xs hover:bg-white"
              >
                Design Template
              </button>
              <button
                type="button"
                onClick={() => loadTemplate("trees")}
                className="rounded border px-2 py-1 text-xs hover:bg-white"
              >
                Trees Template
              </button>
              <button
                type="button"
                onClick={() => loadTemplate("flooding")}
                className="rounded border px-2 py-1 text-xs hover:bg-white"
              >
                Flooding Template
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Council Name *
              </label>
              <input
                type="text"
                value={formData.local_planning_authority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    local_planning_authority: e.target.value,
                  })
                }
                placeholder="e.g., Cornwall Council"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Policy Reference *
              </label>
              <input
                type="text"
                value={formData.policy_number}
                onChange={(e) =>
                  setFormData({ ...formData, policy_number: e.target.value })
                }
                placeholder="e.g., Policy 12, DM1"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Policy Title *
              </label>
              <input
                type="text"
                value={formData.policy_title}
                onChange={(e) =>
                  setFormData({ ...formData, policy_title: e.target.value })
                }
                placeholder="e.g., Design and Development Quality"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Policy Type *
              </label>
              <select
                value={formData.policy_type}
                onChange={(e) =>
                  setFormData({ ...formData, policy_type: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              >
                {POLICY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Source URL
              </label>
              <input
                type="url"
                value={formData.policy_url ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, policy_url: e.target.value })
                }
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Local Plan Name *
              </label>
              <input
                type="text"
                value={formData.local_plan_name}
                onChange={(e) =>
                  setFormData({ ...formData, local_plan_name: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Local Plan Year
              </label>
              <input
                type="number"
                value={formData.local_plan_year ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    local_plan_year: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Constraint Types *
              </label>
              <div className="flex flex-wrap gap-2">
                {CONSTRAINT_TYPES.map((constraint) => {
                  const isSelected =
                    formData.constraint_types?.includes(constraint) ?? false;
                  return (
                    <button
                      key={constraint}
                      type="button"
                      onClick={() => toggleConstraint(constraint)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        isSelected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-300 bg-white text-gray-700"
                      }`}
                    >
                      {constraint.replaceAll("_", " ")}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Policy Text *
              </label>
              <textarea
                value={formData.policy_text}
                onChange={(e) =>
                  setFormData({ ...formData, policy_text: e.target.value })
                }
                rows={4}
                placeholder="Brief summary of the policy requirements..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Add Policy
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                resetForm();
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mb-4 flex gap-4 text-sm text-gray-600">
        <span>Total: {policies.length} policies</span>
        <span>•</span>
        <span>Showing: {filteredPolicies.length}</span>
        <span>•</span>
        <span>Councils: {councils.length}</span>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-gray-500">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            Loading policies...
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p className="mb-2 text-lg">No policies found</p>
            <p className="text-sm">Try adjusting your filters or add a new policy above.</p>
          </div>
        ) : (
          filteredPolicies.map((policy) => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              isEditing={editingId === policy.id}
              onEdit={() => setEditingId(policy.id)}
              onSave={(updates) => handleUpdate(policy.id, updates)}
              onCancel={() => setEditingId(null)}
              onDelete={() => handleDelete(policy.id, policy.policy_number)}
            />
          ))
        )}
      </div>

      <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          <strong>Tip:</strong> Keep policy text concise. Link to the source URL for full detail.
        </p>
      </div>
    </div>
  );
}

function PolicyCard({
  policy,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: {
  policy: Policy;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<Policy>) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [editData, setEditData] = useState(policy);

  if (isEditing) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 grid gap-3 md:grid-cols-2">
          <input
            type="text"
            value={editData.local_planning_authority}
            onChange={(e) =>
              setEditData({ ...editData, local_planning_authority: e.target.value })
            }
            className="rounded border px-2 py-1 text-sm"
            placeholder="Council Name"
          />
          <input
            type="text"
            value={editData.policy_number}
            onChange={(e) => setEditData({ ...editData, policy_number: e.target.value })}
            className="rounded border px-2 py-1 text-sm"
            placeholder="Policy Reference"
          />
          <input
            type="text"
            value={editData.policy_title}
            onChange={(e) => setEditData({ ...editData, policy_title: e.target.value })}
            className="rounded border px-2 py-1 text-sm md:col-span-2"
            placeholder="Policy Title"
          />
          <select
            value={editData.policy_type}
            onChange={(e) => setEditData({ ...editData, policy_type: e.target.value })}
            className="rounded border px-2 py-1 text-sm"
          >
            {POLICY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          <input
            type="url"
            value={editData.policy_url ?? ""}
            onChange={(e) => setEditData({ ...editData, policy_url: e.target.value })}
            className="rounded border px-2 py-1 text-sm"
            placeholder="Source URL"
          />
          <input
            type="text"
            value={editData.local_plan_name}
            onChange={(e) => setEditData({ ...editData, local_plan_name: e.target.value })}
            className="rounded border px-2 py-1 text-sm"
            placeholder="Local Plan Name"
          />
          <input
            type="number"
            value={editData.local_plan_year ?? ""}
            onChange={(e) =>
              setEditData({
                ...editData,
                local_plan_year: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="rounded border px-2 py-1 text-sm"
            placeholder="Year"
          />
          <textarea
            value={editData.policy_text}
            onChange={(e) => setEditData({ ...editData, policy_text: e.target.value })}
            className="rounded border px-2 py-1 text-sm md:col-span-2"
            rows={3}
            placeholder="Policy Text"
          />
          <div className="md:col-span-2">
            <div className="flex flex-wrap gap-2">
              {CONSTRAINT_TYPES.map((constraint) => {
                const isSelected = editData.constraint_types?.includes(constraint);
                return (
                  <button
                    key={constraint}
                    type="button"
                    onClick={() => {
                      const current = editData.constraint_types ?? [];
                      const next = isSelected
                        ? current.filter((item) => item !== constraint)
                        : [...current, constraint];
                      setEditData({ ...editData, constraint_types: next });
                    }}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      isSelected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 bg-white text-gray-700"
                    }`}
                  >
                    {constraint.replaceAll("_", " ")}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSave(editData)}
            className="flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-1 rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-blue-100 px-2.5 py-1 text-sm font-semibold text-blue-800">
              {policy.policy_number}
            </span>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
              {policy.policy_type}
            </span>
            <span className="text-xs text-gray-500">
              {policy.local_planning_authority}
            </span>
          </div>
          <h3 className="mb-2 font-semibold text-gray-900">{policy.policy_title}</h3>
          <p className="text-sm leading-relaxed text-gray-600">{policy.policy_text}</p>
          {policy.policy_url && (
            <a
              href={policy.policy_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              View full policy →
            </a>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="rounded p-2 text-gray-600 transition-colors hover:bg-gray-100"
            title="Edit policy"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded p-2 text-red-600 transition-colors hover:bg-red-50"
            title="Delete policy"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
