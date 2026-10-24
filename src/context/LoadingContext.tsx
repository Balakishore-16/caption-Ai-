import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Project, ProcessingJob } from '../types';
import { CAPTION_TEMPLATES } from '../../server/templates';

export interface LoadingContextType {
  // Upload State
  isUploading: boolean;
  uploadProgress: number;
  uploadStage: string;
  uploadFileName: string | null;

  // Transcription State
  isTranscribing: boolean;
  transcribeJobId: string | null;
  transcribeProgress: number;
  transcribeStage: string;
  transcribeError: string | null;
  transcribeSuccess: boolean;

  // Export State
  isExporting: boolean;
  exportJobId: string | null;
  exportProgress: number;
  exportStage: string;
  exportError: string | null;

  // Consolidated
  isBusy: boolean;
  overallProgress: number;
  activeStatusHeadline: string;
  activeStatusSubline: string;
  activeProjectId: string | null;

  // Actions
  startUploadAndTranscribe: (
    file: File,
    options?: {
      sourceLanguage?: string;
      targetLanguage?: string;
      selectedTemplate?: string;
      onSuccess?: (projectId: string, clientPreviewUrl?: string) => void;
      onError?: (error: string) => void;
    }
  ) => Promise<string | null>;

  startTranscription: (
    projectId: string,
    scriptOverride?: 'tenglish' | 'telugu',
    onComplete?: () => void
  ) => Promise<string | null>;

  startExport: (
    projectId: string,
    onComplete?: (result: any) => void
  ) => Promise<string | null>;

  pollJob: (
    jobId: string,
    type: 'transcribe' | 'export',
    onSuccessCallback?: (result?: any) => void
  ) => void;

  dismissBanner: () => void;
  clearErrors: () => void;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);

  // Transcription state
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeJobId, setTranscribeJobId] = useState<string | null>(null);
  const [transcribeProgress, setTranscribeProgress] = useState(0);
  const [transcribeStage, setTranscribeStage] = useState('');
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [transcribeSuccess, setTranscribeSuccess] = useState(false);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStage, setExportStage] = useState('');
  const [exportError, setExportError] = useState<string | null>(null);

  // Active project
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Polling ref
  const pollingRef = useRef<{ [jobId: string]: any }>({});

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(pollingRef.current).forEach((timer) => clearInterval(timer));
    };
  }, []);

  const clearErrors = useCallback(() => {
    setTranscribeError(null);
    setExportError(null);
  }, []);

  const dismissBanner = useCallback(() => {
    setTranscribeSuccess(false);
    clearErrors();
  }, [clearErrors]);

  /**
   * Polls a background job (transcription or export) with real-time updates
   */
  const pollJob = useCallback((
    jobId: string,
    type: 'transcribe' | 'export',
    onSuccessCallback?: (result?: any) => void
  ) => {
    if (!jobId) return;

    if (pollingRef.current[jobId]) {
      clearInterval(pollingRef.current[jobId]);
    }

    if (type === 'transcribe') {
      setIsTranscribing(true);
      setTranscribeJobId(jobId);
      setTranscribeError(null);
      setTranscribeSuccess(false);
    } else {
      setIsExporting(true);
      setExportJobId(jobId);
      setExportError(null);
    }

    pollingRef.current[jobId] = setInterval(async () => {
      try {
        const job = await api.getJob(jobId);

        if (type === 'transcribe') {
          setTranscribeProgress(job.progress || 0);
          setTranscribeStage(job.stage || 'Processing speech...');

          if (job.status === 'completed') {
            clearInterval(pollingRef.current[jobId]);
            delete pollingRef.current[jobId];
            setIsTranscribing(false);
            setTranscribeProgress(100);
            setTranscribeStage('Captions generated and synchronized successfully!');
            setTranscribeSuccess(true);
            onSuccessCallback?.();
            // Auto hide success badge after 6 seconds
            setTimeout(() => setTranscribeSuccess(false), 6000);
          } else if (job.status === 'failed') {
            clearInterval(pollingRef.current[jobId]);
            delete pollingRef.current[jobId];
            setIsTranscribing(false);
            setTranscribeError(job.error || 'Speech transcription failed');
          }
        } else if (type === 'export') {
          setExportProgress(job.progress || 0);
          setExportStage(job.stage || 'Rendering MP4...');

          if (job.status === 'completed') {
            clearInterval(pollingRef.current[jobId]);
            delete pollingRef.current[jobId];
            setIsExporting(false);
            setExportProgress(100);
            setExportStage('Video export complete!');
            onSuccessCallback?.();
          } else if (job.status === 'failed') {
            clearInterval(pollingRef.current[jobId]);
            delete pollingRef.current[jobId];
            setIsExporting(false);
            setExportError(job.error || 'Video export rendering failed');
          }
        }
      } catch (err: any) {
        console.warn('[Job poll note]', err.message);
      }
    }, 800);
  }, []);

  /**
   * High-level workflow: Creates project, uploads video with real-time percentage,
   * stages preview, initiates auto-transcription, and monitors job to completion.
   */
  const startUploadAndTranscribe = useCallback(async (
    file: File,
    options?: {
      sourceLanguage?: string;
      targetLanguage?: string;
      selectedTemplate?: string;
      onSuccess?: (projectId: string, clientPreviewUrl?: string) => void;
      onError?: (error: string) => void;
    }
  ): Promise<string | null> => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadFileName(file.name);
    setUploadStage('Initializing Capzen project...');
    clearErrors();

    let clientBlobUrl: string | undefined = undefined;
    try {
      clientBlobUrl = URL.createObjectURL(file);
    } catch (_) {}

    try {
      // 1. Create project
      const projectName = file.name.replace(/\.[^/.]+$/, '') || 'My Vertical Reel';
      const project = await api.createProject(projectName);
      setActiveProjectId(project.id);

      // Apply initial template if chosen
      if (options?.selectedTemplate && CAPTION_TEMPLATES[options.selectedTemplate]) {
        try {
          await api.updateStyle(project.id, CAPTION_TEMPLATES[options.selectedTemplate]);
        } catch (_) {}
      }

      // 2. Upload video with live progress callback
      setUploadStage('Uploading video to local Capzen studio...');
      const uploadRes = await api.uploadVideo(
        project.id,
        file,
        options?.sourceLanguage || 'auto',
        options?.targetLanguage || 'tenglish',
        (pct, stage) => {
          setUploadProgress(pct);
          setUploadStage(stage);
        }
      );

      setIsUploading(false);
      setUploadProgress(100);
      setUploadStage('Video uploaded successfully');

      // 3. Immediately trigger user callback so view transitions with 0ms delay!
      options?.onSuccess?.(project.id, clientBlobUrl);

      // 4. If backend auto-started transcribe job, monitor it; otherwise initiate manually
      const transcribeJobId = uploadRes.jobId;
      if (transcribeJobId) {
        pollJob(transcribeJobId, 'transcribe');
      } else {
        // Fallback manual trigger
        const pref = (options?.targetLanguage === 'telugu' ? 'telugu' : 'tenglish') as any;
        const res = await api.transcribe(project.id, pref);
        if (res.jobId) {
          pollJob(res.jobId, 'transcribe');
        }
      }

      return project.id;
    } catch (err: any) {
      console.error('[Upload & Transcribe failed]', err);
      setIsUploading(false);
      setTranscribeError(err.message || 'Video processing failed. Please check file format.');
      options?.onError?.(err.message || 'Upload failed');
      return null;
    }
  }, [clearErrors, pollJob]);

  /**
   * Manually triggers or re-triggers transcription for an existing project
   */
  const startTranscription = useCallback(async (
    projectId: string,
    scriptOverride?: 'tenglish' | 'telugu',
    onComplete?: () => void
  ): Promise<string | null> => {
    setActiveProjectId(projectId);
    setIsTranscribing(true);
    setTranscribeProgress(10);
    setTranscribeStage('Initiating speech model...');
    clearErrors();

    try {
      const { jobId } = await api.transcribe(projectId, scriptOverride || 'tenglish');
      setTranscribeJobId(jobId);
      pollJob(jobId, 'transcribe', onComplete);
      return jobId;
    } catch (err: any) {
      setIsTranscribing(false);
      setTranscribeError(err.message || 'Could not start transcription');
      return null;
    }
  }, [clearErrors, pollJob]);

  /**
   * Manually triggers export job
   */
  const startExport = useCallback(async (
    projectId: string,
    onComplete?: (result: any) => void
  ): Promise<string | null> => {
    setActiveProjectId(projectId);
    setIsExporting(true);
    setExportProgress(10);
    setExportStage('Preparing FFmpeg subtitle burn...');
    clearErrors();

    try {
      const { jobId } = await api.exportVideo(projectId);
      setExportJobId(jobId);
      pollJob(jobId, 'export', onComplete);
      return jobId;
    } catch (err: any) {
      setIsExporting(false);
      setExportError(err.message || 'Could not start video export');
      return null;
    }
  }, [clearErrors, pollJob]);

  // Consolidated busy & progress metrics
  const isBusy = isUploading || isTranscribing || isExporting;

  let overallProgress = 0;
  let activeStatusHeadline = '';
  let activeStatusSubline = '';

  if (isUploading) {
    overallProgress = Math.round(uploadProgress * 0.3); // Upload is first 30% of end-to-end flow
    activeStatusHeadline = `Uploading ${uploadFileName || 'Video'}`;
    activeStatusSubline = uploadStage || 'Transferring media bytes to workspace...';
  } else if (isTranscribing) {
    overallProgress = 30 + Math.round(transcribeProgress * 0.7); // Transcription is 30% - 100%
    activeStatusHeadline = 'Generating Tenglish Captions';
    activeStatusSubline = transcribeStage || 'Running local Whisper speech AI model...';
  } else if (isExporting) {
    overallProgress = exportProgress;
    activeStatusHeadline = 'Burning Subtitles into MP4';
    activeStatusSubline = exportStage || 'Rendering high-definition video...';
  } else if (transcribeSuccess) {
    overallProgress = 100;
    activeStatusHeadline = 'Captions Ready!';
    activeStatusSubline = 'All speech segments recognized, transliterated & synced.';
  }

  return (
    <LoadingContext.Provider
      value={{
        isUploading,
        uploadProgress,
        uploadStage,
        uploadFileName,

        isTranscribing,
        transcribeJobId,
        transcribeProgress,
        transcribeStage,
        transcribeError,
        transcribeSuccess,

        isExporting,
        exportJobId,
        exportProgress,
        exportStage,
        exportError,

        isBusy,
        overallProgress,
        activeStatusHeadline,
        activeStatusSubline,
        activeProjectId,

        startUploadAndTranscribe,
        startTranscription,
        startExport,
        pollJob,
        dismissBanner,
        clearErrors
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
