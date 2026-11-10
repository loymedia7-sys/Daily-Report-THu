export type WorkCategory =
  | 'Design Poster'
  | 'Check Platform'
  | 'Reply Customer'
  | 'Post Page'
  | 'Edit Video'
  | 'Take Video'
  | 'Write Script'
  | 'Find Element'
  | 'Do Research'
  | 'Other'
  // Legacy categories retained for backward compatibility with existing saved reports
  | 'Graphic Design'
  | 'Poster Design'
  | 'Video Editing'
  | 'Facebook Page Management'
  | 'Telegram Management'
  | 'Social Media Posting'
  | 'Caption Writing'
  | 'Customer Support'
  | 'Page Performance Checking'
  | 'Other Activities';

export interface WorkCategoryItem {
  id: string;
  order: number;
  labelEn: string;
  labelKm: string;
  displayKm: string;
  color: string;
}

export const WORK_CATEGORIES: WorkCategoryItem[] = [
  {
    id: 'Design Poster',
    order: 1,
    labelEn: 'Design Poster',
    labelKm: 'រចនាប័ទ្មផ្ទាំងផ្សព្វផ្សាយ',
    displayKm: '1. Design Poster — រចនាប័ទ្មផ្ទាំងផ្សព្វផ្សាយ',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    id: 'Check Platform',
    order: 2,
    labelEn: 'Check Platform',
    labelKm: 'ពិនិត្យមើលវេទិកាអនឡាញ',
    displayKm: '2. Check Platform — ពិនិត្យមើលវេទិកាអនឡាញ',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  },
  {
    id: 'Reply Customer',
    order: 3,
    labelEn: 'Reply Customer',
    labelKm: 'ឆ្លើយតបអតិថិជន',
    displayKm: '3. Reply Customer — ឆ្លើយតបអតិថិជន',
    color: 'bg-teal-100 text-teal-800 border-teal-200',
  },
  {
    id: 'Post Page',
    order: 4,
    labelEn: 'Post Page',
    labelKm: 'បង្ហោះលើផេក',
    displayKm: '4. Post Page — បង្ហោះលើផេក',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    id: 'Edit Video',
    order: 5,
    labelEn: 'Edit Video',
    labelKm: 'កាត់តវីដេអូ',
    displayKm: '5. Edit Video — កាត់តវីដេអូ',
    color: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  {
    id: 'Take Video',
    order: 6,
    labelEn: 'Take Video',
    labelKm: 'ថតវីដេអូ',
    displayKm: '6. Take Video — ថតវីដេអូ',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: 'Write Script',
    order: 7,
    labelEn: 'Write Script',
    labelKm: 'សរសេរស្គ្រីប',
    displayKm: '7. Write Script — សរសេរស្គ្រីប',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    id: 'Find Element',
    order: 8,
    labelEn: 'Find Element',
    labelKm: 'ស្វែងរកធាតុរចនា',
    displayKm: '8. Find Element — ស្វែងរកធាតុរចនា',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    id: 'Do Research',
    order: 9,
    labelEn: 'Do Research',
    labelKm: 'ស្រាវជ្រាវ',
    displayKm: '9. Do Research — ស្រាវជ្រាវ',
    color: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  {
    id: 'Other',
    order: 10,
    labelEn: 'Other',
    labelKm: 'ផ្សេងៗ',
    displayKm: '10. Other — ផ្សេងៗ',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
  },
];

export type ActivityStatus = 'completed' | 'in_progress' | 'pending' | 'delayed';

export interface WorkActivityPhoto {
  photoId: string;
  imageUrl: string; // Cloudinary secure_url or local base64/blob
  thumbnailUrl?: string;
  description?: string;
  capturedAt: string; // ISO string or human formatted
  uploadedAt: string;
  fileSize?: number;
  syncStatus?: 'synced' | 'pending' | 'failed';
  localDataUrl?: string; // Cache for offline viewing
}

/**
 * Work Activity Record (One Photo = One Work Record)
 * Fulfills Section 4 data structure requirement while maintaining full
 * backward compatibility with existing report views.
 */
export interface WorkActivity {
  id: string;
  reportDate: string; // YYYY-MM-DD
  date: string; // Alias for reportDate
  employeeId: string;
  employeeName: string;
  imageUrl: string;
  thumbnailUrl: string;
  workCategory: string | null;
  category: string; // Alias for workCategory (or 'Other')
  activityTitle: string;
  title: string; // Alias for activityTitle
  description: string;
  capturedAt: string | number;
  createdAt: string | number;
  createdTimestamp: number;
  updatedAt?: string;
  startTime?: string;
  endTime?: string;
  status: ActivityStatus;
  photos: WorkActivityPhoto[];
}

export type MainNavView =
  | 'dashboard'
  | 'schedule'
  | 'camera'
  | 'reports'
  | 'history'
  | 'export'
  | 'settings';
