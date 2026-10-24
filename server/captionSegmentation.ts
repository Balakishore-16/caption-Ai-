/**
 * Caption Segmentation Engine
 * Breaks continuous transcript text into readable, punchy short-form subtitle lines
 * tailored for vertical 9:16 reels and shorts.
 */

export interface RawSegment {
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

export interface TimedWord {
  word: string;
  start: number;
  end: number;
}

export interface CaptionSegment {
  id: string;
  start: number;       // in seconds
  end: number;         // in seconds
  text: string;
  words?: TimedWord[]; // for word-by-word karaoke
  highlightWordIndex?: number;
  isModifiedByUser?: boolean;
}

export interface SegmentationOptions {
  maxCharsPerLine?: number; // default: 32 chars for vertical reels
  maxLinesPerSegment?: number; // default: 2 lines
  minDuration?: number;     // min segment duration in seconds, default: 0.8s
  maxDuration?: number;     // max segment duration in seconds, default: 3.5s
}

/**
 * Splits text into well-balanced caption segments respecting phrase boundaries.
 */
export function segmentTranscript(
  rawSegments: RawSegment[],
  options: SegmentationOptions = {}
): CaptionSegment[] {
  const maxChars = options.maxCharsPerLine || 30;
  const maxLines = options.maxLinesPerSegment || 2;
  const minDuration = options.minDuration || 0.6;
  const maxDuration = options.maxDuration || 3.2;

  const result: CaptionSegment[] = [];
  let globalSegmentIndex = 1;

  for (const raw of rawSegments) {
    const rawText = raw.text.trim();
    if (!rawText) continue;

    const totalDuration = Math.max(0.1, raw.end - raw.start);
    const words = rawText.split(/\s+/).filter(Boolean);

    if (words.length === 0) continue;

    // Estimate per-word duration
    const totalChars = words.reduce((sum, w) => sum + w.length, 0);
    let currentWordTime = raw.start;
    const timedWords: TimedWord[] = [];

    for (const w of words) {
      const wordWeight = w.length / (totalChars || 1);
      const wordDuration = Math.max(0.15, wordWeight * totalDuration);
      const wordEnd = Math.min(raw.end, currentWordTime + wordDuration);
      timedWords.push({
        word: w,
        start: Number(currentWordTime.toFixed(2)),
        end: Number(wordEnd.toFixed(2))
      });
      currentWordTime = wordEnd;
    }

    // Now group timed words into chunks that fit maxChars and maxLines
    let currentChunkWords: TimedWord[] = [];
    let currentCharsCount = 0;

    const finalizeChunk = () => {
      if (currentChunkWords.length === 0) return;

      const chunkStart = currentChunkWords[0].start;
      const chunkEnd = currentChunkWords[currentChunkWords.length - 1].end;
      const chunkText = currentChunkWords.map((cw) => cw.word).join(' ');

      result.push({
        id: `seg_${globalSegmentIndex++}`,
        start: Number(chunkStart.toFixed(2)),
        end: Number(Math.max(chunkStart + minDuration, chunkEnd).toFixed(2)),
        text: chunkText,
        words: [...currentChunkWords]
      });

      currentChunkWords = [];
      currentCharsCount = 0;
    };

    for (let i = 0; i < timedWords.length; i++) {
      const tw = timedWords[i];
      const wordLengthWithSpace = tw.word.length + (currentChunkWords.length > 0 ? 1 : 0);
      const isNaturalPunctuation = /[.!?]$/.test(tw.word);
      const currentDuration = currentChunkWords.length > 0 
        ? tw.end - currentChunkWords[0].start 
        : 0;

      const wouldExceedChars = (currentCharsCount + wordLengthWithSpace) > (maxChars * maxLines);
      const wouldExceedDuration = currentDuration >= maxDuration;

      if ((wouldExceedChars || wouldExceedDuration) && currentChunkWords.length > 0) {
        finalizeChunk();
      }

      currentChunkWords.push(tw);
      currentCharsCount += wordLengthWithSpace;

      // If word has strong sentence terminator (. ! ?), close chunk naturally
      if (isNaturalPunctuation && currentChunkWords.length >= 2) {
        finalizeChunk();
      }
    }

    finalizeChunk();
  }

  // Ensure timestamps are monotonic and non-overlapping
  for (let i = 0; i < result.length - 1; i++) {
    if (result[i].end > result[i + 1].start) {
      result[i].end = Number((result[i + 1].start - 0.05).toFixed(2));
      if (result[i].end <= result[i].start) {
        result[i].end = Number((result[i].start + 0.4).toFixed(2));
        result[i + 1].start = Number((result[i].end + 0.05).toFixed(2));
      }
    }
  }

  return result;
}
