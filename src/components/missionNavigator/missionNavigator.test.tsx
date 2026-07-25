import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useLayoutEffect } from 'react'
import { LanguageProvider } from '../../i18n/LanguageProvider'
import { SceneProvider } from '../../scene/SceneProvider'
import { useSceneStore } from '../../scene/sceneHooks'
import MissionNavigator from './missionNavigator'

function NavigatorHarness({ progress }: { progress: number }) {
  const store = useSceneStore()

  useLayoutEffect(() => {
    store.setProgress(progress)
  }, [progress, store])

  return <MissionNavigator />
}

describe('MissionNavigator', () => {
  beforeEach(() => {
    window.localStorage.setItem('pp-lang', 'en')
  })

  it('marks the project chapter as the current location and reports document progress', () => {
    render(
      <LanguageProvider>
        <SceneProvider>
          <NavigatorHarness progress={0.25} />
        </SceneProvider>
      </LanguageProvider>,
    )

    expect(screen.getByRole('link', { name: 'Work' })).toHaveAttribute('aria-current', 'location')

    const progressbar = screen.getByRole('progressbar', { name: 'Mission progress' })
    expect(progressbar).toHaveAttribute('aria-valuemin', '0')
    expect(progressbar).toHaveAttribute('aria-valuemax', '100')
    expect(Number(progressbar.getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(0)
    expect(Number(progressbar.getAttribute('aria-valuenow'))).toBeLessThanOrEqual(100)
  })

  it('keeps all five localized chapter anchors intact', async () => {
    const user = userEvent.setup()

    render(
      <LanguageProvider>
        <SceneProvider>
          <NavigatorHarness progress={0} />
        </SceneProvider>
      </LanguageProvider>,
    )

    for (const label of ['Identity', 'Work', 'Experience', 'Skills', 'Contact']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    }

    const contact = screen.getByRole('link', { name: 'Contact' })
    await user.click(contact)
    expect(contact).toHaveAttribute('href', '#contact')
  })
})
