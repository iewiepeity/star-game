import{AGENCY_LIST}from"../data/agencies.js";
import{state}from"../core/state.js";
import{applyToAgency,scheduleAgencyInterview,acceptAgencyOffer,declineAgencyOffer}from"../logic/agency.js";
import{refreshAgencyJobOffers}from"../logic/agency-offers.js";
import{scheduleActivity}from"../logic/scheduled-activities.js";
import{render}from"../render.js";
export function bindAgency(){document.querySelectorAll("[data-select-agency]").forEach(x=>x.onclick=()=>{state.selectedAgencyId=x.dataset.selectAgency;render()});document.querySelectorAll("[data-agency-action]").forEach(x=>x.onclick=()=>{const act=x.dataset.agencyAction,id=state.selectedAgencyId||AGENCY_LIST[0].id;if(act==="apply")applyToAgency(id);if(act==="schedule-interview")scheduleAgencyInterview(id);if(act==="accept-offer"){acceptAgencyOffer();refreshAgencyJobOffers()}if(act==="decline-offer")declineAgencyOffer();render()});document.querySelectorAll("[data-manager-action]").forEach(x=>x.onclick=()=>{const type=x.dataset.managerAction,label=type==="career"?"和經紀人做職涯會談":type==="apologize"?"和經紀人做危機後溝通":"聯絡經紀人聊近況";const r=scheduleActivity("manager_interact",{type},label,{fatigue:2,stamina:2});state.notice=r.message;render()})}
