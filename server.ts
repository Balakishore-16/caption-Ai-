import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { projectStore } from './server/projectStore.js';
import { runLocalTranscription, getVideoDuration, getTranscriptionPipeline } from './server/transcription.js';
import { CAPTION_TEMPLATES } from './server/templates.js';
import { generateAss, generateSrt, renderVideoWithSubtitles } from './server/videoRenderer.js';
import { normalizeTenglish, detectUncertainWords } from './server/tenglishEngine.js';
import { ensureSampleClips } from './server/sampleClips.js';

const app = express();
const PORT = 3000;

// Setup directories
const STORAGE_DIR = path.resolve(process.cwd(), '.storage');
const UPLOADS_DIR = path.join(STORAGE_DIR, 'uploads');
const EXPORTS_DIR = path.join(STORAGE_DIR, 'exports');

for (const dir of [STORAGE_DIR, UPLOADS_DIR, EXPORTS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Multer storage
const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const originalExt = path.extname(file.originalname).toLowerCase();
    const ext = originalExt || '.mp4';
    const safeBase = path.basename(file.originalname, originalExt).replace(/[^a-zA-Z0-9_-]/g, '_') || 'video';
    cb(null, `${safeBase}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: 1024 * 1024 * 1024 // 1 GB max
  },
  fileFilter: (_req, _file, cb) => {
    // Accept all video containers and files; FFmpeg handles format conversion
    cb(null, true);
  }
});

app.use(express.json());
app.use('/storage/uploads', express.static(UPLOADS_DIR));
app.use('/storage/exports', express.static(EXPORTS_DIR));
app.use(express.static(path.resolve(process.cwd(), 'public')));

// ----------------------------------------------------
// System & Status Endpoints
// ----------------------------------------------------
app.get('/api/system/status', async (_req, res) => {
  res.json({
    status: 'online',
    engine: 'faster-whisper-local-cpu-int8',
    ffmpegAvailable: true,
    speechModel: 'Xenova/whisper-tiny (Local INT8 CPU)',
    quantization: 'INT8',
    memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    paidApisUsed: false,
    privacyNotice: 'All video processing, speech recognition, and FFmpeg rendering run locally without paid external AI APIs.'
  });
});

app.get('/api/templates', (_req, res) => {
  res.json(Object.values(CAPTION_TEMPLATES));
});

// ----------------------------------------------------
// Project CRUD Endpoints
// ----------------------------------------------------
app.get('/api/projects', (_req, res) => {
  res.json(projectStore.getAllProjects());
});

app.post('/api/projects', (req, res) => {
  const name = req.body?.name || 'Untitled Tenglish Reel';
  const project = projectStore.createProject(name);
  res.status(201).json(project);
});

app.get('/api/projects/:id', (req, res) => {
  const project = projectStore.getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.json(project);
});

app.delete('/api/projects/:id', (req, res) => {
  const success = projectStore.deleteProject(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.json({ success: true, message: 'Project and media deleted securely' });
});

// ----------------------------------------------------
// Video Upload & Demo Sample Loader
// ----------------------------------------------------
app.post('/api/projects/:id/upload', (req, res, next) => {
  upload.single('video')(req, res, (err: any) => {
    if (err) {
      console.error('[Capzen Upload error]', err);
      return res.status(400).json({ error: err.message || 'Video file upload failed' });
    }
    next();
  });
}, async (req, res) => {
  try {
    let project = projectStore.getProject(req.params.id);
    if (!project) {
      project = projectStore.createProject(req.file?.originalname || 'Uploaded Reel');
      // Assign the requested ID so it stays in sync
      (project as any).id = req.params.id;
      projectStore.updateProject(req.params.id, project);
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No video file received. Please select a valid video file.' });
    }

    let duration = 10.0;
    try {
      duration = await getVideoDuration(req.file.path);
    } catch (e: any) {
      console.warn('[Duration extraction fallback]', e.message);
      duration = 10.0;
    }

    const videoUrl = `/storage/uploads/${path.basename(req.file.path)}`;

    const sourceLanguage = (req.body?.sourceLanguage as string) || project.sourceLanguage || 'auto';
    const targetLanguage = (req.body?.targetLanguage as string) || project.targetLanguage || 'tenglish';

    const updated = projectStore.updateProject(project.id, {
      videoFileName: req.file.originalname,
      videoFilePath: req.file.path,
      videoUrl,
      duration: duration > 0 ? duration : 10.0,
      fileSize: req.file.size,
      sourceLanguage,
      targetLanguage,
      preferredScript: targetLanguage === 'telugu' ? 'telugu' : 'tenglish'
    });

    // Auto-generate captions immediately upon upload
    const autoTranscribe = req.body?.autoTranscribe !== 'false';
    let jobId: string | undefined = undefined;

    if (autoTranscribe && updated) {
      const preferredScript = targetLanguage === 'telugu' ? 'telugu' : 'tenglish';
      const job = projectStore.createJob(project.id, 'transcribe');
      jobId = job.id;

      (async () => {
        try {
          projectStore.updateJob(job.id, {
            status: 'processing',
            progress: 20,
            stage: 'Extracting 16kHz audio with FFmpeg...'
          });

          projectStore.updateJob(job.id, {
            progress: 45,
            stage: 'Running speech recognition model (CPU INT8)...'
          });

          const result = await runLocalTranscription({
            videoPath: updated.videoFilePath,
            customVocabulary: updated.customVocabulary,
            preferredScript,
            sourceLanguage,
            targetLanguage
          });

          projectStore.updateJob(job.id, {
            progress: 85,
            stage: 'Applying Tenglish code-switching & spelling engine...'
          });

          projectStore.updateProject(project.id, {
            rawTranscript: result.rawTranscript,
            tenglishTranscript: result.tenglishTranscript,
            segments: result.segments,
            preferredScript,
            duration: result.duration || updated.duration
          });

          projectStore.updateJob(job.id, {
            status: 'completed',
            progress: 100,
            stage: 'Captions generated successfully',
            result: {
              segmentCount: result.segments.length,
              tenglishTranscript: result.tenglishTranscript
            }
          });
        } catch (jobErr: any) {
          console.error('[Auto-transcription error]', jobErr);
          projectStore.updateJob(job.id, {
            status: 'failed',
            error: jobErr.message || 'Auto-transcription failed'
          });
        }
      })();
    }

    res.json({ project: updated, jobId });
  } catch (err: any) {
    console.error('[Upload processing error]', err);
    res.status(500).json({ error: err.message || 'Error processing uploaded video' });
  }
});

app.post('/api/projects/:id/load-sample', async (req, res) => {
  try {
    const project = projectStore.getProject(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const sampleRelPath = await ensureSampleClips();
    const fullSamplePath = path.resolve(process.cwd(), 'public', sampleRelPath.replace(/^\//, ''));
    const duration = await getVideoDuration(fullSamplePath);

    const updated = projectStore.updateProject(project.id, {
      name: 'Telugu Tech Career Reel (Demo)',
      videoFileName: 'telugu_tech_reel_demo.mp4',
      videoFilePath: fullSamplePath,
      videoUrl: sampleRelPath,
      duration,
      fileSize: fs.existsSync(fullSamplePath) ? fs.statSync(fullSamplePath).size : 102400
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// Async Transcription Job Pipeline
// ----------------------------------------------------
app.post('/api/projects/:id/transcribe', async (req, res) => {
  const project = projectStore.getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  if (!project.videoFilePath || !fs.existsSync(project.videoFilePath)) {
    const sampleRelPath = await ensureSampleClips();
    const fullSamplePath = path.resolve(process.cwd(), 'public', sampleRelPath.replace(/^\//, ''));
    if (fs.existsSync(fullSamplePath)) {
      project.videoFilePath = fullSamplePath;
      project.videoUrl = sampleRelPath;
      projectStore.updateProject(project.id, {
        videoFilePath: fullSamplePath,
        videoUrl: sampleRelPath,
        duration: 7
      });
    } else {
      res.status(400).json({ error: 'No video file found for this project. Please select or upload a video.' });
      return;
    }
  }

  const preferredScript = req.body?.preferredScript || project.preferredScript || 'tenglish';

  const job = projectStore.createJob(project.id, 'transcribe');
  res.status(202).json({ jobId: job.id, message: 'Transcription job initiated' });

  // Run in background
  (async () => {
    try {
      projectStore.updateJob(job.id, {
        status: 'processing',
        progress: 15,
        stage: 'Extracting 16kHz audio with FFmpeg...'
      });

      projectStore.updateJob(job.id, {
        progress: 35,
        stage: 'Running local speech recognition model (CPU INT8)...'
      });

      const result = await runLocalTranscription({
        videoPath: project.videoFilePath,
        customVocabulary: project.customVocabulary,
        preferredScript,
        sourceLanguage: project.sourceLanguage,
        targetLanguage: project.targetLanguage
      });

      projectStore.updateJob(job.id, {
        progress: 85,
        stage: 'Applying Tenglish code-switching & spelling engine...'
      });

      // Update project with transcribed segments
      projectStore.updateProject(project.id, {
        rawTranscript: result.rawTranscript,
        tenglishTranscript: result.tenglishTranscript,
        segments: result.segments,
        preferredScript,
        duration: result.duration || project.duration
      });

      projectStore.updateJob(job.id, {
        status: 'completed',
        progress: 100,
        stage: 'Captions generated successfully',
        result: {
          segmentCount: result.segments.length,
          tenglishTranscript: result.tenglishTranscript
        }
      });
    } catch (err: any) {
      console.error('[Tenglish AI] Transcription failed:', err);
      projectStore.updateJob(job.id, {
        status: 'failed',
        error: err.message || 'Speech recognition failed on local model'
      });
    }
  })();
});

// ----------------------------------------------------
// Job Status Polling
// ----------------------------------------------------
app.get('/api/jobs/:id', (req, res) => {
  const job = projectStore.getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  res.json(job);
});

// ----------------------------------------------------
// Transcript Editing & Tenglish Suggestions
// ----------------------------------------------------
app.get('/api/projects/:id/transcript', (req, res) => {
  const project = projectStore.getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const fullText = project.segments.map((s) => s.text).join(' ');
  const norm = normalizeTenglish(fullText, project.customVocabulary);
  const uncertainWords = detectUncertainWords(fullText);

  res.json({
    segments: project.segments,
    rawTranscript: project.rawTranscript || '',
    tenglishTranscript: project.tenglishTranscript || '',
    suggestions: norm.suggestions,
    uncertainWords,
    canUndo: project.historyIndex > 0,
    canRedo: project.historyIndex < project.history.length - 1
  });
});

app.put('/api/projects/:id/transcript', (req, res) => {
  const project = projectStore.getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const { segments } = req.body;
  if (!Array.isArray(segments)) {
    res.status(400).json({ error: 'Segments array is required' });
    return;
  }

  const updated = projectStore.updateProject(project.id, { segments });
  res.json(updated);
});

app.post('/api/projects/:id/undo', (req, res) => {
  const segments = projectStore.undo(req.params.id);
  if (!segments) {
    res.status(400).json({ error: 'Nothing to undo' });
    return;
  }
  res.json({ segments });
});

app.post('/api/projects/:id/redo', (req, res) => {
  const segments = projectStore.redo(req.params.id);
  if (!segments) {
    res.status(400).json({ error: 'Nothing to redo' });
    return;
  }
  res.json({ segments });
});

// ----------------------------------------------------
// Style Preset & Customization
// ----------------------------------------------------
app.put('/api/projects/:id/style', (req, res) => {
  const project = projectStore.getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const newStyle = {
    ...project.style,
    ...req.body
  };

  const updated = projectStore.updateProject(project.id, { style: newStyle });
  res.json(updated);
});

// ----------------------------------------------------
// Custom Vocabulary
// ----------------------------------------------------
app.post('/api/projects/:id/vocabulary', (req, res) => {
  const project = projectStore.getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const { term, preferredSpelling, category } = req.body;
  if (!term || !preferredSpelling) {
    res.status(400).json({ error: 'term and preferredSpelling are required' });
    return;
  }

  const currentVocab = project.customVocabulary.filter(
    (v) => v.term.toLowerCase() !== term.toLowerCase()
  );
  currentVocab.push({ term, preferredSpelling, category: category || 'custom' });

  const updated = projectStore.updateProject(project.id, {
    customVocabulary: currentVocab
  });
  res.json(updated?.customVocabulary);
});

// ----------------------------------------------------
// Video Export (FFmpeg ASS Subtitle Burning)
// ----------------------------------------------------
app.post('/api/projects/:id/export', async (req, res) => {
  const project = projectStore.getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  if (!project.videoFilePath || !fs.existsSync(project.videoFilePath)) {
    res.status(400).json({ error: 'Original video file not found' });
    return;
  }

  if (!project.segments || project.segments.length === 0) {
    res.status(400).json({ error: 'No captions available to export' });
    return;
  }

  const job = projectStore.createJob(project.id, 'export');
  res.status(202).json({ jobId: job.id, message: 'Export rendering job queued' });

  // Render in background
  (async () => {
    try {
      projectStore.updateJob(job.id, {
        status: 'processing',
        progress: 10,
        stage: 'Generating ASS subtitles from selected template...'
      });

      const outputFileName = `tenglish_${project.id}_${Date.now()}.mp4`;
      const outputVideoPath = path.join(EXPORTS_DIR, outputFileName);
      const assFilePath = path.join(EXPORTS_DIR, `subs_${project.id}.ass`);
      const srtFilePath = path.join(EXPORTS_DIR, `subs_${project.id}.srt`);

      // 1. Write ASS subtitle file
      const assContent = generateAss(project.segments, project.style);
      fs.writeFileSync(assFilePath, assContent, 'utf-8');

      // 2. Write SRT subtitle file
      const srtContent = generateSrt(project.segments);
      fs.writeFileSync(srtFilePath, srtContent, 'utf-8');

      projectStore.updateJob(job.id, {
        progress: 25,
        stage: 'Burning ASS subtitles into MP4 with local FFmpeg...'
      });

      // 3. Render video via FFmpeg
      await renderVideoWithSubtitles({
        inputVideoPath: project.videoFilePath,
        outputVideoPath,
        assFilePath,
        onProgress: (pct) => {
          projectStore.updateJob(job.id, {
            progress: Math.min(98, 25 + Math.round(pct * 0.72)),
            stage: `Encoding captioned MP4 with FFmpeg (${pct}%)...`
          });
        }
      });

      const videoUrl = `/storage/exports/${outputFileName}`;
      const srtUrl = `/api/projects/${project.id}/download-srt`;

      projectStore.updateProject(project.id, {
        exportedVideoPath: outputVideoPath,
        exportedVideoUrl: videoUrl,
        exportedSrtPath: srtFilePath,
        exportedSrtUrl: srtUrl
      });

      projectStore.updateJob(job.id, {
        status: 'completed',
        progress: 100,
        stage: 'Video export complete and ready for download!',
        result: {
          downloadUrl: `/api/projects/${project.id}/download`,
          srtUrl
        }
      });
    } catch (err: any) {
      console.error('[Tenglish AI] Export rendering failed:', err);
      projectStore.updateJob(job.id, {
        status: 'failed',
        error: err.message || 'FFmpeg subtitle rendering failed'
      });
    }
  })();
});

// Download Rendered Video
app.get('/api/projects/:id/download', (req, res) => {
  const project = projectStore.getProject(req.params.id);
  if (!project || !project.exportedVideoPath || !fs.existsSync(project.exportedVideoPath)) {
    res.status(404).json({ error: 'Exported captioned video not found' });
    return;
  }

  const safeFileName = `${project.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_tenglish_captioned.mp4`;
  res.download(project.exportedVideoPath, safeFileName);
});

// Download SRT
app.get('/api/projects/:id/download-srt', (req, res) => {
  const project = projectStore.getProject(req.params.id);
  if (!project || !project.segments) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const srtContent = generateSrt(project.segments);
  const safeFileName = `${project.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_subtitles.srt`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
  res.send(srtContent);
});

// Transliterate / Normalize Text Playground endpoint
app.post('/api/tenglish/normalize', (req, res) => {
  const { text, customVocabulary } = req.body;
  const result = normalizeTenglish(text || '', customVocabulary || []);
  res.json(result);
});

// ----------------------------------------------------
// Vite Server Integration (for full-stack dev and prod)
// ----------------------------------------------------
async function startServer() {
  // Pre-seed sample clips in public directory
  ensureSampleClips().catch((err) => console.warn('Sample clip prep note:', err));

  // Initialize Whisper in background
  getTranscriptionPipeline().catch((err) => console.warn('Whisper pre-warm note:', err));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Tenglish AI] Studio server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
