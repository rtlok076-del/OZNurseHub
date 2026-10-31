import {
  KEY,
  fresh,
  restore,
  choose,
  advanceChapter,
  resolveEvent,
} from "./state.js";
import { createAudio } from "./audio.js";
import { createWorld } from "./world.js";
const $ = (id) => document.getElementById(id);
let state;
try {
  state = restore(localStorage.getItem(KEY));
} catch {
  state = fresh();
}
let quests,
  events,
  quest,
  world,
  scene,
  nearby,
  busy = false;
const disclaimer =
  "Educational game only. The world, patients and hospital are fictional. Not clinical advice. Always follow your local policies, procedures and escalation criteria, and seek senior advice. In an emergency, follow your workplace’s emergency response system.";
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    $("save-status").textContent = "Journey saved on this device.";
  } catch {
    $("save-status").textContent =
      "Saving unavailable. This journey lasts until you close the page.";
  }
}
function button(label, fn, primary = false) {
  const b = document.createElement("button");
  b.textContent = label;
  b.setAttribute("aria-label", label);
  b.classList.toggle("primary", primary);
  b.onclick = fn;
  return b;
}
const sound = createAudio();
sound.setMuted(state.muted);
function tone() {
  sound.setMuted(state.muted);
  sound.chime();
}
const chapterInfo = [
  {
    title: "The names we carry",
    target: "sam",
    place: "Bed 1 · Sam",
    hook: "Two names, one misplaced chart. Restore the first lantern by seeing the person behind the label.",
    ending:
      "Sam’s lantern is lit. A bell answers from the southern rooms. The bridge courier has a message that cannot wait.",
  },
  {
    title: "Across the echo bridge",
    target: "rest",
    place: "Bed 3 · Mira",
    hook: "The brass messenger bird cannot carry a muddled message. Mira, a courier from the bridge, needs a clear call for review. Let your words become a path through the static.",
    ending:
      "The messenger bird carries your message. The court clinician arrives, and Mira’s lantern joins Sam’s. Outside, a storm gathers around the last dark window.",
  },
  {
    title: "When the lanterns falter",
    target: "tavi",
    place: "Bed 4 · Tavi",
    hook: "A storm shakes the ward. Tavi, the lantern keeper, says something is wrong. Listen, recognise change, and summon help; no prophecy matters more than the person in front of you.",
    ending:
      "Help reaches Tavi. The three lanterns answer one another, and the bridge beyond the windows shines again. You did not save the ward alone. You helped it work together.",
  },
];
const arts = [
  [
    "identity",
    "Patient identification",
    "Compare full name, date of birth and MRN against the correct records. Ask the patient to state details. An allergy check is separate.",
  ],
  [
    "isbar",
    "Clear communication",
    "Identify yourself and the patient; explain the situation, relevant background and your assessment; state a clear recommendation. Confirm the response and what to do if things change.",
  ],
  [
    "deterioration",
    "Early recognition",
    "Listen to concern, assess and recognise trends. Seek help early. Emergency escalation must not wait for a complete assessment or a score. Follow local response criteria.",
  ],
  [
    "listening",
    "Listening",
    "Patient perspective: Sam wants to be remembered. Mira worries about the brass bird her sister gave her. Tavi fears letting the ward down. Ask what matters to them as well as what is wrong.",
  ],
  [
    "supplies",
    "Teamwork",
    "Ask a colleague for a specific task within their role, confirm they understand, and agree when they will report back. Keep responsibility for checking the outcome.",
  ],
  [
    "runes",
    "Wayfinding",
    "The station is north-east; Sam north-west; Mira south-west; Tavi south-middle. The crossing is between the southern rooms. Use destination buttons for a clear path.",
  ],
];
function unlocked(id) {
  return state.completedQuests.includes(id) || Boolean(state.events[id]);
}
function artBook(id) {
  const art = arts.find((a) => a[0] === id),
    actions = [];
  const available =
    unlocked(id) ||
    (id === "listening" && state.affinity === "Listener") ||
    (id === "runes" && state.affinity === "Pathfinder");
  if (
    id === "listening" &&
    available &&
    ["sam", "other", "rest", "tavi"].includes(nearby?.id)
  )
    actions.push(
      button(
        "Listen to " + nearby.name,
        () => {
          const memories = {
            sam: "“When I get home, I’m going to leave a lantern in my window for late travellers. Someone did that for me tonight.” Sam smiles. You write down his promise.",
            other:
              "“Elin used to count the lights from our window. When the bridge opens, tell her I kept counting too.” You let the silence hold his words.",
            rest: "“My sister made this bird because I always forgot to write home. I’m scared she’ll hear that I fell before she hears I’m safe.” You ask Rowan to help Mira contact her sister.",
            tavi: "“I thought if I stopped working, the ward would go dark. It turns out other people know how to carry a lantern.” You remind Tavi that receiving care is not a failure.",
          };
          const first = !state.bonds.includes(nearby.id);
          if (first) {
            state.bonds.push(nearby.id);
            state.xp += 10;
            save();
            refresh();
          }
          modal(
            "A voice remembered",
            `<p>${memories[nearby.id]}</p><p class="note">${first ? "A new bond · +10 XP" : "You remember this conversation."}</p>`,
            [button("Return to your task", close, true)],
            "LISTENING ART",
          );
        },
        true,
      ),
    );
  if (id === "runes" && available && !busy)
    actions.push(
      button(
        "Follow the compass to your objective",
        () => {
          close();
          const target =
            !state.metGuide || state.completed
              ? "rowan"
              : chapterInfo[state.chapter - 1].target;
          const npc = world.npcs.find((n) => n.id === target);
          scene.walk(npc.stand, npc.id);
        },
        true,
      ),
    );
  if (id === "supplies" && available)
    actions.push(
      button("Ask Pip for a team check", () =>
        modal(
          "Pip checks back",
          `<p>${state.chapter === 1 ? "“The preparation chart is ready for comparison. I’ll wait for your check before anything proceeds.”" : state.chapter === 2 ? "“Rowan is staying with Mira. The ISBAR card is here. I’ll confirm the receiver heard your recommendation.”" : "“I’ll call for the response team and bring the observation equipment. You stay with Tavi. I’ll report back as soon as help is on the way.”"}</p><p class="small">A teamwork reminder. Continue the quest to make and confirm the actual escalation.</p>`,
          [button("Return to your task", close, true)],
          "TEAMWORK ART",
        ),
      ),
    );
  actions.push(button("Back to the ward", close, !actions.length));
  modal(
    art[1],
    `<p>${art[2]}</p><p class="small">${available ? "This art is ready to use." : id === "listening" ? "Learn this art at Bed 2, or choose the Listener path." : id === "runes" ? "Learn this art at the portal, or choose the Pathfinder path." : id === "supplies" ? "Help Pip in the med room to learn this art." : "This practice reminder is always available."}</p>`,
    actions,
    "FIELD GUIDE · " + (unlocked(id) ? "MASTERED ART" : "PRACTICE ART"),
  );
}
function fieldGuide() {
  modal(
    "The arts you carry",
    "<p>Use a reminder whenever you need it. Care is never locked behind XP. Master arts through quests and optional ward encounters.</p>",
    [
      ...arts.map((a) =>
        button((unlocked(a[0]) ? "✦ " : "◇ ") + a[1], () => artBook(a[0])),
      ),
      button("Back to the ward", close),
    ],
    "YOUR FIELD GUIDE",
  );
}
function modal(title, html, actions, label = "THE LANTERN CROSSING") {
  $("overlay-title").textContent = title;
  $("overlay-label").textContent = label;
  $("overlay-content").innerHTML = html;
  $("overlay-actions").replaceChildren(...actions);
  if (!$("overlay").open) $("overlay").showModal();
  actions[0]?.focus({ preventScroll: true });
}
function close() {
  $("overlay").close();
}
function story(speaker, text, choices = [], tag = "STORY") {
  $("speaker").textContent = speaker;
  $("dialogue-tag").textContent = tag;
  $("story").replaceChildren();
  const p = document.createElement("p");
  p.textContent = text;
  $("story").append(p);
  $("choices").replaceChildren(
    ...choices.map(([label, fn], i) => {
      const b = button(label, fn);
      b.dataset.key = i + 1;
      return b;
    }),
  );
}
function refresh() {
  const info = chapterInfo[state.chapter - 1];
  $("xp").textContent = `${state.xp} XP earned`;
  $("xpbar").max = 100;
  $("xpbar").value = state.xp % 100;
  $("rank").textContent =
    `${state.affinity || "Wayfarer"} · Level ${1 + Math.floor(state.xp / 100)}`;
  $("chapter-chip").innerHTML =
    `CHAPTER 0${state.chapter} <b>${info.title}</b>`;
  $("chapter-time").textContent = ["19:00", "21:00", "23:00"][
    state.chapter - 1
  ];
  $("mute").textContent = state.muted ? "Sound: off" : "Sound: on";
  $("mute").setAttribute("aria-pressed", String(state.muted));
  $("quest-state").textContent = state.completed
    ? "LANTERN RESTORED"
    : state.metGuide
      ? "ACTIVE QUEST"
      : "CHAPTER " + state.chapter;
  $("quest-title").textContent = info.title;
  $("objective").textContent = state.completed
    ? "Return to Rowan at the station."
    : state.metGuide
      ? "Visit " + info.place + " · " + info.hook
      : "Meet Rowan at the station for your next chapter.";
  $("skill-list").replaceChildren(
    ...arts.map((a) => {
      const b = button((unlocked(a[0]) ? "✦ " : "◇ ") + a[1], () =>
        artBook(a[0]),
      );
      b.className = "art-button " + (unlocked(a[0]) ? "mastered" : "");
      b.title = unlocked(a[0])
        ? "Mastered — open field guide"
        : "Open practice reminder";
      return b;
    }),
  );
  const items = [
    "Stethoscope",
    "Name badge",
    "ISBAR pocket card",
    ...(state.events.listening ? ["Brass compass"] : []),
    ...(state.events.supplies ? ["Observation kit"] : []),
    ...(state.events.runes ? ["Copper thread"] : []),
    ...(state.completedQuests.includes("isbar") ? ["Brass feather"] : []),
  ];
  $("inventory").replaceChildren(
    ...items.map((x) => {
      const li = document.createElement("li");
      li.textContent = x;
      return li;
    }),
  );
  $("journal-note").innerHTML =
    `<p class="small">Lanterns restored: ${state.completedQuests.length} / 3<br>Ward encounters: ${Object.keys(state.events).length} / 3<br>Patient bonds: ${state.bonds.length} / 4</p>`;
  document.body.dataset.chapter = state.chapter;
}
function intro() {
  const parts = [
    [
      "A shift like any other",
      "The clock reads 19:00. Your shoes squeak against the corridor floor. Somewhere behind you, a call bell rings twice. Then the fluorescent lights fold into a single golden thread.",
    ],
    [
      "Somewhere beyond the familiar",
      "You reach for the handrail. Your fingers meet warm stone. Beyond the window are two moons, and a bridge lined with lanterns. Your badge still says “RN”. At least that part makes sense.",
    ],
    [
      "The lanterns are going out",
      "A silver-haired nurse looks up from a wooden desk. “Another traveller? Good. We’re short a pair of listening ears.” A sign reads LANTERN WARD. Your stethoscope is still in your pocket.",
    ],
  ];
  if (state.intro >= parts.length) {
    close();
    $("world").focus({ preventScroll: true });
    story(
      "Your first steps",
      "Find Sage Rowan at the nurses’ station. Walk with arrow keys or WASD while the map is focused, or tap a destination below the map. Enter interacts with someone nearby.",
    );
    return;
  }
  const [title, text] = parts[state.intro];
  modal(
    title,
    `<p>${text}</p><p class="small muted">${state.intro + 1} / 3 · Arrival</p>`,
    [
      button(
        state.intro === 2 ? "Step into Lantern Ward" : "Follow the light",
        () => {
          state.intro++;
          save();
          intro();
        },
        true,
      ),
    ],
  );
}
function launch() {
  modal(
    "Before you cross",
    `<p>${disclaimer}</p><p class="small">Three chapters, three optional ward encounters, about 20–30 minutes. Your progress is saved in this browser. All characters are fictional. Clinical content is pending Ryan’s review.</p>`,
    [
      button(
        "Begin the journey",
        () => {
          state.accepted = true;
          save();
          intro();
        },
        true,
      ),
    ],
    "WELCOME, WAYFARER",
  );
}
function revealDialogue() {
  requestAnimationFrame(() => {
    const panel = document.querySelector(".dialogue");
    const rect = panel.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > innerHeight)
      panel.scrollIntoView({ block: "start", behavior: "instant" });
    $("choices").querySelector("button")?.focus({ preventScroll: true });
  });
}
function node() {
  busy = true;
  revealDialogue();
  refresh();
  const n = quest.nodes[state.node];
  if (!n) {
    state.node = "start";
    return node();
  }
  story(
    n.speaker,
    n.text,
    n.choices.map((c, i) => [
      c.label,
      () => {
        choose(state, quest, i);
        save();
        tone();
        node();
      },
    ]),
    quest.title.toUpperCase(),
  );
  if (n.evidence) {
    const box = document.createElement("div");
    box.className = "evidence";
    for (const item of n.evidence) {
      const card = document.createElement("div"),
        title = document.createElement("b");
      title.textContent = item.title;
      card.append(title);
      for (const line of item.lines) {
        const row = document.createElement("div");
        row.style.border = "0";
        row.style.padding = "2px 0";
        row.textContent = line;
        card.append(row);
      }
      box.append(card);
    }
    $("story").append(box);
  }
  if (n.complete) {
    const note = document.createElement("p");
    note.className = "note";
    const b = document.createElement("b");
    b.textContent = `REAL WORLD NOTE · +${quest.xp} XP`;
    note.append(b, document.createElement("br"), quest.note);
    const a = document.createElement("a");
    a.href = quest.tip;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = "Read the real-world tip ↗";
    note.append(document.createElement("br"), a);
    $("story").append(note);
    $("choices").append(
      button(
        "Return to the ward",
        () => {
          busy = false;
          story(
            "A lantern rekindled",
            chapterInfo[state.chapter - 1].ending +
              " Return to Rowan when ready.",
          );
          refresh();
          position(nearby);
        },
        true,
      ),
    );
  }
  $("interact").disabled = true;
  $("target").textContent = "Finish the conversation below the map.";
}
function encounter(id) {
  const event = events[id];
  if (state.events[id]) {
    story(
      event.speaker,
      event.choices.find((c) => c.value === state.events[id])?.result ||
        event.text,
      [],
      "WARD MEMORY",
    );
    revealDialogue();
    return;
  }
  busy = true;
  story(
    event.speaker,
    event.text,
    event.choices.map((c) => [
      c.label,
      () => {
        resolveEvent(state, id, c.value);
        save();
        refresh();
        tone();
        story(
          event.speaker,
          c.result,
          [
            [
              "Continue exploring",
              () => {
                busy = false;
                story("A small act, remembered", event.reward);
                position(nearby);
                $("world").focus({ preventScroll: true });
              },
            ],
          ],
          event.reward,
        );
        revealDialogue();
      },
    ]),
    "OPTIONAL ENCOUNTER · " + event.title,
  );
  revealDialogue();
  $("interact").disabled = true;
}
function choosePath() {
  modal(
    "What will you carry forward?",
    "<p>Rowan places two small emblems on the desk. “The crossing gives no one a title. Choose the promise you want to keep.” Your path changes your story reflections; every clinical action remains available.</p>",
    [
      button(
        "Listener · no voice forgotten",
        () => {
          state.affinity = "Listener";
          save();
          refresh();
          close();
          interact("rowan");
        },
        true,
      ),
      button("Pathfinder · make a way together", () => {
        state.affinity = "Pathfinder";
        save();
        refresh();
        close();
        interact("rowan");
      }),
    ],
    "YOUR WAYFARER PATH",
  );
}
function interact(id = nearby?.id) {
  if (busy || $("overlay").open) return;
  const info = chapterInfo[state.chapter - 1];
  if (id === "rowan") {
    if (state.completed) {
      debrief();
      return;
    }
    if (state.chapter > 1 && !state.affinity) {
      choosePath();
      return;
    }
    if (!state.metGuide) {
      busy = true;
      story(
        "Sage Rowan",
        info.hook,
        [
          [
            "Accept · " + info.title,
            () => {
              state.metGuide = true;
              busy = false;
              save();
              refresh();
              story(
                "Sage Rowan",
                "Find " +
                  info.place +
                  ". " +
                  (state.chapter === 1
                    ? "Introduce yourself, listen, and compare the identifiers."
                    : state.chapter === 2
                      ? "The messenger repeats only what we give it. Make the message clear."
                      : "The storm is scenery. Tavi’s changing condition is the priority."),
              );
              position(nearby);
            },
          ],
        ],
        "CHAPTER " + state.chapter + " · A NEW QUEST",
      );
      revealDialogue();
      $("interact").disabled = true;
    } else {
      story(
        "Sage Rowan",
        info.hook + " Your next destination is " + info.place + ".",
      );
      revealDialogue();
    }
  } else if (id === info.target) {
    if (!state.metGuide) {
      story("Lantern Ward", "Rowan is waiting at the station to brief you.");
      revealDialogue();
    } else if (state.completed) {
      story(
        "A lantern restored",
        info.ending + " Rowan has your chapter debrief.",
      );
      revealDialogue();
    } else {
      state.node ||= "start";
      save();
      node();
    }
  } else if (id === "other") encounter("listening");
  else if (id === "stores") encounter("supplies");
  else if (id === "crossing") encounter("runes");
  else if (id === "sam") {
    story(
      "Sam Okafor",
      state.completedQuests.includes("identity")
        ? "“The lantern is holding. I heard you in the other rooms. You’re finding your place here.”"
        : "“Rowan will explain. I’m glad someone came through the crossing tonight.”",
    );
    revealDialogue();
  } else if (id === "rest") {
    story(
      "Mira",
      state.completedQuests.includes("isbar")
        ? "“The clinician heard us. My sister’s bird can rest while I recover. Thank you for not letting my voice disappear.”"
        : "A courier rests with a folded letter in her hand. Rowan asks you to finish your current task before a new briefing.",
    );
    revealDialogue();
  } else if (id === "tavi") {
    story(
      "Tavi",
      "“I light every lantern before the night watch. Someone has to make sure people can see each other.” Tavi folds a worn map of the bridge.",
    );
    revealDialogue();
  } else
    story(
      "Lantern Ward",
      "Choose a destination, or walk closer and press Enter. Optional encounters wait at Bed 2, the med room and the portal.",
    );
}
function debrief() {
  const info = chapterInfo[state.chapter - 1],
    final = state.chapter === 3;
  const reflection =
    state.affinity === "Listener"
      ? "You promised no voice would be forgotten. Sam, Mira and Tavi each helped you keep that promise."
      : "You made a way through confusion by asking for help and making the next step clear.";
  modal(
    final
      ? "The bridge of three lights"
      : state.chapter === 1
        ? "Your first light"
        : "A voice reaches the other side",
    `<p>${info.ending}</p><div class="note"><b>Chapter ${state.chapter} complete · ${state.xp} total XP</b><p>${state.chapter === 1 ? "Safety: the mismatched record was resolved." : state.chapter === 2 ? "Communication: you made a structured call and confirmed the response." : "Recognition: you acted on concern and changing observations, called for help and reassessed."}</p></div><p>${state.chapterMistakes[quest.id] || 0} choices needed coaching in this chapter. This is learning feedback, not a competence assessment.</p>${final ? `<p>${reflection}</p><p>The portal opens onto your old corridor. Behind you, Rowan asks, “Will you come back?” You leave your badge facing the light. Some doors are worth keeping open.</p><p>Lanterns: 3 / 3 · Optional encounters: ${Object.keys(state.events).length} / 3. You can keep exploring to finish the ward stories.</p>` : "<p>Take a breath, explore the ward, or continue straight into the next chapter.</p>"}`,
    [
      ...(final
        ? []
        : [
            button(
              "Begin chapter " + (state.chapter + 1),
              () => {
                advanceChapter(state);
                quest = quests[state.chapter - 1];
                save();
                refresh();
                close();
                story("The ward changes", chapterInfo[state.chapter - 1].hook);
                interact("rowan");
              },
              true,
            ),
          ]),
      button(
        final ? "Stay in Lumen" : "Explore before continuing",
        close,
        final,
      ),
      button("Read the real-world tip", () =>
        window.open(quest.tip, "_blank", "noopener"),
      ),
    ],
    final ? "ACT I · COMPLETE" : "CHAPTER 0" + state.chapter + " · COMPLETE",
  );
}
function position(n) {
  nearby = n;
  $("location").textContent = n
    ? n.label
    : "Lantern corridor · explore at your pace";
  $("target").textContent = n
    ? `Nearby · ${n.name}`
    : "Walk to a person or place to interact.";
  $("interact").textContent = n ? `Talk / inspect · ${n.name}` : "Look around";
  $("interact").disabled = busy;
  $("map-marker").style.left = `${(state.position.x / 24) * 90 + 2}%`;
  $("map-marker").style.top = `${(state.position.y / 16) * 80 + 5}%`;
  save();
}
$("interact").onclick = () => interact();
$("mute").onclick = () => {
  state.muted = !state.muted;
  save();
  refresh();
  sound.setMuted(state.muted);
  tone();
};
$("pause").onclick = () =>
  modal(
    "A moment to breathe",
    "<p>Your journey is paused. The ward will wait for you.</p>",
    [button("Resume journey", close, true)],
  );
$("about").onclick = () =>
  modal(
    "About Project Ward",
    `<p>A small nursing adventure by OzNurseHub. Three-chapter adventure, v0.2.0.</p><p>${disclaimer}</p><p>Art: original procedural pixel tiles and characters created for this prototype. Sound: original synthesised ambient score and interaction chimes. Engine: Phaser 3.90.0, MIT licence.</p><p>Teaching foundations: NSQHS Communicating for Safety (Standard 6) and Recognising and Responding to Acute Deterioration (Standard 8). The game uses full name, date of birth and medical record number as its three identifiers. Names and locations are fictional.</p><p><a href="https://www.safetyandquality.gov.au/national-standards/nsqhs-standards/communicating-safety-standard/further-information/patient-identification-and-procedure-matching" target="_blank" rel="noopener">Patient identification and procedure matching ↗</a></p>`,
    [
      button("Back to the ward", close, true),
      button("Restart journey", () =>
        modal(
          "Start again?",
          "<p>This clears only your Project Ward progress on this browser.</p>",
          [
            button("Keep my journey", close, true),
            button("Restart from the crossing", () => {
              state = fresh();
              save();
              location.reload();
            }),
          ],
        ),
      ),
    ],
  );
$("field-guide").onclick = fieldGuide;
$("journal").onclick = () =>
  modal(
    "Your quest journal",
    `<p>${$("objective").textContent}</p><ol>${chapterInfo.map((c, i) => `<li>${c.title} — ${state.completedQuests.includes(["identity", "isbar", "deterioration"][i]) ? "complete" : i + 1 === state.chapter ? "current" : "ahead"}</li>`).join("")}</ol><p>Optional: talk to Sam Okoro in Bed 2, help Pip in the med room, and investigate the portal. Each encounter unlocks an art and a keepsake.</p><p>${state.completed ? quest.note : "Your field guide is available whenever you need it."}</p>`,
    [button("Back to the ward", close, true)],
  );
$("overlay").addEventListener("cancel", (e) => {
  if (!state.accepted || state.intro < 3) e.preventDefault();
});
document.addEventListener("keydown", (e) => {
  if ($("overlay").open) return;
  if (
    document.activeElement === $("world") &&
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
  )
    e.preventDefault();
  if (
    /^[1-4]$/.test(e.key) &&
    !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
  ) {
    const b = $("choices").children[Number(e.key) - 1];
    if (b) {
      e.preventDefault();
      b.click();
    }
  }
});
if (matchMedia("(max-width:999px)").matches)
  document.querySelectorAll("details").forEach((d) => (d.open = false));
async function boot() {
  try {
    [...quests] = await Promise.all(
      [
        "data/quests/identity.json",
        "data/quests/isbar.json",
        "data/quests/deterioration.json",
        "data/world.json",
        "data/events.json",
      ].map(async (url) => {
        const r = await fetch(url);
        if (!r.ok) throw Error(`Unable to load ${url}`);
        return r.json();
      }),
    );
    events = quests.pop();
    world = quests.pop();
    quest = quests[state.chapter - 1];
    if (!globalThis.Phaser)
      throw Error("The game engine could not load. Refresh to try again.");
    if (state.node && !quest.nodes[state.node]) state.node = null;
    refresh();
    createWorld(world, state, {
      blocked: () => busy || $("overlay").open,
      interact,
      position,
      ready: (s) => {
        scene = s;
        for (const n of world.npcs)
          $("destinations").append(
            button(n.label, () => {
              scene.walk(n.stand, n.id);
            }),
          );
      },
    });
    if (!state.accepted) launch();
    else if (state.intro < 3) intro();
    else if (state.node && !state.completed) node();
    else
      story(
        "Welcome back, Wayfarer",
        state.completed
          ? "Your lantern is lit. Visit Rowan to continue your journey."
          : state.metGuide
            ? chapterInfo[state.chapter - 1].hook
            : "Find Sage Rowan at the nurses’ station.",
      );
  } catch (error) {
    $("world").innerHTML = "";
    const p = document.createElement("p");
    p.className = "error";
    p.textContent = error.message;
    $("world").append(p);
  }
}
boot();
