import { normalizeScrollVelocity } from './stageProgress'

/**
 * Shared, mutable scroll speed. A plain object rather than store state on
 * purpose: the 3D scenes read it inside `useFrame`, and routing it through
 * React would re-render the page sixty times a second to move a number.
 */
export const scrollVelocity = { value: 0 }

const SMOOTHING = 0.12
const REST_THRESHOLD = 0.0015

/**
 * Drives `scrollVelocity` and mirrors it to `--scroll-v` on <html>, so CSS can
 * lean type into the direction of travel while the scenes streak with it.
 * Returns a teardown.
 */
export function trackScrollVelocity(): () => void {
  const root = document.documentElement
  let lastY = window.scrollY
  let lastTime = performance.now()
  let smoothed = 0
  let frame: number | undefined
  let idle = true

  const publish = () => {
    scrollVelocity.value = smoothed
    root.style.setProperty('--scroll-v', smoothed.toFixed(4))
  }

  const step = () => {
    const now = performance.now()
    const y = window.scrollY
    const target = normalizeScrollVelocity(y - lastY, now - lastTime)
    lastY = y
    lastTime = now
    smoothed += (target - smoothed) * SMOOTHING
    publish()

    // Park the loop once motion has decayed; a scroll event restarts it. A
    // permanently running rAF here would keep the compositor awake on a page
    // nobody is touching.
    if (Math.abs(smoothed) < REST_THRESHOLD && target === 0) {
      smoothed = 0
      publish()
      frame = undefined
      idle = true
      return
    }

    frame = window.requestAnimationFrame(step)
  }

  const wake = () => {
    if (!idle) return
    idle = false
    lastTime = performance.now()
    lastY = window.scrollY
    frame = window.requestAnimationFrame(step)
  }

  publish()
  window.addEventListener('scroll', wake, { passive: true })

  return () => {
    window.removeEventListener('scroll', wake)
    if (frame !== undefined) window.cancelAnimationFrame(frame)
    root.style.removeProperty('--scroll-v')
    scrollVelocity.value = 0
  }
}
