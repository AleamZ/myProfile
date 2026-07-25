import type { SceneQuality } from '../components/world/world.types'

export interface SceneQualityInput {
  webgl: boolean
  reducedMotion: boolean
  coarsePointer: boolean
  width: number
  dpr: number
}

export function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function selectSceneQuality({
  webgl,
  reducedMotion,
  coarsePointer,
  width,
  dpr,
}: SceneQualityInput): SceneQuality {
  if (!webgl || reducedMotion) return 'fallback'
  if (coarsePointer || width < 768) return 'low'
  if (width < 1200 || dpr > 1.5) return 'balanced'
  return 'high'
}
