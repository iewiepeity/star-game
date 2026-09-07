import {
  advanceMotion,
  bodyClear,
  clearMotion,
  facingToward,
} from "./actor-motion.js";
import {
  BEHAVIOR_KINDS,
  initialBehavior,
  objectApproaches,
  chooseInteraction,
  freePoint,
  usableBehavior,
  hash,
} from "./npc-behavior.js";
import { drawNpcGesture } from "./npc-gestures.js";
import { drawPet, petVisible } from "./pet-visual.js";
import { pickObject } from "./scene-objects.js";
import { createFurnitureLayers } from "./furniture-layers.js";
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
  footClear,
  findPath,
  nearest,
  walkable,
  inside,
} from "./navigation.js";
import { importSprites, actorFrame, activityFrame } from "./sprites.js";
import { createStoryActors } from "./story-actors.js";
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
      this.routeRevision = 0;
      this.transitionPending = false;
      this.storyActors = createStoryActors(this, controller);
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
      if (depth === -10 && this.furniture)
        return this.add
          .image(0, 0, this.furniture.backgroundKey)
          .setOrigin(0)
          .setDepth(depth);
      const key = this.furniture?.sourceKey || roomAssetKey(this.room),
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
      this.uiTick = null;
      this.children.removeAll(true);
      this.petActor = null;
      this.furniture?.dispose();
      this.furniture = null;
      this.actors.clear();
      this.heldNpc = null;
      this.pending = null;
      this.keys.clear();
      const state = controller.state();
      this.room = ROOMS[state.sceneId];
      this.grid = buildGrid(this.room);
      this.approaches = objectApproaches(this.room, this.grid);
      this.furniture = createFurnitureLayers(
        this,
        this.room,
        this.textures.get(roomAssetKey(this.room)).getSourceImage(),
        () => controller.state(),
      );
      const base = this.background();
      if (this.room.artOutline) {
        const mask = this.make.graphics({ x: 0, y: 0, add: false });
        mask.fillStyle(0xffffff).fillPoints(this.room.artOutline, true);
        base.setMask(mask.createGeometryMask());
        this.events.once("room-clear", () => mask.destroy());
      }
      for (const f of this.room.foreground) {
        const mask = this.make.graphics({ x: 0, y: 0, add: false });
        mask.fillStyle(0xffffff).fillPoints(f.polygon, true);
        this.background(f.depth * 0.625).setMask(mask.createGeometryMask());
        this.events.once("room-clear", () => mask.destroy());
      }
      // Older saves allowed feet closer to furniture edges. Move only those
      // positions to the nearest clear cell so the new footprint cannot trap them.
      const savedOnFloor = walkable(this.room, state.position);
      const hasClearance =
        savedOnFloor &&
        [
          [0, 0],
          [4, 0],
          [-4, 0],
          [0, 4],
          [0, -4],
        ].every(([dx, dy]) =>
          walkable(this.room, {
            x: state.position.x + dx,
            y: state.position.y + dy,
          }),
        );
      const pos = hasClearance
        ? state.position
        : nearest(this.grid, savedOnFloor ? state.position : this.room.entry);
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
        busy: false,
        speed: 0,
        walkDistance: 0,
        blockedFor: 0,
        turnWait: 0,
        behavior: null,
        goal: null,
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
      actor.gesture = this.add.graphics().setVisible(false);
      this.actors.set(id, actor);
      actorFrame(actor, false, 0);
      return actor;
    }
    removeActor(actor) {
      actor.sprite.destroy();
      actor.shadow.destroy();
      actor.label?.destroy();
      actor.gesture?.destroy();
      this.actors.delete(actor.id);
    }
    syncPet() {
      const state = controller.state(), pet = state.life.game.cityLife?.pet;
      if (!petVisible(state)) {
        this.petActor?.destroy(); this.petActor = null; return;
      }
      if (!this.petActor) this.petActor = this.add.graphics();
      drawPet(this.petActor, pet.kind);
      // Stay by the entrance at home, or beside the player on a scheduled walk.
      const anchor = state.sceneId === "home" ? this.room.entry : this.player;
      this.petActor.setPosition(anchor.x + 18, anchor.y + 3).setDepth(anchor.y + 4);
      this.petActor.setData("petName", pet.name);
    }
    syncNpcs(first = false) {
      const state = controller.state();
      for (const id of Object.keys(PEOPLE)) {
        const plan = itinerary(id, state.elapsed, state);
        let actor = this.actors.get(id);
        if (this.heldNpc === id) continue;
        if (plan.scene !== state.sceneId || plan.leaving) {
          if (actor) {
            if (!actor.exiting) {
              this.interruptNpc(actor);
              actor.path = findPath(this.grid, actor, this.room.entry);
              actor.goal = { ...this.room.entry };
            }
            actor.exiting = true;
            actor.status = "前往下一站";
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
          const saved = state.npcPositions[id],
            occupied = [...this.actors.values()];
          const preferred =
            first &&
            saved?.sceneId === state.sceneId &&
            walkable(this.room, saved)
              ? saved
              : first
                ? this.room.route[plan.node]
                : this.room.entry;
          const start = freePoint(this.grid, preferred, occupied);
          actor = this.addActor(id, id, start);
          actor.behavior = usableBehavior(
            state.npcBehaviors?.[id],
            state.sceneId,
            this.room,
            start,
          );
          actor.behavior.remaining ||= 0.8 + (hash(id) % 5) * 0.2;
          if (actor.behavior.phase !== "idle") {
            const item = this.room.objects.find(
              (o) => o.id === actor.behavior.objectId,
            );
            const target = this.approaches
              .get(item?.id)
              ?.find((p) => Math.hypot(p.x - start.x, p.y - start.y) < 8);
            const claimed = [...this.actors.values()].some(
              (a) => a !== actor && a.behavior?.objectId === item?.id,
            );
            if (actor.behavior.phase === "using" && target && !claimed) {
              actor.focus = item;
              actor.goal = target;
              actor.facing = facingToward(actor, item);
            } else {
              actor.behavior.phase = "idle";
              actor.behavior.objectId = null;
              actor.behavior.remaining = 0.5;
            }
          }
        }
        if (actor.busy !== !!plan.busy) this.interruptNpc(actor);
        actor.busy = !!plan.busy;
        actor.planStatus = plan.status;
        actor.exiting = false;
      }
    }
    interruptNpc(actor) {
      const old = actor.behavior;
      actor.behavior = {
        ...initialBehavior(),
        sceneId: controller.state().sceneId,
        cycle: old?.cycle || 0,
        completed: old?.completed || 0,
        recent: old?.recent || [],
      };
      actor.yielding = false;
      actor.path = [];
      actor.goal = null;
      actor.focus = null;
      actor.gesture?.clear().setVisible(false);
      clearMotion(actor);
      const state = controller.state();
      state.npcBehaviors ||= {};
      state.npcBehaviors[actor.id] = actor.behavior;
    }
    updateNpcBehavior(actor, dt) {
      if (actor.exiting || this.heldNpc === actor.id) return;
      const state = controller.state(),
        b = actor.behavior;
      if (!b) return;
      if (actor.yielding) {
        actor.status = "讓一讓路";
        if (!actor.path.length) {
          actor.yielding = false;
          b.remaining = 0.8;
        }
        return;
      }
      if (b.phase === "walking") {
        actor.status = `走向${actor.focus?.name || "下一個地方"}`;
        if (!actor.path.length) {
          if (
            !actor.goal ||
            Math.hypot(actor.x - actor.goal.x, actor.y - actor.goal.y) > 8
          ) {
            this.interruptNpc(actor);
            return;
          }
          b.phase = "using";
          b.remaining =
            BEHAVIOR_KINDS[actor.focus.kind].duration + (hash(actor.id) % 3);
          actor.facing = facingToward(actor, actor.focus);
        }
      }
      if (b.phase === "using") {
        b.remaining -= dt;
        actor.status = actor.busy
          ? actor.planStatus
          : `${BEHAVIOR_KINDS[actor.focus.kind].verb}${actor.focus.kind === "mark" ? "" : actor.focus.name}`;
        if (b.remaining <= 0) {
          b.completed++;
          b.recent = [...b.recent, b.objectId].slice(-3);
          b.objectId = null;
          b.phase = "idle";
          b.remaining = 1.2 + (hash(actor.id) % 4) * 0.25;
          actor.focus = null;
          actor.gesture.clear().setVisible(false);
        }
      } else if (b.phase === "idle") {
        actor.status = actor.busy ? actor.planStatus : "稍作停留";
        b.remaining -= dt;
        if (b.remaining <= 0) {
          const others = [...this.actors.values()].filter((a) => a !== actor);
          const reserved = new Set(
            others.map((a) => a.behavior?.objectId).filter(Boolean),
          );
          const choice = chooseInteraction({
            actor,
            room: this.room,
            grid: this.grid,
            approaches: this.approaches,
            occupied: others.flatMap((a) => [a, ...(a.goal ? [a.goal] : [])]),
            reserved,
            behavior: b,
          });
          b.cycle++;
          if (choice) {
            b.phase = "walking";
            b.objectId = choice.item.id;
            actor.focus = choice.item;
            actor.goal = choice.target;
            actor.path = choice.path;
          } else b.remaining = 2;
        }
      }
      state.npcBehaviors ||= {};
      state.npcBehaviors[actor.id] = b;
    }
    detour(actor, goal) {
      const others = [...this.actors.values()].filter(
        (a) => a !== actor && a.sprite.visible,
      );
      const nodes = this.grid.nodes.filter((n) =>
        others.every(
          (o) =>
            Math.hypot(n.x - o.x, n.y - o.y) >= 19 ||
            Math.hypot(n.x - actor.x, n.y - actor.y) < 5,
        ),
      );
      const grid = {
        ...this.grid,
        nodes,
        byId: new Map(nodes.map((n) => [n.id, n])),
      };
      const path = findPath(grid, actor, goal, (point) =>
        Math.hypot(point.x - actor.x, point.y - actor.y) < 0.01 ||
        bodyClear(actor, point, others, 19)),
        end = path.at(-1) || actor;
      return Math.hypot(end.x - goal.x, end.y - goal.y) < 14 ? path : [];
    }
    yieldActor(actor, requester) {
      if (
        actor.id === "player" ||
        this.heldNpc === actor.id ||
        actor.exiting ||
        actor.yielding
      )
        return false;
      const options = [...this.grid.nodes]
        .filter((p) => {
          const d = Math.hypot(p.x - actor.x, p.y - actor.y);
          return (
            d > 25 &&
            d < 70 &&
            Math.hypot(p.x - requester.x, p.y - requester.y) > 32 &&
            bodyClear(actor, p, [...this.actors.values()], 23)
          );
        })
        .sort(
          (a, b) =>
            Math.hypot(a.x - actor.x, a.y - actor.y) -
            Math.hypot(b.x - actor.x, b.y - actor.y),
        );
      for (const point of options.slice(0, 18)) {
        const path = this.detour(actor, point);
        if (!path.length) continue;
        this.interruptNpc(actor);
        actor.yielding = true;
        actor.path = path;
        actor.goal = point;
        return true;
      }
      return false;
    }
    go(point, callback) {
      if (this.paused) {
        controller.toast("先關閉視窗或繼續世界，再走動吧");
        return false;
      }
      this.cancelActivity();
      this.releaseNpc();
      this.pending = callback || null;
      const destination = freePoint(
        this.grid,
        point,
        [...this.actors.values()].filter((a) => a !== this.player),
      );
      this.player.path = findPath(this.grid, this.player, destination);
      this.player.goal = destination;
      clearMotion(this.player);
      if (
        !this.player.path.length &&
        Math.hypot(
          this.player.x - destination.x,
          this.player.y - destination.y,
        ) > 8
      ) {
        this.pending = null;
        this.targetRing.setVisible(false);
        controller.toast("這裡暫時走不到，換個位置試試。");
        return false;
      }
      this.manualPan = false;
      const last = this.player.path.at(-1) || this.player;
      this.targetRing.setPosition(last.x, last.y).setVisible(true);
      if (!this.player.path.length) this.arrive();
    }
    interact(id) {
      const item = this.room.objects.find((o) => o.id === id);
      if (!item) return;
      if (item.action === "inspect") {
        controller.interact(item);
        return;
      }
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
      const occupied = [...this.actors.values()].filter(
        (a) => a !== this.player,
      );
      const candidates = this.grid.nodes
        .filter((point) => {
          const distance = Math.hypot(point.x - actor.x, point.y - actor.y);
          return (
            distance >= 32 &&
            distance <= 65 &&
            bodyClear(this.player, point, occupied, 23)
          );
        })
        .sort(
          (a, b) =>
            Math.hypot(a.x - this.player.x, a.y - this.player.y) -
            Math.hypot(b.x - this.player.x, b.y - this.player.y),
        );
      const target = candidates.find((point) => {
        const path = findPath(this.grid, this.player, point);
        const end = path.at(-1) || this.player;
        return Math.hypot(end.x - point.x, end.y - point.y) < 8;
      });
      if (!target) {
        controller.toast("這一側走不到對方面前，換個位置再聊吧。");
        return;
      }
      const started = this.go(target, () => {
        if (
          this.actors.get(id) !== actor ||
          actor.exiting ||
          Math.hypot(this.player.x - actor.x, this.player.y - actor.y) > 100
        ) {
          this.releaseNpc();
          controller.toast("還沒走到對方面前，換一側靠近再聊吧");
          return;
        }
        this.player.facing = facingToward(this.player, actor);
        actor.facing = facingToward(actor, this.player);
        actorFrame(actor, false, controller.state().elapsed);
        controller.talk(id);
      });
      if (started === false) return;
      this.interruptNpc(actor);
      this.heldNpc = id;
      actor.status = "停下來等你";
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
    }
    stopRoute() {
      this.routeRevision++;
      if (this.transitionPending) {
        this.transitionPending = false;
        controller.transitioning = false;
        this.cameras.main.resetFX();
      }
      this.pending = null;
      this.player.path = [];
      this.player.goal = null;
      clearMotion(this.player);
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
    refreshFurniture() {
      this.furniture?.refresh();
    }
    async returnHome() {
      if (controller.transitioning) return;
      controller.transitioning = true;
      controller.changed();
      this.cancelActivity();
      this.stopRoute();
      try {
        await this.ensureAssets("home");
        this.events.emit("room-clear");
        controller.enterRoom("home");
        this.loadRoom();
        this.cameras.main.fadeIn(230, 250, 245, 235);
        controller.checkpoint();
      } catch {
        controller.toast("住處素材載入失敗，留在原地。請再按一次回家。");
      } finally {
        controller.transitioning = false;
        controller.changed();
      }
    }
    transition(id, after, onError) {
      if (!ROOMS[id]) return;
      const revision = ++this.routeRevision;
      this.go(
        this.room.objects.find((o) => o.id === "door").target,
        async () => {
          if (revision !== this.routeRevision) return;
          this.transitionPending = true;
          controller.transitioning = true;
          try {
            await this.ensureAssets(id);
            if (revision !== this.routeRevision) return;
            this.cameras.main.fadeOut(180, 250, 245, 235);
            this.time.delayedCall(185, () => {
              if (revision !== this.routeRevision) return;
              this.events.emit("room-clear");
              controller.enterRoom(id);
              this.loadRoom();
              this.cameras.main.fadeIn(230, 250, 245, 235);
              controller.transitioning = false;
              this.transitionPending = false;
              controller.checkpoint();
              after?.();
            });
          } catch {
            if (revision !== this.routeRevision) return;
            controller.transitioning = false;
            this.transitionPending = false;
            controller.toast("地點素材載入失敗，請重新開啟地圖再試。");
            onError?.();
          }
        },
      );
    }
    async restoreRoom() {
      this.storyActors.clear();
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
    restoreStoryOrigin(origin) {
      const point = nearest(this.grid, origin.position || this.room.entry);
      Object.assign(this.player, { x: point.x, y: point.y, path: [] });
      controller.state().position = { x: point.x, y: point.y };
      controller.state().activity = origin.activity || null;
      this.updateSeatForeground();
      actorFrame(this.player, false, 0);
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
            selectedItem = pickObject(this.room.objects, pt, inside),
            selected = this.hotspots.find((h) => h.item === selectedItem);
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
        const selectedItem = pickObject(this.room.objects, pt, inside);
        const object = this.hotspots.find((h) => h.item === selectedItem);
        if (object) {
          if (pointer.wasTouch && object.item.action !== "inspect")
            controller.selectObject(object.item);
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
            ...this.room.objects
              .filter((o) => o.action !== "inspect")
              .map((o) => ({ id: o.id, ...o.target })),
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
      const scripted = this.storyActors.active;
      const moving = advanceMotion(
        actor,
        dt,
        speed,
        (point) =>
          footClear(this.room, point) &&
          (scripted ||
            bodyClear(
              actor,
              point,
              [...this.actors.values()].filter((a) => a.sprite.visible),
            )),
      );
      if (!scripted && actor.blockedFor > 0.4 && actor.path.length) {
        const ahead = actor.path[0],
          blocker = [...this.actors.values()]
            .filter((a) => a !== actor)
            .sort(
              (a, b) =>
                Math.hypot(a.x - actor.x, a.y - actor.y) -
                Math.hypot(b.x - actor.x, b.y - actor.y),
            )[0];
        if (
          blocker &&
          (actor.id === "player" ||
            !blocker.path.length ||
            actor.id < blocker.id)
        )
          this.yieldActor(blocker, actor);
        if (actor.goal) {
          const route = this.detour(actor, actor.goal);
          if (route.length) actor.path = route;
        }
        if (actor.blockedFor > 2.5 && actor.id !== "player" && !actor.exiting)
          this.interruptNpc(actor);
        if (!actor.goal && ahead) actor.goal = actor.path.at(-1);
      }
      return moving;
    }
    update(_time, delta) {
      if (!this.player) return;
      if (this.storyActors.update(delta)) return;
      if (this.paused) {
        this.keys.clear();
        return;
      }
      const dt = (Math.min(delta, 80) / 1000) * (controller.speed?.() || 1),
        state = controller.state();
      state.elapsed += dt;
      this.syncNpcs();
      this.syncPet();
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
        controller.activityProgress?.(
          Math.min(
            1,
            state.activity.elapsed /
              ACTIVITY_TYPES[state.activity.kind].duration,
          ),
        );
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
        const realDt = Math.min(delta, 80) / 1000;
        this.player.speed = Math.min(
          150,
          (this.player.speed || 0) + 600 * realDt,
        );
        const factor = this.player.speed * realDt,
          steps = Math.max(1, Math.ceil(factor / 3));
        const start = { x: this.player.x, y: this.player.y };
        for (let i = 0; i < steps; i++) {
          const point = {
            x: this.player.x + (dx * factor) / steps,
            y: this.player.y + (dy * factor) / steps,
          };
          if (
            footClear(this.room, point) &&
            bodyClear(this.player, point, [...this.actors.values()])
          ) {
            this.player.x = point.x;
            this.player.y = point.y;
            this.player.walkDistance += factor / steps;
          } else {
            this.player.speed = 0;
            const blocker = [...this.actors.values()].find(
              (a) =>
                a !== this.player &&
                Math.hypot(a.x - point.x, a.y - point.y) < 20,
            );
            if (blocker) this.yieldActor(blocker, this.player);
            break;
          }
        }
        moved =
          Math.hypot(this.player.x - start.x, this.player.y - start.y) > 0.001;
        if (moved) this.player.facing = facingToward(start, this.player);
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
          this.updateNpcBehavior(actor, dt);
          const walking = this.moveActor(
            actor,
            dt,
            actor.exiting ? 65 : 48 + (hash(actor.id) % 15),
          );
          const behavior = actor.behavior;
          if (
            !walking &&
            !actor.exiting &&
            this.heldNpc !== actor.id &&
            behavior?.phase === "using" &&
            actor.focus
          )
            drawNpcGesture(
              actor,
              BEHAVIOR_KINDS[actor.focus.kind].pose,
              BEHAVIOR_KINDS[actor.focus.kind].duration +
                (hash(actor.id) % 3) -
                behavior.remaining,
              window.matchMedia("(prefers-reduced-motion: reduce)").matches,
            );
          else {
            actor.gesture.clear().setVisible(false);
            actorFrame(actor, walking, state.elapsed);
          }
          actor.label.setText(
            `${PEOPLE[actor.id].name} · ${actor.status || actor.planStatus || "稍作停留"}`,
          );
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
      controller.activityProgress?.(0);
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
        pet: this.petActor ? { name: this.petActor.getData("petName"), x: this.petActor.x, y: this.petActor.y } : null,
        story: this.storyActors.snapshot(),
        furniture: this.furniture?.snapshot() || [],
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
            visible: a.sprite.visible,
            x: a.x,
            y: a.y,
            status: a.status,
            moving: !!a.path.length,
            exiting: !!a.exiting,
            behavior: a.behavior
              ? { ...a.behavior, recent: [...a.behavior.recent] }
              : null,
            object: a.behavior?.objectId || null,
            facing: a.facing,
            speed: a.speed,
            blockedFor: a.blockedFor,
            goal: a.goal ? { ...a.goal } : null,
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
