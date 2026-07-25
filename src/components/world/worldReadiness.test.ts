import { describe, expect, it } from 'vitest'
import {
  getWorldPresentation,
  listenForWebGLContextLoss,
  worldReadinessReducer,
  type WorldReadiness,
} from './worldReadiness'

describe('getWorldPresentation', () => {
  it('keeps dark-only ambience hidden when a light-theme world becomes active', () => {
    expect(getWorldPresentation('light', 'active')).toEqual({
      worldAttribute: 'active',
      ambienceClass: undefined,
    })
  })

  it('dims duplicate ambience for an active dark-theme world', () => {
    expect(getWorldPresentation('dark', 'active').ambienceClass).toBe('world-ambience-dimmed')
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
