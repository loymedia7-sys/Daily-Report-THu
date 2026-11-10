import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { DayReport, DefaultTimeSlotTemplate, UserProfile, Language } from '../types';
import {
  formatDateToScreenshotBanner,
  formatTimeSlotToTwoDigitHours,
  getWeekDays7,
  getWeekRangeLabel,
  getDateRangeDays,
  getDateRangeLabel
} from './dateUtils';
import { formatKhmerDate } from './translations';
import { createNewDayReport } from './storage';

function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates the HTML string for a single Day Table with full Khmer font support
 */
function generateDayTableHtml(report: DayReport, language: Language = 'en'): string {
  const isPermission = Boolean(report.isPermission);
  const isAbsentNoPermission = !report.isCheckedIn && !report.isPermission && !report.isHoliday;

  // Banner text in Khmer or English
  let bannerText = '';
  if (language === 'km') {
    const khmerDate = formatKhmerDate(report.date);
    if (isPermission) {
      bannerText = `${khmerDate} (ច្បាប់ឈប់សម្រាក - Permission)`;
    } else if (isAbsentNoPermission) {
      bannerText = `${khmerDate} (អវត្តមានឥតច្បាប់ - Absent)`;
    } else {
      bannerText = khmerDate;
    }
  } else {
    bannerText = formatDateToScreenshotBanner(report.date);
    if (isPermission) {
      bannerText += ' (Permission / Leave)';
    } else if (isAbsentNoPermission) {
      bannerText += ' (Absent - No Permission)';
    }
  }

  // Column Headers
  const colHeaders = language === 'km'
    ? {
        no: 'ល.រ (No)',
        time: 'ម៉ោង (Time)',
        task: 'កិច្ចការ / សកម្មភាព (Task / Activity)',
        checking: 'ត្រួតពិនិត្យ (checking)',
        reason: 'ហេតុផល (Reason)',
        other: 'ផ្សេងៗ (Other)'
      }
    : {
        no: 'No',
        time: 'Time',
        task: 'Task / Activity',
        checking: 'checking',
        reason: 'Reason',
        other: 'Other'
      };

  let rowsHtml = '';

  if (isPermission) {
    const reasonText = report.permissionReason
      ? `(${escapeHtml(report.permissionReason)})`
      : (language === 'km' ? '(សុំច្បាប់ឈប់សម្រាក / មិនស្រួលខ្លួន)' : '(sick can go need to rest and sleep)');
    
    const absentReason = escapeHtml(report.absentReason || (language === 'km' ? 'បានអនុញ្ញាតច្បាប់ត្រឹមត្រូវ' : 'Approved Permission'));
    const notes = escapeHtml(report.notes || '');

    rowsHtml += `
      <tr style="background-color: #fee2e2; color: #991b1b; font-weight: bold; font-size: 11px; height: 26px; line-height: 1.15;">
        <td style="border: 1px solid #000; text-align: center; vertical-align: middle; padding: 1px 2px 7px 2px;">1</td>
        <td style="border: 1px solid #000; text-align: center; vertical-align: middle; padding: 1px 2px 7px 2px;">${escapeHtml(report.permissionType || 'P')}</td>
        <td style="border: 1px solid #000; text-align: left; vertical-align: middle; padding: 1px 8px 7px 8px;">${reasonText}</td>
        <td style="border: 1px solid #000; text-align: center; vertical-align: middle; padding: 1px 2px 7px 2px; color: #16a34a; font-size: 14px; font-weight: bold;"><span style="display: inline-block; vertical-align: middle; line-height: 1;">✓</span></td>
        <td style="border: 1px solid #000; text-align: left; vertical-align: middle; padding: 1px 6px 7px 6px;">${absentReason}</td>
        <td style="border: 1px solid #000; text-align: left; vertical-align: middle; padding: 1px 6px 7px 6px;">${notes}</td>
      </tr>
    `;

    // 5 empty template rows below
    for (let i = 2; i <= 6; i++) {
      rowsHtml += `
        <tr style="height: 25px; font-size: 11px; line-height: 1.15;">
          <td style="border: 1px solid #000; text-align: center; vertical-align: middle; color: #64748b; padding: 1px 2px 7px 2px;">${i}</td>
          <td style="border: 1px solid #000; vertical-align: middle;"></td>
          <td style="border: 1px solid #000; vertical-align: middle;"></td>
          <td style="border: 1px solid #000; vertical-align: middle;"></td>
          <td style="border: 1px solid #000; vertical-align: middle;"></td>
          <td style="border: 1px solid #000; vertical-align: middle;"></td>
        </tr>
      `;
    }
  } else if (isAbsentNoPermission) {
    const absentNotice = language === 'km' ? 'អវត្តមានឥតច្បាប់ (មិនបាន Check-In វត្តមាន)' : '(អវត្តមានឥតច្បាប់ / Absent without permission)';
    const absentReason = language === 'km' ? 'មិនបាន Check-In និងមិនបានសុំច្បាប់' : 'No check-in & no permission requested';
    const notes = escapeHtml(report.notes || (language === 'km' ? 'អវត្តមាន' : 'Absent'));

    rowsHtml += `
      <tr style="background-color: #fef2f2; color: #991b1b; font-weight: bold; font-size: 11px; height: 26px; line-height: 1.15;">
        <td style="border: 1px solid #000; text-align: center; vertical-align: middle; padding: 1px 2px 7px 2px;">1</td>
        <td style="border: 1px solid #000; text-align: center; vertical-align: middle; padding: 1px 2px 7px 2px;">ABSENT</td>
        <td style="border: 1px solid #000; text-align: left; vertical-align: middle; padding: 1px 8px 7px 8px;">${absentNotice}</td>
        <td style="border: 1px solid #000; text-align: center; vertical-align: middle; padding: 1px 2px 7px 2px; color: #e11d48; font-size: 14px; font-weight: bold;"><span style="display: inline-block; vertical-align: middle; line-height: 1;">✗</span></td>
        <td style="border: 1px solid #000; text-align: left; vertical-align: middle; padding: 1px 6px 7px 6px;">${absentReason}</td>
        <td style="border: 1px solid #000; text-align: left; vertical-align: middle; padding: 1px 6px 7px 6px;">${notes}</td>
      </tr>
    `;

    for (let i = 2; i <= 6; i++) {
      rowsHtml += `
        <tr style="height: 25px; font-size: 11px; line-height: 1.15;">
          <td style="border: 1px solid #000; text-align: center; vertical-align: middle; color: #64748b; padding: 1px 2px 7px 2px;">${i}</td>
          <td style="border: 1px solid #000; vertical-align: middle;"></td>
          <td style="border: 1px solid #000; vertical-align: middle;"></td>
          <td style="border: 1px solid #000; vertical-align: middle;"></td>
          <td style="border: 1px solid #000; vertical-align: middle;"></td>
          <td style="border: 1px solid #000; vertical-align: middle;"></td>
        </tr>
      `;
    }
  } else {
    // Regular Schedule Tasks & Over Time Tasks
    const allTasks = report.tasks || [];
    const regularTasks = allTasks.filter(t => t.scheduleType !== 'Over Time' && !t.isOvertime);
    const overtimeTasks = allTasks.filter(t => t.scheduleType === 'Over Time' || t.isOvertime);

    let taskNum = 1;

    // Render Regular Tasks
    regularTasks.forEach((task) => {
      const isCompleted = task.isCompleted || task.status === 'completed';
      const isCrossed = task.status === 'crossed';
      const formattedTime = formatTimeSlotToTwoDigitHours(task.timeSlot) || task.timeSlot;

      let checkHtml = '';
      if (isCompleted) {
        checkHtml = '<span style="color: #16a34a; font-weight: 900; font-size: 14px; display: inline-block; vertical-align: middle; line-height: 1;">✓</span>';
      } else if (isCrossed) {
        checkHtml = '<span style="color: #e11d48; font-weight: 900; font-size: 13px; display: inline-block; vertical-align: middle; line-height: 1;">✗</span>';
      }

      rowsHtml += `
        <tr style="height: 26px; font-size: 11px; color: #000; line-height: 1.15;">
          <td style="border: 1px solid #000; text-align: center; vertical-align: middle; padding: 1px 2px 7px 2px;">${taskNum}</td>
          <td style="border: 1px solid #000; text-align: center; vertical-align: middle; padding: 1px 2px 7px 2px; font-weight: 500;">${escapeHtml(formattedTime)}</td>
          <td style="border: 1px solid #000; text-align: left; vertical-align: middle; padding: 1px 6px 7px 6px; word-break: break-word; font-family: 'Battambang', 'Kantumruy Pro', sans-serif;">${escapeHtml(task.taskName)}</td>
          <td style="border: 1px solid #000; text-align: center; vertical-align: middle; padding: 1px 2px 7px 2px;">${checkHtml}</td>
          <td style="border: 1px solid #000; text-align: left; vertical-align: middle; padding: 1px 6px 7px 6px; word-break: break-word; font-size: 10.5px; font-family: 'Battambang', 'Kantumruy Pro', sans-serif;">${escapeHtml(task.crossReason || '')}</td>
          <td style="border: 1px solid #000; text-align: left; vertical-align: middle; padding: 1px 6px 7px 6px; word-break: break-word; font-size: 10.5px; font-family: 'Battambang', 'Kantumruy Pro', sans-serif;">${escapeHtml(task.other || task.notes || '')}</td>
        </tr>
      `;
      taskNum++;
    });

    // Pad regular rows up to row 8
    while (taskNum <= 8) {
      rowsHtml += `
        <tr style="height: 25px; font-size: 11px; line-height: 1.15;">
          <td style="border: 1px solid #000; text-align: center; vertical-align: middle; color: #64748b; padding: 1px 2px 7px 2px;">${taskNum}</td>
          <td style="border: 1px solid #000; vertical-align: middle;"></td>
          <td style="border: 1px solid #000; vertical-align: middle;"></td>
          <td style="border: 1px solid #000; vertical-align: middle;"></td>
          <td style="border: 1px solid #000; vertical-align: middle;"></td>
          <td style="border: 1px solid #000; vertical-align: middle;"></td>
        </tr>
      `;
      taskNum++;
    }

    // Merged Green OVER TIME Row
    const otLabel = language === 'km' ? 'OVER TIME (ថែមម៉ោង)' : 'OVER TIME';
    rowsHtml += `
      <tr style="background-color: #22c55e; color: #000000; font-weight: bold; font-style: italic; font-size: 11.5px; height: 26px; line-height: 1.15;">
        <td colspan="6" style="border: 1px solid #000; text-align: center; vertical-align: middle; padding: 1px 0 7px 0; letter-spacing: 0.5px;">${otLabel}</td>
      </tr>
    `;

    // Render Overtime Tasks
    overtimeTasks.forEach((task) => {
      const isCompleted = task.isCompleted || task.status === 'completed';
      const isCrossed = task.status === 'crossed';
      const formattedTime = formatTimeSlotToTwoDigitHours(task.timeSlot) || task.timeSlot;

      let checkHtml = '';
      if (isCompleted) {
        checkHtml = '<span style="color: #16a34a; font-weight: 900; font-size: 14px; display: inline-block; vertical-align: middle; line-height: 1;">✓</span>';
      } else if (isCrossed) {
        checkHtml = '<span style="color: #e11d48; font-weight: 900; font-size: 13px; display: inline-block; vertical-align: middle; line-height: 1;">✗</span>';
      }

      rowsHtml += `
        <tr style="height: 26px; font-size: 11px; color: #000; line-height: 1.15;">
          <td style="border: 1px solid #000; text-align: center; vertical-align: middle; padding: 1px 2px 7px 2px;">${taskNum}</td>
          <td style="border: 1px solid #000; text-align: center; vertical-align: middle; padding: 1px 2px 7px 2px; font-weight: 500;">${escapeHtml(formattedTime)}</td>
          <td style="border: 1px solid #000; text-align: left; vertical-align: middle; padding: 1px 6px 7px 6px; word-break: break-word; font-family: 'Battambang', 'Kantumruy Pro', sans-serif;">${escapeHtml(task.taskName)}</td>
          <td style="border: 1px solid #000; text-align: center; vertical-align: middle; padding: 1px 2px 7px 2px;">${checkHtml}</td>
          <td style="border: 1px solid #000; text-align: left; vertical-align: middle; padding: 1px 6px 7px 6px; word-break: break-word; font-size: 10.5px; font-family: 'Battambang', 'Kantumruy Pro', sans-serif;">${escapeHtml(task.crossReason || '')}</td>
          <td style="border: 1px solid #000; text-align: left; vertical-align: middle; padding: 1px 6px 7px 6px; word-break: break-word; font-size: 10.5px; font-family: 'Battambang', 'Kantumruy Pro', sans-serif;">${escapeHtml(task.other || task.notes || '')}</td>
        </tr>
      `;
      taskNum++;
    });

    // Pad overtime rows up to 12 total
    const minOtTotal = Math.max(taskNum, 12);
    while (taskNum <= minOtTotal) {
      rowsHtml += `
        <tr style="height: 25px; font-size: 11px; line-height: 1.15;">
          <td style="border: 1px solid #000; text-align: center; vertical-align: middle; color: #64748b; padding: 1px 2px 7px 2px;">${taskNum}</td>
          <td style="border: 1px solid #000; vertical-align: middle;"></td>
          <td style="border: 1px solid #000; vertical-align: middle;"></td>
          <td style="border: 1px solid #000; vertical-align: middle;"></td>
          <td style="border: 1px solid #000; vertical-align: middle;"></td>
          <td style="border: 1px solid #000; vertical-align: middle;"></td>
        </tr>
      `;
      taskNum++;
    }
  }

  // Banner background color: Red for Permission / Absent, Yellow for Regular
  const bannerBg = isPermission || isAbsentNoPermission ? '#ef4444' : '#fef08a';
  const bannerColor = isPermission || isAbsentNoPermission ? '#ffffff' : '#000000';

  return `
    <div style="margin-bottom: 22px; break-inside: avoid; page-break-inside: avoid;">
      <!-- Date Banner -->
      <div style="
        background-color: ${bannerBg};
        color: ${bannerColor};
        border: 1px solid #000000;
        border-bottom: none;
        padding: 4px 10px 8px 10px;
        font-weight: bold;
        font-size: 13.5px;
        line-height: 1.3;
        display: flex;
        align-items: center;
        font-family: 'Battambang', 'Kantumruy Pro', 'Plus Jakarta Sans', system-ui, sans-serif;
      ">
        ${escapeHtml(bannerText)}
      </div>

      <!-- Table -->
      <table style="
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        border: 1px solid #000000;
        font-family: 'Battambang', 'Kantumruy Pro', 'Plus Jakarta Sans', system-ui, sans-serif;
      ">
        <colgroup>
          <col style="width: 38px;">
          <col style="width: 85px;">
          <col style="width: 250px;">
          <col style="width: 75px;">
          <col style="width: 135px;">
          <col style="width: 135px;">
        </colgroup>
        <thead>
          <tr style="
            background-color: #f8fafc;
            font-style: italic;
            font-weight: bold;
            font-size: 11px;
            text-align: center;
            height: 28px;
            color: #0f172a;
            line-height: 1.15;
          ">
            <th style="border: 1px solid #000; padding: 1px 2px 7px 2px; text-align: center; vertical-align: middle;">${colHeaders.no}</th>
            <th style="border: 1px solid #000; padding: 1px 2px 7px 2px; text-align: center; vertical-align: middle;">${colHeaders.time}</th>
            <th style="border: 1px solid #000; padding: 1px 4px 7px 4px; text-align: center; vertical-align: middle;">${colHeaders.task}</th>
            <th style="border: 1px solid #000; padding: 1px 2px 7px 2px; text-align: center; vertical-align: middle;">${colHeaders.checking}</th>
            <th style="border: 1px solid #000; padding: 1px 4px 7px 4px; text-align: center; vertical-align: middle;">${colHeaders.reason}</th>
            <th style="border: 1px solid #000; padding: 1px 4px 7px 4px; text-align: center; vertical-align: middle;">${colHeaders.other}</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Creates an offscreen DOM container with A4 dimensions (794px width) and attaches it
 */
async function renderElementToCanvas(elementHtml: string): Promise<HTMLCanvasElement> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-15000px';
  container.style.left = '-15000px';
  container.style.width = '794px'; // Standard A4 width at 96 DPI
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#000000';
  container.style.boxSizing = 'border-box';
  container.style.padding = '24px 28px';
  container.style.fontFamily = "'Battambang', 'Kantumruy Pro', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
  container.innerHTML = elementHtml;

  document.body.appendChild(container);

  // Ensure all Google Fonts (Battambang, Kantumruy Pro, etc.) are fully loaded
  if (document.fonts) {
    await document.fonts.ready;
  }
  // Brief delay to allow layout recalculation & image loading
  await new Promise((resolve) => setTimeout(resolve, 80));

  const canvas = await html2canvas(container, {
    scale: 2, // High resolution for crisp printing
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false
  });

  document.body.removeChild(container);
  return canvas;
}

/**
 * Builds standard report header banner with logo and employee info
 */
function buildReportHeaderHtml(
  title: string,
  userProfile: UserProfile,
  subtitle?: string,
  language: Language = 'en'
): string {
  const companyName = escapeHtml(userProfile.companyName || (language === 'km' ? 'ប្រព័ន្ធកត់ត្រាការងារ' : 'Daily Work Report'));
  const employeeName = escapeHtml(userProfile.employeeName || 'ROTH DARO');
  const department = escapeHtml(userProfile.department || (language === 'km' ? 'ផ្នែកទូទៅ' : 'General'));
  const supervisor = escapeHtml(userProfile.supervisorName || '');

  return `
    <div style="
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #334155;
      padding-bottom: 12px;
      margin-bottom: 16px;
      font-family: 'Battambang', 'Kantumruy Pro', 'Plus Jakarta Sans', system-ui, sans-serif;
    ">
      <div style="display: flex; align-items: center; gap: 12px;">
        ${
          userProfile.companyLogoUrl
            ? `<img src="${userProfile.companyLogoUrl}" crossorigin="anonymous" style="width: 48px; height: 48px; object-fit: contain; border-radius: 8px; border: 1px solid #e2e8f0;" />`
            : `<div style="width: 44px; height: 44px; background: #4f46e5; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 8px; font-size: 18px;">R</div>`
        }
        <div>
          <h1 style="margin: 0; font-size: 16px; font-weight: bold; color: #0f172a; line-height: 1.3;">
            ${companyName}
          </h1>
          <div style="font-size: 13px; font-weight: 600; color: #4338ca; margin-top: 2px;">
            ${escapeHtml(title)}
          </div>
          ${subtitle ? `<div style="font-size: 11px; color: #64748b; margin-top: 1px;">${escapeHtml(subtitle)}</div>` : ''}
        </div>
      </div>

      <div style="text-align: right; font-size: 11.5px; color: #334155; line-height: 1.45;">
        <div><strong>${language === 'km' ? 'បុគ្គលិក' : 'Employee'}:</strong> ${employeeName}</div>
        <div><strong>${language === 'km' ? 'តួនាទី' : 'Dept/Role'}:</strong> ${department}</div>
        ${supervisor ? `<div><strong>${language === 'km' ? 'ប្រធានគ្រប់គ្រង' : 'Supervisor'}:</strong> ${supervisor}</div>` : ''}
      </div>
    </div>
  `;
}

/**
 * Generates a clean single-day PDF document of the Daily Report with full Khmer language support
 */
export async function exportReportToPDF(
  report: DayReport,
  userProfile: UserProfile,
  language: Language | string = 'en'
): Promise<void> {
  const lang: Language = language === 'km' ? 'km' : 'en';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const headerTitle = lang === 'km' ? 'របាយការណ៍ការងារប្រចាំថ្ងៃ (Daily Work Report)' : 'Daily Work Report';
  const headerHtml = buildReportHeaderHtml(headerTitle, userProfile, undefined, lang);
  const tableHtml = generateDayTableHtml(report, lang);

  const fullHtml = `
    <div style="width: 100%;">
      ${headerHtml}
      ${tableHtml}
      <div style="text-align: right; font-size: 10px; color: #94a3b8; margin-top: 12px; font-family: 'Battambang', sans-serif;">
        ${lang === 'km' ? 'កាលបរិច្ឆេទបង្កើត' : 'Generated on'}: ${new Date().toLocaleString()}
      </div>
    </div>
  `;

  const canvas = await renderElementToCanvas(fullHtml);
  const imgData = canvas.toDataURL('image/jpeg', 0.96);

  // A4 is 210mm wide x 297mm high
  const pdfWidth = 190; // with 10mm margins on each side
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  doc.addImage(imgData, 'JPEG', 10, 10, pdfWidth, Math.min(pdfHeight, 277));

  const fileName = `Daily_Report_${report.date}_${(userProfile.employeeName || 'Report').replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}

/**
 * Generates 1-Week PDF containing 7 Daily Tables with full Khmer language support
 */
export async function exportWeeklyReportToPDF(
  targetDate: string,
  reportsMap: Record<string, DayReport>,
  userProfile: UserProfile,
  defaultSchedule: DefaultTimeSlotTemplate[],
  language: Language | string = 'en'
): Promise<void> {
  const lang: Language = language === 'km' ? 'km' : 'en';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const weekDays = getWeekDays7(targetDate);
  const weekLabel = getWeekRangeLabel(weekDays);

  const headerTitle = lang === 'km'
    ? `របាយការណ៍ការងារ ១សប្តាហ៍ (${weekLabel})`
    : `1-Week Work Report (${weekLabel})`;

  // Split the 7 days into pages (2 days per page, or 1 if needed)
  const pages: string[][] = [
    [weekDays[0], weekDays[1]],
    [weekDays[2], weekDays[3]],
    [weekDays[4], weekDays[5]],
    [weekDays[6]]
  ];

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    if (pageIdx > 0) {
      doc.addPage();
    }

    const currentDays = pages[pageIdx];
    let tablesHtml = '';

    for (const dateKey of currentDays) {
      const report = reportsMap[dateKey] || createNewDayReport(dateKey, defaultSchedule, userProfile);
      tablesHtml += generateDayTableHtml(report, lang);
    }

    const pageSubtitle = `${lang === 'km' ? 'ទំព័រទី' : 'Page'} ${pageIdx + 1}/${pages.length}`;
    const headerHtml = buildReportHeaderHtml(headerTitle, userProfile, pageSubtitle, lang);

    const fullHtml = `
      <div style="width: 100%;">
        ${headerHtml}
        ${tablesHtml}
      </div>
    `;

    const canvas = await renderElementToCanvas(fullHtml);
    const imgData = canvas.toDataURL('image/jpeg', 0.96);

    const pdfWidth = 190;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    doc.addImage(imgData, 'JPEG', 10, 10, pdfWidth, Math.min(pdfHeight, 277));
  }

  const fileName = `1_Week_Report_${weekDays[0]}_to_${weekDays[6]}_${(userProfile.employeeName || 'Report').replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}

/**
 * Generates Custom Date Range PDF (Day to Day, e.g. 01 to 15) with full Khmer language support
 */
export async function exportDateRangeReportToPDF(
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
  const rangeLabel = getDateRangeLabel(startDate, endDate);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const headerTitle = lang === 'km'
    ? `របាយការណ៍ការងារចន្លោះថ្ងៃ (${rangeLabel} - សរុប ${dateRangeDays.length} ថ្ងៃ)`
    : `Work Report (${rangeLabel} - ${dateRangeDays.length} Days)`;

  // Paginate 2 days per page
  const pages: string[][] = [];
  for (let i = 0; i < dateRangeDays.length; i += 2) {
    pages.push(dateRangeDays.slice(i, i + 2));
  }

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    if (pageIdx > 0) {
      doc.addPage();
    }

    const currentDays = pages[pageIdx];
    let tablesHtml = '';

    for (const dateKey of currentDays) {
      const report = reportsMap[dateKey] || createNewDayReport(dateKey, defaultSchedule, userProfile);
      tablesHtml += generateDayTableHtml(report, lang);
    }

    const pageSubtitle = `${lang === 'km' ? 'ទំព័រទី' : 'Page'} ${pageIdx + 1}/${pages.length}`;
    const headerHtml = buildReportHeaderHtml(headerTitle, userProfile, pageSubtitle, lang);

    const fullHtml = `
      <div style="width: 100%;">
        ${headerHtml}
        ${tablesHtml}
      </div>
    `;

    const canvas = await renderElementToCanvas(fullHtml);
    const imgData = canvas.toDataURL('image/jpeg', 0.96);

    const pdfWidth = 190;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    doc.addImage(imgData, 'JPEG', 10, 10, pdfWidth, Math.min(pdfHeight, 277));
  }

  const fileName = `Report_${firstDate}_to_${lastDate}_${(userProfile.employeeName || 'Report').replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}
