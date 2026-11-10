export type Language = 'en' | 'km';

export interface Translations {
  // Navigation & Header
  dailySchedule: string;
  summaryTable: string;
  checkCount: string;
  checkCountTime: string;
  importSheet: string;
  googleLogin: string;
  exportReport: string;
  templateSchedule: string;
  settings: string;
  cloudSync: string;
  localStorageMode: string;
  language: string;
  switchLanguage: string;
  english: string;
  khmer: string;

  // Date & Days
  selectedLogDate: string;
  todayBadge: string;
  progress: string;
  previousDay: string;
  nextDay: string;
  sunday: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunShort: string;
  monShort: string;
  tueShort: string;
  wedShort: string;
  thuShort: string;
  friShort: string;
  satShort: string;

  // Check-In / Check-Out & Attendance
  presentStatus: string;
  permissionStatus: string;
  absentNoPermissionStatus: string;
  presentWorkedToday: string;
  permissionOnLeaveToday: string;
  absentNoPermissionDesc: string;
  checkIn: string;
  checkOut: string;
  checkedIn: string;
  checkedOut: string;
  activeWorkShift: string;
  checkedInAt: string;
  currentShiftDuration: string;
  totalWorkedToday: string;
  workSessions: string;
  sessionsLogged: string;
  noSessionsYet: string;
  optionalSessionNote: string;
  confirmCheckOut: string;
  cancel: string;
  deleteSession: string;
  duration: string;
  notCheckedInStatus: string;
  notCheckedInAbsentHint: string;
  putPermissionBtn: string;
  permissionActiveBadge: string;
  permissionTitle: string;
  permissionSubtitle: string;
  permissionTypeLabel: string;
  permissionReasonLabel: string;
  permissionReasonPlaceholder: string;
  savePermission: string;
  removePermission: string;
  sickLeave: string;
  personalLeave: string;
  familyEmergency: string;
  unexcusedAbsent: string;

  // Checklist & Task Completion / Cross Logic
  addSlotOt: string;
  markAllDone: string;
  resetProgress: string;
  doneForToday: string;
  doneForTodayCompleted: string;
  completedOfSlots: string;
  doneForTodayHint: string;
  doneForTodayLoggedOn: string;
  noTasksToday: string;
  noTasksHint: string;
  taskCompletedCheck: string;
  taskCrossedIncomplete: string;
  taskPending: string;
  reasonForCross: string;
  reasonForCrossPlaceholder: string;
  otherRemarks: string;
  otherRemarksPlaceholder: string;
  quickReasonMeeting: string;
  quickReasonSystem: string;
  quickReasonClient: string;
  quickReasonUrgent: string;
  quickReasonSick: string;

  // Add Task Form
  addTimeSlotTitle: string;
  scheduleRegular: string;
  overTimeOt: string;
  scheduleBadge: string;
  overtimeBadge: string;
  timeSlotLabel: string;
  timeSlotPlaceholder: string;
  selectActivityOrCustom: string;
  selectActivityDefault: string;
  customTaskOption: string;
  taskTitlePlaceholder: string;
  notesLabel: string;
  notesPlaceholder: string;
  applyToLabel: string;
  thisDateOnly: string;
  allWorkingDays: string;
  selectedDays: string;
  saveAndAddSlot: string;

  // Quick Preset Durations
  preset30m: string;
  preset1h: string;
  preset1h30m: string;
  preset2h: string;
  preset4h: string;

  // Template Modal
  customizeScheduleTitle: string;
  customizeScheduleDesc: string;
  quickRecurrence: string;
  fiveDaysMonFri: string;
  everyday7Days: string;
  oneWeek: string;
  twoWeeks: string;
  addTemplateSlot: string;
  templateSlotsCount: string;
  scheduleTypeAndDays: string;
  saveSchedule: string;
  resetToDefault: string;

  // Day Time Counter Modal
  timeCounterModalTitle: string;
  workHoursTitle: string;
  totalWorkTime: string;
  regularTime: string;
  completedTime: string;
  totalLoggedHours: string;
  regularHours: string;
  overtimeHours: string;
  completedTasks: string;
  timeSlotBreakdown: string;
  summaryAnalytics: string;
  close: string;

  // Export Modal
  exportModalTitle: string;
  exportModalSubtitle: string;
  dateRangeExportTitle: string;
  dateRangeExportSubtitle: string;
  fromDate: string;
  toDate: string;
  presetDay01To15: string;
  presetDay16ToEnd: string;
  presetFullMonth: string;
  presetThisWeek: string;
  presetToday: string;
  downloadRangeExcel: string;
  downloadRangePdf: string;
  daysSelected: string;
  exportWeeklyFeaturedTitle: string;
  exportWeeklyFeaturedBadge: string;
  exportWeeklyFeaturedDesc: string;
  weekExcelBtn: string;
  weekPdfBtn: string;
  excelWorkbooksTitle: string;
  excelWorkbooksDesc: string;
  dayBtn: string;
  monthlyOverviewBtn: string;
  masterAllLogsBtn: string;
  singleDayPdfTitle: string;
  singleDayPdfDesc: string;
  downloadDayPdfBtn: string;
  liveGoogleSheetsSyncTitle: string;
  liveGoogleSheetsSyncDesc: string;
  syncNowBtn: string;

  // Import Modal
  importTitle: string;
  importSubtitle: string;
  pasteSchedulePlaceholder: string;
  previewSlots: string;
  confirmImport: string;
  importHint: string;

  // Summary Table
  monthlySummaryTitle: string;
  totalWorkingDays: string;
  totalHoursWorked: string;
  overallCompletion: string;
  filterByMonth: string;
  exportTable: string;
  status: string;
  actions: string;
  noReportsFound: string;
  totalSlots: string;
  daysTracked: string;
  activeDays: string;
  notesLogged: string;
  holidaysCount: string;
  searchPlaceholder: string;
  allDates: string;
  todayOnly: string;
  past7Days: string;
  thisMonth: string;
  exportMasterExcel: string;
  tableHeaderDate: string;
  tableHeaderDay: string;
  tableHeaderTime: string;
  tableHeaderTask: string;
  tableHeaderSchedule: string;
  tableHeaderNotes: string;
  noMatchingLogs: string;
  storageFullWarning: string;
  cloudSaveFailedWarning: string;

  // Settings Modal
  settingsTitle: string;
  settingsSubtitle: string;
  languageSetting: string;
  companyBranding: string;
  companyNameLabel: string;
  employeeInfoSection: string;
  employeeNameLabel: string;
  departmentLabel: string;
  supervisorLabel: string;
  supervisorNameLabel: string;
  companyLogoLabel: string;
  weeklyOffDays: string;
  weeklyOffDaysDesc: string;
  googleSheetsSyncEndpoint: string;
  googleSheetsSyncDesc: string;
  dataManagement: string;
  exportJsonBackup: string;
  restoreJsonBackup: string;
  resetAllDataTitle: string;
  resetAllDataDesc: string;
  resetAllDataButton: string;
  saveProfile: string;
  saveSettings: string;
  syncGoogleSheets: string;
  googleSheetsWebAppUrl: string;

  // Preset Activity Names
  presetChatFb: string;
  presetCheckPlatform: string;
  presetVideoIdeas: string;
  presetDesignPoster: string;
  presetEditVideo: string;
  presetPostPage: string;
  presetTakeVideo: string;

  // New Upgrade: Navigation & Views
  dashboardNav: string;
  myScheduleNav: string;
  cameraNav: string;
  dailyReportsNav: string;
  reportHistoryNav: string;
  exportReportsNav: string;
  homeNav: string;
  profileNav: string;

  // New Upgrade: Dashboard
  totalActivitiesToday: string;
  completedActivities: string;
  totalEvidencePhotos: string;
  dailyWorkProgress: string;
  quickCameraAccess: string;
  quickAddActivity: string;
  exportTodayReport: string;
  recentActivities: string;
  todaySummaryTitle: string;

  // New Upgrade: Evidence Camera
  capturePhoto: string;
  uploadGallery: string;
  switchCamera: string;
  rearCameraActive: string;
  frontCameraActive: string;
  photoCaption: string;
  photoCaptionPlaceholder: string;
  retake: string;
  savePhoto: string;
  deletePhoto: string;
  noPhotosYet: string;
  cameraPermissionDenied: string;
  cameraPermissionHint: string;

  // New Upgrade: Daily Work Report Activities
  workCategory: string;
  taskTitle: string;
  detailedDescription: string;
  detailedDescriptionPlaceholder: string;
  startTime: string;
  endTime: string;
  workStatus: string;
  attachedPhotographs: string;
  addPhotos: string;
  statusCompleted: string;
  statusInProgress: string;
  statusPending: string;
  statusDelayed: string;
  addActivityTitle: string;
  editActivityTitle: string;
  filterByCategory: string;
  allCategories: string;
  noActivitiesForDate: string;
  noActivitiesHint: string;
  saveActivity: string;
  deleteActivity: string;
  confirmDeleteActivity: string;

  // New Upgrade: Enhanced PDF Export with Photos
  downloadPdfWithPhotos: string;
  downloadWorkReportPdf: string;
  pdfIncludesPhotosBadge: string;
  employeeSignature: string;
  supervisorSignature: string;
  reportGenerationDate: string;
  activityNumber: string;
  photoCountBadge: string;
  // Work Category & Evidence Camera Workflow
  workCategoryLabel: string;
  skipCategoryOption: string;
  notSelected: string;
  workDescriptionLabel: string;
  workDescriptionPlaceholder: string;
  saveWorkEvidence: string;
  retakePhoto: string;
  savedWorkEvidenceSuccess: string;
  photoRecordGallery: string;
  savedStatus: string;
  unsavedStatus: string;
  dailyWorkActivityReportTitle: string;
  tableColNo: string;
  tableColCategory: string;
  tableColDescription: string;
  tableColPhoto: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    // Navigation & Header
    dailySchedule: 'Daily Schedule',
    summaryTable: 'Summary Table',
    checkCount: 'Check Count',
    checkCountTime: 'Check Count Time',
    importSheet: 'Import Sheet',
    googleLogin: 'Google Login',
    exportReport: 'Export',
    templateSchedule: 'Template',
    settings: 'Settings',
    cloudSync: 'Google Cloud Sync',
    localStorageMode: 'Local Storage Mode',
    language: 'Language',
    switchLanguage: 'Switch to Khmer (ភាសាខ្មែរ)',
    english: 'English',
    khmer: 'ភាសាខ្មែរ',

    // Date & Days
    selectedLogDate: 'Selected Log Date',
    todayBadge: '★ TODAY',
    progress: 'Progress',
    previousDay: 'Previous Day',
    nextDay: 'Next Day',
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunShort: 'Sun',
    monShort: 'Mon',
    tueShort: 'Tue',
    wedShort: 'Wed',
    thuShort: 'Thu',
    friShort: 'Fri',
    satShort: 'Sat',

    // Check-In / Check-Out & Attendance
    presentStatus: 'Present (វត្តមាន)',
    permissionStatus: 'Permission (ច្បាប់)',
    absentNoPermissionStatus: 'Absent - No Permission (អវត្តមានឥតច្បាប់)',
    presentWorkedToday: 'Worked Today (វត្តមាន)',
    permissionOnLeaveToday: 'On Leave with Permission (មានច្បាប់)',
    absentNoPermissionDesc: 'Did not check in and did not request permission (Absent without permission)',
    checkIn: 'វត្តមាន (Check In)',
    checkOut: 'Check Out',
    checkedIn: 'Checked In',
    checkedOut: 'Checked Out',
    activeWorkShift: 'Active Work Shift',
    checkedInAt: 'Checked In at',
    currentShiftDuration: 'Current Shift Duration',
    totalWorkedToday: 'Total Worked Today',
    workSessions: 'Work Sessions',
    sessionsLogged: 'sessions logged',
    noSessionsYet: 'No work sessions recorded for this day yet.',
    optionalSessionNote: 'Optional note / summary for this shift...',
    confirmCheckOut: 'Confirm Check-Out',
    cancel: 'Cancel',
    deleteSession: 'Delete Session',
    duration: 'Duration',
    notCheckedInStatus: 'Not Checked In (Absent)',
    notCheckedInAbsentHint: 'You have not checked in for this date yet. If on leave, you can submit permission.',
    putPermissionBtn: 'Permission (P) / Absent',
    permissionActiveBadge: 'Permission (P) Active',
    permissionTitle: 'Day Permission / Attendance Request',
    permissionSubtitle: 'Record sick leave, personal permission (P), or absence reason for this day',
    permissionTypeLabel: 'Permission Type',
    permissionReasonLabel: 'Reason (e.g. sick can go need to rest and sleep):',
    permissionReasonPlaceholder: 'Write reason for permission / absence...',
    savePermission: 'Save Permission',
    removePermission: 'Remove Permission (Return to Work)',
    sickLeave: 'P - Sick Leave',
    personalLeave: 'P - Personal Leave',
    familyEmergency: 'P - Family Emergency',
    unexcusedAbsent: 'Absent (No Check-In)',

    // Checklist & Task Completion / Cross Logic
    addSlotOt: 'Add Slot (OT)',
    markAllDone: 'Mark All Complete',
    resetProgress: 'Reset',
    doneForToday: 'Done for Today',
    doneForTodayCompleted: '✓ Done for Today',
    completedOfSlots: 'completed',
    doneForTodayHint: 'Click "Done for Today" to finalize and verify your work log',
    doneForTodayLoggedOn: 'Completed and logged on',
    noTasksToday: 'No time-slot tasks created for today.',
    noTasksHint: 'Click "Add Slot (OT)" above to get started.',
    taskCompletedCheck: 'Completed (✓)',
    taskCrossedIncomplete: 'Cross / Incomplete (✗)',
    taskPending: 'Pending',
    reasonForCross: 'Reason for Cross / Delay:',
    reasonForCrossPlaceholder: 'Why is this task crossed / delayed? (e.g. meeting, waiting for client...)',
    otherRemarks: 'Other Remarks:',
    otherRemarksPlaceholder: 'Additional notes or remarks...',
    quickReasonMeeting: 'Internal Meeting',
    quickReasonSystem: 'System / Internet Issue',
    quickReasonClient: 'Awaiting Client Assets',
    quickReasonUrgent: 'Urgent Task Replaced',
    quickReasonSick: 'Sick / Health Issue',

    // Add Task Form
    addTimeSlotTitle: 'Add Time Slot & Task (Regular or Over Time)',
    scheduleRegular: 'Schedule (Regular)',
    overTimeOt: '⏰ Over Time (OT)',
    scheduleBadge: 'Schedule',
    overtimeBadge: 'Over Time',
    timeSlotLabel: 'Time Slot',
    timeSlotPlaceholder: 'e.g. 17:00 - 18:00',
    selectActivityOrCustom: 'Select Activity or Custom Title',
    selectActivityDefault: '-- Select Activity --',
    customTaskOption: '✏️ Custom Task / Activity',
    taskTitlePlaceholder: 'Task title / description...',
    notesLabel: 'Take Note / Remarks of what you did:',
    notesPlaceholder: 'Write note or details of work done (e.g., replied customer chats, exported video...)',
    applyToLabel: 'Apply To:',
    thisDateOnly: 'This Date Only',
    allWorkingDays: 'All Working Days',
    selectedDays: 'Selected Days',
    saveAndAddSlot: 'Save & Add Slot',

    // Quick Preset Durations
    preset30m: '+30m',
    preset1h: '+1h',
    preset1h30m: '+1.5h',
    preset2h: '+2h',
    preset4h: '+4h',

    // Template Modal
    customizeScheduleTitle: 'Customize Schedule & Recurrence',
    customizeScheduleDesc: 'Set templates for 5 days, Everyday (7 days), 1 week, or 2 weeks recurrence.',
    quickRecurrence: 'Quick Template Recurrence:',
    fiveDaysMonFri: '5 Days (Mon - Fri)',
    everyday7Days: 'Everyday (7 Days)',
    oneWeek: '1 Week',
    twoWeeks: '2 Weeks',
    addTemplateSlot: 'Add Template Slot',
    templateSlotsCount: 'Template Slots & Tasks',
    scheduleTypeAndDays: 'Schedule Type & Day Assignment',
    saveSchedule: 'Save Schedule',
    resetToDefault: 'Reset to Default',

    // Day Time Counter Modal
    timeCounterModalTitle: 'Daily Work Hours Counter & Analytics',
    workHoursTitle: 'Daily Work Hours Counter & Analytics',
    totalWorkTime: 'Total Work Time',
    regularTime: 'Regular Time',
    completedTime: 'Completed Time',
    totalLoggedHours: 'Total Logged Hours',
    regularHours: 'Regular Hours',
    overtimeHours: 'Overtime (OT)',
    completedTasks: 'Completed Tasks',
    timeSlotBreakdown: 'Time Slot Breakdown',
    summaryAnalytics: 'Summary & Breakdown',
    close: 'Close',

    // Export Modal
    exportModalTitle: 'Export Daily & Weekly Reports',
    exportModalSubtitle: 'Generate Excel workbooks, multi-day PDF files, or sync with cloud sheets',
    dateRangeExportTitle: 'Custom Date Range (Day to Day)',
    dateRangeExportSubtitle: 'Select any start date and end date (e.g. Day 01 to 15) to download Excel or PDF',
    fromDate: 'From Date',
    toDate: 'To Date',
    presetDay01To15: 'Day 01 - 15',
    presetDay16ToEnd: 'Day 16 - End',
    presetFullMonth: 'Full Month',
    presetThisWeek: 'This Week',
    presetToday: 'Today',
    downloadRangeExcel: 'Download Range Excel',
    downloadRangePdf: 'Download Range PDF',
    daysSelected: 'days selected',
    exportWeeklyFeaturedTitle: '1-Week Report (7 Days 7 Tables)',
    exportWeeklyFeaturedBadge: 'Recommended',
    exportWeeklyFeaturedDesc: '(Mon - Sun) containing 7 distinct daily schedule tables, timestamps, notes, and work session hours',
    weekExcelBtn: '1-Week Excel',
    weekPdfBtn: '1-Week PDF',
    excelWorkbooksTitle: 'Excel Workbooks (.xlsx)',
    excelWorkbooksDesc: 'Professional spreadsheet matching official template with checking (✓/✗) and reasons',
    dayBtn: 'Day Excel',
    monthlyOverviewBtn: 'Monthly Overview',
    masterAllLogsBtn: 'Master (All Logs)',
    singleDayPdfTitle: 'Single Day PDF (.pdf)',
    singleDayPdfDesc: 'Clean formatted printable PDF document for today\'s log',
    downloadDayPdfBtn: 'Download Day PDF',
    liveGoogleSheetsSyncTitle: 'Live Google Sheets Sync',
    liveGoogleSheetsSyncDesc: 'Send structured row directly into your linked company Google Sheet',
    syncNowBtn: 'Sync Now',

    // Import Modal
    importTitle: 'Import Schedule from Spreadsheet',
    importSubtitle: 'Paste time slots and task names copied from Google Sheets, Excel, or CSV.',
    pasteSchedulePlaceholder: 'Paste your schedule data here...\nExample:\n08:00 - 09:00\tReply chat customer on Facebook page\n09:00 - 10:00\tCheck platform',
    previewSlots: 'Preview Slots',
    confirmImport: 'Confirm & Import Slots',
    importHint: 'Slots will be added to today\'s schedule.',

    // Summary Table
    monthlySummaryTitle: 'Monthly Work Report & Summary',
    totalWorkingDays: 'Total Working Days',
    totalHoursWorked: 'Total Hours Worked',
    overallCompletion: 'Overall Completion',
    filterByMonth: 'Filter Month:',
    exportTable: 'Export Table',
    status: 'Status',
    actions: 'Actions',
    noReportsFound: 'No reports found for this month.',
    totalSlots: 'Total Tasks / Slots',
    daysTracked: 'days logged',
    activeDays: 'Active Days',
    notesLogged: 'Notes Logged',
    holidaysCount: 'Off / Holidays',
    searchPlaceholder: 'Search by activity, remarks, time, date...',
    allDates: 'All Dates',
    todayOnly: 'Today Only',
    past7Days: 'Past 7 Days',
    thisMonth: 'This Month',
    exportMasterExcel: 'Master Excel (.xlsx)',
    tableHeaderDate: 'Date',
    tableHeaderDay: 'Day',
    tableHeaderTime: 'Time Slot',
    tableHeaderTask: 'Activity / Task',
    tableHeaderSchedule: 'Schedule / Type',
    tableHeaderNotes: 'Notes / Remarks',
    noMatchingLogs: 'No matching log entries found.',
    storageFullWarning: 'Storage full or save failed, photo/data not saved locally.',
    cloudSaveFailedWarning: 'Cloud sync failed, report could not be saved to cloud.',

    // Settings Modal
    settingsTitle: 'Settings & Profile',
    settingsSubtitle: 'Customize company branding, employee details, off-days, and Google Sheets integration',
    languageSetting: 'Application Language',
    companyBranding: 'Company Branding & Logo',
    companyNameLabel: 'Company / Organization Name',
    employeeInfoSection: 'Employee Information',
    employeeNameLabel: 'Employee Name',
    departmentLabel: 'Department / Position',
    supervisorLabel: 'Supervisor / Approver Name',
    supervisorNameLabel: 'Supervisor / Lead Name',
    companyLogoLabel: 'Company Logo',
    weeklyOffDays: 'Weekly Off-Days / Holidays',
    weeklyOffDaysDesc: 'Days marked here will automatically display a Holiday status banner on the daily checklist.',
    googleSheetsSyncEndpoint: 'Google Sheets Sync Web App URL',
    googleSheetsSyncDesc: 'Deploy Google Apps Script as a Web App to automatically record daily tasks directly into Google Sheets.',
    dataManagement: 'Backup & Data Management',
    exportJsonBackup: 'Export JSON Backup',
    restoreJsonBackup: 'Restore Backup',
    resetAllDataTitle: 'Reset All Data (Fresh Start)',
    resetAllDataDesc: 'Clear all custom tasks, logs, and sessions across all dates back to fresh defaults.',
    resetAllDataButton: 'Reset Everything to Default',
    saveProfile: 'Save Settings',
    saveSettings: 'Save Settings',
    syncGoogleSheets: 'Google Sheets Automatic Synchronization',
    googleSheetsWebAppUrl: 'Google Apps Script Web App URL',

    // Preset Activity Names
    presetChatFb: 'Reply chat customer on Facebook page',
    presetCheckPlatform: 'Check Platform(all)view & Engagement',
    presetVideoIdeas: 'Find ideas for create video',
    presetDesignPoster: 'Design(Video or poster)',
    presetEditVideo: 'Edit video',
    presetPostPage: 'Post on Platform',
    presetTakeVideo: 'Take video',

    // New Upgrade: Navigation & Views
    dashboardNav: 'Dashboard',
    myScheduleNav: 'My Schedule',
    cameraNav: 'Evidence Camera',
    dailyReportsNav: 'Daily Reports',
    reportHistoryNav: 'Report History',
    exportReportsNav: 'Export Reports',
    homeNav: 'Home',
    profileNav: 'Profile',

    // New Upgrade: Dashboard
    totalActivitiesToday: "Today's Activities",
    completedActivities: 'Completed Activities',
    totalEvidencePhotos: 'Evidence Photos',
    dailyWorkProgress: 'Daily Work Progress',
    quickCameraAccess: 'Capture Photo',
    quickAddActivity: 'Add Activity',
    exportTodayReport: "Export Today's Report",
    recentActivities: 'Recent Work Activities',
    todaySummaryTitle: "Today's Work Overview",

    // New Upgrade: Evidence Camera
    capturePhoto: 'Take Photo',
    uploadGallery: 'Upload from Gallery',
    switchCamera: 'Switch Camera',
    rearCameraActive: 'Back Camera Active',
    frontCameraActive: 'Front Camera Active',
    photoCaption: 'Photo Description / Caption',
    photoCaptionPlaceholder: 'Write caption or details of this evidence photo...',
    retake: 'Retake',
    savePhoto: 'Save Photo',
    deletePhoto: 'Delete Photo',
    noPhotosYet: 'No evidence photos taken yet.',
    cameraPermissionDenied: 'Camera Access Needed',
    cameraPermissionHint: 'Please allow camera permission in your browser or upload photos directly from your device gallery.',

    // New Upgrade: Daily Work Report Activities
    workCategory: 'Work Category',
    taskTitle: 'Task / Activity Title',
    detailedDescription: 'Detailed Description',
    detailedDescriptionPlaceholder: 'Describe the tasks, tools used, results, and accomplishments in detail...',
    startTime: 'Start Time',
    endTime: 'End Time',
    workStatus: 'Work Status',
    attachedPhotographs: 'Attached Photographs',
    addPhotos: 'Add Photos',
    statusCompleted: 'Completed',
    statusInProgress: 'In Progress',
    statusPending: 'Pending',
    statusDelayed: 'Delayed',
    addActivityTitle: 'Add New Work Activity',
    editActivityTitle: 'Edit Work Activity',
    filterByCategory: 'Filter by Category',
    allCategories: 'All Categories',
    noActivitiesForDate: 'No activities recorded for this date yet.',
    noActivitiesHint: 'Click "Add Activity" or take a photo with the Camera to log your work.',
    saveActivity: 'Save Activity',
    deleteActivity: 'Delete Activity',
    confirmDeleteActivity: 'Are you sure you want to delete this activity and its photos?',

    // New Upgrade: Enhanced PDF Export with Photos
    downloadPdfWithPhotos: 'Download PDF with Photos',
    downloadWorkReportPdf: 'Download Work Report PDF',
    pdfIncludesPhotosBadge: 'Includes Photos',
    employeeSignature: 'Employee Signature',
    supervisorSignature: 'Supervisor Signature',
    reportGenerationDate: 'Report Generation Date',
    activityNumber: 'Activity',
    photoCountBadge: 'Photos',

    // Work Category & Evidence Camera Workflow
    workCategoryLabel: 'Work Category',
    skipCategoryOption: '-- Skip / Not Selected --',
    notSelected: 'Not Selected',
    workDescriptionLabel: 'Work Description',
    workDescriptionPlaceholder: 'Write detailed information about the work you completed...',
    saveWorkEvidence: 'Save Work Evidence',
    retakePhoto: 'Retake Photo',
    savedWorkEvidenceSuccess: '✓ Work evidence record saved successfully',
    photoRecordGallery: 'Work Evidence Photo Gallery',
    savedStatus: 'Saved',
    unsavedStatus: 'Unsaved',
    dailyWorkActivityReportTitle: 'Daily Work Activity Report',
    tableColNo: 'No.',
    tableColCategory: 'Work Category',
    tableColDescription: 'Work Description',
    tableColPhoto: 'Photograph',
  },

  km: {
    // Navigation & Header
    dailySchedule: 'កាលវិភាគប្រចាំថ្ងៃ',
    summaryTable: 'តារាងសង្ខេប',
    checkCount: 'ពិនិត្យម៉ោង',
    checkCountTime: 'ពិនិត្យម៉ោងធ្វើការ',
    importSheet: 'នាំចូលទិន្នន័យ',
    googleLogin: 'ចូលគណនី Google',
    exportReport: 'ទាញយករបាយការណ៍',
    templateSchedule: 'គំរូកាលវិភាគ',
    settings: 'ការកំណត់',
    cloudSync: 'Google Cloud Sync',
    localStorageMode: 'របៀបរក្សាទុកលើម៉ាស៊ីន',
    language: 'ភាសា',
    switchLanguage: 'Switch to English',
    english: 'English',
    khmer: 'ភាសាខ្មែរ',

    // Date & Days
    selectedLogDate: 'កាលបរិច្ឆេទដែលបានជ្រើសរើស',
    todayBadge: '★ ថ្ងៃនេះ',
    progress: 'វឌ្ឍនភាពការងារ',
    previousDay: 'ថ្ងៃមុន',
    nextDay: 'ថ្ងៃបន្ទាប់',
    sunday: 'អាទិត្យ',
    monday: 'ច័ន្ទ',
    tuesday: 'អង្គារ',
    wednesday: 'ពុធ',
    thursday: 'ព្រហស្បតិ៍',
    friday: 'សុក្រ',
    saturday: 'សៅរ៍',
    sunShort: 'អា',
    monShort: 'ច',
    tueShort: 'អ',
    wedShort: 'ព',
    thuShort: 'ព្រ',
    friShort: 'សុ',
    satShort: 'ស',

    // Check-In / Check-Out & Attendance
    presentStatus: 'វត្តមាន',
    permissionStatus: 'មានច្បាប់ (P)',
    absentNoPermissionStatus: 'អវត្តមានឥតច្បាប់',
    presentWorkedToday: 'បានចូលធ្វើការថ្ងៃនេះ (វត្តមាន)',
    permissionOnLeaveToday: 'បានសុំច្បាប់ឈប់សម្រាក (មានច្បាប់)',
    absentNoPermissionDesc: 'មិនបាន Check-In វត្តមាន និងមិនបានសុំច្បាប់ (អវត្តមានឥតច្បាប់)',
    checkIn: 'វត្តមាន (Check In)',
    checkOut: 'ចុះឈ្មោះចេញ (Check-Out)',
    checkedIn: 'បានចូលធ្វើការ',
    checkedOut: 'បានចេញពីធ្វើការ',
    activeWorkShift: 'កំពុងបំពេញការងារ (Active Shift)',
    checkedInAt: 'បានចូលធ្វើការនៅម៉ោង',
    currentShiftDuration: 'រយៈពេលបំពេញការងារបច្ចុប្បន្ន',
    totalWorkedToday: 'ម៉ោងធ្វើការសរុបថ្ងៃនេះ',
    workSessions: 'ប្រវត្តិវេនការងារ (Work Sessions)',
    sessionsLogged: 'វេនការងារបានកត់ត្រា',
    noSessionsYet: 'មិនទាន់មានការកត់ត្រាម៉ោងចូល/ចេញសម្រាប់ថ្ងៃនេះនៅឡើយទេ។',
    optionalSessionNote: 'កំណត់សម្គាល់បន្ថែម ឬសេចក្តីសង្ខេបវេនការងារនេះ...',
    confirmCheckOut: 'បញ្ជាក់ការចុះឈ្មោះចេញ',
    cancel: 'បោះបង់',
    deleteSession: 'លុបវេនការងារ',
    duration: 'រយៈពេល',
    notCheckedInStatus: 'មិនទាន់បាន Check-in (អវត្តមាន)',
    notCheckedInAbsentHint: 'អ្នកមិនទាន់បានចុះឈ្មោះចូលធ្វើការសម្រាប់ថ្ងៃនេះនៅឡើយទេ។ ប្រសិនបើមានច្បាប់ អ្នកអាចស្នើសុំច្បាប់ (P) បាន។',
    putPermissionBtn: 'ដាក់ច្បាប់ (P) / ឈប់សម្រាក',
    permissionActiveBadge: 'បានដាក់ច្បាប់ (P) រួចរាល់',
    permissionTitle: 'កំណត់ច្បាប់សម្រាក / ហេតុផលអវត្តមាន',
    permissionSubtitle: 'កត់ត្រាការសុំច្បាប់ឈឺ ច្បាប់ផ្ទាល់ខ្លួន (P) ឬហេតុផលអវត្តមានសម្រាប់ថ្ងៃនេះ',
    permissionTypeLabel: 'ប្រភេទច្បាប់ / អវត្តមាន',
    permissionReasonLabel: 'ហេតុផល (ឧ. sick can go need to rest and sleep)៖',
    permissionReasonPlaceholder: 'សរសេរហេតុផលនៃការសុំច្បាប់ ឬអវត្តមាន...',
    savePermission: 'រក្សាទុកច្បាប់សម្រាក',
    removePermission: 'លុបច្បាប់ (ចូលធ្វើការធម្មតាវិញ)',
    sickLeave: 'P - ច្បាប់ឈឺ (Sick Leave)',
    personalLeave: 'P - ច្បាប់ផ្ទាល់ខ្លួន (Personal Leave)',
    familyEmergency: 'P - ធុរៈបន្ទាន់ក្នុងគ្រួសារ',
    unexcusedAbsent: 'អវត្តមានមិនបាន Check-In',

    // Checklist & Task Completion / Cross Logic
    addSlotOt: 'បន្ថែមម៉ោង/OT',
    markAllDone: 'សម្គាល់រួចរាល់ទាំងអស់',
    resetProgress: 'កំណត់ឡើងវិញ',
    doneForToday: 'បញ្ចប់ការងារថ្ងៃនេះ',
    doneForTodayCompleted: '✓ បានបញ្ចប់ការងារថ្ងៃនេះ',
    completedOfSlots: 'បានរួចរាល់',
    doneForTodayHint: 'ចុច «បញ្ចប់ការងារថ្ងៃនេះ» ដើម្បីបញ្ជាក់ និងកត់ត្រារបាយការណ៍ការងាររបស់អ្នក',
    doneForTodayLoggedOn: 'បានបញ្ចប់ និងកត់ត្រានៅ',
    noTasksToday: 'មិនទាន់មានការងារក្នុងចន្លោះពេលសម្រាប់ថ្ងៃនេះនៅឡើយទេ។',
    noTasksHint: 'ចុច «បន្ថែមម៉ោង/OT» ខាងលើដើម្បីចាប់ផ្ដើម។',
    taskCompletedCheck: 'បានសម្រេច (✓)',
    taskCrossedIncomplete: 'មិនទាន់សម្រេច / Cross (✗)',
    taskPending: 'មិនទាន់ធីក',
    reasonForCross: 'ហេតុផលដែលមិនបានធ្វើ ឬ Cross (✗)៖',
    reasonForCrossPlaceholder: 'ហេតុអ្វីបានជាការងារនេះមិនទាន់បានធ្វើ ឬពន្យារពេល? (ឧ. ជាប់ប្រជុំ, រង់ចាំភ្ញៀវ...)',
    otherRemarks: 'កំណត់ចំណាំផ្សេងៗ (Other)៖',
    otherRemarksPlaceholder: 'ព័ត៌មានលម្អិតបន្ថែម ឬកំណត់ចំណាំ...',
    quickReasonMeeting: 'ជាប់ប្រជុំផ្ទៃក្នុង',
    quickReasonSystem: 'បញ្ហាប្រព័ន្ធ / អ៊ីនធឺណិត',
    quickReasonClient: 'រង់ចាំឯកសារពីភ្ញៀវ',
    quickReasonUrgent: 'ប្តូរធ្វើការងារបន្ទាន់ផ្សេង',
    quickReasonSick: 'មិនស្រួលខ្លួន / ឈឺ',

    // Add Task Form
    addTimeSlotTitle: 'បន្ថែមចន្លោះពេល និងភារកិច្ច (ម៉ោងធម្មតា ឬ ថែមម៉ោង)',
    scheduleRegular: 'កាលវិភាគធម្មតា (Regular)',
    overTimeOt: '⏰ ថែមម៉ោង (OT)',
    scheduleBadge: 'កាលវិភាគ',
    overtimeBadge: 'ថែមម៉ោង',
    timeSlotLabel: 'ចន្លោះពេល',
    timeSlotPlaceholder: 'ឧទាហរណ៍ 17:00 - 18:00',
    selectActivityOrCustom: 'ជ្រើសរើសសកម្មភាព ឬបញ្ចូលចំណងជើងផ្ទាល់ខ្លួន',
    selectActivityDefault: '-- ជ្រើសរើសសកម្មភាព --',
    customTaskOption: '✏️ ការងារផ្ទាល់ខ្លួន / ផ្សេងៗ',
    taskTitlePlaceholder: 'ឈ្មោះការងារ / ការពិពណ៌នា...',
    notesLabel: 'កត់ត្រាការងារដែលបានធ្វើរួច៖',
    notesPlaceholder: 'សរសេរកំណត់ចំណាំ ឬព័ត៌មានលម្អិតការងារ (ឧ. ឆ្លើយតបសារភ្ញៀវ, កាត់តវីដេអូរួច...)',
    applyToLabel: 'អនុវត្តចំពោះ៖',
    thisDateOnly: 'តែថ្ងៃនេះប៉ុណ្ណោះ',
    allWorkingDays: 'គ្រប់ថ្ងៃធ្វើការទាំងអស់',
    selectedDays: 'ថ្ងៃដែលបានជ្រើសរើស',
    saveAndAddSlot: 'រក្សាទុក និងបន្ថែមចន្លោះពេល',

    // Quick Preset Durations
    preset30m: '+៣០នាទី',
    preset1h: '+១ម៉ោង',
    preset1h30m: '+១.៥ម៉ោង',
    preset2h: '+២ម៉ោង',
    preset4h: '+៤ម៉ោង',

    // Template Modal
    customizeScheduleTitle: 'កំណត់គំរូកាលវិភាគ និងភាពដដែលៗ',
    customizeScheduleDesc: 'កំណត់គំរូសម្រាប់ ៥ថ្ងៃ (ច័ន្ទ-សុក្រ), រៀងរាល់ថ្ងៃ (៧ថ្ងៃ), ១សប្តាហ៍ ឬ ២សប្តាហ៍។',
    quickRecurrence: 'កំណត់គំរូឆាប់រហ័ស៖',
    fiveDaysMonFri: '៥ ថ្ងៃ (ច័ន្ទ - សុក្រ)',
    everyday7Days: 'រៀងរាល់ថ្ងៃ (៧ ថ្ងៃ)',
    oneWeek: '១ សប្តាហ៍',
    twoWeeks: '២ សប្តាហ៍',
    addTemplateSlot: 'បន្ថែមចន្លោះពេលគំរូ',
    templateSlotsCount: 'ចន្លោះពេល និងការងារគំរូ',
    scheduleTypeAndDays: 'ប្រភេទកាលវិភាគ និងការកំណត់ថ្ងៃ',
    saveSchedule: 'រក្សាទុកកាលវិភាគ',
    resetToDefault: 'កំណត់ឡើងវិញដូចដើម',

    // Day Time Counter Modal
    timeCounterModalTitle: 'ផ្ទាំងគណនាម៉ោងធ្វើការ និងស្ថិតិប្រចាំថ្ងៃ',
    workHoursTitle: 'ផ្ទាំងគណនាម៉ោងធ្វើការ និងស្ថិតិប្រចាំថ្ងៃ',
    totalWorkTime: 'ម៉ោងធ្វើការសរុប',
    regularTime: 'ម៉ោងធម្មតា',
    completedTime: 'ម៉ោងបានបញ្ចប់',
    totalLoggedHours: 'ម៉ោងធ្វើការសរុប',
    regularHours: 'ម៉ោងធម្មតា',
    overtimeHours: 'ថែមម៉ោង (OT)',
    completedTasks: 'ការងារបានសម្រេច',
    timeSlotBreakdown: 'ការវិភាគតាមចន្លោះពេល',
    summaryAnalytics: 'សង្ខេប និងការវិភាគ',
    close: 'បិទ',

    // Export Modal
    exportModalTitle: 'ទាញយករបាយការណ៍ប្រចាំថ្ងៃ និងសប្តាហ៍',
    exportModalSubtitle: 'ទាញយកជាឯកសារ Excel, PDF ឬ ធ្វើសមកាលកម្មជាមួយ Google Sheets',
    dateRangeExportTitle: 'ទាញយកតាមចន្លោះថ្ងៃ (ពីថ្ងៃទី ទៅ ថ្ងៃទី)',
    dateRangeExportSubtitle: 'ជ្រើសរើសថ្ងៃចាប់ផ្ដើម និងថ្ងៃបញ្ចប់ (ឧទាហរណ៍ ០១ ដល់ ១៥) ដើម្បីទាញយក Excel ឬ PDF',
    fromDate: 'ពីថ្ងៃទី',
    toDate: 'ដល់ថ្ងៃទី',
    presetDay01To15: 'ថ្ងៃទី ០១ - ១៥',
    presetDay16ToEnd: 'ថ្ងៃទី ១៦ - ចុងខែ',
    presetFullMonth: 'ពេញមួយខែ',
    presetThisWeek: 'សប្តាហ៍នេះ',
    presetToday: 'ថ្ងៃនេះ',
    downloadRangeExcel: 'ទាញយក Excel តាមចន្លោះថ្ងៃ',
    downloadRangePdf: 'ទាញយក PDF តាមចន្លោះថ្ងៃ',
    daysSelected: 'ថ្ងៃត្រូវបានជ្រើសរើស',
    exportWeeklyFeaturedTitle: 'របាយការណ៍ ១សប្តាហ៍ (៧ថ្ងៃ ៧តារាងដាច់ដោយឡែក)',
    exportWeeklyFeaturedBadge: 'ណែនាំ',
    exportWeeklyFeaturedDesc: '(ច័ន្ទ - អាទិត្យ) មានតារាង ៧ថ្ងៃដាច់ដោយឡែក រួមទាំងម៉ោង និងកំណត់ចំណាំលម្អិត',
    weekExcelBtn: 'Excel ១សប្តាហ៍',
    weekPdfBtn: 'PDF ១សប្តាហ៍',
    excelWorkbooksTitle: 'សៀវភៅការងារ Excel (.xlsx)',
    excelWorkbooksDesc: 'ឯកសារ Excel តាមទម្រង់ស្តង់ដារ មាន checking (✓/✗) និងហេតុផល Reason',
    dayBtn: 'Excel ថ្ងៃនេះ',
    monthlyOverviewBtn: 'សង្ខេបប្រចាំខែ',
    masterAllLogsBtn: 'ប្រវត្តិទាំងអស់',
    singleDayPdfTitle: 'ឯកសារ PDF ប្រចាំថ្ងៃ (.pdf)',
    singleDayPdfDesc: 'ឯកសារ PDF សម្រាប់បោះពុម្ព ឬរក្សាទុករបាយការណ៍ថ្ងៃនេះ',
    downloadDayPdfBtn: 'ទាញយក PDF ថ្ងៃនេះ',
    liveGoogleSheetsSyncTitle: 'ធ្វើសមកាលកម្ម Google Sheets ផ្ទាល់',
    liveGoogleSheetsSyncDesc: 'ផ្ញើទិន្នន័យដោយផ្ទាល់ទៅកាន់ Google Sheets របស់ក្រុមហ៊ុនអ្នក',
    syncNowBtn: 'Sync ឥឡូវនេះ',

    // Import Modal
    importTitle: 'នាំចូលកាលវិភាគពី Spreadsheet',
    importSubtitle: 'បិទភ្ជាប់ (Paste) ទិន្នន័យចន្លោះពេល និងឈ្មោះការងារពី Google Sheets, Excel ឬ CSV។',
    pasteSchedulePlaceholder: 'បិទភ្ជាប់ទិន្នន័យកាលវិភាគនៅទីនេះ...\nឧទាហរណ៍៖\n08:00 - 09:00\tReply chat customer on Facebook page\n09:00 - 10:00\tCheck platform',
    previewSlots: 'មើលទិន្នន័យជាមុន',
    confirmImport: 'បញ្ជាក់ និងនាំចូលចន្លោះពេល',
    importHint: 'ចន្លោះពេលនឹងត្រូវបានបន្ថែមទៅកាលវិភាគថ្ងៃនេះ។',

    // Summary Table
    monthlySummaryTitle: 'របាយការណ៍ និងតារាងសង្ខេបការងារប្រចាំខែ',
    totalWorkingDays: 'ថ្ងៃធ្វើការសរុប',
    totalHoursWorked: 'ម៉ោងធ្វើការសរុប',
    overallCompletion: 'អត្រាសម្រេចសរុប',
    filterByMonth: 'ជ្រើសរើសខែ៖',
    exportTable: 'ទាញយកតារាង',
    status: 'ស្ថានភាព',
    actions: 'សកម្មភាព',
    noReportsFound: 'មិនមានរបាយការណ៍សម្រាប់ខែនេះទេ។',
    totalSlots: 'ចំនួនការងារ/ចន្លោះម៉ោងសរុប',
    daysTracked: 'ថ្ងៃបានកត់ត្រា',
    activeDays: 'ថ្ងៃធ្វើការសរុប',
    notesLogged: 'កំណត់សម្គាល់កត់ត្រា',
    holidaysCount: 'ថ្ងៃឈប់សម្រាក',
    searchPlaceholder: 'ស្វែងរកតាមឈ្មោះការងារ, កំណត់ចំណាំ, ម៉ោង, ថ្ងៃ...',
    allDates: 'កាលបរិច្ឆេទទាំងអស់',
    todayOnly: 'តែថ្ងៃនេះប៉ុណ្ណោះ',
    past7Days: '៧ថ្ងៃចុងក្រោយ',
    thisMonth: 'ខែនេះ',
    exportMasterExcel: 'Master Excel (.xlsx)',
    tableHeaderDate: 'កាលបរិច្ឆេទ',
    tableHeaderDay: 'ថ្ងៃ',
    tableHeaderTime: 'ចន្លោះពេល',
    tableHeaderTask: 'សកម្មភាព / ភារកិច្ច',
    tableHeaderSchedule: 'កាលវិភាគ / ប្រភេទ',
    tableHeaderNotes: 'កំណត់ចំណាំការងារ',
    noMatchingLogs: 'មិនមានទិន្នន័យត្រូវគ្នានឹងការស្វែងរកទេ។',
    storageFullWarning: 'អង្គផ្ទុកទិន្នន័យเต็ม ឬការរក្សាទុកបរាជ័យ ទិន្នន័យមិនអាចរក្សាទុកក្នុងម៉ាស៊ីនបានទេ។',
    cloudSaveFailedWarning: 'ការបញ្ជូនទិន្នន័យទៅពពក (Cloud) មិនបានសម្រេចទេ។',

    // Settings Modal
    settingsTitle: 'ការកំណត់ និងព័ត៌មានបុគ្គលិក',
    settingsSubtitle: 'កំណត់ឈ្មោះក្រុមហ៊ុន, ព័ត៌មានបុគ្គលិក, ថ្ងៃឈប់សម្រាក និង Google Sheets',
    languageSetting: 'ភាសាកម្មវិធី',
    companyBranding: 'ព័ត៌មានក្រុមហ៊ុន និងរូបសញ្ញា (Logo)',
    companyNameLabel: 'ឈ្មោះក្រុមហ៊ុន / ស្ថាប័ន',
    employeeInfoSection: 'ព័ត៌មានបុគ្គលិក',
    employeeNameLabel: 'ឈ្មោះបុគ្គលិក',
    departmentLabel: 'ផ្នែក / តួនាទី',
    supervisorLabel: 'ឈ្មោះប្រធានគ្រប់គ្រង',
    supervisorNameLabel: 'ឈ្មោះប្រធានគ្រប់គ្រង / Lead',
    companyLogoLabel: 'រូបសញ្ញាក្រុមហ៊ុន (Logo)',
    weeklyOffDays: 'ថ្ងៃឈប់សម្រាកប្រចាំសប្តាហ៍',
    weeklyOffDaysDesc: 'ថ្ងៃដែលបានជ្រើសរើសនឹងបង្ហាញជាថ្ងៃឈប់សម្រាកដោយស្វ័យប្រវត្តិ។',
    googleSheetsSyncEndpoint: 'តំណភ្ជាប់ Google Sheets Web App',
    googleSheetsSyncDesc: 'ប្រើប្រាស់ Google Apps Script ដើម្បីបញ្ជូនទិន្នន័យទៅកាន់ Google Sheets ដោយស្វ័យប្រវត្តិ។',
    dataManagement: 'ការគ្រប់គ្រង និងបម្រុងទុកទិន្នន័យ',
    exportJsonBackup: 'ទាញយកឯកសារបម្រុងទុក (JSON)',
    restoreJsonBackup: 'ស្ដារទិន្នន័យឡើងវិញ',
    resetAllDataTitle: 'សម្អាត និងកំណត់ទិន្នន័យឡើងវិញទាំងអស់',
    resetAllDataDesc: 'លុបទិន្នន័យ និងកំណត់ត្រាការងារទាំងអស់ ដើម្បីចាប់ផ្ដើមជាថ្មីឡើងវិញ។',
    resetAllDataButton: 'កំណត់ឡើងវិញដូចដើមទាំងអស់',
    saveProfile: 'រក្សាទុកការកំណត់',
    saveSettings: 'រក្សាទុកការកំណត់',
    syncGoogleSheets: 'ធ្វើសមកាលកម្មស្វ័យប្រវត្តិជាមួយ Google Sheets',
    googleSheetsWebAppUrl: 'Google Apps Script Web App URL',

    // Preset Activity Names
    presetChatFb: 'ឆ្លើយតបសារអតិថិជនលើផេក Facebook',
    presetCheckPlatform: 'Check Platform(all)view & Engagement',
    presetVideoIdeas: 'ស្វែងរកគំនិតបង្កើតវីដេអូ',
    presetDesignPoster: 'Design(Video or poster)',
    presetEditVideo: 'កាត់តវីដេអូ',
    presetPostPage: 'Post on Platform',
    presetTakeVideo: 'ថតវីដេអូ',

    // New Upgrade: Navigation & Views
    dashboardNav: 'ផ្ទាំងគ្រប់គ្រង',
    myScheduleNav: 'កាលវិភាគការងារ',
    cameraNav: 'ម៉ាស៊ីនថតភស្តុតាង',
    dailyReportsNav: 'របាយការណ៍ប្រចាំថ្ងៃ',
    reportHistoryNav: 'ប្រវត្តិរបាយការណ៍',
    exportReportsNav: 'ទាញយករបាយការណ៍',
    homeNav: 'ទំព័រដើម',
    profileNav: 'ព័ត៌មានបុគ្គលិក',

    // New Upgrade: Dashboard
    totalActivitiesToday: 'សកម្មភាពការងារថ្ងៃនេះ',
    completedActivities: 'ការងារបានសម្រេច',
    totalEvidencePhotos: 'រូបភាពភស្តុតាង',
    dailyWorkProgress: 'វឌ្ឍនភាពការងារថ្ងៃនេះ',
    quickCameraAccess: 'ថតរូបភស្តុតាង',
    quickAddActivity: 'បន្ថែមសកម្មភាព',
    exportTodayReport: 'ទាញយករបាយការណ៍ថ្ងៃនេះ',
    recentActivities: 'សកម្មភាពការងារថ្មីៗ',
    todaySummaryTitle: 'ទិដ្ឋភាពរួមនៃការងារថ្ងៃនេះ',

    // New Upgrade: Evidence Camera
    capturePhoto: 'ថតរូបភាព',
    uploadGallery: 'ជ្រើសរើសពីរូបភាពក្នុងទូរស័ព្ទ',
    switchCamera: 'ប្តូរកាមេរ៉ា (មុខ/ក្រោយ)',
    rearCameraActive: 'កាមេរ៉ាក្រោយ (Rear Camera)',
    frontCameraActive: 'កាមេរ៉ាមុខ (Front Camera)',
    photoCaption: 'កំណត់សម្គាល់រូបភាព / Caption',
    photoCaptionPlaceholder: 'សរសេរការពិពណ៌នាអំពីរូបភាពភស្តុតាងនេះ...',
    retake: 'ថតឡើងវិញ',
    savePhoto: 'រក្សាទុករូបភាព',
    deletePhoto: 'លុបរូបភាព',
    noPhotosYet: 'មិនទាន់មានរូបភាពភស្តុតាងនៅឡើយទេ។',
    cameraPermissionDenied: 'ត្រូវការការអនុញ្ញាតកាមេរ៉ា',
    cameraPermissionHint: 'សូមអនុញ្ញាតបើកកាមេរ៉ាក្នុង Browser ឬជ្រើសរើសរូបភាពដោយផ្ទាល់ពី Gallery។',

    // New Upgrade: Daily Work Report Activities
    workCategory: 'ផ្នែក / ប្រភេទការងារ',
    taskTitle: 'ចំណងជើងការងារ / ភារកិច្ច',
    detailedDescription: 'ការពិពណ៌នាលម្អិតពីការងារ',
    detailedDescriptionPlaceholder: 'រៀបរាប់ពីអ្វីដែលបានបំពេញរួចរាល់ ឧបករណ៍ប្រើប្រាស់ និងលទ្ធផលការងារ...',
    startTime: 'ម៉ោងចាប់ផ្ដើម',
    endTime: 'ម៉ោងបញ្ចប់',
    workStatus: 'ស្ថានភាពការងារ',
    attachedPhotographs: 'រូបភាពភស្តុតាងភ្ជាប់ជាមួយ',
    addPhotos: 'បន្ថែមរូបភាព',
    statusCompleted: 'បានសម្រេច (Completed)',
    statusInProgress: 'កំពុងដំណើរការ (In Progress)',
    statusPending: 'មិនទាន់ចាប់ផ្ដើម (Pending)',
    statusDelayed: 'ពន្យារពេល (Delayed)',
    addActivityTitle: 'បន្ថែមសកម្មភាពការងារថ្មី',
    editActivityTitle: 'កែសម្រួលសកម្មភាពការងារ',
    filterByCategory: 'ចម្រាញ់តាមប្រភេទការងារ',
    allCategories: 'គ្រប់ប្រភេទទាំងអស់',
    noActivitiesForDate: 'មិនទាន់មានសកម្មភាពការងារកត់ត្រាសម្រាប់ថ្ងៃនេះនៅឡើយទេ។',
    noActivitiesHint: 'ចុច «បន្ថែមសកម្មភាព» ឬថតរូបភាពជាមួយ Camera ដើម្បីកត់ត្រាការងាររបស់អ្នក។',
    saveActivity: 'រក្សាទុកសកម្មភាព',
    deleteActivity: 'លុបសកម្មភាព',
    confirmDeleteActivity: 'តើអ្នកប្រាកដជាចង់លុបសកម្មភាពការងារនេះ និងរូបភាពភស្តុតាងរបស់វាឬ?',

    // New Upgrade: Enhanced PDF Export with Photos
    downloadPdfWithPhotos: 'ទាញយក PDF រួមជាមួយរូបភាពភស្តុតាង',
    downloadWorkReportPdf: 'ទាញយក PDF របាយការណ៍ការងារ',
    pdfIncludesPhotosBadge: 'មានរូបភាពភស្តុតាង',
    employeeSignature: 'ហត្ថលេខាបុគ្គលិក',
    supervisorSignature: 'ហត្ថលេខាប្រធានគ្រប់គ្រង',
    reportGenerationDate: 'កាលបរិច្ឆេទបង្កើតរបាយការណ៍',
    activityNumber: 'សកម្មភាពទី',
    photoCountBadge: 'រូបភាព',

    // Work Category & Evidence Camera Workflow
    workCategoryLabel: 'ផ្នែកការងារ (Work Category)',
    skipCategoryOption: '-- មិនបានជ្រើសរើស (Skip / Not Selected) --',
    notSelected: 'មិនបានជ្រើសរើស',
    workDescriptionLabel: 'ពិពណ៌នាការងារ (Work Description)',
    workDescriptionPlaceholder: 'សរសេរព័ត៌មានលម្អិតអំពីការងារដែលអ្នកបានធ្វើ...',
    saveWorkEvidence: 'រក្សាទុកភស្តុតាងការងារ',
    retakePhoto: 'ថតឡើងវិញ',
    savedWorkEvidenceSuccess: '✓ រក្សាទុកភស្តុតាងការងារបានជោគជ័យ',
    photoRecordGallery: 'វិចិត្រសាលរូបភាពការងារ',
    savedStatus: 'បានរក្សាទុក',
    unsavedStatus: 'មិនទាន់រក្សាទុក',
    dailyWorkActivityReportTitle: 'របាយការណ៍សកម្មភាពការងារប្រចាំថ្ងៃ (Daily Work Activity Report)',
    tableColNo: 'ល.រ',
    tableColCategory: 'ផ្នែកការងារ',
    tableColDescription: 'ពិពណ៌នាការងារ',
    tableColPhoto: 'រូបភាព',
  },
};

export const KHMER_MONTHS = [
  'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
  'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
];

export const KHMER_DAYS = [
  'អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'
];

export const KHMER_DAYS_SHORT = ['អា', 'ច', 'អ', 'ព', 'ព្រ', 'សុ', 'ស'];

export function formatKhmerDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const dateObj = new Date(parseInt(year, 10), monthIdx, day);
  const dayName = KHMER_DAYS[dateObj.getDay()] || '';
  const monthName = KHMER_MONTHS[monthIdx] || '';
  return `ថ្ងៃ${dayName} ទី${day} ខែ${monthName} ឆ្នាំ${year}`;
}
