/**
 * Tenglish Correction and Transliteration Engine
 * 
 * Handles:
 * 1. Telugu script to natural Roman Tenglish transliteration
 * 2. Natural English code-switched vocabulary preservation (e.g., job, freshers, apply)
 * 3. Colloquial spelling normalization (e.g. 'kuda', 'cheskondi', 'chudandi')
 * 4. Creator custom vocabulary and preferred spellings
 * 5. Confidence scoring and uncertain words detection
 */

// Telugu character maps
const TELUGU_VOWELS: Record<string, string> = {
  'అ': 'a',
  'ఆ': 'aa',
  'ఇ': 'i',
  'ఈ': 'ee',
  'ఉ': 'u',
  'ఊ': 'oo',
  'ఋ': 'ru',
  'ౠ': 'roo',
  'ఎ': 'e',
  'ఏ': 'e',
  'ఐ': 'ai',
  'ఒ': 'o',
  'ఓ': 'o',
  'ఔ': 'au',
  'అం': 'am',
  'అః': 'aha'
};

const TELUGU_CONSONANTS: Record<string, string> = {
  'క': 'k', 'ఖ': 'kh', 'గ': 'g', 'ఘ': 'gh', 'ఙ': 'ng',
  'చ': 'ch', 'ఛ': 'chh', 'జ': 'j', 'ఝ': 'jh', 'ఞ': 'ny',
  'ట': 't', 'ఠ': 'th', 'డ': 'd', 'ఢ': 'dh', 'ణ': 'n',
  'త': 'th', 'థ': 'th', 'ద': 'd', 'ధ': 'dh', 'న': 'n',
  'ప': 'p', 'ఫ': 'f', 'బ': 'b', 'భ': 'bh', 'మ': 'm',
  'య': 'y', 'ర': 'r', 'ల': 'l', 'వ': 'v', 'శ': 'sh',
  'ష': 'sh', 'స': 's', 'హ': 'h', 'ళ': 'l', 'క్ష': 'ksh', 'ఱ': 'r'
};

const TELUGU_MATRAS: Record<string, string> = {
  'ా': 'aa',
  'ి': 'i',
  'ీ': 'ee',
  'ు': 'u',
  'ూ': 'oo',
  'ృ': 'ru',
  'ౄ': 'roo',
  'ె': 'e',
  'ే': 'e',
  'ై': 'ai',
  'ొ': 'o',
  'ో': 'o',
  'ౌ': 'au',
};

// Common English words frequently spoken in Telugu creator reels/shorts
// When transcribed in Telugu script or phonetic Roman, map back to standard English
export const ENGLISH_CODE_SWITCH_MAP: Record<string, string> = {
  'జాబ్': 'job',
  'జాబ్స్': 'jobs',
  'జాబు': 'job',
  'ఫ్రెషర్స్': 'freshers',
  'ఫ్రెషర్': 'fresher',
  'అప్లై': 'apply',
  'బ్రో': 'bro',
  'ఆపర్చునిటీ': 'opportunity',
  'ఆపర్చునిటి': 'opportunity',
  'ఆఫర్': 'offer',
  'వీడియో': 'video',
  'వీడియోస్': 'videos',
  'రీల్': 'reel',
  'రీల్స్': 'reels',
  'ఇన్‌స్టాగ్రామ్': 'instagram',
  'ఇన్స్టాగ్రామ్': 'instagram',
  'యూట్యూబ్': 'youtube',
  'సబ్‌స్క్రైబ్': 'subscribe',
  'సబ్స్క్రైబ్': 'subscribe',
  'లైక్': 'like',
  'షేర్': 'share',
  'కామెంట్': 'comment',
  'లింక్': 'link',
  'బయో': 'bio',
  'బయోలో': 'bio lo',
  'సాలరీ': 'salary',
  'ప్యాకేజ్': 'package',
  'ఇంటర్వ్యూ': 'interview',
  'ఆఫీస్': 'office',
  'వర్క్': 'work',
  'హోమ్': 'home',
  'సాఫ్ట్‌వేర్': 'software',
  'కోడింగ్': 'coding',
  'డెవలపర్': 'developer',
  'డెవలప్‌మెంట్': 'development',
  'రిజ్యూమ్': 'resume',
  'ప్రాజెక్ట్': 'project',
  'ప్రాజెక్ట్స్': 'projects',
  'కంపెనీ': 'company',
  'కంపెనీస్': 'companies',
  'కోర్స్': 'course',
  'ట్రైనింగ్': 'training',
  'నాలెడ్జ్': 'knowledge',
  'ఇన్ఫర్మేషన్': 'information',
  'అప్‌డేట్': 'update',
  'నోటిఫికేషన్': 'notification',
  'ఎలిజిబుల్': 'eligible',
  'క్వాలిఫికేషన్': 'qualification',
  'డిగ్రీ': 'degree',
  'బిటెక్': 'B.Tech',
  'ఎంటెక్': 'M.Tech',
  'కాలేజ్': 'college',
  'స్టూడెంట్స్': 'students',
  'స్కిల్స్': 'skills',
  'ఎక్స్‌పీరియన్స్': 'experience',
  'రిమోట్': 'remote',
  'ఆన్‌లైన్': 'online',
  'ఆఫ్‌లైన్': 'offline',
  'వెబ్‌సైట్': 'website',
  'యాప్': 'app',
  'మొబైల్': 'mobile',
  'ల్యాప్‌టాప్': 'laptop',
  'ఫ్రీ': 'free',
  'గైస్': 'guys',
  'ఫ్రెండ్స్': 'friends',
  'హాయ్': 'hi',
  'హలో': 'hello',
  'ప్లీజ్': 'please',
  'థాంక్స్': 'thanks',
  'సూపర్': 'super',
  'ఫాస్ట్': 'fast',
  'డెడ్లైన్': 'deadline',
  'లాస్ట్ డేట్': 'last date',
  'ప్రాసెస్': 'process',
  // Common colloquial spoken verbs & particles
  'చేసుకోండి': 'cheskondi',
  'చేసుకోండి.': 'cheskondi.',
  'చేసుకోవచ్చు': 'cheskovachu',
  'చేసుకోవచ్చు.': 'cheskovachu.',
  'చేయండి': 'cheyandi',
  'చూడండి': 'chudandi',
  'కూడా': 'kuda',
  'ఇది': 'idhi',
  'ఒక': 'oka',
  'మంచి': 'manchi',
  'గా': 'ga',
  'లో': 'lo',
  'కి': 'ki'
};

// Common Roman spelling normalization map for colloquial Tenglish
export const COLLOQUIAL_TENGLISH_NORM_MAP: Record<string, string> = {
  // Common verbs and pronouns
  'chesukondi': 'cheskondi',
  'chesukomdi': 'cheskondi',
  'chesukomdi.': 'cheskondi.',
  'chesukondi!': 'cheskondi!',
  'chesukovachu': 'cheskovachu',
  'chesukovachhu': 'cheskovachu',
  'chesukovatam': 'cheskovadam',
  'cheskuntaanu': 'cheskuntanu',
  'kooda': 'kuda',
  'koodaa': 'kuda',
  'choodandi': 'chudandi',
  'cheyyandi': 'cheyandi',
  'raavachu': 'ravachu',
  'raavachhu': 'ravachu',
  'vellandi': 'vellandi',
  'undhi': 'undi',
  'unnadi': 'undi',
  'ledhu': 'ledu',
  'kaani': 'kani',
  'chaala': 'chala',
  'gaa': 'ga',
  'aithe': 'aithe',
  'lekapothe': 'lekapothe',
  'kadha': 'kada',
  'anukuntunna': 'anukuntunna',
  'telusaa': 'telusa',
  'ippudu': 'ippudu',
  'appudu': 'appudu',
  'ekkada': 'ekkada',
  'enti': 'enti',
  'ela': 'ela',
  'manchi': 'manchi',
  'bagundi': 'bagundi',
  'bagundhi': 'bagundi',
  'mariyu': 'and',
  'inka': 'inka',
  'endukante': 'endukante',
  'eeroju': 'eeroju',
  'repu': 'repu',
  'ninna': 'ninna'
};

export interface CorrectionSuggestion {
  original: string;
  suggested: string;
  reason: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
}

export interface CreatorVocabularyItem {
  term: string;
  preferredSpelling: string;
  category?: 'creator_name' | 'tech' | 'place' | 'brand' | 'custom';
}

/**
 * Transliterates Telugu unicode text into natural colloquial Roman Tenglish.
 * Handles vowels, consonants, guninthalu matras, virama (halant), and anusvara.
 */
export function transliterateTeluguToRoman(text: string): string {
  if (!text) return '';

  let result = '';
  const length = text.length;
  let i = 0;

  while (i < length) {
    const char = text[i];
    const nextChar = i + 1 < length ? text[i + 1] : '';

    // Check Telugu Vowels (independent)
    if (TELUGU_VOWELS[char]) {
      result += TELUGU_VOWELS[char];
      i++;
      continue;
    }

    // Check Telugu Consonants
    if (TELUGU_CONSONANTS[char]) {
      const baseConsonant = TELUGU_CONSONANTS[char];

      if (nextChar === '్') {
        // Virama / Halant - silence the inherent vowel 'a'
        result += baseConsonant;
        i += 2;
        continue;
      } else if (TELUGU_MATRAS[nextChar]) {
        // Matra / Vowel sign attached
        result += baseConsonant + TELUGU_MATRAS[nextChar];
        i += 2;
        continue;
      } else if (nextChar === 'ం') {
        // Anusvara
        result += baseConsonant + 'am';
        i += 2;
        continue;
      } else {
        // Inherent vowel 'a'
        // In colloquial spoken endings, trailing 'a' is often soft or natural
        result += baseConsonant + 'a';
        i++;
        continue;
      }
    }

    // Isolated matras or symbols
    if (TELUGU_MATRAS[char]) {
      result += TELUGU_MATRAS[char];
      i++;
      continue;
    }

    if (char === 'ం') {
      result += 'm';
      i++;
      continue;
    }

    if (char === 'ః') {
      result += 'h';
      i++;
      continue;
    }

    // Pass through punctuation, numbers, spaces, English characters
    result += char;
    i++;
  }

  // Smooth out over-generated double 'a's or unnatural phonetic clumps
  return cleanTransliteratedPhonetics(result);
}

/**
 * Cleans up raw phonetic transliteration into natural spoken Tenglish.
 */
function cleanTransliteratedPhonetics(romanText: string): string {
  return romanText
    .replace(/a+([eiou])/g, '$1')
    .replace(/thh/g, 'th')
    .replace(/khh/g, 'kh')
    .replace(/shh/g, 'sh')
    .replace(/aa/g, 'aa')
    .replace(/([bcdfghjklmnpqrstvwxyz])a\b/g, '$1') // drop silent trailing 'a' on consonant endings (e.g. 'joba' -> 'job')
    .trim();
}

/**
 * Normalizes text with code-switching, English term preservation, and creator vocabulary.
 */
export function normalizeTenglish(
  rawText: string,
  customVocabulary: CreatorVocabularyItem[] = []
): { text: string; suggestions: CorrectionSuggestion[] } {
  if (!rawText) return { text: '', suggestions: [] };

  const suggestions: CorrectionSuggestion[] = [];

  // Check if text is mostly Telugu script
  const hasTelugu = /[\u0C00-\u0C7F]/.test(rawText);

  // Split into tokens preserving punctuation and whitespace
  const words = rawText.split(/(\s+|[.,!?;:"])/);

  const processedWords = words.map((token, index) => {
    if (!token || /^\s+$/.test(token) || /^[.,!?;:"]+$/.test(token)) {
      return token;
    }

    const cleanToken = token.trim();
    const cleanLower = cleanToken.toLowerCase();

    // 1. Check custom creator vocabulary
    const customMatch = customVocabulary.find(
      (v) =>
        v.term.toLowerCase() === cleanLower ||
        v.preferredSpelling.toLowerCase() === cleanLower
    );
    if (customMatch && cleanToken !== customMatch.preferredSpelling) {
      suggestions.push({
        original: cleanToken,
        suggested: customMatch.preferredSpelling,
        reason: 'Matches your custom creator vocabulary preference',
        confidence: 0.98,
        startIndex: index,
        endIndex: index + 1
      });
      return customMatch.preferredSpelling;
    }

    // 2. Check Telugu code-switched English word dictionary
    if (ENGLISH_CODE_SWITCH_MAP[cleanToken]) {
      const engWord = ENGLISH_CODE_SWITCH_MAP[cleanToken];
      suggestions.push({
        original: cleanToken,
        suggested: engWord,
        reason: 'Telugu speech used common English term',
        confidence: 0.95,
        startIndex: index,
        endIndex: index + 1
      });
      return engWord;
    }

    // 3. If word is Telugu script, transliterate it to Roman Tenglish
    if (/[\u0C00-\u0C7F]/.test(cleanToken)) {
      const romanWord = transliterateTeluguToRoman(cleanToken);
      // Check colloquial norm map on the transliterated word
      const normWord = COLLOQUIAL_TENGLISH_NORM_MAP[romanWord.toLowerCase()] || romanWord;
      return normWord;
    }

    // 4. If already Roman Tenglish, check colloquial spelling normalization
    if (COLLOQUIAL_TENGLISH_NORM_MAP[cleanLower]) {
      const normalized = COLLOQUIAL_TENGLISH_NORM_MAP[cleanLower];
      if (cleanLower !== normalized) {
        suggestions.push({
          original: cleanToken,
          suggested: normalized,
          reason: 'Standardized to common natural Roman Telugu spelling',
          confidence: 0.9,
          startIndex: index,
          endIndex: index + 1
        });
        return normalized;
      }
    }

    return cleanToken;
  });

  let finalText = processedWords.join('');

  // Post-processing phrase-level colloquial polish
  finalText = finalText
    .replace(/\bfast ga\b/gi, 'fast ga')
    .replace(/\bsuper ga\b/gi, 'super ga')
    .replace(/\bmanchi opportunity\b/gi, 'manchi opportunity')
    .replace(/\bfreshers kuda\b/gi, 'freshers kuda')
    .replace(/\bapply cheskondi\b/gi, 'apply cheskondi');

  return {
    text: finalText,
    suggestions
  };
}

/**
 * Detects uncertain words in a segment (e.g. low-confidence recognition or ambiguous spellings)
 */
export function detectUncertainWords(text: string): { word: string; suggestions: string[] }[] {
  const uncertain: { word: string; suggestions: string[] }[] = [];
  const words = text.split(/\s+/);

  for (const w of words) {
    const clean = w.replace(/[.,!?;:"]/g, '').toLowerCase();
    if (!clean) continue;

    // Check known ambiguous variants
    if (clean === 'kooda') {
      uncertain.push({ word: w, suggestions: ['kuda'] });
    } else if (clean === 'chesukondi') {
      uncertain.push({ word: w, suggestions: ['cheskondi'] });
    } else if (clean === 'choodandi') {
      uncertain.push({ word: w, suggestions: ['chudandi'] });
    } else if (clean === 'raavachu') {
      uncertain.push({ word: w, suggestions: ['ravachu', 'cheskovachu'] });
    }
  }

  return uncertain;
}
