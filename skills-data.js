/* Predefined clinical skill catalogue. */
(function () {
  "use strict";
  var LEVELS = [
    {
      id: "obs",
      n: 1,
      name: "Observed",
      abbr: "O",
      desc: "You watched an RN or another clinician do it and talked it through with them.",
    },
    {
      id: "ast",
      n: 2,
      name: "Assisted",
      abbr: "A",
      desc: "You did part of it alongside the RN, who led and did the rest.",
    },
    {
      id: "sup",
      n: 3,
      name: "Performed under supervision",
      abbr: "S",
      desc: "You did it yourself with the RN directly supervising, guiding you and ready to step in.",
    },
    {
      id: "min",
      n: 4,
      name: "Performed with minimal prompting",
      abbr: "MP",
      desc: "You did it safely and confidently with the RN present, needing only the odd cue.",
    },
  ];
  var LV = {};
  LEVELS.forEach(function (l) {
    LV[l.id] = l;
  });
  var STD = {
    1: "Thinks critically and analyses nursing practice",
    2: "Engages in therapeutic and professional relationships",
    3: "Maintains the capability for practice",
    4: "Comprehensively conducts assessments",
    5: "Develops a plan for nursing practice",
    6: "Provides safe, appropriate and responsive quality nursing practice",
    7: "Evaluates outcomes to inform nursing practice",
  };
  var STD_SHORT = {
    1: "Critical thinking",
    2: "Relationships",
    3: "Capability",
    4: "Assessment",
    5: "Planning",
    6: "Safe, quality practice",
    7: "Evaluation",
  };
  var SETTINGS = [
    "Medical ward",
    "Surgical ward",
    "Aged care",
    "Rehabilitation",
    "Mental health",
    "Community or primary care",
    "Emergency",
    "Perioperative",
    "Critical care",
    "Paediatrics",
    "Maternity",
    "Palliative care",
    "Other",
  ];
  var AREAS = [
    {
      id: "as",
      name: "Assessment and observations",
      skills: [
        [
          "as-vitals",
          "Full set of vital signs (RR, SpO\u2082, BP, HR, temperature, level of consciousness)",
        ],
        [
          "as-chart",
          "Charting observations on an observation and response chart",
        ],
        ["as-pain", "Pain assessment using a pain scale"],
        ["as-neuro", "Neurological observations (GCS, pupils, limb strength)"],
        ["as-nvo", "Neurovascular observations"],
        ["as-bgl", "Blood glucose level (BGL) check"],
        ["as-head", "Head-to-toe or systems assessment"],
        ["as-fbc", "Fluid balance chart"],
        ["as-wt", "Weight, height and BMI"],
        ["as-cog", "Delirium and cognition screening"],
        ["as-ecg", "Recording a 12-lead ECG"],
        ["as-adm", "Admission nursing assessment"],
      ],
    },
    {
      id: "md",
      name: "Medication administration",
      note: "No doses here. Students give medicines only under the direct supervision of an RN, whatever level you log. Rules for Schedule 8 medicines, IV medicines and acting as a second checker vary, so always check first.",
      skills: [
        [
          "md-chart",
          "Checking a medication chart against the rights of medication administration",
        ],
        [
          "md-id",
          "Patient identification and allergy check before giving medicines",
        ],
        ["md-oral", "Oral medicines"],
        ["md-sc", "Subcutaneous injection"],
        ["md-im", "Intramuscular injection"],
        ["md-top", "Topical or transdermal medicines (creams, patches)"],
        ["md-inh", "Inhaled medicines (puffer and spacer, nebuliser)"],
        ["md-eye", "Eye or ear drops"],
        [
          "md-prn",
          "PRN medicine: assessing the need and evaluating the effect",
        ],
        ["md-edu", "Explaining a medicine to a patient"],
        ["md-iv", "IV medicine checking and preparation (observed)"],
      ],
    },
    {
      id: "wd",
      name: "Wound care and ANTT",
      skills: [
        ["wd-hh", "Hand hygiene at the 5 Moments"],
        ["wd-ppe", "Putting on and taking off PPE"],
        [
          "wd-field",
          "Setting up an aseptic field (protecting key parts and key sites)",
        ],
        ["wd-simple", "Simple wound dressing using ANTT"],
        ["wd-assess", "Wound assessment and documentation"],
        ["wd-sut", "Removing sutures or staples"],
        ["wd-drain", "Wound drain care and measuring output"],
        ["wd-sharps", "Safe sharps handling and disposal"],
      ],
    },
    {
      id: "iv",
      name: "IV and PIVC site care",
      note: "Many facilities limit what students can do with IV lines and infusions. Check before you\u2019re involved.",
      skills: [
        ["iv-site", "PIVC site check (e.g. VIP score)"],
        ["iv-doc", "Documenting a PIVC check"],
        ["iv-dress", "PIVC dressing and securement check"],
        ["iv-remove", "Removing a PIVC"],
        ["iv-flush", "Flushing a PIVC (medicine rules apply)"],
        ["iv-fluid", "Monitoring an IV fluid infusion and pump"],
        ["iv-prime", "Priming an IV giving set"],
      ],
    },
    {
      id: "mb",
      name: "Mobility and falls",
      skills: [
        ["mb-falls", "Falls risk assessment"],
        ["mb-aids", "Helping a patient walk with a gait aid"],
        ["mb-transfer", "Bed-to-chair transfer"],
        ["mb-equip", "Using a slide sheet or lifting machine"],
        ["mb-repos", "Repositioning in bed"],
        ["mb-stock", "Applying compression stockings (VTE prevention)"],
        ["mb-postfall", "Post-fall checks and observations"],
      ],
    },
    {
      id: "hy",
      name: "Hygiene and pressure care",
      skills: [
        ["hy-wash", "Assisted shower or bed wash"],
        ["hy-oral", "Mouth care"],
        ["hy-pi", "Pressure injury risk assessment"],
        ["hy-skin", "Skin inspection"],
        ["hy-bed", "Making an occupied bed"],
        ["hy-cont", "Continence care"],
      ],
    },
    {
      id: "nu",
      name: "Nutrition and elimination",
      skills: [
        ["nu-meal", "Helping with meals and drinks"],
        ["nu-chart", "Food and fluid charts"],
        ["nu-iddsi", "Texture-modified food and thickened fluids (IDDSI)"],
        ["nu-idc", "Catheter care and emptying a drainage bag"],
        ["nu-bowel", "Bowel chart (Bristol stool chart)"],
        ["nu-stoma", "Stoma care"],
        ["nu-ngt", "Caring for a nasogastric or enteral feeding tube"],
      ],
    },
    {
      id: "cm",
      name: "Communication and handover",
      skills: [
        ["cm-isbar", "ISBAR handover to your RN"],
        ["cm-bedside", "Bedside handover"],
        ["cm-edu", "Patient education"],
        ["cm-family", "Talking with families and carers"],
        ["cm-interp", "Working with an interpreter"],
        ["cm-distress", "Responding to a distressed or anxious patient"],
        ["cm-team", "Speaking up in a team huddle or ward round"],
      ],
    },
    {
      id: "dc",
      name: "Documentation",
      skills: [
        ["dc-prog", "Writing a progress note"],
        ["dc-care", "Updating a care plan"],
        ["dc-adm", "Admission documentation"],
        ["dc-dis", "Discharge planning and education"],
        [
          "dc-emr",
          "Documenting in electronic records (if students are given access)",
        ],
        ["dc-inc", "Incident report (observed or contributed)"],
      ],
    },
    {
      id: "es",
      name: "Escalation and deterioration",
      skills: [
        ["es-abn", "Recognising abnormal observations and telling your RN"],
        ["es-isbar", "Escalating a concern using ISBAR"],
        ["es-rrt", "Rapid response or MET call (observed or assisted)"],
        ["es-bls", "Basic life support (CPR)"],
        ["es-trolley", "Emergency trolley check"],
        ["es-o2", "Oxygen delivery devices: applying and monitoring"],
      ],
    },
    {
      id: "sp",
      name: "Specimen collection",
      skills: [
        ["sp-ua", "Urinalysis (dipstick)"],
        ["sp-msu", "Midstream urine (MSU) collection"],
        ["sp-csu", "Catheter specimen of urine (CSU)"],
        ["sp-swab", "Wound swab"],
        ["sp-faeces", "Faecal specimen"],
        ["sp-sputum", "Sputum specimen"],
        ["sp-nt", "Nose and throat swab"],
        ["sp-label", "Labelling specimens and request forms at the bedside"],
        ["sp-bc", "Blood cultures (observed)"],
      ],
    },
    {
      id: "ot",
      name: "Perioperative and other care",
      skills: [
        ["ot-preop", "Pre-operative checklist"],
        ["ot-postop", "Post-operative observations and care"],
        ["ot-admit", "Welcoming and orienting a new patient"],
        ["ot-dis", "Discharging a patient"],
        ["ot-after", "After-death care (observed or assisted)"],
      ],
    },
  ];
  var AREA = {};
  AREAS.forEach(function (a) {
    AREA[a.id] = a;
  });

  window.OZSkills = {
    levels: LEVELS,
    areas: AREAS,
    settings: SETTINGS,
    standards: STD_SHORT,
  };
})();
