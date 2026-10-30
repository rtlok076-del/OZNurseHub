# Project Ward — The Lantern Crossing

M1 of Project Ward Design Doc v0.2. Separate static route `/nurse-rpg/`; existing Ward Shift is unchanged. Feature branch: `feature/project-ward-m1`. Not published. Clinical review pending.

Run `npm start` here and open http://127.0.0.1:5186/nurse-rpg/. Run `npm test` for quest/save/pathfinding checks. No build or backend required. Phaser 3.90.0 is vendored so play needs no CDN.

## First playtest

Read the introduction, visit Rowan, accept the quest, visit Bed 1, resolve the mismatch, read the real-world note, and return to Rowan for the debrief. Keyboard movement works when the map has focus; destination buttons also provide keyboard and touch navigation. Choices use buttons or 1–4. Save resumes an unfinished dialogue. Storage failure is nonfatal. Sound begins muted; M1 includes an original interaction chime, not background music.

Working names: Lumen, Lantern Ward, Sage Rowan, Wayfarer. Chapter uses story time without pressure. XP grants a level within Grad RN, not an immediate professional promotion. Energy does not impair input reliability.

## Content schema

`data/world.json` contains NPC IDs, labels, tile positions and reachable interaction tiles. `data/quests/identity.json` contains quest ID, title, XP, tip URL, real-world note and keyed dialogue nodes. Each node has speaker, text and choices (`label`, `next`, optional `correct`); optional evidence cards contain title and lines. A `complete` node awards XP once. Wrong choices have corrective branches. Add nodes in JSON and reference their keys from choices. A new quest also needs a deliberate trigger/progression registration in boot.js; arbitrary extra quests are not auto-discovered in M1.

`js/state.js` owns validated save loading, quest transitions and map routes. `js/world.js` owns Phaser tilemap, original procedural graphics, collision-aware walking and NPC proximity. `js/boot.js` owns accessible HTML UI, intro, dialogue, save and chime. No accounts, analytics or patient data.

## Clinical basis and review

Use at least three locally approved identifiers. This fictional case uses full name, date of birth and MRN; wristband/chart are carriers, not identifiers. Allergy checking is separate. No medicine is given in M1. Basis: [ACSQHC patient identification](https://www.safetyandquality.gov.au/national-standards/nsqhs-standards/communicating-safety-standard/further-information/patient-identification-and-procedure-matching). Ryan must review teaching wording before publication.

## Credits

Map, pixel sprites, UI and synthesised chime: original work for this prototype; no third-party art/audio packs. Phaser 3.90.0 © Phaser Studio Inc., MIT; see assets/PHASER-LICENSE.txt. System fonts only.

## Remaining draft milestones

- M1 gate: Ryan playtests arrival, movement, layout and first quest; revise from feedback before M2/M3.
- M2: ISBAR and deterioration quests, chapter-level progression and debrief, background music and SFX pack. Clinical review must resolve generic EWS design; do not discourage emergency escalation based only on a low score.
- M3: further art polish, full save and accessibility audit, credits, site nav card/sitemap and review PR. No auto-merge or production publish.

This prototype is not the full draft MVP. Manual assistive-technology and real-device playtesting remain necessary.
