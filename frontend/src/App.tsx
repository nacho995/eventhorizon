import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { trazaMock } from './trace/mockTrace'   // ← el reproductor necesita los datos de la traza
import { estadoEnPaso } from './trace/estado'

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

type EstrellasProps = {
    valores: string[]
}

function Estrellas({ valores }: EstrellasProps) {
    const posiciones: [number, number, number][] = [
        [-2, 1.5, 0],
        [-0.8, 2.2, -0.5],
        [0.8, 1.8, -0.3],
        [2, 2.4, 0],
    ]

    return (
        <>
            {valores.map((valor, index) => (
                <mesh
                    key={`${valor}-${index}`}
                    position={posiciones[index]}
                >
                    <sphereGeometry args={[0.12, 16, 16]} />
                    <meshBasicMaterial color="white" />
                </mesh>
            ))}
        </>
    )
}

type ColaNavesProps = {
    naves: string[]
    x: number
    color: string
}

function ColaNaves({ naves, x, color }: ColaNavesProps) {
    return (
        <>
            {naves.map((naveId, index) => (
                <mesh
                    key={naveId}
                    position={[x + index * 0.5, -1.7, 0]}
                    rotation={[0, 0, -Math.PI / 2]}
                >
                    <coneGeometry args={[0.18, 0.45, 16]} />
                    <meshStandardMaterial color={color} />
                </mesh>
            ))}
        </>
    )
}

type NavesEnOrbitaProps = {
    naves: string[]
    radio?: number
    color?: string
}

// Las naves en órbita (Web APIs) rodean el planeta en círculo, en el plano XZ y
// a la altura del centro (y=0). Disposición RADIAL con trigonometría — distinta
// de las colas (filas lineales), por eso es un componente propio y NO reutiliza
// ColaNaves: forzar esa reutilización sería la abstracción equivocada.
function NavesEnOrbita({ naves, radio = 2.5, color = 'magenta' }: NavesEnOrbitaProps) {
    return (
        <>
            {naves.map((naveId, index) => {
                // reparte las naves equiespaciadas alrededor del círculo completo (2π)
                const angulo = (index / naves.length) * Math.PI * 2
                const x = radio * Math.cos(angulo)
                const z = radio * Math.sin(angulo)
                return (
                    <mesh key={naveId} position={[x, 0, z]}>
                        <coneGeometry args={[0.18, 0.45, 16]} />
                        <meshStandardMaterial color={color} />
                    </mesh>
                )
            })}
        </>
    )
}

function App() {
    const [paso, setPaso] = useState(0)
    const estado = estadoEnPaso(trazaMock, paso)

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
                <Estrellas valores={estado.estrellas} />
                <ColaNaves naves={estado.colaVIP} x={-2} color="cyan" />
                <ColaNaves naves={estado.colaNormal} x={1.2} color="orange" />
                <NavesEnOrbita naves={estado.orbitando} />
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
                <p>
                    Estado: {JSON.stringify(estado)}
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