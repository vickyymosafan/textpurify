import React, { useRef, useEffect, useState } from 'react';
import { 
  ArrowRight, 
  Copy, 
  Trash2, 
  Wand2, 
  CheckCheck,
  AlignLeft,
  FileText,
  Undo2,
  Redo2,
  Zap
} from 'lucide-react';
import { cleanTextWithGemini } from './services/geminiService';
import { CleaningOptions } from './types';
import { Button } from './components/Button';
import { Header } from './components/Header';
import { useUndoRedo } from './hooks/useUndoRedo';

const App: React.FC = () => {
  // Input uses a debounce to avoid saving every keystroke to history
  const {
    value: input,
    set: setInput,
    undo: undoInput,
    redo: redoInput,
    canUndo: canUndoInput,
    canRedo: canRedoInput,
    reset: resetInput
  } = useUndoRedo('', { debounce: 800 });

  // Output saves every generation step
  const {
    value: output,
    set: setOutput,
    undo: undoOutput,
    redo: redoOutput,
    canUndo: canUndoOutput,
    canRedo: canRedoOutput,
    reset: resetOutput
  } = useUndoRedo('');

  const [isCleaning, setIsCleaning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [autoClean, setAutoClean] = useState(true);
  
  // Track latest request to handle race conditions
  const lastRequestTime = useRef<number>(0);

  const [options, setOptions] = useState<CleaningOptions>({
    normalizeSpaces: true,
    removeBlankLines: true,
    fixBrokenLines: true,
    removeSpecialChars: false
  });

  const outputRef = useRef<HTMLTextAreaElement>(null);

  // Centralized cleaning function
  const triggerCleaning = async (text: string, currentOptions: CleaningOptions) => {
    if (!text.trim()) return;

    const requestId = Date.now();
    lastRequestTime.current = requestId;

    setIsCleaning(true);
    setError(null);

    try {
      const cleaned = await cleanTextWithGemini(text, currentOptions);
      
      // Only apply if this is the latest request
      if (lastRequestTime.current === requestId) {
        setOutput(cleaned, true); 
      }
    } catch (err: any) {
      if (lastRequestTime.current === requestId) {
        setError(err.message || "Terjadi kesalahan sistem.");
      }
    } finally {
      if (lastRequestTime.current === requestId) {
        setIsCleaning(false);
      }
    }
  };

  const handleClean = () => {
    triggerCleaning(input, options);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (!input) return;
    setInput('', true);
    setOutput('', true);
    setError(null);
  };

  const toggleOption = (key: keyof CleaningOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Auto-clean effect
  useEffect(() => {
    if (!autoClean) return;

    const timer = setTimeout(() => {
      if (!input.trim()) {
        if (output) setOutput('', true);
        return;
      }
      triggerCleaning(input, options);
    }, 1200); // 1.2s delay to wait for typing to finish

    return () => clearTimeout(timer);
  }, [input, options, autoClean]);

  useEffect(() => {
    if (output && !isCleaning && outputRef.current) {
      // Only scroll to top if it's a fresh manual clean or significant change
      // For live preview, constantly jumping to top might be annoying if user is reading?
      // But user is typing in input, output is just preview.
      outputRef.current.scrollTop = 0;
    }
  }, [output, isCleaning]);

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 md:p-6 gap-4 md:gap-6">
        {/* Left Column: Input */}
        <div className="flex-1 flex flex-col min-h-[300px] md:min-h-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
          <div className="flex-none px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
              <FileText size={16} className="text-slate-400" />
              <span>Teks Asli</span>
              <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                {input.length} kar
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex items-center mr-2 border-r border-slate-200 pr-2 gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={undoInput} 
                  disabled={!canUndoInput}
                  className="h-8 w-8 px-0"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 size={16} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={redoInput} 
                  disabled={!canRedoInput}
                  className="h-8 w-8 px-0"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 size={16} />
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClear} disabled={!input} className="h-8 px-2 text-xs hover:text-red-600">
                <Trash2 size={14} className="mr-1" /> Hapus
              </Button>
            </div>
          </div>
          <textarea
            className="flex-1 w-full p-4 resize-none outline-none text-slate-700 text-base leading-relaxed placeholder-slate-300 font-mono bg-transparent"
            placeholder="Tempel teks berantakan di sini..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Middle Control Panel */}
        <div className="flex-none flex md:flex-col items-center justify-center gap-4 py-2 md:py-0 md:w-56 z-10">
          <div className="w-full space-y-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            {/* Auto Clean Toggle */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-700">
                <div className={`p-1.5 rounded-md ${autoClean ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Zap size={14} fill={autoClean ? "currentColor" : "none"} />
                </div>
                <span className="text-sm font-semibold">Live Preview</span>
              </div>
              <button 
                onClick={() => setAutoClean(!autoClean)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${autoClean ? 'bg-indigo-600' : 'bg-slate-200'}`}
                role="switch"
                aria-checked={autoClean}
              >
                <span aria-hidden="true" className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoClean ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Opsi Pembersihan</label>
              
              <label className="flex items-start gap-3 p-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors select-none">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  checked={options.normalizeSpaces}
                  onChange={() => toggleOption('normalizeSpaces')}
                />
                <div className="text-sm text-slate-700">
                  <span className="font-medium">Rapikan Spasi</span>
                  <p className="text-xs text-slate-500 mt-0.5">Hapus spasi ganda & whitespace</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors select-none">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  checked={options.removeBlankLines}
                  onChange={() => toggleOption('removeBlankLines')}
                />
                <div className="text-sm text-slate-700">
                  <span className="font-medium">Hapus Baris Kosong</span>
                  <p className="text-xs text-slate-500 mt-0.5">Hapus enter berlebihan</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors select-none">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  checked={options.fixBrokenLines}
                  onChange={() => toggleOption('fixBrokenLines')}
                />
                <div className="text-sm text-slate-700">
                  <span className="font-medium">Sambung Baris</span>
                  <p className="text-xs text-slate-500 mt-0.5">Perbaiki kalimat terputus</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors select-none">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  checked={options.removeSpecialChars}
                  onChange={() => toggleOption('removeSpecialChars')}
                />
                <div className="text-sm text-slate-700">
                  <span className="font-medium">Hapus Simbol</span>
                  <p className="text-xs text-slate-500 mt-0.5">Bersihkan karakter aneh</p>
                </div>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-100">
               <Button 
                onClick={handleClean} 
                isLoading={isCleaning} 
                disabled={!input.trim()}
                className="w-full"
                icon={<Wand2 size={16} />}
              >
                {isCleaning ? 'Memproses...' : 'Rapikan Manual'}
              </Button>
            </div>
          </div>

          <div className="hidden md:block text-slate-300">
            <ArrowRight size={24} />
          </div>
        </div>

        {/* Right Column: Output */}
        <div className="flex-1 flex flex-col min-h-[300px] md:min-h-0 bg-indigo-50/50 rounded-xl shadow-sm border border-indigo-100 overflow-hidden">
          <div className="flex-none px-4 py-3 bg-indigo-50/80 border-b border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-900 font-medium text-sm">
              <AlignLeft size={16} className="text-indigo-400" />
              <span>Hasil Rapih</span>
              {output && (
                <span className="ml-2 text-xs bg-white text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100 shadow-sm">
                  {output.length} kar
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center mr-2 border-r border-indigo-200 pr-2 gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={undoOutput} 
                    disabled={!canUndoOutput}
                    className="h-8 w-8 px-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
                    title="Undo Result"
                  >
                    <Undo2 size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={redoOutput} 
                    disabled={!canRedoOutput}
                    className="h-8 w-8 px-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
                    title="Redo Result"
                  >
                    <Redo2 size={16} />
                  </Button>
                </div>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleCopy} 
                disabled={!output}
                className={`h-8 px-3 text-xs transition-all duration-300 ${copied ? 'bg-green-50 text-green-700 border-green-200' : ''}`}
              >
                {copied ? (
                  <>
                    <CheckCheck size={14} className="mr-1.5" /> Disalin!
                  </>
                ) : (
                  <>
                    <Copy size={14} className="mr-1.5" /> Salin
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="flex-1 relative w-full h-full">
            {isCleaning && (
               <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center transition-opacity duration-200">
                 <div className="flex flex-col items-center gap-3 animate-pulse">
                   <div className="h-2 w-48 bg-indigo-200 rounded-full"></div>
                   <div className="h-2 w-32 bg-indigo-200 rounded-full"></div>
                 </div>
               </div>
            )}
            
            {error ? (
              <div className="flex-1 p-6 flex items-center justify-center h-full text-red-500 bg-red-50/30">
                <p className="text-center text-sm">{error}</p>
              </div>
            ) : (
              <textarea
                ref={outputRef}
                className="w-full h-full p-4 resize-none outline-none text-slate-800 text-base leading-relaxed bg-transparent font-mono placeholder-indigo-300/50"
                placeholder="Hasil teks yang rapi akan muncul di sini..."
                value={output}
                readOnly
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-none p-4 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-200">
        <p>Aplikasi ini memproses teks secara aman. Tidak ada data yang disimpan.</p>
      </footer>
    </div>
  );
};

export default App;