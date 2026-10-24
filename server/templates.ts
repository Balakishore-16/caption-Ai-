/**
 * Trending Reel & Shorts Caption Templates for Capzen
 * Designed to mirror industry-standard styles (CapCut, Premiere Pro, Submagic)
 */

export interface CaptionStyle {
  id: 'hormozi_impact' | 'ali_minimal' | 'tiktok_bouncy' | 'cyber_glow' | 'karaoke_flow' | 'cinematic_warm';
  name: string;
  tagline: string;
  description: string;
  fontFamily: string;
  fontWeight: number | string;
  fontSize: number; // in pt/px
  textColor: string; // hex
  highlightColor: string; // hex
  secondaryHighlightColor?: string; // hex
  outlineColor: string; // hex
  outlineWidth: number;
  backgroundColor: string; // rgba or hex
  backgroundOpacity: number;
  shadowColor?: string;
  shadowBlur?: number;
  textTransform?: 'uppercase' | 'capitalize' | 'none';
  alignment: 'center' | 'left' | 'right';
  verticalPosition: 'lower_third' | 'center' | 'bottom' | 'top';
  lineSpacing: number;
  highlightMode: 'word' | 'phrase' | 'none';
  assAlignment: number; // ASS numpad alignment: 2=bottom-center, 5=center, 8=top-center
  assMarginV: number;
  borderStyle: number; // 1 = outline + drop shadow, 3 = opaque box
}

export const CAPTION_TEMPLATES: Record<string, CaptionStyle> = {
  hormozi_impact: {
    id: 'hormozi_impact',
    name: 'Hormozi Impact',
    tagline: 'Bold uppercase punch words with heavy black stroke & vibrant yellow pop',
    description: 'The #1 trending style on Instagram Reels & YouTube Shorts for motivational, business, and viral hooks.',
    fontFamily: 'Montserrat',
    fontWeight: '900',
    fontSize: 28,
    textColor: '#FFFFFF',
    highlightColor: '#FACC15', // Neon Yellow
    secondaryHighlightColor: '#22C55E', // Vivid Green
    outlineColor: '#000000',
    outlineWidth: 4,
    backgroundColor: '#000000',
    backgroundOpacity: 0,
    textTransform: 'uppercase',
    alignment: 'center',
    verticalPosition: 'center',
    lineSpacing: 1.15,
    highlightMode: 'word',
    assAlignment: 5,
    assMarginV: 0,
    borderStyle: 1
  },
  ali_minimal: {
    id: 'ali_minimal',
    name: 'Ali Clean Minimal',
    tagline: 'Refined sans with translucent dark capsule backing and cyan accent',
    description: 'Popularized by educational creators and productivity podcasters for high-clarity reading.',
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: '700',
    fontSize: 24,
    textColor: '#FFFFFF',
    highlightColor: '#38BDF8', // Sky Blue
    outlineColor: '#0F172A',
    outlineWidth: 1.5,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    backgroundOpacity: 0.85,
    textTransform: 'none',
    alignment: 'center',
    verticalPosition: 'lower_third',
    lineSpacing: 1.3,
    highlightMode: 'phrase',
    assAlignment: 2,
    assMarginV: 130,
    borderStyle: 3
  },
  tiktok_bouncy: {
    id: 'tiktok_bouncy',
    name: 'TikTok Bouncy Pop',
    tagline: 'High-energy lime green & bright yellow active tracking',
    description: 'TikTok-native viral format with high-contrast colored pops on every spoken emphasis.',
    fontFamily: 'Montserrat',
    fontWeight: '800',
    fontSize: 27,
    textColor: '#FFFFFF',
    highlightColor: '#4ADE80', // Lime green
    secondaryHighlightColor: '#FDE047',
    outlineColor: '#000000',
    outlineWidth: 3.5,
    backgroundColor: '#000000',
    backgroundOpacity: 0,
    textTransform: 'uppercase',
    alignment: 'center',
    verticalPosition: 'lower_third',
    lineSpacing: 1.2,
    highlightMode: 'word',
    assAlignment: 2,
    assMarginV: 140,
    borderStyle: 1
  },
  cyber_glow: {
    id: 'cyber_glow',
    name: 'Cyber Tech Glow',
    tagline: 'Electric cyan terminal typography with magenta punch for coding & tech',
    description: 'Designed for software engineers, tech tutorials, crypto, and modern AI creator videos.',
    fontFamily: 'JetBrains Mono',
    fontWeight: '700',
    fontSize: 24,
    textColor: '#E0F2FE',
    highlightColor: '#06B6D4', // Cyan
    secondaryHighlightColor: '#D946EF', // Magenta
    outlineColor: '#082F49',
    outlineWidth: 2,
    backgroundColor: 'rgba(3, 7, 18, 0.9)',
    backgroundOpacity: 0.9,
    shadowColor: '#06B6D4',
    shadowBlur: 10,
    textTransform: 'none',
    alignment: 'center',
    verticalPosition: 'lower_third',
    lineSpacing: 1.25,
    highlightMode: 'word',
    assAlignment: 2,
    assMarginV: 130,
    borderStyle: 3
  },
  karaoke_flow: {
    id: 'karaoke_flow',
    name: 'Karaoke Pro Flow',
    tagline: 'Continuous active-word highlight while inactive words remain readable',
    description: 'Dynamic word-by-word karaoke tracking synchronized with audio playback.',
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: '800',
    fontSize: 28,
    textColor: '#94A3B8', // Readable inactive slate
    highlightColor: '#22C55E', // Bright green active
    outlineColor: '#000000',
    outlineWidth: 3,
    backgroundColor: '#000000',
    backgroundOpacity: 0,
    textTransform: 'none',
    alignment: 'center',
    verticalPosition: 'center',
    lineSpacing: 1.2,
    highlightMode: 'word',
    assAlignment: 5,
    assMarginV: 0,
    borderStyle: 1
  },
  cinematic_warm: {
    id: 'cinematic_warm',
    name: 'Cinematic Storyteller',
    tagline: 'Elegant warm amber and gentle drop shadow for travel & documentary',
    description: 'Sophisticated aesthetics for cinematic reels, voiceovers, personal branding, and travel shorts.',
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: '700',
    fontSize: 25,
    textColor: '#FFFFFF',
    highlightColor: '#F59E0B', // Warm Amber
    outlineColor: '#18181B',
    outlineWidth: 2,
    backgroundColor: '#000000',
    backgroundOpacity: 0,
    shadowColor: '#000000',
    shadowBlur: 8,
    textTransform: 'none',
    alignment: 'center',
    verticalPosition: 'lower_third',
    lineSpacing: 1.3,
    highlightMode: 'phrase',
    assAlignment: 2,
    assMarginV: 120,
    borderStyle: 1
  }
};
