"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Building2,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/app/lib/supabaseBrowser";

type SiteRecord = Record<string, any>;

interface Props {
  siteId: string;
}

export function SiteDetailsClient({ siteId }: Props) {
  const router = useRouter();
  const [site, setSite] = useState<SiteRecord | null>(null);
  const [hasAssessment, setHasAssessment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: siteData } = await supabase
        .from("sites")
        .select("*")
        .eq("id", siteId)
        .maybeSingle();

      if (!siteData || siteData.user_id !== user.id) {
        router.push("/sites?missing=1");
        return;
      }

      const { data: riskAssessment } = await supabase
        .from("risk_assessments")
        .select("*")
        .eq("site_id", siteData.id)
        .maybeSingle();

      if (!isMounted) return;
      setSite(siteData);
      setHasAssessment(!!riskAssessment);
      setIsLoading(false);
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [router, siteId, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-600">
            Loading project...
          </div>
        </div>
      </div>
    );
  }

  if (!site) {
    return null;
  }

  const createdAt = site.submitted_at || site.last_assessed_at || site.ai_last_run_at;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Button */}
          <Link
            href="/sites"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {site.site_name || site.address || "Untitled Project"}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">
                    {site.address}
                    {site.postcode && `, ${site.postcode}`}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    site.status === "submitted"
                      ? "bg-green-100 text-green-700"
                      : site.status === "draft"
                      ? "bg-gray-100 text-gray-700"
                      : site.status === "reviewed"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {site.status?.charAt(0).toUpperCase() + site.status?.slice(1) || "Draft"}
                </span>
              </div>
            </div>

            {/* Primary CTA */}
            {!hasAssessment ? (
              <Link
                href={`/sites/${site.id}/risk-assessment`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <TrendingUp className="w-5 h-5" />
                Run Risk Assessment
              </Link>
            ) : (
              <Link
                href={`/sites/${site.id}/risk-assessment`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <CheckCircle className="w-5 h-5" />
                View Risk Report
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Risk Assessment Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Risk Assessment</h2>

              {hasAssessment ? (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Assessment Complete</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Your planning risk assessment is ready to view with detailed mitigation recommendations.
                    </p>
                    <Link
                      href={`/sites/${site.id}/risk-assessment`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                    >
                      View Full Report →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Ready to Assess</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Run an AI-powered risk assessment to identify potential planning challenges and get actionable mitigation plans.
                    </p>
                    <Link
                      href={`/sites/${site.id}/risk-assessment`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Start Assessment
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Project Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Project Details</h2>

              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Local Planning Authority</dt>
                  <dd className="mt-1 flex items-center gap-2 text-sm text-gray-900">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    {site.local_planning_authority || "Not specified"}
                  </dd>
                </div>

                {site.reference && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Planning Reference</dt>
                    <dd className="mt-1 text-sm text-gray-900">{site.reference}</dd>
                  </div>
                )}

                {site.description && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Development Description</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{site.description}</dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 flex items-center gap-2 text-sm text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {createdAt
                      ? new Date(createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "Unknown"}
                  </dd>
                </div>
              </dl>
            </div>

            {(site.outcome_summary || site.next_move || site.viability_summary) && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Information</h2>

                {site.outcome_summary && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Outcome Summary</h3>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{site.outcome_summary}</p>
                  </div>
                )}

                {site.viability_summary && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Viability Analysis</h3>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{site.viability_summary}</p>
                  </div>
                )}

                {site.next_move && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Next Steps</h3>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{site.next_move}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Next Actions</h3>
              <div className="space-y-3">
                <Link
                  href={`/sites/${site.id}/risk-assessment`}
                  className="flex items-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  <TrendingUp className="w-4 h-4" />
                  Run Assessment
                </Link>
                <Link
                  href={`/sites/${site.id}/edit`}
                  className="flex items-center gap-2 w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  <FileText className="w-4 h-4" />
                  Edit Details
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Need help?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Our AI analyzes your site against local planning policies and comparable applications to identify risks.
              </p>
              <Link href="/contact" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                Contact support →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
