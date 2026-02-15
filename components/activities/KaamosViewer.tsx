import React, { useState } from 'react';
import { GameMode } from '../../types';
import QuizModule from '../QuizModule';
import { Sun, Moon, MapPin } from 'lucide-react';

const locations = [
  { name: 'Helsinki', lat: 60, color: 'text-blue-400' },
  { name: 'Rovaniemi', lat: 66.5, color: 'text-purple-400' },
  { name: 'Utsjoki', lat: 70, color: 'text-pink-400' }
];

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

interface KaamosViewerProps {
  mode: GameMode;
}

const KaamosViewer: React.FC<KaamosViewerProps> = ({ mode }) => {
  const [selectedMonth, setSelectedMonth] = useState(5); // June
  const [selectedLoc, setSelectedLoc] = useState(locations[1]); // Rovaniemi

  // Simple approx sunlight hours calculation
  const getSunlightHours = (lat: number, monthIndex: number) => {
    // Very simplified logic for visual purposes
    // Summer solstice is month 5 (June), Winter is 11 (Dec)
    const normalizedMonth = Math.cos(((monthIndex - 5) / 12) * 2 * Math.PI); 
    // Effect increases with latitude
    const latEffect = (lat - 50) / 20; 
    let hours = 12 + (normalizedMonth * 12 * latEffect);
    
    // Clamp
    if (hours > 24) hours = 24;
    if (hours < 0) hours = 0;
    return hours;
  };

  const hours = getSunlightHours(selectedLoc.lat, selectedMonth);
  const isKaamos = hours === 0;
  const isMidnightSun = hours === 24;

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <div className="grid lg:grid-cols-2 gap-8 h-full">
        
        {/* Interactive Viewer */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col h-full min-h-[500px]">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <MapPin className="mr-2 text-neon-blue" />
              Nordic Sun Tracker
            </h2>
            <div className="flex space-x-2">
              {locations.map(loc => (
                <button
                  key={loc.name}
                  onClick={() => setSelectedLoc(loc)}
                  className={`px-3 py-1 text-xs font-mono border rounded ${selectedLoc.name === loc.name ? 'bg-neon-blue text-black border-neon-blue' : 'text-gray-400 border-gray-700'}`}
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex-1 bg-space-800 rounded-xl overflow-hidden mb-6 flex items-end justify-center border-b border-white/20">
             {/* Sky Gradient */}
             <div className={`absolute inset-0 transition-colors duration-1000 ${
               isKaamos ? 'bg-gradient-to-b from-black to-slate-900' :
               isMidnightSun ? 'bg-gradient-to-b from-blue-400 to-yellow-200' :
               'bg-gradient-to-b from-space-900 to-blue-900'
             }`}></div>
             
             {/* Sun Element */}
             <div 
               className="absolute w-16 h-16 bg-yellow-400 rounded-full blur-xl transition-all duration-700"
               style={{ 
                 bottom: `${(hours / 24) * 80}%`,
                 opacity: hours === 0 ? 0 : 1,
                 boxShadow: '0 0 40px rgba(255,200,0,0.6)'
               }}
             ></div>

             {/* Landscape Silhouette */}
             <div className="absolute bottom-0 w-full h-16 bg-black z-10" style={{ clipPath: 'polygon(0% 100%, 0% 40%, 20% 60%, 40% 30%, 60% 50%, 80% 20%, 100% 60%, 100% 100%)' }}></div>

             {/* Status Text */}
             <div className="absolute top-4 w-full text-center z-20">
               {isKaamos && <span className="text-3xl font-bold text-blue-200 tracking-widest animate-pulse">KAAMOS (Polar Night)</span>}
               {isMidnightSun && <span className="text-3xl font-bold text-yellow-100 tracking-widest animate-pulse">MIDNIGHT SUN</span>}
             </div>
          </div>

          {/* Controls */}
          <div className="space-y-4 shrink-0">
             <div className="flex justify-between text-xs text-gray-500 font-mono uppercase">
               <span>Jan</span>
               <span>Dec</span>
             </div>
             <input 
               type="range" 
               min="0" 
               max="11" 
               step="1"
               value={selectedMonth}
               onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
               className="w-full h-2 bg-space-700 rounded-lg appearance-none cursor-pointer accent-neon-blue"
             />
             <div className="flex justify-between items-center bg-black/30 p-4 rounded-lg">
                <div>
                  <p className="text-gray-400 text-sm">Selected Month</p>
                  <p className="text-xl font-bold text-white">{months[selectedMonth]}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">Day Length</p>
                  <p className={`text-xl font-bold font-mono ${hours > 20 ? 'text-yellow-400' : hours < 4 ? 'text-blue-400' : 'text-white'}`}>
                    {hours.toFixed(1)} hrs
                  </p>
                </div>
             </div>
          </div>
        </div>

        {/* Content & Quiz */}
        <div className="flex flex-col gap-6 overflow-y-auto">
           <div className="bg-space-800/50 p-6 rounded-xl border-l-4 border-neon-blue">
             <h3 className="text-lg font-bold text-neon-blue mb-2">Did you know?</h3>
             <p className="text-gray-300 leading-relaxed">
               In Utsjoki, the northernmost municipality of Finland, the sun does not rise at all for nearly two months during winter. 
               This is called <span className="text-white font-bold">Kaamos</span>. Conversely, in summer, the sun doesn't set for two months!
             </p>
           </div>
           
           <div className="flex-1 min-h-[400px]">
             <QuizModule topic={`The phenomenon of ${isKaamos ? 'Kaamos and polar night' : 'Midnight Sun'} in Finland`} />
           </div>
        </div>

      </div>
    </div>
  );
};

export default KaamosViewer;