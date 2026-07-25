import { createContext } from 'react'
import type { SceneStore } from './sceneStore'

export const SceneStoreContext = createContext<SceneStore | null>(null)
