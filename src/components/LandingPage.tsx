import React, { useState } from 'react';
import { Play, Sparkles, Check, ArrowRight, ShieldCheck, Cpu, Download, Video, FileText, ChevronRight, Eye } from 'lucide-react';
import { CAPTION_TEMPLATES } from '../../server/templates';

interface LandingPageProps {
  onStartCreating: () => void;
  onSelectTemplate: (templateId: string) => void;
  onOpenPlayground: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartCreating,
  onSelectTemplate,
  onOpenPlayground
}) => {
  const [activeTemplatePreview, setActiveTemplatePreview] = useState<'viral_pop' | 'tech_creator' | 'word_karaoke' | 'clean_minimal' | 'cinematic'>('viral_pop');

  const templatesList = [
    {
      id: 'viral_pop' as const,
      name: 'Viral Pop',
      tagline: 'High energy bold text with black outline & punchy yellow pop',
      example: 'Bro, idhi oka manchi opportunity!',
      styleRender: 'font-extrabold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] text-center tracking-tight',
      highlightWord: 'opportunity!'
    },
    {
      id: 'tech_creator' as const,
      name: 'Tech Creator',
      tagline: 'Dark translucent capsule with vivid cyan technical term emphasis',
      example: 'Freshers kuda software jobs ki apply cheskovachu',
      styleRender: 'font-bold text-white bg-slate-900/80 px-4 py-1.5 rounded-lg text-center tracking-tight',
      highlightWord: 'apply cheskovachu'
    },
    {
      id: 'word_karaoke' as const,
      name: 'Word Karaoke',
      tagline: 'Dynamic active-word tracking with neon green contrast',
      example: 'Fast ga apply cheskondi friends',
      styleRender: 'font-extrabold text-slate-300 text-center tracking-tight',
      highlightWord: 'apply'
    },
    {
      id: 'clean_minimal' as const,
      name: 'Clean Minimal',
      tagline: 'Understated lower-third typography for tutorials and podcasts',
      example: 'Ee course lo full stack web development untundhi',
      styleRender: 'font-medium text-white/95 text-center drop-shadow-md tracking-normal',
      highlightWord: ''
    },
    {
      id: 'cinematic' as const,
      name: 'Cinematic Creator',
      tagline: 'Warm golden accent and subtle shadow for storytelling reels',
      example: 'Prathi failure tarvatha oka manchi success vasthundhi',
      styleRender: 'font-bold text-amber-300 drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] text-center tracking-wide',
      highlightWord: 'manchi success'
    }
  ];

  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-200 bg-gradient-to-b from-blue-50/50 via-white to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Value Prop */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Made for Telugu Reels & YouTube Shorts</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12] text-balance">
                Perfect Tenglish Captions for Every Reel.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                Telugu speech recognition that naturally code-switches into crisp Roman Telugu (Tenglish). Preserves English technical terms, job titles, and colloquial phrases with zero paid APIs.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={onStartCreating}
                  className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md shadow-blue-600/20 inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <span>Start Creating</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href="#templates"
                  className="px-5 py-3 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  View Templates
                </a>

                <button
                  onClick={onOpenPlayground}
                  className="px-4 py-3 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap shrink-0"
                >
                  Test Transliteration Engine →
                </button>
              </div>

              {/* Verified Features strip */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                <div>
                  <div className="font-bold text-slate-900 text-sm">100% Free & Local</div>
                  <div>CPU INT8 speech AI</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">English Preserved</div>
                  <div>Job, freshers, apply intact</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Real FFmpeg Export</div>
                  <div>Captioned MP4 & SRT</div>
                </div>
              </div>
            </div>

            {/* Right Column: Studio Preview Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-[340px] rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-950 aspect-[9/16]">
                {/* Visual backdrop */}
                <img
                  src="/src/assets/images/hero_creator_studio_1792848369217.jpg"
                  alt="Creator Studio Workspace"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-80"
                />

                {/* Dark gradient scrim for caption contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />

                {/* Live Caption Simulation Overlay */}
                <div className="absolute bottom-16 inset-x-4 flex flex-col items-center justify-center pointer-events-none">
                  <div className="bg-slate-950/80 backdrop-blur-sm border border-white/10 px-4 py-2.5 rounded-xl shadow-lg text-center">
                    <span className="text-yellow-400 font-extrabold text-lg tracking-wide uppercase mr-1">
                      Bro,
                    </span>
                    <span className="text-white font-extrabold text-lg tracking-wide">
                      idhi oka manchi
                    </span>
                    <div className="text-cyan-400 font-extrabold text-xl tracking-tight mt-0.5">
                      opportunity!
                    </div>
                  </div>
                </div>

                {/* Vertical video UI markers */}
                <div className="absolute top-4 inset-x-4 flex items-center justify-between text-white/70 text-xs">
                  <span className="font-mono text-[10px] tabular-nums">00:02 / 00:07</span>
                  <span className="bg-blue-600/90 text-white font-semibold px-2 py-0.5 rounded text-[10px]">
                    Viral Pop
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5 Built-in Caption Templates Showcase */}
      <section id="templates" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              5 Built-In Reel & Shorts Templates
            </h2>
            <p className="text-slate-600 text-sm">
              Each preset is fully implemented with precise ASS subtitle rendering, customizable colors, and direct FFmpeg export.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {templatesList.map((tpl) => {
              const isSelected = activeTemplatePreview === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => setActiveTemplatePreview(tpl.id)}
                  className={`cursor-pointer bg-white rounded-xl p-4 border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Simulated Mini 9:16 Preview Box */}
                    <div className="aspect-[9/14] bg-slate-900 rounded-lg p-3 flex flex-col items-center justify-end relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/20" />
                      <div className="relative z-10 w-full text-center">
                        <div className={`text-xs ${tpl.styleRender}`}>
                          {tpl.example}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
                        <span>{tpl.name}</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-snug">
                        {tpl.tagline}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTemplate(tpl.id);
                    }}
                    className={`mt-4 w-full py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Select & Use
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works: 3 Simple Steps */}
      <section id="how-it-works" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Simple 3-Step Creator Workflow
            </h2>
            <p className="text-slate-600 text-sm">
              From raw phone video to high-converting vertical reel in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="w-10 h-10 rounded-lg bg-blue-600/10 text-blue-600 font-bold flex items-center justify-center text-base">
                01
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Upload Your Video</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Drag and drop your MP4 or MOV vertical reel. FFmpeg automatically extracts high-clarity 16kHz mono audio on your local machine.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="w-10 h-10 rounded-lg bg-blue-600/10 text-blue-600 font-bold flex items-center justify-center text-base">
                02
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Generate & Correct Tenglish</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Local speech AI transcribes speech. Our Tenglish engine converts it to natural Roman letters while preserving English terms like "job", "freshers", "apply".
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="w-10 h-10 rounded-lg bg-blue-600/10 text-blue-600 font-bold flex items-center justify-center text-base">
                03
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Style & Export Captions</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose from 5 viral templates, tweak font size and outline, and burn subtitles directly into a downloadable MP4 or export .SRT subtitles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature & Privacy Highlights */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Designed for Creator Accuracy & Privacy
              </h2>
              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">100% Free, Zero Paid API Keys:</span> Speech recognition runs directly on local CPU with INT8 quantization. No OpenAI or Gemini billing needed.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">Custom Creator Vocabulary:</span> Teach the studio your channel name, preferred spellings (e.g. "cheskondi" vs "chesukondi"), and niche tech terms.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">Media Privacy:</span> Uploaded videos and audio never leave your server. Temporary processing files are cleaned up automatically.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">Synchronized Inline Editor:</span> Split captions, merge adjacent lines, nudge timestamps, undo and redo with instant video preview.
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onStartCreating}
                  className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                >
                  Start Creating Now
                </button>
              </div>
            </div>

            {/* Creator benchmark card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src="/src/assets/images/avatar_telugu_creator_1792848368547.jpg"
                  alt="Telugu Creator"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm">Telugu Tech Influencer Benchmark</div>
                  <div className="text-xs text-slate-500">Instagram & YouTube Shorts Creator</div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-2 border border-slate-100">
                <div className="text-slate-500 font-mono text-[11px]">Audio Input:</div>
                <div className="font-medium text-slate-800 italic">
                  "Bro, idhi oka manchi opportunity. Freshers kuda apply cheskovachu. Fast ga apply cheskondi."
                </div>
                <div className="text-blue-600 font-mono text-[11px] pt-1">Tenglish Studio Output:</div>
                <div className="font-bold text-slate-900 bg-white p-2.5 rounded border border-blue-200">
                  3 synced short-form vertical captions ready for 9:16 Reel export.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="py-8 bg-white border-t border-slate-200 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">Tenglish AI</span>
            <span>·</span>
            <span>Telugu Captions Studio</span>
          </div>
          <div>
            100% Free & Open-Source Speech Recognition · FFmpeg Export Engine · Privacy First
          </div>
        </div>
      </footer>
    </div>
  );
};
