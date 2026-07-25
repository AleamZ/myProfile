# Orbital Data Journey — Portfolio Redesign

**Date:** 2026-07-26  
**Status:** Approved design, pending written-spec review

## 1. Objective

Transform the existing portfolio from a stack of visually separate sections into one continuous, cinematic 3D journey. Preserve the current content, localization, theme control, project interactions, experience tabs, contact links, accessibility semantics, and playful mini-games.

The result should feel like a polished futuristic interface rather than a collection of unrelated effects. Scroll is the primary storytelling control: it advances a camera through five connected chapters while the HTML content remains readable and interactive above the 3D scene.

## 2. Experience concept

The selected direction is **Orbital Data Journey**. A persistent luminous data core travels through the entire page and changes form in each chapter. It is the visual signature that connects the experience:

1. **Identity Core** — the core powers a layered holographic introduction.
2. **Project Orbit** — project cards become satellites around the core.
3. **Experience Timeline** — the core stretches into a route through career milestones.
4. **Skills Constellation** — it branches into a network of technical capabilities.
5. **Contact Beacon** — it converges into a final communication portal.

The page should feel like one camera move through a designed world, not five independent full-screen animations.

## 3. Visual language

### Palette

- **Void:** `#05070D` — primary deep-space background.
- **Carbon:** `#0B1020` — elevated surfaces and scene depth.
- **Plasma:** `#6EE7FF` — primary energy and active-state accent.
- **Spectral violet:** `#8B7CFF` — secondary energy and depth cue.
- **Ion white:** `#ECF7FF` — primary text and bright highlights.
- **Telemetry gray:** `#8391A7` — secondary text and technical labels.

The design avoids the familiar black-and-acid-green cyberpunk treatment. Color appears as controlled emitted light against restrained dark materials.

The light theme becomes **Solar Flare**: a pale atmospheric environment with graphite text and warmer refracted energy. The dark theme becomes **Deep Space**. Both modes preserve contrast and share the same scene structure.

### Typography

- A condensed, technical display face carries the name and chapter titles.
- A highly legible sans serif carries body content.
- A compact mono/utility face carries telemetry, indices, coordinates, and navigation status.

Typography remains part of the spatial composition. Large display text may separate along the Z axis during transitions, while body copy stays on a stable reading plane.

### Layout

The 3D canvas is fixed behind the document. Semantic React content remains in the normal page flow above it. Each chapter occupies enough scroll distance to establish, hold, and exit its scene without forcing content into unreadable pinned layouts.

A compact mission navigator replaces the feeling of a conventional section menu. It exposes the active chapter, overall progress, language, and theme controls without obscuring content.

## 4. Chapter behavior

### 4.1 Identity Core

The existing name, role, location, availability, and local-time content remain. The name is rendered as layered HTML typography with coordinated 3D geometry behind it. On entry, glyphs assemble from depth. On exit, their layers separate while the camera passes through the luminous core toward the project scene.

The hero must establish the visual thesis within the first viewport without delaying useful content behind a loader.

### 4.2 Project Orbit

The existing project data, preview images, keyboard behavior, pointer gestures, modal, live demo, and repository views remain available.

Project cards become an orbital gallery. Vertical scroll advances the scene, while explicit arrows, horizontal drag, dots, and keyboard controls continue to select a project. The selected card faces the camera; neighboring cards recede with spatial and lighting cues. Opening a project brings the card forward into the existing detail experience rather than navigating away.

The Dino interaction becomes a restrained easter egg on a peripheral data rail. It never blocks project navigation or preview loading.

### 4.3 Experience Timeline

The current company rail, active job panel, education information, project summaries, tags, and arrow-key tab navigation remain.

Career entries are arranged along a 3D route. Scroll moves the camera along the route, and the active entry receives a focused light treatment. Non-active entries remain visible as depth context but do not compete with the selected content. Explicit tab interaction continues to work independently of scroll.

The Spider motif appears as a subtle connective network in the surrounding scene, not as the primary focal point.

### 4.4 Skills Constellation

The current skill groups and localized labels remain. Each group maps to a constellation cluster; individual skills remain readable HTML chips while the background scene connects them with spatial nodes and lines. Hover and keyboard focus illuminate the related cluster.

Mario moves along a data rail between clusters as an optional easter egg. Its controls remain usable, but it is visually subordinate to the skill taxonomy.

### 4.5 Contact Beacon

The existing lead copy, email address, social links, location, and availability remain. The data core collapses into a communication portal as the camera approaches. The email is the primary action; its focus and hover states expand the portal without moving the target.

Social links occupy quieter orbital positions. The ending settles instead of looping into constant high-intensity motion, giving users a calm place to act.

## 5. Interaction and motion system

Scroll progress is normalized into chapter-local progress values. A single scene controller uses those values to interpolate camera position, camera target, scene groups, lighting, fog, and the core's form. HTML components receive only the state they need, such as active chapter or local progress.

Motion follows three phases per chapter:

1. **Arrival** — establish space and hierarchy.
2. **Hold** — keep content stable for reading and interaction.
3. **Departure** — transform the shared core and guide the camera into the next scene.

Hover and pointer-parallax effects remain subtle and are disabled on coarse-pointer devices. Scroll never hijacks native input, and users can still use anchor navigation and browser find.

## 6. Technical architecture

### Rendering

- Use `three.js` with `@react-three/fiber` and `@react-three/drei` for the shared WebGL world.
- Use `GSAP` and `ScrollTrigger` to map document progress to the camera timeline and coordinated DOM transitions.
- Render one fixed canvas for the entire page.
- Organize each chapter as an isolated scene group with a clear progress interface.
- Keep text, controls, links, dialogs, and content in semantic HTML rather than rendering them into WebGL.

### Proposed boundaries

- `WorldCanvas` owns the renderer, quality mode, camera, shared lighting, and lifecycle.
- `SceneDirector` maps document scroll to chapter and local progress.
- `DataCore` is the persistent signature object shared across chapters.
- `IdentityScene`, `ProjectsScene`, `ExperienceScene`, `SkillsScene`, and `ContactScene` own chapter-specific geometry.
- `MissionNavigator` exposes progress and anchors in HTML.
- Existing section components remain content owners and are adapted to expose refs/state to the director.

Scene components must not read the entire application state. They receive small declarative inputs such as `progress`, `activeProject`, `activeExperience`, `theme`, and `quality`.

## 7. Performance and resilience

### Quality tiers

- **High:** full lighting, particles, post-processing, and geometry density for capable desktop GPUs.
- **Balanced:** reduced particles, simplified shadows, and lighter post-processing for average hardware.
- **Low/mobile:** reduced geometry, no expensive post-processing, capped device pixel ratio, and shorter camera movements.
- **Fallback:** CSS 2.5D composition when WebGL is unavailable or scene initialization fails.

Quality selection considers viewport size, coarse-pointer input, device pixel ratio, reduced-motion preference, and measured frame stability. It is not based on user-agent strings alone.

The hero HTML renders immediately. Scene modules and lower-page assets load progressively. Animation pauses or throttles when the document is hidden. Texture and geometry disposal is required when the canvas unmounts.

### Failure behavior

- A WebGL or dynamic-import failure must never hide content.
- Project preview failures keep the existing placeholder treatment.
- Scene errors fall back to the CSS background and DOM transitions without displaying a blocking error screen.
- Modal and navigation behavior remain functional when animation is disabled.

## 8. Accessibility

- Preserve semantic headings, anchors, tab roles, dialog semantics, skip link, labels, and keyboard behavior.
- Keep readable content in DOM order matching the visual chapter order.
- Respect `prefers-reduced-motion`: disable camera flight, parallax, particle travel, and long spatial transitions; use short opacity changes instead.
- Provide visible focus states unaffected by WebGL lighting.
- Decorative canvas content is hidden from assistive technology.
- Do not convey active state or hierarchy by color alone.
- Maintain target sizes and legibility on touch devices.

## 9. Responsive behavior

Desktop receives the full spatial camera path. Tablet uses a shallower path and simplified composition. Mobile preserves the chapter narrative but frames one primary object at a time, reduces overlapping layers, and keeps all interactive content in a conventional single-column DOM layout.

Orientation changes recalculate the camera path without resetting the user's document position. The experience remains usable with browser zoom and text scaling.

## 10. Testing and acceptance criteria

### Functional

- All original portfolio content and supported languages remain available.
- Theme, language, project carousel, project detail, experience tabs, contact links, and mini-game interactions continue to work.
- Anchor navigation and browser back/forward behavior remain stable.

### Accessibility

- Entire page is usable with keyboard only.
- Reduced-motion mode contains no camera flight or continuous decorative animation.
- Content remains readable and correctly ordered without WebGL.
- Focus is contained and restored correctly around project dialogs.

### Performance

- Cap device pixel ratio and reduce scene complexity on mobile.
- Avoid avoidable layout thrashing during scroll.
- Desktop target: perceptually smooth motion near 60 fps on capable hardware.
- Mobile target: stable interaction at 30 fps or better, with content usability taking priority over visual fidelity.
- No permanent blank canvas or blocking loader when assets fail.

### Verification

- Run TypeScript build, production build, and lint.
- Test current Chrome/Edge desktop, a mobile viewport, keyboard navigation, reduced motion, and WebGL-disabled fallback.
- Inspect representative screenshots at hero, each chapter hold state, and contact ending.
- Check for console errors, leaked animation loops, and excessive GPU memory after navigating or changing theme.

## 11. Scope boundaries

This redesign does not rewrite portfolio copy, add new portfolio projects, replace the localization system, introduce audio, or require large externally authored 3D models. The initial implementation builds the visual world from procedural geometry, typography, particles, lighting, and existing project imagery. This keeps the experience distinctive while controlling download size and production risk.

