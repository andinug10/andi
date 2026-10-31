/**
 * AI Health Copilot Pro — Full-Stack ML + Agentic Clinical Web Application
 * Author: Dr. Harry Patria, Chief Data & AI Officer, Patria & Co.
 * Version: 3.1.0 | Framework: fullstack-analytics-builder + Agentic ML Integration (Chapter 10)
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { PredictView } from './components/PredictView';
import { BatchView } from './components/BatchView';
import { AlertsView } from './components/AlertsView';
import { TasksView } from './components/TasksView';
import { ModelView } from './components/ModelView';
import { SettingsView } from './components/SettingsView';
import { CreateTaskModal } from './components/CreateTaskModal';
import { PredictionDetailModal } from './components/PredictionDetailModal';

import {
  PredictionResult,
  ClinicalAlert,
  ClinicalTask,
  ModelMetrics,
  AlertStatus,
  TaskStatus,
} from './types/clinical';
import { MANDATORY_DISCLAIMER } from './utils/mlEngine';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([]);
  const [tasks, setTasks] = useState<ClinicalTask[]>([]);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);

  // System settings
  const [alertThreshold, setAlertThreshold] = useState<number>(0.7);
  const [disclaimerText, setDisclaimerText] = useState<string>(MANDATORY_DISCLAIMER);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [taskModalInitialAlert, setTaskModalInitialAlert] = useState<ClinicalAlert | null>(null);
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionResult | null>(null);

  // Initial Data Fetching from Express Server
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [predsRes, alertsRes, tasksRes, metricsRes] = await Promise.all([
          fetch('/api/predictions'),
          fetch('/api/alerts'),
          fetch('/api/tasks'),
          fetch('/api/model-metrics'),
        ]);

        if (predsRes.ok) {
          const predsData = await predsRes.json();
          setPredictions(predsData);
        }
        if (alertsRes.ok) {
          const alertsData = await alertsRes.json();
          setAlerts(alertsData);
        }
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setTasks(tasksData);
        }
        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setMetrics(metricsData);
        }
      } catch (err) {
        console.error('Error fetching initial app data:', err);
      }
    }

    loadInitialData();
  }, []);

  // Handlers for Predictions & Alerts
  const handleSavePrediction = (result: PredictionResult, triggerAlert: boolean) => {
    setPredictions((prev) => [result, ...prev]);

    if (triggerAlert) {
      const newAlert: ClinicalAlert = {
        id: `alt-${Date.now()}`,
        prediction_id: result.id,
        patient_ref: result.patient_ref,
        probability: result.probability,
        threshold: alertThreshold,
        status: 'OPEN',
        flags: result.flags,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        patient_age: result.features.age,
      };
      setAlerts((prev) => [newAlert, ...prev]);

      // Post to backend
      fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAlert),
      }).catch(console.error);
    }
  };

  const handleAddBatchPredictions = (results: PredictionResult[]) => {
    setPredictions((prev) => [...results, ...prev]);

    // Automatically create alerts for high-risk patients
    const highRiskAlerts: ClinicalAlert[] = results
      .filter((r) => r.probability >= alertThreshold)
      .map((r, i) => ({
        id: `alt-batch-${Date.now()}-${i}`,
        prediction_id: r.id,
        patient_ref: r.patient_ref,
        probability: r.probability,
        threshold: alertThreshold,
        status: 'OPEN',
        flags: r.flags,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        patient_age: r.features.age,
      }));

    if (highRiskAlerts.length > 0) {
      setAlerts((prev) => [...highRiskAlerts, ...prev]);
    }
  };

  const handleUpdateAlertStatus = async (alertId: string, status: AlertStatus) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status, updated_at: new Date().toISOString() } : a)));

    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch (e) {
      console.error('Error updating alert status:', e);
    }
  };

  const handleConvertAlertToTask = (alert: ClinicalAlert) => {
    setTaskModalInitialAlert(alert);
    setIsTaskModalOpen(true);
  };

  // Handlers for Tasks
  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status, updated_at: new Date().toISOString() } : t)));

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch (e) {
      console.error('Error updating task status:', e);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Error deleting task:', e);
    }
  };

  const handleSaveNewTask = async (taskPartial: Partial<ClinicalTask>) => {
    const newTask: ClinicalTask = {
      id: `task-${Date.now()}`,
      alert_id: taskPartial.alert_id,
      patient_ref: taskPartial.patient_ref || 'PT-UNKNOWN',
      title: taskPartial.title || 'Clinical Intervention',
      description: taskPartial.description || '',
      intervention: taskPartial.intervention || 'General Clinical Review',
      status: taskPartial.status || 'TODO',
      due_date: taskPartial.due_date || new Date().toISOString().split('T')[0],
      priority: taskPartial.priority || 'high',
      assigned_to: taskPartial.assigned_to || 'Primary Care Team',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);

    // If converted from alert, update alert status to ACKNOWLEDGED
    if (taskPartial.alert_id) {
      handleUpdateAlertStatus(taskPartial.alert_id, 'ACKNOWLEDGED');
    }

    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
    } catch (e) {
      console.error('Error creating task:', e);
    }
  };

  const handleResetDatabase = async () => {
    try {
      await fetch('/api/reset-data', { method: 'POST' });
      // Reload window to reset baseline
      window.location.reload();
    } catch (e) {
      console.error('Error resetting database:', e);
    }
  };

  const openAlertsCount = alerts.filter((a) => a.status === 'OPEN').length;
  const pendingTasksCount = tasks.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Navigation Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openAlertsCount={openAlertsCount}
        pendingTasksCount={pendingTasksCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            predictions={predictions}
            alerts={alerts}
            tasks={tasks}
            onNavigate={setCurrentTab}
            onSelectPrediction={(pred) => setSelectedPrediction(pred)}
          />
        )}

        {currentTab === 'predict' && (
          <PredictView
            onSavePrediction={handleSavePrediction}
            disclaimerText={disclaimerText}
            alertThreshold={alertThreshold}
          />
        )}

        {currentTab === 'batch' && (
          <BatchView
            onAddBatchPredictions={handleAddBatchPredictions}
            onSelectPrediction={(pred) => setSelectedPrediction(pred)}
            alertThreshold={alertThreshold}
          />
        )}

        {currentTab === 'alerts' && (
          <AlertsView
            alerts={alerts}
            onUpdateAlertStatus={handleUpdateAlertStatus}
            onConvertAlertToTask={handleConvertAlertToTask}
            alertThreshold={alertThreshold}
          />
        )}

        {currentTab === 'tasks' && (
          <TasksView
            tasks={tasks}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onDeleteTask={handleDeleteTask}
            onOpenCreateTaskModal={() => {
              setTaskModalInitialAlert(null);
              setIsTaskModalOpen(true);
            }}
          />
        )}

        {currentTab === 'model' && <ModelView metrics={metrics} />}

        {currentTab === 'settings' && (
          <SettingsView
            alertThreshold={alertThreshold}
            setAlertThreshold={setAlertThreshold}
            disclaimerText={disclaimerText}
            setDisclaimerText={setDisclaimerText}
            onResetDatabase={handleResetDatabase}
          />
        )}
      </main>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskModalInitialAlert(null);
        }}
        onSaveTask={handleSaveNewTask}
        initialAlert={taskModalInitialAlert}
      />

      <PredictionDetailModal
        prediction={selectedPrediction}
        onClose={() => setSelectedPrediction(null)}
        onCreateAlert={(pred) => handleSavePrediction(pred, true)}
      />

      {/* Clinical Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>
            <strong>AI Health Copilot Pro</strong> • Dr. Harry Patria (Chief Data &amp; AI Officer, Patria &amp; Co.)
            • Chapter 10 Masterclass
          </p>
          <p className="text-[11px] text-slate-400">
            Clinical Decision Support System (CDSS) • Not an autonomous diagnostic device.
          </p>
        </div>
      </footer>
    </div>
  );
}
