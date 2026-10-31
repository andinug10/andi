import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BookmarkPlus,
  Check,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Info,
  RotateCcw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { PatientFeatures, ClinicalExplanation, PredictionResult } from '../types/clinical';
import {
  predictDiabetesProbability,
  flagAbnormalFeatures,
  determineRiskLevel,
  generateDeterministicExplanation,
  NORMAL_RANGES,
  MANDATORY_DISCLAIMER,
} from '../utils/mlEngine';

interface PredictViewProps {
  onSavePrediction: (result: PredictionResult, triggerAlert: boolean) => void;
  disclaimerText: string;
  alertThreshold: number;
}

const PRESET_PATIENTS: { name: string; desc: string; data: PatientFeatures }[] = [
  {
    name: 'High Risk Type-2 Diabetic',
    desc: 'Markedly elevated fasting glucose and severe obesity',
    data: {
      pregnancies: 6,
      glucose: 172,
      bloodPressure: 88,
      skinThickness: 38,
      insulin: 260,
      bmi: 38.4,
      diabetesPedigree: 0.82,
      age: 51,
    },
  },
  {
    name: 'Healthy Normal Control',
    desc: 'All physiological biomarkers well within normal limits',
    data: {
      pregnancies: 1,
      glucose: 84,
      bloodPressure: 68,
      skinThickness: 22,
      insulin: 65,
      bmi: 22.4,
      diabetesPedigree: 0.22,
      age: 25,
    },
  },
  {
    name: 'Impaired Fasting Glucose (Prediabetes)',
    desc: 'Borderline glucose and overweight BMI',
    data: {
      pregnancies: 3,
      glucose: 114,
      bloodPressure: 78,
      skinThickness: 28,
      insulin: 140,
      bmi: 28.5,
      diabetesPedigree: 0.45,
      age: 42,
    },
  },
  {
    name: 'Gestational & Familial Genetic Risk',
    desc: 'Multiparity with strong diabetes pedigree heritage',
    data: {
      pregnancies: 8,
      glucose: 135,
      bloodPressure: 82,
      skinThickness: 32,
      insulin: 180,
      bmi: 32.1,
      diabetesPedigree: 1.15,
      age: 38,
    },
  },
];

export const PredictView: React.FC<PredictViewProps> = ({
  onSavePrediction,
  disclaimerText,
  alertThreshold,
}) => {
  const [patientRef, setPatientRef] = useState<string>(() => `PT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [features, setFeatures] = useState<PatientFeatures>({
    pregnancies: 2,
    glucose: 138,
    bloodPressure: 82,
    skinThickness: 30,
    insulin: 145,
    bmi: 31.2,
    diabetesPedigree: 0.54,
    age: 45,
  });

  // Debounced features for live 300ms calculations
  const [debouncedFeatures, setDebouncedFeatures] = useState<PatientFeatures>(features);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiExplanation, setAiExplanation] = useState<ClinicalExplanation | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // 300ms debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFeatures(features);
    }, 300);
    return () => clearTimeout(handler);
  }, [features]);

  // Fast mathematical calculation on debounced features
  const probability = useMemo(() => {
    return predictDiabetesProbability(debouncedFeatures);
  }, [debouncedFeatures]);

  const flags = useMemo(() => {
    return flagAbnormalFeatures(debouncedFeatures);
  }, [debouncedFeatures]);

  const riskLevel = useMemo(() => {
    return determineRiskLevel(probability);
  }, [probability]);

  // When probability changes or flags change, reset AI explanation to null or fallback
  useEffect(() => {
    setAiExplanation(null);
  }, [debouncedFeatures]);

  // Active explanation: either from AI response or high-fidelity deterministic fallback
  const currentExplanation = useMemo(() => {
    if (aiExplanation) return aiExplanation;
    return generateDeterministicExplanation(probability, flags);
  }, [aiExplanation, probability, flags]);

  const isAboveThreshold = probability >= alertThreshold;

  // Request server-side Gemini Clinical Explanation
  const handleRequestAiExplanation = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_ref: patientRef,
          features: debouncedFeatures,
          threshold: alertThreshold,
          create_alert: false,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiExplanation({
          risk_level: data.risk_level,
          key_factors: data.key_factors,
          recommendation: data.recommendation,
          disclaimer: data.disclaimer || disclaimerText || MANDATORY_DISCLAIMER,
        });
      }
    } catch (err) {
      console.error('Failed to get Gemini explanation:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSave = () => {
    const result: PredictionResult = {
      id: `pred-${Date.now()}`,
      patient_ref: patientRef,
      features: debouncedFeatures,
      probability,
      risk_level: riskLevel,
      flags,
      key_factors: currentExplanation.key_factors,
      recommendation: currentExplanation.recommendation,
      disclaimer: disclaimerText || MANDATORY_DISCLAIMER,
      created_at: new Date().toISOString(),
      model_version: '3.1.0',
    };

    onSavePrediction(result, isAboveThreshold);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const loadPreset = (preset: (typeof PRESET_PATIENTS)[0]) => {
    setFeatures(preset.data);
    setPatientRef(`PT-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  // Color schemes based on risk
  const riskColor =
    riskLevel === 'high'
      ? { text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', bar: 'bg-rose-500' }
      : riskLevel === 'moderate'
      ? { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500' }
      : { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500' };

  return (
    <div className="space-y-6">
      {/* Top Header & Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Single Patient Risk Predictor</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-teal-50 text-teal-700 border border-teal-200">
              Live Inference (300ms Debounce)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Input routine physiological parameters. Abnormalities are deterministically tagged before LLM reasoning.
          </p>
        </div>

        {/* Patient Identifier */}
        <div className="flex items-center gap-2">
          <label htmlFor="patient-ref-input" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Patient ID:
          </label>
          <input
            id="patient-ref-input"
            type="text"
            value={patientRef}
            onChange={(e) => setPatientRef(e.target.value)}
            className="w-32 px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={() => setPatientRef(`PT-${Math.floor(1000 + Math.random() * 9000)}`)}
            title="Generate new ID"
            aria-label="Generate new Patient ID"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preset Personas Bar */}
      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mr-1">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          Clinical Presets:
        </span>
        {PRESET_PATIENTS.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => loadPreset(preset)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 border border-slate-200 text-slate-700 transition-colors shadow-2xs"
            title={preset.desc}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 8 Feature Inputs & Sliders (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Clinical Feature Slicers &amp; Measurements</h2>
            <span className="text-[11px] text-slate-400">Values of 0 in physiological labs treated as missing (NaN)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Feature 1: Fasting Glucose */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="glucose-input" className="text-xs font-bold text-slate-800">
                    Fasting Glucose
                  </label>
                  <span className="block text-[11px] text-slate-500">Normal: 70 - 99 mg/dL</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    id="glucose-input"
                    type="number"
                    min="0"
                    max="300"
                    value={features.glucose}
                    onChange={(e) => setFeatures({ ...features, glucose: Number(e.target.value) })}
                    className="w-16 px-2 py-1 text-xs font-mono font-bold text-right border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-teal-500"
                  />
                  <span className="text-[11px] text-slate-500">mg/dL</span>
                </div>
              </div>
              <input
                type="range"
                min="50"
                max="250"
                value={features.glucose}
                onChange={(e) => setFeatures({ ...features, glucose: Number(e.target.value) })}
                className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                aria-label="Fasting Glucose slider"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Hypo (&lt;70)</span>
                <span className="font-semibold text-teal-700">70 - 99</span>
                <span className="text-rose-600 font-semibold">Elevated (≥126)</span>
              </div>
            </div>

            {/* Feature 2: Body Mass Index (BMI) */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="bmi-input" className="text-xs font-bold text-slate-800">
                    Body Mass Index (BMI)
                  </label>
                  <span className="block text-[11px] text-slate-500">Normal: 18.5 - 24.9 kg/m²</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    id="bmi-input"
                    type="number"
                    step="0.1"
                    min="10"
                    max="65"
                    value={features.bmi}
                    onChange={(e) => setFeatures({ ...features, bmi: Number(e.target.value) })}
                    className="w-16 px-2 py-1 text-xs font-mono font-bold text-right border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-teal-500"
                  />
                  <span className="text-[11px] text-slate-500">kg/m²</span>
                </div>
              </div>
              <input
                type="range"
                min="15"
                max="55"
                step="0.1"
                value={features.bmi}
                onChange={(e) => setFeatures({ ...features, bmi: Number(e.target.value) })}
                className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                aria-label="Body Mass Index slider"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Underweight</span>
                <span className="font-semibold text-teal-700">18.5 - 24.9</span>
                <span className="text-rose-600 font-semibold">Obese (≥30)</span>
              </div>
            </div>

            {/* Feature 3: Blood Pressure */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="bp-input" className="text-xs font-bold text-slate-800">
                    Diastolic BP
                  </label>
                  <span className="block text-[11px] text-slate-500">Normal: 60 - 80 mmHg</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    id="bp-input"
                    type="number"
                    min="0"
                    max="180"
                    value={features.bloodPressure}
                    onChange={(e) => setFeatures({ ...features, bloodPressure: Number(e.target.value) })}
                    className="w-16 px-2 py-1 text-xs font-mono font-bold text-right border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-teal-500"
                  />
                  <span className="text-[11px] text-slate-500">mmHg</span>
                </div>
              </div>
              <input
                type="range"
                min="40"
                max="140"
                value={features.bloodPressure}
                onChange={(e) => setFeatures({ ...features, bloodPressure: Number(e.target.value) })}
                className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                aria-label="Diastolic Blood Pressure slider"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Hypo (&lt;60)</span>
                <span className="font-semibold text-teal-700">60 - 80</span>
                <span className="text-rose-600 font-semibold">Stage 2 (≥90)</span>
              </div>
            </div>

            {/* Feature 4: Patient Age */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="age-input" className="text-xs font-bold text-slate-800">
                    Patient Age
                  </label>
                  <span className="block text-[11px] text-slate-500">Screening cutoff ≥ 45</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    id="age-input"
                    type="number"
                    min="18"
                    max="95"
                    value={features.age}
                    onChange={(e) => setFeatures({ ...features, age: Number(e.target.value) })}
                    className="w-16 px-2 py-1 text-xs font-mono font-bold text-right border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-teal-500"
                  />
                  <span className="text-[11px] text-slate-500">years</span>
                </div>
              </div>
              <input
                type="range"
                min="18"
                max="85"
                value={features.age}
                onChange={(e) => setFeatures({ ...features, age: Number(e.target.value) })}
                className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                aria-label="Patient Age slider"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>18</span>
                <span className="font-semibold text-teal-700">&lt;45</span>
                <span className="text-slate-600 font-semibold">85</span>
              </div>
            </div>

            {/* Feature 5: Serum Insulin */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="insulin-input" className="text-xs font-bold text-slate-800">
                    2-Hour Serum Insulin
                  </label>
                  <span className="block text-[11px] text-slate-500">Normal fasting: &lt; 166 μU/mL</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    id="insulin-input"
                    type="number"
                    min="0"
                    max="800"
                    value={features.insulin}
                    onChange={(e) => setFeatures({ ...features, insulin: Number(e.target.value) })}
                    className="w-16 px-2 py-1 text-xs font-mono font-bold text-right border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-teal-500"
                  />
                  <span className="text-[11px] text-slate-500">μU/mL</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                value={features.insulin}
                onChange={(e) => setFeatures({ ...features, insulin: Number(e.target.value) })}
                className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                aria-label="Serum Insulin slider"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0 (Unknown)</span>
                <span className="font-semibold text-teal-700">100 - 160</span>
                <span className="text-rose-600 font-semibold">&gt; 166 (Resistance)</span>
              </div>
            </div>

            {/* Feature 6: Diabetes Pedigree Function */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="pedigree-input" className="text-xs font-bold text-slate-800">
                    Pedigree Genetic Score
                  </label>
                  <span className="block text-[11px] text-slate-500">Family history weight (0.0 - 2.5)</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    id="pedigree-input"
                    type="number"
                    step="0.01"
                    min="0"
                    max="3.0"
                    value={features.diabetesPedigree}
                    onChange={(e) => setFeatures({ ...features, diabetesPedigree: Number(e.target.value) })}
                    className="w-16 px-2 py-1 text-xs font-mono font-bold text-right border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-teal-500"
                  />
                  <span className="text-[11px] text-slate-500">pts</span>
                </div>
              </div>
              <input
                type="range"
                min="0.05"
                max="2.5"
                step="0.01"
                value={features.diabetesPedigree}
                onChange={(e) => setFeatures({ ...features, diabetesPedigree: Number(e.target.value) })}
                className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                aria-label="Diabetes Pedigree Function slider"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0.1 (Low)</span>
                <span className="font-semibold text-teal-700">0.4 - 0.6</span>
                <span className="text-rose-600 font-semibold">&gt; 0.7 (High)</span>
              </div>
            </div>

            {/* Feature 7: Pregnancies */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="pregnancies-input" className="text-xs font-bold text-slate-800">
                    Pregnancies (Parity)
                  </label>
                  <span className="block text-[11px] text-slate-500">Gestational risk factor</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    id="pregnancies-input"
                    type="number"
                    min="0"
                    max="17"
                    value={features.pregnancies}
                    onChange={(e) => setFeatures({ ...features, pregnancies: Number(e.target.value) })}
                    className="w-16 px-2 py-1 text-xs font-mono font-bold text-right border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-teal-500"
                  />
                  <span className="text-[11px] text-slate-500">count</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={features.pregnancies}
                onChange={(e) => setFeatures({ ...features, pregnancies: Number(e.target.value) })}
                className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                aria-label="Pregnancies slider"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0 (Nulliparous)</span>
                <span>1 - 3</span>
                <span className="text-amber-600 font-semibold">≥ 5 (Multiparity)</span>
              </div>
            </div>

            {/* Feature 8: Triceps Skin Thickness */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="skin-input" className="text-xs font-bold text-slate-800">
                    Skin Fold Thickness
                  </label>
                  <span className="block text-[11px] text-slate-500">Subcutaneous adiposity (mm)</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    id="skin-input"
                    type="number"
                    min="0"
                    max="99"
                    value={features.skinThickness}
                    onChange={(e) => setFeatures({ ...features, skinThickness: Number(e.target.value) })}
                    className="w-16 px-2 py-1 text-xs font-mono font-bold text-right border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-teal-500"
                  />
                  <span className="text-[11px] text-slate-500">mm</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={features.skinThickness}
                onChange={(e) => setFeatures({ ...features, skinThickness: Number(e.target.value) })}
                className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                aria-label="Triceps Skin Fold Thickness slider"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0 (Imputed)</span>
                <span>20 - 30</span>
                <span>&gt; 40</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Probability Gauge & Structured Explanation (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Risk Score Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Clinical Risk Assessment
              </span>
              <span
                className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider border ${riskColor.bg} ${riskColor.text} ${riskColor.border}`}
              >
                {riskLevel} Risk
              </span>
            </div>

            {/* Circular Gauge Graphic */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative w-44 h-44 flex items-center justify-center">
                {/* SVG Radial Meter */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" className="stroke-slate-100" strokeWidth="9" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className={`transition-all duration-500 ${
                      riskLevel === 'high'
                        ? 'stroke-rose-500'
                        : riskLevel === 'moderate'
                        ? 'stroke-amber-500'
                        : 'stroke-emerald-500'
                    }`}
                    strokeWidth="9"
                    strokeDasharray={263.89}
                    strokeDashoffset={263.89 * (1 - probability)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                {/* Score Number in Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                    {(probability * 100).toFixed(1)}%
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Diabetes Risk
                  </span>
                  {isAboveThreshold && (
                    <span className="mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-100 text-rose-700 animate-pulse">
                      Threshold Exceeded (≥ {(alertThreshold * 100).toFixed(0)}%)
                    </span>
                  )}
                </div>
              </div>

              {/* Threshold indicator line */}
              <div className="w-full mt-2 text-xs text-slate-500 flex justify-between px-4">
                <span>0% Low</span>
                <span className="text-amber-600 font-medium">35% Mod</span>
                <span className="text-rose-600 font-bold">{(alertThreshold * 100).toFixed(0)}% Alert Trigger</span>
                <span>100%</span>
              </div>
            </div>

            {/* Abnormal Flags Chips */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-teal-600" />
                  Deterministic Abnormal Flags ({flags.length}):
                </span>
              </div>

              {flags.length === 0 ? (
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>All evaluated physiological biomarkers are within normal reference ranges.</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {flags.map((flag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md bg-rose-50 text-rose-800 border border-rose-200"
                    >
                      <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                      <span>{flag}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleRequestAiExplanation}
                disabled={isAiLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 transition-colors disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : 'text-teal-600'}`} />
                <span>{isAiLoading ? 'Generating Clinical AI...' : 'Refine with Gemini Agent'}</span>
              </button>

              <button
                onClick={handleSave}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white shadow-xs transition-colors ${
                  isAboveThreshold
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-teal-600 hover:bg-teal-700'
                }`}
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved &amp; Alert Created!</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-4 h-4" />
                    <span>
                      {isAboveThreshold ? 'Save & Trigger Alert' : 'Save Prediction'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Structured Clinical Explanation Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-teal-600" />
                Structured Clinical Explanation
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Pydantic v2 Contract</span>
            </div>

            {/* Key Factors */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700">Identified Risk Drivers:</span>
              <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                {currentExplanation.key_factors.map((factor, i) => (
                  <li key={i}>{factor}</li>
                ))}
              </ul>
            </div>

            {/* Recommended Care Pathway */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-bold text-slate-700">Recommended Clinical Care Pathway:</span>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-medium">
                {currentExplanation.recommendation}
              </p>
            </div>

            {/* Mandatory Disclaimer Box */}
            <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 leading-normal">
              <strong>Clinical Guardrail:</strong> {currentExplanation.disclaimer || disclaimerText || MANDATORY_DISCLAIMER}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
