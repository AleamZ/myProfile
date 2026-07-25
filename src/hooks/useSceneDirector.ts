import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CHAPTERS } from '../components/world/world.types'
import { sceneProgressFromProbe, type SceneSectionBounds } from '../scene/progress'
import { useSceneStore } from '../scene/sceneHooks'

gsap.registerPlugin(ScrollTrigger)

const sceneSelector = '[data-scene]'
const ACTIVE_PROBE_GUTTER = 24

interface SceneLayout {
  probeOffset: number
  maximumProbeY?: number
  sections: SceneSectionBounds[]
}

function measureSceneLayout(): SceneLayout {
  const scrollY = window.scrollY
  const headerBottom = document.querySelector<HTMLElement>('.site-header')?.getBoundingClientRect().bottom ?? 0
  const sections = Array.from(document.querySelectorAll<HTMLElement>(sceneSelector), (section) => {
    const bounds = section.getBoundingClientRect()
    return { top: bounds.top + scrollY, height: bounds.height }
  })
  const scrollHeight = Math.max(
    document.scrollingElement?.scrollHeight ?? 0,
    document.documentElement.scrollHeight,
    document.body?.scrollHeight ?? 0,
  )
  const maximumScrollY = Math.max(scrollHeight - window.innerHeight, 0)
  const probeOffset = Math.max(headerBottom, 0) + ACTIVE_PROBE_GUTTER

  return {
    probeOffset,
    maximumProbeY: maximumScrollY > 0 ? maximumScrollY + probeOffset : undefined,
    sections,
  }
}

function progressForLayout(layout: SceneLayout): number {
  return sceneProgressFromProbe(
    window.scrollY + layout.probeOffset,
    layout.sections,
    layout.maximumProbeY,
  )
}

function discreteProgressForLayout(layout: SceneLayout): number {
  const progress = progressForLayout(layout)
  if (progress >= 1) return 1
  const chapterIndex = Math.min(Math.floor(progress * CHAPTERS.length), CHAPTERS.length - 1)
  return chapterIndex / CHAPTERS.length
}

export function useSceneDirector() {
  const store = useSceneStore()

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    if (reducedMotion) {
      const sections = Array.from(document.querySelectorAll<HTMLElement>(sceneSelector))
      let layout = measureSceneLayout()
      const sync = () => store.setProgress(discreteProgressForLayout(layout))
      sync()
      let active = true
      let animationFrame: number | undefined
      let measureBeforeSync = false
      const scheduleSync = (measure = false) => {
        measureBeforeSync ||= measure
        if (animationFrame !== undefined) return
        animationFrame = window.requestAnimationFrame(() => {
          animationFrame = undefined
          if (measureBeforeSync) {
            layout = measureSceneLayout()
            measureBeforeSync = false
          }
          sync()
        })
      }
      const onScroll = () => scheduleSync()
      const onResize = () => scheduleSync(true)

      void document.fonts?.ready.then(() => {
        if (active) scheduleSync(true)
      })

      if (typeof IntersectionObserver !== 'undefined') {
        const observer = new IntersectionObserver(sync, { threshold: [0, 0.5, 1] })
        sections.forEach((section) => observer.observe(section))
        window.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('resize', onResize)
        return () => {
          active = false
          observer.disconnect()
          window.removeEventListener('scroll', onScroll)
          window.removeEventListener('resize', onResize)
          if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame)
        }
      }

      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onResize)
      return () => {
        active = false
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onResize)
        if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame)
      }
    }

    let layout = measureSceneLayout()
    const sync = () => store.setProgress(progressForLayout(layout))
    const refreshLayout = () => {
      layout = measureSceneLayout()
      sync()
    }
    const trigger = ScrollTrigger.create({
      trigger: '.homepage',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: sync,
      onRefresh: refreshLayout,
    })
    sync()
    let active = true
    let resizeFrame: number | undefined
    const onResize = () => {
      if (resizeFrame !== undefined) return
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = undefined
        refreshLayout()
      })
    }
    window.addEventListener('resize', onResize)

    void document.fonts?.ready.then(() => {
      if (active) ScrollTrigger.refresh()
    })

    return () => {
      active = false
      window.removeEventListener('resize', onResize)
      if (resizeFrame !== undefined) window.cancelAnimationFrame(resizeFrame)
      trigger.kill()
    }
  }, [store])
}
