import test from "node:test";
import assert from "node:assert/strict";
import { state, resetState } from "../src/core/state.js";
import { NPCS } from "../src/data/npcs.js";
import { ROMANCE_ROUTES } from "../src/data/romance.js";
import { meetNpc } from "../src/logic/npc-engine.js";
import { npcApp } from "../src/views/npc.js";
import { peopleApp, peopleHubApp } from "../src/views/people.js";

function profile(id, tab = "overview") {
  state.npcProfileTab = tab;
  state.selectedNpc = id;
  state.peopleSection = "profiles";
  return peopleHubApp();
}

test("人物檔案不以認識或信任數值公開作者設定與未演出的戀愛發展", () => {
  resetState();
  for (const [id, npc] of Object.entries(NPCS)) {
    meetNpc(id);
    Object.assign(state.relationships[id], { trust: 99, closeness: 99, affection: 99, romance: "interested" });
    const html = profile(id);
    assert.ok(html.includes(npc.name), id);
    assert.ok(html.includes(npc.job), id);
    assert.match(html, /相處感覺|信任觀察/);
    for (const field of ["privateSelf", "motivation", "fear", "weaknesses", "secret", "arc", "playerHook"]) {
      assert.ok(!html.includes(npc.profile[field]), `${id}: author field ${field} must not appear`);
    }
    assert.ok(!html.includes(ROMANCE_ROUTES[id].hook), `${id}: future romance hook`);
    assert.doesNotMatch(html, /<blockquote>|人物成長方向|與玩家的連結|人物核心|職涯 Lv\.|動能 \d/);
  }
});

test("尚未認識的人物與訊息不出現在通訊錄或檔案，空頁使用玩家行動提示", () => {
  resetState();
  state.npcMessages.push({ npcId: "silver_pc", text: "尚未交換聯絡方式的訊息" });
  for (const html of [peopleApp(), npcApp()]) {
    assert.match(html, /安排自由活動或參加工作/);
    assert.doesNotMatch(html, /免費人脈|劇透|第一輪|沈霧棠|尚未交換聯絡方式的訊息/);
  }
  meetNpc("jiqing");
  assert.doesNotMatch(peopleApp(), /沈霧棠|尚未交換聯絡方式的訊息/);
  assert.doesNotMatch(profile("silver_pc"), /沈霧棠/);
});

test("檔案保留當前關係、操作限制與真實共同回憶", () => {
  resetState();
  meetNpc("jiqing");
  let html = profile("jiqing");
  assert.match(html, /初次相遇|FIRST ENCOUNTER/);
  html = profile("jiqing", "relationship");
  assert.match(html, /正式交往後才會開放/);
  assert.match(html, /data-npc-interact="date"[^>]*disabled/);
  Object.assign(state.relationships.jiqing, { closeness: 80, trust: 85, romance: "dating", visibility: "underground" });
  state.sharedMemories = [{ npcId: "jiqing", week: 12, type: "engine-metadata", title: "節目結束後的談話", text: "她親口說起那次失去黃金時段的經歷。" }];
  html = profile("jiqing");
  assert.match(html, /交往中|地下戀情/);
  html = profile("jiqing", "relationship");
  assert.match(html, /data-romance-action="public"/);
  assert.doesNotMatch(html, /data-npc-interact="date"[^>]*disabled/);
  html = profile("jiqing", "memories");
  assert.match(html, /她親口說起那次失去黃金時段的經歷。/);
  assert.doesNotMatch(html, /engine-metadata/);
  assert.doesNotMatch(html, /data-npc-interact="date"[^>]*disabled/);
});

test("人物關係網只回顧實際合作或公開消息，不洩漏尚未得知的關係", () => {
  resetState();
  meetNpc("jiqing");
  let html = profile("jiqing", "about");
  assert.doesNotMatch(html, /周予珩|多年好友|72\/100|訪談合作多年/);
  meetNpc("guchengxi");
  html = profile("jiqing", "about");
  assert.doesNotMatch(html, /多年好友|72\/100|訪談合作多年/);
  state.completedWorks.push({ id: "W-known", title: "晚間訪談", npcCast: ["jiqing", "guchengxi"] });
  html = profile("jiqing", "about");
  assert.match(html, /共同合作/);
  assert.match(html, /你們一起參與過《晚間訪談》。/);
  state.industryNews.push({ key: "npc-rel:12:jiqing:guchengxi:close", title: "喬映澄與周予珩的關係出現變化", body: "喬映澄與周予珩在公開訪談中分享了合作近況。" });
  html = profile("jiqing", "about");
  assert.match(html, /圈內消息/);
  assert.match(html, /在公開訪談中分享了合作近況/);
  assert.doesNotMatch(html, /多年好友|72\/100|訪談合作多年/);
});
