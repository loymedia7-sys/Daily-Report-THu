import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, RotateCcw, Clock, Save, Calendar, Repeat } from 'lucide-react';
import { DefaultTimeSlotTemplate, TaskScope, PRESET_ACTIVITIES, Language } from '../types';
import { INITIAL_DEFAULT_SCHEDULE } from '../utils/storage';
import { TRANSLATIONS } from '../utils/translations';

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSchedule: DefaultTimeSlotTemplate[];
  onSaveSchedule: (updatedSchedule: DefaultTimeSlotTemplate[]) => void;
  language?: Language;
}

export const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({
  isOpen,
  onClose,
  defaultSchedule,
  onSaveSchedule,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  
  const weekdays = [
    { label: t.sunShort, value: 0 },
    { label: t.monShort, value: 1 },
    { label: t.tueShort, value: 2 },
    { label: t.wedShort, value: 3 },
    { label: t.thuShort, value: 4 },
    { label: t.friShort, value: 5 },
    { label: t.satShort, value: 6 },
  ];

  const [items, setItems] = useState<DefaultTimeSlotTemplate[]>(defaultSchedule);
  const [newTimeSlot, setNewTimeSlot] = useState('17:00 - 18:00');
  const [newTaskName, setNewTaskName] = useState('');
  const [newScheduleType, setNewScheduleType] = useState<'Schedule' | 'Over Time'>('Schedule');
  const [newScope, setNewScope] = useState<TaskScope>('all');
  const [newDaysOfWeek, setNewDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [newSpecificDate, setNewSpecificDate] = useState<string>('');
  const [recurrenceCycle, setRecurrenceCycle] = useState<'everyday' | '5days' | '1week' | '2weeks'>('5days');

  useEffect(() => {
    if (isOpen) {
      setItems(defaultSchedule);
    }
  }, [isOpen, defaultSchedule]);

  if (!isOpen) return null;

  const handleApplyPresetToAll = (preset: 'everyday' | '5days' | '1week' | '2weeks') => {
    setRecurrenceCycle(preset);
    let targetDays: number[] = [1, 2, 3, 4, 5];
    let scope: TaskScope = 'specific_days';

    if (preset === 'everyday' || preset === '1week' || preset === '2weeks') {
      targetDays = [0, 1, 2, 3, 4, 5, 6];
    } else if (preset === '5days') {
      targetDays = [1, 2, 3, 4, 5];
    }

    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        applicableScope: scope,
        daysOfWeek: targetDays,
      }))
    );
  };

  const handleItemScopeChange = (id: string, scope: TaskScope) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, applicableScope: scope } : item))
    );
  };

  const handleItemDayToggle = (id: string, dayValue: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const currentDays = item.daysOfWeek || [1, 2, 3, 4, 5];
        const updated = currentDays.includes(dayValue)
          ? currentDays.filter((d) => d !== dayValue)
          : [...currentDays, dayValue];
        return { ...item, daysOfWeek: updated };
      })
    );
  };

  const handleItemPresetDays = (id: string, preset: 'everyday' | '5days') => {
    const days = preset === 'everyday' ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, applicableScope: 'specific_days', daysOfWeek: days } : item
      )
    );
  };

  const handleItemChange = (id: string, field: 'timeSlot' | 'taskName' | 'specificDate' | 'scheduleType', value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (field === 'scheduleType') {
          return { ...item, scheduleType: value, isOvertime: value === 'Over Time' };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleNewDay = (dayVal: number) => {
    setNewDaysOfWeek((prev) =>
      prev.includes(dayVal) ? prev.filter((d) => d !== dayVal) : [...prev, dayVal]
    );
  };

  const handleSetNewPresetDays = (preset: 'everyday' | '5days' | '1week' | '2weeks') => {
    if (preset === 'everyday' || preset === '1week' || preset === '2weeks') {
      setNewDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
      setNewScope('specific_days');
    } else {
      setNewDaysOfWeek([1, 2, 3, 4, 5]);
      setNewScope('specific_days');
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    const isOt = newScheduleType === 'Over Time';
    const newItem: DefaultTimeSlotTemplate = {
      id: Date.now().toString(),
      timeSlot: newTimeSlot,
      taskName: newTaskName.trim(),
      scheduleType: newScheduleType,
      isOvertime: isOt,
      applicableScope: newScope,
      daysOfWeek: newScope === 'specific_days' ? newDaysOfWeek : undefined,
      specificDate: newScope === 'specific_date' ? newSpecificDate : undefined,
    };

    setItems((prev) => [...prev, newItem]);
    setNewTaskName('');
  };

  const handleResetToDefaults = () => {
    if (confirm(language === 'km' ? 'កំណត់គំរូកាលវិភាគឡើងវិញទៅដើម?' : 'Reset default time slots back to standard original schedule?')) {
      setItems(INITIAL_DEFAULT_SCHEDULE);
    }
  };

  const handleSave = () => {
    onSaveSchedule(items);
    onClose();
  };

  return (
    <div id="template-editor-modal" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              <span>{t.templateScheduleTitle}</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              {t.templateScheduleSubtitle}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Batch Duration / Recurrence Bar */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <Repeat className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-700">{t.recurrenceQuickPreset}:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleApplyPresetToAll('5days')}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                recurrenceCycle === '5days'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title="Apply 5 Days (Mon-Fri) to all template items"
            >
              {t.preset5Days}
            </button>
            <button
              type="button"
              onClick={() => handleApplyPresetToAll('everyday')}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                recurrenceCycle === 'everyday'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title="Apply Everyday (7 Days) to all template items"
            >
              {t.presetEveryday}
            </button>
            <button
              type="button"
              onClick={() => handleApplyPresetToAll('1week')}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                recurrenceCycle === '1week'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title="Set 1 Week Recurring Schedule"
            >
              {t.preset1Week}
            </button>
            <button
              type="button"
              onClick={() => handleApplyPresetToAll('2weeks')}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                recurrenceCycle === '2weeks'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title="Set 2 Weeks Recurring Schedule"
            >
              {t.preset2Weeks}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          
          {/* Add New Slot Form */}
          <form onSubmit={handleAddItem} className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>{t.addTemplateSlot}</span>
              </span>

              {/* Schedule Type toggle */}
              <div className="flex items-center bg-white p-0.5 rounded-lg border border-indigo-200 text-xs">
                <button
                  type="button"
                  onClick={() => setNewScheduleType('Schedule')}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-all ${
                    newScheduleType === 'Schedule' ? 'bg-red-600 text-white shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  {t.scheduleRegular}
                </button>
                <button
                  type="button"
                  onClick={() => setNewScheduleType('Over Time')}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-all ${
                    newScheduleType === 'Over Time' ? 'bg-red-600 text-white shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  {t.overTimeOt}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.timeSlotLabel}</label>
                <input
                  type="text"
                  value={newTimeSlot}
                  onChange={(e) => setNewTimeSlot(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
                  placeholder="08:00 - 09:00"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">{language === 'km' ? 'ឈ្មោះការងារ / សកម្មភាព' : 'Task / Activity Name'}</label>
                <input
                  type="text"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder={language === 'km' ? 'បញ្ចូលឈ្មោះការងារ...' : 'Enter task title / activity...'}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                  required
                />
              </div>
            </div>

            {/* Scope selection */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-700">{t.applyToLabel}</span>
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setNewScope('all')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      newScope === 'all' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.allWorkingDays}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewScope('specific_days')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      newScope === 'specific_days' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.selectedDays}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewScope('specific_date')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      newScope === 'specific_date' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.thisDateOnly}
                  </button>
                </div>
              </div>

              {/* Scope specific inputs */}
              {newScope === 'specific_days' && (
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSetNewPresetDays('5days')}
                      className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700"
                    >
                      5d
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetNewPresetDays('everyday')}
                      className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700"
                    >
                      {t.presetEveryday}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetNewPresetDays('1week')}
                      className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700"
                    >
                      1W
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetNewPresetDays('2weeks')}
                      className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700"
                    >
                      2W
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {weekdays.map((w) => {
                      const isSelected = newDaysOfWeek.includes(w.value);
                      return (
                        <button
                          key={w.value}
                          type="button"
                          onClick={() => handleToggleNewDay(w.value)}
                          className={`w-7 h-7 text-[11px] font-bold rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {w.label[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {newScope === 'specific_date' && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <input
                    type="date"
                    value={newSpecificDate}
                    onChange={(e) => setNewSpecificDate(e.target.value)}
                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                    required={newScope === 'specific_date'}
                  />
                </div>
              )}

              <button
                type="submit"
                className="self-end sm:self-auto px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'km' ? 'បន្ថែម' : 'Add Item'}</span>
              </button>
            </div>
          </form>

          {/* Existing Items List */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-500 font-bold px-2 uppercase tracking-wider">
              <span>{t.templateSlotsCount} ({items.length})</span>
              <span>{language === 'km' ? 'ប្រភេទ និងការកំណត់ថ្ងៃ' : 'Schedule Type & Day Assignment'}</span>
            </div>

            {items.map((item, idx) => {
              const scope = item.applicableScope || 'all';
              const days = item.daysOfWeek || [1, 2, 3, 4, 5];
              const isOt = item.scheduleType === 'Over Time' || item.isOvertime;

              return (
                <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2.5 hover:border-slate-300 transition-all shadow-2xs">
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <span className="text-xs font-bold text-slate-400 w-6 text-center">#{idx + 1}</span>
                    
                    {/* Time Slot input */}
                    <input
                      type="text"
                      value={item.timeSlot}
                      onChange={(e) => handleItemChange(item.id, 'timeSlot', e.target.value)}
                      className="w-28 sm:w-32 px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />

                    {/* Schedule / OT button toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        handleItemChange(item.id, 'scheduleType', isOt ? 'Schedule' : 'Over Time')
                      }
                      className={`px-2 py-1 text-[11px] font-black rounded-lg border transition-all ${
                        isOt
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-red-100 text-red-700 border-red-200'
                      }`}
                      title="Toggle between Schedule and Over Time"
                    >
                      {isOt ? 'OT' : 'REG'}
                    </button>

                    {/* Task name input */}
                    <input
                      type="text"
                      value={item.taskName}
                      onChange={(e) => handleItemChange(item.id, 'taskName', e.target.value)}
                      className="flex-1 min-w-[140px] px-2.5 py-1 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-all ml-auto"
                      title="Remove time slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Day assignment controls for item */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-200/80 pt-2 px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-500">{t.applyToLabel}</span>
                      <select
                        value={scope}
                        onChange={(e) => handleItemScopeChange(item.id, e.target.value as TaskScope)}
                        className="text-xs font-medium bg-white border border-slate-300 rounded-md px-2 py-0.5 focus:outline-none cursor-pointer"
                      >
                        <option value="all">{t.allWorkingDays}</option>
                        <option value="specific_days">{t.selectedDays} (5d / Everyday)</option>
                        <option value="specific_date">{t.thisDateOnly}</option>
                      </select>

                      {scope === 'specific_days' && (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            type="button"
                            onClick={() => handleItemPresetDays(item.id, '5days')}
                            className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
                          >
                            5d
                          </button>
                          <button
                            type="button"
                            onClick={() => handleItemPresetDays(item.id, 'everyday')}
                            className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
                          >
                            {t.presetEveryday}
                          </button>
                        </div>
                      )}
                    </div>

                    {scope === 'specific_days' && (
                      <div className="flex items-center gap-1">
                        {weekdays.map((w) => {
                          const isSelected = days.includes(w.value);
                          return (
                            <button
                              key={w.value}
                              type="button"
                              onClick={() => handleItemDayToggle(item.id, w.value)}
                              className={`w-6 h-6 text-[10px] font-bold rounded-md border transition-all ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {w.label[0]}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {scope === 'specific_date' && (
                      <input
                        type="date"
                        value={item.specificDate || ''}
                        onChange={(e) => handleItemChange(item.id, 'specificDate', e.target.value)}
                        className="text-xs px-2 py-0.5 border border-slate-300 rounded-md bg-white focus:outline-none cursor-pointer"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <button
            onClick={handleResetToDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold py-1 sm:py-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetDefaults}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{t.saveSchedule}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
