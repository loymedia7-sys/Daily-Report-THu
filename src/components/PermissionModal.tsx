import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, CheckCircle2, UserX, HeartPulse, FileText, Trash2 } from 'lucide-react';
import { Language, TRANSLATIONS } from '../utils/translations';
import { DayReport } from '../types';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: DayReport;
  onSavePermission: (permissionData: {
    isPermission: boolean;
    permissionType: string;
    permissionReason: string;
    isAbsent?: boolean;
    absentReason?: string;
  }) => void;
  onRemovePermission: () => void;
  language?: Language;
}

const PRESET_PERMISSION_REASONS = [
  'sick can go need to rest and sleep',
  'Severe headache & fever, resting at home',
  'Medical appointment & checkup with doctor',
  'Urgent family business / emergency leave',
  'Approved personal day off',
];

export const PermissionModal: React.FC<PermissionModalProps> = ({
  isOpen,
  onClose,
  report,
  onSavePermission,
  onRemovePermission,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const [permissionType, setPermissionType] = useState<'P' | 'Sick Leave' | 'Personal Leave' | 'Absent'>(
    (report.permissionType as any) || 'P'
  );
  const [permissionReason, setPermissionReason] = useState(
    report.permissionReason || (language === 'km' ? 'sick can go need to rest and sleep' : 'sick can go need to rest and sleep')
  );

  useEffect(() => {
    if (isOpen) {
      setPermissionType((report.permissionType as any) || 'P');
      setPermissionReason(report.permissionReason || 'sick can go need to rest and sleep');
    }
  }, [isOpen, report]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const isAbsent = permissionType === 'Absent';
    onSavePermission({
      isPermission: true,
      permissionType: permissionType === 'Absent' ? 'Absent' : 'P',
      permissionReason: permissionReason.trim(),
      isAbsent: isAbsent,
      absentReason: permissionReason.trim(),
    });
    onClose();
  };

  const handleRemove = () => {
    onRemovePermission();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 transition-all">
        
        {/* Header with distinctive red accent to match screenshot */}
        <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">{t.permissionTitle}</h3>
              <p className="text-xs text-red-100 font-medium">
                {report.date} ({report.dayOfWeek})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          
          {/* Quick Notice */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-950 flex items-start gap-3">
            <UserX className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900">
                {language === 'km' ? 'សម្គាល់ការសុំច្បាប់ / អវត្តមាន (P)' : 'Permission & Absence Record'}
              </p>
              <p className="text-red-700 mt-0.5">
                {language === 'km'
                  ? 'នៅពេលកំណត់ច្បាប់ (P) តារាងរបាយការណ៍នឹងបង្ហាញផ្ទាំងពណ៌ក្រហមដូចក្នុងគំរូ និងកត់ត្រាថា "P" ជាមួយហេតុផលដែលបានបញ្ជាក់។'
                  : 'When Permission (P) is active, the daily report will highlight in red banner format with checking (✓) and your logged reason.'}
              </p>
            </div>
          </div>

          {/* Permission Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              {t.permissionTypeLabel}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPermissionType('P')}
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                  permissionType === 'P'
                    ? 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <HeartPulse className="w-4 h-4 text-red-600 shrink-0" />
                <div>
                  <div className="font-black text-sm">P (Permission)</div>
                  <div className="text-[10px] text-slate-500">{t.sickLeave}</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPermissionType('Personal Leave')}
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                  permissionType === 'Personal Leave'
                    ? 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <div className="font-black text-sm">P (Personal)</div>
                  <div className="text-[10px] text-slate-500">{t.personalLeave}</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPermissionType('Absent')}
                className={`col-span-2 flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                  permissionType === 'Absent'
                    ? 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <UserX className="w-4 h-4 text-slate-600 shrink-0" />
                <div>
                  <div className="font-bold">{t.unexcusedAbsent}</div>
                  <div className="text-[10px] text-slate-500">{t.notCheckedInAbsentHint}</div>
                </div>
              </button>
            </div>
          </div>

          {/* Reason Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              {t.permissionReasonLabel}
            </label>
            <textarea
              value={permissionReason}
              onChange={(e) => setPermissionReason(e.target.value)}
              rows={3}
              placeholder={t.permissionReasonPlaceholder}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Quick preset suggestions */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
              {language === 'km' ? 'ជ្រើសរើសហេតុផលរហ័ស៖' : 'Quick Suggested Reasons:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_PERMISSION_REASONS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPermissionReason(preset)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-slate-200 text-slate-700 transition-all"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            {report.isPermission ? (
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t.removePermission}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
              >
                {t.cancel}
              </button>
            )}

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 transition-all active:scale-95 ml-auto"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.savePermission}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
