import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { GameMode } from '../../types';
import QuizModule from '../QuizModule';
import { Sun, Moon, MapPin, Clock, Calendar } from 'lucide-react';
import KaamosEarth from './KaamosEarth';

const locations = [
  { name: 'Helsinki', lat: 60.17, color: 'text-blue-400' },
  { name: 'Rovaniemi', lat: 66.50, color: 'text-purple-400' },
  { name: 'Utsjoki', lat: 69.91, color: 'text-pink-400' }
];

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

interface KaamosViewerProps {
  mode: GameMode;
}

const KaamosViewer: React.FC<KaamosViewerProps> = ({ mode }) => {
  const [dayOfYear, setDayOfYear] = useState(172); // June 21 (Summer Solstice)
  const [selectedHour, setSelectedHour] = useState(12); // Noon
  const [selectedLoc, setSelectedLoc] = useState(locations[1]); // Rovaniemi

  // Helper to format Day of Year to "Month Day"
  const getFormattedDate = (day: number) => {
    const date = new Date(2024, 0); // Leap year 2024 for consistent dates
    date.setDate(day);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  // Simple approx sunlight hours calculation
  const getSunlightHours = (lat: number, day: number) => {
    // Very simplified logic for visual purposes
    // Summer solstice is day ~172 (June 21), Winter is ~355 (Dec 21)
    // Cosine wave peaks at 1 on day 172
    const normalizedSeason = Math.cos(((day - 172) / 365) * 2 * Math.PI); 
    // Effect increases with latitude
    const latEffect = (lat - 50) / 20; 
    let hours = 12 + (normalizedSeason * 12 * latEffect);
    
    // Clamp
    if (hours > 24) hours = 24;
    if (hours < 0) hours = 0;
    return hours;
  };

  const hours = getSunlightHours(selectedLoc.lat, dayOfYear);
  const isKaamos = hours === 0;
  const isMidnightSun = hours === 24;

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <div className="grid lg:grid-cols-2 gap-8 h-full">
        
        {/* Interactive Viewer */}
        <div className="glass-panel flex flex-col h-full min-h-[600px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <MapPin className="mr-2 text-neon-blue" />
              Nordic Sun Tracker
            </h2>
            <div className="flex space-x-2">
              {locations.map(loc => (
                <button
                  key={loc.name}
                  onClick={() => setSelectedLoc(loc)}
                  className={`px-3 py-1 text-xs font-mono border rounded transition-colors ${selectedLoc.name === loc.name ? 'bg-neon-blue text-black border-neon-blue' : 'text-gray-400 border-gray-700 hover:border-gray-500'}`}
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex-1 bg-black rounded-xl overflow-hidden mb-6 border border-white/20 shadow-inner shadow-black/50">
             <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                <Suspense fallback={null}>
                  <color attach="background" args={['#050505']} />
                  <KaamosEarth 
                    dayOfYear={dayOfYear} 
                    hour={selectedHour} 
                  />
                  <OrbitControls 
                    enablePan={false} 
                    minDistance={3} 
                    maxDistance={10}
                    autoRotate={false}
                  />
                </Suspense>
             </Canvas>
             
             {/* Overlay Info */}
             <div className="absolute top-4 left-4 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md p-3 rounded-lg border border-white/10">
                  <div className="text-xs text-gray-400 uppercase mb-1">Status</div>
                  {isKaamos ? (
                    <span className="text-blue-300 font-bold animate-pulse flex items-center gap-2">
                      <Moon size={16} /> KAAMOS (Polar Night)
                    </span>
                  ) : isMidnightSun ? (
                    <span className="text-yellow-300 font-bold animate-pulse flex items-center gap-2">
                      <Sun size={16} /> MIDNIGHT SUN
                    </span>
                  ) : (
                    <span className="text-white font-bold flex items-center gap-2">
                      <Sun size={16} className="text-orange-400" /> Normal Day/Night
                    </span>
                  )}
                </div>
             </div>
          </div>

          {/* Controls */}
          <div className="space-y-6 shrink-0 bg-space-800/50 p-4 rounded-xl border border-white/5">
             
             {/* Date Slider */}
             <div className="space-y-2">
               <div className="flex justify-between items-center">
                 <label className="text-sm text-gray-400 flex items-center gap-2">
                   <Calendar size={14} /> Date
                 </label>
                 <span className="text-neon-blue font-mono font-bold">{getFormattedDate(dayOfYear)}</span>
               </div>
               <input 
                 type="range" 
                 min="1" 
                 max="365" 
                 step="1"
                 value={dayOfYear}
                 onChange={(e) => setDayOfYear(parseInt(e.target.value))}
                 className="w-full h-2 bg-space-700 rounded-lg appearance-none cursor-pointer accent-neon-blue"
               />
               <div className="flex justify-between text-[10px] text-gray-600 font-mono uppercase px-1">
                 <span>Jan</span>
                 <span>Mar</span>
                 <span>Jun</span>
                 <span>Sep</span>
                 <span>Dec</span>
               </div>
             </div>

             {/* Time Slider */}
             <div className="space-y-2">
               <div className="flex justify-between items-center">
                 <label className="text-sm text-gray-400 flex items-center gap-2">
                   <Clock size={14} /> Time of Day
                 </label>
                 <span className="text-neon-pink font-mono font-bold">{selectedHour}:00</span>
               </div>
               <input 
                 type="range" 
                 min="0" 
                 max="23" 
                 step="1"
                 value={selectedHour}
                 onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                 className="w-full h-2 bg-space-700 rounded-lg appearance-none cursor-pointer accent-neon-pink"
               />
               <div className="flex justify-between text-[10px] text-gray-600 font-mono uppercase px-1">
                 <span>00:00</span>
                 <span>12:00</span>
                 <span>23:00</span>
               </div>
             </div>

             {/* Stats */}
             <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Day Length</p>
                  <p className={`text-2xl font-bold font-mono ${hours > 20 ? 'text-yellow-400' : hours < 4 ? 'text-blue-400' : 'text-white'}`}>
                    {hours.toFixed(1)} hrs
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Sun Elevation (Noon)</p>
                  <p className="text-xl font-bold text-white font-mono">
                    {/* Approx max elevation at noon */}
                    {Math.max(0, 90 - Math.abs(selectedLoc.lat - (23.5 * Math.cos(((dayOfYear - 172) / 365) * 2 * Math.PI)))).toFixed(1)}°
                  </p>
                </div>
             </div>
          </div>
        </div>

        {/* Content & Quiz */}
        <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
           <div className="glass-panel border-l-4 border-l-neon-blue">
             <h3 className="text-2xl font-bold text-neon-blue mb-3 flex items-center gap-2">
               <MapPin size={18} />
               Location Analysis: {selectedLoc.name}
             </h3>
             <p className="text-gray-300 text-base leading-relaxed mb-4">
               {selectedLoc.lat > 66.5 ? (
                 <>
                   Located at <span className="text-white font-mono">{selectedLoc.lat}°N</span>, this location is 
                   <span className="text-neon-pink font-bold"> above the Arctic Circle</span>. 
                   This means it experiences true Polar Night (Kaamos) in winter and Midnight Sun in summer.
                 </>
               ) : (
                 <>
                   Located at <span className="text-white font-mono">{selectedLoc.lat}°N</span>, this location is 
                   <span className="text-blue-300 font-bold"> below the Arctic Circle</span>. 
                   While days are extremely short in winter and long in summer, the sun does technically rise and set every day.
                 </>
               )}
             </p>
             
             <div className="bg-black/30 p-4 rounded-lg text-base leading-relaxed text-gray-400">
               <strong className="text-white block mb-1">Why does this happen?</strong>
               Earth's axis is tilted 23.5°. In June, the North Pole tilts towards the Sun, keeping the Arctic in constant daylight. In December, it tilts away, leaving the Arctic in shadow.
             </div>
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