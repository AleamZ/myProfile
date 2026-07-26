import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import Chapter from '../Chapter'
import { useLang } from '../../i18n/LanguageProvider'
import { SKILLS } from '../../data/skills'
import { stage } from '../../system/stage'

const pad = (n: number) => n.toString().padStart(2, '0')
const TOTAL = SKILLS.reduce((sum, group) => sum + group.items.length, 0)

/** 04 — Skills. The same index and readout, one more time. */
const Skills = () => {
    const { t, lang } = useLang()
    const [active, setActive] = useState(0)
    const group = SKILLS[active]

    useEffect(() => {
        stage.setFocus({ chapter: 'skills', label: group.title[lang], index: active + 1, total: SKILLS.length })
    }, [active, group, lang])

    useEffect(() => () => stage.setFocus(null), [])

    return (
        <Chapter
            id="skills"
            index="04"
            title={t.sections.skills}
            meta={`${pad(TOTAL)} ${t.skillsMeta.entries}`}
        >
            <div className="work">
                <ol className="work__index">
                    {SKILLS.map((item, i) => (
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
                                <span className="work__name">{item.title[lang]}</span>
                                <span className="work__year t-data">{pad(item.items.length)}</span>
                            </button>
                        </li>
                    ))}
                </ol>

                <div className="work__readout" key={group.id}>
                    <ul className="skills__items">
                        {group.items.map((item) => (
                            <li className="skills__item" key={item}>{item}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </Chapter>
    )
}

export default Skills
