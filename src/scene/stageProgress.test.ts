import { describe, expect, it } from 'vitest'
import { chapterStageProgress, normalizeScrollVelocity, stageEnvelope } from './stageProgress'

describe('chapterStageProgress', () => {
  it('reads 0 for a chapter the visitor has not reached', () => {
    expect(chapterStageProgress('skills', 'identity', 0.5)).toBe(0)
  })

  it('reads 1 for a chapter the visitor has already left', () => {
    expect(chapterStageProgress('identity', 'skills', 0.5)).toBe(1)
  })

  it('passes through local progress for the active chapter', () => {
    expect(chapterStageProgress('experience', 'experience', 0.42)).toBeCloseTo(0.42, 6)
  })

  it('clamps local progress that arrives out of range', () => {
    expect(chapterStageProgress('work' as never, 'work' as never, 5)).toBe(0)
    expect(chapterStageProgress('experience', 'experience', 5)).toBe(1)
    expect(chapterStageProgress('experience', 'experience', -3)).toBe(0)
  })
})

describe('stageEnvelope', () => {
  it('is fully absent before the chapter starts', () => {
    expect(stageEnvelope(0)).toEqual({ enter: 0, exit: 0, presence: 0 })
  })

  it('reaches full presence once the arrival ramp completes', () => {
    const held = stageEnvelope(0.5, 0.14)
    expect(held.enter).toBe(1)
    expect(held.exit).toBe(0)
    expect(held.presence).toBe(1)
  })

  it('holds across the whole middle of the chapter', () => {
    for (const progress of [0.2, 0.4, 0.6, 0.8]) {
      expect(stageEnvelope(progress, 0.14).presence).toBe(1)
    }
  })

  it('departs completely by the end', () => {
    const gone = stageEnvelope(1, 0.14)
    expect(gone.exit).toBe(1)
    expect(gone.presence).toBe(0)
  })

  it('never returns a presence outside 0..1 for a degenerate ramp', () => {
    for (const ramp of [0, 0.9, -1]) {
      for (const progress of [0, 0.5, 1]) {
        const { presence } = stageEnvelope(progress, ramp)
        expect(presence).toBeGreaterThanOrEqual(0)
        expect(presence).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe('normalizeScrollVelocity', () => {
  it('is zero when no time has passed, rather than infinite', () => {
    expect(normalizeScrollVelocity(120, 0)).toBe(0)
    expect(normalizeScrollVelocity(120, -8)).toBe(0)
  })

  it('keeps direction and stays bounded through a spike', () => {
    expect(normalizeScrollVelocity(4000, 16)).toBe(1)
    expect(normalizeScrollVelocity(-4000, 16)).toBe(-1)
  })

  it('scales an ordinary scroll into the middle of the range', () => {
    const gentle = normalizeScrollVelocity(16, 16)
    expect(gentle).toBeGreaterThan(0)
    expect(gentle).toBeLessThan(1)
  })
})
