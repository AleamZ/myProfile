import { CHAPTERS, type Chapter } from '../components/world/world.types'

/**
 * How far a given chapter has played, from the point of view of that chapter's
 * own stage: 0 before the visitor reaches it, its local progress while they
 * are inside it, and 1 once they have left.
 *
 * Every stage can therefore animate against a single 0→1 value without needing
 * to know where it sits in the running order.
 */
export function chapterStageProgress(chapter: Chapter, activeChapter: Chapter, localProgress: number): number {
  const index = CHAPTERS.indexOf(chapter)
  const activeIndex = CHAPTERS.indexOf(activeChapter)

  if (index === -1 || activeIndex === -1) return 0
  if (activeIndex < index) return 0
  if (activeIndex > index) return 1

  return Math.min(Math.max(localProgress, 0), 1)
}

export interface StageEnvelope {
  /** 0 → 1 as the chapter arrives. */
  enter: number
  /** 0 → 1 as it departs. */
  exit: number
  /** How present the chapter is right now: 0 off-stage, 1 held. */
  presence: number
}

/**
 * The arrive / hold / depart envelope every stage shares. The hold is the
 * point: without it each section merely slides past, which is what made the
 * page read as stacked panels rather than a sequence of shots.
 */
export function stageEnvelope(progress: number, ramp = 0.14): StageEnvelope {
  const clamped = Math.min(Math.max(progress, 0), 1)
  const safeRamp = Math.min(Math.max(ramp, 0.01), 0.49)
  const enter = Math.min(clamped / safeRamp, 1)
  const exit = Math.min(Math.max((clamped - (1 - safeRamp)) / safeRamp, 0), 1)

  return { enter, exit, presence: Math.min(Math.max(enter - exit, 0), 1) }
}

/**
 * Scroll speed as a signed, bounded number. Raw pixel deltas are unusable
 * directly: a trackpad flick and a mouse wheel notch differ by an order of
 * magnitude, and one dropped frame produces a spike big enough to look like a
 * glitch rather than momentum.
 */
export function normalizeScrollVelocity(deltaPixels: number, deltaMs: number, reference = 2.2): number {
  if (deltaMs <= 0) return 0
  const perMillisecond = deltaPixels / deltaMs
  const normalized = perMillisecond / reference

  return Math.min(Math.max(normalized, -1), 1)
}
