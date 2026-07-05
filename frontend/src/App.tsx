import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { trazaMock } from './trace/mockTrace'   // ← el reproductor necesita los datos de la traza

function Planet() {
    const ref = useRef<THREE.Mesh>(null)

    useFrame(() => {
        if (ref.current) ref.current.rotation.y += 0.01
    })

    return (
        <mesh ref={ref}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color="royalblue" />
        </mesh>
    )
}

function App() {
    const [paso, setPaso] = useState(0)

    function avanzar() {

        setPaso(Math.min((paso + 1), trazaMock.length - 1))

    }

    function reiniciar() {
        setPaso(0)
    }

    function retroceder() {

        setPaso(Math.max((paso - 1), 0))

    }

    return (
        <>
            <Canvas>
                <ambientLight intensity={1} />
                <pointLight position={[5, 5, 5]} intensity={100} />
                <Planet />
                <OrbitControls />
            </Canvas>

            {/* overlay HTML encima del canvas */}
            <div
                style={{
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    color: 'white',
                    background: 'rgba(0, 0, 0, 0.6)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                }}
            >
                <p>
                    Paso {paso}: {JSON.stringify(trazaMock[paso])}
                </p>
                <button onClick={avanzar}>
                    Siguiente
                </button>
                <button onClick={reiniciar}>
                    Reiniciar
                </button>
                <button onClick={retroceder}>
                    Retroceder
                </button>
            </div>
        </>
    )
}

export default App