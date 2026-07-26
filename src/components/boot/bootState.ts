export interface BootState {
  /** 0 → 1, suitable for a bar width. */
  progress: number
  complete: boolean
}

/**
 * Progress for the start-up sequence.
 *
 * The readout is tied to something real — fonts resolved and the world's first
 * frame drawn — rather than to a timer pretending to load. While the page is
 * still working the bar approaches an asymptote instead of filling, so it never
 * claims to be finished and then sits there. Once the page is genuinely ready
 * the bar completes, but not before `minimumMs`: a sequence that flashes past
 * in 200ms reads as a glitch rather than as an instrument powering on.
 */
export function bootState(
  elapsedMs: number,
  ready: boolean,
  minimumMs = 1200,
  maximumMs = 4200,
): BootState {
  const elapsed = Math.max(elapsedMs, 0)
  const floor = Math.max(minimumMs, 1)

  // Hard ceiling. A lost WebGL context or a font request that never resolves
  // must not leave a visitor sitting behind an opaque panel.
  if (elapsed >= Math.max(maximumMs, floor)) return { progress: 1, complete: true }

  if (!ready) {
    return { progress: 0.92 * (1 - Math.exp(-elapsed / floor)), complete: false }
  }

  const timed = Math.min(elapsed / floor, 1)
  return { progress: timed, complete: timed >= 1 }
}

/**
 * The sequence is a first-impression, not a toll gate: it plays once per tab
 * and never for a visitor who has asked for reduced motion.
 */
export function shouldPlayBoot(
  reducedMotion: boolean,
  alreadyPlayed: boolean,
): boolean {
  return !reducedMotion && !alreadyPlayed
}
