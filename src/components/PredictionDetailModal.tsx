import React from 'react';
import { X, Activity, ShieldAlert, CheckCircle2, BookmarkPlus } from 'lucide-react';
import { PredictionResult } from '../types/clinical';

interface PredictionDetailModalProps {
  prediction: PredictionResult | null;
  onClose: () => void;
  onCreateAlert: (prediction: PredictionResult) => void;
}

export const PredictionDetailModal: React.FC<PredictionDetailModalProps> = ({
  prediction,
  onClose,
  onCreateAlert,
}) => {
  if (!prediction) return null;

  const isHigh = prediction.risk_level === 'high';
  const isMod = prediction.risk_level === 'moderate';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Patient Case Review: {prediction.patient_ref}
              </h3>
              <span className="text-xs text-slate-500">
                Evaluated {new Date(prediction.created_at).toLocaleString()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Risk Level Banner */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            isHigh
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : isMod
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider block">Assigned Risk Category</span>
            <span className="text-xl font-extrabold capitalize">{prediction.risk_level} Risk</span>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold font-mono">
              {(prediction.probability * 100).toFixed(1)}%
            </span>
            <span className="block text-[11px]">Diabetes Probability</span>
          </div>
        </div>

        {/* Feature Matrix Breakdown */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-800">Evaluated Physiological Biomarkers:</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Glucose:</span>
              <span className="font-mono font-bold text-slate-900">{prediction.features.glucose} mg/dL</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px]">BMI:</span>
              <span className="font-mono font-bold text-slate-900">{prediction.features.bmi.toFixed(1)} kg/m²</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Blood Pressure:</span>
              <span className="font-mono font-bold text-slate-900">{prediction.features.bloodPressure} mmHg</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Age:</span>
              <span className="font-mono font-bold text-slate-900">{prediction.features.age} years</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Insulin:</span>
              <span className="font-mono font-bold text-slate-900">{prediction.features.insulin || '—'} μU/mL</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Pedigree:</span>
              <span className="font-mono font-bold text-slate-900">{prediction.features.diabetesPedigree.toFixed(2)}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Pregnancies:</span>
              <span className="font-mono font-bold text-slate-900">{prediction.features.pregnancies}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Skin Thickness:</span>
              <span className="font-mono font-bold text-slate-900">{prediction.features.skinThickness || '—'} mm</span>
            </div>
          </div>
        </div>

        {/* Deterministic Flags */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-teal-600" />
            Deterministic Flags ({prediction.flags.length}):
          </span>
          {prediction.flags.length === 0 ? (
            <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-md">
              All measured parameters are within standard physiological reference intervals.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {prediction.flags.map((f, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 text-[11px] font-medium border border-rose-200"
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Structured Recommendation */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-800">Clinical Recommendation:</span>
          <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed font-medium">
            {prediction.recommendation}
          </p>
        </div>

        {/* Disclaimer */}
        <div className="p-2.5 rounded-lg bg-amber-50 text-[11px] text-amber-900 leading-normal border border-amber-200">
          <strong>Mandatory Disclaimer:</strong> {prediction.disclaimer}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onCreateAlert(prediction);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-xs transition-colors"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Create Alert from Case</span>
          </button>
        </div>
      </div>
    </div>
  );
};
