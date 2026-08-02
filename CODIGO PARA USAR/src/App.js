import * as THREE from 'three/webgpu'
import * as TSL from 'three/tsl'
import { ao } from 'three/examples/jsm/tsl/display/GTAONode'
import { ssr } from 'three/examples/jsm/tsl/display/SSRNode'
import { smaa } from 'three/examples/jsm/tsl/display/SMAANode'
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode'
import { traa } from 'three/examples/jsm/tsl/display/TRAANode'
import { ssgi } from './effects/SSGINode'

import { useRef, useReducer, useMemo, useState, useLayoutEffect } from 'react'
import { Canvas, extend, useThree, useFrame } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { BallCollider, Physics, RigidBody } from '@react-three/rapier'
import { easing } from 'maath'

const accents = ['#ff4060', '#ffcc00', '#20ffa0', '#2060ff']
const shuffle = (accent = 0) => [{ color: '#444' }, { color: '#444' }, { color: '#444' }, { color: 'white' }, { color: 'white' }, { color: 'white' }, { color: accents[accent], accent: true }, { color: accents[accent], accent: true }, { color: accents[accent], accent: true }, { color: '#444' }, { color: '#444' }, { color: '#444' }, { color: 'white' }, { color: 'white' }, { color: 'white' }, { color: accents[accent], accent: true }, { color: accents[accent], accent: true }, { color: accents[accent], accent: true }]

export default function App() {
  const [accent, click] = useReducer((state) => ++state % accents.length, 0)
  const connectors = useMemo(() => shuffle(accent), [accent])
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={(props) => {
        extend(THREE)
        const renderer = new THREE.WebGPURenderer({ ...props, antialias: false })
        return renderer.init().then(() => renderer)
      }}
      onClick={click}
      camera={{ position: [0, 0, 30], fov: 17.5 }}>
      <color attach="background" args={['#eee']} />
      <ambientLight intensity={2} />
      <Physics /*debug*/ timeStep="vary" gravity={[0, 0, 0]}>
        <Pointer />
        {connectors.map((props, i) => <Sphere key={i} {...props} />) /* prettier-ignore */}
      </Physics>
      <Environment>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer form="circle" intensity={100} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
          <Lightformer form="circle" intensity={0} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
          <Lightformer form="circle" intensity={0} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={8} />
          <Lightformer form="ring" color="red" intensity={80} onUpdate={(self) => self.lookAt(0, 0, 0)} position={[10, 10, 0]} scale={10} />
        </group>
      </Environment>
      <Effects />
    </Canvas>
  )
}

function Sphere({ position, children, vec = new THREE.Vector3(), scale, r = THREE.MathUtils.randFloatSpread, accent, color = 'white', ...props }) {
  const api = useRef()
  const ref = useRef()
  const pos = useMemo(() => position || [r(10), r(10), r(10)], [])
  useFrame((state, delta) => {
    delta = Math.min(0.1, delta)
    api.current?.applyImpulse(vec.copy(api.current.translation()).negate().multiplyScalar(0.25))
    easing.dampC(ref.current.material.color, color, 0.2, delta)
  })
  return (
    <RigidBody linearDamping={4} angularDamping={1} friction={0.1} position={pos} ref={api} colliders={false}>
      <BallCollider args={[1]} />
      <mesh ref={ref} castShadow receiveShadow>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhysicalMaterial {...props} metalness={0.5} roughness={0.2} />
        {children}
      </mesh>
    </RigidBody>
  )
}

function Pointer({ vec = new THREE.Vector3() }) {
  const ref = useRef()
  useFrame(({ mouse, viewport }) => ref.current?.setNextKinematicTranslation(vec.set((mouse.x * viewport.width) / 2, (mouse.y * viewport.height) / 2, 0)))
  return (
    <RigidBody type="kinematicPosition" colliders={false} ref={ref}>
      <BallCollider args={[1]} />
    </RigidBody>
  )
}

function Effects() {
  const { gl, scene, camera } = useThree()
  const [postProcessing] = useState(() => new THREE.PostProcessing(gl))
  // Configure passes
  useLayoutEffect(() => {
    const scenePass = TSL.pass(scene, camera, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter })
    scenePass.setMRT(TSL.mrt({ output: TSL.output, normal: TSL.directionToColor(TSL.normalView), metalrough: TSL.vec2(TSL.metalness, TSL.roughness), velocity: TSL.velocity }))
    const scenePassColor = scenePass.getTextureNode('output')
    const scenePassNormal = scenePass.getTextureNode('normal')
    const scenePassDepth = scenePass.getTextureNode('depth')
    const scenePassVelocity = scenePass.getTextureNode('velocity')
    const scenePassMetalRough = scenePass.getTextureNode('metalrough')
    const sceneNormal = TSL.sample((uv) => TSL.colorToDirection(scenePassNormal.sample(uv)))
    const ssrPass = ssr(scenePassColor, scenePassDepth, sceneNormal, scenePassMetalRough.r, scenePassMetalRough.g)
    ssrPass.maxDistance.value = 5
    ssrPass.blurQuality.value = 1
    ssrPass.thickness.value = 0.15
    ssrPass.resolutionScale = 1
    const bloomPass = bloom(scenePassColor, 0.1, 0.8, 0.9)
    const ssgiPass = ssgi(scenePassColor, scenePassDepth, sceneNormal, camera)
    ssgiPass.sliceCount.value = 2
    ssgiPass.stepCount.value = 8
    ssgiPass.radius.value = 25
    ssgiPass.giIntensity.value = 100
    ssgiPass.aoIntensity.value = 3
    ssgiPass.thickness.value = 0.5
    // Extract GI and AO from SSGI (following example)
    const _gi = ssgiPass.rgb
    const _ao = ssgiPass.a
    // Composite: sceneColor * AO + diffuseColor * GI (following example)
    finalColor = TSL.vec4(TSL.add(scenePassColor.rgb.mul(_ao), scenePassColor.rgb.mul(_gi)), scenePassColor.a)
    const blendPassAO = finalColor.add(bloomPass)
    const compositePass = TSL.blendColor(blendPassAO, ssrPass)
    // Apply TRAA (Temporal Reprojection Anti-Aliasing) - following example
    const traaPass = traa(compositePass, scenePassDepth, scenePassVelocity, camera)
    postProcessing.outputNode = traaPass
    postProcessing.needsUpdate = true
  }, [scene, camera])
  // Take over render queue
  useFrame(() => postProcessing.render(), 1)
}
