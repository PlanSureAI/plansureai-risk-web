'use client';

import { useState } from 'react';
import { Calculator, Building2, PoundSterling, FileText, AlertCircle } from 'lucide-react';

interface ProjectInputs {
  siteName: string;
  address: string;
  siteArea: number;
  developmentType: 'residential' | 'commercial' | 'mixed';
  units: number;
  grossInternalArea: number;
  affordableHousing: number;
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
  roi: number;
  viabilityStatus: 'viable' | 'marginal' | 'unviable';
}

export default function ViabilityCalculator() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [projectInputs, setProjectInputs] = useState<ProjectInputs>({
    siteName: '',
    address: '',
    siteArea: 0,
    developmentType: 'residential',
    units: 0,
    grossInternalArea: 0,
    affordableHousing: 30,
  });
  const [result, setResult] = useState<ViabilityResult | null>(null);

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
            <StepIndicator number={1} label="Project Details" active={step === 1} completed={step > 1} />
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
        ${active ? 'bg-blue-600 text-white' : completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}
      `}
      >
        {completed ? 'OK' : number}
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
  const canProceed = inputs.siteName && inputs.address && inputs.units > 0 && inputs.grossInternalArea > 0;

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
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Site Address *</label>
        <input
          type="text"
          value={inputs.address}
          onChange={(e) => onChange({ ...inputs, address: e.target.value })}
          placeholder="e.g., 10 Downing Street, London"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
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
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Development Type</label>
          <select
            value={inputs.developmentType}
            onChange={(e) => onChange({ ...inputs, developmentType: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
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
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
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
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        Continue to Cost Inputs ->
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
          <- Back
        </button>
        <button
          onClick={onCalculate}
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
        >
          {loading ? 'Calculating...' : 'Calculate Viability ->'}
        </button>
      </div>
    </div>
  );
}

function ResultsView({
  result,
  inputs,
  onReset,
}: {
  result: ViabilityResult;
  inputs: ProjectInputs;
  onReset: () => void;
}) {
  const totalCosts = Object.values(result.costs).reduce((sum, cost) => sum + cost, 0);

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

  const statusLabel =
    result.viabilityStatus === 'viable'
      ? 'Viable'
      : result.viabilityStatus === 'marginal'
        ? 'Marginal'
        : 'Unviable';

  const statusDescription =
    result.viabilityStatus === 'viable'
      ? 'meets'
      : result.viabilityStatus === 'marginal'
        ? 'marginally meets'
        : 'does not meet';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Viability Assessment</h2>
        <p className="text-gray-600">{inputs.siteName}</p>
      </div>

      {/* Status Badge */}
      <div className={`border rounded-lg p-6 text-center ${getStatusColor(result.viabilityStatus)}`}>
        <div className="text-4xl font-bold mb-2">{statusLabel}</div>
        <div className="text-sm opacity-80">
          This development {statusDescription} typical viability thresholds
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-1">Development Profit</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(result.profit)}</div>
          <div className="text-sm text-gray-500 mt-1">{result.profitMargin.toFixed(1)}% margin</div>
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

      {/* Cost Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <PoundSterling className="w-5 h-5 mr-2" />
          Cost Breakdown
        </h3>
        <div className="space-y-3">
          <CostLine label="Land Cost" value={result.costs.landCost} />
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
            * Construction costs based on BCIS Q4 2025 data for {inputs.developmentType} developments
          </li>
          <li>* Market values estimated using local comparable transactions</li>
          <li>* Professional fees calculated at 12% of construction costs</li>
          <li>* Finance costs assume 6.5% interest rate over 24-month development period</li>
          <li>* S106/CIL obligations estimated based on local authority requirements</li>
          <li>* Target profit margin: 20% on GDV for viability</li>
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
