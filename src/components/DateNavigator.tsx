import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  RefreshCw 
} from 'lucide-react';
import { addDaysToDateKey, formatDateKey, getTodayInfo } from '../utils/dateUtils';
import { Language, TRANSLATIONS, formatKhmerDate } from '../utils/translations';

interface DateNavigatorProps {
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  formattedDateText: string;
  dayOfWeek: string;
  isHoliday: boolean;
  completedTasksCount: number;
  totalTasksCount: number;
  completionPercentage: number;
  language?: Language;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  selectedDate,
  setSelectedDate,
  formattedDateText,
  dayOfWeek,
  isHoliday,
  completedTasksCount,
  totalTasksCount,
  completionPercentage,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const todayInfo = getTodayInfo();
  const isToday = selectedDate === todayInfo.todayKey;

  const handlePrevDay = () => {
    setSelectedDate(addDaysToDateKey(selectedDate, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDaysToDateKey(selectedDate, 1));
  };

  const handleTodayClick = () => {
    setSelectedDate(todayInfo.todayKey);
  };

  const displayDateText = language === 'km' ? formatKhmerDate(selectedDate) : formattedDateText;

  return (
    <div className="bg-white border-b border-slate-200 shadow-2xs py-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        
        {/* Date Selector Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all active:scale-95"
              title={t.previousDay}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Date Picker Input */}
            <div className="relative flex items-center px-2">
              <CalendarIcon className="w-4 h-4 text-slate-500 mr-2 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all active:scale-95"
              title={t.nextDay}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {!isToday && (
            <button
              onClick={handleTodayClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-indigo-700 text-xs font-bold border border-slate-200 transition-all active:scale-95"
              title="Jump to Today"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{language === 'km' ? 'ទៅកាន់ថ្ងៃនេះ' : 'Today'}</span>
            </button>
          )}
        </div>

        {/* Date Display Banner & Progress */}
        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
              <span>{t.selectedLogDate}</span>
              {isToday && (
                <span className="text-emerald-600 font-black">{t.todayBadge}</span>
              )}
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {displayDateText}
            </div>
          </div>

          {/* Quick Progress Indicator */}
          {!isHoliday && totalTasksCount > 0 && (
            <div className="min-w-[140px] text-right">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-medium text-slate-500">{t.progress}</span>
                <span className="text-xs font-bold text-slate-900">
                  {completedTasksCount}/{totalTasksCount} ({completionPercentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                <div
                  className={`h-full transition-all duration-500 ${
                    completionPercentage === 100
                      ? 'bg-emerald-500'
                      : completionPercentage > 50
                      ? 'bg-amber-500'
                      : 'bg-yellow-400'
                  }`}
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
