import { InAppNotification, TimetableTask, UserPreferences } from '../types/timetable';
import { playNotificationChime } from './sound';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (err) {
    return 'denied';
  }
}

export function dispatchSystemNotification(
  title: string,
  body: string,
  icon = '/icon.svg'
): boolean {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    new Notification(title, {
      body,
      icon,
      badge: '/icon.svg',
      tag: `chronos-${Date.now()}`,
    });
    return true;
  } catch (err) {
    console.warn('Browser notification failed:', err);
    return false;
  }
}

/**
 * Checks and delivers scheduled reminders and daily digest
 */
export function checkScheduledAlerts(
  tasks: TimetableTask[],
  preferences: UserPreferences,
  todayStr: string,
  lastDigestDate: string | null,
  onNewInAppNotification: (notif: InAppNotification) => void,
  onUpdateTaskNotified: (taskId: string) => void,
  onDigestSent: (dateStr: string) => void
): void {
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;

  // 1. Check Daily Digest
  if (
    preferences.dailyDigestEnabled &&
    lastDigestDate !== todayStr &&
    currentTimeStr >= preferences.dailyDigestTime
  ) {
    // Collect today's tasks
    const todaysTasks = tasks
      .filter(t => t.date === todayStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const totalCount = todaysTasks.length;
    let digestBody = 'You have no scheduled tasks today. Plan your day in Chronos!';

    if (totalCount > 0) {
      const firstTask = todaysTasks[0];
      digestBody = `You have ${totalCount} focus session${totalCount > 1 ? 's' : ''} planned today. First session: "${firstTask.title}" at ${firstTask.startTime}.`;
    }

    const digestTitle = 'Chronos Daily Briefing';

    if (preferences.browserNotificationsEnabled) {
      dispatchSystemNotification(digestTitle, digestBody);
    }
    if (preferences.soundChimeEnabled) {
      playNotificationChime();
    }

    onNewInAppNotification({
      id: `digest-${todayStr}-${Date.now()}`,
      title: digestTitle,
      body: digestBody,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'daily_digest',
    });

    onDigestSent(todayStr);
  }

  // 2. Check Upcoming Task Reminders
  const nowMs = now.getTime();

  for (const task of tasks) {
    if (task.isCompleted || task.notified || task.date !== todayStr) continue;

    // Convert task startTime to Date object for today
    const [taskH, taskM] = task.startTime.split(':').map(Number);
    const taskDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), taskH, taskM, 0, 0);
    const taskStartMs = taskDateObj.getTime();

    const reminderLeadMs = (task.reminderMinutesBefore ?? 5) * 60 * 1000;
    const alertTriggerMs = taskStartMs - reminderLeadMs;

    // If within 1 minute window of trigger time and not yet past start time by 10 mins
    if (nowMs >= alertTriggerMs && nowMs <= taskStartMs + 10 * 60 * 1000) {
      const title = `Upcoming: ${task.title}`;
      const body = task.reminderMinutesBefore && task.reminderMinutesBefore > 0
        ? `Starts in ${task.reminderMinutesBefore} minutes (${task.startTime})`
        : `Starts now (${task.startTime})`;

      if (preferences.browserNotificationsEnabled) {
        dispatchSystemNotification(title, body);
      }
      if (preferences.soundChimeEnabled) {
        playNotificationChime();
      }

      onNewInAppNotification({
        id: `reminder-${task.id}-${Date.now()}`,
        title,
        body,
        timestamp: new Date().toISOString(),
        read: false,
        taskId: task.id,
        type: 'reminder',
      });

      onUpdateTaskNotified(task.id);
    }
  }
}
