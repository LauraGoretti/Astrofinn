import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ruler, ArrowRight, ArrowLeft, ZoomIn, Globe, Sun, Rocket, Plane, Car, Footprints, Info } from 'lucide-react';
import { GameMode } from '../../types';

interface SizesDistancesProps {
  mode: GameMode | null;
  setStage: (stage: string) => void;
  onHome: () => void;
  setBackIntercept?: (intercept: { handler: () => boolean } | null) => void;
}

enum Step {
  INTRO,
  ZOOMER,
  COMPARE,
  TRAVEL
}

const TEXTURE_BASE_URL = 'https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/texture/';

const PLANET_DATA = {
  Moon: { size: 0.27, color: '#A0A0A0', texture: 'moon.jpg', description: "The Moon is much smaller than Earth." },
  Mercury: { size: 0.38, color: '#8C8C8C', texture: 'mercury.jpg', description: "Mercury is the smallest planet in our solar system." },
  Venus: { size: 0.95, color: '#E3BB76', texture: 'venus_atmosphere.jpg', description: "Venus is almost the same size as Earth!" },
  Earth: { size: 1, color: '#2B65EC', texture: 'earth_day.jpg', description: "Our home planet." },
  Mars: { size: 0.53, color: '#E27B58', texture: 'mars.jpg', description: "Mars is about half the size of Earth." },
  Jupiter: { size: 11.2, color: '#D39C7E', texture: 'jupiter.jpg', description: "Jupiter is huge compared to Earth. About 11 Earths could fit across its diameter!" },
  Saturn: { size: 9.45, color: '#C5AB6E', texture: 'saturn.jpg', description: "Saturn is the second largest planet, famous for its rings." },
  Uranus: { size: 4.0, color: '#B5E3E3', texture: 'uranus.jpg', description: "Uranus is an ice giant, about 4 times wider than Earth." },
  Neptune: { size: 3.88, color: '#4B70DD', texture: 'neptune.jpg', description: "Neptune is very similar in size to Uranus." },
  Sun: { size: 109, color: '#FDB813', texture: 'sun.jpg', description: "The Sun is so large that Earth looks like a tiny dot. Over 1 million Earths could fit inside it!" }
};

const JOURNEYS = [
  { id: 'earth-moon', label: 'Earth → Moon', distance: 384400 },
  { id: 'earth-sun', label: 'Earth → Sun', distance: 149600000 },
  { id: 'earth-mars', label: 'Earth → Mars', distance: 225000000 },
  { id: 'sun-neptune', label: 'Sun → Neptune', distance: 4500000000 }
];

const SPEEDS = [
  { id: 'light', label: 'Light speed', speed: 1080000000, icon: Rocket, unit: 'km/h' },
  { id: 'plane', label: 'Commuter plane', speed: 900, icon: Plane, unit: 'km/h' },
  { id: 'car', label: 'Car', speed: 100, icon: Car, unit: 'km/h' },
  { id: 'walking', label: 'Walking', speed: 5, icon: Footprints, unit: 'km/h' }
];

const SizesDistances: React.FC<SizesDistancesProps> = ({ mode, setStage, onHome, setBackIntercept }) => {
  const [step, setStep] = useState<Step>(Step.INTRO);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [compareTarget, setCompareTarget] = useState<string | null>(null);
  const [selectedJourney, setSelectedJourney] = useState(JOURNEYS[0]);
  const [selectedSpeed, setSelectedSpeed] = useState(SPEEDS[0]);

  React.useEffect(() => {
    if (setBackIntercept) {
      setBackIntercept({
        handler: () => {
          if (step === Step.TRAVEL) {
            setStep(Step.COMPARE);
            setStage("Step 2: Compare to Earth");
            return true;
          }
          if (step === Step.COMPARE) {
            setStep(Step.ZOOMER);
            setStage("Step 1: Scale Zoomer");
            return true;
          }
          if (step === Step.ZOOMER) {
            setStep(Step.INTRO);
            setStage("Real Sizes and Distances");
            return true;
          }
          return false;
        }
      });
    }
    return () => {
      if (setBackIntercept) setBackIntercept(null);
    };
  }, [step, setBackIntercept, setStage]);

  const formatTime = (hours: number) => {
    if (hours < 1 / 60) return `${(hours * 3600).toFixed(1)} seconds`;
    if (hours < 1) return `${(hours * 60).toFixed(1)} minutes`;
    if (hours < 24) return `${hours.toFixed(1)} hours`;
    if (hours < 24 * 30) return `${(hours / 24).toFixed(1)} days`;
    if (hours < 24 * 365) return `${(hours / (24 * 30.44)).toFixed(1)} months`;
    return `${(hours / (24 * 365)).toFixed(1)} years`;
  };

  const travelTime = useMemo(() => {
    const hours = selectedJourney.distance / selectedSpeed.speed;
    return formatTime(hours);
  }, [selectedJourney, selectedSpeed]);

  const renderAstronautBubble = (text: string) => (
    <div className="astronaut-box animate-fade-in w-full max-w-7xl mx-auto mb-6">
      <img 
        src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
        alt="Astronaut" 
        className="w-16 h-16 shrink-0 drop-shadow-[0_0_12px_rgba(0,255,255,0.5)]"
        referrerPolicy="no-referrer"
      />
      <div className="flex-1">
        <p className="text-gray-200 text-base leading-relaxed italic whitespace-pre-line">{text}</p>
      </div>
    </div>
  );

  const renderIntro = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-8 flex flex-col items-center"
    >
      <div className="w-full max-w-7xl space-y-6">
        <h2 className="text-2xl font-bold text-white tracking-tighter text-center">Real Sizes and Distances</h2>
        {renderAstronautBubble("Welcome to the Real Sizes and Distances tile!\nIn class, you’ve already talked about how far the Moon is from the Earth and tried to imagine where the Sun would be at that same scale.\nNow, this digital explorer will help you:\n\nZoom through different size scales\nCompare everything to Earth\nSee how long it would take to travel in space at different speeds\n\nReady to play with huge and tiny numbers at the same time?")}
      </div>
      <button 
        onClick={() => {
          setStep(Step.ZOOMER);
          setStage("Step 1: Scale Zoomer");
        }}
        className="btn-primary px-8 py-3 text-xl font-bold"
      >
        Start Digital Explorer <ArrowRight className="ml-3" size={20} />
      </button>
    </motion.div>
  );

  const renderZoomer = () => {
    const getLevelInfo = () => {
      if (zoomLevel === 1) return {
        label: "Scale level: Earth & Moon",
        text: "Here you see Earth and the Moon to scale in size.\n\nNotice:\n• The Moon is much smaller than Earth.\n• You can imagine the real distance between them from your hands-on classroom model.\n• Try to imagine: if these circles were your balls in class, where would the Sun be?",
        planets: ['Earth', 'Moon']
      };
      if (zoomLevel === 2) return {
        label: "Scale level: Inner planets",
        text: "Now you see Mercury, Venus, Earth, and Mars side by side. All are drawn to the same size scale.\n\nLook at:\n• Which planet is smallest?\n• Which one is closest in size to Earth?\n• Where does Mars sit in this group?",
        planets: ['Mercury', 'Venus', 'Earth', 'Mars']
      };
      if (zoomLevel === 3) return {
        label: "Scale level: Gas giants added",
        text: "Now we add the gas giants: Jupiter and Saturn.\nEarth and the inner planets are still here, but look how small they seem now!\n\nThink:\n• How many Earths might fit across Jupiter’s diameter?\n• Do the inner planets feel more like ‘big rocks’ compared to these giants?",
        planets: ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn']
      };
      return {
        label: "Scale level: Sun vs all planets",
        text: "Now the Sun joins the scene.\nAll the planets, even Jupiter and Saturn, start to look tiny compared to the Sun.\n\nNotice:\n• Earth is now almost just a dot.\n• The Sun is so huge that it dominates the whole picture.",
        planets: ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Sun']
      };
    };

    const info = getLevelInfo();

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full space-y-6"
      >
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-white">Step 1 – Scale Zoomer: From Moon to Sun</h2>
          <p className="text-gray-400 text-base max-w-4xl mx-auto leading-relaxed">
            In this step, you will use a zoom control to travel through different size scales.<br />
            You will start with Earth and the Moon, then zoom out to see inner planets, gas giants, and finally the Sun.<br />
            Watch carefully how Earth’s size changes compared to everything else.
          </p>
        </div>

        <div className="glass-panel min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden bg-space-950/50">
          <div className="flex items-end justify-center gap-6 mb-16 flex-wrap">
            {info.planets.map(p => {
              const data = PLANET_DATA[p as keyof typeof PLANET_DATA];
              // Scale for visualization
              let visualSize = data.size * 30;
              if (zoomLevel === 3) visualSize = data.size * 8;
              if (zoomLevel === 4) visualSize = data.size * 2.5;
              
              return (
                <div key={p} className="flex flex-col items-center gap-3">
                  <motion.div 
                    layout
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{ 
                      width: visualSize, 
                      height: visualSize, 
                      backgroundImage: `url(${TEXTURE_BASE_URL}${data.texture})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: '50%',
                      boxShadow: `0 0 40px ${data.color}40, inset 0 0 20px rgba(0,0,0,0.4)`,
                      border: '1px solid rgba(255,255,255,0.15)'
                    }}
                  />
                  <span className="text-[12px] text-gray-400 uppercase font-bold tracking-wider">{p}</span>
                </div>
              );
            })}
          </div>

          <div className="w-full max-w-7xl space-y-6">
            <div className="flex justify-between text-sm font-bold text-neon-blue uppercase tracking-widest">
              <span>{info.label}</span>
              <div className="flex items-center gap-2">
                <ZoomIn size={18} />
                <span>Zoom Level: {zoomLevel}</span>
              </div>
            </div>
            <input 
              type="range" 
              min="1" 
              max="4" 
              step="1" 
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseInt(e.target.value))}
              className="w-full h-3 bg-space-800 rounded-xl appearance-none cursor-pointer accent-neon-blue"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
              <span>Moon & Earth</span>
              <span>Inner Planets</span>
              <span>Gas Giants</span>
              <span>Sun vs All</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button 
            onClick={() => {
              setStep(Step.COMPARE);
              setStage("Step 2: Compare to Earth");
            }}
            className="btn-primary px-8 py-3 text-xl font-bold"
          >
            Go to Step 2 – Compare to Earth <ArrowRight className="ml-3" size={20} />
          </button>
        </div>
      </motion.div>
    );
  };

  const renderCompare = () => {
    const targetData = compareTarget ? PLANET_DATA[compareTarget as keyof typeof PLANET_DATA] : null;

    // Calculate dynamic scaling to fit both Earth and target on screen
    // Earth is the reference (size 1)
    // We want the total width to be manageable.
    // Let's say we have a container of 800px effective width for the planets.
    const getScaleFactor = () => {
      if (!targetData) return 60;
      const targetSize = targetData.size;
      
      // If target is larger than Earth (size > 1), we scale down Earth to fit both side-by-side
      if (targetSize > 1) {
        // We want the total visual width (Earth + Target) to be around 500px
        const maxTotalWidth = 500;
        const scale = maxTotalWidth / (1 + targetSize);
        // Cap the individual Earth size at 120px
        return Math.min(120, scale);
      }
      
      // For smaller objects (Moon, Mercury, Mars), keep Earth at 120px
      return 120;
    };

    const scaleFactor = getScaleFactor();

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full space-y-6 flex flex-col items-center"
      >
        <div className="text-center w-full">
          <h2 className="text-2xl font-bold text-white mb-3">Step 2 – Compare Everything to Earth</h2>
          <p className="text-gray-400 text-base max-w-4xl mx-auto leading-relaxed">
            In this step, Earth becomes your reference size. Choose any other object and see it side by side with Earth at the same scale.
          </p>
        </div>

        <div className="w-full glass-panel p-0 flex relative overflow-hidden bg-space-950/50">
          {/* Vertical Selection Sidebar */}
          <div className="w-40 shrink-0 border-r border-white/10 p-4 flex flex-col gap-2 z-10 bg-black/20">
            <h3 className="text-2xl font-bold text-gray-500 uppercase tracking-widest mb-2">Select Object</h3>
            <div className="flex flex-col gap-1.5 overflow-y-auto pr-1 scrollbar-hide">
              {Object.keys(PLANET_DATA).filter(p => p !== 'Earth').map(p => (
                <button
                  key={p}
                  onClick={() => setCompareTarget(p)}
                  className={`px-3 py-2 rounded-xl border text-[11px] font-bold transition-all text-left ${
                    compareTarget === p 
                      ? 'bg-neon-blue/20 border-neon-blue text-white shadow-[0_0_15px_rgba(0,255,255,0.2)]' 
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Main Display Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            {!compareTarget ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-neon-blue/10 rounded-full flex items-center justify-center mx-auto border border-neon-blue/20">
                  <Info className="w-8 h-8 text-neon-blue opacity-70" />
                </div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-2xl">Choose an object to compare with Earth.</p>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center gap-12">
                <div className="flex items-center justify-center gap-8 md:gap-16 w-full flex-wrap">
                  <div className="flex flex-col items-center gap-4">
                    <div 
                      style={{ 
                        width: scaleFactor, 
                        height: scaleFactor, 
                        backgroundImage: `url(${TEXTURE_BASE_URL}${PLANET_DATA.Earth.texture})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '50%',
                        boxShadow: `0 0 40px ${PLANET_DATA.Earth.color}40, inset 0 0 20px rgba(0,0,0,0.4)`,
                        border: '1px solid rgba(255,255,255,0.2)'
                      }} 
                    />
                    <span className="text-xs font-bold text-white uppercase tracking-widest">Earth</span>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <motion.div 
                      key={compareTarget}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5 }}
                      style={{ 
                        width: scaleFactor * targetData!.size, 
                        height: scaleFactor * targetData!.size, 
                        backgroundImage: `url(${TEXTURE_BASE_URL}${targetData!.texture})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '50%',
                        boxShadow: `0 0 60px ${targetData!.color}40, inset 0 0 30px rgba(0,0,0,0.5)`,
                        border: '1px solid rgba(255,255,255,0.2)'
                      }} 
                    />
                    <span className="text-xs font-bold text-white uppercase tracking-widest">{compareTarget}</span>
                  </div>
                </div>
                
                <div className="max-w-4xl text-center space-y-3 bg-white/5 p-5 rounded-2xl border border-white/10">
                  <p className="text-gray-100 text-base leading-relaxed font-medium">
                    Earth and {compareTarget} at the same scale.
                  </p>
                  <p className="text-neon-blue text-base italic leading-relaxed">
                    {targetData!.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {compareTarget && (
          <div className="w-full">
            {renderAstronautBubble(`Watch carefully:

Does this match what you imagined?

${
              compareTarget === 'Moon' 
                ? "In your hands-on activity, did the smaller ball feel this small compared to the bigger ball?" 
                : compareTarget === 'Sun'
                ? "If Earth is this small next to the Sun, what does that tell you about our place in the solar system?"
                : "Does it feel surprising that Earth is so small next to these giants?"
            }`)}
          </div>
        )}

        <button 
          onClick={() => {
            setStep(Step.TRAVEL);
            setStage("Step 3: Travel Time");
          }}
          className="btn-primary px-8 py-3 text-xl font-bold"
        >
          Go to Step 3 – Travel Time <ArrowRight className="ml-3" size={20} />
        </button>
      </motion.div>
    );
  };

  const renderTravel = () => {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8 flex flex-col items-center"
      >
        <div className="text-center w-full">
          <h2 className="text-2xl font-bold text-white mb-2">Step 3 – Travel Time: How Long Would It Take?</h2>
          <p className="text-gray-400 text-base max-w-4xl mx-auto leading-relaxed">
            Distances in space are not only big in kilometers. They are also huge in time, when you think about how fast we can travel. 
            Explore how long it would take to reach different destinations at various speeds!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 w-full">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neon-blue/20 flex items-center justify-center border border-neon-blue/30 text-neon-blue font-bold">1</div>
                <h3 className="text-xl font-bold text-white uppercase tracking-widest">Choose Journey</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {JOURNEYS.map(j => (
                  <button
                    key={j.id}
                    onClick={() => setSelectedJourney(j)}
                    className={`p-4 rounded-xl border text-base leading-relaxed font-bold transition-all ${
                      selectedJourney.id === j.id 
                        ? 'bg-neon-blue/20 border-neon-blue text-white shadow-[0_0_15px_rgba(0,255,255,0.2)]' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {j.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neon-pink/20 flex items-center justify-center border border-neon-pink/30 text-neon-pink font-bold">2</div>
                <h3 className="text-xl font-bold text-white uppercase tracking-widest">Choose Speed</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {SPEEDS.map(s => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSpeed(s)}
                      className={`p-4 rounded-xl border text-base leading-relaxed font-bold transition-all flex items-center gap-3 ${
                        selectedSpeed.id === s.id 
                          ? 'bg-neon-pink/20 border-neon-pink text-white shadow-[0_0_15px_rgba(255,0,127,0.2)]' 
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <Icon size={20} className={selectedSpeed.id === s.id ? 'text-neon-pink' : 'text-gray-400'} />
                      <div className="text-left">
                        <div>{s.label}</div>
                        <div className="text-sm opacity-50 font-mono">~{s.speed.toLocaleString()} {s.unit}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="glass-panel border border-white/10 flex flex-col justify-between min-h-[450px] relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.03)_0%,transparent_70%)] pointer-events-none" />
            
            <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
                  <h3 className="text-xl font-bold text-white uppercase tracking-widest">Travel Log</h3>
                </div>
                <div className="px-3 py-1 bg-neon-green/20 text-neon-green text-[10px] font-bold rounded-full border border-neon-green/30 tracking-widest">SYSTEM_ACTIVE</div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                  <span className="text-gray-400 text-sm uppercase font-bold tracking-wider">Destination</span>
                  <span className="text-white font-bold">{selectedJourney.label}</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                  <span className="text-gray-400 text-sm uppercase font-bold tracking-wider">Velocity</span>
                  <span className="text-white font-bold">{selectedSpeed.label}</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                  <span className="text-gray-400 text-sm uppercase font-bold tracking-wider">Distance</span>
                  <span className="text-neon-blue font-mono font-bold">{selectedJourney.distance.toLocaleString()} km</span>
                </div>
              </div>

              <div className="relative h-24 bg-black/40 rounded-xl border border-white/10 flex items-center px-8 overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <div className="absolute left-8 w-3 h-3 bg-neon-blue rounded-full shadow-[0_0_10px_rgba(0,255,255,0.8)]"></div>
                <div className="absolute right-8 w-3 h-3 bg-neon-pink rounded-full shadow-[0_0_10px_rgba(255,0,127,0.8)]"></div>
                <div className="w-full h-[1px] bg-white/20"></div>
                
                <motion.div 
                  key={`${selectedJourney.id}-${selectedSpeed.id}`}
                  initial={{ left: '2rem' }}
                  animate={{ left: 'calc(100% - 3rem)' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute z-20"
                >
                  <div className="relative">
                    <selectedSpeed.icon size={20} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white/10 rounded-full blur-md" />
                  </div>
                </motion.div>
              </div>

              <div className="bg-neon-blue/5 p-6 rounded-xl border border-neon-blue/20 text-center space-y-2 shadow-[inset_0_0_20px_rgba(0,255,255,0.05)]">
                <div className="text-gray-400 text-sm font-bold uppercase tracking-widest">Estimated Arrival Time</div>
                <div className="text-4xl font-bold text-neon-blue font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">{travelTime}</div>
              </div>
            </div>

            <div className="text-sm text-gray-400 leading-relaxed italic text-center mt-6 px-4 py-3 bg-white/5 rounded-lg border border-white/5">
              {selectedSpeed.id === 'light' ? (
                selectedJourney.id === 'earth-moon' 
                  ? "That’s faster than you can say ‘astronomy’!" 
                  : "Space is really big, even at the universe’s speed limit!"
              ) : selectedSpeed.id === 'walking' ? (
                "At walking speed, this trip would take an absurd amount of time – longer than a human lifetime."
              ) : selectedSpeed.id === 'plane' && selectedJourney.id === 'earth-sun' ? (
                "At the speed of a normal passenger plane, it would take many years to get from Earth to the Sun."
              ) : (
                "This shows how even the closest objects in space are unimaginably far for humans."
              )}
            </div>
          </div>
        </div>

        <button 
          onClick={onHome}
          className="btn-primary px-10 py-4 text-xl font-bold shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.5)]"
        >
          Back to Dashboard
        </button>
      </motion.div>
    );
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8">
      <AnimatePresence mode="wait">
        {step === Step.INTRO && renderIntro()}
        {step === Step.ZOOMER && renderZoomer()}
        {step === Step.COMPARE && renderCompare()}
        {step === Step.TRAVEL && renderTravel()}
      </AnimatePresence>
    </div>
  );
};

export default SizesDistances;
