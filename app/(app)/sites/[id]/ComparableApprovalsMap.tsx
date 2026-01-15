"use client";

import { useEffect, useMemo, useState } from "react";

type PlanningApplication = {
  id: string;
  authority: string | null;
  address: string | null;
  reference: string | null;
  description: string | null;
  units: number | null;
  decision: "approved" | "refused" | "pending" | "withdrawn" | string | null;
  decision_date: string | null;
  validated_date: string | null;
  refusal_reasons: string[] | null;
  conditions: string[] | null;
  planning_portal_url: string | null;
  officer_report_url: string | null;
  latitude: number | null;
  longitude: number | null;
  weeksTaken?: number | null;
  distanceMeters?: number | null;
};

type Props = {
  site: {
    id: string;
    address: string | null;
  };
};

type Coordinates = { lat: number; lng: number };

function markerColor(decision: PlanningApplication["decision"]) {
  if (decision === "approved") return "bg-blue-500";
  if (decision === "refused") return "bg-rose-500";
  if (decision === "pending") return "bg-amber-400";
  return "bg-zinc-400";
}

function labelColor(decision: PlanningApplication["decision"]) {
  if (decision === "approved") return "text-blue-700";
  if (decision === "refused") return "text-rose-700";
  if (decision === "pending") return "text-amber-700";
  return "text-zinc-600";
}

function formatDate(value?: string | null) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ComparableApprovalsMap({ site }: Props) {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [applications, setApplications] = useState<PlanningApplication[]>([]);
  const [radius, setRadius] = useState(500);
  const [filters, setFilters] = useState({
    approved: true,
    refused: true,
    pending: false,
  });
  const [selectedApp, setSelectedApp] = useState<PlanningApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  useEffect(() => {
    if (!site.address) {
      setGeocodeError("No address available for mapping.");
      return;
    }

    let active = true;
    const geocode = async () => {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(site.address!)}`);
      if (!res.ok) {
        if (active) setGeocodeError("Unable to geocode this site address.");
        return;
      }
      const data = (await res.json()) as { lat: number; lng: number };
      if (active) setCoords({ lat: data.lat, lng: data.lng });
    };

    void geocode();
    return () => {
      active = false;
    };
  }, [site.address]);

  useEffect(() => {
    if (!coords) return;
    let active = true;
    const loadNearby = async () => {
      setLoading(true);
      const res = await fetch(
        `/api/planning-applications/nearby?lat=${coords.lat}&lng=${coords.lng}&radius=${radius}`
      );
      if (!active) return;
      if (!res.ok) {
        setApplications([]);
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { applications: PlanningApplication[] };
      setApplications(data.applications ?? []);
      setLoading(false);
    };

    void loadNearby();
    return () => {
      active = false;
    };
  }, [coords, radius]);

  const filteredApplications = applications.filter((app) => {
    if (app.decision === "approved" && !filters.approved) return false;
    if (app.decision === "refused" && !filters.refused) return false;
    if (app.decision === "pending" && !filters.pending) return false;
    return true;
  });

  const stats = useMemo(() => {
    const approved = applications.filter((a) => a.decision === "approved").length;
    const refused = applications.filter((a) => a.decision === "refused").length;
    const pending = applications.filter((a) => a.decision === "pending").length;
    const decided = approved + refused;
    const avgWeeks = applications
      .map((a) => a.weeksTaken)
      .filter((value): value is number => value != null);
    const avgDecisionWeeks =
      avgWeeks.length > 0
        ? Math.round(avgWeeks.reduce((sum, value) => sum + value, 0) / avgWeeks.length)
        : null;
    const successRate = decided > 0 ? Math.round((approved / decided) * 100) : null;

    return { approved, refused, pending, avgDecisionWeeks, successRate };
  }, [applications]);

  const bounds = useMemo(() => {
    const points = filteredApplications
      .filter((app) => app.latitude != null && app.longitude != null)
      .map((app) => ({ lat: app.latitude as number, lng: app.longitude as number }));
    if (coords) points.push(coords);
    if (points.length === 0) return null;

    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return {
      minLat,
      maxLat,
      minLng,
      maxLng,
      latSpan: Math.max(maxLat - minLat, 0.0001),
      lngSpan: Math.max(maxLng - minLng, 0.0001),
    };
  }, [coords, filteredApplications]);

  const project = (point: Coordinates) => {
    if (!bounds) return { left: "50%", top: "50%" };
    const x = ((point.lng - bounds.minLng) / bounds.lngSpan) * 100;
    const y = ((bounds.maxLat - point.lat) / bounds.latSpan) * 100;
    return { left: `${x}%`, top: `${y}%` };
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">Nearby Planning Applications</h3>
          <p className="text-sm text-zinc-600">Recent decisions within your local area.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600">
          <div className="flex overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
            {[500, 1000, 2000].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRadius(value)}
                className={`px-3 py-1.5 font-semibold ${
                  radius === value ? "bg-zinc-900 text-white" : "text-zinc-600"
                }`}
              >
                {value === 500 ? "500m" : value === 1000 ? "1km" : "2km"}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.approved}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, approved: event.target.checked }))
              }
            />
            <span className="text-blue-600">Approved ({stats.approved})</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.refused}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, refused: event.target.checked }))
              }
            />
            <span className="text-rose-600">Refused ({stats.refused})</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.pending}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, pending: event.target.checked }))
              }
            />
            <span className="text-amber-600">Pending ({stats.pending})</span>
          </label>
        </div>
      </div>

      <div className="mt-4">
        {geocodeError ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {geocodeError}
          </div>
        ) : null}
        <div className="relative mt-3 h-[420px] overflow-hidden rounded-xl border border-zinc-200 bg-[radial-gradient(circle_at_top,#f8fafc,transparent_60%),linear-gradient(120deg,#eef2ff,#f8fafc)]">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 text-sm text-zinc-600">
              Loading applications...
            </div>
          )}
          {!coords && !geocodeError && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-600">
              Geocoding site address...
            </div>
          )}
          {coords && bounds ? (
            <>
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_49%,rgba(148,163,184,0.18)_50%,transparent_51%),linear-gradient(0deg,transparent_49%,rgba(148,163,184,0.18)_50%,transparent_51%)] bg-[size:60px_60px]" />
              <div
                className="absolute z-20 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow"
                style={project(coords)}
                title="Your site"
              />
              {filteredApplications.map((app) => {
                if (app.latitude == null || app.longitude == null) return null;
                const position = project({ lat: app.latitude, lng: app.longitude });
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => setSelectedApp(app)}
                    className={`absolute z-20 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow ${markerColor(
                      app.decision
                    )}`}
                    style={position}
                    title={app.address ?? "Planning application"}
                  />
                );
              })}
              <div className="absolute bottom-3 left-3 rounded-lg border border-white/60 bg-white/80 px-3 py-2 text-[11px] text-zinc-600 shadow">
                Radius: {radius}m
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-center">
          <div className="text-lg font-semibold text-zinc-900">{applications.length}</div>
          <div className="text-xs text-zinc-500">Total</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-center">
          <div className="text-lg font-semibold text-emerald-700">
            {stats.successRate != null ? `${stats.successRate}%` : "N/A"}
          </div>
          <div className="text-xs text-zinc-500">Approval rate</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-center">
          <div className="text-lg font-semibold text-zinc-900">
            {stats.avgDecisionWeeks ?? "N/A"}
          </div>
          <div className="text-xs text-zinc-500">Avg. weeks</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-center">
          <div className="text-lg font-semibold text-blue-700">{stats.approved}</div>
          <div className="text-xs text-zinc-500">Approved</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-center">
          <div className="text-lg font-semibold text-rose-700">{stats.refused}</div>
          <div className="text-xs text-zinc-500">Refused</div>
        </div>
      </div>

      {selectedApp ? (
        <ApplicationDetailPanel application={selectedApp} onClose={() => setSelectedApp(null)} />
      ) : null}
    </div>
  );
}

function ApplicationDetailPanel({
  application,
  onClose,
}: {
  application: PlanningApplication;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">
              {application.address ?? "Planning application"}
            </h3>
            <p className={`text-xs font-semibold uppercase ${labelColor(application.decision)}`}>
              {application.decision ?? "unknown"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-zinc-500">
            Close
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Reference</p>
            <p className="text-sm text-zinc-800">{application.reference ?? "N/A"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Units</p>
            <p className="text-sm text-zinc-800">{application.units ?? "N/A"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Decision date</p>
            <p className="text-sm text-zinc-800">{formatDate(application.decision_date)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Timeline</p>
            <p className="text-sm text-zinc-800">
              {application.weeksTaken != null ? `${application.weeksTaken} weeks` : "N/A"}
            </p>
          </div>
        </div>

        {application.description ? (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-zinc-900">Description</h4>
            <p className="mt-1 text-sm text-zinc-700">{application.description}</p>
          </div>
        ) : null}

        {application.decision === "refused" && application.refusal_reasons?.length ? (
          <div className="mt-4 rounded-lg border border-rose-100 bg-rose-50 p-4 text-sm text-rose-900">
            <h4 className="text-sm font-semibold">Refusal reasons</h4>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-rose-800">
              {application.refusal_reasons.map((reason, idx) => (
                <li key={`${idx}-${reason}`}>{reason}</li>
              ))}
            </ol>
          </div>
        ) : null}

        {application.conditions?.length ? (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-zinc-900">
              Conditions ({application.conditions.length})
            </h4>
            <details className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
              <summary className="cursor-pointer text-xs font-semibold text-zinc-700">
                View conditions
              </summary>
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                {application.conditions.map((condition, idx) => (
                  <li key={`${idx}-${condition}`}>{condition}</li>
                ))}
              </ol>
            </details>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {application.planning_portal_url ? (
            <a
              href={application.planning_portal_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              View on portal
            </a>
          ) : null}
          {application.officer_report_url ? (
            <a
              href={application.officer_report_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Officer report
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
