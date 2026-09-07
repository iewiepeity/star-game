import { narrativePreferences } from "../logic/narrative-preferences.js";
import { storyScene } from "./story-scenes.js";
import { NPCS } from "../data/npcs.js";
import { ROOMS, activityAllowed } from "./data.js";
import { authoredEventArt } from "../data/story-art.js";

// This is presentation state only. The original event engine remains the sole
// authority that applies a choice. A saved invitation reply is not a reward.
export function createStoryDirector(api) {
  const life = () => api.state().life;
  const stage = () => life().storyStage;
  const world = () => api.world();
  const save = () => api.save();
  const button = (label, action, value = "true") => ({
    label,
    attrs: `data-stage-${action}="${value}"`,
  });
  function present(story) {
    const event =
      story.event || (stage()?.id === story.outcome?.id ? stage().event : null);
    const plan = storyScene(event, life().game, story.context);
    if (!plan) return false;
    if (!stage() || stage().id !== plan.id) {
      world().storyActors.clear();
      life().storyStage = {
        id: plan.id,
        event: structuredClone(event),
        phase: plan.replyFirst ? "reply" : "ready",
        beat: 0,
        origin: {
          room: api.state().sceneId,
          position: { ...api.state().position },
          activity: structuredClone(api.state().activity),
        },
      };
    }
    const st = stage();
    // Recompile content on load; never trust a stored room/cast or replay a
    // resolved choice just because an old presentation checkpoint says so.
    st.plan = plan;
    st.beat = Math.max(
      0,
      Math.min(plan.beats.length - 1, Number.isInteger(st.beat) ? st.beat : 0),
    );
    if (!ROOMS[st.origin?.room])
      st.origin = {
        room: "home",
        position: { ...ROOMS.home.entry },
        activity: null,
      };
    if (![st.origin.position?.x, st.origin.position?.y].every(Number.isFinite))
      st.origin.position = { ...ROOMS[st.origin.room].entry };
    const activity = st.origin.activity;
    if (
      activity &&
      (!activityAllowed(st.origin.room, activity.itemId, activity.kind) ||
        !Number.isFinite(activity.elapsed))
    )
      st.origin.activity = null;
    if (
      ![
        "reply",
        "ready",
        "travel",
        "enter",
        "beat",
        "outcome",
        "exit",
        "return",
      ].includes(st.phase)
    )
      st.phase = "ready";
    if (story.outcome && !["exit", "return"].includes(st.phase))
      st.phase = "outcome";
    life().auto = false;
    save();
    render(story.choices);
    return true;
  }
  function say(text, choices, label, speaker, note = "") {
    const st = stage();
    api.narrate({
      title: label || st.plan.title,
      text,
      choices,
      portrait: NPCS[speaker || st.plan.cast[0]]?.portrait,
      context:
        st.phase === "reply"
          ? "手機 · 新的邀約"
          : `${ROOMS[st.plan.room].name} · ${st.plan.names}`,
      contextNote: [note, narrativePreferences(life().game).storyReminders && ["ready", "reply"].includes(st.phase) ? "人物故事有了新的進展，這次回應會留在旅程裡。" : ""].filter(Boolean).join(" · "),
      readerKey: `${st.id}:${st.phase}:${st.beat}`,
    });
  }
  function render(choices) {
    const st = stage();
    if (!st) return;
    if (st.phase === "reply") {
      say(
        st.event.text,
        (choices || api.choices()).map((c) => ({
          label: c.label,
          note: c.note,
          attrs: `data-stage-reply="${api.escape(c.id)}"`,
        })),
        st.plan.title,
      );
    } else if (st.phase === "ready") {
      say(
        `與${st.plan.names}的故事，從${ROOMS[st.plan.room].name}繼續。`,
        [button(`前往${ROOMS[st.plan.room].name}`, "start")],
        st.plan.title,
        null,
        "這段相聚不另扣行程天數",
      );
    } else if (st.phase === "travel") {
      travel(st.plan.room, () => {
        st.phase = "enter";
        save();
        enter();
      });
    } else if (st.phase === "enter") enter();
    else if (st.phase === "beat" || st.phase === "outcome") {
      // Reloading on a line restores the cast at their marks before showing it.
      if (api.state().sceneId !== st.plan.room)
        return travel(st.plan.room, () => render());
      world().storyActors.start(st.plan, () => {}, true);
      if (st.phase === "outcome") {
        world().storyActors.pose(st.plan.cast[0], "listen");
        say(
          life().game.eventOutcome?.outcome || "這次選擇已寫進旅程。",
          [
            button("把這一刻記下來", "done"),
            ...(authoredEventArt(st.event, life().game.eventOutcome)
              ? [button("看看這一幕的插畫", "art")]
              : []),
          ],
          st.plan.title,
          null,
          "選擇已記錄",
        );
      } else {
        const beat = st.plan.beats[st.beat];
        world().storyActors.pose(beat.speaker, beat.gesture);
        const last = st.beat === st.plan.beats.length - 1;
        const options = !last
          ? [button("繼續 →", "next")]
          : st.reply
            ? [button("繼續這次相聚", "resolve")]
            : (choices || api.choices()).map((c) => ({
                label: c.label,
                note: c.note,
                attrs: `data-stage-choice="${api.escape(c.id)}"`,
              }));
        say(
          beat.text,
          options.length ? options : [button("繼續", "resolve")],
          beat.label,
          beat.speaker,
          `第 ${st.beat + 1} / ${st.plan.beats.length} 幕`,
        );
      }
    } else if (st.phase === "exit") depart();
    else if (st.phase === "return") returnHome();
  }
  function travel(room, after) {
    const st = stage();
    api.storyTravelTo(
      room,
      () => {
        if (stage() !== st) return;
        after();
      },
      () => {
        if (stage() !== st) return;
        save();
        say(
          "地點素材還沒載入完成。這一幕和你的選擇都已保留，準備好後再繼續。",
          [button("重新前往", "retry")],
          "路上稍作停留",
        );
      },
    );
  }
  function enter() {
    const st = stage();
    if (api.state().sceneId !== st.plan.room) {
      st.phase = "travel";
      save();
      render();
      return;
    }
    say(
      `你與${st.plan.names}走到可以好好說話的地方。`,
      [button("略過走位", "skip")],
      "相聚的時刻",
    );
    world().storyActors.start(st.plan, () => {
      if (stage() !== st) return;
      st.phase = "beat";
      save();
      render();
    });
  }
  function resolve(id) {
    const st = stage();
    if (!st || !["reply", "beat"].includes(st.phase)) return;
    if (st.event.choices?.length && !api.choices().some((c) => c.id === id))
      return;
    // Physical choices only become actionable once everyone is present.
    if (
      st.phase === "beat" &&
      (world().storyActors.snapshot()?.phase !== "beat" ||
        api.state().sceneId !== st.plan.room)
    )
      return;
    const result = api.choose(id || null);
    if (!result) {
      api.toast("這個選項目前無法完成，請重新選擇。");
      return;
    }
    if (st.phase === "reply") {
      life().storyStage = null;
      save();
      api.fallback({ outcome: result });
      return;
    }
    st.phase = "outcome";
    save();
    render();
  }
  function depart() {
    const st = stage();
    if (api.state().sceneId !== st.plan.room) {
      st.phase = "return";
      save();
      returnHome();
      return;
    }
    world().storyActors.start(st.plan, () => {}, true);
    say(
      "把話留在心裡，你們各自回到今天的生活。",
      [button("略過走位", "skip")],
      "下次見",
    );
    world().storyActors.exit(() => {
      if (stage() !== st) return;
      st.phase = "return";
      save();
      returnHome();
    });
  }
  function returnHome() {
    const st = stage();
    world().storyActors.clear();
    travel(st.origin.room, () => {
      world().restoreStoryOrigin(st.origin);
      life().game.eventOutcome = null;
      life().storyStage = null;
      save();
      api.leaveOverlay();
      api.afterStory?.();
    });
  }
  function handle(b) {
    const d = b.dataset,
      st = stage();
    if (!st || !Object.keys(d).some((k) => k.startsWith("stage"))) return false;
    if (d.stageStart && st.phase === "ready") {
      st.phase = "travel";
      save();
      render();
    } else if (d.stageReply && st.phase === "reply") {
      if (
        d.stageReply === st.plan.acceptId &&
        api.choices().some((c) => c.id === d.stageReply)
      ) {
        st.reply = d.stageReply;
        st.phase = "travel";
        save();
        render();
      } else resolve(d.stageReply);
    } else if (
      d.stageNext &&
      st.phase === "beat" &&
      st.beat < st.plan.beats.length - 1
    ) {
      st.beat++;
      save();
      render();
    } else if (
      d.stageChoice &&
      st.phase === "beat" &&
      st.beat === st.plan.beats.length - 1
    )
      resolve(d.stageChoice);
    else if (
      d.stageResolve &&
      st.phase === "beat" &&
      st.beat === st.plan.beats.length - 1
    )
      resolve(st.reply);
    else if (d.stageDone && st.phase === "outcome") {
      st.phase = "exit";
      save();
      render();
    } else if (d.stageSkip) world().storyActors.skip();
    else if (d.stageRetry && ["travel", "return"].includes(st.phase)) render();
    else if (d.stageArt && st.phase === "outcome") {
      const art = authoredEventArt(st.event, life().game.eventOutcome);
      if (art)
        api.show(
          "story-art",
          `${api.heading("A MOMENT TO KEEP", st.plan.title)}<figure class="story-illustration"><img src="${art.src}" alt="${api.escape(art.alt)}"><figcaption>${api.escape(art.alt)}</figcaption></figure><div class="panel-actions"><button data-ui="close">回到這一幕</button></div>`,
        );
    }
    return true;
  }
  return { present, handle };
}
