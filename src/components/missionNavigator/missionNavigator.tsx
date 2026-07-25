import type { CSSProperties } from 'react'
import { useLang } from '../../i18n/LanguageProvider'
import { useSceneSnapshot } from '../../scene/sceneHooks'
import type { Chapter } from '../world/world.types'

const CHAPTER_LINKS = [
  { chapter: 'identity', href: '#main', index: '01' },
  { chapter: 'projects', href: '#work', index: '02' },
  { chapter: 'experience', href: '#experience', index: '03' },
  { chapter: 'skills', href: '#skills', index: '04' },
  { chapter: 'contact', href: '#contact', index: '05' },
] as const satisfies ReadonlyArray<{ chapter: Chapter; href: string; index: string }>

const MissionNavigator = () => {
  const { t } = useLang()
  const { chapter, documentProgress } = useSceneSnapshot()
  const progress = Math.round(documentProgress * 100)
  const labels: Record<Chapter, string> = {
    identity: t.sections.identity,
    projects: t.sections.work,
    experience: t.sections.experience,
    skills: t.sections.skills,
    contact: t.sections.contact,
  }

  return (
    <nav className="mission-nav" aria-label="Mission navigation">
      <div className="mission-nav__track" aria-hidden="true">
        <span className="mission-nav__track-label">Journey</span>
        <span className="mission-nav__track-value">{progress.toString().padStart(3, '0')}%</span>
      </div>

      <ol className="mission-nav__chapters">
        {CHAPTER_LINKS.map(({ chapter: itemChapter, href, index }) => {
          const active = itemChapter === chapter
          const label = labels[itemChapter]

          return (
            <li className="mission-nav__chapter" key={itemChapter}>
              <a
                className="mission-nav__link"
                href={href}
                aria-label={label}
                aria-current={active ? 'location' : undefined}
              >
                <span className="mission-nav__index" aria-hidden="true">{index}</span>
                <span className="mission-nav__label">{label}</span>
                <span className="mission-nav__signal" aria-hidden="true" />
              </a>
            </li>
          )
        })}
      </ol>

      <div
        className="mission-nav__progress"
        role="progressbar"
        aria-label="Mission progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        style={{ '--mission-progress': `${progress}%` } as CSSProperties}
      >
        <span aria-hidden="true" />
      </div>
    </nav>
  )
}

export default MissionNavigator
