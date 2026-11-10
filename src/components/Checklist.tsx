import React, { useState, useMemo, useEffect } from 'react';
import {
  Clock,
  MessageSquare,
  Plus,
  Trash2,
  AlertCircle,
  Tag,
  MessageCircle,
  MonitorCheck,
  Lightbulb,
  Palette,
  Film,
  Send,
  Layers,
  Video,
  ChevronDown,
  CheckCheck,
  RotateCcw,
  CheckCircle2,
  CalendarCheck,
  CalendarDays,
  ChevronUp,
  LogIn,
  LogOut,
  History,
  Play,
  Timer,
  XCircle,
  Check,
  X,
  ShieldAlert,
  Edit3,
  UserX,
  HeartPulse
} from 'lucide-react';
import { ScheduleTask, TaskScope, PRESET_ACTIVITIES, WorkSession, Language, TaskStatus, DayReport } from '../types';
import {
  calculateDayWorkHours,
  formatMinutesToHours,
  formatTimeSlotToTwoDigitHours,
  formatDateToScreenshotBanner
} from '../utils/dateUtils';
import { TRANSLATIONS } from '../utils/translations';

interface ChecklistProps {
  tasks: ScheduleTask[];
  report?: DayReport;
  selectedDate?: string;
  isDoneForToday?: boolean;
  doneAt?: string;
  // Check-In and Check-Out props
  workSessions?: WorkSession[];
  isCheckedIn?: boolean;
  currentCheckInTime?: string;
  currentCheckInTimestamp?: number;
  totalWorkedMinutes?: number;
  onCheckIn?: (timeStr?: string) => void;
  onCheckOut?: (timeStr?: string, notes?: string) => void;
  onDeleteWorkSession?: (sessionId: string) => void;
  // Attendance / Permission
  onOpenPermissionModal?: () => void;
  // Task operations
  onToggleTask: (taskId: string, completed: boolean, timestamp?: string) => void;
  onSetTaskStatus?: (taskId: string, status: TaskStatus) => void;
  onUpdateCrossReason?: (taskId: string, crossReason: string) => void;
  onUpdateOther?: (taskId: string, other: string) => void;
  onUpdateNotes: (taskId: string, notes: string) => void;
  onUpdateTaskName: (taskId: string, taskName: string) => void;
  onUpdateScheduleType?: (taskId: string, scheduleType: 'Schedule' | 'Over Time') => void;
  onAddTask: (
    timeSlot: string,
    taskName: string,
    scheduleType?: 'Schedule' | 'Over Time',
    scope?: TaskScope,
    daysOfWeek?: number[]
  ) => void;
  onDeleteTask: (taskId: string) => void;
  onMarkAllComplete?: () => void;
  onResetTasks?: () => void;
  onToggleDoneForToday?: () => void;
  language?: Language;
}

const TIME_SLOT_PRESETS = [
  { label: '08:00 - 09:00', start: '08:00', end: '09:00', type: 'Schedule' as const },
  { label: '09:00 - 10:00', start: '09:00', end: '10:00', type: 'Schedule' as const },
  { label: '10:00 - 11:00', start: '10:00', end: '11:00', type: 'Schedule' as const },
  { label: '11:00 - 12:00', start: '11:00', end: '12:00', type: 'Schedule' as const },
  { label: '12:00 - 13:00 (Lunch)', start: '12:00', end: '13:00', type: 'Schedule' as const },
  { label: '13:00 - 14:00', start: '13:00', end: '14:00', type: 'Schedule' as const },
  { label: '14:00 - 15:00', start: '14:00', end: '15:00', type: 'Schedule' as const },
  { label: '15:00 - 16:00', start: '15:00', end: '16:00', type: 'Schedule' as const },
  { label: '16:00 - 17:00', start: '16:00', end: '17:00', type: 'Schedule' as const },
  { label: '17:00 - 18:00 (OT)', start: '17:00', end: '18:00', type: 'Over Time' as const },
  { label: '18:00 - 19:00 (OT)', start: '18:00', end: '19:00', type: 'Over Time' as const },
  { label: '19:00 - 20:00 (OT)', start: '19:00', end: '20:00', type: 'Over Time' as const },
  { label: '20:00 - 21:00 (OT)', start: '20:00', end: '21:00', type: 'Over Time' as const },
];

function getActivityIcon(activityName: string) {
  const lower = (activityName || '').toLowerCase();
  if (lower.includes('chat') || lower.includes('facebook') || lower.includes('reply') || lower.includes('replay') || lower.includes('ឆ្លើយតប')) {
    return <MessageCircle className="w-4 h-4 text-blue-600 shrink-0" />;
  }
  if (lower.includes('platform') || lower.includes('platfrom') || lower.includes('ពិនិត្យ')) {
    return <MonitorCheck className="w-4 h-4 text-emerald-600 shrink-0" />;
  }
  if (lower.includes('idea') || lower.includes('គំនិត')) {
    return <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />;
  }
  if (lower.includes('poster') || lower.includes('design') || lower.includes('ឌីហ្សាញ')) {
    return <Palette className="w-4 h-4 text-purple-600 shrink-0" />;
  }
  if (lower.includes('edit video') || lower.includes('កាត់ត')) {
    return <Film className="w-4 h-4 text-indigo-600 shrink-0" />;
  }
  if (lower.includes('post') || lower.includes('page') || lower.includes('ផុស')) {
    return <Send className="w-4 h-4 text-rose-600 shrink-0" />;
  }
  if (lower.includes('element') || lower.includes('sreach') || lower.includes('ស្វែងរក element')) {
    return <Layers className="w-4 h-4 text-cyan-600 shrink-0" />;
  }
  if (lower.includes('take video') || lower.includes('ថត')) {
    return <Video className="w-4 h-4 text-orange-600 shrink-0" />;
  }
  return <Tag className="w-4 h-4 text-slate-500 shrink-0" />;
}

export const Checklist: React.FC<ChecklistProps> = ({
  tasks,
  report,
  selectedDate,
  isDoneForToday = false,
  doneAt,
  workSessions = [],
  isCheckedIn = false,
  currentCheckInTime,
  currentCheckInTimestamp,
  totalWorkedMinutes = 0,
  onCheckIn,
  onCheckOut,
  onDeleteWorkSession,
  onOpenPermissionModal,
  onToggleTask,
  onSetTaskStatus,
  onUpdateCrossReason,
  onUpdateOther,
  onUpdateNotes,
  onUpdateTaskName,
  onUpdateScheduleType,
  onAddTask,
  onDeleteTask,
  onMarkAllComplete,
  onResetTasks,
  onToggleDoneForToday,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  
  const weekdays = [
    { label: t.sunShort, value: 0 },
    { label: t.monShort, value: 1 },
    { label: t.tueShort, value: 2 },
    { label: t.wedShort, value: 3 },
    { label: t.thuShort, value: 4 },
    { label: t.friShort, value: 5 },
    { label: t.satShort, value: 6 },
  ];

  // Add Task form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [newScheduleType, setNewScheduleType] = useState<'Schedule' | 'Over Time'>('Schedule');
  const [selectedScope, setSelectedScope] = useState<TaskScope>('today');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);

  // Check-out modal / note state
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
  const [checkOutNote, setCheckOutNote] = useState('');
  const [liveShiftSeconds, setLiveShiftSeconds] = useState(0);
  const [showSessionsHistory, setShowSessionsHistory] = useState(false);

  // Live timer tick for active work shift
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isCheckedIn && currentCheckInTimestamp) {
      const updateSeconds = () => {
        const diffSecs = Math.max(0, Math.floor((Date.now() - currentCheckInTimestamp) / 1000));
        setLiveShiftSeconds(diffSecs);
      };
      updateSeconds();
      interval = setInterval(updateSeconds, 1000);
    } else {
      setLiveShiftSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCheckedIn, currentCheckInTimestamp]);

  const formatLiveDuration = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Day time statistics
  const timeStats = useMemo(() => calculateDayWorkHours(tasks), [tasks]);
  const completedCount = tasks.filter((t) => t.isCompleted || t.status === 'completed').length;
  const crossedCount = tasks.filter((t) => t.status === 'crossed').length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimeSlot.trim() || !newTaskName.trim()) return;

    onAddTask(
      newTimeSlot.trim(),
      newTaskName.trim(),
      newScheduleType,
      selectedScope,
      selectedScope === 'specific_days' ? selectedDays : undefined
    );

    setNewTimeSlot('');
    setNewTaskName('');
    setIsFormOpen(false);
  };

  const handleConfirmCheckOut = () => {
    if (onCheckOut) {
      onCheckOut(undefined, checkOutNote.trim());
    }
    setCheckOutNote('');
    setIsCheckOutModalOpen(false);
  };

  const isPermissionActive = report?.isPermission || false;

  const quickReasonPresets = [
    t.quickReasonMeeting,
    t.quickReasonSystem,
    t.quickReasonClient,
    t.quickReasonUrgent,
    t.quickReasonSick
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* ========================================================================= */}
      {/* 1. PERMISSION / SICK LEAVE / ABSENCE RED BANNER (If Active)             */}
      {/* ========================================================================= */}
      {isPermissionActive ? (
        <div className="bg-red-500 border-2 border-red-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <HeartPulse className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-white text-red-700 font-black text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {report?.permissionType || 'P (Permission)'}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black tracking-tight">
                    {formatDateToScreenshotBanner(report?.date || selectedDate || '')}
                  </h3>
                </div>
                <p className="text-sm font-semibold text-white/90 mt-1">
                  Task / Activity: <span className="font-bold underline">({report?.permissionReason || 'sick can go need to rest and sleep'})</span>
                </p>
                <p className="text-xs text-red-100 mt-0.5">
                  Checking: <span className="font-bold text-white">✓ Approved Permission</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              {onOpenPermissionModal && (
                <button
                  onClick={onOpenPermissionModal}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-red-700 hover:bg-red-50 transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{language === 'km' ? 'កែប្រែច្បាប់ (P)' : 'Edit Permission'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* 2. ATTENDANCE & STATUS BAR (វត្តមាន / សុំច្បាប់ / អវត្តមានឥតច្បាប់)          */}
      {/* ========================================================================= */}
      <div className={`border rounded-3xl p-4 sm:p-5 shadow-xs transition-all ${
        isCheckedIn
          ? 'bg-emerald-50/70 border-emerald-200'
          : isPermissionActive
          ? 'bg-rose-50/70 border-rose-200'
          : 'bg-amber-50/70 border-amber-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Attendance Status Indicator */}
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isCheckedIn
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : isPermissionActive
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
            }`}>
              {isCheckedIn ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : isPermissionActive ? (
                <HeartPulse className="w-6 h-6" />
              ) : (
                <UserX className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  isCheckedIn
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isPermissionActive
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-amber-600 text-white shadow-xs'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  {isCheckedIn
                    ? t.presentStatus
                    : isPermissionActive
                    ? t.permissionStatus
                    : t.absentNoPermissionStatus}
                </span>

                <span className="text-xs font-bold text-slate-700">
                  {formatDateToScreenshotBanner(report?.date || selectedDate || '')}
                </span>
              </div>

              <div className="mt-1 text-xs font-medium">
                {isCheckedIn ? (
                  <p className="text-emerald-800 font-semibold flex items-center gap-1.5">
                    <span>✓</span>
                    <span>{language === 'km' ? 'ថ្ងៃនេះបានចូលធ្វើការ (វត្តមាន)' : 'User checked in and worked today (Present)'}</span>
                    {report?.currentCheckInTime && (
                      <span className="text-slate-500 font-normal">({t.checkedInAt} {report.currentCheckInTime})</span>
                    )}
                  </p>
                ) : isPermissionActive ? (
                  <p className="text-red-800 font-semibold">
                    {language === 'km' ? 'ថ្ងៃនេះមិនបានធ្វើការ (មានច្បាប់ P)៖ ' : 'Did not work today (With approved permission P): '}
                    <span className="font-bold underline">({report?.permissionReason || 'sick can go need to rest and sleep'})</span>
                  </p>
                ) : (
                  <p className="text-amber-900 font-semibold flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>{language === 'km' ? 'មិនបាន Check-In វត្តមាន និងមិនបានសុំច្បាប់ (អវត្តមានឥតច្បាប់)' : 'Did not check in and did not request permission (Absent without permission)'}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Direct 1-Click Action Buttons for វត្តមាន (Check In) & សុំច្បាប់ (Permission) */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* 1. វត្តមាន (Check In) Button */}
            <button
              onClick={() => onCheckIn && onCheckIn()}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm ${
                isCheckedIn
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/30'
                  : 'bg-white hover:bg-emerald-50 text-emerald-700 border-2 border-emerald-500 hover:border-emerald-600'
              }`}
              title={language === 'km' ? 'ចុចដើម្បីបញ្ជាក់វត្តមានធ្វើការថ្ងៃនេះ' : 'Click to check in and record present today'}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === 'km' ? 'វត្តមាន (Check In)' : 'វត្តមាន (Check In)'}</span>
              {isCheckedIn && <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded-md font-bold">✓ Active</span>}
            </button>

            {/* 2. សុំច្បាប់ (Permission) Button */}
            {onOpenPermissionModal && (
              <button
                onClick={onOpenPermissionModal}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm ${
                  isPermissionActive
                    ? 'bg-red-600 text-white ring-2 ring-red-600/30'
                    : 'bg-white hover:bg-rose-50 text-red-700 border-2 border-red-400 hover:border-red-500'
                }`}
                title={language === 'km' ? 'ចុចដើម្បីកត់ត្រាការសុំច្បាប់សម្រាក' : 'Click to record leave with permission'}
              >
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <span>{language === 'km' ? 'សុំច្បាប់ (Permission)' : 'សុំច្បាប់ (Permission)'}</span>
                {isPermissionActive && <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded-md font-bold">✓ P Active</span>}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TOOLBAR / ACTION BUTTONS                                              */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addSlotOt}</span>
          </button>

          {tasks.length > 0 && onMarkAllComplete && (
            <button
              onClick={onMarkAllComplete}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all active:scale-95 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>{t.markAllDone}</span>
            </button>
          )}

          {tasks.length > 0 && onResetTasks && (
            <button
              onClick={onResetTasks}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.resetProgress}</span>
            </button>
          )}
        </div>

        {/* Completion Count & Work Hours Analytics */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>{timeStats.totalHoursFormatted}</span>
          </div>

          <div className="text-xs font-bold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl border border-slate-200">
            {completedCount} / {tasks.length} {t.completedOfSlots}
            {crossedCount > 0 && (
              <span className="text-rose-600 ml-1">({crossedCount} ✗)</span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ADD TASK FORM COLLAPSIBLE                                             */}
      {/* ========================================================================= */}
      {isFormOpen && (
        <form onSubmit={handleAddSubmit} className="bg-white border-2 border-indigo-200 rounded-3xl p-5 sm:p-6 shadow-md animate-fadeIn space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>{t.addTimeSlotTitle}</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Time slot selector / text */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.timeSlotLabel}
              </label>
              <input
                type="text"
                value={newTimeSlot}
                onChange={(e) => setNewTimeSlot(e.target.value)}
                placeholder={t.timeSlotPlaceholder}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {TIME_SLOT_PRESETS.slice(0, 4).map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setNewTimeSlot(p.label.split(' ')[0] + ' - ' + p.label.split(' ')[2]);
                      setNewScheduleType(p.type);
                    }}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200"
                  >
                    {p.label.split(' ')[0]}-{p.label.split(' ')[2]}
                  </button>
                ))}
              </div>
            </div>

            {/* Task Name / Preset Activity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.selectActivityOrCustom}
              </label>
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder={t.taskTitlePlaceholder}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {PRESET_ACTIVITIES.slice(0, 3).map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setNewTaskName(act.name)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 truncate max-w-[140px]"
                  >
                    {act.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.scheduleTypeAndDays}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewScheduleType('Schedule')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    newScheduleType === 'Schedule'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {t.scheduleRegular}
                </button>
                <button
                  type="button"
                  onClick={() => setNewScheduleType('Over Time')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    newScheduleType === 'Over Time'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-black'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {t.overTimeOt}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 active:scale-95"
            >
              {t.saveAndAddSlot}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 5. TASKS LIST / TABLE WITH CHECK (✓) & CROSS (✗) & REASON INPUTS        */}
      {/* ========================================================================= */}
      {tasks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">{t.noTasksToday}</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{t.noTasksHint}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task, index) => {
            const isCompleted = Boolean(task.isCompleted || task.status === 'completed');
            const isCrossed = task.status === 'crossed';
            const isOvertime = task.scheduleType === 'Over Time' || Boolean(task.isOvertime);

            // Handler for 3-way toggle
            const handleCheckClick = () => {
              if (onSetTaskStatus) {
                onSetTaskStatus(task.id, isCompleted ? 'pending' : 'completed');
              } else {
                onToggleTask(task.id, !isCompleted);
              }
            };

            const handleCrossClick = () => {
              if (onSetTaskStatus) {
                onSetTaskStatus(task.id, isCrossed ? 'pending' : 'crossed');
              }
            };

            return (
              <div
                key={task.id}
                className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs transition-all hover:shadow-md ${
                  isCrossed
                    ? 'border-rose-300 bg-rose-50/30 ring-1 ring-rose-200'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isOvertime
                    ? 'border-emerald-300/80 bg-emerald-50/10'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                  
                  {/* Left Column: Number, Time, Activity Title */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Index Number badge */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                      isCrossed
                        ? 'bg-rose-100 text-rose-800'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Time slot & Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {formatTimeSlotToTwoDigitHours(task.timeSlot) || task.timeSlot}
                        </span>

                        {isOvertime ? (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                            {t.overtimeBadge}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                            {t.scheduleBadge}
                          </span>
                        )}

                        {task.completedAt && isCompleted && (
                          <span className="text-[10px] text-emerald-700 font-mono">
                            ✓ {task.completedAt}
                          </span>
                        )}
                      </div>

                      {/* Task Name editable input */}
                      <div className="flex items-center gap-2 mt-1.5">
                        {getActivityIcon(task.taskName)}
                        <input
                          type="text"
                          value={task.taskName}
                          onChange={(e) => onUpdateTaskName(task.id, e.target.value)}
                          className={`w-full font-bold text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none py-0.5 ${
                            isCompleted ? 'text-slate-800 line-through text-opacity-80' : 'text-slate-900'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Checking Action Buttons (✓ Check, ✗ Cross) & Delete */}
                  <div className="flex items-center gap-2 self-end lg:self-start shrink-0">
                    
                    {/* Check Button (✓) */}
                    <button
                      type="button"
                      onClick={handleCheckClick}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer border ${
                        isCompleted
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-500/20'
                          : 'bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border-slate-300'
                      }`}
                      title={t.taskCompletedCheck}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{language === 'km' ? 'សម្រេច (✓)' : 'Check (✓)'}</span>
                    </button>

                    {/* Cross Button (✗) */}
                    <button
                      type="button"
                      onClick={handleCrossClick}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer border ${
                        isCrossed
                          ? 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-500/20'
                          : 'bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border-slate-300'
                      }`}
                      title={t.taskCrossedIncomplete}
                    >
                      <X className="w-4 h-4 stroke-[3]" />
                      <span>{language === 'km' ? 'មិនសម្រេច (✗)' : 'Cross (✗)'}</span>
                    </button>

                    {/* Delete Task */}
                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>

                {/* ============================================================= */}
                {/* Reason for Cross & Other Input Fields                          */}
                {/* ============================================================= */}
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  {/* Reason for Cross / Incomplete Box */}
                  <div className={`p-2.5 rounded-xl border transition-all ${
                    isCrossed ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50/60 border-slate-200'
                  }`}>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <AlertCircle className={`w-3 h-3 ${isCrossed ? 'text-rose-600' : 'text-slate-400'}`} />
                      <span>{t.reasonForCross}</span>
                    </label>
                    <input
                      type="text"
                      value={task.crossReason || ''}
                      onChange={(e) => onUpdateCrossReason && onUpdateCrossReason(task.id, e.target.value)}
                      placeholder={t.reasonForCrossPlaceholder}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                    />

                    {/* Quick reason click tags */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {quickReasonPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => onUpdateCrossReason && onUpdateCrossReason(task.id, preset)}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-white hover:bg-rose-100 hover:text-rose-800 text-slate-600 border border-slate-200 transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Other / Remarks Box */}
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-slate-400" />
                      <span>{t.otherRemarks}</span>
                    </label>
                    <input
                      type="text"
                      value={task.other || task.notes || ''}
                      onChange={(e) => {
                        if (onUpdateOther) onUpdateOther(task.id, e.target.value);
                        onUpdateNotes(task.id, e.target.value);
                      }}
                      placeholder={t.otherRemarksPlaceholder}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. BOTTOM DONE FOR TODAY ACTION BAR                                      */}
      {/* ========================================================================= */}
      {tasks.length > 0 && (
        <div className="mt-8 bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
              isDoneForToday ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}>
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">
                {isDoneForToday
                  ? t.doneForTodayCompleted
                  : `${completedCount} / ${tasks.length} ${t.completedOfSlots} (${timeStats.completedHoursFormatted})`}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {isDoneForToday
                  ? `${t.doneForTodayLoggedOn} ${doneAt || (language === 'km' ? 'ថ្ងៃនេះ' : 'today')}`
                  : t.doneForTodayHint}
              </p>
            </div>
          </div>

          <button
            onClick={onToggleDoneForToday}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all shadow-xs active:scale-95 cursor-pointer ${
              isDoneForToday
                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
            }`}
          >
            <CheckCheck className="w-4 h-4" />
            <span>{isDoneForToday ? t.doneForTodayCompleted : t.doneForToday}</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. CHECK-OUT CONFIRMATION MODAL                                          */}
      {/* ========================================================================= */}
      {isCheckOutModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <LogOut className="w-5 h-5 text-rose-600" />
              <span>{t.confirmCheckOut}</span>
            </h3>
            <p className="text-xs text-slate-600">{t.optionalSessionNote}</p>
            <textarea
              value={checkOutNote}
              onChange={(e) => setCheckOutNote(e.target.value)}
              rows={3}
              placeholder="e.g. Completed design tasks, replied chats..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCheckOutModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckOut}
                className="px-5 py-2 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 active:scale-95"
              >
                {t.confirmCheckOut}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
