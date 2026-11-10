import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Settings as SettingsIcon, 
  Copy, 
  Check, 
  Save, 
  Code, 
  Download, 
  Upload, 
  Building2, 
  Image as ImageIcon, 
  Trash2, 
  Cloud, 
  Loader2,
  RotateCcw,
  AlertTriangle,
  Languages
} from 'lucide-react';
import { UserProfile, AppState, Language } from '../types';
import { APPS_SCRIPT_SNIPPET } from '../utils/googleSheetsSync';
import { DAY_NAMES } from '../utils/dateUtils';
import { uploadLogoImage } from '../utils/cloudinaryUpload';
import { updatePwaManifestAndIcons } from '../utils/pwaIconUpdater';
import { TRANSLATIONS } from '../utils/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSaveProfile: (updatedProfile: UserProfile) => void;
  appState: AppState;
  onRestoreState: (state: AppState) => void;
  onResetAllData?: () => Promise<void>;
  language?: Language;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSaveProfile,
  appState,
  onRestoreState,
  onResetAllData,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [profile, setProfile] = useState<UserProfile>(userProfile);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showScriptCode, setShowScriptCode] = useState(false);
  const [showCloudinaryConfig, setShowCloudinaryConfig] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProfile(userProfile);
      setUploadStatus(null);
    }
  }, [isOpen, userProfile]);

  if (!isOpen) return null;

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(language === 'km' ? 'រូបភាព Logo ត្រូវតែតូចជាង 5MB' : 'Logo image must be smaller than 5MB.');
      return;
    }

    try {
      setIsUploadingLogo(true);
      setUploadStatus(language === 'km' ? 'កំពុងផ្ទុកឡើង និងកែសម្រួលរូបភាព...' : 'Uploading & optimizing logo...');

      const result = await uploadLogoImage(file, {
        cloudName: profile.cloudinaryCloudName,
        uploadPreset: profile.cloudinaryUploadPreset,
        apiKey: profile.cloudinaryApiKey,
        apiSecret: profile.cloudinaryApiSecret,
      });

      setProfile((prev) => ({
        ...prev,
        companyLogoUrl: result.url,
      }));

      updatePwaManifestAndIcons(result.url, profile.companyName);

      if (result.source === 'cloudinary') {
        setUploadStatus(language === 'km' ? '✓ បានផ្ទុកឡើងទៅកាន់ Cloudinary & រួចរាល់!' : '✓ Uploaded to Cloudinary & synced to Firebase!');
      } else {
        setUploadStatus(language === 'km' ? '✓ បានរក្សាទុក Logo រួចរាល់!' : '✓ Logo stored & ready to sync with Firebase!');
      }
    } catch (err: any) {
      console.error('Logo upload error:', err);
      alert(language === 'km' ? 'មិនអាចផ្ទុករូបភាពបានទេ។ សូមសាកល្បងម្ដងទៀត។' : 'Failed to process logo image. Please try another image file.');
    } finally {
      setIsUploadingLogo(false);
      setTimeout(() => setUploadStatus(null), 4000);
    }
  };

  const handleRemoveLogo = () => {
    setProfile((prev) => ({
      ...prev,
      companyLogoUrl: '',
    }));
    updatePwaManifestAndIcons('', profile.companyName);
  };

  const handleDayToggle = (dayIndex: number) => {
    setProfile((prev) => {
      const exists = prev.offDays.includes(dayIndex);
      const updated = exists
        ? prev.offDays.filter((d) => d !== dayIndex)
        : [...prev.offDays, dayIndex];
      return { ...prev, offDays: updated };
    });
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_SNIPPET);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleSave = () => {
    onSaveProfile(profile);
    onClose();
  };

  const handleExportBackup = () => {
    const jsonStr = JSON.stringify(appState, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Daily_Report_Tracker_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.reports && parsed.userProfile) {
          onRestoreState(parsed);
          alert(language === 'km' ? 'បានស្ដារទិន្នន័យដោយជោគជ័យ!' : 'Data backup successfully restored!');
          onClose();
        } else {
          alert(language === 'km' ? 'ទម្រង់ឯកសារមិនត្រឹមត្រូវទេ។' : 'Invalid backup file format.');
        }
      } catch (err) {
        alert(language === 'km' ? 'មិនអាចបើកឯកសារបម្រុងទុកបានទេ។' : 'Failed to parse backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              <span>{t.settingsTitle}</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              {t.settingsSubtitle}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1">
          
          {/* Language Switcher Setting */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Languages className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">{t.languageSetting}</h3>
                <p className="text-[11px] text-slate-500">{language === 'km' ? 'ជ្រើសរើសភាសាសម្រាប់កម្មវិធី' : 'Select preferred application display language'}</p>
              </div>
            </div>

            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setProfile((p) => ({ ...p, language: 'en' }))}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  (profile.language || 'en') === 'en'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setProfile((p) => ({ ...p, language: 'km' }))}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  profile.language === 'km'
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇰🇭 ភាសាខ្មែរ
              </button>
            </div>
          </div>

          {/* Company Branding & Logo Upload Section */}
          <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>{t.companyBranding}</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.companyNameLabel}</label>
                <input
                  type="text"
                  value={profile.companyName || ''}
                  onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                  placeholder="e.g. Acme Corporation"
                  className="w-full px-3 py-2 text-xs bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Logo Preview & Upload Trigger */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.companyLogoLabel}</label>
                
                <div className="flex items-center gap-3">
                  {profile.companyLogoUrl ? (
                    <div className="relative group">
                      <div className="w-14 h-14 rounded-2xl bg-white border-2 border-indigo-300 p-1 flex items-center justify-center overflow-hidden shadow-2xs">
                        <img
                          src={profile.companyLogoUrl}
                          alt="Company Logo Preview"
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-md transition-all cursor-pointer"
                        title="Remove Logo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 border-2 border-dashed border-indigo-300 text-indigo-600 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-2xs active:scale-95">
                      {isUploadingLogo ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>{isUploadingLogo ? (language === 'km' ? 'កំពុងដំណើរការ...' : 'Processing...') : profile.companyLogoUrl ? (language === 'km' ? 'ប្ដូររូបភាព Logo' : 'Change Logo') : (language === 'km' ? 'ផ្ទុកឡើងរូប Logo' : 'Upload Logo')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileUpload}
                        disabled={isUploadingLogo}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, SVG or WebP up to 5MB.</p>
                  </div>
                </div>

                {uploadStatus && (
                  <p className="text-[11px] font-semibold text-emerald-700 mt-2 animate-fadeIn">
                    {uploadStatus}
                  </p>
                )}
              </div>
            </div>

            {/* Cloudinary Integration settings dropdown */}
            <div className="pt-2 border-t border-indigo-100">
              <button
                type="button"
                onClick={() => setShowCloudinaryConfig(!showCloudinaryConfig)}
                className="text-xs text-indigo-700 hover:text-indigo-950 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>{showCloudinaryConfig ? 'Hide Cloudinary API Settings' : 'Cloudinary Storage Settings (Optional)'}</span>
              </button>

              {showCloudinaryConfig && (
                <div className="mt-3 p-3.5 bg-white rounded-xl border border-indigo-200 space-y-3 animate-fadeIn text-xs">
                  <p className="text-[11px] text-slate-600">
                    Configured Cloudinary account credentials for automatic cloud logo hosting:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Cloud Name</label>
                      <input
                        type="text"
                        value={profile.cloudinaryCloudName || ''}
                        onChange={(e) => setProfile({ ...profile, cloudinaryCloudName: e.target.value })}
                        placeholder="dismpss5e"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Upload Preset</label>
                      <input
                        type="text"
                        value={profile.cloudinaryUploadPreset || ''}
                        onChange={(e) => setProfile({ ...profile, cloudinaryUploadPreset: e.target.value })}
                        placeholder="REPORT"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* User Profile Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-4 h-4 text-yellow-500" />
              <span>{t.employeeInfoSection}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.employeeNameLabel}</label>
                <input
                  type="text"
                  value={profile.employeeName}
                  onChange={(e) => setProfile({ ...profile, employeeName: e.target.value })}
                  placeholder="e.g. ROTH DARO"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.departmentLabel}</label>
                <input
                  type="text"
                  value={profile.department}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                  placeholder="e.g. Operations & Platform"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.supervisorNameLabel}</label>
                <input
                  type="text"
                  value={profile.supervisorName}
                  onChange={(e) => setProfile({ ...profile, supervisorName: e.target.value })}
                  placeholder="e.g. Operations Lead"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Off Days Configuration */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.weeklyOffDays}
            </h3>
            <p className="text-xs text-slate-500">
              {t.weeklyOffDaysDesc}
            </p>

            <div className="flex flex-wrap gap-2">
              {DAY_NAMES.map((dayName, idx) => {
                const isChecked = profile.offDays.includes(idx);
                return (
                  <button
                    key={dayName}
                    type="button"
                    onClick={() => handleDayToggle(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isChecked ? '✓ ' : ''}{dayName} {idx === 1 ? (language === 'km' ? '(លំនាំដើមថ្ងៃចន្ទ)' : '(Monday Default)') : ''}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Google Sheets Web App Endpoint setup */}
          <div className="space-y-3 bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                {t.googleSheetsSyncEndpoint}
              </h3>
              <button
                type="button"
                onClick={() => setShowScriptCode(!showScriptCode)}
                className="text-xs text-amber-800 underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Code className="w-3.5 h-3.5" />
                <span>{showScriptCode ? 'Hide Code' : 'Get Apps Script Code'}</span>
              </button>
            </div>

            <p className="text-xs text-amber-800">
              {t.googleSheetsSyncDesc}
            </p>

            <input
              type="text"
              value={profile.googleSheetWebAppUrl || ''}
              onChange={(e) => setProfile({ ...profile, googleSheetWebAppUrl: e.target.value })}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />

            {showScriptCode && (
              <div className="mt-2 p-3 bg-slate-900 rounded-xl text-white text-[11px] font-mono space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400 font-bold">Google Apps Script Snippet</span>
                  <button
                    onClick={handleCopyScript}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-semibold cursor-pointer"
                  >
                    {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
                  </button>
                </div>
                <pre className="max-h-40 overflow-y-auto p-2 bg-slate-950 rounded text-slate-300 whitespace-pre-wrap">
                  {APPS_SCRIPT_SNIPPET}
                </pre>
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* Backup & Data Restore */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.dataManagement}
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportBackup}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>{t.exportJsonBackup}</span>
              </button>

              <label className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-all">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>{t.restoreJsonBackup}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Complete Factory Reset */}
          <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                  {t.resetAllDataTitle}
                </h4>
                <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                  {t.resetAllDataDesc}
                </p>
              </div>
            </div>

            {showResetConfirm ? (
              <div className="p-3 bg-white border border-rose-300 rounded-xl space-y-2 animate-fadeIn">
                <p className="text-xs font-bold text-rose-900">
                  ⚠️ {language === 'km' ? 'តើអ្នកប្រាកដទេ? រាល់ទិន្នន័យទាំងអស់នឹងត្រូវបានសម្អាតឡើងវិញ។' : 'Are you sure? All checklist usage and report data will be wiped clean for a fresh start.'}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={async () => {
                      if (onResetAllData) {
                        setIsResetting(true);
                        await onResetAllData();
                        setIsResetting(false);
                        setShowResetConfirm(false);
                        onClose();
                      }
                    }}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                  >
                    {isResetting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{language === 'km' ? 'កំពុងសម្អាត...' : 'Resetting All Data...'}</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{language === 'km' ? 'បាទ/ចាស សម្អាតទាំងអស់' : 'Yes, Reset Everything'}</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-rose-300 hover:bg-rose-100/70 text-rose-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.resetAllDataButton}</span>
              </button>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{t.saveProfile}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
