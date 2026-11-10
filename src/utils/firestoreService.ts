import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  deleteDoc,
  onSnapshot, 
  collection, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppState, DayReport, DefaultTimeSlotTemplate, UserProfile } from '../types';

/**
 * Delete all report documents from Firestore for a specific user
 */
export async function clearAllReportsFromFirestore(userId: string): Promise<void> {
  try {
    const reportsCollRef = collection(db, 'users', userId, 'reports');
    const snapshot = await getDocs(reportsCollRef);
    const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error clearing reports from Firestore:', error);
  }
}

/**
 * Factory reset user data in Firestore
 */
export async function resetAllFirestoreUserData(
  userId: string,
  freshState: AppState
): Promise<void> {
  try {
    // 1. Delete all existing reports
    await clearAllReportsFromFirestore(userId);

    // 2. Overwrite user profile
    await saveUserProfileToFirestore(userId, freshState.userProfile);

    // 3. Overwrite templates
    await saveTemplatesToFirestore(userId, freshState.defaultSchedule);

    // 4. Save clean reports
    for (const dateKey of Object.keys(freshState.reports)) {
      await saveDayReportToFirestore(userId, freshState.reports[dateKey]);
    }
  } catch (error) {
    console.error('Error resetting all Firestore user data:', error);
  }
}

/**
 * Save / Update User Profile in Firestore
 */
export async function saveUserProfileToFirestore(userId: string, profile: UserProfile): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      ...profile,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving user profile to Firestore:', error);
  }
}

/**
 * Subscribe to User Profile in Real-Time
 */
export function subscribeToUserProfile(
  userId: string, 
  onUpdate: (profile: UserProfile) => void
): () => void {
  const userDocRef = doc(db, 'users', userId);
  return onSnapshot(userDocRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      onUpdate({
        employeeName: data.employeeName || 'ROTH DARO',
        department: data.department || 'Operations',
        supervisorName: data.supervisorName || 'Operations Lead',
        companyName: data.companyName || '',
        companyLogoUrl: data.companyLogoUrl || '',
        cloudinaryCloudName: data.cloudinaryCloudName || 'dismpss5e',
        cloudinaryUploadPreset: data.cloudinaryUploadPreset || 'REPORT',
        cloudinaryApiKey: data.cloudinaryApiKey || '335545523274868',
        cloudinaryApiSecret: data.cloudinaryApiSecret || 'TMe5NO5FXq9H54J7O_XhBNex9AM',
        offDays: data.offDays || [1],
        googleSheetWebAppUrl: data.googleSheetWebAppUrl || '',
        autoSyncGoogleSheets: data.autoSyncGoogleSheets || false,
        language: data.language || 'en',
      });
    }
  }, (error) => {
    console.error('Error in user profile listener:', error);
  });
}

/**
 * Save Schedule Templates to Firestore
 */
export async function saveTemplatesToFirestore(
  userId: string, 
  templates: DefaultTimeSlotTemplate[]
): Promise<void> {
  try {
    const templateDocRef = doc(db, 'users', userId, 'templates', 'schedule');
    await setDoc(templateDocRef, {
      items: templates,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving templates to Firestore:', error);
  }
}

/**
 * Subscribe to Schedule Templates in Real-Time
 */
export function subscribeToTemplates(
  userId: string, 
  onUpdate: (templates: DefaultTimeSlotTemplate[]) => void
): () => void {
  const templateDocRef = doc(db, 'users', userId, 'templates', 'schedule');
  return onSnapshot(templateDocRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (Array.isArray(data.items)) {
        onUpdate(data.items as DefaultTimeSlotTemplate[]);
      }
    }
  }, (error) => {
    console.error('Error in templates listener:', error);
  });
}

/**
 * Save Day Report to Firestore
 */
export async function saveDayReportToFirestore(
  userId: string, 
  report: DayReport
): Promise<void> {
  try {
    const reportDocRef = doc(db, 'users', userId, 'reports', report.date);
    await setDoc(reportDocRef, {
      ...report,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error saving report for ${report.date} to Firestore:`, error);
  }
}

/**
 * Subscribe to all Day Reports in Real-Time for a User
 */
export function subscribeToReports(
  userId: string,
  onUpdate: (reportsMap: Record<string, DayReport>) => void
): () => void {
  const reportsCollRef = collection(db, 'users', userId, 'reports');
  return onSnapshot(reportsCollRef, (querySnapshot) => {
    const reportsMap: Record<string, DayReport> = {};
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.date) {
        reportsMap[data.date] = data as DayReport;
      }
    });
    onUpdate(reportsMap);
  }, (error) => {
    console.error('Error in reports collection listener:', error);
  });
}

/**
 * Seed initial default state to Firestore for a new logged-in user if empty
 */
export async function seedInitialFirestoreData(
  userId: string, 
  initialState: AppState
): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      // First time user: seed user profile
      await saveUserProfileToFirestore(userId, initialState.userProfile);
      // Seed default schedule template
      await saveTemplatesToFirestore(userId, initialState.defaultSchedule);
      // Seed initial sample reports
      for (const dateKey of Object.keys(initialState.reports)) {
        await saveDayReportToFirestore(userId, initialState.reports[dateKey]);
      }
    }
  } catch (error) {
    console.error('Error seeding initial Firestore data:', error);
  }
}
