import React from 'react';
import { Coffee, PlusCircle, CheckCircle2 } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface MondayHolidayCardProps {
  dayOfWeek: string;
  onOverrideHoliday: () => void;
  language?: Language;
}

export const MondayHolidayCard: React.FC<MondayHolidayCardProps> = ({ 
  dayOfWeek, 
  onOverrideHoliday,
  language = 'en'
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <div className="bg-amber-50/80 border-2 border-dashed border-amber-300 rounded-2xl p-8 text-center max-w-2xl mx-auto my-8 shadow-xs">
      <div className="w-16 h-16 rounded-2xl bg-amber-200 text-amber-800 flex items-center justify-center mx-auto mb-4 shadow-inner">
        <Coffee className="w-8 h-8" />
      </div>

      <h2 className="text-xl font-black text-amber-950 mb-2">
        {dayOfWeek} {t.holidayTitle}
      </h2>

      <p className="text-sm text-amber-800 max-w-md mx-auto mb-6 leading-relaxed">
        {t.holidayDesc}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-xl border border-amber-200 text-xs text-amber-900 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{t.holidayExcluded}</span>
        </div>

        <button
          onClick={onOverrideHoliday}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t.holidayOverride}</span>
        </button>
      </div>
    </div>
  );
};
