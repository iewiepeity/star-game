// 核心層：整個遊戲唯一的可變狀態物件。所有模組都 import 同一個 state 參照並直接讀寫其屬性；
// 只有「整個換掉」（新的一輪）時才會重新指派 state 本身，而重新指派只能發生在本檔案裡——
// 其他模組要重置整局，必須呼叫 resetState()，不能自己寫 `state = ...`（ES module 的具名匯出重新指派，只有宣告它的檔案能做，
// 但其他檔案 import 進去的仍是「即時繫結」，resetState() 執行完之後，其他模組讀到的 state 會自動是新的物件）。
import{JOB}from"../data/job.js";
import{AVATAR_LIST,AVATARS,OUTFITS,isAvatarLocked,defaultAvatarForGender,defaultOwnedOutfits}from"../data/wardrobe.js";

export function initialState(){return{screen:"create",createStep:1,tab:"planner",appOpen:null,name:"",gender:"女性",customGender:"",avatarId:"raven",outfitId:"newcomer",ownedOutfits:defaultOwnedOutfits(),wardrobeNotice:"",visitedLocationsByWeek:{},mapFilter:"全部",saveNotice:"",stats:{},hidden:{},luck:0,rep:{業界評價:0,商業價值:0,話題度:0,爭議度:0,時尚影響力:0,國民度:0,路人緣:500,可信度:500},week:1,schedule:["vocal","acting","rest","audition","free","dance","rest"],lastSchedule:null,freeLocations:Array(7).fill(null),lastFreeLocations:null,scheduledJobIds:Array(7).fill(null),lastScheduledJobIds:null,selectedDay:0,filter:"全部",focus:"growth",stamina:100,fatigue:0,mood:70,money:18000,fame:0,fans:0,contract:8,knownPeople:[],familiarNpcs:[],relationships:{},npcEventProgress:{},npcMessages:[],flags:[],eventFlags:[],eventHistory:[],queuedEvents:[],runnerDay:0,runnerPhase:"",runnerResult:null,runnerDecision:null,pendingRandomEvent:null,randomEventHistory:{},weekResults:[],history:[],notice:"",reward:null,jobStage:"available",jobRemaining:JOB.sessions,jobDeadline:3,jobNotice:"",selectedJobId:"J001",activeJobs:{},jobHistory:[],completedWorks:[],awards:[],careerProgress:{歌曲:0,電影:0,電視劇:0,綜藝:0,廣告:0},selectedNpc:null,npcArtView:"bust",forumThread:null,forumCategory:"熱門",forumRefresh:0,socialPosts:[],likedSocialPosts:[],socialNotice:"",endingType:null,endingResult:null,inheritChoice:true,hospitalSkipWeeks:0,agencyStatus:"unsigned",selectedAgencyId:null,agencyApplications:{},agencyInterview:null,agencyOffer:null,currentAgencyId:null,agencySignedWeek:null,agencyContractEndWeek:null,agencyHistory:[]}}

export let state=initialState();

// 開新的一輪（startNewRun，見 views/ending.js）呼叫這個函式，而不是自己重新指派 state。
export function resetState(){state=initialState();return state}

// 從存檔還原（main.js 開機時呼叫）。跟 resetState() 一樣，重新指派只能發生在這裡；
// 用 initialState() 墊底再蓋上存檔內容；舊版單一 mapLocation、共用衣櫃與單一造訪地點都會在這裡遷移。
export function hydrateState(saved){
 const next=Object.assign(initialState(),saved);
 if(next.avatarId==="silver")next.avatarId="raven";

 // 舊版衣服是四位角色共用。遷移成分角色衣櫃時，把既有購買品發給四人，避免玩家花過的錢被吃掉。
 const legacyOwned=Array.isArray(saved.ownedOutfits)?saved.ownedOutfits:null;
 next.ownedOutfits=Object.fromEntries(AVATAR_LIST.map(a=>{
  const avatarOwned=legacyOwned||(Array.isArray(saved.ownedOutfits?.[a.id])?saved.ownedOutfits[a.id]:[]);
  return[a.id,[...new Set(["newcomer",...avatarOwned.filter(id=>OUTFITS[id])])]];
 }));
 if(!AVATARS[next.avatarId]||isAvatarLocked(AVATARS[next.avatarId],next.gender))next.avatarId=defaultAvatarForGender(next.gender).id;
 if(!next.ownedOutfits[next.avatarId].includes(next.outfitId))next.outfitId="newcomer";

 // 商場與整形醫院的解鎖狀態要能在同一週累積，不應被下一次自由活動覆蓋。
 const rawVisits=saved.visitedLocationsByWeek&&typeof saved.visitedLocationsByWeek==="object"?saved.visitedLocationsByWeek:{};
 next.visitedLocationsByWeek=Object.fromEntries(Object.entries(rawVisits).map(([week,locations])=>[week,[...new Set(Array.isArray(locations)?locations:[])]]));
 if(saved.lastVisitedLocation&&saved.lastVisitedWeek){
  const week=String(saved.lastVisitedWeek),locations=next.visitedLocationsByWeek[week]||[];
  if(!locations.includes(saved.lastVisitedLocation))locations.push(saved.lastVisitedLocation);
  next.visitedLocationsByWeek[week]=locations;
 }

 if(!Array.isArray(saved.freeLocations))next.freeLocations=next.schedule.map(id=>id==="free"?(saved.mapLocation||null):null);
 next.freeLocations=Array.from({length:7},(_,i)=>next.schedule[i]==="free"?(next.freeLocations[i]||null):null);
 if(saved.lastSchedule&&!Array.isArray(saved.lastFreeLocations))next.lastFreeLocations=saved.lastSchedule.map(id=>id==="free"?(saved.mapLocation||null):null);
 if(Array.isArray(next.lastFreeLocations))next.lastFreeLocations=Array.from({length:7},(_,i)=>next.lastSchedule?.[i]==="free"?(next.lastFreeLocations[i]||null):null);
 next.scheduledJobIds=Array.from({length:7},(_,i)=>next.schedule[i]==="job_session"?(next.scheduledJobIds?.[i]||null):null);
 if(Array.isArray(next.lastScheduledJobIds))next.lastScheduledJobIds=Array.from({length:7},(_,i)=>next.lastSchedule?.[i]==="job_session"?(next.lastScheduledJobIds[i]||null):null);
 // v2 以前只有晨露廣告一份通告；升級後轉成以 job id 為鍵的多通告狀態。
 if(!saved.activeJobs&&saved.jobStage&&saved.jobStage!=="available"){
  next.activeJobs.J001={jobId:"J001",stage:saved.jobStage,appliedWeek:1,deadlineWeek:saved.jobDeadline||3,remainingSessions:saved.jobRemaining??JOB.sessions};
  next.selectedJobId="J001";
 }
 next.jobHistory=Array.isArray(saved.jobHistory)?saved.jobHistory:[];
 next.completedWorks=Array.isArray(saved.completedWorks)?saved.completedWorks:[];
 next.awards=Array.isArray(saved.awards)?saved.awards:[];
 next.npcEventProgress=saved.npcEventProgress&&typeof saved.npcEventProgress==="object"?saved.npcEventProgress:{};
 next.npcMessages=Array.isArray(saved.npcMessages)?saved.npcMessages:[];
 next.eventFlags=Array.isArray(saved.eventFlags)?saved.eventFlags:[];
 next.eventHistory=Array.isArray(saved.eventHistory)?saved.eventHistory:[];
 next.queuedEvents=Array.isArray(saved.queuedEvents)?saved.queuedEvents:[];
 delete next.mapLocation;
 delete next.lastVisitedLocation;
 delete next.lastVisitedWeek;
 state=next;
 return state;
}

export function visitedLocationThisWeek(locationId){return(state.visitedLocationsByWeek?.[state.week]||[]).includes(locationId)}
export function syncVisitedLocations(){
 if(!state.lastVisitedLocation||!state.lastVisitedWeek)return;
 const week=String(state.lastVisitedWeek),locations=state.visitedLocationsByWeek[week]||[];
 if(!locations.includes(state.lastVisitedLocation))locations.push(state.lastVisitedLocation);
 state.visitedLocationsByWeek[week]=locations;
 delete state.lastVisitedLocation;
 delete state.lastVisitedWeek;
}
