"""
AI Health Copilot Pro — Agentic Layer & Deterministic Flagging (CRISP-DM Phase 7)
Author: Dr. Harry Patria, Chief Data & AI Officer, Patria & Co.
Version: 3.1.0 | Framework: fullstack-analytics-builder + Agentic ML Integration (Chapter 10)
"""

import os
import json
from typing import List, Dict, Any
from backend.schemas import ClinicalExplanation

# Hard-coded deterministic normal ranges as specified in Chapter 10
NORMAL_RANGES = {
    "Glucose": (70.0, 99.0),        # mg/dL (Normal Fasting Glucose)
    "BloodPressure": (60.0, 80.0),  # mmHg (Normal Diastolic BP)
    "BMI": (18.5, 24.9),            # kg/m^2 (Normal Weight range)
    "Age": (0.0, 120.0),            # Valid human age
}

MANDATORY_DISCLAIMER = (
    "DISCLAIMER: AI Health Copilot Pro is an experimental clinical decision support tool designed to assist "
    "licensed medical professionals. It does NOT provide a medical diagnosis or replace formal clinical judgement. "
    "All treatment, screening, and diagnostic decisions must be independently validated by a qualified physician."
)


def flag_abnormal_features(patient_data: List[float], feature_names: List[str]) -> List[str]:
    """
    Deterministic clinical feature flagging prior to LLM reasoning.
    Evaluates physiological parameters strictly against verified medical cutoffs.
    """
    flags = []
    data_dict = dict(zip(feature_names, patient_data))

    # 1. Glucose
    glucose = data_dict.get("Glucose", 0)
    if glucose > 0:  # non-missing
        low, high = NORMAL_RANGES["Glucose"]
        if glucose > 125:
            flags.append(f"Severely Elevated Glucose ({glucose:.0f} mg/dL, normal 70-99 mg/dL - Diabetic threshold)")
        elif glucose > high:
            flags.append(f"Impaired Fasting Glucose ({glucose:.0f} mg/dL, normal 70-99 mg/dL - Prediabetes range)")
        elif glucose < low:
            flags.append(f"Hypoglycemia ({glucose:.0f} mg/dL, normal 70-99 mg/dL)")

    # 2. Blood Pressure (Diastolic)
    bp = data_dict.get("BloodPressure", 0)
    if bp > 0:
        low, high = NORMAL_RANGES["BloodPressure"]
        if bp > 89:
            flags.append(f"Stage 2 Diastolic Hypertension ({bp:.0f} mmHg, normal 60-80 mmHg)")
        elif bp > high:
            flags.append(f"Elevated Blood Pressure ({bp:.0f} mmHg, normal 60-80 mmHg)")
        elif bp < low:
            flags.append(f"Hypotension ({bp:.0f} mmHg, normal 60-80 mmHg)")

    # 3. Body Mass Index (BMI)
    bmi = data_dict.get("BMI", 0)
    if bmi > 0:
        low, high = NORMAL_RANGES["BMI"]
        if bmi >= 30.0:
            flags.append(f"Obesity Class I+ ({bmi:.1f} kg/m², normal 18.5-24.9 kg/m²)")
        elif bmi > high:
            flags.append(f"Overweight ({bmi:.1f} kg/m², normal 18.5-24.9 kg/m²)")
        elif bmi < low:
            flags.append(f"Underweight ({bmi:.1f} kg/m², normal 18.5-24.9 kg/m²)")

    # 4. Supplemental clinical risk flags
    insulin = data_dict.get("Insulin", 0)
    if insulin > 166:
        flags.append(f"Hyperinsulinemia / Suspected Insulin Resistance ({insulin:.0f} μU/mL, normal fasting < 166 μU/mL)")

    pregnancies = data_dict.get("Pregnancies", 0)
    if pregnancies >= 5:
        flags.append(f"High Multiparity ({int(pregnancies)} pregnancies, gestational risk factor)")

    pedigree = data_dict.get("DiabetesPedigreeFunction", 0)
    if pedigree >= 0.70:
        flags.append(f"Strong Familial Genetic Predisposition (Pedigree score {pedigree:.2f})")

    age = data_dict.get("Age", 0)
    if age >= 45:
        flags.append(f"Age-associated Metabolic Risk ({int(age)} years old, screening threshold ≥ 45)")

    return flags


def determine_risk_level(probability: float) -> str:
    """Categorizes diabetes probability into low, moderate, or high clinical risk."""
    if probability >= 0.70:
        return "high"
    elif probability >= 0.35:
        return "moderate"
    return "low"


def explain_diagnosis(probability: float, flags: List[str]) -> ClinicalExplanation:
    """
    Structured clinical explanation generator using LLM (Gemini / OpenAI) with fallback.
    CRITICAL AGENTIC RULE:
      - Only flags and probability are provided to the LLM (raw feature vectors are not exposed).
      - Enforces strict JSON output conforming to ClinicalExplanation Pydantic model.
    """
    risk_level = determine_risk_level(probability)
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    if api_key:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)
            prompt = (
                f"You are a clinical communication assistant, NOT a diagnosing physician.\n"
                f"A validated clinical machine learning pipeline has calculated the following patient profile:\n"
                f"- Model Diabetes Probability: {probability:.1%}\n"
                f"- Assigned Risk Tier: {risk_level.upper()}\n"
                f"- Deterministic Abnormal Clinical Flags:\n"
                + ("\n".join([f"  * {flag}" for flag in flags]) if flags else "  * None (all routine parameters within normal limits)")
                + "\n\nInstructions:\n"
                "1. Reason ONLY from the provided abnormal flags and the calculated probability.\n"
                "2. Never invent clinical factors or speculate on unflagged variables.\n"
                "3. Provide structured actionable recommendations (e.g. confirmatory fasting plasma glucose or oral glucose tolerance test, HbA1c panel, nutrition consult, or lifestyle intervention).\n"
                "4. Always include the strong disclaimer provided."
            )

            response = client.models.generate_content(
                model="gemini-3.8-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction="You are a clinical communication assistant. You strictly provide structured clinical summaries based only on provided deterministic flags.",
                    response_mime_type="application/json",
                    response_schema=ClinicalExplanation,
                ),
            )
            data = json.loads(response.text)
            return ClinicalExplanation(**data)
        except Exception as e:
            print(f"Gemini API generation failed, falling back to deterministic explanation: {e}")

    # Deterministic high-reliability clinical fallback
    key_factors = flags if flags else ["All physiological parameters evaluated within standard clinical reference intervals"]
    
    if risk_level == "high":
        recommendation = (
            "URGENT CLINICAL TRIAGE: Model risk exceeds threshold (≥ 70%). Order confirmatory Venous HbA1c "
            "and 8-hour Fasting Plasma Glucose (FPG). Schedule immediate primary care clinical review within 7 days, "
            "provide diabetic dietary counseling, and initiate cardiovascular risk evaluation."
        )
    elif risk_level == "moderate":
        recommendation = (
            "MODERATE RISK MONITORING: Schedule preventive metabolic follow-up in 3 months. Recommend lifestyle "
            "interventions including structured dietary moderation, weight management, and 150 min/week moderate exercise. "
            "Consider baseline HbA1c screening."
        )
    else:
        recommendation = (
            "LOW RISK: Maintain standard annual wellness screening. Continue balanced nutrition and regular physical activity."
        )

    return ClinicalExplanation(
        risk_level=risk_level,
        key_factors=key_factors,
        recommendation=recommendation,
        disclaimer=MANDATORY_DISCLAIMER,
    )


def run_health_copilot(patient_data: List[float], feature_names: List[str] = None) -> Dict[str, Any]:
    """
    Main Chapter 10 Agentic pipeline:
      1. Predict diabetes probability using ML pipeline
      2. Deterministically flag abnormal features
      3. Structured LLM reasoning from flags + probability
    """
    from backend.train import predict_diabetes_proba, FEATURE_NAMES

    if feature_names is None:
        feature_names = FEATURE_NAMES

    probability = predict_diabetes_proba(patient_data)
    flags = flag_abnormal_features(patient_data, feature_names)
    explanation = explain_diagnosis(probability, flags)

    return {
        "probability": probability,
        "risk_level": explanation.risk_level,
        "flags": flags,
        "explanation": explanation.model_dump(),
    }
