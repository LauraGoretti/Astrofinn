import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

const TEXTURE_BASE_URL = 'https://raw.githubusercontent.com/LauraGoretti/Astrofinn/main/texture/';

// --- SHADERS (Adapted from Earth3D.tsx) ---

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
  
  // sunPosition is in World Space. Transform to View Space.
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
  float dayFactor = smoothstep(-0.2, 0.2, dotProd);

  vec3 dayColor = texture2D(dayTexture, vUv).rgb;
  vec3 nightColorSample = texture2D(nightTexture, vUv).rgb;
  float specularStrength = texture2D(specularMapTexture, vUv).r;
  
  float diffuse = max(dotProd, 0.0);
  
  vec3 halfVector = normalize(sunDir + viewDir);
  float NdotH = max(dot(normal, halfVector), 0.0);
  float specular = pow(NdotH, 80.0) * specularStrength;
  vec3 specularColor = vec3(1.0, 0.95, 0.8) * specular * 0.8;
  
  vec3 finalDay = dayColor * (diffuse + 0.1) + specularColor; 
  vec3 cleanNight = max(nightColorSample - 0.2, 0.0);
  vec3 finalNight = cleanNight * vec3(6.0, 4.5, 3.0); 
  
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

// Improved High-Quality Atmosphere Shader from Earth3D
const atmosphereFragmentShader = `
varying vec3 vNormal;
void main() {
  float viewDot = dot(vNormal, vec3(0, 0, 1.0));
  float intensity = pow(clamp(1.0 + viewDot, 0.0, 1.0), 4.0);
  vec3 atmosphereColor = vec3(0.3, 0.6, 1.0);
  gl_FragColor = vec4(atmosphereColor, 1.0) * intensity * 0.3;
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

// --- HELPER FUNCTIONS ---

interface KaamosEarthProps {
  dayOfYear: number; // 1-365
  hour: number; // 0-24
}

const KaamosEarth: React.FC<KaamosEarthProps> = ({ dayOfYear, hour }) => {
  const [dayTexture, nightTexture, specularMap, sunTexture, starsTexture, cloudsTexture] = useLoader(THREE.TextureLoader, [
    `${TEXTURE_BASE_URL}earth_day.jpg`,
    `${TEXTURE_BASE_URL}earth_night.jpg`,
    `${TEXTURE_BASE_URL}earth_specular.jpg`,
    `${TEXTURE_BASE_URL}sun.jpg`,
    `${TEXTURE_BASE_URL}stars_milky_way.jpg`,
    `${TEXTURE_BASE_URL}earth_clouds.jpg`,
  ]);

  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const haloMaterialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Earth Axial Tilt: 23.5 degrees
  const AXIAL_TILT = 23.5 * (Math.PI / 180);
  
  // Calculate Sun Angle based on Day of Year
  // Day 172 is approx Summer Solstice (June 21) -> Angle 0 (Sun at +Z, North Pole tilts towards Sun)
  const sunAngle = ((dayOfYear - 172) / 365) * 2 * Math.PI;
  
  const sunDistance = 50;
  const sunX = sunDistance * Math.sin(sunAngle);
  const sunZ = sunDistance * Math.cos(sunAngle);
  const sunPosition = new THREE.Vector3(sunX, 0, sunZ);

  const earthRotationY = (hour / 24) * 2 * Math.PI + Math.PI; // + PI to face night at 00:00?

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.sunPosition.value.copy(sunPosition);
    }
    // Rotate clouds slightly faster/independent of earth for visual effect
    if (cloudsRef.current) {
       cloudsRef.current.rotation.y += delta * 0.005;
    }
    // Animate Sun Halo
    if (haloMaterialRef.current) {
      haloMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <group>
      {/* Background Stars */}
      <mesh renderOrder={-1}>
          <sphereGeometry args={[400, 64, 64]} />
          <meshBasicMaterial 
            map={starsTexture} 
            side={THREE.BackSide} 
            toneMapped={false}
            color="#cccccc" 
            transparent
            opacity={1.0}
            depthWrite={false}
          />
      </mesh>

      {/* Sun Light */}
      <directionalLight position={sunPosition} intensity={1.5} />
      <ambientLight intensity={0.1} />
      
      {/* Sun Marker (Textured + Halo) */}
      <group position={sunPosition}>
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial map={sunTexture} toneMapped={false} color={[1.5, 1.5, 1.5]} />
        </mesh>
        {/* Sun Halo Sprite */}
        <sprite scale={[12, 12, 1]}>
          <shaderMaterial
            ref={haloMaterialRef}
            vertexShader={haloVertexShader}
            fragmentShader={haloFragmentShader}
            uniforms={{ uTime: { value: 0 } }}
            transparent={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      </group>

      {/* Tilted Earth Group */}
      <group rotation={[AXIAL_TILT, 0, 0]}> 
        {/* Earth Mesh - Rotates on its axis (Y) */}
        <group rotation={[0, earthRotationY, 0]}>
          <mesh ref={earthRef}>
            <sphereGeometry args={[2, 64, 64]} />
            <shaderMaterial
              ref={materialRef}
              vertexShader={earthVertexShader}
              fragmentShader={earthFragmentShader}
              uniforms={{
                dayTexture: { value: dayTexture },
                nightTexture: { value: nightTexture },
                specularMapTexture: { value: specularMap },
                sunPosition: { value: sunPosition } // Initial value, updated in useFrame
              }}
            />
          </mesh>
          
          {/* Clouds Layer */}
          <mesh ref={cloudsRef} scale={[1.02, 1.02, 1.02]}>
             <sphereGeometry args={[2, 64, 64]} />
             <meshStandardMaterial 
               map={cloudsTexture} 
               transparent 
               opacity={0.4} 
               blending={THREE.AdditiveBlending} 
               side={THREE.DoubleSide}
               depthWrite={false}
             />
          </mesh>

          {/* Atmosphere Glow */}
          <mesh scale={[1.15, 1.15, 1.15]}>
            <sphereGeometry args={[2, 64, 64]} />
            <shaderMaterial
              vertexShader={atmosphereVertexShader}
              fragmentShader={atmosphereFragmentShader}
              transparent
              side={THREE.BackSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
        
        {/* Axis Line */}
        <mesh>
            <cylinderGeometry args={[0.02, 0.02, 5, 8]} />
            <meshBasicMaterial color="#FFFFFF" opacity={0.3} transparent />
        </mesh>
      </group>
    </group>
  );
};

export default KaamosEarth;
