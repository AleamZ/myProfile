import type { Theme } from '../../theme/ThemeProvider'

export type WorldReadiness = 'pending' | 'active'

export type WorldReadinessEvent =
  | { type: 'first-frame' }
  | { type: 'unavailable' }

interface WorldPresentation {
  worldAttribute: 'active' | undefined
  ambienceClass: 'world-ambience-dimmed' | undefined
}

export function getWorldPresentation(theme: Theme, readiness: WorldReadiness): WorldPresentation {
  return {
    worldAttribute: readiness === 'active' ? 'active' : undefined,
    ambienceClass: theme === 'dark' && readiness === 'active' ? 'world-ambience-dimmed' : undefined,
  }
}

export function worldReadinessReducer(_state: WorldReadiness, event: WorldReadinessEvent): WorldReadiness {
  return event.type === 'first-frame' ? 'active' : 'pending'
}

export function listenForWebGLContextLoss(canvas: HTMLCanvasElement, onUnavailable: () => void): () => void {
  const onContextLost = (event: Event) => {
    event.preventDefault()
    onUnavailable()
  }

  canvas.addEventListener('webglcontextlost', onContextLost)
  return () => canvas.removeEventListener('webglcontextlost', onContextLost)
}
