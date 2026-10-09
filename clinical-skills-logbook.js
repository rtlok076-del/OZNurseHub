/* Structured records only: this boundary is also applied to legacy storage and imports. */
(function () {
  "use strict";
  const catalogue = window.OZSkills;
  const skills = catalogue.areas.flatMap((area) =>
    area.skills.map(([id, name]) => ({ id, name, area: area.name })),
  );
  const skillMap = new Map(skills.map((skill) => [skill.id, skill]));
  const key = "ozn.skills-logbook.log";
  const $ = (selector) => document.querySelector(selector);
  const node = (tag, text) => {
    const element = document.createElement(tag);
    element.textContent = text;
    return element;
  };
  const today = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  function cleanEntry(entry) {
    if (
      !entry ||
      !skillMap.has(entry.skill) ||
      typeof entry.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)
    )
      return null;
    const date = new Date(entry.date + "T12:00:00Z");
    if (
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== entry.date ||
      entry.date > today()
    )
      return null;
    if (!catalogue.levels.some((level) => level.id === entry.level))
      return null;
    return {
      skill: entry.skill,
      date: entry.date,
      level: entry.level,
      setting: catalogue.settings.includes(entry.setting) ? entry.setting : "",
      stds: [
        ...new Set(
          (Array.isArray(entry.stds) ? entry.stds : []).filter(
            (value) => Number.isInteger(value) && value >= 1 && value <= 7,
          ),
        ),
      ].sort(),
    };
  }
  // No imported IDs, names, labels, notes or arbitrary properties survive this function.
  function cleanEntries(entries) {
    return (Array.isArray(entries) ? entries : [])
      .map(cleanEntry)
      .filter(Boolean);
  }
  window.OZSkillsRecords = { cleanEntry, cleanEntries };
  if (!document.querySelector("#skill-form")) return;
  let records = [],
    editing = null,
    loadFailed = false;
  function persist() {
    try {
      localStorage.setItem(key, JSON.stringify({ v: 3, entries: records }));
      $("#storage-status").textContent = "";
      return true;
    } catch {
      $("#storage-status").textContent =
        "Could not save in this browser. Keep this page open and download a backup before leaving.";
      return false;
    }
  }
  try {
    const stored = localStorage.getItem(key);
    const raw = stored ? JSON.parse(stored) : null;
    records = cleanEntries(raw && raw.entries);
    if (raw && raw.v !== 3) {
      $("#migration-status").textContent =
        "Your logbook has been converted to structured skill records. Previous reflections, names, custom skills and other free text have been removed. " +
        ((raw.entries || []).length - records.length) +
        " unsupported or invalid entries were excluded.";
    }
    if (raw && stored !== JSON.stringify({ v: 3, entries: records })) persist();
  } catch {
    loadFailed = true;
    $("#storage-status").textContent =
      "The saved logbook could not be read. Download or recover your existing browser data before saving new records.";
  }
  function options(select, items, placeholder) {
    select.append(new Option(placeholder, ""));
    items.forEach(([value, label]) => select.append(new Option(label, value)));
  }
  options(
    $("#skill"),
    skills.map((skill) => [skill.id, skill.name]),
    "Choose a skill",
  );
  options(
    $("#setting"),
    catalogue.settings.map((setting) => [setting, setting]),
    "Choose (optional)",
  );
  options(
    $("#level"),
    catalogue.levels.map((level) => [level.id, level.name]),
    "Choose a level",
  );
  catalogue.levels.forEach((level) => {
    const p = node("p", `${level.name}: ${level.desc}`);
    p.className = "st-help";
    $("#level").parentElement.append(p);
  });
  Object.entries(catalogue.standards).forEach(([value, label]) => {
    const wrapper = node("label", "");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = value;
    input.name = "standard";
    wrapper.append(input, document.createTextNode(` ${value}: ${label}`));
    $("#standards").append(wrapper);
  });
  $("#date").value = today();
  $("#date").max = today();
  const levelName = (id) =>
    catalogue.levels.find((level) => level.id === id).name;
  function reset() {
    editing = null;
    $("#skill-form").reset();
    $("#date").value = today();
    $("#cancel-edit").hidden = true;
    $("#skill-form button[type=submit]").textContent = "Save skill";
  }
  function render() {
    $("#progress-summary").textContent =
      `${new Set(records.map((record) => record.skill)).size} of ${skills.length} skills practised · ${records.length} records`;
    $("#progress").replaceChildren();
    catalogue.areas.forEach((area) => {
      const details = document.createElement("details");
      details.open = false;
      details.append(node("summary", area.name));
      area.skills.forEach(([id, name]) => {
        const matches = records.filter((record) => record.skill === id);
        const best = catalogue.levels
          .filter((level) =>
            matches.some((record) => record.level === level.id),
          )
          .at(-1);
        const row = node("div", "");
        row.className = "skill-row";
        row.append(
          node("span", name),
          node(
            "span",
            best ? `${best.abbr} · ${matches.length} logged` : "Not yet logged",
          ),
        );
        details.append(row);
      });
      $("#progress").append(details);
    });
    $("#entries").replaceChildren();
    if (!records.length)
      $("#entries").append(node("p", "No skills recorded yet."));
    records
      .map((record, index) => ({ record, index }))
      .sort((a, b) => b.record.date.localeCompare(a.record.date))
      .forEach(({ record, index }) => {
        const article = node("article", "");
        article.className = "record";
        article.append(
          node("h3", skillMap.get(record.skill).name),
          node(
            "p",
            [
              record.date,
              levelName(record.level),
              record.setting,
              record.stds.length ? "NMBA " + record.stds.join(", ") : "",
            ]
              .filter(Boolean)
              .join(" · "),
          ),
        );
        const edit = node("button", "Edit");
        edit.type = "button";
        edit.className = "st-btn ghost small";
        edit.addEventListener("click", () => {
          editing = index;
          $("#skill").value = record.skill;
          $("#date").value = record.date;
          $("#setting").value = record.setting;
          $("#level").value = record.level;
          document.querySelectorAll("[name=standard]").forEach((input) => {
            input.checked = record.stds.includes(Number(input.value));
          });
          $("#cancel-edit").hidden = false;
          $("#skill-form button[type=submit]").textContent = "Update skill";
          $("#skill").focus();
        });
        const remove = node("button", "Delete");
        remove.type = "button";
        remove.className = "st-btn ghost small";
        remove.addEventListener("click", () => {
          if (!confirm("Delete this skill record?")) return;
          records.splice(index, 1);
          reset();
          persist();
          render();
        });
        article.append(edit, remove);
        $("#entries").append(article);
      });
  }
  $("#skill-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (loadFailed) {
      $("#status").textContent =
        "Existing storage could not be read. Recover it or explicitly clear the logbook first.";
      return;
    }
    const record = cleanEntry({
      skill: $("#skill").value,
      date: $("#date").value,
      setting: $("#setting").value,
      level: $("#level").value,
      stds: [...document.querySelectorAll("[name=standard]:checked")].map(
        (input) => Number(input.value),
      ),
    });
    if (!record) {
      $("#status").textContent =
        "Choose a valid skill, date and involvement level.";
      return;
    }
    if (editing === null) records.push(record);
    else records[editing] = record;
    const saved = persist();
    reset();
    render();
    $("#status").textContent = saved
      ? "Skill saved on this device."
      : "Skill kept temporarily. Download a backup now.";
  });
  $("#cancel-edit").addEventListener("click", reset);
  function download(type, extension, content) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `oznursehub-skills-${today()}.${extension}`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  $("#backup").addEventListener("click", () =>
    download(
      "application/json",
      "json",
      JSON.stringify(
        {
          app: "oznursehub-skills-logbook",
          version: 3,
          data: { v: 3, entries: cleanEntries(records) },
        },
        null,
        2,
      ),
    ),
  );
  $("#csv").addEventListener("click", () => {
    const rows = [
      ["Date", "Skill", "Level", "Placement type", "NMBA standards"],
      ...records.map((record) => [
        record.date,
        skillMap.get(record.skill).name,
        levelName(record.level),
        record.setting,
        record.stds.join("; "),
      ]),
    ];
    download(
      "text/csv;charset=utf-8",
      "csv",
      "\ufeff" +
        rows
          .map((row) =>
            row
              .map((value) => '"' + String(value).replace(/"/g, '""') + '"')
              .join(","),
          )
          .join("\r\n"),
    );
  });
  let printState = null;
  window.addEventListener("beforeprint", () => {
    if (printState) return;
    printState = [...document.querySelectorAll("#progress details")].map(
      (details) => ({ details, open: details.open }),
    );
    printState.forEach(({ details }) => {
      details.open = true;
    });
  });
  window.addEventListener("afterprint", () => {
    if (!printState) return;
    printState.forEach(({ details, open }) => {
      details.open = open;
    });
    printState = null;
  });
  $("#print").addEventListener("click", () => window.print());
  $("#restore").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (loadFailed)
        throw new Error("Recover or clear unreadable local storage first.");
      if (file.size > 5e6) throw new Error("Backup must be smaller than 5 MB.");
      const raw = JSON.parse(await file.text());
      const data =
        raw && raw.app === "oznursehub-skills-logbook" ? raw.data : raw;
      if (!data || !Array.isArray(data.entries))
        throw new Error("This is not a logbook backup.");
      const incoming = cleanEntries(data.entries);
      const seen = new Set(records.map((record) => JSON.stringify(record)));
      let added = 0;
      incoming.forEach((record) => {
        const fingerprint = JSON.stringify(record);
        if (!seen.has(fingerprint)) {
          records.push(record);
          seen.add(fingerprint);
          added++;
        }
      });
      const saved = persist();
      reset();
      render();
      $("#backup-status").textContent =
        `${added} records added; ${data.entries.length - incoming.length} invalid or unsupported records skipped. Free text was excluded. ${saved ? "Saved on this device." : "Temporary only — download a backup."}`;
    } catch (error) {
      $("#backup-status").textContent =
        error instanceof SyntaxError
          ? "The backup is not valid JSON."
          : error.message;
    }
    event.target.value = "";
  });
  $("#clear").addEventListener("click", () => {
    if (
      !confirm(
        "Delete all saved logbook data, including any older records? This cannot be undone.",
      )
    )
      return;
    try {
      localStorage.removeItem(key);
      records = [];
      loadFailed = false;
      reset();
      render();
      $("#storage-status").textContent = "";
      $("#migration-status").textContent = "";
      $("#backup-status").textContent = "Saved logbook cleared.";
    } catch {
      $("#storage-status").textContent =
        "Browser storage could not be cleared.";
    }
  });
  render();
})();
