import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  resetAllFirestoreUserData,
  mergeCloudAndLocalReports,
  flushPendingCloudSync,
  enqueuePendingReportSync,
  enqueuePendingProfileSync,
  enqueuePendingTemplatesSync,
  clearAllPendingCloudSync,
  FirestoreSyncResult
} from './utils/firestoreService';
import { drainUploadQueue, cleanupOrphanedPhotoCache } from './utils/imageUploadService';
import { collectReferencedPhotoIds } from './utils/workEvidenceService';
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
  const appStateRef = useRef<AppState>(appState);
  appStateRef.current = appState;

  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateKey(new Date()));
  const [currentNavView, setCurrentNavView] = useState<MainNavView>('dashboard');
  const [currentView, setCurrentView] = useState<'checklist' | 'summary'>('checklist');

  const currentLanguage = appState.userProfile?.language || 'en';
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  const [saveWarning, setSaveWarning] = useState<string | null>(null);

  // PWA Install & Update Hook
  const {
    deferredPromptAvailable,
    isInstalled,
    isIOS,
    isIPad,
    isAndroid,
    isSafari,
    isIOSNonSafari,
    browserName,
    isInstallModalOpen,
    openInstallModal,
    closeInstallModal,
    triggerInstall,
    isUpdateAvailable,
    applyUpdate,
    dismissUpdateBanner,
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

        // Seed initial data if first time user on Cloud (using latest ref state)
        const seedRes = await seedInitialFirestoreData(user.uid, appStateRef.current);
        if (!seedRes.success && seedRes.code !== 'offline') {
          setSaveWarning(`${t.cloudSaveFailedWarning}${seedRes.error ? `: ${seedRes.error}` : ''}`);
        }
      } else {
        // Automatically establish Firebase session so user is always on Firebase
        loginAnonymously().catch(() => {});
      }
    });

    return () => unsubscribeAuth();
  }, [t.cloudSaveFailedWarning]);

  // Realtime Firestore listeners when logged in
  useEffect(() => {
    if (!authUser) return;

    setIsSyncing(true);

    const unsubProfile = subscribeToUserProfile(
      authUser.uid,
      (cloudProfile) => {
        if (cloudProfile) {
          setAppState((prev) => {
            if (JSON.stringify(prev.userProfile) === JSON.stringify(cloudProfile)) {
              return prev;
            }
            const next = { ...prev, userProfile: cloudProfile };
            appStateRef.current = next;
            return next;
          });
          if (cloudProfile.companyLogoUrl) {
            updatePwaManifestAndIcons(cloudProfile.companyLogoUrl, cloudProfile.companyName);
          }
        }
      },
      (err) => {
        setIsSyncing(false);
        setSaveWarning(`${t.cloudSaveFailedWarning}: ${err.message}`);
      }
    );

    const unsubTemplates = subscribeToTemplates(
      authUser.uid,
      (cloudTemplates) => {
        if (cloudTemplates && cloudTemplates.length > 0) {
          setAppState((prev) => {
            if (JSON.stringify(prev.defaultSchedule) === JSON.stringify(cloudTemplates)) {
              return prev;
            }
            const next = { ...prev, defaultSchedule: cloudTemplates };
            appStateRef.current = next;
            return next;
          });
        }
      },
      (err) => {
        setIsSyncing(false);
        setSaveWarning(`${t.cloudSaveFailedWarning}: ${err.message}`);
      }
    );

    const unsubReports = subscribeToReports(
      authUser.uid,
      (cloudReports) => {
        if (cloudReports && Object.keys(cloudReports).length > 0) {
          setAppState((prev) => {
            const { merged, changed } = mergeCloudAndLocalReports(prev.reports, cloudReports);
            if (!changed) return prev;
            const next = {
              ...prev,
              reports: merged,
            };
            appStateRef.current = next;
            return next;
          });
        }
        setIsSyncing(false);
      },
      (err) => {
        setIsSyncing(false);
        setSaveWarning(`${t.cloudSaveFailedWarning}: ${err.message}`);
      }
    );

    return () => {
      unsubProfile();
      unsubTemplates();
      unsubReports();
    };
  }, [authUser?.uid, t.cloudSaveFailedWarning]);

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

  // Conflict-safe helper to update day report without stale React closure races
  const updateCurrentReport = useCallback(async (updater: (prevReport: DayReport) => DayReport): Promise<boolean> => {
    const latestState = appStateRef.current;
    const baseReport =
      latestState.reports[selectedDate] ||
      createNewDayReport(selectedDate, latestState.defaultSchedule, latestState.userProfile);

    const updated: DayReport = {
      ...updater(baseReport),
      date: selectedDate,
      lastUpdated: new Date().toISOString(),
    };

    const nextAppState: AppState = {
      ...latestState,
      reports: {
        ...latestState.reports,
        [selectedDate]: updated,
      },
    };

    // 1. Save locally first
    const localSuccess = saveAppState(nextAppState);
    if (!localSuccess) {
      setSaveWarning(t.storageFullWarning);
      return false;
    }

    // 2. Update ref and React state synchronously so rapid updates never overwrite each other
    appStateRef.current = nextAppState;
    setAppState(nextAppState);
    setSaveWarning(null);

    // 3. Queue for cloud sync before network request so offline/interrupted saves are never lost
    enqueuePendingReportSync(updated);

    if (authUser) {
      const cloudRes = await saveDayReportToFirestore(authUser.uid, updated);
      if (!cloudRes.success) {
        setSaveWarning(
          cloudRes.code === 'offline'
            ? `${t.cloudSaveFailedWarning} (${t.stepSavedOffline})`
            : t.cloudSaveFailedWarning
        );
        if (cloudRes.code === 'payload-too-large') {
          return false;
        }
      }
    }
    return true;
  }, [selectedDate, authUser, t.storageFullWarning, t.cloudSaveFailedWarning, t.stepSavedOffline]);

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

      const updatedSchedule = [...appStateRef.current.defaultSchedule, newTemplate];
      handleSaveScheduleTemplate(updatedSchedule);
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
    const templateTasks: ScheduleTask[] = appStateRef.current.defaultSchedule.map((item) => ({
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
  const handleSaveScheduleTemplate = async (newSchedule: DefaultTimeSlotTemplate[]): Promise<boolean> => {
    const nextState: AppState = {
      ...appStateRef.current,
      defaultSchedule: newSchedule,
    };

    const localSuccess = saveAppState(nextState);
    if (!localSuccess) {
      setSaveWarning(t.storageFullWarning);
      return false;
    }

    appStateRef.current = nextState;
    setAppState(nextState);
    enqueuePendingTemplatesSync(newSchedule);

    if (authUser) {
      const res = await saveTemplatesToFirestore(authUser.uid, newSchedule);
      if (!res.success) {
        setSaveWarning(
          res.code === 'offline'
            ? `${t.cloudSaveFailedWarning} (${t.stepSavedOffline})`
            : t.cloudSaveFailedWarning
        );
      }
    }
    return true;
  };

  // Profile Save
  const handleSaveProfile = async (newProfile: UserProfile): Promise<boolean> => {
    const nextState: AppState = {
      ...appStateRef.current,
      userProfile: newProfile,
    };

    const localSuccess = saveAppState(nextState);
    if (!localSuccess) {
      setSaveWarning(t.storageFullWarning);
      return false;
    }

    appStateRef.current = nextState;
    setAppState(nextState);
    enqueuePendingProfileSync(newProfile);

    if (newProfile.companyLogoUrl) {
      updatePwaManifestAndIcons(newProfile.companyLogoUrl, newProfile.companyName);
    }

    if (authUser) {
      const res = await saveUserProfileToFirestore(authUser.uid, newProfile);
      if (!res.success) {
        setSaveWarning(
          res.code === 'offline'
            ? `${t.cloudSaveFailedWarning} (${t.stepSavedOffline})`
            : t.cloudSaveFailedWarning
        );
      }
    }
    return true;
  };

  // Import Tasks
  const handleImportTasks = (importedTasks: ScheduleTask[], mode: 'replace' | 'append' | 'template' = 'append') => {
    if (mode === 'template') {
      const newTemplates: DefaultTimeSlotTemplate[] = importedTasks.map((task, idx) => ({
        id: `tpl_${Date.now()}_${idx}`,
        timeSlot: task.timeSlot,
        taskName: task.taskName,
        scheduleType: task.scheduleType || 'Schedule',
        applicableScope: task.applicableScope || 'all',
        daysOfWeek: task.daysOfWeek,
        specificDate: task.specificDate,
      }));
      handleSaveScheduleTemplate(newTemplates);
      return;
    }

    updateCurrentReport((rep) => ({
      ...rep,
      tasks: mode === 'replace' ? importedTasks : [...rep.tasks, ...importedTasks],
    }));
  };

  // Restore State & Reset Data
  const handleRestoreState = async (restored: AppState): Promise<boolean> => {
    const localSuccess = saveAppState(restored);
    if (!localSuccess) {
      setSaveWarning(t.storageFullWarning);
      return false;
    }
    appStateRef.current = restored;
    setAppState(restored);
    enqueuePendingProfileSync(restored.userProfile);
    enqueuePendingTemplatesSync(restored.defaultSchedule);
    for (const dateKey of Object.keys(restored.reports)) {
      enqueuePendingReportSync(restored.reports[dateKey]);
    }
    if (authUser) {
      const flushRes = await flushPendingCloudSync(authUser.uid);
      if (!flushRes.success) {
        setSaveWarning(t.cloudSaveFailedWarning);
      }
    }
    return true;
  };

  const handleResetAllData = async (): Promise<FirestoreSyncResult> => {
    const fresh = getFreshInitialState();
    if (authUser) {
      setIsSyncing(true);
      const cloudRes = await resetAllFirestoreUserData(authUser.uid, fresh);
      setIsSyncing(false);
      if (!cloudRes.success) {
        const errMsg = cloudRes.error || t.cloudSaveFailedWarning;
        setSaveWarning(`${t.cloudSaveFailedWarning}: ${errMsg}`);
        return cloudRes;
      }
    } else {
      clearAllPendingCloudSync();
    }

    const localFresh = resetAppState();
    appStateRef.current = localFresh;
    setAppState(localFresh);
    setSaveWarning(null);
    return { success: true };
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

  const handlePhotoSynced = useCallback(async (
    photoId: string,
    cloudUrl: string,
    thumbnailUrl: string,
    queuedDate?: string,
    queuedActivityId?: string
  ): Promise<boolean> => {
    const prev = appStateRef.current;
    const updatedReports = { ...prev.reports };
    let targetDate: string | null = null;

    // 1. Check queuedDate first if provided
    if (queuedDate && updatedReports[queuedDate]) {
      const rep = updatedReports[queuedDate];
      const hasPhoto = (rep.activities || []).some(
        (act) =>
          (act.photos || []).some((p) => p.photoId === photoId) ||
          act.id === photoId ||
          (queuedActivityId && act.id === queuedActivityId)
      );
      if (hasPhoto) {
        targetDate = queuedDate;
      }
    }

    // 2. Search across all dates if not found in queuedDate
    if (!targetDate) {
      for (const dKey of Object.keys(updatedReports)) {
        const rep = updatedReports[dKey];
        const hasPhoto = (rep.activities || []).some(
          (act) =>
            (act.photos || []).some((p) => p.photoId === photoId) ||
            act.id === photoId ||
            (queuedActivityId && act.id === queuedActivityId)
        );
        if (hasPhoto) {
          targetDate = dKey;
          break;
        }
      }
    }

    // If the photo record does not exist in any report yet, return false so the queue item is preserved
    if (!targetDate) {
      return false;
    }

    const rep = updatedReports[targetDate];
    let didUpdateRecord = false;
    const nowIso = new Date().toISOString();

    const updatedActivities = (rep.activities || []).map((act) => {
      const photos = act.photos || [];
      const hasMatchingPhoto = photos.some((p) => p.photoId === photoId);
      const isMatchingActivity = act.id === photoId || (Boolean(queuedActivityId) && act.id === queuedActivityId);

      if (!hasMatchingPhoto && !isMatchingActivity) {
        return act;
      }

      didUpdateRecord = true;
      const updatedPhotos = hasMatchingPhoto
        ? photos.map((p) =>
            p.photoId === photoId
              ? {
                  ...p,
                  imageUrl: cloudUrl,
                  thumbnailUrl: thumbnailUrl || cloudUrl,
                  syncStatus: 'synced' as const,
                  uploadStatus: 'uploaded' as const,
                  uploadedAt: nowIso,
                  error: undefined,
                }
              : p
          )
        : photos;

      const shouldUpdateCover =
        isMatchingActivity ||
        photos[0]?.photoId === photoId ||
        !act.imageUrl;

      return {
        ...act,
        photos: updatedPhotos,
        imageUrl: shouldUpdateCover ? cloudUrl : act.imageUrl,
        thumbnailUrl: shouldUpdateCover ? (thumbnailUrl || cloudUrl) : act.thumbnailUrl,
        updatedAt: nowIso,
      };
    });

    if (!didUpdateRecord) {
      return false;
    }

    const updatedReport: DayReport = {
      ...rep,
      activities: updatedActivities,
      lastUpdated: nowIso,
    };

    updatedReports[targetDate] = updatedReport;
    const nextState: AppState = {
      ...prev,
      reports: updatedReports,
    };

    const localSuccess = saveAppState(nextState);
    if (!localSuccess) {
      setSaveWarning(t.storageFullWarning);
      return false;
    }

    appStateRef.current = nextState;
    setAppState(nextState);
    enqueuePendingReportSync(updatedReport);

    // Wait for Firestore confirmation before removing the queued item from IndexedDB
    if (!authUser) {
      return false;
    }

    const cloudRes = await saveDayReportToFirestore(authUser.uid, updatedReport);
    if (!cloudRes.success) {
      setSaveWarning(
        cloudRes.code === 'offline'
          ? `${t.cloudSaveFailedWarning} (${t.stepSavedOffline})`
          : t.cloudSaveFailedWarning
      );
      return false;
    }

    return true;
  }, [authUser, t.storageFullWarning, t.cloudSaveFailedWarning, t.stepSavedOffline]);

  // Centralized photo upload queue drain & pending cloud sync on auth/startup and 'online' events
  useEffect(() => {
    const syncAll = async () => {
      if (authUser) {
        try {
          const res = await flushPendingCloudSync(authUser.uid);
          if (res.success) {
            setSaveWarning(null);
          }
        } catch (err) {
          console.error('Error flushing pending cloud sync:', err);
        }
      }
      try {
        await drainUploadQueue(handlePhotoSynced);
        const referencedIds = collectReferencedPhotoIds(appStateRef.current.reports);
        await cleanupOrphanedPhotoCache(referencedIds);
      } catch (err) {
        console.error('Error draining photo upload queue:', err);
      }
    };

    syncAll();

    const handleOnline = () => {
      syncAll();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [authUser, handlePhotoSynced]);

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
          employeeId: appStateRef.current.userProfile.employeeId || 'EMP-001',
          employeeName: appStateRef.current.userProfile.employeeName || 'ROTH DARO',
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

  const handleUpdatePhotoDescription = async (photoId: string, description: string): Promise<boolean> => {
    return await updateCurrentReport((rep) => {
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

  const handleDeletePhoto = async (photoId: string): Promise<boolean> => {
    return await updateCurrentReport((rep) => {
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
    const updatedProfile: UserProfile = {
      ...appStateRef.current.userProfile,
      language: newLang,
    };
    handleSaveProfile(updatedProfile);
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
        
        {/* Non-intrusive PWA Update Available Banner */}
        {isUpdateAvailable && (
          <div className="bg-indigo-950 text-white px-4 py-2.5 text-xs flex items-center justify-between gap-3 shadow-md z-40 animate-fadeIn">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-semibold truncate">
                {currentLanguage === 'km'
                  ? 'មានកំណែទម្រង់ថ្មីនៃកម្មវិធី! ចុចដើម្បីធ្វើបច្ចុប្បន្នភាព។'
                  : 'A new version of the app is available.'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={applyUpdate}
                className="bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                {currentLanguage === 'km' ? 'ធ្វើបច្ចុប្បន្នភាពឥឡូវនេះ' : 'Update Now'}
              </button>
              <button
                onClick={dismissUpdateBanner}
                className="text-slate-300 hover:text-white px-1.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                aria-label="Dismiss update notification"
              >
                ✕
              </button>
            </div>
          </div>
        )}

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
        onOpenInstallModal={openInstallModal}
        isInstalled={isInstalled}
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
        isIPad={isIPad}
        isAndroid={isAndroid}
        isSafari={isSafari}
        isIOSNonSafari={isIOSNonSafari}
        browserName={browserName}
        isInstalled={isInstalled}
        userProfile={appState.userProfile}
      />

    </div>
  );
}
