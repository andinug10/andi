-- ============================================================================
-- AI Health Copilot Pro — Supabase / PostgreSQL Schema Migration (001_init.sql)
-- Author: Dr. Harry Patria, Chief Data & AI Officer, Patria & Co.
-- Version: 3.1.0 | Framework: fullstack-analytics-builder + Agentic ML Integration (Chapter 10)
-- ============================================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_ref TEXT NOT NULL UNIQUE,
    age INT CHECK (age >= 0 AND age <= 120),
    gender TEXT DEFAULT 'Female',
    pregnancies INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. PREDICTIONS TABLE (Insights Layer)
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    probability NUMERIC(5, 4) NOT NULL CHECK (probability >= 0.0 AND probability <= 1.0),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high')),
    flags JSONB NOT NULL DEFAULT '[]'::jsonb,
    key_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommendation TEXT NOT NULL,
    disclaimer TEXT NOT NULL,
    model_version TEXT DEFAULT '3.1.0' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ALERTS TABLE (Triggers Layer)
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id UUID REFERENCES public.predictions(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    threshold NUMERIC(5, 4) DEFAULT 0.7000 NOT NULL,
    status TEXT DEFAULT 'OPEN' NOT NULL CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED')),
    assigned_to UUID,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TASKS TABLE (Operations Layer — ITDO Kanban)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID REFERENCES public.alerts(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    intervention TEXT NOT NULL,
    status TEXT DEFAULT 'TODO' NOT NULL CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED')),
    due_date DATE,
    assigned_to UUID,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INDEXES for high-frequency clinical dashboard queries
CREATE INDEX IF NOT EXISTS idx_predictions_patient_id ON public.predictions(patient_id);
CREATE INDEX IF NOT EXISTS idx_predictions_risk_level ON public.predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON public.predictions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_patient_id ON public.alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_prediction_id ON public.alerts(prediction_id);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_alert_id ON public.tasks(alert_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Allow authenticated and service role access
CREATE POLICY "Allow public read access for clinical copilot demo"
    ON public.patients FOR SELECT USING (true);
CREATE POLICY "Allow public insert for clinical copilot demo"
    ON public.patients FOR ALL USING (true);

CREATE POLICY "Allow public read predictions"
    ON public.predictions FOR SELECT USING (true);
CREATE POLICY "Allow public insert predictions"
    ON public.predictions FOR ALL USING (true);

CREATE POLICY "Allow public read alerts"
    ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Allow public manage alerts"
    ON public.alerts FOR ALL USING (true);

CREATE POLICY "Allow public read tasks"
    ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow public manage tasks"
    ON public.tasks FOR ALL USING (true);
