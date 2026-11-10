import React, { useState } from 'react';
import {
  CalendarDays,
  Table,
  Settings,
  SlidersHorizontal,
  Menu,
  X,
  FileSpreadsheet,
  LogOut,
  Download
} from 'lucide-react';
import { UserProfile, AuthUser, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface HeaderProps {
  userProfile: UserProfile;
  authUser: AuthUser | null;
  onOpenSettingsModal: () => void;
  onOpenTemplateModal: () => void;
  onOpenExportModal: () => void;
  onOpenImportModal?: () => void;
  onOpenInstallModal?: () => void;
  isInstalled?: boolean;
  completionPercentage?: number;
  isHoliday?: boolean;
  onGoogleLogin: () => void;
  onLogout: () => void;
  currentView: 'checklist' | 'summary';
  setCurrentView: (view: 'checklist' | 'summary') => void;
  language?: Language;
  onToggleLanguage: (newLang: 'en' | 'km') => void;
  formattedDateText?: string;
}

export const Header: React.FC<HeaderProps> = ({
  userProfile,
  authUser,
  onOpenSettingsModal,
  onOpenTemplateModal,
  onOpenExportModal,
  onGoogleLogin,
  onLogout,
  currentView,
  setCurrentView,
  language = 'en',
  onToggleLanguage,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Left: App Identity / Logo & Company Name */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {userProfile.companyLogoUrl ? (
              <img
                src={userProfile.companyLogoUrl}
                alt="Logo"
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl object-cover shadow-2xs border border-slate-200 cursor-pointer shrink-0"
                onClick={onOpenSettingsModal}
                title={t.settings}
              />
            ) : (
              <div
                onClick={onOpenSettingsModal}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20 cursor-pointer hover:opacity-90 transition-all shrink-0"
                title={t.settings}
              >
                <FileSpreadsheet className="w-5 h-5" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-slate-800 truncate">
                  <span>{userProfile.companyName || (language === 'km' ? 'ប្រព័ន្ធកត់ត្រាការងារ' : 'Daily Report')}</span>
                  <span className="text-slate-400 font-normal text-xs sm:text-sm ml-1.5 hidden xs:inline">
                    / {userProfile.employeeName || authUser?.displayName || 'ROTH DARO'}
                  </span>
                </h1>
              </div>
            </div>
          </div>

          {/* Center: View Switcher Tabs (Desktop / Tablet) */}
          <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setCurrentView('checklist')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentView === 'checklist'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{t.dailySchedule}</span>
            </button>

            <button
              onClick={() => setCurrentView('summary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentView === 'summary'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>{t.summaryTable}</span>
            </button>
          </div>

          {/* Right: Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Language Switcher Feature with Original Country Flag (Cambodia / USA) */}
            <button
              onClick={() => onToggleLanguage(language === 'en' ? 'km' : 'en')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs border active:scale-95 cursor-pointer ${
                language === 'km'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-950 hover:bg-indigo-100'
                  : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
              }`}
              title={language === 'en' ? 'Switch to Khmer (ប្តូរជាភាសាខ្មែរ)' : 'Switch to English'}
            >
              {language === 'en' ? (
                <>
                  <span className="text-base leading-none">🇰🇭</span>
                  <span>ភាសាខ្មែរ</span>
                </>
              ) : (
                <>
                  <span className="text-base leading-none">🇺🇸</span>
                  <span>English</span>
                </>
              )}
            </button>

            {/* Google Authentication Section */}
            {authUser ? (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 p-1 pr-2 rounded-xl">
                {authUser.photoURL ? (
                  <img
                    src={authUser.photoURL}
                    alt={authUser.displayName || 'Google Account'}
                    className="w-6 h-6 rounded-lg object-cover border border-emerald-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                    {authUser.displayName?.[0] || authUser.email?.[0] || 'U'}
                  </div>
                )}
                <span className="text-[11px] font-bold text-emerald-900 hidden lg:inline max-w-[100px] truncate">
                  {authUser.displayName?.split(' ')[0] || 'Connected'}
                </span>
                <button
                  onClick={onLogout}
                  className="p-1 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-all cursor-pointer"
                  title={`Sign out (${authUser.email})`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onGoogleLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition-all active:scale-95 cursor-pointer"
                title="Sign in with Google (Firebase)"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{t.googleLogin}</span>
              </button>
            )}

            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-2xs transition-all active:scale-95 cursor-pointer"
              title={t.exportReport}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.exportReport}</span>
            </button>

            <button
              onClick={onOpenTemplateModal}
              className="p-1.5 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all active:scale-95 cursor-pointer"
              title={t.templateSchedule}
            >
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            </button>

            <button
              onClick={onOpenSettingsModal}
              className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all active:scale-95 cursor-pointer"
              title={t.settings}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={onOpenExportModal}
              className="p-2 rounded-xl bg-amber-400 text-slate-900 font-bold shadow-2xs"
              title={t.exportReport}
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-3 animate-fadeIn">
          {/* Mobile View Switcher */}
          <div className="flex sm:hidden items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => {
                setCurrentView('checklist');
                setIsMobileMenuOpen(false);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                currentView === 'checklist' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{t.dailySchedule}</span>
            </button>
            <button
              onClick={() => {
                setCurrentView('summary');
                setIsMobileMenuOpen(false);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                currentView === 'summary' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>{t.summaryTable}</span>
            </button>
          </div>

          {/* Language Switcher in Mobile Drawer */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-600">{t.language}:</span>
            <button
              onClick={() => {
                onToggleLanguage(language === 'en' ? 'km' : 'en');
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
            >
              {language === 'en' ? (
                <>
                  <span className="text-base leading-none">🇰🇭</span>
                  <span>ភាសាខ្មែរ (Khmer)</span>
                </>
              ) : (
                <>
                  <span className="text-base leading-none">🇺🇸</span>
                  <span>English</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onOpenTemplateModal();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all"
            >
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              <span>{t.templateSchedule}</span>
            </button>

            <button
              onClick={() => {
                onOpenSettingsModal();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all"
            >
              <Settings className="w-4 h-4" />
              <span>{t.settings}</span>
            </button>
          </div>

          {/* Cloud Login / Logout in Mobile */}
          <div className="pt-2 border-t border-slate-100">
            {authUser ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2 min-w-0">
                  {authUser.photoURL ? (
                    <img
                      src={authUser.photoURL}
                      alt="Profile"
                      className="w-6 h-6 rounded-md object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                      {authUser.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <div className="text-xs font-bold truncate text-emerald-950">{authUser.displayName || authUser.email}</div>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onGoogleLogin();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 transition-all shadow-2xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{t.googleLogin}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
