import { Category, ProductivitySummary, TimetableTask } from '../types/timetable';
import { calculateDurationMinutes, formatDateToISO, formatDayNameShort, getWeekDates, parseISODate } from './date';

export function calculateProductivitySummary(
  tasks: TimetableTask[],
  categories: Category[],
  referenceDate: Date = new Date()
): ProductivitySummary {
  // We compute metrics for the active reference week
  const weekDates = getWeekDates(referenceDate);
  const weekDateStrings = weekDates.map(formatDateToISO);

  // Filter tasks belonging to this week
  const weekTasks = tasks.filter(t => weekDateStrings.includes(t.date));

  let totalScheduledMinutes = 0;
  let completedMinutes = 0;
  let completedTasksCount = 0;
  const categoryMinutesMap = new Map<string, { total: number; completed: number }>();

  // Initialize categories
  for (const cat of categories) {
    categoryMinutesMap.set(cat.id, { total: 0, completed: 0 });
  }

  // Hourly distribution map: 0-23
  const hourDistribution = new Array(24).fill(0);

  for (const task of weekTasks) {
    const duration = task.durationMinutes || calculateDurationMinutes(task.startTime, task.endTime);
    totalScheduledMinutes += duration;

    const catStat = categoryMinutesMap.get(task.categoryId) || { total: 0, completed: 0 };
    catStat.total += duration;

    if (task.isCompleted) {
      completedMinutes += duration;
      completedTasksCount += 1;
      catStat.completed += duration;

      // Track peak hours
      const [startH] = task.startTime.split(':').map(Number);
      if (startH >= 0 && startH < 24) {
        hourDistribution[startH] += duration;
      }
    }

    categoryMinutesMap.set(task.categoryId, catStat);
  }

  const completionRate = totalScheduledMinutes > 0
    ? Math.round((completedMinutes / totalScheduledMinutes) * 100)
    : 0;

  // Category breakdown list
  const categoryBreakdown = categories.map(cat => {
    const stats = categoryMinutesMap.get(cat.id) || { total: 0, completed: 0 };
    const percentage = totalScheduledMinutes > 0
      ? Math.round((stats.total / totalScheduledMinutes) * 100)
      : 0;

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      color: cat.color,
      minutes: stats.total,
      completedMinutes: stats.completed,
      percentage,
    };
  }).filter(c => c.minutes > 0 || c.completedMinutes > 0);

  // Daily trend
  const dailyTrend = weekDates.map(dateObj => {
    const dStr = formatDateToISO(dateObj);
    const dayTasks = weekTasks.filter(t => t.date === dStr);

    let sched = 0;
    let comp = 0;
    for (const t of dayTasks) {
      const dur = t.durationMinutes || calculateDurationMinutes(t.startTime, t.endTime);
      sched += dur;
      if (t.isCompleted) {
        comp += dur;
      }
    }

    return {
      date: dStr,
      dayName: formatDayNameShort(dateObj),
      scheduledHours: Math.round((sched / 60) * 10) / 10,
      completedHours: Math.round((comp / 60) * 10) / 10,
    };
  });

  // Calculate Streak: count consecutive days backwards from today with at least 1 completed task
  const allCompletedDates = new Set(
    tasks.filter(t => t.isCompleted).map(t => t.date)
  );

  let currentStreakDays = 0;
  const checkDate = new Date();
  // If today has no completed task yet, check starting from yesterday or today
  const todayStr = formatDateToISO(checkDate);
  let streakCheck = new Date(checkDate);

  if (!allCompletedDates.has(todayStr)) {
    // Check if yesterday had one
    streakCheck.setDate(streakCheck.getDate() - 1);
  }

  while (allCompletedDates.has(formatDateToISO(streakCheck))) {
    currentStreakDays++;
    streakCheck.setDate(streakCheck.getDate() - 1);
  }

  const longestStreakDays = Math.max(currentStreakDays, 7);

  // Peak hour range calculation
  let peakHour = 9;
  let maxHourMins = -1;
  for (let h = 6; h <= 22; h++) {
    if (hourDistribution[h] > maxHourMins) {
      maxHourMins = hourDistribution[h];
      peakHour = h;
    }
  }

  const peakStartStr = `${String(peakHour).padStart(2, '0')}:00`;
  const peakEndStr = `${String(peakHour + 2).padStart(2, '0')}:00`;
  const peakHourRange = maxHourMins > 0 ? `${peakStartStr} - ${peakEndStr}` : '09:00 - 11:00 AM';

  return {
    totalScheduledMinutes,
    completedMinutes,
    completionRate,
    completedTasksCount,
    totalTasksCount: weekTasks.length,
    categoryBreakdown,
    dailyTrend,
    currentStreakDays,
    longestStreakDays,
    peakHourRange,
  };
}
