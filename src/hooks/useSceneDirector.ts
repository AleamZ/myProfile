import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CHAPTERS, type Chapter } from '../components/world/world.types'
import { useSceneStore } from '../scene/sceneHooks'

gsap.registerPlugin(ScrollTrigger)

const sceneSelector = '[data-scene]'

function syncNearestSection(sections: HTMLElement[], setProgress: (progress: number) => void) {
  if (sections.length === 0) return

  const viewportMiddle = window.innerHeight / 2
  const nearest = sections.reduce((current, section) => {
    const currentDistance = Math.abs(current.getBoundingClientRect().top + current.getBoundingClientRect().height / 2 - viewportMiddle)
    const sectionRect = section.getBoundingClientRect()
    const sectionDistance = Math.abs(sectionRect.top + sectionRect.height / 2 - viewportMiddle)

    return sectionDistance < currentDistance ? section : current
  })
  const chapter = nearest.dataset.scene as Chapter | undefined
  const chapterIndex = chapter ? CHAPTERS.indexOf(chapter) : -1

  if (chapterIndex >= 0) setProgress(chapterIndex / CHAPTERS.length)
}

export function useSceneDirector() {
  const store = useSceneStore()

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    if (reducedMotion) {
      const sections = Array.from(document.querySelectorAll<HTMLElement>(sceneSelector))
      const sync = () => syncNearestSection(sections, store.setProgress)
      sync()

      if (typeof IntersectionObserver !== 'undefined') {
        const observer = new IntersectionObserver(sync, { threshold: [0, 0.5, 1] })
        sections.forEach((section) => observer.observe(section))
        return () => observer.disconnect()
      }

      window.addEventListener('scroll', sync, { passive: true })
      window.addEventListener('resize', sync)
      return () => {
        window.removeEventListener('scroll', sync)
        window.removeEventListener('resize', sync)
      }
    }

    const trigger = ScrollTrigger.create({
      trigger: '.homepage',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => store.setProgress(self.progress),
    })
    let active = true

    void document.fonts?.ready.then(() => {
      if (active) ScrollTrigger.refresh()
    })

    return () => {
      active = false
      trigger.kill()
    }
  }, [store])
}
