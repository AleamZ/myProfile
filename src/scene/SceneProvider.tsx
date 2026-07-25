import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react'
import type { SceneProgress } from '../components/world/world.types'
import { createSceneStore, type SceneStore } from './sceneStore'

const SceneStoreContext = createContext<SceneStore | null>(null)

export function SceneProvider({ children }: PropsWithChildren) {
  const [store] = useState(createSceneStore)

  return <SceneStoreContext.Provider value={store}>{children}</SceneStoreContext.Provider>
}

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
