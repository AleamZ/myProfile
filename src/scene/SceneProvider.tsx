import { useState, type PropsWithChildren } from 'react'
import { SceneStoreContext } from './sceneContext'
import { createSceneStore } from './sceneStore'

export function SceneProvider({ children }: PropsWithChildren) {
  const [store] = useState(createSceneStore)

  return <SceneStoreContext.Provider value={store}>{children}</SceneStoreContext.Provider>
}
