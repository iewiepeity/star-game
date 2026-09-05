import {
  expandedAssets,
  expandedMeta,
  importAtlas,
} from "./expanded-sprites.js";
import * as Phaser from "../../assets/vendor/phaser.esm.min.js";
import {
  ROOMS,
  WORLD,
  PEOPLE,
  itinerary,
  ACTIVITY_TYPES,
  ACTIVITY_SPOTS,
  activityAllowed,
} from "./data.js";
import {
  buildGrid,
  findPath,
  nearest,
  walkable,
  inside,
} from "./navigation.js";
import { importSprites, actorFrame, activityFrame } from "./sprites.js";
const OLD_NPCS = ["jiqing", "sufei", "jiqing-actions", "sufei-actions"];
const actorKey = (state) => `${state.avatarId || "raven"}-${state.outfitId}`;
const oldHero = (key) => [
  key,
  `${key}-actions`,
  `${key}-seated`,
  ...(key === "raven-newcomer" ? ["raven-newcomer-rest-actions"] : []),
];
const roomAssetKey = (room) =>
  room.crop
    ? `city-${room.asset.split("/").at(-1)}`
    : `room-${room.venue === "tv_company" ? "tv" : room.venue}`;
export function createWorld(controller) {
  class PixelWorld extends Phaser.Scene {
    constructor() {
      super("PixelWorld");
      this.actors = new Map();
      this.manualPan = false;
      this.zoomFactor = 1;
      this.heldNpc = null;
      this.keys = new Set();
      this.assetHistory = { rooms: [], heroes: [] };
    }
    preload() {
      this.load.on("progress", (value) =>
        controller.loading(Math.round(value * 100)),
      );
      this.load.on("loaderror", (file) => controller.loadError(file.key));
      this.load.json(
        "pixel-atlas-manifest",
        "assets/pixel/atlas-manifest.json",
      );
      const state = controller.state(),
        key = actorKey(state);
      this.initialOld = [
        ...OLD_NPCS,
        ...(expandedMeta(key) ? [] : oldHero(key)),
      ];
      const room = ROOMS[state.sceneId];
      this.load.image(roomAssetKey(room), room.asset);
      for (const id of this.initialOld)
        this.load.image(`raw-${id}`, `assets/pixel/${id}.png`);
      this.initialExpanded = [
        ...["cast-0", "cast-1", "cast-2"].map((id) => ({
          key: id,
          url: `assets/pixel/cast/${id}.webp`,
        })),
        ...expandedAssets(key),
      ];
      for (const a of this.initialExpanded)
        this.load.image(`raw-${a.key}`, a.url);
    }
    create() {
      try {
        for (const key of this.initialOld) importSprites(this, key);
        for (const a of this.initialExpanded)
          importAtlas(
            this,
            a.key,
            this.cache.json.get("pixel-atlas-manifest").frames[a.key],
          );
        this.loadRoom();
      } catch (e) {
        controller.loadError(e.message);
        return;
      }
      this.bindInput();
      this.scale.on("resize", () => this.resizeView());
      controller.ready(this);
    }
    async ensureAssets(
      id = controller.state().sceneId,
      key = actorKey(controller.state()),
    ) {
      const assets = [],
        room = ROOMS[id];
      if (!this.textures.exists(roomAssetKey(room)))
        assets.push({ key: roomAssetKey(room), url: room.asset });
      const extra = expandedAssets(key),
        old = extra.length ? [] : oldHero(key);
      for (const a of extra)
        if (!this.textures.exists(a.key))
          assets.push({ key: `raw-${a.key}`, url: a.url });
      for (const k of old)
        if (!this.textures.exists(k))
          assets.push({ key: `raw-${k}`, url: `assets/pixel/${k}.png` });
      if (assets.length)
        await new Promise((resolve, reject) => {
          let failed = false;
          const error = (file) => {
            if (assets.some((a) => a.key === file.key)) failed = true;
          };
          this.load.on("loaderror", error);
          this.load.once("complete", () => {
            this.load.off("loaderror", error);
            failed ? reject(new Error("素材載入失敗")) : resolve();
          });
          for (const a of assets) this.load.image(a.key, a.url);
          this.load.start();
        });
      for (const a of extra)
        if (!this.textures.exists(a.key))
          importAtlas(
            this,
            a.key,
            this.cache.json.get("pixel-atlas-manifest").frames[a.key],
          );
      for (const k of old) if (!this.textures.exists(k)) importSprites(this, k);
    }
    background(depth = -10) {
      const key = roomAssetKey(this.room),
        texture = this.textures.get(key),
        id = controller.state().sceneId;
      if (this.room.crop && !texture.has(id))
        texture.add(id, 0, ...this.room.crop);
      const r = this.room.rect;
      return this.add
        .image(r.x, r.y, key, this.room.crop ? id : undefined)
        .setOrigin(0)
        .setDisplaySize(r.width, r.height)
        .setDepth(depth);
    }
    trimAssets() {
      const retain = (bucket, keys, limit) => {
        const history = this.assetHistory[bucket];
        const signature = keys.join("|");
        const previous = history.findIndex(
          (entry) => entry.join("|") === signature,
        );
        if (previous >= 0) history.splice(previous, 1);
        history.push(keys);
        while (history.length > limit) {
          const evicted = history.shift();
          for (const key of evicted)
            if (
              !history.some((entry) => entry.includes(key)) &&
              this.textures.exists(key)
            )
              this.textures.remove(key);
        }
      };
      retain("rooms", [roomAssetKey(this.room)], 3);
      const key = actorKey(controller.state());
      const expanded = expandedAssets(key);
      retain(
        "heroes",
        expanded.length ? expanded.map((a) => a.key) : oldHero(key),
        2,
      );
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
      this.background();
      for (const f of this.room.foreground) {
        const mask = this.make.graphics({ x: 0, y: 0, add: false });
        mask.fillStyle(0xffffff).fillPoints(f.polygon, true);
        this.background(f.depth * 0.625).setMask(mask.createGeometryMask());
        this.events.once("room-clear", () => mask.destroy());
      }
      const pos = walkable(this.room, state.position)
        ? state.position
        : nearest(this.grid, this.room.entry);
      this.player = this.addActor("player", actorKey(state), pos);
      this.player.shadow.setStrokeStyle(1, 0xad7580, 0.5);
      this.targetRing = this.add
        .ellipse(0, 0, 18, 9)
        .setStrokeStyle(2, 0xac6876, 0.9)
        .setVisible(false)
        .setDepth(950);
      this.hotspots = [];
      this.seatForegrounds = new Map();
      for (const [id, spot] of Object.entries(ACTIVITY_SPOTS[state.sceneId])) {
        if (!spot.foreground) continue;
        const mask = this.make.graphics({ x: 0, y: 0, add: false });
        mask.fillStyle(0xffffff).fillPoints(spot.foreground, true);
        const layer = this.background(spot.depth + 1).setMask(
          mask.createGeometryMask(),
        );
        this.seatForegrounds.set(id, layer);
        this.events.once("room-clear", () => mask.destroy());
      }
      this.updateSeatForeground();
      for (const item of this.room.objects) {
        const title = this.add
          .text(item.x, item.y - 28, item.name, {
            fontFamily: "sans-serif",
            fontSize: "13px",
            color: "#594c40",
            stroke: "#fff9ed",
            strokeThickness: 4,
            padding: { x: 9, y: 6 },
          })
          .setOrigin(0.5)
          .setDepth(1300)
          .setResolution(2)
          .setVisible(false);
        this.hotspots.push({ item, title });
      }
      this.manualPan = false;
      this.resizeView();
      this.syncNpcs(true);
      this.trimAssets();
      if (state.activity)
        activityFrame(
          this.player,
          state.activity.kind,
          state.activity.elapsed,
          ACTIVITY_SPOTS[state.sceneId][state.activity.itemId],
        );
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
      actor.sprite = this.add.sprite(
        pos.x,
        pos.y,
        expandedMeta(key)?.sheet || key,
        expandedMeta(key) ? `${expandedMeta(key).row}-idle-0` : "0-0",
      );
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
        const plan = itinerary(
          id,
          controller.state().elapsed,
          controller.state(),
        );
        let actor = this.actors.get(id);
        if (this.heldNpc === id) continue;
        if (plan.scene !== controller.state().sceneId) {
          if (actor) {
            if (!actor.exiting)
              actor.path = findPath(this.grid, actor, this.room.entry);
            actor.exiting = true;
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
        actor.busy = plan.busy;
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
      this.cancelActivity();
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
        controller.toast("對方剛離開，晚一點再碰面吧");
        return;
      }
      if (actor.busy) {
        controller.toast(
          `${PEOPLE[id].name}正在${actor.status}，等工作結束再聊吧。`,
        );
        return;
      }
      this.go(nearest(this.grid, { x: actor.x + 50, y: actor.y + 12 }), () => {
        this.player.facing = this.player.x > actor.x ? 1 : 2;
        actor.facing = this.player.x > actor.x ? 2 : 1;
        actorFrame(actor, false, controller.state().elapsed);
        controller.talk(id);
      });
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
    stopRoute() {
      this.pending = null;
      this.player.path = [];
      this.keys.clear();
      this.targetRing.setVisible(false);
    }
    async setOutfit() {
      const key = actorKey(controller.state());
      controller.transitioning = true;
      try {
        await this.ensureAssets(controller.state().sceneId, key);
        this.cancelActivity();
        this.player.key = key;
        actorFrame(this.player, false, 0);
        this.trimAssets();
      } finally {
        controller.transitioning = false;
      }
    }
    transition(id, after) {
      if (!ROOMS[id]) return;
      this.go(
        this.room.objects.find((o) => o.id === "door").target,
        async () => {
          controller.transitioning = true;
          try {
            await this.ensureAssets(id);
            this.cameras.main.fadeOut(180, 250, 245, 235);
            this.time.delayedCall(185, () => {
              this.events.emit("room-clear");
              controller.enterRoom(id);
              this.loadRoom();
              this.cameras.main.fadeIn(230, 250, 245, 235);
              controller.transitioning = false;
              controller.checkpoint();
              after?.();
            });
          } catch {
            controller.transitioning = false;
            controller.toast("地點素材載入失敗，請重新開啟地圖再試。");
          }
        },
      );
    }
    async restoreRoom() {
      controller.transitioning = true;
      try {
        await this.ensureAssets();
        this.events.emit("room-clear");
        this.loadRoom();
      } finally {
        controller.transitioning = false;
      }
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
        if (!pointer.isDown && !this.paused) {
          const pt = this.cameras.main.getWorldPoint(pointer.x, pointer.y),
            selected = this.hotspots.findLast((h) => inside(pt, h.item.hit));
          for (const h of this.hotspots) {
            h.title
              .setVisible(h === selected)
              .setScale(1 / this.cameras.main.zoom);
          }
          this.hoveredNpc = [...this.actors.values()].find(
            (a) =>
              a.id !== "player" &&
              Math.abs(a.x - pt.x) < 25 &&
              pt.y > a.y - 78 &&
              pt.y < a.y + 8,
          )?.id;
          this.game.canvas.style.cursor =
            selected || this.hoveredNpc ? "pointer" : "default";
        }
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
        controller.takeover?.();
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
        const object = this.hotspots.findLast((h) => inside(pt, h.item.hit));
        if (object) {
          if (pointer.wasTouch) controller.selectObject(object.item);
          else this.interact(object.item.id);
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
          controller.takeover?.();
          this.cancelActivity();
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
          const next = actor.path[0];
          if (next && (dx !== 0) !== (next.x - actor.x !== 0)) break;
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
      const dt = (Math.min(delta, 80) / 1000) * (controller.speed?.() || 1),
        state = controller.state();
      state.elapsed += dt;
      this.syncNpcs();
      let moved = false;
      let dx =
        Number(this.keys.has("d") || this.keys.has("arrowright")) -
        Number(this.keys.has("a") || this.keys.has("arrowleft"));
      let dy =
        Number(this.keys.has("s") || this.keys.has("arrowdown")) -
        Number(this.keys.has("w") || this.keys.has("arrowup"));
      if (dx && dy) {
        const last = [...this.keys].at(-1);
        if (["a", "d", "arrowleft", "arrowright"].includes(last)) dy = 0;
        else dx = 0;
      }
      if (state.activity) {
        state.activity.elapsed += dt;
        activityFrame(
          this.player,
          state.activity.kind,
          state.activity.elapsed,
          ACTIVITY_SPOTS[state.sceneId][state.activity.itemId],
        );
        if (
          state.activity.elapsed >= ACTIVITY_TYPES[state.activity.kind].duration
        ) {
          const { kind, itemId } = state.activity;
          this.cancelActivity();
          controller.activityDone(kind, itemId);
        }
      } else if (dx || dy) {
        // Substep direct input as well as path-following at accelerated speed;
        // a large frame may never jump across a furniture collision polygon.
        const factor = (150 * Math.min(delta, 80)) / 1000 / Math.hypot(dx, dy);
        const steps = Math.max(1, Math.ceil(factor / (WORLD.grid / 2)));
        for (let i = 0; i < steps; i++) {
          const x = this.player.x + (dx * factor) / steps;
          const y = this.player.y + (dy * factor) / steps;
          if (walkable(this.room, { x, y: this.player.y })) this.player.x = x;
          if (walkable(this.room, { x: this.player.x, y })) this.player.y = y;
        }
        this.player.facing =
          Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0;
        moved = true;
      } else {
        const was = this.player.path.length;
        moved = this.moveActor(this.player, dt, 165);
        if (was && !this.player.path.length) {
          moved = false;
          this.arrive();
        }
      }
      if (!state.activity) actorFrame(this.player, moved, state.elapsed);
      state.position = { x: this.player.x, y: this.player.y };
      for (const actor of this.actors.values())
        if (actor.id !== "player") {
          const walking = this.moveActor(actor, dt, 42);
          if (!walking && !actor.exiting && this.heldNpc !== actor.id)
            activityFrame(
              actor,
              actor.id === "sufei" &&
                state.sceneId === "rehearsal" &&
                actor.status === "暖身中"
                ? "dance"
                : "read",
              state.elapsed,
            );
          else actorFrame(actor, walking, state.elapsed);
          actor.label.setVisible(
            this.hoveredNpc === actor.id ||
              this.heldNpc === actor.id ||
              Math.hypot(actor.x - this.player.x, actor.y - this.player.y) <
                125,
          );
          state.npcPositions[actor.id] = {
            sceneId: state.sceneId,
            x: actor.x,
            y: actor.y,
          };
        }
      if (!this.manualPan && this.cropped)
        this.cameras.main.centerOn(
          this.player.sprite.x,
          this.player.sprite.y - 55,
        );
      if (!this.uiTick || state.elapsed - this.uiTick > 1) {
        this.uiTick = state.elapsed;
        controller.changed();
      }
    }
    startActivity(itemId, kind) {
      const state = controller.state();
      if (!activityAllowed(state.sceneId, itemId, kind)) return false;
      this.player.path = [];
      this.pending = null;
      this.targetRing.setVisible(false);
      state.activity = { itemId, kind, elapsed: 0 };
      this.updateSeatForeground();
      activityFrame(
        this.player,
        kind,
        0,
        ACTIVITY_SPOTS[state.sceneId][itemId],
      );
      controller.checkpoint();
      controller.changed();
      return true;
    }
    cancelActivity() {
      const state = controller.state();
      if (!state.activity) return;
      state.activity = null;
      this.updateSeatForeground();
      actorFrame(this.player, false, state.elapsed);
      controller.changed();
    }
    updateSeatForeground() {
      for (const [id, layer] of this.seatForegrounds)
        layer.setVisible(controller.state().activity?.itemId === id);
    }
    snapshot() {
      return {
        scene: controller.state().sceneId,
        retainedAssets: {
          rooms: this.assetHistory.rooms.length,
          heroes: this.assetHistory.heroes.length,
          textures: this.textures.getTextureKeys().length,
        },
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
          pose: controller.state().activity?.kind || "standing",
          frame: this.player.sprite.frame.name,
          texture: this.player.sprite.texture.key,
          origin: {
            x: this.player.sprite.originX,
            y: this.player.sprite.originY,
          },
          visual: { x: this.player.sprite.x, y: this.player.sprite.y },
          route: this.player.path.map((p) => ({ x: p.x, y: p.y })),
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
        markerCount: 0,
        seatForegroundCount: [...this.seatForegrounds.values()].filter(
          (layer) => layer.visible,
        ).length,
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
