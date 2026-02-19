import React, { useRef, Suspense, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Html, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Loader2, Infinity as InfinityIcon, Sun, Moon, ArrowDownToLine, Move3d, Globe, Disc, Search } from 'lucide-react';

// Centralized Texture Repository URL
const TEXTURE_BASE_URL = 'https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/texture/';

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

// --- REAL LIFE PROPORTIONAL SPEEDS (SLOWED DOWN) ---
// To maintain visual stability while using real data, we define two base units:
// 1. Visually pleasing Rotation Speed (for Earth)
// 2. Visually pleasing Orbital Speed (for Earth)
// All other bodies are calculated as ratios of these bases.

// PREVIOUS VALUES: Rotation 0.5, Orbit 0.15
// NEW VALUES: Scaled down by approx factor of 3-4 for better observation
const BASE_ROTATION_SPEED = 0.15; // Visual speed for Earth's rotation
const BASE_ORBIT_SPEED = 0.04;    // Visual speed for Earth's revolution (Year)

// 1. Earth Day is the base unit for rotation.
const EARTH_ROTATION_SPEED = BASE_ROTATION_SPEED; 

// 2. Earth Year is the base unit for orbit.
const EARTH_YEAR_SPEED = BASE_ORBIT_SPEED;

// 3. Moon Orbit: The Moon orbits Earth ~27.3 days. 
// Earth orbits Sun ~365.25 days. Ratio: 13.03571428571429 (Specific Request)
const MOON_ORBIT_SPEED = EARTH_YEAR_SPEED * 13.03571428571429;

// Types
type ViewMode = 'EARTH_FREE' | 'EARTH_DAY' | 'EARTH_NIGHT' | 'SYSTEM_TOP' | 'SYSTEM_AUTO' | 'SOLAR_SYSTEM';

// --- ATMOSPHERE SHADERS ---

const atmosphereVertexShader = `
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Improved High-Quality Atmosphere Shader
// Revised for a larger, softer, more realistic bloom
const atmosphereFragmentShader = `
varying vec3 vNormal;
void main() {
  // Dot product of normal and view vector (0,0,1 in view space)
  float viewDot = dot(vNormal, vec3(0, 0, 1.0));
  
  // Calculate intensity with a softer falloff (power 4.0 instead of 8.0)
  // This allows the gradient to spread further inwards, making the atmosphere look "thicker" and softer
  float intensity = pow(clamp(1.0 + viewDot, 0.0, 1.0), 4.0);
  
  // Atmosphere Color: Brighter, more vibrant blue to interact better with Bloom
  vec3 atmosphereColor = vec3(0.3, 0.6, 1.0);
  
  // Low alpha (0.15) to make it very subtle and not obstruct the planet view
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

// --- EARTH SHADERS (UPDATED WITH REALISTIC SPECULAR) ---

const earthVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSunDir;
varying vec3 vViewDir;

void main() {
  vUv = uv;
  
  // Transform normal to View Space
  vNormal = normalize(normalMatrix * normal); 
  
  // Calculate Position in View Space
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  
  // View Direction (Camera is at 0,0,0 in View Space)
  vViewDir = normalize(-mvPosition.xyz);
  
  // Calculate Sun Direction in View Space
  // Sun is at World (0,0,0). Transform (0,0,0,1) with ViewMatrix.
  vec4 sunViewPos = viewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
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

// --- BACKGROUND ---

const ParallaxStars = () => {
  const count = 2500;
  
  // Generate random positions, sizes, and colors for stars
  const [positions, sizes, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    
    for(let i=0; i<count; i++) {
        // Distribute stars in a spherical volume
        // We put stars between 800 and 3800 units away. 
        // Since camera moves 0-300 units, this provides subtle but realistic parallax.
        const r = 800 + Math.random() * 3700; 
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i*3+2] = r * Math.cos(phi);
        
        // Size variation for visual interest
        sizes[i] = 20.0 + Math.random() * 40.0; 
        
        // Color variation (Real stars aren't just white)
        // 10% Reddish, 20% Blueish, 70% White
        const type = Math.random();
        if(type > 0.9) color.setHex(0xffaaaa); // Reddish giants
        else if(type > 0.7) color.setHex(0xaaccff); // Blue giants
        else color.setHex(0xffffff); // Main sequence white
        
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
            vColor = color; // Used default attribute injected by Three.js when vertexColors: true
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            // Size attenuation: Scale size based on distance to camera
            gl_PointSize = size * pixelRatio * (150.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        varying vec3 vColor;
        void main() {
            // Soft circular particle
            vec2 coord = gl_PointCoord - vec2(0.5);
            float dist = length(coord);
            
            if (dist > 0.5) discard;
            
            // Soft glow from center with exponential falloff
            float strength = 1.0 - (dist * 2.0);
            strength = pow(strength, 2.0);
            
            gl_FragColor = vec4(vColor, strength);
        }
    `,
    transparent: true,
    vertexColors: true,
    depthWrite: false, // Don't write to depth buffer so they don't occlude each other weirdly
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
        {/* Deep Background: Milky Way Texture */}
        {/* Pushed further back and dimmed to act as a canvas for the 3D stars */}
        <mesh renderOrder={-1}>
          <sphereGeometry args={[4800, 64, 64]} />
          <meshBasicMaterial 
            map={texture} 
            side={THREE.BackSide} 
            toneMapped={false}
            // UPDATED: Brightened color and opacity to make the Milky Way visible
            color="#cccccc" 
            transparent
            opacity={1.0}
            depthWrite={false}
          />
        </mesh>
        
        {/* 3D Parallax Stars */}
        <ParallaxStars />
    </group>
  );
};

const SunMesh = () => {
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
    <group position={[0, 0, 0]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
        {/* Use meshBasicMaterial with map and boosted color for bloom emission */}
        <meshBasicMaterial map={sunTexture} color={[1.5, 1.5, 1.5]} toneMapped={false} />
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
  const colorMap = useLoader(THREE.TextureLoader, `${TEXTURE_BASE_URL}moon.jpg`);
  const orbitGroupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    moonTexture: { value: colorMap },
    sunPosition: { value: new THREE.Vector3(0, 0, 0) }
  }), [colorMap]);

  useFrame((state, delta) => {
    // Sync logic: Use same safeDelta as Earth for perfect synchronization
    const safeDelta = Math.min(delta, 0.05);

    // Rotate the group to orbit the moon around earth
    if (orbitGroupRef.current) orbitGroupRef.current.rotation.y += safeDelta * MOON_ORBIT_SPEED;
    
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

// --- SOLAR SYSTEM EXTRA PLANETS ---

interface PlanetConfig {
  name: string;
  radius: number;
  distance: number;
  speed: number;
  rotationSpeed: number;
  texture: string;
  hasRings?: boolean;
  orbitColor: string;
  startAngle: number; // For deterministic positioning
  tilt?: number; // Axial tilt in radians
}

// REAL LIFE PLANETARY RATIOS
// Orbital Period (Years): Mer(0.24), Ven(0.615), Earth(1.0), Mars(1.88), Jup(11.86), Sat(29.4), Ura(84), Nep(164.8)
// Rotation Period (Days): Mer(58.6), Ven(-243), Earth(1.0), Mars(1.03), Jup(0.41), Sat(0.45), Ura(-0.72), Nep(0.67)
// Speed = BASE / Period

const PLANETS: PlanetConfig[] = [
  { 
    name: 'Mercury', 
    radius: 0.8, 
    distance: 70, 
    speed: BASE_ORBIT_SPEED * (1 / 0.24),  // ~4.16x Earth speed
    rotationSpeed: BASE_ROTATION_SPEED * (1 / 58.6), // Very slow
    texture: 'mercury.jpg', 
    orbitColor: '#A5A5A5', 
    startAngle: 0 
  },
  { 
    name: 'Venus', 
    radius: 1.9, 
    distance: 110, 
    speed: BASE_ORBIT_SPEED * (1 / 0.615), // ~1.62x Earth speed
    rotationSpeed: BASE_ROTATION_SPEED * (1 / -243), // Extremely slow & retrograde
    texture: 'venus_atmosphere.jpg', 
    orbitColor: '#E3BB76', 
    startAngle: 2,
    tilt: 177 * (Math.PI / 180) // Upside down!
  },
  // Earth is handled by existing components at approx distance 215-250 (ellipse)
  { 
    name: 'Mars', 
    radius: 1.1, 
    distance: 320, 
    speed: BASE_ORBIT_SPEED * (1 / 1.88), // ~0.53x Earth speed
    rotationSpeed: BASE_ROTATION_SPEED * (1 / 1.03), // Similar to Earth
    texture: 'mars.jpg', 
    orbitColor: '#FF4500', 
    startAngle: 4,
    tilt: 25 * (Math.PI / 180)
  },
  { 
    name: 'Jupiter', 
    radius: 10, 
    distance: 450, 
    speed: BASE_ORBIT_SPEED * (1 / 11.86), // Slow orbit
    rotationSpeed: BASE_ROTATION_SPEED * (1 / 0.41), // Fast spin
    texture: 'jupiter.jpg', 
    orbitColor: '#FFA500', 
    startAngle: 1,
    tilt: 3 * (Math.PI / 180)
  },
  { 
    name: 'Saturn', 
    radius: 8.5, 
    distance: 580, 
    speed: BASE_ORBIT_SPEED * (1 / 29.4), // Very slow orbit
    rotationSpeed: BASE_ROTATION_SPEED * (1 / 0.45), // Fast spin
    texture: 'saturn.jpg', 
    hasRings: true, 
    orbitColor: '#F4C542', 
    startAngle: 3,
    tilt: 27 * (Math.PI / 180)
  },
  { 
    name: 'Uranus', 
    radius: 3.5, 
    distance: 700, 
    speed: BASE_ORBIT_SPEED * (1 / 84), // Crawling orbit
    rotationSpeed: BASE_ROTATION_SPEED * (1 / -0.72), // Fast retrograde spin
    texture: 'uranus.jpg', 
    orbitColor: '#00FFFF', 
    startAngle: 5,
    tilt: 98 * (Math.PI / 180) // Rolling on side
  },
  { 
    name: 'Neptune', 
    radius: 3.4, 
    distance: 800, 
    speed: BASE_ORBIT_SPEED * (1 / 164.8), // Almost static orbit
    rotationSpeed: BASE_ROTATION_SPEED * (1 / 0.67), // Fast spin
    texture: 'neptune.jpg', 
    orbitColor: '#4169E1', 
    startAngle: 0.5,
    tilt: 28 * (Math.PI / 180)
  },
];

const PlanetRing: React.FC<{ radius: number }> = ({ radius }) => {
  const texture = useLoader(THREE.TextureLoader, `${TEXTURE_BASE_URL}saturn_ring.png`);
  
  return (
    // Rotate ring -90 deg on X to be flat on the planet's equatorial plane
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 1.4, radius * 2.2, 64]} />
        <meshStandardMaterial 
            map={texture} 
            side={THREE.DoubleSide} 
            transparent 
            opacity={0.8} 
            color="#ffffff"
        />
    </mesh>
  );
};

const PlanetMesh: React.FC<{ config: PlanetConfig }> = ({ config }) => {
  const texture = useLoader(THREE.TextureLoader, `${TEXTURE_BASE_URL}${config.texture}`);
  const orbitRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create orbit geometry flat on XZ plane
  const orbitGeometry = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, config.distance, config.distance, 0, 2 * Math.PI, false, 0);
    const points = curve.getPoints(128);
    // EllipseCurve returns points in 2D (x, y). We map them to (x, 0, y) for XZ plane.
    return new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p.x, 0, p.y)));
  }, [config.distance]);

  useFrame((state, delta) => {
    // Deterministic Orbit Calculation using global time
    // This matches the calculation in the main camera controller so they stay in sync
    const t = state.clock.getElapsedTime();
    // SPEED CORRECTION: Removed the 0.1 multiplier.
    // Previously: t * config.speed * 0.1.
    // config.speed is derived from Earth speed (0.04). Mercury speed is 0.166.
    // With 0.1, Mercury was moving at 0.0166, which is slower than Earth's 0.04.
    // Now Mercury will move at 0.166, which is faster than Earth's 0.04.
    const currentAngle = config.startAngle + t * config.speed; 
    
    if (orbitRef.current) {
        orbitRef.current.position.x = Math.cos(currentAngle) * config.distance;
        orbitRef.current.position.z = Math.sin(currentAngle) * config.distance;
    }
    // Rotate Planet
    if (meshRef.current) {
        meshRef.current.rotation.y += config.rotationSpeed * delta; // Ensure frame-rate independence
    }
  });

  return (
    <group>
        {/* Dynamic Planet Object */}
        <group ref={orbitRef}>
            {/* Axial Tilt Group - Rotates around Z axis to tilt the pole */}
            <group rotation={[0, 0, config.tilt || 0]}>
                <mesh ref={meshRef} castShadow receiveShadow>
                    <sphereGeometry args={[config.radius, 64, 64]} />
                    <meshStandardMaterial map={texture} roughness={0.7} />
                </mesh>
                
                {/* Planet Ring - Inside the tilt group so it aligns with equator */}
                {config.hasRings && <PlanetRing radius={config.radius} />}
            </group>
            
            {/* Simple Label */}
            <Html distanceFactor={120} position={[0, config.radius + 2, 0]} style={{ pointerEvents: 'none' }}>
            <div className="text-white text-[10px] font-mono opacity-80 whitespace-nowrap">{config.name}</div>
            </Html>
        </group>

        {/* Static Orbit Path */}
        <lineLoop geometry={orbitGeometry} rotation={[0, 0, 0]}>
             <lineBasicMaterial color={config.orbitColor} opacity={0.3} transparent />
        </lineLoop>
    </group>
  );
};

// Container component to handle loading multiple textures without breaking rules of hooks
const SolarSystem = () => {
    return (
        <group>
            {PLANETS.map((planet) => (
                <PlanetMesh key={planet.name} config={planet} />
            ))}
        </group>
    )
}

interface HeliocentricSystemProps {
  viewMode: ViewMode;
  focusedPlanet: string | null;
}

const HeliocentricSystem: React.FC<HeliocentricSystemProps> = ({ viewMode, focusedPlanet }) => {
  const [dayTexture, nightTexture, specularMap, cloudsTexture] = useLoader(THREE.TextureLoader, [
    `${TEXTURE_BASE_URL}earth_day.jpg`,
    `${TEXTURE_BASE_URL}earth_night.jpg`,
    `${TEXTURE_BASE_URL}earth_specular.jpg`,
    `${TEXTURE_BASE_URL}earth_clouds.jpg`
  ]);

  const earthContainerRef = useRef<THREE.Group>(null);
  const earthMeshRef = useRef<THREE.Mesh>(null);
  const earthGroupRef = useRef<THREE.Group>(null);
  const earthMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  
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
        
        if (cameraRef.current && controlsRef.current) {
            if (viewMode === 'EARTH_FREE' && earthContainerRef.current) {
                // Snap camera to Earth relative pos
                const earthPos = earthContainerRef.current.position;
                // CLOSER DEFAULT CAMERA
                cameraRef.current.position.set(earthPos.x, earthPos.y + 6, earthPos.z + 18);
                controlsRef.current.target.copy(earthPos);
            } 
            else if (viewMode === 'SOLAR_SYSTEM' && !focusedPlanet) {
                // Initialize Solar System View - Wide shot but allow movement after
                cameraRef.current.position.set(0, 400, 600);
                controlsRef.current.target.set(0, 0, 0);
            }
            controlsRef.current.update();
        }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [viewMode, focusedPlanet]);

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

    // 3. CAMERA TRACKING LOGIC
    if (viewMode === 'EARTH_FREE' && !isTransitioning.current) {
        // Manual Camera Follow for Earth Free Mode
        if (state.camera && controlsRef.current) {
             state.camera.position.add(posDelta);
             controlsRef.current.target.add(posDelta);
             
             // Check for Drift Error
             const dist = state.camera.position.distanceTo(currentEarthPos);
             if (dist > 300) {
                 state.camera.position.copy(currentEarthPos).add(new THREE.Vector3(0, 10, 40));
                 controlsRef.current.target.copy(currentEarthPos);
             }
        }
    } 
    else if (viewMode === 'SOLAR_SYSTEM' && focusedPlanet) {
        // AUTOMATIC PLANET TRACKING
        let targetPos: THREE.Vector3 | null = null;
        let targetRadius = 5; // Default

        if (focusedPlanet === 'Earth') {
             targetPos = currentEarthPos;
             targetRadius = EARTH_RADIUS;
        } else {
             const targetPlanet = PLANETS.find(p => p.name === focusedPlanet);
             if (targetPlanet) {
                 // We calculate the exact position of the focused planet using the same math as PlanetMesh
                 const t = state.clock.getElapsedTime();
                 // SPEED CORRECTION: Removed * 0.1 to match PlanetMesh speed.
                 const angle = targetPlanet.startAngle + t * targetPlanet.speed; 
                 const pX = Math.cos(angle) * targetPlanet.distance;
                 const pZ = Math.sin(angle) * targetPlanet.distance;
                 targetPos = new THREE.Vector3(pX, 0, pZ);
                 targetRadius = targetPlanet.radius;
             }
        }

        if (targetPos && state.camera && controlsRef.current) {
            // Lerp Controls Target to Planet
            controlsRef.current.target.lerp(targetPos, 0.1);
            
            // Lerp Camera Position to a fixed offset relative to planet
            // We keep the camera at a consistent offset (e.g., 20 units up, 40 back)
            // Note: To allow user rotation around the planet, we might want to just update target and let OrbitControls handle pos,
            // BUT OrbitControls is sticky. To follow a moving target, we must move the camera too.
            
            // Calculate desired camera position based on current relative offset
            // This preserves user rotation while moving the camera base
            const offset = state.camera.position.clone().sub(controlsRef.current.target);
            // Clamp offset distance to stay close to planet
            const idealDist = targetRadius * 6 + 10;
            if (offset.length() > idealDist * 2) offset.setLength(idealDist);
            
            state.camera.position.lerp(targetPos.clone().add(offset), 0.1);
            controlsRef.current.update();
        }
    }

    // 4. Earth Rotation
    if (earthGroupRef.current) {
      earthGroupRef.current.rotation.y += safeDelta * EARTH_ROTATION_SPEED;
    }

    // 5. Cloud Rotation (Independent)
    if (cloudsRef.current) {
        // Scientific Ratio: Earth Surface Speed ~1600 km/h. Cloud Wind Speed ~100 km/h.
        // Ratio = 100 / 1600 = 0.0625.
        // Clouds move slightly faster than the Earth's rotation (Prevailing Westerlies).
        cloudsRef.current.rotation.y += safeDelta * (EARTH_ROTATION_SPEED * 1.0625);
    }

    // 6. Update Shader Sun Position
    if (earthMeshRef.current && earthMaterialRef.current) {
      const sunWorldPos = new THREE.Vector3(0, 0, 0);
      earthMeshRef.current.worldToLocal(sunWorldPos);
      earthMaterialRef.current.uniforms.sunPosition.value.copy(sunWorldPos);
    }
    
    // 7. OTHER CAMERA MODES (Cinematic/Fixed)
    if (viewMode !== 'EARTH_FREE' && viewMode !== 'SOLAR_SYSTEM') {
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
      {/* Solar System Planets - Only in Specific Mode */}
      {viewMode === 'SOLAR_SYSTEM' && <SolarSystem />}

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
              
              {/* Cloud Layer - Slightly larger scale than Earth */}
              <mesh ref={cloudsRef} scale={[1.02, 1.02, 1.02]}>
                <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
                <meshLambertMaterial 
                  map={cloudsTexture} 
                  transparent={true} 
                  opacity={0.4} 
                  blending={THREE.AdditiveBlending} 
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>

              {/* High Quality Atmosphere Mesh: Increased scale (1.045) and adjusted shader for larger, softer glow */}
              <mesh scale={[1.045, 1.045, 1.045]}>
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

          {/* Earth Label - Placed outside the rotated group to stay upright */}
          <Html distanceFactor={120} position={[0, EARTH_RADIUS + 2.5, 0]} style={{ pointerEvents: 'none' }}>
            <div className="text-white text-[10px] font-mono opacity-80 whitespace-nowrap">Earth</div>
          </Html>

          <MoonMesh />
      </group>

      {/* CAMERA SETUP - ROOT LEVEL */}
      {(viewMode === 'EARTH_FREE' || viewMode === 'SOLAR_SYSTEM') ? (
         <>
           <PerspectiveCamera 
              ref={cameraRef}
              makeDefault 
              fov={50} 
              near={0.1}
              far={10000} // Increased far plane for new distances
           />
           <OrbitControls 
              ref={controlsRef}
              makeDefault
              enablePan={true}
              enableZoom={true}
              enableDamping={false} /* CRITICAL: Disable damping to prevent drift lag */
              rotateSpeed={0.5}
              zoomSpeed={0.5}
              // Adjust limits based on mode
              minDistance={viewMode === 'SOLAR_SYSTEM' ? (focusedPlanet ? 5 : 50) : 5.0} 
              maxDistance={viewMode === 'SOLAR_SYSTEM' ? 4000 : 250} 
           />
         </>
      ) : (
         <PerspectiveCamera 
            makeDefault 
            position={[0, 50, 100]} // Default start pos for other modes
            fov={45} 
            near={0.1} 
            far={10000} 
         />
      )}
    </group>
  );
};

const Earth3D: React.FC<{ className?: string }> = ({ className }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('EARTH_FREE');
  const [focusedPlanet, setFocusedPlanet] = useState<string | null>(null);

  return (
    <div className={className}>
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }} camera={{ position: [0, 20, 40], fov: 45 }}>
        <color attach="background" args={['#000005']} />
        
        <Suspense fallback={<Html center><div className="flex flex-col items-center"><Loader2 className="w-8 h-8 text-neon-blue animate-spin mb-2" /><span className="text-xs text-neon-blue font-mono">INITIALIZING SYSTEM...</span></div></Html>}>
           <StarBackground />
           <ambientLight intensity={0.1} />
           
           <SunMesh />
           <HeliocentricSystem viewMode={viewMode} focusedPlanet={focusedPlanet} />

           <EffectComposer>
             <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.2} intensity={2.0} />
           </EffectComposer>
        </Suspense>
      </Canvas>

      {/* Control Overlay */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/50 p-1.5 rounded-full backdrop-blur-md border border-white/10 z-10">
        <button 
           onClick={() => { setViewMode('EARTH_FREE'); setFocusedPlanet(null); }}
           className={`p-2 rounded-full transition-all ${viewMode === 'EARTH_FREE' ? 'bg-neon-blue text-black shadow-[0_0_10px_rgba(0,240,255,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
           title="Free Earth View"
        >
          <Globe size={18} />
        </button>
        <button 
           onClick={() => { setViewMode('SOLAR_SYSTEM'); setFocusedPlanet(null); }}
           className={`p-2 rounded-full transition-all ${viewMode === 'SOLAR_SYSTEM' ? 'bg-neon-blue text-black shadow-[0_0_10px_rgba(0,240,255,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
           title="Solar System"
        >
          <Disc size={18} />
        </button>
         <button 
           onClick={() => { setViewMode('EARTH_DAY'); setFocusedPlanet(null); }}
           className={`p-2 rounded-full transition-all ${viewMode === 'EARTH_DAY' ? 'bg-neon-blue text-black shadow-[0_0_10px_rgba(0,240,255,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
           title="Day View"
        >
          <Sun size={18} />
        </button>
         <button 
           onClick={() => { setViewMode('EARTH_NIGHT'); setFocusedPlanet(null); }}
           className={`p-2 rounded-full transition-all ${viewMode === 'EARTH_NIGHT' ? 'bg-neon-blue text-black shadow-[0_0_10px_rgba(0,240,255,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
           title="Night View"
        >
          <Moon size={18} />
        </button>
      </div>

       {/* Planet Selector (Only in Solar System Mode) */}
       {viewMode === 'SOLAR_SYSTEM' && (
         <div className="absolute top-4 right-4 flex flex-col gap-1 bg-black/80 p-3 rounded-xl backdrop-blur-md border border-white/10 max-h-[80%] overflow-y-auto z-10 w-32">
            <h3 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider border-b border-gray-700 pb-1">Planetary Focus</h3>
            {['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'].map(p => (
              <button
                key={p}
                onClick={() => setFocusedPlanet(p)}
                className={`text-xs text-left px-2 py-1.5 rounded transition-colors ${focusedPlanet === p ? 'bg-neon-blue text-black font-bold' : 'text-gray-300 hover:bg-white/10'}`}
              >
                {p}
              </button>
            ))}
             <button
                onClick={() => setFocusedPlanet(null)}
                className={`text-[10px] text-center px-2 py-1.5 rounded transition-colors border border-dashed border-gray-600 text-gray-400 hover:text-white mt-2`}
              >
                Overview
              </button>
         </div>
       )}
       
       <div className="absolute top-4 left-4 z-0 pointer-events-none">
          <div className="text-[10px] text-gray-500 font-mono">
             <div>MODE: {viewMode}</div>
             {focusedPlanet && <div>FOCUS: {focusedPlanet.toUpperCase()}</div>}
          </div>
       </div>
    </div>
  );
};

export default Earth3D;