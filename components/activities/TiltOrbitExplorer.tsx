import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Users, User, Info, ArrowRight, RotateCw, Move, Globe, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { GameMode } from '../../types';

const TEXTURE_BASE_URL = 'https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/texture/';

// --- SHADERS ---
const earthVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSunDir;
varying vec3 vViewDir;
uniform vec3 sunPosition;
void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-mvPosition.xyz);
  vec4 sunViewPos = viewMatrix * vec4(sunPosition, 1.0);
  vSunDir = normalize(sunViewPos.xyz - mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const earthFragmentShader = `
uniform sampler2D dayTexture;
uniform sampler2D nightTexture;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSunDir;
varying vec3 vViewDir;
void main() {
  vec3 normal = normalize(vNormal);
  vec3 sunDir = normalize(vSunDir);
  float dotProd = dot(normal, sunDir);
  float dayFactor = smoothstep(-0.01, 0.01, dotProd);
  vec3 dayColor = texture2D(dayTexture, vUv).rgb;
  vec3 nightColor = texture2D(nightTexture, vUv).rgb * 0.2;
  vec3 finalColor = mix(nightColor, dayColor, dayFactor);
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

// --- 3D COMPONENTS ---

const Sun = ({ position }: { position: [number, number, number] }) => {
  const sunTexture = useLoader(THREE.TextureLoader, `${TEXTURE_BASE_URL}sun.jpg`);
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[4, 32, 32]} />
        <meshBasicMaterial map={sunTexture} color={[1.5, 1.5, 1.5]} toneMapped={false} />
      </mesh>
      <pointLight intensity={2} distance={100} decay={1} color="#fffaed" />
    </group>
  );
};

const getLatLonPosition = (lat: number, lon: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = lon * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.sin(theta));
  const z = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = (radius * Math.cos(phi));
  return [x, y, z];
};

const Earth = ({ 
  position, 
  rotationActive, 
  tiltActive, 
  revolutionActive,
  orbitAngle = 0,
  showFinland = false,
  poleRotation = 0,
  sunPos = [12, 0, 0]
}: { 
  position: [number, number, number], 
  rotationActive: boolean, 
  tiltActive: boolean, 
  revolutionActive: boolean,
  orbitAngle?: number,
  showFinland?: boolean,
  poleRotation?: number,
  sunPos?: [number, number, number]
}) => {
  const [dayTexture, nightTexture] = useLoader(THREE.TextureLoader, [
    `${TEXTURE_BASE_URL}earth_day.jpg`,
    `${TEXTURE_BASE_URL}earth_night.jpg`,
  ]);

  const earthRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const AXIAL_TILT = 23.5 * (Math.PI / 180);

  useFrame((state, delta) => {
    if (rotationActive && earthRef.current) {
      earthRef.current.rotation.y += delta * 0.5;
    }
    if (materialRef.current) {
      materialRef.current.uniforms.sunPosition.value.set(...sunPos);
    }
  });

  // Finland coordinates: ~60° N, 25° E
  const finlandPos = getLatLonPosition(60, 25, 2);

  return (
    <group position={position} rotation={[poleRotation + (tiltActive ? AXIAL_TILT : 0), 0, 0]}>
      <mesh ref={earthRef} rotation={[0, 1.117, 0]}>
        <sphereGeometry args={[2, 64, 64]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={earthVertexShader}
          fragmentShader={earthFragmentShader}
          uniforms={{
            dayTexture: { value: dayTexture },
            nightTexture: { value: nightTexture },
            sunPosition: { value: new THREE.Vector3(...sunPos) }
          }}
        />
        {showFinland && (
          <mesh position={finlandPos as [number, number, number]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial color="#39FF14" />
          </mesh>
        )}
      </mesh>
      {/* Axis Line */}
      <mesh>
        <cylinderGeometry args={[0.01, 0.01, 6, 8]} />
        <meshBasicMaterial color="#ffffff" opacity={0.2} transparent />
      </mesh>
    </group>
  );
};

// --- MAIN COMPONENT ---

enum Phase {
  DISCUSSION = 'DISCUSSION',
  PHASE1 = 'PHASE1', // From Flashlight to Sun/Earth
  PHASE2 = 'PHASE2', // Rotation without Tilt
  PHASE3 = 'PHASE3', // Tilt + Rotation
  PHASE4 = 'PHASE4', // Orbit Simulator
  FINISHED = 'FINISHED'
}

enum SubPhase4 {
  SPRING = 'SPRING',
  WINTER = 'WINTER',
  SUMMER = 'SUMMER',
  AUTUMN = 'AUTUMN'
}

interface TiltOrbitExplorerProps {
  mode: GameMode;
  onNavigateToSolarSystem?: () => void;
  setStage: (stage: string) => void;
}

const TiltOrbitExplorer: React.FC<TiltOrbitExplorerProps> = ({ mode, onNavigateToSolarSystem, setStage }) => {
  const [phase, setPhase] = useState<Phase>(mode === GameMode.SOLO ? Phase.PHASE1 : Phase.DISCUSSION);
  const [feedback, setFeedback] = useState<{ text: string, type: 'success' | 'error' | 'hint' } | null>(null);
  const [subPhase4, setSubPhase4] = useState<SubPhase4>(SubPhase4.SUMMER);
  const [orbitDate, setOrbitDate] = useState('2026-06-21');
  const [taskIndex, setTaskIndex] = useState(0);
  const [dateError, setDateError] = useState<string | null>(null);
  const [poleRotation, setPoleRotation] = useState(0); // -PI/2 to PI/2

  useEffect(() => {
    switch (phase) {
      case Phase.DISCUSSION: setStage('Discussion'); break;
      case Phase.PHASE1: setStage('Part 1: Day & Night'); break;
      case Phase.PHASE2: setStage('Part 2: Summer in Finland'); break;
      case Phase.PHASE3: setStage('Part 3: Revolution'); break;
      case Phase.PHASE4: setStage('Orbit Simulator'); break;
      case Phase.FINISHED: setStage('Mission Complete'); break;
    }
  }, [phase, setStage]);

  // Finland Data
  const getFinlandData = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Approximate data for Finland (Oulu/Helsinki average)
    if ((month === 6 && day >= 20) || month === 7 || month === 8 || (month === 9 && day < 20)) {
      return {
        daylight: "19h - 24h",
        temp: "15°C to 25°C",
        nature: "Green trees, flowers, bright days",
        dist: "152 million km (Aphelion)"
      };
    } else if ((month === 12 && day >= 20) || month === 1 || month === 2 || (month === 3 && day < 20)) {
      return {
        daylight: "0h - 6h",
        temp: "-5°C to -20°C",
        nature: "Snowy, dark, Kaamos (Polar Night)",
        dist: "147 million km (Perihelion)"
      };
    } else if ((month === 3 && day >= 20) || month === 4 || month === 5 || (month === 6 && day < 20)) {
      return {
        daylight: "12h - 18h",
        temp: "0°C to 10°C",
        nature: "Snow melting, flowers coming soon",
        dist: "149 million km"
      };
    } else {
      return {
        daylight: "12h - 8h",
        temp: "5°C to 12°C",
        nature: "Leaves falling, colorful nature",
        dist: "150 million km"
      };
    }
  };

  const finlandData = useMemo(() => getFinlandData(orbitDate), [orbitDate]);

  // Task validation
  const validateDateForTask = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();

    if (taskIndex === 1) { // Winter task
      const isWinter = (month === 12) || (month === 1) || (month === 2);
      if (!isWinter) {
        setDateError("Ops, make sure you type in a date during winter time in Finland");
        return false;
      }
    } else if (taskIndex === 2) { // Equinox task
      const isSpringEq = (month === 3 && day >= 19 && day <= 22);
      const isAutumnEq = (month === 9 && day >= 21 && day <= 24);
      if (!isSpringEq && !isAutumnEq) {
        setDateError("Ops, make sure the dates are matching the actual Equinox you want to find");
        return false;
      }
    }
    setDateError(null);
    return true;
  };

  const handleChoice = (correct: boolean, successText: string, errorText: string, nextPhase?: Phase) => {
    if (correct) {
      setFeedback({ text: successText, type: 'success' });
      if (nextPhase) {
        setTimeout(() => {
          setPhase(nextPhase);
          setFeedback(null);
        }, 2000);
      }
    } else {
      setFeedback({ text: errorText, type: 'error' });
    }
  };

  const renderGuruBubble = (text: string) => (
    <div className="flex items-start space-x-4 bg-space-800/90 p-4 rounded-2xl border border-neon-blue/30 animate-fade-in">
      <img 
        src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
        alt="Astronaut" 
        className="w-12 h-12 shrink-0"
        referrerPolicy="no-referrer"
      />
      <p className="text-gray-200 italic leading-relaxed">"{text}"</p>
    </div>
  );

  const renderPhaseContent = () => {
    switch (phase) {
      case Phase.DISCUSSION:
        return (
          <div className="space-y-8 max-w-2xl mx-auto">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-white">Step 1 – Talk about seasons, light, and darkness</h2>
              <div className="glass-panel p-6 rounded-xl space-y-6 text-left">
                <section>
                  <h3 className="text-neon-pink font-bold flex items-center mb-2">
                    <Users className="mr-2" size={20} /> What’s your favorite season?
                  </h3>
                  <p className="text-gray-300 ml-7 italic">Turn to your classmates and share: "What’s your favorite season?" "How does it look like?" (snow, rain, green trees, flowers, etc.)</p>
                </section>
                <section>
                  <h3 className="text-neon-blue font-bold flex items-center mb-2">
                    <Calendar className="mr-2" size={20} /> Daylight and your birthday
                  </h3>
                  <p className="text-gray-300 ml-7 italic">Think about your birthday each year: "How long is the daylight during your birthday every year?" "What about the temperature?"</p>
                </section>
                <section>
                  <h3 className="text-neon-green font-bold flex items-center mb-2">
                    <Info className="mr-2" size={20} /> Explaining dark winters and bright summers
                  </h3>
                  <p className="text-gray-300 ml-7 italic">In your group, discuss: "Can you imagine an explanation about why winters are dark and cold and summers are hot and bright?"</p>
                </section>
              </div>
            </div>
            {renderGuruBubble("Winter and summer feel so different… but the Sun is the same star. Let’s uncover what the Earth is doing!")}
            <button 
              onClick={() => setPhase(Phase.PHASE1)}
              className="w-full py-4 bg-neon-blue text-white font-bold rounded-xl hover:bg-neon-blue/80 transition-all flex items-center justify-center group"
            >
              Start Exploration Mission
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        );

      case Phase.PHASE1:
        return (
          <div className="grid lg:grid-cols-2 gap-8 h-full">
            <div className="flex flex-col space-y-6">
              {/* Mission Task Box */}
              <div className="glass-panel p-6 rounded-xl border-l-4 border-neon-purple">
                <h3 className="font-bold text-neon-purple text-sm mb-2 uppercase tracking-wider">Mission Task</h3>
                <p className="text-white">
                  “Alright, now that you saw how the heating flashlight influenced the temperature on the surface and on the ball, let's replace the flashlight by the Sun and the ball by the Earth. Reflect with your peers, with the teacher, or alone based on our cool astronaut questions. Then choose what to do next!”
                </p>
              </div>

              {/* Reflect with me Box */}
              <div className="glass-panel p-6 rounded-xl border-l-4 border-neon-blue">
                <div className="flex items-center gap-3 mb-3">
                  <img 
                    src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
                    alt="Astronaut" 
                    className="w-10 h-10"
                    referrerPolicy="no-referrer"
                  />
                  <h3 className="font-bold text-neon-blue text-sm uppercase tracking-wider">Reflect with me</h3>
                </div>
                <div className="text-sm text-gray-300 italic space-y-2">
                  <p>“Looking at the Earth right now, are all parts receiving sunlight?”</p>
                  <p>“Is this how our world works, or do we have variations of light during the day?”</p>
                  <p>“Is night or day in Finland at the moment?”</p>
                  <p>“What could you choose to make the days happen for everyone in the globe?”</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid gap-3">
                  <button 
                    onClick={() => handleChoice(false, "", "not quite, but it would be interesting to see the results of those movements in real life... try again and choose the option that will bring the days back to all parts of Earth.")}
                    className="p-4 rounded-xl border border-white/10 hover:bg-white/5 text-left transition-all"
                  >
                    Move Sun side to side
                  </button>
                  <button 
                    onClick={() => handleChoice(false, "", "not quite, but it would be interesting to see the results of those movements in real life... try again and choose the option that will bring the days back to all parts of Earth.")}
                    className="p-4 rounded-xl border border-white/10 hover:bg-white/5 text-left transition-all"
                  >
                    Move Earth up and down
                  </button>
                  <button 
                    onClick={() => handleChoice(true, "Good job! Rotation is the key for us to have nights and days everywhere!", "", Phase.PHASE2)}
                    className="p-4 rounded-xl border border-neon-blue/50 bg-neon-blue/10 hover:bg-neon-blue/20 text-left transition-all"
                  >
                    Spin the Earth around itself
                  </button>
                </div>
              </div>
              {feedback && (
                <div className={`p-4 rounded-xl flex items-center space-x-3 ${feedback.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
                  {feedback.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  <p>{feedback.text}</p>
                </div>
              )}
            </div>
            <div className="relative h-[400px] lg:h-full bg-black/40 rounded-2xl overflow-hidden border border-white/5">
              <div className="absolute top-4 right-4 z-10 bg-black/60 px-3 py-1 rounded-full text-[10px] font-bold text-[#39FF14] border border-[#39FF14]/30">
                Green point is Finland
              </div>
              
              {/* Horizontal Pole Control */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 w-full max-w-xs">
                <span className="text-[10px] font-bold text-white/50 uppercase mb-1">Move here to see the poles</span>
                <div className="flex items-center bg-white/5 rounded-full p-4 border border-white/10 w-full justify-between">
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
                <PerspectiveCamera makeDefault position={[0, 5, 25]} />
                <Sun position={[12, 0, 0]} />
                <Earth position={[-8, 0, 0]} rotationActive={false} tiltActive={false} revolutionActive={false} showFinland={true} poleRotation={poleRotation} sunPos={[12, 0, 0]} />
                <OrbitControls 
                  enableZoom={true} 
                  enablePan={false}
                  enableRotate={false}
                />
              </Canvas>
            </div>
          </div>
        );

      case Phase.PHASE2:
        return (
          <div className="grid lg:grid-cols-2 gap-8 h-full">
            <div className="flex flex-col space-y-6">
              {/* Mission Task Box */}
              <div className="glass-panel p-6 rounded-xl border-l-4 border-neon-pink">
                <h3 className="font-bold text-neon-pink text-sm mb-2 uppercase tracking-wider">Mission Task</h3>
                <p className="text-white">
                  “Wohoo! Days are back for everyone, baby! But... I wish it was Summer in Finland with those very long and bright days... Talk to your peers and teacher, or reflect by yourself again to see if you can help me out on this one. Please!”
                </p>
              </div>

              {/* Reflect with me Box */}
              <div className="glass-panel p-6 rounded-xl border-l-4 border-neon-blue">
                <div className="flex items-center gap-3 mb-3">
                  <img 
                    src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
                    alt="Astronaut" 
                    className="w-10 h-10"
                    referrerPolicy="no-referrer"
                  />
                  <h3 className="font-bold text-neon-blue text-sm uppercase tracking-wider">Reflect with me</h3>
                </div>
                <div className="text-sm text-gray-300 italic space-y-2">
                  <p>“Hmm, what can we do to have very long days in Finland?”</p>
                  <p>“Can you think of which option below is the key, in the real universe, to bring Summer in?”</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid gap-3">
                  <button 
                    onClick={() => handleChoice(false, "", "not quite, but it would be interesting to see the results of those movements in real life... try again and choose the option that will cause Summer in Finland")}
                    className="p-4 rounded-xl border border-white/10 hover:bg-white/5 text-left transition-all"
                  >
                    Move the Sun over to the North Pole
                  </button>
                  <button 
                    onClick={() => handleChoice(true, "Yes! Tilting teh Earth is the key for us to have more light in Finland!", "", Phase.PHASE3)}
                    className="p-4 rounded-xl border border-neon-pink/50 bg-neon-pink/10 hover:bg-neon-pink/20 text-left transition-all"
                  >
                    Lean the North Pole towards the Sun
                  </button>
                  <button 
                    onClick={() => handleChoice(false, "", "not quite, but it would be interesting to see the results of those movements in real life... try again and choose the option that will cause Summer in Finland")}
                    className="p-4 rounded-xl border border-white/10 hover:bg-white/5 text-left transition-all"
                  >
                    Spin the Earth faster to have sunlight more times
                  </button>
                </div>
              </div>
              {feedback && (
                <div className={`p-4 rounded-xl flex items-center space-x-3 ${feedback.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
                  {feedback.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  <p>{feedback.text}</p>
                </div>
              )}
            </div>
            <div className="relative h-[400px] lg:h-full bg-black/40 rounded-2xl overflow-hidden border border-white/5">
              <div className="absolute top-4 right-4 z-10 bg-black/60 px-3 py-1 rounded-full text-[10px] font-bold text-[#39FF14] border border-[#39FF14]/30">
                Green point is Finland
              </div>

              {/* Horizontal Pole Control */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 w-full max-w-xs">
                <span className="text-[10px] font-bold text-white/50 uppercase mb-1">Move here to see the poles</span>
                <div className="flex items-center bg-white/5 rounded-full p-4 border border-white/10 w-full justify-between">
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
                <PerspectiveCamera makeDefault position={[0, 5, 25]} />
                <Sun position={[12, 0, 0]} />
                <Earth position={[-8, 0, 0]} rotationActive={true} tiltActive={true} revolutionActive={false} showFinland={true} poleRotation={poleRotation} sunPos={[12, 0, 0]} />
                <OrbitControls 
                  enableZoom={true} 
                  enablePan={false}
                  enableRotate={false}
                />
              </Canvas>
            </div>
          </div>
        );

      case Phase.PHASE3:
        return (
          <div className="grid lg:grid-cols-2 gap-8 h-full">
            <div className="flex flex-col space-y-6">
              {/* Mission Task Box */}
              <div className="glass-panel p-6 rounded-xl border-l-4 border-neon-green">
                <h3 className="font-bold text-neon-green text-sm mb-2 uppercase tracking-wider">Mission Task</h3>
                <p className="text-white">
                  “Get your sunglasses because Summer arrived to Finland! Thank you for solving this! Take a look at both poles and compare them while you reflect on the questions by yourself or with yur teacher and peers.”
                </p>
              </div>

              {/* Reflect with me Box */}
              <div className="glass-panel p-6 rounded-xl border-l-4 border-neon-blue">
                <div className="flex items-center gap-3 mb-3">
                  <img 
                    src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
                    alt="Astronaut" 
                    className="w-10 h-10"
                    referrerPolicy="no-referrer"
                  />
                  <h3 className="font-bold text-neon-blue text-sm uppercase tracking-wider">Reflect with me</h3>
                </div>
                <div className="text-sm text-gray-300 italic space-y-2">
                  <p>“What is different between both poles?”</p>
                  <p>“Which season would be in the South Pole at the moment?”</p>
                  <p>“Is it always like this the whole year?”</p>
                  <p>“What can you do to make Summer possible for people in the South Pole at least for part of the year?”</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid gap-3">
                  <button 
                    onClick={() => handleChoice(false, "", "not quite, but it would be interesting to be able to move the Sun in real life... try again and choose the option that will evenly share Summer for both poles")}
                    className="p-4 rounded-xl border border-white/10 hover:bg-white/5 text-left transition-all"
                  >
                    Move the Sun over to the South Pole
                  </button>
                  <button 
                    onClick={() => handleChoice(false, "", "I wish it was that simple, but Earth has a fixed tilt... try again and choose the option that will evenly share Summer for both poles")}
                    className="p-4 rounded-xl border border-white/10 hover:bg-white/5 text-left transition-all"
                  >
                    Lean the South Pole towards the Sun
                  </button>
                  <button 
                    onClick={() => handleChoice(true, "Great choice! Revolution is the key for both poles to have the chance for a nice Summer!", "", Phase.PHASE4)}
                    className="p-4 rounded-xl border border-neon-green/50 bg-neon-green/10 hover:bg-neon-green/20 text-left transition-all"
                  >
                    Revolve the Earth around the Sun
                  </button>
                </div>
              </div>
              {feedback && (
                <div className={`p-4 rounded-xl flex items-center space-x-3 ${feedback.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
                  {feedback.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  <p>{feedback.text}</p>
                </div>
              )}
            </div>
            <div className="relative h-[400px] lg:h-full bg-black/40 rounded-2xl overflow-hidden border border-white/5">
              <div className="absolute top-4 right-4 z-10 bg-black/60 px-3 py-1 rounded-full text-[10px] font-bold text-[#39FF14] border border-[#39FF14]/30">
                Green point is Finland
              </div>

              {/* Horizontal Pole Control */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 w-full max-w-xs">
                <span className="text-[10px] font-bold text-white/50 uppercase mb-1">Move here to see the poles</span>
                <div className="flex items-center bg-white/5 rounded-full p-4 border border-white/10 w-full justify-between">
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
                <PerspectiveCamera makeDefault position={[0, 5, 25]} />
                <Sun position={[12, 0, 0]} />
                <Earth position={[-8, 0, 0]} rotationActive={true} tiltActive={true} revolutionActive={false} showFinland={true} poleRotation={poleRotation} sunPos={[12, 0, 0]} />
                <OrbitControls 
                  enableZoom={true} 
                  enablePan={false}
                  enableRotate={false}
                />
              </Canvas>
            </div>
          </div>
        );

      case Phase.PHASE4:
        return (
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
                      Finland Pinpointed
                    </div>
                  </div>
                  
                  <Canvas>
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
                      const angle = ((dayOfYear - 80) / 365) * 2 * Math.PI;
                      
                      const x = -ORBIT_OFFSET + ORBIT_A * Math.cos(angle);
                      const z = ORBIT_B * Math.sin(angle);

                      return (
                        <>
                          <lineLoop geometry={geometry}>
                            <lineBasicMaterial color="#ffffff" opacity={0.1} transparent />
                          </lineLoop>
                          <Earth position={[x, 0, z]} rotationActive={true} tiltActive={true} revolutionActive={true} showFinland={true} />
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
                    <PerspectiveCamera makeDefault position={[0, 5, 25]} />
                    <ambientLight intensity={0.1} />
                    {(() => {
                      const date = new Date(orbitDate);
                      const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
                      const angle = ((dayOfYear - 80) / 365) * 2 * Math.PI;
                      
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
                    <OrbitControls enableZoom={true} enablePan={false} enableRotate={false} />
                  </Canvas>
                </div>
              </div>

              {/* Right Column: UI Controls */}
              <div className="space-y-4 overflow-y-auto pr-2">
                {/* Mission Task Box */}
                <div className="glass-panel p-4 rounded-xl border-l-4 border-neon-green">
                  <h3 className="font-bold text-neon-green text-sm mb-2 uppercase tracking-wider">Mission Task</h3>
                  <div className="text-sm text-gray-200">
                    {taskIndex === 0 && <p>“Here we still see Summer time in Finland. Just observe for a moment and answer the reflective questions to yourself or in group”</p>}
                    {taskIndex === 1 && <p>“Now let's make our way to Winter in Finland. Type in any date when you remember a very long night in the year”</p>}
                    {taskIndex === 2 && <p>“Now, explore a little more and find the Equinoxes. If you don't know what they are, just make a quick search on your book or online”</p>}
                    {taskIndex === 3 && <p>“Great job! Now, reflect on the harder stuff... You can talk to your teacher, peers, or do an online search!”</p>}
                  </div>
                </div>

                {/* Reflect with me Box */}
                <div className="glass-panel p-4 rounded-xl border-l-4 border-neon-blue">
                  <div className="flex items-center gap-3 mb-3">
                    <img 
                      src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
                      alt="Astronaut" 
                      className="w-8 h-8"
                      referrerPolicy="no-referrer"
                    />
                    <h3 className="font-bold text-neon-blue text-sm uppercase tracking-wider">Reflect with me</h3>
                  </div>
                  <div className="text-sm text-gray-300 italic space-y-3">
                    {taskIndex === 0 && <p>“What do you notice? Is the Earth closer or farther away from the Sun?”</p>}
                    {taskIndex === 1 && <p>“Nice! What do you notice now? Is the Earth farther or closer to the Sun?”</p>}
                    {taskIndex === 2 && (
                      <div className="space-y-2">
                        <p>“What do you notice during Spring and Autumn times in Finland?”</p>
                        <p>“What is the day vs night relationship on average?”</p>
                        <p>“What is the distance from Earth to the Sun?”</p>
                      </div>
                    )}
                    {taskIndex === 3 && (
                      <div className="space-y-3">
                        <p>“I see you are becoming a professional in astros! I will challenge you with harder reflective questions, but I think you can do it:”</p>
                        <ul className="list-disc ml-4 space-y-2 not-italic">
                          <li>“If the Earth is closer to the Sun during winter times, why is it colder in Finland? What is actually causing the seasons?”</li>
                          <li>“If you were somewhere in the Southern Hemisphere, what would change regarding seasons?”</li>
                          <li>“How can you differentiate Autumn from Spring by just looking at the orbit position? Is it possible? What else must you consider?”</li>
                        </ul>
                        <p className="mt-4 font-bold text-white not-italic">Once you are done with all reflective questions, you can move to our Solar System View tile!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Select Date Box */}
                {(taskIndex === 1 || taskIndex === 2) && (
                  <div className="glass-panel p-4 rounded-xl border-l-4 border-neon-purple">
                    <h3 className="font-bold text-neon-purple text-sm mb-3 uppercase tracking-wider">Select Date</h3>
                    <input 
                      type="date" 
                      value={orbitDate}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        if (validateDateForTask(newDate)) {
                          setOrbitDate(newDate);
                        }
                      }}
                      className="w-full bg-space-900 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-neon-blue outline-none"
                    />
                    {dateError && (
                      <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle size={12} /> {dateError}
                      </div>
                    )}
                  </div>
                )}

                {/* Data Display Box */}
                <div className="glass-panel p-4 rounded-xl border-l-4 border-neon-pink">
                  <h3 className="font-bold text-neon-pink text-sm mb-3 uppercase tracking-wider">Finland Data</h3>
                  <div className="grid grid-cols-1 gap-2 text-xs">
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

                {/* Navigation */}
                <div className="pt-2">
                  {taskIndex < 3 ? (
                    <button 
                      onClick={() => {
                        setTaskIndex(prev => prev + 1);
                        setDateError(null);
                        // Set default dates for next tasks
                        if (taskIndex === 0) setOrbitDate('2026-12-21');
                        if (taskIndex === 1) setOrbitDate('2026-03-21');
                      }}
                      className="w-full py-3 bg-neon-blue text-white font-bold rounded-xl hover:bg-neon-blue/80 transition-all flex items-center justify-center group"
                    >
                      Next Mission Task
                      <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <button 
                        onClick={() => setPhase(Phase.FINISHED)}
                        className="w-full py-3 bg-neon-green text-black font-bold rounded-xl hover:bg-neon-green/80 transition-all"
                      >
                        Complete Mission
                      </button>
                      {onNavigateToSolarSystem && (
                        <button 
                          onClick={onNavigateToSolarSystem}
                          className="w-full py-3 bg-neon-blue/20 text-neon-blue border border-neon-blue/50 font-bold rounded-xl hover:bg-neon-blue/30 transition-all flex items-center justify-center"
                        >
                          <Globe className="mr-2" size={18} /> Go to Solar System View
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case Phase.FINISHED:
        return (
          <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
            <div className="inline-flex p-4 bg-neon-green/10 rounded-full mb-4">
              <CheckCircle2 size={64} className="text-neon-green" />
            </div>
            <h2 className="text-4xl font-bold text-white">Mission Accomplished!</h2>
            <div className="glass-panel p-8 rounded-2xl space-y-4 text-left">
              <p className="text-xl text-gray-300">You have now:</p>
              <ul className="space-y-3">
                <li className="flex items-center text-neon-blue">
                  <RotateCw className="mr-3" size={20} /> Used rotation to create day and night.
                </li>
                <li className="flex items-center text-neon-pink">
                  <Move className="mr-3" size={20} /> Used tilt to create longer and shorter days in different places.
                </li>
                <li className="flex items-center text-neon-green">
                  <Globe className="mr-3" size={20} /> Used revolution to see how seasons change around the year.
                </li>
              </ul>
              <p className="text-lg text-white mt-6 font-bold">“Now you’re ready to see all of this happening in real space, with more planets!”</p>
            </div>
            {renderGuruBubble("Great job, space explorer! Now let’s see all this happening in the whole solar system, with all the planets. Are you ready to become a cool astronaut like me?")}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.reload()} 
                className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
              >
                Back to Dashboard
              </button>
              {onNavigateToSolarSystem && (
                <button 
                  onClick={onNavigateToSolarSystem}
                  className="px-8 py-4 bg-neon-blue text-white font-bold rounded-xl hover:bg-neon-blue/80 transition-all shadow-[0_0_20px_rgba(0,255,255,0.3)] flex items-center"
                >
                  <Globe className="mr-2" size={20} /> Go to Solar System View
                </button>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full flex flex-col p-4 md:p-8 overflow-y-auto">
      {renderPhaseContent()}
    </div>
  );
};

export default TiltOrbitExplorer;
