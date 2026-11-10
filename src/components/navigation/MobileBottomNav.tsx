import React from 'react';
import {
  LayoutDashboard,
  Camera,
  ClipboardList,
  User,
  CalendarCheck
} from 'lucide-react';
import { MainNavView } from '../../types/workReport';
import { Language } from '../../types';
import { TRANSLATIONS } from '../../utils/translations';

interface MobileBottomNavProps {
  currentView: MainNavView;
  onNavigate: (view: MainNavView) => void;
  language: Language;
  pendingPhotosCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  language,
  pendingPhotosCount = 0,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const isHomeActive = currentView === 'dashboard' || currentView === 'schedule';
  const isCameraActive = currentView === 'camera';
  const isReportsActive = currentView === 'reports' || currentView === 'history';
  const isProfileActive = currentView === 'settings';

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2 relative">
        {/* 1. Home (Dashboard) */}
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 touch-manipulation ${
            isHomeActive ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard size={21} className={isHomeActive ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
          <span className="text-[10px] mt-1 tracking-tight truncate max-w-[65px]">
            {t.homeNav}
          </span>
        </button>

        {/* 2. My Schedule / Checklist shortcut */}
        <button
          type="button"
          onClick={() => onNavigate('schedule')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 touch-manipulation ${
            currentView === 'schedule' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarCheck size={21} className={currentView === 'schedule' ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
          <span className="text-[10px] mt-1 tracking-tight truncate max-w-[65px]">
            {language === 'km' ? 'កាលវិភាគ' : 'Schedule'}
          </span>
        </button>

        {/* 3. PROMINENT CAMERA BUTTON (Center Elevated) */}
        <div className="relative -top-5 flex flex-col items-center justify-center px-1">
          <button
            type="button"
            onClick={() => onNavigate('camera')}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 touch-manipulation relative ${
              isCameraActive
                ? 'bg-gradient-to-tr from-indigo-700 via-indigo-600 to-blue-500 text-white ring-4 ring-indigo-200 shadow-indigo-500/40'
                : 'bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-indigo-600/30 hover:scale-105'
            }`}
            aria-label="Open Work Evidence Camera"
          >
            <Camera size={26} className="stroke-[2.2]" />
            {pendingPhotosCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {pendingPhotosCount}
              </span>
            )}
          </button>
          <span className={`text-[10px] mt-1 font-semibold ${isCameraActive ? 'text-indigo-600' : 'text-slate-600'}`}>
            {t.cameraNav}
          </span>
        </div>

        {/* 4. Daily Reports */}
        <button
          type="button"
          onClick={() => onNavigate('reports')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 touch-manipulation ${
            isReportsActive ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList size={21} className={isReportsActive ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
          <span className="text-[10px] mt-1 tracking-tight truncate max-w-[65px]">
            {t.dailyReportsNav}
          </span>
        </button>

        {/* 5. Profile / Settings */}
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 touch-manipulation ${
            isProfileActive ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User size={21} className={isProfileActive ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
          <span className="text-[10px] mt-1 tracking-tight truncate max-w-[65px]">
            {t.profileNav}
          </span>
        </button>
      </div>
    </nav>
  );
};
