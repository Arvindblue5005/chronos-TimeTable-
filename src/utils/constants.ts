import { Category, UserPreferences } from '../types/timetable';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'deep-work',
    name: 'Deep Work',
    color: '#6366f1',
    textColor: '#e0e7ff',
    borderColor: '#4f46e5',
    bgLight: 'rgba(99, 102, 241, 0.15)',
  },
  {
    id: 'development',
    name: 'Development',
    color: '#0284c7',
    textColor: '#e0f2fe',
    borderColor: '#0369a1',
    bgLight: 'rgba(2, 132, 199, 0.15)',
  },
  {
    id: 'strategy',
    name: 'Strategy & Review',
    color: '#8b5cf6',
    textColor: '#ede9fe',
    borderColor: '#7c3aed',
    bgLight: 'rgba(139, 92, 246, 0.15)',
  },
  {
    id: 'health',
    name: 'Health & Workout',
    color: '#10b981',
    textColor: '#d1fae5',
    borderColor: '#059669',
    bgLight: 'rgba(16, 185, 129, 0.15)',
  },
  {
    id: 'learning',
    name: 'Learning & Books',
    color: '#f59e0b',
    textColor: '#fef3c7',
    borderColor: '#d97706',
    bgLight: 'rgba(245, 158, 11, 0.15)',
  },
  {
    id: 'personal',
    name: 'Personal & Rest',
    color: '#f43f5e',
    textColor: '#ffe4e6',
    borderColor: '#e11d48',
    bgLight: 'rgba(244, 63, 94, 0.15)',
  },
  {
    id: 'meetings',
    name: 'Meetings & Sync',
    color: '#06b6d4',
    textColor: '#cffafe',
    borderColor: '#0891b2',
    bgLight: 'rgba(6, 182, 212, 0.15)',
  },
];

export const DEFAULT_PREFERENCES: UserPreferences = {
  vaultId: '',
  encryptionPassphrase: '',
  dailyDigestEnabled: true,
  dailyDigestTime: '08:00',
  soundChimeEnabled: true,
  browserNotificationsEnabled: true,
  startHour: 6, // 06:00
  endHour: 23, // 23:00
  defaultDurationMinutes: 60,
};

export const COLOR_PALETTES = [
  { name: 'Indigo', color: '#6366f1', borderColor: '#4f46e5', bgLight: 'rgba(99, 102, 241, 0.15)', textColor: '#e0e7ff' },
  { name: 'Sky', color: '#0284c7', borderColor: '#0369a1', bgLight: 'rgba(2, 132, 199, 0.15)', textColor: '#e0f2fe' },
  { name: 'Emerald', color: '#10b981', borderColor: '#059669', bgLight: 'rgba(16, 185, 129, 0.15)', textColor: '#d1fae5' },
  { name: 'Amber', color: '#f59e0b', borderColor: '#d97706', bgLight: 'rgba(245, 158, 11, 0.15)', textColor: '#fef3c7' },
  { name: 'Rose', color: '#f43f5e', borderColor: '#e11d48', bgLight: 'rgba(244, 63, 94, 0.15)', textColor: '#ffe4e6' },
  { name: 'Violet', color: '#8b5cf6', borderColor: '#7c3aed', bgLight: 'rgba(139, 92, 246, 0.15)', textColor: '#ede9fe' },
  { name: 'Cyan', color: '#06b6d4', borderColor: '#0891b2', bgLight: 'rgba(6, 182, 212, 0.15)', textColor: '#cffafe' },
  { name: 'Slate', color: '#64748b', borderColor: '#475569', bgLight: 'rgba(100, 116, 139, 0.15)', textColor: '#f1f5f9' },
];
