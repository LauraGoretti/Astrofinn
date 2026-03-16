import * as THREE from 'three'
import { ThreeElement } from '@react-three/fiber'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: ThreeElement<typeof THREE.Mesh>
      sphereGeometry: ThreeElement<typeof THREE.SphereGeometry>
      meshStandardMaterial: ThreeElement<typeof THREE.MeshStandardMaterial>
      meshBasicMaterial: ThreeElement<typeof THREE.MeshBasicMaterial>
      meshLambertMaterial: ThreeElement<typeof THREE.MeshLambertMaterial>
      ambientLight: ThreeElement<typeof THREE.AmbientLight>
      pointLight: ThreeElement<typeof THREE.PointLight>
      directionalLight: ThreeElement<typeof THREE.DirectionalLight>
      group: ThreeElement<typeof THREE.Group>
      primitive: ThreeElement<typeof THREE.Object3D>
      lineLoop: ThreeElement<typeof THREE.LineLoop>
      lineBasicMaterial: ThreeElement<typeof THREE.LineBasicMaterial>
      shaderMaterial: ThreeElement<typeof THREE.ShaderMaterial>
      points: ThreeElement<typeof THREE.Points>
      bufferGeometry: ThreeElement<typeof THREE.BufferGeometry>
      bufferAttribute: ThreeElement<typeof THREE.BufferAttribute>
      sprite: ThreeElement<typeof THREE.Sprite>
      orthographicCamera: ThreeElement<typeof THREE.OrthographicCamera>
      ringGeometry: ThreeElement<typeof THREE.RingGeometry>
      cylinderGeometry: ThreeElement<typeof THREE.CylinderGeometry>
      color: ThreeElement<typeof THREE.Color>
    }
  }
}
