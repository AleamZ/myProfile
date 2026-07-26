import { describe, expect, it } from 'vitest'
import {
  getWorldPresentation,
  listenForWebGLContextLoss,
  worldReadinessReducer,
  type WorldReadiness,
} from './worldReadiness'

describe('getWorldPresentation', () => {
  it('leaves the CSS ambience at full strength while the world is still pending', () => {
    expect(getWorldPresentation('pending')).toEqual({
      worldAttribute: undefined,
      ambienceClass: undefined,
    })
  })

  it('dims the duplicate CSS ambience once the world is drawing', () => {
    expect(getWorldPresentation('active')).toEqual({
      worldAttribute: 'active',
      ambienceClass: 'world-ambience-dimmed',
    })
  })
})

describe('worldReadinessReducer', () => {
  it('returns an active world to fallback after a render failure', () => {
    const ready = worldReadinessReducer('pending', { type: 'first-frame' })

    expect(ready).toBe('active')
    expect(worldReadinessReducer(ready, { type: 'unavailable' })).toBe('pending')
  })
})

describe('listenForWebGLContextLoss', () => {
  it('returns an active world to fallback when its WebGL context is lost', () => {
    const canvas = document.createElement('canvas')
    let readiness: WorldReadiness = 'active'
    const stopListening = listenForWebGLContextLoss(canvas, () => {
      readiness = worldReadinessReducer(readiness, { type: 'unavailable' })
    })
    const contextLoss = new Event('webglcontextlost', { cancelable: true })

    canvas.dispatchEvent(contextLoss)

    expect(readiness).toBe('pending')
    expect(contextLoss.defaultPrevented).toBe(true)
    stopListening()
  })
})
