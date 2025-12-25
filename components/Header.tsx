import React from 'react';
import { Sparkles, Eraser } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="flex-none bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 relative">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
          <Eraser size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            TextPurify <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-normal border border-slate-200">v1.1</span>
          </h1>
          <p className="text-sm text-slate-500">Pembersih spasi & format teks otomatis</p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm text-slate-400">
        <span className="flex items-center gap-1">
          <Sparkles size={14} className="text-amber-400" />
          Powered by Gemini 3 Flash
        </span>
      </div>
    </header>
  );
};
