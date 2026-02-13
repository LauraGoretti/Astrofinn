import React, { useRef, Suspense, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader, useThree, ThreeElements } from '@react-three/fiber';
import { OrbitControls, Stars, Html, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Loader2, Infinity as InfinityIcon, Sun, Moon, ArrowDownToLine, Move3d } from 'lucide-react';

// Explicitly extend JSX.IntrinsicElements with ThreeElements to resolve TypeScript errors
// for R3F components like <mesh>, <group>, etc.
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

// Constants for Simulation - UPDATED FOR SCIENTIFIC PROPORTIONS
// Reference: Earth R = 6371km, Moon R = 1737km (Ratio ~3.67)
// Distance = 384,400km (approx 60 Earth Radii or 30 Earth Diameters)

// Scaling Base: Earth Radius = 2 units
const EARTH_RADIUS = 2; 
// Adjusted for better visibility in the app (Visual Scale vs True Scale)
const MOON_RADIUS = 1.0; // Increased from 0.54 for better visibility
const MOON_DISTANCE = 25; // Decreased from 60 to keep it in frame

// Sun Orbit (Heliocentric context)
// Note: True scale sun distance is impossible in a browser (12,000 earth diameters).
// We scale this up just enough to fit the large Moon orbit without collision.
const SEMI_MAJOR_AXIS = 250; // a
// Restore elliptical shape (was 248 for circular, now 215 for visible ellipse)
const SEMI_MINOR_AXIS = 215; // b 

// FOCAL_OFFSET defines how far the Sun (at 0,0) is from the center of the ellipse.
// Scientifically, c = sqrt(a^2 - b^2) ~= 127. 
// However, to satisfy the visual requirement of "Sun slightly displaced" while maintaining a visible "ellipse shape",
// we reduce this offset artificially. This creates a stylised orbit that is easier to understand visually.
const FOCAL_OFFSET = 80; 

const SUN_RADIUS = 18;     

// Simulation Speeds (radians per second)
// 1. Earth Day is the base unit.
const EARTH_ROTATION_SPEED = 0.8; 

// 2. Moon Month is ~28 days.
const MOON_ORBIT_SPEED = EARTH_ROTATION_SPEED / 28; 

// 3. Earth Year is ~12 months (simplified to 8 here for visual pacing).
const EARTH_YEAR_SPEED = MOON_ORBIT_SPEED / 8;

// Types
type ViewMode = 'EARTH_FREE' | 'EARTH_DAY' | 'EARTH_NIGHT' | 'SYSTEM_TOP' | 'SYSTEM_AUTO';

// --- ATMOSPHERE SHADERS ---

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
  vec3 normal = normalize(vNormal);
  float viewDot = dot(normal, vec3(0.0, 0.0, 1.0));
  float rim = 1.0 - max(viewDot, 0.0);
  float intensity = pow(rim, 4.0);
  gl_FragColor = vec4(0.1, 0.4, 0.9, 1.0) * intensity * 0.15; 
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

// --- MOON SHADERS ---

const moonVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSunDir;
uniform vec3 sunPosition;
void main() {
  vUv = uv;
  vNormal = normalize(normal);
  // sunPosition is passed in local space, so direction is simply destination minus origin
  vSunDir = normalize(sunPosition - position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const moonFragmentShader = `
uniform sampler2D moonTexture;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSunDir;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 sunDir = normalize(vSunDir);
  float dotProd = dot(normal, sunDir);
  
  // Sharper terminator for vacuum environment (Moon has no atmosphere)
  // Use a small smoothstep range to avoid pixelated edges but keep it crisp
  float dayFactor = smoothstep(-0.02, 0.02, dotProd);
  
  vec3 texColor = texture2D(moonTexture, vUv).rgb;
  
  // Standard Lambertian diffuse
  float diffuse = max(dotProd, 0.0);
  
  // Day side: Texture * Diffuse light
  // Boost slightly to make it pop against the black background
  vec3 dayColor = texColor * (diffuse + 0.1); 
  
  // Night side: Simulate faint Earthshine (light reflected from Earth to Moon)
  // This prevents the dark side from being pitch black, adding realism
  vec3 nightColor = texColor * 0.02;
  
  vec3 finalColor = mix(nightColor, dayColor, dayFactor);
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

// --- EARTH SHADERS ---

const earthVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSunDir;
uniform vec3 sunPosition;
void main() {
  vUv = uv;
  vNormal = normalize(normal); 
  vSunDir = normalize(sunPosition - position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const earthFragmentShader = `
uniform sampler2D dayTexture;
uniform sampler2D nightTexture;
uniform sampler2D specularMapTexture;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSunDir;
void main() {
  vec3 normal = normalize(vNormal);
  vec3 sunDir = normalize(vSunDir);
  float dotProd = dot(normal, sunDir);
  
  // Softer terminator (Twilight zone)
  // Widen the transition range (-0.2 to 0.2) to simulate atmospheric scattering
  float dayFactor = smoothstep(-0.2, 0.2, dotProd);

  vec3 dayColor = texture2D(dayTexture, vUv).rgb;
  vec3 nightColorSample = texture2D(nightTexture, vUv).rgb;
  float specularStrength = texture2D(specularMapTexture, vUv).r;
  
  float diffuse = max(dotProd, 0.0);
  float spec = pow(diffuse, 32.0) * specularStrength * 0.5;
  
  vec3 finalDay = dayColor * (diffuse + 0.05) + vec3(spec); 
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

const SunMesh = () => {
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
    <group position={[0, 0, 0]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
        {/* Use procedural color with high RGB values to trigger bloom without texture */}
        <meshBasicMaterial color={[1.8, 1.4, 0.8]} toneMapped={false} />
      </mesh>
      <mesh scale={[1.15, 1.15, 1.15]}>
        <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
        <shaderMaterial
          vertexShader={atmosphereVertexShader}
          fragmentShader={sunAtmosphereFragmentShader}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          transparent={true}
          depthWrite={false}
        />
      </mesh>
      <sprite scale={[SUN_RADIUS * 6, SUN_RADIUS * 6, 1]}>
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
      <pointLight 
        intensity={2.5} 
        distance={2000} 
        decay={0.0} 
        color="#fffaed" 
        castShadow 
        shadow-mapSize-width={4096} 
        shadow-mapSize-height={4096}
        shadow-bias={-0.0001}
        shadow-radius={4}
      >
        <orthographicCamera attach="shadow-camera" args={[-150, 150, 150, -150, 0.1, 1000]} />
      </pointLight>
    </group>
  );
};

const MoonMesh = () => {
  // Use a reliable remote texture from Three.js examples
  const colorMap = useLoader(THREE.TextureLoader, 'https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/textures/moon.jpg');
  const orbitGroupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    moonTexture: { value: colorMap },
    sunPosition: { value: new THREE.Vector3(0, 0, 0) }
  }), [colorMap]);

  useFrame((state, delta) => {
    // Rotate the group to orbit the moon around earth
    if (orbitGroupRef.current) orbitGroupRef.current.rotation.y += delta * MOON_ORBIT_SPEED;
    
    // Moon is tidally locked: It always faces the Earth.
    // Update shader sun position
    if (meshRef.current && materialRef.current) {
        // We need the sun's position (0,0,0 World) relative to the Moon mesh
        const sunLocalPos = new THREE.Vector3(0, 0, 0);
        meshRef.current.worldToLocal(sunLocalPos);
        materialRef.current.uniforms.sunPosition.value.copy(sunLocalPos);
    }
  });

  return (
    <group ref={orbitGroupRef} rotation={[0, 0, 5 * (Math.PI / 180)]}>
      <group position={[MOON_DISTANCE, 0, 0]}>
        <mesh ref={meshRef} castShadow receiveShadow>
          <sphereGeometry args={[MOON_RADIUS, 64, 64]} />
          {/* Custom shader for realistic moon phase rendering */}
          <shaderMaterial 
              ref={materialRef}
              vertexShader={moonVertexShader}
              fragmentShader={moonFragmentShader}
              uniforms={uniforms}
          />
        </mesh>
      </group>
    </group>
  );
};

interface HeliocentricSystemProps {
  viewMode: ViewMode;
}

const HeliocentricSystem: React.FC<HeliocentricSystemProps> = ({ viewMode }) => {
  const [dayTexture, nightTexture, specularMap] = useLoader(THREE.TextureLoader, [
    'https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/textures/earth_day.jpg',
    'https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/textures/earth_night.jpg',
    'https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/textures/earth_specular.jpg'
  ]);

  const earthContainerRef = useRef<THREE.Group>(null);
  const earthMeshRef = useRef<THREE.Mesh>(null);
  const earthGroupRef = useRef<THREE.Group>(null);
  const earthMaterialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Camera & Controls Refs
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  
  // State Refs
  const orbitAngle = useRef(0);
  const prevEarthPos = useRef(new THREE.Vector3(SEMI_MAJOR_AXIS - FOCAL_OFFSET, 0, 0));
  const isTransitioning = useRef(false);

  const earthUniforms = useMemo(() => ({
    dayTexture: { value: dayTexture },
    nightTexture: { value: nightTexture },
    specularMapTexture: { value: specularMap },
    sunPosition: { value: new THREE.Vector3(0, 0, 0) } 
  }), [dayTexture, nightTexture, specularMap]);

  const orbitPathGeometry = useMemo(() => {
    const curve = new THREE.EllipseCurve(
      -FOCAL_OFFSET, 0,
      SEMI_MAJOR_AXIS, SEMI_MINOR_AXIS,
      0, 2 * Math.PI,
      false, 0
    );
    const points = curve.getPoints(250);
    return new THREE.BufferGeometry().setFromPoints(
      points.map(p => new THREE.Vector3(p.x, 0, p.y))
    );
  }, []);

  // Handle Camera Transition on Mode Change
  useEffect(() => {
    isTransitioning.current = true;
    
    // Slight delay to allow render cycle to catch up, then unlock
    const timer = setTimeout(() => {
        isTransitioning.current = false;
        
        // If switching TO Free Mode, snap camera to Earth relative pos
        if (viewMode === 'EARTH_FREE' && cameraRef.current && controlsRef.current && earthContainerRef.current) {
            const earthPos = earthContainerRef.current.position;
            // Snap camera to a nice offset
            cameraRef.current.position.set(earthPos.x, earthPos.y + 10, earthPos.z + 40);
            controlsRef.current.target.copy(earthPos);
            controlsRef.current.update();
        }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [viewMode]);

  useFrame((state, delta) => {
    // 1. Calculate Earth Orbit Position
    const safeDelta = Math.min(delta, 0.05); // Cap delta to prevent jumps
    
    // Use the correctly scaled Year Speed
    orbitAngle.current += safeDelta * EARTH_YEAR_SPEED; 
    
    const x = -FOCAL_OFFSET + SEMI_MAJOR_AXIS * Math.cos(orbitAngle.current);
    const z = SEMI_MINOR_AXIS * Math.sin(orbitAngle.current);
    const currentEarthPos = new THREE.Vector3(x, 0, z);

    // Update Earth Mesh Position
    if (earthContainerRef.current) {
      earthContainerRef.current.position.copy(currentEarthPos);
    }

    // 2. Calculate Movement Vector (Delta) since last frame
    // This vector represents how much the Earth moved this frame
    const posDelta = currentEarthPos.clone().sub(prevEarthPos.current);

    // 3. EARTH FREE MODE - Manual Camera Follow
    // We manually shift the camera and controls target by the same amount the Earth moved.
    // This creates a "perfect follow" without drift.
    if (viewMode === 'EARTH_FREE' && !isTransitioning.current) {
        if (state.camera && controlsRef.current) {
             // Add Earth's movement to Camera
             state.camera.position.add(posDelta);
             
             // Add Earth's movement to OrbitControls Target
             controlsRef.current.target.add(posDelta);
             
             // Check for Drift Error (if camera gets lost)
             const dist = state.camera.position.distanceTo(currentEarthPos);
             if (dist > 300) {
                 // Emergency Reset
                 state.camera.position.copy(currentEarthPos).add(new THREE.Vector3(0, 10, 40));
                 controlsRef.current.target.copy(currentEarthPos);
             }
        }
    }

    // 4. Earth Rotation
    if (earthGroupRef.current) {
      earthGroupRef.current.rotation.y += safeDelta * EARTH_ROTATION_SPEED;
    }

    // 5. Update Shader Sun Position
    if (earthMeshRef.current && earthMaterialRef.current) {
      const sunWorldPos = new THREE.Vector3(0, 0, 0);
      earthMeshRef.current.worldToLocal(sunWorldPos);
      earthMaterialRef.current.uniforms.sunPosition.value.copy(sunWorldPos);
    }
    
    // 6. OTHER CAMERA MODES (Cinematic/Fixed)
    if (viewMode !== 'EARTH_FREE') {
        if (viewMode === 'SYSTEM_AUTO') {
           const t = state.clock.getElapsedTime() * 0.1;
           const radius = 350;
           const centerX = -FOCAL_OFFSET;
           const camX = centerX + radius * Math.cos(t);
           const camZ = radius * Math.sin(2 * t);
           const camY = 100 + 40 * Math.sin(t); 
           const targetPos = new THREE.Vector3(camX, camY, camZ);
           state.camera.position.lerp(targetPos, 0.05);
           state.camera.lookAt(centerX, 0, 0);
        }
        else if (viewMode === 'SYSTEM_TOP') {
           const targetPos = new THREE.Vector3(-FOCAL_OFFSET, 600, 0);
           state.camera.position.lerp(targetPos, 0.05);
           state.camera.lookAt(-FOCAL_OFFSET, 0, 0);
           state.camera.up.set(0, 0, -1);
        }
        else if (viewMode === 'EARTH_DAY') {
           const sunDirection = new THREE.Vector3(0, 0, 0).sub(currentEarthPos).normalize();
           const offsetDist = 35;
           const camPos = currentEarthPos.clone().add(sunDirection.multiplyScalar(offsetDist));
           camPos.y += 5;
           state.camera.position.copy(camPos);
           state.camera.lookAt(currentEarthPos);
           state.camera.up.set(0, 1, 0);
        }
        else if (viewMode === 'EARTH_NIGHT') {
           const sunDirection = new THREE.Vector3(0, 0, 0).sub(currentEarthPos).normalize();
           const offsetDist = 35;
           const camPos = currentEarthPos.clone().sub(sunDirection.multiplyScalar(offsetDist));
           camPos.y += 5;
           state.camera.position.copy(camPos);
           state.camera.lookAt(currentEarthPos);
           state.camera.up.set(0, 1, 0);
        }
    }
    
    // Update tracker for next frame
    prevEarthPos.current.copy(currentEarthPos);
  });

  return (
    <group>
      {/* Orbit Path */}
      <lineLoop geometry={orbitPathGeometry}>
        <lineBasicMaterial attach="material" color="#00F0FF" opacity={0.4} transparent />
      </lineLoop>

      {/* Earth Container - Moving Group */}
      <group ref={earthContainerRef} position={[SEMI_MAJOR_AXIS - FOCAL_OFFSET, 0, 0]}>
          <group rotation={[0, 0, 23.5 * (Math.PI / 180)]}>
            <group ref={earthGroupRef}>
              <mesh ref={earthMeshRef} castShadow>
                <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
                <shaderMaterial
                  ref={earthMaterialRef}
                  vertexShader={earthVertexShader}
                  fragmentShader={earthFragmentShader}
                  uniforms={earthUniforms}
                />
              </mesh>
              <mesh scale={[1.02, 1.02, 1.02]}>
                <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
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
            <mesh rotation={[0,0,0]}>
              <cylinderGeometry args={[0.03, 0.03, 6, 8]} />
              <meshBasicMaterial color="#FF007F" transparent opacity={0.6} />
            </mesh>
            
            {/* North Pole Label - Positioned exactly at the top of the axis line (Y=3) */}
             <Html
               position={[0, 3, 0]}
               distanceFactor={10}
               occlude={[earthMeshRef]}
               style={{ 
                 pointerEvents: 'none',
               }}
             >
               <div className="flex flex-col items-center transform -translate-x-1/2 -translate-y-full">
                  <div className="bg-black/60 border border-neon-pink px-2 py-0.5 rounded text-[8px] font-bold text-neon-pink whitespace-nowrap backdrop-blur-sm shadow-[0_0_10px_rgba(255,0,127,0.3)]">
                    North Pole
                  </div>
                  <div className="w-px h-2 bg-neon-pink"></div>
               </div>
             </Html>
          </group>

          <MoonMesh />
      </group>

      {/* CAMERA SETUP - ROOT LEVEL */}
      {viewMode === 'EARTH_FREE' ? (
         <>
           <PerspectiveCamera 
              ref={cameraRef}
              makeDefault 
              fov={50} 
              near={0.1}
              far={2000} // Increased far plane for new distances
           />
           <OrbitControls 
              ref={controlsRef}
              makeDefault
              enablePan={false}
              enableZoom={true}
              enableDamping={false} /* CRITICAL: Disable damping to prevent drift lag */
              rotateSpeed={0.5}
              zoomSpeed={0.5}
              minDistance={5.0} 
              maxDistance={250} // Increased max distance to see full system
           />
         </>
      ) : (
         <PerspectiveCamera 
            makeDefault 
            position={[0, 50, 100]} // Default start pos for other modes
            fov={45} 
            near={0.1} 
            far={2000} 
         />
      )}
    </group>
  );
};

const Loader = () => {
  return (
    <Html center>
      <div className="flex flex-col items-center text-neon-blue">
        <Loader2 className="animate-spin w-8 h-8 mb-2" />
        <span className="text-xs font-mono">LOADING SIMULATION...</span>
      </div>
    </Html>
  );
}

const Earth3D: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('EARTH_FREE');

  return (
    <div className="w-full h-[600px] bg-black rounded-xl overflow-hidden border border-white/10 relative shadow-2xl shadow-black">
      <div className="absolute top-4 right-4 pointer-events-none z-10">
        <div className="bg-neon-blue/10 border border-neon-blue/30 px-3 py-1 rounded text-neon-blue text-xs font-bold tracking-widest uppercase animate-pulse">
          Heliocentric Model
        </div>
      </div>

      <Canvas shadows>
        <ambientLight intensity={0.05} /> 
        <Stars radius={400} depth={50} count={6000} factor={4} saturation={0} fade speed={1} />
        
        <Suspense fallback={<Loader />}>
          <SunMesh />
          <HeliocentricSystem viewMode={viewMode} />
        </Suspense>
        
        <EffectComposer>
          <Bloom 
            luminanceThreshold={0.9} 
            luminanceSmoothing={0.9} 
            height={300} 
            intensity={0.4} 
          />
        </EffectComposer>
      </Canvas>
      
      {/* Enhanced View Controls Overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-2xl px-4">
        <div className="bg-black/80 backdrop-blur-md p-2 rounded-xl border border-white/10 flex items-center justify-between">
          
          {/* Earth Controls Group */}
          <div className="flex items-center space-x-1 mr-4">
            <span className="text-[10px] text-gray-500 font-mono uppercase mr-2 hidden sm:block">Earth</span>
            <button
              onClick={() => setViewMode('EARTH_FREE')}
              title="Free Orbit"
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'EARTH_FREE' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/10'
              }`}
            >
              <Move3d size={18} />
            </button>
            <button
              onClick={() => setViewMode('EARTH_DAY')}
              title="Fix Day Side"
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'EARTH_DAY' ? 'bg-yellow-500 text-white' : 'text-gray-400 hover:bg-white/10'
              }`}
            >
              <Sun size={18} />
            </button>
            <button
              onClick={() => setViewMode('EARTH_NIGHT')}
              title="Fix Night Side"
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'EARTH_NIGHT' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/10'
              }`}
            >
              <Moon size={18} />
            </button>
          </div>

          <div className="w-px h-8 bg-white/10"></div>

          {/* System Controls Group */}
          <div className="flex items-center space-x-1 ml-4">
            <span className="text-[10px] text-gray-500 font-mono uppercase mr-2 hidden sm:block">System</span>
            <button
              onClick={() => setViewMode('SYSTEM_TOP')}
              title="Top Down"
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'SYSTEM_TOP' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:bg-white/10'
              }`}
            >
              <ArrowDownToLine size={18} />
            </button>
            <button
              onClick={() => setViewMode('SYSTEM_AUTO')}
              title="Cinematic"
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'SYSTEM_AUTO' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-white/10'
              }`}
            >
              <InfinityIcon size={18} />
            </button>
          </div>
        </div>
        
        <div className="text-center mt-2 h-4">
          <p className="text-[10px] text-neon-blue font-mono tracking-wider animate-fade-in">
             {viewMode === 'EARTH_FREE' && "MODE: FREE ORBIT // DRAG TO ROTATE"}
             {viewMode === 'EARTH_DAY' && "MODE: LOCKED TO DAY SIDE"}
             {viewMode === 'EARTH_NIGHT' && "MODE: LOCKED TO NIGHT SIDE"}
             {viewMode === 'SYSTEM_TOP' && "MODE: TOP-DOWN SATELLITE VIEW"}
             {viewMode === 'SYSTEM_AUTO' && "MODE: CINEMATIC AUTOPILOT"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Earth3D;