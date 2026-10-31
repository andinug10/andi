import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  MoreVertical,
  Plus,
  Trash2,
  User,
  XCircle,
} from 'lucide-react';
import { ClinicalTask, TaskStatus } from '../types/clinical';

interface TasksViewProps {
  tasks: ClinicalTask[];
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenCreateTaskModal: () => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string; border: string }[] = [
  { id: 'TODO', title: 'To Do (Pending)', color: 'bg-slate-50 text-slate-800', border: 'border-slate-300' },
  { id: 'IN_PROGRESS', title: 'In Progress (Active Care)', color: 'bg-amber-50 text-amber-900', border: 'border-amber-300' },
  { id: 'DONE', title: 'Completed Interventions', color: 'bg-emerald-50 text-emerald-900', border: 'border-emerald-300' },
  { id: 'CANCELLED', title: 'Cancelled / Deferred', color: 'bg-slate-100 text-slate-600', border: 'border-slate-200' },
];

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onUpdateTaskStatus,
  onDeleteTask,
  onOpenCreateTaskModal,
}) => {
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const filteredTasks = tasks.filter((t) =>
    filterPriority === 'all' ? true : t.priority === filterPriority
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Clinical Task Board (Operations Layer)</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              ITDO Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Actionable clinical care interventions spawned from high-risk triggers and physician decisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Priority filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium">Priority:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <button
            onClick={onOpenCreateTaskModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 flex flex-col min-h-[500px] shadow-2xs"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">{col.title}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                    {colTasks.length}
                  </span>
                </div>
              </div>

              {/* Task Cards in Column */}
              <div className="space-y-3 flex-1">
                {colTasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                    No tasks in {col.id.toLowerCase().replace('_', ' ')}
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isUrgent = task.priority === 'urgent';
                    const isHigh = task.priority === 'high';

                    return (
                      <div
                        key={task.id}
                        className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-2.5"
                      >
                        {/* Top row: Patient & Priority badge */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-200">
                            {task.patient_ref}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                              isUrgent
                                ? 'bg-rose-100 text-rose-700 border border-rose-300'
                                : isHigh
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        {/* Title & Intervention */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">{task.title}</h4>
                          <span className="inline-block mt-1 text-[11px] font-semibold text-teal-800 bg-teal-50/80 px-2 py-0.5 rounded-sm border border-teal-100">
                            {task.intervention}
                          </span>
                        </div>

                        {/* Description */}
                        {task.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Assignee & Due Date */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 truncate max-w-[120px]">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{task.assigned_to}</span>
                          </span>

                          <span className="flex items-center gap-1 font-mono text-[10px] text-slate-600">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{task.due_date}</span>
                          </span>
                        </div>

                        {/* Status Change Selector & Delete */}
                        <div className="pt-2 flex items-center justify-between border-t border-slate-100 gap-1">
                          <select
                            value={task.status}
                            onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                            className="text-[11px] font-medium bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          >
                            <option value="TODO">Mark To Do</option>
                            <option value="IN_PROGRESS">Mark In Progress</option>
                            <option value="DONE">Mark Completed</option>
                            <option value="CANCELLED">Mark Cancelled</option>
                          </select>

                          <button
                            onClick={() => onDeleteTask(task.id)}
                            title="Delete Task"
                            aria-label={`Delete task ${task.title}`}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
