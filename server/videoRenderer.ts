import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { CaptionSegment } from './captionSegmentation.js';
import { CaptionStyle, CAPTION_TEMPLATES } from './templates.js';

/**
 * Converts Hex (#RRGGBB) to ASS color format (&H00BBGGRR&)
 */
export function hexToAssColor(hex: string, alphaHex = '00'): string {
  const clean = hex.replace('#', '').trim();
  let r = 'FF', g = 'FF', b = 'FF';
  if (clean.length === 6) {
    r = clean.substring(0, 2);
    g = clean.substring(2, 4);
    b = clean.substring(4, 6);
  } else if (clean.length === 3) {
    r = clean[0] + clean[0];
    g = clean[1] + clean[1];
    b = clean[2] + clean[2];
  }
  return `&H${alphaHex}${b.toUpperCase()}${g.toUpperCase()}${r.toUpperCase()}&`;
}

/**
 * Format seconds into ASS timestamp (H:MM:SS.cs)
 */
export function formatAssTime(seconds: number): string {
  const totalMs = Math.max(0, Math.floor(seconds * 1000));
  const h = Math.floor(totalMs / 3600000);
  const m = Math.floor((totalMs % 3600000) / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);
  const cs = Math.floor((totalMs % 1000) / 10);
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${h}:${pad(m)}:${pad(s)}.${pad(cs)}`;
}

/**
 * Format seconds into SRT timestamp (HH:MM:SS,mmm)
 */
export function formatSrtTime(seconds: number): string {
  const totalMs = Math.max(0, Math.floor(seconds * 1000));
  const h = Math.floor(totalMs / 3600000);
  const m = Math.floor((totalMs % 3600000) / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);
  const ms = Math.floor(totalMs % 1000);
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

/**
 * Generates an SRT string from caption segments
 */
export function generateSrt(segments: CaptionSegment[]): string {
  return segments
    .map((seg, idx) => {
      const start = formatSrtTime(seg.start);
      const end = formatSrtTime(seg.end);
      return `${idx + 1}\n${start} --> ${end}\n${seg.text.trim()}\n`;
    })
    .join('\n');
}

/**
 * Generates an ASS subtitle file content from segments and selected style
 */
export function generateAss(
  segments: CaptionSegment[],
  style: CaptionStyle,
  videoWidth = 1080,
  videoHeight = 1920
): string {
  const primaryAssColor = hexToAssColor(style.textColor);
  const highlightAssColor = hexToAssColor(style.highlightColor);
  const outlineAssColor = hexToAssColor(style.outlineColor);
  const backAssColor = hexToAssColor(
    style.backgroundColor.startsWith('#') ? style.backgroundColor : '#000000',
    Math.round((1 - style.backgroundOpacity) * 255).toString(16).padStart(2, '0')
  );

  // Scale font size proportionally for 1080x1920 canvas
  const scaledFontSize = Math.round(style.fontSize * 2.2);
  const scaledOutline = Math.max(1, Math.round(style.outlineWidth * 2.2));
  const scaledMarginV = Math.round(style.assMarginV * 2.0);

  const lines = [
    '[Script Info]',
    'ScriptType: v4.00+',
    `PlayResX: ${videoWidth}`,
    `PlayResY: ${videoHeight}`,
    'ScaledBorderAndShadow: yes',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: Default,Liberation Sans,${scaledFontSize},${primaryAssColor},${primaryAssColor},${outlineAssColor},${backAssColor},-1,0,0,0,100,100,0,0,${style.borderStyle},${scaledOutline},0,${style.assAlignment},80,80,${scaledMarginV},1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text'
  ];

  for (const seg of segments) {
    const startTime = formatAssTime(seg.start);
    const endTime = formatAssTime(seg.end);

    let dialogueText = seg.text.replace(/\n/g, '\\N');

    // If template uses selective highlight on first or key words
    if (style.highlightMode === 'phrase' || style.id === 'hormozi_impact' || style.id === 'tiktok_bouncy') {
      const words = seg.text.split(' ');
      if (words.length > 0) {
        // Highlight first 1-2 words or key tech/english words
        const highlightIndices = new Set<number>();
        highlightIndices.add(0); // first word pop

        words.forEach((w, idx) => {
          const lower = w.toLowerCase().replace(/[^a-z]/g, '');
          if (['opportunity', 'freshers', 'apply', 'job', 'bro', 'skills', 'salary', 'coding'].includes(lower)) {
            highlightIndices.add(idx);
          }
        });

        const formattedWords = words.map((w, idx) => {
          if (highlightIndices.has(idx)) {
            return `{\\c${highlightAssColor}}${w}{\\c${primaryAssColor}}`;
          }
          return w;
        });
        dialogueText = formattedWords.join(' ');
      }
    }

    lines.push(`Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${dialogueText}`);
  }

  return lines.join('\n');
}

/**
 * Render video with burned ASS subtitles using local FFmpeg
 */
export async function renderVideoWithSubtitles(params: {
  inputVideoPath: string;
  outputVideoPath: string;
  assFilePath: string;
  onProgress?: (progressPercent: number) => void;
}): Promise<void> {
  const { inputVideoPath, outputVideoPath, assFilePath, onProgress } = params;

  return new Promise((resolve, reject) => {
    // Escape backslashes and colons for ffmpeg ass filter
    const escapedAss = assFilePath.replace(/\\/g, '/').replace(/:/g, '\\:');

    // Run ffmpeg with ass filter
    const args = [
      '-y',
      '-i', inputVideoPath,
      '-vf', `ass=${escapedAss}`,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '22',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      outputVideoPath
    ];

    const child = spawn('ffmpeg', args);

    let totalDurationSec = 0;

    child.stderr.on('data', (chunk) => {
      const str = chunk.toString();

      // Look for Duration: HH:MM:SS.xx
      if (!totalDurationSec) {
        const durMatch = str.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
        if (durMatch) {
          const hours = parseFloat(durMatch[1]);
          const mins = parseFloat(durMatch[2]);
          const secs = parseFloat(durMatch[3]);
          totalDurationSec = hours * 3600 + mins * 60 + secs;
        }
      }

      // Look for time=HH:MM:SS.xx
      const timeMatch = str.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (timeMatch && totalDurationSec > 0 && onProgress) {
        const h = parseFloat(timeMatch[1]);
        const m = parseFloat(timeMatch[2]);
        const s = parseFloat(timeMatch[3]);
        const curSec = h * 3600 + m * 60 + s;
        const pct = Math.min(99, Math.round((curSec / totalDurationSec) * 100));
        onProgress(pct);
      }
    });

    child.on('close', (code) => {
      if (code === 0) {
        if (onProgress) onProgress(100);
        resolve();
      } else {
        reject(new Error(`FFmpeg rendering exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}
