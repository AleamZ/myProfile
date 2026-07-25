export const CHAPTERS = ['identity', 'projects', 'experience', 'skills', 'contact'] as const

export type Chapter = (typeof CHAPTERS)[number]

export type SceneQuality = 'high' | 'balanced' | 'low' | 'fallback'

export interface SceneProgress {
  chapter: Chapter
  documentProgress: number
  localProgress: number
  activeProject: number
  activeExperience: number
  activeSkillGroup: number | null
  contactEngaged: boolean
}
