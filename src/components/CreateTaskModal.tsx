import React, { useState } from 'react';
import { X, CheckSquare, Sparkles } from 'lucide-react';
import { ClinicalTask, ClinicalAlert } from '../types/clinical';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (task: Partial<ClinicalTask>) => void;
  initialAlert?: ClinicalAlert | null;
}

const COMMON_INTERVENTIONS = [
  'Diagnostic Laboratory Panel (Venous HbA1c + Fasting Plasma Glucose)',
  'Clinical Medical Nutrition Therapy (Low-GI Diet Consult)',
  'Pharmacotherapy Review (Metformin tolerability & dosing)',
  'Continuous Glucose Monitoring (CGM) 14-Day Baseline Sensor',
  'Cardiovascular Risk & Blood Pressure Stratification',
  'Endocrinology Specialist Clinical Referral',
];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSaveTask,
  initialAlert,
}) => {
  const [patientRef, setPatientRef] = useState<string>(initialAlert ? initialAlert.patient_ref : 'PT-8942');
  const [title, setTitle] = useState<string>(
    initialAlert
      ? `Confirmatory HbA1c Lab Panel for ${initialAlert.patient_ref}`
      : 'Order Confirmatory Venous HbA1c Panel'
  );
  const [intervention, setIntervention] = useState<string>(COMMON_INTERVENTIONS[0]);
  const [description, setDescription] = useState<string>(
    initialAlert
      ? `Triggered from high-risk alert (${(initialAlert.probability * 100).toFixed(1)}% diabetes risk). Flags: ${initialAlert.flags.join(', ')}`
      : 'Conduct standard clinical diagnostic workup following elevated metabolic risk score.'
  );
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [assignedTo, setAssignedTo] = useState<string>('Dr. Sarah Lin (PCP)');
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date(Date.now() + 86400000 * 5);
    return d.toISOString().split('T')[0];
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTask({
      alert_id: initialAlert ? initialAlert.id : undefined,
      patient_ref: patientRef,
      title,
      intervention,
      description,
      priority,
      assigned_to: assignedTo,
      due_date: dueDate,
      status: 'TODO',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialAlert ? 'Convert Alert to Clinical Task' : 'Create New Intervention Task'}
              </h3>
              <span className="text-xs text-slate-500">ITDO Framework: Operations Execution Layer</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-patient-ref" className="block text-xs font-semibold text-slate-700 mb-1">
                Patient ID
              </label>
              <input
                id="task-patient-ref"
                type="text"
                required
                value={patientRef}
                onChange={(e) => setPatientRef(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 font-mono font-bold"
              />
            </div>

            <div>
              <label htmlFor="task-priority" className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="urgent">Urgent (&lt; 48h)</option>
                <option value="high">High (&lt; 7 days)</option>
                <option value="medium">Medium (Routine)</option>
                <option value="low">Low (Maintenance)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="task-title" className="block text-xs font-semibold text-slate-700 mb-1">
              Task Title
            </label>
            <input
              id="task-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label htmlFor="task-intervention" className="block text-xs font-semibold text-slate-700 mb-1">
              Clinical Intervention Type
            </label>
            <select
              id="task-intervention"
              value={intervention}
              onChange={(e) => setIntervention(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              {COMMON_INTERVENTIONS.map((item, idx) => (
                <option key={idx} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="task-description" className="block text-xs font-semibold text-slate-700 mb-1">
              Clinical Context / Description
            </label>
            <textarea
              id="task-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-assigned-to" className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Clinician
              </label>
              <input
                id="task-assigned-to"
                type="text"
                required
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label htmlFor="task-due-date" className="block text-xs font-semibold text-slate-700 mb-1">
                Due Date
              </label>
              <input
                id="task-due-date"
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-xs transition-colors"
            >
              Create Clinical Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
