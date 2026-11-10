import React, { useState, useEffect, useMemo } from 'react';
import {
  AppState,
  DayReport,
  DefaultTimeSlotTemplate,
  UserProfile,
  AuthUser,
  TaskScope,
  ScheduleTask,
  WorkSession,
  TaskStatus,
  MainNavView,
  WorkActivity,
  WorkActivityPhoto
} from './types';
import {
  loadAppState,
  saveAppState,
  resetAppState,
  getFreshInitialState,
  createNewDayReport,
  INITIAL_DEFAULT_SCHEDULE,
  INITIAL_USER_PROFILE
} from './utils/storage';
import {
  formatDateKey,
  formatFullDateHeader,
  getCurrentTimeString,
  getFormattedTimeString,
  calculateSessionMinutes
} from './utils/dateUtils';
import {
  subscribeToAuth,
  loginWithGoogle,
  loginAnonymously,
  logout
} from './lib/firebase';
import {
  saveUserProfileToFirestore,
  saveTemplatesToFirestore,
  saveDayReportToFirestore,
  subscribeToUserProfile,
  subscribeToTemplates,
  subscribeToReports,
  seedInitialFirestoreData,
  resetAllFirestoreUserData
} from './utils/firestoreService';
import { drainUploadQueue } from './utils/imageUploadService';
import { TRANSLATIONS } from './utils/translations';

import { DesktopSidebar } from './components/navigation/DesktopSidebar';
import { MobileBottomNav } from './components/navigation/MobileBottomNav';
import { Dashboard } from './components/dashboard/Dashboard';
import { WorkCamera } from './components/camera/WorkCamera';
import { DailyReportPage } from './components/reports/DailyReportPage';
import { ReportHistory } from './components/reports/ReportHistory';
import { ActivityForm } from './components/reports/ActivityForm';

import { Header } from './components/Header';
import { DateNavigator } from './components/DateNavigator';
import { Checklist } from './components/Checklist';
import { MondayHolidayCard } from './components/MondayHolidayCard';
import { SummaryTable } from './components/SummaryTable';
import { TemplateEditorModal } from './components/TemplateEditorModal';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { InstallPromptModal } from './components/InstallPromptModal';
import { ImportSheetModal } from './components/ImportSheetModal';
import { PermissionModal } from './components/PermissionModal';
import { usePWAInstall } from './hooks/usePWAInstall';
import { updatePwaManifestAndIcons } from './utils/pwaIconUpdater';
import confetti from 'canvas-confetti';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateKey(new Date()));
  const [currentNavView, setCurrentNavView] = useState<MainNavView>('dashboard');
  const [currentView, setCurrentView] = useState<'checklist' | 'summary'>('checklist');

  const currentLanguage = appState.userProfile?.language || 'en';
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  const [saveWarning, setSaveWarning] = useState<string | null>(null);

  // PWA Install Hook
  const {
    canInstall,
    deferredPromptAvailable,
    isInstalled,
    isIOS,
    isInstallModalOpen,
    openInstallModal,
    closeInstallModal,
    triggerInstall,
  } = usePWAInstall();

  // Firebase Auth state
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal open states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);

  // Subscribe to Firebase Auth changes & maintain cloud sync
  useEffect(() => {
    const unsubscribeAuth = subscribeToAuth(async (user) => {
      if (user) {
        const authData: AuthUser = {
          uid: user.uid,
          displayName: user.displayName || (user.isAnonymous ? 'Firebase Cloud' : 'User'),
          email: user.email || (user.isAnonymous ? 'cloud-connected' : 'firebase@user'),
          photoURL: user.photoURL,
        };
        setAuthUser(authData);

        // Seed initial data if first time user on Cloud
        await seedInitialFirestoreData(user.uid, appState);
      } else {
        // Automatically establish Firebase session so user is always on Firebase
        loginAnonymously().catch(() => {});
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Realtime Firestore listeners when logged in
  useEffect(() => {
    if (!authUser) return;

    setIsSyncing(true);

    const unsubProfile = subscribeToUserProfile(authUser.uid, (cloudProfile) => {
      if (cloudProfile) {
        setAppState((prev) => ({ ...prev, userProfile: cloudProfile }));
        if (cloudProfile.companyLogoUrl) {
          updatePwaManifestAndIcons(cloudProfile.companyLogoUrl, cloudProfile.companyName);
        }
      }
    });

    const unsubTemplates = subscribeToTemplates(authUser.uid, (cloudTemplates) => {
      if (cloudTemplates && cloudTemplates.length > 0) {
        setAppState((prev) => ({ ...prev, defaultSchedule: cloudTemplates }));
      }
    });

    const unsubReports = subscribeToReports(authUser.uid, (cloudReports) => {
      if (cloudReports && Object.keys(cloudReports).length > 0) {
        setAppState((prev) => ({
          ...prev,
          reports: { ...prev.reports, ...cloudReports },
        }));
      }
      setIsSyncing(false);
    });

    return () => {
      unsubProfile();
      unsubTemplates();
      unsubReports();
    };
  }, [authUser?.uid]);

  // Save to LocalStorage whenever appState changes
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // Set Company name / Logo in PWA manifest & document title on boot
  useEffect(() => {
    if (appState.userProfile?.companyName) {
      document.title = `${appState.userProfile.companyName} - Daily Work Report`;
    }
  }, [appState.userProfile?.companyName]);

  // Get or initialize DayReport for selectedDate
  const currentReport = useMemo(() => {
    if (appState.reports[selectedDate]) {
      return appState.reports[selectedDate];
    }
    return createNewDayReport(selectedDate, appState.defaultSchedule, appState.userProfile);
  }, [appState.reports, selectedDate, appState.defaultSchedule, appState.userProfile]);

  const dateHeaderInfo = useMemo(() => {
    return formatFullDateHeader(selectedDate);
  }, [selectedDate]);

  // Helpers to update day report
  const updateCurrentReport = async (updater: (prevReport: DayReport) => DayReport): Promise<boolean> => {
    const updated = updater(currentReport);
    const nextAppState = {
      ...appState,
      reports: {
        ...appState.reports,
        [selectedDate]: updated,
      },
    };
    const localSuccess = saveAppState(nextAppState);
    if (!localSuccess) {
      setSaveWarning(t.storageFullWarning);
      return false;
    } else {
      setSaveWarning(null);
    }

    setAppState(nextAppState);

    if (authUser) {
      const cloudSuccess = await saveDayReportToFirestore(authUser.uid, updated);
      if (!cloudSuccess) {
        setSaveWarning(t.cloudSaveFailedWarning);
        return false;
      }
    }
    return true;
  };

  // ==========================================
  // Attendance: Check-In (វត្តមាន) & Permission Handlers
  // ==========================================
  const handleCheckIn = (customTime?: string) => {
    const nowTimeStr = customTime || getCurrentTimeString();
    const nowTimestamp = Date.now();

    updateCurrentReport((rep) => {
      const willBeCheckedIn = !rep.isCheckedIn;
      return {
        ...rep,
        isCheckedIn: willBeCheckedIn,
        currentCheckInTime: willBeCheckedIn ? nowTimeStr : undefined,
        currentCheckInTimestamp: willBeCheckedIn ? nowTimestamp : undefined,
        isPermission: false,
        permissionType: undefined,
        permissionReason: undefined,
        isAbsent: false,
        absentReason: undefined,
      };
    });
  };

  const handleCheckOut = (customTime?: string, notes?: string) => {
    const nowTimeStr = customTime || getCurrentTimeString();
    const inTime = currentReport.currentCheckInTime || '08:00';
    const durationMins = calculateSessionMinutes(inTime, nowTimeStr);

    const newSession: WorkSession = {
      id: `session_${Date.now()}`,
      checkInTime: inTime,
      checkInTimestamp: currentReport.currentCheckInTimestamp || Date.now(),
      checkOutTime: nowTimeStr,
      checkOutTimestamp: Date.now(),
      durationMinutes: durationMins,
      notes: notes || undefined,
    };

    const existingSessions = currentReport.workSessions || [];
    const updatedSessions = [...existingSessions, newSession];
    const totalMinutes = updatedSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    updateCurrentReport((rep) => ({
      ...rep,
      isCheckedIn: false,
      currentCheckInTime: undefined,
      currentCheckInTimestamp: undefined,
      workSessions: updatedSessions,
      totalWorkedMinutes: totalMinutes,
    }));
  };

  const handleDeleteWorkSession = (sessionId: string) => {
    const existingSessions = currentReport.workSessions || [];
    const filtered = existingSessions.filter((s) => s.id !== sessionId);
    const totalMinutes = filtered.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    updateCurrentReport((rep) => ({
      ...rep,
      workSessions: filtered,
      totalWorkedMinutes: totalMinutes,
    }));
  };

  // ==========================================
  // Permission (P) / Absent Handlers
  // ==========================================
  const handleSavePermission = (permData: {
    isPermission: boolean;
    permissionType: string;
    permissionReason: string;
    isAbsent?: boolean;
    absentReason?: string;
  }) => {
    updateCurrentReport((rep) => ({
      ...rep,
      isCheckedIn: false,
      isPermission: permData.isPermission,
      permissionType: permData.permissionType,
      permissionReason: permData.permissionReason,
      isAbsent: permData.isAbsent ?? false,
      absentReason: permData.absentReason ?? permData.permissionReason,
    }));
  };

  const handleRemovePermission = () => {
    updateCurrentReport((rep) => ({
      ...rep,
      isPermission: false,
      permissionType: undefined,
      permissionReason: undefined,
      isAbsent: false,
      absentReason: undefined,
    }));
  };

  // ==========================================
  // Tasks actions & Check (✓) / Cross (✗)
  // ==========================================
  const handleToggleTask = (taskId: string) => {
    const time = getCurrentTimeString();
    updateCurrentReport((rep) => ({
      ...rep,
      tasks: rep.tasks.map((t) => {
        if (t.id === taskId) {
          const nextCompleted = !t.isCompleted;
          return {
            ...t,
            isCompleted: nextCompleted,
            status: nextCompleted ? 'completed' : 'pending',
            completedAt: nextCompleted ? (t.completedAt || time) : undefined,
          };
        }
        return t;
      }),
    }));
  };

  const handleSetTaskStatus = (taskId: string, status: TaskStatus) => {
    const time = getCurrentTimeString();
    updateCurrentReport((rep) => ({
      ...rep,
      tasks: rep.tasks.map((t) => {
        if (t.id === taskId) {
          const isDone = status === 'completed';
          return {
            ...t,
            status,
            isCompleted: isDone,
            completedAt: isDone ? (t.completedAt || time) : undefined,
          };
        }
        return t;
      }),
    }));
  };

  const handleUpdateCrossReason = (taskId: string, crossReason: string) => {
    updateCurrentReport((rep) => ({
      ...rep,
      tasks: rep.tasks.map((t) => (t.id === taskId ? { ...t, crossReason, status: crossReason ? 'crossed' : t.status } : t)),
    }));
  };

  const handleUpdateOther = (taskId: string, other: string) => {
    updateCurrentReport((rep) => ({
      ...rep,
      tasks: rep.tasks.map((t) => (t.id === taskId ? { ...t, other, notes: other } : t)),
    }));
  };

  const handleUpdateNotes = (taskId: string, notes: string) => {
    updateCurrentReport((rep) => ({
      ...rep,
      tasks: rep.tasks.map((t) => (t.id === taskId ? { ...t, notes, other: notes } : t)),
    }));
  };

  const handleUpdateTaskName = (taskId: string, taskName: string) => {
    updateCurrentReport((rep) => ({
      ...rep,
      tasks: rep.tasks.map((t) => (t.id === taskId ? { ...t, taskName } : t)),
    }));
  };

  const handleUpdateScheduleType = (taskId: string, scheduleType: 'Schedule' | 'Over Time') => {
    updateCurrentReport((rep) => ({
      ...rep,
      tasks: rep.tasks.map((t) => (t.id === taskId ? { ...t, scheduleType } : t)),
    }));
  };

  const handleAddTask = (
    timeSlot: string, 
    taskName: string, 
    scheduleType: 'Schedule' | 'Over Time' = 'Schedule',
    scope: TaskScope = 'today',
    daysOfWeek?: number[]
  ) => {
    const newTask: ScheduleTask = {
      id: `task_${Date.now()}`,
      timeSlot,
      taskName,
      scheduleType,
      isCompleted: false,
      status: 'pending',
    };

    updateCurrentReport((rep) => ({
      ...rep,
      tasks: [...rep.tasks, newTask],
    }));

    if (scope !== 'today') {
      const isOt = scheduleType === 'Over Time';
      const newTemplate: DefaultTimeSlotTemplate = {
        id: `slot_${Date.now()}`,
        timeSlot,
        taskName,
        scheduleType,
        isOvertime: isOt,
        applicableScope: scope,
        daysOfWeek: daysOfWeek,
      };

      const updatedSchedule = [...appState.defaultSchedule, newTemplate];
      setAppState((prev) => ({
        ...prev,
        defaultSchedule: updatedSchedule,
      }));

      if (authUser) {
        saveTemplatesToFirestore(authUser.uid, updatedSchedule);
      }
    }
  };

  const handleDeleteTask = (taskId: string) => {
    updateCurrentReport((rep) => ({
      ...rep,
      tasks: rep.tasks.filter((t) => t.id !== taskId),
    }));
  };

  const handleToggleDoneForToday = () => {
    const time = getCurrentTimeString();
    updateCurrentReport((rep) => {
      const nextDone = !rep.isDoneForToday;
      if (nextDone) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {
          // ignore if canvas not supported
        }
      }
      return {
        ...rep,
        isDoneForToday: nextDone,
        doneAt: nextDone ? (rep.doneAt || time) : undefined,
        tasks: nextDone
          ? rep.tasks.map((t) => ({
              ...t,
              isCompleted: true,
              status: 'completed',
              completedAt: t.completedAt || time,
            }))
          : rep.tasks,
      };
    });
  };

  const handleOverrideHoliday = () => {
    const templateTasks: ScheduleTask[] = appState.defaultSchedule.map((item) => ({
      id: `task_${Date.now()}_${item.id}`,
      timeSlot: item.timeSlot,
      taskName: item.taskName,
      scheduleType: item.scheduleType,
      isCompleted: false,
      status: 'pending',
    }));

    updateCurrentReport((rep) => ({
      ...rep,
      isHoliday: false,
      holidayReason: undefined,
      tasks: templateTasks,
    }));
  };

  const handleMarkAllComplete = () => {
    const time = getCurrentTimeString();
    updateCurrentReport((rep) => ({
      ...rep,
      tasks: rep.tasks.map((t) => ({
        ...t,
        isCompleted: true,
        status: 'completed',
        completedAt: t.completedAt || time,
      })),
    }));
  };

  const handleResetTasks = () => {
    updateCurrentReport((rep) => ({
      ...rep,
      isDoneForToday: false,
      doneAt: undefined,
      tasks: rep.tasks.map((t) => ({
        ...t,
        isCompleted: false,
        status: 'pending',
        completedAt: undefined,
        crossReason: undefined,
      })),
    }));
  };

  // Google Login & Logout
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Google Sign-in failed:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setAuthUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Template Save
  const handleSaveScheduleTemplate = (newSchedule: DefaultTimeSlotTemplate[]) => {
    setAppState((prev) => ({
      ...prev,
      defaultSchedule: newSchedule,
    }));

    if (authUser) {
      saveTemplatesToFirestore(authUser.uid, newSchedule);
    }
  };

  // Profile Save
  const handleSaveProfile = (newProfile: UserProfile) => {
    setAppState((prev) => ({
      ...prev,
      userProfile: newProfile,
    }));

    if (newProfile.companyLogoUrl) {
      updatePwaManifestAndIcons(newProfile.companyLogoUrl, newProfile.companyName);
    }

    if (authUser) {
      saveUserProfileToFirestore(authUser.uid, newProfile);
    }
  };

  // Import Tasks
  const handleImportTasks = (importedTasks: ScheduleTask[]) => {
    updateCurrentReport((rep) => ({
      ...rep,
      tasks: [...rep.tasks, ...importedTasks],
    }));
  };

  // Restore State & Reset Data
  const handleRestoreState = (restored: AppState) => {
    setAppState(restored);
    saveAppState(restored);
  };

  const handleResetAllData = async () => {
    const fresh = getFreshInitialState();
    if (authUser) {
      await resetAllFirestoreUserData(authUser.uid, fresh);
    }
    resetAppState();
    setAppState(fresh);
  };

  // ==========================================
  // Daily Work Activities & Photo Evidence Handlers
  // ==========================================
  const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);

  const handleSaveActivity = async (activity: WorkActivity): Promise<boolean> => {
    return await updateCurrentReport((rep) => {
      const existing = rep.activities || [];
      const index = existing.findIndex((a) => a.id === activity.id);
      let updatedActivities: WorkActivity[];
      if (index >= 0) {
        updatedActivities = existing.map((a) => (a.id === activity.id ? activity : a));
      } else {
        updatedActivities = [activity, ...existing];
      }
      return {
        ...rep,
        activities: updatedActivities,
      };
    });
  };

  const handleDeleteActivity = async (activityId: string): Promise<boolean> => {
    return await updateCurrentReport((rep) => {
      const existing = rep.activities || [];
      return {
        ...rep,
        activities: existing.filter((a) => a.id !== activityId),
      };
    });
  };

  const handleSavePhotoToActivity = async (activityId: string, photo: WorkActivityPhoto): Promise<boolean> => {
    return await updateCurrentReport((rep) => {
      const existing = rep.activities || [];
      const updated = existing.map((a) => {
        if (a.id === activityId) {
          const prevPhotos = a.photos || [];
          return {
            ...a,
            photos: [photo, ...prevPhotos],
          };
        }
        return a;
      });
      return {
        ...rep,
        activities: updated,
      };
    });
  };

  const handlePhotoSynced = (photoId: string, cloudUrl: string, thumbnailUrl: string) => {
    setAppState((prev) => {
      const updatedReports = { ...prev.reports };
      let targetDate: string | null = null;

      for (const dKey of Object.keys(updatedReports)) {
        const rep = updatedReports[dKey];
        const hasPhoto = (rep.activities || []).some(
          (act) => (act.photos || []).some((p) => p.photoId === photoId) || act.id === photoId
        );
        if (hasPhoto) {
          targetDate = dKey;
          break;
        }
      }

      if (!targetDate) {
        targetDate = selectedDate;
      }

      const rep = updatedReports[targetDate] || createNewDayReport(targetDate, prev.defaultSchedule, prev.userProfile);
      const updatedActivities = (rep.activities || []).map((act) => {
        const photos = act.photos || [];
        const updatedPhotos = photos.map((p) =>
          p.photoId === photoId
            ? { ...p, imageUrl: cloudUrl, thumbnailUrl, syncStatus: 'synced' as const, uploadedAt: new Date().toISOString() }
            : p
        );
        return {
          ...act,
          photos: updatedPhotos,
          imageUrl: act.id === photoId ? cloudUrl : act.imageUrl,
          thumbnailUrl: act.id === photoId ? thumbnailUrl : act.thumbnailUrl,
        };
      });

      const updatedReport = {
        ...rep,
        activities: updatedActivities,
        updatedAt: new Date().toISOString(),
      };

      updatedReports[targetDate] = updatedReport;

      if (authUser) {
        saveDayReportToFirestore(authUser.uid, updatedReport);
      }

      return {
        ...prev,
        reports: updatedReports,
      };
    });
  };

  // Drain queue on app start (after auth) and window 'online' event
  useEffect(() => {
    if (authUser) {
      drainUploadQueue(handlePhotoSynced).catch(console.error);
    }
  }, [authUser]);

  useEffect(() => {
    const handleOnline = () => {
      drainUploadQueue(handlePhotoSynced).catch(console.error);
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const handleSavePhotoToTodayVault = async (photo: WorkActivityPhoto): Promise<boolean> => {
    return await updateCurrentReport((rep) => {
      const existing = rep.activities || [];
      if (existing.length > 0) {
        const updated = existing.map((a, idx) =>
          idx === 0 ? { ...a, photos: [photo, ...(a.photos || [])] } : a
        );
        return { ...rep, activities: updated };
      } else {
        const newAct: WorkActivity = {
          id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          reportDate: selectedDate,
          date: selectedDate,
          employeeId: appState.userProfile.employeeId || 'EMP-001',
          employeeName: appState.userProfile.employeeName || 'ROTH DARO',
          imageUrl: photo.imageUrl,
          thumbnailUrl: photo.thumbnailUrl || photo.imageUrl,
          workCategory: null,
          category: 'Other',
          activityTitle: photo.description || 'Work Evidence Photo',
          title: photo.description || 'Work Evidence Photo',
          description: photo.description || 'Captured photographic evidence',
          startTime: '08:00',
          endTime: '09:00',
          status: 'completed',
          photos: [photo],
          capturedAt: photo.capturedAt || new Date().toISOString(),
          createdTimestamp: Date.now(),
          createdAt: new Date().toISOString(),
        };
        return {
          ...rep,
          activities: [newAct],
        };
      }
    });
  };

  const handleUpdatePhotoDescription = (photoId: string, description: string) => {
    updateCurrentReport((rep) => {
      const existing = rep.activities || [];
      const updated = existing.map((act) => ({
        ...act,
        photos: (act.photos || []).map((p) =>
          p.photoId === photoId ? { ...p, description } : p
        ),
      }));
      return {
        ...rep,
        activities: updated,
      };
    });
  };

  const handleDeletePhoto = (photoId: string) => {
    updateCurrentReport((rep) => {
      const existing = rep.activities || [];
      const updated = existing.map((act) => ({
        ...act,
        photos: (act.photos || []).filter((p) => p.photoId !== photoId),
      }));
      return {
        ...rep,
        activities: updated,
      };
    });
  };

  // Top level navigation dispatcher
  const handleNavigate = (view: MainNavView) => {
    if (view === 'export') {
      setIsExportModalOpen(true);
    } else if (view === 'settings') {
      setIsSettingsModalOpen(true);
    } else {
      setCurrentNavView(view);
    }
  };

  // Completion calculation for header/nav
  const completedTasksCount = currentReport.tasks.filter((t) => t.isCompleted || t.status === 'completed').length;
  const totalTasksCount = currentReport.tasks.length;
  const completionPercentage =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const handleToggleLanguage = (newLang: 'en' | 'km') => {
    setAppState((prev) => {
      const updatedProfile: UserProfile = {
        ...prev.userProfile,
        language: newLang,
      };
      if (authUser) {
        saveUserProfileToFirestore(authUser.uid, updatedProfile);
      }
      return {
        ...prev,
        userProfile: updatedProfile,
      };
    });
  };

  const todayActivities = currentReport.activities || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-battambang selection:bg-indigo-200 selection:text-slate-900">
      
      {/* 1. Desktop Left Sidebar */}
      <DesktopSidebar
        currentView={currentNavView}
        onNavigate={handleNavigate}
        userProfile={appState.userProfile}
        authUser={authUser}
        isSyncing={isSyncing}
        language={currentLanguage}
        onToggleLanguage={handleToggleLanguage}
        todayActivitiesCount={todayActivities.length}
      />

      {/* 2. Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 md:pb-6">
        
        {/* Visible warning banner for storage full or cloud save failure */}
        {saveWarning && (
          <div className="bg-amber-500 text-slate-950 px-4 py-3 font-bold text-xs flex items-center justify-between shadow-lg z-50 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{saveWarning}</span>
            </div>
            <button
              onClick={() => setSaveWarning(null)}
              className="bg-slate-950/15 hover:bg-slate-950/25 px-2.5 py-1 rounded-lg text-xs font-black transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Header Bar */}
        <Header
          currentView={currentView}
          setCurrentView={setCurrentView}
          formattedDateText={dateHeaderInfo.formattedText}
          userProfile={appState.userProfile}
          authUser={authUser}
          onGoogleLogin={handleGoogleLogin}
          onLogout={handleLogout}
          isSyncing={isSyncing}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onOpenInstallModal={triggerInstall}
          isInstalled={isInstalled}
          completionPercentage={completionPercentage}
          isHoliday={currentReport.isHoliday}
          language={currentLanguage}
          onToggleLanguage={handleToggleLanguage}
        />

        {/* View Router */}
        <main className="flex-1">
          {/* A. DASHBOARD VIEW */}
          {currentNavView === 'dashboard' && (
            <Dashboard
              report={currentReport}
              selectedDate={selectedDate}
              userProfile={appState.userProfile}
              authUser={authUser}
              onNavigateToSchedule={() => setCurrentNavView('schedule')}
              onNavigateToCamera={() => setCurrentNavView('camera')}
              onNavigateToReports={() => setCurrentNavView('reports')}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              onOpenAddActivity={() => setIsActivityFormOpen(true)}
              onCheckIn={() => handleCheckIn()}
              onCheckOut={() => handleCheckOut()}
              onToggleTask={handleToggleTask}
              language={currentLanguage}
            />
          )}

          {/* B. MY SCHEDULE / CHECKLIST VIEW */}
          {currentNavView === 'schedule' && (
            <>
              {currentView === 'checklist' && (
                <>
                  <DateNavigator
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    formattedDateText={dateHeaderInfo.formattedText}
                    dayOfWeek={dateHeaderInfo.dayOfWeek}
                    isHoliday={currentReport.isHoliday}
                    completedTasksCount={completedTasksCount}
                    totalTasksCount={totalTasksCount}
                    completionPercentage={completionPercentage}
                    language={currentLanguage}
                  />

                  {currentReport.isHoliday ? (
                    <MondayHolidayCard
                      dayOfWeek={dateHeaderInfo.dayOfWeek}
                      onOverrideHoliday={handleOverrideHoliday}
                      language={currentLanguage}
                    />
                  ) : (
                    <Checklist
                      tasks={currentReport.tasks}
                      report={currentReport}
                      selectedDate={selectedDate}
                      isDoneForToday={currentReport.isDoneForToday}
                      doneAt={currentReport.doneAt}
                      workSessions={currentReport.workSessions}
                      isCheckedIn={currentReport.isCheckedIn}
                      currentCheckInTime={currentReport.currentCheckInTime}
                      currentCheckInTimestamp={currentReport.currentCheckInTimestamp}
                      totalWorkedMinutes={currentReport.totalWorkedMinutes}
                      onCheckIn={handleCheckIn}
                      onCheckOut={handleCheckOut}
                      onDeleteWorkSession={handleDeleteWorkSession}
                      onOpenPermissionModal={() => setIsPermissionModalOpen(true)}
                      onToggleTask={handleToggleTask}
                      onSetTaskStatus={handleSetTaskStatus}
                      onUpdateCrossReason={handleUpdateCrossReason}
                      onUpdateOther={handleUpdateOther}
                      onUpdateNotes={handleUpdateNotes}
                      onUpdateTaskName={handleUpdateTaskName}
                      onUpdateScheduleType={handleUpdateScheduleType}
                      onAddTask={handleAddTask}
                      onDeleteTask={handleDeleteTask}
                      onMarkAllComplete={handleMarkAllComplete}
                      onResetTasks={handleResetTasks}
                      onToggleDoneForToday={handleToggleDoneForToday}
                      language={currentLanguage}
                    />
                  )}
                </>
              )}

              {currentView === 'summary' && (
                <>
                  <DateNavigator
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    formattedDateText={dateHeaderInfo.formattedText}
                    dayOfWeek={dateHeaderInfo.dayOfWeek}
                    isHoliday={currentReport.isHoliday}
                    completedTasksCount={completedTasksCount}
                    totalTasksCount={totalTasksCount}
                    completionPercentage={completionPercentage}
                    language={currentLanguage}
                  />

                  <SummaryTable
                    reports={appState.reports}
                    userProfile={appState.userProfile}
                    onOpenExportModal={() => setIsExportModalOpen(true)}
                    language={currentLanguage}
                  />
                </>
              )}
            </>
          )}

          {/* C. WORK EVIDENCE CAMERA VIEW */}
          {currentNavView === 'camera' && (
            <WorkCamera
              report={currentReport}
              userProfile={appState.userProfile}
              selectedDate={selectedDate}
              onSaveRecord={handleSaveActivity}
              onDeleteRecord={handleDeleteActivity}
              onSavePhotoToActivity={handleSavePhotoToActivity}
              onSavePhotoToTodayVault={handleSavePhotoToTodayVault}
              onBackToDashboard={() => setCurrentNavView('dashboard')}
              language={currentLanguage}
            />
          )}

          {/* D. DAILY WORK REPORTS VIEW */}
          {currentNavView === 'reports' && (
            <DailyReportPage
              report={currentReport}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              userProfile={appState.userProfile}
              onSaveActivity={handleSaveActivity}
              onDeleteActivity={handleDeleteActivity}
              onAddPhotosToActivity={() => setCurrentNavView('camera')}
              onUpdatePhotoDescription={handleUpdatePhotoDescription}
              onDeletePhoto={handleDeletePhoto}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              onNavigateToCamera={() => setCurrentNavView('camera')}
              language={currentLanguage}
            />
          )}

          {/* E. REPORT HISTORY VIEW */}
          {currentNavView === 'history' && (
            <ReportHistory
              reports={appState.reports}
              userProfile={appState.userProfile}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setCurrentNavView('reports');
              }}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              language={currentLanguage}
            />
          )}
        </main>
      </div>

      {/* 3. Mobile Fixed Bottom Navigation */}
      <MobileBottomNav
        currentView={currentNavView}
        onNavigate={handleNavigate}
        language={currentLanguage}
      />

      {/* Modals */}
      <ActivityForm
        isOpen={isActivityFormOpen}
        onClose={() => setIsActivityFormOpen(false)}
        onSave={handleSaveActivity}
        date={selectedDate}
        userProfile={appState.userProfile}
        language={currentLanguage}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        report={currentReport}
        reportsMap={appState.reports}
        userProfile={appState.userProfile}
        defaultSchedule={appState.defaultSchedule}
        language={currentLanguage}
      />

      <PermissionModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        report={currentReport}
        onSavePermission={handleSavePermission}
        onRemovePermission={handleRemovePermission}
        language={currentLanguage}
      />

      <TemplateEditorModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        defaultSchedule={appState.defaultSchedule}
        onSaveSchedule={handleSaveScheduleTemplate}
        language={currentLanguage}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        userProfile={appState.userProfile}
        onSaveProfile={handleSaveProfile}
        appState={appState}
        onRestoreState={handleRestoreState}
        onResetAllData={handleResetAllData}
        language={currentLanguage}
      />

      <ImportSheetModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        selectedDate={selectedDate}
        formattedDateText={dateHeaderInfo.formattedText}
        reportsMap={appState.reports}
        userProfile={appState.userProfile}
        language={currentLanguage}
        onImportTasks={handleImportTasks}
      />

      <InstallPromptModal
        isOpen={isInstallModalOpen}
        onClose={closeInstallModal}
        onNativeInstall={triggerInstall}
        deferredPromptAvailable={deferredPromptAvailable}
        isIOS={isIOS}
        isInstalled={isInstalled}
        userProfile={appState.userProfile}
      />

    </div>
  );
}
