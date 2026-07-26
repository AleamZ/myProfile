/**
 * Publishes pointer position as a damped tilt onto the root, so every chapter
 * can lean toward the cursor as a continuous layer under its scroll travel.
 *
 * This is what stops a "held" chapter from reading as a frozen slide: the
 * scroll-driven arrive/hold/depart transform gives a chapter a position, but
 * once it settles nothing moves until the next scroll tick. A live tilt
 * underneath it means the page never actually stops.
 */

const MAX_TILT_DEG = 5

export function trackPointerTilt(): () => void {
  const root = document.documentElement
  let targetX = 0
  let targetY = 0
  let x = 0
  let y = 0
  let frame: number | undefined

  const step = () => {
    x += (targetX - x) * 0.06
    y += (targetY - y) * 0.06
    root.style.setProperty('--tilt-x', `${x.toFixed(3)}deg`)
    root.style.setProperty('--tilt-y', `${y.toFixed(3)}deg`)
    frame = window.requestAnimationFrame(step)
  }

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return // touch has no hover to parallax
    const nx = (event.clientX / window.innerWidth) * 2 - 1
    const ny = (event.clientY / window.innerHeight) * 2 - 1
    targetX = nx * MAX_TILT_DEG
    targetY = -ny * MAX_TILT_DEG
  }

  const onPointerLeave = () => {
    targetX = 0
    targetY = 0
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerleave', onPointerLeave)
  frame = window.requestAnimationFrame(step)

  return () => {
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerleave', onPointerLeave)
    if (frame !== undefined) window.cancelAnimationFrame(frame)
    root.style.removeProperty('--tilt-x')
    root.style.removeProperty('--tilt-y')
  }
}
