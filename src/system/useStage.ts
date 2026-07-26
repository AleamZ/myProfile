import { useEffect, useRef, useSyncExternalStore } from 'react'
import { chapterProgress, readChapter, type ChapterId, type SectionBounds } from './chapters'
import { stage, type StageState } from './stage'

const SECTION_SELECTOR = '[data-chapter]'
const PROBE_GUTTER = 24

/**
 * Subscribes a component to the readout. Only the telemetry column and the
 * chapter rail should use this — it re-renders on every scroll tick, which is
 * fine for a handful of spans and ruinous for a section carrying a coverflow.
 */
export function useStageState(): StageState {
  return useSyncExternalStore(stage.subscribe, stage.get, stage.get)
}

function measure(): { sections: SectionBounds[]; maxScrollY: number; probeOffset: number } {
  const scrollY = window.scrollY
  const sections: SectionBounds[] = []

  document.querySelectorAll<HTMLElement>(SECTION_SELECTOR).forEach((node) => {
    const id = node.dataset.chapter as ChapterId | undefined
    if (!id) return
    const rect = node.getBoundingClientRect()
    sections.push({ id, top: rect.top + scrollY, height: rect.height })
  })

  const scrollHeight = Math.max(
    document.scrollingElement?.scrollHeight ?? 0,
    document.documentElement.scrollHeight,
  )

  return {
    sections,
    maxScrollY: Math.max(scrollHeight - window.innerHeight, 0),
    probeOffset: PROBE_GUTTER,
  }
}

/**
 * Drives the readout from the scroll position. Mounted once, by the page.
 */
export function useStageDriver() {
  useEffect(() => {
    let layout = measure()
    let frame: number | undefined
    let remeasure = false

    const sync = () => {
      frame = undefined
      if (remeasure) {
        layout = measure()
        remeasure = false
      }
      stage.setReading(readChapter(window.scrollY, layout.probeOffset, layout.sections, layout.maxScrollY))
    }

    const schedule = (withMeasure = false) => {
      remeasure ||= withMeasure
      if (frame === undefined) frame = window.requestAnimationFrame(sync)
    }

    const onScroll = () => schedule()
    const onResize = () => schedule(true)

    sync()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    // Web fonts change section heights after first paint; without this the
    // readout is calibrated against a layout that no longer exists.
    let live = true
    void document.fonts?.ready.then(() => {
      if (live) schedule(true)
    })

    // Images and lazily mounted canvases move things too.
    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => schedule(true))
      : null
    if (observer) document.querySelectorAll(SECTION_SELECTOR).forEach((node) => observer.observe(node))

    return () => {
      live = false
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      observer?.disconnect()
      if (frame !== undefined) window.cancelAnimationFrame(frame)
    }
  }, [])
}

/**
 * Publishes a chapter's own 0→1 progress onto its section as `--chapter`,
 * written straight to the node. Sections must not subscribe through React:
 * re-rendering a coverflow sixty times a second to move one number is the
 * fastest way to make a smooth page stutter.
 */
export function useChapterVar<T extends HTMLElement>(id: ChapterId) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    let frame: number | undefined
    let previous = Number.NaN

    const write = () => {
      frame = undefined
      const value = chapterProgress(id, stage.get().reading)
      if (Math.abs(value - previous) < 0.001) return
      previous = value
      node.style.setProperty('--chapter', value.toFixed(4))
    }

    const schedule = () => {
      if (frame === undefined) frame = window.requestAnimationFrame(write)
    }

    write()
    const unsubscribe = stage.subscribe(schedule)

    return () => {
      unsubscribe()
      if (frame !== undefined) window.cancelAnimationFrame(frame)
    }
  }, [id])

  return ref
}
