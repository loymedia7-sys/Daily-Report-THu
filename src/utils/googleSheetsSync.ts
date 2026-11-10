import { DayReport, UserProfile } from '../types';

export const APPS_SCRIPT_SNIPPET = `/**
 * GOOGLE APPS SCRIPT CODE FOR DAILY REPORT SCHEDULE TRACKER
 * 
 * Instructions:
 * 1. Open your Google Sheet (or create new at sheets.google.com).
 * 2. Click Extensions > Apps Script.
 * 3. Delete any default code and paste this script.
 * 4. Click Deploy > New Deployment.
 * 5. Select type: "Web app".
 * 6. Execute as: "Me", Who has access: "Anyone".
 * 7. Copy the Web App URL and paste it into the Settings or Sync Dialog in Daily Report App!
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var payload = JSON.parse(e.postData.contents);
    
    // Ensure header row exists
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Date", "Day", "Employee", "Department", "Time Slot", "Task Name", "Schedule", "Status", "Time Checked", "Remarks", "Timestamp"]);
      sheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#FDE047");
    }
    
    // Handle multi-day reports array or single report
    var reportsList = payload.reports || (payload.tasks ? [payload] : []);
    
    reportsList.forEach(function(report) {
      if (report.tasks && report.tasks.length > 0) {
        report.tasks.forEach(function(task) {
          sheet.appendRow([
            report.date,
            report.dayOfWeek || "",
            payload.employeeName || report.employeeName || "",
            payload.department || report.department || "",
            task.timeSlot,
            task.taskName,
            task.scheduleType || "Schedule",
            task.isCompleted ? "DONE" : "PENDING",
            task.completedAt || "",
            task.notes || "",
            new Date().toISOString()
          ]);
        });
      } else if (report.isHoliday) {
        sheet.appendRow([
          report.date,
          report.dayOfWeek || "",
          payload.employeeName || report.employeeName || "",
          payload.department || report.department || "",
          "-",
          "Holiday (" + (report.holidayReason || "Off Day") + ")",
          "-",
          "HOLIDAY",
          "-",
          "-",
          new Date().toISOString()
        ]);
      }
    });
    
    return ContentService.createTextOutput(JSON.stringify({ result: "success", message: "Rows synced successfully" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;

/**
 * Returns user's Google Sheet URL or a fallback create URL
 */
export function getGoogleSheetDestinationUrl(userProfile: UserProfile): string {
  if (userProfile.googleSheetUrl && userProfile.googleSheetUrl.trim().startsWith('http')) {
    return userProfile.googleSheetUrl.trim();
  }
  if (userProfile.googleSheetWebAppUrl && userProfile.googleSheetWebAppUrl.includes('/macros/s/')) {
    // If user provided a web app URL, they might also have a spreadsheet
    return 'https://docs.google.com/spreadsheets';
  }
  return 'https://sheets.google.com/create';
}

/**
 * Generates formatted tab-separated text (TSV) ready to copy-paste directly into Google Sheet
 */
export function generateGoogleSheetsTsv(
  reports: DayReport[],
  userProfile: UserProfile
): string {
  const headers = ['Date', 'Day', 'Employee', 'Department', 'Time Slot', 'Task / Activity', 'Schedule Type', 'Status', 'Time Done', 'Notes / Remarks'];
  const rows: string[] = [headers.join('\t')];

  const sortedReports = [...reports].sort((a, b) => a.date.localeCompare(b.date));

  sortedReports.forEach((report) => {
    if (report.tasks && report.tasks.length > 0) {
      report.tasks.forEach((task) => {
        rows.push([
          report.date,
          report.dayOfWeek,
          userProfile.employeeName,
          userProfile.department,
          task.timeSlot,
          task.taskName.replace(/[\t\n\r]/g, ' '),
          task.scheduleType || 'Schedule',
          task.isCompleted ? 'DONE' : 'PENDING',
          task.completedAt || '',
          (task.notes || '').replace(/[\t\n\r]/g, ' ')
        ].join('\t'));
      });
    } else if (report.isHoliday) {
      rows.push([
        report.date,
        report.dayOfWeek,
        userProfile.employeeName,
        userProfile.department,
        '-',
        `Holiday (${report.holidayReason || 'Off Day'})`,
        '-',
        'HOLIDAY',
        '-',
        '-'
      ].join('\t'));
    }
  });

  return rows.join('\n');
}

/**
 * Sync single or multiple day reports to Google Sheets Web App
 */
export async function syncMultipleReportsToGoogleSheets(
  reports: DayReport[],
  userProfile: UserProfile,
  rangeTitle: string = 'Report Data'
): Promise<{ success: boolean; message: string; sheetUrl?: string }> {
  const destinationUrl = getGoogleSheetDestinationUrl(userProfile);

  if (!userProfile.googleSheetWebAppUrl || !userProfile.googleSheetWebAppUrl.trim()) {
    // If no web app url is configured, copy to clipboard and open Google Sheet directly!
    const tsvData = generateGoogleSheetsTsv(reports, userProfile);
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(tsvData);
      } catch (err) {
        console.warn('Clipboard write failed:', err);
      }
    }
    return {
      success: true,
      message: `Formatted ${reports.length} days of data to clipboard. Redirecting to Google Sheet...`,
      sheetUrl: destinationUrl
    };
  }

  const payload = {
    rangeTitle,
    employeeName: userProfile.employeeName,
    department: userProfile.department,
    reports: reports.map((r) => ({
      date: r.date,
      dayOfWeek: r.dayOfWeek,
      isHoliday: r.isHoliday,
      holidayReason: r.holidayReason,
      tasks: r.tasks,
      lastUpdated: r.lastUpdated || new Date().toISOString()
    })),
    syncedAt: new Date().toISOString()
  };

  try {
    await fetch(userProfile.googleSheetWebAppUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    return {
      success: true,
      message: `Successfully synced ${reports.length} day(s) to Google Sheets!`,
      sheetUrl: destinationUrl
    };
  } catch (error: any) {
    console.error('Error syncing to Google Sheets:', error);
    return {
      success: false,
      message: error?.message || 'Failed to sync with Google Sheets endpoint.',
      sheetUrl: destinationUrl
    };
  }
}

/**
 * Sync single day report payload to Google Sheets Web App
 */
export async function syncReportToGoogleSheets(
  report: DayReport,
  userProfile: UserProfile
): Promise<{ success: boolean; message: string; sheetUrl?: string }> {
  return syncMultipleReportsToGoogleSheets([report], userProfile, `Day Report ${report.date}`);
}
