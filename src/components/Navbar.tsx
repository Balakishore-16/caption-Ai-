import React from 'react';
import { Film, Sparkles, Layers, Sliders, PlayCircle, Plus } from 'lucide-react';

interface NavbarProps {
  currentView: 'landing' | 'studio' | 'editor' | 'playground';
  onNavigate: (view: 'landing' | 'studio' | 'playground') => void;
  onOpenNewProject: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenNewProject
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3">
        {/* Zone 1: Capzen Brand Wordmark */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 text-left group transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/30 group-hover:from-blue-500 group-hover:to-indigo-400 transition-all">
            <Film className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black tracking-tight text-white whitespace-nowrap shrink-0">
              Capzen
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
              PRO
            </span>
          </div>
        </button>

        {/* Zone 2: 4 single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onNavigate('studio')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              currentView === 'studio' ? 'text-blue-400 font-semibold' : ''
            }`}
          >
            Studio Dashboard
          </button>
          <a
            href="#templates"
            onClick={(e) => {
              if (currentView !== 'landing') {
                e.preventDefault();
                onNavigate('landing');
                setTimeout(() => {
                  document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="transition-colors whitespace-nowrap shrink-0 hover:text-white"
          >
            Trending Styles
          </a>
          <a
            href="#how-it-works"
            onClick={(e) => {
              if (currentView !== 'landing') {
                e.preventDefault();
                onNavigate('landing');
                setTimeout(() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="transition-colors whitespace-nowrap shrink-0 hover:text-white"
          >
            Workflow
          </a>
          <button
            onClick={() => onNavigate('playground')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              currentView === 'playground' ? 'text-blue-400 font-semibold' : ''
            }`}
          >
            Language Engine
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {currentView === 'landing' ? (
            <button
              onClick={() => onNavigate('studio')}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-md shadow-blue-600/30 whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <span>Open Studio</span>
            </button>
          ) : (
            <button
              onClick={onOpenNewProject}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-md shadow-blue-600/30 whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
