const { chromium } = require("playwright");
const fs = require("fs");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({ channel: "msedge", headless: true });
  const p = await b.newPage({
    colorScheme: "dark",
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  for (const f of fs
    .readdirSync(".")
    .filter((f) => f.endsWith(".html") && !f.startsWith("google"))) {
    await p.goto("http://127.0.0.1:8765/" + f);
    const out = await p.evaluate(() => {
      const seen = new Set(),
        out = [];
      const rgb = (s) => s.match(/[\d.]+/g)?.map(Number);
      const lum = (c) =>
        c
          .slice(0, 3)
          .map((v) => v / 255)
          .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
          .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
      for (const el of document.querySelectorAll("body *")) {
        if (
          ![...el.childNodes].some(
            (n) => n.nodeType === 3 && n.textContent.trim(),
          )
        )
          continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const s = getComputedStyle(el);
        let bg = null,
          n = el;
        while (n) {
          const ns = getComputedStyle(n);
          const c = rgb(ns.backgroundColor);
          if (ns.backgroundImage !== "none") {
            bg = null;
            break;
          }
          if (c && (c.length === 3 || c[3] === 1)) {
            bg = c;
            break;
          }
          n = n.parentElement;
        }
        if (!bg) continue;
        const fg = rgb(s.color);
        if (!fg) continue;
        let ratio =
          (Math.max(lum(bg), lum(fg)) + 0.05) /
          (Math.min(lum(bg), lum(fg)) + 0.05);
        const key =
          el.tagName +
          "." +
          el.className +
          " " +
          s.color +
          " on " +
          bg.join(",");
        if (ratio < 4.5 && !seen.has(key)) {
          seen.add(key);
          out.push({
            selector: key,
            ratio: ratio.toFixed(1),
            text: el.textContent.trim().slice(0, 45),
          });
        }
      }
      return out;
    });
    assert.deepEqual(out, [], f + " text contrast");
    console.log("PASS contrast", f);
  }
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
