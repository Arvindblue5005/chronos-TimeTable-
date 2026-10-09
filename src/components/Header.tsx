import React from 'react';
import {
  BarChart3,
  Bell,
  Calendar,
  Inbox,
  Lock,
  Plus,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: 'timetable' | 'analytics';
  onTabChange: (tab: 'timetable' | 'analytics') => void;
  onOpenNewTask: () => void;
  onOpenInbox: () => void;
  onOpenSync: () => void;
  onOpenNotifications: () => void;
  inboxCount: number;
  unreadNotifsCount: number;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenNewTask,
  onOpenInbox,
  onOpenSync,
  onOpenNotifications,
  inboxCount,
  unreadNotifsCount,
  isOnline,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 md:gap-8 px-4 md:px-6 py-3 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2.5 shrink-0">
        <a
          href="/"
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-xs">
            <Lock className="w-3.5 h-3.5 text-white" />
          </div>
          <span>Chronos</span>
        </a>

        {!isOnline && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-medium text-amber-400 bg-amber-950/40 border border-amber-900/60 px-2 py-0.5 rounded">
            <WifiOff className="w-3 h-3" />
            Offline
          </span>
        )}
      </div>

      {/* Zone 2: Concise navigation links (single line) */}
      <nav className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => onTabChange('timetable')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'timetable'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span>Timetable</span>
        </button>

        <button
          onClick={() => onTabChange('analytics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'analytics'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Productivity</span>
        </button>

        <button
          onClick={onOpenInbox}
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors whitespace-nowrap shrink-0"
          title="Open Unscheduled Task Inbox"
        >
          <Inbox className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Backlog</span>
          {inboxCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-indigo-600 text-[10px] font-bold text-white flex items-center justify-center">
              {inboxCount}
            </span>
          )}
        </button>
      </nav>

      {/* Zone 3: Primary action + Security & Notification utilities */}
      <div className="flex items-center gap-2 shrink-0">
        <PWAInstallButton />

        {/* E2EE Sync Button */}
        <button
          onClick={onOpenSync}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          title="End-to-End Encryption & Device Sync"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">E2EE Sync</span>
        </button>

        {/* Notifications Button */}
        <button
          onClick={onOpenNotifications}
          className="relative p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
          title="Notifications & Briefings"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-950" />
          )}
        </button>

        {/* Primary Action Button */}
        <button
          onClick={onOpenNewTask}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
};
