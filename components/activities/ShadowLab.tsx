import React, { useState } from 'react';
import { GameMode } from '../../types';
import QuizModule from '../QuizModule';
import { Sun } from 'lucide-react';

interface ShadowLabProps {
  mode: GameMode;
}

const ShadowLab: React.FC<ShadowLabProps> = ({ mode }) => {
  const [sunHeight, setSunHeight] = useState(45); // Degrees

  // Calculate shadow length relative to object height (1 unit)
  // tan(angle) = height / shadow => shadow = height / tan(angle)
  // Avoid division by zero close to 0 degrees
  const angleRad = (sunHeight * Math.PI) / 180;
  let shadowLength = 100 / Math.tan(angleRad);
  
  if (sunHeight <= 5) shadowLength = 600; // Cap max length

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <div className="grid lg:grid-cols-2 gap-8 h-full">
        <div className="glass-panel p-8 rounded-2xl flex flex-col justify-between h-full min-h-[500px]">
          
          <div className="relative flex-grow bg-gradient-to-b from-blue-900/20 to-space-900 border-b-2 border-white/20 mb-8 overflow-hidden rounded-lg">
             {/* Sun visual */}
             <div 
               className="absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-yellow-300 rounded-full blur-md shadow-lg transition-all duration-300"
               style={{ 
                 bottom: `${(sunHeight / 90) * 80 + 10}%`,
                 opacity: sunHeight < 0 ? 0 : 1
               }}
             >
               <Sun className="w-full h-full text-orange-500 animate-spin-slow" />
             </div>

             {/* Stick Figure */}
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-24 bg-white z-10 rounded-t-md"></div>

             {/* Shadow */}
             <div 
               className="absolute bottom-0 left-1/2 w-2 bg-black/60 origin-bottom-left transform -skew-x-[80deg] blur-sm transition-all duration-300"
               style={{ 
                 height: '6px', // Thickness of shadow on floor
                 width: `${shadowLength}px`,
                 transformOrigin: '0% 50%',
               }}
             ></div>
             
             <div className="absolute bottom-2 left-2 text-xs font-mono text-gray-400">Ground Level</div>
          </div>

          <div className="space-y-4 shrink-0">
            <div className="flex justify-between items-center">
              <span className="font-bold text-neon-green">Sun Altitude: {sunHeight}°</span>
              <span className="font-mono text-xs text-gray-500">
                {sunHeight < 20 ? 'Morning/Evening' : sunHeight > 70 ? 'Noon (Summer)' : 'Daytime'}
              </span>
            </div>
            <input 
              type="range"
              min="5"
              max="90"
              value={sunHeight}
              onChange={(e) => setSunHeight(parseInt(e.target.value))}
              className="w-full h-3 bg-space-800 rounded-lg appearance-none cursor-pointer accent-neon-green"
            />
            <p className="text-sm text-gray-300 italic">
              "The lower the sun, the longer the shadow."
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto">
          <div className="p-6 bg-space-800 rounded-xl border border-white/10 shrink-0">
            <h3 className="text-xl font-bold text-white mb-2">Shadow Physics</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Shadows change length based on the angle of the light source. 
              In Finland, during winter, the sun never gets very high in the sky, meaning shadows are always long—even at noon!
              At the equator, the sun can be directly overhead (90°), causing almost no shadow.
            </p>
          </div>
          <div className="flex-1 min-h-[400px]">
             <QuizModule topic="Sun shadows and angle of incidence physics" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShadowLab;