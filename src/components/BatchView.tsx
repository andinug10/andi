import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Filter,
  Play,
  RotateCcw,
  Search,
  Upload,
} from 'lucide-react';
import { PredictionResult, PatientFeatures } from '../types/clinical';
import {
  predictDiabetesProbability,
  flagAbnormalFeatures,
  determineRiskLevel,
  generateDeterministicExplanation,
} from '../utils/mlEngine';

interface BatchViewProps {
  onAddBatchPredictions: (results: PredictionResult[]) => void;
  onSelectPrediction: (pred: PredictionResult) => void;
  alertThreshold: number;
}

export const BatchView: React.FC<BatchViewProps> = ({
  onAddBatchPredictions,
  onSelectPrediction,
  alertThreshold,
}) => {
  const [batchResults, setBatchResults] = useState<PredictionResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filterRisk, setFilterRisk] = useState<'all' | 'high' | 'moderate' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [csvFileName, setCsvFileName] = useState<string>('');

  // 1-Click Load Sample Patients from dataset
  const handleLoadSampleBatch = async () => {
    setIsLoading(true);
    setCsvFileName('pima_diabetes_cohort_sample.csv');
    try {
      const res = await fetch('/api/sample-batch');
      if (res.ok) {
        const rawList = await res.json();
        processPatientList(rawList);
      }
    } catch (err) {
      console.error('Error fetching sample batch:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Process raw patient records into full prediction results
  const processPatientList = (list: any[]) => {
    const results: PredictionResult[] = list.map((item, idx) => {
      const feat: PatientFeatures = {
        pregnancies: Number(item.pregnancies ?? item.Pregnancies ?? 0),
        glucose: Number(item.glucose ?? item.Glucose ?? 0),
        bloodPressure: Number(item.bloodPressure ?? item.BloodPressure ?? 0),
        skinThickness: Number(item.skinThickness ?? item.SkinThickness ?? 0),
        insulin: Number(item.insulin ?? item.Insulin ?? 0),
        bmi: Number(item.bmi ?? item.BMI ?? 0),
        diabetesPedigree: Number(item.diabetesPedigree ?? item.DiabetesPedigreeFunction ?? 0),
        age: Number(item.age ?? item.Age ?? 30),
      };

      const proba = predictDiabetesProbability(feat);
      const flags = flagAbnormalFeatures(feat);
      const expl = generateDeterministicExplanation(proba, flags);

      return {
        id: `batch-${Date.now()}-${idx}`,
        patient_ref: item.patient_ref || `PT-${8100 + idx}`,
        features: feat,
        probability: proba,
        risk_level: expl.risk_level,
        flags,
        key_factors: expl.key_factors,
        recommendation: expl.recommendation,
        disclaimer: expl.disclaimer,
        created_at: new Date().toISOString(),
        model_version: '3.1.0',
      };
    });

    setBatchResults(results);
    onAddBatchPredictions(results);
  };

  // File Upload Handler (CSV parsing)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.trim().split('\n');
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const pIdx = headers.findIndex((h) => h.includes('preg'));
      const gIdx = headers.findIndex((h) => h.includes('gluc'));
      const bpIdx = headers.findIndex((h) => h.includes('blood') || h.includes('bp'));
      const sIdx = headers.findIndex((h) => h.includes('skin'));
      const insIdx = headers.findIndex((h) => h.includes('insul'));
      const bmiIdx = headers.findIndex((h) => h.includes('bmi'));
      const pedIdx = headers.findIndex((h) => h.includes('pedigree'));
      const ageIdx = headers.findIndex((h) => h.includes('age'));

      const parsedList = [];
      for (let i = 1; i < lines.length && i <= 200; i++) {
        const row = lines[i].split(',').map((v) => Number(v.trim()));
        if (row.length < 8) continue;
        parsedList.push({
          patient_ref: `PT-${9000 + i}`,
          pregnancies: row[pIdx !== -1 ? pIdx : 0] || 0,
          glucose: row[gIdx !== -1 ? gIdx : 1] || 0,
          bloodPressure: row[bpIdx !== -1 ? bpIdx : 2] || 0,
          skinThickness: row[sIdx !== -1 ? sIdx : 3] || 0,
          insulin: row[insIdx !== -1 ? insIdx : 4] || 0,
          bmi: row[bmiIdx !== -1 ? bmiIdx : 5] || 0,
          diabetesPedigree: row[pedIdx !== -1 ? pedIdx : 6] || 0,
          age: row[ageIdx !== -1 ? ageIdx : 7] || 30,
        });
      }

      processPatientList(parsedList);
      setIsLoading(false);
    };

    reader.readAsText(file);
  };

  // Export results to CSV
  const handleExportCSV = () => {
    if (batchResults.length === 0) return;

    const headers = [
      'PatientRef',
      'Pregnancies',
      'Glucose',
      'BloodPressure',
      'SkinThickness',
      'Insulin',
      'BMI',
      'DiabetesPedigreeFunction',
      'Age',
      'Probability',
      'RiskLevel',
      'AbnormalFlags',
    ];

    const rows = batchResults.map((r) => [
      r.patient_ref,
      r.features.pregnancies,
      r.features.glucose,
      r.features.bloodPressure,
      r.features.skinThickness,
      r.features.insulin,
      r.features.bmi,
      r.features.diabetesPedigree,
      r.features.age,
      r.probability,
      r.risk_level,
      `"${r.flags.join('; ')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diabetes_predictions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtering
  const filteredResults = batchResults.filter((r) => {
    const matchesRisk = filterRisk === 'all' || r.risk_level === filterRisk;
    const matchesSearch =
      r.patient_ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.flags.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRisk && matchesSearch;
  });

  // Summary Metrics
  const totalCount = batchResults.length;
  const highCount = batchResults.filter((r) => r.risk_level === 'high').length;
  const modCount = batchResults.filter((r) => r.risk_level === 'moderate').length;
  const lowCount = batchResults.filter((r) => r.risk_level === 'low').length;
  const avgProba = totalCount > 0 ? batchResults.reduce((acc, r) => acc + r.probability, 0) / totalCount : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Area */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Batch Patient Ingestion &amp; Stratification</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200">
              CSV Ingestion (Max 200)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bulk-evaluate population health cohorts against the CRISP-DM model pipeline and automated flag triggers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadSampleBatch}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 shadow-xs transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Load 20 Benchmark Patients</span>
          </button>

          <label
            htmlFor="batch-csv-upload"
            className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>Upload CSV</span>
            <input
              id="batch-csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {/* Cohort Summary Bar (If batch active) */}
      {batchResults.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Cohort Size</span>
            <span className="block text-xl font-bold text-slate-900 mt-1">{totalCount} patients</span>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-rose-700 uppercase">High Risk (≥ 70%)</span>
            <span className="block text-xl font-bold text-rose-700 mt-1">
              {highCount} ({((highCount / totalCount) * 100).toFixed(0)}%)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-amber-800 uppercase">Moderate Risk</span>
            <span className="block text-xl font-bold text-amber-800 mt-1">
              {modCount} ({((modCount / totalCount) * 100).toFixed(0)}%)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase">Low Risk</span>
            <span className="block text-xl font-bold text-emerald-800 mt-1">
              {lowCount} ({((lowCount / totalCount) * 100).toFixed(0)}%)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Mean Probability</span>
            <span className="block text-xl font-bold text-slate-900 mt-1">{(avgProba * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* Table & Filtering Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient ref or flag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none w-52"
              />
            </div>

            {/* Risk filter buttons */}
            <div className="flex items-center rounded-lg border border-slate-300 bg-white p-0.5 text-xs">
              {(['all', 'high', 'moderate', 'low'] as const).map((risk) => (
                <button
                  key={risk}
                  onClick={() => setFilterRisk(risk)}
                  className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                    filterRisk === risk ? 'bg-teal-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {risk}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {batchResults.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV ({filteredResults.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Empty State if no batch loaded */}
        {batchResults.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <h3 className="text-sm font-bold text-slate-800">No Patient Cohort Loaded</h3>
              <p className="text-xs text-slate-500">
                Click below to instantly load 20 stratified patients from the Pima Indians Diabetes benchmark dataset, or
                upload your own clinical CSV file.
              </p>
            </div>
            <button
              onClick={handleLoadSampleBatch}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-xs"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Load 20 Benchmark Patients</span>
            </button>
          </div>
        ) : (
          /* Data Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Patient Ref</th>
                  <th className="py-3 px-2">Age</th>
                  <th className="py-3 px-2">Glucose</th>
                  <th className="py-3 px-2">BP (mmHg)</th>
                  <th className="py-3 px-2">BMI</th>
                  <th className="py-3 px-2">Insulin</th>
                  <th className="py-3 px-3">Probability</th>
                  <th className="py-3 px-3">Risk Tier</th>
                  <th className="py-3 px-4">Abnormal Flags</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResults.map((res) => {
                  const isHigh = res.risk_level === 'high';
                  const isMod = res.risk_level === 'moderate';
                  return (
                    <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{res.patient_ref}</td>
                      <td className="py-2.5 px-2 text-slate-600">{res.features.age}y</td>
                      <td className="py-2.5 px-2 font-mono">
                        <span
                          className={
                            res.features.glucose > 99
                              ? 'text-rose-600 font-bold'
                              : 'text-slate-700'
                          }
                        >
                          {res.features.glucose}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-mono">{res.features.bloodPressure}</td>
                      <td className="py-2.5 px-2 font-mono">
                        <span
                          className={
                            res.features.bmi >= 30
                              ? 'text-rose-600 font-bold'
                              : res.features.bmi > 24.9
                              ? 'text-amber-600 font-bold'
                              : 'text-slate-700'
                          }
                        >
                          {res.features.bmi.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-mono text-slate-600">
                        {res.features.insulin > 0 ? res.features.insulin : '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                isHigh ? 'bg-rose-500' : isMod ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${res.probability * 100}%` }}
                            ></div>
                          </div>
                          <span className="font-mono font-bold text-slate-900">
                            {(res.probability * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                            isHigh
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isMod
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {res.risk_level}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        {res.flags.length === 0 ? (
                          <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Normal range
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            <span className="px-1.5 py-0.5 rounded-sm bg-rose-50 text-rose-800 text-[10px] font-medium border border-rose-200 truncate">
                              {res.flags[0]}
                            </span>
                            {res.flags.length > 1 && (
                              <span className="px-1 py-0.5 rounded-sm bg-slate-100 text-slate-600 text-[10px] font-bold">
                                +{res.flags.length - 1} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => onSelectPrediction(res)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-md transition-colors"
                        >
                          Review Case
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
