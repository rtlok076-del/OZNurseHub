# Project Ward — The Lantern Crossing v0.2

Three connected chapters under `/nurse-rpg/`, built from Project Ward Design Doc v0.2. Ryan requested two more chapters before his combined playtest, overriding the original M1 gate. Existing Ward Shift files are unchanged. Draft PR #65; no merge or publication.

## Play

Run `npm start` here and open http://127.0.0.1:5186/nurse-rpg/. Follow Rowan’s briefing, visit the current patient, complete the quest and return to Rowan. Choose Begin chapter 2/3 in the debrief. The quests teach patient identification, ISBAR and recognition/escalation of deterioration. All characters and observations are fictional; clinical review remains pending.

Arrow keys/WASD move when the map is focused; Enter interacts. Destination buttons support touch and keyboard. Choices use buttons or 1–4. Reading has no time limit. Original ambient music begins muted, remembers the preference, requires a user gesture and suspends when the page is hidden.

## Progression and arts

Three lanterns light as chapters resolve. The atmosphere changes from arrival to echo bridge to storm watch. Main quests award 100, 120 and 150 XP. Levels are Wayfarer progression, not clinical qualifications.

Optional encounters: Bed 2 (Listening and brass compass), med room (Teamwork and observation kit), portal (Wayfinding and copper thread). Each gives 25 XP once. Chapter 2 awards a brass feather.

Choose Listener or Pathfinder before chapter 2. Listener grants the Listening action; Pathfinder grants the compass action. Side encounters can teach the other arts too. Use an art → Listening near a patient opens a bond conversation worth 10 XP once per patient. Wayfinding walks to the current objective. Teamwork offers Pip’s context-specific preparation reminder. Core nursing reminders remain available without grinding. The ending reflects your path and tracks optional exploration.

## Save and content

Browser storage only; no accounts, analytics or patient data. First-chapter saves migrate without losing completion. Storage failure is nonfatal. Restart in About requires confirmation. Chapter, dialogue node, rewards, encounters, path, bonds, position and mute persist.

Quest JSON contains id, title, xp, tip, note, keyed nodes, choices (label, next, optional correct), optional evidence and a complete terminal. Events JSON contains one-time choices, results and rewards. World JSON contains NPC positions/destinations. New chapters need registration in boot.js and reward mapping in state.js.

state.js owns state/rewards/routes; world.js the Phaser tilemap and procedural art; boot.js story/UI; audio.js the original score. Static hosting, no build/backend/runtime CDN. Phaser 3.90.0 is vendored.

## Verification and credits

Run `npm ci`, `npm start`, then separately `npm test` and `npm run test:browser`. Tests use installed Microsoft Edge via Playwright; screenshots go into ignored test-results/. See REVIEW.md for evidence and RPG rating.

Original procedural art, map, music and sound; no third-party art/audio packs. Phaser © Phaser Studio Inc., MIT (assets/PHASER-LICENSE.txt). System fonts only. Clinical sources are in quest JSON and REVIEW.md. Deterioration uses narrative urgency, not a validated scoring chart; emergency escalation never waits for a score.

Before publication: Ryan’s combined gameplay/clinical review, real-device and assistive-technology checks, and site navigation/sitemap placement. Do not auto-merge or publish.
