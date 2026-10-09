import React from 'react';
import {
  Bell,
  CheckCheck,
  Clock,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { InAppNotification, UserPreferences } from '../types/timetable';
import {
  dispatchSystemNotification,
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
} from '../utils/notification';
import { playNotificationChime } from '../utils/sound';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (updated: Partial<UserPreferences>) => void;
  notifications: InAppNotification[];
  onMarkAllRead: () => void;
  onClearNotifications: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  notifications,
  onMarkAllRead,
  onClearNotifications,
}) => {
  if (!isOpen) return null;

  const browserSupported = isNotificationSupported();
  const currentPermission = getNotificationPermission();

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    if (res === 'granted') {
      onUpdatePreferences({ browserNotificationsEnabled: true });
    }
  };

  const handleTestNotification = () => {
    if (preferences.soundChimeEnabled) {
      playNotificationChime();
    }
    dispatchSystemNotification(
      'Chronos Daily Digest Preview',
      'Good morning! You have 3 focus blocks scheduled today. Deep Work starts at 09:00 AM.'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">
              Notifications & Daily Briefings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Browser Permission status */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-200">System Notifications</span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {currentPermission === 'granted'
                  ? 'Browser notifications are permitted'
                  : currentPermission === 'denied'
                  ? 'Notifications are blocked in your browser settings'
                  : 'Enable notifications to receive background alerts'}
              </p>
            </div>
            {currentPermission !== 'granted' && browserSupported && (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shrink-0"
              >
                Enable
              </button>
            )}
            {currentPermission === 'granted' && (
              <span className="text-[11px] font-mono text-emerald-400 font-medium">
                Active
              </span>
            )}
          </div>

          {/* Settings Section */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3.5">
            <h4 className="font-semibold text-slate-200">Alert Preferences</h4>

            {/* Daily Digest Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-300 font-medium">Daily Morning Briefing</span>
                <p className="text-[11px] text-slate-500">
                  Receive an agenda summary of today's scheduled tasks
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.dailyDigestEnabled}
                onChange={(e) => onUpdatePreferences({ dailyDigestEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
              />
            </div>

            {/* Daily Digest Time */}
            {preferences.dailyDigestEnabled && (
              <div className="flex items-center justify-between pl-3 border-l-2 border-indigo-600/40">
                <span className="text-slate-400 text-[11px]">Briefing Delivery Time</span>
                <input
                  type="time"
                  value={preferences.dailyDigestTime}
                  onChange={(e) => onUpdatePreferences({ dailyDigestTime: e.target.value })}
                  className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Audio Chime Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {preferences.soundChimeEnabled ? (
                  <Volume2 className="w-4 h-4 text-indigo-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                <div>
                  <span className="text-slate-300 font-medium">Audio Notification Chime</span>
                  <p className="text-[11px] text-slate-500">
                    Play a gentle synthesized chime on alerts
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.soundChimeEnabled}
                onChange={(e) => onUpdatePreferences({ soundChimeEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
              />
            </div>

            {/* Test Notification Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestNotification}
                className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Test Alert & Audio Chime</span>
              </button>
            </div>
          </div>

          {/* Notification Feed / History */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between pb-1">
              <h4 className="font-semibold text-slate-200">Recent Notifications</h4>
              <div className="flex items-center gap-2">
                {notifications.some(n => !n.read) && (
                  <button
                    onClick={onMarkAllRead}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={onClearNotifications}
                    className="text-[11px] text-slate-500 hover:text-rose-400 p-0.5"
                    title="Clear history"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {notifications.length === 0 ? (
                <p className="text-center py-4 text-slate-500 text-[11px]">
                  No notifications yet.
                </p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      notif.read
                        ? 'bg-slate-900/40 border-slate-900 text-slate-400'
                        : 'bg-slate-900 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white">
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(notif.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                      {notif.body}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
