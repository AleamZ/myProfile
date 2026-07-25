import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SceneProvider } from '../scene/SceneProvider'
import { useSceneSnapshot } from '../scene/sceneHooks'
import { useSceneDirector } from './useSceneDirector'

const { registerPlugin, create } = vi.hoisted(() => ({
  registerPlugin: vi.fn(),
  create: vi.fn(),
}))

vi.mock('gsap', () => ({
  gsap: { registerPlugin },
}))

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: { create },
}))

function DirectorHarness() {
  useSceneDirector()
  const scene = useSceneSnapshot()

  return <output data-testid="chapter">{scene.chapter}</output>
}

describe('useSceneDirector', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('routes document scroll progress into the scene store and cleans up its trigger', () => {
    const kill = vi.fn()
    let onUpdate: ((self: { progress: number }) => void) | undefined
    create.mockImplementation((config) => {
      onUpdate = config.onUpdate
      return { kill }
    })

    const { getByTestId, unmount } = render(
      <SceneProvider>
        <div className="homepage">
          <DirectorHarness />
        </div>
      </SceneProvider>,
    )

    expect(registerPlugin).toHaveBeenCalledWith(expect.anything())
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      trigger: '.homepage',
      start: 'top top',
      end: 'bottom bottom',
    }))

    act(() => onUpdate?.({ progress: 0.5 }))
    expect(getByTestId('chapter')).toHaveTextContent('experience')

    unmount()
    expect(kill).toHaveBeenCalledTimes(1)
  })

  it('keeps the reduced-motion chapter synchronized on scroll and cleans up its side effects', () => {
    const disconnect = vi.fn()
    const observe = vi.fn()
    const requestAnimationFrame = vi.fn<(callback: FrameRequestCallback) => number>()
    let runFrame: FrameRequestCallback | undefined
    requestAnimationFrame.mockImplementation((callback) => {
      runFrame = callback
      return 1
    })
    class MockIntersectionObserver {
      observe = observe
      disconnect = disconnect
    }
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    vi.stubGlobal('requestAnimationFrame', requestAnimationFrame)
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const addEventListener = vi.spyOn(window, 'addEventListener')
    const removeEventListener = vi.spyOn(window, 'removeEventListener')
    let projectsNearest = false

    const { getByTestId, unmount } = render(
      <SceneProvider>
        <div className="homepage">
          <section data-scene="identity" />
          <section data-scene="projects" />
          <DirectorHarness />
        </div>
      </SceneProvider>,
    )
    const [identity, projects] = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'))
    vi.spyOn(identity, 'getBoundingClientRect').mockImplementation(() => ({ top: projectsNearest ? 750 : 350, height: 100 }) as DOMRect)
    vi.spyOn(projects, 'getBoundingClientRect').mockImplementation(() => ({ top: projectsNearest ? 350 : 750, height: 100 }) as DOMRect)

    window.innerHeight = 800
    projectsNearest = true
    window.dispatchEvent(new Event('scroll'))
    act(() => runFrame?.(0))

    expect(create).not.toHaveBeenCalled()
    expect(getByTestId('chapter')).toHaveTextContent('projects')
    expect(observe).toHaveBeenCalledTimes(2)
    expect(addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })
    expect(addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))

    unmount()
    expect(disconnect).toHaveBeenCalledTimes(1)
    expect(removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function))
    expect(removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})
