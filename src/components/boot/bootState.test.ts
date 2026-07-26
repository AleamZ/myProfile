import { describe, expect, it } from 'vitest'
import { bootState, shouldPlayBoot } from './bootState'

describe('bootState', () => {
  it('starts empty', () => {
    expect(bootState(0, false).progress).toBe(0)
  })

  it('never fills while the page is still working, up to the ceiling', () => {
    for (const elapsed of [500, 900, 2_000]) {
      const { progress, complete } = bootState(elapsed, false)
      expect(progress).toBeLessThan(0.93)
      expect(complete).toBe(false)
    }
  })

  it('releases at the ceiling even if the page never reports ready', () => {
    expect(bootState(4_200, false)).toEqual({ progress: 1, complete: true })
    expect(bootState(60_000, false)).toEqual({ progress: 1, complete: true })
  })

  it('keeps moving while it waits, so it never looks stalled', () => {
    expect(bootState(900, false).progress).toBeGreaterThan(bootState(300, false).progress)
  })

  it('holds the floor duration even when the page is ready immediately', () => {
    const early = bootState(200, true, 1200)
    expect(early.complete).toBe(false)
    expect(early.progress).toBeCloseTo(200 / 1200, 6)
  })

  it('completes once ready and the floor has passed', () => {
    expect(bootState(1200, true, 1200)).toEqual({ progress: 1, complete: true })
    expect(bootState(4000, true, 1200)).toEqual({ progress: 1, complete: true })
  })

  it('survives a nonsense clock or floor rather than dividing by zero', () => {
    expect(bootState(-50, false).progress).toBe(0)
    expect(Number.isFinite(bootState(100, true, 0).progress)).toBe(true)
    expect(bootState(100, true, 0).complete).toBe(true)
  })
})

describe('shouldPlayBoot', () => {
  it('plays for a first visit with motion allowed', () => {
    expect(shouldPlayBoot(false, false)).toBe(true)
  })

  it('is skipped for reduced motion and for a tab that has already seen it', () => {
    expect(shouldPlayBoot(true, false)).toBe(false)
    expect(shouldPlayBoot(false, true)).toBe(false)
    expect(shouldPlayBoot(true, true)).toBe(false)
  })
})
