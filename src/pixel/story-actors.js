import { actorFrame, activityFrame } from "./sprites.js";
import { findPath, nearest } from "./navigation.js";
import { storyFormation } from "./story-blocking.js";

export function createStoryActors(world, controller) {
  let scene = null;
  const face = (actor, other) => {
    const dx = other.x - actor.x,
      dy = other.y - actor.y;
    actor.facing =
      Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0;
  };
  function start(plan, arrived, settled = false) {
    if (scene?.id === plan.id) {
      if (scene.phase === "enter") scene.arrived = arrived;
      else arrived();
      return;
    }
    clear();
    const points = storyFormation(world.room, plan.cast.length);
    world.stopRoute();
    world.cancelActivity();
    scene = {
      id: plan.id,
      cast: plan.cast,
      phase: "enter",
      clock: 0,
      pose: "talk",
      speaker: plan.cast[0],
      arrived,
      originals: new Map(),
      points,
    };
    for (const actor of world.actors.values()) {
      if (actor.id !== "player")
        scene.originals.set(actor.id, {
          x: actor.x,
          y: actor.y,
          facing: actor.facing,
        });
      actor.path = [];
      actor.label?.setVisible(false);
      // Private conversations reserve the set; unrelated passersby return
      // when this short scene ends, without changing their normal timetable.
      if (actor.id !== "player" && !plan.cast.includes(actor.id)) {
        actor.sprite.setVisible(false);
        actor.shadow.setVisible(false);
      }
    }
    const actors = [
      world.player,
      ...plan.cast.map(
        (id) =>
          world.actors.get(id) ||
          world.addActor(id, id, nearest(world.grid, world.room.entry)),
      ),
    ];
    actors.forEach((actor, i) => {
      actor.status = "故事現場";
      actor.exiting = false;
      actor.busy = true;
      if (settled) Object.assign(actor, { x: points[i].x, y: points[i].y });
      actor.path = settled ? [] : findPath(world.grid, actor, points[i]);
      actorFrame(actor, false, 0);
    });
    world.manualPan = false;
    if (settled) finishEntrance();
  }
  function finishEntrance() {
    if (!scene) return;
    scene.phase = "beat";
    for (const id of scene.cast) face(world.actors.get(id), world.player);
    face(world.player, world.actors.get(scene.cast[0]));
    const callback = scene.arrived;
    scene.arrived = null;
    callback?.();
  }
  function skip() {
    if (!scene || !["enter", "exit"].includes(scene.phase)) return;
    [world.player, ...scene.cast.map((id) => world.actors.get(id))].forEach(
      (a) => {
        if (a.path.length) {
          const point = a.path.at(-1);
          a.x = point.x;
          a.y = point.y;
        }
        a.path = [];
        actorFrame(a, false, 0);
      },
    );
    if (scene.phase === "enter") finishEntrance();
    else finishExit();
  }
  function pose(speaker, gesture = "talk") {
    if (!scene) return;
    scene.speaker = scene.cast.includes(speaker) ? speaker : scene.cast[0];
    scene.pose = gesture;
    scene.clock = 0;
  }
  function exit(done) {
    if (!scene) return done();
    if (scene.phase === "exit") {
      scene.done = done;
      return;
    }
    scene.phase = "exit";
    scene.done = done;
    for (const id of scene.cast) {
      const a = world.actors.get(id);
      a.path = findPath(world.grid, a, world.room.entry);
    }
  }
  function finishExit() {
    const done = scene?.done;
    clear();
    done?.();
  }
  function clear() {
    if (!scene) return;
    const old = scene;
    scene = null;
    for (const actor of [...world.actors.values()]) {
      if (actor.id === "player") {
        actor.path = [];
        actorFrame(actor, false, 0);
        continue;
      }
      const original = old.originals.get(actor.id);
      if (!original) {
        world.removeActor(actor);
        continue;
      }
      Object.assign(actor, original, { path: [], routeKey: null, busy: false });
      actor.sprite.setVisible(true);
      actorFrame(actor, false, 0);
    }
    world.syncNpcs();
    world.resizeView();
  }
  function update(delta) {
    if (!scene) return false;
    world.keys.clear();
    if (document.hidden || controller.storyPaused()) return true;
    const dt = (Math.min(delta, 80) / 1000) * Math.min(controller.speed(), 8);
    scene.clock += dt;
    const actors = [
      world.player,
      ...scene.cast.map((id) => world.actors.get(id)),
    ];
    for (const [i, actor] of actors.entries()) {
      const moving = world.moveActor(actor, dt, 110);
      if (!moving && scene.phase === "beat") {
        if (actor.id !== scene.speaker)
          face(actor, world.actors.get(scene.speaker));
        else face(actor, world.player);
        if (
          actor.id === scene.speaker &&
          ["read", "dance"].includes(scene.pose)
        )
          activityFrame(actor, scene.pose, scene.clock);
        else {
          actorFrame(actor, false, scene.clock);
          // Listening / speaking are a gentle nod, never a furniture pose.
          if (actor.id === scene.speaker)
            actor.sprite.y -= Math.sin(scene.clock * 3) * 1.3;
        }
      } else actorFrame(actor, moving, scene.clock + i / 4);
      actor.label?.setVisible(false);
    }
    const midpoint = actors.reduce(
      (p, a) => ({
        x: p.x + a.x / actors.length,
        y: p.y + a.y / actors.length,
      }),
      { x: 0, y: 0 },
    );
    // Frame the people in the area above the dialogue, including narrow phones.
    // Using the canvas center alone puts the speaker behind the choice panel.
    const camera = world.cameras.main,
      canvas = world.game.canvas.getBoundingClientRect();
    const dialogue = document
      .querySelector("#dialogue .conversation")
      ?.getBoundingClientRect();
    const visibleHeight = dialogue
      ? Math.max(130, Math.min(canvas.height, dialogue.top - canvas.top - 48))
      : canvas.height;
    const zoom = Math.max(
      world.baseZoom,
      Math.min(1.12, world.scale.width / 420),
    );
    camera.setZoom(zoom).setBounds(0, -640, 960, 1920);
    camera.centerOn(
      midpoint.x,
      midpoint.y + (canvas.height / 2 - visibleHeight / 2 - 28) / zoom,
    );
    controller.state().position = { x: world.player.x, y: world.player.y };
    if (actors.every((a) => !a.path.length)) {
      if (scene.phase === "enter") finishEntrance();
      else if (scene.phase === "exit") finishExit();
    }
    return true;
  }
  return {
    start,
    pose,
    skip,
    exit,
    clear,
    update,
    get active() {
      return !!scene;
    },
    snapshot: () =>
      scene
        ? {
            id: scene.id,
            phase: scene.phase,
            cast: scene.cast,
            speaker: scene.speaker,
            gesture: scene.pose,
          }
        : null,
  };
}
