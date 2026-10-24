import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Project, SystemStatus } from '../types';
import { CAPTION_TEMPLATES } from '../../server/templates';
import { useLoading } from '../context/LoadingContext';
import {
  UploadCloud, Film, Play, Trash2, Plus, Sparkles, CheckCircle2,
  AlertCircle, RefreshCw, Cpu, Languages, ArrowRight, Video, Sliders, Check, Wand2
} from 'lucide-react';

interface StudioDashboardProps {
  onOpenProject: (projectId: string, clientPreviewUrl?: string) => void;
  initialTemplate?: string;
}

export const StudioDashboard: React.FC<StudioDashboardProps> = ({
  onOpenProject,
  initialTemplate
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  // Global loading context
  const {
    isUploading: isGlobalUploading,
    uploadProgress,
    uploadStage,
    startUploadAndTranscribe
  } = useLoading();
  
  // Selected video file staged for language configuration
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedPreviewUrl, setStagedPreviewUrl] = useState<string | null>(null);
  
  // Language configuration
  const [sourceLanguage, setSourceLanguage] = useState<string>('te'); // default: Telugu
  const [targetLanguage, setTargetLanguage] = useState<string>('tenglish'); // default: Tenglish (Roman Telugu)
  const [selectedTemplate, setSelectedTemplate] = useState<string>(initialTemplate || 'hormozi_impact');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProjects();
    loadSystemStatus();
  }, []);

  const loadProjects = async () => {
    try {
      const list = await api.getProjects();
      setProjects(list);
    } catch (err: any) {
      console.error('Error loading projects:', err);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const status = await api.getSystemStatus();
      setSystemStatus(status);
    } catch (err: any) {
      console.warn('System status check note:', err);
    }
  };

  // When a user selects a video file, stage it immediately with instant local blob preview!
  const handleFileSelect = (file: File) => {
    setUploadError(null);
    if (!file) return;

    // Fast zero-latency instant local preview URL
    try {
      const blobUrl = URL.createObjectURL(file);
      setStagedFile(file);
      setStagedPreviewUrl(blobUrl);
    } catch (e: any) {
      setUploadError('Could not read video file: ' + e.message);
    }
  };

  // Launch project creation and background upload with global progress tracking
  const handleProceedWithStagedVideo = async () => {
    if (!stagedFile) return;
    setUploadError(null);

    await startUploadAndTranscribe(stagedFile, {
      sourceLanguage,
      targetLanguage,
      selectedTemplate,
      onSuccess: (projectId, clientPreviewUrl) => {
        onOpenProject(projectId, clientPreviewUrl || stagedPreviewUrl || undefined);
      },
      onError: (err) => {
        setUploadError(err);
      }
    });
  };

  const handleLoadDemoReel = async () => {
    setIsLoadingSample(true);
    setUploadError(null);
    try {
      const newProj = await api.createProject('Telugu Tech Career Reel (Demo)');
      if (selectedTemplate && CAPTION_TEMPLATES[selectedTemplate]) {
        await api.updateStyle(newProj.id, CAPTION_TEMPLATES[selectedTemplate]);
      }
      await api.loadSampleVideo(newProj.id);
      onOpenProject(newProj.id);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to load demo video.');
      setIsLoadingSample(false);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10 text-slate-100">
      
      {/* Studio Header (CapCut / Premiere Pro Dark Theme) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Capzen Studio
            </h1>
            <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400 bg-blue-950/80 border border-blue-800/60 px-2 py-0.5 rounded font-bold">
              AI Caption Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Fast Video Loading · Spoken Speech to Translated Captions · Trending Reel Styles
          </p>
        </div>

        {/* Engine Telemetry */}
        {systemStatus && (
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-300 shadow-sm">
            <div className="flex items-center gap-1.5 font-medium">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Whisper INT8 (CPU)</span>
            </div>
            <span className="text-slate-700">·</span>
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>FFmpeg Subtitle Burner</span>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 1: VIDEO INGESTION & LANGUAGE SETUP */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Video className="w-4 h-4" />
            <span>Step 1: Ingest Video & Configure Languages</span>
          </div>
          {stagedFile && (
            <button
              onClick={() => {
                setStagedFile(null);
                setStagedPreviewUrl(null);
              }}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Change Video
            </button>
          )}
        </div>

        {!stagedFile ? (
          /* Drag & Drop Upload Zone */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`md:col-span-8 cursor-pointer rounded-2xl border-2 border-dashed p-8 transition-all flex flex-col items-center justify-center text-center ${
                isDragOver
                  ? 'border-blue-500 bg-blue-950/30'
                  : 'border-slate-700 hover:border-slate-500 bg-slate-950/60'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="video/*,.mp4,.mov,.m4v,.webm,.mkv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-3">
                <UploadCloud className="w-7 h-7" />
              </div>

              <h3 className="text-base font-bold text-white">
                Drag and drop your video file here
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Supports MP4, MOV, WebM (9:16 vertical reels recommended). Instant local preview enabled.
              </p>

              <button
                type="button"
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-md shadow-blue-600/30"
              >
                Browse Video
              </button>
            </div>

            {/* Instant Demo Reel Option */}
            <div className="md:col-span-4 bg-gradient-to-br from-blue-950 to-slate-900 border border-blue-800/40 rounded-2xl p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-300 bg-blue-900/60 px-2.5 py-1 rounded-md">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>One-Click Test</span>
                </div>
                <h3 className="text-base font-bold text-white">Try Telugu Demo Reel</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  No video ready? Load our pre-rendered 9:16 vertical reel with spoken Telugu-English tech career speech.
                </p>
              </div>

              <button
                onClick={handleLoadDemoReel}
                disabled={isLoadingSample}
                className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-75"
              >
                {isLoadingSample ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading Demo...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Launch Demo Project</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Staged Video Language Configuration Form */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Mini Video Preview */}
            <div className="md:col-span-4 flex flex-col items-center">
              <div className="relative w-44 aspect-[9/16] bg-black rounded-xl overflow-hidden border-2 border-slate-700 shadow-lg">
                <video
                  src={stagedPreviewUrl || ''}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center mt-2 max-w-[200px]">
                <p className="text-xs font-bold text-white truncate">{stagedFile.name}</p>
                <p className="text-[11px] font-mono text-slate-400">
                  {(stagedFile.size / 1024 / 1024).toFixed(1)} MB · Ready
                </p>
              </div>
            </div>

            {/* Right: Language Selectors & Action */}
            <div className="md:col-span-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Source Spoken Language in Video */}
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5 text-blue-400" />
                    <span>1. Spoken Video Language</span>
                  </label>
                  <select
                    value={sourceLanguage}
                    onChange={(e) => setSourceLanguage(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="te">Telugu (తెలుగు) — Spoken Telugu/English</option>
                    <option value="auto">Auto-Detect Speech Language</option>
                    <option value="en">English (US/UK/IN)</option>
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="ta">Tamil (தமிழ்)</option>
                  </select>
                  <p className="text-[11px] text-slate-400">
                    The language spoken by the creator in the video.
                  </p>
                </div>

                {/* Target Translated / Formatted Caption Language */}
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>2. Translated Caption Output</span>
                  </label>
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="tenglish">Tenglish (Roman Telugu + English Words)</option>
                    <option value="telugu">Telugu Script (తెలుగు అక్షరాలు)</option>
                    <option value="english">English (Translated Subtitles)</option>
                    <option value="hinglish">Hinglish (Roman Hindi + English Words)</option>
                  </select>
                  <p className="text-[11px] text-slate-400">
                    Desired caption script and language for the vertical reel.
                  </p>
                </div>

              </div>

              {/* Action Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStagedFile(null);
                    setStagedPreviewUrl(null);
                  }}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Choose Different Video
                </button>

                <button
                  onClick={handleProceedWithStagedVideo}
                  disabled={isGlobalUploading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 disabled:opacity-75"
                >
                  {isGlobalUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{uploadStage || 'Ingesting Video & Launching Studio...'}</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Auto-Detect & Generate Captions</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Error Alert */}
        {uploadError && (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-red-950/80 border border-red-800/80 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* SECTION 2: TRENDING CAPTION TEMPLATES (CAPCUT / PREMIERE PRO STYLES) */}
      <div id="templates" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Trending Caption Templates</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select your default aesthetic preset. Fully customizable in the editor (fonts, colors, outline, and effects).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.values(CAPTION_TEMPLATES).map((tpl) => {
            const isSelected = selectedTemplate === tpl.id;
            return (
              <div
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl.id)}
                className={`cursor-pointer rounded-xl p-3.5 border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-500 bg-blue-950/40 ring-2 ring-blue-500/30 shadow-lg'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Mini Preview Box */}
                  <div className="aspect-[9/12] bg-slate-950 rounded-lg p-2.5 flex flex-col items-center justify-end relative overflow-hidden border border-slate-800/80">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                    <div className="relative z-10 w-full text-center">
                      <span
                        style={{
                          fontFamily: tpl.fontFamily,
                          fontWeight: tpl.fontWeight,
                          color: tpl.textColor,
                          WebkitTextStroke: `${Math.max(1, tpl.outlineWidth * 0.8)}px ${tpl.outlineColor}`,
                          textTransform: tpl.textTransform || 'none'
                        }}
                        className="text-[11px] leading-tight block tracking-tight"
                      >
                        <span style={{ color: tpl.highlightColor }}>BRO</span> IDHI OPPORTUNITY!
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-white">{tpl.name}</h4>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {tpl.tagline}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono">{tpl.fontFamily}</span>
                  <span className="text-blue-400 font-semibold">{isSelected ? 'Active' : 'Select'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: RECENT PROJECTS */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Film className="w-4 h-4 text-slate-400" />
            <span>Recent Projects ({projects.length})</span>
          </h2>
        </div>

        {projects.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-2">
            <Film className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No projects yet</p>
            <p className="text-xs text-slate-500">
              Upload a vertical video or try the demo reel to generate auto-captions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => onOpenProject(p.id)}
                className="group cursor-pointer bg-slate-900 border border-slate-800 hover:border-blue-500 rounded-xl p-4 transition-all flex flex-col justify-between shadow-sm hover:shadow-md"
              >
                <div className="space-y-3">
                  {/* Thumbnail */}
                  <div className="aspect-[9/10] bg-slate-950 rounded-lg flex items-center justify-center relative overflow-hidden border border-slate-800">
                    <Film className="w-8 h-8 text-slate-700 group-hover:text-blue-400 transition-colors" />
                    {p.duration > 0 && (
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded">
                        {p.duration.toFixed(1)}s
                      </span>
                    )}
                    <span className="absolute top-2 left-2 bg-blue-600/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                      {p.targetLanguage || 'Tenglish'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-xs truncate group-hover:text-blue-400 transition-colors">
                      {p.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                      <span>{p.segments?.length || 0} lines</span>
                      <span>·</span>
                      <span>{p.style?.name || 'Hormozi Impact'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => handleDeleteProject(p.id, e)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
