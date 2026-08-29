import{state}from"../core/state.js";
import{NPCS}from"../data/npcs.js";
import{WEEKLY_THREADS,SHORT_CHAINS,CREW_SURNAMES,CREW_GIVEN,AUDITION_INTEL,LEGACY_TAGS,MEMORY_LABELS,FAME_LIFE_TIERS,SCANDAL_RESPONSES,ANNUAL_TENTPOLES,NG_PLUS_INTUITION}from"../data/playable-depth-content.js";

const hash=s=>[...String(s)].reduce((a,c)=>((a*31+c.charCodeAt(0))>>>0),7);
const pick=(arr,key)=>arr[hash(key)%arr.length];
const pushUnique=(arr,item,key="id")=>{if(!arr.some(x=>x?.[key]===item?.[key]))arr.push(item);return item};
const currentYear=()=>Math.min(5,Math.floor((state.week-1)/52)+1);
const weekOfYear=()=>((state.week-1)%52)+1;

export function ensurePlayableDepthState(){
 state.weeklyThreads=state.weeklyThreads&&typeof state.weeklyThreads==="object"?state.weeklyThreads:{};
 state.eventChains=Array.isArray(state.eventChains)?state.eventChains:[];
 state.crewNetwork=state.crewNetwork&&typeof state.crewNetwork==="object"?state.crewNetwork:{};
 state.auditionIntel=state.auditionIntel&&typeof state.auditionIntel==="object"?state.auditionIntel:{};
 state.industryMemories=Array.isArray(state.industryMemories)?state.industryMemories:[];
 state.relationshipMilestones=Array.isArray(state.relationshipMilestones)?state.relationshipMilestones:[];
 state.managerInterventions=Array.isArray(state.managerInterventions)?state.managerInterventions:[];
 state.scandalResponses=Array.isArray(state.scandalResponses)?state.scandalResponses:[];
 state.annualTentpoleHistory=Array.isArray(state.annualTentpoleHistory)?state.annualTentpoleHistory:[];
 state.ngPlusKnowledge=state.ngPlusKnowledge&&typeof state.ngPlusKnowledge==="object"?state.ngPlusKnowledge:{loops:0,unlocked:[]};
 state.playTelemetry=state.playTelemetry&&typeof state.playTelemetry==="object"?state.playTelemetry:{weeks:0,systems:{},repeats:{},idleWeeks:0};
 return state;
}

export function fameLifeTier(){return[...FAME_LIFE_TIERS].reverse().find(t=>(state.fame||0)>=t.min)||FAME_LIFE_TIERS[0]}
export function recordSystemUse(name){ensurePlayableDepthState();state.playTelemetry.systems[name]=(state.playTelemetry.systems[name]||0)+1}
export function telemetrySummary(){ensurePlayableDepthState();const entries=Object.entries(state.playTelemetry.systems||{}).sort((a,b)=>b[1]-a[1]);return{most:entries.slice(0,4),least:entries.slice(-4),weeks:state.playTelemetry.weeks||0}}

export function buildWeeklyThread(){ensurePlayableDepthState();let type="training";if((state.publicOpinion?.scandalLevel||0)>0||state.scandals?.some(s=>s.status==="active"))type="scandal";else if(state.partnerId)type="romance";else if(Object.values(state.activeJobs||{}).some(j=>j.stage==="active"))type="job";const content=WEEKLY_THREADS[type];const item={id:`thread-${state.week}`,week:state.week,type,...content};state.weeklyThreads[state.week]=item;return item}

export function maybeStartShortChain(){ensurePlayableDepthState();if(state.week<4||state.eventChains.some(c=>!c.done))return null;if(state.week%11!==0)return null;const def=SHORT_CHAINS[(Math.floor(state.week/11)-1)%SHORT_CHAINS.length];const existing=state.eventChains.find(c=>c.defId===def.id);if(existing)return null;const choice=def.choices[hash(`${state.name}-${state.week}`)%def.choices.length];const chain={id:`chain-${def.id}-${state.week}`,defId:def.id,startedWeek:state.week,choiceId:choice.id,start:def.start,label:choice.label,nextWeek:state.week+3,finalWeek:state.week+52,stage:"started",done:false};state.eventChains.push(chain);return chain}
export function tickShortChains(){ensurePlayableDepthState();const out=[];for(const c of state.eventChains){const def=SHORT_CHAINS.find(x=>x.id===c.defId),choice=def?.choices.find(x=>x.id===c.choiceId);if(!choice||c.done)continue;if(c.stage==="started"&&state.week>=c.nextWeek){c.stage="later";out.push({id:`${c.id}-later`,title:"之前那件小事有了後續",text:choice.later})}else if(c.stage==="later"&&state.week>=c.finalWeek){c.stage="done";c.done=true;out.push({id:`${c.id}-final`,title:"一年前的選擇又回來了",text:choice.yearLater})}}return out}

function roleSet(category){return category==="歌曲"?["音樂製作人","造型師"]:category==="綜藝"?["製作人","主持人"]:category==="廣告"?["導演","造型師"]:["導演","合作演員","攝影指導"]}
export function crewForWork(work){ensurePlayableDepthState();if(!work)return[];if(state.crewNetwork[work.id])return state.crewNetwork[work.id];const priorAll=Object.values(state.crewNetwork).flat(),roles=roleSet(work.category);const crew=roles.map((role,i)=>{const key=`${work.id}-${role}-${i}`,sameRole=priorAll.filter(p=>p.role===role),reuse=sameRole.length&&hash(`${key}-reunion`)%100<38,prior=reuse?sameRole[hash(key)%sameRole.length]:null,name=prior?.name||(pick(CREW_SURNAMES,key)+pick(CREW_GIVEN,key+"g")),works=[...new Set([...(prior?.works||[]),work.id])];const person={id:prior?.id||`crew-${hash(name+role)}`,role,name,trust:Math.min(100,(prior?.trust||0)+(prior?8:0)),metWeek:prior?.metWeek||state.week,works};if(prior){prior.works=works;prior.trust=person.trust}return person});state.crewNetwork[work.id]=crew;return crew}
export function crewReunion(work){return crewForWork(work).filter(c=>c.works.length>1)}

export function auditionIntelFor(jobId){ensurePlayableDepthState();if(!state.auditionIntel[jobId])state.auditionIntel[jobId]=pick(AUDITION_INTEL,`${jobId}-${state.week}`);return state.auditionIntel[jobId]}
export function recordAuditionFailure(jobId){ensurePlayableDepthState();const existing=state.industryMemories.find(x=>x.kind==="audition"&&x.jobId===jobId&&!x.resolved);if(existing)return existing;const intel=auditionIntelFor(jobId),memory={id:`audition-fail-${jobId}-${state.week}`,kind:"audition",jobId,week:state.week,text:`這次沒有拿到角色，但試鏡組記住了你。${intel.tip}`,callbackWeek:state.week+6+(hash(jobId)%8),resolved:false};state.industryMemories.push(memory);return memory}
export function tickFailureCallbacks(){ensurePlayableDepthState();const out=[];for(const m of state.industryMemories.filter(x=>!x.resolved&&x.callbackWeek<=state.week)){m.resolved=true;out.push({id:`callback-${m.id}`,title:"落選沒有白費",text:"之前看過你試鏡的人又送來一個機會。這次不是因為履歷漂亮，而是有人真的記得你當時留下的東西。",jobId:m.jobId})}return out}

export function legacyTagsFor(work){const tags=[];const q=Number(work?.quality||work?.score||0),stars=Number(work?.stars||work?.star||0);if(q>=82||stars>=5)tags.push(LEGACY_TAGS.critical);if((work?.revenue||0)>500000||state.fame>900)tags.push(LEGACY_TAGS.commercial);if(state.completedWorks.indexOf(work)<3&&q>=70)tags.push(LEGACY_TAGS.breakthrough);if(state.awards?.some(a=>a.workId===work?.id))tags.push(LEGACY_TAGS.award);if((state.rep?.話題度||0)>700)tags.push(LEGACY_TAGS.meme);if((state.rep?.爭議度||0)>600)tags.push(LEGACY_TAGS.controversial);if(q>=76&&state.completedWorks.length>=6)tags.push(LEGACY_TAGS.turning);return[...new Set(tags)]}
export function syncWorkLegacies(){for(const w of state.completedWorks||[]){w.legacyTags=Array.isArray(w.legacyTags)&&w.legacyTags.length?w.legacyTags:legacyTagsFor(w);if(!w.crew)w.crew=crewForWork(w)}return state.completedWorks}

export function rememberRelationship(npcId,type,text=""){ensurePlayableDepthState();if(!NPCS[npcId]||!MEMORY_LABELS[type])return null;const id=`memory-${npcId}-${type}`;const item={id,npcId,type,label:MEMORY_LABELS[type],week:state.week,text:text||MEMORY_LABELS[type]};return pushUnique(state.relationshipMilestones,item)}
export function syncRelationshipMemories(){ensurePlayableDepthState();for(const id of state.knownPeople||[])rememberRelationship(id,"firstMeet",`第一次真正認識 ${NPCS[id]?.name||"對方"}。`);for(const work of state.completedWorks||[])for(const id of work.npcCast||[])if(NPCS[id])rememberRelationship(id,"firstWork",`第一次一起完成《${work.title||"作品"}》。`);for(const [id,rel] of Object.entries(state.relationships||{})){if(rel.hostility>=35)rememberRelationship(id,"firstConflict","你們第一次真正把不滿說到彼此面前。");if((rel.romanceHistory||[]).some(x=>x.to==="broken"||x.romance==="broken"))rememberRelationship(id,"breakup","這段關係曾經真的結束過。\n");if((rel.romanceHistory||[]).some(x=>x.from==="broken"&&["dating","committed"].includes(x.to)))rememberRelationship(id,"reconcile","你們曾經分開，也曾經重新選擇彼此。")}if(state.partnerId){const rel=state.relationships?.[state.partnerId];if(rel?.romance==="dating")rememberRelationship(state.partnerId,"firstDate","關係不再只是曖昧。");if(rel?.visibility==="public")rememberRelationship(state.partnerId,"publicLove","你們決定不再把彼此藏在新聞鏡頭之外。");if(rel?.romance==="engaged")rememberRelationship(state.partnerId,"proposal");if(rel?.romance==="married")rememberRelationship(state.partnerId,"marriage")}return state.relationshipMilestones}

export function romanceWorkPressure(){if(!state.partnerId)return null;const rel=state.relationships?.[state.partnerId],active=Object.values(state.activeJobs||{}).find(j=>j.stage==="active");if(!active||state.week%5!==0)return null;const underground=rel?.visibility==="underground";return{id:`romance-work-${state.week}`,npcId:state.partnerId,title:underground?"工作開始碰到地下戀":"工作與關係撞在一起",text:underground?"宣傳想炒 CP，經紀團隊卻提醒你們連一起離場都可能被拍到。":"公開關係讓媒體更自然地把工作與感情放在同一個問題裡。",underground}}

export function managerIntervention(){ensurePlayableDepthState();const bad=(state.fatigue||0)>=78||(state.health||100)<=45,weakJobs=(state.completedWorks||[]).slice(-3).filter(w=>Number(w.quality||0)<55).length>=2;if(!bad&&!weakJobs)return null;const id=`manager-intervene-${state.week}`;if(state.managerInterventions.some(x=>x.id===id))return null;const item={id,week:state.week,type:bad?"overwork":"career",text:bad?"經紀人直接把行程表拉到你面前：『你可以不高興，但這週至少要留一天能睡覺。』":"經紀人把最近幾份作品排成一列：『你缺曝光，還是只是害怕空檔？這兩件事不一樣。』",choices:["接受安排","堅持原計畫","協商折衷"]};state.managerInterventions.push(item);return item}

export function scandalResponseOptions(){return SCANDAL_RESPONSES.filter(x=>x.id!=="publicLove"||state.partnerId)}
export function respondToScandal(id){ensurePlayableDepthState();const option=scandalResponseOptions().find(x=>x.id===id);if(!option)return null;const item={id:`scandal-response-${state.week}-${id}`,week:state.week,response:id,text:option.text};state.scandalResponses.push(item);if(id==="deny")state.rep.可信度=Math.max(0,(state.rep.可信度||0)-2);if(id==="admit"){state.rep.話題度=(state.rep.話題度||0)+8;state.publicOpinion.heat=Math.max(0,(state.publicOpinion.heat||0)-4)}if(id==="silent")state.publicOpinion.heat=(state.publicOpinion.heat||0)+3;if(id==="publicLove"&&state.partnerId){state.relationships[state.partnerId].visibility="public";rememberRelationship(state.partnerId,"publicLove")}return item}

export function annualTentpoleStatus(){ensurePlayableDepthState();const w=weekOfYear(),y=currentYear();const upcoming=ANNUAL_TENTPOLES.map(e=>({...e,delta:e.week-w})).filter(e=>e.delta>=0&&e.delta<=e.lead).sort((a,b)=>a.delta-b.delta)[0];if(!upcoming)return null;return{...upcoming,year:y,text:upcoming.delta===0?`${upcoming.title}就在本週。${upcoming.pressure}`:`距離${upcoming.title}還有 ${upcoming.delta} 週。${upcoming.pressure}`}}
export function competitionBeat(){ensurePlayableDepthState();if(currentYear()<3||state.week%13!==0)return null;const rivals=Object.entries(state.competitors||state.rivals||{});if(!rivals.length)return null;const [id,r]=rivals.sort((a,b)=>(b[1].momentum||b[1].fame||0)-(a[1].momentum||a[1].fame||0))[0];return{id:`competition-${state.week}-${id}`,title:"同一個檔期，位置只有一個",text:`${r.name||NPCS[id]?.name||"同期競爭者"}最近的聲勢正在上升。平台、媒體與獎季開始把你們放進同一張比較表；第三年之後，成功不只看自己有沒有進步。`,rivalId:id}}

export function ngPlusIntuition(){ensurePlayableDepthState();if((state.ngPlusKnowledge.loops||0)<=0)return null;return pick(NG_PLUS_INTUITION,`${state.week}-${state.ngPlusKnowledge.loops}`)}
export function recordLoopKnowledge(){ensurePlayableDepthState();state.ngPlusKnowledge.loops=(state.ngPlusKnowledge.loops||0)+1;const best=(state.completedWorks||[]).sort((a,b)=>Number(b.quality||0)-Number(a.quality||0))[0];if(best)state.ngPlusKnowledge.unlocked=[...new Set([...(state.ngPlusKnowledge.unlocked||[]),best.category,best.id,...(best.legacyTags||[])])];return state.ngPlusKnowledge}

export function tickPlayableDepth(){ensurePlayableDepthState();state.playTelemetry.weeks++;const thread=buildWeeklyThread(),chainStart=maybeStartShortChain(),chains=tickShortChains(),callbacks=tickFailureCallbacks(),manager=managerIntervention(),romance=romanceWorkPressure(),tentpole=annualTentpoleStatus(),competition=competitionBeat(),fame=fameLifeTier(),intuition=ngPlusIntuition();syncWorkLegacies();syncRelationshipMemories();return{thread,chainStart,chains,callbacks,manager,romance,tentpole,competition,fame,intuition}}
