/**
 * Date and time helper utilities
 */

export function formatDateToISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getTodayISO(): string {
  return formatDateToISO(new Date());
}

/**
 * Returns array of 7 dates (Monday to Sunday) for the week containing referenceDate
 */
export function getWeekDates(referenceDate: Date): Date[] {
  const current = new Date(referenceDate);
  const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday
  // Distance to Monday (if Sunday (0), distance is -6)
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(current);
  monday.setDate(current.getDate() + distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(monday);
    nextDate.setDate(monday.getDate() + i);
    dates.push(nextDate);
  }
  return dates;
}

export function formatDayNameShort(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

export function formatMonthDay(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatTimeDisplay(timeStr: string): string {
  // e.g. "09:00" -> "9:00 AM", "14:30" -> "2:30 PM"
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m} ${ampm}`;
}

export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function calculateDurationMinutes(startTime: string, endTime: string): number {
  const start = timeStringToMinutes(startTime);
  const end = timeStringToMinutes(endTime);
  return Math.max(15, end - start);
}

export function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const total = timeStringToMinutes(timeStr) + minutesToAdd;
  const clamped = Math.min(23 * 60 + 59, Math.max(0, total));
  return minutesToTimeString(clamped);
}
