import type { TraceEvent } from './mockTrace'

export type Estado = {
    estrellas: string[],
    colaVIP: string[],
    colaNormal: string[],
    orbitando: string[]
}

export const estadoInicial: Estado = {
    estrellas: [],
    colaVIP: [],
    colaNormal: [],
    orbitando: [],
}

export function estadoEnPaso(traza: TraceEvent[], paso: number): Estado {
    const eventosHastaPaso = traza.slice(0, paso + 1)

    return eventosHastaPaso.reduce(aplicarEvento, estadoInicial)
}

export function aplicarEvento(estado: Estado, evento: TraceEvent): Estado {
    switch (evento.tipo) {
        case 'ESTRELLA':
            return {
                ...estado,
                estrellas: [...estado.estrellas, evento.valor],
            }

        case 'DESPEGUE':
            return {
                ...estado,
                orbitando: [...estado.orbitando, evento.naveId],
            }

        case 'EN_COLA':
            if (evento.carril === 'VIP') {
                return {
                    ...estado,
                    orbitando: estado.orbitando.filter((naveId) => naveId !== evento.naveId),
                    colaVIP: [...estado.colaVIP, evento.naveId],
                }
            }

            return {
                ...estado,
                orbitando: estado.orbitando.filter((naveId) => naveId !== evento.naveId),
                colaNormal: [...estado.colaNormal, evento.naveId],
            }

        case 'ATERRIZAJE':
            return {
                ...estado,
                colaVIP: estado.colaVIP.filter((naveId) => naveId !== evento.naveId),
                colaNormal: estado.colaNormal.filter((naveId) => naveId !== evento.naveId),
            }

        default:
            return estado
    }
}