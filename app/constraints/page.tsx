'use client';

import { useState } from 'react';
import { Search, MapPin, AlertCircle, Loader2 } from 'lucide-react';

type ConstraintMeta = {
  title: string;
  description: string;
  badgeClass: string;
};

export default function ConstraintsPage() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [searchedAddress, setSearchedAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const constraintMeta: Record<string, ConstraintMeta> = {
    conservation_area: {
      title: 'Conservation Area',
      description: 'Protected area with special architectural or historic interest.',
      badgeClass: 'border-amber-200 bg-amber-50 text-amber-800',
    },
    listed_building_nearby: {
      title: 'Listed Building Nearby',
      description: 'Development must safeguard nearby heritage assets.',
      badgeClass: 'border-orange-200 bg-orange-50 text-orange-800',
    },
    article_4_direction: {
      title: 'Article 4 Direction',
      description: 'Permitted development rights are restricted in this area.',
      badgeClass: 'border-amber-200 bg-amber-50 text-amber-800',
    },
    TPO: {
      title: 'Tree Preservation Order',
      description: 'Protected trees or woodland require special consent.',
      badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    },
    ancient_woodland: {
      title: 'Ancient Woodland',
      description: 'Sensitive habitat with strong protection in planning decisions.',
      badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    },
    flood_zone_2: {
      title: 'Flood Zone 2',
      description: 'Medium probability of flooding; assessments likely required.',
      badgeClass: 'border-sky-200 bg-sky-50 text-sky-800',
    },
    flood_zone_3: {
      title: 'Flood Zone 3',
      description: 'High probability of flooding; significant constraints apply.',
      badgeClass: 'border-rose-200 bg-rose-50 text-rose-800',
    },
    AONB: {
      title: 'Area of Outstanding Natural Beauty',
      description: 'Landscape protections apply; development must be sensitive.',
      badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    },
    national_park: {
      title: 'National Park',
      description: 'High protection area with strict planning controls.',
      badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    },
    green_belt: {
      title: 'Green Belt',
      description: 'Development is tightly controlled and requires special justification.',
      badgeClass: 'border-rose-200 bg-rose-50 text-rose-800',
    },
    SSSI: {
      title: 'SSSI',
      description: 'Site of Special Scientific Interest; major constraints apply.',
      badgeClass: 'border-rose-200 bg-rose-50 text-rose-800',
    },
  };

  const formatFallbackTitle = (key: string) =>
    key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const geocodeAddress = async (
    query: string
  ): Promise<{ lat: number; lng: number } | null> => {
    try {
      // Use our API endpoint instead of calling Nominatim directly
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);

      const data = await response.json();
      console.log('Geocode response:', data);

      if (!response.ok) {
        console.error('Geocode error:', data);
        return null;
      }

      return {
        lat: data.lat,
        lng: data.lng,
      };
    } catch (err) {
      console.error('Geocoding error:', err);
      return null;
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.trim()) {
      setError('Please enter an address or postcode');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      // Geocode the address
      const coords = await geocodeAddress(address);

      if (!coords) {
        setError('Could not find location. Please try a different address or postcode.');
        setLoading(false);
        return;
      }

      setCoordinates(coords);

      // Fetch constraints from Planning Data API (server-side)
      const response = await fetch(
        `/api/constraints/check?lat=${coords.lat}&lng=${coords.lng}`
      );

      const data = await response.json();
      console.log('Constraints response:', data);

      if (!response.ok) {
        console.error('Constraints error:', data);
        throw new Error(data.error || 'Failed to fetch constraints');
      }

      setResults(data.constraints || []);
      setSearchedAddress(address);
    } catch (err) {
      console.error('Full error details:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while searching.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Planning Constraints Checker
          </h1>
          <p className="text-gray-600">Check planning constraints for any UK location</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address or Postcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g., 10 Downing Street, London or SW1A 2AA"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  Check Constraints
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="mt-8 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Results for: {searchedAddress}
              </h2>
              {coordinates && (
                <p className="text-sm text-gray-500">
                  Location: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Data source: planning.data.gov.uk
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-wrap gap-2">
                {results.map((constraint) => {
                  const meta = constraintMeta[constraint];
                  const badgeClass =
                    meta?.badgeClass ?? 'border-gray-200 bg-gray-50 text-gray-700';
                  const label = meta?.title ?? formatFallbackTitle(constraint);
                  return (
                    <span
                      key={constraint}
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              {results.map((constraint) => {
                const meta = constraintMeta[constraint];
                return (
                  <div
                    key={`${constraint}-detail`}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      {meta?.title ?? formatFallbackTitle(constraint)}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {meta?.description ?? 'Planning constraint identified for this location.'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && results.length === 0 && !error && searchedAddress && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No constraints found</h3>
            <p className="text-sm text-gray-500">
              No planning constraints were found for this location.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
