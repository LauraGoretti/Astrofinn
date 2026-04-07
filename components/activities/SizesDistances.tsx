import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ruler, ArrowRight, ArrowLeft, ZoomIn, Globe, Sun, Rocket, Plane, Car, Footprints, Info } from 'lucide-react';
import { GameMode } from '../../types';
import { useTranslation } from 'react-i18next';

interface SizesDistancesProps {
  mode: GameMode | null;
  setStage: (stage: string) => void;
  onHome: () => void;
  setBackIntercept?: (intercept: { handler: () => boolean } | null) => void;
}

enum Step {
  ZOOMER,
  COMPARE,
  TRAVEL
}

const TEXTURE_BASE_URL = 'https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/texture/';

const PLANET_DATA = {
  Moon: { size: 0.27, color: '#A0A0A0', texture: 'moon.jpg' },
  Mercury: { size: 0.38, color: '#8C8C8C', texture: 'mercury.jpg' },
  Venus: { size: 0.95, color: '#E3BB76', texture: 'venus_atmosphere.jpg' },
  Earth: { size: 1, color: '#2B65EC', texture: 'earth_day.jpg' },
  Mars: { size: 0.53, color: '#E27B58', texture: 'mars.jpg' },
  Jupiter: { size: 11.2, color: '#D39C7E', texture: 'jupiter.jpg' },
  Saturn: { size: 9.45, color: '#C5AB6E', texture: 'saturn.jpg' },
  Uranus: { size: 4.0, color: '#B5E3E3', texture: 'uranus.jpg' },
  Neptune: { size: 3.88, color: '#4B70DD', texture: 'neptune.jpg' },
  Sun: { size: 109, color: '#FDB813', texture: 'sun.jpg' }
};

const JOURNEYS = [
  { id: 'earth-moon', label: 'Earth → Moon', distance: 384400, source: 'Earth', target: 'Moon' },
  { id: 'earth-sun', label: 'Earth → Sun', distance: 149600000, source: 'Earth', target: 'Sun' },
  { id: 'earth-mars', label: 'Earth → Mars', distance: 225000000, source: 'Earth', target: 'Mars' },
  { id: 'sun-neptune', label: 'Sun → Neptune', distance: 4500000000, source: 'Sun', target: 'Neptune' }
];

const SPEEDS = [
  { id: 'light', label: 'Light speed', speed: 1080000000, icon: Rocket, unit: 'km/h' },
  { id: 'plane', label: 'Commuter plane', speed: 900, icon: Plane, unit: 'km/h' },
  { id: 'car', label: 'Car', speed: 100, icon: Car, unit: 'km/h' },
  { id: 'walking', label: 'Walking', speed: 5, icon: Footprints, unit: 'km/h' }
];

const SizesDistances: React.FC<SizesDistancesProps> = ({ mode, setStage, onHome, setBackIntercept }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>(Step.ZOOMER);
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
            setStage(t('activities.sizes_distances.step_2_title'));
            return true;
          }
          if (step === Step.COMPARE) {
            setStep(Step.ZOOMER);
            setStage(t('activities.sizes_distances.step_1_title'));
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
    if (hours < 1 / 60) return t('activities.sizes_distances.time_units.seconds', { val: (hours * 3600).toFixed(1) });
    if (hours < 1) return t('activities.sizes_distances.time_units.minutes', { val: (hours * 60).toFixed(1) });
    if (hours < 24) return t('activities.sizes_distances.time_units.hours', { val: hours.toFixed(1) });
    if (hours < 24 * 30) return t('activities.sizes_distances.time_units.days', { val: (hours / 24).toFixed(1) });
    if (hours < 24 * 365) return t('activities.sizes_distances.time_units.months', { val: (hours / (24 * 30.44)).toFixed(1) });
    return t('activities.sizes_distances.time_units.years', { val: (hours / (24 * 365)).toFixed(1) });
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
        <h2 className="text-2xl font-bold text-white tracking-tighter text-center">{t('activities.sizes_distances.intro_title')}</h2>
        {renderAstronautBubble(t('activities.sizes_distances.intro_text'))}
      </div>
      <button 
        onClick={() => {
          setStep(Step.ZOOMER);
          setStage(t('activities.sizes_distances.step_1_title'));
        }}
        className="btn-primary px-8 py-3 text-xl font-bold"
      >
        {t('activities.sizes_distances.start_button')} <ArrowRight className="ml-3" size={20} />
      </button>
    </motion.div>
  );

  const renderZoomer = () => {
    const getLevelInfo = () => {
      if (zoomLevel === 1) return {
        label: t('activities.sizes_distances.zoom_levels.level_1.label'),
        text: t('activities.sizes_distances.zoom_levels.level_1.text'),
        planets: ['Earth', 'Moon']
      };
      if (zoomLevel === 2) return {
        label: t('activities.sizes_distances.zoom_levels.level_2.label'),
        text: t('activities.sizes_distances.zoom_levels.level_2.text'),
        planets: ['Mercury', 'Venus', 'Earth', 'Mars']
      };
      if (zoomLevel === 3) return {
        label: t('activities.sizes_distances.zoom_levels.level_3.label'),
        text: t('activities.sizes_distances.zoom_levels.level_3.text'),
        planets: ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn']
      };
      return {
        label: t('activities.sizes_distances.zoom_levels.level_4.label'),
        text: t('activities.sizes_distances.zoom_levels.level_4.text'),
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
          <h2 className="text-2xl font-bold text-white">{t('activities.sizes_distances.step_1_title')}</h2>
          <p className="text-gray-400 text-base max-w-4xl mx-auto leading-relaxed">
            {t('activities.sizes_distances.step_1_desc')}
          </p>
        </div>

        <div className="glass-panel min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden bg-space-950/50">
          <div className="flex items-end justify-center gap-6 mb-16 flex-wrap">
            {info.planets.map(p => {
              const data = PLANET_DATA[p as keyof typeof PLANET_DATA];
              // Scale for visualization
              let visualSize = data.size * 30;
              if (zoomLevel === 2) visualSize = data.size * 20;
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
                  <span className="text-[12px] text-gray-400 uppercase font-bold tracking-wider">{t(`activities.sizes_distances.planets.${p}`)}</span>
                </div>
              );
            })}
          </div>

          <div className="w-full max-w-7xl space-y-6">
            <div className="flex justify-between text-sm font-bold text-neon-blue uppercase tracking-widest">
              <span>{info.label}</span>
              <div className="flex items-center gap-2">
                <ZoomIn size={18} />
                <span>{t('activities.sizes_distances.zoom_level_indicator', { val: zoomLevel })}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { level: 1, label: t('activities.sizes_distances.zoom_controls.level_1') },
                { level: 2, label: t('activities.sizes_distances.zoom_controls.level_2') },
                { level: 3, label: t('activities.sizes_distances.zoom_controls.level_3') },
                { level: 4, label: t('activities.sizes_distances.zoom_controls.level_4') }
              ].map((btn) => (
                <button
                  key={btn.level}
                  onClick={() => setZoomLevel(btn.level)}
                  className={`px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all ${
                    zoomLevel === btn.level
                      ? 'bg-neon-blue/20 border-neon-blue text-white shadow-[0_0_15px_rgba(0,255,255,0.3)]'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button 
            onClick={() => {
              setStep(Step.COMPARE);
              setStage(t('activities.sizes_distances.step_2_title'));
            }}
            className="btn-primary px-8 py-3 text-xl font-bold"
          >
            {t('activities.sizes_distances.next_step_2')} <ArrowRight className="ml-3" size={20} />
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
          <h2 className="text-2xl font-bold text-white mb-3">{t('activities.sizes_distances.step_2_title')}</h2>
          <p className="text-gray-400 text-base max-w-4xl mx-auto leading-relaxed">
            {t('activities.sizes_distances.step_2_desc')}
          </p>
        </div>

        <div className="w-full glass-panel p-0 flex relative overflow-hidden bg-space-950/50">
          {/* Vertical Selection Sidebar */}
          <div className="w-56 shrink-0 border-r border-white/10 p-4 flex flex-col gap-2 z-10 bg-black/20">
            <h3 className="text-[18px] font-bold text-gray-500 uppercase tracking-widest mb-4 leading-tight">{t('activities.sizes_distances.select_object')}</h3>
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
                  {t(`activities.sizes_distances.planets.${p}`)}
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
                <p className="text-gray-400 font-bold uppercase tracking-widest text-2xl">{t('activities.sizes_distances.choose_object_hint')}</p>
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
                    <span className="text-xs font-bold text-white uppercase tracking-widest">{t('activities.sizes_distances.planets.Earth')}</span>
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
                    <span className="text-xs font-bold text-white uppercase tracking-widest">{t(`activities.sizes_distances.planets.${compareTarget}`)}</span>
                  </div>
                </div>
                
                <div className="max-w-4xl text-center space-y-3 bg-white/5 p-5 rounded-2xl border border-white/10">
                  <p className="text-gray-100 text-base leading-relaxed font-medium">
                    {t('activities.sizes_distances.compare_label', { target: t(`activities.sizes_distances.planets.${compareTarget}`) })}
                  </p>
                  <p className="text-neon-blue text-base italic leading-relaxed">
                    {t(`activities.sizes_distances.planet_descriptions.${compareTarget}`)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={() => {
            setStep(Step.TRAVEL);
            setStage(t('activities.sizes_distances.step_3_title'));
          }}
          className="btn-primary px-8 py-3 text-xl font-bold"
        >
          {t('activities.sizes_distances.next_step_3')} <ArrowRight className="ml-3" size={20} />
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
          <h2 className="text-2xl font-bold text-white mb-2">{t('activities.sizes_distances.step_3_title')}</h2>
          <p className="text-gray-400 text-base max-w-4xl mx-auto leading-relaxed">
            {t('activities.sizes_distances.step_3_desc')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 w-full">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neon-blue/20 flex items-center justify-center border border-neon-blue/30 text-neon-blue font-bold">1</div>
                <h3 className="text-xl font-bold text-white uppercase tracking-widest">{t('activities.sizes_distances.journey_title')}</h3>
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
                    {t(`activities.sizes_distances.journeys.${j.id}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neon-pink/20 flex items-center justify-center border border-neon-pink/30 text-neon-pink font-bold">2</div>
                <h3 className="text-xl font-bold text-white uppercase tracking-widest">{t('activities.sizes_distances.speed_title')}</h3>
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
                        <div>{t(`activities.sizes_distances.speeds.${s.id}`)}</div>
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
                  <h3 className="text-xl font-bold text-white uppercase tracking-widest">{t('activities.sizes_distances.travel_log')}</h3>
                </div>
                <div className="px-3 py-1 bg-neon-green/20 text-neon-green text-[10px] font-bold rounded-full border border-neon-green/30 tracking-widest">{t('activities.sizes_distances.system_active')}</div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                  <span className="text-gray-400 text-sm uppercase font-bold tracking-wider">{t('activities.sizes_distances.destination')}</span>
                  <span className="text-white font-bold">{t(`activities.sizes_distances.journeys.${selectedJourney.id}`)}</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                  <span className="text-gray-400 text-sm uppercase font-bold tracking-wider">{t('activities.sizes_distances.velocity')}</span>
                  <span className="text-white font-bold">{t(`activities.sizes_distances.speeds.${selectedSpeed.id}`)}</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                  <span className="text-gray-400 text-sm uppercase font-bold tracking-wider">{t('activities.sizes_distances.distance')}</span>
                  <span className="text-neon-blue font-mono font-bold">{selectedJourney.distance.toLocaleString()} km</span>
                </div>
              </div>

              <div className="relative h-24 bg-black/40 rounded-xl border border-white/10 flex items-center px-12 overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                
                {/* Source Object */}
                <div className="absolute left-4 flex flex-col items-center">
                  <div 
                    className="w-10 h-10 rounded-full border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    style={{ 
                      backgroundImage: `url(${TEXTURE_BASE_URL}${PLANET_DATA[selectedJourney.source as keyof typeof PLANET_DATA].texture})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                  <span className="text-[8px] text-gray-500 uppercase font-bold mt-1">{t(`activities.sizes_distances.planets.${selectedJourney.source}`)}</span>
                </div>

                {/* Destination Object */}
                <div className="absolute right-4 flex flex-col items-center">
                  <div 
                    className="w-10 h-10 rounded-full border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    style={{ 
                      backgroundImage: `url(${TEXTURE_BASE_URL}${PLANET_DATA[selectedJourney.target as keyof typeof PLANET_DATA].texture})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                  <span className="text-[8px] text-gray-500 uppercase font-bold mt-1">{t(`activities.sizes_distances.planets.${selectedJourney.target}`)}</span>
                </div>

                <div className="w-full h-[1px] bg-white/20 mx-8"></div>
                
                <div className="absolute left-1/2 -translate-x-1/2 z-20">
                  <div className="relative">
                    <selectedSpeed.icon size={24} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full blur-md" />
                  </div>
                </div>
              </div>

              <div className="bg-neon-blue/5 p-6 rounded-xl border border-neon-blue/20 text-center space-y-2 shadow-[inset_0_0_20px_rgba(0,255,255,0.05)]">
                <div className="text-gray-400 text-sm font-bold uppercase tracking-widest">{t('activities.sizes_distances.estimated_arrival')}</div>
                <div className="text-4xl font-bold text-neon-blue font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">{travelTime}</div>
              </div>
            </div>

            <div className="text-sm text-gray-400 leading-relaxed italic text-center mt-6 px-4 py-3 bg-white/5 rounded-lg border border-white/5">
              {selectedSpeed.id === 'light' ? (
                selectedJourney.id === 'earth-moon' 
                  ? t('activities.sizes_distances.travel_hints.light_moon') 
                  : t('activities.sizes_distances.travel_hints.light_general')
              ) : selectedSpeed.id === 'walking' ? (
                t('activities.sizes_distances.travel_hints.walking')
              ) : selectedSpeed.id === 'plane' && selectedJourney.id === 'earth-sun' ? (
                t('activities.sizes_distances.travel_hints.plane_sun')
              ) : (
                t('activities.sizes_distances.travel_hints.general')
              )}
            </div>
          </div>
        </div>

        <button 
          onClick={onHome}
          className="btn-primary px-10 py-4 text-xl font-bold shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.5)]"
        >
          {t('activities.sizes_distances.back_to_dashboard')}
        </button>
      </motion.div>
    );
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8">
      <AnimatePresence mode="wait">
        {step === Step.ZOOMER && renderZoomer()}
        {step === Step.COMPARE && renderCompare()}
        {step === Step.TRAVEL && renderTravel()}
      </AnimatePresence>
    </div>
  );
};

export default SizesDistances;
