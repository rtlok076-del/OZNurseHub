import { route } from "./state.js";
export const grid = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 24 }, (_, x) =>
    x === 0 || y === 0 || x === 23 || y === 15 ? 1 : 0,
  ),
);
for (let x = 1; x < 23; x++) {
  if (![5, 12, 18].includes(x)) grid[7][x] = 1;
  if (![5, 12, 18].includes(x)) grid[9][x] = 1;
}
for (const x of [8, 15])
  for (const y of [1, 2, 3, 4, 5, 6, 10, 11, 12, 13, 14]) grid[y][x] = 1;
for (const [x, y] of [
  [3, 3],
  [4, 3],
  [10, 3],
  [11, 3],
  [3, 11],
  [4, 11],
  [10, 11],
  [11, 11],
  [18, 3],
  [19, 3],
  [20, 3],
  [19, 11],
  [20, 11],
])
  grid[y][x] = 1;
export function createWorld(data, state, hooks) {
  class Ward extends Phaser.Scene {
    create() {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x40515a);
      g.fillRect(0, 0, 32, 32);
      g.lineStyle(1, 0x4b5d64);
      g.strokeRect(0, 0, 32, 32);
      g.fillStyle(0x3b4c55);
      g.fillRect(3, 3, 2, 2);
      g.fillStyle(0x263443);
      g.fillRect(32, 0, 32, 32);
      g.fillStyle(0x58616a);
      g.fillRect(32, 0, 32, 8);
      g.fillStyle(0x34424f);
      g.fillRect(34, 9, 28, 19);
      g.generateTexture("tiles", 64, 32);
      g.destroy();
      const map = this.make.tilemap({
        data: grid,
        tileWidth: 32,
        tileHeight: 32,
      });
      const tiles = map.addTilesetImage("tiles", "tiles", 32, 32, 0, 0);
      map.createLayer(0, tiles, 0, 0);
      this.add.rectangle(384, 272, 704, 28, 0x71684f, 0.45);
      for (let x = 64; x < 730; x += 64)
        this.add.rectangle(x, 272, 4, 4, 0xd6bd77, 0.6);
      const a = this.add.graphics();
      const bed = (x, y) => {
        a.fillStyle(0x172331);
        a.fillRect(x - 4, y + 6, 64, 68);
        a.fillStyle(0x9a8667);
        a.fillRect(x, y, 56, 65);
        a.fillStyle(0xd6d6c1);
        a.fillRect(x + 4, y + 4, 48, 53);
        a.fillStyle(0xf1ebd5);
        a.fillRect(x + 8, y + 6, 40, 15);
        a.fillStyle(0x6c9d9c);
        a.fillRect(x + 4, y + 27, 48, 30);
        a.fillStyle(0x91b9ac);
        a.fillRect(x + 6, y + 28, 44, 6);
        a.fillStyle(0x46535b);
        a.fillRect(x, y + 59, 56, 6);
      };
      for (const [x, y] of [
        [90, 82],
        [314, 82],
        [90, 338],
        [314, 338],
      ])
        bed(x, y);
      a.fillStyle(0x24313c);
      a.fillRect(540, 92, 152, 45);
      a.fillStyle(0x9b7754);
      a.fillRect(540, 84, 152, 38);
      a.fillStyle(0xc2a174);
      a.fillRect(540, 84, 152, 7);
      a.fillStyle(0xddd9bd);
      a.fillRect(573, 94, 22, 15);
      a.fillStyle(0x476971);
      a.fillRect(640, 92, 29, 20);
      a.fillStyle(0x8a7255);
      a.fillRect(603, 328, 65, 49);
      a.fillStyle(0xb8a884);
      a.fillRect(607, 332, 57, 12);
      a.fillStyle(0x455b61);
      a.fillRect(610, 349, 51, 24);
      a.fillStyle(0xd1c6a1);
      a.fillRect(631, 355, 8, 8);
      for (const x of [64, 288, 544, 672]) {
        a.fillStyle(0x233b53);
        a.fillRect(x, 7, 48, 22);
        a.fillStyle(0x9ccbc6);
        a.fillRect(x + 4, 8, 18, 15);
        a.fillRect(x + 26, 8, 18, 15);
      }
      for (const [x, y] of [
        [48, 208],
        [240, 208],
        [496, 208],
        [720, 208],
        [48, 464],
        [720, 464],
      ]) {
        this.add.circle(x, y, 18, 0xf5cb75, 0.08);
        this.add.circle(x, y, 10, 0xf5cb75, 0.13);
        this.add.rectangle(x, y, 6, 11, 0xf3ce84);
      }
      const label = (x, y, text) =>
        this.add
          .text(x, y, text, {
            fontFamily: "monospace",
            fontSize: "11px",
            color: "#ede5cc",
            backgroundColor: "#263440",
            padding: { x: 5, y: 3 },
          })
          .setOrigin(0.5);
      label(144, 53, "01 · SAM");
      label(368, 53, "02 · SAM");
      label(607, 53, "NURSES’ STATION");
      label(144, 437, "03 · REST");
      label(368, 437, "04 · REST");
      label(621, 437, "MED ROOM");
      this.questLight = this.add.circle(
        144,
        45,
        38,
        0xf7d58b,
        state.completed ? 0.18 : 0,
      );
      this.portal = this.add.ellipse(368, 444, 38, 16, 0x9ac4fb, 0.3);
      this.add.ellipse(368, 444, 28, 10, 0xc8e1ff, 0.6);
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
        this.tweens.add({
          targets: this.portal,
          alpha: 0.15,
          scaleX: 1.2,
          duration: 1800,
          yoyo: true,
          repeat: -1,
        });
      const character = (key, coat, hair) => {
        const q = this.make.graphics({ add: false });
        q.fillStyle(0x14202b, 0.5);
        q.fillEllipse(16, 29, 23, 7);
        q.fillStyle(0x26313d);
        q.fillRect(9, 23, 5, 6);
        q.fillRect(18, 23, 5, 6);
        q.fillStyle(coat);
        q.fillRect(7, 13, 19, 12);
        q.fillStyle(0xdbaf8d);
        q.fillRect(11, 6, 13, 11);
        q.fillRect(5, 16, 3, 7);
        q.fillRect(26, 16, 3, 7);
        q.fillStyle(hair);
        q.fillRect(10, 3, 15, 6);
        q.fillRect(9, 6, 4, 6);
        q.fillStyle(0x25313c);
        q.fillRect(21, 10, 2, 2);
        q.fillStyle(0xe5dfc4);
        q.fillRect(19, 17, 3, 4);
        q.generateTexture(key, 32, 32);
        q.destroy();
      };
      character("player", 0x74b6b1, 0x43332f);
      character("sage", 0x9d93b9, 0xc7c9be);
      character("patient", 0xb3c5be, 0x54413c);
      for (const npc of data.npcs) {
        if (npc.color === "cabinet") continue;
        this.add.image(
          npc.x * 32 + 16,
          npc.y * 32 + 16,
          npc.color === "sage" ? "sage" : "patient",
        );
        if (npc.id === "rowan" || npc.id === "sam")
          label(
            npc.x * 32 + 16,
            npc.y * 32 - 8,
            npc.id === "rowan" ? "ROWAN ✦" : "SAM",
          );
      }
      if (grid[state.position.y]?.[state.position.x] !== 0)
        state.position = { x: 11, y: 13 };
      this.player = this.add
        .image(state.position.x * 32 + 16, state.position.y * 32 + 16, "player")
        .setDepth(20);
      this.ring = this.add
        .ellipse(this.player.x, this.player.y + 13, 26, 9)
        .setStrokeStyle(1, 0xf7d58b)
        .setDepth(19);
      this.path = [];
      this.lastMove = 0;
      this.ready = true;
      this.pressed = new Set();
      const mapElement = document.querySelector("#world");
      const keydown = (event) => {
        if (document.activeElement !== mapElement || hooks.blocked()) return;
        if (
          [
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
            "w",
            "a",
            "s",
            "d",
            "W",
            "A",
            "S",
            "D",
          ].includes(event.key)
        ) {
          event.preventDefault();
          this.pressed.add(event.key.toLowerCase());
        }
        if (event.key === "Enter" && !event.repeat) hooks.interact();
      };
      const keyup = (event) => this.pressed.delete(event.key.toLowerCase());
      const clear = () => this.pressed.clear();
      document.addEventListener("keydown", keydown);
      document.addEventListener("keyup", keyup);
      mapElement.addEventListener("blur", clear);
      window.addEventListener("blur", clear);
      this.events.once("shutdown", () => {
        document.removeEventListener("keydown", keydown);
        document.removeEventListener("keyup", keyup);
        mapElement.removeEventListener("blur", clear);
        window.removeEventListener("blur", clear);
      });
      this.input.on("pointerdown", (p) => {
        if (hooks.blocked()) return;
        document.querySelector("#world").focus({ preventScroll: true });
        const tile = { x: Math.floor(p.x / 32), y: Math.floor(p.y / 32) };
        const npc = data.npcs.find(
          (n) => Math.abs(n.x - tile.x) <= 1 && Math.abs(n.y - tile.y) <= 1,
        );
        this.walk(npc?.stand || tile, npc?.id);
      });
      hooks.ready(this);
      this.report();
    }
    walk(end, npc) {
      if (hooks.blocked()) return;
      this.path = route(grid, state.position, end);
      this.arrival = npc;
      if (
        !this.path.length &&
        state.position.x === end.x &&
        state.position.y === end.y
      ) {
        this.report();
        if (npc) hooks.interact(npc);
      }
    }
    report() {
      const nearby = data.npcs.find(
        (n) =>
          Math.abs(n.stand.x - state.position.x) +
            Math.abs(n.stand.y - state.position.y) <=
          1,
      );
      hooks.position(nearby);
    }
    update(t) {
      if (!this.ready) return;
      this.questLight.setAlpha(state.completed ? 0.18 : 0);
      if (hooks.blocked() || t - this.lastMove < 125) return;
      let next;
      const focused =
        document.activeElement === document.querySelector("#world");
      if (focused) {
        let dx =
            (this.pressed.has("d") || this.pressed.has("arrowright") ? 1 : 0) -
            (this.pressed.has("a") || this.pressed.has("arrowleft") ? 1 : 0),
          dy =
            (this.pressed.has("s") || this.pressed.has("arrowdown") ? 1 : 0) -
            (this.pressed.has("w") || this.pressed.has("arrowup") ? 1 : 0);
        if (dx || dy) {
          this.path = [];
          this.arrival = null;
          next = {
            x: state.position.x + dx,
            y: state.position.y + (dx ? 0 : dy),
          };
        }
      }
      next ||= this.path.shift();
      if (!next) return;
      this.lastMove = t;
      if (grid[next.y]?.[next.x] !== 0) return;
      state.position = next;
      this.player.setPosition(next.x * 32 + 16, next.y * 32 + 16);
      this.ring.setPosition(this.player.x, this.player.y + 13);
      this.report();
      if (!this.path.length && this.arrival) {
        const id = this.arrival;
        this.arrival = null;
        hooks.interact(id);
      }
    }
  }
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: "world",
    width: 768,
    height: 512,
    pixelArt: true,
    backgroundColor: "#152330",
    scene: Ward,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    audio: { noAudio: true },
    input: { keyboard: true },
    banner: false,
  });
}
