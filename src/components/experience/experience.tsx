import { useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { EDUCATION, EXPERIENCE } from '../../data/experience'
import { useLang } from '../../i18n/LanguageProvider'
import ExpSpiders from '../expSpiders/expSpiders'

const startYear = (period: string) => period.match(/\d{4}/)?.[0] ?? ''

const Experience = () => {
    const { t, lang } = useLang()
    const [active, setActive] = useState(0)
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
    const len = EXPERIENCE.length
    const job = EXPERIENCE[active]

    const select = (i: number) => {
        const next = (i + len) % len
        setActive(next)
        tabRefs.current[next]?.focus()
    }

    const onKey = (i: number) => (e: ReactKeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
            case 'ArrowRight':
                e.preventDefault()
                select(i + 1)
                break
            case 'ArrowUp':
            case 'ArrowLeft':
                e.preventDefault()
                select(i - 1)
                break
            case 'Home':
                e.preventDefault()
                select(0)
                break
            case 'End':
                e.preventDefault()
                select(len - 1)
                break
        }
    }

    return (
        <section className="experience" id="experience" aria-labelledby="experience-heading">
            <div className="exp__head reveal">
                <h2 id="experience-heading" className="sr-only">{t.sections.experience}</h2>
                <span className="index">03&nbsp;/&nbsp;{t.sections.experience}</span>
                <span className="exp__edu">{EDUCATION[lang]}</span>
            </div>

            <div className="exp__explorer reveal">
                <div className="exp__rail" role="tablist" aria-label="Companies" aria-orientation="vertical">
                    {EXPERIENCE.map((j, i) => (
                        <button
                            key={j.id}
                            type="button"
                            role="tab"
                            id={`exp-tab-${j.id}`}
                            ref={(el) => { tabRefs.current[i] = el }}
                            aria-selected={i === active}
                            aria-controls="exp-panel"
                            tabIndex={i === active ? 0 : -1}
                            className={`exp__tab${i === active ? ' is-active' : ''}`}
                            style={{ '--ti': i } as CSSProperties}
                            onClick={() => setActive(i)}
                            onKeyDown={onKey(i)}
                        >
                            <span className="exp__tab-mark" aria-hidden="true" />
                            <span className="exp__tab-text">
                                <span className="exp__tab-company">{j.company}</span>
                                <span className="exp__tab-period">{j.period[lang]}</span>
                            </span>
                        </button>
                    ))}
                </div>

                <div className="exp__panel" id="exp-panel" role="tabpanel" aria-labelledby={`exp-tab-${job.id}`} tabIndex={0}>
                    <div className="exp__panel-inner" key={`${job.id}-${lang}`}>
                        <span className="exp__watermark" aria-hidden="true">{startYear(job.period.en)}</span>

                        <div className="exp__panel-head">
                            <h3 className="exp__company-lg">{job.company}</h3>
                            <p className="exp__meta">
                                <span>{job.role[lang]}</span>
                                {job.team && <span className="exp__dot" aria-hidden="true">·</span>}
                                {job.team && <span>{job.team[lang]}</span>}
                                <span className="exp__dot" aria-hidden="true">·</span>
                                <span>{job.period[lang]}</span>
                            </p>
                            <span className="exp__rule" aria-hidden="true" />
                        </div>

                        <ol className="exp__projects">
                            {job.projects.map((p, pi) => (
                                <li className="exp__project" key={p.name} style={{ '--pi': pi } as CSSProperties}>
                                    <span className="exp__pnum" aria-hidden="true">{String(pi + 1).padStart(2, '0')}</span>
                                    <div className="exp__pbody">
                                        <span className="exp__pname">{p.name}</span>
                                        <span className="exp__psum">{p.summary[lang]}</span>
                                        <span className="exp__ptags">
                                            {p.tags.map((tag) => (
                                                <span className="exp__tag" key={tag}>{tag}</span>
                                            ))}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </div>
            <ExpSpiders />
        </section>
    )
}

export default Experience
