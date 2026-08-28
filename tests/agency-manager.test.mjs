import test from"node:test";
import assert from"node:assert/strict";
import{ABILITIES}from"../src/data/abilities.js";
import{AGENCIES,AGENCY_LIST}from"../src/data/agencies.js";
import{managerForAgency}from"../src/data/managers.js";
import{state,resetState}from"../src/core/state.js";
import{setSeed}from"../src/core/rng.js";
import{baseAgencyTerms}from"../src/logic/contract-negotiation.js";
import{refreshAgencyJobOffers}from"../src/logic/agency-offers.js";
import{ensureManager,managerAuditionModifier,managerWeeklyBrief}from"../src/logic/manager.js";
import{JOB_BY_ID}from"../src/data/jobs.js";

function fresh(agencyId="starlight"){
 resetState();
 state.stats=Object.fromEntries(ABILITIES.map(name=>[name,500]));
 state.schedule=Array(7).fill("rest");
 state.currentAgencyId=agencyId;
 state.agencySignedWeek=1;
 state.agencyContractEndWeek=100;
 setSeed(`manager-${agencyId}`);
 ensureManager();
}

test("每間經紀公司都有獨立經紀人與差異化支援策略",()=>{
 assert.equal(AGENCY_LIST.length,4);
 for(const agency of AGENCY_LIST){
  const manager=managerForAgency(agency.id);
  assert.equal(manager.agencyId,agency.id);
  assert.ok(manager.workingStyle);
  assert.equal(manager.support.offerRange.length,2);
  assert.ok(manager.support.auditionPrepBonus>0);
 }
});

test("公司原始合約會帶入各自的創作自主與保證試鏡",()=>{
 assert.equal(baseAgencyTerms(AGENCIES.mirror).creativeFreedom,75);
 assert.equal(baseAgencyTerms(AGENCIES.clearvoice).guaranteedAuditions,3);
});

test("經紀人的工作方式會影響邀約數量、保留期限與試鏡準備",()=>{
 fresh("mirror");
 const offers=refreshAgencyJobOffers(),manager=managerForAgency("mirror");
 assert.ok(offers.length>=manager.support.offerRange[0]&&offers.length<=manager.support.offerRange[1]);
 assert.ok(offers.every(o=>o.managerId===manager.id&&o.expiresWeek===state.week+2));
 assert.ok(managerAuditionModifier(JOB_BY_ID[offers[0].jobId])>0);
 const brief=managerWeeklyBrief();
 assert.match(brief.items[0],/工作邀約/);
 assert.ok(brief.items.length>=3);
});
