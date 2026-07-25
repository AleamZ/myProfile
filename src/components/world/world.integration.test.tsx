import { render, screen, waitFor, within } from '@testing-library/react'
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

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = '0px'
  readonly thresholds = [0]

  disconnect = vi.fn()
  observe = vi.fn()
  takeRecords = vi.fn(() => [])
  unobserve = vi.fn()
}

function installMatchMedia(reducedMotion: boolean) {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? reducedMotion : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  })))
}

function expectCorePageContent() {
  expect(screen.getByRole('heading', { level: 1, name: 'Nguyen Tien Dat' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2, name: 'Work' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2, name: 'Experience' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2, name: 'Skills' })).toBeInTheDocument()
  expect(screen.getAllByRole('link', { name: /datnguyentien\.work@gmail\.com/i }).length).toBeGreaterThan(0)
  expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument()
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
})
