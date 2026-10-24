import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Ensures sample demo vertical 9:16 video exists in public/samples/
 */
export async function ensureSampleClips(): Promise<string> {
  const publicDir = path.resolve(process.cwd(), 'public');
  const samplesDir = path.join(publicDir, 'samples');
  if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
  }

  const samplePath = path.join(samplesDir, 'telugu_tech_reel_demo.mp4');

  if (fs.existsSync(samplePath) && fs.statSync(samplePath).size > 1000) {
    return '/samples/telugu_tech_reel_demo.mp4';
  }

  console.log('[Tenglish AI] Generating sample 9:16 vertical creator video with FFmpeg...');

  return new Promise((resolve) => {
    // Generate an aesthetic 720x1280 9:16 6-second vertical reel clip with stereo audio
    // Using gradient/cell pattern and subtle synthesized voice harmonic tones
    const args = [
      '-y',
      '-f', 'lavfi',
      '-i', 'testsrc=duration=7:size=720x1280:rate=30',
      '-f', 'lavfi',
      '-i', 'sine=frequency=320:duration=7',
      '-vf', 'eq=brightness=0.06:contrast=1.2:saturation=1.4,drawgrid=width=100:height=100:thickness=1:color=blue@0.2',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '128k',
      samplePath
    ];

    const child = spawn('ffmpeg', args);
    child.on('close', (code) => {
      if (code === 0 && fs.existsSync(samplePath)) {
        console.log('[Tenglish AI] Sample video created successfully at', samplePath);
      } else {
        console.warn('[Tenglish AI] Note on sample video generation, code:', code);
      }
      resolve('/samples/telugu_tech_reel_demo.mp4');
    });
    child.on('error', (err) => {
      console.warn('[Tenglish AI] Sample generation error:', err.message);
      resolve('/samples/telugu_tech_reel_demo.mp4');
    });
  });
}
