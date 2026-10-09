import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Category, TimetableTask } from '../types/timetable';
import { TaskCard } from './TaskCard';

interface TimetableGridProps {
  tasks: TimetableTask[];
  categories: Category[];
  currentDate: Date;
  onDateChange: (newDate: Date) => void;
  viewMode: 'week' | 'day' | '3day';
  onViewModeChange: (mode: 'week' | 'day' | '3day') => void;
  onEditTask: (task: TimetableTask) => void;
  onToggleComplete: (task: TimetableTask) => void;
  onQuickResize: (task: TimetableTask, deltaMinutes: number) => void;
  onTaskDropOnSlot: (taskId: string, targetDate: string, targetStartTime: string) => void;
  onSlotClick: (date: string, startTime: string) => void;
  selectedCategoryFilter: string | null;
  onSelectCategoryFilter: (catId: string | null) => void;
  startHour?: number;
  endHour?: number;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  tasks,
  categories,
  currentDate,
  onDateChange,
  viewMode,
  onViewModeChange,
  onEditTask,
  onToggleComplete,
  onQuickResize,
  onTaskDropOnSlot,
  onSlotClick,
  selectedCategoryFilter,
  onSelectCategoryFilter,
  startHour = 6,
  endHour = 23,
}) => {
  const [dragOverSlot, setDragOverSlot] = useState<{ date: string; hour: number } | null>(null);

  // Calculate days to display based on viewMode
  const getDays = () => {
    const days: { date: Date; dateStr: string; dayName: string; dayNumber: number; isToday: boolean }[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    if (viewMode === 'day') {
      const d = new Date(currentDate);
      const dateStr = d.toISOString().split('T')[0];
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      days.push({
        date: d,
        dateStr,
        dayName: dayNames[d.getDay()],
        dayNumber: d.getDate(),
        isToday: dateStr === todayStr,
      });
      return days;
    }

    if (viewMode === '3day') {
      for (let i = 0; i < 3; i++) {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.push({
          date: d,
          dateStr,
          dayName: dayNames[d.getDay()],
          dayNumber: d.getDate(),
          isToday: dateStr === todayStr,
        });
      }
      return days;
    }

    // Week view: Find Monday of this week
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + i);
      const dateStr = cur.toISOString().split('T')[0];
      days.push({
        date: cur,
        dateStr,
        dayName: dayNames[i],
        dayNumber: cur.getDate(),
        isToday: dateStr === todayStr,
      });
    }
    return days;
  };

  const days = getDays();

  // Navigation handlers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'day') next.setDate(next.getDate() - 1);
    else if (viewMode === '3day') next.setDate(next.getDate() - 3);
    else next.setDate(next.getDate() - 7);
    onDateChange(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'day') next.setDate(next.getDate() + 1);
    else if (viewMode === '3day') next.setDate(next.getDate() + 3);
    else next.setDate(next.getDate() + 7);
    onDateChange(next);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  // Date range title
  const getHeaderTitle = () => {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    if (days.length === 1) {
      const d = days[0].date;
      return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
    const first = days[0].date;
    const last = days[days.length - 1].date;
    return `${monthNames[first.getMonth()]} ${first.getDate()} – ${monthNames[last.getMonth()]} ${last.getDate()}, ${last.getFullYear()}`;
  };

  // Hours array
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  // Category lookup
  const categoryMap = new Map<string, Category>(categories.map(c => [c.id, c]));

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (!t.date) return false;
    if (selectedCategoryFilter && t.categoryId !== selectedCategoryFilter) return false;
    return true;
  });

  // Group tasks by date and hour slot
  const getTasksForSlot = (dateStr: string, hour: number) => {
    return filteredTasks.filter(t => {
      if (t.date !== dateStr) return false;
      if (!t.startTime) return false;
      const [h] = t.startTime.split(':').map(Number);
      return h === hour;
    });
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent, dateStr: string, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragOverSlot || dragOverSlot.date !== dateStr || dragOverSlot.hour !== hour) {
      setDragOverSlot({ date: dateStr, hour });
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Check if we actually left the slot
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverSlot(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dateStr: string, hour: number) => {
    e.preventDefault();
    setDragOverSlot(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const formattedHour = `${String(hour).padStart(2, '0')}:00`;
    onTaskDropOnSlot(taskId, dateStr, formattedHour);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Top Controls Toolbar: Date navigation + View switcher + Category filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/50">
        {/* Navigation & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60">
            <button
              onClick={handlePrev}
              title="Previous interval"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-700 rounded transition"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              title="Next interval"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-sm md:text-base font-semibold text-white tracking-tight">
            {getHeaderTitle()}
          </h2>
        </div>

        {/* Right side: Category Filters + View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter Pills (Functional Filter Buttons) */}
          <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1 border border-slate-800 overflow-x-auto max-w-full">
            <button
              onClick={() => onSelectCategoryFilter(null)}
              className={`px-2.5 py-1 text-xs rounded transition whitespace-nowrap ${
                selectedCategoryFilter === null
                  ? 'bg-slate-800 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategoryFilter(isSelected ? null : cat.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition whitespace-nowrap ${
                    isSelected
                      ? 'bg-slate-800 text-white font-medium shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* View mode segmented control */}
          <div className="flex items-center gap-0.5 bg-slate-900 rounded-lg p-1 border border-slate-800 shrink-0">
            <button
              onClick={() => onViewModeChange('day')}
              className={`px-2.5 py-1 text-xs rounded transition font-medium ${
                viewMode === 'day'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => onViewModeChange('3day')}
              className={`px-2.5 py-1 text-xs rounded transition font-medium md:hidden ${
                viewMode === '3day'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3-Day
            </button>
            <button
              onClick={() => onViewModeChange('week')}
              className={`px-2.5 py-1 text-xs rounded transition font-medium ${
                viewMode === 'week'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[640px] md:min-w-0">
          {/* Header Row: Days of Week */}
          <div className="sticky top-0 z-20 grid grid-flow-col border-b border-slate-800 bg-slate-950/95 backdrop-blur-xs"
               style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}>
            {/* Corner time gutter */}
            <div className="p-2.5 text-center text-[11px] font-mono text-slate-500 border-r border-slate-800/80">
              GMT
            </div>

            {/* Day columns headers */}
            {days.map((d) => (
              <div
                key={d.dateStr}
                className={`p-2.5 text-center border-r border-slate-800/80 last:border-r-0 ${
                  d.isToday ? 'bg-indigo-950/30' : ''
                }`}
              >
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  {d.dayName}
                </div>
                <div className="mt-0.5 flex items-center justify-center">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-mono font-semibold ${
                      d.isToday
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-200'
                    }`}
                  >
                    {d.dayNumber}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Time Rows */}
          <div className="divide-y divide-slate-800/60">
            {hours.map((hour) => {
              const hourLabel = `${String(hour).padStart(2, '0')}:00`;

              return (
                <div
                  key={hour}
                  className="grid grid-flow-col min-h-[64px]"
                  style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}
                >
                  {/* Hour label */}
                  <div className="p-2 text-right text-[11px] font-mono text-slate-400 border-r border-slate-800/80 select-none">
                    {hourLabel}
                  </div>

                  {/* Day slots */}
                  {days.map((d) => {
                    const slotTasks = getTasksForSlot(d.dateStr, hour);
                    const isDragTarget =
                      dragOverSlot?.date === d.dateStr && dragOverSlot?.hour === hour;

                    return (
                      <div
                        key={`${d.dateStr}-${hour}`}
                        onDragOver={(e) => handleDragOver(e, d.dateStr, hour)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, d.dateStr, hour)}
                        onClick={() => onSlotClick(d.dateStr, hourLabel)}
                        className={`group relative p-1.5 border-r border-slate-800/80 last:border-r-0 transition-colors ${
                          d.isToday ? 'bg-indigo-950/10' : ''
                        } ${
                          isDragTarget
                            ? 'bg-indigo-600/25 ring-2 ring-indigo-500 ring-inset'
                            : 'hover:bg-slate-900/40'
                        }`}
                      >
                        {/* Tasks in this hour slot */}
                        <div className="space-y-1.5">
                          {slotTasks.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              category={categoryMap.get(task.categoryId)}
                              onEdit={onEditTask}
                              onToggleComplete={onToggleComplete}
                              onQuickResize={onQuickResize}
                            />
                          ))}
                        </div>

                        {/* Hover Quick Schedule Prompt (shown when empty on hover) */}
                        {slotTasks.length === 0 && (
                          <div className="hidden group-hover:flex items-center justify-center h-full min-h-[44px] text-slate-400 hover:text-indigo-300">
                            <span className="flex items-center gap-1 text-[11px] font-medium">
                              <Plus className="w-3.5 h-3.5" />
                              <span>Schedule</span>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
