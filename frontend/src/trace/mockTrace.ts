type TraceEvent =
    | { tipo: 'ESTRELLA'; valor: string }
    | { tipo: 'DESPEGUE'; naveId: string }
    | { tipo: 'EN_COLA'; naveId: string; carril: 'VIP' | 'NORMAL' }
    | { tipo: 'ATERRIZAJE'; naveId: string }

export const trazaMock: TraceEvent[] = [
    { tipo: 'ESTRELLA', valor: '1' },                          // console.log(1) → suelto, directo

    { tipo: 'DESPEGUE', naveId: 'timeout' },                   // setTimeout: nace la nave 'timeout'
    { tipo: 'EN_COLA', naveId: 'timeout', carril: 'NORMAL' },  //   el timer expira → cola normal (macrotask)

    { tipo: 'EN_COLA', naveId: 'promise', carril: 'VIP' },     // .then sobre promesa YA resuelta → directa a cola VIP

    { tipo: 'ESTRELLA', valor: '4' },                          // console.log(4) → suelto, directo

    // ── Planeta vacío: el controlador procesa las colas. VIP PRIMERO ──
    { tipo: 'ATERRIZAJE', naveId: 'promise' },                 // aterriza la VIP...
    { tipo: 'ESTRELLA', valor: '3' },                          //   ...y su callback enciende el 3

    { tipo: 'ATERRIZAJE', naveId: 'timeout' },                 // luego la normal...
    { tipo: 'ESTRELLA', valor: '2' },
]
