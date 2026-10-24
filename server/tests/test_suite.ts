import { normalizeTenglish, transliterateTeluguToRoman } from '../tenglishEngine.js';
import { segmentTranscript, RawSegment } from '../captionSegmentation.js';
import { generateAss, generateSrt, hexToAssColor, formatAssTime, formatSrtTime } from '../videoRenderer.js';
import { CAPTION_TEMPLATES } from '../templates.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('=== RUNNING TENGLISH AI TEST SUITE ===\n');

// 1. Transliteration & English Preservation Tests
console.log('1. Tenglish Transliteration & Code-Switching Engine:');
const test1 = normalizeTenglish('బ్రో ఇది ఒక మంచి ఆపర్చునిటీ.');
assert(
  test1.text.toLowerCase().includes('bro') && test1.text.toLowerCase().includes('opportunity'),
  'Preserves English spoken terms "bro" and "opportunity"'
);

const test2 = normalizeTenglish('ఫ్రెషర్స్ కూడా అప్లై చేసుకోవచ్చు.');
assert(
  test2.text.toLowerCase().includes('freshers') &&
  test2.text.toLowerCase().includes('kuda') &&
  test2.text.toLowerCase().includes('apply'),
  'Preserves "freshers", "kuda", and "apply" in code-switched sentence'
);

const test3 = normalizeTenglish('ఫాస్ట్ గా అప్లై చేసుకోండి.');
assert(
  test3.text.toLowerCase().includes('fast ga') && test3.text.toLowerCase().includes('cheskondi'),
  'Normalizes colloquial verbal forms "fast ga" and "cheskondi"'
);

// 2. Custom Creator Vocabulary Consistency
console.log('\n2. Custom Creator Vocabulary:');
const customVocab = [
  { term: 'chesukovatam', preferredSpelling: 'cheskovadam', category: 'custom' as const },
  { term: 'balakishore', preferredSpelling: 'Bala Kishore', category: 'creator_name' as const }
];
const testVocab = normalizeTenglish('Ee video lo balakishore chesukovatam chudandi.', customVocab);
assert(
  testVocab.text.includes('Bala Kishore') && testVocab.text.includes('cheskovadam'),
  'Enforces creator preferred custom spelling consistency'
);

// 3. Caption Segmentation & Timing Integrity
console.log('\n3. Caption Segmentation:');
const rawSegments: RawSegment[] = [
  {
    start: 0.5,
    end: 4.8,
    text: 'Bro idhi oka manchi opportunity freshers kuda fast ga apply cheskondi.'
  }
];
const segmented = segmentTranscript(rawSegments, { maxCharsPerLine: 30, maxLinesPerSegment: 2 });
assert(segmented.length >= 2, 'Splits long speech segment into concise readable lines for vertical reels');

// Verify non-overlapping timestamps
let hasOverlap = false;
for (let i = 0; i < segmented.length - 1; i++) {
  if (segmented[i].end > segmented[i + 1].start) {
    hasOverlap = true;
    break;
  }
}
assert(!hasOverlap, 'Caption segment timestamps are strictly non-overlapping');

// 4. ASS & SRT Subtitle Generation
console.log('\n4. Subtitle Export Generators:');
const srt = generateSrt(segmented);
assert(srt.includes('00:00:00,') && srt.includes('-->'), 'Generates valid standard SRT subtitle file');

const ass = generateAss(segmented, CAPTION_TEMPLATES.hormozi_impact);
assert(ass.includes('[Script Info]') && ass.includes('[V4+ Styles]') && ass.includes('Dialogue:'), 'Generates valid ASS subtitle stream');

// 5. Hex to ASS Color Conversion
console.log('\n5. Color Mathematics:');
assert(hexToAssColor('#FFFFFF') === '&H00FFFFFF&', 'Converts white hex to ASS color');
assert(hexToAssColor('#FACC15') === '&H0015CCFA&', 'Converts vibrant yellow #FACC15 to BGR ASS color &H0015CCFA&');

// 6. Template Presets Verification
console.log('\n6. Style Presets:');
const templateKeys = Object.keys(CAPTION_TEMPLATES);
assert(templateKeys.length === 6, 'All 6 trending reel & shorts templates are present');
assert(
  templateKeys.includes('hormozi_impact') &&
  templateKeys.includes('ali_minimal') &&
  templateKeys.includes('tiktok_bouncy') &&
  templateKeys.includes('cyber_glow') &&
  templateKeys.includes('karaoke_flow') &&
  templateKeys.includes('cinematic_warm'),
  'Matches exact 6 trending template IDs'
);

console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
if (failed > 0) process.exit(1);
