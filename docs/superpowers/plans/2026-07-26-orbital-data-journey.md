# Orbital Data Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing five-section React portfolio into a continuous futuristic WebGL journey while preserving all content, controls, localization, accessibility, and mini-games.

**Architecture:** Keep semantic section content in the DOM and mount one lazy fixed React Three Fiber canvas behind it. A small external scene store receives normalized progress from GSAP ScrollTrigger; scene groups read that store inside `useFrame`, while DOM consumers use `useSyncExternalStore` only for discrete chapter changes. Capability and quality helpers select high, balanced, low, or CSS fallback modes before the canvas loads.

**Tech Stack:** React 19, TypeScript 5.7, Vite 6, SCSS, three.js, @react-three/fiber, @react-three/drei, GSAP ScrollTrigger, Vitest, jsdom, React Testing Library.

## Global Constraints

- Preserve all existing portfolio content and the `en`, `vi`, and `ko` localization system.
- Keep text, controls, links, tabs, and dialogs in semantic HTML; the canvas is decorative and `aria-hidden`.
- Keep native scrolling, anchor navigation, browser find, keyboard navigation, theme switching, project controls, experience tabs, and mini-game controls functional.
- Respect `prefers-reduced-motion` by removing camera flight, parallax, particle travel, and continuous decorative motion.
- Use one fixed canvas; do not create one canvas per section.
- Build the visual world from procedural geometry, lighting, particles, typography, and existing project imagery; do not add large authored 3D models or audio.
- Cap device pixel ratio and scale quality down on mobile; content usability takes priority over visual fidelity.
- A WebGL or dynamic-import failure must leave the full DOM portfolio visible and usable.

## Planned File Structure

```text
src/
  components/
    missionNavigator/
      missionNavigator.tsx       # Active chapter, anchors, progress, existing controls
    world/
      WorldBoundary.tsx          # WebGL/dynamic-import error fallback
      WorldCanvas.tsx            # One fixed R3F Canvas and renderer lifecycle
      DataCore.tsx               # Persistent signature object
      SceneDirector.tsx          # Applies store progress to camera and shared scene state
      world.types.ts             # Chapter, progress, quality, scene-prop contracts
      scenes/
        IdentityScene.tsx
        ProjectsScene.tsx
        ExperienceScene.tsx
        SkillsScene.tsx
        ContactScene.tsx
  scene/
    progress.ts                   # Pure chapter-progress mapping
    quality.ts                    # Capability and quality selection
    sceneStore.ts                 # Imperative store + React subscription hook
    SceneProvider.tsx             # Store ownership and access
  hooks/
    useSceneDirector.ts           # ScrollTrigger lifecycle and section measurements
  styles/
    componentsScss/
      missionNavigator.scss
      world.scss
  test/
    setup.ts
```

Existing section components remain the owners of their content. They gain `data-scene` markers and small scene-store updates only where existing active selections must affect the world.

---

### Task 1: Install the rendering stack and establish the test harness

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vite.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/scene/progress.test.ts`

**Interfaces:**
- Consumes: current Vite/React application.
- Produces: `npm test`, jsdom test setup, and installed runtime packages available to later tasks.

- [ ] **Step 1: Install runtime and test dependencies**

Run:

```powershell
npm install three @react-three/fiber @react-three/drei gsap
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/three
```

Expected: `package.json` and `package-lock.json` contain the new packages with no peer-dependency failure.

- [ ] **Step 2: Add test configuration**

Update `vite.config.ts` to use `defineConfig` from `vitest/config` and add:

```ts
test: {
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
  css: true,
}
```

Add the script to `package.json`:

```json
"test": "vitest run"
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 3: Add a red test proving the harness runs**

Create `src/scene/progress.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { chapterFromProgress } from './progress'

describe('chapterFromProgress', () => {
  it('clamps document progress and maps it to five chapters', () => {
    expect(chapterFromProgress(-1)).toEqual({ chapter: 'identity', localProgress: 0 })
    expect(chapterFromProgress(0.5)).toEqual({ chapter: 'experience', localProgress: 0.5 })
    expect(chapterFromProgress(2)).toEqual({ chapter: 'contact', localProgress: 1 })
  })
})
```

- [ ] **Step 4: Run the test and verify the expected failure**

Run: `npm test -- src/scene/progress.test.ts`

Expected: FAIL because `./progress` does not exist.

- [ ] **Step 5: Commit the harness**

```powershell
git add package.json package-lock.json vite.config.ts src/test/setup.ts src/scene/progress.test.ts
git commit -m "test: add portfolio scene test harness"
```

---

### Task 2: Build the typed scroll-progress store

**Files:**
- Create: `src/components/world/world.types.ts`
- Create: `src/scene/progress.ts`
- Create: `src/scene/sceneStore.ts`
- Create: `src/scene/SceneProvider.tsx`
- Create: `src/scene/sceneStore.test.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `Chapter`, `SceneProgress`, `SceneQuality`; `chapterFromProgress(progress)`; `createSceneStore()` with `getState`, `setProgress`, `setActiveProject`, `setActiveExperience`, `setActiveSkillGroup`, `setContactEngaged`, and `subscribe`; `useSceneStore()` and `useSceneSnapshot()`.
- Consumes: test harness from Task 1.

- [ ] **Step 1: Define the contracts and pure progress mapping**

Create the types:

```ts
export const CHAPTERS = ['identity', 'projects', 'experience', 'skills', 'contact'] as const
export type Chapter = (typeof CHAPTERS)[number]
export type SceneQuality = 'high' | 'balanced' | 'low' | 'fallback'

export interface SceneProgress {
  chapter: Chapter
  documentProgress: number
  localProgress: number
  activeProject: number
  activeExperience: number
  activeSkillGroup: number | null
  contactEngaged: boolean
}
```

Implement `chapterFromProgress` by clamping to `[0, 1]`, dividing the range into five equal segments, and returning `localProgress` clamped to `[0, 1]`. The exact boundary behavior must assign `1` to `contact` with local progress `1`.

- [ ] **Step 2: Run the original red test**

Run: `npm test -- src/scene/progress.test.ts`

Expected: PASS.

- [ ] **Step 3: Write store behavior tests**

Create `src/scene/sceneStore.test.ts` with assertions that:

```ts
const store = createSceneStore()
const listener = vi.fn()
const unsubscribe = store.subscribe(listener)

store.setProgress(0.51)
expect(store.getState().chapter).toBe('experience')
expect(store.getState().documentProgress).toBe(0.51)
expect(listener).toHaveBeenCalledTimes(1)

store.setActiveProject(2)
store.setActiveExperience(1)
store.setActiveSkillGroup(3)
store.setContactEngaged(true)
expect(store.getState()).toMatchObject({
  activeProject: 2,
  activeExperience: 1,
  activeSkillGroup: 3,
  contactEngaged: true,
})

unsubscribe()
store.setProgress(0.8)
expect(listener).toHaveBeenCalledTimes(5)
```

- [ ] **Step 4: Run the store test and verify it fails**

Run: `npm test -- src/scene/sceneStore.test.ts`

Expected: FAIL because `createSceneStore` is missing.

- [ ] **Step 5: Implement the store and provider**

Use a closure-owned state object and `Set<() => void>` listeners. `setProgress` derives chapter data through `chapterFromProgress`; selection and engagement setters preserve the remaining state. `setActiveSkillGroup(null)` clears constellation focus, and `setContactEngaged(false)` closes the portal highlight. `SceneProvider` creates exactly one store with `useState(createSceneStore)` and provides it through context. `useSceneSnapshot` wraps `useSyncExternalStore(store.subscribe, store.getState, store.getState)`.

Wrap the existing router in `App.tsx`:

```tsx
<SceneProvider>
  <BrowserRouter>
    <MainRoutes />
  </BrowserRouter>
</SceneProvider>
```

- [ ] **Step 6: Verify types and tests**

Run: `npm test -- src/scene/progress.test.ts src/scene/sceneStore.test.ts`

Expected: both files PASS.

Run: `npm run build`

Expected: TypeScript and Vite build PASS.

- [ ] **Step 7: Commit the progress foundation**

```powershell
git add src/App.tsx src/components/world/world.types.ts src/scene
git commit -m "feat: add typed orbital scene store"
```

---

### Task 3: Add quality selection, reduced motion, and WebGL fallback

**Files:**
- Create: `src/scene/quality.ts`
- Create: `src/scene/quality.test.ts`
- Create: `src/components/world/WorldBoundary.tsx`
- Create: `src/components/world/WorldBoundary.test.tsx`

**Interfaces:**
- Produces: `detectWebGL(): boolean`; `selectSceneQuality(input): SceneQuality`; `WorldBoundary` with `children` and `fallback` props.
- Consumes: `SceneQuality` from Task 2.

- [ ] **Step 1: Write quality-selection tests**

Cover these exact cases:

```ts
expect(selectSceneQuality({ webgl: false, reducedMotion: false, coarsePointer: false, width: 1440, dpr: 1 })).toBe('fallback')
expect(selectSceneQuality({ webgl: true, reducedMotion: true, coarsePointer: false, width: 1440, dpr: 1 })).toBe('fallback')
expect(selectSceneQuality({ webgl: true, reducedMotion: false, coarsePointer: true, width: 390, dpr: 3 })).toBe('low')
expect(selectSceneQuality({ webgl: true, reducedMotion: false, coarsePointer: false, width: 1024, dpr: 2 })).toBe('balanced')
expect(selectSceneQuality({ webgl: true, reducedMotion: false, coarsePointer: false, width: 1440, dpr: 1 })).toBe('high')
```

- [ ] **Step 2: Run and observe the missing-module failure**

Run: `npm test -- src/scene/quality.test.ts`

Expected: FAIL because `quality.ts` does not exist.

- [ ] **Step 3: Implement deterministic quality rules**

`selectSceneQuality` must return fallback first for missing WebGL or reduced motion, low for coarse pointer or width below `768`, balanced for width below `1200` or DPR above `1.5`, otherwise high. `detectWebGL` creates a temporary canvas and checks `webgl2`, then `webgl`, inside `try/catch`.

- [ ] **Step 4: Test the render-error boundary**

Create a component that throws during render and verify:

```tsx
render(
  <WorldBoundary fallback={<div data-testid="fallback" />}>
    <BrokenWorld />
  </WorldBoundary>,
)
expect(screen.getByTestId('fallback')).toBeInTheDocument()
```

The boundary must also accept an optional `onError(error)` callback for diagnostics without exposing an error screen to users.

- [ ] **Step 5: Run the focused tests and build**

Run: `npm test -- src/scene/quality.test.ts src/components/world/WorldBoundary.test.tsx`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 6: Commit capability handling**

```powershell
git add src/scene/quality.ts src/scene/quality.test.ts src/components/world/WorldBoundary.tsx src/components/world/WorldBoundary.test.tsx
git commit -m "feat: add adaptive 3d quality fallback"
```

---

### Task 4: Connect native document scroll to the scene director

**Files:**
- Create: `src/hooks/useSceneDirector.ts`
- Create: `src/hooks/useSceneDirector.test.tsx`
- Modify: `src/layouts/homepage.layout.tsx`
- Modify: `src/components/homepageBanner/homepageBanner.tsx`
- Modify: `src/components/projects/projects.tsx`
- Modify: `src/components/experience/experience.tsx`
- Modify: `src/components/skills/skills.tsx`
- Modify: `src/components/contact/contact.tsx`

**Interfaces:**
- Produces: `useSceneDirector()`; section markers `data-scene="identity|projects|experience|skills|contact"`.
- Consumes: scene store from Task 2 and GSAP ScrollTrigger from Task 1.

- [ ] **Step 1: Mark each existing section**

Add the matching `data-scene` attribute to the existing section root without changing IDs or content. The hero marker is `identity`; the other four match their IDs except `work`, whose scene marker is `projects`.

- [ ] **Step 2: Write the lifecycle test**

Mock `gsap.registerPlugin` and `ScrollTrigger.create`. Render a harness inside `SceneProvider`, verify one trigger is created with `start: 'top top'` and `end: 'bottom bottom'`, call its `onUpdate({ progress: 0.5 })`, and assert the scene snapshot becomes `experience`. Unmount and verify `kill()` was called.

- [ ] **Step 3: Run the hook test and verify it fails**

Run: `npm test -- src/hooks/useSceneDirector.test.tsx`

Expected: FAIL because the hook is missing.

- [ ] **Step 4: Implement ScrollTrigger lifecycle**

Register `ScrollTrigger` once at module scope. In the hook, create one document-level trigger against `.homepage`; route `self.progress` to `store.setProgress`. Disable the trigger when reduced motion is enabled and set progress from the nearest section only for navigator state. Refresh after `document.fonts.ready`, and kill the trigger on cleanup.

- [ ] **Step 5: Wire section selection state**

In `Projects`, add an effect that calls `store.setActiveProject(active)`. In `Experience`, add an effect that calls `store.setActiveExperience(active)`. Do not move their existing state into the global store; the scene store mirrors selection for rendering only.

Call `useSceneDirector()` once from `Homepage` next to `useScrollReveal()`.

- [ ] **Step 6: Verify behavior**

Run: `npm test -- src/hooks/useSceneDirector.test.tsx src/scene/*.test.ts`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 7: Commit the director**

```powershell
git add src/hooks/useSceneDirector.ts src/hooks/useSceneDirector.test.tsx src/layouts/homepage.layout.tsx src/components/homepageBanner/homepageBanner.tsx src/components/projects/projects.tsx src/components/experience/experience.tsx src/components/skills/skills.tsx src/components/contact/contact.tsx
git commit -m "feat: direct orbital scenes from scroll"
```

---

### Task 5: Build the shared WebGL world and persistent data core

**Files:**
- Create: `src/components/world/WorldCanvas.tsx`
- Create: `src/components/world/SceneDirector.tsx`
- Create: `src/components/world/DataCore.tsx`
- Create: `src/styles/componentsScss/world.scss`
- Modify: `src/styles/componentsScss/_component.scss`
- Modify: `src/layouts/homepage.layout.tsx`
- Modify: `src/components/background/background.hompage.tsx`

**Interfaces:**
- Produces: lazy `WorldCanvas`; `SceneDirector`; `DataCore({ quality })`.
- Consumes: `SceneProvider`, quality selection, theme context, and store progress.

- [ ] **Step 1: Add the progressive-enhancement shell**

In `Homepage`, lazy-import `WorldCanvas`, compute quality once from current media queries, and render it before the header only when quality is not fallback:

```tsx
<WorldBoundary fallback={null}>
  <Suspense fallback={null}>
    {quality !== 'fallback' && <WorldCanvas quality={quality} />}
  </Suspense>
</WorldBoundary>
```

Keep `Background` mounted as the visual CSS fallback. Add `data-world="active"` to `.homepage` only after the canvas reports its first rendered frame, so CSS layers fade rather than disappear before WebGL is ready.

- [ ] **Step 2: Implement renderer constraints**

`WorldCanvas` must use one fixed decorative Canvas with:

```tsx
<Canvas
  aria-hidden="true"
  dpr={quality === 'high' ? [1, 1.75] : quality === 'balanced' ? [1, 1.35] : 1}
  camera={{ position: [0, 0, 8], fov: 42, near: 0.1, far: 120 }}
  gl={{ antialias: quality !== 'low', alpha: true, powerPreference: 'high-performance' }}
>
```

Use `PerformanceMonitor` to downgrade one tier when the measured factor falls below `0.45`. Pause the renderer through the canvas `frameloop` when `document.hidden`; resume and invalidate on visibility return.

- [ ] **Step 3: Implement camera interpolation**

`SceneDirector` reads `store.getState()` inside `useFrame`, computes the current chapter's camera waypoint, and damps camera position and look target. Define explicit waypoints for all five chapters in one readonly array. Do not allocate new vectors per frame; store temporary vectors in refs.

- [ ] **Step 4: Build the data core**

Compose the core from an icosahedron, two wireframe rings, and a low-count particle halo. Reuse geometries/materials through `useMemo`, vary particle count by quality (`900`, `450`, `160`), and dispose owned resources on unmount. Its scale, emissive intensity, and ring orientation interpolate from chapter-local progress.

- [ ] **Step 5: Replace duplicate ambience only after first frame**

Update `background.hompage.tsx` and `world.scss` so existing stars/hairlines fade to a low-opacity fallback when `[data-world='active']` is present. Preserve cursor, grain, spotlight, and light-theme blooms where they do not duplicate WebGL content.

- [ ] **Step 6: Verify the foundation manually and mechanically**

Run: `npm run build && npm run lint && npm test`

Expected: all commands PASS.

At `http://localhost:5173`, verify one canvas exists, DOM content appears before the canvas is ready, theme changes do not recreate the canvas, and disabling WebGL leaves the CSS background and all content visible.

- [ ] **Step 7: Commit the shared world**

```powershell
git add src/components/world src/styles/componentsScss/world.scss src/styles/componentsScss/_component.scss src/layouts/homepage.layout.tsx src/components/background/background.hompage.tsx
git commit -m "feat: add shared orbital webgl world"
```

---

### Task 6: Create Identity Core and Project Orbit

**Files:**
- Create: `src/components/world/scenes/IdentityScene.tsx`
- Create: `src/components/world/scenes/ProjectsScene.tsx`
- Modify: `src/components/world/WorldCanvas.tsx`
- Modify: `src/components/homepageBanner/homepageBanner.tsx`
- Modify: `src/components/projects/projects.tsx`
- Modify: `src/styles/componentsScss/homepageBanner.scss`
- Modify: `src/styles/componentsScss/projects.scss`
- Modify: `src/styles/componentsScss/dinoRunner.scss`

**Interfaces:**
- Produces: `IdentityScene({ progress, quality })`; `ProjectsScene({ progress, activeProject, projectCount, quality })`.
- Consumes: scene state, existing `PROJECTS`, existing hero/project interactions.

- [ ] **Step 1: Build IdentityScene with procedural layers**

Create three translucent planes, a portal ring, and sparse depth particles behind the hero. Drive their separation from identity local progress. Mirror progress to `--identity-progress` on the hero root so existing name glyphs use CSS `translate3d` and opacity without moving readable text out of DOM order.

- [ ] **Step 2: Build ProjectsScene from reusable orbital nodes**

Create one instanced orbit ring and one procedural node per project. Rotate the group from local progress and rotate the active node toward the camera from `activeProject`. Do not fetch or upload remote project screenshots as WebGL textures; existing DOM cards remain the readable gallery.

- [ ] **Step 3: Coordinate DOM cards with the scene**

Restyle the existing coverflow as translucent instrument panels aligned to the active orbital node. Keep every current arrow, drag, dot, keyboard, lazy-preview, and modal path unchanged. Use the mirrored store value only for scene lighting.

- [ ] **Step 4: Integrate Dino as an easter egg**

Position the existing Dino rail near the bottom edge of the Project Orbit hold phase. Reduce its default visual prominence; reveal full contrast on focus, hover, or active play. Do not change its controls or game logic.

- [ ] **Step 5: Verify both chapters**

Run: `npm run build && npm run lint && npm test`

Expected: PASS.

Manual checks: hero text remains selectable; scroll transition does not block anchor links; project keyboard navigation and modal focus behavior remain functional at desktop and 390px width.

- [ ] **Step 6: Commit the first two scenes**

```powershell
git add src/components/world/scenes/IdentityScene.tsx src/components/world/scenes/ProjectsScene.tsx src/components/world/WorldCanvas.tsx src/components/homepageBanner/homepageBanner.tsx src/components/projects/projects.tsx src/styles/componentsScss/homepageBanner.scss src/styles/componentsScss/projects.scss src/styles/componentsScss/dinoRunner.scss
git commit -m "feat: add identity and project orbital scenes"
```

---

### Task 7: Create Experience Timeline, Skills Constellation, and Contact Beacon

**Files:**
- Create: `src/components/world/scenes/ExperienceScene.tsx`
- Create: `src/components/world/scenes/SkillsScene.tsx`
- Create: `src/components/world/scenes/ContactScene.tsx`
- Modify: `src/components/world/WorldCanvas.tsx`
- Modify: `src/components/experience/experience.tsx`
- Modify: `src/components/skills/skills.tsx`
- Modify: `src/components/contact/contact.tsx`
- Modify: `src/styles/componentsScss/experience.scss`
- Modify: `src/styles/componentsScss/expSpiders.scss`
- Modify: `src/styles/componentsScss/skills.scss`
- Modify: `src/styles/componentsScss/skillsMario.scss`
- Modify: `src/styles/componentsScss/contact.scss`

**Interfaces:**
- Produces: three isolated scene components receiving only local progress, quality, and relevant active selection.
- Consumes: `EXPERIENCE`, `SKILLS`, scene store selections, existing tab and mini-game behavior.

- [ ] **Step 1: Build ExperienceScene**

Create a spline-like route from simple line segments and one marker per experience entry. Move a focused light between markers using `activeExperience`; fade route segments according to chapter progress. Mirror the visual ordering of `EXPERIENCE` without copying its text into WebGL.

- [ ] **Step 2: Restyle the experience DOM**

Keep the current vertical tab semantics and keyboard handler. Convert the rail and panel into spatial glass instruments with strong active focus, readable inactive states, and a stable panel height. Reduce `ExpSpiders` to a faint connective layer and restore contrast on pointer/focus interaction.

- [ ] **Step 3: Build SkillsScene**

Create four constellation groups matching the current skill group count. Use instanced points plus one shared line material; lower quality reduces nodes and omits secondary connector lines. Add `data-skill-group` to each existing group and mirror hovered/focused group index into the scene store through event handlers.

- [ ] **Step 4: Integrate Mario without changing gameplay**

Restyle `SkillsMario` as a data rail spanning constellation groups. Keep it quiet at rest and clearly interactive on focus/hover. Confirm touch controls remain at least 44px in both dimensions.

- [ ] **Step 5: Build ContactScene and stable portal interaction**

Create nested torus rings and a central light that settle at chapter progress `1`. Map email hover/focus to a boolean scene-store field `contactEngaged`; increase portal aperture and light intensity without changing the email link's size or position. Place social links in the DOM around the stable primary action.

- [ ] **Step 6: Verify the final chapters**

Run: `npm run build && npm run lint && npm test`

Expected: PASS.

Manual checks: experience tabs work with arrows/Home/End; skills and games work by keyboard and touch; email and social links remain clickable; motion visibly settles at the end.

- [ ] **Step 7: Commit the remaining scenes**

```powershell
git add src/components/world/scenes src/components/world/WorldCanvas.tsx src/components/experience/experience.tsx src/components/skills/skills.tsx src/components/contact/contact.tsx src/styles/componentsScss/experience.scss src/styles/componentsScss/expSpiders.scss src/styles/componentsScss/skills.scss src/styles/componentsScss/skillsMario.scss src/styles/componentsScss/contact.scss
git commit -m "feat: complete orbital portfolio chapters"
```

---

### Task 8: Add the mission navigator and complete the visual system

**Files:**
- Create: `src/components/missionNavigator/missionNavigator.tsx`
- Create: `src/components/missionNavigator/missionNavigator.test.tsx`
- Create: `src/styles/componentsScss/missionNavigator.scss`
- Modify: `src/components/header/header.tsx`
- Modify: `src/layouts/homepage.layout.tsx`
- Modify: `src/styles/_tokens.scss`
- Modify: `src/styles/_theme-light.scss`
- Modify: `src/styles/_base.scss`
- Modify: `src/styles/layoutsScss/hompage.layout.scss`
- Modify: `src/styles/componentsScss/header.scss`
- Modify: `src/styles/componentsScss/_component.scss`
- Modify: `index.html`

**Interfaces:**
- Produces: `MissionNavigator` with active chapter, progress indicator, section anchors, and localized labels.
- Consumes: scene snapshot, existing language/theme controls, existing section IDs.

- [ ] **Step 1: Write navigator tests**

Render the navigator in `SceneProvider`, set store progress to the project segment, and assert the Projects anchor has `aria-current="location"`. Click the Contact anchor and assert its `href` remains `#contact`. Verify all five chapter labels are represented and the progress meter has `aria-valuenow` from `0` to `100`.

- [ ] **Step 2: Implement the mission navigator**

Build a compact semantic `<nav>` with five anchors and a `<div role="progressbar">`. Reuse localized `t.sections` labels. Keep `ThemeSwitcher` and `LangSwitcher` in the header; on small screens the mission navigator becomes a bottom dock while the header retains brand and controls.

- [ ] **Step 3: Replace the token system**

Update named tokens to the approved values: Void `#05070D`, Carbon `#0B1020`, Plasma `#6EE7FF`, Spectral violet `#8B7CFF`, Ion white `#ECF7FF`, and Telemetry gray `#8391A7`. Add explicit surface, glow, focus, and grid tokens derived from these values. Update Solar Flare overrides without removing theme persistence.

- [ ] **Step 4: Apply the typography and global chapter rhythm**

Load a condensed display face, readable body sans, and compact mono utility face in `index.html`. Assign them to `--font-display`, `--font-ui`, and `--font-mono`. Set chapter minimum heights and stable hold zones at desktop, then reduce them at tablet/mobile. Keep DOM order and avoid `position: fixed` on readable section content.

- [ ] **Step 5: Remove obsolete decoration**

Review the page at all five hold states. Remove duplicate rules, bloom layers, or cursor effects that compete with the data core. Keep one grain layer, one spotlight system, and the scene itself as the dominant signature.

- [ ] **Step 6: Verify navigator and responsive layout**

Run: `npm test -- src/components/missionNavigator/missionNavigator.test.tsx`

Expected: PASS.

Run: `npm run build && npm run lint`

Expected: PASS.

Manual checks at `390x844`, `768x1024`, and `1440x900`: no horizontal overflow, controls stay reachable, active chapter is correct, and anchors land on readable content.

- [ ] **Step 7: Commit navigation and art direction**

```powershell
git add index.html src/components/missionNavigator src/components/header/header.tsx src/layouts/homepage.layout.tsx src/styles
git commit -m "feat: finish futuristic mission interface"
```

---

### Task 9: Verify accessibility, fallback, and runtime performance

**Files:**
- Create: `src/components/world/world.integration.test.tsx`
- Modify: any file from Tasks 2–8 only when verification exposes a defect.

**Interfaces:**
- Consumes: the complete redesign.
- Produces: verified production build with documented pass/fail evidence in the task handoff.

- [ ] **Step 1: Add fallback integration coverage**

Mock `detectWebGL` to return false, render the homepage, and assert that the name, Projects, Experience, Skills, email link, theme control, and language control remain present while no canvas is rendered.

- [ ] **Step 2: Add reduced-motion integration coverage**

Mock `matchMedia('(prefers-reduced-motion: reduce)')` to match. Assert no canvas renders, all `.reveal` content becomes visible, and mission anchors remain functional.

- [ ] **Step 3: Run the full automated suite**

Run:

```powershell
npm test
npm run lint
npm run build
```

Expected: every command exits `0`; no unhandled React act warnings or TypeScript errors.

- [ ] **Step 4: Perform keyboard and fallback checks**

In the browser, traverse the page using Tab, Shift+Tab, Enter, Space, arrow keys, Home, End, and Escape. Confirm visible focus, project modal focus containment/restoration, experience tab navigation, mini-game controls, theme/language controls, and all anchors. Disable WebGL and repeat the main navigation path.

- [ ] **Step 5: Perform motion and responsive checks**

Enable operating-system reduced motion and confirm there is no camera flight, particle travel, parallax, or continuous decorative animation. Check `390x844`, `768x1024`, and `1440x900`, including orientation change without scroll reset.

- [ ] **Step 6: Inspect runtime performance**

Use the browser performance panel for one full scroll. Confirm a single canvas, bounded DPR, no repeated layout reads inside the render loop, no growing animation callbacks after theme changes, and no severe long tasks during chapter transitions. Use balanced/low-tier adjustments if mobile cannot hold a stable interactive frame rate near 30 fps.

- [ ] **Step 7: Capture representative states**

Capture screenshots for the hero, each chapter hold state, Contact ending, mobile layout, Solar Flare theme, and CSS fallback. Compare hierarchy, contrast, overlap, and continuity; fix only defects against the approved spec.

- [ ] **Step 8: Commit final verification fixes**

```powershell
git add src
git commit -m "test: verify orbital portfolio experience"
```
