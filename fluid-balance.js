/* Fluid balance chart simulator. Vanilla JS. Saves nothing: no localStorage,
   sessionStorage, IndexedDB or cookies. Everything lives in memory and clears on refresh.
   All patients, volumes and events are fictional. */
(() => {
  "use strict";
  const IN = [["oral", "Oral"], ["iv", "IV"], ["ng", "NG / enteral"], ["oin", "Other in"]];
  const OUT = [["urine", "Urine"], ["vomit", "Vomit"], ["drain", "Drain"], ["ngasp", "NG aspirate"], ["oout", "Stool / other"]];
  const HOURS = Array.from({ length: 24 }, (_, i) => (8 + i) % 24);
  const hh = (h) => String(h).padStart(2, "0") + ":00";
  const ESC = "Report to the team leader or RN and follow your local policy.";
  const UO = "a sustained drop in urine output, or output below the threshold in your local policy";

  // Helper: fill a column with the same volume for a list of hours.
  const each = (hours, v) => Object.fromEntries(hours.map((h) => [h, v]));

  const SCENARIOS = [
    {
      id: "postop", name: "Tomas Reyes, 61", tag: "Surgical ward",
      blurb: "Day 1 after open bowel surgery. IV fluids, an IDC, an abdominal drain and an NG tube on free drainage.",
      story: "Tomas had open bowel surgery yesterday. He has IV fluids running, an indwelling catheter (IDC) with hourly urine measures, a wound drain and an NG tube on free drainage. He's allowed sips of water. Your shift starts at 08:00.",
      data: {
        iv: each(HOURS, 80),
        oral: { 10: 30, 13: 50, 17: 40, 21: 60, 9: 60 },
        ngasp: { 12: 120, 18: 90, 0: 60, 6: 50 },
        drain: { 8: 20, 14: 30, 20: 20, 2: 10 },
        urine: { 8: 70, 9: 65, 10: 60, 11: 55, 12: 50, 13: 45, 14: 40, 15: 30, 16: 25, 17: 20, 18: 35, 19: 45, 20: 55, 21: 60, 22: 60, 23: 55, 0: 60, 1: 55, 2: 60, 3: 55, 4: 60, 5: 55, 6: 60, 7: 60 }
      },
      notes: { 17: "17:15 reported to the RN with ISBAR; medical team reviewed at 17:45 (fictional)", 9: "Sips of water only" },
      spotAt: 17,
      problem: "It's 17:00. Look at the urine column from 08:00 to 17:00. What do you notice, and what would you do?",
      options: [
        ["Nothing yet. The 24-hour total will tell us at 07:00 whether it's a problem.", "Waiting for the 24-hour total hides the trend. An hourly drop over nine hours needs action now, not tomorrow."],
        ["Speed up the IV fluids so he makes more urine.", "Never change an IV rate yourself. Fluid orders come from the medical team, and the cause still needs to be found."],
        ["Check the IDC isn't kinked or blocked and the bag is below the bladder, repeat his obs, then report the falling urine output to the RN or team leader using ISBAR.", null],
        ["Encourage more sips and recheck the urine at the end of the shift.", "He's on sips only after bowel surgery, and the trend has been falling for hours. Rechecking later delays escalation."]
      ],
      best: 2,
      explain: "Urine output has fallen every hour, from 70 mL at 08:00 to 20 mL at 17:00, while intake stayed steady. A trend like this matters more than any single number. Quick checks first (is the catheter kinked, blocked or bypassing? is the bag below the bladder?). Then escalate, because this is " + UO + ". " + ESC + " In your ISBAR, give the hourly urine figures, the cumulative balance and his latest obs."
    },
    {
      id: "gastro", name: "Priya Nand, 29", tag: "Medical ward",
      blurb: "Vomiting and diarrhoea with gastroenteritis. IV fluids, sips and some losses that weren't measured.",
      story: "Priya was admitted overnight with gastroenteritis. She's on IV fluids and trying small sips. A pan is in the toilet to measure stools, and she has a vomit bag at the bedside.",
      data: {
        iv: each([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 23, 0, 1, 2, 3, 4, 5, 6, 7], 80),
        oral: { 9: 50, 11: 30, 14: 50, 16: 60, 19: 40, 21: 80, 1: 50, 6: 100 },
        vomit: { 9: 250, 11: 180, 15: 200, 19: 150, 21: 250, 3: 200 },
        oout: { 10: 300, 18: 250, 23: 200, 4: 300 },
        urine: { 12: 150, 18: 120, 2: 100, 6: 90 }
      },
      notes: {
        13: "Large vomit on the floor, not measured",
        14: "Incontinent of liquid stool, not measured",
        20: "IV cannula found tissued, IV not running",
        23: "New cannula; IV restarted",
        10: "Liquid stool in pan"
      },
      spotAt: 23,
      problem: "It's the end of the evening. Look at the balance, the notes column and the IV column. What's the problem, and what would you do?",
      options: [
        ["Her IV is running again now, so the balance will sort itself out.", "Restarting the IV doesn't fix what's already happened. Check your totals, and remember the two unmeasured losses. The real balance is worse than the chart shows."],
        ["Note that two losses weren't measured, so the real balance is more negative than charted, and the IV wasn't running for three hours. Report this to the RN or team leader using ISBAR, and estimate and document unmeasured losses as your local policy says.", null],
        ["Add a guessed volume for the unmeasured vomit into the vomit column so the totals look right.", "Don't invent numbers. Document 'not measured' with a description (for example 'large'), follow your local policy on estimating, and tell the RN."],
        ["Run the next bag faster to catch up on the three hours missed.", "Never change an IV rate yourself. Tell the RN so the medical team can decide."]
      ],
      best: 1,
      explain: "The chart already shows more out than in, and that's before two losses that couldn't be measured and three hours with no IV fluid. Unmeasured losses mean the charted balance overstates what she has kept in. " + ESC + " In your ISBAR, mention the charted balance, the unmeasured losses, the IV interruption and her obs."
    },
    {
      id: "elderly", name: "Edith Clarke, 88", tag: "Aged care / medical",
      blurb: "Admitted after a fall. Poor appetite, small drinks, and an incontinent episode overnight.",
      story: "Edith was admitted after a fall at home. She needs prompting to drink and often leaves her cup half full. There's no IV. Her family says she's usually sharp, but she seemed more muddled this evening.",
      data: {
        oral: { 8: 100, 10: 50, 12: 80, 15: 60, 18: 100, 21: 50, 2: 30, 6: 50 },
        oin: { 12: 60, 18: 50 },
        urine: { 9: 150, 14: 120, 20: 100, 6: 90 }
      },
      notes: {
        12: "Other in: jelly (60 mL)",
        18: "Other in: custard (50 mL)",
        11: "Small formed stool, not measured",
        3: "Incontinent of urine, pad wet, not measured",
        21: "More muddled than this morning, says she isn't thirsty",
        20: "Urine dark and strong smelling"
      },
      spotAt: 21,
      problem: "It's 21:00. Edith has drunk very little all day, her urine is dark and she's more muddled than this morning. What would you do?",
      options: [
        ["Report the low intake, the dark urine and the new confusion to the RN or team leader using ISBAR, keep charting every drink and loss accurately, and offer drinks she likes as the care plan allows.", null],
        ["She says she isn't thirsty, so respect that and stop offering drinks.", "Older people often feel less thirst. Her choice matters, but low intake plus new confusion still needs to be reported and planned for with the team."],
        ["Confusion is common at night in older people. Mention it at handover in the morning.", "New or worsening confusion is a change from her baseline. Don't wait for morning handover."],
        ["Start an IV so she gets more fluid.", "IV fluids need a medical order. Report it to the RN so the team can decide."]
      ],
      best: 0,
      explain: "Her intake is low, her measured output is small, the urine is concentrated and she has new confusion. Any of these alone could be explained away; together they're a pattern. The incontinent episode wasn't measured, so the output column is incomplete too. " + ESC + " In your ISBAR, give her totals so far, the change in her thinking and her obs."
    },
    {
      id: "hf", name: "George Papadopoulos, 76", tag: "Cardiology",
      blurb: "Heart failure on a fluid restriction. Visitors, soup, jelly and flushes all add up.",
      story: "George has heart failure and his care plan includes a fluid restriction. For this practice scenario only, his chart lists a fictional limit of 1200 mL in 24 hours. His family visited in the afternoon, and he has an IV cannula that's flushed twice a day. His weight this morning was up compared with yesterday (fictional).",
      limit: 1200,
      data: {
        oral: { 8: 200, 10: 150, 12: 200, 15: 150, 18: 200, 20: 150, 22: 100, 2: 50 },
        oin: { 13: 100, 17: 60 },
        iv: { 8: 10, 20: 10 },
        urine: { 9: 200, 13: 150, 17: 150, 22: 120, 5: 150 }
      },
      notes: {
        12: "Oral: soup (200 mL)",
        13: "Other in: jelly (100 mL)",
        15: "Drinks brought in by visitors",
        17: "Other in: ice chips (60 mL)",
        8: "IV: cannula flush (10 mL)"
      },
      spotAt: 22,
      problem: "It's 22:00. Compare his intake with the fictional limit on his chart, and look at the balance. What's the problem, and what would you do?",
      options: [
        ["Only drinks count toward the restriction, so he's within his limit.", "Soup, jelly, ice chips and IV flushes all count as fluid intake. Total every intake column."],
        ["Take his water jug away and tell him he can't have anything until morning.", "That isn't your decision alone and it can cause distress. Report it, and the team will plan with him."],
        ["Recognise that his intake is over the charted limit and his balance is positive. Report it to the RN or team leader using ISBAR, and check that he and his visitors understand the restriction.", null],
        ["Give an extra dose of his fluid tablet.", "Never give or change a medicine without an order. Report it so the team can decide."]
      ],
      best: 2,
      explain: "Once soup, jelly, ice chips and the IV flushes are counted, his intake is over the fictional limit on his chart, and he has a positive balance with his weight up. In heart failure, that pattern matters. " + ESC + " In your ISBAR, give the intake total against the charted limit, the balance, his weight and his breathing and obs."
    }
  ];

  function totals(sc) {
    const col = {};
    [...IN, ...OUT].forEach(([k]) => { col[k] = HOURS.reduce((s, h) => s + ((sc.data[k] || {})[h] || 0), 0); });
    const tin = IN.reduce((s, [k]) => s + col[k], 0);
    const tout = OUT.reduce((s, [k]) => s + col[k], 0);
    return { col, tin, tout, bal: tin - tout };
  }
  const signed = (n) => (n > 0 ? "+" : n < 0 ? "−" : "±") + Math.abs(n).toLocaleString("en-AU") + " mL";
  const word = (n) => (n > 0 ? "positive" : n < 0 ? "negative" : "even");
  const fmt = (n) => n.toLocaleString("en-AU");

  // Exposed for automated tests only (read-only data, nothing stored).
  window.__fluidBalance = { SCENARIOS, totals, IN, OUT };

  const $ = (s) => document.querySelector(s);
  const list = $("#fb-list"), play = $("#fb-play");
  if (!list || !play) return;
  let current = null, mode = "practice", extra = {}, answers = {}, checked = new Set(), reveal = false, asYouGo = false, spotChoice = null;

  function el(tag, attrs, html) {
    const e = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
    if (html != null) e.innerHTML = html;
    return e;
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  SCENARIOS.forEach((sc) => {
    const b = el("button", { type: "button", class: "ce-case", "data-id": sc.id, "aria-pressed": "false" },
      `<em>${sc.tag}</em><strong>${sc.name}</strong><span>${sc.blurb}</span>`);
    b.addEventListener("click", () => open(sc.id, true));
    list.append(b);
  });

  function merged(sc) {
    const data = {};
    [...IN, ...OUT].forEach(([k]) => { data[k] = Object.assign({}, sc.data[k] || {}); });
    Object.entries(extra).forEach(([k, hours]) => Object.entries(hours).forEach(([h, v]) => { data[k][h] = (data[k][h] || 0) + v; }));
    return Object.assign({}, sc, { data });
  }

  // Expected value and a teaching hint for every fillable cell.
  function expected() {
    const sc = merged(current), t = totals(sc), exp = {};
    let runIn = 0, runOut = 0, prevIn = 0, prevOut = 0;
    HOURS.forEach((h) => {
      const vin = IN.reduce((s, [k]) => s + (sc.data[k][h] || 0), 0);
      const vout = OUT.reduce((s, [k]) => s + (sc.data[k][h] || 0), 0);
      prevIn = runIn; prevOut = runOut; runIn += vin; runOut += vout;
      exp[`r${h}-in`] = { v: runIn, label: `${hh(h)} running intake`, hint: `Previous running intake ${fmt(prevIn)} + this hour's intake ${fmt(vin)} = ${fmt(runIn)} mL.` };
      exp[`r${h}-out`] = { v: runOut, label: `${hh(h)} running output`, hint: `Previous running output ${fmt(prevOut)} + this hour's output ${fmt(vout)} = ${fmt(runOut)} mL.` };
      exp[`r${h}-bal`] = { v: runIn - runOut, label: `${hh(h)} balance`, hint: `Running intake ${fmt(runIn)} − running output ${fmt(runOut)} = ${signed(runIn - runOut)}.` };
    });
    [...IN, ...OUT].forEach(([k, n]) => {
      const parts = HOURS.filter((h) => sc.data[k][h]).map((h) => fmt(sc.data[k][h]));
      exp[`t-${k}`] = { v: t.col[k], label: `24-hour ${n} total`, hint: parts.length ? `${parts.join(" + ")} = ${fmt(t.col[k])} mL.` : "Nothing was charted in this column, so the total is 0." };
    });
    exp["t-in"] = { v: t.tin, label: "24-hour total intake", hint: IN.map(([k, n]) => `${n} ${fmt(t.col[k])}`).join(" + ") + ` = ${fmt(t.tin)} mL. It should match the last running intake.` };
    exp["t-out"] = { v: t.tout, label: "24-hour total output", hint: OUT.map(([k, n]) => `${n} ${fmt(t.col[k])}`).join(" + ") + ` = ${fmt(t.tout)} mL. It should match the last running output.` };
    exp["t-bal"] = { v: t.bal, label: "24-hour balance", hint: `${fmt(t.tin)} − ${fmt(t.tout)} = ${signed(t.bal)} (${word(t.bal)}).` };
    return { sc, t, exp };
  }

  function parse(raw) {
    const s = String(raw || "").replace(/[,\s]|mL/gi, "").replace(/[−–]/g, "-");
    if (s === "" || s === "-" || s === "+") return null;
    return /^[+-]?\d+$/.test(s) ? Number(s) : NaN;
  }

  function open(id, focus) {
    current = SCENARIOS.find((s) => s.id === id);
    extra = {}; answers = {}; checked = new Set(); reveal = false; spotChoice = null;
    list.querySelectorAll(".ce-case").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
    play.hidden = false;
    renderShell();
    if (focus) play.querySelector("h3").focus();
  }

  function cell(key, extraClass) {
    const a = answers[key] == null ? "" : answers[key];
    const isBal = /bal$/.test(key);
    const sign = isBal ? `<button type="button" class="fb-sign" data-key="${key}" aria-label="Switch plus or minus">±</button>` : "";
    return `<td class="fb-run fb-fill ${extraClass || ""}" data-key="${key}"><span class="fb-cellwrap">${sign}<input type="text" inputmode="numeric" autocomplete="off" enterkeyhint="next" data-key="${key}" value="${esc(a)}" aria-label="" size="6"></span><span class="fb-mark" aria-hidden="true"></span><span class="fb-ans"></span></td>`;
  }

  function renderShell() {
    const limit = current.limit ? `<p class="ce-note"><strong>Fictional limit for this scenario:</strong> ${fmt(current.limit)} mL in 24 hours. This is a made-up number for practice, not a recommendation.</p>` : "";
    play.innerHTML = `
<div class="st-panel">
<p class="ce-when">${current.tag} · 24-hour chart, 08:00 to 07:59</p>
<h3 tabindex="-1" data-no-scroll-effects>${current.name}</h3>
<p>${current.story}</p>${limit}
<fieldset class="st-radios fb-mode"><legend>Mode</legend>
<label><input type="radio" name="fbmode" value="practice"${mode === "practice" ? " checked" : ""}> Practice: fill in the chart</label>
<label><input type="radio" name="fbmode" value="show"${mode === "show" ? " checked" : ""}> Show all totals (worked)</label>
</fieldset>
<p class="st-help fb-practice-only">For each hour, type the Total in (under Intake), the Total out (under Output) and the Running balance straight into the shaded cells. Each total adds this hour onto the one before. Then fill in the 24-hour totals row at the bottom. Use ± to make a balance negative. Don't count anything marked "not measured".</p>
<label class="fb-asyougo fb-practice-only"><input type="checkbox" id="fb-asyougo"${asYouGo ? " checked" : ""}> Check each cell as I go</label>
<div class="fb-wrap" tabindex="-1" role="region" aria-label="Fluid balance chart for ${current.name}. Scroll sideways for more columns." id="fb-wrap"></div>
<div class="st-actions fb-practice-only">
<button class="st-btn" type="button" id="fb-checkall">Check my chart</button>
<button class="st-btn ghost" type="button" id="fb-showans">Show answers</button>
<button class="st-btn ghost" type="button" id="fb-clearans">Clear my entries</button>
</div>
<p class="fb-hint" id="fb-hint" role="status" aria-live="polite"></p>
<p class="ce-chartcap">Blank cells in the fluid columns mean nothing was recorded that hour. Entries marked "not measured" in Notes are not in the totals. The highlighted row is when the "spot the problem" question is asked. On small screens, scroll the chart sideways; the time column stays put.</p>

<details class="st-acc fb-add"><summary>Add your own entry to this chart</summary>
<form id="fb-add" class="fb-addform" autocomplete="off" novalidate>
<label class="st-field"><span>Hour</span><select name="h">${HOURS.map((h) => `<option value="${h}">${hh(h)}</option>`).join("")}</select></label>
<label class="st-field"><span>Column</span><select name="k">${IN.map(([k, n]) => `<option value="${k}">Intake: ${n}</option>`).join("")}${OUT.map(([k, n]) => `<option value="${k}">Output: ${n}</option>`).join("")}</select></label>
<label class="st-field"><span>Volume <small>mL</small></span><input type="number" name="v" inputmode="numeric" min="1" max="5000" step="1"></label>
<div class="st-actions" style="margin-top:0;align-self:end"><button class="st-btn ghost" type="submit">Add entry</button><button class="st-btn ghost" type="button" id="fb-undo">Remove my entries</button></div>
</form><p class="st-status" id="fb-add-status" role="status"></p>
</details>
</div>

<div class="st-panel" style="margin-top:22px">
<h4 class="fb-h">Spot the problem</h4>
<p>${current.problem}</p>
<p><strong>What would you do?</strong></p>
<div class="ce-opts" id="fb-opts">${current.options.map((o, i) => `<button type="button" class="ce-opt" data-i="${i}"><b aria-hidden="true">${"ABCD"[i]}</b><span>${o[0]}</span></button>`).join("")}</div>
<div id="fb-spot" aria-live="polite"></div>
</div>`;

    play.querySelectorAll('input[name="fbmode"]').forEach((r) => r.addEventListener("change", () => { mode = r.value; renderTable(); }));
    $("#fb-asyougo").addEventListener("change", (e) => { asYouGo = e.target.checked; if (asYouGo) Object.keys(answers).forEach((k) => { if (answers[k] !== "") checked.add(k); }); paintMarks(); });
    $("#fb-checkall").addEventListener("click", checkAll);
    $("#fb-showans").addEventListener("click", () => { reveal = true; Object.keys(expected().exp).forEach((k) => checked.add(k)); paintMarks(); summary(); });
    $("#fb-clearans").addEventListener("click", () => { answers = {}; checked = new Set(); reveal = false; renderTable(); $("#fb-hint").textContent = "Your entries were cleared."; });
    $("#fb-add").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target, v = Math.round(Number(f.v.value)), st = $("#fb-add-status");
      if (!(v > 0 && v <= 5000)) { st.textContent = "Enter a volume between 1 and 5000 mL."; return; }
      extra[f.k.value] = extra[f.k.value] || {};
      extra[f.k.value][f.h.value] = (extra[f.k.value][f.h.value] || 0) + v;
      checked = new Set(); reveal = false; renderTable();
      st.textContent = `Added ${fmt(v)} mL at ${hh(Number(f.h.value))}. ` + (mode === "practice" ? "Your typed totals were kept but need checking again." : "Totals updated.");
      f.v.value = "";
    });
    $("#fb-undo").addEventListener("click", () => { extra = {}; checked = new Set(); reveal = false; renderTable(); $("#fb-add-status").textContent = "Your entries were removed."; });
    play.querySelectorAll("#fb-opts .ce-opt").forEach((b) => b.addEventListener("click", () => answer(Number(b.dataset.i))));
    renderTable();
    if (spotChoice != null) answer(spotChoice);
  }

  function renderTable() {
    const { sc, t, exp } = expected();
    const practice = mode === "practice";
    play.querySelector(".st-panel").classList.toggle("fb-is-practice", practice);
    const inCells = (h) => IN.map(([k]) => `<td>${sc.data[k][h] ? fmt(sc.data[k][h]) : ""}</td>`).join("");
    const outCells = (h) => OUT.map(([k], i) => `<td class="${i ? "" : "fb-gap"}">${sc.data[k][h] ? fmt(sc.data[k][h]) : ""}</td>`).join("");
    const shown = (k, cls) => `<td class="fb-run ${cls || ""}">${/bal$/.test(k) ? signed(exp[k].v) : fmt(exp[k].v)}</td>`;
    const rows = HOURS.map((h) => {
      const note = (current.notes || {})[h] || "";
      const flag = h === current.spotAt ? ' class="fb-spot"' : "";
      const b = exp[`r${h}-bal`].v;
      return `<tr${flag}><th scope="row">${hh(h)}</th>${inCells(h)}` +
        (practice ? cell(`r${h}-in`, "fb-tot") : shown(`r${h}-in`, "fb-tot")) + outCells(h) +
        (practice ? cell(`r${h}-out`, "fb-tot") : shown(`r${h}-out`, "fb-tot")) +
        (practice ? cell(`r${h}-bal`, "fb-gap fb-balcol") : `<td class="fb-run fb-gap fb-balcol fb-bal ${word(b)}">${signed(b)}</td>`) +
        `<td class="fb-note">${note}</td></tr>`;
    }).join("");
    const ft = (k, cls) => practice ? cell(k, cls) : `<td class="${cls}">${fmt(k === "t-in" ? t.tin : k === "t-out" ? t.tout : t.col[k.slice(2)])}</td>`;
    const foot = IN.map(([k]) => ft(`t-${k}`, "")).join("") + ft("t-in", "fb-run fb-tot") +
      OUT.map(([k], i) => ft(`t-${k}`, i ? "" : "fb-gap")).join("") + ft("t-out", "fb-run fb-tot") +
      (practice ? cell("t-bal", "fb-gap fb-balcol") : `<td class="fb-run fb-gap fb-balcol fb-bal ${word(t.bal)}">${signed(t.bal)} (${word(t.bal)})</td>`);
    const head = `<tr><th scope="col" rowspan="2" class="fb-timehead">Time</th><th scope="colgroup" colspan="${IN.length + 1}">Intake (mL)</th><th scope="colgroup" colspan="${OUT.length + 1}" class="fb-gap">Output (mL)</th><th scope="col" rowspan="2" class="fb-gap fb-balcol">Running balance<br><small>in − out</small></th><th scope="col" rowspan="2">Notes</th></tr>` +
      `<tr>${IN.map(([, n]) => `<th scope="col">${n}</th>`).join("")}<th scope="col" class="fb-tot">Total in<br><small>running</small></th>${OUT.map(([, n], i) => `<th scope="col" class="${i ? "" : "fb-gap"}">${n}</th>`).join("")}<th scope="col" class="fb-tot">Total out<br><small>running</small></th></tr>`;
    const wrap = $("#fb-wrap");
    wrap.innerHTML = `<table class="fb-table${practice ? " fb-practice" : ""}"><caption class="ce-sr">24-hour fluid balance chart. Volumes in mL. Fictional.${practice ? " Running total cells are editable." : ""}</caption><thead>${head}</thead><tbody>${rows}</tbody><tfoot><tr><th scope="row">24-hour totals</th>${foot}<td></td></tr></tfoot></table>`;
    // Second header row sticks directly under the first, whatever its height.
    const r1 = wrap.querySelector("thead tr"), setTop = () => wrap.querySelectorAll("thead tr:nth-child(2) th").forEach((th) => { th.style.top = r1.getBoundingClientRect().height + "px"; });
    setTop(); if (!window.__fbResize) { window.__fbResize = true; addEventListener("resize", () => { const r = document.querySelector("#fb-wrap thead tr"); if (r) document.querySelectorAll("#fb-wrap thead tr:nth-child(2) th").forEach((th) => { th.style.top = r.getBoundingClientRect().height + "px"; }); }); }
    wrap.querySelectorAll("input[data-key]").forEach((inp) => {
      const k = inp.dataset.key;
      inp.setAttribute("aria-label", exp[k].label + " in mL");
      inp.addEventListener("input", () => { answers[k] = inp.value; if (!asYouGo) { checked.delete(k); paintCell(k, exp); } });
      inp.addEventListener("change", () => { if (asYouGo && inp.value.trim() !== "") { checked.add(k); paintCell(k, exp); summary(); } });
      inp.addEventListener("focus", () => hintFor(k, exp));
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); const all = [...wrap.querySelectorAll("input[data-key]")]; const n = all[all.indexOf(inp) + 1]; if (n) n.focus(); } });
    });
    wrap.querySelectorAll(".fb-sign").forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.key, inp = wrap.querySelector(`input[data-key="${k}"]`);
      const v = inp.value.trim().replace(/^[−–]/, "-");
      inp.value = v.startsWith("-") ? v.slice(1) : "-" + v.replace(/^\+/, "");
      answers[k] = inp.value; if (asYouGo && parse(inp.value) != null) checked.add(k); else if (!asYouGo) checked.delete(k);
      paintCell(k, exp); inp.focus();
    }));
    paintMarks();
  }

  function paintCell(k, exp) {
    const td = play.querySelector(`td[data-key="${k}"]`);
    if (!td) return;
    const mark = td.querySelector(".fb-mark"), ans = td.querySelector(".fb-ans");
    td.classList.remove("ok", "bad", "empty");
    mark.textContent = ""; ans.textContent = "";
    if (!checked.has(k)) return;
    const val = parse(answers[k]);
    const isBal = /bal$/.test(k);
    const right = exp[k].v === val || (isBal && val === 0 && exp[k].v === 0);
    if (val === null) { if (reveal) { td.classList.add("empty"); ans.textContent = "= " + (isBal ? signed(exp[k].v) : fmt(exp[k].v)); } return; }
    td.classList.add(right ? "ok" : "bad");
    mark.textContent = right ? "✓" : "✗";
    td.querySelector("input").setAttribute("aria-invalid", right ? "false" : "true");
    if (!right && reveal) ans.textContent = "= " + (isBal ? signed(exp[k].v) : fmt(exp[k].v));
  }
  function paintMarks() { const { exp } = expected(); Object.keys(exp).forEach((k) => paintCell(k, exp)); }

  function hintFor(k, exp) {
    const h = $("#fb-hint"); if (!h) return;
    const td = play.querySelector(`td[data-key="${k}"]`);
    if (td && td.classList.contains("bad")) h.innerHTML = `<strong>✗ ${exp[k].label}:</strong> not quite. ${exp[k].hint}`;
    else if (td && td.classList.contains("ok")) h.innerHTML = `<strong>✓ ${exp[k].label}:</strong> correct.`;
    else if (reveal) h.innerHTML = `<strong>${exp[k].label}:</strong> ${exp[k].hint}`;
    else h.textContent = "";
  }

  function checkAll() {
    const { exp } = expected();
    Object.keys(exp).forEach((k) => checked.add(k));
    paintMarks();
    summary(true);
  }
  function summary(focusFirst) {
    const { exp, t } = expected();
    const keys = Object.keys(exp);
    let ok = 0, bad = 0, empty = 0;
    keys.forEach((k) => { if (!checked.has(k)) return; const v = parse(answers[k]); if (v === null) empty++; else if (v === exp[k].v) ok++; else bad++; });
    const h = $("#fb-hint");
    let msg = `<strong>${ok} of ${keys.length} cells correct.</strong> ${bad ? bad + " to fix (marked ✗). Tap a ✗ cell for a hint." : ""} ${empty && !reveal ? empty + " still blank." : ""}`;
    if (ok === keys.length) msg = `<strong>✓ All ${keys.length} cells correct.</strong> 24-hour balance ${signed(t.bal)} (${word(t.bal)}). Now look at the trend and try the spot-the-problem question.`;
    if (reveal) msg += " Answers are shown in the cells.";
    // Sign slip: the student's 24-hour balance is the right size but the wrong sign.
    const tb = parse(answers["t-bal"]);
    if (tb !== null && tb === -t.bal && t.bal !== 0) msg += ` <strong>Check your sign:</strong> balance is intake minus output, so it's ${word(t.bal)} here.`;
    h.innerHTML = msg;
    if (focusFirst) { const first = play.querySelector("td.bad"); if (first) first.scrollIntoView({ block: "nearest", inline: "nearest" }); }
  }

  function answer(i) {
    spotChoice = i;
    const opts = play.querySelectorAll("#fb-opts .ce-opt");
    opts.forEach((b, j) => { b.disabled = true; b.classList.toggle("chosen", j === i); b.classList.toggle("best", j === current.best); });
    const o = current.options[i];
    $("#fb-spot").innerHTML = `<div class="ce-fb"><h4>${i === current.best ? "Best choice." : "Not the best choice."}</h4>` +
      (o[1] ? `<p>${o[1]}</p>` : "") + `<p>${current.explain}</p>` +
      `<button type="button" class="st-btn ghost small" id="fb-retry">Try this question again</button></div>`;
    $("#fb-retry").addEventListener("click", () => { spotChoice = null; opts.forEach((b) => { b.disabled = false; b.classList.remove("chosen", "best"); }); $("#fb-spot").innerHTML = ""; opts[0].focus(); });
  }
})();
