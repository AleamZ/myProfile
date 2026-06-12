import type { CSSProperties } from 'react'
import { SKILLS } from '../../data/skills'
import { useLang } from '../../i18n/LanguageProvider'
import SkillsMario from '../skillsMario/skillsMario'

const Skills = () => {
    const { t, lang } = useLang()

    return (
        <section className="skills" id="skills" aria-labelledby="skills-heading">
            <div className="skills__head reveal">
                <h2 id="skills-heading" className="sr-only">{t.sections.skills}</h2>
                <span className="index">04&nbsp;/&nbsp;{t.sections.skills}</span>
            </div>

            <dl className="skills__list">
                {SKILLS.map((group, gi) => (
                    <div className="skills__group reveal" key={group.id} style={{ '--g': gi } as CSSProperties}>
                        <dt className="skills__cat">{group.title[lang]}</dt>
                        <dd className="skills__items">
                            {group.items.map((item, i) => (
                                <span className="skills__tag" key={item} style={{ '--i': i } as CSSProperties}>{item}</span>
                            ))}
                        </dd>
                    </div>
                ))}
            </dl>

            <SkillsMario />
        </section>
    )
}

export default Skills
