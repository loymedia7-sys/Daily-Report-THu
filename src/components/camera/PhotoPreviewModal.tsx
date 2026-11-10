import React, { useState } from 'react';
import { X, Trash2, Edit3, Check, Calendar, Clock, HardDrive, Download } from 'lucide-react';
import { WorkActivityPhoto } from '../../types/workReport';
import { Language } from '../../types';
import { TRANSLATIONS } from '../../utils/translations';

interface PhotoPreviewModalProps {
  photo: WorkActivityPhoto | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateDescription: (photoId: string, description: string) => void;
  onDeletePhoto: (photoId: string) => void;
  language: Language;
}

export const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({
  photo,
  isOpen,
  onClose,
  onUpdateDescription,
  onDeletePhoto,
  language,
}) => {
  if (!isOpen || !photo) return null;

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionText, setCaptionText] = useState(photo.description || '');

  const handleSaveCaption = () => {
    onUpdateDescription(photo.photoId, captionText);
    setIsEditingCaption(false);
  };

  const formattedTime = new Date(photo.capturedAt).toLocaleString(
    language === 'km' ? 'km-KH' : 'en-US',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    }
  );

  const formattedKb = photo.fileSize
    ? `${Math.round(photo.fileSize / 1024)} KB`
    : 'Optimized';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 text-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Evidence Photo
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock size={12} /> {formattedTime}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Image Body */}
        <div className="flex-1 overflow-auto bg-black flex items-center justify-center min-h-[260px] p-2">
          <img
            src={photo.localDataUrl || photo.imageUrl}
            alt={photo.description || 'Work Evidence'}
            className="max-h-[58vh] max-w-full object-contain rounded-lg"
          />
        </div>

        {/* Footer / Caption Editor */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          {isEditingCaption ? (
            <div className="space-y-2">
              <textarea
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                placeholder={t.photoCaptionPlaceholder}
                rows={2}
                className="w-full text-xs rounded-xl bg-slate-800 border border-indigo-500/50 p-2.5 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingCaption(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleSaveCaption}
                  className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1 shadow-sm"
                >
                  <Check size={14} /> {t.savePhoto}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="text-xs text-slate-300 flex-1">
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                  {t.photoCaption}:
                </span>
                {photo.description ? (
                  <p className="whitespace-pre-wrap">{photo.description}</p>
                ) : (
                  <p className="text-slate-400 italic">No description entered yet.</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setCaptionText(photo.description || '');
                  setIsEditingCaption(true);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1 transition-colors shrink-0"
              >
                <Edit3 size={13} /> Edit
              </button>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <HardDrive size={12} /> {formattedKb}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  photo.syncStatus === 'synced'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {photo.syncStatus === 'synced' ? 'Cloud Synced' : 'Saved Locally'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this evidence photograph?')) {
                    onDeletePhoto(photo.photoId);
                    onClose();
                  }
                }}
                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center gap-1 transition-colors"
                title={t.deletePhoto}
              >
                <Trash2 size={14} />
                <span>{t.deletePhoto}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
