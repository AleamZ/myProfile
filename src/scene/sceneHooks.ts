import { useContext, useSyncExternalStore } from 'react'
import type { SceneProgress } from '../components/world/world.types'
import { SceneStoreContext } from './sceneContext'
import type { SceneStore } from './sceneStore'

export function useSceneStore(): SceneStore {
  const store = useContext(SceneStoreContext)

  if (!store) {
    throw new Error('useSceneStore must be used within a SceneProvider')
  }

  return store
}

export function useSceneSnapshot(): SceneProgress {
  const store = useSceneStore()

  return useSyncExternalStore(store.subscribe, store.getState, store.getState)
}
