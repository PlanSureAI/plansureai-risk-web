'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Calculator, Building2, PoundSterling, FileText, AlertCircle } from 'lucide-react';
import { calculateRiskProfile } from '@/lib/risk/calculator';
import type {
  PlanningConstraint,
  PlanningRoute,
  PlanningRouteInfo,
  PlanningStatus,
  ProjectDetails,
  RiskProfile,
  ViabilityMetrics,
} from '@/lib/risk/types';
import { supabase } from '@/app/lib/supabaseClient';

interface ProjectInputs {
  siteName: string;
  address: string;
  siteArea: number;
  siteType: 'greenfield' | 'brownfield' | 'self-build';
  developerType: 'sme' | 'housing-association' | 'local-authority' | 'self-builder';
  developmentType: 'residential' | 'commercial' | 'mixed';
  units: number;
  grossInternalArea: number;
  affordableHousing: number;
  ownsLand: boolean;
  landPrice: number;
}

interface CostBreakdown {
  landCost: number;
  constructionCost: number;
  professionalFees: number;
  s106CIL: number;
  finance: number;
  contingency: number;
  marketing: number;
}

interface RevenueBreakdown {
  marketSales: number;
  affordableSales: number;
  totalRevenue: number;
}

interface ViabilityResult {
  costs: CostBreakdown;
  revenue: RevenueBreakdown;
  profit: number;
  profitMargin: number;
  profitIncludingLand: number;
  profitIncludingLandMargin: number;
  cashSurplusToUser: number;
  cashSurplusMargin: number;
  imputedLandValue: number;
  cashLandCost: number;
  roi: number;
  viabilityStatus: 'viable' | 'marginal' | 'unviable';
}

export default function ViabilityCalculator() {
  const searchParams = useSearchParams();
  const siteId = searchParams.get('siteId');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [projectInputs, setProjectInputs] = useState<ProjectInputs>({
    siteName: '',
    address: '',
    siteArea: 0,
    siteType: 'greenfield',
    developerType: 'sme',
    developmentType: 'residential',
    units: 0,
    grossInternalArea: 0,
    affordableHousing: 30,
    ownsLand: false,
    landPrice: 0,
  });
  const [result, setResult] = useState<ViabilityResult | null>(null);
  const [financingSchemes, setFinancingSchemes] = useState<any>(null);
  const [loadingFinancing, setLoadingFinancing] = useState(false);
  const [planningConstraints, setPlanningConstraints] = useState<PlanningConstraint[]>([]);
  const [planningLocation, setPlanningLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [loadingPlanning, setLoadingPlanning] = useState(false);
  const [planningError, setPlanningError] = useState<string | null>(null);
  const [planningRoute, setPlanningRoute] = useState<PlanningRouteInfo>({
    route: 'none',
    status: 'not-started',
  });

  useEffect(() => {
    if (!result || !projectInputs.units) {
      return;
    }

    const fetchFinancingSchemes = async () => {
      setLoadingFinancing(true);
      try {
        const isSME = projectInputs.developerType === 'sme';
        const isRegisteredProvider =
          projectInputs.developerType === 'housing-association' ||
          projectInputs.developerType === 'local-authority';
        const params = new URLSearchParams({
          projectType: projectInputs.developmentType || 'residential',
          units: projectInputs.units.toString(),
          isSME: isSME.toString(),
          isBrownfield: projectInputs.siteType === 'brownfield' ? 'true' : 'false',
          isSelfBuild: projectInputs.siteType === 'self-build' ? 'true' : 'false',
          affordablePercentage: projectInputs.affordableHousing.toString(),
          isRegisteredProvider: isRegisteredProvider.toString(),
        });

        const response = await fetch(`/api/financing-schemes?${params}`);
        const data = await response.json();
        setFinancingSchemes(data);
      } catch (error) {
        console.error('Error fetching financing schemes:', error);
      } finally {
        setLoadingFinancing(false);
      }
    };

    fetchFinancingSchemes();
  }, [
    result,
    projectInputs.units,
    projectInputs.developmentType,
    projectInputs.siteType,
    projectInputs.developerType,
    projectInputs.affordableHousing,
  ]);

  useEffect(() => {
    if (!result || !projectInputs.address.trim()) {
      setPlanningConstraints([]);
      setPlanningLocation(null);
      setPlanningError(null);
      return;
    }

    const fetchPlanningConstraints = async () => {
      setLoadingPlanning(true);
      setPlanningError(null);
      try {
        const geocodeResponse = await fetch(
          `/api/geocode?q=${encodeURIComponent(projectInputs.address)}`
        );
        const geocodeData = await geocodeResponse.json();

        if (!geocodeResponse.ok) {
          throw new Error(geocodeData.error || 'Failed to geocode address');
        }

        const coords = { lat: geocodeData.lat, lng: geocodeData.lng };
        setPlanningLocation(coords);

        const constraintsResponse = await fetch(
          `/api/planning-constraints?lat=${coords.lat}&lng=${coords.lng}&limit=100`
        );
        const constraintsData = await constraintsResponse.json();

        if (!constraintsResponse.ok) {
          throw new Error(constraintsData.error || 'Failed to fetch planning constraints');
        }

        const features = Array.isArray(constraintsData.features)
          ? constraintsData.features
          : [];
        setPlanningConstraints(mapConstraintsFromApi(features, coords));
      } catch (error) {
        console.error('Planning constraints fetch error:', error);
        setPlanningConstraints([]);
        setPlanningLocation(null);
        setPlanningError(
          error instanceof Error ? error.message : 'Unable to load planning datasets.'
        );
      } finally {
        setLoadingPlanning(false);
      }
    };

    fetchPlanningConstraints();
  }, [result, projectInputs.address]);

  const calculateViability = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/viability/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectInputs),
      });
      const data = await response.json();
      setResult(data);
      setStep(3);
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Calculator className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Development Viability Calculator
          </h1>
          <p className="text-gray-600">AI-powered viability assessment for development projects</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <StepIndicator
              number={1}
              label="Project Details"
              active={step === 1}
              completed={step > 1}
            />
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <StepIndicator number={2} label="Cost Inputs" active={step === 2} completed={step > 2} />
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <StepIndicator number={3} label="Results" active={step === 3} completed={false} />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {step === 1 && (
            <ProjectDetailsForm
              inputs={projectInputs}
              onChange={setProjectInputs}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <CostInputsForm
              inputs={projectInputs}
              onChange={setProjectInputs}
              onBack={() => setStep(1)}
              onCalculate={calculateViability}
              loading={loading}
            />
          )}

          {step === 3 && result && (
            <ResultsView
              result={result}
              inputs={projectInputs}
              financingSchemes={financingSchemes}
              loadingFinancing={loadingFinancing}
              planningConstraints={planningConstraints}
              planningLocation={planningLocation}
              loadingPlanning={loadingPlanning}
              planningError={planningError}
              planningRoute={planningRoute}
              setPlanningRoute={setPlanningRoute}
              siteId={siteId}
              onReset={() => {
                setStep(1);
                setResult(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function mapConstraintsFromApi(
  features: any[],
  origin: { lat: number; lng: number }
): PlanningConstraint[] {
  const allowedDatasets = new Set([
    'conservation-area',
    'listed-building',
    'article-4-direction-area',
    'tree-preservation-zone',
    'flood-risk-zone',
    'green-belt',
    'site-of-special-scientific-interest',
  ]);

  return features
    .map((feature) => {
      const dataset = feature?.properties?.dataset;
      if (!allowedDatasets.has(dataset)) {
        return null;
      }

      const point = extractPoint(feature);
      const distance =
        point && origin ? haversineMeters(origin, point) : feature?.properties?.distance;

      return {
        dataset,
        name: feature?.properties?.name,
        grade: feature?.properties?.grade || feature?.properties?.listed_building_grade,
        distance,
        severity: feature?.properties?.severity,
      } as PlanningConstraint;
    })
    .filter(Boolean) as PlanningConstraint[];
}

function extractPoint(feature: any): { lat: number; lng: number } | null {
  const pointString = feature?.properties?.point;
  if (typeof pointString === 'string' && pointString.startsWith('POINT')) {
    const match = pointString.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/);
    if (match) {
      return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
    }
  }

  const geometry = feature?.geometry;
  if (geometry?.type === 'Point' && Array.isArray(geometry.coordinates)) {
    const [lng, lat] = geometry.coordinates;
    if (typeof lat === 'number' && typeof lng === 'number') {
      return { lat, lng };
    }
  }

  if (geometry?.type === 'Polygon' && Array.isArray(geometry.coordinates)) {
    const ring = geometry.coordinates[0];
    const centroid = centroidFromRing(ring);
    if (centroid) {
      return centroid;
    }
  }

  if (geometry?.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
    let bestCentroid: { lat: number; lng: number } | null = null;
    let bestArea = 0;
    for (const polygon of geometry.coordinates) {
      const ring = Array.isArray(polygon) ? polygon[0] : null;
      const centroid = centroidFromRing(ring);
      if (centroid && centroid.area > bestArea) {
        bestArea = centroid.area;
        bestCentroid = { lat: centroid.lat, lng: centroid.lng };
      }
    }
    if (bestCentroid) {
      return bestCentroid;
    }
  }

  return null;
}

function centroidFromRing(
  ring: any
): { lat: number; lng: number; area: number } | null {
  if (!Array.isArray(ring) || ring.length === 0) {
    return null;
  }

  let area = 0;
  let cx = 0;
  let cy = 0;
  let validPoints = 0;

  for (let i = 0; i < ring.length; i += 1) {
    const current = ring[i];
    const next = ring[(i + 1) % ring.length];
    if (!Array.isArray(current) || !Array.isArray(next)) {
      continue;
    }
    const [x1, y1] = current;
    const [x2, y2] = next;
    if (
      typeof x1 !== 'number' ||
      typeof y1 !== 'number' ||
      typeof x2 !== 'number' ||
      typeof y2 !== 'number'
    ) {
      continue;
    }
    const cross = x1 * y2 - x2 * y1;
    area += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
    validPoints += 1;
  }

  if (validPoints === 0) {
    return null;
  }

  const signedArea = area / 2;
  const areaMagnitude = Math.abs(signedArea);

  if (areaMagnitude < 1e-12) {
    let sumLng = 0;
    let sumLat = 0;
    let count = 0;
    for (const point of ring) {
      if (!Array.isArray(point) || point.length < 2) {
        continue;
      }
      const [lng, lat] = point;
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        continue;
      }
      sumLng += lng;
      sumLat += lat;
      count += 1;
    }
    if (count === 0) {
      return null;
    }
    return { lat: sumLat / count, lng: sumLng / count, area: 0 };
  }

  return {
    lng: cx / (6 * signedArea),
    lat: cy / (6 * signedArea),
    area: areaMagnitude,
  };
}

function haversineMeters(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const deltaLat = toRad(to.lat - from.lat);
  const deltaLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function getStatusColor(status: PlanningStatus): string {
  switch (status) {
    case 'consented':
      return 'bg-green-100 text-green-800';
    case 'refused':
      return 'bg-red-100 text-red-800';
    case 'appealed':
      return 'bg-orange-100 text-orange-800';
    case 'in-progress':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getRouteLabel(route: PlanningRoute): string {
  switch (route) {
    case 'pip':
      return 'PiP';
    case 'pre-app':
      return 'Pre-App';
    case 'outline':
      return 'Outline';
    case 'full':
      return 'Full';
    case 'reserved-matters':
      return 'Reserved Matters';
    default:
      return 'Not Started';
  }
}

function StepIndicator({
  number,
  label,
  active,
  completed,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`
        w-10 h-10 rounded-full flex items-center justify-center font-semibold
        ${
          active
            ? 'bg-blue-600 text-white'
            : completed
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-600'
        }
      `}
      >
        {completed ? '✓' : number}
      </div>
      <span className="text-xs text-gray-600 mt-1">{label}</span>
    </div>
  );
}

function ProjectDetailsForm({
  inputs,
  onChange,
  onNext,
}: {
  inputs: ProjectInputs;
  onChange: (inputs: ProjectInputs) => void;
  onNext: () => void;
}) {
  const [validationErrors, setValidationErrors] = useState<{
    siteName?: string;
    address?: string;
    siteArea?: string;
    units?: string;
    grossInternalArea?: string;
    landPrice?: string;
  }>({});

  const computedErrors = useMemo(() => {
    const errors: typeof validationErrors = {};

    if (!inputs.siteName.trim()) {
      errors.siteName = 'Site name is required';
    }
    if (!inputs.address.trim()) {
      errors.address = 'Site address is required';
    }
    if (!inputs.siteArea || inputs.siteArea <= 0) {
      errors.siteArea = 'Site area must be greater than 0';
    }
    if (!inputs.units || inputs.units <= 0) {
      errors.units = 'Number of units must be greater than 0';
    }
    if (!inputs.grossInternalArea || inputs.grossInternalArea <= 0) {
      errors.grossInternalArea = 'Total GIA must be greater than 0';
    }
    if (!inputs.ownsLand && (!inputs.landPrice || inputs.landPrice <= 0)) {
      errors.landPrice = 'Land purchase price must be greater than 0';
    }

    return errors;
  }, [
    inputs.address,
    inputs.grossInternalArea,
    inputs.landPrice,
    inputs.ownsLand,
    inputs.siteArea,
    inputs.siteName,
    inputs.units,
  ]);

  useEffect(() => {
    setValidationErrors(computedErrors);
  }, [computedErrors]);

  const canProceed = Object.keys(computedErrors).length === 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Project Details</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Site Name *</label>
        <input
          type="text"
          value={inputs.siteName}
          onChange={(e) => onChange({ ...inputs, siteName: e.target.value })}
          placeholder="e.g., Riverside Development"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
        />
        {validationErrors.siteName && (
          <p className="text-sm text-red-600 mt-1">⚠️ {validationErrors.siteName}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Site Address *</label>
        <input
          type="text"
          value={inputs.address}
          onChange={(e) => onChange({ ...inputs, address: e.target.value })}
          placeholder="e.g., 10 Downing Street, London"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
        />
        {validationErrors.address && (
          <p className="text-sm text-red-600 mt-1">⚠️ {validationErrors.address}</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Site Area (hectares)
          </label>
          <input
            type="number"
            step="0.01"
            value={inputs.siteArea || ''}
            onChange={(e) => onChange({ ...inputs, siteArea: parseFloat(e.target.value) || 0 })}
            placeholder="0.5"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
          {validationErrors.siteArea && (
            <p className="text-sm text-red-600 mt-1">⚠️ {validationErrors.siteArea}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Development Type
          </label>
          <select
            value={inputs.developmentType}
            onChange={(e) => onChange({ ...inputs, developmentType: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          >
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="mixed">Mixed Use</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Units *</label>
          <input
            type="number"
            value={inputs.units || ''}
            onChange={(e) => onChange({ ...inputs, units: parseInt(e.target.value) || 0 })}
            placeholder="10"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
          {validationErrors.units && (
            <p className="text-sm text-red-600 mt-1">⚠️ {validationErrors.units}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Total GIA (sqm) *</label>
          <input
            type="number"
            value={inputs.grossInternalArea || ''}
            onChange={(e) =>
              onChange({ ...inputs, grossInternalArea: parseInt(e.target.value) || 0 })
            }
            placeholder="1000"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
          {validationErrors.grossInternalArea && (
            <p className="text-sm text-red-600 mt-1">⚠️ {validationErrors.grossInternalArea}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Affordable Housing (%)
        </label>
        <input
          type="number"
          min="0"
          max="100"
          value={inputs.affordableHousing}
          onChange={(e) => onChange({ ...inputs, affordableHousing: parseInt(e.target.value) || 0 })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Do you already own the land?
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...inputs, ownsLand: true })}
            className={`px-3 py-1.5 text-xs rounded-md border ${
              inputs.ownsLand ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'
            }`}
          >
            Yes - I or my company already own it
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...inputs, ownsLand: false })}
            className={`px-3 py-1.5 text-xs rounded-md border ${
              !inputs.ownsLand ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'
            }`}
          >
            No - I am buying it for this project
          </button>
        </div>
        {!inputs.ownsLand && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Land purchase price (GBP)
            </label>
            <input
              type="number"
              value={inputs.landPrice || ''}
              onChange={(e) => onChange({ ...inputs, landPrice: parseFloat(e.target.value) || 0 })}
              placeholder="e.g., 500000"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
            {validationErrors.landPrice && (
              <p className="text-sm text-red-600 mt-1">⚠️ {validationErrors.landPrice}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Developer Type</label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={inputs.developerType}
            onChange={(e) =>
              onChange({
                ...inputs,
                developerType: e.target.value as ProjectInputs['developerType'],
              })
            }
          >
            <option value="sme">SME Developer</option>
            <option value="housing-association">Housing Association</option>
            <option value="local-authority">Local Authority</option>
            <option value="self-builder">Self Builder</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Determines available financing schemes</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Site Type</label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={inputs.siteType}
            onChange={(e) =>
              onChange({ ...inputs, siteType: e.target.value as ProjectInputs['siteType'] })
            }
          >
            <option value="greenfield">Greenfield</option>
            <option value="brownfield">Brownfield</option>
            <option value="self-build">Self/Custom Build</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">May unlock additional grant funding</p>
        </div>
      </div>

      {!canProceed && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium mb-1">
            ⚠️ Please complete the following required fields:
          </p>
          <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
            {validationErrors.siteName && <li>{validationErrors.siteName}</li>}
            {validationErrors.address && <li>{validationErrors.address}</li>}
            {validationErrors.siteArea && <li>{validationErrors.siteArea}</li>}
            {validationErrors.units && <li>{validationErrors.units}</li>}
            {validationErrors.grossInternalArea && <li>{validationErrors.grossInternalArea}</li>}
            {validationErrors.landPrice && <li>{validationErrors.landPrice}</li>}
          </ul>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        Continue to Cost Inputs
      </button>
    </div>
  );
}

function CostInputsForm({
  inputs,
  onChange,
  onBack,
  onCalculate,
  loading,
}: {
  inputs: ProjectInputs;
  onChange: (inputs: ProjectInputs) => void;
  onBack: () => void;
  onCalculate: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Inputs</h2>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">AI-Powered Cost Estimation</p>
            <p className="text-blue-700">
              Our AI will automatically calculate construction costs, professional fees, and other
              expenses based on BCIS data and local market conditions. You can review and adjust
              these in the next step.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-md p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Project Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Site:</span>
            <span className="font-medium">{inputs.siteName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Units:</span>
            <span className="font-medium">{inputs.units}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total GIA:</span>
            <span className="font-medium">{inputs.grossInternalArea.toLocaleString()} sqm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Affordable Housing:</span>
            <span className="font-medium">{inputs.affordableHousing}%</span>
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={onBack}
          className="flex-1 bg-white text-gray-700 py-3 px-4 rounded-md font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onCalculate}
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
        >
          {loading ? 'Calculating...' : 'Calculate Viability'}
        </button>
      </div>
    </div>
  );
}

function ResultsView({
  result,
  inputs,
  financingSchemes,
  loadingFinancing,
  planningConstraints,
  planningLocation,
  loadingPlanning,
  planningError,
  planningRoute,
  setPlanningRoute,
  siteId,
  onReset,
}: {
  result: ViabilityResult;
  inputs: ProjectInputs;
  financingSchemes: any;
  loadingFinancing: boolean;
  planningConstraints: PlanningConstraint[];
  planningLocation: { lat: number; lng: number } | null;
  loadingPlanning: boolean;
  planningError: string | null;
  planningRoute: PlanningRouteInfo;
  setPlanningRoute: React.Dispatch<React.SetStateAction<PlanningRouteInfo>>;
  siteId: string | null;
  onReset: () => void;
}) {
  const totalCosts = Object.values(result.costs).reduce((sum, cost) => sum + cost, 0);
  const viabilityMetrics: ViabilityMetrics = useMemo(
    () => ({
      developmentProfit: result.profitIncludingLand,
      profitMargin: result.profitIncludingLandMargin,
      returnOnInvestment: result.roi,
      totalRevenue: result.revenue.totalRevenue,
      totalCosts,
      isViable: result.viabilityStatus === 'viable' || result.viabilityStatus === 'marginal',
      contingencyPercentage:
        result.costs.constructionCost > 0
          ? (result.costs.contingency / result.costs.constructionCost) * 100
          : undefined,
      totalDevelopmentCost: totalCosts,
    }),
    [result, totalCosts]
  );
  const projectDetails: ProjectDetails = useMemo(
    () => ({
      developmentType: inputs.developmentType === 'mixed' ? 'mixed-use' : inputs.developmentType,
      units: inputs.units,
      floorArea: inputs.grossInternalArea,
      hasAffordableHousing: inputs.affordableHousing > 0,
      affordableHousingPercentage: inputs.affordableHousing,
      ownsLand: inputs.ownsLand,
      landPrice: inputs.landPrice,
    }),
    [inputs]
  );
  const [openFlagId, setOpenFlagId] = useState<string | null>(null);
  const pathname = usePathname();
  const queryParams = useSearchParams();
  const riskProfile = useMemo(
    () =>
      calculateRiskProfile(
        {
          constraints: planningConstraints,
          viability: viabilityMetrics,
          project: projectDetails,
          location: planningLocation ?? { lat: 0, lng: 0 },
        },
        planningRoute
      ),
    [planningConstraints, planningLocation, planningRoute, projectDetails, viabilityMetrics]
  );
  const [savingRisk, setSavingRisk] = useState(false);
  const [saveRiskError, setSaveRiskError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteId) {
      return;
    }

    let cancelled = false;
    const saveRiskProfile = async () => {
      setSavingRisk(true);
      setSaveRiskError(null);
      const payload = {
        viability_assessment: viabilityMetrics,
        project_details: projectDetails,
        planning_route: planningRoute.route,
        planning_route_status: planningRoute.status,
        risk_level: riskProfile.riskLevel,
        risk_profile: {
          overallRiskScore: riskProfile.overallRiskScore,
          riskLevel: riskProfile.riskLevel,
          summary: riskProfile.summary,
          flags: riskProfile.flags.map((flag) => ({
            id: flag.id,
            level: flag.level,
            title: flag.title,
            message: flag.message,
            severity: flag.severity,
            category: flag.category,
          })),
          calculatedAt: riskProfile.calculatedAt.toISOString(),
        },
        last_assessed_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('sites').update(payload).eq('id', siteId);
      if (cancelled) {
        return;
      }
      if (error) {
        console.error('Error saving viability to site:', error);
        setSaveRiskError('Unable to save risk profile.');
      }
      setSavingRisk(false);
    };

    saveRiskProfile();

    return () => {
      cancelled = true;
    };
  }, [siteId, planningRoute, projectDetails, riskProfile, viabilityMetrics]);
  const riskLevelStyles: Record<string, string> = {
    LOW: 'bg-green-50 text-green-700 border-green-200',
    MEDIUM: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
    EXTREME: 'bg-red-50 text-red-700 border-red-200',
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'viable':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'marginal':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'unviable':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Viability Assessment</h2>
        <p className="text-gray-600">{inputs.siteName}</p>
      </div>

      {/* Status Badge */}
      <div className={`border rounded-lg p-6 text-center ${getStatusColor(result.viabilityStatus)}`}>
        <div className="text-4xl font-bold mb-2">
          {result.viabilityStatus === 'viable' && '✓ Viable'}
          {result.viabilityStatus === 'marginal' && '⚠ Marginal'}
          {result.viabilityStatus === 'unviable' && '✗ Unviable'}
        </div>
        <div className="text-sm opacity-80">
          This development{' '}
          {result.viabilityStatus === 'viable'
            ? 'meets'
            : result.viabilityStatus === 'marginal'
              ? 'marginally meets'
              : 'does not meet'}{' '}
          typical viability thresholds
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-1">Developer Profit (Lender View)</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(result.profitIncludingLand)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {result.profitIncludingLandMargin.toFixed(1)}% of GDV
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Includes land value, like a lender or valuer.
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-1">Cash Surplus to You</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(result.cashSurplusToUser)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {result.cashSurplusMargin.toFixed(1)}% of GDV
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {inputs.ownsLand
              ? 'You already own the land, so this is cash after build, fees, finance, and S106/CIL.'
              : 'Cash left after paying for land and all costs.'}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-1">Return on Investment</div>
          <div className="text-2xl font-bold text-gray-900">{result.roi.toFixed(1)}%</div>
          <div className="text-sm text-gray-500 mt-1">ROI on total costs</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(result.revenue.totalRevenue)}
          </div>
          <div className="text-sm text-gray-500 mt-1">{inputs.units} units</div>
        </div>
      </div>

      {/* Risk Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Risk Status</h3>
              <p className="text-sm text-gray-600">{riskProfile.summary}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm text-gray-500">Overall Risk Score</div>
                <div className="text-2xl font-bold text-gray-900">
                  {riskProfile.overallRiskScore.toFixed(1)}
                </div>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${
                  riskLevelStyles[riskProfile.riskLevel]
                }`}
              >
                {riskProfile.riskLevel}
              </span>
            </div>
            <ShareableLinkButton pathname={pathname} queryParams={queryParams} />
          </div>
          <div className="md:w-72">
            <RiskCategoryTable riskProfile={riskProfile} />
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold mb-3">Planning Route</h3>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-sm text-gray-600">Route:</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
              {getRouteLabel(planningRoute.route)}
            </span>
            <span className="text-sm text-gray-600">Status:</span>
            <span
              className={`px-3 py-1 rounded-md text-sm font-medium ${getStatusColor(
                planningRoute.status
              )}`}
            >
              {planningRoute.status
                .replace('-', ' ')
                .replace(/\b\w/g, (letter) => letter.toUpperCase())}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPlanningRoute({ ...planningRoute, route: 'pip', status: 'not-started' })}
              className={`px-3 py-1 text-xs rounded ${
                planningRoute.route === 'pip' ? 'bg-blue-600 text-white' : 'bg-white border'
              }`}
            >
              PiP
            </button>
            <button
              type="button"
              onClick={() =>
                setPlanningRoute({ ...planningRoute, route: 'pre-app', status: 'not-started' })
              }
              className={`px-3 py-1 text-xs rounded ${
                planningRoute.route === 'pre-app' ? 'bg-blue-600 text-white' : 'bg-white border'
              }`}
            >
              Pre-App
            </button>
            <button
              type="button"
              onClick={() =>
                setPlanningRoute({ ...planningRoute, route: 'outline', status: 'not-started' })
              }
              className={`px-3 py-1 text-xs rounded ${
                planningRoute.route === 'outline' ? 'bg-blue-600 text-white' : 'bg-white border'
              }`}
            >
              Outline
            </button>
            <button
              type="button"
              onClick={() => setPlanningRoute({ ...planningRoute, route: 'full', status: 'not-started' })}
              className={`px-3 py-1 text-xs rounded ${
                planningRoute.route === 'full' ? 'bg-blue-600 text-white' : 'bg-white border'
              }`}
            >
              Full
            </button>
          </div>
          {planningRoute.applicationReference && (
            <div className="mt-2 text-xs text-gray-600">
              Application: {planningRoute.applicationReference}
            </div>
          )}
        </div>
        {loadingPlanning && (
          <p className="mt-3 text-sm text-gray-500">Loading planning constraints...</p>
        )}
        {!loadingPlanning && planningError && (
          <div className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            Planning datasets could not be loaded; risk is based on viability inputs only.
          </div>
        )}
        {saveRiskError && (
          <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {saveRiskError}
          </div>
        )}
        {savingRisk && (
          <p className="mt-3 text-sm text-gray-500">Saving risk assessment...</p>
        )}
        <div className="mt-4 space-y-2">
          {riskProfile.flags.slice(0, 3).map((flag) => {
            const isOpen = openFlagId === flag.id;

            return (
              <div key={flag.id} className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <span>{flag.title}</span>
                      <span className="text-xs text-gray-500">{flag.level}</span>
                    </div>
                    <p className="text-sm text-gray-600">{flag.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenFlagId(isOpen ? null : flag.id)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    {isOpen ? 'Hide details' : 'Why this flag?'}
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-2 space-y-2 text-xs text-gray-600">
                    {flag.evidence && (
                      <p>
                        <span className="font-semibold text-gray-700">Evidence: </span>
                        {flag.evidence}
                      </p>
                    )}
                    {flag.mitigations && flag.mitigations.length > 0 && (
                      <div>
                        <span className="font-semibold text-gray-700">Mitigations:</span>
                        <ul className="mt-1 list-disc list-inside space-y-1">
                          {flag.mitigations.map((mitigation) => (
                            <li key={mitigation}>{mitigation}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Financing Opportunities */}
      {financingSchemes && (
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">
            💰 Available Financing & Grants
          </h3>

          {loadingFinancing ? (
            <div className="text-center py-4">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
              <p className="mt-2 text-gray-600">Loading financing options...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {financingSchemes.schemes.map((scheme: any, index: number) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    scheme.eligible ? 'bg-white border-blue-100' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4
                      className={`font-semibold ${
                        scheme.eligible ? 'text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      {scheme.eligible ? '✓' : '✗'} {scheme.name}
                    </h4>
                    {scheme.eligible && scheme.estimatedAmount && (
                      <span className="text-green-600 font-bold">
                        Up to £{scheme.estimatedAmount.toLocaleString()}
                      </span>
                    )}
                    {scheme.eligible && !scheme.estimatedAmount && scheme.maxAmount && (
                      <span className="text-green-600 font-bold">
                        Up to £{scheme.maxAmount.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{scheme.description}</p>

                  <p
                    className={`text-sm mb-3 ${
                      scheme.eligible ? 'text-green-700' : 'text-gray-600'
                    }`}
                  >
                    {scheme.reason}
                  </p>

                  {scheme.eligible && (
                    <>
                      {scheme.terms && (
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mb-3">
                          {scheme.terms.interestRate && (
                            <div>
                              <span className="font-medium">Interest Rate:</span>{' '}
                              {scheme.terms.interestRate}
                            </div>
                          )}
                          {scheme.terms.loanToValue && (
                            <div>
                              <span className="font-medium">LTV:</span> {scheme.terms.loanToValue}
                            </div>
                          )}
                          {scheme.terms.term && (
                            <div>
                              <span className="font-medium">Term:</span> {scheme.terms.term}
                            </div>
                          )}
                          {scheme.terms.equityLoan && (
                            <div>
                              <span className="font-medium">Equity Loan:</span>{' '}
                              {scheme.terms.equityLoan}
                            </div>
                          )}
                        </div>
                      )}

                      {scheme.features && scheme.features.length > 0 && (
                        <ul className="text-sm text-gray-700 space-y-1 mb-3">
                          {scheme.features.slice(0, 4).map((feature: string, idx: number) => (
                            <li key={idx}>✓ {feature}</li>
                          ))}
                        </ul>
                      )}

                      {scheme.eligibility && scheme.eligibility.improvementsRequired && (
                        <ul className="text-sm text-gray-700 space-y-1 mb-3">
                          {scheme.eligibility.improvementsRequired
                            .slice(0, 5)
                            .map((item: string, idx: number) => (
                              <li key={idx}>• {item}</li>
                            ))}
                        </ul>
                      )}

                      <a
                        href={scheme.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Learn more →
                      </a>
                    </>
                  )}
                </div>
              ))}

              {financingSchemes.totalPotentialFunding > 0 && (
                <div className="pt-4 border-t border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total Potential Funding:</span>
                    <span className="text-2xl font-bold text-green-600">
                      £{financingSchemes.totalPotentialFunding.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    * Subject to eligibility criteria and application approval
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cost Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <PoundSterling className="w-5 h-5 mr-2" />
          Cost Breakdown
        </h3>
        <div className="space-y-3">
          <CostLine
            label="Imputed land value (lender view)"
            value={result.imputedLandValue}
          />
          <div className="text-xs text-gray-500 -mt-2">
            What the land is worth in this appraisal. Used when calculating developer profit and risk.
          </div>
          <CostLine label="Cash land cost in this project" value={result.cashLandCost} />
          <div className="text-xs text-gray-500 -mt-2">
            {inputs.ownsLand
              ? '£0 – you already own the land; it’s treated as your equity, not a cash cost.'
              : 'What you actually pay for the land in this project.'}
          </div>
          
          <CostLine label="Construction Cost" value={result.costs.constructionCost} highlight />
          <CostLine label="Professional Fees" value={result.costs.professionalFees} />
          <CostLine label="S106 / CIL" value={result.costs.s106CIL} />
          <CostLine label="Finance Costs" value={result.costs.finance} />
          <CostLine label="Contingency" value={result.costs.contingency} />
          <CostLine label="Marketing & Sales" value={result.costs.marketing} />
          <div className="border-t border-gray-200 pt-3 mt-3">
            <CostLine label="Total Costs" value={totalCosts} bold />
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Building2 className="w-5 h-5 mr-2" />
          Revenue Breakdown
        </h3>
        <div className="space-y-3">
          <CostLine label="Market Sales" value={result.revenue.marketSales} highlight />
          <CostLine label="Affordable Sales" value={result.revenue.affordableSales} />
          <div className="border-t border-gray-200 pt-3 mt-3">
            <CostLine label="Total Revenue" value={result.revenue.totalRevenue} bold />
          </div>
        </div>
      </div>

      {/* Assumptions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          Key Assumptions
        </h3>
        <ul className="text-sm text-blue-900 space-y-2">
          <li>
            • Construction costs based on BCIS Q4 2025 data for {inputs.developmentType}
            developments
          </li>
          <li>• Market values estimated using local comparable transactions</li>
          <li>• Professional fees calculated at 12% of construction costs</li>
          <li>• Finance costs assume 6.5% interest rate over 24-month development period</li>
          <li>• S106/CIL obligations estimated based on local authority requirements</li>
          <li>• Target profit margin: 20% on GDV for viability</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={onReset}
          className="flex-1 bg-white text-gray-700 py-3 px-4 rounded-md font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          New Assessment
        </button>
        <button
          onClick={() => window.print()}
          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <FileText className="w-5 h-5 mr-2" />
          Export Report
        </button>
      </div>
    </div>
  );
}

function ShareableLinkButton({
  pathname,
  queryParams,
}: {
  pathname: string;
  queryParams: ReturnType<typeof useSearchParams>;
}) {
  const handleCopy = async () => {
    const qs = queryParams.toString();
    const url = qs
      ? `${window.location.origin}${pathname}?${qs}`
      : `${window.location.origin}${pathname}`;

    try {
      await navigator.clipboard.writeText(url);
    } catch (error) {
      console.error('Failed to copy link', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
    >
      Copy shareable link
    </button>
  );
}

function RiskCategoryTable({ riskProfile }: { riskProfile: RiskProfile }) {
  const categoryLabels: Record<string, string> = {
    planning: 'Planning',
    financial: 'Financial',
    deliverability: 'Deliverability',
    market: 'Market',
  };

  const entries = Object.entries(riskProfile.categories);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-xs">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left font-semibold text-slate-700">Category</th>
            <th className="px-3 py-2 text-right font-semibold text-slate-700">Weight</th>
            <th className="px-3 py-2 text-right font-semibold text-slate-700">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {entries.map(([key, category]) => (
            <tr key={key}>
              <td className="px-3 py-1.5 text-slate-800">
                {categoryLabels[key] ?? key}
              </td>
              <td className="px-3 py-1.5 text-right text-slate-600">
                {Math.round((category.weight ?? 0) * 100)}%
              </td>
              <td className="px-3 py-1.5 text-right text-slate-800">
                {Math.round(category.score)}/{category.maxPossibleScore}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CostLine({
  label,
  value,
  bold,
  highlight,
}: {
  label: string;
  value: number;
  bold?: boolean;
  highlight?: boolean;
}) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div
      className={`flex justify-between items-center ${
        highlight ? 'bg-blue-50 -mx-3 px-3 py-2 rounded' : ''
      }`}
    >
      <span className={`text-gray-700 ${bold ? 'font-semibold' : ''}`}>{label}</span>
      <span className={`${bold ? 'font-bold text-gray-900' : 'text-gray-900'}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}
