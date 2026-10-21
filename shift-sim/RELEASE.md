# Ward Shift playtest 0.4

Six draggable routine-round tiles replace the 28-item planner: observations, medication checks, pressure care, fluids and updates, notes, and a covered break. Pointer dragging supports mouse/pen/touch with keyboard arrows, Home and End as alternatives. Suggested order is available. Chosen windows control routine release times; prerequisites and clinical follow-up remain enforced.

Initial handover describes only known circumstances. Each completed observation assessment schedules that patient's scripted concern 15–20 simulated minutes later. A saved seed makes timing variable between shifts and stable on resume. Care and reassessment tasks stay hidden until they arise. Large time advances process newly scheduled events in sequence; new concerns interrupt routine work with remaining time retained and no duplicate energy charge. Delegated observations trigger the timer after RN review.

The ward is a fixed-height workspace with a separately scrollable care list and always-visible patient selection and action dock. Patient panels use a sticky return/help/pause strip; mobile dialogs open as bottom sheets. Small screens collapse the map. The supplied OzNurseHub JPG is used unchanged in the header, replacing the placeholder cross.

30 tasks and 72 energy points in the full reference shift, including two pressure-care tasks. Scripted dialogue only. Clinical review pending; no drug administration simulated. Pressure care follows the individual plan rather than prescribing a universal turning interval. Background reference: https://www.safetyandquality.gov.au/sites/default/files/2020-10/fact_sheet_-_preventing_pressure_injuries_and_wound_management_oct_2020.pdf

Save schema 4: older playtest saves are retained until the player chooses a new shift, but cannot resume into the changed event structure. Runtime assets are versioned together; service-worker cache v78. Prior v0.3 assets remain for existing tabs.

Validation: 13 engine tests, service-worker runtime and legacy redirect checks; browser drag and keyboard reorder; 390x844 and 320x568 layouts without page overflow, desktop 1280x800, light/dark appearance, identity and baseline observations, hidden future tasks, call bell at 13:24 after observations at 13:07, save/resume paused. Physical-device touch testing remains a learner playtest check.

Rollback: revert this release and increment the service-worker cache identifier again. Previous release: 9a6ace8a9027da129e9fa4c5b538e33721c1734c.
