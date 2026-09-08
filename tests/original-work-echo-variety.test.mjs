import test from "node:test";
import assert from "node:assert/strict";
import { ORIGINAL_WORK_ECHOES, originalEchoCopy, selectOriginalEcho } from "../src/data/work-echo-content.js";
import { resetState, state, hydrateState } from "../src/core/state.js";
import { tickWorkEchoes, releasedEchoWorks, applyWorkEchoEffect, normalizeWorkEchoes } from "../src/logic/work-echoes.js";
import { allThreads } from "../src/logic/forum-feed.js";
import { npcSocialPost } from "../src/logic/social-context.js";
import { validateGameState } from "../src/core/save-schema.js";
import { workEchoTimeline } from "../src/views/work-echoes.js";
import { creativeApp } from "../src/views/creative.js";
import { CREATIVE_DIRECTION_STORIES } from "../src/logic/creative.js";
import { esc } from "../src/core/utils.js";

const stages = ["opening", "weeks", "anniversary"];
const categories = { song: "歌曲", script: "電影", show: "綜藝" };
const authoredWork = (type = "song", direction = "heart", more = {}) => ({
  id: `original-${type}-${direction}`, title: "這次真的不一樣", creativeProjectId: `project-${type}-${direction}`,
  original: true, creativeType: type, direction, category: categories[type], quality: 85,
  marketScore: 88, completedWeek: 1, npcCast: [], ...more,
});
const queue = () => [state.activeEvent, ...(state.eventQueue || []), ...(state.queuedEvents || [])].filter(Boolean);

test("九方向各有三階段三套完整手寫情境，共八十一套而非作品名排列組合", () => {
  const ids = new Set(), bodies = new Set();
  let count = 0;
  for (const [type, directions] of Object.entries(ORIGINAL_WORK_ECHOES)) {
    assert.equal(Object.keys(directions).length, 3);
    for (const [direction, chapters] of Object.entries(directions)) for (const stage of stages) {
      assert.equal(chapters[stage].length, 3, `${type}/${direction}/${stage}`);
      for (const pack of chapters[stage]) {
        count++;
        const key = `${type}:${direction}:${stage}:${pack.id}`;
        assert.ok(!ids.has(key)); ids.add(key);
        assert.ok(!bodies.has(pack.text)); bodies.add(pack.text);
        for (const field of ["title", "text", "publicTitle", "publicText", "npcText"]) assert.ok(pack[field].includes("{work}"), `${key}:${field}`);
        assert.ok((pack.text.match(/\p{Script=Han}/gu) || []).length >= 95, key);
        assert.equal(pack.replies.length, 3);
        assert.equal(new Set(pack.replies).size, 3);
        for (const reply of pack.replies) assert.ok(reply.includes("{work}"), key);
        assert.ok(pack.publicText !== pack.text);
        if (stage === "anniversary") assert.match(pack.npcText, /隔了一年/);
      }
    }
  }
  assert.equal(count, 81);
});

test("同方向連做作品先輪完三套，不連抽同段；九方向每階段皆可抵達", () => {
  for (const [type, directions] of Object.entries(ORIGINAL_WORK_ECHOES)) for (const direction of Object.keys(directions)) for (const stage of stages) {
    const records = [], copies = [];
    for (let i = 0; i < 9; i++) {
      const work = authoredWork(type, direction, { id: `repeat-${i}` });
      const result = originalEchoCopy(work, stage, records, null);
      assert.ok(result);
      if (i) assert.notEqual(result.copyId, copies.at(-1));
      copies.push(result.copyId);
      records.push({ workId: work.id, stage, ...result });
      assert.equal(selectOriginalEcho(work, stage, records).copyId, result.copyId);
    }
    for (let i = 0; i < 9; i += 3) assert.equal(new Set(copies.slice(i, i + 3)).size, 3);
    assert.equal(new Set(copies).size, 3);
  }
});

test("回響的作品情境、公開文字與存讀檔選取穩定，不消耗遊戲亂數或發獎", () => {
  resetState(); state.week = 60;
  state.completedWorks = [authoredWork()];
  const economy = JSON.stringify({ money: state.money, fans: state.fans, fame: state.fame, rngSeed: state.rngSeed, rngCursor: state.rngCursor, schedule: state.schedule });
  tickWorkEchoes();
  assert.equal(state.workEchoes.records.length, 3);
  assert.equal(queue().length, 3);
  const before = structuredClone(state.workEchoes);
  tickWorkEchoes();
  assert.deepEqual(state.workEchoes, before);
  hydrateState(JSON.parse(JSON.stringify(state))); tickWorkEchoes();
  assert.deepEqual(state.workEchoes, before);
  assert.equal(queue().length, 3);
  assert.equal(JSON.stringify({ money: state.money, fans: state.fans, fame: state.fame, rngSeed: state.rngSeed, rngCursor: state.rngCursor, schedule: state.schedule }), economy);
  assert.deepEqual(normalizeWorkEchoes(state.workEchoes), state.workEchoes);
  const validation = validateGameState(state);
  assert.ok(validation.ok, validation.errors.join("\n"));
});

test("市場分層只用實際資料；冷作、高品質慢熱、亮眼與未知成績各自成立", () => {
  const get = more => originalEchoCopy(authoredWork("song", "heart", more), "weeks", [], null);
  const low = get({ quality: 40, marketScore: 35 }), slow = get({ quality: 85, marketScore: 35 }), high = get({ marketScore: 92 });
  assert.match(low.text, /問題並沒有/);
  assert.match(slow.text, /重新提起/);
  assert.match(high.text, /亮眼的市場回應/);
  assert.doesNotMatch(low.text + slow.text, /亮眼的市場回應|票房冠軍|銷量突然翻盤了/);
  assert.doesNotMatch(get({ marketScore: undefined }).text, /亮眼的市場回應|市場評分落在中段/);
  assert.equal(low.publicText, high.publicText);
});

test("先前自豪、遺憾、暫不定義會接入未讀後續，但不洩漏到公開論壇與角色星語", () => {
  for (const choice of ["proud", "mixed", "quiet"]) {
    resetState(); state.week = 60; state.knownPeople = ["jiqing"];
    state.completedWorks = [authoredWork("show", "warm", { npcCast: ["jiqing"] })];
    tickWorkEchoes();
    const publicBefore = JSON.stringify(state.workEchoes.records.map(({ publicTitle, publicText, replies, npcText }) => ({ publicTitle, publicText, replies, npcText })));
    const ids = state.workEchoes.records.map(r => r.copyId);
    assert.ok(applyWorkEchoEffect({ workId: state.completedWorks[0].id, stage: "opening", choice }).ok);
    const later = state.workEchoes.records[1];
    assert.match(later.text, choice === "mixed" ? /承認過不滿意/ : choice === "quiet" ? /選擇先不替感受定名/ : /真心喜歡的部分/);
    assert.equal(JSON.stringify(state.workEchoes.records.map(({ publicTitle, publicText, replies, npcText }) => ({ publicTitle, publicText, replies, npcText }))), publicBefore);
    assert.deepEqual(state.workEchoes.records.map(r => r.copyId), ids);
    assert.equal(queue().find(item => item.event.id === later.id).event.text, later.text);
    assert.equal(allThreads().filter(t => t.workId === later.workId).length, 3);
    assert.equal(npcSocialPost("jiqing").text, state.workEchoes.records[2].npcText);
  }
});

test("舊存檔只升級未回應原創章節，更新已排故事，不重排或修改已回答歷史", () => {
  resetState(); state.week = 60;
  state.completedWorks = [authoredWork()]; tickWorkEchoes();
  assert.ok(applyWorkEchoEffect({ workId: state.completedWorks[0].id, stage: "opening", choice: "quiet" }).ok);
  const answered = state.workEchoes.records[0];
  delete answered.copyVersion; delete answered.copyId; delete answered.choiceOutcomes;
  answered.text = "以前已經回答的故事。";
  for (const record of state.workEchoes.records.slice(1)) {
    delete record.copyVersion; delete record.copyId; delete record.choiceOutcomes;
    record.text = "舊版共用的回響。";
  }
  const savedAnswered = structuredClone(answered), count = queue().length;
  tickWorkEchoes();
  assert.deepEqual(state.workEchoes.records[0], savedAnswered);
  for (const record of state.workEchoes.records.slice(1)) {
    assert.equal(record.copyVersion, 1);
    assert.notEqual(record.text, "舊版共用的回響。");
    assert.equal(queue().find(item => item.event.id === record.id).event.text, record.text);
  }
  assert.equal(queue().length, count);
});

test("只有原創專案紀錄或缺少方向的舊履歷也能接回實際類型，沒有重複列出", () => {
  const project = { id: "legacy", type: "script", direction: "arthouse", title: "未寄出的信", status: "released", releaseWeek: 1, quality: 900, marketScore: 40, selfParticipation: false, distributionMode: "independent" };
  const game = { week: 60, creativeProjects: [project], completedWorks: [] };
  const before = structuredClone(game);
  const works = releasedEchoWorks(game);
  assert.deepEqual(game, before);
  assert.equal(works.length, 1);
  assert.equal(works[0].direction, "arthouse");
  assert.equal(works[0].quality, 90);
  tickWorkEchoes(game);
  assert.equal(game.workEchoes.records.length, 3);
  assert.match(game.workEchoes.records[0].text, /自主發行/);
  assert.match(game.workEchoes.records[2].text, /這次你留在幕後/);
  assert.ok(game.workEchoes.records.every(r => r.npcId === null && r.npcText === ""));
  game.completedWorks = [{ id: "creative-legacy", creativeProjectId: "legacy", title: project.title, category: "電視劇", completedWeek: 1, quality: 90 }];
  assert.equal(releasedEchoWorks(game).length, 1);
  assert.equal(releasedEchoWorks(game)[0].direction, "arthouse");
});

test("不把一般通告或未知方向誤當手寫原創方向；奇怪作品名按原字呈現並安全轉義", () => {
  assert.equal(originalEchoCopy({ id: "paid", category: "歌曲", direction: "heart" }, "opening", [], null), null);
  assert.equal(originalEchoCopy(authoredWork("song", "not-a-route"), "opening", [], null), null);
  const work = authoredWork("script", "character", { title: "$& <script>不是程式</script>" });
  const record = originalEchoCopy(work, "opening", [], null);
  assert.ok(record.title.includes(work.title));
  assert.doesNotMatch(record.text, /\{work\}|undefined|NaN/);
  record.workId = work.id; record.stage = "opening"; record.dueWeek = 2;
  const html = workEchoTimeline(work.id, { workEchoes: { records: [record] } });
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});

test("新章節的選擇結果按媒介區分，選擇只反映心情不自行安排下一份作品", () => {
  const outcomes = [];
  for (const [type, direction] of [["song", "heart"], ["script", "character"], ["show", "warm"]]) {
    resetState(); state.week = 2; state.completedWorks = [authoredWork(type, direction)];
    tickWorkEchoes();
    const event = queue()[0].event;
    outcomes.push(event.choices[0].outcome);
    assert.equal(event.choices.length, 3);
    assert.ok(event.choices.every(choice => choice.outcome.length > 35));
    const before = JSON.stringify({ money: state.money, schedule: state.schedule, works: state.completedWorks, projects: state.creativeProjects });
    assert.ok(applyWorkEchoEffect({ workId: state.completedWorks[0].id, stage: "opening", choice: "proud" }).ok);
    assert.equal(JSON.stringify({ money: state.money, schedule: state.schedule, works: state.completedWorks, projects: state.creativeProjects }), before);
  }
  assert.equal(new Set(outcomes).size, 3);
});

const releasedProject = (type, direction, more = {}) => ({
  id: "CP-1000-0", type, direction, title: "留在成品裡的那一頁", status: "released",
  progress: 100, quality: 850, revisions: 0, productionProgress: 100,
  productionSessions: 3, releaseWeek: 1, marketScore: 65, revenue: 12345,
  team: [], selfParticipation: false, distributionMode: "independent", ...more,
});
const releaseResult = html => {
  const result = html.match(/<div class="creative-release-result">([\s\S]*?)<\/div>/)?.[1];
  assert.ok(result, "已發行作品必須顯示實際發行結果卡片");
  return result;
};

test("九方向的舊檔發行卡片依真實低高分分流，不再固定顯示中檔文字", () => {
  for (const [type, directions] of Object.entries(CREATIVE_DIRECTION_STORIES)) {
    for (const [direction, story] of Object.entries(directions)) {
      const rendered = [];
      for (const [marketScore, slot] of [[35, 0], [92, 2]]) {
        resetState();
        // Both pre-history saves and migrated saves with an empty history use
        // the recorded score, without manufacturing a history during rendering.
        const project = releasedProject(type, direction, { marketScore, ...(slot ? { storyHistory: [] } : {}) });
        state.creativeProjects = [project];
        const before = structuredClone(state);
        const html = creativeApp(), result = releaseResult(html);
        assert.ok(result.includes(`市場評分 ${marketScore}</b>`));
        assert.ok(result.includes(`<p>${esc(story.releaseBeats[slot])}</p>`), `${type}/${direction}/${marketScore}`);
        assert.ok(!result.includes(`<p>${esc(story.release)}</p>`));
        assert.doesNotMatch(html, /class="creative-story-map"|發行文本示例（非實際成績）/);
        assert.ok(!html.includes(`<p>${esc(story.release)}</p>`), "整張已發行卡片都不能混入固定中檔示例");
        assert.equal(creativeApp(), html);
        assert.deepEqual(state, before);
        rendered.push(result.match(/<p>([\s\S]*?)<\/p>/)[1]);
      }
      assert.notEqual(rendered[0], rendered[1]);
    }
  }
});

test("發行卡片保留最後一段已保存原文，不因重繪、分數或新文本池改寫歷史", () => {
  resetState();
  const savedText = "當年保存的 <b>原文</b>：還有遺憾 & 也確實完成了。";
  const project = releasedProject("song", "heart", {
    marketScore: 35,
    storyHistory: [
      { week: 1, phase: "release", text: "比較早的發行紀錄。" },
      { week: 2, phase: "release", text: savedText },
      { week: 3, phase: "release", text: "" },
      { week: 4, phase: "development", text: "這不是發行紀錄，不該取代它。" },
    ],
  });
  state.creativeProjects = [project];
  const before = structuredClone(state);
  const html = creativeApp(), result = releaseResult(html);
  assert.ok(result.includes(`<p>${esc(savedText)}</p>`));
  assert.ok(result.includes("市場評分 35</b>"));
  assert.doesNotMatch(result, /比較早的發行紀錄|這不是發行紀錄|<b>原文<\/b>/);
  assert.equal(creativeApp({ collapsedProjectIds: new Set([project.id]) }).includes(`<p>${esc(savedText)}</p>`), true);
  assert.equal(creativeApp(), html);
  assert.deepEqual(state, before);
});

test("只有未完成企劃展示明確標示的發行示例，售出企劃不冒充已發行成品", () => {
  resetState();
  const project = releasedProject("show", "warm", { status: "draft", progress: 25 });
  state.creativeProjects = [project];
  const draftBefore = structuredClone(state), draft = creativeApp();
  assert.match(draft, /class="creative-story-map"/);
  assert.match(draft, /發行文本示例（非實際成績）/);
  assert.doesNotMatch(draft, /class="creative-release-result"/);
  assert.deepEqual(state, draftBefore);

  project.status = "sold"; project.saleValue = 3210;
  const soldBefore = structuredClone(state), sold = creativeApp();
  assert.match(sold, /class="creative-release-result sold"/);
  assert.match(sold, /後續成品不再由你主導/);
  assert.doesNotMatch(sold, /class="creative-story-map"|市場評分|發行文本示例（非實際成績）/);
  assert.deepEqual(state, soldBefore);
});
