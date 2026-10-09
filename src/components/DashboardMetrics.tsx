import React from 'react';
import {
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  Flame,
  PieChart,
  Zap,
} from 'lucide-react';
import { Category, TimetableTask } from '../types/timetable';
import { calculateProductivitySummary } from '../utils/metrics';

interface DashboardMetricsProps {
  tasks: TimetableTask[];
  categories: Category[];
  currentDate: Date;
  onExportCSV: () => void;
  onExportJSON: () => void;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  tasks,
  categories,
  currentDate,
  onExportCSV,
  onExportJSON,
}) => {
  const summary = calculateProductivitySummary(tasks, categories, currentDate);

  const scheduledHours = Math.round((summary.totalScheduledMinutes / 60) * 10) / 10;
  const completedHours = Math.round((summary.completedMinutes / 60) * 10) / 10;

  // Max daily hours for scaling chart
  const maxDayHours = Math.max(
    ...summary.dailyTrend.map((d) => Math.max(d.scheduledHours, d.completedHours)),
    4
  );

  return (
    <div className="flex-1 overflow-y-auto space-y-6 p-4 sm:p-6 bg-slate-950 text-slate-100">
      {/* Top Banner & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Productivity Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Weekly focus trends, completion rates, and time allocation distribution.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors shadow-xs"
            title="Download Timetable as CSV"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            Export CSV
          </button>
          <button
            onClick={onExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors shadow-xs"
            title="Backup Encrypted Vault"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            Encrypted Backup
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Focus Hours */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Completed Focus</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {completedHours}h
            </span>
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              of {scheduledHours}h planned
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, summary.completionRate)}%` }}
            />
          </div>
        </div>

        {/* Completion Rate */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Execution Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {summary.completionRate}%
            </span>
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              {summary.completedTasksCount}/{summary.totalTasksCount} sessions
            </span>
          </div>
          <div className="mt-3 text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <Zap className="w-3 h-3" />
            {summary.completionRate >= 70 ? 'On target for weekly goals' : 'Keep pushing forward'}
          </div>
        </div>

        {/* Daily Streak */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Focus Streak</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {summary.currentStreakDays} days
            </span>
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              Best: {summary.longestStreakDays}d
            </span>
          </div>
          <div className="mt-3 text-[11px] text-amber-400/90 flex items-center gap-1">
            <Award className="w-3 h-3" />
            Consistency across days
          </div>
        </div>

        {/* Peak Focus Window */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Peak Focus Window</span>
            <Zap className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold font-mono text-white tabular-nums">
              {summary.peakHourRange}
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            Highest completion density
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend Bar Chart (2 columns) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Daily Focus Distribution
              </h3>
              <p className="text-xs text-slate-400">Planned hours vs actual completed hours</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-700" />
                <span className="text-slate-400">Planned</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                <span className="text-slate-200">Completed</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-800/80">
            {summary.dailyTrend.map((day) => {
              const plannedHeight = (day.scheduledHours / maxDayHours) * 100;
              const completedHeight = (day.completedHours / maxDayHours) * 100;

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  {/* Tooltip / value */}
                  <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                    {day.completedHours}h
                  </span>

                  {/* Dual Bars */}
                  <div className="w-full flex items-end justify-center gap-1 h-40">
                    {/* Planned Bar */}
                    <div
                      className="w-3 sm:w-4 rounded-t bg-slate-800 hover:bg-slate-700 transition-all"
                      style={{ height: `${Math.max(4, plannedHeight)}%` }}
                      title={`Planned: ${day.scheduledHours}h`}
                    />
                    {/* Completed Bar */}
                    <div
                      className="w-3 sm:w-4 rounded-t bg-indigo-500 hover:bg-indigo-400 transition-all shadow-xs"
                      style={{ height: `${Math.max(4, completedHeight)}%` }}
                      title={`Completed: ${day.completedHours}h`}
                    />
                  </div>

                  {/* Day Label */}
                  <span className="text-xs font-semibold text-slate-300 mt-2">
                    {day.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown (1 column) */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-indigo-400" />
              Category Allocation
            </h3>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {summary.categoryBreakdown.length} active
            </span>
          </div>

          <div className="flex-1 space-y-3.5 overflow-y-auto pr-1">
            {summary.categoryBreakdown.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-500">
                No scheduled sessions this week
              </div>
            ) : (
              summary.categoryBreakdown.map((cat) => {
                const hours = Math.round((cat.minutes / 60) * 10) / 10;
                const compHours = Math.round((cat.completedMinutes / 60) * 10) / 10;

                return (
                  <div key={cat.categoryId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-medium text-slate-200 truncate">
                          {cat.categoryName}
                        </span>
                      </div>
                      <span className="font-mono text-slate-300 tabular-nums shrink-0">
                        {compHours}h / {hours}h ({cat.percentage}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          backgroundColor: cat.color,
                          width: `${cat.percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
