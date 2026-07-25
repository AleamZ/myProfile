import type { SceneProgress } from '../components/world/world.types'
import { chapterFromProgress } from './progress'

type SceneListener = () => void

export interface SceneStore {
  getState: () => SceneProgress
  setProgress: (progress: number) => void
  setActiveProject: (activeProject: number) => void
  setActiveExperience: (activeExperience: number) => void
  setActiveSkillGroup: (activeSkillGroup: number | null) => void
  setContactEngaged: (contactEngaged: boolean) => void
  subscribe: (listener: SceneListener) => () => void
}

export function createSceneStore(): SceneStore {
  let state: SceneProgress = {
    chapter: 'identity',
    documentProgress: 0,
    localProgress: 0,
    activeProject: 0,
    activeExperience: 0,
    activeSkillGroup: null,
    contactEngaged: false,
  }
  const listeners = new Set<SceneListener>()

  const notify = () => {
    listeners.forEach((listener) => listener())
  }

  const updateState = (partialState: Partial<SceneProgress>) => {
    state = { ...state, ...partialState }
    notify()
  }

  return {
    getState: () => state,
    setProgress: (progress) => {
      const documentProgress = Math.min(Math.max(progress, 0), 1)
      const { chapter, localProgress } = chapterFromProgress(documentProgress)
      updateState({ chapter, documentProgress, localProgress })
    },
    setActiveProject: (activeProject) => updateState({ activeProject }),
    setActiveExperience: (activeExperience) => updateState({ activeExperience }),
    setActiveSkillGroup: (activeSkillGroup) => updateState({ activeSkillGroup }),
    setContactEngaged: (contactEngaged) => updateState({ contactEngaged }),
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
