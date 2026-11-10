import React, { useState, useMemo } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Upload, 
  ClipboardPaste, 
  Globe, 
  Check, 
  AlertCircle, 
  Loader2, 
  Plus, 
  Trash2, 
  CalendarDays,
  Sparkles,
  ArrowRight,
  Info,
  ExternalLink,
  Copy,
  CalendarRange,
  Cloud
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { DayReport, UserProfile, Language } from '../types';
import { getTodayInfo, getWeekDays7, getWeekRangeLabel, formatFullDateHeader } from '../utils/dateUtils';
import { 
  syncMultipleReportsToGoogleSheets, 
  getGoogleSheetDestinationUrl, 
  generateGoogleSheetsTsv 
} from '../utils/googleSheetsSync';
import { TRANSLATIONS } from '../utils/translations';

interface ImportSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  formattedDateText: string;
  reportsMap: Record<string, DayReport>;
  userProfile: UserProfile;
  language?: Language;
  onImportTasks: (
    importedTasks: Array<{
      timeSlot: string;
      taskName: string;
      scheduleType?: string;
      notes?: string;
      isCompleted?: boolean;
    }>,
    mode: 'replace' | 'append' | 'template'
  ) => void;
}

export const ImportSheetModal: React.FC<ImportSheetModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  formattedDateText,
  reportsMap,
  userProfile,
  language = 'en',
  onImportTasks,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [activeTab, setActiveTab] = useState<'sync' | 'paste' | 'file'>('sync');
  
  // Sync Options: '7days' | 'month' | 'today' | 'all'
  const [syncRange, setSyncRange] = useState<'7days' | 'month' | 'today' | 'all'>('7days');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success?: boolean; message?: string; sheetUrl?: string } | null>(null);
  const [hasCopiedTsv, setHasCopiedTsv] = useState(false);

  // Paste / File import state
  const [pastedText, setPastedText] = useState('');
  const [parsedRows, setParsedRows] = useState<Array<{
    id: string;
    timeSlot: string;
    taskName: string;
    scheduleType: string;
    notes?: string;
    isCompleted?: boolean;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'append' | 'template'>('replace');

  // Selected Reports calculation based on syncRange
  const selectedReports = useMemo(() => {
    if (syncRange === 'today') {
      const rep = reportsMap[selectedDate];
      return rep ? [rep] : [{
        date: selectedDate,
        dayOfWeek: formatFullDateHeader(selectedDate).dayOfWeek,
        tasks: [],
        isHoliday: false,
        lastUpdated: new Date().toISOString()
      }];
    }
    if (syncRange === '7days') {
      const weekDates = getWeekDays7(selectedDate);
      return weekDates.map((dateKey) => {
        const { dayOfWeek } = formatFullDateHeader(dateKey);
        return reportsMap[dateKey] || {
          date: dateKey,
          dayOfWeek,
          tasks: [],
          isHoliday: false,
          lastUpdated: new Date().toISOString()
        };
      });
    }
    const allReports = Object.values(reportsMap) as DayReport[];
    if (syncRange === 'month') {
      const monthPrefix = selectedDate.slice(0, 7); // "YYYY-MM"
      const monthReports = allReports.filter((r) => r.date.startsWith(monthPrefix));
      return monthReports.sort((a, b) => a.date.localeCompare(b.date));
    }
    // 'all'
    return allReports.sort((a, b) => a.date.localeCompare(b.date));
  }, [syncRange, selectedDate, reportsMap]);

  if (!isOpen) return null;

  const totalTasksCount = selectedReports.reduce((acc, r) => acc + (r.tasks?.length || 0), 0);
  const completedTasksCount = selectedReports.reduce(
    (acc, r) => acc + (r.tasks?.filter((t) => t.isCompleted).length || 0), 
    0
  );

  const destinationGoogleSheetUrl = getGoogleSheetDestinationUrl(userProfile);

  // Main Action: Sync & Go direct to Google Sheet
  const handleSyncAndGoDirect = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    setHasCopiedTsv(false);

    try {
      const rangeLabel = syncRange === '7days' 
        ? `Week ${getWeekRangeLabel(getWeekDays7(selectedDate))}` 
        : syncRange === 'month' 
        ? `Month ${selectedDate.slice(0, 7)}` 
        : `Day ${selectedDate}`;

      const res = await syncMultipleReportsToGoogleSheets(selectedReports, userProfile, rangeLabel);
      setSyncResult(res);

      // Go directly to Google Sheet in a new tab
      const targetUrl = res.sheetUrl || destinationGoogleSheetUrl;
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err?.message || 'Sync encounter an error. Redirecting to Google Sheet...',
        sheetUrl: destinationGoogleSheetUrl
      });
      window.open(destinationGoogleSheetUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyTsvData = () => {
    const tsv = generateGoogleSheetsTsv(selectedReports, userProfile);
    navigator.clipboard.writeText(tsv);
    setHasCopiedTsv(true);
    setTimeout(() => setHasCopiedTsv(false), 3000);
  };

  // Helper to parse pasted raw text (TSV / CSV)
  const handleParsePastedText = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!pastedText.trim()) {
      setErrorMessage(language === 'km' ? 'សូមបិទភ្ជាប់ទិន្នន័យពី Google Sheet ឬ Excel' : 'Please paste tabular text or CSV rows from your Google Sheet or Excel.');
      return;
    }

    try {
      const lines = pastedText.trim().split(/\r?\n/);
      const results: Array<{
        id: string;
        timeSlot: string;
        taskName: string;
        scheduleType: string;
        notes?: string;
        isCompleted?: boolean;
      }> = [];

      lines.forEach((line, index) => {
        if (!line.trim()) return;
        const delimiter = line.includes('\t') ? '\t' : ',';
        const cols = line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));

        const firstColLower = (cols[0] || '').toLowerCase();
        const secondColLower = (cols[1] || '').toLowerCase();
        if (
          firstColLower === 'time slot' || 
          firstColLower === 'time' || 
          firstColLower === 'no' || 
          firstColLower === '#' ||
          secondColLower === 'activity' ||
          secondColLower === 'task name'
        ) {
          return;
        }

        let timeSlot = '';
        let taskName = '';
        let scheduleType = 'Schedule';
        let notes = '';
        let isCompleted = false;

        if (cols.length >= 7 && (cols[0].includes('-') || cols[0].includes('/'))) {
          timeSlot = cols[4] || '08:00 - 09:00';
          taskName = cols[5] || 'Work Activity';
          scheduleType = cols[6] && cols[6].toLowerCase().includes('over') ? 'Over Time' : 'Schedule';
          isCompleted = cols[7]?.toUpperCase() === 'DONE';
          notes = cols[9] || '';
        } else if (cols[0] && (cols[0].includes(':') || cols[0].match(/\d{1,2}\s*(?:-|to)\s*\d{1,2}/))) {
          timeSlot = cols[0];
          taskName = cols[1] || 'Scheduled Task';
          scheduleType = cols[2] && cols[2].toLowerCase().includes('over') ? 'Over Time' : 'Schedule';
          notes = cols[3] || '';
        } else if (cols[1] && (cols[1].includes(':') || cols[1].match(/\d{1,2}\s*(?:-|to)\s*\d{1,2}/))) {
          timeSlot = cols[1];
          taskName = cols[2] || 'Scheduled Task';
          scheduleType = cols[3] && cols[3].toLowerCase().includes('over') ? 'Over Time' : 'Schedule';
          notes = cols[4] || '';
        } else {
          timeSlot = cols[0] || '08:00 - 09:00';
          taskName = cols.slice(1).join(' ') || 'Work Task';
        }

        const startHour = parseInt(timeSlot.split(':')[0], 10);
        if (!isNaN(startHour) && startHour >= 17) {
          scheduleType = 'Over Time';
        }

        if (timeSlot && taskName) {
          results.push({
            id: `import_${Date.now()}_${index}`,
            timeSlot,
            taskName,
            scheduleType,
            notes,
            isCompleted,
          });
        }
      });

      if (results.length === 0) {
        setErrorMessage(language === 'km' ? 'មិនមានជួរទិន្នន័យត្រឹមត្រូវ' : 'No valid task rows could be parsed. Ensure rows contain a Time Slot and Task Name.');
      } else {
        setParsedRows(results);
        setSuccessMessage(language === 'km' ? `✓ បានញែក ${results.length} កិច្ចការដោយជោគជ័យ!` : `✓ Successfully parsed ${results.length} tasks! Review below before importing.`);
      }
    } catch (err: any) {
      setErrorMessage(`Parsing error: ${err?.message || 'Check your format and try again.'}`);
    }
  };

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        const text = await file.text();
        setPastedText(text);
        handleParsePastedText();
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        const worksheet = workbook.worksheets[0];

        const results: any[] = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber < 2) return;
          const values: any[] = Array.isArray(row.values) ? row.values.slice(1) : [];
          if (values.length >= 2) {
            const timeSlot = String(values[0] || '').trim();
            const taskName = String(values[1] || '').trim();
            const scheduleType = String(values[2] || 'Schedule').trim();
            const notes = String(values[3] || '').trim();

            if (timeSlot && taskName && !timeSlot.toLowerCase().includes('time slot')) {
              results.push({
                id: `excel_${Date.now()}_${rowNumber}`,
                timeSlot,
                taskName,
                scheduleType: scheduleType.toLowerCase().includes('over') ? 'Over Time' : 'Schedule',
                notes,
              });
            }
          }
        });

        if (results.length > 0) {
          setParsedRows(results);
          setSuccessMessage(language === 'km' ? `✓ បានញែក ${results.length} កិច្ចការពី ${file.name}!` : `✓ Parsed ${results.length} tasks from ${file.name}!`);
        } else {
          setErrorMessage('Could not find task rows in uploaded Excel.');
        }
      }
    } catch (err: any) {
      setErrorMessage(`Failed to read file: ${err?.message || 'Invalid format.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyImport = () => {
    if (parsedRows.length === 0) return;
    onImportTasks(parsedRows, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/30 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{language === 'km' ? 'Google Sheets & Import ទិន្នន័យ' : 'Google Sheets & Task Import'}</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                {language === 'km' 
                  ? 'ជ្រើសរើស 7 ថ្ងៃ ឬខែនេះ រួចផ្ញើ & បើក Google Sheet ផ្ទាល់' 
                  : 'Choose 7 Days, This Month, or Today, then go direct to Google Sheet'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('sync')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sync'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-white/80'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'km' ? 'ផ្ញើទៅ Google Sheet' : 'Send to Google Sheet'}</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'paste'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-white/80'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>{language === 'km' ? 'បិទភ្ជាប់ទិន្នន័យ (Paste)' : 'Paste Table'}</span>
          </button>

          <button
            onClick={() => setActiveTab('file')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'file'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-white/80'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{language === 'km' ? 'Upload ឯកសារ' : 'Upload File'}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: SYNC & GO DIRECT TO GOOGLE SHEET */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              
              {/* Range Selector Cards */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  {language === 'km' ? '១. ជ្រើសរើសចន្លោះកាលបរិច្ឆេទសម្រាប់ផ្ញើទៅ Google Sheet:' : '1. Choose Date Range for Google Sheet:'}
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  
                  {/* 7 Days Option */}
                  <button
                    type="button"
                    onClick={() => setSyncRange('7days')}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer relative ${
                      syncRange === '7days'
                        ? 'bg-emerald-50/90 border-emerald-500 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <CalendarRange className={`w-4 h-4 ${syncRange === '7days' ? 'text-emerald-700' : 'text-slate-500'}`} />
                      {syncRange === '7days' && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <div className="text-xs font-bold text-slate-900">
                      {language === 'km' ? '៧ ថ្ងៃ (7 Days)' : '7 Days (1 Week)'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {language === 'km' ? 'សប្ដាហ៍បច្ចុប្បន្ន' : 'Current 7-day week'}
                    </div>
                  </button>

                  {/* This Month Option */}
                  <button
                    type="button"
                    onClick={() => setSyncRange('month')}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer relative ${
                      syncRange === 'month'
                        ? 'bg-emerald-50/90 border-emerald-500 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <CalendarDays className={`w-4 h-4 ${syncRange === 'month' ? 'text-emerald-700' : 'text-slate-500'}`} />
                      {syncRange === 'month' && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <div className="text-xs font-bold text-slate-900">
                      {language === 'km' ? 'ខែនេះ (This Month)' : 'This Month'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      {selectedDate.slice(0, 7)}
                    </div>
                  </button>

                  {/* Today Option */}
                  <button
                    type="button"
                    onClick={() => setSyncRange('today')}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer relative ${
                      syncRange === 'today'
                        ? 'bg-emerald-50/90 border-emerald-500 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Sparkles className={`w-4 h-4 ${syncRange === 'today' ? 'text-emerald-700' : 'text-slate-500'}`} />
                      {syncRange === 'today' && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <div className="text-xs font-bold text-slate-900">
                      {language === 'km' ? 'ថ្ងៃនេះ (Today)' : 'Today Only'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-mono truncate">
                      {selectedDate.slice(5)}
                    </div>
                  </button>

                  {/* All Logs Option */}
                  <button
                    type="button"
                    onClick={() => setSyncRange('all')}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer relative ${
                      syncRange === 'all'
                        ? 'bg-emerald-50/90 border-emerald-500 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <FileSpreadsheet className={`w-4 h-4 ${syncRange === 'all' ? 'text-emerald-700' : 'text-slate-500'}`} />
                      {syncRange === 'all' && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <div className="text-xs font-bold text-slate-900">
                      {language === 'km' ? 'ទាំងអស់ (All Logs)' : 'All Reports'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {Object.keys(reportsMap).length} days
                    </div>
                  </button>

                </div>
              </div>

              {/* Data Summary Box */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-xs text-emerald-950">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span className="font-bold">
                    {language === 'km' ? 'ទិន្នន័យដែលបានជ្រើសរើស:' : 'Selected Data Ready:'}
                  </span>
                  <span className="font-semibold">{selectedReports.length} {language === 'km' ? 'ថ្ងៃ' : 'days'} ({totalTasksCount} {language === 'km' ? 'កិច្ចការ' : 'tasks'})</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                    {completedTasksCount} {language === 'km' ? 'បានបញ្ចប់' : 'Done'}
                  </span>
                </div>
              </div>

              {/* Action Banner: Sync & Go Direct */}
              <div className="p-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl shadow-lg space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{language === 'km' ? 'ផ្ញើទិន្នន័យ & បើក Google Sheet ផ្ទាល់' : 'Send Data & Go Direct to Google Sheet'}</span>
                    </h3>
                    <p className="text-[11px] sm:text-xs text-emerald-100 mt-0.5">
                      {language === 'km' 
                        ? 'ចុចប៊ូតុងខាងក្រោម ប្រព័ន្ធនឹងបញ្ជូនទិន្នន័យ និងបើកផ្ទាំង Google Sheet ភ្លាមៗ' 
                        : 'Click the button below to sync chosen records and launch Google Sheet immediately in a new tab.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <button
                    onClick={handleSyncAndGoDirect}
                    disabled={isSyncing}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 text-xs sm:text-sm font-black shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                        <span>{language === 'km' ? 'កំពុងដំណើរការ...' : 'Syncing & Opening...'}</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 text-emerald-700" />
                        <span>{language === 'km' ? '⚡ ផ្ញើ & បើក Google Sheet ផ្ទាល់' : '⚡ Send & Open Google Sheet'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyTsvData}
                    className="w-full sm:w-auto px-3.5 py-3 rounded-xl bg-emerald-800/60 hover:bg-emerald-800 text-white text-xs font-bold border border-emerald-400/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    title="Copy tabular data to clipboard"
                  >
                    {hasCopiedTsv ? <Check className="w-4 h-4 text-amber-300" /> : <Copy className="w-4 h-4" />}
                    <span>{hasCopiedTsv ? (language === 'km' ? 'បាន Copy!' : 'Copied!') : (language === 'km' ? 'Copy Data' : 'Copy Data')}</span>
                  </button>
                </div>
              </div>

              {/* Feedback Alert */}
              {syncResult && (
                <div
                  className={`p-3 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 ${
                    syncResult.success
                      ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                      : 'bg-rose-100 text-rose-950 border border-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {syncResult.success ? (
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                    )}
                    <span>{syncResult.message}</span>
                  </div>

                  <a
                    href={syncResult.sheetUrl || destinationGoogleSheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-white text-slate-800 font-bold rounded-lg shadow-2xs hover:bg-slate-50 flex items-center gap-1 shrink-0 text-[11px]"
                  >
                    <span>{language === 'km' ? 'បើក Google Sheet' : 'Open Sheet'}</span>
                    <ExternalLink className="w-3 h-3 text-indigo-600" />
                  </a>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: PASTE RAW TABLE TEXT */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {language === 'km' ? 'បិទភ្ជាប់តារាង (TSV / CSV ពី Google Sheet ឬ Excel):' : 'Paste Table Data (from Google Sheets or Excel):'}
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`08:00 - 09:00\tDesign Social Poster\tSchedule\n09:00 - 10:00\tReview Facebook Platform\tSchedule\n17:00 - 18:00\tEdit Video Reels\tOver Time`}
                  className="w-full h-36 p-3 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{language === 'km' ? 'ញែកទិន្នន័យ (Parse)' : 'Parse Tasks'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: FILE UPLOAD */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div className="p-8 border-2 border-dashed border-slate-300 rounded-2xl text-center bg-slate-50 hover:bg-slate-100/80 transition-all">
                <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">
                  {language === 'km' ? 'ជ្រើសរើសឯកសារ Excel (.xlsx) ឬ CSV' : 'Select Excel (.xlsx) or CSV file'}
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt"
                  onChange={handleFileUpload}
                  className="mt-3 text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Parsed Rows Preview for Tab 2 and Tab 3 */}
          {activeTab !== 'sync' && (
            <>
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {parsedRows.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      {language === 'km' ? 'ទិន្នន័យដែលបានញែក:' : 'Parsed Task Slots:'} ({parsedRows.length})
                    </span>

                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500 font-medium">{language === 'km' ? 'របៀបបញ្ចូល:' : 'Mode:'}</span>
                      <select
                        value={importMode}
                        onChange={(e) => setImportMode(e.target.value as any)}
                        className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer"
                      >
                        <option value="replace">{language === 'km' ? 'ជំនួសកាលវិភាគថ្ងៃនេះ (Replace)' : 'Replace Today'}</option>
                        <option value="append">{language === 'km' ? 'បន្ថែមបន្ត (Append)' : 'Append to Today'}</option>
                        <option value="template">{language === 'km' ? 'កំណត់ជាគំរូទូទៅ (Save as Template)' : 'Save as Default Template'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {parsedRows.map((row, i) => (
                      <div key={row.id} className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-bold text-slate-500 w-5">#{i + 1}</span>
                          <span className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">{row.timeSlot}</span>
                          <span className="font-medium text-slate-800 truncate">{row.taskName}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${row.scheduleType === 'Over Time' ? 'bg-rose-100 text-rose-800' : 'bg-red-100 text-red-700'}`}>
                          {row.scheduleType}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleApplyImport}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{language === 'km' ? 'អនុវត្តបញ្ចូលកិច្ចការទាំងនេះ' : 'Apply & Import Tasks'}</span>
                  </button>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <a
            href={destinationGoogleSheetUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
          >
            <span>{language === 'km' ? 'បើកមើល Google Sheets របស់អ្នក' : 'Open Google Sheets Link'}</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
};
