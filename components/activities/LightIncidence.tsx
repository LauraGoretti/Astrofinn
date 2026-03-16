import React, { useState } from 'react';
import { GameMode } from '../../types';
import { Sun, ArrowRight, ArrowLeft, Rocket } from 'lucide-react';

interface LightIncidenceProps {
  mode: GameMode;
  setStage: (stage: string) => void;
}

const LightIncidence: React.FC<LightIncidenceProps> = ({ mode, setStage }) => {
  React.useEffect(() => {
    if (mode === GameMode.GROUP) {
      setStage('Path 1: Warm-up');
    } else {
      setStage('Path 2: Exploration');
    }
  }, [mode, setStage]);

  if (mode === GameMode.GROUP) {
    return <Path1HandsOn />;
  }
  return <Path2SoloMission />;
};

const Path1HandsOn: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">
          Light Incidence and Heating
        </h1>
        <p className="text-xl text-gray-400 mt-2">Path 1: Warm-up with reflective and creative thinking</p>
      </div>

      {/* Task 1 */}
      <div className="glass-panel p-8 rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-4">Step 1 – Let’s talk about seasons and places</h2>
        <p className="text-gray-300 mb-6 italic">
          “Before we play with light, let’s think about the weather in different places. Use your own experiences to warm up your brain!”
        </p>

        <div className="space-y-6">
          <div className="bg-space-800/50 p-6 rounded-xl border border-white/5">
            <h3 className="text-lg font-bold text-orange-400 mb-2">Talk about your favorite season</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Turn to a partner or small group.</li>
              <li>Each person answers:
                <ul className="list-circle list-inside ml-6 mt-1 text-gray-400">
                  <li>“What is your favorite season?”</li>
                  <li>“What do you like to do in that season?”</li>
                  <li>“Is it usually warm, cold, rainy, dark, or bright in that season?”</li>
                </ul>
              </li>
            </ul>
          </div>

          <div className="bg-space-800/50 p-6 rounded-xl border border-white/5">
            <h3 className="text-lg font-bold text-orange-400 mb-2">Share stories about other places</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Do you know someone who lives in another country or city?</li>
              <li>Share:
                <ul className="list-circle list-inside ml-6 mt-1 text-gray-400">
                  <li>“Where do they live?”</li>
                  <li>“What is the climate like there?” (warmer/colder, more/less snow, more/less daylight)</li>
                </ul>
              </li>
            </ul>
          </div>

          <div className="bg-space-800/50 p-6 rounded-xl border border-white/5">
            <h3 className="text-lg font-bold text-orange-400 mb-2">Choose a place you’d like to visit</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Pick any place in the world you would love to visit.</li>
              <li>Use Google or an AI tool (with your teacher’s permission) to check:
                <ul className="list-circle list-inside ml-6 mt-1 text-gray-400">
                  <li>What is the climate like there now?</li>
                  <li>Is it very different from where you live? How?</li>
                </ul>
              </li>
            </ul>
          </div>

          <div className="flex items-start gap-4 bg-blue-900/30 p-4 rounded-xl border border-blue-500/30">
            <div className="p-2 bg-blue-500/20 rounded-full shrink-0">
              <img 
                src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
                alt="Astronaut" 
                className="w-6 h-6"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-blue-200 italic">
              “Different places on Earth get different amounts of light and heat. But the Sun is the same. So… what is changing?”
            </p>
          </div>

          <div className="mt-6 bg-space-800/50 p-6 rounded-xl border border-white/5">
            <h3 className="text-lg font-bold text-orange-400 mb-2">Reflection</h3>
            <p className="text-gray-300">
              Discuss with your group: What is one difference you discovered between your place and the place you chose?
            </p>
          </div>
        </div>
      </div>

      {/* Task 2 */}
      <div className="glass-panel p-8 rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-4">Step 2 – Flashlight & Shadows Experiment</h2>
        <p className="text-gray-300 mb-6 italic">
          “Now you will use a flashlight and objects to see how light and shadows behave. This is your ‘mini Sun’ experiment.”
        </p>

        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-200 mb-2">Suggested materials:</h3>
          <ul className="list-disc list-inside text-gray-400 ml-4">
            <li>1 flashlight</li>
            <li>1 small object (eraser, block, or small toy)</li>
            <li>A flat surface or wall</li>
          </ul>
        </div>

        <div className="space-y-6">
          <div className="bg-space-800/50 p-6 rounded-xl border border-white/5">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">Make a basic shadow</h3>
            <ul className="list-decimal list-inside text-gray-300 space-y-2 ml-4">
              <li>Place your object on the table.</li>
              <li>Turn on the flashlight.</li>
              <li>Shine the light so that the object makes a clear shadow on the table or wall.</li>
            </ul>
          </div>

          <div className="bg-space-800/50 p-6 rounded-xl border border-white/5">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">Light almost on top of the object</h3>
            <ul className="list-decimal list-inside text-gray-300 space-y-2 ml-4 mb-4">
              <li>Hold the flashlight almost straight above the object, pointing down.</li>
              <li>Look at the shadow.</li>
            </ul>
            <div className="bg-black/30 p-4 rounded-lg border-l-2 border-yellow-500 text-gray-300">
              <strong>Guiding question:</strong> "What happens if the light is almost on top of the object? Is the shadow longer or shorter?"
            </div>
          </div>

          <div className="bg-space-800/50 p-6 rounded-xl border border-white/5">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">Make a long shadow</h3>
            <ul className="list-decimal list-inside text-gray-300 space-y-2 ml-4 mb-4">
              <li>Move the flashlight lower, closer to the table, so the light is almost sideways.</li>
              <li>Look at the shadow again.</li>
            </ul>
            <div className="bg-black/30 p-4 rounded-lg border-l-2 border-yellow-500 text-gray-300">
              <strong>Guiding question:</strong> "Can you make long shadows? How do you need to move the flashlight?"
            </div>
          </div>

          <div className="bg-space-800/50 p-6 rounded-xl border border-white/5">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">Light concentration vs. spreading</h3>
            <ul className="list-decimal list-inside text-gray-300 space-y-2 ml-4 mb-4">
              <li>Keep the same distance between flashlight and object.</li>
              <li>Slowly tilt the flashlight:
                <ul className="list-circle list-inside ml-6 mt-1 text-gray-400">
                  <li>First, point it straight at the object.</li>
                  <li>Then tilt it so the light hits from the side.</li>
                </ul>
              </li>
              <li>Observe how the bright area on the table changes.</li>
            </ul>
            <div className="space-y-3 mt-4">
              <div className="bg-black/30 p-3 rounded-lg text-gray-300 text-sm">
                "The flashlight does not get brighter or dimmer. So, think about it: how do you concentrate the light the most? Do you angle the light or do you point it straight at the object?"
              </div>
              <div className="bg-black/30 p-3 rounded-lg text-gray-300 text-sm">
                "What happens if you shine the light sideways? Do you get a larger area illuminated?"
              </div>
              <div className="bg-black/30 p-3 rounded-lg text-gray-300 text-sm">
                "But what do you lose with that? Is the larger area illuminated as bright as the focused one?"
              </div>
            </div>
          </div>

          <div className="mt-6 bg-space-800/50 p-6 rounded-xl border border-white/5">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">Reflection</h3>
            <p className="text-gray-300">
              Discuss with your group: When the light is more concentrated, how does the brightness change? When the light is more spread out, how does the brightness change?
            </p>
          </div>

          <div className="flex items-start gap-4 bg-green-900/30 p-4 rounded-xl border border-green-500/30 mt-8">
            <div className="p-2 bg-green-500/20 rounded-full shrink-0">
              <img 
                src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
                alt="Astronaut" 
                className="w-6 h-6"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-green-200 italic">
              “You’ve just discovered something very important about light: same flashlight, different heating power. You are ready for your Solo Mission! Click on the ‘Path 2: Exploration Mission’ window.”
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Path2SoloMission: React.FC = () => {
  const [phase, setPhase] = useState<'A' | 'B'>('A');
  const [angle, setAngle] = useState(90);
  const [ballY, setBallY] = useState(0);

  // Derived values for Phase A
  const spread = angle > 60 ? 'small' : angle > 30 ? 'medium' : 'large';
  const heat = angle > 60 ? 'high' : angle > 30 ? 'medium' : 'low';
  
  // Derived values for Phase B
  const absBallY = Math.abs(ballY);
  const phaseBHeat = absBallY < 30 ? 'high' : absBallY < 70 ? 'medium' : 'low';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">
          Light Incidence and Heating
        </h1>
        <p className="text-xl text-gray-400 mt-2">Path 2: Exploration Mission</p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="bg-space-800 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setPhase('A')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${phase === 'A' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Phase A: Moving Flashlight
          </button>
          <button
            onClick={() => setPhase('B')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${phase === 'B' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Phase B: Moving Ball
          </button>
        </div>
      </div>

      {phase === 'A' ? (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col">
            <h2 className="text-2xl font-bold text-white mb-2">Magic Heating Flashlight</h2>
            <p className="text-gray-400 text-sm mb-6 italic">
              "Welcome to your Solo Mission! This is a magic heating flashlight. It always sends the same light, but the heating changes with the angle."
            </p>

            {/* Simulation Area */}
            <div className="relative flex-1 min-h-[350px] bg-gradient-to-b from-space-900 to-black rounded-xl border border-white/10 overflow-hidden flex items-center justify-center mb-6 shadow-2xl">
              <style>{`
                @keyframes steamRise {
                  0% { transform: translateY(0) scale(1) translateX(0); opacity: 0; }
                  30% { opacity: 0.5; }
                  100% { transform: translateY(-120px) scale(2.5) translateX(20px); opacity: 0; }
                }
                @keyframes heatWave {
                  0% { transform: translateY(0) scaleX(1) skewX(0deg); opacity: 0; }
                  20% { opacity: 0.8; }
                  50% { transform: translateY(-50px) scaleX(1.1) skewX(10deg); opacity: 0.4; }
                  100% { transform: translateY(-120px) scaleX(1.3) skewX(-10deg); opacity: 0; }
                }
                @keyframes surfaceGlow {
                  0%, 100% { opacity: 0.4; transform: scale(1); filter: blur(8px); }
                  50% { opacity: 0.9; transform: scale(1.2); filter: blur(12px); }
                }
                @keyframes shimmer {
                  0% { opacity: 0.3; transform: scale(1); }
                  50% { opacity: 0.8; transform: scale(1.1); }
                  100% { opacity: 0.3; transform: scale(1); }
                }
              `}</style>

              {/* The Surface (Ground) */}
              <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-gray-800 to-gray-600 border-t border-gray-500 shadow-[inset_0_10px_30px_rgba(0,0,0,0.5)]">
                {/* Grid lines for perspective */}
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                  transform: 'perspective(500px) rotateX(60deg) scale(2)',
                  transformOrigin: 'top'
                }}></div>
              </div>

              {/* Realistic Light Spot Projection */}
              {(() => {
                const sinA = Math.sin(angle * Math.PI / 180);
                const intensity = Math.max(0.01, sinA);
                
                // Opacity scales with intensity
                const lightOpacity = 0.3 + 0.7 * intensity;
                const heatOpacity = Math.pow(intensity, 4);
                
                // Spot dimensions stretch as angle decreases
                const spotWidth = 140 / Math.max(0.15, intensity);
                const spotHeight = 70 + (1 - intensity) * 40;

                // Color interpolation: 
                // 90° (intensity=1) -> Warm orange/yellow (255, 180, 50)
                // 0° (intensity=0) -> Cool faint blue (100, 200, 255)
                const r = Math.round(100 + 155 * intensity);
                const g = Math.round(200 - 20 * intensity);
                const b = Math.round(255 - 205 * intensity);

                return (
                  <>
                    {/* Base Light Spot (Sharp edge, no white core, color based on angle) */}
                    <div 
                      className="absolute bottom-[16.66%] pointer-events-none z-10 rounded-[50%]"
                      style={{
                        width: `${spotWidth}px`,
                        height: `${spotHeight}px`,
                        left: '50%',
                        transform: `translateX(-50%) translateY(50%)`,
                        background: `radial-gradient(ellipse at center, 
                          rgba(${r}, ${g}, ${b}, ${lightOpacity}) 0%, 
                          rgba(${r}, ${g}, ${b}, ${lightOpacity * 0.8}) 40%, 
                          rgba(${r}, ${g}, ${b}, ${lightOpacity * 0.5}) 70%, 
                          rgba(${r}, ${g}, ${b}, 0) 73%)`,
                        boxShadow: `0 0 ${30 + (1 - intensity) * 20}px ${10 + (1 - intensity) * 10}px rgba(${r}, ${g}, ${b}, ${lightOpacity * 0.4})`,
                        filter: `blur(${2 + (1 - intensity) * 6}px)`,
                        transition: 'width 0.1s, height 0.1s, background 0.1s, box-shadow 0.1s, filter 0.1s'
                      }}
                    />
                    
                    {/* Heat Core (Intense red/orange at high angles) */}
                    <div 
                      className="absolute bottom-[16.66%] pointer-events-none mix-blend-screen z-10 rounded-[50%]"
                      style={{
                        width: `${spotWidth * 0.5}px`,
                        height: `${spotHeight * 0.5}px`,
                        left: '50%',
                        transform: `translateX(-50%) translateY(50%)`,
                        background: `radial-gradient(ellipse at center, 
                          rgba(255, 100, 0, ${heatOpacity}) 0%, 
                          rgba(239, 68, 68, ${heatOpacity * 0.8}) 50%, 
                          transparent 80%)`,
                        boxShadow: `0 0 40px 20px rgba(239, 68, 68, ${heatOpacity * 0.6})`,
                        transition: 'width 0.1s, height 0.1s, background 0.1s, box-shadow 0.1s'
                      }}
                    />

                    {/* Magical Heat Waves / Rays */}
                    <div 
                      className="absolute bottom-[16.66%] left-1/2 -translate-x-1/2 pointer-events-none z-20"
                      style={{
                        opacity: heatOpacity,
                        width: `${spotWidth}px`,
                        height: '200px',
                        transform: 'translateX(-50%)'
                      }}
                    >
                      {[...Array(12)].map((_, i) => (
                        <div 
                          key={i}
                          className="absolute bottom-0 bg-gradient-to-t from-orange-400/60 to-transparent blur-[2px]"
                          style={{
                            left: `${(i / 11) * 100}%`,
                            width: '2px',
                            height: `${60 + Math.random() * 100}px`,
                            animation: `heatWave ${1.5 + Math.random()}s infinite ease-out ${i * 0.1}s`,
                            boxShadow: '0 0 8px rgba(251, 146, 60, 0.5)'
                          }}
                        />
                      ))}
                      
                      {/* Shimmering Aura */}
                      <div 
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-orange-500/20 blur-3xl"
                        style={{
                          width: `${spotWidth * 1.5}px`,
                          height: '100px',
                          animation: 'shimmer 2s infinite ease-in-out'
                        }}
                      />
                    </div>

                    {/* Steam/Smoke Effect (Visible at high angles) */}
                    <div 
                      className="absolute bottom-[16.66%] left-1/2 -translate-x-1/2 transition-opacity duration-500 pointer-events-none z-20"
                      style={{
                        opacity: heatOpacity,
                        width: '150px',
                        height: '150px',
                        transform: 'translateX(-50%)'
                      }}
                    >
                      {[...Array(6)].map((_, i) => (
                        <div 
                          key={i}
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-gray-200/40 rounded-full blur-xl"
                          style={{
                            width: `${30 + (i * 10)}px`,
                            height: `${30 + (i * 10)}px`,
                            animation: `steamRise ${2 + (i % 3)}s infinite ease-in ${i * 0.4}s`,
                            marginLeft: `${(i % 2 === 0 ? 1 : -1) * (i * 8)}px`
                          }}
                        />
                      ))}
                    </div>
                  </>
                );
              })()}

              {/* The Flashlight */}
              <div 
                className="absolute transition-all duration-300 origin-bottom z-10"
                style={{
                  bottom: '33.33%',
                  left: '50%',
                  transform: `translateX(-50%) rotate(${angle - 90}deg) translateY(-180px)`
                }}
              >
                {/* Flashlight Body */}
                <div className="w-12 h-24 bg-gradient-to-t from-gray-300 to-gray-500 rounded-t-lg shadow-lg relative flex flex-col items-center justify-end z-10">
                  <div className="absolute top-6 w-3 h-6 bg-orange-500 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"></div>
                  <div className="w-14 h-6 bg-gray-700 rounded-b-xl -mb-2 border-t-2 border-gray-900 shadow-inner z-10"></div>
                  {/* Glowing Bulb */}
                  <div className="absolute bottom-0 w-10 h-4 bg-yellow-100 rounded-full blur-[2px] shadow-[0_0_20px_rgba(253,224,71,1)] z-20"></div>
                </div>
                
                {/* Volumetric Light Beam */}
                <div 
                  className="absolute top-full left-1/2 -translate-x-1/2 origin-top transition-all duration-300 pointer-events-none"
                  style={{
                    height: '250px',
                    width: '200px',
                    background: 'linear-gradient(to bottom, rgba(253, 224, 71, 0.6) 0%, rgba(253, 224, 71, 0.1) 60%, transparent 100%)',
                    clipPath: 'polygon(36% 0, 64% 0, 100% 100%, 0% 100%)',
                    filter: 'blur(4px)'
                  }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>Angle of light</span>
                  <span className="font-mono text-orange-400">{angle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={angle}
                  onChange={(e) => setAngle(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0° (Glancing)</span>
                  <span>90° (Direct)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-space-800 p-3 rounded-lg border border-white/5">
                  <div className="text-xs text-gray-500 uppercase">Light Spread</div>
                  <div className="text-lg font-bold text-white capitalize">{spread}</div>
                </div>
                <div className="bg-space-800 p-3 rounded-lg border border-white/5">
                  <div className="text-xs text-gray-500 uppercase">Heating</div>
                  <div className={`text-lg font-bold capitalize ${heat === 'high' ? 'text-red-400' : heat === 'medium' ? 'text-orange-400' : 'text-yellow-200'}`}>
                    {heat}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">Reflection Guides</h3>
              <div className="space-y-4">
                <div className="bg-space-800/50 p-4 rounded-xl border-l-2 border-orange-500 text-gray-300 text-sm">
                  “What did you notice about how spread the light gets when you change the angle?”
                </div>
                <div className="bg-space-800/50 p-4 rounded-xl border-l-2 border-orange-500 text-gray-300 text-sm">
                  “When the light is most concentrated (around 90°), what happens to the temperature of the ball?”
                </div>
                <div className="bg-space-800/50 p-4 rounded-xl border-l-2 border-orange-500 text-gray-300 text-sm">
                  "When the light is more spread out (small angle), what happens to the temperature? Why do you think the temperature changes, since the light is still the same flashlight?"
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-orange-900/30 p-4 rounded-xl border border-orange-500/30">
              <div className="p-2 bg-orange-500/20 rounded-full shrink-0">
                <img 
                  src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
                  alt="Astronaut" 
                  className="w-6 h-6"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-orange-200 italic">
                “Straight light = strong heating in a small area. Tilted light = weak heating in a larger area. This is the secret of seasons!”
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col">
            <h2 className="text-2xl font-bold text-white mb-2">Moving the Ball</h2>
            <p className="text-gray-400 text-sm mb-6 italic">
              "Now we keep the flashlight still, and we move the ball instead. This is more like what happens in space: the Sun stays in the center, and planets move."
            </p>

            {/* Simulation Area */}
            <div className="relative flex-1 min-h-[350px] bg-gradient-to-b from-space-900 to-black rounded-xl border border-white/10 overflow-hidden flex items-center justify-center mb-6 shadow-2xl">
              {/* Starry background effect */}
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 40%, white 1px, transparent 1px), radial-gradient(circle at 40% 80%, white 1px, transparent 1px), radial-gradient(circle at 70% 90%, white 1px, transparent 1px)',
                backgroundSize: '100px 100px'
              }}></div>

              {/* The Flashlight (Fixed) */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center">
                {/* Flashlight Body (Horizontal) */}
                <div className="w-24 h-12 bg-gradient-to-r from-gray-500 to-gray-300 rounded-r-lg shadow-lg relative flex items-center justify-end">
                  <div className="w-6 h-14 bg-gray-700 rounded-r-xl -mr-2 border-r-2 border-gray-900 shadow-inner flex items-center justify-center">
                    {/* Glowing Bulb */}
                    <div className="w-4 h-10 bg-yellow-100 rounded-full blur-[2px] shadow-[0_0_20px_rgba(253,224,71,1)]"></div>
                  </div>
                  <div className="absolute left-4 w-4 h-8 bg-orange-500 rounded-full shadow-[inset_2px_0_4px_rgba(0,0,0,0.4)]"></div>
                </div>
                
                {/* Volumetric Light Beam (Cylinder) */}
                <div 
                  className="absolute left-[100%] top-1/2 -translate-y-1/2 origin-left pointer-events-none"
                  style={{
                    width: '300px',
                    height: '60px',
                    background: 'linear-gradient(to right, rgba(253, 224, 71, 0.4) 0%, rgba(253, 224, 71, 0.1) 80%, transparent 100%)',
                    filter: 'blur(4px)',
                    borderTop: '1px solid rgba(253, 224, 71, 0.2)',
                    borderBottom: '1px solid rgba(253, 224, 71, 0.2)'
                  }}
                />
              </div>

              {/* The Ball (Moving vertically) */}
              <div 
                className="relative w-56 h-56 ml-32 z-20 transition-transform duration-300 ease-out"
                style={{ transform: `translateY(${ballY}px)` }}
              >
                <div 
                  className="w-full h-full rounded-full bg-blue-900 relative overflow-hidden shadow-[inset_-20px_-20px_40px_rgba(0,0,0,0.7),0_0_20px_rgba(59,130,246,0.2)]"
                >
                  {/* Continents (Stylized) */}
                  <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{
                    backgroundImage: 'radial-gradient(circle at 30% 40%, #4ade80 10%, transparent 40%), radial-gradient(circle at 70% 60%, #4ade80 15%, transparent 50%), radial-gradient(circle at 40% 80%, #4ade80 8%, transparent 30%)',
                    backgroundSize: '150% 150%',
                    backgroundPosition: 'center'
                  }}></div>

                  {/* Fixed Light/Shadow overlay (Day/Night cycle) */}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/20 via-transparent to-black/90 pointer-events-none" />
                  
                  {/* Atmospheric glow on the lit edge */}
                  <div className="absolute inset-0 rounded-full shadow-[inset_10px_0_20px_rgba(253,224,71,0.2)] pointer-events-none"></div>
                </div>

                {/* Dynamic Light Projection & Heat Effects (Moved outside overflow-hidden for reflection) */}
                {(() => {
                  // Calculate stretch based on vertical position relative to ball center
                  const relativeY = -ballY;
                  const radius = 112; // half of 224px (w-56)
                  const normalizedY = Math.min(0.95, Math.abs(relativeY) / radius);
                  
                  // Intensity is cos(angle of incidence)
                  const intensity = Math.sqrt(1 - normalizedY * normalizedY);
                  const stretch = 1 / Math.max(0.1, intensity);
                  const lightOpacity = 0.3 + 0.7 * intensity;
                  const heatOpacity = Math.pow(intensity, 2.5);

                  // Color interpolation
                  const r = Math.round(100 + 155 * intensity);
                  const g = Math.round(200 - 20 * intensity);
                  const b = Math.round(255 - 205 * intensity);

                  const spotHeight = 60;
                  const spotWidth = 60 * stretch;
                  
                  // Calculate horizontal shift to stay on the silhouette of the sphere
                  const shiftX = radius - Math.sqrt(radius * radius - relativeY * relativeY);

                  return (
                    <div 
                      className="absolute left-0 pointer-events-none z-30"
                      style={{
                        top: `calc(50% + ${relativeY}px)`,
                        transform: `translateY(-50%) translateX(${shiftX + 2}px)`,
                        width: `${spotWidth}px`,
                        height: `${spotHeight}px`,
                        transition: 'top 0.3s ease-out, transform 0.3s ease-out, width 0.1s, opacity 0.1s'
                      }}
                    >
                      {/* Base Light Spot (Clipped to ball shape using a mask or just keeping it small) */}
                      <div 
                        className="absolute inset-0 rounded-[50%]"
                        style={{
                          background: `radial-gradient(ellipse at center, 
                            rgba(${r}, ${g}, ${b}, ${lightOpacity}) 0%, 
                            rgba(${r}, ${g}, ${b}, ${lightOpacity * 0.5}) 70%, 
                            transparent 73%)`,
                          boxShadow: `0 0 20px rgba(${r}, ${g}, ${b}, ${lightOpacity * 0.4})`,
                          filter: `blur(${1 + (1 - intensity) * 3}px)`,
                        }}
                      />

                      {/* Heat Core */}
                      <div 
                        className="absolute inset-0 rounded-[50%] mix-blend-screen"
                        style={{
                          transform: 'scale(0.6)',
                          background: `radial-gradient(ellipse at center, 
                            rgba(255, 100, 0, ${heatOpacity}) 0%, 
                            rgba(239, 68, 68, ${heatOpacity * 0.8}) 50%, 
                            transparent 80%)`,
                          boxShadow: `0 0 30px 15px rgba(239, 68, 68, ${heatOpacity * 0.6})`,
                        }}
                      />

                      {/* Surface Warming Glow */}
                      <div 
                        className="absolute inset-0 bg-orange-600/40 rounded-full blur-md mix-blend-screen"
                        style={{ 
                          opacity: heatOpacity * 0.6,
                          animation: 'surfaceGlow 2s infinite ease-in-out'
                        }}
                      />
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>Move the ball up/down</span>
                  <span className="font-mono text-blue-400">{ballY > 0 ? 'South' : ballY < 0 ? 'North' : 'Equator'}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={ballY}
                  onChange={(e) => setBallY(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>North Pole</span>
                  <span>Equator</span>
                  <span>South Pole</span>
                </div>
              </div>

              <div className="bg-space-800 p-3 rounded-lg border border-white/5 mt-4 text-center">
                <div className="text-xs text-gray-500 uppercase">Heating Intensity</div>
                <div className={`text-xl font-bold capitalize ${phaseBHeat === 'high' ? 'text-red-400' : phaseBHeat === 'medium' ? 'text-orange-400' : 'text-blue-300'}`}>
                  {phaseBHeat}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">Reflection Guides</h3>
              <div className="space-y-4">
                <div className="bg-space-800/50 p-4 rounded-xl border-l-2 border-blue-500 text-gray-300 text-sm">
                  "Now, what if we move the ball instead of the flashlight? Can you find similar results to the first part?"
                </div>
                <div className="bg-space-800/50 p-4 rounded-xl border-l-2 border-blue-500 text-gray-300 text-sm">
                  "When the light hits the center (Equator) as a circle, what happens to the heating? And when it spreads into an oval at the poles?"
                </div>
                <div className="bg-space-800/50 p-4 rounded-xl border-l-2 border-blue-500 text-gray-300 text-sm">
                  “In the solar system, what case is most likely to happen most of the time: the light moving side to side or the ball moving somehow?”
                </div>
              </div>
            </div>

            <div className="bg-space-800/80 p-6 rounded-xl border border-white/10 shadow-lg">
              <h4 className="font-bold text-white mb-2">Conclusion</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                “In our magic experiment, the flashlight was the Sun and the ball was the Earth.
                When we changed the angle, the heating changed—even though the light stayed the same.
                On real Earth, we don’t move the Sun. The Earth moves and tilts, changing the angle of sunlight and how much we heat up.”
              </p>
            </div>

            <div className="flex items-start gap-4 bg-green-900/30 p-4 rounded-xl border border-green-500/30">
              <div className="p-2 bg-green-500/20 rounded-full shrink-0">
                <img 
                  src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
                  alt="Astronaut" 
                  className="w-6 h-6"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-green-200 italic">
                “Great work, explorer! You are now ready to see what happens on real Earth. Open the second tile of the app and start exploring!”
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LightIncidence;
