import React, { useState } from 'react';
import { api } from '../services/api';
import { CheckCircle2, ArrowRight, BookOpen, Sparkles, RefreshCw } from 'lucide-react';
import { CreatorVocabularyItem } from '../types';

export const TenglishPlayground: React.FC = () => {
  const [inputText, setInputText] = useState('బ్రో ఇది ఒక మంచి ఆపర్చునిటీ. ఫ్రెషర్స్ కూడా అప్లై చేసుకోవచ్చు. ఫాస్ట్ గా అప్లై చేసుకోండి.');
  const [outputText, setOutputText] = useState('Bro, idhi oka manchi opportunity. Freshers kuda apply cheskovachu. Fast ga apply cheskondi.');
  const [suggestions, setSuggestions] = useState<any[]>([
    { original: 'ఆపర్చునిటీ', suggested: 'opportunity', reason: 'Spoken English technical term preserved' },
    { original: 'ఫ్రెషర్స్', suggested: 'freshers', reason: 'Career term preserved in natural English' },
    { original: 'అప్లై', suggested: 'apply', reason: 'English action verb preserved' },
    { original: 'కూడా', suggested: 'kuda', reason: 'Standardized to colloquial Roman Telugu' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const samples = [
    {
      label: 'Tech Job Reel',
      telugu: 'బ్రో ఇది ఒక మంచి ఆపర్చునిటీ. ఫ్రెషర్స్ కూడా అప్లై చేసుకోవచ్చు. ఫాస్ట్ గా అప్లై చేసుకోండి.'
    },
    {
      label: 'Coding Tutorial Short',
      telugu: 'ఈ వీడియో లో మనం రియాక్ట్ ప్రాజెక్ట్ ఎలా బిల్డ్ చేయాలో చూద్దాం. లింక్ బయో లో ఉంది.'
    },
    {
      label: 'Salary & Career Update',
      telugu: 'టాప్ కంపెనీస్ లో సాఫ్ట్‌వేర్ డెవలపర్ జాబ్స్ కి ఫ్రెషర్స్ కి హై సాలరీ ప్యాకేజ్ ఇస్తున్నారు.'
    },
    {
      label: 'Creator Channel Callout',
      telugu: 'వీడియో నచ్చితే లైక్ చేసి మీ ఫ్రెండ్స్ కి షేర్ చేయండి. ఛానల్ కి సబ్‌స్క్రైబ్ చేసుకోండి.'
    }
  ];

  const handleNormalize = async (text: string) => {
    setIsLoading(true);
    try {
      const res = await api.testNormalize(text);
      setOutputText(res.text);
      setSuggestions(res.suggestions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold uppercase tracking-wider mb-2">
          <BookOpen className="w-4 h-4" />
          <span>Core Differentiation Engine</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Tenglish Transliteration & Code-Switching Playground
        </h1>
        <p className="mt-2 text-slate-600 max-w-2xl text-sm leading-relaxed">
          Test how Telugu script and spoken code-switched audio are transformed into natural Roman Telugu (Tenglish) while keeping English technical terms, career titles, and creator vernacular intact.
        </p>
      </div>

      {/* Preset samples */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 mr-2">Try Real Examples:</span>
        {samples.map((s) => (
          <button
            key={s.label}
            onClick={() => {
              setInputText(s.telugu);
              handleNormalize(s.telugu);
            }}
            className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md transition-colors"
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Input box */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Spoken Telugu Speech / Script
              </label>
              <span className="text-xs text-slate-400">Unicode Telugu</span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={6}
              className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
              placeholder="Type or paste Telugu text here..."
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => handleNormalize(inputText)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Transliterate & Normalize</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output box */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Accurate Roman Tenglish Result
              </label>
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Code-Switch Preserved</span>
              </span>
            </div>
            <div className="min-h-[148px] text-sm text-slate-900 bg-blue-50/40 border border-blue-100 rounded-lg p-3.5 font-medium leading-relaxed">
              {outputText || 'Output will appear here...'}
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500">
            Natural Roman spelling with preserved English terms (ready for vertical caption burning).
          </div>
        </div>
      </div>

      {/* Suggestions / Detection Breakdown */}
      {suggestions.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Engine Code-Switching Intelligence & Normalized Terms
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {suggestions.map((s, idx) => (
              <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-900">{s.suggested}</span>
                  <span className="text-[10px] text-slate-400 line-through">{s.original}</span>
                </div>
                <p className="text-[11px] text-slate-500">{s.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
