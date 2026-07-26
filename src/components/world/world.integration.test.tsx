import { useEffect } from 'react'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../App'

const { detectWebGL, createScrollTrigger } = vi.hoisted(() => ({
  detectWebGL: vi.fn(),
  createScrollTrigger: vi.fn(() => ({ kill: vi.fn() })),
}))

vi.mock('../../scene/quality', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../scene/quality')>()),
  detectWebGL,
}))

vi.mock('gsap', () => ({
  gsap: { registerPlugin: vi.fn() },
}))

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: { create: createScrollTrigger, refresh: vi.fn() },
}))

vi.mock('./WorldCanvas', () => ({
  default: function MockWorldCanvas({ onFirstFrame }: { onFirstFrame?: () => void }) {
    useEffect(() => onFirstFrame?.(), [onFirstFrame])
    return <div className="world-canvas" data-testid="world-canvas" />
  },
}))

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = '0px'
  readonly thresholds = [0]

  disconnect = vi.fn()
  observe = vi.fn()
  takeRecords = vi.fn(() => [])
  unobserve = vi.fn()
}

function installMatchMedia(initialReducedMotion: boolean) {
  let reducedMotion = initialReducedMotion
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  const reducedMotionQuery = {
    get matches() {
      return reducedMotion
    },
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener)),
    removeEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener)),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  }

  vi.stubGlobal('matchMedia', vi.fn((query: string) => query === reducedMotionQuery.media
    ? reducedMotionQuery
    : {
        ...reducedMotionQuery,
        matches: false,
        media: query,
      }))

  return {
    setReducedMotion(matches: boolean) {
      reducedMotion = matches
      const event = { matches, media: reducedMotionQuery.media } as MediaQueryListEvent
      listeners.forEach((listener) => listener(event))
    },
  }
}

function expectCorePageContent() {
  expect(screen.getByRole('heading', { level: 1, name: 'Nguyen Tien Dat' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2, name: 'Work' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2, name: 'Experience' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2, name: 'Skills' })).toBeInTheDocument()
  expect(screen.getAllByRole('link', { name: /datnguyentien\.work@gmail\.com/i }).length).toBeGreaterThan(0)
  expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument()
}

describe('homepage progressive enhancement', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.localStorage.setItem('pp-lang', 'en')
    document.documentElement.dataset.theme = 'dark'
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  })

  afterEach(() => {
    document.documentElement.classList.remove('js')
    delete document.documentElement.dataset.theme
    delete document.documentElement.dataset.bgfx
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('keeps the complete semantic page available when WebGL is unavailable', () => {
    detectWebGL.mockReturnValue(false)
    installMatchMedia(false)

    const { container } = render(<App />)

    expectCorePageContent()
    expect(container.querySelector('canvas')).not.toBeInTheDocument()
    expect(container.querySelector('.world-canvas')).not.toBeInTheDocument()
  })

  it('disables the canvas and reveals every chapter for reduced motion while preserving mission anchors', async () => {
    const user = userEvent.setup()
    detectWebGL.mockReturnValue(true)
    installMatchMedia(true)

    const { container } = render(<App />)

    expectCorePageContent()
    expect(container.querySelector('canvas')).not.toBeInTheDocument()
    expect(container.querySelector('.world-canvas')).not.toBeInTheDocument()

    await waitFor(() => {
      const reveals = Array.from(container.querySelectorAll<HTMLElement>('.reveal'))
      expect(reveals.length).toBeGreaterThan(0)
      expect(reveals.every((element) => element.classList.contains('is-inview'))).toBe(true)
    })

    const missionNavigation = screen.getByRole('navigation', { name: 'Mission navigation' })
    const expectedAnchors = [
      ['Identity', '#main'],
      ['Work', '#work'],
      ['Experience', '#experience'],
      ['Skills', '#skills'],
      ['Contact', '#contact'],
    ] as const

    for (const [name, href] of expectedAnchors) {
      expect(within(missionNavigation).getByRole('link', { name })).toHaveAttribute('href', href)
    }

    await user.click(within(missionNavigation).getByRole('link', { name: 'Contact' }))
    expect(window.location.hash).toBe('#contact')
  })

  it('honors initial motion-off and unmounts, resets, and remounts the world on footer toggles', async () => {
    const user = userEvent.setup()
    detectWebGL.mockReturnValue(true)
    installMatchMedia(false)
    document.documentElement.dataset.bgfx = 'off'

    const { container } = render(<App />)
    const motionToggle = screen.getByRole('button', { name: 'Motion' })

    expect(motionToggle).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByTestId('world-canvas')).not.toBeInTheDocument()

    await user.click(motionToggle)
    await waitFor(() => expect(screen.getByTestId('world-canvas')).toBeInTheDocument())
    await waitFor(() => expect(container.querySelector('.homepage')).toHaveAttribute('data-world', 'active'))

    await user.click(motionToggle)
    await waitFor(() => expect(screen.queryByTestId('world-canvas')).not.toBeInTheDocument())
    expect(container.querySelector('.homepage')).not.toHaveAttribute('data-world')
    expect(container.querySelector('.homepage')).not.toHaveClass('world-ambience-dimmed')

    await user.click(motionToggle)
    await waitFor(() => expect(screen.getByTestId('world-canvas')).toBeInTheDocument())
  })

  it('unmounts and restores the world when reduced motion changes live', async () => {
    detectWebGL.mockReturnValue(true)
    const media = installMatchMedia(false)
    document.documentElement.dataset.bgfx = 'on'

    const { container } = render(<App />)
    await waitFor(() => expect(screen.getByTestId('world-canvas')).toBeInTheDocument())
    await waitFor(() => expect(container.querySelector('.homepage')).toHaveAttribute('data-world', 'active'))

    act(() => media.setReducedMotion(true))
    expect(screen.queryByTestId('world-canvas')).not.toBeInTheDocument()
    expect(container.querySelector('.homepage')).not.toHaveAttribute('data-world')

    act(() => media.setReducedMotion(false))
    await waitFor(() => expect(screen.getByTestId('world-canvas')).toBeInTheDocument())
  })
})
