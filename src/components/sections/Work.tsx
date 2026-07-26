import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import Chapter from '../Chapter'
import { useLang } from '../../i18n/LanguageProvider'
import { PROJECTS } from '../../data/projects'
import { stage } from '../../system/stage'

const pad = (n: number) => n.toString().padStart(2, '0')

/**
 * 02 — Work.
 *
 * An index and a readout, not a carousel of cards. Selecting a row writes the
 * project into the telemetry column, so the same fixed slots that showed the
 * local time now show what is being read — the continuity the page is built
 * around. Screenshots are gone on purpose: a bright product shot is a foreign
 * object in a monochrome instrument, and the work reads better as data.
 */
const Work = () => {
    const { t, lang } = useLang()
    const [active, setActive] = useState(0)
    const project = PROJECTS[active]

    useEffect(() => {
        stage.setFocus({ chapter: 'work', label: project.name, index: active + 1, total: PROJECTS.length })
    }, [active, project.name])

    useEffect(() => () => stage.setFocus(null), [])

    return (
        <Chapter
            id="work"
            index="02"
            title={t.sections.work}
            meta={`${pad(PROJECTS.length)} ${t.work.entries}`}
        >
            <div className="work">
                <ol className="work__index">
                    {PROJECTS.map((item, i) => (
                        <li key={item.id}>
                            <button
                                type="button"
                                className={`work__row${i === active ? ' is-active' : ''}`}
                                style={{ '--i': i } as CSSProperties}
                                aria-pressed={i === active}
                                onPointerEnter={() => setActive(i)}
                                onFocus={() => setActive(i)}
                                onClick={() => setActive(i)}
                            >
                                <span className="work__no t-data">{pad(i + 1)}</span>
                                <span className="work__name">{item.name}</span>
                                <span className="work__year t-data">{item.year ?? ''}</span>
                            </button>
                        </li>
                    ))}
                </ol>

                {/* Keyed so the readout re-runs its entrance on every change. */}
                <div className="work__readout" key={project.id}>
                    <p className="work__blurb">{project.blurb[lang]}</p>

                    <ul className="work__tech">
                        {project.tech.map((tag) => (
                            <li className="work__tag t-data" key={tag}>{tag}</li>
                        ))}
                    </ul>

                    <div className="work__links">
                        {project.demoUrl && (
                            <a className="work__link t-data" href={project.demoUrl} target="_blank" rel="noreferrer">
                                {t.work.live} <span aria-hidden="true">↗</span>
                            </a>
                        )}
                        {project.repoUrl && (
                            <a className="work__link t-data" href={project.repoUrl} target="_blank" rel="noreferrer">
                                {t.work.source} <span aria-hidden="true">↗</span>
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </Chapter>
    )
}

export default Work
