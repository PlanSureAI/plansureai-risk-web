import { NextRequest, NextResponse } from 'next/server';

interface GeocodeResult {
  lat: number;
  lng: number;
  display_name: string;
}

function extractPostcode(query: string): string | null {
  const match = query.match(/\b([A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2})\b/i);
  return match ? match[1].toUpperCase() : null;
}

async function geocodeQuery(query: string) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}&` +
      `countrycodes=gb&` +
      `format=json&` +
      `limit=1`,
    {
      headers: {
        "User-Agent": "PlanSureAI/1.0 (https://www.plansureai.com)",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Geocoding API returned ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    let data = await geocodeQuery(query);
    if (!data.length) {
      const postcode = extractPostcode(query);
      if (postcode) {
        data = await geocodeQuery(postcode);
      }
    }

    if (!data.length) {
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
