export interface TimedWord {
  word: string;
  start: number;
  end: number;
}

export interface CaptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  words?: TimedWord[];
  highlightWordIndex?: number;
  isModifiedByUser?: boolean;
}

export interface CaptionStyle {
  id: string;
  name: string;
  tagline?: string;
  description: string;
  fontFamily: string;
  fontWeight: number | string;
  fontSize: number;
  textColor: string;
  highlightColor: string;
  secondaryHighlightColor?: string;
  outlineColor: string;
  outlineWidth: number;
  backgroundColor: string;
  backgroundOpacity: number;
  shadowColor?: string;
  shadowBlur?: number;
  textTransform?: 'uppercase' | 'capitalize' | 'none';
  alignment: 'center' | 'left' | 'right';
  verticalPosition: 'lower_third' | 'center' | 'bottom' | 'top';
  lineSpacing: number;
  highlightMode: 'word' | 'phrase' | 'none';
  assAlignment: number;
  assMarginV: number;
  borderStyle: number;
}

export interface CreatorVocabularyItem {
  term: string;
  preferredSpelling: string;
  category?: 'creator_name' | 'tech' | 'place' | 'brand' | 'custom';
}

export interface CorrectionSuggestion {
  original: string;
  suggested: string;
  reason: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
}

export interface Project {
  id: string;
  name: string;
  videoFileName: string;
  videoFilePath: string;
  videoUrl: string;
  clientPreviewUrl?: string; // Instant zero-latency local blob preview
  duration: number;
  width?: number;
  height?: number;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
  rawTranscript?: string;
  tenglishTranscript?: string;
  sourceLanguage?: string; // 'auto', 'te', 'en', 'hi', 'ta'
  targetLanguage?: string; // 'tenglish', 'telugu', 'english', 'hinglish', 'hindi'
  preferredScript: 'tenglish' | 'telugu' | 'english' | 'hinglish';
  segments: CaptionSegment[];
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
  progress: number;
  stage: string;
  error?: string;
  result?: any;
  createdAt: string;
  completedAt?: string;
}

export interface SystemStatus {
  status: string;
  engine: string;
  ffmpegAvailable: boolean;
  speechModel: string;
  quantization: string;
  memoryUsageMb: number;
  paidApisUsed: boolean;
  privacyNotice: string;
}
