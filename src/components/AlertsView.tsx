import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  PlusCircle,
  ShieldAlert,
} from 'lucide-react';
import { ClinicalAlert, AlertStatus } from '../types/clinical';

interface AlertsViewProps {
  alerts: ClinicalAlert[];
  onUpdateAlertStatus: (alertId: string, status: AlertStatus) => void;
  onConvertAlertToTask: (alert: ClinicalAlert) => void;
  alertThreshold: number;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onUpdateAlertStatus,
  onConvertAlertToTask,
  alertThreshold,
}) => {
  const [filter, setFilter] = useState<'ALL' | AlertStatus>('ALL');

  const filteredAlerts = alerts.filter((a) => (filter === 'ALL' ? true : a.status === filter));

  const openCount = alerts.filter((a) => a.status === 'OPEN').length;
  const ackCount = alerts.filter((a) => a.status === 'ACKNOWLEDGED').length;
  const resolvedCount = alerts.filter((a) => a.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Clinical Alerts Management (Triggers Layer)</h1>
              <span className="text-xs text-slate-500">
                Automated proactive alerts triggered at ≥ {(alertThreshold * 100).toFixed(0)}% diabetes probability
              </span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('OPEN')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'OPEN' ? 'bg-rose-600 text-white shadow-2xs' : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            Open ({openCount})
          </button>
          <button
            onClick={() => setFilter('ACKNOWLEDGED')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'ACKNOWLEDGED' ? 'bg-amber-600 text-white shadow-2xs' : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            Acknowledged ({ackCount})
          </button>
          <button
            onClick={() => setFilter('RESOLVED')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'RESOLVED' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>
      </div>

      {/* ITDO Framework Insight -> Trigger -> Operation Callout */}
      <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-700 shrink-0" />
          <span>
            <strong>ITDO Workflow:</strong> Acknowledging or converting an alert initiates the <em>Operations Layer</em>,
            generating an actionable clinical intervention on the Task Kanban Board.
          </span>
        </div>
        <span className="shrink-0 font-mono text-[11px] bg-white px-2 py-0.5 rounded-md border border-teal-300 font-bold">
          Trigger Cutoff: {(alertThreshold * 100).toFixed(0)}%
        </span>
      </div>

      {/* Alerts Grid */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Alerts in "{filter}" State</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All clinical triggers have been handled. New alerts automatically spawn when patient evaluations meet or
            exceed the {(alertThreshold * 100).toFixed(0)}% probability cutoff.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const isOpen = alert.status === 'OPEN';
            const isAck = alert.status === 'ACKNOWLEDGED';
            const isResolved = alert.status === 'RESOLVED';

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border bg-white shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isOpen
                    ? 'border-rose-200 hover:border-rose-300 bg-rose-50/20'
                    : isAck
                    ? 'border-amber-200 hover:border-amber-300'
                    : 'border-slate-200 opacity-80'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">{alert.patient_ref}</span>
                    <span className="text-xs text-slate-500">• Age {alert.patient_age}</span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                        isOpen
                          ? 'bg-rose-100 text-rose-700 border border-rose-300'
                          : isAck
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {alert.status}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Triggered {new Date(alert.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">Calculated Risk:</span>
                    <span className="text-sm font-bold font-mono text-rose-600">
                      {(alert.probability * 100).toFixed(1)}%
                    </span>
                    <span className="text-xs text-slate-400">
                      (Exceeded {(alert.threshold * 100).toFixed(0)}% threshold)
                    </span>
                  </div>

                  {/* Abnormal flags list */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {alert.flags.map((flag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-medium shadow-2xs"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  {isOpen && (
                    <button
                      onClick={() => onUpdateAlertStatus(alert.id, 'ACKNOWLEDGED')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}

                  {!isResolved && (
                    <button
                      onClick={() => onConvertAlertToTask(alert)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 shadow-xs transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Convert to Task</span>
                    </button>
                  )}

                  {!isResolved ? (
                    <button
                      onClick={() => onUpdateAlertStatus(alert.id, 'RESOLVED')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      Resolve
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Resolved
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
