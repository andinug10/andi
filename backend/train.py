"""
AI Health Copilot Pro — Model Training & Serialization (CRISP-DM Phase 4 & 6)
Author: Dr. Harry Patria, Chief Data & AI Officer, Patria & Co.
Version: 3.1.0 | Framework: fullstack-analytics-builder + Agentic ML Integration (Chapter 10)
"""

import os
import json
import pickle
from typing import Dict, Any, List
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import (
    accuracy_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
    roc_curve,
    precision_recall_curve,
)

from backend.data_pipeline import load_raw_data, audit_and_replace_zeros, split_features_target, FEATURE_NAMES
from backend.preprocessing import create_preprocessor, split_data

SAVED_MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "saved_models")
REPORTS_DIR = os.path.join(os.path.dirname(__file__), "..", "reports")


def build_pipeline(classifier) -> Pipeline:
    """Builds an end-to-end Pipeline combining imputer, scaler, and classifier."""
    preprocessor = create_preprocessor()
    return Pipeline(
        steps=[
            ("imputer", preprocessor.named_steps["imputer"]),
            ("scaler", preprocessor.named_steps["scaler"]),
            ("classifier", classifier),
        ]
    )


def train_and_evaluate_models() -> Dict[str, Any]:
    os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
    os.makedirs(REPORTS_DIR, exist_ok=True)

    # 1. Ingestion & Preprocessing
    df = load_raw_data()
    df_clean = audit_and_replace_zeros(df)
    X, y = split_features_target(df_clean)
    X_train, X_test, y_train, y_test = split_data(X, y, test_size=0.20, random_state=42)

    # 2. Candidate Models
    model_a_rf = RandomForestClassifier(
        n_estimators=200, max_depth=5, random_state=42, class_weight="balanced"
    )
    model_b_lr = LogisticRegression(max_iter=1000, random_state=42, class_weight="balanced")

    pipe_rf = build_pipeline(model_a_rf)
    pipe_lr = build_pipeline(model_b_lr)

    # 3. Train Candidate A (Random Forest)
    print("\n--- Training Model A: RandomForestClassifier(n_estimators=200, max_depth=5) ---")
    pipe_rf.fit(X_train, y_train)
    rf_preds = pipe_rf.predict(X_test)
    rf_proba = pipe_rf.predict_proba(X_test)[:, 1]
    rf_acc = accuracy_score(y_test, rf_preds)
    rf_auc = roc_auc_score(y_test, rf_proba)
    print(f"RandomForest Holdout Accuracy: {rf_acc:.4f} | AUC-ROC: {rf_auc:.4f}")

    # 5-fold Stratified CV for RF on full dataset
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    rf_cv_scores = cross_val_score(pipe_rf, X, y, cv=cv, scoring="roc_auc")
    print(f"5-Fold Stratified CV AUC: Mean={rf_cv_scores.mean():.4f} (+/- {rf_cv_scores.std():.4f})")

    # 4. Train Candidate B (Logistic Regression)
    print("\n--- Training Model B: LogisticRegression(max_iter=1000) ---")
    pipe_lr.fit(X_train, y_train)
    lr_preds = pipe_lr.predict(X_test)
    lr_proba = pipe_lr.predict_proba(X_test)[:, 1]
    lr_acc = accuracy_score(y_test, lr_preds)
    lr_auc = roc_auc_score(y_test, lr_proba)
    print(f"LogisticRegression Holdout Accuracy: {lr_acc:.4f} | AUC-ROC: {lr_auc:.4f}")

    # 5. Selection (prefer RandomForest if competitive or higher AUC)
    best_pipe = pipe_rf if rf_auc >= lr_auc else pipe_lr
    best_model_name = "RandomForestClassifier" if best_pipe == pipe_rf else "LogisticRegression"
    best_auc = max(rf_auc, lr_auc)
    best_acc = rf_acc if best_pipe == pipe_rf else lr_acc
    best_proba = rf_proba if best_pipe == pipe_rf else lr_proba
    best_preds = rf_preds if best_pipe == pipe_rf else lr_preds

    print(f"\n>>> Selected Best Model: {best_model_name} with Holdout AUC-ROC: {best_auc:.4f}")

    # Evaluation details
    cm = confusion_matrix(y_test, best_preds)
    cr = classification_report(y_test, best_preds, output_dict=True)

    # Feature Importance (for RF)
    feature_importances = {}
    if hasattr(pipe_rf.named_steps["classifier"], "feature_importances_"):
        raw_importances = pipe_rf.named_steps["classifier"].feature_importances_
        feature_importances = {
            name: float(val) for name, val in zip(FEATURE_NAMES, raw_importances)
        }
        # Sort descending
        feature_importances = dict(
            sorted(feature_importances.items(), key=lambda item: item[1], reverse=True)
        )

    # Serialisation
    model_sav_path = os.path.join(SAVED_MODELS_DIR, "diabetes_model.sav")
    with open(model_sav_path, "wb") as f:
        pickle.dump(best_pipe, f)
    print(f"Serialized model pipeline saved to: {model_sav_path}")

    # Save feature names
    feature_names_path = os.path.join(SAVED_MODELS_DIR, "feature_names.json")
    with open(feature_names_path, "w") as f:
        json.dump(FEATURE_NAMES, f, indent=2)

    # Save metrics JSON
    metrics_payload = {
        "model_name": best_model_name,
        "model_version": "3.1.0",
        "accuracy": float(best_acc),
        "auc_roc": float(best_auc),
        "cv_5fold_mean_auc": float(rf_cv_scores.mean()),
        "confusion_matrix": cm.tolist(),
        "feature_importances": feature_importances,
        "classification_report": cr,
        "trained_samples": len(X_train),
        "holdout_samples": len(X_test),
    }
    metrics_path = os.path.join(SAVED_MODELS_DIR, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics_payload, f, indent=2)

    return metrics_payload


def predict_diabetes_proba(patient_data: List[float]) -> float:
    """
    Predicts probability of diabetes for a single 8-feature clinical vector.
    Expects order: [Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin, BMI, DiabetesPedigreeFunction, Age]
    """
    model_sav_path = os.path.join(SAVED_MODELS_DIR, "diabetes_model.sav")
    with open(model_sav_path, "rb") as f:
        pipeline = pickle.load(f)

    # Prepare DataFrame with feature names to prevent sklearn warning
    patient_df = pd.DataFrame([patient_data], columns=FEATURE_NAMES)
    # Treat zeros as NaN for physiological attributes
    for col in ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]:
        if patient_df.at[0, col] == 0:
            patient_df.at[0, col] = np.nan

    proba = pipeline.predict_proba(patient_df)[0, 1]
    return float(proba)


if __name__ == "__main__":
    train_and_evaluate_models()
