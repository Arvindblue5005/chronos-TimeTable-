import { TimetableTask } from '../types/timetable';
import { parseISODate } from './date';

/**
 * Checks if a recurring task applies to a specific target date
 */
export function doesTaskOccurOnDate(task: TimetableTask, targetDateStr: string): boolean {
  if (!task.recurrence || task.recurrence.frequency === 'none') {
    return task.date === targetDateStr;
  }

  // If target date is before task start date, false
  if (targetDateStr < task.date) {
    return false;
  }

  // If task has an end date and target is past end date, false
  if (task.recurrence.endDate && targetDateStr > task.recurrence.endDate) {
    return false;
  }

  const targetDate = parseISODate(targetDateStr);
  const targetDayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon ...

  switch (task.recurrence.frequency) {
    case 'daily': {
      const interval = task.recurrence.interval || 1;
      const origin = parseISODate(task.date);
      const diffTime = targetDate.getTime() - origin.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      return diffDays >= 0 && diffDays % interval === 0;
    }

    case 'weekdays':
      // Monday (1) through Friday (5)
      return targetDayOfWeek >= 1 && targetDayOfWeek <= 5;

    case 'weekly': {
      // If specified daysOfWeek
      if (task.recurrence.daysOfWeek && task.recurrence.daysOfWeek.length > 0) {
        return task.recurrence.daysOfWeek.includes(targetDayOfWeek);
      }
      // Default to same day of week as initial task
      const originDate = parseISODate(task.date);
      return originDate.getDay() === targetDayOfWeek;
    }

    case 'custom': {
      // e.g., interval in days
      const origin = parseISODate(task.date);
      const diffTime = targetDate.getTime() - origin.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      const interval = task.recurrence.interval || 1;
      return diffDays >= 0 && diffDays % interval === 0;
    }

    default:
      return task.date === targetDateStr;
  }
}

/**
 * Materializes virtual occurrences for a set of dates for recurring tasks.
 * Avoids duplicate if a specific overridden instance already exists in saved tasks for that date.
 */
export function materializeTasksForDateRange(
  allTasks: TimetableTask[],
  dateStrings: string[]
): TimetableTask[] {
  const result: TimetableTask[] = [];
  const existingKeys = new Set<string>();

  // First add all concrete (non-recurring or specific recorded) tasks
  for (const task of allTasks) {
    if (!task.recurrence || task.recurrence.frequency === 'none' || task.parentRecurringId) {
      if (dateStrings.includes(task.date)) {
        result.push(task);
        existingKeys.add(`${task.parentRecurringId || task.id}_${task.date}`);
      }
    }
  }

  // Now expand recurring master templates for each date in range
  for (const master of allTasks) {
    if (master.recurrence && master.recurrence.frequency !== 'none' && !master.parentRecurringId) {
      for (const dateStr of dateStrings) {
        const key = `${master.id}_${dateStr}`;
        if (existingKeys.has(key)) {
          // An instance or completion was already specifically recorded for this date
          continue;
        }

        if (doesTaskOccurOnDate(master, dateStr)) {
          // If it's the exact origin date, include master itself if not already added
          if (dateStr === master.date) {
            result.push(master);
            existingKeys.add(key);
          } else {
            // Virtual instance
            result.push({
              ...master,
              id: `${master.id}__occ__${dateStr}`,
              parentRecurringId: master.id,
              date: dateStr,
              isCompleted: false, // Virtual occurrence defaults to false until toggled
            });
            existingKeys.add(key);
          }
        }
      }
    }
  }

  return result;
}

/**
 * Expands recurring tasks for a specific date range (start to end ISO dates)
 */
export function expandTasksForDateRange(
  allTasks: TimetableTask[],
  startDateStr: string,
  endDateStr: string
): TimetableTask[] {
  const dates: string[] = [];
  const current = new Date(startDateStr);
  const end = new Date(endDateStr);

  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }

  return materializeTasksForDateRange(allTasks, dates);
}
