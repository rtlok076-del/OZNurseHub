# Light and dark mode review — 12 October 2026

Reviewed current main `34836b67fb45dae60426dbfcf29be818372837ba` (PR #28, restored Med Squad Survivor). The restoration supersedes the older handover's removal instruction. Changes are local on `fix/sitewide-theme-review`; no live deployment has been performed.

## Fixes

- Escalation feedback, observation notes, neutral results, hover states and warning text use matching theme colours. Clinical zone badges retain their semantic colours instead of being overwritten by a broad span selector.
- Both quizzes use themed question/result surfaces, answer colours and buttons; the viewport background also follows appearance.
- Legacy footers, ANTT descriptions, palliative self-care content, calculator errors and tables, medication empty states, and checklist indicators have readable foreground/background pairs.
- Feedback's intro no longer uses a text-colour token as a gradient background.
- WardWise panels, choices, hints and feedback follow the shared palette in both modes.
- Survivor now loads the shared theme controller and provides an Appearance control. Menus, HUD and modal surfaces use the selected theme, including saved, system and cross-tab preferences. Its original bundled game JavaScript is unchanged; rendered arena artwork is preserved. Small-screen menu sizing and scrolling prevent heading clipping.
- Service-worker cache advanced to `oznurse-v50-sitewide-themes`. The restored game's existing online-only cache exclusion is preserved.

## Verified locally

- All 28 top-level content pages: light → dark → light at 390px and 1440px; no horizontal page overflow, browser errors or detected text contrast failures. Dormant reference sections inspected separately.
- Survivor: menu and live HUD at both sizes and themes; result template inspected; saved preference, OS changes and cross-page/cross-tab updates pass.
- Clinical and medication quiz questions, answers and results; learning-card reveals/answers; saved/edited skills records; calculator errors/results; WardWise rounds; checked cognitive checklist.
- Every escalation scenario step, including zone badge colours and unchanged light surfaces.
- Theme persistence, restricted storage, print restoration and unchanged image filters.
- Daily appearance hint and app manifest, simulated standalone mode, install cancellation and real offline reference navigation.
- Reviewed mobile and desktop screenshot contact sheets and full-size Survivor views. `git diff --check` passes.

Automated contrast checks cover text on solid and composited translucent surfaces. They do not certify gradients, images, canvas artwork, all possible user inputs or clinical content. Survivor testing starts gameplay and inspects its result template; it does not run a complete five-minute session.

See `tests/README.md` for repeatable checks. Generated reports/screenshots remain local and are ignored by Git.

## Follow-up: Year Tips and observation charts

The initial review missed fixed backgrounds in the Resources accordion and SVG chart internals. These are now corrected: Year Tips panels/callouts, observation-value pills, neutral chart rows, headers, labels, plotted points/lines and clinical zone fills all respond to appearance changes. The yellow/red/purple zone meanings and purple hatch are preserved. `tests/tips-chart-theme.cjs` passes all scenario steps in light/dark at 390px and 1440px and checks the Resources accordion surfaces. These fixes remain local and unpublished.
