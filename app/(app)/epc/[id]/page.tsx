import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";

export const dynamic = 'force-dynamic';

function getRatingColor(rating: string) {
  const colors = {
    'A': 'bg-green-600',
    'B': 'bg-green-500',
    'C': 'bg-yellow-500',
    'D': 'bg-orange-500',
    'E': 'bg-red-500',
    'F': 'bg-red-600',
    'G': 'bg-red-700'
  }
  return colors[rating as keyof typeof colors] || 'bg-gray-500'
}

export default async function EPCDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient();
  
  const { data: property, error } = await supabase
    .from('properties')
    .select(`
      *,
      epc_certificates (*)
    `)
    .eq('id', id)
    .single()

  if (error || !property) {
    notFound()
  }

  const epc = property.epc_certificates?.[0]

  return (
    <div className="page-shell">
      <div className="page space-y-6 max-w-4xl">
        <Link href="/epc" className="text-body text-emerald-700 hover:text-emerald-900">
          ← Back to all properties
        </Link>

        {/* Property Header */}
        <div className="card space-y-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-h1">{property.address}</h1>
              <p className="text-body">{property.city} · {property.postcode}</p>
              <p className="text-body">
                {property.property_type} · {property.bedrooms} bed · {property.bathrooms} bath
              </p>
            </div>
            
            {epc && (
              <div className="text-center">
                <div className={`${getRatingColor(epc.current_energy_rating)} text-white px-6 py-3 rounded-lg font-bold text-3xl`}>
                  {epc.current_energy_rating}
                </div>
                <p className="text-label mt-2 text-zinc-600">Current Rating</p>
              </div>
            )}
          </div>
        </div>

        {epc && (
          <>
            {/* Energy Efficiency */}
            <div className="card space-y-4">
              <h2 className="text-h2">Energy Efficiency</h2>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-label">Current</p>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-blue-600 h-4 rounded-full" 
                        style={{ width: `${epc.current_energy_efficiency}%` }}
                      />
                    </div>
                    <span className="ml-3 font-bold">{epc.current_energy_efficiency}</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-label">Potential</p>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-green-600 h-4 rounded-full" 
                        style={{ width: `${epc.potential_energy_efficiency}%` }}
                      />
                    </div>
                    <span className="ml-3 font-bold">{epc.potential_energy_efficiency}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className={`flex-1 ${getRatingColor(epc.current_energy_rating)} text-white p-4 rounded-lg text-center`}>
                  <div className="text-2xl font-bold">{epc.current_energy_rating}</div>
                  <div className="text-sm">Current</div>
                </div>
                <div className={`flex-1 ${getRatingColor(epc.potential_energy_rating)} text-white p-4 rounded-lg text-center`}>
                  <div className="text-2xl font-bold">{epc.potential_energy_rating}</div>
                  <div className="text-sm">Potential</div>
                </div>
              </div>
            </div>

            {/* Environmental Impact */}
            <div className="card space-y-4">
              <h2 className="text-h2">Environmental Impact</h2>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-label">Current CO₂ Emissions</p>
                  <p className="text-h2">{epc.co2_emissions_current} tonnes/year</p>
                </div>
                <div>
                  <p className="text-label">Potential CO₂ Emissions</p>
                  <p className="text-h2 text-emerald-700">{epc.co2_emissions_potential} tonnes/year</p>
                </div>
              </div>
            </div>

            {/* Running Costs */}
            <div className="card space-y-4">
              <h2 className="text-h2">Estimated Running Costs</h2>
              
              <div className="space-y-3 text-body">
                <div className="flex justify-between">
                  <span className="text-label">Heating</span>
                  <span className="font-semibold text-zinc-900">£{epc.heating_cost_current}/year</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-label">Hot Water</span>
                  <span className="font-semibold text-zinc-900">£{epc.hot_water_cost_current}/year</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-label">Lighting</span>
                  <span className="font-semibold text-zinc-900">£{epc.lighting_cost_current}/year</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-label">
                  <span className="font-bold text-zinc-900">Total</span>
                  <span className="text-h2">
                    £{Number(epc.heating_cost_current) + Number(epc.hot_water_cost_current) + Number(epc.lighting_cost_current)}/year
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {epc.recommendations && (
              <div className="card space-y-4">
                <h2 className="text-h2">Recommended Improvements</h2>
                
                <div className="space-y-4">
                  {epc.recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="border-l-4 border-emerald-600 pl-4 py-2">
                      <h3 className="text-h2 text-[18px] leading-[1.3]">{rec.improvement}</h3>
                      <p className="text-body">Typical cost: {rec.cost}</p>
                      <p className="text-emerald-700 text-label">Potential savings: {rec.savings}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certificate Info */}
            <div className="rounded-xl bg-zinc-100 p-6">
              <p className="text-label text-zinc-600">
                Certificate Number: {epc.certificate_number} · 
                Inspected: {new Date(epc.inspection_date).toLocaleDateString()} · 
                Expires: {new Date(epc.expiry_date).toLocaleDateString()}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
