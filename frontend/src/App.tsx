import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Stars } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useRef, useState, type CSSProperties } from 'react'
import * as THREE from 'three'
import { useSpring, animated } from '@react-spring/three'
import { trazaMock, type TraceEvent } from './trace/mockTrace'
import { estadoEnPaso, type Estado } from './trace/estado'

// Naves únicas que aparecen en la traza. Se animan de forma PERSISTENTE (una por
// id) para que viajen entre zonas en vez de crearse/destruirse (teletransporte).
const NAVES = [...new Set(trazaMock.flatMap((e) => ('naveId' in e ? [e.naveId] : [])))]

// Paleta espacial: cada acento codifica una zona del event loop.
const COLOR_ORBITA = '#b892ff' // Web APIs: zona de espera (violeta)
const COLOR_VIP = '#ffd166' // microtask: prioridad/premium (dorado)
const COLOR_NORMAL = '#4cc9f0' // macrotask: clase turista (cian frío)
const COLOR_ESTRELLA = '#fff3c4' // console.log: blanco cálido de estrella real

function Planet() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.01
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 48, 48]} />
      {/* emissive sutil para que el planeta "viva" en la oscuridad del espacio */}
      <meshStandardMaterial
        color="royalblue"
        emissive="#1a2a6c"
        emissiveIntensity={0.5}
        roughness={0.6}
        metalness={0.2}
      />
    </mesh>
  )
}

// Nave construida con primitivas (sin assets externos): fuselaje + morro + alas +
// una llama emisiva en el motor que, con bloom, resplandece de verdad. Apunta a +y
// (como un cohete). El color codifica la zona; el morro y las alas van metálicos.
function Nave({ color }: { color: string }) {
  return (
    <group>
      {/* fuselaje */}
      <mesh>
        <capsuleGeometry args={[0.1, 0.4, 8, 16]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.25} />
      </mesh>
      {/* morro */}
      <mesh position={[0, 0.35, 0]}>
        <coneGeometry args={[0.1, 0.2, 16]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* alas */}
      <mesh position={[0.14, -0.16, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.16, 0.18, 0.02]} />
        <meshStandardMaterial color="#99a2b0" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[-0.14, -0.16, 0]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.16, 0.18, 0.02]} />
        <meshStandardMaterial color="#99a2b0" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* llama del motor (emisiva → resplandece con bloom) */}
      <mesh position={[0, -0.34, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.07, 0.2, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
      </mesh>
    </group>
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
        <group key={`${valor}-${index}`} position={posiciones[index]}>
          <mesh>
            <sphereGeometry args={[0.14, 24, 24]} />
            {/* emissive fuerte + toneMapped:false → el bloom la hace resplandecer
                como una estrella real, no un punto plano */}
            <meshStandardMaterial
              color={COLOR_ESTRELLA}
              emissive={COLOR_ESTRELLA}
              emissiveIntensity={2.2}
              toneMapped={false}
            />
          </mesh>
          <Text position={[0, 0.32, 0]} fontSize={0.22} color={COLOR_ESTRELLA} anchorX="center">
            {valor}
          </Text>
        </group>
      ))}
    </>
  )
}

// Dónde está una nave en el paso actual: su posición objetivo, si es visible, y
// el color de su zona. La animación (react-spring) interpola HACIA esta posición.
function posicionDeNave(estado: Estado, naveId: string) {
  const iOrbita = estado.orbitando.indexOf(naveId)
  if (iOrbita !== -1) {
    const angulo = (iOrbita / estado.orbitando.length) * Math.PI * 2
    const pos: [number, number, number] = [2.5 * Math.cos(angulo), 0, 2.5 * Math.sin(angulo)]
    return { pos, visible: true, color: COLOR_ORBITA }
  }

  const iVIP = estado.colaVIP.indexOf(naveId)
  if (iVIP !== -1) {
    return { pos: [-2 + iVIP * 0.5, -1.7, 0] as [number, number, number], visible: true, color: COLOR_VIP }
  }

  const iNormal = estado.colaNormal.indexOf(naveId)
  if (iNormal !== -1) {
    return { pos: [1.2 + iNormal * 0.5, -1.7, 0] as [number, number, number], visible: true, color: COLOR_NORMAL }
  }

  // no está en ninguna zona: aún no despegó o ya aterrizó → oculta en el planeta
  return { pos: [0, 0, 0] as [number, number, number], visible: false, color: COLOR_NORMAL }
}

function NaveAnimada({ estado, naveId }: { estado: Estado; naveId: string }) {
  const { pos, visible, color } = posicionDeNave(estado, naveId)

  // useSpring interpola cada eje y el scale cuando cambian: al cambiar de zona la
  // nave se desliza; al despegar/aterrizar, crece/encoge desde el planeta.
  // Animamos position-x/y/z por separado (no la tupla entera): r3f acepta un valor
  // animado por eje, y así se evita la fricción de tipos del SpringValue de tupla.
  const spring = useSpring({
    x: pos[0],
    y: pos[1],
    z: pos[2],
    scale: visible ? 1 : 0,
    config: { mass: 1, tension: 120, friction: 22 },
  })

  return (
    <animated.group
      position-x={spring.x}
      position-y={spring.y}
      position-z={spring.z}
      scale={spring.scale}
    >
      <Nave color={color} />
      <Text position={[0, 0.6, 0]} fontSize={0.16} color={color} anchorX="center">
        {naveId}
      </Text>
    </animated.group>
  )
}

function Naves({ estado }: { estado: Estado }) {
  return (
    <>
      {NAVES.map((naveId) => (
        <NaveAnimada key={naveId} estado={estado} naveId={naveId} />
      ))}
    </>
  )
}

function EtiquetasZona() {
  return (
    <>
      <Text position={[0, -0.1, 1.3]} fontSize={0.22} color="royalblue" anchorX="center">
        Call Stack
      </Text>
      <Text position={[0, 2.9, 0]} fontSize={0.2} color={COLOR_ESTRELLA} anchorX="center">
        console.log
      </Text>
      <Text position={[3, 0, 0]} fontSize={0.2} color={COLOR_ORBITA} anchorX="center">
        Web APIs (orbita)
      </Text>
      <Text position={[-2, -1.05, 0]} fontSize={0.2} color={COLOR_VIP} anchorX="center">
        Microtask (VIP)
      </Text>
      <Text position={[2.7, -0.75, 0]} fontSize={0.2} color={COLOR_NORMAL} anchorX="center">
        Macrotask
      </Text>
    </>
  )
}

// Traduce cada evento de la traza a una frase en lenguaje natural: el panel narra
// QUÉ pasa y POR QUÉ, en vez de mostrar el JSON crudo que un novato no entiende.
function describirEvento(evento: TraceEvent): string {
  switch (evento.tipo) {
    case 'ESTRELLA':
      return `console.log(${evento.valor}) se ejecuta en el Call Stack y enciende la estrella ${evento.valor}.`
    case 'DESPEGUE':
      return `${evento.naveId}: la tarea async despega hacia las Web APIs (la órbita) a esperar.`
    case 'EN_COLA':
      return evento.carril === 'VIP'
        ? `La promesa (${evento.naveId}) mete su callback en la cola Microtask (VIP): prioridad máxima.`
        : `El timer (${evento.naveId}) mete su callback en la cola Macrotask: espera su turno.`
    case 'ATERRIZAJE':
      return `El Call Stack está libre → ${evento.naveId} aterriza y ejecuta su callback.`
  }
}

// El código que esta visualización está diagnosticando. Mostrarlo arriba conecta
// el snippet con lo que ocurre en la galaxia.
const CODIGO_DIAGNOSTICADO = `console.log(1)
setTimeout(() => console.log(2))
Promise.resolve().then(() => console.log(3))
console.log(4)`

const headerStyle: CSSProperties = {
  position: 'absolute',
  top: 24,
  left: 24,
  color: '#e8e8f0',
  background: 'rgba(8, 4, 16, 0.82)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(184, 146, 255, 0.25)',
  borderRadius: 12,
  padding: '14px 18px',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  maxWidth: 'calc(100vw - 48px)',
}

const panelStyle: CSSProperties = {
  position: 'absolute',
  bottom: 24,
  left: 24,
  width: 460,
  maxWidth: 'calc(100vw - 48px)',
  color: '#e8e8f0',
  background: 'rgba(8, 4, 16, 0.82)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(184, 146, 255, 0.25)',
  borderRadius: 12,
  padding: 18,
  fontFamily: 'system-ui, -apple-system, sans-serif',
}

const botonStyle: CSSProperties = {
  flex: 1,
  padding: '9px 10px',
  color: '#e8e8f0',
  background: 'rgba(184, 146, 255, 0.14)',
  border: '1px solid rgba(184, 146, 255, 0.35)',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 13,
}

function App() {
  const [paso, setPaso] = useState(0)
  const estado = estadoEnPaso(trazaMock, paso)

  function avanzar() {
    setPaso(Math.min(paso + 1, trazaMock.length - 1))
  }

  function reiniciar() {
    setPaso(0)
  }

  function retroceder() {
    setPaso(Math.max(paso - 1, 0))
  }

  return (
    <>
      <Canvas camera={{ position: [0, 0, 7] }}>
        {/* campo de estrellas de fondo: profundidad espacial ambiental */}
        <Stars radius={80} depth={50} count={2500} factor={4} fade speed={1} />
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={80} />
        <Planet />
        <Estrellas valores={estado.estrellas} />
        <Naves estado={estado} />
        <EtiquetasZona />
        <OrbitControls />
        {/* bloom: todo lo emisivo (estrellas, motores) irradia como en el espacio real */}
        <EffectComposer>
          <Bloom intensity={0.5} luminanceThreshold={0.65} luminanceSmoothing={0.85} mipmapBlur />
        </EffectComposer>
      </Canvas>

      {/* cabecera: qué código estamos diagnosticando */}
      <div style={headerStyle}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 0.5 }}>EventHorizon</div>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
          Event loop de JavaScript — ¿por qué imprime 1, 4, 3, 2?
        </div>
        <pre
          style={{
            margin: 0,
            fontFamily: 'monospace',
            fontSize: 12.5,
            lineHeight: 1.6,
            color: '#c9c9e0',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '10px 12px',
            borderRadius: 8,
            overflowX: 'auto',
          }}
        >
          {CODIGO_DIAGNOSTICADO}
        </pre>
      </div>

      {/* panel narrador: explica el flujo del event loop en lenguaje llano */}
      <div style={panelStyle}>
        <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.55, marginBottom: 8 }}>
          PASO {paso + 1} / {trazaMock.length}
        </div>

        <p style={{ fontSize: 16, lineHeight: 1.5, margin: '0 0 14px' }}>
          {describirEvento(trazaMock[paso])}
        </p>

        <div style={{ display: 'grid', gap: 5, fontSize: 13, marginBottom: 14, fontFamily: 'monospace' }}>
          <div>
            <span style={{ color: COLOR_VIP }}>● Microtask (VIP)</span>: {estado.colaVIP.join(', ') || '—'}
          </div>
          <div>
            <span style={{ color: COLOR_NORMAL }}>● Macrotask</span>: {estado.colaNormal.join(', ') || '—'}
          </div>
          <div>
            <span style={{ color: COLOR_ORBITA }}>● Web APIs (orbita)</span>: {estado.orbitando.join(', ') || '—'}
          </div>
          <div>
            <span style={{ color: COLOR_ESTRELLA }}>● console.log</span>: {estado.estrellas.join(' · ') || '—'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button style={botonStyle} onClick={retroceder}>
            ← Anterior
          </button>
          <button style={botonStyle} onClick={avanzar}>
            Siguiente →
          </button>
          <button style={botonStyle} onClick={reiniciar}>
            ↺ Reiniciar
          </button>
        </div>

        <details open style={{ fontSize: 14, opacity: 0.92, lineHeight: 1.6 }}>
          <summary style={{ cursor: 'pointer', opacity: 0.85, fontSize: 14, marginBottom: 4 }}>
            ¿Qué significan estos términos?
          </summary>
          <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
            <div>
              <b style={{ color: 'royalblue' }}>Call Stack</b> — lo que se ejecuta ahora mismo (el planeta).
            </div>
            <div>
              <b style={{ color: COLOR_ORBITA }}>Web APIs</b> — donde esperan los timers y lo async (la órbita).
            </div>
            <div>
              <b style={{ color: COLOR_VIP }}>Microtask (VIP)</b> — promesas, <code>.then</code>, <code>await</code>. El event loop las vacía <b>todas</b> primero.
            </div>
            <div>
              <b style={{ color: COLOR_NORMAL }}>Macrotask</b> — <code>setTimeout</code>, eventos. Van <b>después</b> de las microtasks.
            </div>
            <div style={{ marginTop: 4, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
              <b>Regla de oro:</b> al vaciarse el Call Stack, se ejecutan <b>todas</b> las microtasks (VIP) antes de <b>una</b> macrotask. Por eso el orden sale <b>1, 4, 3, 2</b>.
            </div>
          </div>
        </details>
      </div>
    </>
  )
}

export default App
