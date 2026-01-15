"use client";

import { useEffect, useState } from "react";
import { useNearbyApprovals } from "@/app/hooks/useNearbyApprovals";
import { PlanningApproval } from "@/app/types";

interface NearbyApprovalsMapProps {
  siteId: string;
  radiusKm?: number;
}

export function NearbyApprovalsMap({
  siteId,
  radiusKm = 0.5,
}: NearbyApprovalsMapProps) {
  const { approvals, loading, error, fetchApprovals } = useNearbyApprovals();
  const [selectedApproval, setSelectedApproval] = useState<PlanningApproval | null>(null);

  useEffect(() => {
    fetchApprovals(siteId, radiusKm);
  }, [siteId, radiusKm, fetchApprovals]);

  if (loading) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-gray-500">Loading approvals...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="font-semibold mb-2">Nearby Approvals</h3>
        <p className="text-sm text-gray-600">
          {approvals.length} approved projects within {radiusKm}km
        </p>
      </div>

      {error && (
        <div className="p-6 bg-red-50 border-t border-red-200 text-red-700">
          <p className="font-medium">Error loading approvals</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {approvals.length === 0 && !error && (
        <div className="p-6 text-center text-gray-500">
          <p>No approved applications found nearby</p>
        </div>
      )}

      {approvals.length > 0 && (
        <div className="divide-y max-h-96 overflow-y-auto">
          {approvals.map((approval, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedApproval(approval)}
              className="p-4 hover:bg-blue-50 cursor-pointer transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{approval.site_name}</p>
                  <p className="text-xs text-gray-600">ID: {approval.application_id}</p>
                </div>
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                  APPROVED
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-gray-600">Units</p>
                  <p className="font-semibold">{approval.units}</p>
                </div>
                <div>
                  <p className="text-gray-600">Timeline</p>
                  <p className="font-semibold">{approval.decision_timeline_days}d</p>
                </div>
                <div>
                  <p className="text-gray-600">Distance</p>
                  <p className="font-semibold">
                    {(approval.distance_km * 1000).toFixed(0)}m
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedApproval && (
        <div className="p-6 bg-blue-50 border-t border-blue-200">
          <div className="flex justify-between items-start mb-4">
            <h4 className="font-semibold">{selectedApproval.site_name}</h4>
            <button
              onClick={() => setSelectedApproval(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-600">Developer</p>
              <p className="font-medium">{selectedApproval.developer}</p>
            </div>

            {selectedApproval.conditions.length > 0 && (
              <div>
                <p className="text-gray-600 mb-2">Key Conditions</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {selectedApproval.conditions.slice(0, 3).map((cond, i) => (
                    <li key={i} className="text-xs">
                      {cond}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-gray-600">
              Approved: {new Date(selectedApproval.approval_date).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
