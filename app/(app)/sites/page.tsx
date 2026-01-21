// app/(app)/sites/page.tsx
// CLEAN SITES DASHBOARD - Card-based layout with empty state

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, MapPin, Building2, FileText } from 'lucide-react'

export default async function SitesPage({
  searchParams,
}: {
  searchParams?: { missing?: string }
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get user's sites
  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Get user's tier for project limits
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('tier, projects_limit, projects_used')
    .eq('user_id', user.id)
    .maybeSingle()

  const canCreateProject = !subscription || 
    (subscription.projects_used < subscription.projects_limit || subscription.projects_limit === -1)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Projects</h1>
              <p className="mt-1 text-sm text-gray-500">
                {sites?.length || 0} of {subscription?.projects_limit === -1 ? '∞' : subscription?.projects_limit || 1} projects
              </p>
            </div>
            
            {canCreateProject ? (
              <Link 
                href="/sites/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                New Project
              </Link>
            ) : (
              <Link 
                href="/pricing"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium"
              >
                Upgrade to Add More
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {searchParams?.missing === "1" ? (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
            That project was not found or you do not have access to it.
          </div>
        ) : null}
        {!sites || sites.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No projects yet
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create your first project to assess planning permission risks with AI-powered analysis
            </p>
            <Link 
              href="/sites/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              <Plus className="w-5 h-5" />
              Create First Project
            </Link>
            
            {/* Quick info */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">What you'll get:</p>
              <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="text-left">
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="text-sm font-medium text-gray-900">AI Risk Assessment</div>
                  <div className="text-xs text-gray-500">Instant analysis of planning risks</div>
                </div>
                <div className="text-left">
                  <div className="text-2xl mb-1">📋</div>
                  <div className="text-sm font-medium text-gray-900">Mitigation Plans</div>
                  <div className="text-xs text-gray-500">Step-by-step action guidance</div>
                </div>
                <div className="text-left">
                  <div className="text-2xl mb-1">📊</div>
                  <div className="text-sm font-medium text-gray-900">Approval Likelihood</div>
                  <div className="text-xs text-gray-500">Based on real comparable data</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Sites Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map(site => (
              <Link 
                key={site.id} 
                href={`/sites/${site.id}`}
                className="block"
              >
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all group">
                  {/* Site Icon & Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Building2 className="w-6 h-6 text-blue-600" />
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

                  {/* Site Name */}
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {site.site_name || site.address || 'Untitled Project'}
                  </h3>

                  {/* Address */}
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">
                      {site.address || 'No address'}
                      {site.postcode && `, ${site.postcode}`}
                    </span>
                  </div>

                  {/* Council */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <Building2 className="w-4 h-4" />
                    <span>{site.local_planning_authority || 'Unknown Council'}</span>
                  </div>

                  {/* Action Button */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
                        View Details
                      </span>
                      <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
