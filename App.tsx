import React, { useState } from 'react';
import { AppView, ActivityId, GameMode } from './types';
import Dashboard from './components/Dashboard';
import OrbitCommand from './components/activities/OrbitCommand';
import KaamosViewer from './components/activities/KaamosViewer';
import ShadowLab from './components/activities/ShadowLab';
import QuizModule from './components/QuizModule';
import { ArrowLeft, Users, User, Info } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [activeActivityId, setActiveActivityId] = useState<ActivityId | null>(null);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);

  const handleSelectActivity = (id: ActivityId) => {
    setActiveActivityId(id);
    setGameMode(null); // Reset mode so user has to choose
    setCurrentView(AppView.ACTIVITY);
  };

  const handleBack = () => {
    setCurrentView(AppView.DASHBOARD);
    setActiveActivityId(null);
    setGameMode(null);
  };

  const renderContent = () => {
    if (!gameMode) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[50vh] space-y-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-white">Select Protocol</h2>
          <div className="grid md:grid-cols-2 gap-8 w-full max-w-2xl">
            <button
              onClick={() => setGameMode(GameMode.SOLO)}
              className="glass-panel p-8 rounded-2xl hover:bg-white/5 transition-all flex flex-col items-center border border-neon-blue/30 hover:border-neon-blue"
            >
              <User size={64} className="text-neon-blue mb-4" />
              <h3 className="text-xl font-bold text-white">Solo Explorer</h3>
              <p className="text-center text-gray-400 mt-2">Interactive simulations and personal quizzes.</p>
            </button>
            <button
              onClick={() => setGameMode(GameMode.GROUP)}
              className="glass-panel p-8 rounded-2xl hover:bg-white/5 transition-all flex flex-col items-center border border-neon-pink/30 hover:border-neon-pink"
            >
              <Users size={64} className="text-neon-pink mb-4" />
              <h3 className="text-xl font-bold text-white">Group Mission</h3>
              <p className="text-center text-gray-400 mt-2">Roleplay activities and command center challenges.</p>
            </button>
          </div>
        </div>
      );
    }

    switch (activeActivityId) {
      case ActivityId.ORBIT_REVOLUTION:
        return <OrbitCommand mode={gameMode} />;
      case ActivityId.KAAMOS_MIDNIGHT:
        return <KaamosViewer mode={gameMode} />;
      case ActivityId.SHADOWS:
        return <ShadowLab mode={gameMode} />;
      case ActivityId.SEASONS:
        return (
          <div className="space-y-8 max-w-7xl mx-auto">
            <div className="glass-panel p-6 rounded-xl border-l-4 border-orange-500">
               <h2 className="text-2xl font-bold mb-2 flex items-center">Seasons & Axial Tilt</h2>
               <p className="text-gray-300">
                 Did you know Earth is actually closest to the Sun in January? Seasons are caused by the <span className="text-orange-400 font-bold">23.5° tilt</span> of Earth's axis, not distance!
               </p>
               {gameMode === GameMode.GROUP && (
                 <p className="mt-4 p-4 bg-orange-500/10 rounded-lg text-orange-200">
                   <Users className="inline mr-2" size={16}/>
                   <strong>Group Task:</strong> Stand up. One person is the Sun. The other is Earth. Tilt your body sideways. Walk around the Sun maintaining that tilt direction. Notice which shoulder points to the sun?
                 </p>
               )}
            </div>
            <QuizModule topic="Earth seasons axial tilt and solstices" />
          </div>
        );
      case ActivityId.SUNLIGHT_INTENSITY:
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
              onClick={handleBack} 
              className="mr-4 p-2 rounded-full hover:bg-white/10 transition-colors text-neon-blue"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <span className="font-bold text-xl tracking-widest text-white">ASTROFINN</span>
        </div>
        <div className="flex items-center space-x-4">
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