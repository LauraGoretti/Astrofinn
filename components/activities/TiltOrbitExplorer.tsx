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
  
  // Transform normal to View Space
  vNormal = normalize(normalMatrix * normal); 
  
  // Calculate Position in View Space
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  
  // View Direction (Camera is at 0,0,0 in View Space)
  vViewDir = normalize(-mvPosition.xyz);
  
  // Calculate Sun Direction in View Space
  vec4 sunViewPos = viewMatrix * vec4(sunPosition, 1.0);
  vSunDir = normalize(sunViewPos.xyz - mvPosition.xyz);
  
  gl_Position = projectionMatrix * mvPosition;
}
`;

const earthFragmentShader = `
uniform sampler2D dayTexture;
uniform sampler2D nightTexture;
uniform sampler2D specularMapTexture;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSunDir;
varying vec3 vViewDir;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 sunDir = normalize(vSunDir);
  vec3 viewDir = normalize(vViewDir);

  float dotProd = dot(normal, sunDir);
  
  // Softer terminator (Twilight zone)
  float dayFactor = smoothstep(-0.2, 0.2, dotProd);

  vec3 dayColor = texture2D(dayTexture, vUv).rgb;
  vec3 nightColorSample = texture2D(nightTexture, vUv).rgb;
  float specularStrength = texture2D(specularMapTexture, vUv).r;
  
  float diffuse = max(dotProd, 0.0);
  
  // Blinn-Phong Specular Reflection
  vec3 halfVector = normalize(sunDir + viewDir);
  float NdotH = max(dot(normal, halfVector), 0.0);
  
  // HIGHER SHININESS (80.0) -> Much smaller, tighter reflection, simulating sun glint on water
  float specular = pow(NdotH, 80.0) * specularStrength;
  
  // LOWER INTENSITY (0.8) -> Subtle, realistic shine, not overpowering
  vec3 specularColor = vec3(1.0, 0.95, 0.8) * specular * 0.8;
  
  vec3 finalDay = dayColor * (diffuse + 0.1) + specularColor; 
  vec3 cleanNight = max(nightColorSample - 0.2, 0.0);
  vec3 finalNight = cleanNight * vec3(6.0, 4.5, 3.0); 
  
  // Sunset / Atmosphere scattering at terminator
  float sunsetIntensity = 1.0 - smoothstep(0.0, 0.25, abs(dotProd));
  vec3 sunsetColor = vec3(0.9, 0.4, 0.1) * sunsetIntensity * 0.6 * (1.0 - specularStrength);

  vec3 finalColor = mix(finalNight, finalDay, dayFactor);
  finalColor += sunsetColor;
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

const atmosphereVertexShader = `
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const atmosphereFragmentShader = `
varying vec3 vNormal;
void main() {
  float viewDot = dot(vNormal, vec3(0, 0, 1.0));
  float intensity = pow(clamp(1.0 + viewDot, 0.0, 1.0), 4.0);
  vec3 atmosphereColor = vec3(0.3, 0.6, 1.0);
  gl_FragColor = vec4(atmosphereColor, 1.0) * intensity * 0.15;
}
`;

const sunAtmosphereFragmentShader = `
varying vec3 vNormal;
void main() {
  vec3 normal = normalize(vNormal);
  float viewDot = dot(normal, vec3(0.0, 0.0, 1.0));
  float intensity = pow(1.0 - viewDot, 4.5);
  gl_FragColor = vec4(1.0, 0.7, 0.3, 0.25) * intensity;
}
`;

const haloVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const haloFragmentShader = `
uniform float uTime;
varying vec2 vUv;
void main() {
  vec2 center = vec2(0.5, 0.5);
  vec2 pos = vUv - center;
  float dist = length(pos) * 2.0; 
  float glow = 0.05 / (dist - 0.15) - 0.1;
  glow = clamp(glow, 0.0, 1.0);
  float angle = atan(pos.y, pos.x);
  float rays = sin(angle * 24.0 + uTime * 0.5) * 0.1 + 
               sin(angle * 12.0 - uTime * 0.2) * 0.2 + 0.8;
  float intensity = glow * rays;
  intensity = pow(intensity, 1.5);
  vec3 coreColor = vec3(1.0, 0.95, 0.8);
  vec3 midColor = vec3(1.0, 0.6, 0.1);
  vec3 edgeColor = vec3(0.8, 0.2, 0.0);
  vec3 finalColor = mix(edgeColor, midColor, intensity);
  finalColor = mix(finalColor, coreColor, smoothstep(0.6, 1.0, intensity));
  float alpha = intensity * smoothstep(1.0, 0.2, dist);
  gl_FragColor = vec4(finalColor, alpha);
}
`;

// --- BACKGROUND ---

const ParallaxStars = () => {
  const count = 2500;
  
  const [positions, sizes, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    
    for(let i=0; i<count; i++) {
        const r = 800 + Math.random() * 3700; 
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i*3+2] = r * Math.cos(phi);
        
        sizes[i] = 20.0 + Math.random() * 40.0; 
        
        const type = Math.random();
        if(type > 0.9) color.setHex(0xffaaaa);
        else if(type > 0.7) color.setHex(0xaaccff);
        else color.setHex(0xffffff);
        
        colors[i*3] = color.r;
        colors[i*3+1] = color.g;
        colors[i*3+2] = color.b;
    }
    return [positions, sizes, colors];
  }, []);

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
        pixelRatio: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 2.0 }
    },
    vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float pixelRatio;
        
        void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * pixelRatio * (150.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        varying vec3 vColor;
        void main() {
            vec2 coord = gl_PointCoord - vec2(0.5);
            float dist = length(coord);
            if (dist > 0.5) discard;
            float strength = 1.0 - (dist * 2.0);
            strength = pow(strength, 2.0);
            gl_FragColor = vec4(vColor, strength);
        }
    `,
    transparent: true,
    vertexColors: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }), []);

  return (
    <points frustumCulled={false}>
        <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
            <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
            <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        </bufferGeometry>
        <primitive object={material} attach="material" />
    </points>
  )
}

const StarBackground = () => {
  const texture = useLoader(THREE.TextureLoader, `${TEXTURE_BASE_URL}stars_milky_way.jpg`);
  
  return (
    <group>
        <mesh renderOrder={-1}>
          <sphereGeometry args={[4800, 64, 64]} />
          <meshBasicMaterial 
            map={texture} 
            side={THREE.BackSide} 
            toneMapped={false}
            color="#cccccc" 
            transparent
            opacity={1.0}
            depthWrite={false}
          />
        </mesh>
        <ParallaxStars />
    </group>
  );
};

// --- 3D COMPONENTS ---

const Sun = ({ position }: { position: [number, number, number] }) => {
  const sunTexture = useLoader(THREE.TextureLoader, `${TEXTURE_BASE_URL}sun.jpg`);
  const meshRef = useRef<THREE.Mesh>(null);
  const haloMaterialRef = useRef<THREE.ShaderMaterial>(null);

  const haloUniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  useFrame((state, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.002;
    if (haloMaterialRef.current) haloMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[4, 32, 32]} />
        <meshBasicMaterial map={sunTexture} color={[1.5, 1.5, 1.5]} toneMapped={false} />
      </mesh>
      <mesh scale={[1.15, 1.15, 1.15]}>
        <sphereGeometry args={[4, 32, 32]} />
        <shaderMaterial
          vertexShader={atmosphereVertexShader}
          fragmentShader={sunAtmosphereFragmentShader}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          transparent={true}
          depthWrite={false}
        />
      </mesh>
      <sprite scale={[4 * 4, 4 * 4, 1]}>
        <shaderMaterial
          ref={haloMaterialRef}
          vertexShader={haloVertexShader}
          fragmentShader={haloFragmentShader}
          uniforms={haloUniforms}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <pointLight intensity={2} distance={100} decay={1} color="#fffaed" />
    </group>
  );
};

// --- CAMERA FOLLOWER ---
const OrbitCameraFollower = ({ target }: { target: [number, number, number] }) => {
  const { camera, controls } = useThree();
  const prevTarget = useRef(new THREE.Vector3(...target));
  const isFirstFrame = useRef(true);

  useFrame(() => {
    const newTarget = new THREE.Vector3(...target);
    
    if (isFirstFrame.current) {
      // Initial position relative to Earth
      camera.position.set(newTarget.x, newTarget.y + 20, newTarget.z + 40);
      if (controls) (controls as any).target.copy(newTarget);
      prevTarget.current.copy(newTarget);
      isFirstFrame.current = false;
      return;
    }

    const delta = new THREE.Vector3().subVectors(newTarget, prevTarget.current);
    if (delta.lengthSq() > 0.00001) {
      // Move camera and target by the same delta to follow Earth while preserving zoom
      camera.position.add(delta);
      if (controls) {
        (controls as any).target.add(delta);
      }
      prevTarget.current.copy(newTarget);
    }
  });

  return null;
};

const getLatLonPosition = (lat: number, lon: number, radius: number) => {
  const latRad = lat * (Math.PI / 180);
  const lonRad = (lon + 180) * (Math.PI / 180); // Offset by 180 to align with texture center at u=0.5
  const x = radius * Math.cos(latRad) * Math.sin(lonRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.cos(lonRad);
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
  const [dayTexture, nightTexture, specularMapTexture, cloudsTexture] = useLoader(THREE.TextureLoader, [
    `${TEXTURE_BASE_URL}earth_day.jpg`,
    `${TEXTURE_BASE_URL}earth_night.jpg`,
    `${TEXTURE_BASE_URL}earth_specular.jpg`,
    `${TEXTURE_BASE_URL}earth_clouds.jpg`
  ]);

  const earthGroupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const AXIAL_TILT = 23.5 * (Math.PI / 180);

  useFrame((state, delta) => {
    if (rotationActive && earthGroupRef.current) {
      earthGroupRef.current.rotation.y += delta * 0.5;
    }
    if (materialRef.current) {
      materialRef.current.uniforms.sunPosition.value.set(...sunPos);
    }
  });

  // --- MANUAL COORDINATE ADJUSTMENT ---
  // To change the pinpoint position, edit the values below:
  // Latitude: Positive for North, Negative for South (e.g., 60.17 for Helsinki)
  // Longitude: Positive for East, Negative for West (e.g., 24.94 for Helsinki)
  // File to edit: /components/activities/TiltOrbitExplorer.tsx
  const HELSINKI_LAT = 60.17;
  const HELSINKI_LON = -64.94;
  
  const finlandPos = useMemo(() => 
    getLatLonPosition(HELSINKI_LAT, HELSINKI_LON, 2.05) as [number, number, number],
    []
  );

  return (
    <group position={position}>
      <group rotation={[poleRotation, 0, 0]}>
        <group rotation={[0, 0, tiltActive ? -AXIAL_TILT : 0]}>
          <group ref={earthGroupRef} rotation={[0, Math.PI, 0]}>
            <mesh>
              <sphereGeometry args={[2, 64, 64]} />
              <shaderMaterial
                ref={materialRef}
                vertexShader={earthVertexShader}
                fragmentShader={earthFragmentShader}
                uniforms={{
                  dayTexture: { value: dayTexture },
                  nightTexture: { value: nightTexture },
                  specularMapTexture: { value: specularMapTexture },
                  sunPosition: { value: new THREE.Vector3(...sunPos) }
                }}
              />
              {showFinland && (
                <group position={finlandPos}>
                  <mesh>
                    <sphereGeometry args={[0.06, 16, 16]} />
                    <meshBasicMaterial color="#39FF14" />
                  </mesh>
                </group>
              )}
            </mesh>
            
            {/* Cloud Layer */}
            <mesh scale={[1.02, 1.02, 1.02]}>
              <sphereGeometry args={[2, 64, 64]} />
              <meshLambertMaterial 
                map={cloudsTexture} 
                transparent={true} 
                opacity={0.4} 
                blending={THREE.AdditiveBlending} 
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>

            {/* Atmosphere Mesh */}
            <mesh scale={[1.045, 1.045, 1.045]}>
              <sphereGeometry args={[2, 64, 64]} />
              <shaderMaterial
                vertexShader={atmosphereVertexShader}
                fragmentShader={atmosphereFragmentShader}
                blending={THREE.AdditiveBlending}
                side={THREE.BackSide}
                transparent={true}
                depthWrite={false}
              />
            </mesh>
          </group>
          {/* Axis Line */}
          <mesh>
            <cylinderGeometry args={[0.01, 0.01, 6, 8]} />
            <meshBasicMaterial color="#ffffff" opacity={0.2} transparent />
          </mesh>
        </group>
      </group>
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
  onHome?: () => void;
  setStage: (stage: string) => void;
  setBackIntercept?: (intercept: { handler: () => boolean } | null) => void;
}

const TiltOrbitExplorer: React.FC<TiltOrbitExplorerProps> = ({ mode, onNavigateToSolarSystem, onHome, setStage, setBackIntercept }) => {
  const [phase, setPhase] = useState<Phase>(mode === GameMode.SOLO ? Phase.PHASE1 : Phase.DISCUSSION);
  const [feedback, setFeedback] = useState<{ text: string, type: 'success' | 'error' | 'hint' } | null>(null);
  const [orbitDate, setOrbitDate] = useState('2026-06-21');
  const [poleRotation, setPoleRotation] = useState(0); // -PI/2 to PI/2
  const [tasksCompleted, setTasksCompleted] = useState([false, false, false, false, false]);
  const allTasksCompleted = tasksCompleted.every(Boolean);

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

  useEffect(() => {
    if (setBackIntercept) {
      setBackIntercept({
        handler: () => {
          if (phase === Phase.PHASE4) {
            setPhase(Phase.PHASE3);
            return true;
          }
          if (phase === Phase.PHASE3) {
            setPhase(Phase.PHASE2);
            return true;
          }
          if (phase === Phase.PHASE2) {
            setPhase(Phase.PHASE1);
            return true;
          }
          if (phase === Phase.PHASE1 && mode === GameMode.GROUP) {
            setPhase(Phase.DISCUSSION);
            return true;
          }
          return false;
        }
      });
    }
    return () => {
      if (setBackIntercept) setBackIntercept(null);
    };
  }, [phase, mode, setBackIntercept]);

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

  const finlandData = useMemo(() => getFinlandData(orbitDate), [orbitDate]);

  const handleChoice = (correct: boolean, successText: string, errorText: string, nextPhase?: Phase) => {
    if (correct) {
      setFeedback({ text: successText, type: 'success' });
      if (nextPhase) {
        setTimeout(() => {
          setPhase(nextPhase);
          setFeedback(null);
        }, 5000);
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
      <p className="text-gray-200 italic leading-relaxed">{text}</p>
    </div>
  );

  const renderPhaseContent = () => {
    switch (phase) {
      case Phase.DISCUSSION:
        return (
          <div className="max-w-7xl mx-auto animate-fade-in space-y-8">
            <div className="flex items-center space-x-4 bg-space-800/90 p-6 rounded-2xl border-4 border-neon-green/80 shadow-[0_0_15px_rgba(57,255,20,0.3)]">
              <img 
                src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
                alt="Astronaut" 
                className="w-16 h-16 shrink-0"
                referrerPolicy="no-referrer"
              />
              <p className="text-gray-200 italic leading-relaxed text-lg">
                Hey explorers! You have seen how the angle of light can change heating effects. Now, we will explore the angle of the Earth and its consequences while orbiting the Sun. But... why is Earth angled (tilted) to begin with? Let's complete this creative mission task to find out!
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="glass-panel p-6 rounded-2xl border border-neon-pink/30 flex flex-col h-full">
                <h3 className="text-xl font-bold text-neon-pink mb-6 flex items-center">
                  <Users className="mr-2" /> Mission Task
                </h3>
                <div className="space-y-6">
                  {[
                    "1- In 5 minutes, create the craziest story to explain why Earth became tilted as it is today.",
                    "2- Share your story with everyone and listen to other stories as well.",
                    "3- Search online the possible reasons why the Earth is tilted and any fun facts about it.",
                    "4- Compare with your peers who got closer to the accepted theories.",
                    "5- Discuss with your peers how the tilt may impact seasons on Earth. (Hint: remember the flashlight? More tilting = More light spread)."
                  ].map((taskText, index) => (
                    <label key={index} className="flex items-start space-x-4 cursor-pointer group">
                      <div className="relative flex items-center justify-center mt-1 shrink-0">
                        <input 
                          type="checkbox" 
                          className="peer sr-only" 
                          checked={tasksCompleted[index]}
                          onChange={() => {
                            const newTasks = [...tasksCompleted];
                            newTasks[index] = !newTasks[index];
                            setTasksCompleted(newTasks);
                          }}
                        />
                        <div className="w-6 h-6 rounded border-2 border-gray-500 peer-checked:bg-neon-green peer-checked:border-neon-green transition-colors flex items-center justify-center">
                          <CheckCircle2 className={`w-4 h-4 text-black opacity-0 peer-checked:opacity-100 transition-opacity`} />
                        </div>
                      </div>
                      <span className={`text-gray-300 group-hover:text-white transition-colors ${tasksCompleted[index] ? 'line-through opacity-50' : ''}`}>
                        {taskText}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-neon-blue/30 flex flex-col h-full">
                <h3 className="text-xl font-bold text-neon-blue mb-4 flex items-center">
                  <Info className="mr-2" /> Optional Task
                </h3>
                <p className="text-gray-300 mb-6">
                  Have you ever thought why orbits even exist? Explore online to see if you find the explanation! Here is a video to help you visualize how the Sun bends space to attract the planets.
                </p>
                <div className="flex-1 min-h-[300px] rounded-xl overflow-hidden border border-white/10">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/Am5pWWlFmyc" 
                    title="Why Orbits Happen" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <button 
                onClick={() => setPhase(Phase.PHASE1)}
                disabled={!allTasksCompleted}
                className={`px-6 py-3 rounded-full font-bold text-lg flex items-center transition-all ${allTasksCompleted ? 'bg-gradient-to-r from-neon-blue to-neon-pink text-white hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
              >
                Start Exploration Mission
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        );

      case Phase.PHASE1:
        return (
          <div className="grid lg:grid-cols-2 gap-8 h-full">
            <div className="flex flex-col space-y-6">
              {/* Mission Task Box */}
              <div className="glass-panel p-6 rounded-xl border-l-4 border-neon-blue">
                <h3 className="font-bold text-neon-blue text-sm mb-2 uppercase tracking-wider">Mission Task</h3>
                <p className="text-white">
                  Let's play with tilt and orbit! Reflect with your teacher and peers, then choose what to do next. You can always zoom in and use the control bar to see more details.
                </p>
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
                    className="p-4 rounded-xl border border-white/10 hover:bg-white/5 text-left transition-all"
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
                The green pinpoint is Finland.
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
                <StarBackground />
                <PerspectiveCamera makeDefault position={[0, 5, 60]} fov={45} />
                <Sun position={[20, 0, 0]} />
                <Earth position={[0, 0, 0]} rotationActive={false} tiltActive={false} revolutionActive={false} showFinland={true} poleRotation={poleRotation} sunPos={[20, 0, 0]} />
                <OrbitControls 
                  enableZoom={true} 
                  enablePan={true}
                  enableRotate={true}
                  minAzimuthAngle={0}
                  maxAzimuthAngle={0}
                  target={[0, 0, 0]}
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
              <div className="glass-panel p-6 rounded-xl border-l-4 border-neon-blue">
                <h3 className="font-bold text-neon-blue text-sm mb-2 uppercase tracking-wider">Mission Task</h3>
                <p className="text-white">
                  Wohoo! Days are back for everyone, baby! But... I wish it was Summer in Finland with those very long and bright days... Talk to your peers and teacher, to see what you can do to help me!
                </p>
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
                    className="p-4 rounded-xl border border-white/10 hover:bg-white/5 text-left transition-all"
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
                The green pinpoint is Finland.
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
                <StarBackground />
                <PerspectiveCamera makeDefault position={[0, 5, 60]} fov={45} />
                <Sun position={[20, 0, 0]} />
                <Earth position={[0, 0, 0]} rotationActive={true} tiltActive={false} revolutionActive={false} showFinland={true} poleRotation={poleRotation} sunPos={[20, 0, 0]} />
                <OrbitControls 
                  enableZoom={true} 
                  enablePan={true}
                  enableRotate={true}
                  minAzimuthAngle={0}
                  maxAzimuthAngle={0}
                  target={[0, 0, 0]}
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
              <div className="glass-panel p-6 rounded-xl border-l-4 border-neon-blue">
                <h3 className="font-bold text-neon-blue text-sm mb-2 uppercase tracking-wider">Mission Task</h3>
                <p className="text-white">
                  Get your sunglasses because Summer arrived to Finland! Reflect with your teacher and peers to restore the balance of seasons.
                </p>
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
                    className="p-4 rounded-xl border border-white/10 hover:bg-white/5 text-left transition-all"
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
                The green pinpoint is Finland.
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
                <StarBackground />
                <PerspectiveCamera makeDefault position={[0, 5, 60]} fov={45} />
                <Sun position={[20, 0, 0]} />
                <Earth position={[0, 0, 0]} rotationActive={true} tiltActive={true} revolutionActive={false} showFinland={true} poleRotation={poleRotation} sunPos={[20, 0, 0]} />
                <OrbitControls 
                  enableZoom={true} 
                  enablePan={true}
                  enableRotate={true}
                  minAzimuthAngle={0}
                  maxAzimuthAngle={0}
                  target={[0, 0, 0]}
                />
              </Canvas>
            </div>
          </div>
        );

      case Phase.PHASE4:
        return (
          <div className="flex flex-col h-full space-y-4">
            <div className="grid lg:grid-cols-3 gap-4 flex-1">
              {/* Left Column: 3D View */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="relative bg-black/40 rounded-2xl overflow-hidden border border-white/5 h-full min-h-[400px]">
                  <div className="absolute top-4 left-4 z-10">
                    <div className="bg-black/60 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-neon-pink border border-neon-pink/30 flex items-center w-fit">
                      Earth View (Sunlight Incidence)
                    </div>
                  </div>

                  <Canvas>
                    <StarBackground />
                    <ambientLight intensity={0.1} />
                    {(() => {
                      const date = new Date(orbitDate);
                      const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
                      const angle = -((dayOfYear - 80) / 365) * 2 * Math.PI;
                      
                      const ORBIT_A = 35;
                      const ORBIT_B = 30;
                      const ORBIT_OFFSET = 10;
                      
                      const curve = new THREE.EllipseCurve(-ORBIT_OFFSET, 0, ORBIT_A, ORBIT_B, 0, 2 * Math.PI, false, 0);
                      const points = curve.getPoints(128);
                      const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p.x, 0, p.y)));

                      const x = -ORBIT_OFFSET + ORBIT_A * Math.cos(angle);
                      const z = ORBIT_B * Math.sin(angle);

                      return (
                        <>
                          <PerspectiveCamera makeDefault fov={45} />
                          <OrbitCameraFollower target={[x, 0, z]} />
                          <Sun position={[0, 0, 0]} />
                          <group position={[-ORBIT_OFFSET, 0, 0]}>
                            <lineLoop geometry={geometry}>
                              <lineBasicMaterial color="#ffffff" opacity={0.1} transparent />
                            </lineLoop>
                          </group>
                          <Earth 
                            position={[x, 0, z]} 
                            rotationActive={true} 
                            tiltActive={true} 
                            revolutionActive={false} 
                            showFinland={true} 
                            poleRotation={0} 
                            sunPos={[0, 0, 0]} 
                          />
                          <OrbitControls 
                            enableZoom={true} 
                            enablePan={false} 
                            enableRotate={false} 
                          />
                        </>
                      );
                    })()}
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
                    onChange={(e) => setOrbitDate(e.target.value)}
                    className="w-full bg-space-900 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-neon-blue outline-none"
                  />
                </div>

                {/* Data Display Box */}
                <div className="glass-panel p-4 rounded-xl border-l-4 border-neon-pink">
                  <h3 className="font-bold text-neon-pink text-sm mb-3 uppercase tracking-wider">Finland Data</h3>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-gray-400">Season:</span>
                      <span className="text-white font-bold">{finlandData.season}</span>
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

                {/* Astronaut Box */}
                <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-col items-center text-center space-y-4">
                  <img 
                    src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
                    alt="Astronaut" 
                    className="w-16 h-16"
                  />
                  <p className="text-sm text-gray-300">
                    Once you're done here, you can explore the full Solar System from the dashboard.
                  </p>
                </div>
                
                <button 
                  onClick={onHome} 
                  className="w-full py-2.5 bg-neon-blue text-white font-bold rounded-xl hover:bg-neon-blue/80 transition-all shadow-[0_0_20px_rgba(0,255,255,0.3)]"
                >
                  Back to Dashboard
                </button>
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
            <h2 className="text-3xl font-bold text-white">Mission Accomplished!</h2>
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
              <p className="text-lg text-white mt-6 font-bold">Now you’re ready to see all of this happening in real space, with more planets!</p>
            </div>
            {renderGuruBubble("Great job, space explorer! Now let’s see all this happening in the whole solar system, with all the planets. Are you ready to become a cool astronaut like me?")}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={onHome} 
                className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
              >
                Back to Dashboard
              </button>
              {onNavigateToSolarSystem && (
                <button 
                  onClick={onNavigateToSolarSystem}
                  className="px-6 py-3 bg-neon-blue text-white font-bold rounded-xl hover:bg-neon-blue/80 transition-all shadow-[0_0_20px_rgba(0,255,255,0.3)] flex items-center"
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
