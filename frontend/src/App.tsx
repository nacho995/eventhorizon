import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

function Planet() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(() => {
    // gira el planeta un poco cada frame:
    if (ref.current) ref.current.rotation.y += 0.01
  })

  return (
      <mesh ref={ref}>
        <sphereGeometry args={[1, 32, 32]} />   {/* radio 1, 32x32 segmentos */}
        <meshStandardMaterial color="royalblue" />
      </mesh>
  )
}

function App() {
  return (
      <Canvas>
          <ambientLight intensity={1} />
          <pointLight position={[5, 5, 5]} intensity={100} />          {/* una luz puntual */}
          <Planet />
          <OrbitControls />                             {/* rotar/zoom con el ratón */}
      </Canvas>
  )
}

export default App