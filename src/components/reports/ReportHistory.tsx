import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ClipboardList,
  Camera,
  FileDown,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Search
} from 'lucide-react';
import { DayReport, UserProfile, Language } from '../../types';
import { TRANSLATIONS, formatKhmerDate } from '../../utils/translations';
import { calculateActivityStats, countEvidencePhotosInReport } from '../../utils/workEvidenceService';

interface ReportHistoryProps {
  reports: Record<string, DayReport>;
  userProfile: UserProfile;
  onSelectDate: (date: string) => void;
  onOpenExportModal: () => void;
  language: Language;
}

export const ReportHistory: React.FC<ReportHistoryProps> = ({
  reports,
  userProfile,
  onSelectDate,
  onOpenExportModal,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Extract sorted dates
  const sortedDates = useMemo(() => {
    return Object.keys(reports).sort((a, b) => b.localeCompare(a));
  }, [reports]);

  // Filtered reports
  const filteredDates = useMemo(() => {
    return sortedDates.filter((dateKey) => {
      if (monthFilter && !dateKey.startsWith(monthFilter)) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const rep = reports[dateKey];
        const matchDate = dateKey.includes(q);
        const matchAct = rep.activities?.some(
          (a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
        );
        if (!matchDate && !matchAct) return false;
      }
      return true;
    });
  }, [sortedDates, reports, monthFilter, searchTerm]);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-slate-900 text-lg sm:text-xl flex items-center gap-2">
            <Calendar size={22} className="text-indigo-600" />
            {t.reportHistoryNav}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'km'
              ? 'ពិនិត្យប្រវត្តិរបាយការណ៍ និងភស្តុតាងការងារតាមកាលបរិច្ឆេទនីមួយៗ'
              : 'Browse all historical daily work reports, evidence photos, and attendance'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-mono"
          />
          <button
            type="button"
            onClick={onOpenExportModal}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
          >
            <FileDown size={14} />
            <span>{t.exportReport}</span>
          </button>
        </div>
      </div>

      {/* List of Historical Reports */}
      <div className="space-y-3">
        {filteredDates.length > 0 ? (
          filteredDates.map((dateKey) => {
            const rep = reports[dateKey];
            const stats = calculateActivityStats(rep);
            const photoCount = countEvidencePhotosInReport(rep);
            const isCheckedIn = Boolean(rep.isCheckedIn);
            const isPermission = Boolean(rep.isPermission);
            const isHoliday = Boolean(rep.isHoliday);
            const isAbsent = !isCheckedIn && !isPermission && !isHoliday;

            const dateFormatted =
              language === 'km' ? formatKhmerDate(dateKey) : dateKey;

            return (
              <div
                key={dateKey}
                onClick={() => onSelectDate(dateKey)}
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-medium text-slate-400 uppercase">
                      {rep.dayOfWeek?.slice(0, 3)}
                    </span>
                    <span className="text-base font-extrabold leading-none mt-0.5">
                      {dateKey.split('-')[2]}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                        {dateFormatted}
                      </h3>

                      {isHoliday ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          Holiday
                        </span>
                      ) : isCheckedIn ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {t.presentStatus}
                        </span>
                      ) : isPermission ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          {t.permissionStatus}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          Absent
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <ClipboardList size={13} className="text-indigo-500" />
                        <strong>{stats.total}</strong> {t.activityNumber}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        <strong>{stats.completed}</strong> Completed
                      </span>
                      <span className="flex items-center gap-1">
                        <Camera size={13} className="text-blue-500" />
                        <strong>{photoCount}</strong> {t.photoCountBadge}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    <span>{language === 'km' ? 'បើកមើល' : 'Open'}</span>
                    <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Calendar size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-medium text-slate-700">No reports found for this month.</p>
          </div>
        )}
      </div>
    </div>
  );
};
