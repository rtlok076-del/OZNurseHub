# Ward Shift playtest 0.5

Routine tiles lift into a floating drag preview while neighbouring tiles animate into their new positions. Mouse, pen and touch dragging retain keyboard arrows, Home and End as alternatives; reduced motion is respected.

Click the ward floor to walk, a patient to approach and interact, Jess for assistance, or the emergency trolley. The Equipment action also provides access on small screens. During Margaret's emergency, activate MER and confirm bedside cover before collecting the trolley and bringing it to her bedside. Delivery does not complete assessment, response or follow-up tasks.

Each fictional patient has an illustrated portrait and scripted speech. Observations appear on a bedside monitor. Players plot six measurements into adult RDR-style bands, with distinct systolic/diastolic marks and a previous-reading column. Incorrect placements cannot be signed. Exact measured readings and plotted bands are retained in the record. The compact source monitor stays visible while plotting.

This is an adapted six-measurement practice exercise, not the complete approved SA Health chart or a clinical scoring system. Oxygen delivery, pain and sedation are outside this plotting exercise. Clinical review remains pending. Reference: SA Health adult MR59A, November 2020, linked inside the chart. Asking for urgent help is always available and never depends on finishing documentation or retrieving equipment.

The supplied OzNurseHub JPG is unchanged. Scripted conversation only. Existing routine planning, delayed patient events, 30 tasks and documentation requirements remain. Save schema 5 requires a fresh shift for older playtest saves; old saves are retained until the player chooses to start anew. Versioned runtime v0.5.0 and service-worker cache v79; previous runtime files remain available for existing tabs.

Validation: 18 automated engine, plotting and navigation checks; service-worker runtime and legacy redirect checks. Browser checks cover drag reorder, floor/bed walking, portrait and monitor, signing all six chart marks, timed call bell, MER/cover, trolley collection and bedside delivery. Responsive layouts checked at 390x844 and 320x568 with no page overflow. Physical-device touch testing and learner/clinical review remain outstanding.

Scope: game runtime, game tests/documentation, and shared service-worker precache/version only. Other site pages are unchanged.

Rollback: revert the release and increment the service-worker cache identifier. Previous release: f1cd05667f11ba3f3aabb108604aa006942c3f19.
