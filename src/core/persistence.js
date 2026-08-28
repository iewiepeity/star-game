import{assertGameState}from"./save-schema.js";
const AUTO_KEY="star-game-save";
const MANUAL_PREFIX="star-game-save-slot-";
const LEGACY_MANUAL_KEY="star-game-save-manual";
const BACKUP_KEY="star-game-save-backup";
export const SAVE_VERSION=4;
export const SAVE_SLOT_COUNT=5;
const SUPPORTED_SAVE_VERSIONS=new Set([1,2,3,4]);

function migrateEnvelope(parsed){if(!parsed||!SUPPORTED_SAVE_VERSIONS.has(parsed.v)||!parsed.state)return null;let state=structuredClone(parsed.state);if(parsed.v<4){state.saveVersion=4;if(!Array.isArray(state.eventQueue))state.eventQueue=[];if(state.activeEvent==null)state.activeEvent=null;if(!Number.isFinite(state.health))state.health=100;if(!Number.isInteger(state.overworkStrikes))state.overworkStrikes=0;if(!state.awardSeasons||typeof state.awardSeasons!=="object")state.awardSeasons={};if(!Array.isArray(state.careerRouteHistory))state.careerRouteHistory=[];if(!Number.isInteger(state.rngCursor))state.rngCursor=0;if(state.rngSeed==null)state.rngSeed=Date.now()>>>0}return{...parsed,v:SAVE_VERSION,state}}
function readRaw(key){try{const raw=localStorage.getItem(key);if(!raw)return null;return migrateEnvelope(JSON.parse(raw))}catch{return null}}
function writeRaw(key,state,label=""){try{assertGameState(state);localStorage.setItem(key,JSON.stringify({game:"star-game",v:SAVE_VERSION,state,savedAt:Date.now(),label}));return true}catch{return false}}
function meta(slot,data){return data?{slot,savedAt:data.savedAt,week:data.state.week,name:data.state.name,label:data.label||"",version:data.v}:null}

export function saveState(state){writeRaw(AUTO_KEY,state,"自動存檔")}
export function loadState(){return readRaw(AUTO_KEY)?.state||null}
export function autoSaveMeta(){return meta("auto",readRaw(AUTO_KEY))}
export function manualSlotKey(slot){return`${MANUAL_PREFIX}${slot}`}
export function saveManualSlot(slot,state,label=""){if(slot<1||slot>SAVE_SLOT_COUNT)return false;backupCurrent(state,`覆寫槽位 ${slot} 前備份`);return writeRaw(manualSlotKey(slot),state,label)}
export function loadManualSlot(slot){return readRaw(manualSlotKey(slot))?.state||null}
export function manualSlotMetas(){return Array.from({length:SAVE_SLOT_COUNT},(_,index)=>meta(index+1,readRaw(manualSlotKey(index+1))))}
export function deleteManualSlot(slot){try{localStorage.removeItem(manualSlotKey(slot));return true}catch{return false}}
export function backupCurrent(state,label="自動備份"){return writeRaw(BACKUP_KEY,state,label)}
export function loadBackup(){return readRaw(BACKUP_KEY)?.state||null}
export function backupMeta(){return meta("backup",readRaw(BACKUP_KEY))}
export function exportSave(state){assertGameState(state);return JSON.stringify({game:"star-game",v:SAVE_VERSION,exportedAt:Date.now(),state},null,2)}
export function parseImportedSave(text){const parsed=migrateEnvelope(JSON.parse(text));if(parsed?.game!=="star-game"||!parsed.state)throw new Error("不是可支援的《星途未定》存檔");return assertGameState(parsed.state)}
export function migrateLegacyManualSlot(){try{if(localStorage.getItem(manualSlotKey(1)))return;const legacy=readRaw(LEGACY_MANUAL_KEY);if(legacy)localStorage.setItem(manualSlotKey(1),JSON.stringify({...legacy,v:SAVE_VERSION,label:"舊版手動存檔"}))}catch{}}
export const saveManualState=state=>saveManualSlot(1,state);
export const loadManualState=()=>loadManualSlot(1);
export const manualSaveMeta=()=>manualSlotMetas()[0];
