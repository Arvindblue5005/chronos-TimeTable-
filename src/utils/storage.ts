import { Category, InAppNotification, TimetableTask, UserPreferences } from '../types/timetable';
import { DEFAULT_CATEGORIES, DEFAULT_PREFERENCES } from './constants';
import { decryptData, encryptData, generateSecurePassphrase, generateVaultId } from './crypto';

const STORAGE_KEYS = {
  TASKS: 'chronos_tasks_v1',
  CATEGORIES: 'chronos_categories_v1',
  PREFERENCES: 'chronos_prefs_v1',
  NOTIFICATIONS: 'chronos_notifs_v1',
  REVISION: 'chronos_revision_v1',
  LAST_DIGEST_DATE: 'chronos_last_digest_v1',
  PENDING_SYNC: 'chronos_pending_sync_v1',
  LAST_SYNC: 'chronos_last_sync_v1',
};

export interface LocalAppData {
  tasks: TimetableTask[];
  categories: Category[];
  preferences: UserPreferences;
  notifications: InAppNotification[];
  revision: number;
}

export interface SyncResponse {
  success: boolean;
  message: string;
  revision?: number;
  timestamp?: string;
  updatedAt?: string;
  tasks?: TimetableTask[];
  categories?: Category[];
  data?: { tasks: TimetableTask[]; categories: Category[]; preferences: UserPreferences };
  error?: string;
}

/**
 * Generate starter seed tasks for a rich initial experience
 */
export function generateSeedTasks(): TimetableTask[] {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  const relDate = (offset: number) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + offset);
    const yr = dt.getFullYear();
    const mo = String(dt.getMonth() + 1).padStart(2, '0');
    const dy = String(dt.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
  };

  return [
    {
      id: 'seed-task-1',
      title: 'Deep Architecture & System Design',
      description: 'Focus on core system modules, cryptographic salt rotations, and sync protocol.',
      categoryId: 'deep-work',
      date: todayStr,
      startTime: '08:30',
      endTime: '10:30',
      durationMinutes: 120,
      isCompleted: true,
      completedAt: `${todayStr}T10:30:00Z`,
      recurrence: { frequency: 'weekdays' },
      reminderMinutesBefore: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'seed-task-2',
      title: 'Frontend Component Polish',
      description: 'Implement drag-and-drop timetable grid and responsive touch handlers.',
      categoryId: 'development',
      date: todayStr,
      startTime: '11:00',
      endTime: '12:30',
      durationMinutes: 90,
      isCompleted: false,
      reminderMinutesBefore: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'seed-task-3',
      title: 'Sprint Retrospective & Team Sync',
      description: 'Weekly team review and progress calibration.',
      categoryId: 'meetings',
      date: todayStr,
      startTime: '13:30',
      endTime: '14:30',
      durationMinutes: 60,
      isCompleted: false,
      recurrence: { frequency: 'weekdays' },
      reminderMinutesBefore: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'seed-task-4',
      title: 'Cardio & Strength Conditioning',
      description: '5k trail run and core flexibility routine.',
      categoryId: 'health',
      date: todayStr,
      startTime: '17:30',
      endTime: '18:45',
      durationMinutes: 75,
      isCompleted: false,
      recurrence: { frequency: 'daily' },
      reminderMinutesBefore: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'seed-task-5',
      title: 'Security Audit & E2EE Verification',
      description: 'Audit Web Crypto PBKDF2 iterations and AES-GCM IV randomization.',
      categoryId: 'deep-work',
      date: relDate(1),
      startTime: '09:00',
      endTime: '11:00',
      durationMinutes: 120,
      isCompleted: false,
      reminderMinutesBefore: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'seed-task-6',
      title: 'Product Roadmap & Metrics Analysis',
      description: 'Evaluate weekly focus metrics and schedule next milestones.',
      categoryId: 'strategy',
      date: relDate(-1),
      startTime: '14:00',
      endTime: '15:30',
      durationMinutes: 90,
      isCompleted: true,
      completedAt: `${relDate(-1)}T15:30:00Z`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'seed-task-7',
      title: 'Distributed Systems & Cryptography Reading',
      description: 'Read research paper on zero-knowledge synchronization protocols.',
      categoryId: 'learning',
      date: relDate(2),
      startTime: '19:00',
      endTime: '20:30',
      durationMinutes: 90,
      isCompleted: false,
      recurrence: { frequency: 'weekly', daysOfWeek: [1, 3, 5] },
      reminderMinutesBefore: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'seed-task-8',
      title: 'Refactor E2EE Cryptographic Salt Rotation',
      description: 'Unscheduled backlog task ready to be dragged onto the timetable',
      categoryId: 'development',
      date: 'inbox',
      startTime: '09:00',
      endTime: '10:00',
      durationMinutes: 60,
      isCompleted: false,
      reminderMinutesBefore: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'seed-task-9',
      title: 'Draft User Onboarding Video Script',
      description: 'Unscheduled backlog task ready to be dragged onto the timetable',
      categoryId: 'strategy',
      date: 'inbox',
      startTime: '10:00',
      endTime: '10:45',
      durationMinutes: 45,
      isCompleted: false,
      reminderMinutesBefore: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function loadLocalPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch (e) {
    // fallback
  }

  const newPrefs: UserPreferences = {
    ...DEFAULT_PREFERENCES,
    vaultId: generateVaultId(),
    encryptionPassphrase: generateSecurePassphrase(),
  };
  saveLocalPreferences(newPrefs);
  return newPrefs;
}

export function saveLocalPreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
  } catch (e) {
    console.warn('Failed to save preferences', e);
  }
}

export function loadLocalCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    // fallback
  }
  saveLocalCategories(DEFAULT_CATEGORIES);
  return DEFAULT_CATEGORIES;
}

export function saveLocalCategories(cats: Category[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
  } catch (e) {
    console.warn('Failed to save categories', e);
  }
}

export function loadLocalTasks(categories?: Category[]): TimetableTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    // fallback
  }
  const seeds = generateSeedTasks();
  saveLocalTasks(seeds);
  return seeds;
}

export function saveLocalTasks(tasks: TimetableTask[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.warn('Failed to save tasks', e);
  }
}

export function loadLocalNotifications(): InAppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    // fallback
  }
  return [
    {
      id: 'welcome-1',
      title: 'Welcome to Chronos',
      body: 'Zero-knowledge end-to-end encrypted timetable ready. Drag & drop tasks into time slots.',
      timestamp: new Date().toISOString(),
      read: false,
      type: 'system',
    },
  ];
}

export function saveLocalNotifications(notifs: InAppNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs.slice(0, 50)));
  } catch (e) {
    console.warn('Failed to save notifications', e);
  }
}

export function loadLocalData(): LocalAppData {
  const categories = loadLocalCategories();
  const tasks = loadLocalTasks(categories);
  const preferences = loadLocalPreferences();
  const notifications = loadLocalNotifications();
  const rawRev = localStorage.getItem(STORAGE_KEYS.REVISION);
  const revision = rawRev ? parseInt(rawRev, 10) : Date.now();

  return {
    tasks,
    categories,
    preferences,
    notifications,
    revision,
  };
}

export function saveLocalData(data: Partial<LocalAppData>): void {
  if (data.tasks !== undefined) saveLocalTasks(data.tasks);
  if (data.categories !== undefined) saveLocalCategories(data.categories);
  if (data.preferences !== undefined) saveLocalPreferences(data.preferences);
  if (data.notifications !== undefined) saveLocalNotifications(data.notifications);
  if (data.revision !== undefined) {
    localStorage.setItem(STORAGE_KEYS.REVISION, String(data.revision));
  }
}

export function getLastDigestDate(): string | null {
  return localStorage.getItem(STORAGE_KEYS.LAST_DIGEST_DATE);
}

export function setLastDigestDate(dateStr: string): void {
  localStorage.setItem(STORAGE_KEYS.LAST_DIGEST_DATE, dateStr);
}

/**
 * Pushes locally encrypted payload to the remote sync endpoint
 */
export async function pushEncryptedVault(
  vaultIdOrTasks: string | TimetableTask[],
  passphraseOrCategories?: string | Category[],
  dataOrPrefs?: { tasks: TimetableTask[]; categories: Category[]; preferences?: UserPreferences } | UserPreferences,
  rev?: number
): Promise<SyncResponse> {
  if (!navigator.onLine) {
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, 'true');
    return { success: false, message: 'Offline. Changes queued for automatic sync.', error: 'Offline' };
  }

  let vaultId = '';
  let passphrase = '';
  let plainBundle: any = {};
  const currentRevision = rev || Date.now();

  if (typeof vaultIdOrTasks === 'string') {
    vaultId = vaultIdOrTasks;
    passphrase = (passphraseOrCategories as string) || '';
    plainBundle = dataOrPrefs || {};
  } else {
    const tasks = vaultIdOrTasks;
    const categories = (passphraseOrCategories as Category[]) || [];
    const prefs = dataOrPrefs as UserPreferences;
    vaultId = prefs?.vaultId || '';
    passphrase = prefs?.encryptionPassphrase || '';
    plainBundle = { tasks, categories, preferences: prefs };
  }

  if (!vaultId || !passphrase) {
    return { success: false, message: 'Vault ID or Passphrase missing', error: 'Credentials missing' };
  }

  try {
    const encryptedPkg = await encryptData(plainBundle, passphrase);

    const response = await fetch(`/api/sync/${encodeURIComponent(vaultId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...encryptedPkg,
        revision: currentRevision,
      }),
    });

    if (!response.ok) {
      throw new Error(`Sync server responded with ${response.status}`);
    }

    const resData = await response.json();
    localStorage.removeItem(STORAGE_KEYS.PENDING_SYNC);
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

    return {
      success: true,
      message: 'Encrypted sync completed successfully',
      revision: resData.revision || currentRevision,
      timestamp: resData.updatedAt || new Date().toISOString(),
      updatedAt: resData.updatedAt || new Date().toISOString(),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown sync failure';
    return { success: false, message: msg, error: msg };
  }
}

/**
 * Pulls encrypted vault from remote, decrypts with passphrase, and returns data
 */
export async function pullEncryptedVault(
  vaultId: string,
  passphrase: string
): Promise<SyncResponse> {
  if (!navigator.onLine) {
    return { success: false, message: 'Device is currently offline.', error: 'Device is offline' };
  }

  if (!vaultId || !passphrase) {
    return { success: false, message: 'Vault ID and Passphrase are required', error: 'Credentials required' };
  }

  try {
    const response = await fetch(`/api/sync/${encodeURIComponent(vaultId)}`);
    if (response.status === 404) {
      return { success: false, message: 'Vault ID not found on server', error: 'Vault ID not found on server' };
    }
    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const encryptedData = await response.json();

    const decryptedBundle = await decryptData<{
      tasks: TimetableTask[];
      categories: Category[];
      preferences: UserPreferences;
    }>(
      {
        ciphertext: encryptedData.ciphertext,
        iv: encryptedData.iv,
        salt: encryptedData.salt,
      },
      passphrase
    );

    return {
      success: true,
      message: 'Vault decrypted and synchronized successfully',
      tasks: decryptedBundle.tasks || [],
      categories: decryptedBundle.categories || [],
      data: decryptedBundle,
      timestamp: encryptedData.updatedAt,
      updatedAt: encryptedData.updatedAt,
      revision: encryptedData.revision,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Decryption failed';
    return { success: false, message: msg, error: msg };
  }
}

/**
 * Export tasks as formatted CSV
 */
export function exportTasksToCSV(tasks: TimetableTask[], categories: Category[]): void {
  const catLookup = new Map(categories.map(c => [c.id, c.name]));
  const headers = ['ID', 'Title', 'Date', 'Start Time', 'End Time', 'Duration (Min)', 'Category', 'Completed', 'Recurrence', 'Description'];
  
  const rows = tasks.map(t => [
    `"${t.id}"`,
    `"${t.title.replace(/"/g, '""')}"`,
    `"${t.date || 'Unscheduled'}"`,
    `"${t.startTime || ''}"`,
    `"${t.endTime || ''}"`,
    t.durationMinutes,
    `"${catLookup.get(t.categoryId) || 'General'}"`,
    t.isCompleted ? 'Yes' : 'No',
    `"${t.recurrence?.frequency || 'none'}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `chronos_timetable_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
