export const KEY = "project-ward.save.v1";
export const fresh = () => ({
  version: 1,
  accepted: false,
  intro: 0,
  metGuide: false,
  node: null,
  completed: false,
  xp: 0,
  mistakes: 0,
  muted: true,
  position: { x: 11, y: 13 },
  chapter: 1,
  completedQuests: [],
  events: {},
  affinity: "",
  chapterMistakes: {},
  bonds: [],
});
export function restore(raw) {
  try {
    const v = JSON.parse(raw);
    if (v?.version !== 1) return fresh();
    const s = fresh();
    for (const key of ["accepted", "metGuide", "completed", "muted"])
      if (typeof v[key] === "boolean") s[key] = v[key];
    s.intro = Number.isInteger(v.intro) ? Math.min(3, Math.max(0, v.intro)) : 0;
    s.node = typeof v.node === "string" ? v.node : null;
    s.mistakes = Number.isInteger(v.mistakes) ? Math.max(0, v.mistakes) : 0;
    s.chapter = [1, 2, 3].includes(v.chapter) ? v.chapter : 1;
    s.completedQuests = Array.isArray(v.completedQuests)
      ? ["identity", "isbar", "deterioration"].filter((id) =>
          v.completedQuests.includes(id),
        )
      : s.completed
        ? ["identity"]
        : [];
    s.completed = s.completedQuests.includes(
      ["identity", "isbar", "deterioration"][s.chapter - 1],
    );
    for (const id of ["listening", "supplies", "runes"])
      if (typeof v.events?.[id] === "string") s.events[id] = v.events[id];
    s.affinity = ["Listener", "Pathfinder"].includes(v.affinity)
      ? v.affinity
      : "";
    for (const id of ["identity", "isbar", "deterioration"])
      if (Number.isInteger(v.chapterMistakes?.[id]))
        s.chapterMistakes[id] = Math.max(0, v.chapterMistakes[id]);
    s.bonds = Array.isArray(v.bonds)
      ? ["sam", "other", "rest", "tavi"].filter((id) => v.bonds.includes(id))
      : [];
    s.xp =
      s.completedQuests.reduce(
        (sum, id) =>
          sum + { identity: 100, isbar: 120, deterioration: 150 }[id],
        0,
      ) +
      Object.keys(s.events).length * 25 +
      s.bonds.length * 10;
    if (
      Number.isInteger(v.position?.x) &&
      Number.isInteger(v.position?.y) &&
      v.position.x > 0 &&
      v.position.x < 23 &&
      v.position.y > 0 &&
      v.position.y < 15
    )
      s.position = v.position;
    return s;
  } catch {
    return fresh();
  }
}
export function choose(state, quest, index) {
  const node = quest.nodes[state.node];
  const option = node?.choices[index];
  if (!option || state.completed) return false;
  if (option.correct === false) {
    state.mistakes++;
    state.chapterMistakes[quest.id] =
      (state.chapterMistakes[quest.id] || 0) + 1;
  }
  state.node = option.next;
  if (quest.nodes[state.node]?.complete) {
    state.completed = true;
    if (!state.completedQuests.includes(quest.id)) {
      state.completedQuests.push(quest.id);
      state.xp += quest.xp;
    }
  }
  return true;
}
export function advanceChapter(state) {
  if (!state.completed || state.chapter >= 3) return false;
  state.chapter++;
  state.completed = false;
  state.node = null;
  state.metGuide = false;
  return true;
}
export function resolveEvent(state, id, choice) {
  if (!["listening", "supplies", "runes"].includes(id) || state.events[id])
    return false;
  state.events[id] = choice;
  state.xp += 25;
  return true;
}
export function route(grid, start, end) {
  const queue = [start],
    seen = new Set([`${start.x},${start.y}`]),
    parent = new Map();
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (p.x === end.x && p.y === end.y) {
      const path = [];
      let key = `${p.x},${p.y}`;
      while (parent.has(key)) {
        const [x, y] = key.split(",").map(Number);
        path.unshift({ x, y });
        key = parent.get(key);
      }
      return path;
    }
    for (const [dx, dy] of [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ]) {
      const q = { x: p.x + dx, y: p.y + dy },
        key = `${q.x},${q.y}`;
      if (grid[q.y]?.[q.x] === 0 && !seen.has(key)) {
        seen.add(key);
        parent.set(key, `${p.x},${p.y}`);
        queue.push(q);
      }
    }
  }
  return [];
}
