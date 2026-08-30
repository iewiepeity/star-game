import test from "node:test";
import assert from "node:assert/strict";
import { state, resetState } from "../src/core/state.js";
import { NPC_LONGFORM_CHAPTERS, NPC_ROMANCE_VOICES } from "../src/data/longform-content.js";
import { FEATURE_JOB_IDS } from "../src/data/job-feature-beats.js";
import { JOB_BY_ID } from "../src/data/jobs.js";
import { applyEffects } from "../src/logic/event-engine.js";
import { careerCommitmentAccess } from "../src/logic/job-engine.js";
import { leastExposed, recordExposure } from "../src/logic/deepening-engine.js";
import { migrateSaveState } from "../src/core/migrations.js";

test("十位 NPC 各有八章主線與六階段專屬戀愛聲音",()=>{
 assert.equal(Object.keys(NPC_LONGFORM_CHAPTERS).length,10);
 for(const chapters of Object.values(NPC_LONGFORM_CHAPTERS)){assert.equal(chapters.length,5);assert.equal(new Set(chapters.map(x=>x.title)).size,5);assert.ok(chapters.every(x=>x.choices.length===2))}
 for(const voice of Object.values(NPC_ROMANCE_VOICES))for(const stage of ["interested","ambiguous","dating","committed","engaged","married"])assert.ok(voice[stage]);
});

test("再升級十五份 C 級工作後共有二十五份 B 級特色工作",()=>{
 assert.equal(FEATURE_JOB_IDS.length,25);
 assert.deepEqual(FEATURE_JOB_IDS.slice(0,15),Array.from({length:15},(_,i)=>`J${String(i+36).padStart(3,"0")}`));
});

test("內容曝光會避開最近重複並優先選未看過內容",()=>{
 resetState();const pool=[{id:"a"},{id:"b"},{id:"c"}];recordExposure("a");recordExposure("a");recordExposure("b");assert.equal(leastExposed(pool).id,"c");recordExposure("c");assert.equal(leastExposed(pool).id,"b");
});

test("第二年職涯承諾會暫時關閉其他三星以上路線",()=>{
 resetState();state.week=53;applyEffects({careerCommitment:"music",commitmentLabel:"音樂作品"},"年度選擇");assert.equal(careerCommitmentAccess(JOB_BY_ID.J036).ok,true);assert.equal(careerCommitmentAccess(JOB_BY_ID.J037).ok,false);assert.equal(careerCommitmentAccess(JOB_BY_ID.J001).ok,true);state.week=80;assert.equal(careerCommitmentAccess(JOB_BY_ID.J037).ok,true);
});

test("v12 存檔會連續升級 v16 並補齊長期內容欄位",()=>{
 const migrated=migrateSaveState({week:20},12);assert.equal(migrated.version,16);assert.deepEqual(migrated.state.contentExposure,{});assert.deepEqual(migrated.state.npcLongformProgress,{});assert.deepEqual(migrated.state.careerCommitmentHistory,[]);assert.deepEqual(migrated.state.careerDoctrine,{});assert.deepEqual(migrated.state.npcInvitationHistory,[]);
});
