import { describe, expect, it, vi } from 'vitest'
import { createSceneStore } from './sceneStore'

describe('createSceneStore', () => {
  it('updates scene state and notifies active subscribers', () => {
    const store = createSceneStore()
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)

    store.setProgress(0.51)
    expect(store.getState().chapter).toBe('experience')
    expect(store.getState().documentProgress).toBe(0.51)
    expect(listener).toHaveBeenCalledTimes(1)

    store.setActiveProject(2)
    store.setActiveExperience(1)
    store.setActiveSkillGroup(3)
    store.setContactEngaged(true)
    expect(store.getState()).toMatchObject({
      activeProject: 2,
      activeExperience: 1,
      activeSkillGroup: 3,
      contactEngaged: true,
    })

    unsubscribe()
    store.setProgress(0.8)
    expect(listener).toHaveBeenCalledTimes(5)
  })
})
