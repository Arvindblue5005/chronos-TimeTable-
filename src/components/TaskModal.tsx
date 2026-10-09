import React, { useEffect, useState } from 'react';
import { Bell, Calendar, Clock, Repeat, Trash2, X } from 'lucide-react';
import { Category, RecurrenceFrequency, TimetableTask } from '../types/timetable';
import { addMinutesToTime, calculateDurationMinutes, getTodayISO } from '../utils/date';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<TimetableTask>) => void;
  onDelete?: (taskId: string) => void;
  initialTask?: TimetableTask | null;
  defaultDate?: string;
  defaultStartTime?: string;
  categories: Category[];
  onAddCategory?: (name: string, color: string) => void;
}

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];
const DAYS_OF_WEEK = [
  { label: 'M', value: 1, full: 'Mon' },
  { label: 'T', value: 2, full: 'Tue' },
  { label: 'W', value: 3, full: 'Wed' },
  { label: 'T', value: 4, full: 'Thu' },
  { label: 'F', value: 5, full: 'Fri' },
  { label: 'S', value: 6, full: 'Sat' },
  { label: 'S', value: 0, full: 'Sun' },
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialTask,
  defaultDate,
  defaultStartTime,
  categories,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'deep-work');
  const [date, setDate] = useState(getTodayISO());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [recurrenceFreq, setRecurrenceFreq] = useState<RecurrenceFrequency>('none');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [reminderMinutes, setReminderMinutes] = useState<number>(5);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setCategoryId(initialTask.categoryId);
      setDate(initialTask.date);
      setStartTime(initialTask.startTime);
      setEndTime(initialTask.endTime);
      setRecurrenceFreq(initialTask.recurrence?.frequency || 'none');
      setSelectedDays(initialTask.recurrence?.daysOfWeek || []);
      setReminderMinutes(initialTask.reminderMinutesBefore ?? 5);
    } else {
      setTitle('');
      setDescription('');
      setCategoryId(categories[0]?.id || 'deep-work');
      const targetDate = defaultDate || getTodayISO();
      setDate(targetDate);
      const targetStart = defaultStartTime || '09:00';
      setStartTime(targetStart);
      setEndTime(addMinutesToTime(targetStart, 60));
      setRecurrenceFreq('none');
      setSelectedDays([]);
      setReminderMinutes(5);
    }
  }, [initialTask, defaultDate, defaultStartTime, isOpen, categories]);

  if (!isOpen) return null;

  const currentDuration = calculateDurationMinutes(startTime, endTime);

  const handlePresetDuration = (minutes: number) => {
    setEndTime(addMinutesToTime(startTime, minutes));
  };

  const toggleDayOfWeek = (dayVal: number) => {
    setSelectedDays(prev =>
      prev.includes(dayVal) ? prev.filter(d => d !== dayVal) : [...prev, dayVal]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const durationMinutes = calculateDurationMinutes(startTime, endTime);

    const taskPayload: Partial<TimetableTask> = {
      ...(initialTask ? { id: initialTask.id } : {}),
      title: title.trim(),
      description: description.trim() || undefined,
      categoryId,
      date,
      startTime,
      endTime,
      durationMinutes,
      isCompleted: initialTask?.isCompleted || false,
      recurrence:
        recurrenceFreq !== 'none'
          ? {
              frequency: recurrenceFreq,
              daysOfWeek: recurrenceFreq === 'weekly' ? selectedDays : undefined,
            }
          : undefined,
      reminderMinutesBefore: reminderMinutes,
    };

    onSave(taskPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-base font-semibold text-white">
            {initialTask ? 'Edit Scheduled Task' : 'Schedule New Task'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Task Title
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep Architecture Review"
              className="w-full rounded-lg bg-slate-950 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Category & Color
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left text-xs transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-slate-800 shadow-xs'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate text-slate-200 font-medium">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700/80 px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Start Time
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => {
                  const newStart = e.target.value;
                  setStartTime(newStart);
                  // Maintain same duration
                  setEndTime(addMinutesToTime(newStart, currentDuration));
                }}
                className="w-full rounded-lg bg-slate-950 border border-slate-700/80 px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                End Time
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700/80 px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Duration Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-slate-400">
                Duration Presets:
              </span>
              <span className="text-[11px] font-mono font-medium text-indigo-400 tabular-nums">
                Current: {currentDuration} mins
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DURATION_PRESETS.map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => handlePresetDuration(dur)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                    currentDuration === dur
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {dur}m
                </button>
              ))}
            </div>
          </div>

          {/* Recurrence Settings */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-indigo-400" />
              Recurrence Rule
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
              {[
                { id: 'none', label: 'One-time' },
                { id: 'daily', label: 'Every Day' },
                { id: 'weekdays', label: 'Mon – Fri' },
                { id: 'weekly', label: 'Specific Days' },
              ].map((rec) => (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => setRecurrenceFreq(rec.id as RecurrenceFrequency)}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                    recurrenceFreq === rec.id
                      ? 'border-indigo-500 bg-indigo-950/40 text-indigo-200 font-medium'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {rec.label}
                </button>
              ))}
            </div>

            {/* Days of week selector for 'weekly' */}
            {recurrenceFreq === 'weekly' && (
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="text-xs text-slate-400 mr-1">Repeat on:</span>
                {DAYS_OF_WEEK.map((d) => {
                  const active = selectedDays.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDayOfWeek(d.value)}
                      className={`w-7 h-7 rounded-full text-xs font-semibold transition-colors ${
                        active
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                      title={d.full}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Daily Notification / Reminder */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              Notification Reminder
            </label>
            <select
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(parseInt(e.target.value, 10))}
              className="w-full rounded-lg bg-slate-950 border border-slate-700/80 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="0">At time of session (0m)</option>
              <option value="5">5 minutes before</option>
              <option value="10">10 minutes before</option>
              <option value="15">15 minutes before</option>
              <option value="30">30 minutes before</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Notes & Agenda (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key objectives, links, or prerequisites..."
              className="w-full rounded-lg bg-slate-950 border border-slate-700/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            {initialTask && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialTask.id);
                  onClose();
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
              >
                {initialTask ? 'Save Changes' : 'Schedule Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
