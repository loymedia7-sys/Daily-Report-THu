import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  CheckCircle2, 
  Play, 
  Pause, 
  RotateCcw, 
  Flame, 
  Sun, 
  CalendarDays,
  TrendingUp
} from 'lucide-react';
import { ScheduleTask, Language } from '../types';
import { calculateDayWorkHours, getTodayInfo } from '../utils/dateUtils';
import { TRANSLATIONS, formatKhmerDate } from '../utils/translations';

interface DayTimeCounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateKey: string;
  formattedDateText: string;
  dayOfWeek: string;
  tasks: ScheduleTask[];
  onToggleTask?: (taskId: string, completed: boolean) => void;
  language?: Language;
}

export const DayTimeCounterModal: React.FC<DayTimeCounterModalProps> = ({
  isOpen,
  onClose,
  dateKey,
  formattedDateText,
  dayOfWeek,
  tasks,
  onToggleTask,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  // Live stopwatch for active tracking
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);

  useEffect(() => {
    let interval: any = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  if (!isOpen) return null;

  const todayInfo = getTodayInfo();
  const isSelectedDateToday = dateKey === todayInfo.todayKey;
  const stats = calculateDayWorkHours(tasks);
  const displayDate = language === 'km' ? formatKhmerDate(dateKey) : formattedDateText;

  const formatStopwatch = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span>{t.timeCounterModalTitle}</span>
              </h2>
              {isSelectedDateToday ? (
                <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {t.todayBadge}
                </span>
              ) : (
                <span className="bg-slate-700 text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {dayOfWeek}
                </span>
              )}
            </div>
            
            <p className="text-[11px] sm:text-xs text-indigo-200 mt-1 flex items-center gap-1.5">
              <span>📅 {displayDate}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Main KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Total Duration */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200/80">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">{t.totalWorkTime}</span>
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-indigo-950 tracking-tight">
                {stats.totalHoursFormatted}
              </div>
              <div className="text-[10px] text-indigo-700 font-medium mt-0.5">
                {stats.totalSlots} {language === 'km' ? 'ចន្លោះម៉ោងសរុប' : 'Slots Scheduled'}
              </div>
            </div>

            {/* Regular Time */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{t.regularTime}</span>
                <Sun className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {stats.regularHoursFormatted}
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                {stats.regularCount} {language === 'km' ? 'ម៉ោងធម្មតា' : 'Standard Slots'}
              </div>
            </div>

            {/* Over Time */}
            <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider">{t.overtimeBadge} (OT)</span>
                <Flame className="w-4 h-4 text-rose-600" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-rose-950 tracking-tight">
                {stats.overtimeHoursFormatted}
              </div>
              <div className="text-[10px] text-rose-700 font-medium mt-0.5">
                {stats.overtimeCount} {language === 'km' ? 'ចន្លោះម៉ោង OT' : 'OT Slots'}
              </div>
            </div>

            {/* Completed Time */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">{t.completedTime}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-emerald-950 tracking-tight">
                {stats.completedHoursFormatted}
              </div>
              <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                {stats.completionRate}% ({stats.completedCount}/{stats.totalSlots})
              </div>
            </div>

          </div>

          {/* Progress Bar & Details */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>{language === 'km' ? 'ទិន្នន័យបែងចែកម៉ោងធ្វើការប្រចាំថ្ងៃ' : 'Daily Work Duration Breakdown'}</span>
              </span>
              <span className="font-extrabold text-slate-900">
                {stats.completedHoursFormatted} {language === 'km' ? 'បានធ្វើ' : 'done'} • {stats.pendingHoursFormatted} {language === 'km' ? 'នៅសល់' : 'remaining'}
              </span>
            </div>

            {/* Visual Bar */}
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500" 
                style={{ width: `${stats.completionRate}%` }} 
                title={`Completed: ${stats.completedHoursFormatted}`}
              />
              <div 
                className="bg-slate-300 h-full transition-all duration-500" 
                style={{ width: `${100 - stats.completionRate}%` }} 
                title={`Pending: ${stats.pendingHoursFormatted}`}
              />
            </div>
            
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  <span>{language === 'km' ? 'បានបញ្ចប់' : 'Completed'}: <strong>{stats.completedHoursFormatted}</strong></span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                  <span>{language === 'km' ? 'ថែមម៉ោង' : 'Over Time'}: <strong>{stats.overtimeHoursFormatted}</strong></span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span>
                  <span>{language === 'km' ? 'នៅសល់' : 'Pending'}: <strong>{stats.pendingHoursFormatted}</strong></span>
                </span>
              </div>

              <span className="font-bold text-slate-700">
                {language === 'km' ? 'សរុប' : 'Total'}: {stats.totalHoursVerbose}
              </span>
            </div>
          </div>

          {/* Live Task Session Timer / Stopwatch */}
          <div className="p-4 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl text-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-mono text-xl font-black text-yellow-400 border border-white/10 shadow-inner">
                ⏱️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                    {language === 'km' ? 'នាឡិកាកំណត់ម៉ោងផ្ទាល់' : 'Live Session Stopwatch'}
                  </h4>
                  {isStopwatchRunning && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  )}
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-black tracking-tight text-white mt-0.5">
                  {formatStopwatch(stopwatchSeconds)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 ${
                  isStopwatchRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {isStopwatchRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isStopwatchRunning ? (language === 'km' ? 'ផ្អាកនាឡិកា' : 'Pause Timer') : (language === 'km' ? 'ចាប់ផ្ដើម' : 'Start Timer')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsStopwatchRunning(false);
                  setStopwatchSeconds(0);
                  setActiveSlotId(null);
                }}
                className="p-2 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl transition-all"
                title="Reset Stopwatch"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Time Slot Detailed Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-indigo-600" />
              <span>{language === 'km' ? 'តារាងលម្អិតម៉ោងធ្វើការ' : 'Time Slot Duration Log'} ({stats.slotBreakdown.length} Slots)</span>
            </h4>

            {stats.slotBreakdown.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                {t.noTasksToday}
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100/90 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">{t.tableHeaderTime}</th>
                        <th className="py-2.5 px-3">{t.tableHeaderTask}</th>
                        <th className="py-2.5 px-3 text-center">{t.tableHeaderSchedule}</th>
                        <th className="py-2.5 px-3 text-center">{language === 'km' ? 'រយៈពេល' : 'Duration'}</th>
                        <th className="py-2.5 px-3 text-center">{language === 'km' ? 'ស្ថានភាព' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.slotBreakdown.map((item, idx) => (
                        <tr 
                          key={item.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            item.isCompleted ? 'bg-emerald-50/20' : item.isOvertime ? 'bg-rose-50/20' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                            <span className="text-slate-400 font-mono text-[10px] mr-1.5">#{idx + 1}</span>
                            {item.timeSlot}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            <div>{item.taskName}</div>
                            {item.notes && (
                              <div className="text-[10px] text-slate-500 italic mt-0.5 truncate max-w-[200px]">
                                {item.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            {item.isOvertime ? (
                              <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-100 px-2 py-0.5 rounded text-[10px] font-black border border-rose-200">
                                {language === 'km' ? 'ថែមម៉ោង' : 'Over Time'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-0.5 rounded text-[10px] font-bold border border-red-200">
                                {language === 'km' ? 'កាលវិភាគ' : 'Schedule'}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-700 whitespace-nowrap font-mono text-[11px]">
                            {item.durationFormatted}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            {item.isCompleted ? (
                              <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold">
                                ✓ Done {item.completedAt ? `(${item.completedAt})` : ''}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px] font-medium">
                                {language === 'km' ? 'កំពុងរង់ចាំ' : 'Pending'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600">
            <strong>{language === 'km' ? 'សរុប៖' : 'Summary:'}</strong> {stats.totalHoursFormatted} ({stats.regularHoursFormatted} {language === 'km' ? 'ធម្មតា' : 'reg'} + {stats.overtimeHoursFormatted} OT)
          </div>
          
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            {language === 'km' ? 'រួចរាល់' : 'Done'}
          </button>
        </div>

      </div>
    </div>
  );
};
