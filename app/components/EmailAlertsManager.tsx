"use client";

import { useState } from "react";
import { useEmailAlerts } from "@/app/hooks/useEmailAlerts";
import { useUser } from "@/app/hooks/useUser";

const LOCAL_AUTHORITIES = [
  "Cornwall Council",
  "Birmingham City Council",
  "Leeds City Council",
  "Manchester City Council",
  "Bristol City Council",
];

const ALERT_TYPES = [
  { value: "new_applications", label: "New Applications" },
  { value: "policy_changes", label: "Policy Changes" },
  { value: "deadline_alerts", label: "Deadline Alerts" },
];

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function EmailAlertsManager() {
  const { user } = useUser();
  const { alerts, loading, createAlert, deleteAlert } = useEmailAlerts(user?.id || null);
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState({
    alertType: "new_applications",
    frequency: "weekly",
    regions: [] as string[],
    email: user?.email || "",
  });
  const [creating, setCreating] = useState(false);

  const handleRegionToggle = (region: string) => {
    setFormState((prev) => ({
      ...prev,
      regions: prev.regions.includes(region)
        ? prev.regions.filter((r) => r !== region)
        : [...prev.regions, region],
    }));
  };

  const handleCreateAlert = async () => {
    if (formState.regions.length === 0) {
      alert("Please select at least one region");
      return;
    }

    setCreating(true);
    try {
      await createAlert(
        formState.alertType,
        formState.frequency,
        formState.regions,
        formState.email
      );
      setShowForm(false);
      setFormState({
        alertType: "new_applications",
        frequency: "weekly",
        regions: [],
        email: user?.email || "",
      });
    } catch (error) {
      alert("Failed to create alert");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (confirm("Are you sure you want to delete this alert?")) {
      try {
        await deleteAlert(alertId);
      } catch (error) {
        alert("Failed to delete alert");
      }
    }
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-200 rounded-lg"></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Your Alerts</h3>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm"
            >
              + New Alert
            </button>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No alerts configured yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold">
                      {ALERT_TYPES.find((t) => t.value === alert.alert_type)?.label ||
                        alert.alert_type}
                    </p>
                    <p className="text-sm text-gray-600">
                      {FREQUENCIES.find((f) => f.value === alert.frequency)?.label ||
                        alert.frequency}{" "}
                      • {alert.regions.join(", ")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="text-red-600 hover:text-red-700 font-medium text-sm"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-xs text-gray-600">{alert.email}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold mb-4">Create New Alert</h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Alert Type</label>
              <select
                value={formState.alertType}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    alertType: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {ALERT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Frequency</label>
              <select
                value={formState.frequency}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    frequency: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {FREQUENCIES.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Regions</label>
              <div className="grid grid-cols-2 gap-2">
                {LOCAL_AUTHORITIES.map((region) => (
                  <label key={region} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formState.regions.includes(region)}
                      onChange={() => handleRegionToggle(region)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm">{region}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formState.email}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreateAlert}
                disabled={creating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Alert"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
