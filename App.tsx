import React, { useState } from 'react';
import { AppView, ActivityId, GameMode } from './types';
import Dashboard from './components/Dashboard';
import OrbitCommand from './components/activities/OrbitCommand';
import LightIncidence from './components/activities/LightIncidence';
import TiltOrbitExplorer from './components/activities/TiltOrbitExplorer';
import Earth3D from './components/activities/Earth3D';
import QuizModule from './components/QuizModule';
import { ArrowLeft, Users, User, Info, Globe } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [activeActivityId, setActiveActivityId] = useState<ActivityId | null>(null);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [currentStage, setCurrentStage] = useState<string>('');

  const handleSelectActivity = (id: ActivityId) => {
    setActiveActivityId(id);
    setGameMode(null);
    setCurrentStage('Select Path');
    setCurrentView(AppView.ACTIVITY);
  };

  const handleBackToSelectPath = () => {
    setGameMode(null);
    setCurrentStage('Select Path');
  };

  const handleHome = () => {
    setCurrentView(AppView.DASHBOARD);
    setActiveActivityId(null);
    setGameMode(null);
    setCurrentStage('');
  };

  const getActiveActivityTitle = () => {
    if (!activeActivityId) return '';
    const activities = [
      { id: ActivityId.LIGHT_INCIDENCE, title: "Light & Heat" },
      { id: ActivityId.SEASONS, title: "Tilt and Orbit Consequences" },
      { id: ActivityId.ORBIT_REVOLUTION, title: "Solar System View" },
      { id: ActivityId.SUNLIGHT_INTENSITY, title: "Sunlight Intensity" }
    ];
    return activities.find(a => a.id === activeActivityId)?.title || '';
  };

  const renderContent = () => {
    if (!gameMode) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[50vh] space-y-8 animate-fade-in relative">
          <div className="relative">
            <h2 className="text-3xl font-bold text-white">Select Path</h2>
            {/* Floating Astronaut */}
            <div className="absolute -top-16 -right-16 animate-bounce-slow">
              <img 
                src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
                alt="Astronaut" 
                className="w-16 h-16 drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 w-full max-w-2xl">
            <button
              onClick={() => {
                setGameMode(GameMode.GROUP);
                setCurrentStage('Path 1: Warm-up');
              }}
              className="glass-panel p-8 rounded-2xl hover:bg-white/5 transition-all flex flex-col items-center border border-neon-pink/30 hover:border-neon-pink group"
            >
              <Users size={64} className="text-neon-pink mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-white text-center">Path 1: Warm-up with reflective and creative thinking</h3>
              <p className="text-center text-gray-400 mt-2 text-sm">In class, before the simulation.</p>
            </button>
            <button
              onClick={() => {
                setGameMode(GameMode.SOLO);
                setCurrentStage('Path 2: Exploration');
              }}
              className="glass-panel p-8 rounded-2xl hover:bg-white/5 transition-all flex flex-col items-center border border-neon-blue/30 hover:border-neon-blue group"
            >
              <User size={64} className="text-neon-blue mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-white text-center">Path 2: Exploration Mission</h3>
              <p className="text-center text-gray-400 mt-2 text-sm">Interactive digital simulations.</p>
            </button>
          </div>
        </div>
      );
    }

    switch (activeActivityId) {
      case ActivityId.LIGHT_INCIDENCE: // Tile 1
        return <LightIncidence mode={gameMode} setStage={setCurrentStage} />;
      case ActivityId.SEASONS: // Tile 2
        return <TiltOrbitExplorer 
          mode={gameMode} 
          onNavigateToSolarSystem={() => handleSelectActivity(ActivityId.ORBIT_REVOLUTION)}
          setStage={setCurrentStage}
        />;
      case ActivityId.ORBIT_REVOLUTION: // Tile 3
        return <Earth3D 
          className="w-full h-full min-h-[600px] rounded-2xl overflow-hidden" 
          setStage={setCurrentStage}
          mode={gameMode}
        />;
      case ActivityId.SUNLIGHT_INTENSITY: // Tile 4
        return (
          <div className="space-y-8 max-w-7xl mx-auto">
            <div className="glass-panel p-6 rounded-xl border-l-4 border-yellow-400">
               <h2 className="text-2xl font-bold mb-2">Sunlight Intensity</h2>
               <div className="flex justify-center my-6">
                 {/* Simple Flashlight SVG visualization */}
                 <div className="relative w-64 h-32">
                   <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-yellow-500/20 to-transparent transform -skew-x-12 border border-white/10 rounded"></div>
                   <p className="absolute bottom-2 left-2 text-xs text-gray-400">Angle spreads energy</p>
                 </div>
               </div>
               <p className="text-gray-300">
                 In Finland (high latitude), sunlight hits the ground at a low angle, spreading the energy over a large area. This makes it cooler than at the Equator where light hits directly.
               </p>
            </div>
            <QuizModule topic="Sunlight intensity and angle of incidence" />
          </div>
        );
      default:
        return <div className="text-center text-gray-500">Module Under Construction</div>;
    }
  };

  return (
    <div className="h-[100dvh] w-screen bg-space-900 text-white overflow-hidden flex flex-col relative selection:bg-neon-pink selection:text-white">
      {/* Fixed Background Layer */}
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none -z-10 animate-pulse-slow"></div>
      
      {/* Header - Fixed Height */}
      <header className="flex-none p-4 md:p-6 flex items-center justify-between glass-panel z-50 rounded-b-xl mx-2 md:mx-6 mb-2 shrink-0">
        <div className="flex items-center">
          {currentView === AppView.ACTIVITY && (
            <button 
              onClick={handleBackToSelectPath} 
              className="mr-4 p-2 rounded-full hover:bg-white/10 transition-colors text-neon-blue"
              title="Back to Path Selection"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-widest text-white leading-none">ASTROFINN</span>
            {currentView === AppView.ACTIVITY && (
              <div className="flex items-center text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">
                <span className="text-neon-blue font-bold mr-1">{getActiveActivityTitle()}</span>
                <span className="mx-1 opacity-50">|</span>
                <span className="text-white/70">{currentStage}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {currentView === AppView.ACTIVITY && (
            <button 
              onClick={handleHome}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-all flex items-center gap-2"
            >
              <Globe size={14} className="text-neon-blue" />
              HOME
            </button>
          )}
          <div className="hidden md:flex items-center text-xs font-mono text-gray-400">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            SYSTEM ONLINE
          </div>
        </div>
      </header>

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:px-6 pb-6 w-full scrollbar-thin scrollbar-track-transparent scrollbar-thumb-space-700 hover:scrollbar-thumb-neon-blue">
         <div className="w-full h-full">
            {currentView === AppView.DASHBOARD ? (
              <Dashboard onSelectActivity={handleSelectActivity} />
            ) : (
              <div className="animate-fade-in-up w-full h-full">
                {renderContent()}
              </div>
            )}
         </div>
      </main>
    </div>
  );
};

export default App;