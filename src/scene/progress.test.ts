import { describe, expect, it } from 'vitest'
import { chapterFromProgress, sceneProgressFromProbe } from './progress'

describe('chapterFromProgress', () => {
  it('clamps document progress and maps it to five chapters', () => {
    expect(chapterFromProgress(-1)).toEqual({ chapter: 'identity', localProgress: 0 })
    expect(chapterFromProgress(0.5)).toEqual({ chapter: 'experience', localProgress: 0.5 })
    expect(chapterFromProgress(2)).toEqual({ chapter: 'contact', localProgress: 1 })
  })

  it('warps uneven measured sections into equal scene-space chapters', () => {
    const sections = [
      { top: 0, height: 793 },
      { top: 793, height: 1210 },
      { top: 2003, height: 1413 },
      { top: 3416, height: 900 },
      { top: 4316, height: 793 },
    ]

    expect(sceneProgressFromProbe(793, sections)).toBeCloseTo(0.2)
    expect(sceneProgressFromProbe(2003 + 1413 / 2, sections)).toBeCloseTo(0.5)
    expect(sceneProgressFromProbe(5109, sections)).toBe(1)
  })

  it('reaches final Contact progress at the maximum reachable viewport probe', () => {
    const sections = [
      { top: 0, height: 900 },
      { top: 900, height: 1200 },
      { top: 2100, height: 1400 },
      { top: 3500, height: 1000 },
      { top: 4500, height: 1000 },
    ]

    expect(sceneProgressFromProbe(900, sections, 4988)).toBeCloseTo(0.2)
    expect(sceneProgressFromProbe(4988, sections, 4988)).toBe(1)
  })
})
