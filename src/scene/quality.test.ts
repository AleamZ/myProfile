import { describe, expect, it } from 'vitest'
import { selectSceneQuality } from './quality'

describe('selectSceneQuality', () => {
  it('selects the appropriate quality for device capabilities', () => {
    expect(selectSceneQuality({ webgl: false, reducedMotion: false, coarsePointer: false, width: 1440, dpr: 1 })).toBe('fallback')
    expect(selectSceneQuality({ webgl: true, reducedMotion: true, coarsePointer: false, width: 1440, dpr: 1 })).toBe('fallback')
    expect(selectSceneQuality({ webgl: true, reducedMotion: false, coarsePointer: true, width: 390, dpr: 3 })).toBe('low')
    expect(selectSceneQuality({ webgl: true, reducedMotion: false, coarsePointer: false, width: 1024, dpr: 2 })).toBe('balanced')
    expect(selectSceneQuality({ webgl: true, reducedMotion: false, coarsePointer: false, width: 1440, dpr: 1 })).toBe('high')
  })
})
