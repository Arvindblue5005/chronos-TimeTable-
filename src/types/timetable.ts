export type RecurrenceFrequency = 'none' | 'daily' | 'weekdays' | 'weekly' | 'custom';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval?: number; // e.g., every 2 weeks
  daysOfWeek?: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  endDate?: string; // YYYY-MM-DD
}

export interface Category {
  id: string;
  name: string;
  color: string; // Tailwind hex color or accent code
  textColor: string;
  borderColor: string;
  bgLight: string;
}

export interface TimetableTask {
  id: string;
  title: string;
  description?: string;
  categoryId: string;
  
  // Date and Time (format: YYYY-MM-DD and HH:mm)
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "09:00"
  endTime: string; // e.g. "10:30"
  durationMinutes: number; // calculated duration
  
  // Status
  isCompleted: boolean;
  completedAt?: string;
  
  // Recurrence
  recurrence?: RecurrenceRule;
  parentRecurringId?: string; // ID of template task if this is an occurrence
  
  // Notifications & Reminders
  reminderMinutesBefore?: number; // 0, 5, 10, 15, 30
  notified?: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  taskId?: string;
  type: 'reminder' | 'daily_digest' | 'sync' | 'system';
}

export interface UserPreferences {
  vaultId: string;
  encryptionPassphrase: string;
  dailyDigestEnabled: boolean;
  dailyDigestTime: string; // e.g. "08:00"
  soundChimeEnabled: boolean;
  browserNotificationsEnabled: boolean;
  startHour: number; // e.g. 6 (6 AM)
  endHour: number; // e.g. 23 (11 PM)
  defaultDurationMinutes: number;
}

export interface ProductivitySummary {
  totalScheduledMinutes: number;
  completedMinutes: number;
  completionRate: number;
  completedTasksCount: number;
  totalTasksCount: number;
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    color: string;
    minutes: number;
    completedMinutes: number;
    percentage: number;
  }[];
  dailyTrend: {
    date: string;
    dayName: string;
    scheduledHours: number;
    completedHours: number;
  }[];
  currentStreakDays: number;
  longestStreakDays: number;
  peakHourRange: string;
}

export interface EncryptedVaultPayload {
  vaultId: string;
  ciphertext: string;
  iv: string;
  salt: string;
  revision: number;
  updatedAt: string;
}
