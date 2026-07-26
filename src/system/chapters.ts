export const CHAPTERS = ['identity', 'work', 'experience', 'skills', 'contact'] as const

export type ChapterId = (typeof CHAPTERS)[number]

export interface ChapterReading {
  id: ChapterId
  /** 0-based position in the running order. */
  index: number
  /** 0→1 through this chapter's own scroll span. */
  local: number
  /** 0→1 through the whole document. */
  overall: number
}

export interface SectionBounds {
  id: ChapterId
  /** Distance from the top of the document, in px. */
  top: number
  height: number
}

export const FIRST_READING: ChapterReading = {
  id: CHAPTERS[0],
  index: 0,
  local: 0,
  overall: 0,
}

/**
 * Which chapter the reader is in, and how far through it.
 *
 * Measured against each section's real height rather than by slicing the
 * document into equal parts. Chapters are not the same length — the work
 * chapter carries a coverflow and the closing one carries a globe — and
 * dividing the scroll evenly makes the readout drift away from what is
 * actually on screen.
 */
export function readChapter(
  scrollY: number,
  probeOffset: number,
  sections: readonly SectionBounds[],
  maxScrollY: number,
): ChapterReading {
  if (sections.length === 0) return FIRST_READING

  const probe = scrollY + probeOffset
  const overall = maxScrollY > 0 ? Math.min(Math.max(scrollY / maxScrollY, 0), 1) : 0

  // Bottom of the document: the last chapter is finished, whatever the probe
  // says. Without this the final chapter can never reach 1, because the page
  // runs out of scroll before the probe reaches its end.
  if (maxScrollY > 0 && scrollY >= maxScrollY) {
    return { id: sections[sections.length - 1].id, index: sections.length - 1, local: 1, overall: 1 }
  }

  let index = 0
  for (let candidate = 1; candidate < sections.length; candidate += 1) {
    if (probe < sections[candidate].top) break
    index = candidate
  }

  const section = sections[index]
  const nextTop = sections[index + 1]?.top
  const end = nextTop !== undefined && nextTop > section.top ? nextTop : section.top + Math.max(section.height, 1)
  const local = Math.min(Math.max((probe - section.top) / (end - section.top), 0), 1)

  return { id: section.id, index, local, overall }
}

/**
 * How far a chapter has played from its own point of view: 0 before the reader
 * arrives, its local progress while they are there, 1 once they have gone.
 * Every stage animates against this, so none of them needs to know its own
 * position in the running order.
 */
export function chapterProgress(id: ChapterId, reading: ChapterReading): number {
  const index = CHAPTERS.indexOf(id)
  if (index === -1) return 0
  if (reading.index < index) return 0
  if (reading.index > index) return 1
  return reading.local
}
