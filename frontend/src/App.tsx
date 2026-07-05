import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
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
                // group = contenedor de transformación: posiciona la estrella Y su
                // etiqueta juntas; dentro, cada hijo se coloca relativo al group.
                <group key={`${valor}-${index}`} position={posiciones[index]}>
                    <mesh>
                        <sphereGeometry args={[0.12, 16, 16]} />
                        <meshBasicMaterial color="white" />
                    </mesh>
                    <Text position={[0, 0.28, 0]} fontSize={0.22} color="white" anchorX="center">
                        {valor}
                    </Text>
                </group>
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
                <group key={naveId} position={[x + index * 0.5, -1.7, 0]}>
                    {/* la rotación va SOLO en el mesh, no en el group: así el cono
                        apunta de lado pero la etiqueta NO hereda el giro y queda legible */}
                    <mesh rotation={[0, 0, -Math.PI / 2]}>
                        <coneGeometry args={[0.18, 0.45, 16]} />
                        <meshStandardMaterial color={color} />
                    </mesh>
                    <Text position={[0, 0.4, 0]} fontSize={0.16} color={color} anchorX="center">
                        {naveId}
                    </Text>
                </group>
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
                    <group key={naveId} position={[x, 0, z]}>
                        <mesh>
                            <coneGeometry args={[0.18, 0.45, 16]} />
                            <meshStandardMaterial color={color} />
                        </mesh>
                        <Text position={[0, 0.4, 0]} fontSize={0.16} color={color} anchorX="center">
                            {naveId}
                        </Text>
                    </group>
                )
            })}
        </>
    )
}

// Etiquetas fijas de cada zona del event loop, con el color de su región para
// reforzar la asociación. Texto 3D (drei <Text>) que vive dentro de la escena.
// Nota: <Text> tiene orientación fija (mira a +z); al orbitar la cámara se ve de
// lado — envolver en <Billboard> (drei) para que siempre mire al usuario es la
// mejora pendiente.
function EtiquetasZona() {
    return (
        <>
            <Text position={[0, -0.1, 1.3]} fontSize={0.22} color="royalblue" anchorX="center">
                Call Stack
            </Text>
            <Text position={[0, 2.9, 0]} fontSize={0.2} color="white" anchorX="center">
                console.log
            </Text>
            <Text position={[3, 0, 0]} fontSize={0.2} color="magenta" anchorX="center">
                Web APIs (orbita)
            </Text>
            <Text position={[-2, -1.05, 0]} fontSize={0.2} color="cyan" anchorX="center">
                Microtask (VIP)
            </Text>
            <Text position={[1.7, -1.05, 0]} fontSize={0.2} color="orange" anchorX="center">
                Macrotask
            </Text>
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
                <EtiquetasZona />
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