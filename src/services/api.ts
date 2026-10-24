import { Project, CaptionSegment, CaptionStyle, ProcessingJob, SystemStatus, CreatorVocabularyItem } from '../types';

export const api = {
  async getSystemStatus(): Promise<SystemStatus> {
    const res = await fetch('/api/system/status');
    if (!res.ok) throw new Error('Failed to fetch system status');
    return res.json();
  },

  async getProjects(): Promise<Project[]> {
    const res = await fetch('/api/projects');
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async createProject(name?: string): Promise<Project> {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  async getProject(id: string): Promise<Project> {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) throw new Error('Project not found');
    return res.json();
  },

  async deleteProject(id: string): Promise<void> {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete project');
  },

  async uploadVideo(
    id: string,
    file: File,
    sourceLanguage = 'auto',
    targetLanguage = 'tenglish',
    onProgress?: (progress: number, stage: string) => void
  ): Promise<{ project: Project; jobId?: string }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('video', file);
      formData.append('sourceLanguage', sourceLanguage);
      formData.append('targetLanguage', targetLanguage);
      formData.append('autoTranscribe', 'true');

      if (xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            onProgress?.(pct, `Uploading video file (${pct}%)...`);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            const project = data.project || data;
            const jobId = data.jobId;
            resolve({ project, jobId });
          } catch (e: any) {
            reject(new Error('Invalid response from server: ' + e.message));
          }
        } else {
          let errMessage = `Video upload failed (Server status ${xhr.status})`;
          try {
            const errData = JSON.parse(xhr.responseText);
            if (errData.error) errMessage = errData.error;
          } catch (_) {}
          reject(new Error(errMessage));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during video upload. Please check connection.'));
      };

      xhr.open('POST', `/api/projects/${id}/upload`);
      xhr.send(formData);
    });
  },

  async loadSampleVideo(id: string): Promise<Project> {
    const res = await fetch(`/api/projects/${id}/load-sample`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to load sample clip');
    return res.json();
  },

  async transcribe(id: string, preferredScript: 'tenglish' | 'telugu' = 'tenglish'): Promise<{ jobId: string }> {
    const res = await fetch(`/api/projects/${id}/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferredScript })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to start transcription');
    }
    return res.json();
  },

  async getJob(jobId: string): Promise<ProcessingJob> {
    const res = await fetch(`/api/jobs/${jobId}`);
    if (!res.ok) throw new Error('Job not found');
    return res.json();
  },

  async getTranscript(id: string): Promise<any> {
    const res = await fetch(`/api/projects/${id}/transcript`);
    if (!res.ok) throw new Error('Failed to get transcript');
    return res.json();
  },

  async updateTranscript(id: string, segments: CaptionSegment[]): Promise<Project> {
    const res = await fetch(`/api/projects/${id}/transcript`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ segments })
    });
    if (!res.ok) throw new Error('Failed to update transcript');
    return res.json();
  },

  async undoTranscript(id: string): Promise<{ segments: CaptionSegment[] }> {
    const res = await fetch(`/api/projects/${id}/undo`, { method: 'POST' });
    if (!res.ok) throw new Error('Undo failed');
    return res.json();
  },

  async redoTranscript(id: string): Promise<{ segments: CaptionSegment[] }> {
    const res = await fetch(`/api/projects/${id}/redo`, { method: 'POST' });
    if (!res.ok) throw new Error('Redo failed');
    return res.json();
  },

  async updateStyle(id: string, style: Partial<CaptionStyle>): Promise<Project> {
    const res = await fetch(`/api/projects/${id}/style`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(style)
    });
    if (!res.ok) throw new Error('Failed to update style');
    return res.json();
  },

  async addVocabulary(id: string, item: { term: string; preferredSpelling: string; category?: string }): Promise<CreatorVocabularyItem[]> {
    const res = await fetch(`/api/projects/${id}/vocabulary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Failed to add custom vocabulary');
    return res.json();
  },

  async exportVideo(id: string): Promise<{ jobId: string }> {
    const res = await fetch(`/api/projects/${id}/export`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to start video export');
    }
    return res.json();
  },

  async testNormalize(text: string, customVocabulary?: CreatorVocabularyItem[]) {
    const res = await fetch('/api/tenglish/normalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, customVocabulary })
    });
    return res.json();
  }
};
