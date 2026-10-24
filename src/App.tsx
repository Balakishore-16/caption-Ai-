import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { StudioDashboard } from './components/StudioDashboard';
import { CaptionEditor } from './components/CaptionEditor';
import { TenglishPlayground } from './components/TenglishPlayground';
import { LoadingProvider } from './context/LoadingContext';
import { GlobalProgressOverlay } from './components/GlobalProgressOverlay';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'studio' | 'editor' | 'playground'>('studio');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeClientPreviewUrl, setActiveClientPreviewUrl] = useState<string | undefined>(undefined);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);

  const handleStartCreating = () => {
    setCurrentView('studio');
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setCurrentView('studio');
  };

  const handleOpenProject = (projectId: string, clientPreviewUrl?: string) => {
    setActiveProjectId(projectId);
    setActiveClientPreviewUrl(clientPreviewUrl);
    setCurrentView('editor');
  };

  const handleBackToDashboard = () => {
    setActiveProjectId(null);
    setActiveClientPreviewUrl(undefined);
    setCurrentView('studio');
  };

  return (
    <LoadingProvider>
      <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100 selection:bg-blue-600 selection:text-white relative">
        <GlobalProgressOverlay />

        <Navbar
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
          onOpenNewProject={() => {
            setActiveProjectId(null);
            setActiveClientPreviewUrl(undefined);
            setCurrentView('studio');
          }}
        />

        <main className="flex-1">
          {currentView === 'landing' && (
            <LandingPage
              onStartCreating={handleStartCreating}
              onSelectTemplate={handleSelectTemplate}
              onOpenPlayground={() => setCurrentView('playground')}
            />
          )}

          {currentView === 'studio' && (
            <StudioDashboard
              onOpenProject={handleOpenProject}
              initialTemplate={selectedTemplateId}
            />
          )}

          {currentView === 'editor' && activeProjectId && (
            <CaptionEditor
              projectId={activeProjectId}
              clientPreviewUrl={activeClientPreviewUrl}
              onBackToDashboard={handleBackToDashboard}
            />
          )}

          {currentView === 'playground' && (
            <TenglishPlayground />
          )}
        </main>
      </div>
    </LoadingProvider>
  );
}
