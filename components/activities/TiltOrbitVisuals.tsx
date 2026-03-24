import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const TEXTURE_BASE_URL = 'https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/texture/';

interface TiltOrbitVisualsProps {
  phase: 'phase1' | 'phase2' | 'phase3' | 'phase4';
  isRotating: boolean;
  isTilted: boolean;
  isRevolving: boolean;
  orbitDate?: Date;
}

const getLatLonPosition = (lat: number, lon: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = lon * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.sin(theta));
  const z = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = (radius * Math.cos(phi));
  return [x, y, z];
};

const Earth: React.FC<{ 
  isRotating: boolean; 
  isTilted: boolean;
  orbitAngle?: number;
}> = ({ isRotating, isTilted, orbitAngle = 0 }) => {
  const earthRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const [dayMap, nightMap, specularMap, cloudsMap] = useLoader(THREE.TextureLoader, [
    `${TEXTURE_BASE_URL}earth_day.jpg`,
    `${TEXTURE_BASE_URL}earth_night.jpg`,
    `${TEXTURE_BASE_URL}earth_specular.jpg`,
    `${TEXTURE_BASE_URL}earth_clouds.jpg`,
  ]);

  useFrame((state, delta) => {
    if (isRotating && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  const tiltRad = isTilted ? (23.5 * Math.PI) / 180 : 0;
  const finlandPos = getLatLonPosition(60, 25, 2);

  return (
    <group 
      ref={earthRef} 
      rotation={[0, 0, tiltRad]}
    >
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial 
          map={dayMap}
          roughnessMap={specularMap}
          metalness={0.1}
        />
        {/* Finland Marker (approx 60N, 25E) */}
        <mesh position={finlandPos as [number, number, number]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>
      </mesh>
      {/* Simple clouds layer */}
      <mesh scale={[1.01, 1.01, 1.01]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial 
          map={cloudsMap} 
          transparent 
          opacity={0.4} 
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

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
  // Simplified rotation to prevent texture distortion while remaining scientifically grounded.
  // The Sun's average rotation period is approximately 27 Earth days.
  float speed = 1.0 / 27.0;
  
  // time is in radians (0 to 2PI represents one Earth day in this simulation context)
  float days = time / 6.28318530718;
  float offset = days * speed;
  
  vec2 uv = vUv;
  // Use the raw offset. Hardware RepeatWrapping (configured in JS) handles the wrap-around 
  // seamlessly without the mipmap "seam" artifact caused by manual fract().
  uv.x -= offset;
  
  gl_FragColor = texture2D(sunTexture, uv);
}
`;

const Sun: React.FC = () => {
  const sunTexture = useLoader(THREE.TextureLoader, `${TEXTURE_BASE_URL}sun.jpg`);

  React.useEffect(() => {
    if (sunTexture) {
      sunTexture.wrapS = THREE.RepeatWrapping;
      sunTexture.wrapT = THREE.RepeatWrapping;
      sunTexture.needsUpdate = true;
    }
  }, [sunTexture]);

  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);

  const uniforms = useMemo(() => ({
    sunTexture: { value: sunTexture },
    time: { value: 0 }
  }), [sunTexture]);

  useFrame((state, delta) => {
    timeRef.current += delta * 0.5; // 0.5 is Earth's rotation speed in this file
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = timeRef.current;
    }
  });

  return (
    <mesh position={[-15, 0, 0]}>
      <sphereGeometry args={[4, 32, 32]} />
      <shaderMaterial 
        ref={materialRef}
        vertexShader={sunVertexShader}
        fragmentShader={sunFragmentShader}
        uniforms={uniforms}
      />
      <pointLight intensity={2000} distance={100} decay={2} />
    </mesh>
  );
};

const OrbitScene: React.FC<TiltOrbitVisualsProps> = ({ 
  phase, 
  isRotating, 
  isTilted, 
  isRevolving,
  orbitDate 
}) => {
  const earthContainerRef = useRef<THREE.Group>(null);

  // Calculate orbit position based on date if in phase 4
  const orbitAngle = useMemo(() => {
    if (phase !== 'phase4' || !orbitDate) return 0;
    const startOfYear = new Date(orbitDate.getFullYear(), 0, 1);
    const diff = orbitDate.getTime() - startOfYear.getTime();
    const dayOfYear = diff / (1000 * 60 * 60 * 24);
    // 0 is around Spring Equinox (March 21)
    // We offset so Jan 1 is at some angle
    return (dayOfYear / 365) * Math.PI * 2 - (Math.PI / 2); // Rough approximation
  }, [orbitDate, phase]);

  useFrame((state, delta) => {
    if (isRevolving && earthContainerRef.current) {
      // In a real orbit simulator, we'd update the angle over time
      // but here we might just want to show the static position for the date
    }
  });

  const earthPos: [number, number, number] = phase === 'phase4' 
    ? [12 * Math.cos(orbitAngle), 0, 12 * Math.sin(orbitAngle)]
    : [5, 0, 0];

  return (
    <>
      <ambientLight intensity={0.2} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <Sun />
      
      <group ref={earthContainerRef} position={earthPos}>
        <Earth isRotating={isRotating} isTilted={isTilted} />
      </group>

      <OrbitControls 
        enablePan={false} 
        minDistance={5} 
        maxDistance={50}
        autoRotate={phase === 'phase1'}
        autoRotateSpeed={0.5}
      />
    </>
  );
};

const TiltOrbitVisuals: React.FC<TiltOrbitVisualsProps> = (props) => {
  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 10, 20]} fov={45} />
        <React.Suspense fallback={null}>
          <OrbitScene {...props} />
        </React.Suspense>
      </Canvas>
      
      {/* Loading Overlay */}
      <React.Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center bg-space-900/80 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-neon-blue font-mono animate-pulse">LOADING SPACE DATA...</p>
          </div>
        </div>
      }>
        <div />
      </React.Suspense>
    </div>
  );
};

export default TiltOrbitVisuals;
