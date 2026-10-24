import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CaptionSegment } from './captionSegmentation.js';
import { CaptionStyle, CAPTION_TEMPLATES } from './templates.js';
import { CreatorVocabularyItem } from './tenglishEngine.js';

export interface Project {
  id: string;
  name: string;
  videoFileName: string;
  videoFilePath: string;
  videoUrl: string;
  duration: number;
  width?: number;
  height?: number;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
  rawTranscript?: string;
  tenglishTranscript?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  preferredScript: 'tenglish' | 'telugu';
  segments: CaptionSegment[];
  history: CaptionSegment[][]; // for undo / redo
  historyIndex: number;
  style: CaptionStyle;
  customVocabulary: CreatorVocabularyItem[];
  exportedVideoPath?: string;
  exportedVideoUrl?: string;
  exportedSrtPath?: string;
  exportedSrtUrl?: string;
}

export interface ProcessingJob {
  id: string;
  projectId: string;
  type: 'transcribe' | 'export';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0 - 100
  stage: string;
  error?: string;
  result?: any;
  createdAt: string;
  completedAt?: string;
}

class ProjectStore {
  private projects: Map<string, Project> = new Map();
  private jobs: Map<string, ProcessingJob> = new Map();
  private storageDir: string;

  constructor() {
    this.storageDir = path.resolve(process.cwd(), '.storage');
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  createProject(name = 'Untitled Tenglish Reel'): Project {
    const id = uuidv4();
    const project: Project = {
      id,
      name,
      videoFileName: '',
      videoFilePath: '',
      videoUrl: '',
      duration: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preferredScript: 'tenglish',
      sourceLanguage: 'auto',
      targetLanguage: 'tenglish',
      segments: [],
      history: [[]],
      historyIndex: 0,
      style: { ...CAPTION_TEMPLATES.hormozi_impact },
      customVocabulary: [
        { term: 'chesukondi', preferredSpelling: 'cheskondi', category: 'custom' },
        { term: 'kooda', preferredSpelling: 'kuda', category: 'custom' },
        { term: 'choodandi', preferredSpelling: 'chudandi', category: 'custom' },
        { term: 'opportunity', preferredSpelling: 'opportunity', category: 'tech' },
        { term: 'freshers', preferredSpelling: 'freshers', category: 'tech' },
        { term: 'apply', preferredSpelling: 'apply', category: 'tech' }
      ]
    };
    this.projects.set(id, project);
    return project;
  }

  getProject(id: string): Project | undefined {
    return this.projects.get(id);
  }

  getAllProjects(): Project[] {
    return Array.from(this.projects.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  updateProject(id: string, updates: Partial<Project>): Project | undefined {
    const p = this.projects.get(id);
    if (!p) return undefined;

    // Handle undo / redo history stack when segments are updated
    if (updates.segments && updates.segments !== p.segments) {
      // Truncate redo tree if we are mid-history
      const newHistory = p.history.slice(0, p.historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(updates.segments)));
      p.history = newHistory;
      p.historyIndex = newHistory.length - 1;
    }

    const updated = {
      ...p,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.projects.set(id, updated);
    return updated;
  }

  undo(id: string): CaptionSegment[] | null {
    const p = this.projects.get(id);
    if (!p || p.historyIndex <= 0) return null;
    p.historyIndex--;
    p.segments = JSON.parse(JSON.stringify(p.history[p.historyIndex]));
    p.updatedAt = new Date().toISOString();
    return p.segments;
  }

  redo(id: string): CaptionSegment[] | null {
    const p = this.projects.get(id);
    if (!p || p.historyIndex >= p.history.length - 1) return null;
    p.historyIndex++;
    p.segments = JSON.parse(JSON.stringify(p.history[p.historyIndex]));
    p.updatedAt = new Date().toISOString();
    return p.segments;
  }

  deleteProject(id: string): boolean {
    const p = this.projects.get(id);
    if (!p) return false;

    // Clean up files
    if (p.videoFilePath && fs.existsSync(p.videoFilePath) && !p.videoFilePath.includes('/samples/')) {
      try {
        fs.unlinkSync(p.videoFilePath);
      } catch (_) {}
    }
    if (p.exportedVideoPath && fs.existsSync(p.exportedVideoPath)) {
      try {
        fs.unlinkSync(p.exportedVideoPath);
      } catch (_) {}
    }
    if (p.exportedSrtPath && fs.existsSync(p.exportedSrtPath)) {
      try {
        fs.unlinkSync(p.exportedSrtPath);
      } catch (_) {}
    }

    this.projects.delete(id);
    return true;
  }

  createJob(projectId: string, type: 'transcribe' | 'export'): ProcessingJob {
    const id = uuidv4();
    const job: ProcessingJob = {
      id,
      projectId,
      type,
      status: 'queued',
      progress: 0,
      stage: 'Initializing task...',
      createdAt: new Date().toISOString()
    };
    this.jobs.set(id, job);
    return job;
  }

  getJob(id: string): ProcessingJob | undefined {
    return this.jobs.get(id);
  }

  updateJob(id: string, updates: Partial<ProcessingJob>): ProcessingJob | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    const updated = { ...job, ...updates };
    if (updates.status === 'completed' || updates.status === 'failed') {
      updated.completedAt = new Date().toISOString();
    }
    this.jobs.set(id, updated);
    return updated;
  }
}

export const projectStore = new ProjectStore();
