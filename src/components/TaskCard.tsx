import React from 'react';
import { Bell, Check, Clock, GripVertical, Repeat } from 'lucide-react';
import { Category, TimetableTask } from '../types/timetable';
import { playCompletionSound } from '../utils/sound';

export interface TaskCardProps {
  task: TimetableTask;
  category?: Category;
  compact?: boolean;
  onEdit?: (task: TimetableTask) => void;
  onClick?: (task: TimetableTask) => void;
  onToggleComplete?: (task: TimetableTask) => void;
  onQuickResize?: (task: TimetableTask, deltaMinutes: number) => void;
  onDragStart?: (e: React.DragEvent, task: TimetableTask) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  category,
  compact = false,
  onEdit,
  onClick,
  onToggleComplete,
  onQuickResize,
  onDragStart,
}) => {
  const isRecurring = Boolean(task.recurrence && task.recurrence.frequency !== 'none');
  const duration = task.durationMinutes || 60;
  const color = category?.color || '#6366f1';
  const borderColor = category?.borderColor || '#4f46e5';
  const bgLight = category?.bgLight || 'rgba(99, 102, 241, 0.15)';

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) {
      onDragStart(e, task);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.isCompleted) {
      playCompletionSound();
    }
    if (onToggleComplete) {
      onToggleComplete(task);
    }
  };

  const handleClick = () => {
    if (onEdit) {
      onEdit(task);
    } else if (onClick) {
      onClick(task);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      style={{
        backgroundColor: task.isCompleted ? 'rgba(15, 23, 42, 0.6)' : bgLight,
        borderColor: task.isCompleted ? 'rgba(71, 85, 105, 0.4)' : borderColor,
      }}
      className={`group relative flex flex-col justify-between rounded-md border p-2 text-left transition-all hover:brightness-110 cursor-grab active:cursor-grabbing select-none ${
        task.isCompleted ? 'opacity-55' : 'shadow-xs'
      } ${compact ? 'py-1 px-1.5' : 'p-2'}`}
    >
      {/* Category indicator line */}
      <div
        className="absolute top-1 bottom-1 left-1 w-1 rounded-full"
        style={{ backgroundColor: color }}
      />

      <div className="pl-2">
        <div className="flex items-start justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={handleToggle}
              className={`flex items-center justify-center w-3.5 h-3.5 rounded-sm border transition-colors shrink-0 ${
                task.isCompleted
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'border-slate-500/80 hover:border-slate-300 bg-slate-900/60'
              }`}
              title={task.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
            >
              {task.isCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </button>

            <h4
              className={`text-xs font-semibold tracking-tight text-white truncate ${
                task.isCompleted ? 'line-through text-slate-400' : ''
              }`}
            >
              {task.title}
            </h4>
          </div>

          <div className="flex items-center gap-1 text-slate-400 shrink-0">
            {isRecurring && (
              <span title={`Recurring: ${task.recurrence?.frequency}`}>
                <Repeat className="w-3 h-3 text-indigo-300" />
              </span>
            )}
            {task.reminderMinutesBefore !== undefined && task.reminderMinutesBefore > 0 && (
              <span title={`Reminder: ${task.reminderMinutesBefore}m before`}>
                <Bell className="w-2.5 h-2.5 text-amber-400" />
              </span>
            )}
            <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity" />
          </div>
        </div>

        {/* Time and duration */}
        {!compact && task.startTime && (
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-300 font-mono tabular-nums">
            <div className="flex items-center gap-1.5">
              <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
              <span>
                {task.startTime} – {task.endTime}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">{duration}m</span>
            </div>

            {/* Quick +/- 15m duration adjustment buttons */}
            {onQuickResize && !task.isCompleted && (
              <div
                className="hidden group-hover:flex items-center gap-1 text-[10px]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onQuickResize(task, -15)}
                  disabled={duration <= 15}
                  className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30"
                  title="Shorten by 15 mins"
                >
                  -15
                </button>
                <button
                  type="button"
                  onClick={() => onQuickResize(task, 15)}
                  className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                  title="Lengthen by 15 mins"
                >
                  +15
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
