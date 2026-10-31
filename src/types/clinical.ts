/**
 * AI Health Copilot Pro — Clinical Types & Interfaces
 */

export interface PatientFeatures {
  pregnancies: number;
  glucose: number;
  bloodPressure: number;
  skinThickness: number;
  insulin: number;
  bmi: number;
  diabetesPedigree: number;
  age: number;
}

export type RiskLevel = 'low' | 'moderate' | 'high';

export interface ClinicalExplanation {
  risk_level: RiskLevel;
  key_factors: string[];
  recommendation: string;
  disclaimer: string;
}

export interface PredictionResult {
  id: string;
  patient_ref: string;
  features: PatientFeatures;
  probability: number;
  risk_level: RiskLevel;
  flags: string[];
  key_factors: string[];
  recommendation: string;
  disclaimer: string;
  created_at: string;
  model_version: string;
}

export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface ClinicalAlert {
  id: string;
  prediction_id: string;
  patient_ref: string;
  probability: number;
  threshold: number;
  status: AlertStatus;
  flags: string[];
  created_at: string;
  updated_at: string;
  patient_age: number;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export interface ClinicalTask {
  id: string;
  alert_id?: string;
  patient_ref: string;
  title: string;
  description: string;
  intervention: string;
  status: TaskStatus;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string;
  created_at: string;
  updated_at: string;
}

export interface ModelMetrics {
  model_name: string;
  model_version: string;
  accuracy: number;
  auc_roc: number;
  cv_5fold_mean_auc: number;
  confusion_matrix: number[][];
  feature_importances: Record<string, number>;
  roc_curve: Array<{ fpr: number; tpr: number }>;
  precision_recall_curve: Array<{ recall: number; precision: number }>;
  trained_samples: number;
  holdout_samples: number;
  trained_at: string;
}
