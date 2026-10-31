import React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Gauge,
  Layers,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { PredictionResult, ClinicalAlert, ClinicalTask } from '../types/clinical';

interface DashboardViewProps {
  predictions: PredictionResult[];
  alerts: ClinicalAlert[];
  tasks: ClinicalTask[];
  onNavigate: (tab: string) => void;
  onSelectPrediction: (pred: PredictionResult) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  predictions,
  alerts,
  tasks,
  onNavigate,
  onSelectPrediction,
}) => {
  const openAlerts = alerts.filter((a) => a.status === 'OPEN');
  const pendingTasks = tasks.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS');
  const highRiskCount = predictions.filter((p) => p.risk_level === 'high').length;
  const modRiskCount = predictions.filter((p) => p.risk_level === 'moderate').length;
  const lowRiskCount = predictions.filter((p) => p.risk_level === 'low').length;

  return (
    <div className="space-y-6">
      {/* Top Banner: Clinical Problem & ITDO Loop */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 md:p-8 text-white shadow-md border border-slate-800">
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CRISP-DM Lifecycle + Agentic ML Architecture (Chapter 10)</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Proactive Type-2 Diabetes Risk Stratification &amp; Clinical Decision Support
          </h1>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            Eliminates reactive diagnostic delays by evaluating routine metabolic biomarkers via an audited ML Pipeline
            (AUC 0.835), deterministic physiological guardrails, and structured Gemini clinical explanations across the
            full <strong>ITDO Loop</strong> (Insights → Triggers → Decisions → Operations).
          </p>

          {/* ITDO Framework Steps */}
          <div className="pt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="font-bold text-teal-300 block mb-0.5">1. INSIGHTS</span>
              <span className="text-slate-300">ML Probability + Deterministic Flags</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="font-bold text-rose-300 block mb-0.5">2. TRIGGERS</span>
              <span className="text-slate-300">Automated Alert at ≥ 70% Cutoff</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="font-bold text-amber-300 block mb-0.5">3. DECISIONS</span>
              <span className="text-slate-300">Structured LLM Clinical Pathways</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="font-bold text-emerald-300 block mb-0.5">4. OPERATIONS</span>
              <span className="text-slate-300">Kanban Intervention Task Tracking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Patients */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-teal-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patients Evaluated</span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{predictions.length}</span>
            <span className="text-xs text-slate-500">records in cohort</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>{highRiskCount} High</span>
            <span className="text-slate-300">|</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>{modRiskCount} Mod</span>
            <span className="text-slate-300">|</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{lowRiskCount} Low</span>
          </div>
        </div>

        {/* Card 2: Open Alerts (Triggers) */}
        <div
          onClick={() => onNavigate('alerts')}
          className="cursor-pointer p-5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-rose-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Alerts</span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">{openAlerts.length}</span>
            <span className="text-xs text-slate-500">open (≥ 70% risk)</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-rose-700 font-medium">
            <span>Requires clinical triage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 3: Model Performance */}
        <div
          onClick={() => onNavigate('model')}
          className="cursor-pointer p-5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-teal-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Model AUC-ROC</span>
            <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">0.8354</span>
            <span className="text-xs font-semibold text-emerald-600">≥ 0.80 benchmark</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
            <span>Holdout Accuracy: <strong>77.9%</strong> (5-Fold: 0.828)</span>
          </div>
        </div>

        {/* Card 4: Operations Tasks */}
        <div
          onClick={() => onNavigate('tasks')}
          className="cursor-pointer p-5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Intervention Tasks</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{pendingTasks.length}</span>
            <span className="text-xs text-slate-500">pending operations</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-amber-700 font-medium">
            <span>Open Kanban board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Cohort Risk Distribution & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Cohort Predictions */}
        <div className="lg:col-span-2 rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Patient Risk Evaluations</h2>
              <p className="text-xs text-slate-500">Latest predictions evaluated by ML pipeline and deterministic flags</p>
            </div>
            <button
              onClick={() => onNavigate('predict')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>New Patient</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1">
            {predictions.slice(0, 6).map((pred) => {
              const isHigh = pred.risk_level === 'high';
              const isMod = pred.risk_level === 'moderate';
              return (
                <div
                  key={pred.id}
                  onClick={() => onSelectPrediction(pred)}
                  className="py-3 px-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                        isHigh
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : isMod
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {(pred.probability * 100).toFixed(0)}%
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">{pred.patient_ref}</span>
                        <span className="text-[11px] text-slate-400">
                          Age {pred.features.age} • Glucose {pred.features.glucose} • BMI {pred.features.bmi}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {pred.flags.length > 0 ? pred.flags[0] : 'All routine biomarkers within reference interval'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md uppercase tracking-wider ${
                        isHigh
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : isMod
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {pred.risk_level} Risk
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-1">
                      {new Date(pred.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Fast Launchpad & Normal Ranges Reference */}
        <div className="space-y-4">
          {/* Quick Actions Card */}
          <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Clinical Navigation Shortcuts</h3>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('predict')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-teal-600 text-white flex items-center justify-center">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-900">Single Predictor</span>
                    <span className="text-[11px] text-slate-500">Live sliders with 300ms debounce</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('batch')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-cyan-50 hover:border-cyan-300 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-cyan-600 text-white flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-900">Batch CSV Upload</span>
                    <span className="text-[11px] text-slate-500">Analyze up to 200 patient profiles</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('tasks')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-amber-600 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-900">Clinical Kanban</span>
                    <span className="text-[11px] text-slate-500">Execute ITDO Operations</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Hard-Coded Normal Reference Card */}
          <div className="rounded-xl bg-teal-900/5 border border-teal-100 p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-teal-700" />
              <span className="text-xs font-bold text-teal-900">Deterministic Cutoffs Reference</span>
            </div>
            <div className="text-[11px] space-y-1.5 text-slate-600">
              <div className="flex justify-between border-b border-teal-100/60 pb-1">
                <span>Fasting Glucose:</span>
                <span className="font-mono font-medium text-slate-800">70 - 99 mg/dL</span>
              </div>
              <div className="flex justify-between border-b border-teal-100/60 pb-1">
                <span>Diastolic BP:</span>
                <span className="font-mono font-medium text-slate-800">60 - 80 mmHg</span>
              </div>
              <div className="flex justify-between border-b border-teal-100/60 pb-1">
                <span>BMI Range:</span>
                <span className="font-mono font-medium text-slate-800">18.5 - 24.9 kg/m²</span>
              </div>
              <div className="flex justify-between">
                <span>Screening Age:</span>
                <span className="font-mono font-medium text-slate-800">0 - 120 years</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
