// app/(app)/sites/[id]/page.tsx
// INDIVIDUAL SITE DETAILS PAGE - All info organized cleanly

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/app/lib/supabase'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Building2, Calendar, FileText, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic';

export default async function SiteDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get site details
  const { data: site, error } = await supabaseAdmin
    .from('sites')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !site) {
    redirect("/sites?missing=1")
  }

  // Check if risk assessment exists
  const { data: riskAssessment } = await supabase
    .from('risk_assessments')
    .select('*')
    .eq('site_id', site.id)
    .single()

  const hasAssessment = !!riskAssessment

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
                {site.site_name || site.address || 'Untitled Project'}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">
                    {site.address}
                    {site.postcode && `, ${site.postcode}`}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  site.status === 'submitted' ? 'bg-green-100 text-green-700' :
                  site.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                  site.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {site.status?.charAt(0).toUpperCase() + site.status?.slice(1) || 'Draft'}
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
                    {site.local_planning_authority || 'Not specified'}
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
                    {(() => {
                      const createdAt =
                        site.submitted_at ||
                        site.last_assessed_at ||
                        site.ai_last_run_at;
                      if (!createdAt) return "Unknown";
                      return new Date(createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      });
                    })()}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Site Information (if you have additional fields) */}
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
            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link 
                  href={`/sites/${site.id}/risk-assessment`}
                  className="block w-full px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-center border border-blue-200"
                >
                  {hasAssessment ? 'View Risk Report' : 'Run Risk Assessment'}
                </Link>
                <Link 
                  href={`/sites/${site.id}/edit`}
                  className="block w-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-center border border-gray-200"
                >
                  Edit Project Details
                </Link>
              </div>
            </div>

            {/* Help Box */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-sm text-blue-800 mb-4">
                Our AI analyzes your site against local planning policies and comparable applications to identify risks.
              </p>
              <Link 
                href="/help"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Learn more →
              </Link>
            </div>

            {/* Stats (if available) */}
            {hasAssessment && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Assessment Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Risks Identified</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {riskAssessment?.risk_factors?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Overall Score</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {riskAssessment?.overall_score || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Approval Likelihood</span>
                    <span className="text-sm font-semibold text-green-600">
                      {riskAssessment?.approval_likelihood 
                        ? `${Math.round(riskAssessment.approval_likelihood * 100)}%`
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
