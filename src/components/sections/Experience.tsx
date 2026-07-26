import { useEffect, useState } from 'react'
import Chapter from '../Chapter'
import { useLang } from '../../i18n/LanguageProvider'
import { EDUCATION, EXPERIENCE } from '../../data/experience'
import { stage } from '../../system/stage'

const pad = (n: number) => n.toString().padStart(2, '0')

/**
 * 03 — Experience.
 *
 * The same index-and-readout shape as Work, deliberately. Five bespoke layouts
 * is what made the page read as five unrelated pages; one shape repeated is
 * what makes it read as one document.
 */
const Experience = () => {
    const { t, lang } = useLang()
    const [active, setActive] = useState(0)
    const job = EXPERIENCE[active]

    useEffect(() => {
        stage.setFocus({ chapter: 'experience', label: job.company, index: active + 1, total: EXPERIENCE.length })
    }, [active, job.company])

    useEffect(() => () => stage.setFocus(null), [])

    return (
        <Chapter
            id="experience"
            index="03"
            title={t.sections.experience}
            meta={EDUCATION[lang]}
        >
            <div className="work">
                <ol className="work__index">
                    {EXPERIENCE.map((item, i) => (
                        <li key={item.id}>
                            <button
                                type="button"
                                className={`work__row${i === active ? ' is-active' : ''}`}
                                aria-pressed={i === active}
                                onPointerEnter={() => setActive(i)}
                                onFocus={() => setActive(i)}
                                onClick={() => setActive(i)}
                            >
                                <span className="work__no t-data">{pad(i + 1)}</span>
                                <span className="work__name">{item.company}</span>
                                <span className="work__year t-data">{item.period[lang]}</span>
                            </button>
                        </li>
                    ))}
                </ol>

                <div className="work__readout" key={job.id}>
                    <p className="exp__role">
                        {job.role[lang]}
                        {job.team ? <span className="exp__team"> · {job.team[lang]}</span> : null}
                    </p>

                    <ol className="exp__projects">
                        {job.projects.map((item, i) => (
                            <li className="exp__project" key={item.name}>
                                <span className="exp__project-no t-data">{pad(i + 1)}</span>
                                <div className="exp__project-body">
                                    <h3 className="exp__project-name">{item.name}</h3>
                                    <p className="exp__project-summary">{item.summary[lang]}</p>
                                    <ul className="work__tech">
                                        {item.tags.map((tag) => (
                                            <li className="work__tag t-data" key={tag}>{tag}</li>
                                        ))}
                                    </ul>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </Chapter>
    )
}

export default Experience
