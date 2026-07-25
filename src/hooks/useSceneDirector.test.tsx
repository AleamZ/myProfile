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

function DirectorHarness({ motionEnabled = true }: { motionEnabled?: boolean }) {
  useSceneDirector(motionEnabled)
  const scene = useSceneSnapshot()

  return (
    <>
      <output data-testid="chapter">{scene.chapter}</output>
      <output data-testid="document-progress">{scene.documentProgress}</output>
      <output data-testid="local-progress">{scene.localProgress}</output>
    </>
  )
}

describe('useSceneDirector', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('warps cached section geometry into scene progress and cleans up its trigger', () => {
    const kill = vi.fn()
    let onUpdate: ((self: { progress: number }) => void) | undefined
    let onRefresh: (() => void) | undefined
    let scrollY = 725
    let headerBottom = 60
    let projectsTop = 793.359
    vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => scrollY)
    const getBoundingClientRect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        const absoluteTop = this.dataset.scene === 'projects' ? projectsTop : 0
        const height = this.classList.contains('site-header') ? headerBottom : this.dataset.scene === 'projects' ? 1210 : projectsTop

        return {
          top: this.classList.contains('site-header') ? 0 : absoluteTop - window.scrollY,
          bottom: this.classList.contains('site-header') ? headerBottom : absoluteTop - window.scrollY + height,
          height,
        } as DOMRect
      })
    create.mockImplementation((config) => {
      onUpdate = config.onUpdate
      onRefresh = config.onRefresh
      return { kill }
    })

    const { getByTestId, unmount } = render(
      <SceneProvider>
        <div className="homepage">
          <header className="site-header" />
          <section data-scene="identity" />
          <section data-scene="projects" />
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

    const measuredAtSetup = getBoundingClientRect.mock.calls.length
    act(() => onUpdate?.({ progress: 0.159 }))
    expect(getByTestId('chapter')).toHaveTextContent('projects')
    expect(getBoundingClientRect).toHaveBeenCalledTimes(measuredAtSetup)

    scrollY = 720
    headerBottom = 64
    projectsTop = 800
    act(() => onRefresh?.())
    expect(getByTestId('chapter')).toHaveTextContent('projects')

    unmount()
    expect(kill).toHaveBeenCalledTimes(1)
  })

  it('keeps reduced-motion progress synchronized and reconfigures for live motion changes', () => {
    const disconnect = vi.fn()
    const observe = vi.fn()
    const triggerKill = vi.fn()
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
    let scrollY = 0
    vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => scrollY)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const absoluteTop = this.dataset.scene === 'projects' ? 793 : 0
      const height = this.classList.contains('site-header') ? 68 : this.dataset.scene === 'projects' ? 1413 : 793

      return {
        top: this.classList.contains('site-header') ? 0 : absoluteTop - window.scrollY,
        bottom: this.classList.contains('site-header') ? 68 : absoluteTop - window.scrollY + height,
        height,
      } as DOMRect
    })
    const addEventListener = vi.spyOn(window, 'addEventListener')
    const removeEventListener = vi.spyOn(window, 'removeEventListener')
    create.mockReturnValue({ kill: triggerKill })
    const director = (motionEnabled: boolean) => (
      <SceneProvider>
        <div className="homepage">
          <header className="site-header" />
          <section data-scene="identity" />
          <section data-scene="projects" />
          <DirectorHarness motionEnabled={motionEnabled} />
        </div>
      </SceneProvider>
    )

    const { getByTestId, rerender, unmount } = render(director(false))

    window.innerHeight = 800
    scrollY = 725
    window.dispatchEvent(new Event('scroll'))
    act(() => runFrame?.(0))

    expect(create).not.toHaveBeenCalled()
    expect(getByTestId('chapter')).toHaveTextContent('projects')
    expect(observe).toHaveBeenCalledTimes(2)
    expect(addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })
    expect(addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))

    rerender(director(true))
    expect(disconnect).toHaveBeenCalledTimes(1)
    expect(removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function))
    expect(removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(create).toHaveBeenCalledTimes(1)

    unmount()
    expect(triggerKill).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['normal', false],
    ['reduced', true],
  ] as const)('reaches Contact at 100% at maximum scroll in the %s-motion path', (_label, reducedMotion) => {
    const kill = vi.fn()
    let onUpdate: (() => void) | undefined
    let runFrame: FrameRequestCallback | undefined
    const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      runFrame = callback
      return 1
    })
    class MockIntersectionObserver {
      observe = vi.fn()
      disconnect = vi.fn()
    }
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: reducedMotion })))
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    vi.stubGlobal('requestAnimationFrame', requestAnimationFrame)
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(900)
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(5800)
    const scrollY = 4900
    vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => scrollY)

    const sectionGeometry: Record<string, { top: number; height: number }> = {
      identity: { top: 0, height: 900 },
      projects: { top: 900, height: 1200 },
      experience: { top: 2100, height: 1400 },
      skills: { top: 3500, height: 1000 },
      contact: { top: 4500, height: 1000 },
    }
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const geometry = sectionGeometry[this.dataset.scene ?? '']
      const top = this.classList.contains('site-header') ? 0 : geometry.top - window.scrollY
      const height = this.classList.contains('site-header') ? 64 : geometry.height
      return { top, bottom: top + height, height } as DOMRect
    })
    create.mockImplementation((config) => {
      onUpdate = config.onUpdate
      return { kill }
    })

    const { getByTestId } = render(
      <SceneProvider>
        <div className="homepage">
          <header className="site-header" />
          {Object.keys(sectionGeometry).map((scene) => <section data-scene={scene} key={scene} />)}
          <DirectorHarness motionEnabled={!reducedMotion} />
        </div>
      </SceneProvider>,
    )

    if (reducedMotion) {
      window.dispatchEvent(new Event('scroll'))
      act(() => runFrame?.(0))
    } else {
      act(() => onUpdate?.())
    }

    expect(getByTestId('chapter')).toHaveTextContent('contact')
    expect(getByTestId('document-progress')).toHaveTextContent('1')
    expect(getByTestId('local-progress')).toHaveTextContent('1')
  })
})
