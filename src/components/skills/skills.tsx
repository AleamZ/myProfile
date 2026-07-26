import { useEffect, useRef } from 'react'
import type {
    CSSProperties,
    FocusEvent as ReactFocusEvent,
} from 'react'
import { SKILLS } from '../../data/skills'
import { useLang } from '../../i18n/LanguageProvider'
import { useChapterStage } from '../../hooks/useChapterStage'
import { useSceneStore } from '../../scene/sceneHooks'
import SkillsMario from '../skillsMario/skillsMario'

const Skills = () => {
    const { t, lang } = useLang()
    const store = useSceneStore()
    const hoveredGroup = useRef<number | null>(null)
    const focusedGroup = useRef<number | null>(null)

    useEffect(() => () => {
        store.setActiveSkillGroup(null)
    }, [store])

    const enterGroup = (index: number) => {
        hoveredGroup.current = index
        store.setActiveSkillGroup(index)
    }
    const leaveGroup = () => {
        hoveredGroup.current = null
        store.setActiveSkillGroup(focusedGroup.current)
    }
    const focusGroup = (index: number) => {
        focusedGroup.current = index
        store.setActiveSkillGroup(index)
    }
    const blurGroup = (event: ReactFocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            focusedGroup.current = null
            store.setActiveSkillGroup(hoveredGroup.current)
        }
    }

    const stageRef = useChapterStage<HTMLDivElement>('skills')

    return (
        <section className="skills" id="skills" data-scene="skills" aria-labelledby="skills-heading">
            <div className="chapter-stage" ref={stageRef}>
                <div className="skills__head reveal">
                    <h2 id="skills-heading" className="sr-only">{t.sections.skills}</h2>
                    <span className="index">04&nbsp;/&nbsp;{t.sections.skills}</span>
                </div>

                <dl className="skills__list">
                    {SKILLS.map((group, gi) => (
                        <div
                            className="skills__group reveal"
                            key={group.id}
                            style={{ '--g': gi } as CSSProperties}
                            data-skill-group={gi}
                            tabIndex={0}
                            onPointerEnter={() => enterGroup(gi)}
                            onPointerLeave={leaveGroup}
                            onFocus={() => focusGroup(gi)}
                            onBlur={blurGroup}
                        >
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
            </div>

        </section>
    )
}

export default Skills
