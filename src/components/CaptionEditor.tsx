import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Project, CaptionSegment, CaptionStyle, CreatorVocabularyItem } from '../types';
import { CAPTION_TEMPLATES } from '../../server/templates';
import { useLoading } from '../context/LoadingContext';
import {
  Play, Pause, RotateCcw, RotateCw, Plus, Trash2, Split, Merge,
  Download, Sparkles, Sliders, Type, Palette, Video, RefreshCw,
  AlertCircle, CheckCircle2, ChevronRight, Volume2, VolumeX, Eye,
  Maximize2, Layers, AlignCenter, CaseUpper, FileText, ChevronLeft,
  Settings2, Wand2, Globe
} from 'lucide-react';

interface CaptionEditorProps {
  projectId: string;
  clientPreviewUrl?: string;
  onBackToDashboard: () => void;
}

export const CaptionEditor: React.FC<CaptionEditorProps> = ({
  projectId,
  clientPreviewUrl,
  onBackToDashboard
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transcript' | 'style' | 'language' | 'export'>('transcript');
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(-1);
  const [activeWordIndex, setActiveWordIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<'fit' | '100%'>('fit');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  
  // Custom vocab state
  const [newVocabTerm, setNewVocabTerm] = useState('');
  const [newVocabSpelling, setNewVocabSpelling] = useState('');
  const [showVocabModal, setShowVocabModal] = useState(false);

  // Global loading context
  const {
    isTranscribing: isGlobalTranscribing,
    transcribeProgress: globalProgress,
    transcribeStage: globalStage,
    transcribeError: globalError,
    transcribeSuccess: globalSuccess,
    isExporting: isGlobalExporting,
    exportProgress: globalExportProgress,
    exportStage: globalExportStage,
    exportError: globalExportError,
    startTranscription: triggerGlobalTranscription,
    startExport: triggerGlobalExport,
    startUploadAndTranscribe
  } = useLoading();

  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const editorFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProjectData(true);
  }, [projectId]);

  // When global transcription completes, auto-reload captions immediately!
  useEffect(() => {
    if (globalSuccess) {
      loadProjectData(false);
    }
  }, [globalSuccess]);

  // Sync video time updates and active word tracking
  const handleTimeUpdate = () => {
    if (!videoRef.current || !project) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // Identify active caption segment
    const activeIdx = project.segments.findIndex(
      (s) => time >= s.start && time <= s.end
    );
    setActiveSegmentIndex(activeIdx);

    // Active word tracking for karaoke/bouncy pop
    if (activeIdx >= 0) {
      const seg = project.segments[activeIdx];
      const words = seg.text.split(' ');
      const segDuration = Math.max(0.1, seg.end - seg.start);
      const elapsed = time - seg.start;
      const wordIdx = Math.min(words.length - 1, Math.floor((elapsed / segDuration) * words.length));
      setActiveWordIndex(Math.max(0, wordIdx));
    }
  };

  const loadProjectData = async (showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    try {
      const proj = await api.getProject(projectId);
      setProject(proj);

      // If project has no segments yet and transcription is not already running, auto-generate captions!
      if ((!proj.segments || proj.segments.length === 0) && !isGlobalTranscribing) {
        handleTriggerTranscription(proj);
      } else if (proj.segments && proj.segments.length > 0) {
        loadTranscriptExtras();
      }
    } catch (err: any) {
      console.error('Failed to load project:', err);
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  };

  const loadTranscriptExtras = async () => {
    try {
      const extras = await api.getTranscript(projectId);
      setSuggestions(extras.suggestions || []);
    } catch (err) {
      console.warn('Transcript extras note:', err);
    }
  };

  // ----------------------------------------------------
  // Transcription Job Workflow (Delegated to Global Context)
  // ----------------------------------------------------
  const handleTriggerTranscription = async (currentProj?: Project, scriptOverride?: string) => {
    const target = currentProj || project;
    if (!target) return;

    const preferred = (scriptOverride || target.preferredScript || 'tenglish') as any;
    await triggerGlobalTranscription(target.id, preferred, () => {
      loadProjectData(false);
    });
  };

  // ----------------------------------------------------
  // Video Export Job Workflow (Delegated to Global Context)
  // ----------------------------------------------------
  const handleTriggerExport = async () => {
    if (!project) return;
    await triggerGlobalExport(project.id, () => {
      loadProjectData(false);
    });
  };

  // ----------------------------------------------------
  // Video Player Controls
  // ----------------------------------------------------
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const seekTo = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, seconds);
    setCurrentTime(seconds);
  };

  const jumpToSegment = (seg: CaptionSegment) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = seg.start;
    videoRef.current.play();
    setIsPlaying(true);
  };

  // ----------------------------------------------------
  // Caption Segment Editing Actions
  // ----------------------------------------------------
  const updateSegmentText = async (index: number, newText: string) => {
    if (!project) return;
    const newSegments = [...project.segments];
    newSegments[index] = {
      ...newSegments[index],
      text: newText,
      isModifiedByUser: true
    };
    setProject({ ...project, segments: newSegments });
    try {
      await api.updateTranscript(project.id, newSegments);
    } catch (err) {
      console.error(err);
    }
  };

  const updateSegmentTimestamps = async (index: number, start: number, end: number) => {
    if (!project) return;
    const newSegments = [...project.segments];
    newSegments[index] = {
      ...newSegments[index],
      start: Number(start.toFixed(2)),
      end: Number(end.toFixed(2)),
      isModifiedByUser: true
    };
    setProject({ ...project, segments: newSegments });
    try {
      await api.updateTranscript(project.id, newSegments);
    } catch (err) {
      console.error(err);
    }
  };

  const splitSegment = async (index: number) => {
    if (!project) return;
    const seg = project.segments[index];
    const words = seg.text.split(' ');
    if (words.length < 2) return;

    const midWord = Math.floor(words.length / 2);
    const midTime = Number(((seg.start + seg.end) / 2).toFixed(2));

    const seg1: CaptionSegment = {
      id: `seg_${Date.now()}_1`,
      start: seg.start,
      end: midTime,
      text: words.slice(0, midWord).join(' ')
    };

    const seg2: CaptionSegment = {
      id: `seg_${Date.now()}_2`,
      start: Number((midTime + 0.05).toFixed(2)),
      end: seg.end,
      text: words.slice(midWord).join(' ')
    };

    const newSegments = [
      ...project.segments.slice(0, index),
      seg1,
      seg2,
      ...project.segments.slice(index + 1)
    ];

    setProject({ ...project, segments: newSegments });
    await api.updateTranscript(project.id, newSegments);
  };

  const mergeWithNext = async (index: number) => {
    if (!project || index >= project.segments.length - 1) return;
    const cur = project.segments[index];
    const next = project.segments[index + 1];

    const merged: CaptionSegment = {
      id: cur.id,
      start: cur.start,
      end: next.end,
      text: `${cur.text} ${next.text}`
    };

    const newSegments = [
      ...project.segments.slice(0, index),
      merged,
      ...project.segments.slice(index + 2)
    ];

    setProject({ ...project, segments: newSegments });
    await api.updateTranscript(project.id, newSegments);
  };

  const deleteSegment = async (index: number) => {
    if (!project) return;
    const newSegments = project.segments.filter((_, idx) => idx !== index);
    setProject({ ...project, segments: newSegments });
    await api.updateTranscript(project.id, newSegments);
  };

  const addSegment = async (afterIndex: number) => {
    if (!project) return;
    const cur = project.segments[afterIndex];
    const newStart = cur ? Number((cur.end + 0.1).toFixed(2)) : 0;
    const newEnd = Number((newStart + 2.0).toFixed(2));

    const newSeg: CaptionSegment = {
      id: `seg_${Date.now()}`,
      start: newStart,
      end: newEnd,
      text: 'New subtitle caption line'
    };

    const newSegments = [
      ...project.segments.slice(0, afterIndex + 1),
      newSeg,
      ...project.segments.slice(afterIndex + 1)
    ];

    setProject({ ...project, segments: newSegments });
    await api.updateTranscript(project.id, newSegments);
  };

  const addCaptionAtCurrentTime = async () => {
    if (!project) return;
    const start = Number(currentTime.toFixed(2));
    const end = Number((start + 2.0).toFixed(2));
    const newSeg: CaptionSegment = {
      id: `seg_${Date.now()}`,
      start,
      end,
      text: 'Type your caption line here'
    };

    const newSegments = [...project.segments, newSeg].sort((a, b) => a.start - b.start);
    setProject({ ...project, segments: newSegments });
    await api.updateTranscript(project.id, newSegments);
  };

  const handleEditorVideoUpload = async (file: File) => {
    if (!project || !file) return;
    try {
      const blobUrl = URL.createObjectURL(file);
      const updated = {
        ...project,
        videoFileName: file.name,
        clientPreviewUrl: blobUrl
      };
      setProject(updated);

      await startUploadAndTranscribe(file, {
        sourceLanguage: project.sourceLanguage,
        targetLanguage: project.targetLanguage,
        onSuccess: () => {
          loadProjectData(false);
        }
      });
    } catch (e: any) {
      alert('Could not load video: ' + e.message);
    }
  };

  const handleUndo = async () => {
    if (!project) return;
    try {
      const res = await api.undoTranscript(project.id);
      setProject({ ...project, segments: res.segments });
    } catch (err) {
      console.warn(err);
    }
  };

  const handleRedo = async () => {
    if (!project) return;
    try {
      const res = await api.redoTranscript(project.id);
      setProject({ ...project, segments: res.segments });
    } catch (err) {
      console.warn(err);
    }
  };

  // ----------------------------------------------------
  // Style & Template Updates
  // ----------------------------------------------------
  const handleSelectTemplate = async (templateId: string) => {
    if (!project || !CAPTION_TEMPLATES[templateId]) return;
    const tpl = CAPTION_TEMPLATES[templateId];
    const updatedStyle = { ...tpl };
    setProject({ ...project, style: updatedStyle });
    await api.updateStyle(project.id, updatedStyle);
  };

  const handleUpdateStyleProperty = async (prop: keyof CaptionStyle, value: any) => {
    if (!project) return;
    const updatedStyle = { ...project.style, [prop]: value };
    setProject({ ...project, style: updatedStyle });
    await api.updateStyle(project.id, { [prop]: value });
  };

  // ----------------------------------------------------
  // Custom Creator Vocabulary
  // ----------------------------------------------------
  const handleAddCustomVocab = async () => {
    if (!project || !newVocabTerm.trim() || !newVocabSpelling.trim()) return;
    try {
      const updatedList = await api.addVocabulary(project.id, {
        term: newVocabTerm.trim(),
        preferredSpelling: newVocabSpelling.trim(),
        category: 'custom'
      });
      setProject({ ...project, customVocabulary: updatedList });
      setNewVocabTerm('');
      setNewVocabSpelling('');
      setShowVocabModal(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isLoading || !project) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 text-slate-300">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-semibold">Loading Capzen Studio...</p>
      </div>
    );
  }

  // Determine active video source (prioritize client blob URL for instant 0ms playback!)
  const activeVideoSrc = clientPreviewUrl || project.videoUrl;
  const activeSegment = activeSegmentIndex >= 0 ? project.segments[activeSegmentIndex] : null;

  return (
    <div className="min-h-[calc(100vh-60px)] bg-slate-950 text-slate-100 flex flex-col">
      
      {/* CAPZEN PRO TOP BAR */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-white truncate max-w-xs">
              {project.name}
            </span>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-950/80 border border-blue-800/60 px-1.5 py-0.5 rounded font-bold uppercase">
              {project.targetLanguage || 'Tenglish'}
            </span>
          </div>
        </div>

        {/* Studio Tabs (CapCut Style: Captions / Style / Language / Export) */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('transcript')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'transcript'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Captions</span>
          </button>

          <button
            onClick={() => setActiveTab('style')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'style'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Style & Fonts</span>
          </button>

          <button
            onClick={() => setActiveTab('language')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'language'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Language</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>

        {/* Undo / Redo & Quick Export */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <input
            type="file"
            ref={editorFileInputRef}
            className="hidden"
            accept="video/*,.mp4,.mov,.webm,.mkv,.avi"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleEditorVideoUpload(e.target.files[0]);
              }
            }}
          />
          <button
            onClick={() => editorFileInputRef.current?.click()}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            title="Upload or change video"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Change Video</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className="ml-1 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export MP4</span>
          </button>
        </div>
      </div>

      {/* WORKSPACE: CENTER MONITOR + RIGHT INSPECTOR */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* CENTER COLUMN: PREVIEW MONITOR & TIMELINE (Lg col 7) */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-slate-950 p-4 border-r border-slate-800/80 overflow-y-auto">
          
          {/* Video Viewport Container */}
          <div className="flex-1 flex items-center justify-center min-h-[420px] relative">
            <div className="relative max-w-[320px] sm:max-w-[340px] aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 flex items-center justify-center">
              {/* HTML5 Video with instant local blob or backend streaming */}
              <video
                ref={videoRef}
                src={activeVideoSrc}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                playsInline
                muted={isMuted}
                className="w-full h-full object-cover"
              />

              {/* Dynamic Styled Caption Overlay */}
              {activeSegment && (
                <div
                  className={`absolute inset-x-3 flex flex-col items-center pointer-events-none transition-all duration-100 ${
                    project.style.verticalPosition === 'top'
                      ? 'top-10'
                      : project.style.verticalPosition === 'center'
                      ? 'top-1/2 -translate-y-1/2'
                      : project.style.verticalPosition === 'bottom'
                      ? 'bottom-6'
                      : 'bottom-16' // lower-third default
                  }`}
                >
                  <div
                    style={{
                      backgroundColor: project.style.backgroundOpacity > 0
                        ? project.style.backgroundColor
                        : 'transparent',
                      padding: project.style.backgroundOpacity > 0 ? '6px 14px' : '0'
                    }}
                    className="rounded-xl text-center max-w-[96%]"
                  >
                    <span
                      style={{
                        fontFamily: project.style.fontFamily || 'Montserrat',
                        fontSize: `${project.style.fontSize}px`,
                        fontWeight: project.style.fontWeight || 800,
                        color: project.style.textColor,
                        WebkitTextStroke: `${project.style.outlineWidth}px ${project.style.outlineColor}`,
                        textShadow: project.style.shadowColor
                          ? `0 0 ${project.style.shadowBlur || 8}px ${project.style.shadowColor}`
                          : project.style.outlineWidth > 0 ? '0 2px 4px rgba(0,0,0,0.9)' : 'none',
                        lineHeight: project.style.lineSpacing || 1.2,
                        textTransform: project.style.textTransform || 'none'
                      }}
                      className="tracking-tight inline-block select-none"
                    >
                      {/* Active word tracking for Bouncy Pop / Hormozi / Karaoke */}
                      {project.style.highlightMode === 'word' ? (
                        activeSegment.text.split(' ').map((word, wIdx) => {
                          const isWordActive = wIdx === activeWordIndex;
                          return (
                            <span
                              key={wIdx}
                              style={{
                                color: isWordActive ? project.style.highlightColor : project.style.textColor,
                                transform: isWordActive ? 'scale(1.08)' : 'scale(1)',
                                display: 'inline-block',
                                transition: 'transform 80ms ease-out'
                              }}
                              className="mr-1.5"
                            >
                              {word}
                            </span>
                          );
                        })
                      ) : (
                        activeSegment.text
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Live Speech Recognition Overlay on Monitor Viewport */}
              {isGlobalTranscribing && (
                <div className="absolute top-4 inset-x-4 bg-slate-900/90 border border-blue-500/60 rounded-xl p-3 text-center text-xs backdrop-blur-md shadow-2xl z-20 space-y-2 pointer-events-none">
                  <div className="flex items-center justify-between text-blue-200 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                      <span>Auto-Generating Captions...</span>
                    </span>
                    <span className="font-mono text-cyan-300 font-bold">{globalProgress}%</span>
                  </div>
                  <p className="text-[11px] text-slate-300 text-left truncate">
                    {globalStage || 'Running local Whisper speech AI model...'}
                  </p>
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                      style={{ width: `${globalProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Central Play/Pause Trigger */}
              <button
                onClick={togglePlayPause}
                className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/30 transition-colors group"
              >
                {!isPlaying && !isGlobalTranscribing && (
                  <div className="w-14 h-14 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform">
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* CAPCUT / PREMIERE PRO MULTI-TRACK TIMELINE */}
          <div className="mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            {/* Playhead Controls & Timecode */}
            <div className="flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlayPause}
                  className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <div className="font-mono tabular-nums text-xs font-bold text-white bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  {currentTime.toFixed(2)}s / {project.duration.toFixed(2)}s
                </div>

                <button
                  onClick={addCaptionAtCurrentTime}
                  className="px-2 py-1 bg-blue-600/90 hover:bg-blue-600 text-white rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors shadow-sm"
                  title="Add caption line at playhead"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Caption</span>
                </button>
              </div>

              {/* Speed Buttons */}
              <div className="flex items-center gap-1 text-[10px] font-bold">
                {[0.75, 1, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => {
                      setPlaybackSpeed(speed);
                      if (videoRef.current) videoRef.current.playbackRate = speed;
                    }}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      playbackSpeed === speed
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Scrubber Track */}
            <div className="space-y-1.5">
              <input
                type="range"
                min={0}
                max={project.duration || 10}
                step={0.05}
                value={currentTime}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />

              {/* Caption Blocks Timeline Track (CapCut Track Representation) */}
              <div className="h-7 bg-slate-950 rounded-lg border border-slate-800/80 relative overflow-hidden flex items-center px-1">
                {project.segments.map((seg, idx) => {
                  const totalDur = project.duration || 1;
                  const leftPct = (seg.start / totalDur) * 100;
                  const widthPct = Math.max(2, ((seg.end - seg.start) / totalDur) * 100);
                  const isActive = activeSegmentIndex === idx;

                  return (
                    <div
                      key={seg.id || idx}
                      onClick={() => jumpToSegment(seg)}
                      title={`${seg.start}s - ${seg.end}s: ${seg.text}`}
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`
                      }}
                      className={`absolute h-5 rounded text-[10px] truncate px-1 flex items-center font-medium cursor-pointer transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white font-bold ring-1 ring-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {seg.text}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: INSPECTOR & CONTROLS (Lg col 5) */}
        <div className="lg:col-span-5 bg-slate-900 border-l border-slate-800 p-5 overflow-y-auto max-h-[calc(100vh-60px)] space-y-6">
          
          {/* TAB 1: CAPTION SEGMENTS (INLINE EDITING + TENGLISH CODE-SWITCHING) */}
          {activeTab === 'transcript' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Caption Track ({project.segments.length})</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Edit text inline, split or merge lines, and adjust timestamps
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={addCaptionAtCurrentTime}
                    className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Caption</span>
                  </button>

                  <button
                    onClick={() => handleTriggerTranscription()}
                    disabled={isGlobalTranscribing}
                    className="px-2.5 py-1 text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-800 rounded-lg hover:bg-blue-900 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGlobalTranscribing ? 'animate-spin' : ''}`} />
                    <span>Auto-Captions</span>
                  </button>
                </div>
              </div>

              {/* Transcribe in progress banner */}
              {isGlobalTranscribing && (
                <div className="bg-blue-950/80 border border-blue-800/80 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-blue-200 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                      <span>{globalStage || 'Running speech recognition model...'}</span>
                    </span>
                    <span className="font-mono tabular-nums text-cyan-300">{globalProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-blue-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                      style={{ width: `${globalProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Tenglish Preserved Words / Suggestions Banner */}
              {suggestions.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <span className="flex items-center gap-1 text-blue-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Preserved English & Roman Terms</span>
                    </span>
                    <button
                      onClick={() => setShowVocabModal(true)}
                      className="text-[11px] text-blue-400 hover:underline lowercase"
                    >
                      + vocabulary
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {suggestions.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-slate-200 font-medium"
                      >
                        <span className="text-blue-400 font-bold">{s.suggested}</span>
                        <span className="text-slate-500 ml-1 text-[10px]">({s.original})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state when no captions exist yet */}
              {project.segments.length === 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      {isGlobalTranscribing ? 'Generating Captions...' : 'No Captions on Track'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      {isGlobalTranscribing
                        ? 'Speech recognition is detecting spoken Telugu-English and normalizing into Tenglish...'
                        : 'Auto-generate Telugu/Tenglish captions with local AI or type lines manually at any point.'}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                    <button
                      onClick={() => handleTriggerTranscription()}
                      disabled={isGlobalTranscribing}
                      className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Wand2 className={`w-3.5 h-3.5 ${isGlobalTranscribing ? 'animate-spin' : ''}`} />
                      <span>{isGlobalTranscribing ? 'Generating...' : 'Auto-Generate Captions'}</span>
                    </button>
                    <button
                      onClick={addCaptionAtCurrentTime}
                      className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Line Manually</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Segments List */}
              <div className="space-y-3">
                {project.segments.map((seg, idx) => {
                  const isActive = activeSegmentIndex === idx;
                  return (
                    <div
                      key={seg.id || idx}
                      onClick={() => jumpToSegment(seg)}
                      className={`cursor-pointer rounded-xl p-3 border transition-all space-y-2 ${
                        isActive
                          ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500/30'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      {/* Segment Controls Header */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-500 font-mono text-[11px]">#{idx + 1}</span>
                          <span className="font-mono tabular-nums text-[11px] text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {seg.start.toFixed(2)}s – {seg.end.toFixed(2)}s
                          </span>
                        </div>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => splitSegment(idx)}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                            title="Split into two lines"
                          >
                            <Split className="w-3.5 h-3.5" />
                          </button>
                          {idx < project.segments.length - 1 && (
                            <button
                              onClick={() => mergeWithNext(idx)}
                              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                              title="Merge with next line"
                            >
                              <Merge className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => addSegment(idx)}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                            title="Add line below"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteSegment(idx)}
                            className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Inline Text Edit */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={seg.text}
                          onChange={(e) => updateSegmentText(idx, e.target.value)}
                          className="w-full text-xs font-semibold text-white bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: STYLE & FONTS (CAPCUT / PREMIERE PRO STYLING SUITE) */}
          {activeTab === 'style' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-blue-400" />
                  <span>Trending Caption Presets</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pick a trending viral style, then fine-tune typography & colors
                </p>
              </div>

              {/* 6 Trending Presets Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {Object.values(CAPTION_TEMPLATES).map((tpl) => {
                  const isSelected = project.style.id === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => handleSelectTemplate(tpl.id)}
                      className={`cursor-pointer rounded-xl p-3 border transition-all text-left ${
                        isSelected
                          ? 'border-blue-500 bg-blue-950/60 ring-2 ring-blue-500/30'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{tpl.name}</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                        {tpl.tagline}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Detailed Styling Controls */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  <span>Typography & Effects</span>
                </h4>

                {/* Font Family Selector */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Font Family</label>
                  <select
                    value={project.style.fontFamily}
                    onChange={(e) => handleUpdateStyleProperty('fontFamily', e.target.value)}
                    className="w-full text-xs font-bold bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Montserrat">Montserrat (Viral Heavyweight)</option>
                    <option value="Anton">Anton / Impact (Hormozi Massive)</option>
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans (Modern Clean)</option>
                    <option value="Bebas Neue">Bebas Neue (Condensed Bold)</option>
                    <option value="JetBrains Mono">JetBrains Mono (Tech & Coding)</option>
                    <option value="Syne">Syne (Geometric Punch)</option>
                  </select>
                </div>

                {/* Text Casing & Alignment */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Text Casing</label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        onClick={() => handleUpdateStyleProperty('textTransform', 'uppercase')}
                        className={`py-1 text-xs font-bold rounded ${
                          project.style.textTransform === 'uppercase'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        UPPER
                      </button>
                      <button
                        onClick={() => handleUpdateStyleProperty('textTransform', 'none')}
                        className={`py-1 text-xs font-bold rounded ${
                          project.style.textTransform !== 'uppercase'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        Natural
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Highlight Mode</label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        onClick={() => handleUpdateStyleProperty('highlightMode', 'word')}
                        className={`py-1 text-xs font-bold rounded ${
                          project.style.highlightMode === 'word'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        Per Word
                      </button>
                      <button
                        onClick={() => handleUpdateStyleProperty('highlightMode', 'phrase')}
                        className={`py-1 text-xs font-bold rounded ${
                          project.style.highlightMode === 'phrase'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        Phrase
                      </button>
                    </div>
                  </div>
                </div>

                {/* Font Size & Outline Width Sliders */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                      <span>Font Size</span>
                      <span className="font-mono tabular-nums">{project.style.fontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min={18}
                      max={48}
                      value={project.style.fontSize}
                      onChange={(e) => handleUpdateStyleProperty('fontSize', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                      <span>Outline Stroke</span>
                      <span className="font-mono tabular-nums">{project.style.outlineWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={6}
                      step={0.5}
                      value={project.style.outlineWidth}
                      onChange={(e) => handleUpdateStyleProperty('outlineWidth', parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>

                {/* Color Pickers */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Text Color</span>
                    <input
                      type="color"
                      value={project.style.textColor}
                      onChange={(e) => handleUpdateStyleProperty('textColor', e.target.value)}
                      className="w-7 h-7 rounded bg-transparent border-0 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-yellow-400">Word Highlight</span>
                    <input
                      type="color"
                      value={project.style.highlightColor}
                      onChange={(e) => handleUpdateStyleProperty('highlightColor', e.target.value)}
                      className="w-7 h-7 rounded bg-transparent border-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Vertical Position */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-300">Screen Position</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'lower_third', label: 'Lower 1/3' },
                      { id: 'center', label: 'Center' },
                      { id: 'bottom', label: 'Bottom' },
                      { id: 'top', label: 'Top' }
                    ].map((pos) => (
                      <button
                        key={pos.id}
                        onClick={() => handleUpdateStyleProperty('verticalPosition', pos.id)}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          project.style.verticalPosition === pos.id
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: LANGUAGE & SCRIPT SWITCHER */}
          {activeTab === 'language' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span>Language & Script Controls</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Switch between Roman Tenglish, pure Telugu script, or translated English captions
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: 'tenglish',
                    title: 'Tenglish (Roman Telugu + Spoken English)',
                    desc: 'Accurate Telugu written in English letters with preserved English terms (e.g. "Bro, idhi oka manchi opportunity. Freshers kuda apply cheskovachu.")'
                  },
                  {
                    id: 'telugu',
                    title: 'Telugu Script (తెలుగు లిపి)',
                    desc: 'Traditional Telugu unicode alphabet (e.g. "బ్రో, ఇది ఒక మంచి ఆపర్చునిటీ. ఫ్రెషర్స్ కూడా అప్లై చేసుకోవచ్చు.")'
                  },
                  {
                    id: 'english',
                    title: 'English (Translated Captions)',
                    desc: 'Direct English subtitles translated from Telugu speech.'
                  }
                ].map((item) => {
                  const isCurrent = (project.targetLanguage || 'tenglish') === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={async () => {
                        const updated = projectStoreUpdate(item.id);
                        if (updated) {
                          handleTriggerTranscription(updated, item.id);
                        }
                      }}
                      className={`cursor-pointer p-4 rounded-xl border transition-all space-y-1 ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-950/60 ring-2 ring-blue-500/30'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{item.title}</span>
                        {isCurrent && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: EXPORT (FFMPEG VIDEO RENDERER) */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>Render & Export Captioned Video</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Burns subtitles permanently into your 9:16 vertical MP4 video using local FFmpeg
                </p>
              </div>

              {/* Render Trigger Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-white">FFmpeg Subtitle Burner</h4>
                    <p className="text-[11px] text-slate-400">
                      Preset: <span className="text-blue-400 font-bold">{project.style.name}</span> · {project.segments.length} Lines
                    </p>
                  </div>
                  <button
                    onClick={handleTriggerExport}
                    disabled={isGlobalExporting}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isGlobalExporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Rendering...</span>
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4" />
                        <span>Render Captioned MP4</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Progress bar */}
                {isGlobalExporting && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                      <span>{globalExportStage}</span>
                      <span className="font-bold">{globalExportProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${globalExportProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error message */}
                {globalExportError && (
                  <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{globalExportError}</span>
                  </div>
                )}
              </div>

              {/* Download Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* MP4 Download */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <Video className="w-4 h-4" />
                    <span>Captioned MP4 Video</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    High definition vertical video with burned captions ready for Instagram Reels or Shorts.
                  </p>
                  {project.exportedVideoUrl ? (
                    <a
                      href={`/api/projects/${project.id}/download`}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Video</span>
                    </a>
                  ) : (
                    <button
                      disabled
                      className="w-full py-2 bg-slate-900 text-slate-500 text-xs font-bold rounded-lg cursor-not-allowed"
                    >
                      Render Video First
                    </button>
                  )}
                </div>

                {/* SRT Download */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Type className="w-4 h-4" />
                    <span>Subtitle File (.SRT)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Standard SRT subtitle file with timestamps and caption text.
                  </p>
                  <a
                    href={`/api/projects/${project.id}/download-srt`}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download .SRT</span>
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Helper function to update project script */}
      {(() => {
        (window as any)._updateScript = (id: string, script: string) => {
          if (!project) return project;
          const updated = { ...project, targetLanguage: script, preferredScript: script as any };
          setProject(updated);
          return updated;
        };
        return null;
      })()}

      {/* Creator Custom Vocabulary Modal */}
      {showVocabModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">
              Add Custom Creator Vocabulary
            </h3>
            <p className="text-xs text-slate-400">
              Set custom preferred spellings for your channel name, slang, or niche terms.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Spoken / Phonetic Word</label>
                <input
                  type="text"
                  placeholder="e.g. chesukondi"
                  value={newVocabTerm}
                  onChange={(e) => setNewVocabTerm(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg p-2.5 mt-1 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Preferred Roman Spelling</label>
                <input
                  type="text"
                  placeholder="e.g. cheskondi"
                  value={newVocabSpelling}
                  onChange={(e) => setNewVocabSpelling(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg p-2.5 mt-1 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowVocabModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomVocab}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
              >
                Save Word
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  function projectStoreUpdate(lang: string): Project | undefined {
    if (!project) return undefined;
    const upd = { ...project, targetLanguage: lang, preferredScript: lang as any };
    setProject(upd);
    return upd;
  }
};
