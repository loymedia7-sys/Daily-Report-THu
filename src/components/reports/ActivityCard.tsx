import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  Clock4,
  AlertTriangle,
  FileText,
  Camera,
  Edit2,
  Trash2,
  Plus,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { WorkActivity, WorkActivityPhoto, WORK_CATEGORIES, ActivityStatus } from '../../types/workReport';
import { Language } from '../../types';
import { TRANSLATIONS } from '../../utils/translations';
import { PhotoPreviewModal } from '../camera/PhotoPreviewModal';

interface ActivityCardProps {
  activity: WorkActivity;
  index: number;
  onEdit: (activity: WorkActivity) => void;
  onDelete: (activityId: string) => void;
  onAddPhotos: (activityId: string) => void;
  onUpdatePhotoDescription: (photoId: string, description: string) => void;
  onDeletePhoto: (photoId: string) => void;
  onUpdateActivityDescription?: (activityId: string, description: string) => void;
  onUpdateActivityStatus?: (activityId: string, status: ActivityStatus) => void;
  language: Language;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  index,
  onEdit,
  onDelete,
  onAddPhotos,
  onUpdatePhotoDescription,
  onDeletePhoto,
  onUpdateActivityDescription,
  onUpdateActivityStatus,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [selectedPhoto, setSelectedPhoto] = useState<WorkActivityPhoto | null>(null);

  // Local state for direct description textarea editing
  const [descText, setDescText] = useState(activity.description || '');
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  useEffect(() => {
    setDescText(activity.description || '');
  }, [activity.description]);

  const handleDescBlur = () => {
    if (descText !== activity.description && onUpdateActivityDescription) {
      onUpdateActivityDescription(activity.id, descText);
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 2000);
    }
  };

  // Match category badge styling
  const rawCat = activity.workCategory || (activity.category !== 'Other Activities' && activity.category !== 'Other' ? activity.category : null);
  const catObj = WORK_CATEGORIES.find((c) => c.id === rawCat || c.labelEn.toLowerCase() === (rawCat || '').toLowerCase());
  const categoryColor = catObj?.color || (rawCat ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-500 border-slate-200 italic');
  const categoryLabel = rawCat
    ? (language === 'km' ? catObj?.labelKm || rawCat : catObj?.labelEn || rawCat)
    : (language === 'km' ? 'មិនបានជ្រើសរើស' : 'Not Selected');

  // Status badge config
  const statusConfig: Record<ActivityStatus, { label: string; bg: string; icon: any }> = {
    completed: {
      label: t.statusCompleted,
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
    },
    in_progress: {
      label: t.statusInProgress,
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Clock4,
    },
    pending: {
      label: t.statusPending,
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock,
    },
    delayed: {
      label: t.statusDelayed,
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: AlertTriangle,
    },
  };

  const currentStatus = statusConfig[activity.status] || statusConfig.completed;
  const StatusIcon = currentStatus.icon;

  const photos: WorkActivityPhoto[] =
    activity.photos && activity.photos.length > 0
      ? activity.photos
      : activity.imageUrl
      ? [
          {
            photoId: activity.id,
            imageUrl: activity.imageUrl,
            thumbnailUrl: activity.thumbnailUrl || activity.imageUrl,
            description: activity.description,
            capturedAt: String(activity.capturedAt || ''),
            uploadedAt: String(activity.createdAt || ''),
          },
        ]
      : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Top Header Bar: Clean Category, Time, Status, Edit & Delete without cramped title */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/70">
        <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
          {/* Index badge */}
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
            #{index + 1}
          </div>

          {/* Category Badge */}
          <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${categoryColor}`}>
            {categoryLabel}
          </span>

          {/* Time Slot Badge */}
          <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs font-mono">
            <Clock size={13} className="text-indigo-500" />
            {activity.startTime} - {activity.endTime}
          </span>
        </div>

        {/* Status Badge & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${currentStatus.bg}`}>
            <StatusIcon size={12} />
            {currentStatus.label}
          </span>

          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              type="button"
              onClick={() => onEdit(activity)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Edit"
            >
              <Edit2 size={15} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(t.confirmDeleteActivity)) {
                  onDelete(activity.id);
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title={t.deleteActivity}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Card Body: Direct "ការពិពណ៌នាលម្អិតពីការងារ" Textarea */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileText size={14} className="text-indigo-600" />
              <span>{t.detailedDescription}</span>
            </label>

            {isSavedRecently && (
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 animate-fadeIn">
                <Check size={12} /> {language === 'km' ? 'បានរក្សាទុក' : 'Saved'}
              </span>
            )}
          </div>

          <textarea
            value={descText}
            onChange={(e) => setDescText(e.target.value)}
            onBlur={handleDescBlur}
            rows={3}
            placeholder={t.detailedDescriptionPlaceholder}
            className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 p-3 bg-slate-50/60 hover:bg-white focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 transition-all leading-relaxed resize-y placeholder-slate-400"
          />
        </div>

        {/* Attached Photographs Gallery */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Camera size={14} className="text-indigo-600" />
              {t.attachedPhotographs} ({photos.length})
            </span>

            <button
              type="button"
              onClick={() => onAddPhotos(activity.id)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 border border-indigo-200"
            >
              <Plus size={13} />
              {t.addPhotos}
            </button>
          </div>

          {photos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {photos.map((photo, pIdx) => (
                <div
                  key={photo.photoId}
                  onClick={() => setSelectedPhoto(photo)}
                  className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer aspect-[4/3] shadow-md"
                >
                  <img
                    src={photo.thumbnailUrl || photo.localDataUrl || photo.imageUrl}
                    alt={photo.description || 'Evidence'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                  {/* Photo Index Badge #1, #2 */}
                  <div className="absolute top-3 left-3 bg-black/85 text-white px-2.5 py-1 rounded-xl font-black text-xs font-mono border border-white/30 shadow-md">
                    #{pIdx + 1}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-xs text-white font-bold truncate">
                      {photo.description || 'Click to enlarge'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
              <ImageIcon size={20} className="mx-auto text-slate-300 mb-1" />
              {t.noPhotosYet}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox / Preview Modal */}
      <PhotoPreviewModal
        photo={selectedPhoto}
        isOpen={Boolean(selectedPhoto)}
        onClose={() => setSelectedPhoto(null)}
        onUpdateDescription={onUpdatePhotoDescription}
        onDeletePhoto={onDeletePhoto}
        language={language}
      />
    </div>
  );
};
