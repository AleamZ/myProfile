import { CHAPTERS, type Chapter } from '../components/world/world.types'

export function chapterFromProgress(progress: number): {
  chapter: Chapter
  localProgress: number
} {
  const documentProgress = Math.min(Math.max(progress, 0), 1)
  const scaledProgress = documentProgress * CHAPTERS.length
  const chapterIndex = Math.min(Math.floor(scaledProgress), CHAPTERS.length - 1)

  return {
    chapter: CHAPTERS[chapterIndex],
    localProgress: Math.min(Math.max(scaledProgress - chapterIndex, 0), 1),
  }
}
