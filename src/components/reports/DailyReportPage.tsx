import React, { useState, useMemo } from 'react';
import {
  Plus,
  Filter,
  Search,
  Calendar,
  Camera,
  FileDown,
  Sparkles,
  ClipboardList,
  CheckCircle2,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { WorkActivity, WorkActivityPhoto, WORK_CATEGORIES } from '../../types/workReport';
import { DayReport, UserProfile, Language } from '../../types';
import { TRANSLATIONS } from '../../utils/translations';
import { ActivityCard } from './ActivityCard';
import { ActivityForm } from './ActivityForm';
import { calculateActivityStats, countEvidencePhotosInReport } from '../../utils/workEvidenceService';

interface DailyReportPageProps {
  report: DayReport;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  userProfile: UserProfile;
  onSaveActivity: (activity: WorkActivity) => void;
  onDeleteActivity: (activityId: string) => void;
  onAddPhotosToActivity: (activityId: string) => void;
  onUpdatePhotoDescription: (photoId: string, description: string) => void;
  onDeletePhoto: (photoId: string) => void;
  onOpenExportModal: () => void;
  onNavigateToCamera: () => void;
  language: Language;
}

export const DailyReportPage: React.FC<DailyReportPageProps> = ({
  report,
  selectedDate,
  setSelectedDate,
  userProfile,
  onSaveActivity,
  onDeleteActivity,
  onAddPhotosToActivity,
  onUpdatePhotoDescription,
  onDeletePhoto,
  onOpenExportModal,
  onNavigateToCamera,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isActivityFormOpen, setIsActivityFormOpen] = useState<boolean>(false);
  const [activityToEdit, setActivityToEdit] = useState<WorkActivity | null>(null);

  const activities = report.activities || [];
  const stats = calculateActivityStats(report);
  const totalPhotos = countEvidencePhotosInReport(report);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Category match
      const catVal = act.workCategory || act.category;
      if (categoryFilter !== 'all' && catVal !== categoryFilter) {
        return false;
      }
      // Query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (act.title || '').toLowerCase().includes(q);
        const matchDesc = (act.description || '').toLowerCase().includes(q);
        const matchCat = (act.category || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [activities, categoryFilter, searchQuery]);

  const handleEditClick = (act: WorkActivity) => {
    setActivityToEdit(act);
    setIsActivityFormOpen(true);
  };

  const handleAddNewClick = () => {
    setActivityToEdit(null);
    setIsActivityFormOpen(true);
  };

  // Date Shift Helper
  const handleShiftDate = (days: number) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + days);
    const yr = cur.getFullYear();
    const mo = String(cur.getMonth() + 1).padStart(2, '0');
    const da = String(cur.getDate()).padStart(2, '0');
    setSelectedDate(`${yr}-${mo}-${da}`);
  };

  const handleUpdateActivityDescription = (activityId: string, description: string) => {
    const target = activities.find((a) => a.id === activityId);
    if (target) {
      const cleanDesc = description.trim();
      const firstLine = cleanDesc.split('\n')[0].trim();
      const computedTitle = firstLine ? (firstLine.length > 80 ? firstLine.slice(0, 77) + '...' : firstLine) : target.category;
      onSaveActivity({
        ...target,
        title: computedTitle,
        description: cleanDesc,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Top Banner & Date Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-slate-900 text-lg sm:text-xl flex items-center gap-2">
              <ClipboardList size={22} className="text-indigo-600" />
              {t.dailyReportsNav}
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {activities.length} {t.activityNumber}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'km'
              ? 'កត់ត្រាសកម្មភាពការងារលម្អិត និងរូបភាពភស្តុតាងសម្រាប់ដាក់ជូនប្រធាន'
              : 'Manage detailed work activities and evidence photos for your boss'}
          </p>
        </div>

        {/* Date Selector with Next / Prev */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleShiftDate(-1)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft size={16} />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          />

          <button
            type="button"
            onClick={() => handleShiftDate(1)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Next Day"
          >
            <ChevronRight size={16} />
          </button>

          <button
            type="button"
            onClick={onOpenExportModal}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-sm transition-all"
          >
            <FileDown size={14} />
            <span className="hidden sm:inline">{t.exportReport}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>{t.totalActivitiesToday}</span>
            <ClipboardList size={14} className="text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1.5">{stats.total}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>{t.completedActivities}</span>
            <CheckCircle2 size={14} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1.5">
            {stats.completed}
            <span className="text-xs font-normal text-slate-400 ml-1.5">({stats.completionRate}%)</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>{t.totalEvidencePhotos}</span>
            <Camera size={14} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-1.5">{totalPhotos}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>{t.quickCameraAccess}</span>
            <Sparkles size={14} className="text-amber-500" />
          </div>
          <button
            type="button"
            onClick={onNavigateToCamera}
            className="w-full mt-2 py-1.5 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-indigo-200"
          >
            <Camera size={14} />
            {t.capturePhoto}
          </button>
        </div>
      </div>

      {/* Action Bar & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activities by title, description..."
              className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Add Activity Button */}
          <button
            type="button"
            onClick={handleAddNewClick}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95 shrink-0"
          >
            <Plus size={16} />
            {t.quickAddActivity}
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Filter size={12} />
            {t.filterByCategory}:
          </span>
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`text-xs px-3 py-1 rounded-full shrink-0 font-medium transition-all ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {t.allCategories}
          </button>

          {WORK_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`text-xs px-3 py-1 rounded-full shrink-0 font-medium transition-all ${
                categoryFilter === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {language === 'km' ? cat.labelKm : cat.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Activities Feed */}
      <div className="space-y-4">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity, idx) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              index={idx}
              onEdit={handleEditClick}
              onDelete={onDeleteActivity}
              onAddPhotos={onAddPhotosToActivity}
              onUpdatePhotoDescription={onUpdatePhotoDescription}
              onDeletePhoto={onDeletePhoto}
              onUpdateActivityDescription={handleUpdateActivityDescription}
              language={language}
            />
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-3">
            <ClipboardList size={36} className="mx-auto text-slate-300" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{t.noActivitiesForDate}</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">{t.noActivitiesHint}</p>
            </div>
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={handleAddNewClick}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={15} />
                {t.quickAddActivity}
              </button>
              <button
                type="button"
                onClick={onNavigateToCamera}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 inline-flex items-center gap-1.5"
              >
                <Camera size={15} />
                {t.capturePhoto}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Activity Add / Edit Modal */}
      <ActivityForm
        isOpen={isActivityFormOpen}
        onClose={() => setIsActivityFormOpen(false)}
        onSave={onSaveActivity}
        initialActivity={activityToEdit}
        date={selectedDate}
        userProfile={userProfile}
        language={language}
      />
    </div>
  );
};
