/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Category, InAppNotification, TimetableTask, UserPreferences } from './types/timetable';
import {
  exportTasksToCSV,
  getLastDigestDate,
  loadLocalData,
  pullEncryptedVault,
  pushEncryptedVault,
  saveLocalData,
  setLastDigestDate,
} from './utils/storage';
import { expandTasksForDateRange } from './utils/recurrence';
import { checkScheduledAlerts, dispatchSystemNotification } from './utils/notification';
import { playNotificationChime } from './utils/sound';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { formatDateToISO, getTodayISO, getWeekDates } from './utils/date';

import { Header } from './components/Header';
import { TimetableGrid } from './components/TimetableGrid';
import { DashboardMetrics } from './components/DashboardMetrics';
import { TaskModal } from './components/TaskModal';
import { TaskInboxDrawer } from './components/TaskInboxDrawer';
import { SyncSettingsModal } from './components/SyncSettingsModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const isOnline = useOnlineStatus();

  // Load initial state
  const initialData = useMemo(() => loadLocalData(), []);

  const [categories, setCategories] = useState<Category[]>(initialData.categories);
  const [tasks, setTasks] = useState<TimetableTask[]>(initialData.tasks);
  const [preferences, setPreferences] = useState<UserPreferences>(initialData.preferences);
  const [notifications, setNotifications] = useState<InAppNotification[]>(initialData.notifications);
  const [revision, setRevision] = useState<number>(initialData.revision);

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<'timetable' | 'analytics'>('timetable');
  const [viewMode, setViewMode] = useState<'week' | 'day' | '3day'>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // Modals & Drawers
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TimetableTask | null>(null);
  const [defaultSlotDate, setDefaultSlotDate] = useState<string>(getTodayISO());
  const [defaultSlotTime, setDefaultSlotTime] = useState<string>('09:00');

  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  // Sync state
  const [lastSyncTime, setLastSyncTime] = useState<string | undefined>(undefined);

  // Save changes to localStorage
  useEffect(() => {
    saveLocalData({ tasks, categories, preferences, notifications, revision });
  }, [tasks, categories, preferences, notifications, revision]);

  // Push to remote sync endpoint with E2EE
  const handlePushSync = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!isOnline) {
      return { success: false, message: 'Offline. Encrypted changes saved locally.' };
    }
    if (!preferences.vaultId || !preferences.encryptionPassphrase) {
      return { success: false, message: 'Vault credentials missing' };
    }

    const res = await pushEncryptedVault(
      preferences.vaultId,
      preferences.encryptionPassphrase,
      { tasks, categories, preferences },
      revision + 1
    );

    if (res.success) {
      if (res.revision !== undefined) {
        setRevision(res.revision);
      }
      const nowStr = new Date().toLocaleTimeString();
      setLastSyncTime(nowStr);
      return { success: true, message: `Encrypted vault synced at ${nowStr}` };
    } else {
      return { success: false, message: res.error || 'Sync failed' };
    }
  }, [isOnline, preferences, tasks, categories, revision]);

  // Connect to Remote Vault
  const handlePairRemoteVault = async (
    vaultId: string,
    passphrase: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!isOnline) {
      return { success: false, message: 'Device is offline' };
    }

    const res = await pullEncryptedVault(vaultId, passphrase);
    if (res.success && res.data) {
      setTasks(res.data.tasks);
      setCategories(res.data.categories);
      const updatedPrefs: UserPreferences = {
        ...res.data.preferences,
        vaultId,
        encryptionPassphrase: passphrase,
      };
      setPreferences(updatedPrefs);
      if (res.revision) setRevision(res.revision);
      if (res.updatedAt) setLastSyncTime(new Date(res.updatedAt).toLocaleTimeString());

      saveLocalData({
        tasks: res.data.tasks,
        categories: res.data.categories,
        preferences: updatedPrefs,
        revision: res.revision,
      });

      return { success: true, message: 'Remote vault linked and decrypted!' };
    }

    return { success: false, message: res.error || 'Decryption failed' };
  };

  // Periodic Reminder & Daily Digest check (runs every 20 seconds)
  useEffect(() => {
    const todayStr = getTodayISO();

    const interval = setInterval(() => {
      const lastDigest = getLastDigestDate();

      checkScheduledAlerts(
        tasks,
        preferences,
        todayStr,
        lastDigest,
        (newNotif) => {
          setNotifications((prev) => [newNotif, ...prev]);
        },
        (taskId) => {
          setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, notified: true } : t))
          );
        },
        (dateStr) => {
          setLastDigestDate(dateStr);
        }
      );
    }, 20000);

    return () => clearInterval(interval);
  }, [tasks, preferences]);

  // Materialize recurring tasks for the visible range
  const expandedTasks = useMemo(() => {
    const weekDates = getWeekDates(currentDate);
    // Expand a buffer of 14 days around current date
    const startRange = new Date(weekDates[0]);
    startRange.setDate(startRange.getDate() - 7);
    const endRange = new Date(weekDates[6]);
    endRange.setDate(endRange.getDate() + 7);

    const sStr = formatDateToISO(startRange);
    const eStr = formatDateToISO(endRange);

    return expandTasksForDateRange(tasks, sStr, eStr);
  }, [tasks, currentDate]);

  // Task save handler (create or edit)
  const handleSaveTask = (taskData: Partial<TimetableTask>) => {
    if (editingTask) {
      // Update existing task
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? ({ ...t, ...taskData, updatedAt: new Date().toISOString() } as TimetableTask)
            : t
        )
      );
    } else {
      // Create new task
      const newTask: TimetableTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: taskData.title || 'Untitled Session',
        description: taskData.description || '',
        categoryId: taskData.categoryId || categories[0]?.id || 'deep-work',
        date: taskData.date || getTodayISO(),
        startTime: taskData.startTime || '09:00',
        endTime: taskData.endTime || '10:00',
        durationMinutes: taskData.durationMinutes || 60,
        isCompleted: false,
        recurrence: taskData.recurrence,
        reminderMinutesBefore: taskData.reminderMinutesBefore ?? 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
    }

    setEditingTask(null);
    setIsTaskModalOpen(false);

    // Debounced sync
    setTimeout(() => {
      handlePushSync();
    }, 600);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId && t.parentRecurringId !== taskId));
    setIsTaskModalOpen(false);
    setEditingTask(null);
    setTimeout(() => {
      handlePushSync();
    }, 600);
  };

  const handleToggleComplete = (targetTask: TimetableTask) => {
    const newStatus = !targetTask.isCompleted;

    setTasks((prev) => {
      // If this was a virtual occurrence of a recurring task, persist it
      if (targetTask.parentRecurringId) {
        const existingIdx = prev.findIndex((t) => t.id === targetTask.id);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...targetTask,
            isCompleted: newStatus,
            completedAt: newStatus ? new Date().toISOString() : undefined,
          };
          return updated;
        } else {
          return [
            {
              ...targetTask,
              isCompleted: newStatus,
              completedAt: newStatus ? new Date().toISOString() : undefined,
            },
            ...prev,
          ];
        }
      }

      return prev.map((t) =>
        t.id === targetTask.id
          ? {
              ...t,
              isCompleted: newStatus,
              completedAt: newStatus ? new Date().toISOString() : undefined,
            }
          : t
      );
    });

    setTimeout(() => {
      handlePushSync();
    }, 600);
  };

  const handleQuickResize = (targetTask: TimetableTask, deltaMinutes: number) => {
    const newDuration = Math.max(15, targetTask.durationMinutes + deltaMinutes);
    const [h, m] = targetTask.startTime.split(':').map(Number);
    const totalMinutes = h * 60 + m + newDuration;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const newEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === targetTask.id
          ? {
              ...t,
              durationMinutes: newDuration,
              endTime: newEndTime,
            }
          : t
      )
    );

    setTimeout(() => {
      handlePushSync();
    }, 600);
  };

  // Drag and Drop into Timetable Slot
  const handleTaskDropOnSlot = (
    taskId: string,
    targetDate: string,
    targetStartTime: string
  ) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === taskId);
      if (!task) return prev;

      const duration = task.durationMinutes > 0 ? task.durationMinutes : 60;
      const [h, m] = targetStartTime.split(':').map(Number);
      const totalMinutes = h * 60 + m + duration;
      const endH = Math.floor(totalMinutes / 60) % 24;
      const endM = totalMinutes % 60;
      const newEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      const updatedTask: TimetableTask = {
        ...task,
        date: targetDate,
        startTime: targetStartTime,
        endTime: newEndTime,
        updatedAt: new Date().toISOString(),
      };

      return prev.map((t) => (t.id === taskId ? updatedTask : t));
    });

    playNotificationChime();
    setTimeout(() => {
      handlePushSync();
    }, 600);
  };

  const handleSlotClick = (date: string, startTime: string) => {
    setDefaultSlotDate(date);
    setDefaultSlotTime(startTime);
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleScheduleNow = (task: TimetableTask) => {
    const todayStr = getTodayISO();
    const defaultTime = '10:00';
    handleTaskDropOnSlot(task.id, todayStr, defaultTime);
  };

  const handleUpdatePreferences = (updated: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updated }));
  };

  const handleExportCSV = () => {
    exportTasksToCSV(tasks, categories);
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify({ tasks, categories, preferences }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronos_vault_export_${getTodayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Unscheduled count in backlog
  const inboxCount = tasks.filter((t) => t.date === 'inbox' || !t.date || t.date === '').length;
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Header Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenNewTask={() => {
          setEditingTask(null);
          setDefaultSlotDate(getTodayISO());
          setDefaultSlotTime('09:00');
          setIsTaskModalOpen(true);
        }}
        onOpenInbox={() => setIsInboxOpen(true)}
        onOpenSync={() => setIsSyncModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        inboxCount={inboxCount}
        unreadNotifsCount={unreadNotifsCount}
        isOnline={isOnline}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'timetable' ? (
          <TimetableGrid
            tasks={expandedTasks}
            categories={categories}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onEditTask={(task) => {
              setEditingTask(task);
              setIsTaskModalOpen(true);
            }}
            onToggleComplete={handleToggleComplete}
            onQuickResize={handleQuickResize}
            onTaskDropOnSlot={handleTaskDropOnSlot}
            onSlotClick={handleSlotClick}
            selectedCategoryFilter={selectedCategoryFilter}
            onSelectCategoryFilter={setSelectedCategoryFilter}
            startHour={preferences.startHour}
            endHour={preferences.endHour}
          />
        ) : (
          <DashboardMetrics
            tasks={tasks}
            categories={categories}
            currentDate={currentDate}
            onExportCSV={handleExportCSV}
            onExportJSON={handleExportJSON}
          />
        )}
      </main>

      {/* Unscheduled Backlog Drawer */}
      <TaskInboxDrawer
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        categories={categories}
        tasks={tasks}
        onAddTask={(taskData) => {
          const newTask: TimetableTask = {
            id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            title: taskData.title || 'Untitled Backlog Task',
            description: '',
            categoryId: taskData.categoryId || categories[0]?.id || 'deep-work',
            date: 'inbox',
            startTime: '09:00',
            endTime: '10:00',
            durationMinutes: taskData.durationMinutes || 60,
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setTasks((prev) => [newTask, ...prev]);
        }}
        onDeleteTask={handleDeleteTask}
        onScheduleNow={handleScheduleNow}
      />

      {/* Create / Edit Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        initialTask={editingTask}
        defaultDate={defaultSlotDate}
        defaultStartTime={defaultSlotTime}
        categories={categories}
      />

      {/* Zero-Knowledge E2EE Sync Modal */}
      <SyncSettingsModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        preferences={preferences}
        onSavePreferences={handleUpdatePreferences}
        onTriggerSync={handlePushSync}
        onPairRemoteVault={handlePairRemoteVault}
        isOnline={isOnline}
        lastSyncTime={lastSyncTime}
      />

      {/* Daily Digest & Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
        notifications={notifications}
        onMarkAllRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }}
        onClearNotifications={() => setNotifications([])}
      />

      {/* Offline Toast Indicator */}
      <OfflineIndicator />
    </div>
  );
}
