'use client';

import { useState } from 'react';
import { Search, MapPin, AlertCircle, Loader2 } from 'lucide-react';

interface Constraint {
  dataset: string;
  name: string;
  reference: string;
  entity: string;
  geometry?: any;
}

interface ConstraintGroup {
  dataset: string;
  title: string;
  count: number;
  constraints: Constraint[];
}

export default function ConstraintsPage() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<ConstraintGroup[]>([]);
  const [searchedAddress, setSearchedAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const datasetTitles: Record<string, string> = {
    'conservation-area': 'Conservation Areas',
    'listed-building': 'Listed Buildings',
    'article-4-direction-area': 'Article 4 Direction Areas',
    'tree-preservation-zone': 'Tree Preservation Zones',
    'flood-risk-zone': 'Flood Risk Zones',
  };

  const datasetDescriptions: Record<string, string> = {
    'conservation-area': 'Areas of special architectural or historic interest with protected character',
    'listed-building': 'Buildings of special architectural or historic interest',
    'article-4-direction-area': 'Areas where permitted development rights are restricted',
    'tree-preservation-zone': 'Protected trees and woodland areas',
    'flood-risk-zone': 'Areas at risk of flooding',
  };

  const geocodeAddress = async (
    query: string
  ): Promise<{ lat: number; lng: number } | null> => {
    try {
      // Use our API endpoint instead of calling Nominatim directly
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

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

      // Fetch constraints
      const response = await fetch(
        `/api/planning-constraints?lat=${coords.lat}&lng=${coords.lng}&limit=100`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch constraints');
      }

      const data = await response.json();

      // Group by dataset
      const grouped: Record<string, Constraint[]> = data.features.reduce(
        (acc: Record<string, Constraint[]>, feature: any) => {
          const dataset = feature.properties.dataset;
          if (!acc[dataset]) {
            acc[dataset] = [];
          }
          acc[dataset].push({
            dataset,
            name: feature.properties.name || 'Unnamed',
            reference: feature.properties.reference || feature.properties.entity,
            entity: feature.properties.entity,
            geometry: feature.geometry,
          });
          return acc;
        },
        {}
      );

      const groupedResults: ConstraintGroup[] = Object.entries(grouped).map(
        ([dataset, constraints]) => ({
          dataset,
          title: datasetTitles[dataset] || dataset,
          count: constraints.length,
          constraints: constraints as Constraint[],
        })
      );

      setResults(groupedResults);
      setSearchedAddress(address);
    } catch (err) {
      setError('An error occurred while searching. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Planning Constraints Checker</h1>
              <p className="mt-1 text-sm text-gray-500">
                Check planning constraints for any UK location
              </p>
            </div>
            <a href="/sites" className="text-sm text-gray-600 hover:text-gray-900">
              Back to Sites
            </a>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            </div>

            {results.map((group) => (
              <div
                key={group.dataset}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
              >
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{group.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {datasetDescriptions[group.dataset] || ''}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {group.count} {group.count === 1 ? 'constraint' : 'constraints'}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {group.constraints.map((constraint, idx) => (
                    <div key={idx} className="px-6 py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{constraint.name}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            Reference: {constraint.reference}
                          </p>
                        </div>
                        <a
                          href={`https://www.planning.data.gov.uk/entity/${constraint.entity}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 text-sm text-blue-600 hover:text-blue-800"
                        >
                          View details →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
