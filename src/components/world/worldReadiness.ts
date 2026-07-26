export type WorldReadiness = 'pending' | 'active'

export type WorldReadinessEvent =
  | { type: 'first-frame' }
  | { type: 'unavailable' }

interface WorldPresentation {
  worldAttribute: 'active' | undefined
  ambienceClass: 'world-ambience-dimmed' | undefined
}

// Once the WebGL core is drawing, the CSS ambience behind it is duplicate
// depth — dim it so the two layers never read as two separate skies.
export function getWorldPresentation(readiness: WorldReadiness): WorldPresentation {
  const active = readiness === 'active'

  return {
    worldAttribute: active ? 'active' : undefined,
    ambienceClass: active ? 'world-ambience-dimmed' : undefined,
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
