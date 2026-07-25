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
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('warps cached section geometry into scene progress and cleans up its trigger', () => {
    const kill = vi.fn()
    let onUpdate: ((self: { progress: number }) => void) | undefined
    vi.stubGlobal('scrollY', 725)
    const getBoundingClientRect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        const absoluteTop = this.dataset.scene === 'projects' ? 793 : 0
        const height = this.classList.contains('site-header') ? 68 : this.dataset.scene === 'projects' ? 1210 : 793

        return {
          top: this.classList.contains('site-header') ? 0 : absoluteTop - window.scrollY,
          bottom: this.classList.contains('site-header') ? 68 : absoluteTop - window.scrollY + height,
          height,
        } as DOMRect
      })
    create.mockImplementation((config) => {
      onUpdate = config.onUpdate
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

    window.innerHeight = 800
    scrollY = 725
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
