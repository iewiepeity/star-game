import * as Phaser from "../../assets/vendor/phaser.esm.min.js";
import { ROOMS, WORLD, PEOPLE, itinerary } from "./data.js";
import { buildGrid, findPath, nearest, walkable } from "./navigation.js";
import { importSprites, actorFrame } from "./sprites.js";
const SPRITES = [
  "raven-newcomer",
  "raven-practice",
  "raven-audition",
  "jiqing",
  "sufei",
];
export function createWorld(controller) {
  class PixelWorld extends Phaser.Scene {
    constructor() {
      super("PixelWorld");
      this.actors = new Map();
      this.manualPan = false;
      this.zoomFactor = 1;
      this.heldNpc = null;
      this.keys = new Set();
    }
    preload() {
      this.load.on("progress", (value) =>
        controller.loading(Math.round(value * 100)),
      );
      this.load.on("loaderror", (file) => controller.loadError(file.key));
      for (const id of Object.keys(ROOMS))
        this.load.image(`room-${id}`, `assets/pixel/${id}.png`);
      for (const id of SPRITES)
        this.load.image(`raw-${id}`, `assets/pixel/${id}.png`);
    }
    create() {
      try {
        for (const key of SPRITES) importSprites(this, key);
      } catch (e) {
        controller.loadError(e.message);
        return;
      }
      this.loadRoom();
      this.bindInput();
      this.scale.on("resize", () => this.resizeView());
      controller.ready(this);
    }
    get paused() {
      return controller.paused() || document.hidden;
    }
    loadRoom() {
      this.children.removeAll(true);
      this.actors.clear();
      this.heldNpc = null;
      this.pending = null;
      this.keys.clear();
      const state = controller.state();
      this.room = ROOMS[state.sceneId];
      this.grid = buildGrid(this.room);
      this.add
        .image(0, 0, `room-${state.sceneId}`)
        .setOrigin(0)
        .setDisplaySize(WORLD.width, WORLD.height)
        .setDepth(-10);
      for (const f of this.room.foreground) {
        const mask = this.make.graphics({ x: 0, y: 0, add: false });
        mask.fillStyle(0xffffff).fillPoints(f.polygon, true);
        this.add
          .image(0, 0, `room-${state.sceneId}`)
          .setOrigin(0)
          .setDisplaySize(WORLD.width, WORLD.height)
          .setDepth(f.depth * 0.625)
          .setMask(mask.createGeometryMask());
        this.events.once("room-clear", () => mask.destroy());
      }
      const pos = walkable(this.room, state.position)
        ? state.position
        : nearest(this.grid, this.room.entry);
      this.player = this.addActor("player", `raven-${state.outfitId}`, pos);
      this.player.shadow.setStrokeStyle(1, 0xad7580, 0.5);
      this.targetRing = this.add
        .ellipse(0, 0, 18, 9)
        .setStrokeStyle(2, 0xac6876, 0.9)
        .setVisible(false)
        .setDepth(950);
      this.hotspots = [];
      for (const item of this.room.objects) {
        const circle = this.add
          .circle(item.x, item.y, 13, 0xfffaf1, 0.96)
          .setStrokeStyle(1, 0xb99b7c)
          .setDepth(1000);
        const label = this.add
          .text(item.x, item.y, item.icon, {
            fontFamily: "serif",
            fontSize: "17px",
            color: "#976672",
          })
          .setOrigin(0.5)
          .setDepth(1001);
        const title = this.add
          .text(item.x, item.y - 29, item.name, {
            fontFamily: "sans-serif",
            fontSize: "12px",
            color: "#584b3d",
            backgroundColor: "#fffaf1",
            padding: { x: 8, y: 5 },
          })
          .setOrigin(0.5)
          .setDepth(1300)
          .setVisible(false);
        circle
          .setInteractive(
            new Phaser.Geom.Circle(13, 13, 24),
            Phaser.Geom.Circle.Contains,
          )
          .on("pointerover", () => title.setVisible(true))
          .on("pointerout", () => title.setVisible(false));
        this.hotspots.push({ item, circle, label, title });
      }
      this.manualPan = false;
      this.resizeView();
      this.syncNpcs(true);
      controller.changed();
    }
    addActor(id, key, pos) {
      const actor = {
        id,
        key,
        x: pos.x,
        y: pos.y,
        facing: 0,
        path: [],
        routeKey: null,
      };
      actor.shadow = this.add.ellipse(
        pos.x,
        pos.y,
        25,
        10,
        id === "player" ? 0x886456 : 0x655843,
        0.16,
      );
      actor.sprite = this.add.sprite(pos.x, pos.y, key, "0-0");
      if (id !== "player")
        actor.label = this.add
          .text(pos.x, pos.y - 75, PEOPLE[id].name, {
            fontFamily: "sans-serif",
            fontSize: "12px",
            color: "#695246",
            backgroundColor: "#fffaf1",
            padding: { x: 6, y: 3 },
          })
          .setOrigin(0.5)
          .setResolution(2);
      this.actors.set(id, actor);
      actorFrame(actor, false, 0);
      return actor;
    }
    removeActor(actor) {
      actor.sprite.destroy();
      actor.shadow.destroy();
      actor.label?.destroy();
      this.actors.delete(actor.id);
    }
    syncNpcs(first = false) {
      for (const id of Object.keys(PEOPLE)) {
        const plan = itinerary(id, controller.state().elapsed);
        let actor = this.actors.get(id);
        if (this.heldNpc === id) continue;
        if (plan.scene !== controller.state().sceneId) {
          if (actor) {
            actor.exiting = true;
            actor.path = findPath(this.grid, actor, this.room.entry);
            if (
              Math.hypot(
                actor.x - this.room.entry.x,
                actor.y - this.room.entry.y,
              ) < 20
            )
              this.removeActor(actor);
          }
          continue;
        }
        if (!actor) {
          const saved = controller.state().npcPositions[id];
          const start =
            first &&
            saved?.sceneId === controller.state().sceneId &&
            walkable(this.room, saved)
              ? saved
              : nearest(
                  this.grid,
                  first ? this.room.route[plan.node] : this.room.entry,
                );
          actor = this.addActor(id, id, start);
        }
        const routeKey = `${plan.node}-${plan.leaving}`;
        if (actor.routeKey !== routeKey) {
          actor.routeKey = routeKey;
          actor.path = findPath(
            this.grid,
            actor,
            plan.leaving ? this.room.entry : this.room.route[plan.node],
          );
        }
        actor.status = plan.status;
        actor.exiting = false;
        actor.label.setText(
          `${PEOPLE[id].name} · ${actor.path.length ? "走動中" : plan.status}`,
        );
      }
    }
    go(point, callback) {
      if (this.paused) {
        controller.toast("先關閉視窗或繼續世界，再走動吧");
        return;
      }
      this.releaseNpc();
      this.pending = callback || null;
      this.player.path = findPath(this.grid, this.player, point);
      this.manualPan = false;
      const last = this.player.path.at(-1) || this.player;
      this.targetRing.setPosition(last.x, last.y).setVisible(true);
      if (!this.player.path.length) this.arrive();
    }
    interact(id) {
      const item = this.room.objects.find((o) => o.id === id);
      if (!item) return;
      this.go(item.target, () => controller.interact(item));
      controller.toast(`走向${item.name}`);
    }
    talk(id) {
      const actor = this.actors.get(id);
      if (!actor || actor.exiting) {
        controller.toast("她剛離開，晚一點再碰面吧");
        return;
      }
      this.go(nearest(this.grid, { x: actor.x + 30, y: actor.y + 14 }), () =>
        controller.talk(id),
      );
      this.heldNpc = id;
      actor.path = [];
    }
    arrive() {
      this.targetRing.setVisible(false);
      const fn = this.pending;
      this.pending = null;
      controller.checkpoint();
      fn?.();
    }
    releaseNpc() {
      this.heldNpc = null;
      for (const actor of this.actors.values()) actor.routeKey = null;
    }
    setOutfit(id) {
      this.player.key = `raven-${id}`;
      actorFrame(this.player, false, 0);
    }
    transition(id) {
      this.go(this.room.objects.find((o) => o.id === "door").target, () => {
        controller.transitioning = true;
        this.cameras.main.fadeOut(180, 250, 245, 235);
        this.time.delayedCall(185, () => {
          this.events.emit("room-clear");
          controller.enterRoom(id);
          this.loadRoom();
          this.cameras.main.fadeIn(230, 250, 245, 235);
          controller.transitioning = false;
          controller.checkpoint();
        });
      });
    }
    resizeView() {
      const { width, height } = this.scale;
      this.baseZoom = Math.min(width / WORLD.width, height / WORLD.height);
      if (width < 650) this.baseZoom = Math.max(0.95, this.baseZoom);
      else if (height > width)
        this.baseZoom = Math.max(Math.min(width / 700, 1.25), this.baseZoom);
      else if (height < 450) this.baseZoom = Math.max(0.65, this.baseZoom);
      const zoom = this.baseZoom * this.zoomFactor,
        viewWidth = width / zoom,
        viewHeight = height / zoom;
      this.cropped = viewWidth < WORLD.width || viewHeight < WORLD.height;
      this.cameras.main
        .setZoom(zoom)
        .setBounds(
          -Math.max(0, (viewWidth - WORLD.width) / 2),
          -Math.max(0, (viewHeight - WORLD.height) / 2),
          Math.max(viewWidth, WORLD.width),
          Math.max(viewHeight, WORLD.height),
        );
      this.center();
    }
    center() {
      this.manualPan = false;
      this.cameras.main.centerOn(
        this.cropped ? this.player.x : WORLD.width / 2,
        this.cropped ? this.player.y - 55 : WORLD.height / 2,
      );
    }
    zoom(delta) {
      this.zoomFactor = Phaser.Math.Clamp(this.zoomFactor + delta, 0.65, 2);
      this.resizeView();
    }
    bindInput() {
      let down = null,
        dragged = false;
      this.input.on("pointerdown", (pointer) => {
        down = {
          x: pointer.x,
          y: pointer.y,
          scrollX: this.cameras.main.scrollX,
          scrollY: this.cameras.main.scrollY,
        };
        dragged = false;
      });
      this.input.on("pointermove", (pointer) => {
        if (!down || !pointer.isDown || this.paused) return;
        if (Math.hypot(pointer.x - down.x, pointer.y - down.y) > 9)
          dragged = true;
        if (dragged) {
          this.manualPan = true;
          this.cameras.main.setScroll(
            down.scrollX - (pointer.x - down.x) / this.cameras.main.zoom,
            down.scrollY - (pointer.y - down.y) / this.cameras.main.zoom,
          );
        }
      });
      this.input.on("pointerup", (pointer) => {
        if (!down || dragged || this.paused) {
          down = null;
          return;
        }
        down = null;
        const pt = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const npc = [...this.actors.values()]
          .filter((a) => a.id !== "player")
          .find(
            (a) =>
              Math.abs(a.x - pt.x) < 25 && pt.y > a.y - 78 && pt.y < a.y + 8,
          );
        if (npc) {
          this.talk(npc.id);
          return;
        }
        const object = this.hotspots.find(
          (h) => Math.hypot(h.item.x - pt.x, h.item.y - pt.y) < 25,
        );
        if (object) {
          this.interact(object.item.id);
          return;
        }
        if (!walkable(this.room, pt)) {
          controller.toast("這裡是家具或牆面，試試空著的地板");
          return;
        }
        this.go(pt);
      });
      this.input.on("wheel", (_p, _o, _dx, dy) => {
        if (!this.paused) this.zoom(dy > 0 ? -0.1 : 0.1);
      });
      // DOM keyboard listeners avoid capturing text input while editing the name.
      const downKey = (e) => {
        if (
          this.paused ||
          /INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement?.tagName)
        )
          return;
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
          ].includes(e.key)
        ) {
          e.preventDefault();
          this.keys.add(e.key.toLowerCase());
          this.player.path = [];
          this.pending = null;
          this.heldNpc = null;
          this.manualPan = false;
          this.targetRing.setVisible(false);
        }
        if (e.key === "Enter") {
          const all = [
            ...this.room.objects.map((o) => ({ id: o.id, ...o.target })),
            ...[...this.actors.values()].filter((a) => a.id !== "player"),
          ];
          const near = all.sort(
            (a, b) =>
              Math.hypot(a.x - this.player.x, a.y - this.player.y) -
              Math.hypot(b.x - this.player.x, b.y - this.player.y),
          )[0];
          if (
            near &&
            Math.hypot(near.x - this.player.x, near.y - this.player.y) < 90
          ) {
            e.preventDefault();
            PEOPLE[near.id] ? this.talk(near.id) : this.interact(near.id);
          }
        }
      };
      const upKey = (e) => {
        this.keys.delete(e.key.toLowerCase());
        if (!this.keys.size) controller.checkpoint();
      };
      const blur = () => {
        this.keys.clear();
        down = null;
      };
      window.addEventListener("keydown", downKey);
      window.addEventListener("keyup", upKey);
      window.addEventListener("blur", blur);
      this.events.once("shutdown", () => {
        window.removeEventListener("keydown", downKey);
        window.removeEventListener("keyup", upKey);
        window.removeEventListener("blur", blur);
      });
    }
    moveActor(actor, dt, speed) {
      let remaining = dt * speed,
        moving = false;
      while (actor.path.length && remaining > 0) {
        const target = actor.path[0],
          dx = target.x - actor.x,
          dy = target.y - actor.y,
          distance = Math.hypot(dx, dy);
        if (distance > 0.01) {
          actor.facing =
            Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0;
          moving = true;
        }
        if (distance <= remaining) {
          actor.x = target.x;
          actor.y = target.y;
          actor.path.shift();
          remaining -= distance;
        } else {
          actor.x += (dx / distance) * remaining;
          actor.y += (dy / distance) * remaining;
          remaining = 0;
        }
      }
      return moving;
    }
    update(_time, delta) {
      if (!this.player) return;
      if (this.paused) {
        this.keys.clear();
        return;
      }
      const dt = Math.min(delta, 80) / 1000,
        state = controller.state();
      state.elapsed += dt;
      this.syncNpcs();
      let moved = false;
      const dx =
        Number(this.keys.has("d") || this.keys.has("arrowright")) -
        Number(this.keys.has("a") || this.keys.has("arrowleft"));
      const dy =
        Number(this.keys.has("s") || this.keys.has("arrowdown")) -
        Number(this.keys.has("w") || this.keys.has("arrowup"));
      if (dx || dy) {
        const factor = (150 * dt) / Math.hypot(dx, dy),
          x = this.player.x + dx * factor,
          y = this.player.y + dy * factor;
        if (walkable(this.room, { x, y: this.player.y })) this.player.x = x;
        if (walkable(this.room, { x: this.player.x, y })) this.player.y = y;
        this.player.facing =
          Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0;
        moved = true;
      } else {
        const was = this.player.path.length;
        moved = this.moveActor(this.player, dt, 165);
        if (was && !this.player.path.length) this.arrive();
      }
      actorFrame(this.player, moved, state.elapsed);
      state.position = { x: this.player.x, y: this.player.y };
      for (const actor of this.actors.values())
        if (actor.id !== "player") {
          actorFrame(actor, this.moveActor(actor, dt, 42), state.elapsed);
          state.npcPositions[actor.id] = {
            sceneId: state.sceneId,
            x: actor.x,
            y: actor.y,
          };
        }
      if (!this.manualPan && this.cropped)
        this.cameras.main.centerOn(this.player.x, this.player.y - 55);
      if (!this.uiTick || state.elapsed - this.uiTick > 1) {
        this.uiTick = state.elapsed;
        controller.changed();
      }
    }
    snapshot() {
      return {
        scene: controller.state().sceneId,
        playerCount: 1,
        camera: {
          x: this.cameras.main.worldView.x,
          y: this.cameras.main.worldView.y,
          zoom: this.cameras.main.zoom,
        },
        player: {
          x: this.player.x,
          y: this.player.y,
          outfit: this.player.key,
          moving: this.player.path.length > 0,
          facing: this.player.facing,
        },
        npcs: [...this.actors.values()]
          .filter((a) => a.id !== "player")
          .map((a) => ({
            id: a.id,
            x: a.x,
            y: a.y,
            status: a.status,
            moving: !!a.path.length,
            exiting: !!a.exiting,
          })),
        paused: this.paused,
        zoom: this.cameras.main.zoom,
      };
    }
  }
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: "world",
    backgroundColor: "#fbf5ea",
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
    audio: { noAudio: true },
    fps: { target: 60, limit: 60 },
    scene: [PixelWorld],
  });
}
