import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  Camera,
  Upload,
  Clock,
  Sparkles,
  Trash2,
  Image as ImageIcon,
  Tag
} from 'lucide-react';
import { WorkActivity, WorkActivityPhoto, WORK_CATEGORIES, ActivityStatus } from '../../types/workReport';
import { Language, UserProfile } from '../../types';
import { TRANSLATIONS } from '../../utils/translations';
import { processAndUploadWorkPhoto } from '../../utils/imageUploadService';
import { saveActivityDraft, loadActivityDraft, clearActivityDraft } from '../../utils/workEvidenceService';

interface ActivityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: WorkActivity) => void;
  initialActivity?: WorkActivity | null;
  date: string;
  userProfile: UserProfile;
  language: Language;
}

export const ActivityForm: React.FC<ActivityFormProps> = ({
  isOpen,
  onClose,
  onSave,
  initialActivity,
  date,
  userProfile,
  language,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [category, setCategory] = useState<string>(initialActivity?.category || 'Graphic Design');
  const [title, setTitle] = useState<string>(initialActivity?.title || '');
  const [description, setDescription] = useState<string>(initialActivity?.description || '');
  const [startTime, setStartTime] = useState<string>(initialActivity?.startTime || '08:00');
  const [endTime, setEndTime] = useState<string>(initialActivity?.endTime || '09:30');
  const [status, setStatus] = useState<ActivityStatus>(initialActivity?.status || 'completed');
  const [photos, setPhotos] = useState<WorkActivityPhoto[]>(initialActivity?.photos || []);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Restore draft if creating a new activity and draft exists
  useEffect(() => {
    if (!initialActivity) {
      const draft = loadActivityDraft(date);
      if (draft) {
        if (draft.category) setCategory(draft.category);
        if (draft.title) setTitle(draft.title);
        if (draft.description) setDescription(draft.description);
        if (draft.startTime) setStartTime(draft.startTime);
        if (draft.endTime) setEndTime(draft.endTime);
        if (draft.status) setStatus(draft.status as ActivityStatus);
      }
    }
  }, [initialActivity, date]);

  // Auto-save draft as user edits
  useEffect(() => {
    if (!initialActivity && (title || description)) {
      saveActivityDraft(date, {
        category,
        title,
        description,
        startTime,
        endTime,
        status,
      });
    }
  }, [category, title, description, startTime, endTime, status, initialActivity, date]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanDesc = description.trim();
    const firstLine = cleanDesc.split('\n')[0].trim();
    const computedTitle = category ? category : (firstLine ? (firstLine.length > 70 ? firstLine.slice(0, 67) + '...' : firstLine) : (language === 'km' ? 'ភស្តុតាងការងារ' : 'Work Record'));

    const activityToSave: WorkActivity = {
      id: initialActivity?.id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      reportDate: date,
      date,
      employeeId: userProfile.employeeId || 'EMP-001',
      employeeName: userProfile.employeeName || 'ROTH DARO',
      imageUrl: photos[0]?.imageUrl || initialActivity?.imageUrl || '',
      thumbnailUrl: photos[0]?.thumbnailUrl || initialActivity?.thumbnailUrl || '',
      workCategory: category ? category : null,
      category: category || 'Other',
      activityTitle: computedTitle,
      title: computedTitle,
      description: cleanDesc,
      startTime,
      endTime,
      status,
      photos,
      capturedAt: initialActivity?.capturedAt || new Date().toISOString(),
      createdTimestamp: initialActivity?.createdTimestamp || Date.now(),
      createdAt: initialActivity?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(activityToSave);
    clearActivityDraft(date);
    onClose();
  };

  const handleAttachPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const fileList = Array.from(files) as File[];
      for (const file of fileList) {
        const photo = await processAndUploadWorkPhoto(file, {
          description: file.name,
          capturedAt: new Date().toISOString(),
          date,
          activityId: initialActivity?.id,
          cloudName: userProfile.cloudinaryCloudName,
          uploadPreset: userProfile.cloudinaryUploadPreset,
        });
        setPhotos((prev) => [...prev, photo]);
      }
    } catch (err) {
      console.error('Error uploading photo to activity:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.photoId !== photoId));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600" />
              {initialActivity ? t.editActivityTitle : t.addActivityTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {date} • {userProfile.employeeName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Work Category */}
          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5">
                <Tag size={14} className="text-indigo-600" />
                {t.workCategoryLabel}
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                {language === 'km' ? '(អាចរំលងបាន / Optional)' : '(Optional)'}
              </span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="">{t.skipCategoryOption}</option>
              {WORK_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {language === 'km' ? cat.displayKm : `${cat.order}. ${cat.labelEn}`}
                </option>
              ))}
            </select>
          </div>

          {/* Primary: Detailed Description Textarea (ការពិពណ៌នាលម្អិតពីការងារ) */}
          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5">
                <Tag size={14} className="text-indigo-600" />
                {t.detailedDescription} <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                {language === 'km' ? 'សរសេរការងារលម្អិត' : 'Enter work details'}
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.detailedDescriptionPlaceholder}
              rows={5}
              required
              autoFocus
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all leading-relaxed placeholder-slate-400 text-slate-900"
            />
          </div>

          {/* Time Slot (Start & End Time) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1 mb-1.5">
                <Clock size={13} className="text-slate-500" />
                {t.startTime}
              </label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="08:00"
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center font-mono font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1 mb-1.5">
                <Clock size={13} className="text-slate-500" />
                {t.endTime}
              </label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="09:30"
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center font-mono font-medium"
              />
            </div>
          </div>

          {/* Work Status */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              {t.workStatus}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'completed', label: t.statusCompleted, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
                  { id: 'in_progress', label: t.statusInProgress, color: 'text-blue-700 bg-blue-50 border-blue-300' },
                  { id: 'pending', label: t.statusPending, color: 'text-amber-700 bg-amber-50 border-amber-300' },
                  { id: 'delayed', label: t.statusDelayed, color: 'text-rose-700 bg-rose-50 border-rose-300' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatus(s.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                    status === s.id
                      ? `${s.color} ring-2 ring-indigo-500 shadow-xs font-bold`
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Evidence Photo Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Camera size={14} className="text-indigo-600" />
                {t.attachedPhotographs} ({photos.length})
              </label>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Upload size={13} />
                {isUploading ? 'Compressing...' : t.addPhotos}
              </button>
            </div>

            {photos.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {photos.map((photo) => (
                  <div
                    key={photo.photoId}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square shadow-xs"
                  >
                    <img
                      src={photo.thumbnailUrl || photo.localDataUrl || photo.imageUrl}
                      alt={photo.description || 'Evidence'}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.photoId)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-90 hover:opacity-100 shadow-sm transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer text-center transition-colors"
              >
                <ImageIcon size={22} className="mx-auto text-slate-400 mb-1" />
                <p className="text-xs font-medium text-slate-600">
                  {language === 'km' ? 'ចុចទីនេះដើម្បីភ្ជាប់រូបភាពភស្តុតាង' : 'Click to attach evidence photographs'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  JPG, PNG, HEIC up to 10MB (automatically compressed)
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleAttachPhotos}
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Check size={16} />
              {t.saveActivity}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
