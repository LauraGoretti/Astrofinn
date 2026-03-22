const fs = require('fs');
const path = process.cwd() + '/components/activities/TiltOrbitExplorer.tsx';
const content = fs.readFileSync(path, 'utf-8');
const index = content.indexOf('// --- MAIN COMPONENT ---');
const top = content.substring(0, index);
const bottom = `// --- MAIN COMPONENT ---

import { GameMode } from '../../types';

interface TiltOrbitExplorerProps {
  mode: GameMode;
  onNavigateToSolarSystem?: () => void;
  setStage: (stage: string) => void;
  setBackIntercept?: (intercept: { handler: () => boolean } | null) => void;
}

const TiltOrbitExplorer: React.FC<TiltOrbitExplorerProps> = ({ mode, onNavigateToSolarSystem, setStage, setBackIntercept }) => {
  const [orbitDate, setOrbitDate] = React.useState('2026-06-21');
  const [poleRotation, setPoleRotation] = React.useState(0); // -PI/2 to PI/2

  React.useEffect(() => {
    setStage('Orbit Simulator');
  }, [setStage]);

  React.useEffect(() => {
    if (setBackIntercept) {
      setBackIntercept(null);
    }
  }, [setBackIntercept]);

  // Finland Data
  const getFinlandData = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Approximate data for Finland (Oulu/Helsinki average)
    if ((month === 6 && day >= 20) || month === 7 || month === 8 || (month === 9 && day < 20)) {
      return {
        season: "Summer",
        daylight: "19h - 24h",
        temp: "15°C to 25°C",
        nature: "Green trees, flowers, bright days",
        dist: "152 million km (Aphelion)"
      };
    } else if ((month === 12 && day >= 20) || month === 1 || month === 2 || (month === 3 && day < 20)) {
      return {
        season: "Winter",
        daylight: "0h - 6h",
        temp: "-5°C to -20°C",
        nature: "Snowy, dark, Kaamos (Polar Night)",
        dist: "147 million km (Perihelion)"
      };
    } else if ((month === 3 && day >= 20) || month === 4 || month === 5 || (month === 6 && day < 20)) {
      return {
        season: "Spring",
        daylight: "12h - 18h",
        temp: "0°C to 10°C",
        nature: "Snow melting, flowers coming soon",
        dist: "149 million km"
      };
    } else {
      return {
        season: "Autumn",
        daylight: "12h - 8h",
        temp: "5°C to 12°C",
        nature: "Leaves falling, colorful nature",
        dist: "150 million km"
      };
    }
  };

  const finlandData = React.useMemo(() => getFinlandData(orbitDate), [orbitDate]);

  const renderGuruBubble = (text: string) => (
    <div className="flex items-start space-x-4 bg-space-800/90 p-4 rounded-2xl border border-neon-blue/30 animate-fade-in">
      <img 
        src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
        alt="Astronaut" 
        className="w-12 h-12 shrink-0"
        referrerPolicy="no-referrer"
      />
      <p className="text-gray-200 italic leading-relaxed">{text}</p>
    </div>
  );

  return (
    <div className="h-full w-full flex flex-col p-4 md:p-8 overflow-y-auto">
      <div className="flex flex-col h-full space-y-4">
        <div className="grid lg:grid-cols-3 gap-4 flex-1">
          {/* Left Column: 3D Views */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Top View: Orbit Simulator */}
            <div className="relative bg-black/40 rounded-2xl overflow-hidden border border-white/5 h-1/2 min-h-[250px]">
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <div className="bg-black/60 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-neon-blue border border-neon-blue/30 flex items-center w-fit">
                  <Globe className="mr-2" size={12} /> Heliocentric Top View
                </div>
                <div className="bg-black/60 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#39FF14] border border-[#39FF14]/30 flex items-center w-fit">
                  The green pinpoint is Finland.
                </div>
              </div>
              
              <Canvas>
                <StarBackground />
                <PerspectiveCamera makeDefault position={[0, 100, 0]} fov={45} />
                <Sun position={[0, 0, 0]} />
                <OrbitControls makeDefault enableRotate={false} enablePan={true} />
                
                {(() => {
                  const ORBIT_A = 35;
                  const ORBIT_B = 30;
                  const ORBIT_OFFSET = 10;
                  
                  const curve = new THREE.EllipseCurve(-ORBIT_OFFSET, 0, ORBIT_A, ORBIT_B, 0, 2 * Math.PI, false, 0);
                  const points = curve.getPoints(128);
                  const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p.x, 0, p.y)));

                  const date = new Date(orbitDate);
                  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
                  const angle = -((dayOfYear - 80) / 365) * 2 * Math.PI;
                  
                  const x = -ORBIT_OFFSET + ORBIT_A * Math.cos(angle);
                  const z = ORBIT_B * Math.sin(angle);

                  return (
                    <>
                      <lineLoop geometry={geometry}>
                        <lineBasicMaterial color="#ffffff" opacity={0.1} transparent />
                      </lineLoop>
                      <Earth position={[x, 0, z]} rotationActive={true} tiltActive={true} revolutionActive={true} showFinland={true} sunPos={[0, 0, 0]} />
                    </>
                  );
                })()}
              </Canvas>
            </div>

            {/* Bottom View: Earth Close-up */}
            <div className="relative bg-black/40 rounded-2xl overflow-hidden border border-white/5 h-1/2 min-h-[250px]">
              <div className="absolute top-4 left-4 z-10">
                <div className="bg-black/60 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-neon-pink border border-neon-pink/30 flex items-center w-fit">
                  Earth View (Sunlight Incidence)
                </div>
              </div>

              {/* Horizontal Pole Control */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 w-full max-w-xs">
                <span className="text-[10px] font-bold text-white/50 uppercase mb-1">Move here to see the poles</span>
                <div className="flex items-center bg-white/5 rounded-full p-4 border border-white/10 w-full justify-between scale-75 origin-bottom">
                  <span className="text-[8px] font-bold text-neon-pink">SOUTH</span>
                  <input 
                    type="range" 
                    min={-Math.PI/2} 
                    max={Math.PI/2} 
                    step={0.01}
                    value={poleRotation}
                    onChange={(e) => setPoleRotation(parseFloat(e.target.value))}
                    className="flex-1 mx-4 h-1 appearance-none bg-white/10 rounded-full cursor-pointer accent-neon-blue"
                  />
                  <span className="text-[8px] font-bold text-neon-blue">NORTH</span>
                </div>
              </div>

              <Canvas>
                <StarBackground />
                <PerspectiveCamera makeDefault position={[0, 5, 60]} fov={45} />
                <ambientLight intensity={0.1} />
                {(() => {
                  const date = new Date(orbitDate);
                  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
                  const angle = -((dayOfYear - 80) / 365) * 2 * Math.PI;
                  
                  const ORBIT_A = 35;
                  const ORBIT_OFFSET = 10;
                  const x = -ORBIT_OFFSET + ORBIT_A * Math.cos(angle);
                  const z = 30 * Math.sin(angle); // ORBIT_B
                  
                  const sunRelPos = new THREE.Vector3(-x, 0, -z).normalize().multiplyScalar(100);

                  return (
                    <>
                      <Sun position={[sunRelPos.x, sunRelPos.y, sunRelPos.z]} />
                      <Earth position={[0, 0, 0]} rotationActive={true} tiltActive={true} revolutionActive={false} showFinland={true} poleRotation={poleRotation} sunPos={[sunRelPos.x, sunRelPos.y, sunRelPos.z]} />
                    </>
                  );
                })()}
                <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} minAzimuthAngle={0} maxAzimuthAngle={0} target={[0, 0, 0]} />
              </Canvas>
            </div>
          </div>

          {/* Right Column: UI Controls */}
          <div className="space-y-4 overflow-y-auto pr-2">
            {/* Select Date Box */}
            <div className="glass-panel p-4 rounded-xl border-l-4 border-neon-purple">
              <h3 className="font-bold text-neon-purple text-sm mb-3 uppercase tracking-wider">Select Date</h3>
              <input 
                type="date" 
                value={orbitDate}
                onChange={(e) => {
                  setOrbitDate(e.target.value);
                }}
                className="w-full bg-space-900 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-neon-blue outline-none"
              />
            </div>

            {/* Data Display Box */}
            <div className="glass-panel p-4 rounded-xl border-l-4 border-neon-pink">
              <h3 className="font-bold text-neon-pink text-sm mb-3 uppercase tracking-wider">Finland Data</h3>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400">Season:</span>
                  <span className="text-white font-bold text-neon-pink">{finlandData.season}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400">Daylight:</span>
                  <span className="text-white font-mono">{finlandData.daylight}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400">Avg Temp:</span>
                  <span className="text-white font-mono">{finlandData.temp}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400">Nature:</span>
                  <span className="text-white text-right">{finlandData.nature}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Dist. to Sun:</span>
                  <span className="text-white font-mono">{finlandData.dist}</span>
                </div>
              </div>
            </div>

            {/* Astronaut Message Box */}
            {renderGuruBubble("Once you're done here, you can explore the full Solar System from the dashboard.")}

            {/* Navigation */}
            <div className="pt-2">
              <button 
                onClick={() => window.location.reload()} 
                className="w-full py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all mb-3"
              >
                Back to Dashboard
              </button>
              {onNavigateToSolarSystem && (
                <button 
                  onClick={onNavigateToSolarSystem}
                  className="w-full py-3 bg-neon-blue text-white font-bold rounded-xl hover:bg-neon-blue/80 transition-all shadow-[0_0_20px_rgba(0,255,255,0.3)] flex items-center justify-center"
                >
                  <Globe className="mr-2" size={20} /> Go to Solar System View
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TiltOrbitExplorer;
`;
fs.writeFileSync(path, top + bottom);
console.log("Updated successfully");
