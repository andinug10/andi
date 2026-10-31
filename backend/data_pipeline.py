"""
AI Health Copilot Pro — Data Ingestion & Audit Pipeline (CRISP-DM Phase 1)
Author: Dr. Harry Patria, Chief Data & AI Officer, Patria & Co.
Version: 3.1.0 | Framework: fullstack-analytics-builder + Agentic ML Integration (Chapter 10)
"""

import os
from typing import Tuple
import numpy as np
import pandas as pd

# Biologically impossible zeros in Pima Indians Diabetes Dataset
ZERO_COLS = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]
FEATURE_NAMES = [
    "Pregnancies",
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
    "DiabetesPedigreeFunction",
    "Age",
]
TARGET_COL = "Outcome"


def load_raw_data(filepath: str = "dataset/diabetes.csv") -> pd.DataFrame:
    """Loads raw dataset and logs basic structural properties."""
    if not os.path.exists(filepath):
        # Fallback to public path if relative to workspace
        alt_path = os.path.join(os.path.dirname(__file__), "..", "dataset", "diabetes.csv")
        if os.path.exists(alt_path):
            filepath = alt_path
        else:
            raise FileNotFoundError(f"Dataset not found at {filepath} or {alt_path}")

    df = pd.read_csv(filepath)
    print("=" * 60)
    print("PHASE 1: DATA INGESTION & AUDIT")
    print(f"Dataset loaded: {filepath}")
    print(f"Shape: {df.shape[0]} rows, {df.shape[1]} columns")
    print("=" * 60)
    print("\nOutcome Value Counts:")
    print(df[TARGET_COL].value_counts(normalize=False))
    print(f"Prevalence (Class 1): {df[TARGET_COL].mean():.2%}")
    return df


def audit_and_replace_zeros(df: pd.DataFrame) -> pd.DataFrame:
    """
    Explicitly counts biologically impossible zeros in physiological columns
    and replaces them with np.nan for median imputation in the preprocessing pipeline.
    """
    df_cleaned = df.copy()
    print("\nBiologically Impossible Zero Count Audit:")
    for col in ZERO_COLS:
        zero_count = (df_cleaned[col] == 0).sum()
        pct = (zero_count / len(df_cleaned)) * 100
        print(f"  • {col:15s}: {zero_count:3d} zeros ({pct:.1f}% missing)")
        # Replace zeros with NaN
        df_cleaned[col] = df_cleaned[col].replace(0, np.nan)

    print("\nNull count after zero-to-NaN conversion:")
    print(df_cleaned[ZERO_COLS].isna().sum())
    return df_cleaned


def split_features_target(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    """Splits into feature matrix X and target vector y preserving feature ordering."""
    X = df[FEATURE_NAMES].copy()
    y = df[TARGET_COL].copy()
    return X, y


if __name__ == "__main__":
    raw_df = load_raw_data()
    cleaned_df = audit_and_replace_zeros(raw_df)
    X, y = split_features_target(cleaned_df)
    print(f"\nFeature matrix X shape: {X.shape}")
    print(f"Target vector y shape: {y.shape}")
