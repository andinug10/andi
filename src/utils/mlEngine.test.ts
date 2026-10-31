import test from 'node:test';
import assert from 'node:assert/strict';
import {
  flagAbnormalFeatures,
  preprocessFeatures,
  predictDiabetesProbability,
  determineRiskLevel,
  generateDeterministicExplanation,
  PREPROCESSING_MEDIANS,
} from './mlEngine';
import { PatientFeatures } from '../types/clinical';

test('flagAbnormalFeatures correctly identifies out-of-range clinical parameters', () => {
  const highRiskPatient: PatientFeatures = {
    pregnancies: 6,
    glucose: 168,
    bloodPressure: 94,
    skinThickness: 35,
    insulin: 240,
    bmi: 38.5,
    diabetesPedigree: 0.85,
    age: 52,
  };

  const flags = flagAbnormalFeatures(highRiskPatient);
  assert.ok(flags.length >= 4, `Expected at least 4 flags, got ${flags.length}`);
  assert.ok(flags.some((f) => f.includes('Severely Elevated Glucose')));
  assert.ok(flags.some((f) => f.includes('Stage 2 Diastolic Hypertension')));
  assert.ok(flags.some((f) => f.includes('Obesity Class I+')));
  assert.ok(flags.some((f) => f.includes('Hyperinsulinemia')));
  assert.ok(flags.some((f) => f.includes('High Multiparity')));
});

test('flagAbnormalFeatures produces empty flags for ideal physiological ranges', () => {
  const normalPatient: PatientFeatures = {
    pregnancies: 1,
    glucose: 85,
    bloodPressure: 70,
    skinThickness: 20,
    insulin: 60,
    bmi: 22.0,
    diabetesPedigree: 0.25,
    age: 26,
  };

  const flags = flagAbnormalFeatures(normalPatient);
  assert.equal(flags.length, 0, 'Normal patient should trigger zero abnormal flags');
});

test('preprocessFeatures properly imputes biologically impossible zeros with dataset medians', () => {
  const patientWithZeros: PatientFeatures = {
    pregnancies: 2,
    glucose: 0, // Missing
    bloodPressure: 0, // Missing
    skinThickness: 0, // Missing
    insulin: 0, // Missing
    bmi: 0, // Missing
    diabetesPedigree: 0.3,
    age: 30,
  };

  const transformed = preprocessFeatures(patientWithZeros);
  // Transformed should be finite numbers without NaN
  assert.ok(transformed.every((val) => !isNaN(val) && isFinite(val)));
});

test('predictDiabetesProbability discriminates high vs low risk patients', () => {
  const healthyPatient: PatientFeatures = {
    pregnancies: 1,
    glucose: 82,
    bloodPressure: 68,
    skinThickness: 20,
    insulin: 50,
    bmi: 21.5,
    diabetesPedigree: 0.18,
    age: 23,
  };

  const severePatient: PatientFeatures = {
    pregnancies: 7,
    glucose: 195,
    bloodPressure: 95,
    skinThickness: 42,
    insulin: 320,
    bmi: 44.0,
    diabetesPedigree: 1.25,
    age: 58,
  };

  const pHealthy = predictDiabetesProbability(healthyPatient);
  const pSevere = predictDiabetesProbability(severePatient);

  assert.ok(pHealthy < 0.35, `Healthy prob (${pHealthy}) should be < 0.35`);
  assert.ok(pSevere >= 0.70, `Severe prob (${pSevere}) should be >= 0.70`);
  assert.equal(determineRiskLevel(pHealthy), 'low');
  assert.equal(determineRiskLevel(pSevere), 'high');
});

test('generateDeterministicExplanation generates structured clinical output with mandatory disclaimer', () => {
  const explanation = generateDeterministicExplanation(0.78, [
    'Severely Elevated Glucose (170 mg/dL)',
    'Obesity Class I+ (34.2 kg/m²)',
  ]);

  assert.equal(explanation.risk_level, 'high');
  assert.ok(explanation.key_factors.length === 2);
  assert.ok(explanation.recommendation.includes('URGENT CLINICAL TRIAGE'));
  assert.ok(explanation.disclaimer.includes('DISCLAIMER: AI Health Copilot Pro'));
});
