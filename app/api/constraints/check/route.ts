import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')
  const radius = parseInt(searchParams.get('radius') || '5000') // meters

  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'lat and lng parameters are required' },
      { status: 400 }
    )
  }

  // Query constraints within radius
  const { data, error } = await supabase.rpc('check_constraints', {
    p_lat: lat,
    p_lng: lng,
    p_radius: radius
  })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    location: { lat, lng },
    radius_meters: radius,
    constraints: data || []
  })
}
