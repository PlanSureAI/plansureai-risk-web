import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

// Helper function to get rating color
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

export default async function EPCListingPage() {
  const supabase = await createClient();
  
  // Fetch properties with their EPC certificates
  const { data: properties, error } = await supabase
    .from('properties')
    .select(`
      id,
      address,
      postcode,
      city,
      property_type,
      bedrooms,
      epc_certificates (
        id,
        current_energy_rating,
        current_energy_efficiency,
        expiry_date
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching properties:', error)
    return (
      <div className="page-shell">
        <div className="page">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <h2 className="text-h2 text-red-900">Unable to load properties</h2>
            <p className="text-body text-red-700 mt-2">
              {error?.message || 'Database connection error. Please check your Supabase configuration.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="page space-y-6">
        <div className="space-y-2">
          <h1 className="text-h1">Energy Performance Certificates</h1>
          <p className="text-body">Browse properties and their energy ratings.</p>
        </div>

        {!properties || properties.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
            <p className="text-body text-zinc-600">No properties found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties?.map((property) => {
            const epc = property.epc_certificates?.[0]
            
            return (
              <Link
                key={property.id}
                href={`/epc/${property.id}`}
                className="card block hover:shadow transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <h3 className="text-h2">{property.address}</h3>
                    <p className="text-body">
                      {property.city} · {property.postcode}
                    </p>
                  </div>
                  {epc && (
                    <div className={`${getRatingColor(epc.current_energy_rating)} text-white px-3 py-1 rounded-md font-bold text-lg`}>
                      {epc.current_energy_rating}
                    </div>
                  )}
                </div>

                <div className="mt-3 space-y-1 text-body">
                  <p>{property.property_type} · {property.bedrooms} bed</p>
                  {epc && (
                    <>
                      <p>Energy Efficiency: {epc.current_energy_efficiency}/100</p>
                      <p className="text-xs text-zinc-600">
                        Certificate expires: {new Date(epc.expiry_date).toLocaleDateString()}
                      </p>
                    </>
                  )}
                </div>

                <div className="mt-4 text-sm font-semibold text-emerald-700">
                  View full certificate →
                </div>
              </Link>
            )
          })}
          </div>
        )}
      </div>
    </div>
  )
}
