import React, { useState } from 'react';
import { GripVertical, Inbox, Plus, Trash2, X } from 'lucide-react';
import { Category, TimetableTask } from '../types/timetable';
import { getTodayISO } from '../utils/date';

interface TaskInboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  tasks: TimetableTask[];
  onAddTask: (task: Partial<TimetableTask>) => void;
  onDeleteTask: (taskId: string) => void;
  onScheduleNow: (task: TimetableTask) => void;
}

export const TaskInboxDrawer: React.FC<TaskInboxDrawerProps> = ({
  isOpen,
  onClose,
  categories,
  tasks,
  onAddTask,
  onDeleteTask,
  onScheduleNow,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id || 'deep-work');
  const [durationMinutes, setDurationMinutes] = useState(60);

  // Unscheduled tasks: tasks where date is '' or 'inbox'
  const inboxTasks = tasks.filter((t) => t.date === 'inbox' || !t.date || t.date === '');

  const handleCreateInboxTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTask({
      title: newTitle.trim(),
      categoryId: selectedCatId,
      date: 'inbox',
      startTime: '09:00',
      endTime: '10:00',
      durationMinutes,
      isCompleted: false,
    });

    setNewTitle('');
  };

  const categoryMap = new Map<string, Category>();
  for (const c of categories) {
    categoryMap.set(c.id, c);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Unscheduled Task Inbox</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleCreateInboxTask} className="p-4 border-b border-slate-800/80 bg-slate-900/40">
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Quick Add to Backlog
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Prepare Client Proposal..."
            className="flex-1 rounded-lg bg-slate-950 border border-slate-700/80 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shrink-0"
            title="Add task"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <select
            value={selectedCatId}
            onChange={(e) => setSelectedCatId(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
            className="w-24 bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="30">30 mins</option>
            <option value="45">45 mins</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hrs</option>
            <option value="120">2 hours</option>
          </select>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Tip: Drag any item below directly into any time slot on the timetable grid!
        </p>
      </form>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {inboxTasks.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4">
            <Inbox className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-xs font-medium text-slate-400">Inbox is empty</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
              Add upcoming tasks here, then drag and drop them onto your weekly timetable when you are ready.
            </p>
          </div>
        ) : (
          inboxTasks.map((task) => {
            const cat = categoryMap.get(task.categoryId);
            const color = cat?.color || '#6366f1';
            const bgLight = cat?.bgLight || 'rgba(99, 102, 241, 0.15)';
            const borderColor = cat?.borderColor || '#4f46e5';

            return (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify({ taskId: task.id }));
                  e.dataTransfer.effectAllowed = 'move';
                }}
                style={{ backgroundColor: bgLight, borderColor }}
                className="group relative flex items-center justify-between p-2.5 rounded-lg border text-left cursor-grab active:cursor-grabbing hover:brightness-110 transition-all select-none"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {task.title}
                    </p>
                    <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                      {task.durationMinutes || 60} mins · {cat?.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onScheduleNow(task)}
                    className="px-2 py-1 text-[11px] font-medium text-indigo-300 hover:text-white bg-slate-800 hover:bg-indigo-600 rounded transition-colors"
                  >
                    Schedule
                  </button>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete task"
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
};
