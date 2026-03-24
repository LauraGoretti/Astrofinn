import React, { useState } from 'react';
import { AppView, ActivityId, GameMode } from './types';
import Dashboard from './components/Dashboard';
import OrbitCommand from './components/activities/OrbitCommand';
import LightIncidence from './components/activities/LightIncidence';
import TiltOrbitExplorer from './components/activities/TiltOrbitExplorer';
import Earth3D from './components/activities/Earth3D';
import SizesDistances from './components/activities/SizesDistances';
import QuizModule from './components/QuizModule';
import { ArrowLeft, Users, User, Info, Globe } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [activeActivityId, setActiveActivityId] = useState<ActivityId | null>(null);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [backIntercept, setBackIntercept] = useState<{ handler: () => boolean } | null>(null);

  const handleSelectActivity = (id: ActivityId) => {
    setActiveActivityId(id);
    if (id === ActivityId.LIGHT_INCIDENCE) {
      setGameMode(GameMode.SOLO);
      setCurrentStage('Light Incidence and Heating');
    } else if (id === ActivityId.SIZES_DISTANCES) {
      setGameMode(GameMode.SOLO);
      setCurrentStage('Real Sizes and Distances');
    } else {
      setGameMode(null);
      setCurrentStage('Select Path');
    }
    setCurrentView(AppView.ACTIVITY);
  };

  const goToDashboard = () => {
    setBackIntercept(null);
    setCurrentView(AppView.DASHBOARD);
    setActiveActivityId(null);
    setCurrentStage('');
    setGameMode(null);
  };

  const handleBack = () => {
    if (backIntercept && backIntercept.handler()) {
      return;
    }
    if (gameMode && activeActivityId !== ActivityId.LIGHT_INCIDENCE && activeActivityId !== ActivityId.SIZES_DISTANCES) {
      setGameMode(null);
      setCurrentStage('Select Path');
    } else {
      setCurrentView(AppView.DASHBOARD);
      setActiveActivityId(null);
      setCurrentStage('');
      setGameMode(null);
    }
  };

  const getActiveActivityTitle = () => {
    if (!activeActivityId) return '';
    const activities = [
      { id: ActivityId.LIGHT_INCIDENCE, title: "Light & Heat" },
      { id: ActivityId.SEASONS, title: "Tilt and Orbit Consequences" },
      { id: ActivityId.ORBIT_REVOLUTION, title: "Solar System View" },
      { id: ActivityId.SIZES_DISTANCES, title: "Real Sizes and Distances" }
    ];
    return activities.find(a => a.id === activeActivityId)?.title || '';
  };

  const renderContent = () => {
    if (!gameMode) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[50vh] space-y-8 animate-fade-in relative">
          <div className="relative">
            <h2 className="text-2xl font-bold text-white">Select Path</h2>
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
              className="glass-panel hover:bg-white/5 transition-all flex flex-col items-center border-neon-pink/30 hover:border-neon-pink group"
            >
              <Users size={64} className="text-neon-pink mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold text-white text-center">Path 1: Warm-up with reflective and creative thinking</h3>
              <p className="text-center text-gray-400 mt-2 text-base leading-relaxed">In class, before the simulation.</p>
            </button>
            <button
              onClick={() => {
                setGameMode(GameMode.SOLO);
                setCurrentStage('Path 2: Exploration');
              }}
              className="glass-panel hover:bg-white/5 transition-all flex flex-col items-center border-neon-blue/30 hover:border-neon-blue group"
            >
              <User size={64} className="text-neon-blue mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold text-white text-center">Path 2: Exploration Mission</h3>
              <p className="text-center text-gray-400 mt-2 text-base leading-relaxed">Interactive digital simulations.</p>
            </button>
          </div>
        </div>
      );
    }

    switch (activeActivityId) {
      case ActivityId.LIGHT_INCIDENCE: // Tile 1
        return <LightIncidence 
          mode={gameMode!} 
          setStage={setCurrentStage} 
          onHome={goToDashboard} 
          setBackIntercept={setBackIntercept}
        />;
      case ActivityId.SEASONS: // Tile 2
        return <TiltOrbitExplorer 
          mode={gameMode} 
          onNavigateToSolarSystem={() => handleSelectActivity(ActivityId.ORBIT_REVOLUTION)}
          setStage={setCurrentStage}
          onHome={goToDashboard}
          setBackIntercept={setBackIntercept}
        />;
      case ActivityId.ORBIT_REVOLUTION: // Tile 3
        return <Earth3D 
          className="w-full h-full min-h-[600px] rounded-2xl overflow-hidden" 
          setStage={setCurrentStage}
          mode={gameMode!}
          setBackIntercept={setBackIntercept}
        />;
      case ActivityId.SIZES_DISTANCES: // Tile 4
        return <SizesDistances 
          mode={gameMode} 
          setStage={setCurrentStage} 
          onHome={goToDashboard} 
          setBackIntercept={setBackIntercept}
        />;
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
              onClick={handleBack} 
              className="mr-4 p-2 rounded-full hover:bg-white/10 transition-colors text-neon-blue"
              title="Back"
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
          <div className="hidden md:flex items-center text-xs font-mono text-gray-400">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            SYSTEM ONLINE
          </div>
        </div>
      </header>

      {/* Main Content Area - Scrollable */}
      <main className={`flex-1 overflow-y-auto overflow-x-hidden ${currentView === AppView.DASHBOARD ? 'p-4 md:px-6' : 'p-2 md:px-4 lg:px-4'} pb-6 w-full scrollbar-thin scrollbar-track-transparent scrollbar-thumb-space-700 hover:scrollbar-thumb-neon-blue`}>
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