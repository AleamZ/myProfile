import { useEffect, useRef } from 'react'
import type { Chapter } from '../components/world/world.types'
import { useSceneStore } from '../scene/sceneHooks'
import { chapterStageProgress } from '../scene/stageProgress'

/**
 * Publishes a chapter's 0→1 progress onto its own section as a CSS variable.
 *
 * Deliberately not `useSceneSnapshot`: that re-renders its component on every
 * scroll tick, which is affordable for the hero but not for sections carrying
 * a coverflow, a timeline and a running mini-game. Subscribing here and writing
 * straight to the node keeps the choreography on the compositor and React out
 * of the scroll path entirely.
 */
export function useChapterStage<T extends HTMLElement>(chapter: Chapter) {
  const store = useSceneStore()
  const ref = useRef<T>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    let frame: number | undefined
    let previous = Number.NaN

    const write = () => {
      frame = undefined
      const { chapter: activeChapter, localProgress } = store.getState()
      const progress = chapterStageProgress(chapter, activeChapter, localProgress)
      // Sub-thousandth changes are below anything the eye or the compositor
      // can act on, and skipping them avoids a style write per scroll event.
      if (Math.abs(progress - previous) < 0.001) return
      previous = progress
      node.style.setProperty('--chapter-progress', progress.toFixed(4))
    }

    const schedule = () => {
      if (frame === undefined) frame = window.requestAnimationFrame(write)
    }

    write()
    const unsubscribe = store.subscribe(schedule)

    return () => {
      unsubscribe()
      if (frame !== undefined) window.cancelAnimationFrame(frame)
    }
  }, [chapter, store])

  return ref
}
