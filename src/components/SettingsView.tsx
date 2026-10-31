import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Database,
  Info,
  RotateCcw,
  Save,
  Shield,
  Sliders,
} from 'lucide-react';
import { MANDATORY_DISCLAIMER } from '../utils/mlEngine';

interface SettingsViewProps {
  alertThreshold: number;
  setAlertThreshold: (val: number) => void;
  disclaimerText: string;
  setDisclaimerText: (text: string) => void;
  onResetDatabase: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  alertThreshold,
  setAlertThreshold,
  disclaimerText,
  setDisclaimerText,
  onResetDatabase,
}) => {
  const [localThreshold, setLocalThreshold] = useState<number>(alertThreshold);
  const [localDisclaimer, setLocalDisclaimer] = useState<string>(disclaimerText);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  const handleSave = () => {
    setAlertThreshold(localThreshold);
    setDisclaimerText(localDisclaimer);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleResetDisclaimer = () => {
    setLocalDisclaimer(MANDATORY_DISCLAIMER);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">System Configuration &amp; Clinical Thresholds</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure automated ITDO alert triggers, diagnostic disclaimers, and model parameters.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-xs transition-colors"
        >
          {savedNotice ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Saved Settings</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* 1. Alert Trigger Threshold Configuration */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">ITDO Automated Alert Trigger Threshold</h3>
          </div>
          <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
            Cutoff: {(localThreshold * 100).toFixed(0)}%
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          When patient evaluations equal or exceed this risk probability cutoff, the system triggers an urgent{' '}
          <strong>Clinical Alert (OPEN)</strong> in the Triggers Layer, prompting immediate physician triage.
        </p>

        <div className="space-y-2 pt-2">
          <input
            type="range"
            min="0.50"
            max="0.90"
            step="0.05"
            value={localThreshold}
            onChange={(e) => setLocalThreshold(Number(e.target.value))}
            className="w-full accent-rose-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            aria-label="Alert trigger threshold slider"
          />
          <div className="flex justify-between text-xs text-slate-500 font-mono">
            <span>50% (High Sensitivity)</span>
            <span className="font-bold text-slate-800">70% (Standard Benchmark)</span>
            <span>90% (High Specificity)</span>
          </div>
        </div>
      </div>

      {/* 2. Mandatory Clinical Disclaimer Editor */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">Clinical Decision Support Disclaimer</h3>
          </div>
          <button
            onClick={handleResetDisclaimer}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Reset Default
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Enforced across all LLM prompts and output cards to safeguard clinical communication and satisfy medical AI
          governance guidelines.
        </p>

        <textarea
          rows={4}
          value={localDisclaimer}
          onChange={(e) => setLocalDisclaimer(e.target.value)}
          className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-medium text-slate-800 leading-relaxed"
          aria-label="Clinical Decision Support Disclaimer editor"
        />
      </div>

      {/* 3. System Architecture & Model Info */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Info className="w-4 h-4 text-cyan-600" />
          <h3 className="text-sm font-bold text-slate-900">Runtime Pipeline Metadata</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between">
            <span className="text-slate-500">Framework:</span>
            <span className="font-semibold text-slate-900">fullstack-analytics-builder (Ch. 10)</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between">
            <span className="text-slate-500">Model Version:</span>
            <span className="font-mono font-semibold text-slate-900">3.1.0 (RandomForest)</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between">
            <span className="text-slate-500">LLM Reasoner:</span>
            <span className="font-semibold text-slate-900">Gemini 3.8 Flash (Pydantic Schema)</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between">
            <span className="text-slate-500">Dataset Source:</span>
            <span className="font-semibold text-slate-900">UCI Pima Indians (768 records)</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onResetDatabase}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Reset Demo Cohort to Benchmark</span>
          </button>
        </div>
      </div>
    </div>
  );
};
