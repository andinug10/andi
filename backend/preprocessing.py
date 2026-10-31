"""
AI Health Copilot Pro — Preprocessing Pipeline (CRISP-DM Phase 3)
Author: Dr. Harry Patria, Chief Data & AI Officer, Patria & Co.
Version: 3.1.0 | Framework: fullstack-analytics-builder + Agentic ML Integration (Chapter 10)
"""

from typing import Tuple
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

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


def create_preprocessor() -> Pipeline:
    """
    Creates an sklearn Pipeline comprising:
      1. SimpleImputer with median strategy (handles NaN from zero replacement)
      2. StandardScaler to normalize clinical ranges
    """
    return Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )


def split_data(
    X: pd.DataFrame, y: pd.Series, test_size: float = 0.20, random_state: int = 42
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """
    Splits dataset into 80/20 train/test sets stratified on the binary target.
    Random state 42 ensures exact reproducibility.
    """
    X_train, X_test, y_train, y_test = train_test_split(
        X[FEATURE_NAMES],
        y,
        test_size=test_size,
        stratify=y,
        random_state=random_state,
    )
    print(f"Data Split: Train={len(X_train)} samples (80%), Test={len(X_test)} samples (20%)")
    print(f"Train Outcome distribution: Class 1 = {y_train.mean():.2%}")
    print(f"Test Outcome distribution:  Class 1 = {y_test.mean():.2%}")
    return X_train, X_test, y_train, y_test
