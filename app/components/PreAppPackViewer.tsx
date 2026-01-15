"use client";

import { useState } from "react";
import { usePreAppPack } from "@/app/hooks/usePreAppPack";
import { PreAppPack } from "@/app/types";

interface PreAppPackViewerProps {
  siteId: string;
}

export function PreAppPackViewer({ siteId }: PreAppPackViewerProps) {
  const { pack, loading, error, generatePack, downloadPack } = usePreAppPack();
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      await generatePack(siteId);
    } catch (err) {
      console.error("Generation failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <h3 className="font-semibold mb-2">Generate Pre-App Pack</h3>
          <p className="text-sm text-gray-600 mb-4">
            Create a professional pre-application documentation package
          </p>
          <button
            onClick={handleGenerate}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Generate Pack
          </button>
        </div>
      </div>
    );
  }

  const sections = [
    {
      id: "location_plan",
      title: "Site Location Plan",
      content: pack.content.site_location_plan,
    },
    {
      id: "constraints",
      title: "Constraints Summary",
      content: pack.content.constraints_summary,
    },
    {
      id: "compliance",
      title: "Policy Compliance Checklist",
      content: pack.content.policy_compliance_checklist,
    },
    {
      id: "statement",
      title: "Draft Planning Statement",
      content: pack.content.draft_planning_statement,
    },
    {
      id: "conditions",
      title: "Likely Conditions",
      content: pack.content.likely_conditions,
    },
    {
      id: "information",
      title: "Information Required",
      content: pack.content.information_required,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold mb-1">Pre-Application Pack</h3>
            <p className="text-sm text-gray-600">
              Generated {new Date(pack.generated_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => downloadPack(pack.id)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm"
          >
            Download PDF
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {sections.map((section) => (
          <div
            key={section.id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            <button
              onClick={() => setExpanded(expanded === section.id ? null : section.id)}
              className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
            >
              <h4 className="font-semibold text-left">{section.title}</h4>
              <span
                className={`transform transition-transform ${
                  expanded === section.id ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </button>

            {expanded === section.id && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                {typeof section.content === "string" ? (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {section.content}
                  </p>
                ) : Array.isArray(section.content) ? (
                  <ul className="space-y-2">
                    {section.content.map((item: string, idx: number) => (
                      <li key={idx} className="text-sm text-gray-700 flex gap-3">
                        <span className="text-gray-400">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">Est. Timeline</p>
          <p className="font-semibold">{pack.content.estimated_timeline}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">Key Policies</p>
          <p className="font-semibold text-sm">
            {pack.content.key_policy_references.length} referenced
          </p>
        </div>
      </div>
    </div>
  );
}
