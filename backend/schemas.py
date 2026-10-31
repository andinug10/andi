"""
AI Health Copilot Pro — Pydantic Schemas
Author: Dr. Harry Patria, Chief Data & AI Officer, Patria & Co.
Version: 3.1.0 | Framework: fullstack-analytics-builder + Agentic ML Integration (Chapter 10)
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class PatientFeatures(BaseModel):
    pregnancies: float = Field(..., ge=0, le=25, description="Number of pregnancies")
    glucose: float = Field(..., ge=0, le=400, description="Plasma glucose concentration (mg/dL)")
    blood_pressure: float = Field(..., ge=0, le=250, description="Diastolic blood pressure (mmHg)")
    skin_thickness: float = Field(..., ge=0, le=120, description="Triceps skin fold thickness (mm)")
    insulin: float = Field(..., ge=0, le=1000, description="2-Hour serum insulin (mu U/ml)")
    bmi: float = Field(..., ge=0, le=80, description="Body mass index (weight in kg/(height in m)^2)")
    diabetes_pedigree: float = Field(..., ge=0, le=3.5, description="Diabetes pedigree function genetic score")
    age: float = Field(..., ge=1, le=120, description="Age in years")

    def to_feature_list(self) -> List[float]:
        return [
            self.pregnancies,
            self.glucose,
            self.blood_pressure,
            self.skin_thickness,
            self.insulin,
            self.bmi,
            self.diabetes_pedigree,
            self.age,
        ]


class ClinicalExplanation(BaseModel):
    risk_level: Literal["low", "moderate", "high"] = Field(
        ..., description="Clinical risk category: low (<35%), moderate (35-69%), high (>=70%)"
    )
    key_factors: List[str] = Field(
        ..., description="Specific abnormal physiological factors driving this patient's risk"
    )
    recommendation: str = Field(
        ..., description="Actionable clinical care pathway guidance and recommended diagnostic steps"
    )
    disclaimer: str = Field(
        ..., description="Mandatory diagnostic disclaimer stating this is AI decision support, not diagnosis"
    )


class PredictionResponse(BaseModel):
    prediction_id: str
    probability: float
    risk_level: Literal["low", "moderate", "high"]
    flags: List[str]
    key_factors: List[str]
    recommendation: str
    disclaimer: str
    model_version: str = "3.1.0"


class BatchPredictionRequest(BaseModel):
    patients: List[List[float]] = Field(..., max_length=200, description="List of 8-element feature vectors")


class ModelMetricsResponse(BaseModel):
    model_name: str
    model_version: str
    accuracy: float
    auc_roc: float
    cv_5fold_mean_auc: float
    trained_at: str
    normal_ranges: dict
