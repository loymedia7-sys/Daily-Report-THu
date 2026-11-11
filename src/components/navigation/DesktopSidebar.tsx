import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  Camera,
  ClipboardList,
  History,
  FileDown,
  Settings,
  Languages,
  Cloud,
  CloudOff,
  User,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { MainNavView } from '../../types/workReport';
import { UserProfile, AuthUser, Language } from '../../types';
import { TRANSLATIONS } from '../../utils/translations';
import { safeImgSrc } from '../../utils/dateUtils';

interface DesktopSidebarProps {
  currentView: MainNavView;
  onNavigate: (view: MainNavView) => void;
  userProfile: UserProfile;
  authUser: AuthUser | null;
  isSyncing?: boolean;
  language: Language;
  onToggleLanguage: (lang: Language) => void;
  pendingPhotosCount?: number;
  todayActivitiesCount?: number;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentView,
  onNavigate,
  userProfile,
  authUser,
  isSyncing = false,
  language,
  onToggleLanguage,
  pendingPhotosCount = 0,
  todayActivitiesCount = 0,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const companyName = userProfile.companyName || 'TIV-HUOR REPORT';
  const employeeName = userProfile.employeeName || 'ROTH DARO';
  const department = userProfile.department || 'Operations Lead';

  const navItems = [
    {
      id: 'dashboard' as MainNavView,
      label: t.dashboardNav,
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'schedule' as MainNavView,
      label: t.myScheduleNav,
      icon: CalendarCheck,
      badge: null,
    },
    {
      id: 'camera' as MainNavView,
      label: t.cameraNav,
      icon: Camera,
      badge: pendingPhotosCount > 0 ? `${pendingPhotosCount}` : null,
      highlight: true,
    },
    {
      id: 'reports' as MainNavView,
      label: t.dailyReportsNav,
      icon: ClipboardList,
      badge: todayActivitiesCount > 0 ? `${todayActivitiesCount}` : null,
    },
    {
      id: 'history' as MainNavView,
      label: t.reportHistoryNav,
      icon: History,
      badge: null,
    },
    {
      id: 'export' as MainNavView,
      label: t.exportReportsNav,
      icon: FileDown,
      badge: null,
    },
    {
      id: 'settings' as MainNavView,
      label: t.settings,
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-200 border-r border-slate-800 shrink-0 select-none min-h-screen sticky top-0 h-screen overflow-y-auto">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        {safeImgSrc(userProfile.companyLogoUrl) ? (
          <img
            src={safeImgSrc(userProfile.companyLogoUrl)}
            alt={companyName}
            className="w-10 h-10 rounded-xl object-contain bg-white/10 p-1 border border-slate-700 shadow-sm"
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-bold text-white text-lg shadow-md shadow-indigo-500/20">
            TH
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-bold text-slate-100 text-sm tracking-wide truncate">
            {companyName}
          </div>
          <div className="text-[11px] text-indigo-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Daily Work System
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : item.highlight
                  ? 'text-indigo-300 hover:bg-slate-800/80 hover:text-white'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  size={18}
                  className={
                    isActive
                      ? 'text-white'
                      : item.highlight
                      ? 'text-indigo-400'
                      : 'text-slate-400'
                  }
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white text-indigo-700'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Status & Sync */}
      <div className="p-3 mx-3 mb-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            {authUser ? (
              <>
                <Cloud size={13} className="text-emerald-400" />
                <span className="text-emerald-400 font-medium">Cloud Synced</span>
              </>
            ) : (
              <>
                <CloudOff size={13} className="text-slate-400" />
                <span>Offline / Local</span>
              </>
            )}
          </span>
          {isSyncing && (
            <span className="text-[10px] text-indigo-400 animate-pulse font-medium">
              Syncing...
            </span>
          )}
        </div>

        {/* Language switch button */}
        <button
          onClick={() => onToggleLanguage(language === 'km' ? 'en' : 'km')}
          className="w-full mt-1 flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white text-[11px] transition-colors border border-slate-700/50"
        >
          <span className="flex items-center gap-1.5">
            <Languages size={13} className="text-indigo-400" />
            <span>{language === 'km' ? 'ភាសាខ្មែរ (KM)' : 'English (EN)'}</span>
          </span>
          <span className="text-[10px] text-indigo-300 font-medium underline">
            {language === 'km' ? 'Switch EN' : 'ប្តូរ ខ្មែរ'}
          </span>
        </button>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-800/90 flex items-center gap-3 bg-slate-900/50">
        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-bold text-xs shrink-0">
          {employeeName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-slate-200 truncate">
            {employeeName}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {department}
          </div>
        </div>
      </div>
    </aside>
  );
};
