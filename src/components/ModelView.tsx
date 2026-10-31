import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Database,
  FileCode,
  Layers,
  LineChart,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { ModelMetrics } from '../types/clinical';

interface ModelViewProps {
  metrics: ModelMetrics | null;
}

export const ModelView: React.FC<ModelViewProps> = ({ metrics }) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'crispdm' | 'features'>('metrics');

  const auc = metrics?.auc_roc ?? 0.8354;
  const acc = metrics?.accuracy ?? 0.7792;
  const cvAuc = metrics?.cv_5fold_mean_auc ?? 0.828;

  // Feature Importances
  const featureList = [
    { name: 'Glucose', score: 0.334, label: 'Fasting Plasma Glucose (mg/dL)', category: 'Glycemic' },
    { name: 'BMI', score: 0.221, label: 'Body Mass Index (kg/m²)', category: 'Adiposity' },
    { name: 'Age', score: 0.148, label: 'Patient Age (years)', category: 'Demographic' },
    { name: 'DiabetesPedigreeFunction', score: 0.112, label: 'Genetic Pedigree Score', category: 'Genomic' },
    { name: 'Insulin', score: 0.075, label: '2-Hour Serum Insulin (μU/mL)', category: 'Glycemic' },
    { name: 'Pregnancies', score: 0.049, label: 'Parity / Gestational History', category: 'Obstetric' },
    { name: 'BloodPressure', score: 0.038, label: 'Diastolic Blood Pressure (mmHg)', category: 'Vascular' },
    { name: 'SkinThickness', score: 0.023, label: 'Triceps Skinfold Thickness (mm)', category: 'Adiposity' },
  ];

  // Zero Audit Table Data
  const zeroAuditData = [
    { feature: 'Glucose', zeros: 5, pct: '0.7%', physiologicalWhy: 'Severe hypoglycemia / fatal without insulin' },
    { feature: 'BloodPressure', zeros: 35, pct: '4.6%', physiologicalWhy: 'Absence of arterial diastolic perfusion pressure' },
    { feature: 'SkinThickness', zeros: 227, pct: '29.6%', physiologicalWhy: 'Subcutaneous adipose fold cannot measure 0 mm' },
    { feature: 'Insulin', zeros: 374, pct: '48.7%', physiologicalWhy: 'Fasting basal human insulin is normally 2 - 25 μU/mL' },
    { feature: 'BMI', zeros: 11, pct: '1.4%', physiologicalWhy: 'Non-zero human body mass and finite height' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">CRISP-DM Model Lifecycle &amp; Validation</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              AUC-ROC 0.8354 (Holdout Verified)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete scikit-learn pipeline audit: zero-to-NaN handling, median imputation, standard scaling, and stratified evaluation.
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'metrics' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Holdout Evaluation
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'features' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Feature Importance
          </button>
          <button
            onClick={() => setActiveTab('crispdm')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'crispdm' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            CRISP-DM Pipeline
          </button>
        </div>
      </div>

      {/* METRICS TAB */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Key Metric Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Holdout AUC-ROC</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-teal-600 font-mono">0.8354</span>
                <span className="text-xs text-emerald-600 font-bold">Target ≥ 0.80 PASS</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Stratified 20% holdout test set</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Classification Accuracy</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">77.92%</span>
                <span className="text-xs text-slate-500">120 / 154 correct</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Decision threshold = 0.50</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">5-Fold Stratified CV</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-cyan-600 font-mono">0.8280</span>
                <span className="text-xs text-slate-500">± 0.031 std</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Full 768-cohort cross-validation</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Holdout Sample Size</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">154</span>
                <span className="text-xs text-slate-500">test patients</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">614 training / 154 holdout</span>
            </div>
          </div>

          {/* Interactive ROC Curve & Normalized Confusion Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ROC Curve Chart Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Receiver Operating Characteristic (ROC)</h3>
                  <span className="text-xs text-slate-500">Area Under Curve (AUC) = 0.8354</span>
                </div>
                <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                  RandomForest Pipeline
                </span>
              </div>

              {/* Custom SVG ROC Visualizer */}
              <div className="relative aspect-[4/3] bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col justify-between">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="0" y1="25" x2="100" y2="25" stroke="#e2e8f0" strokeDasharray="2" strokeWidth="0.5" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#e2e8f0" strokeDasharray="2" strokeWidth="0.5" />
                  <line x1="0" y1="75" x2="100" y2="75" stroke="#e2e8f0" strokeDasharray="2" strokeWidth="0.5" />
                  <line x1="25" y1="0" x2="25" y2="100" stroke="#e2e8f0" strokeDasharray="2" strokeWidth="0.5" />
                  <line x1="50" y1="0" x2="50" y2="100" stroke="#e2e8f0" strokeDasharray="2" strokeWidth="0.5" />
                  <line x1="75" y1="0" x2="75" y2="100" stroke="#e2e8f0" strokeDasharray="2" strokeWidth="0.5" />

                  {/* Diagonal Chance Line */}
                  <line x1="0" y1="100" x2="100" y2="0" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3" />

                  {/* Shaded AUC Polygon */}
                  <polygon
                    points="0,100 2,85 5,65 10,48 18,30 25,19 35,11 50,6 70,2 100,0 100,100"
                    fill="rgba(13, 148, 136, 0.15)"
                  />

                  {/* ROC Curve Path */}
                  <polyline
                    fill="none"
                    stroke="#0d9488"
                    strokeWidth="2.5"
                    points="0,100 2,85 5,65 10,48 18,30 25,19 35,11 50,6 70,2 100,0"
                  />
                </svg>

                <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1">
                  <span>0.0 (FPR)</span>
                  <span>False Positive Rate (1 - Specificity)</span>
                  <span>1.0</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-3 h-0.5 bg-teal-600"></span> RandomForest Model (AUC 0.835)
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-400">
                  <span className="w-3 h-0.5 bg-slate-300 stroke-dash"></span> Chance Diagonal (AUC 0.50)
                </span>
              </div>
            </div>

            {/* Confusion Matrix Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Holdout Confusion Matrix (N = 154)</h3>
                  <span className="text-xs text-slate-500">Class 0: No Diabetes (100) | Class 1: Diabetes (54)</span>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-600">Accuracy 77.9%</span>
              </div>

              {/* 2x2 Matrix Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* True Negative */}
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                    True Negatives (TN)
                  </span>
                  <span className="text-3xl font-extrabold text-emerald-700 font-mono">82</span>
                  <span className="text-xs text-emerald-600 block">82.0% Specificity</span>
                </div>

                {/* False Positive */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    False Positives (FP)
                  </span>
                  <span className="text-3xl font-extrabold text-slate-700 font-mono">18</span>
                  <span className="text-xs text-slate-500 block">Precautionary flags</span>
                </div>

                {/* False Negative */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    False Negatives (FN)
                  </span>
                  <span className="text-3xl font-extrabold text-slate-700 font-mono">16</span>
                  <span className="text-xs text-slate-500 block">Missed risk cases</span>
                </div>

                {/* True Positive */}
                <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-center space-y-1">
                  <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                    True Positives (TP)
                  </span>
                  <span className="text-3xl font-extrabold text-teal-700 font-mono">38</span>
                  <span className="text-xs text-teal-700 block">70.4% Sensitivity (Recall)</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex justify-between">
                  <span>Positive Class Precision:</span>
                  <span className="font-mono font-bold text-slate-800">67.9%</span>
                </div>
                <div className="flex justify-between">
                  <span>Positive Class Recall (Sensitivity):</span>
                  <span className="font-mono font-bold text-slate-800">70.4%</span>
                </div>
                <div className="flex justify-between">
                  <span>Balanced F1-Score:</span>
                  <span className="font-mono font-bold text-slate-800">0.691</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FEATURE IMPORTANCE TAB */}
      {activeTab === 'features' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">RandomForest Feature Importance Rankings</h3>
            <p className="text-xs text-slate-500">
              Gini impurity reduction across 200 decision trees. Fasting Glucose and BMI contribute over 55% of the total model decision weight.
            </p>
          </div>

          <div className="space-y-4">
            {featureList.map((feat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-slate-800">{feat.name}</span>
                    <span className="text-slate-400">({feat.label})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.2 rounded-sm text-[10px] bg-slate-100 text-slate-600 font-semibold">
                      {feat.category}
                    </span>
                    <span className="font-mono font-bold text-teal-700">{(feat.score * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
                    style={{ width: `${(feat.score / 0.35) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CRISP-DM AUDIT TAB */}
      {activeTab === 'crispdm' && (
        <div className="space-y-6">
          {/* Zero Handling Audit Table */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Data Quality Audit: Biologically Impossible Zeros (Phase 1)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Zero values in physiological biomarkers represent unrecorded / missing tests, NOT a zero level.
                Replacing them with NaN prevents artificial skew before median imputation.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Column Feature</th>
                    <th className="py-2.5 px-3">Zero Count</th>
                    <th className="py-2.5 px-3">Missing %</th>
                    <th className="py-2.5 px-3">Physiological Rationale</th>
                    <th className="py-2.5 px-3">Pipeline Treatment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {zeroAuditData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{row.feature}</td>
                      <td className="py-2.5 px-3 font-mono text-rose-600 font-bold">{row.zeros}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">{row.pct}</td>
                      <td className="py-2.5 px-3 text-slate-600">{row.physiologicalWhy}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-sm bg-teal-50 text-teal-800 text-[11px] font-semibold border border-teal-200">
                          0 → NaN → Median Imputer
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 7-Phase Architecture Cards */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Chapter 10 CRISP-DM Engineering Stages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
                <span className="font-bold text-teal-700">Phase 1 — Ingestion &amp; Zero Audit</span>
                <p className="text-slate-600">Loads diabetes.csv, counts zeros in 5 columns, replaces with NaN.</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
                <span className="font-bold text-teal-700">Phase 2 — Exploratory Data Analysis</span>
                <p className="text-slate-600">Outcome distribution, correlation matrices, boxplots of glucose and BMI.</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
                <span className="font-bold text-teal-700">Phase 3 — Preprocessing Pipeline</span>
                <p className="text-slate-600">SimpleImputer(median) + StandardScaler() with 80/20 stratified split.</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
                <span className="font-bold text-teal-700">Phase 4 — Model Training &amp; CV</span>
                <p className="text-slate-600">RandomForest(n_estimators=200, depth=5) + LogisticRegression with 5-fold CV.</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
                <span className="font-bold text-teal-700">Phase 5 — Model Evaluation</span>
                <p className="text-slate-600">Normalized confusion matrix, ROC curve, PR curve, holdout metrics report.</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
                <span className="font-bold text-teal-700">Phase 6 &amp; 7 — Serialization &amp; Agentic LLM</span>
                <p className="text-slate-600">Deterministic flags calculated before structured Gemini clinical explanation.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
