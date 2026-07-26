import { describe, expect, it } from 'vitest'
import { chapterProgress, readChapter, type SectionBounds } from './chapters'

// Deliberately uneven, which is the case this replaces: the old reader sliced
// the document into equal fifths and drifted away from what was on screen.
const sections: SectionBounds[] = [
  { id: 'identity', top: 0, height: 1000 },
  { id: 'work', top: 1000, height: 2400 },
  { id: 'experience', top: 3400, height: 900 },
  { id: 'skills', top: 4300, height: 900 },
  { id: 'contact', top: 5200, height: 1600 },
]
const MAX = 6000

describe('readChapter', () => {
  it('opens on the first chapter', () => {
    const reading = readChapter(0, 0, sections, MAX)
    expect(reading.id).toBe('identity')
    expect(reading.local).toBe(0)
    expect(reading.overall).toBe(0)
  })

  it('measures local progress against the chapter that is actually on screen', () => {
    // Halfway through the 2400px work chapter.
    const reading = readChapter(2200, 0, sections, MAX)
    expect(reading.id).toBe('work')
    expect(reading.index).toBe(1)
    expect(reading.local).toBeCloseTo(0.5, 6)
  })

  it('does not let a long chapter borrow progress from a short one', () => {
    const work = readChapter(3399, 0, sections, MAX)
    const experience = readChapter(3400, 0, sections, MAX)
    expect(work.id).toBe('work')
    expect(experience.id).toBe('experience')
    expect(experience.local).toBeCloseTo(0, 3)
  })

  it('offsets the probe so a fixed header does not read the wrong chapter', () => {
    expect(readChapter(940, 0, sections, MAX).id).toBe('identity')
    expect(readChapter(940, 80, sections, MAX).id).toBe('work')
  })

  it('finishes the last chapter at the bottom of the document', () => {
    const reading = readChapter(MAX, 0, sections, MAX)
    expect(reading.id).toBe('contact')
    expect(reading.local).toBe(1)
    expect(reading.overall).toBe(1)
  })

  it('survives an unmeasured page rather than throwing', () => {
    expect(readChapter(500, 0, [], 0).id).toBe('identity')
    expect(readChapter(500, 0, sections, 0).overall).toBe(0)
  })
})

describe('chapterProgress', () => {
  const reading = readChapter(2200, 0, sections, MAX)

  it('is 0 for chapters ahead and 1 for chapters behind', () => {
    expect(chapterProgress('identity', reading)).toBe(1)
    expect(chapterProgress('experience', reading)).toBe(0)
    expect(chapterProgress('contact', reading)).toBe(0)
  })

  it('passes local progress through for the chapter in view', () => {
    expect(chapterProgress('work', reading)).toBeCloseTo(0.5, 6)
  })
})
