import { describe, expect, it } from 'vitest'
import { chapterFromProgress } from './progress'

describe('chapterFromProgress', () => {
  it('clamps document progress and maps it to five chapters', () => {
    expect(chapterFromProgress(-1)).toEqual({ chapter: 'identity', localProgress: 0 })
    expect(chapterFromProgress(0.5)).toEqual({ chapter: 'experience', localProgress: 0.5 })
    expect(chapterFromProgress(2)).toEqual({ chapter: 'contact', localProgress: 1 })
  })
})
