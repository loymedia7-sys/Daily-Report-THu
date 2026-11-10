import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  RotateCw,
  Image as ImageIcon,
  Check,
  Trash2,
  AlertCircle,
  X,
  Sparkles,
  Layers,
  ArrowLeft,
  Upload,
  Calendar,
  Clock,
  ChevronDown,
  Tag,
  FileText,
  RefreshCw,
  Edit3
} from 'lucide-react';
import { WorkActivity, WorkCategory, WORK_CATEGORIES, WorkActivityPhoto } from '../../types/workReport';
import { DayReport, Language, UserProfile } from '../../types';
import { TRANSLATIONS } from '../../utils/translations';
import { processAndUploadWorkPhoto } from '../../utils/imageUploadService';

interface WorkCameraProps {
  report: DayReport;
  userProfile: UserProfile;
  selectedDate: string;
  onSaveRecord?: (record: WorkActivity) => void;
  onDeleteRecord?: (recordId: string) => void;
  onSavePhotoToActivity?: (activityId: string, photo: WorkActivityPhoto) => void;
  onSavePhotoToTodayVault?: (photo: WorkActivityPhoto) => void;
  onBackToDashboard?: () => void;
  language: Language;
}

export const WorkCamera: React.FC<WorkCameraProps> = ({
  report,
  userProfile,
  selectedDate,
  onSaveRecord,
  onDeleteRecord,
  onSavePhotoToActivity,
  onSavePhotoToTodayVault,
  onBackToDashboard,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Stream & Hardware States
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Workflow State:
  // Step 1: Captured photo in temporary state (pending confirmation)
  // Step 2 & 3: Work Category selection
  // Step 4: Work Description textarea
  // Step 5: Save or Retake
  const [pendingPhotoDataUrl, setPendingPhotoDataUrl] = useState<string | null>(null);
  const [pendingCapturedAt, setPendingCapturedAt] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(''); // empty string = skip / not selected
  const [workDescription, setWorkDescription] = useState<string>('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Preview / Editing modal for existing saved photos in gallery
  const [editingRecord, setEditingRecord] = useState<WorkActivity | null>(null);
  const [editCategory, setEditCategory] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');

  // Start Camera Stream (rear camera by default)
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported on this browser or connection is not secure (HTTPS).');
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Camera access issue:', err);
      setCameraError('Camera access was not granted or device camera is busy. You can use the gallery file uploader below.');
    }
  }, [stream]);

  // Boot camera on mount
  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Flip Camera (Front / Rear)
  const handleToggleCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
  };

  // Step 1: Capture Photo from Canvas Stream
  const handleCaptureShutter = async () => {
    if (!videoRef.current || isProcessing) return;

    try {
      setIsCapturing(true);
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle front camera mirroring
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Flash feedback animation
      setTimeout(() => setIsCapturing(false), 200);

      const capturedAt = new Date().toISOString();
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      // Transition to Step 2, 3, 4: Category & Description confirmation screen
      setPendingPhotoDataUrl(dataUrl);
      setPendingCapturedAt(capturedAt);
      setSelectedCategory(''); // Default skipped / unselected
      setWorkDescription('');
    } catch (err) {
      console.error('Error capturing photo:', err);
      setIsCapturing(false);
    }
  };

  // Step 1 (Alternative): Pick image from gallery
  const handleGalleryFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setPendingPhotoDataUrl(dataUrl);
          setPendingCapturedAt(new Date().toISOString());
          setSelectedCategory('');
          setWorkDescription('');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error reading gallery file:', err);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Step 5: Retake Photo (Discard and return to camera)
  const handleRetakePhoto = () => {
    setPendingPhotoDataUrl(null);
    setPendingCapturedAt('');
    setSelectedCategory('');
    setWorkDescription('');
  };

  // Step 5: Save Work Evidence (1 Photo = 1 Work Record)
  const handleSaveWorkEvidence = async () => {
    if (!pendingPhotoDataUrl || isProcessing) return;

    setIsProcessing(true);
    try {
      // 1. Compress & Upload photo
      const photo = await processAndUploadWorkPhoto(pendingPhotoDataUrl, {
        description: workDescription.trim() || selectedCategory || 'Work Evidence Photo',
        capturedAt: pendingCapturedAt || new Date().toISOString(),
        date: selectedDate,
        cloudName: userProfile.cloudinaryCloudName,
        uploadPreset: userProfile.cloudinaryUploadPreset,
      });

      // 2. Format times
      const now = new Date();
      const startH = String(now.getHours()).padStart(2, '0');
      const startM = String(now.getMinutes()).padStart(2, '0');
      const endH = String((now.getHours() + 1) % 24).padStart(2, '0');
      const startTime = `${startH}:${startM}`;
      const endTime = `${endH}:${startM}`;

      // 3. Determine title according to Section 4 rules:
      // activityTitle = selected category when a category is selected.
      // If category is skipped, use a suitable title from the custom description.
      const cleanDesc = workDescription.trim();
      const firstLine = cleanDesc.split('\n')[0]?.trim();
      let activityTitle = '';
      if (selectedCategory) {
        activityTitle = selectedCategory;
      } else if (firstLine) {
        activityTitle = firstLine.length > 70 ? firstLine.slice(0, 67) + '...' : firstLine;
      } else {
        activityTitle = language === 'km' ? 'ភស្តុតាងការងារ' : 'Work Record';
      }

      // 4. Construct the One Photo = One Work Record
      const recordId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newRecord: WorkActivity = {
        id: recordId,
        reportDate: selectedDate,
        date: selectedDate,
        employeeId: userProfile.employeeId || 'EMP-001',
        employeeName: userProfile.employeeName || 'ROTH DARO',
        imageUrl: photo.imageUrl,
        thumbnailUrl: photo.thumbnailUrl,
        workCategory: selectedCategory ? selectedCategory : null,
        category: selectedCategory || 'Other',
        activityTitle,
        title: activityTitle,
        description: cleanDesc,
        capturedAt: pendingCapturedAt || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdTimestamp: Date.now(),
        startTime,
        endTime,
        status: 'completed',
        photos: [photo],
      };

      // 5. Save to Application State & Firestore
      let localSuccess = true;
      if (onSaveRecord) {
        const res = await onSaveRecord(newRecord);
        if (res === false) localSuccess = false;
      } else if (onSavePhotoToTodayVault) {
        const res = await onSavePhotoToTodayVault(photo);
        if (res === false) localSuccess = false;
      }

      // 6. Reset capture state & show brief success toast only if local save succeeded
      if (localSuccess !== false) {
        setPendingPhotoDataUrl(null);
        setPendingCapturedAt('');
        setSelectedCategory('');
        setWorkDescription('');

        setSaveSuccessNotice(t.savedWorkEvidenceSuccess);
        setTimeout(() => setSaveSuccessNotice(null), 3000);
      } else {
        setSaveSuccessNotice(t.storageFullWarning);
        setTimeout(() => setSaveSuccessNotice(null), 4000);
      }
    } catch (err) {
      console.error('Error saving work evidence record:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Saved records list for today
  const existingActivities = report.activities || [];

  // Edit existing record modal
  const handleOpenEditRecord = (rec: WorkActivity) => {
    setEditingRecord(rec);
    setEditCategory(rec.workCategory || rec.category || '');
    setEditDescription(rec.description || '');
  };

  const handleSaveEditRecord = () => {
    if (!editingRecord || !onSaveRecord) return;
    const cleanDesc = editDescription.trim();
    const firstLine = cleanDesc.split('\n')[0]?.trim();
    const actTitle = editCategory
      ? editCategory
      : (firstLine || (language === 'km' ? 'ភស្តុតាងការងារ' : 'Work Record'));

    const updated: WorkActivity = {
      ...editingRecord,
      workCategory: editCategory ? editCategory : null,
      category: editCategory || 'Other',
      activityTitle: actTitle,
      title: actTitle,
      description: cleanDesc,
      updatedAt: new Date().toISOString(),
    };

    onSaveRecord(updated);
    setEditingRecord(null);
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm(t.confirmDeleteActivity)) {
      if (onDeleteRecord) {
        onDeleteRecord(id);
      }
      if (editingRecord?.id === id) {
        setEditingRecord(null);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-battambang pb-24 md:pb-8">
      {/* Top Header Bar */}
      <div className="p-4 bg-white/90 backdrop-blur border-b border-slate-200 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="font-bold text-sm sm:text-base flex items-center gap-2 text-slate-900">
              <Camera size={18} className="text-blue-600" />
              {t.cameraNav}
            </h1>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Calendar size={12} className="text-slate-400" />
              <span>{selectedDate}</span>
              <span className="text-slate-300">•</span>
              <span className="text-blue-600 font-medium">
                {facingMode === 'environment' ? t.rearCameraActive : t.frontCameraActive}
              </span>
            </div>
          </div>
        </div>

        {/* Camera switch button */}
        {!pendingPhotoDataUrl && (
          <button
            onClick={handleToggleCamera}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs flex items-center gap-1.5 transition-colors border border-slate-200 font-semibold"
            title={t.switchCamera}
          >
            <RotateCw size={14} className="text-blue-600" />
            <span className="hidden sm:inline">{t.switchCamera}</span>
          </button>
        )}
      </div>

      {/* Success Notification Banner */}
      {saveSuccessNotice && (
        <div className="bg-emerald-600 text-white text-xs font-bold py-2.5 px-4 text-center flex items-center justify-center gap-2 animate-fadeIn shadow-md">
          <Check size={16} />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-start p-3 sm:p-5 relative max-w-2xl mx-auto w-full space-y-4">
        {/* ========================================================= */}
        {/* STAGE A: PHOTO CONFIRMATION & WORK RECORD CREATION (STEPS 2-5) */}
        {/* ========================================================= */}
        {pendingPhotoDataUrl ? (
          <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-md space-y-4 animate-fadeIn">
            {/* Captured Photo Preview */}
            <div className="relative aspect-[4/3] sm:aspect-[16/9] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center">
              <img
                src={pendingPhotoDataUrl}
                alt="Captured Evidence"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] text-slate-700 flex items-center gap-1.5 border border-slate-200 font-mono shadow-xs">
                <Clock size={11} className="text-blue-600" />
                <span>{new Date(pendingCapturedAt).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Step 2 & 3: Work Category (ផ្នែកការងារ) Dropdown */}
            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 text-blue-600">
                  <Tag size={14} />
                  {t.workCategoryLabel}
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  {language === 'km' ? '(អាចរំលងបាន / Optional)' : '(Optional)'}
                </span>
              </label>

              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-300 py-3 pl-3 pr-10 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all"
                >
                  <option value="" className="text-slate-400">
                    {t.skipCategoryOption}
                  </option>
                  {WORK_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id} className="text-slate-900">
                      {language === 'km' ? cat.displayKm : `${cat.order}. ${cat.labelEn}`}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>

              {selectedCategory && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                  <Check size={12} />
                  <span>
                    {language === 'km'
                      ? `បានជ្រើសរើស៖ ${selectedCategory}`
                      : `Selected: ${selectedCategory}`}
                  </span>
                </div>
              )}
            </div>

            {/* Step 4: ពិពណ៌នាការងារ (Work Description) Textarea */}
            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5 text-blue-600">
                <FileText size={14} />
                {t.workDescriptionLabel}
              </label>

              <textarea
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                placeholder={t.workDescriptionPlaceholder}
                rows={4}
                autoFocus
                className="w-full text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-300 p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all leading-relaxed placeholder-slate-400 resize-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                {language === 'km'
                  ? 'រៀបរាប់ពីអ្វីដែលបានបំពេញរួចរាល់ ឧបករណ៍ប្រើប្រាស់ និងលទ្ធផលការងារ'
                  : 'Explain what you completed, tools used, or task outcome in your own words'}
              </p>
            </div>

            {/* Step 5: Save Work Evidence & Retake Photo Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleRetakePhoto}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all border border-slate-300"
              >
                <RotateCw size={15} />
                {t.retakePhoto}
              </button>

              <button
                type="button"
                onClick={handleSaveWorkEvidence}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Processing HD Evidence...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    {t.saveWorkEvidence}
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* STAGE B: LIVE CAMERA VIEWPORT & SHUTTER CONTROLS */
          /* ========================================================= */
          <>
            {cameraError ? (
              <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 my-auto">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <AlertCircle size={26} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">{t.cameraPermissionDenied}</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">{t.cameraPermissionHint}</p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs inline-flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                  >
                    <Upload size={16} />
                    {t.uploadGallery}
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center">
                {/* Live Video */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />

                {/* Shutter Flash Animation */}
                {isCapturing && (
                  <div className="absolute inset-0 bg-white opacity-80 animate-ping pointer-events-none" />
                )}

                {/* Viewfinder crosshairs / guide */}
                <div className="absolute inset-4 sm:inset-6 border border-white/20 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between text-[10px] text-white/60 tracking-wider font-mono">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      LIVE ● HD 1080P
                    </span>
                    <span>{facingMode === 'environment' ? 'REAR' : 'FRONT'}</span>
                  </div>
                  <div className="flex justify-center text-xs text-white/70 font-medium bg-black/40 backdrop-blur-xs py-0.5 px-3 rounded-full self-center">
                    <span>{selectedDate}</span>
                  </div>
                </div>

                {/* Processing Spinner */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold text-slate-200">Preparing Evidence...</span>
                  </div>
                )}
              </div>
            )}

            {/* Shutter & Action Controls */}
            <div className="w-full flex items-center justify-around py-4 px-4 bg-slate-900/60 rounded-2xl border border-slate-800/80">
              {/* Gallery Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-transform active:scale-95 border border-slate-700 shadow-md"
                title={t.uploadGallery}
              >
                <ImageIcon size={22} className="text-indigo-400" />
              </button>

              {/* Big Shutter Button */}
              <button
                type="button"
                onClick={handleCaptureShutter}
                disabled={isProcessing}
                className="w-20 h-20 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-xl shadow-white/20 ring-4 ring-slate-800 hover:ring-indigo-500 transition-all active:scale-90 disabled:opacity-50"
                aria-label="Capture Photo"
              >
                <div className="w-16 h-16 rounded-full border-4 border-slate-900 bg-white flex items-center justify-center">
                  <Camera size={26} className="text-indigo-600" />
                </div>
              </button>

              {/* Switch Camera */}
              <button
                type="button"
                onClick={handleToggleCamera}
                className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-transform active:scale-95 border border-slate-700 shadow-md"
                title={t.switchCamera}
              >
                <RotateCw size={20} className="text-slate-300" />
              </button>
            </div>

            {/* Hidden File Input for Phone Gallery */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleGalleryFileSelect}
            />
          </>
        )}

        {/* ========================================================= */}
        {/* STAGE C: CAPTURED PHOTO GALLERY (ONE PHOTO = ONE RECORD) */}
        {/* ========================================================= */}
        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Layers size={15} className="text-indigo-400" />
              {t.photoRecordGallery} ({existingActivities.length})
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {selectedDate}
            </span>
          </div>

          {existingActivities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {existingActivities.map((rec, idx) => {
                const photoSrc =
                  rec.imageUrl ||
                  rec.thumbnailUrl ||
                  (rec.photos && rec.photos.length > 0 ? (rec.photos[0].thumbnailUrl || rec.photos[0].imageUrl) : '');

                const categoryText = rec.workCategory || rec.category;
                const isSkipped = !rec.workCategory || rec.workCategory === 'Other' || !rec.workCategory;

                return (
                  <div
                    key={rec.id}
                    onClick={() => handleOpenEditRecord(rec)}
                    className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 transition-all flex items-start gap-3 cursor-pointer group shadow-xs"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-black border border-slate-700 shrink-0">
                      {photoSrc ? (
                        <img
                          src={photoSrc}
                          alt={rec.description || 'Evidence'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <ImageIcon size={20} />
                        </div>
                      )}
                      <div className="absolute top-0.5 left-0.5 bg-black/80 text-white font-mono text-[9px] px-1 rounded">
                        #{idx + 1}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Work Category Badge */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {categoryText && categoryText !== 'Other' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {categoryText}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 border border-slate-600 italic">
                            {t.notSelected}
                          </span>
                        )}

                        {/* Saved Status Indicator */}
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Check size={9} />
                          {t.savedStatus}
                        </span>
                      </div>

                      {/* Work Description */}
                      <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                        {rec.description || rec.activityTitle || (language === 'km' ? 'មិនមានការពិពណ៌នា' : 'No description provided')}
                      </p>

                      {/* Capture time */}
                      <div className="text-[10px] text-slate-500 font-mono">
                        {rec.capturedAt ? new Date(rec.capturedAt).toLocaleTimeString() : rec.startTime}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditRecord(rec);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-700/60 transition-colors"
                        title="Edit Record"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRecord(rec.id);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
              <Camera size={26} className="mx-auto text-slate-600" />
              <p className="text-xs text-slate-400">
                {language === 'km'
                  ? 'មិនទាន់មានរូបភាពភស្តុតាងសម្រាប់ថ្ងៃនេះនៅឡើយទេ។ ចុចប៊ូតុងកាមេរ៉ាខាងលើដើម្បីថត។'
                  : 'No evidence photos taken yet for today. Use the shutter button above to capture work evidence.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* EDIT RECORD MODAL */}
      {/* ========================================================= */}
      {editingRecord && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
          onClick={() => setEditingRecord(null)}
        >
          <div
            className="bg-slate-900 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-800 text-white p-4 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2 text-indigo-300">
                <Edit3 size={16} />
                {language === 'km' ? 'កែសម្រួលភស្តុតាងការងារ' : 'Edit Work Evidence Record'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {/* Photo preview */}
            <div className="w-full h-44 rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
              <img
                src={editingRecord.imageUrl || editingRecord.thumbnailUrl || (editingRecord.photos?.[0]?.imageUrl ?? '')}
                alt={editingRecord.description}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Work Category Dropdown */}
            <div>
              <label className="text-xs font-bold text-slate-200 block mb-1.5 text-indigo-300">
                {t.workCategoryLabel}
              </label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full text-xs sm:text-sm rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">{t.skipCategoryOption}</option>
                {WORK_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {language === 'km' ? c.displayKm : `${c.order}. ${c.labelEn}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Work Description Textarea */}
            <div>
              <label className="text-xs font-bold text-slate-200 block mb-1.5 text-indigo-300">
                {t.workDescriptionLabel}
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                placeholder={t.workDescriptionPlaceholder}
                className="w-full text-xs sm:text-sm rounded-xl bg-slate-800 border border-slate-700 p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleDeleteRecord(editingRecord.id)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 border border-rose-900/40 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 size={14} />
                {t.deleteActivity}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditRecord}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
                >
                  <Check size={15} />
                  {t.saveActivity}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
