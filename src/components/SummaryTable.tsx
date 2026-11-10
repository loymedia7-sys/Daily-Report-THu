import React, { useState, useMemo } from 'react';
import {
  Search,
  Coffee,
  Download,
  FileSpreadsheet,
  BarChart3,
  Tag,
  Calendar,
  Clock,
  MessageSquare
} from 'lucide-react';
import { DayReport, UserProfile, Language } from '../types';
import { exportAllReportsToExcel } from '../utils/excelExport';
import { TRANSLATIONS } from '../utils/translations';

interface SummaryTableProps {
  reports: Record<string, DayReport>;
  userProfile: UserProfile;
  onOpenExportModal: () => void;
  language?: Language;
}

export const SummaryTable: React.FC<SummaryTableProps> = ({
  reports,
  userProfile,
  onOpenExportModal,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Convert reports dictionary into a flattened array of log items
  const flattenedLogs = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      dayOfWeek: string;
      isHoliday: boolean;
      holidayReason?: string;
      timeSlot: string;
      taskName: string;
      scheduleType: string;
      notes?: string;
    }> = [];

    const todayStr = new Date().toISOString().split('T')[0];
    const sortedDates = Object.keys(reports).sort((a, b) => b.localeCompare(a));

    sortedDates.forEach((dateKey) => {
      const rep = reports[dateKey];

      // Date Range Filter Logic
      if (dateRangeFilter === 'today' && dateKey !== todayStr) return;
      if (dateRangeFilter === 'week') {
        const d = new Date(dateKey);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
        if (diffDays > 7 || diffDays < 0) return;
      }
      if (dateRangeFilter === 'month') {
        const d = new Date(dateKey);
        const now = new Date();
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return;
      }

      if (rep.isHoliday) {
        list.push({
          id: `${dateKey}_holiday`,
          date: dateKey,
          dayOfWeek: rep.dayOfWeek,
          isHoliday: true,
          holidayReason: rep.holidayReason || 'Weekly Off Day',
          timeSlot: '-',
          taskName: `${language === 'km' ? 'ថ្ងៃឈប់សម្រាក' : 'Holiday'} (${rep.dayOfWeek})`,
          scheduleType: 'Holiday',
          notes: rep.holidayReason || (language === 'km' ? 'ថ្ងៃឈប់សម្រាក' : 'Off Day')
        });
      } else if (rep.isPermission) {
        list.push({
          id: `${dateKey}_permission`,
          date: dateKey,
          dayOfWeek: rep.dayOfWeek,
          isHoliday: false,
          timeSlot: rep.permissionType || 'P',
          taskName: `${language === 'km' ? 'ច្បាប់ឈប់សម្រាក' : 'Permission / Leave'}: ${rep.permissionReason || 'sick can go need to rest and sleep'}`,
          scheduleType: 'Permission',
          notes: rep.notes || (language === 'km' ? 'បានអនុញ្ញាតច្បាប់ (✓)' : 'Approved Leave (✓)')
        });
      } else if (!rep.isCheckedIn && !rep.isPermission && !rep.tasks?.some(t => t.isCompleted || t.status === 'completed')) {
        list.push({
          id: `${dateKey}_absent`,
          date: dateKey,
          dayOfWeek: rep.dayOfWeek,
          isHoliday: false,
          timeSlot: 'ABSENT',
          taskName: language === 'km' ? 'អវត្តមានឥតច្បាប់ (មិនបាន Check-In វត្តមាន)' : 'Absent without permission (No Check-In)',
          scheduleType: 'Absent',
          notes: language === 'km' ? 'មិនបានស្នើសុំច្បាប់' : 'No permission requested'
        });
      } else {
        rep.tasks.forEach((tTask) => {
          // Keyword Search Filter
          if (searchTerm.trim()) {
            const kw = searchTerm.toLowerCase();
            const matchesTask = (tTask.taskName || '').toLowerCase().includes(kw);
            const matchesNotes = (tTask.notes || '').toLowerCase().includes(kw);
            const matchesTime = (tTask.timeSlot || '').toLowerCase().includes(kw);
            const matchesDate = dateKey.includes(kw) || rep.dayOfWeek.toLowerCase().includes(kw);
            if (!matchesTask && !matchesNotes && !matchesTime && !matchesDate) return;
          }

          list.push({
            id: tTask.id,
            date: dateKey,
            dayOfWeek: rep.dayOfWeek,
            isHoliday: false,
            timeSlot: tTask.timeSlot,
            taskName: tTask.taskName,
            scheduleType: tTask.scheduleType || (tTask.isOvertime ? 'Over Time' : 'Schedule'),
            notes: tTask.notes
          });
        });
      }
    });

    return list;
  }, [reports, dateRangeFilter, searchTerm, language]);

  // Overall Statistics Metrics
  const stats = useMemo(() => {
    let totalTasks = 0;
    let notesCount = 0;
    let holidayDays = 0;
    const activeDays = new Set<string>();

    (Object.values(reports) as DayReport[]).forEach((rep) => {
      activeDays.add(rep.date);
      if (rep.isHoliday) {
        holidayDays++;
      } else {
        rep.tasks.forEach((tTask) => {
          totalTasks++;
          if (tTask.notes && tTask.notes.trim().length > 0) {
            notesCount++;
          }
        });
      }
    });

    return {
      totalTasks,
      notesCount,
      holidayDays,
      totalDaysTracked: activeDays.size
    };
  }, [reports]);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.totalSlots}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalTasks}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{stats.totalDaysTracked} {t.daysTracked}</p>
          </div>
          <div className="w-11 h-11 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t.activeDays}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalDaysTracked}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{language === 'km' ? 'បានកត់ត្រាក្នុងប្រព័ន្ធ' : 'Recorded in database'}</p>
          </div>
          <div className="w-11 h-11 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t.notesLogged}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.notesCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{language === 'km' ? 'កំណត់សម្គាល់លម្អិត' : 'Slots with remarks'}</p>
          </div>
          <div className="w-11 h-11 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">{t.holidaysCount}</p>
            <p className="text-2xl font-black text-amber-900 mt-1">{stats.holidayDays}</p>
            <p className="text-[11px] text-amber-700 mt-0.5">{language === 'km' ? 'ថ្ងៃសម្រាកកាលវិភាគ' : 'Scheduled Off Days'}</p>
          </div>
          <div className="w-11 h-11 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center">
            <Coffee className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          />
        </div>

        {/* Filter Dropdowns & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          
          {/* Date Scope Filter */}
          <select
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value as any)}
            className="bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">{t.allDates}</option>
            <option value="today">{t.todayOnly}</option>
            <option value="week">{t.past7Days}</option>
            <option value="month">{t.thisMonth}</option>
          </select>

          {/* Export Report Center Button */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{t.exportReport}</span>
          </button>

          {/* Quick Direct Excel Download */}
          <button
            onClick={() => exportAllReportsToExcel(reports, userProfile, language)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
            title="Download complete Master Multi-Tab Excel (.xlsx) file"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{t.exportMasterExcel}</span>
          </button>
        </div>

      </div>

      {/* Master Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 border-b border-slate-800">{t.tableHeaderDate}</th>
                <th className="py-3.5 px-4 border-b border-slate-800">{t.tableHeaderDay}</th>
                <th className="py-3.5 px-4 border-b border-slate-800">{t.tableHeaderTime}</th>
                <th className="py-3.5 px-4 border-b border-slate-800">{t.tableHeaderTask}</th>
                <th className="py-3.5 px-3 border-b border-slate-800 bg-red-700 text-center">{t.tableHeaderSchedule}</th>
                <th className="py-3.5 px-4 border-b border-slate-800">{t.tableHeaderNotes}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {flattenedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {t.noMatchingLogs}
                  </td>
                </tr>
              ) : (
                flattenedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      log.isHoliday ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-slate-900 font-bold whitespace-nowrap">
                      {log.date}
                    </td>

                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {log.dayOfWeek}
                    </td>

                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-medium">
                      {log.timeSlot}
                    </td>

                    <td className="py-3 px-4 text-slate-900 font-semibold max-w-xs truncate">
                      {log.taskName}
                    </td>

                    {/* Schedule Column (Red style) */}
                    <td className="py-3 px-3 text-center whitespace-nowrap bg-red-50/60">
                      {log.isHoliday ? (
                        <span className="text-amber-700 font-bold text-[10px]">HOLIDAY</span>
                      ) : log.scheduleType === 'Permission' ? (
                        <span className="inline-flex items-center gap-1 text-red-800 bg-red-200/80 px-2.5 py-0.5 rounded font-black text-[10px] border border-red-300">
                          <span>{language === 'km' ? 'ច្បាប់ (P)' : 'Permission (P)'}</span>
                        </span>
                      ) : log.scheduleType === 'Absent' ? (
                        <span className="inline-flex items-center gap-1 text-rose-900 bg-rose-200/80 px-2.5 py-0.5 rounded font-black text-[10px] border border-rose-300">
                          <span>{language === 'km' ? 'អវត្តមាន' : 'Absent'}</span>
                        </span>
                      ) : log.scheduleType === 'Over Time' ? (
                        <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded font-black text-[10px] border border-rose-300">
                          <Clock className="w-3 h-3 text-rose-600" />
                          <span>{language === 'km' ? 'ថែមម៉ោង' : 'Over Time'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2.5 py-0.5 rounded font-bold text-[10px] border border-red-200">
                          <Tag className="w-3 h-3" />
                          <span>{language === 'km' ? 'កាលវិភាគ' : log.scheduleType}</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-sm truncate">
                      {log.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
