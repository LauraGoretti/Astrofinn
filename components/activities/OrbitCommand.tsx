import React, { useState } from 'react';
import { generateAstroCommands } from '../../services/geminiService';
import { AstroCommand, GameMode } from '../../types';
import { Play, Users, RefreshCw, Loader2, Info } from 'lucide-react';
import QuizModule from '../QuizModule';
import Earth3D from './Earth3D';

interface OrbitCommandProps {
  mode: GameMode;
}

const OrbitCommand: React.FC<OrbitCommandProps> = ({ mode }) => {
  const [commands, setCommands] = useState<AstroCommand[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchCommands = async () => {
    setLoading(true);
    const data = await generateAstroCommands("Earth's orbit, revolution, and seasons");
    setCommands(data);
    setCurrentIndex(0);
    setLoading(false);
  };

  // Initial load
  React.useEffect(() => {
    if (mode === GameMode.GROUP) {
      fetchCommands();
    }
  }, [mode]);

  if (mode === GameMode.SOLO) {
    return (
      <div className="flex flex-col lg:flex-row h-full w-full gap-6">
        {/* Main 3D View - Takes majority of screen */}
        <div className="flex-1 relative flex flex-col min-h-[50vh] lg:min-h-0">
           <div className="glass-panel p-1 rounded-xl border-l-4 border-neon-purple h-full flex flex-col">
             {/* Header inside the panel for context */}
             <div className="p-4 flex items-center justify-between shrink-0">
               <h2 className="text-xl font-bold flex items-center text-white">
                  <Info className="mr-3 text-neon-purple" />
                  Orbit & Revolution
               </h2>
               <div className="hidden md:block text-xs text-gray-400 font-mono">SIMULATION RUNNING</div>
             </div>
             
             {/* 3D Component with full height override */}
             <div className="flex-1 relative rounded-lg overflow-hidden bg-black/50">
                <Earth3D className="w-full h-full absolute inset-0" />
             </div>
             
             <div className="p-3 text-sm text-gray-400 text-center shrink-0">
               Observe the <strong className="text-neon-pink">Axial Tilt</strong> causing seasons and the <strong className="text-neon-blue">Rotation</strong> causing day/night.
             </div>
           </div>
        </div>

        {/* Sidebar for Quiz - Full height with flexible quiz box */}
        <div className="w-full lg:w-[400px] shrink-0 flex flex-col gap-4 h-full">
           <div className="bg-space-800/80 p-4 rounded-xl border border-white/10 shrink-0">
             <h3 className="text-lg font-bold text-neon-purple mb-2">Mission Briefing</h3>
             <p className="text-sm text-gray-300 leading-relaxed">
               Welcome to the command deck. Your task is to analyze the heliocentric model. 
               Pay close attention to how the angle of sunlight changes as Earth revolves around the Sun.
             </p>
           </div>
           {/* QuizModule takes remaining space */}
           <QuizModule topic="Earth's revolution around the sun and orbit" className="flex-1 min-h-0" />
        </div>
      </div>
    );
  }

  // GROUP MODE
  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-neon-pink/10 rounded-full mb-4">
          <Users className="text-neon-pink w-8 h-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-purple-500">
          ASTRO COMMAND CENTER
        </h1>
        <p className="text-gray-400 mt-2">Designate one Mission Commander. The others are Astros.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
           <Loader2 className="w-12 h-12 text-neon-pink animate-spin mb-4" />
           <p className="font-mono text-neon-pink animate-pulse">TRANSMITTING MISSION DATA...</p>
        </div>
      ) : commands.length > 0 ? (
        <div className="glass-panel p-8 rounded-2xl border-t border-neon-pink relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-pink to-transparent"></div>
          
          <div className="mb-8 text-center">
             <span className="text-xs font-mono text-gray-500 uppercase tracking-widest border border-gray-700 px-2 py-1 rounded">
               Mission {currentIndex + 1} / {commands.length}
             </span>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="bg-space-800 p-6 rounded-xl border border-white/5">
              <h3 className="text-neon-blue font-bold text-lg mb-2 uppercase tracking-wider">Role: {commands[currentIndex].role}</h3>
              <p className="text-2xl text-white font-medium leading-snug">"{commands[currentIndex].action}"</p>
            </div>

            <div className="bg-space-800 p-6 rounded-xl border border-white/5">
               <h3 className="text-neon-green font-bold text-lg mb-2 uppercase tracking-wider">Commander asks:</h3>
               <p className="text-xl text-white mb-4">{commands[currentIndex].question}</p>
               <div className="bg-black/30 p-4 rounded-lg">
                 <p className="text-xs text-gray-400 uppercase mb-1">Classified Answer:</p>
                 <p className="text-neon-green font-mono">{commands[currentIndex].answer}</p>
               </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center space-x-4">
            <button 
              onClick={fetchCommands}
              className="flex items-center px-6 py-3 rounded-full border border-gray-600 hover:border-white text-gray-300 hover:text-white transition-all"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              New Missions
            </button>
            <button 
              onClick={() => setCurrentIndex((prev) => (prev + 1) % commands.length)}
              className="flex items-center px-8 py-3 rounded-full bg-neon-pink hover:bg-neon-pink/80 text-white font-bold transition-all shadow-[0_0_20px_rgba(255,0,127,0.4)]"
            >
              Next Order
              <Play className="w-5 h-5 ml-2 fill-current" />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-red-400">Connection Failed. Try regenerating missions.</p>
          <button onClick={fetchCommands} className="mt-4 btn-primary">Retry</button>
        </div>
      )}
    </div>
  );
};

export default OrbitCommand;