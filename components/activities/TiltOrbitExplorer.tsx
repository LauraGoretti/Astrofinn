import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, Billboard } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Users, User, Info, ArrowRight, RotateCw, Move, Globe, Calendar, CheckCircle2, AlertCircle, Layout, ChevronLeft, ChevronRight } from 'lucide-react';
import { GameMode } from '../../types';
import { useTranslation } from 'react-i18next';

const TEXTURE_BASE_URL = 'https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/texture/';

// --- CONSTANTS FROM TILE 3 ---
const EARTH_RADIUS = 2;
const MOON_RADIUS = 1.0; // Increased for better visibility (matches Tile 3)
const MOON_DISTANCE = 25; // Decreased to keep in frame (matches Tile 3)
const SUN_RADIUS = 18;
const SEMI_MAJOR_AXIS = 250;
const SEMI_MINOR_AXIS = 215; // Matches Tile 3
const FOCAL_OFFSET = 80; // Matches Tile 3

// -----------------------------------------------------------------------------
// MANUAL SUN POSITION ADJUSTMENT (TOP-DOWN VIEW)
// -----------------------------------------------------------------------------
// If you want to manually nudge the Sun's position in the top-down view (Phase 4)
// without changing the orbit's shape, edit the coordinates below. 
// [X, Y, Z] -> X moves it left/right, Y moves it up/down (ignore for top-down), Z moves it forward/backward
const TOP_DOWN_SUN_POSITION: [number, number, number] = [-50, 0, 0];
// -----------------------------------------------------------------------------

const EARTH_ROTATION_SPEED = 0.5;
const MOON_ORBIT_SPEED = EARTH_ROTATION_SPEED / 28; // Matches Tile 3

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
  
  // BRIGHTNESS TWEAKS: Reduced multiplier for more realistic lighting
  vec3 finalDay = (dayColor * (diffuse + 0.25) + specularColor); 
  
  // Brighter city lights
  vec3 cleanNight = max(nightColorSample - 0.1, 0.0);
  vec3 finalNight = cleanNight * vec3(8.0, 6.0, 4.0); 
  
  // Sunset / Atmosphere scattering at terminator
  float sunsetIntensity = 1.0 - smoothstep(0.0, 0.25, abs(dotProd));
  vec3 sunsetColor = vec3(0.9, 0.4, 0.1) * sunsetIntensity * 0.8 * (1.0 - specularStrength);

  vec3 finalColor = mix(finalNight, finalDay, dayFactor);
  finalColor += sunsetColor;
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

const moonVertexShader = `
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

const moonFragmentShader = `
uniform sampler2D moonTexture;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSunDir;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 sunDir = normalize(vSunDir);
  float dotProd = dot(normal, sunDir);
  float dayFactor = smoothstep(-0.02, 0.02, dotProd);
  vec3 texColor = texture2D(moonTexture, vUv).rgb;
  float diffuse = max(dotProd, 0.0);
  vec3 dayColor = texColor * (diffuse + 0.1); 
  vec3 nightColor = texColor * 0.02;
  vec3 finalColor = mix(nightColor, dayColor, dayFactor);
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
  // Dot product of normal and view vector (0,0,1 in view space)
  float viewDot = dot(vNormal, vec3(0, 0, 1.0));
  
  // Calculate intensity with a softer falloff
  float intensity = pow(clamp(1.0 + viewDot, 0.0, 1.0), 3.0);
  
  // Atmosphere Color: Brighter, more vibrant blue
  vec3 atmosphereColor = vec3(0.4, 0.7, 1.0);
  
  // Higher alpha for better visibility
  gl_FragColor = vec4(atmosphereColor, 1.0) * intensity * 0.3;
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

const sunVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const sunFragmentShader = `
uniform sampler2D sunTexture;
uniform float time;
varying vec2 vUv;

void main() {
  // Uniform rotation speed (approx 27 days for full rotation)
  float speed = 1.0 / 27.0;
  
  float days = time / 6.28318530718;
  float offset = days * speed;
  
  vec2 uv = vUv;
  // Hardware RepeatWrapping handles the wrap-around seamlessly without the mipmap seam artifact.
  uv.x -= offset;
  
  gl_FragColor = texture2D(sunTexture, uv);
}
`;

const Sun = ({ position }: { position: [number, number, number] }) => {
  const sunTexture = useLoader(THREE.TextureLoader, `${TEXTURE_BASE_URL}sun.jpg`);

  useEffect(() => {
    if (sunTexture) {
      sunTexture.wrapS = THREE.RepeatWrapping;
      sunTexture.wrapT = THREE.RepeatWrapping;
      sunTexture.needsUpdate = true;
    }
  }, [sunTexture]);

  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const haloMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);

  const uniforms = useMemo(() => ({
    sunTexture: { value: sunTexture },
    time: { value: 0 }
  }), [sunTexture]);

  const haloUniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  useFrame((state, delta) => {
    timeRef.current += delta * EARTH_ROTATION_SPEED;
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = timeRef.current;
    }
    if (haloMaterialRef.current) haloMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
        <shaderMaterial 
          ref={materialRef}
          vertexShader={sunVertexShader}
          fragmentShader={sunFragmentShader}
          uniforms={uniforms}
        />
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
        intensity={1.2} 
        distance={2000} 
        decay={0.0} 
        color="#ffffff" 
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

// --- MOON COMPONENT ---
const MoonMesh = ({ sunPos, initialRotation = 0 }: { sunPos: [number, number, number], initialRotation?: number }) => {
  const colorMap = useLoader(THREE.TextureLoader, `${TEXTURE_BASE_URL}moon.jpg`);
  const orbitGroupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    moonTexture: { value: colorMap },
    sunPosition: { value: new THREE.Vector3(...sunPos) }
  }), [colorMap, sunPos]);

  // Set initial rotation based on date
  useEffect(() => {
    if (orbitGroupRef.current) {
      orbitGroupRef.current.rotation.y = initialRotation;
    }
  }, [initialRotation]);

  useFrame((state, delta) => {
    // Moon orbits Earth roughly once every 27.3 days (sidereal)
    if (orbitGroupRef.current) orbitGroupRef.current.rotation.y += delta * MOON_ORBIT_SPEED;
    if (meshRef.current && materialRef.current) {
        // sunPos should be the world position of the Sun [0, 0, 0] in Phase 4
        const sunWorldPos = new THREE.Vector3(...sunPos);
        const sunLocalPos = sunWorldPos.clone();
        meshRef.current.worldToLocal(sunLocalPos);
        materialRef.current.uniforms.sunPosition.value.copy(sunLocalPos);
    }
  });

  return (
    <group ref={orbitGroupRef} rotation={[0, 0, 5 * (Math.PI / 180)]}>
      <group position={[MOON_DISTANCE, 0, 0]}>
        <mesh ref={meshRef} castShadow receiveShadow>
          <sphereGeometry args={[MOON_RADIUS, 64, 64]} />
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

// --- CAMERA CONTROLLER ---
const CameraController = ({ viewMode, earthTarget, orbitCenter }: { 
  viewMode: ViewMode, 
  earthTarget: [number, number, number],
  orbitCenter: [number, number, number]
}) => {
  const { camera, controls, size } = useThree();
  const isTransitioning = useRef(false);
  const prevViewMode = useRef(viewMode);
  const prevEarthTarget = useRef(new THREE.Vector3(...earthTarget));
  const hasInitialized = useRef(false);

  const setupCamera = useCallback(() => {
    if (!controls || size.width === 0 || size.height === 0) return;
    isTransitioning.current = true;
    const targetVec = new THREE.Vector3(...earthTarget);

    if (viewMode === ViewMode.SYSTEM_TOP) {
      // Centering on the orbit center to see the whole elliptical path clearly
      const aspect = size.width / size.height;
      if (isNaN(aspect) || !isFinite(aspect)) return;
      
      const fovRad = (camera as THREE.PerspectiveCamera).fov * Math.PI / 180;
      // Orbit dimensions: Width 500, Height ~460.
      // We want to fit this box into the viewport with some padding.
      // Using a tighter 15% padding (1.15 factor) to use more screen space.
      const fitWidth = 500 * 1.15; 
      const fitHeight = 460 * 1.15;
      const requiredHeight = Math.max(fitHeight, fitWidth / aspect);
      
      const d = requiredHeight / (2 * Math.tan(fovRad / 2));
      if (isNaN(d) || !isFinite(d)) return;
      
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
      }
      
      camera.position.set(orbitCenter[0], d, orbitCenter[2]);
      camera.up.set(0, 0, -1);
      (controls as any).target.set(...orbitCenter);
    } else {
      // Snap to Earth - Closer view consistent with Tile 3
      camera.position.set(targetVec.x, targetVec.y + 10, targetVec.z + 35);
      camera.up.set(0, 1, 0);
      (controls as any).target.copy(targetVec);
    }
    (controls as any).update();
    
    // Update tracking ref to prevent huge delta jump
    prevEarthTarget.current.copy(targetVec);
    
    // Short delay to allow camera to settle before tracking resumes
    setTimeout(() => { isTransitioning.current = false; }, 50);
  }, [camera, controls, earthTarget, orbitCenter, viewMode, size.width, size.height]);

  useEffect(() => {
    if (controls) {
      if (prevViewMode.current !== viewMode || !hasInitialized.current) {
        setupCamera();
        hasInitialized.current = true;
        prevViewMode.current = viewMode;
      } else if (viewMode === ViewMode.SYSTEM_TOP) {
        // Re-center on resize for top-down view
        setupCamera();
      }
    }
  }, [viewMode, controls, setupCamera, size.width, size.height]);

  useFrame(() => {
    if (isTransitioning.current || !controls || size.width === 0 || size.height === 0) return;

    const currentEarthTarget = new THREE.Vector3(...earthTarget);
    
    if (viewMode === ViewMode.EARTH_FREE) {
      // ROBUST FOLLOW: Move camera exactly as much as Earth moved to preserve user's relative view
      const delta = currentEarthTarget.clone().sub(prevEarthTarget.current);
      camera.position.add(delta);
      (controls as any).target.copy(currentEarthTarget);
      (controls as any).update();
      
      // Safety check for drift or NaN
      const dist = camera.position.distanceTo(currentEarthTarget);
      if (dist > 1500 || isNaN(dist)) {
         camera.position.copy(currentEarthTarget).add(new THREE.Vector3(0, 10, 40));
         (controls as any).target.copy(currentEarthTarget);
         (controls as any).update();
      }
    } else if (viewMode === ViewMode.SYSTEM_TOP) {
      // FORCE CENTERING: Constantly recalculate and set camera to ensure it's centered on the orbit
      const aspect = size.width / size.height;
      if (!isNaN(aspect) && isFinite(aspect)) {
        const fovRad = (camera as THREE.PerspectiveCamera).fov * Math.PI / 180;
        // Orbit dimensions: Width 500, Height ~460.
        // We want to fit this box into the viewport with some padding.
        // Using a tighter 2% padding (1.02 factor) to use more screen space.
        const fitWidth = 500 * 1.02; 
        const fitHeight = 460 * 1.02;
        const requiredHeight = Math.max(fitHeight, fitWidth / aspect);
        
        const d = requiredHeight / (2 * Math.tan(fovRad / 2));
        
        if (!isNaN(d) && isFinite(d)) {
          // Force camera aspect ratio update to match current size
          if (camera instanceof THREE.PerspectiveCamera) {
            camera.aspect = aspect;
            camera.updateProjectionMatrix();
          }
          
          camera.position.set(orbitCenter[0], d, orbitCenter[2]);
          camera.up.set(0, 0, -1);
          
          if (controls) {
            (controls as any).target.set(orbitCenter[0], orbitCenter[1], orbitCenter[2]);
            (controls as any).update();
          } else {
            camera.lookAt(orbitCenter[0], orbitCenter[1], orbitCenter[2]);
          }
        }
      }
    }
    prevEarthTarget.current.copy(currentEarthTarget);
  });

  return null;
};

const OrbitLabels = () => {
  const { t } = useTranslation();
  // NASA data: Perihelion is ~Jan 3 (Day 3). Aphelion is ~July 4 (Day 185).
  // The angle formula used for Earth's position is:
  // angle = ((dayOfYear - 185) / 365) * 2 * Math.PI + Math.PI;
  const getAngle = (dayOfYear: number) => ((dayOfYear - 185) / 365) * 2 * Math.PI + Math.PI;

  const labels = [
    { text: t('activities.tilt_orbit.spring_equinox'), angle: getAngle(80) },
    { text: t('activities.tilt_orbit.summer_solstice'), angle: getAngle(172) },
    { text: t('activities.tilt_orbit.autumn_equinox'), angle: getAngle(264) },
    { text: t('activities.tilt_orbit.winter_solstice'), angle: getAngle(355) },
    { text: t('activities.tilt_orbit.perihelion'), angle: getAngle(3) },
    { text: t('activities.tilt_orbit.aphelion'), angle: getAngle(185) }
  ];

  return (
    <>
      {labels.map((label, index) => {
        const x = SEMI_MAJOR_AXIS * Math.cos(label.angle) - FOCAL_OFFSET;
        const z = SEMI_MINOR_AXIS * Math.sin(label.angle);
        return (
          <Html key={index} position={[x, 0, z]} center distanceFactor={15}>
            <div className="bg-black/50 text-white px-2 py-1 rounded text-[10px] whitespace-nowrap border border-white/20 select-none pointer-events-none">
              {label.text}
            </div>
          </Html>
        );
      })}
    </>
  );
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
  sunPos = [12, 0, 0],
  showMoon = false,
  moonRotation = 0,
  isTopDownView = false
}: { 
  position: [number, number, number], 
  rotationActive: boolean, 
  tiltActive: boolean, 
  revolutionActive: boolean,
  orbitAngle?: number,
  showFinland?: boolean,
  poleRotation?: number,
  sunPos?: [number, number, number],
  showMoon?: boolean,
  moonRotation?: number,
  isTopDownView?: boolean
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
  
  // NASA Data: Winter Solstice is offset from Perihelion.
  // We rotate the tilt axis so that the North Pole points away from the Sun on Dec 21.
  const TILT_AZIMUTH = -0.39; 

  useFrame((state, delta) => {
    if (rotationActive && earthGroupRef.current) {
      earthGroupRef.current.rotation.y += delta * EARTH_ROTATION_SPEED;
    }
    if (materialRef.current) {
      materialRef.current.uniforms.sunPosition.value.set(...sunPos);
    }
  });

  // --- MANUAL COORDINATE ADJUSTMENT ---
  const HELSINKI_LAT = 60.17;
  const HELSINKI_LON = -64.94;
  
  const finlandPos = useMemo(() => 
    getLatLonPosition(HELSINKI_LAT, HELSINKI_LON, 2.05) as [number, number, number],
    []
  );

  const labelDx = sunPos[0] - position[0];
  const labelDz = sunPos[2] - position[2];
  const labelDist = Math.sqrt(labelDx * labelDx + labelDz * labelDz) || 1;
  const labelOffsetX = (labelDx / labelDist) * (EARTH_RADIUS + 20.0);
  const labelOffsetZ = (labelDz / labelDist) * (EARTH_RADIUS + 20.0);
  const labelPosition: [number, number, number] = isTopDownView 
    ? [labelOffsetX, 0, labelOffsetZ] 
    : [0, EARTH_RADIUS + 2.5, 0];

  const { t } = useTranslation();

  return (
    <group position={position}>
      <group rotation={[poleRotation, 0, 0]}>
        <group rotation={[0, TILT_AZIMUTH, 0]}>
          <group rotation={[0, 0, tiltActive ? -AXIAL_TILT : 0]}>
            <group ref={earthGroupRef} rotation={[0, Math.PI, 0]}>
              <mesh castShadow>
              <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
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
              <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
              <meshLambertMaterial 
                map={cloudsTexture} 
                transparent={true} 
                opacity={0.6} 
                blending={THREE.AdditiveBlending} 
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>

            {/* Atmosphere Mesh */}
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
          <mesh>
            <cylinderGeometry args={[0.03, 0.03, 6, 8]} />
            <meshBasicMaterial color="#FF007F" transparent opacity={0.6} />
          </mesh>
          
          {/* North Pole Label - Positioned exactly at the top of the axis line (Y=3) */}
          {isTopDownView && (
            <Html
              position={[0, 3, 0]}
              distanceFactor={10}
              style={{ 
                pointerEvents: 'none',
              }}
            >
              <div className="flex flex-col items-center transform -translate-x-1/2 -translate-y-full">
                 <div className="bg-black/60 border border-neon-pink px-2 py-1 rounded text-base font-bold text-neon-pink whitespace-nowrap backdrop-blur-sm shadow-[0_0_10px_rgba(255,0,127,0.3)]">
                   {t('activities.tilt_orbit.north_pole')}
                 </div>
                 <div className="w-px h-2 bg-neon-pink"></div>
              </div>
            </Html>
          )}
        </group>
        </group>
        
        {/* Earth Label - Placed outside the rotated group to stay upright */}
        {isTopDownView && (
          <Html distanceFactor={350} position={labelPosition} center style={{ pointerEvents: 'none' }}>
            <div className="text-yellow-400 text-[14px] font-mono font-bold whitespace-nowrap drop-shadow-[0_0_4px_rgba(0,0,0,0.9)]">
              {t('activities.tilt_orbit.earth')}
            </div>
          </Html>
        )}
        
        {/* Moon is in the ecliptic plane, not tilted with Earth's axis */}
        {showMoon && <MoonMesh sunPos={sunPos} initialRotation={moonRotation} />}
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

enum ViewMode {
  EARTH_FREE = 'EARTH_FREE',
  SYSTEM_TOP = 'SYSTEM_TOP'
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
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>(mode === GameMode.SOLO ? Phase.PHASE1 : Phase.DISCUSSION);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.EARTH_FREE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [feedback, setFeedback] = useState<{ text: string, type: 'success' | 'error' | 'hint' } | null>(null);
  const [orbitDate, setOrbitDate] = useState('2026-06-21');
  const [poleRotation, setPoleRotation] = useState(0); // -PI/2 to PI/2
  const [tasksCompleted, setTasksCompleted] = useState([false, false, false, false, false]);
  const allTasksCompleted = tasksCompleted.every(Boolean);

  useEffect(() => {
    switch (phase) {
      case Phase.DISCUSSION: setStage(t('activities.tilt_orbit.phases.discussion')); break;
      case Phase.PHASE1: setStage(t('activities.tilt_orbit.phases.phase1')); break;
      case Phase.PHASE2: setStage(t('activities.tilt_orbit.phases.phase2')); break;
      case Phase.PHASE3: setStage(t('activities.tilt_orbit.phases.phase3')); break;
      case Phase.PHASE4: setStage(t('activities.tilt_orbit.phases.phase4')); break;
      case Phase.FINISHED: setStage(t('activities.tilt_orbit.phases.finished')); break;
    }
  }, [phase, setStage, t]);

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
  const getFinlandData = (dateStr: string, realDist?: number) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    const distStr = realDist 
      ? `${realDist.toFixed(1)} ${t('activities.tilt_orbit.million_km')}`
      : `149.6 ${t('activities.tilt_orbit.million_km')}`;

    // Approximate data for Finland (Oulu/Helsinki average)
    if ((month === 6 && day >= 20) || month === 7 || month === 8 || (month === 9 && day < 20)) {
      return {
        season: t('activities.tilt_orbit.seasons.summer'),
        daylight: t('activities.tilt_orbit.data_values.summer_daylight'),
        temp: t('activities.tilt_orbit.data_values.summer_temp'),
        nature: t('activities.tilt_orbit.nature.summer'),
        dist: realDist ? distStr : `152 ${t('activities.tilt_orbit.million_km')} (${t('activities.tilt_orbit.aphelion')})`
      };
    } else if ((month === 12 && day >= 20) || month === 1 || month === 2 || (month === 3 && day < 20)) {
      return {
        season: t('activities.tilt_orbit.seasons.winter'),
        daylight: t('activities.tilt_orbit.data_values.winter_daylight'),
        temp: t('activities.tilt_orbit.data_values.winter_temp'),
        nature: t('activities.tilt_orbit.nature.winter'),
        dist: realDist ? distStr : `147 ${t('activities.tilt_orbit.million_km')} (${t('activities.tilt_orbit.perihelion')})`
      };
    } else if ((month === 3 && day >= 20) || month === 4 || month === 5 || (month === 6 && day < 20)) {
      return {
        season: t('activities.tilt_orbit.seasons.spring'),
        daylight: t('activities.tilt_orbit.data_values.spring_daylight'),
        temp: t('activities.tilt_orbit.data_values.spring_temp'),
        nature: t('activities.tilt_orbit.nature.spring'),
        dist: distStr
      };
    } else {
      return {
        season: t('activities.tilt_orbit.seasons.autumn'),
        daylight: t('activities.tilt_orbit.data_values.autumn_daylight'),
        temp: t('activities.tilt_orbit.data_values.autumn_temp'),
        nature: t('activities.tilt_orbit.nature.autumn'),
        dist: distStr
      };
    }
  };

  const finlandData = useMemo(() => {
    if (phase === Phase.PHASE4) {
      const date = new Date(orbitDate);
      const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
      const angle = ((dayOfYear - 185) / 365) * 2 * Math.PI + Math.PI;
      
      // Calculate REAL scientific distance, not the exaggerated visual distance
      const realDist = 149.6 * (1 - 0.0167 * Math.cos(angle));
      return getFinlandData(orbitDate, realDist);
    }
    return getFinlandData(orbitDate);
  }, [orbitDate, phase]);

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
    <div className="astronaut-box animate-fade-in w-full max-w-7xl mx-auto">
      <img 
        src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
        alt="Astronaut" 
        className="w-12 h-12 shrink-0"
        referrerPolicy="no-referrer"
      />
      <p className="text-gray-200 italic text-base leading-relaxed">{text}</p>
    </div>
  );

  const renderPhaseContent = () => {
    switch (phase) {
      case Phase.DISCUSSION:
        return (
          <div className="max-w-7xl mx-auto animate-fade-in space-y-8">
            <div className="astronaut-box border-neon-green/80 shadow-[0_0_15px_rgba(57,255,20,0.3)]">
              <img 
                src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
                alt="Astronaut" 
                className="w-16 h-16 shrink-0"
                referrerPolicy="no-referrer"
              />
              <p className="text-base leading-relaxed text-gray-200 italic">
                {t('activities.tilt_orbit.discussion.intro')}
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="glass-panel border-neon-pink/30 flex flex-col h-full">
                <h3 className="text-2xl font-bold text-neon-pink mb-6 flex items-center">
                  <Users className="mr-2" /> {t('activities.tilt_orbit.mission_task')}
                </h3>
                <div className="space-y-6">
                  {[
                    t('activities.tilt_orbit.discussion.tasks.0'),
                    t('activities.tilt_orbit.discussion.tasks.1'),
                    t('activities.tilt_orbit.discussion.tasks.2'),
                    t('activities.tilt_orbit.discussion.tasks.3'),
                    t('activities.tilt_orbit.discussion.tasks.4')
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
                      <span className={`text-gray-300 group-hover:text-white transition-colors text-base leading-relaxed ${tasksCompleted[index] ? 'line-through opacity-50' : ''}`}>
                        {taskText}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="glass-panel border-neon-blue/30 flex flex-col h-full">
                <h3 className="text-2xl font-bold text-neon-blue mb-4 flex items-center">
                  <Info className="mr-2" /> {t('activities.tilt_orbit.optional_task')}
                </h3>
                <p className="text-gray-300 text-base leading-relaxed mb-6">
                  {t('activities.tilt_orbit.discussion.optional_desc')}
                </p>
                <div className="flex-1 min-h-[300px] rounded-xl overflow-hidden border border-white/10">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/Am5pWWlFmyc" 
                    title={t('activities.tilt_orbit.discussion.video_title')}
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
                className={`btn-primary px-8 py-4 text-2xl font-bold ${!allTasksCompleted ? 'opacity-50 grayscale' : ''}`}
              >
                {t('activities.tilt_orbit.start_mission')}
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
              <div className="glass-panel border-l-4 border-neon-blue">
                <h3 className="font-bold text-neon-blue text-2xl mb-2 uppercase tracking-wider">{t('activities.tilt_orbit.mission_task')}</h3>
                <p className="text-white text-base leading-relaxed">
                  {t('activities.tilt_orbit.phase1.task')}
                </p>
              </div>


              
              <div className="space-y-4">
                <div className="grid gap-3">
                  <button 
                    onClick={() => handleChoice(false, "", t('activities.tilt_orbit.phase1.error'), Phase.PHASE1)}
                    className="p-4 rounded-xl border border-white/10 hover:bg-white/5 text-left transition-all text-base leading-relaxed"
                  >
                    {t('activities.tilt_orbit.phase1.choices.0')}
                  </button>
                  <button 
                    onClick={() => handleChoice(false, "", t('activities.tilt_orbit.phase1.error'), Phase.PHASE1)}
                    className="p-4 rounded-xl border border-white/10 hover:bg-white/5 text-left transition-all text-base leading-relaxed"
                  >
                    {t('activities.tilt_orbit.phase1.choices.1')}
                  </button>
                  <button 
                    onClick={() => handleChoice(true, t('activities.tilt_orbit.phase1.success'), "", Phase.PHASE2)}
                    className="p-4 rounded-xl border border-white/10 hover:bg-white/5 text-left transition-all text-base leading-relaxed"
                  >
                    {t('activities.tilt_orbit.phase1.choices.2')}
                  </button>
                </div>
              </div>
              {feedback && (
                <div className={`p-4 rounded-xl flex items-center space-x-3 text-base leading-relaxed ${feedback.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
                  {feedback.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  <p>{feedback.text}</p>
                </div>
              )}
            </div>
            <div className="relative h-[400px] lg:h-full bg-black/40 rounded-2xl overflow-hidden border border-white/5">
              <div className="absolute top-4 right-4 z-10 bg-black/60 px-3 py-1 rounded-full text-[10px] font-bold text-[#39FF14] border border-[#39FF14]/30">
                {t('activities.tilt_orbit.finland_pinpoint')}
              </div>
              
              {/* Horizontal Pole Control */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 w-full max-w-xs">
                <span className="text-[10px] font-bold text-white/50 uppercase mb-1">{t('activities.tilt_orbit.move_to_see_poles')}</span>
                <div className="flex items-center bg-white/5 rounded-full p-4 border border-white/10 w-full justify-between">
                  <span className="text-[8px] font-bold text-neon-pink">{t('activities.tilt_orbit.south')}</span>
                  <input 
                    type="range" 
                    min={-Math.PI/2} 
                    max={Math.PI/2} 
                    step={0.01}
                    value={poleRotation}
                    onChange={(e) => setPoleRotation(parseFloat(e.target.value))}
                    className="flex-1 mx-4 h-1 appearance-none bg-white/10 rounded-full cursor-pointer accent-neon-blue"
                  />
                  <span className="text-[8px] font-bold text-neon-blue">{t('activities.tilt_orbit.north')}</span>
                </div>
              </div>

              <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
                <color attach="background" args={['#000005']} />
                <StarBackground />
                <ambientLight intensity={0.15} />
                <EffectComposer>
                  <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.2} intensity={0.7} />
                </EffectComposer>
                <PerspectiveCamera makeDefault position={[0, 10, 40]} fov={45} />
                <Sun position={[150, 0, 0]} />
                <Earth position={[0, 0, 0]} rotationActive={false} tiltActive={false} revolutionActive={false} showFinland={true} poleRotation={poleRotation} sunPos={[150, 0, 0]} />
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
              <div className="glass-panel border-l-4 border-neon-blue">
                <h3 className="font-bold text-neon-blue text-2xl mb-2 uppercase tracking-wider">{t('activities.tilt_orbit.mission_task')}</h3>
                <p className="text-white text-base leading-relaxed">
                  {t('activities.tilt_orbit.phase2.task')}
                </p>
              </div>


              
              <div className="space-y-4">
                <div className="grid gap-3">
                  <button 
                    onClick={() => handleChoice(false, "", t('activities.tilt_orbit.phase2.error'), Phase.PHASE2)}
                    className="p-4 rounded-xl border border-white/10 hover:bg-white/5 text-left transition-all text-base leading-relaxed"
                  >
                    {t('activities.tilt_orbit.phase2.choices.0')}
                  </button>
                  <button 
                    onClick={() => handleChoice(true, t('activities.tilt_orbit.phase2.success'), "", Phase.PHASE3)}
                    className="p-4 rounded-xl border border-white/10 hover:bg-white/5 text-left transition-all text-base leading-relaxed"
                  >
                    {t('activities.tilt_orbit.phase2.choices.1')}
                  </button>
                  <button 
                    onClick={() => handleChoice(false, "", t('activities.tilt_orbit.phase2.error'), Phase.PHASE2)}
                    className="p-4 rounded-xl border border-white/10 hover:bg-white/5 text-left transition-all text-base leading-relaxed"
                  >
                    {t('activities.tilt_orbit.phase2.choices.2')}
                  </button>
                </div>
              </div>
              {feedback && (
                <div className={`p-4 rounded-xl flex items-center space-x-3 text-base leading-relaxed ${feedback.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
                  {feedback.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  <p>{feedback.text}</p>
                </div>
              )}
            </div>
            <div className="relative h-[400px] lg:h-full bg-black/40 rounded-2xl overflow-hidden border border-white/5">
              <div className="absolute top-4 right-4 z-10 bg-black/60 px-3 py-1 rounded-full text-[10px] font-bold text-[#39FF14] border border-[#39FF14]/30">
                {t('activities.tilt_orbit.finland_pinpoint')}
              </div>

              {/* Horizontal Pole Control */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 w-full max-w-xs">
                <span className="text-[10px] font-bold text-white/50 uppercase mb-1">{t('activities.tilt_orbit.move_to_see_poles')}</span>
                <div className="flex items-center bg-white/5 rounded-full p-4 border border-white/10 w-full justify-between">
                  <span className="text-[8px] font-bold text-neon-pink">{t('activities.tilt_orbit.south')}</span>
                  <input 
                    type="range" 
                    min={-Math.PI/2} 
                    max={Math.PI/2} 
                    step={0.01}
                    value={poleRotation}
                    onChange={(e) => setPoleRotation(parseFloat(e.target.value))}
                    className="flex-1 mx-4 h-1 appearance-none bg-white/10 rounded-full cursor-pointer accent-neon-blue"
                  />
                  <span className="text-[8px] font-bold text-neon-blue">{t('activities.tilt_orbit.north')}</span>
                </div>
              </div>

              <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
                <color attach="background" args={['#000005']} />
                <StarBackground />
                <ambientLight intensity={0.15} />
                <EffectComposer>
                  <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.2} intensity={0.7} />
                </EffectComposer>
                <PerspectiveCamera makeDefault position={[0, 10, 40]} fov={45} />
                <Sun position={[150, 0, 0]} />
                <Earth position={[0, 0, 0]} rotationActive={true} tiltActive={false} revolutionActive={false} showFinland={true} poleRotation={poleRotation} sunPos={[150, 0, 0]} />
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
              <div className="glass-panel border-l-4 border-neon-blue">
                <h3 className="font-bold text-neon-blue text-2xl mb-2 uppercase tracking-wider">{t('activities.tilt_orbit.mission_task')}</h3>
                <p className="text-white text-base leading-relaxed">
                  {t('activities.tilt_orbit.phase3.task')}
                </p>
              </div>


              
              <div className="space-y-4">
                <div className="grid gap-3">
                  <button 
                    onClick={() => handleChoice(false, "", t('activities.tilt_orbit.phase3.error0'), Phase.PHASE3)}
                    className="p-4 rounded-xl border border-white/10 hover:bg-white/5 text-left transition-all text-base leading-relaxed"
                  >
                    {t('activities.tilt_orbit.phase3.choices.0')}
                  </button>
                  <button 
                    onClick={() => handleChoice(false, "", t('activities.tilt_orbit.phase3.error1'), Phase.PHASE3)}
                    className="p-4 rounded-xl border border-white/10 hover:bg-white/5 text-left transition-all text-base leading-relaxed"
                  >
                    {t('activities.tilt_orbit.phase3.choices.1')}
                  </button>
                  <button 
                    onClick={() => handleChoice(true, t('activities.tilt_orbit.phase3.success'), "", Phase.PHASE4)}
                    className="p-4 rounded-xl border border-white/10 hover:bg-white/5 text-left transition-all text-base leading-relaxed"
                  >
                    {t('activities.tilt_orbit.phase3.choices.2')}
                  </button>
                </div>
              </div>
              {feedback && (
                <div className={`p-4 rounded-xl flex items-center space-x-3 text-base leading-relaxed ${feedback.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
                  {feedback.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  <p>{feedback.text}</p>
                </div>
              )}
            </div>
            <div className="relative h-[400px] lg:h-full bg-black/40 rounded-2xl overflow-hidden border border-white/5">
              <div className="absolute top-4 right-4 z-10 bg-black/60 px-3 py-1 rounded-full text-[10px] font-bold text-[#39FF14] border border-[#39FF14]/30">
                {t('activities.tilt_orbit.finland_pinpoint')}
              </div>

              {/* Horizontal Pole Control */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 w-full max-w-xs">
                <span className="text-[10px] font-bold text-white/50 uppercase mb-1">{t('activities.tilt_orbit.move_to_see_poles')}</span>
                <div className="flex items-center bg-white/5 rounded-full p-4 border border-white/10 w-full justify-between">
                  <span className="text-[8px] font-bold text-neon-pink">{t('activities.tilt_orbit.south')}</span>
                  <input 
                    type="range" 
                    min={-Math.PI/2} 
                    max={Math.PI/2} 
                    step={0.01}
                    value={poleRotation}
                    onChange={(e) => setPoleRotation(parseFloat(e.target.value))}
                    className="flex-1 mx-4 h-1 appearance-none bg-white/10 rounded-full cursor-pointer accent-neon-blue"
                  />
                  <span className="text-[8px] font-bold text-neon-blue">{t('activities.tilt_orbit.north')}</span>
                </div>
              </div>

              <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
                <color attach="background" args={['#000005']} />
                <StarBackground />
                <ambientLight intensity={0.15} />
                <EffectComposer>
                  <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.2} intensity={0.7} />
                </EffectComposer>
                <PerspectiveCamera makeDefault position={[0, 10, 40]} fov={45} />
                <Sun position={[150, 0, 0]} />
                <Earth position={[0, 0, 0]} rotationActive={true} tiltActive={true} revolutionActive={false} showFinland={true} poleRotation={poleRotation} sunPos={[150, 0, 0]} />
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
          <div className="flex flex-col h-full min-h-0">
            <div className="relative bg-black/40 rounded-2xl overflow-hidden border border-white/5 flex-1 min-h-[500px] flex min-w-0">
              
              {/* Sidebar Toggle Button */}
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`absolute top-4 z-50 p-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all duration-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] ${
                  isSidebarOpen ? 'left-[268px]' : 'left-4'
                }`}
                title={isSidebarOpen ? t('activities.tilt_orbit.collapse_sidebar') : t('activities.tilt_orbit.expand_sidebar')}
              >
                {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>

              {/* Sidebar */}
              <div className={`${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden opacity-0'} shrink-0 border-r border-white/10 p-4 flex flex-col gap-4 z-10 bg-black/40 backdrop-blur-md overflow-y-auto transition-all duration-300`}>
                
                {/* View Controls */}
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => setViewMode(ViewMode.EARTH_FREE)}
                    className={`p-2 rounded-xl flex items-center gap-2 transition-all border ${viewMode === ViewMode.EARTH_FREE ? 'bg-neon-blue border-neon-blue text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'bg-black/40 border-white/10 text-white/70 hover:bg-white/10'}`}
                  >
                    <Globe size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{t('activities.tilt_orbit.view_modes.earth_free')}</span>
                  </button>
                  <button 
                    onClick={() => setViewMode(ViewMode.SYSTEM_TOP)}
                    className={`p-2 rounded-xl flex items-center gap-2 transition-all border ${viewMode === ViewMode.SYSTEM_TOP ? 'bg-neon-blue border-neon-blue text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'bg-black/40 border-white/10 text-white/70 hover:bg-white/10'}`}
                  >
                    <Layout size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{t('activities.tilt_orbit.view_modes.system_top')}</span>
                  </button>
                </div>

                {/* Date Selection */}
                <div className="glass-panel border-l-2 border-neon-purple p-3 bg-black/40 shadow-lg">
                  <h3 className="font-bold text-neon-purple text-[10px] mb-2 uppercase tracking-widest flex items-center gap-1">
                    <Calendar size={12} /> {t('activities.tilt_orbit.select_date')}
                  </h3>
                  <div className="flex gap-2">
                    <select 
                      value={orbitDate.split('-')[1]}
                      onChange={(e) => {
                        const [y, m, d] = orbitDate.split('-');
                        const newMonth = e.target.value;
                        const newDaysInMonth = new Date(parseInt(y), parseInt(newMonth), 0).getDate();
                        const newDay = parseInt(d) > newDaysInMonth ? newDaysInMonth.toString().padStart(2, '0') : d;
                        setOrbitDate(`${y}-${newMonth}-${newDay}`);
                      }}
                      className="flex-1 bg-space-900/80 border border-white/10 rounded p-1.5 text-[10px] text-white focus:border-neon-blue outline-none cursor-pointer hover:bg-space-800 transition-colors"
                    >
                      <option value="01">{t('months.january')}</option>
                      <option value="02">{t('months.february')}</option>
                      <option value="03">{t('months.march')}</option>
                      <option value="04">{t('months.april')}</option>
                      <option value="05">{t('months.may')}</option>
                      <option value="06">{t('months.june')}</option>
                      <option value="07">{t('months.july')}</option>
                      <option value="08">{t('months.august')}</option>
                      <option value="09">{t('months.september')}</option>
                      <option value="10">{t('months.october')}</option>
                      <option value="11">{t('months.november')}</option>
                      <option value="12">{t('months.december')}</option>
                    </select>
                    <select 
                      value={orbitDate.split('-')[2]}
                      onChange={(e) => {
                        const [y, m, d] = orbitDate.split('-');
                        setOrbitDate(`${y}-${m}-${e.target.value}`);
                      }}
                      className="w-12 bg-space-900/80 border border-white/10 rounded p-1.5 text-[10px] text-white focus:border-neon-blue outline-none cursor-pointer hover:bg-space-800 transition-colors"
                    >
                      {Array.from({ length: new Date(parseInt(orbitDate.split('-')[0]), parseInt(orbitDate.split('-')[1]), 0).getDate() }, (_, i) => (i + 1).toString().padStart(2, '0')).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Finland Data */}
                <div className="glass-panel border-l-2 border-neon-pink p-3 bg-black/40 shadow-lg">
                  <h3 className="font-bold text-neon-pink text-[10px] mb-2 uppercase tracking-widest">{t('activities.tilt_orbit.finland_data')}</h3>
                  <div className="grid grid-cols-1 gap-1.5 text-[10px] leading-relaxed">
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-gray-400">{t('activities.tilt_orbit.data_labels.season')}:</span>
                      <span className="text-white font-bold">{finlandData.season}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-gray-400">{t('activities.tilt_orbit.data_labels.daylight')}:</span>
                      <span className="text-white font-mono">{finlandData.daylight}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-gray-400">{t('activities.tilt_orbit.data_labels.avg_temp')}:</span>
                      <span className="text-white font-mono">{finlandData.temp}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-gray-400">{t('activities.tilt_orbit.data_labels.nature')}:</span>
                      <span className="text-white text-right">{finlandData.nature}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('activities.tilt_orbit.data_labels.dist_to_sun')}:</span>
                      <span className="text-white font-mono">{finlandData.dist}</span>
                    </div>
                  </div>
                </div>

                {/* Astronaut & Home */}
                <div className="flex flex-col gap-3 mt-auto">
                  <div className="astronaut-box flex flex-row items-center space-x-3 p-3 bg-black/40 border border-white/10 shadow-lg rounded-xl">
                    <img 
                      src="https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/icons/astronaut.png" 
                      alt="Astronaut" 
                      className="w-10 h-10 shrink-0 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                    />
                    <p className="text-xs leading-snug text-gray-200 text-left m-0 italic font-medium">
                      {t('activities.tilt_orbit.phase4.astronaut_hint')}
                    </p>
                  </div>
                  
                  <button 
                    onClick={onHome} 
                    className="btn-primary w-full py-3 text-xs uppercase font-bold tracking-widest shadow-lg"
                  >
                    {t('common.back_to_dashboard')}
                  </button>
                </div>

              </div>

              {/* Main 3D Canvas */}
              <div className="flex-1 relative w-full h-full min-w-0">
                <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
                <color attach="background" args={['#000005']} />
                <StarBackground />
                <ambientLight intensity={0.15} />
                <EffectComposer>
                  <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.2} intensity={0.7} />
                </EffectComposer>
                {(() => {
                  const date = new Date(orbitDate);
                  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
                  
                  // Correct orbital position:
                  // Aphelion (July 4, day 185) is when Earth is at maximum distance (-X relative to Sun)
                  const angle = ((dayOfYear - 185) / 365) * 2 * Math.PI + Math.PI;
                  
                  const curve = new THREE.EllipseCurve(-FOCAL_OFFSET, 0, SEMI_MAJOR_AXIS, SEMI_MINOR_AXIS, 0, 2 * Math.PI, false, 0);
                  const points = curve.getPoints(128);
                  const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p.x, 0, p.y)));

                  const x = -FOCAL_OFFSET + SEMI_MAJOR_AXIS * Math.cos(angle);
                  const z = SEMI_MINOR_AXIS * Math.sin(angle);

                  // Approximate Moon phase for the date
                  // New Moon on June 15, 2026 (day 166)
                  const moonRotation = ((dayOfYear - 166) / 29.5) * 2 * Math.PI;

                  return (
                    <>
                      <PerspectiveCamera makeDefault fov={45} far={10000} />
                      <CameraController 
                        viewMode={viewMode} 
                        earthTarget={[x, 0, z]} 
                        orbitCenter={[-FOCAL_OFFSET, 0, 0]} 
                      />
                      <OrbitControls 
                        makeDefault
                        enableZoom={viewMode !== ViewMode.SYSTEM_TOP} 
                        enablePan={viewMode !== ViewMode.SYSTEM_TOP} 
                        enableRotate={viewMode !== ViewMode.SYSTEM_TOP} 
                        enableDamping={false}
                        minDistance={5}
                        maxDistance={1500}
                      />
                      <Sun position={TOP_DOWN_SUN_POSITION} />
                      <lineLoop geometry={geometry}>
                        <lineBasicMaterial color="#00e5ff" opacity={0.8} transparent />
                      </lineLoop>
                      {viewMode === ViewMode.SYSTEM_TOP && <OrbitLabels />}
                      <Earth 
                        position={[x, 0, z]} 
                        rotationActive={true} 
                        tiltActive={true} 
                        revolutionActive={false} 
                        showFinland={true} 
                        poleRotation={0} 
                        sunPos={TOP_DOWN_SUN_POSITION} // Pass world position of Sun for correct lighting
                        showMoon={true}
                        moonRotation={moonRotation}
                        isTopDownView={viewMode === ViewMode.SYSTEM_TOP}
                      />
                    </>
                  );
                })()}
              </Canvas>
              </div>
            </div>
          </div>
        );

      case Phase.FINISHED:
        return (
          <div className="max-w-7xl mx-auto text-center space-y-8 py-12">
            <div className="inline-flex p-4 bg-neon-green/10 rounded-full mb-4">
              <CheckCircle2 size={64} className="text-neon-green" />
            </div>
            <h2 className="text-2xl font-bold text-white">{t('activities.tilt_orbit.finished.title')}</h2>
            <div className="glass-panel space-y-4 text-left">
              <p className="text-base leading-relaxed text-gray-300">{t('activities.tilt_orbit.finished.summary')}:</p>
              <ul className="space-y-3">
                <li className="flex items-center text-neon-blue">
                  <RotateCw className="mr-3" size={20} /> {t('activities.tilt_orbit.finished.tasks.0')}
                </li>
                <li className="flex items-center text-neon-pink">
                  <Move className="mr-3" size={20} /> {t('activities.tilt_orbit.finished.tasks.1')}
                </li>
                <li className="flex items-center text-neon-green">
                  <Globe className="mr-3" size={20} /> {t('activities.tilt_orbit.finished.tasks.2')}
                </li>
              </ul>
              <p className="text-base leading-relaxed text-white mt-6 font-bold">{t('activities.tilt_orbit.finished.next_steps')}</p>
            </div>
            {renderGuruBubble(t('activities.tilt_orbit.finished.astronaut_message'))}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={onHome} 
                className="btn-secondary px-8 py-3"
              >
                {t('common.back_to_dashboard')}
              </button>
              {onNavigateToSolarSystem && (
                <button 
                  onClick={onNavigateToSolarSystem}
                  className="btn-primary px-8 py-3"
                >
                  <Globe className="mr-2" size={20} /> {t('activities.tilt_orbit.go_to_solar_system')}
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
