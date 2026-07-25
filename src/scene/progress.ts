import { CHAPTERS, type Chapter } from '../components/world/world.types'

export interface SceneSectionBounds {
  top: number
  height: number
}

export function sceneProgressFromProbe(
  probeY: number,
  sections: readonly SceneSectionBounds[],
  maximumProbeY?: number,
): number {
  if (sections.length === 0 || probeY <= sections[0].top) return 0
  if (maximumProbeY !== undefined && probeY >= maximumProbeY) return 1

  let sectionIndex = 0
  for (let index = 1; index < sections.length; index += 1) {
    if (probeY < sections[index].top) break
    sectionIndex = index
  }

  const section = sections[sectionIndex]
  const nextTop = sections[sectionIndex + 1]?.top
  const sectionEnd = nextTop !== undefined && nextTop > section.top
    ? nextTop
    : section.top + Math.max(section.height, 1)
  const localProgress = Math.min(Math.max((probeY - section.top) / (sectionEnd - section.top), 0), 1)

  return Math.min(Math.max((sectionIndex + localProgress) / CHAPTERS.length, 0), 1)
}

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
