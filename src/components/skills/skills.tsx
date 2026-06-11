import { SKILLS } from '../../data/skills'
import { useLang } from '../../i18n/LanguageProvider'

const Skills = () => {
    const { t, lang } = useLang()

    return (
        <section className="skills" id="skills" aria-labelledby="skills-heading">
            <div className="skills__head reveal">
                <h2 id="skills-heading" className="sr-only">{t.sections.skills}</h2>
                <span className="index">04&nbsp;/&nbsp;{t.sections.skills}</span>
            </div>

            <dl className="skills__list">
                {SKILLS.map((group) => (
                    <div className="skills__group reveal" key={group.id}>
                        <dt className="skills__cat">{group.title[lang]}</dt>
                        <dd className="skills__items">
                            {group.items.map((item) => (
                                <span className="skills__tag" key={item}>{item}</span>
                            ))}
                        </dd>
                    </div>
                ))}
            </dl>
        </section>
    )
}

export default Skills
