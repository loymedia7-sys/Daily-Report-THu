import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  collection,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AppState, DayReport, DefaultTimeSlotTemplate, UserProfile } from '../types';
import { normalizeCloudinaryConfig } from '../config/cloudinary';
import { stripReportImages } from './storage';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  code?: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface FirestoreSyncResult {
  success: boolean;
  error?: string;
  code?: string;
  partialFailures?: string[];
}

const PENDING_SYNC_STORAGE_KEY = 'daily_report_pending_cloud_sync_v1';

export interface PendingCloudSyncQueue {
  reports: Record<string, DayReport>;
  userProfile?: UserProfile;
  templates?: DefaultTimeSlotTemplate[];
  updatedAt: string;
}

function buildFirestoreErrorInfo(
  error: unknown,
  operationType: OperationType,
  path: string | null
): { message: string; code?: string; info: FirestoreErrorInfo } {
  const errObj = error as { message?: string; code?: string } | null;
  const message = error instanceof Error ? error.message : String(error);
  const code = typeof errObj?.code === 'string' ? errObj.code : undefined;

  const info: FirestoreErrorInfo = {
    error: message,
    code,
    operationType,
    path,
    authInfo: {
      userId: auth?.currentUser?.uid ?? null,
      email: auth?.currentUser?.email ?? null,
      emailVerified: auth?.currentUser?.emailVerified ?? null,
      isAnonymous: auth?.currentUser?.isAnonymous ?? null,
      tenantId: auth?.currentUser?.tenantId ?? null,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
  };

  console.error('Firestore Error:', JSON.stringify(info));
  return { message, code, info };
}

// ==========================================
// Offline Pending Cloud Sync Queue
// ==========================================

export function loadPendingCloudSyncQueue(): PendingCloudSyncQueue {
  try {
    if (typeof localStorage === 'undefined') {
      return { reports: {}, updatedAt: new Date().toISOString() };
    }
    const raw = localStorage.getItem(PENDING_SYNC_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PendingCloudSyncQueue;
      if (parsed && typeof parsed === 'object' && parsed.reports) {
        return {
          reports: parsed.reports,
          userProfile: parsed.userProfile,
          templates: parsed.templates,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load pending cloud sync queue:', err);
  }
  return { reports: {}, updatedAt: new Date().toISOString() };
}

export function savePendingCloudSyncQueue(queue: PendingCloudSyncQueue): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(PENDING_SYNC_STORAGE_KEY, JSON.stringify(queue));
    return true;
  } catch (err) {
    console.warn('Failed to save pending cloud sync queue:', err);
    return false;
  }
}

export function enqueuePendingReportSync(report: DayReport): void {
  const queue = loadPendingCloudSyncQueue();
  queue.reports[report.date] = stripReportImages(report);
  queue.updatedAt = new Date().toISOString();
  savePendingCloudSyncQueue(queue);
}

export function removePendingReportSync(date: string, syncedLastUpdated?: string): void {
  const queue = loadPendingCloudSyncQueue();
  const existing = queue.reports[date];
  if (!existing) return;

  if (syncedLastUpdated && existing.lastUpdated) {
    const existingTime = Date.parse(existing.lastUpdated) || 0;
    const syncedTime = Date.parse(syncedLastUpdated) || 0;
    // Do not remove if a newer local edit occurred while the cloud save was in flight
    if (existingTime > syncedTime) {
      return;
    }
  }

  delete queue.reports[date];
  queue.updatedAt = new Date().toISOString();
  savePendingCloudSyncQueue(queue);
}

export function enqueuePendingProfileSync(profile: UserProfile): void {
  const queue = loadPendingCloudSyncQueue();
  queue.userProfile = profile;
  queue.updatedAt = new Date().toISOString();
  savePendingCloudSyncQueue(queue);
}

export function removePendingProfileSync(): void {
  const queue = loadPendingCloudSyncQueue();
  if (!queue.userProfile) return;
  delete queue.userProfile;
  queue.updatedAt = new Date().toISOString();
  savePendingCloudSyncQueue(queue);
}

export function enqueuePendingTemplatesSync(templates: DefaultTimeSlotTemplate[]): void {
  const queue = loadPendingCloudSyncQueue();
  queue.templates = templates;
  queue.updatedAt = new Date().toISOString();
  savePendingCloudSyncQueue(queue);
}

export function removePendingTemplatesSync(): void {
  const queue = loadPendingCloudSyncQueue();
  if (!queue.templates) return;
  delete queue.templates;
  queue.updatedAt = new Date().toISOString();
  savePendingCloudSyncQueue(queue);
}

export function clearAllPendingCloudSync(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(PENDING_SYNC_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('Failed to clear pending cloud sync queue:', err);
  }
}

export function hasPendingCloudSync(): boolean {
  const queue = loadPendingCloudSyncQueue();
  return (
    Object.keys(queue.reports).length > 0 ||
    Boolean(queue.userProfile) ||
    Boolean(queue.templates)
  );
}

export function getPendingReportDates(): Set<string> {
  const queue = loadPendingCloudSyncQueue();
  return new Set(Object.keys(queue.reports));
}

// ==========================================
// Conflict-Safe Cloud & Local Report Merger
// ==========================================

/**
 * Merges incoming cloud reports with current local reports without losing
 * newer local edits or pending offline changes.
 */
export function mergeCloudAndLocalReports(
  localReports: Record<string, DayReport>,
  cloudReports: Record<string, DayReport>,
  pendingDates: Set<string> = getPendingReportDates()
): { merged: Record<string, DayReport>; changed: boolean } {
  const merged: Record<string, DayReport> = { ...localReports };
  let changed = false;

  for (const dateKey of Object.keys(cloudReports)) {
    const cloudRep = cloudReports[dateKey];
    if (!cloudRep || !cloudRep.date) continue;

    const localRep = localReports[dateKey];
    if (!localRep) {
      merged[dateKey] = cloudRep;
      changed = true;
      continue;
    }

    const localTime = Date.parse(localRep.lastUpdated || '') || 0;
    const cloudTime = Date.parse(cloudRep.lastUpdated || '') || 0;

    // If local report has pending unsynced edits and is at least as recent as cloud, keep local
    if (pendingDates.has(dateKey) && localTime >= cloudTime) {
      continue;
    }

    // Never overwrite newer local state with an older cloud snapshot
    if (localTime > cloudTime) {
      continue;
    }

    if (cloudTime > localTime) {
      // Preserve any local-only pending photos that are still queued in IndexedDB
      const localActivities = localRep.activities || [];
      const cloudActivities = cloudRep.activities || [];
      const mergedActivities = cloudActivities.map((cloudAct) => {
        const matchingLocalAct = localActivities.find((la) => la.id === cloudAct.id);
        if (!matchingLocalAct) return cloudAct;

        const cloudPhotos = cloudAct.photos || [];
        const cloudPhotoIds = new Set(cloudPhotos.map((p) => p.photoId));
        const pendingLocalPhotos = (matchingLocalAct.photos || []).filter(
          (p) => p.syncStatus === 'pending' && !cloudPhotoIds.has(p.photoId)
        );

        if (pendingLocalPhotos.length === 0) return cloudAct;
        return {
          ...cloudAct,
          photos: [...pendingLocalPhotos, ...cloudPhotos],
        };
      });

      merged[dateKey] = {
        ...cloudRep,
        activities: mergedActivities,
      };
      changed = true;
      continue;
    }

    // Equal timestamps: only update if content differs and not pending local write
    if (!pendingDates.has(dateKey)) {
      const localSerialized = JSON.stringify(localRep);
      const cloudSerialized = JSON.stringify(cloudRep);
      if (localSerialized !== cloudSerialized) {
        merged[dateKey] = cloudRep;
        changed = true;
      }
    }
  }

  return { merged, changed };
}

// ==========================================
// Firestore CRUD & Sync Functions
// ==========================================

/**
 * Delete all report documents from Firestore for a specific user
 */
export async function clearAllReportsFromFirestore(userId: string): Promise<FirestoreSyncResult> {
  const path = `users/${userId}/reports`;
  try {
    const reportsCollRef = collection(db, 'users', userId, 'reports');
    const snapshot = await getDocs(reportsCollRef);
    const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
    return { success: true };
  } catch (error) {
    const { message, code } = buildFirestoreErrorInfo(error, OperationType.DELETE, path);
    return {
      success: false,
      error: `Failed to delete existing cloud reports: ${message}`,
      code,
    };
  }
}

/**
 * Save / Update User Profile in Firestore
 */
export async function saveUserProfileToFirestore(
  userId: string,
  profile: UserProfile
): Promise<FirestoreSyncResult> {
  const path = `users/${userId}`;
  const normalizedCloudinary = normalizeCloudinaryConfig(
    profile.cloudinaryCloudName,
    profile.cloudinaryUploadPreset
  );
  const cleanProfile: UserProfile = {
    employeeId: profile.employeeId || 'EMP-001',
    employeeName: profile.employeeName,
    department: profile.department,
    supervisorName: profile.supervisorName,
    companyName: profile.companyName || '',
    companyLogoUrl: profile.companyLogoUrl || '',
    cloudinaryCloudName: normalizedCloudinary.cloudName,
    cloudinaryUploadPreset: normalizedCloudinary.uploadPreset,
    offDays: profile.offDays,
    googleSheetWebAppUrl: profile.googleSheetWebAppUrl || '',
    googleSheetUrl: profile.googleSheetUrl || '',
    autoSyncGoogleSheets: Boolean(profile.autoSyncGoogleSheets),
    language: profile.language || 'en',
  };

  enqueuePendingProfileSync(cleanProfile);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      error: 'Client is offline. Profile saved locally and queued for cloud sync.',
      code: 'offline',
    };
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      {
        ...cleanProfile,
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );
    removePendingProfileSync();
    return { success: true };
  } catch (error) {
    const { message, code } = buildFirestoreErrorInfo(error, OperationType.WRITE, path);
    return {
      success: false,
      error: message,
      code,
    };
  }
}

/**
 * Subscribe to User Profile in Real-Time
 */
export function subscribeToUserProfile(
  userId: string,
  onUpdate: (profile: UserProfile) => void,
  onError?: (error: Error) => void
): () => void {
  const path = `users/${userId}`;
  const userDocRef = doc(db, 'users', userId);
  return onSnapshot(
    userDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        // Do not overwrite if a local profile edit is queued and waiting to flush
        const pendingQueue = loadPendingCloudSyncQueue();
        if (pendingQueue.userProfile && !snapshot.metadata.hasPendingWrites) {
          return;
        }

        const data = snapshot.data();
        const normalizedCloudinary = normalizeCloudinaryConfig(
          data.cloudinaryCloudName,
          data.cloudinaryUploadPreset
        );
        onUpdate({
          employeeId: data.employeeId || 'EMP-001',
          employeeName: data.employeeName || 'ROTH DARO',
          department: data.department || 'Operations',
          supervisorName: data.supervisorName || 'Operations Lead',
          companyName: data.companyName || '',
          companyLogoUrl: data.companyLogoUrl || '',
          cloudinaryCloudName: normalizedCloudinary.cloudName,
          cloudinaryUploadPreset: normalizedCloudinary.uploadPreset,
          offDays: Array.isArray(data.offDays) ? data.offDays : [1],
          googleSheetWebAppUrl: data.googleSheetWebAppUrl || '',
          googleSheetUrl: data.googleSheetUrl || '',
          autoSyncGoogleSheets: Boolean(data.autoSyncGoogleSheets),
          language: data.language || 'en',
        });
      }
    },
    (error) => {
      buildFirestoreErrorInfo(error, OperationType.GET, path);
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  );
}

/**
 * Save Schedule Templates to Firestore
 */
export async function saveTemplatesToFirestore(
  userId: string,
  templates: DefaultTimeSlotTemplate[]
): Promise<FirestoreSyncResult> {
  const path = `users/${userId}/templates/schedule`;
  enqueuePendingTemplatesSync(templates);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      error: 'Client is offline. Templates saved locally and queued for cloud sync.',
      code: 'offline',
    };
  }

  try {
    const templateDocRef = doc(db, 'users', userId, 'templates', 'schedule');
    await setDoc(templateDocRef, {
      items: templates,
      lastUpdated: new Date().toISOString(),
    });
    removePendingTemplatesSync();
    return { success: true };
  } catch (error) {
    const { message, code } = buildFirestoreErrorInfo(error, OperationType.WRITE, path);
    return {
      success: false,
      error: message,
      code,
    };
  }
}

/**
 * Subscribe to Schedule Templates in Real-Time
 */
export function subscribeToTemplates(
  userId: string,
  onUpdate: (templates: DefaultTimeSlotTemplate[]) => void,
  onError?: (error: Error) => void
): () => void {
  const path = `users/${userId}/templates/schedule`;
  const templateDocRef = doc(db, 'users', userId, 'templates', 'schedule');
  return onSnapshot(
    templateDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const pendingQueue = loadPendingCloudSyncQueue();
        if (pendingQueue.templates && !snapshot.metadata.hasPendingWrites) {
          return;
        }

        const data = snapshot.data();
        if (Array.isArray(data.items)) {
          onUpdate(data.items as DefaultTimeSlotTemplate[]);
        }
      }
    },
    (error) => {
      buildFirestoreErrorInfo(error, OperationType.GET, path);
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  );
}

/**
 * Save Day Report to Firestore
 */
export async function saveDayReportToFirestore(
  userId: string,
  report: DayReport
): Promise<FirestoreSyncResult> {
  const path = `users/${userId}/reports/${report.date}`;
  const cleanedReport = stripReportImages(report);
  const reportData: DayReport = {
    ...cleanedReport,
    lastUpdated: cleanedReport.lastUpdated || new Date().toISOString(),
  };

  try {
    const serialized = JSON.stringify(reportData);
    const sizeBytes = new TextEncoder().encode(serialized).length;
    const ONE_MIB = 1024 * 1024; // 1 MiB limit in Firestore
    if (sizeBytes > ONE_MIB) {
      const limitMsg = `[ERROR] DayReport payload size (${Math.round(sizeBytes / 1024)} KB) exceeds Firestore 1 MiB document limit (1,048,576 bytes)! Photos should be stored via Cloudinary URLs or IndexedDB offline queue.`;
      console.error(limitMsg);
      return {
        success: false,
        error: limitMsg,
        code: 'payload-too-large',
      };
    }

    // Queue before attempting network write so failed/offline writes are never lost
    enqueuePendingReportSync(reportData);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return {
        success: false,
        error: 'Client is offline. Report saved locally and queued for cloud sync.',
        code: 'offline',
      };
    }

    const reportDocRef = doc(db, 'users', userId, 'reports', report.date);
    await setDoc(reportDocRef, reportData);

    removePendingReportSync(report.date, reportData.lastUpdated);
    return { success: true };
  } catch (error) {
    const { message, code } = buildFirestoreErrorInfo(error, OperationType.WRITE, path);
    return {
      success: false,
      error: message,
      code,
    };
  }
}

/**
 * Flush all queued offline writes (profile, templates, reports) to Firestore
 */
export async function flushPendingCloudSync(userId: string): Promise<FirestoreSyncResult> {
  if (!userId) {
    return { success: false, error: 'Missing userId for cloud sync flush', code: 'unauthenticated' };
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, error: 'Client is offline', code: 'offline' };
  }

  const queue = loadPendingCloudSyncQueue();
  const partialFailures: string[] = [];

  if (queue.userProfile) {
    const profileRes = await saveUserProfileToFirestore(userId, queue.userProfile);
    if (!profileRes.success) {
      partialFailures.push(`Profile sync failed: ${profileRes.error || 'Unknown error'}`);
    }
  }

  if (queue.templates) {
    const tplRes = await saveTemplatesToFirestore(userId, queue.templates);
    if (!tplRes.success) {
      partialFailures.push(`Templates sync failed: ${tplRes.error || 'Unknown error'}`);
    }
  }

  const reportDates = Object.keys(queue.reports);
  for (const dateKey of reportDates) {
    const report = queue.reports[dateKey];
    if (!report) continue;
    const repRes = await saveDayReportToFirestore(userId, report);
    if (!repRes.success) {
      partialFailures.push(`Report (${dateKey}) sync failed: ${repRes.error || 'Unknown error'}`);
    }
  }

  return {
    success: partialFailures.length === 0,
    error: partialFailures.length > 0 ? partialFailures.join(' | ') : undefined,
    partialFailures: partialFailures.length > 0 ? partialFailures : undefined,
  };
}

/**
 * Factory reset user data in Firestore with full step tracking and partial failure reporting
 */
export async function resetAllFirestoreUserData(
  userId: string,
  freshState: AppState
): Promise<FirestoreSyncResult> {
  if (!userId) {
    return {
      success: false,
      error: 'Cannot reset cloud data: user is not authenticated.',
      code: 'unauthenticated',
    };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      error: 'Cannot reset cloud data while offline. Please reconnect and try again.',
      code: 'offline',
    };
  }

  const partialFailures: string[] = [];

  // 1. Delete all existing reports
  const clearRes = await clearAllReportsFromFirestore(userId);
  if (!clearRes.success) {
    partialFailures.push(clearRes.error || 'Failed to delete existing reports in Firestore');
  }

  // 2. Overwrite user profile
  const profileRes = await saveUserProfileToFirestore(userId, freshState.userProfile);
  if (!profileRes.success) {
    partialFailures.push(`Failed to reset user profile: ${profileRes.error || 'Unknown error'}`);
  }

  // 3. Overwrite templates
  const templateRes = await saveTemplatesToFirestore(userId, freshState.defaultSchedule);
  if (!templateRes.success) {
    partialFailures.push(`Failed to reset schedule templates: ${templateRes.error || 'Unknown error'}`);
  }

  // 4. Save clean reports
  for (const dateKey of Object.keys(freshState.reports)) {
    const repRes = await saveDayReportToFirestore(userId, freshState.reports[dateKey]);
    if (!repRes.success) {
      partialFailures.push(`Failed to save fresh report for ${dateKey}: ${repRes.error || 'Unknown error'}`);
    }
  }

  if (partialFailures.length === 0) {
    clearAllPendingCloudSync();
  }

  return {
    success: partialFailures.length === 0,
    error: partialFailures.length > 0 ? partialFailures.join(' | ') : undefined,
    partialFailures: partialFailures.length > 0 ? partialFailures : undefined,
  };
}

/**
 * Subscribe to all Day Reports in Real-Time for a User
 */
export function subscribeToReports(
  userId: string,
  onUpdate: (reportsMap: Record<string, DayReport>) => void,
  onError?: (error: Error) => void
): () => void {
  const path = `users/${userId}/reports`;
  const reportsCollRef = collection(db, 'users', userId, 'reports');
  return onSnapshot(
    reportsCollRef,
    (querySnapshot) => {
      const reportsMap: Record<string, DayReport> = {};
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.date) {
          reportsMap[data.date] = data as DayReport;
        }
      });
      onUpdate(reportsMap);
    },
    (error) => {
      buildFirestoreErrorInfo(error, OperationType.LIST, path);
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  );
}

/**
 * Seed initial default state to Firestore for a new logged-in user if empty,
 * and flush any pending offline changes without overwriting existing cloud data.
 */
export async function seedInitialFirestoreData(
  userId: string,
  initialState: AppState
): Promise<FirestoreSyncResult> {
  const path = `users/${userId}`;
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return {
        success: false,
        error: 'Client is offline during initial cloud check.',
        code: 'offline',
      };
    }

    // Flush any pending local edits queued while offline first
    if (hasPendingCloudSync()) {
      await flushPendingCloudSync(userId);
    }

    const userDocRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      const partialFailures: string[] = [];

      const profRes = await saveUserProfileToFirestore(userId, initialState.userProfile);
      if (!profRes.success && profRes.error) partialFailures.push(profRes.error);

      const tplRes = await saveTemplatesToFirestore(userId, initialState.defaultSchedule);
      if (!tplRes.success && tplRes.error) partialFailures.push(tplRes.error);

      for (const dateKey of Object.keys(initialState.reports)) {
        const repDocRef = doc(db, 'users', userId, 'reports', dateKey);
        const existingRepSnap = await getDoc(repDocRef);
        if (!existingRepSnap.exists()) {
          const repRes = await saveDayReportToFirestore(userId, initialState.reports[dateKey]);
          if (!repRes.success && repRes.error) partialFailures.push(repRes.error);
        }
      }

      return {
        success: partialFailures.length === 0,
        error: partialFailures.length > 0 ? partialFailures.join(' | ') : undefined,
        partialFailures: partialFailures.length > 0 ? partialFailures : undefined,
      };
    }

    return { success: true };
  } catch (error) {
    const { message, code } = buildFirestoreErrorInfo(error, OperationType.GET, path);
    return {
      success: false,
      error: message,
      code,
    };
  }
}
