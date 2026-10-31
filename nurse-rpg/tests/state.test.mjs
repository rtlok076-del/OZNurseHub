import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  fresh,
  restore,
  choose,
  route,
  advanceChapter,
  resolveEvent,
} from "../js/state.js";
import { grid } from "../js/world.js";
const quest = JSON.parse(
  await readFile(new URL("../data/quests/identity.json", import.meta.url)),
);
const world = JSON.parse(
  await readFile(new URL("../data/world.json", import.meta.url)),
);
const campaign = await Promise.all(
  ["identity", "isbar", "deterioration"].map(async (id) =>
    JSON.parse(
      await readFile(
        new URL("../data/quests/" + id + ".json", import.meta.url),
      ),
    ),
  ),
);
test("all three chapters have recoverable branches and one-time persistent rewards", () => {
  const s = fresh();
  assert.equal(advanceChapter(s), false);
  for (const q of campaign) {
    for (const [key, n] of Object.entries(q.nodes)) {
      const seen = new Set(),
        queue = [key];
      let reachesEnd = false;
      while (queue.length) {
        const id = queue.shift();
        if (seen.has(id)) continue;
        seen.add(id);
        const next = q.nodes[id];
        assert.ok(next);
        reachesEnd ||= Boolean(next.complete);
        queue.push(...next.choices.map((c) => c.next));
      }
      assert.ok(reachesEnd, q.id + ":" + key);
    }
    s.node = "start";
    let steps = 0;
    while (!s.completed) {
      const choices = q.nodes[s.node].choices;
      assert.equal(
        choose(
          s,
          q,
          choices.findIndex((c) => c.correct !== false),
        ),
        true,
      );
      assert.ok(++steps < 40);
    }
    const xp = s.xp;
    assert.equal(choose(s, q, 0), false);
    assert.equal(s.xp, xp);
    assert.deepEqual(restore(JSON.stringify(s)), s);
    if (s.chapter < 3) assert.equal(advanceChapter(s), true);
  }
  assert.equal(s.xp, 370);
  assert.equal(advanceChapter(s), false);
  for (const event of ["listening", "supplies", "runes"]) {
    assert.equal(resolveEvent(s, event, "choice"), true);
    assert.equal(resolveEvent(s, event, "again"), false);
  }
  assert.equal(s.xp, 445);
  assert.equal(restore(JSON.stringify(s)).xp, 445);
});
test("M1 save migrates without losing first quest completion", () => {
  const migrated = restore(
    JSON.stringify({
      version: 1,
      completed: true,
      xp: 100,
      intro: 3,
      accepted: true,
    }),
  );
  assert.deepEqual(migrated.completedQuests, ["identity"]);
  assert.equal(migrated.chapter, 1);
  assert.equal(advanceChapter(migrated), true);
  assert.equal(migrated.chapter, 2);
  assert.equal(migrated.completed, false);
});
test("all dialogue branches resolve and completion is reachable", () => {
  for (const n of Object.values(quest.nodes))
    for (const c of n.choices) assert.ok(quest.nodes[c.next]);
  for (const start of Object.keys(quest.nodes)) {
    const visited = new Set(),
      q = [start];
    let completed = false;
    while (q.length) {
      const key = q.shift();
      if (visited.has(key)) continue;
      visited.add(key);
      const n = quest.nodes[key];
      completed ||= !!n.complete;
      q.push(...n.choices.map((c) => c.next));
    }
    assert.ok(completed, start);
  }
});
test("unsafe route teaches recovery and awards experience only once", () => {
  const s = fresh();
  s.node = "start";
  for (const i of [1, 0, 1, 0, 1, 0, 1, 0, 0])
    assert.equal(choose(s, quest, i), true);
  assert.equal(s.completed, true);
  assert.equal(s.xp, 100);
  assert.equal(s.mistakes, 4);
  assert.equal(choose(s, quest, 0), false);
  assert.equal(s.xp, 100);
});
test("save restores progress while rejecting invalid data", () => {
  assert.deepEqual(restore("bad"), fresh());
  assert.deepEqual(restore('{"version":2}'), fresh());
  const s = fresh();
  s.node = "compare";
  s.metGuide = true;
  s.position = { x: 5, y: 5 };
  assert.deepEqual(restore(JSON.stringify(s)), s);
  assert.equal(restore('{"version":1,"xp":99999,"completed":false}').xp, 0);
});
test("all destinations connect without crossing walls", () => {
  for (const start of [fresh().position, ...world.npcs.map((n) => n.stand)])
    for (const n of world.npcs) {
      const path = route(grid, start, n.stand);
      assert.ok(
        path.length || (start.x === n.stand.x && start.y === n.stand.y),
      );
      let previous = start;
      for (const p of path) {
        assert.equal(grid[p.y][p.x], 0);
        assert.equal(
          Math.abs(p.x - previous.x) + Math.abs(p.y - previous.y),
          1,
        );
        previous = p;
      }
    }
});
