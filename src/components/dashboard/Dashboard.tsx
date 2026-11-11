import React from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Camera,
  ClipboardList,
  Sparkles,
  FileDown,
  ArrowRight,
  TrendingUp,
  User,
  ShieldCheck,
  Building,
  Plus,
  Play,
  Square,
  AlertCircle
} from 'lucide-react';
import { DayReport, UserProfile, Language, AuthUser, ScheduleTask } from '../../types';
import { WorkActivity } from '../../types/workReport';
import { TRANSLATIONS, formatKhmerDate } from '../../utils/translations';
import { calculateActivityStats, countEvidencePhotosInReport } from '../../utils/workEvidenceService';
import { safeImgSrc } from '../../utils/dateUtils';

interface DashboardProps {
  report: DayReport;
  selectedDate: string;
  userProfile: UserProfile;
  authUser: AuthUser | null;
  onNavigateToSchedule: () => void;
  onNavigateToCamera: () => void;
  onNavigateToReports: () => void;
  onOpenExportModal: () => void;
  onOpenAddActivity: () => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onToggleTask: (taskId: string) => void;
  language: Language;
}

export const Dashboard: React.FC<DashboardProps> = ({
  report,
  selectedDate,
  userProfile,
  authUser,
  onNavigateToSchedule,
  onNavigateToCamera,
  onNavigateToReports,
  onOpenExportModal,
  onOpenAddActivity,
  onCheckIn,
  onCheckOut,
  onToggleTask,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const employeeName = userProfile.employeeName || 'ROTH DARO';
  const department = userProfile.department || 'Operations Lead';
  const supervisor = userProfile.supervisorName || 'Department Head';
  const companyName = userProfile.companyName || 'TIV-HUOR REPORT';

  const stats = calculateActivityStats(report);
  const totalPhotos = countEvidencePhotosInReport(report);
  const activities = report.activities || [];

  // Attendance Status
  const isCheckedIn = Boolean(report.isCheckedIn);
  const isPermission = Boolean(report.isPermission);
  const isHoliday = Boolean(report.isHoliday);
  const isAbsentNoPermission = !isCheckedIn && !isPermission && !isHoliday;

  const dateDisplay =
    language === 'km' ? formatKhmerDate(selectedDate) : selectedDate;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 animate-fadeIn">
      {/* 1. HERO EMPLOYEE CARD */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 text-slate-900 shadow-xl relative overflow-hidden border border-blue-200">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          {/* Employee & Company Info */}
          <div className="flex items-center gap-4">
            {safeImgSrc(userProfile.companyLogoUrl) ? (
              <img
                src={safeImgSrc(userProfile.companyLogoUrl)}
                alt={companyName}
                className="w-16 h-16 rounded-2xl object-contain bg-blue-50 p-1.5 border border-blue-200 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-blue-500/30">
                {employeeName.charAt(0)}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {companyName}
                </span>
                {isCheckedIn ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    {t.presentStatus}
                  </span>
                ) : isPermission ? (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                    {t.permissionStatus}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                    {t.notCheckedInStatus}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold mt-1 tracking-tight text-slate-900">
                {employeeName}
              </h1>

              <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3 mt-1">
                <span className="font-medium text-slate-700">{department}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">
                  {language === 'km' ? 'ប្រធាន' : 'Lead'}: {supervisor}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 text-blue-600 font-semibold">
                  <Calendar size={13} />
                  {dateDisplay}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Check-In / Check-Out Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {isCheckedIn ? (
              <button
                type="button"
                onClick={onCheckOut}
                className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all active:scale-95"
              >
                <Square size={14} className="fill-current" />
                <span>{t.checkOut} ({report.currentCheckInTime || 'Active'})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onCheckIn}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95"
              >
                <Play size={14} className="fill-current" />
                <span>{t.checkIn}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenExportModal}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-2 transition-all"
            >
              <FileDown size={15} />
              <span className="hidden sm:inline">{t.exportTodayReport}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS & DAILY PROGRESS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Activities */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{t.totalActivitiesToday}</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ClipboardList size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">{t.activityNumber}</span>
          </div>
        </div>

        {/* Completed Activities */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{t.completedActivities}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{stats.completed}</span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">({stats.completionRate}%)</span>
          </div>
        </div>

        {/* Evidence Photos */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{t.totalEvidencePhotos}</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Camera size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">{totalPhotos}</span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">{t.photoCountBadge}</span>
          </div>
        </div>

        {/* Work Progress Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{t.dailyWorkProgress}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-800">
              <span>{stats.completionRate}% Done</span>
              <span className="text-slate-400 font-normal">{stats.completed}/{stats.total}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. QUICK ACTIONS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Quick Camera Action */}
        <button
          type="button"
          onClick={onNavigateToCamera}
          className="group p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/20 flex items-center justify-between text-left transition-all hover:scale-[1.02] active:scale-95"
        >
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
              <Camera size={20} className="text-white" />
            </div>
            <div className="font-bold text-sm sm:text-base">{t.quickCameraAccess}</div>
            <p className="text-[11px] text-indigo-100 leading-tight">
              {language === 'km' ? 'ថតរូបភាពការងារកត់ត្រាចូលរបាយការណ៍' : 'Snap work photos with camera'}
            </p>
          </div>
          <ArrowRight size={20} className="text-indigo-200 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Quick Add Activity */}
        <button
          type="button"
          onClick={onOpenAddActivity}
          className="group p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-xs hover:border-indigo-400 flex items-center justify-between text-left transition-all hover:scale-[1.02] active:scale-95"
        >
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
              <Plus size={20} />
            </div>
            <div className="font-bold text-sm sm:text-base">{t.quickAddActivity}</div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {language === 'km' ? 'បន្ថែមភារកិច្ច និងការពិពណ៌នាលម្អិត' : 'Log a new completed work activity'}
            </p>
          </div>
          <ArrowRight size={20} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Go to Schedule */}
        <button
          type="button"
          onClick={onNavigateToSchedule}
          className="group p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-xs hover:border-emerald-400 flex items-center justify-between text-left transition-all hover:scale-[1.02] active:scale-95"
        >
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <Calendar size={20} />
            </div>
            <div className="font-bold text-sm sm:text-base">{t.myScheduleNav}</div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {language === 'km' ? 'មើលកាលវិភាគម៉ោង និងធីកការងារ (Checklist)' : 'Manage daily checklist & slots'}
            </p>
          </div>
          <ArrowRight size={20} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* 4. RECENT ACTIVITIES & PHOTO EVIDENCE PREVIEW */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600" />
              {t.recentActivities}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'km'
                ? 'សកម្មភាព និងរូបភាពដែលបានកត់ត្រាសម្រាប់ថ្ងៃនេះ'
                : 'Activities and evidence photos logged for today'}
            </p>
          </div>

          <button
            type="button"
            onClick={onNavigateToReports}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline"
          >
            <span>{language === 'km' ? 'មើលទាំងអស់' : 'View All'}</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.slice(0, 4).map((act, idx) => (
              <div
                key={act.id}
                onClick={onNavigateToReports}
                className="p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 bg-slate-50/70 hover:bg-white transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate group-hover:text-indigo-600 transition-colors">
                      {act.activityTitle || act.title || act.workCategory || (language === 'km' ? 'ភស្តុតាងការងារ' : 'Work Evidence')}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {act.description || act.workCategory || act.category || (language === 'km' ? 'មិនមានការពិពណ៌នា' : 'No description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                    {act.startTime} - {act.endTime}
                  </span>

                  {((act.photos && act.photos.length > 0) || act.imageUrl) && (
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Camera size={11} />
                      {act.photos && act.photos.length > 0 ? act.photos.length : 1}
                    </span>
                  )}

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      act.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {act.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl space-y-2">
            <ClipboardList size={30} className="mx-auto text-slate-300" />
            <p className="text-xs font-medium text-slate-700">{t.noActivitiesForDate}</p>
            <p className="text-[11px] text-slate-400">{t.noActivitiesHint}</p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenAddActivity}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={14} />
                {t.quickAddActivity}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
