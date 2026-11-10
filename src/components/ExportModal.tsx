import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Cloud,
  Check,
  Loader2,
  Sparkles,
  AlertCircle,
  CalendarRange,
  Calendar,
  ArrowRight,
  Download
} from 'lucide-react';
import { DayReport, UserProfile, Language, DefaultTimeSlotTemplate } from '../types';
import {
  exportReportToExcel,
  exportWeeklyReportToExcel,
  exportDateRangeReportToExcel,
  exportMonthlyOverviewToExcel,
  exportMasterExcel
} from '../utils/excelExport';
import {
  exportReportToPDF,
  exportWeeklyReportToPDF,
  exportDateRangeReportToPDF
} from '../utils/pdfExport';
import { exportWorkReportWithPhotosPDF } from '../utils/workReportPDF';
import { syncReportToGoogleSheets } from '../utils/googleSheetsSync';
import {
  getWeekDays7,
  getWeekRangeLabel,
  getDateRangeDays,
  getDateRangeLabel
} from '../utils/dateUtils';
import { TRANSLATIONS } from '../utils/translations';
import { INITIAL_DEFAULT_SCHEDULE } from '../utils/storage';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: DayReport;
  reportsMap: Record<string, DayReport>;
  userProfile: UserProfile;
  defaultSchedule?: DefaultTimeSlotTemplate[];
  language?: Language;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  report,
  reportsMap,
  userProfile,
  defaultSchedule = INITIAL_DEFAULT_SCHEDULE,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Derive initial start and end date based on report's month (Default: 01 to 15 or current date)
  const [reportYear, reportMonth] = useMemo(() => {
    const parts = (report?.date || '').split('-');
    const year = parts[0] || String(new Date().getFullYear());
    const month = parts[1] || String(new Date().getMonth() + 1).padStart(2, '0');
    return [year, month];
  }, [report?.date]);

  // Initial Range default: 01 to 15 of current viewed month
  const [startDate, setStartDate] = useState<string>(() => `${reportYear}-${reportMonth}-01`);
  const [endDate, setEndDate] = useState<string>(() => `${reportYear}-${reportMonth}-15`);

  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingWorkReportPDF, setIsExportingWorkReportPDF] = useState(false);
  const [isExportingWeeklyPDF, setIsExportingWeeklyPDF] = useState(false);
  const [isExportingWeeklyExcel, setIsExportingWeeklyExcel] = useState(false);
  const [isExportingRangeExcel, setIsExportingRangeExcel] = useState(false);
  const [isExportingRangePDF, setIsExportingRangePDF] = useState(false);

  // Compute selected days in custom range
  const rangeDays = useMemo(() => getDateRangeDays(startDate, endDate), [startDate, endDate]);
  const rangeLabel = useMemo(() => getDateRangeLabel(startDate, endDate), [startDate, endDate]);

  if (!isOpen) return null;

  const currentWeekDays = getWeekDays7(report.date);
  const currentWeekRangeLabel = getWeekRangeLabel(currentWeekDays);

  // Preset Handlers
  const handleApplyPreset01To15 = () => {
    setStartDate(`${reportYear}-${reportMonth}-01`);
    setEndDate(`${reportYear}-${reportMonth}-15`);
  };

  const handleApplyPreset16ToEnd = () => {
    const y = parseInt(reportYear, 10);
    const m = parseInt(reportMonth, 10);
    const lastDay = new Date(y, m, 0).getDate();
    setStartDate(`${reportYear}-${reportMonth}-16`);
    setEndDate(`${reportYear}-${reportMonth}-${String(lastDay).padStart(2, '0')}`);
  };

  const handleApplyPresetFullMonth = () => {
    const y = parseInt(reportYear, 10);
    const m = parseInt(reportMonth, 10);
    const lastDay = new Date(y, m, 0).getDate();
    setStartDate(`${reportYear}-${reportMonth}-01`);
    setEndDate(`${reportYear}-${reportMonth}-${String(lastDay).padStart(2, '0')}`);
  };

  const handleApplyPresetThisWeek = () => {
    setStartDate(currentWeekDays[0]);
    setEndDate(currentWeekDays[6]);
  };

  const handleApplyPresetToday = () => {
    setStartDate(report.date);
    setEndDate(report.date);
  };

  // Range Export Handlers
  const handleExportRangeExcel = async () => {
    if (!startDate || !endDate) return;
    setIsExportingRangeExcel(true);
    try {
      await exportDateRangeReportToExcel(startDate, endDate, reportsMap, userProfile, defaultSchedule, language);
    } catch (err) {
      console.error('Date range Excel export error:', err);
    } finally {
      setIsExportingRangeExcel(false);
    }
  };

  const handleExportRangePDF = async () => {
    if (!startDate || !endDate) return;
    setIsExportingRangePDF(true);
    try {
      await exportDateRangeReportToPDF(startDate, endDate, reportsMap, userProfile, defaultSchedule, language);
    } catch (err) {
      console.error('Date range PDF export error:', err);
    } finally {
      setIsExportingRangePDF(false);
    }
  };

  const handleExcelExportSingle = async () => {
    await exportReportToExcel(report, userProfile, language);
  };

  const handleExcelExportWeekly = async () => {
    setIsExportingWeeklyExcel(true);
    try {
      await exportWeeklyReportToExcel(report.date, reportsMap, userProfile, defaultSchedule, language);
    } catch (err) {
      console.error('Weekly Excel export failed:', err);
    } finally {
      setIsExportingWeeklyExcel(false);
    }
  };

  const handleExcelExportMonthly = async () => {
    const parts = report.date.split('-');
    const year = parseInt(parts[0], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    await exportMonthlyOverviewToExcel(year, monthIndex, reportsMap, userProfile, defaultSchedule, language);
  };

  const handleExcelExportAll = async () => {
    await exportMasterExcel(reportsMap, userProfile, language);
  };

  const handlePDFExport = async () => {
    setIsExportingPDF(true);
    try {
      await exportReportToPDF(report, userProfile, language);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleWorkReportWithPhotosPDF = async () => {
    setIsExportingWorkReportPDF(true);
    try {
      const lang: Language = language === 'km' ? 'km' : 'en';
      await exportWorkReportWithPhotosPDF(report, userProfile, lang);
    } catch (err) {
      console.error('Daily Work Report PDF with photos export failed:', err);
    } finally {
      setIsExportingWorkReportPDF(false);
    }
  };

  const handleWeeklyPDFExport = async () => {
    setIsExportingWeeklyPDF(true);
    try {
      await exportWeeklyReportToPDF(report.date, reportsMap, userProfile, defaultSchedule, language);
    } catch (err) {
      console.error('Weekly PDF export failed:', err);
    } finally {
      setIsExportingWeeklyPDF(false);
    }
  };

  const handleGoogleSheetsSync = async () => {
    setIsSyncingSheets(true);
    setSyncStatus(null);
    const result = await syncReportToGoogleSheets(report, userProfile);
    setIsSyncingSheets(false);
    setSyncStatus(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              <span>{t.exportModalTitle}</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              {t.exportModalSubtitle}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Options */}
        <div className="p-3.5 sm:p-5 space-y-4 overflow-y-auto flex-1">

          {/* FEATURED: Complete Daily Work Report with Evidence Photographs */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl sm:rounded-3xl shadow-lg border border-indigo-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 flex items-center justify-center font-bold shrink-0 shadow-inner">
                <Sparkles className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    {language === 'km' ? 'របាយការណ៍ការងារមានរូបភាពភស្តុតាង (.pdf)' : 'Daily Work Report with Evidence Photos (.pdf)'}
                  </h3>
                  <span className="bg-yellow-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Official
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-indigo-200 mt-1 leading-relaxed">
                  {language === 'km'
                    ? 'របាយការណ៍ស្ដង់ដារពេញលេញ៖ ទំព័រមុខ សកម្មភាពលម្អិត រូបភាពភស្តុតាង និងប្រឡោះហត្ថលេខា'
                    : 'A4 multi-page document with Cover summary, activity descriptions, photographic evidence, and official signatures'}
                </p>
              </div>
            </div>

            <button
              onClick={handleWorkReportWithPhotosPDF}
              disabled={isExportingWorkReportPDF}
              className="px-5 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0 cursor-pointer disabled:opacity-60"
            >
              {isExportingWorkReportPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{language === 'km' ? 'កំពុងបង្កើត PDF...' : 'Rendering PDF...'}</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>{language === 'km' ? 'ទាញយក PDF ពេញលេញ' : 'Download Report PDF'}</span>
                </>
              )}
            </button>
          </div>
          
          {/* TOP PRIMARY FEATURE: Select Day to Day (e.g. 01 to 15) */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-50/90 via-blue-50/70 to-emerald-50/60 border-2 border-indigo-300 rounded-2xl sm:rounded-3xl shadow-sm space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-indigo-200/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-indigo-600/20">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>{t.dateRangeExportTitle}</span>
                    <span className="bg-indigo-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {rangeDays.length} {t.daysSelected}
                    </span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-600">
                    {t.dateRangeExportSubtitle}
                  </p>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
                <button
                  type="button"
                  onClick={handleApplyPreset01To15}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-900 border border-indigo-200 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                >
                  {t.presetDay01To15}
                </button>
                <button
                  type="button"
                  onClick={handleApplyPreset16ToEnd}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-900 border border-indigo-200 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                >
                  {t.presetDay16ToEnd}
                </button>
                <button
                  type="button"
                  onClick={handleApplyPresetFullMonth}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-900 border border-indigo-200 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                >
                  {t.presetFullMonth}
                </button>
                <button
                  type="button"
                  onClick={handleApplyPresetThisWeek}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-900 border border-indigo-200 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                >
                  {t.presetThisWeek}
                </button>
                <button
                  type="button"
                  onClick={handleApplyPresetToday}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-900 border border-indigo-200 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                >
                  {t.presetToday}
                </button>
              </div>
            </div>

            {/* Date Pickers & Range Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{t.fromDate}</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{t.toDate}</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Active Range Preview Bar */}
            <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-indigo-200/80 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-indigo-950">
                <span className="text-indigo-600">{startDate}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-indigo-600">{endDate}</span>
                <span className="text-slate-500 font-normal hidden sm:inline">({rangeLabel})</span>
              </div>

              <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md text-[11px]">
                {rangeDays.length} {language === 'km' ? 'តារាង (ថ្ងៃ)' : 'Day Tables'}
              </span>
            </div>

            {/* Download Range Buttons (Excel & PDF) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleExportRangeExcel}
                disabled={isExportingRangeExcel || rangeDays.length === 0}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {isExportingRangeExcel ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
                <span>{t.downloadRangeExcel} ({rangeDays.length}d)</span>
              </button>

              <button
                type="button"
                onClick={handleExportRangePDF}
                disabled={isExportingRangePDF || rangeDays.length === 0}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {isExportingRangePDF ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>{t.downloadRangePdf} ({rangeDays.length}d)</span>
              </button>
            </div>
          </div>

          {/* Option 2: 1-Week Report (7 Days 7 Tables) */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl hover:border-slate-300 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                  <CalendarRange className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">{t.exportWeeklyFeaturedTitle}</h3>
                    <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {t.exportWeeklyFeaturedBadge}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                    {language === 'km' ? 'សប្ដាហ៍ ' : 'Week of '}<strong className="text-indigo-950 font-bold">{currentWeekRangeLabel}</strong>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                <button
                  onClick={handleExcelExportWeekly}
                  disabled={isExportingWeeklyExcel}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  {isExportingWeeklyExcel ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  )}
                  <span>{t.weekExcelBtn}</span>
                </button>

                <button
                  onClick={handleWeeklyPDFExport}
                  disabled={isExportingWeeklyPDF}
                  className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  {isExportingWeeklyPDF ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  <span>{t.weekPdfBtn}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Option 3: Excel (.xlsx) Single Day, Monthly Overview, & Master All Logs */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
                <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900">{t.excelWorkbooksTitle}</h3>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-snug sm:leading-normal">
                  {t.excelWorkbooksDesc}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:flex sm:flex-col gap-1.5 shrink-0 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
              <button
                onClick={handleExcelExportSingle}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-all text-center cursor-pointer"
              >
                {t.dayBtn} ({report.date.slice(5)})
              </button>
              <button
                onClick={handleExcelExportMonthly}
                className="px-2.5 py-1 text-slate-700 hover:bg-slate-200 bg-white border border-slate-200 text-[10px] font-semibold rounded-lg transition-all text-center shadow-2xs cursor-pointer"
              >
                {t.monthlyOverviewBtn}
              </button>
              <button
                onClick={handleExcelExportAll}
                className="px-2.5 py-1 text-slate-700 hover:bg-slate-200 bg-white border border-slate-200 text-[10px] font-semibold rounded-lg transition-all text-center shadow-2xs cursor-pointer"
              >
                {t.masterAllLogsBtn}
              </button>
            </div>
          </div>

          {/* Option 4: Single Day PDF Download */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900">{t.singleDayPdfTitle}</h3>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-snug sm:leading-normal">
                  {t.singleDayPdfDesc}
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
              <button
                onClick={handlePDFExport}
                disabled={isExportingPDF}
                className="w-full sm:w-auto px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-2xs transition-all shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
              >
                {isExportingPDF ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{language === 'km' ? 'កំពុងបង្កើត...' : 'Generating...'}</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    <span>{t.downloadDayPdfBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Option 5: Google Sheets Sync */}
          <div className="p-3.5 sm:p-4 bg-amber-50/70 border border-amber-200 rounded-xl sm:rounded-2xl flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
                  <Cloud className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-amber-950">{t.liveGoogleSheetsSyncTitle}</h3>
                  <p className="text-[11px] sm:text-xs text-amber-800 leading-snug sm:leading-normal">
                    {t.liveGoogleSheetsSyncDesc}
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-amber-200/60">
                <button
                  onClick={handleGoogleSheetsSync}
                  disabled={isSyncingSheets}
                  className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-60 cursor-pointer"
                >
                  {isSyncingSheets ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{language === 'km' ? 'កំពុង Sync...' : 'Syncing...'}</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3.5 h-3.5" />
                      <span>{t.syncNowBtn}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sync Feedback */}
            {syncStatus && (
              <div
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  syncStatus.success
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}
              >
                {syncStatus.success ? (
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                )}
                <span className="text-[11px] sm:text-xs break-words">{syncStatus.message}</span>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all shadow-xs text-center cursor-pointer"
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
};
