import test from"node:test";
import assert from"node:assert/strict";
import{existsSync}from"node:fs";
import{eventStoryArt,runnerSceneArt,STORY_ART_ASSETS}from"../src/data/story-art.js";

test("所有劇情與場景美術都已存在且沒有漏接",()=>{
 const unique=new Set(STORY_ART_ASSETS.map(art=>art.src));
 assert.equal(unique.size,55);
 for(const src of unique)assert.ok(existsSync(new URL(`../${src.replace(/^\.\//,"")}`,import.meta.url)),src);
});

test("行程會依內容切換場景",()=>{
 assert.match(runnerSceneArt("audition").src,/audition-room/);
 assert.match(runnerSceneArt("free","radio").src,/star-city-radio-night/);
 assert.match(runnerSceneArt("rest").src,/rookie-room-night/);
});

test("人物主線、戀愛與職涯里程碑會選到專屬 CG",()=>{
 assert.match(eventStoryArt({id:"guest-boundary",kind:"人物事件"}).src,/chapter-jiqing-guest-boundary/);
 assert.match(eventStoryArt({id:"missing-shot",kind:"人物事件"}).src,/chapter-shenyao-missing-shot/);
 assert.match(eventStoryArt({id:"fan-project",kind:"人物事件"}).src,/chapter-tangtang-fan-project/);
 assert.match(eventStoryArt({id:"young-actor",kind:"人物事件"}).src,/chapter-guchengxi-young-actor/);
 assert.match(eventStoryArt({id:"copied-work",kind:"人物事件"}).src,/chapter-linxiafan-copied-work/);
 assert.match(eventStoryArt({id:"two-names",kind:"人物事件"}).src,/chapter-lujingran-two-names/);
 assert.match(eventStoryArt({id:"bad-review",kind:"人物事件"}).src,/chapter-xiayutong-bad-review/);
 assert.match(eventStoryArt({id:"family-seat",kind:"人物事件"}).src,/chapter-sufei-family-seat/);
 assert.match(eventStoryArt({id:"stage-return",kind:"人物事件"}).src,/chapter-guchengxi-stage-return/);
 assert.match(eventStoryArt({id:"studio-year",kind:"人物事件"}).src,/chapter-linxiafan-studio-year/);
 assert.match(eventStoryArt({id:"same-credit",kind:"人物事件"}).src,/chapter-sufei-same-credit/);
 assert.match(eventStoryArt({id:"crew-hour",kind:"人物事件"}).src,/chapter-xiayutong-crew-hour/);
 assert.match(eventStoryArt({id:"board-choice",kind:"人物事件"}).src,/chapter-hanzhiyuan-board-choice/);
 assert.match(eventStoryArt({id:"artist-no",kind:"人物事件"}).src,/chapter-chengyian-artist-no/);
 assert.match(eventStoryArt({id:"voice-rest",kind:"人物事件"}).src,/chapter-tangtang-voice-rest/);
 assert.match(eventStoryArt({id:"listener-letter",kind:"人物事件"}).src,/chapter-jiqing-listener-letter/);
 assert.match(eventStoryArt({id:"rough-cut",kind:"人物事件"}).src,/shenyao-rough-cut/);
 assert.match(eventStoryArt({id:"npc-romance-lujingran:ambiguous:1",kind:"戀愛事件"}).src,/route-lujingran-rooftop-confession/);
 assert.match(eventStoryArt({id:"award-ceremony-52",title:"名字在頒獎台上被念出"}).src,/milestone-first-award/);
 assert.match(eventStoryArt({id:"scandal-choice:demo",title:"公關危機"}).src,/milestone-scandal-press/);
});
