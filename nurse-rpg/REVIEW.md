# M1 review record

Built against Project Ward Design Doc v0.2, read 30 October 2026. This is the first playtest gate, not the completed three-quest MVP.

## Verified

- Automated Node checks: every quest branch can reach completion; corrective feedback route; one-time XP reward; save validation; reachable collision-free routes between all destinations.
- Headless Edge browser: arrival sequence, walking to Rowan and Sam, accepting quest, unsafe-choice recovery, evidence cards, mid-quest reload, quest completion, real-world note, returning to Rowan, debrief, persistent XP, About dialog.
- Desktop 1440px and phone-width 390px screenshots inspected. No horizontal overflow at 390px; sidebar panels collapse. No browser page errors during the tested route.
- All runtime scripts, JSON, styles and engine are served locally. No CDN needed to play. Phaser licence included. No third-party artwork or music.

Reproduce: `npm ci`, `npm start`, then in another terminal `npm test` and `node tests/browser.mjs`. Browser test uses installed Microsoft Edge through Playwright. Screenshots go into ignored `test-results/`.

## Needs Ryan’s playtest / clinical review

Does the arrival feel like being transported into another world? Is the ward enjoyable to explore? Is the first quest understandable on a phone? Review the identity/allergy wording and supportive feedback. Confirm or change temporary world and character names.

M2 and M3 remain: two more quests, expanded progression, background music, further art polish, full assistive-technology and touch-device audit, site navigation and sitemap entry. Clinical review remains a publication gate. No merge or publication performed.
