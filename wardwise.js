const cases = [
  {
    title: "Confused on the Late Shift",
    meta: "67 years, general medicine, post-urosepsis admission",
    difficulty: "Intermediate",
    stem:
      "A patient who was settled at handover is now acutely confused, febrile, and increasingly restless. They report burning when passing urine. Family say this behaviour is very different from baseline.",
    vitals: {
      Temp: "38.7 C",
      HR: "118",
      BP: "96/58",
      RR: "24",
      SpO2: "94%",
      BGL: "7.8",
      Pain: "3/10",
      GCS: "14",
    },
    terms: ["delirium", "sepsis", "hypotension", "tachycardia", "febrile"],
    diagnosis: {
      question: "What is the most likely clinical problem?",
      answer: "Sepsis with acute delirium",
      choices: [
        "Sepsis with acute delirium",
        "Isolated dementia progression",
        "Simple dehydration only",
        "Medication-seeking behaviour",
      ],
      rationale:
        "Fever, tachycardia, hypotension, tachypnoea, urinary symptoms, and acute confusion point toward sepsis with delirium. This needs escalation, cultures as ordered, antibiotics as prescribed, fluid review, and close observation.",
    },
    termsQuestion: {
      question: "Which term means a sudden change in attention and cognition?",
      answer: "Delirium",
      choices: ["Delirium", "Dysphagia", "Dyspnoea", "Diuresis"],
      rationale:
        "Delirium is an acute disturbance in attention, awareness, and cognition. It is different from chronic dementia.",
    },
    priority: {
      question: "What is the safest first nursing priority?",
      answer: "Escalate deterioration and complete an A-E assessment",
      choices: [
        "Escalate deterioration and complete an A-E assessment",
        "Wait until morning rounds",
        "Ask family to reorientate only",
        "Document behaviour and continue routine observations",
      ],
      rationale:
        "The observations show physiological deterioration. Use A-E assessment, local escalation criteria, and communicate clearly using ISBAR.",
    },
  },
  {
    title: "The Breathless Diabetic",
    meta: "24 years, ED short stay, type 1 diabetes",
    difficulty: "Advanced",
    stem:
      "A young adult presents with vomiting, abdominal pain, thirst, and deep rapid breathing. They missed insulin while unwell. Their breath has a sweet smell and they appear drowsy but rousable.",
    vitals: {
      Temp: "37.4 C",
      HR: "126",
      BP: "102/64",
      RR: "30",
      SpO2: "98%",
      BGL: "29.6",
      Ketones: "5.8",
      GCS: "13",
    },
    terms: ["ketones", "Kussmaul breathing", "acidosis", "hyperglycaemia", "dehydration"],
    diagnosis: {
      question: "What diagnosis best fits this presentation?",
      answer: "Diabetic ketoacidosis",
      choices: [
        "Diabetic ketoacidosis",
        "Hypoglycaemia",
        "Pulmonary embolism only",
        "Gastroenteritis without metabolic concern",
      ],
      rationale:
        "Marked hyperglycaemia, elevated ketones, vomiting, dehydration, and deep rapid breathing are classic for diabetic ketoacidosis.",
    },
    termsQuestion: {
      question: "What does Kussmaul breathing usually suggest?",
      answer: "Compensatory breathing for metabolic acidosis",
      choices: [
        "Compensatory breathing for metabolic acidosis",
        "Normal sleep breathing",
        "Upper airway obstruction",
        "A medication allergy",
      ],
      rationale:
        "Kussmaul breathing is deep, laboured breathing often seen as compensation for metabolic acidosis.",
    },
    priority: {
      question: "What is the best immediate direction of care?",
      answer: "Escalate, assess hydration, prepare IV access and protocol-based treatment",
      choices: [
        "Escalate, assess hydration, prepare IV access and protocol-based treatment",
        "Give oral juice and discharge when alert",
        "Restrict fluids and recheck in four hours",
        "Treat as anxiety until blood gases return",
      ],
      rationale:
        "DKA is time-critical. Escalation, IV access, fluid/electrolyte monitoring, insulin protocol, and frequent observations are expected.",
    },
  },
  {
    title: "Chest Pain After Mobilising",
    meta: "58 years, surgical ward, day two post-op",
    difficulty: "Intermediate",
    stem:
      "After walking to the bathroom, the patient reports sudden shortness of breath and sharp chest pain worse on inspiration. They are anxious, pale, and mildly cyanosed around the lips.",
    vitals: {
      Temp: "37.1 C",
      HR: "132",
      BP: "108/70",
      RR: "32",
      SpO2: "88%",
      Pain: "7/10",
      GCS: "15",
      ECG: "Sinus tachy",
    },
    terms: ["pleuritic pain", "hypoxia", "tachypnoea", "embolus", "cyanosis"],
    diagnosis: {
      question: "Which diagnosis is most concerning here?",
      answer: "Pulmonary embolism",
      choices: ["Pulmonary embolism", "Post-operative hunger", "Stable angina only", "Simple wound pain"],
      rationale:
        "Sudden pleuritic chest pain, hypoxia, tachycardia, tachypnoea, and post-operative risk make pulmonary embolism a key concern.",
    },
    termsQuestion: {
      question: "What does pleuritic chest pain mean?",
      answer: "Pain that worsens with breathing",
      choices: [
        "Pain that worsens with breathing",
        "Pain only after meals",
        "Pain caused by low blood glucose",
        "Pain that proves infection is absent",
      ],
      rationale:
        "Pleuritic pain is typically sharp and worsens with inspiration, coughing, or movement of the chest wall.",
    },
    priority: {
      question: "What is the safest response?",
      answer: "Call for urgent review, apply oxygen as indicated, and monitor closely",
      choices: [
        "Call for urgent review, apply oxygen as indicated, and monitor closely",
        "Encourage another walk to reduce anxiety",
        "Leave them flat and reassess after lunch",
        "Give routine oral analgesia only",
      ],
      rationale:
        "The patient is hypoxic and acutely unwell. Escalate immediately, support oxygenation within local policy, and prepare for investigations and treatment.",
    },
  },
  {
    title: "PICC Line Red Flags",
    meta: "71 years, oncology admission, PICC in left upper arm",
    difficulty: "Core",
    stem:
      "The patient reports new swelling and aching in the PICC arm. The line flushes sluggishly. The arm is warm compared with the other side and the patient feels generally unwell.",
    vitals: {
      Temp: "38.1 C",
      HR: "104",
      BP: "118/72",
      RR: "20",
      SpO2: "96%",
      Pain: "5/10",
      Site: "Warm",
      Flush: "Sluggish",
    },
    terms: ["PICC", "thrombosis", "phlebitis", "line sepsis", "occlusion"],
    diagnosis: {
      question: "What complication should be considered?",
      answer: "PICC-associated thrombosis or infection",
      choices: [
        "PICC-associated thrombosis or infection",
        "Normal PICC adjustment",
        "Benign bruising only",
        "Expected finding after every flush",
      ],
      rationale:
        "New arm swelling, warmth, pain, fever, and sluggish flushing are red flags for line complications such as thrombosis, infection, or occlusion.",
    },
    termsQuestion: {
      question: "What does thrombosis mean?",
      answer: "Formation of a blood clot inside a vessel",
      choices: [
        "Formation of a blood clot inside a vessel",
        "Inflammation of the bladder",
        "Difficulty swallowing",
        "Low platelet count only",
      ],
      rationale:
        "Thrombosis is clot formation within a blood vessel. PICC-associated upper limb thrombosis is clinically important.",
    },
    priority: {
      question: "What is the best nursing action?",
      answer: "Stop using the line and escalate according to policy",
      choices: [
        "Stop using the line and escalate according to policy",
        "Force flush with extra pressure",
        "Ignore symptoms if blood return is present",
        "Remove the line without review",
      ],
      rationale:
        "Do not force a sluggish or suspect PICC. Stop using it, assess, document, and escalate according to local vascular access policy.",
    },
  },
];

const state = {
  caseIndex: 0,
  mode: "diagnosis",
  score: 0,
  streak: 0,
  safety: 100,
  answered: false,
  log: [],
};

const els = {
  roundLabel: document.querySelector("#roundLabel"),
  scoreLabel: document.querySelector("#scoreLabel"),
  streakLabel: document.querySelector("#streakLabel"),
  safetyLabel: document.querySelector("#safetyLabel"),
  caseTitle: document.querySelector("#caseTitle"),
  caseMeta: document.querySelector("#caseMeta"),
  vitalsGrid: document.querySelector("#vitalsGrid"),
  difficultyLabel: document.querySelector("#difficultyLabel"),
  caseStem: document.querySelector("#caseStem"),
  termTags: document.querySelector("#termTags"),
  questionType: document.querySelector("#questionType"),
  questionText: document.querySelector("#questionText"),
  choices: document.querySelector("#choices"),
  feedbackBox: document.querySelector("#feedbackBox"),
  hintButton: document.querySelector("#hintButton"),
  nextButton: document.querySelector("#nextButton"),
  restartButton: document.querySelector("#restartButton"),
  learningLog: document.querySelector("#learningLog"),
  tabs: {
    diagnosis: document.querySelector("#diagnosisTab"),
    terms: document.querySelector("#termsTab"),
    priority: document.querySelector("#priorityTab"),
  },
};

function getCurrentCase() {
  return cases[state.caseIndex];
}

function getChallenge(caseItem) {
  if (state.mode === "terms") return caseItem.termsQuestion;
  if (state.mode === "priority") return caseItem.priority;
  return caseItem.diagnosis;
}

function getModeLabel() {
  if (state.mode === "terms") return "Medical terminology";
  if (state.mode === "priority") return "Immediate priority";
  return "Most likely diagnosis";
}

function render() {
  const caseItem = getCurrentCase();
  const challenge = getChallenge(caseItem);

  els.roundLabel.textContent = `Case ${state.caseIndex + 1} of ${cases.length}`;
  els.scoreLabel.textContent = `${state.score} pts`;
  els.streakLabel.textContent = state.streak;
  els.safetyLabel.textContent = `${state.safety}%`;
  els.caseTitle.textContent = caseItem.title;
  els.caseMeta.textContent = caseItem.meta;
  els.difficultyLabel.textContent = caseItem.difficulty;
  els.caseStem.textContent = caseItem.stem;
  els.questionType.textContent = getModeLabel();
  els.questionText.textContent = challenge.question;
  els.nextButton.disabled = !state.answered;

  Object.entries(els.tabs).forEach(([mode, tab]) => {
    tab.classList.toggle("active", state.mode === mode);
  });

  els.vitalsGrid.innerHTML = "";
  Object.entries(caseItem.vitals).forEach(([label, value]) => {
    const vital = document.createElement("div");
    vital.className = "vital";
    vital.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    els.vitalsGrid.appendChild(vital);
  });

  els.termTags.innerHTML = "";
  caseItem.terms.forEach((term) => {
    const tag = document.createElement("span");
    tag.className = "term-tag";
    tag.textContent = term;
    els.termTags.appendChild(tag);
  });

  els.choices.innerHTML = "";
  challenge.choices.forEach((choice) => {
    const button = document.createElement("button");
    button.className = "choice";
    button.type = "button";
    button.textContent = choice;
    button.disabled = state.answered;
    button.addEventListener("click", () => answer(choice));
    els.choices.appendChild(button);
  });

  if (!state.answered) {
    els.feedbackBox.className = "feedback hidden";
    els.feedbackBox.textContent = "";
  }

  els.learningLog.textContent =
    state.log.length > 0 ? state.log.slice(-2).join(" ") : "Select an answer to build your clinical log.";
}

function answer(choice) {
  if (state.answered) return;

  const challenge = getChallenge(getCurrentCase());
  const isCorrect = choice === challenge.answer;
  state.answered = true;

  if (isCorrect) {
    state.score += state.mode === "priority" ? 150 : 100;
    state.streak += 1;
  } else {
    state.streak = 0;
    state.safety = Math.max(0, state.safety - (state.mode === "priority" ? 15 : 8));
  }

  Array.from(els.choices.children).forEach((button) => {
    button.disabled = true;
    if (button.textContent === challenge.answer) button.classList.add("correct");
    if (button.textContent === choice && !isCorrect) button.classList.add("wrong");
  });

  els.feedbackBox.className = `feedback ${isCorrect ? "" : "warning"}`;
  els.feedbackBox.textContent = `${isCorrect ? "Correct." : "Review this."} ${challenge.rationale}`;

  state.log.push(`${getCurrentCase().title}: ${challenge.answer}.`);
  renderScoreOnly();
}

function renderScoreOnly() {
  els.scoreLabel.textContent = `${state.score} pts`;
  els.streakLabel.textContent = state.streak;
  els.safetyLabel.textContent = `${state.safety}%`;
  els.nextButton.disabled = false;
  els.learningLog.textContent = state.log.slice(-2).join(" ");
}

function setMode(mode) {
  state.mode = mode;
  state.answered = false;
  render();
}

function nextCase() {
  if (!state.answered) return;
  state.caseIndex += 1;
  state.answered = false;

  if (state.caseIndex >= cases.length) {
    showFinal();
    return;
  }

  render();
}

function showFinal() {
  const rating =
    state.safety >= 85 && state.score >= 500
      ? "Ready for the next round"
      : state.safety >= 70
        ? "Good clinical base, keep sharpening priorities"
        : "Needs a safety-focused debrief";

  els.caseTitle.textContent = "Shift Debrief";
  els.caseMeta.textContent = rating;
  els.difficultyLabel.textContent = "Complete";
  els.caseStem.textContent =
    "The round is finished. Review the learning log, then restart and try different tabs for each case. In class, one student can justify the diagnosis while another names the safest priority action.";
  els.questionType.textContent = "Final score";
  els.questionText.textContent = `${state.score} points with ${state.safety}% safety retained`;
  els.choices.innerHTML = "";
  els.feedbackBox.className = "feedback";
  els.feedbackBox.textContent =
    "This game is for education and clinical reasoning practice. It does not replace local policy, senior review, or patient-specific clinical judgement.";
  els.nextButton.disabled = true;
  els.vitalsGrid.innerHTML = "";
  els.termTags.innerHTML = "";
  els.learningLog.textContent = state.log.join(" ");
}

function showHint() {
  const caseItem = getCurrentCase();
  const challenge = getChallenge(caseItem);
  const hint =
    state.mode === "terms"
      ? `Look at the word roots and the terms beside the case: ${caseItem.terms.slice(0, 3).join(", ")}.`
      : state.mode === "priority"
        ? "Prioritise immediate physiological risk before comfort, paperwork, or routine tasks."
        : "Match the pattern: symptoms, observations, risk factors, then the diagnosis that explains all of them.";
  els.feedbackBox.className = "feedback";
  els.feedbackBox.textContent = `${hint} The correct answer must fit: ${challenge.question}`;
}

function restart() {
  state.caseIndex = 0;
  state.mode = "diagnosis";
  state.score = 0;
  state.streak = 0;
  state.safety = 100;
  state.answered = false;
  state.log = [];
  render();
}

els.tabs.diagnosis.addEventListener("click", () => setMode("diagnosis"));
els.tabs.terms.addEventListener("click", () => setMode("terms"));
els.tabs.priority.addEventListener("click", () => setMode("priority"));
els.hintButton.addEventListener("click", showHint);
els.nextButton.addEventListener("click", nextCase);
els.restartButton.addEventListener("click", restart);

render();
