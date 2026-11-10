import ExcelJS from 'exceljs';
import { DayReport, DefaultTimeSlotTemplate, UserProfile, Language } from '../types';
import {
  formatDateToScreenshotBanner,
  formatTimeSlotToTwoDigitHours,
  MONTH_NAMES,
  getWeekDays7,
  getDateRangeDays,
} from './dateUtils';
import { formatKhmerDate } from './translations';
import { createNewDayReport } from './storage';

const THIN_BLACK_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } }
};

const KHMER_FONT_NAME = 'Kantumruy Pro, Battambang, Calibri, Arial, sans-serif';

/**
 * Helper to render a single Daily Table matching the user's template:
 * - Header Banner: "Date 25 August 2026" (Yellow) or "Date 26 August 2026" (Red for Permission/Absent)
 * - Columns: No | Time | Task / Activity | checking | Reason | Other
 * - Regular items (1 to 8)
 * - Green "OVER TIME" merged row
 * - Overtime items (9, 10...)
 * - Extra template blank rows with borders
 */
export function renderDayTableToWorksheet(
  worksheet: ExcelJS.Worksheet,
  report: DayReport,
  startRowNum: number,
  language: Language | string = 'en'
): number {
  const lang: Language = language === 'km' ? 'km' : 'en';
  let currentRow = startRowNum;
  const isPermission = Boolean(report.isPermission);
  const isAbsentNoPermission = !report.isCheckedIn && !report.isPermission && !report.isHoliday;

  // Banner text in Khmer or English
  let bannerTitle = '';
  if (lang === 'km') {
    const khmerDate = formatKhmerDate(report.date);
    if (isPermission) {
      bannerTitle = `${khmerDate} (ច្បាប់ឈប់សម្រាក - Permission)`;
    } else if (isAbsentNoPermission) {
      bannerTitle = `${khmerDate} (អវត្តមានឥតច្បាប់ - Absent)`;
    } else {
      bannerTitle = khmerDate;
    }
  } else {
    bannerTitle = formatDateToScreenshotBanner(report.date);
    if (isPermission) {
      bannerTitle += ' (Permission / Leave)';
    } else if (isAbsentNoPermission) {
      bannerTitle += ' (Absent - No Permission)';
    }
  }

  // 1. DATE BANNER (Merged A to F)
  worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
  const bannerCell = worksheet.getCell(`A${currentRow}`);
  bannerCell.value = bannerTitle;
  bannerCell.font = { name: KHMER_FONT_NAME, size: 13, bold: true, color: { argb: (isPermission || isAbsentNoPermission) ? 'FFFFFFFF' : 'FF000000' } };
  bannerCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  bannerCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: (isPermission || isAbsentNoPermission) ? 'FFDC2626' : 'FFFFFF00' } // Bright Red for Permission/Absent, Bright Yellow for Regular
  };
  
  // Apply borders to banner row
  for (let c = 1; c <= 6; c++) {
    worksheet.getRow(currentRow).getCell(c).border = THIN_BLACK_BORDER;
  }
  worksheet.getRow(currentRow).height = 28;
  currentRow++;

  // 2. TABLE HEADERS (Row 2)
  const headerTitles = lang === 'km'
    ? ['ល.រ', 'ម៉ោង', 'កិច្ចការ / សកម្មភាព', 'ត្រួតពិនិត្យ', 'ហេតុផល', 'ផ្សេងៗ']
    : ['No', 'Time', 'Task / Activity', 'checking', 'Reason', 'Other'];

  const headerRow = worksheet.getRow(currentRow);
  headerRow.height = 24;

  headerTitles.forEach((title, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = title;
    cell.font = { name: KHMER_FONT_NAME, size: 11, bold: true, italic: true, color: { argb: 'FF000000' } };
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle'
    };
    cell.border = THIN_BLACK_BORDER;
  });
  currentRow++;

  // 3. IF PERMISSION / SICK LEAVE DAY
  if (isPermission) {
    const permRow = worksheet.getRow(currentRow);
    permRow.height = 25;

    const reasonText = report.permissionReason
      ? `(${report.permissionReason})`
      : (lang === 'km' ? '(សុំច្បាប់ឈប់សម្រាក / មិនស្រួលខ្លួន)' : '(sick can go need to rest and sleep)');
    const absentReason = report.absentReason || (lang === 'km' ? 'បានអនុញ្ញាតច្បាប់ត្រឹមត្រូវ' : 'Approved Permission');

    permRow.getCell(1).value = 1;
    permRow.getCell(2).value = report.permissionType || 'P';
    permRow.getCell(3).value = reasonText;
    permRow.getCell(4).value = '✓';
    permRow.getCell(5).value = absentReason;
    permRow.getCell(6).value = report.notes || '';

    for (let c = 1; c <= 6; c++) {
      const cell = permRow.getCell(c);
      cell.border = THIN_BLACK_BORDER;
      cell.font = { name: KHMER_FONT_NAME, size: 11, bold: true, color: { argb: 'FF991B1B' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEE2E2' }
      };
      cell.alignment = {
        horizontal: c === 1 || c === 2 || c === 4 ? 'center' : 'left',
        vertical: 'middle'
      };
    }
    permRow.getCell(4).font = { name: KHMER_FONT_NAME, size: 13, bold: true, color: { argb: 'FF16A34A' } };
    currentRow++;

    // Extra template blank rows
    for (let i = 2; i <= 6; i++) {
      const blankRow = worksheet.getRow(currentRow);
      blankRow.height = 22;
      blankRow.getCell(1).value = i;
      blankRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      blankRow.getCell(1).font = { name: KHMER_FONT_NAME, size: 10, color: { argb: 'FF64748B' } };
      for (let c = 1; c <= 6; c++) {
        blankRow.getCell(c).border = THIN_BLACK_BORDER;
      }
      currentRow++;
    }
    return currentRow + 1;
  }

  // 4. IF ABSENT WITHOUT PERMISSION
  if (isAbsentNoPermission) {
    const absentRow = worksheet.getRow(currentRow);
    absentRow.height = 25;

    absentRow.getCell(1).value = 1;
    absentRow.getCell(2).value = 'ABSENT';
    absentRow.getCell(3).value = lang === 'km' ? 'អវត្តមានឥតច្បាប់ (មិនបាន Check-In)' : '(Absent without permission)';
    absentRow.getCell(4).value = '✗';
    absentRow.getCell(5).value = lang === 'km' ? 'មិនបាន Check-In វត្តមាន' : 'No check-in';
    absentRow.getCell(6).value = report.notes || '';

    for (let c = 1; c <= 6; c++) {
      const cell = absentRow.getCell(c);
      cell.border = THIN_BLACK_BORDER;
      cell.font = { name: KHMER_FONT_NAME, size: 11, bold: true, color: { argb: 'FF991B1B' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEF2F2' }
      };
      cell.alignment = {
        horizontal: c === 1 || c === 2 || c === 4 ? 'center' : 'left',
        vertical: 'middle'
      };
    }
    absentRow.getCell(4).font = { name: KHMER_FONT_NAME, size: 13, bold: true, color: { argb: 'FFE11D48' } };
    currentRow++;

    for (let i = 2; i <= 6; i++) {
      const blankRow = worksheet.getRow(currentRow);
      blankRow.height = 22;
      blankRow.getCell(1).value = i;
      blankRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      blankRow.getCell(1).font = { name: KHMER_FONT_NAME, size: 10, color: { argb: 'FF64748B' } };
      for (let c = 1; c <= 6; c++) {
        blankRow.getCell(c).border = THIN_BLACK_BORDER;
      }
      currentRow++;
    }
    return currentRow + 1;
  }

  // 5. REGULAR WORKING SCHEDULE
  const allTasks = report.tasks || [];
  const regularTasks = allTasks.filter(t => t.scheduleType !== 'Over Time' && !t.isOvertime);
  const overtimeTasks = allTasks.filter(t => t.scheduleType === 'Over Time' || t.isOvertime);

  let taskNum = 1;

  // Regular Tasks
  regularTasks.forEach((task) => {
    const row = worksheet.getRow(currentRow);
    row.height = 24;

    const isCompleted = task.isCompleted || task.status === 'completed';
    const isCrossed = task.status === 'crossed';
    const formattedTime = formatTimeSlotToTwoDigitHours(task.timeSlot) || task.timeSlot;

    row.getCell(1).value = taskNum;
    row.getCell(2).value = formattedTime;
    row.getCell(3).value = task.taskName;
    row.getCell(4).value = isCompleted ? '✓' : isCrossed ? '✗' : '';
    row.getCell(5).value = task.crossReason || '';
    row.getCell(6).value = task.other || task.notes || '';

    for (let c = 1; c <= 6; c++) {
      const cell = row.getCell(c);
      cell.border = THIN_BLACK_BORDER;
      cell.font = { name: KHMER_FONT_NAME, size: 10.5 };
      cell.alignment = {
        horizontal: c === 1 || c === 2 || c === 4 ? 'center' : 'left',
        vertical: 'middle'
      };
    }

    if (isCompleted) {
      row.getCell(4).font = { name: KHMER_FONT_NAME, size: 13, bold: true, color: { argb: 'FF16A34A' } };
    } else if (isCrossed) {
      row.getCell(4).font = { name: KHMER_FONT_NAME, size: 13, bold: true, color: { argb: 'FFE11D48' } };
    }

    currentRow++;
    taskNum++;
  });

  // Pad regular rows up to 8
  while (taskNum <= 8) {
    const blankRow = worksheet.getRow(currentRow);
    blankRow.height = 22;
    blankRow.getCell(1).value = taskNum;
    blankRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    blankRow.getCell(1).font = { name: KHMER_FONT_NAME, size: 10, color: { argb: 'FF64748B' } };
    for (let c = 1; c <= 6; c++) {
      blankRow.getCell(c).border = THIN_BLACK_BORDER;
    }
    currentRow++;
    taskNum++;
  }

  // 6. MERGED GREEN OVER TIME ROW
  worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
  const otCell = worksheet.getCell(`A${currentRow}`);
  otCell.value = lang === 'km' ? 'OVER TIME (ថែមម៉ោង)' : 'OVER TIME';
  otCell.font = { name: KHMER_FONT_NAME, size: 11, bold: true, italic: true, color: { argb: 'FF000000' } };
  otCell.alignment = { horizontal: 'center', vertical: 'middle' };
  otCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF22C55E' } // Green Over Time Bar
  };
  for (let c = 1; c <= 6; c++) {
    worksheet.getRow(currentRow).getCell(c).border = THIN_BLACK_BORDER;
  }
  worksheet.getRow(currentRow).height = 24;
  currentRow++;

  // 7. OVERTIME TASKS
  overtimeTasks.forEach((task) => {
    const row = worksheet.getRow(currentRow);
    row.height = 24;

    const isCompleted = task.isCompleted || task.status === 'completed';
    const isCrossed = task.status === 'crossed';
    const formattedTime = formatTimeSlotToTwoDigitHours(task.timeSlot) || task.timeSlot;

    row.getCell(1).value = taskNum;
    row.getCell(2).value = formattedTime;
    row.getCell(3).value = task.taskName;
    row.getCell(4).value = isCompleted ? '✓' : isCrossed ? '✗' : '';
    row.getCell(5).value = task.crossReason || '';
    row.getCell(6).value = task.other || task.notes || '';

    for (let c = 1; c <= 6; c++) {
      const cell = row.getCell(c);
      cell.border = THIN_BLACK_BORDER;
      cell.font = { name: KHMER_FONT_NAME, size: 10.5 };
      cell.alignment = {
        horizontal: c === 1 || c === 2 || c === 4 ? 'center' : 'left',
        vertical: 'middle'
      };
    }

    if (isCompleted) {
      row.getCell(4).font = { name: KHMER_FONT_NAME, size: 13, bold: true, color: { argb: 'FF16A34A' } };
    } else if (isCrossed) {
      row.getCell(4).font = { name: KHMER_FONT_NAME, size: 13, bold: true, color: { argb: 'FFE11D48' } };
    }

    currentRow++;
    taskNum++;
  });

  // Pad overtime rows up to at least 12
  const minOtTotal = Math.max(taskNum, 12);
  while (taskNum <= minOtTotal) {
    const blankRow = worksheet.getRow(currentRow);
    blankRow.height = 22;
    blankRow.getCell(1).value = taskNum;
    blankRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    blankRow.getCell(1).font = { name: KHMER_FONT_NAME, size: 10, color: { argb: 'FF64748B' } };
    for (let c = 1; c <= 6; c++) {
      blankRow.getCell(c).border = THIN_BLACK_BORDER;
    }
    currentRow++;
    taskNum++;
  }

  return currentRow + 1; // Extra space after table
}

/**
 * Export Single Day Report matching the template screenshot
 */
export async function exportReportToExcel(
  report: DayReport,
  userProfile: UserProfile,
  language: Language | string = 'en'
): Promise<void> {
  const lang: Language = language === 'km' ? 'km' : 'en';
  const workbook = new ExcelJS.Workbook();
  workbook.creator = userProfile.employeeName || 'ROTH DARO';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(`Report_${report.date}`, {
    views: [{ showGridLines: true }]
  });

  worksheet.columns = [
    { key: 'no', width: 7 },
    { key: 'time', width: 14 },
    { key: 'task', width: 44 },
    { key: 'checking', width: 14 },
    { key: 'reason', width: 28 },
    { key: 'other', width: 28 }
  ];

  renderDayTableToWorksheet(worksheet, report, 1, lang);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Daily_Report_${report.date}_${(userProfile.employeeName || 'Report').replace(/\s+/g, '_')}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Export 1-Week Report (7 Days 7 Tables) matching the screenshot
 */
export async function exportWeeklyReportToExcel(
  targetDate: string,
  reportsMap: Record<string, DayReport>,
  userProfile: UserProfile,
  defaultSchedule: DefaultTimeSlotTemplate[],
  language: Language | string = 'en'
): Promise<void> {
  const lang: Language = language === 'km' ? 'km' : 'en';
  const weekDays = getWeekDays7(targetDate);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = userProfile.employeeName || 'ROTH DARO';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('1-Week Report (7 Days)', {
    views: [{ showGridLines: true }]
  });

  worksheet.columns = [
    { key: 'no', width: 7 },
    { key: 'time', width: 14 },
    { key: 'task', width: 44 },
    { key: 'checking', width: 14 },
    { key: 'reason', width: 28 },
    { key: 'other', width: 28 }
  ];

  let currentStartRow = 1;

  for (const dateKey of weekDays) {
    const dayReport = reportsMap[dateKey] || createNewDayReport(dateKey, defaultSchedule, userProfile);
    currentStartRow = renderDayTableToWorksheet(worksheet, dayReport, currentStartRow, lang);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `1_Week_Report_${weekDays[0]}_to_${weekDays[6]}_${(userProfile.employeeName || 'Report').replace(/\s+/g, '_')}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Export Custom Date Range Report (Day to Day, e.g. 01 to 15) to Excel
 */
export async function exportDateRangeReportToExcel(
  startDate: string,
  endDate: string,
  reportsMap: Record<string, DayReport>,
  userProfile: UserProfile,
  defaultSchedule: DefaultTimeSlotTemplate[],
  language: Language | string = 'en'
): Promise<void> {
  const lang: Language = language === 'km' ? 'km' : 'en';
  const dateRangeDays = getDateRangeDays(startDate, endDate);
  if (dateRangeDays.length === 0) return;

  const firstDate = dateRangeDays[0];
  const lastDate = dateRangeDays[dateRangeDays.length - 1];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = userProfile.employeeName || 'ROTH DARO';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(`Report_${firstDate.slice(5)}_to_${lastDate.slice(5)}`, {
    views: [{ showGridLines: true }]
  });

  worksheet.columns = [
    { key: 'no', width: 7 },
    { key: 'time', width: 14 },
    { key: 'task', width: 44 },
    { key: 'checking', width: 14 },
    { key: 'reason', width: 28 },
    { key: 'other', width: 28 }
  ];

  let currentStartRow = 1;

  for (const dateKey of dateRangeDays) {
    const dayReport = reportsMap[dateKey] || createNewDayReport(dateKey, defaultSchedule, userProfile);
    currentStartRow = renderDayTableToWorksheet(worksheet, dayReport, currentStartRow, lang);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Report_${firstDate}_to_${lastDate}_${(userProfile.employeeName || 'Report').replace(/\s+/g, '_')}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Export Monthly Overview to Excel
 */
export async function exportMonthlyOverviewToExcel(
  year: number,
  monthIndex: number,
  reportsMap: Record<string, DayReport>,
  userProfile: UserProfile,
  defaultSchedule: DefaultTimeSlotTemplate[],
  language: Language | string = 'en'
): Promise<void> {
  const lang: Language = language === 'km' ? 'km' : 'en';
  const monthName = MONTH_NAMES[monthIndex];
  const workbook = new ExcelJS.Workbook();
  workbook.creator = userProfile.employeeName || 'ROTH DARO';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(`${monthName}_${year}`, {
    views: [{ showGridLines: true }]
  });

  worksheet.columns = [
    { key: 'no', width: 7 },
    { key: 'time', width: 14 },
    { key: 'task', width: 44 },
    { key: 'checking', width: 14 },
    { key: 'reason', width: 28 },
    { key: 'other', width: 28 }
  ];

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  let currentStartRow = 1;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayReport = reportsMap[dateKey] || createNewDayReport(dateKey, defaultSchedule, userProfile);
    currentStartRow = renderDayTableToWorksheet(worksheet, dayReport, currentStartRow, lang);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Monthly_Report_${monthName}_${year}_${(userProfile.employeeName || 'Report').replace(/\s+/g, '_')}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Master Export (All Logs in Table Format)
 */
export const exportAllReportsToExcel = async (
  reports: DayReport[] | Record<string, DayReport>,
  userProfile: UserProfile,
  language: Language | string = 'en'
) => {
  const map: Record<string, DayReport> = Array.isArray(reports)
    ? reports.reduce((acc, r) => ({ ...acc, [r.date]: r }), {})
    : reports;
  return exportMasterExcel(map, userProfile, language);
};

export async function exportMasterExcel(
  reportsMap: Record<string, DayReport>,
  userProfile: UserProfile,
  language: Language | string = 'en'
): Promise<void> {
  const lang: Language = language === 'km' ? 'km' : 'en';
  const workbook = new ExcelJS.Workbook();
  workbook.creator = userProfile.employeeName || 'ROTH DARO';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Master Logs', {
    views: [{ showGridLines: true }]
  });

  worksheet.columns = [
    { key: 'date', width: 14 },
    { key: 'day', width: 12 },
    { key: 'no', width: 6 },
    { key: 'time', width: 14 },
    { key: 'task', width: 40 },
    { key: 'schedule', width: 14 },
    { key: 'checking', width: 12 },
    { key: 'reason', width: 24 },
    { key: 'other', width: 24 }
  ];

  // Header row
  const headers = lang === 'km'
    ? ['កាលបរិច្ឆេទ', 'ថ្ងៃ', 'ល.រ', 'ម៉ោង', 'កិច្ចការ / សកម្មភាព', 'ប្រភេទ', 'ត្រួតពិនិត្យ', 'ហេតុផល', 'ផ្សេងៗ']
    : ['Date', 'Day', 'No', 'Time Slot', 'Activity / Task', 'Schedule Type', 'Checking', 'Reason', 'Other'];

  const headerRow = worksheet.getRow(1);
  headerRow.height = 26;

  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: KHMER_FONT_NAME, size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }
    };
    cell.border = THIN_BLACK_BORDER;
  });

  let rowNum = 2;
  const sortedDates = Object.keys(reportsMap).sort();

  for (const dateKey of sortedDates) {
    const report = reportsMap[dateKey];
    if (report.isPermission) {
      const row = worksheet.getRow(rowNum);
      row.getCell(1).value = report.date;
      row.getCell(2).value = report.dayOfWeek;
      row.getCell(3).value = 1;
      row.getCell(4).value = report.permissionType || 'P';
      row.getCell(5).value = `(${report.permissionReason || (lang === 'km' ? 'ច្បាប់ឈប់សម្រាក' : 'Permission / Sick Leave')})`;
      row.getCell(6).value = lang === 'km' ? 'ច្បាប់ឈប់សម្រាក' : 'Permission';
      row.getCell(7).value = '✓';
      row.getCell(8).value = report.absentReason || (lang === 'km' ? 'បានអនុញ្ញាតច្បាប់' : 'Approved Leave');
      row.getCell(9).value = report.notes || '';
      for (let c = 1; c <= 9; c++) {
        row.getCell(c).border = THIN_BLACK_BORDER;
        row.getCell(c).font = { name: KHMER_FONT_NAME, size: 10.5 };
      }
      rowNum++;
      continue;
    }

    (report.tasks || []).forEach((t, idx) => {
      const row = worksheet.getRow(rowNum);
      row.getCell(1).value = report.date;
      row.getCell(2).value = report.dayOfWeek;
      row.getCell(3).value = idx + 1;
      row.getCell(4).value = formatTimeSlotToTwoDigitHours(t.timeSlot) || t.timeSlot;
      row.getCell(5).value = t.taskName;
      row.getCell(6).value = t.scheduleType || (t.isOvertime ? 'Over Time' : 'Schedule');
      row.getCell(7).value = t.isCompleted || t.status === 'completed' ? '✓' : t.status === 'crossed' ? '✗' : '';
      row.getCell(8).value = t.crossReason || '';
      row.getCell(9).value = t.other || t.notes || '';
      for (let c = 1; c <= 9; c++) {
        row.getCell(c).border = THIN_BLACK_BORDER;
        row.getCell(c).font = { name: KHMER_FONT_NAME, size: 10.5 };
      }
      rowNum++;
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Master_Report_All_Logs_${(userProfile.employeeName || 'Report').replace(/\s+/g, '_')}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
