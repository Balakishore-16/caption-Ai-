import React, { useState } from 'react';
import { useLoading } from '../context/LoadingContext';
import {
  UploadCloud, Sparkles, Film, CheckCircle2, AlertCircle,
  X, ChevronDown, ChevronUp, RefreshCw, Cpu, Volume2, Wand2
} from 'lucide-react';

export const GlobalProgressOverlay: React.FC = () => {
  const {
    isBusy,
    isUploading,
    uploadProgress,
    isTranscribing,
    transcribeProgress,
    isExporting,
    exportProgress,
    overallProgress,
    activeStatusHeadline,
    activeStatusSubline,
    transcribeError,
    exportError,
    transcribeSuccess,
    activeProjectId,
    startTranscription,
    dismissBanner,
    clearErrors
  } = useLoading();

  const [isExpanded, setIsExpanded] = useState(false);

  // If nothing is happening and no errors or success, render nothing
  const hasError = Boolean(transcribeError || exportError);
  if (!isBusy && !hasError && !transcribeSuccess) {
    return null;
  }

  // Calculate current active step index (0 to 4)
  let activeStep = 0;
  if (isUploading) {
    activeStep = 0;
  } else if (isTranscribing) {
    if (transcribeProgress < 25) activeStep = 1;
    else if (transcribeProgress < 65) activeStep = 2;
    else if (transcribeProgress < 90) activeStep = 3;
    else activeStep = 4;
  } else if (transcribeSuccess) {
    activeStep = 5;
  }

  const steps = [
    { label: 'Video Upload & Ingest', desc: 'Secure local storage' },
    { label: 'FFmpeg 16kHz Extraction', desc: 'Clean mono voice track' },
    { label: 'Local CPU Whisper Model', desc: 'INT8 Speech AI (0 API keys)' },
    { label: 'Tenglish Normalization', desc: 'Roman Telugu & Code-switching' },
    { label: 'Synchronized Reel Subtitles', desc: 'Active word-level karaoke' }
  ];

  return (
    <>
      {/* 1. TOP EDGE STREAMING PROGRESS BAR */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-900/80 pointer-events-none">
        <div
          className={`h-full transition-all duration-300 ease-out ${
            hasError
              ? 'bg-rose-500'
              : transcribeSuccess
              ? 'bg-emerald-400'
              : 'bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500'
          }`}
          style={{ width: `${Math.max(5, overallProgress)}%` }}
        />
        {isBusy && (
          <div className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        )}
      </div>

      {/* 2. FLOATING STATUS DOCK (CapCut / Premiere Pro Theme) */}
      <div className="fixed bottom-5 right-5 z-40 max-w-sm sm:max-w-md w-full px-4 sm:px-0">
        <div
          className={`backdrop-blur-xl border rounded-2xl shadow-2xl transition-all duration-200 overflow-hidden ${
            hasError
              ? 'bg-rose-950/90 border-rose-800 text-rose-100 shadow-rose-950/50'
              : transcribeSuccess
              ? 'bg-emerald-950/90 border-emerald-800 text-emerald-100 shadow-emerald-950/50'
              : 'bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-black/60'
          }`}
        >
          {/* Main Card Header */}
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Animated Status Icon */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  hasError
                    ? 'bg-rose-900/80 border-rose-700 text-rose-300'
                    : transcribeSuccess
                    ? 'bg-emerald-900/80 border-emerald-700 text-emerald-300'
                    : isUploading
                    ? 'bg-blue-600/30 border-blue-500/50 text-blue-400 animate-pulse'
                    : isExporting
                    ? 'bg-purple-600/30 border-purple-500/50 text-purple-400 animate-spin'
                    : 'bg-cyan-600/30 border-cyan-500/50 text-cyan-400'
                }`}
              >
                {hasError ? (
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                ) : transcribeSuccess ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : isUploading ? (
                  <UploadCloud className="w-5 h-5 text-blue-400" />
                ) : isExporting ? (
                  <Film className="w-5 h-5 text-purple-400" />
                ) : (
                  <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                )}
              </div>

              {/* Text Info */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold truncate text-white">
                    {hasError
                      ? 'Process Warning'
                      : transcribeSuccess
                      ? 'Captions Ready!'
                      : activeStatusHeadline}
                  </h4>
                  {isBusy && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      {overallProgress}%
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 truncate mt-0.5">
                  {hasError
                    ? transcribeError || exportError
                    : activeStatusSubline}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {isBusy && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title={isExpanded ? 'Collapse details' : 'Expand pipeline checklist'}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </button>
              )}

              {hasError && activeProjectId && (
                <button
                  onClick={() => {
                    clearErrors();
                    startTranscription(activeProjectId);
                  }}
                  className="px-2 py-1 text-[11px] font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              )}

              <button
                onClick={dismissBanner}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar Inside Card */}
          {isBusy && (
            <div className="px-3.5 pb-2">
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Expandable Step-by-Step Pipeline Details */}
          {isExpanded && isBusy && (
            <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-800/80 bg-slate-950/60 text-xs space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                <span>Capzen AI Pipeline</span>
                <span className="flex items-center gap-1 font-mono text-cyan-400">
                  <Cpu className="w-3 h-3" />
                  <span>Local CPU INT8</span>
                </span>
              </div>

              <div className="space-y-1.5">
                {steps.map((st, idx) => {
                  const isDone = activeStep > idx;
                  const isCurrent = activeStep === idx;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors ${
                        isCurrent
                          ? 'bg-blue-600/20 border border-blue-500/40 text-blue-200'
                          : isDone
                          ? 'text-slate-300 opacity-90'
                          : 'text-slate-500 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : isCurrent ? (
                          <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                        )}
                        <span className="font-medium text-[11px]">{st.label}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {st.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
