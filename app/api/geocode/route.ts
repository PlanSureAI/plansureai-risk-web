import { NextRequest, NextResponse } from 'next/server';

interface GeocodeResult {
  lat: number;
  lng: number;
  display_name: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    // Call Nominatim geocoding API from server-side (no CORS issues)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `countrycodes=gb&` +
        `format=json&` +
        `limit=1`,
      {
        headers: {
          'User-Agent': 'PlanSureAI/1.0 (https://www.plansureai.com)',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    const result: GeocodeResult = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      display_name: data[0].display_name,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json({ error: 'Failed to geocode address' }, { status: 500 });
  }
}
