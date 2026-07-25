import { useEffect, useMemo, useState } from 'react'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function isMotionEnabled(reducedMotionQuery: MediaQueryList | null): boolean {
  return document.documentElement.dataset.bgfx !== 'off' && !reducedMotionQuery?.matches
}

export function useMotionCapability(): boolean {
  const reducedMotionQuery = useMemo(
    () => window.matchMedia?.(REDUCED_MOTION_QUERY) ?? null,
    [],
  )
  const [motionEnabled, setMotionEnabled] = useState(() => isMotionEnabled(reducedMotionQuery))

  useEffect(() => {
    const sync = () => setMotionEnabled(isMotionEnabled(reducedMotionQuery))
    const observer = new MutationObserver(sync)

    reducedMotionQuery?.addEventListener('change', sync)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-bgfx'],
    })
    sync()

    return () => {
      reducedMotionQuery?.removeEventListener('change', sync)
      observer.disconnect()
    }
  }, [reducedMotionQuery])

  return motionEnabled
}
