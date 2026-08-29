import { state } from "../core/state.js";
import { checkAgencyContractExpiry } from "./agency.js";
import { refreshAgencyJobOffers } from "./agency-offers.js";
import { checkJobDeadlines } from "./job-engine.js";
import { recordCareerRoute } from "./career.js";
import { processQueuedEvents, enqueueVisibleEvent } from "./event-engine.js";
import { resolveDueAwardSeasons } from "./portfolio.js";
import { enqueueCalendarEvents } from "./calendar-events.js";
import { tickNpcCareers } from "./npc-ecosystem.js";
import { syncNpcAutonomousWork, cleanupNpcAutonomousSchedules } from "./npc-autonomy.js";
import { tickNpcRelationshipDynamics } from "./npc-dynamics.js";
import { cleanupActivities } from "./scheduled-activities.js";
import { generateIndustryNews } from "./industry-news.js";
import { queueNpcStoryEvents } from "./npc-storylines.js";
import { tickPublicOpinion } from "./reputation-engine.js";
import { tickBrandRelations } from "./brand-relations.js";
import { tickScandals, syncScandalResponseFlags } from "./scandal-engine.js";
import { tickRumors } from "./rumor-engine.js";
import { tickManager } from "./manager.js";
import { tickWorldMarket } from "./world-market.js";
import { evaluatePersona } from "./persona-engine.js";
import { tickCompetitors } from "./competitors.js";
import { tickWorkLifecycles } from "./work-lifecycle.js";
import { syncFandom } from "./fandom.js";
import { tickNpcProactiveEvents } from "./npc-proactive.js";
import { maybeQueueMediaEvent } from "./media-engine.js";
import { tickSequelOpportunities } from "./sequel-engine.js";
import { queueAnnualWorldEvent } from "./world-events.js";
import { tickRomanceRelationships } from "./romance-engine.js";
import { queueHiddenRoute } from "./hidden-route.js";
import { tickCrossEventChains } from "./cross-event-engine.js";
import { queueCareerPhaseEvent } from "./career-phases.js";
import { tickDeepeningSystems } from "./deepening-engine.js";
import { tickPlayableDepth } from "./playable-depth-engine.js";

function queueAwardCeremony(awards){if(!awards.length)return null;const wins=awards.filter(a=>a.result!=="入圍"),titles=awards.map(a=>{const work=state.completedWorks.find(i=>i.id===a.workId);return`《${work?.title||"作品"}》${a.result}`}).join("、"),event={id:`award-ceremony-${state.week}`,kind:"職涯事件",priority:90,maxDelayWeeks:3,title:wins.length?"名字在頒獎台上被念出":"入圍名單上的那一行",text:`典禮燈光亮起，${titles}。一路累積的工作，此刻終於有了能被看見的形狀。`,choices:[{id:"team",label:"把掌聲留給整個團隊",outcome:"你沒有把作品說成一個人的功勞，合作過的人都記住了這句話。",effect:{rep:"業界評價",value:wins.length?6:3,rep2:"路人緣",value2:3}},{id:"future",label:"談下一部想做的作品",outcome:"你把這一晚當成起點，媒體也開始追問下一步。",effect:{rep:"話題度",value:wins.length?7:3,fame:wins.length?4:1}}]};enqueueVisibleEvent(event,"獎項典禮");return event.id}
function surfacePlayableDepth(p){const visible=[];
 if(p.chainStart)visible.push({id:p.chainStart.id,kind:"生活事件",priority:42,maxDelayWeeks:3,title:"片場的一件小事",text:p.chainStart.start});
 for(const e of[...(p.chains||[]),...(p.callbacks||[])])visible.push({...e,kind:"後續事件",priority:55,maxDelayWeeks:4});
 if(p.manager)visible.push({id:p.manager.id,kind:"人物事件",priority:68,maxDelayWeeks:2,title:"經紀人主動介入",text:p.manager.text,choices:[{id:"accept",label:"接受安排",note:"把健康與長期職涯擺在這週曝光之前",outcome:"你讓經紀人真的替你踩了一次煞車。",effect:{fatigue:-10,mood:3,rep:"可信度",value:3}},{id:"push",label:"堅持原計畫",note:"保留曝光，但團隊壓力會更高",outcome:"經紀人沒有替你取消工作，只把風險重新說了一次。",effect:{fatigue:5,rep:"話題度",value:3}},{id:"compromise",label:"協商折衷",note:"少砍一點工作，也留下一點休息",outcome:"你們沒有誰完全照自己的方案走，但這份妥協能真的執行。",effect:{fatigue:-5,mood:2}}]});
 if(p.romance){const npc=p.romance.npcId;visible.push({...p.romance,kind:"戀愛事件",priority:62,maxDelayWeeks:2,choices:[{id:"protect",label:"先保護關係，不配合炒作",note:"降低曝光收益，增加彼此信任",outcome:"工作團隊重新調整宣傳尺度；你沒有拿真實關係換一個更好剪的預告。",effect:{npc,trust:5,affection:3,rep:"話題度",value:-3}},{id:"professional",label:"工作照做，私下把界線說清楚",note:"兼顧工作與關係，但雙方都承受壓力",outcome:"鏡頭前照工作規則走，鏡頭後你們把不舒服的地方講明白。",effect:{npc,trust:3,affection:2,fatigue:3}},{id:"lean",label:"配合宣傳效果",note:"話題上升；地下戀更容易被放大檢視",outcome:"宣傳效果很好，代價是之後每一個眼神都更容易被逐格分析。",effect:{npc,affection:-2,rep:"話題度",value:8,fame:2}}]})}
 if(p.competition)visible.push({...p.competition,kind:"職涯事件",priority:56,maxDelayWeeks:3,choices:[{id:"work",label:"把注意力放回下一份作品",outcome:"你沒有直接回應比較文，而是讓下一份履歷替你回答。",effect:{rep:"業界評價",value:4}},{id:"market",label:"正面搶這一波市場位置",outcome:"你開始接受比較本身也是娛樂圈的一部分。",effect:{rep:"話題度",value:7,fame:2}}]});
 if(p.tentpole&&p.tentpole.delta===p.tentpole.lead)visible.push({id:`tentpole-${p.tentpole.year}-${p.tentpole.week}`,kind:"年度事件",priority:58,maxDelayWeeks:2,title:`${p.tentpole.title}開始倒數`,text:p.tentpole.text,choices:[{id:"reserve",label:"提前保留檔期",note:"降低臨時衝突，少接一點眼前工作",outcome:"你開始把幾週後的大事件當成真正會佔用人生的日子。",effect:{mood:2,rep:"業界評價",value:2}},{id:"full",label:"先照原本節奏衝",note:"保留目前曝光，但大型事件前可能更累",outcome:"你沒有為幾週後的日子提前讓路。",effect:{fatigue:4,rep:"話題度",value:2}}]});
 if(p.tentpole&&p.tentpole.delta===0)visible.push({id:`tentpole-live-${p.tentpole.year}-${p.tentpole.week}`,kind:"年度事件",priority:75,maxDelayWeeks:1,title:p.tentpole.title,text:`倒數結束。${p.tentpole.pressure}`,choices:[{id:"safe",label:"穩穩完成這次大型曝光",outcome:"沒有意外，也沒有把自己逼到失控；重要場合的穩定本身就是履歷。",effect:{rep:"可信度",value:4,fame:2}},{id:"statement",label:"把這次場合變成自己的名場面",outcome:"你把風險一起帶上舞臺，外界也真的因此記住了你。",effect:{rep:"話題度",value:8,fame:4,fatigue:3}}]});
 for(const e of visible)enqueueVisibleEvent(e,"實玩深化");return visible.map(e=>e.id)}
export function advanceWorldWeek(){
 const closingNews=generateIndustryNews();tickPublicOpinion(closingNews);syncScandalResponseFlags();state.week+=1;state.hospitalSkipWeeks=0;if(state.forcedRestWeek&&state.week>state.forcedRestWeek)state.forcedRestWeek=null;cleanupActivities();cleanupNpcAutonomousSchedules();checkAgencyContractExpiry();const breached=checkJobDeadlines(),awards=resolveDueAwardSeasons();queueAwardCeremony(awards);const market=tickWorldMarket(),rivalUpdates=tickCompetitors(),workUpdates=tickWorkLifecycles(),npcGrowth=tickNpcCareers(),npcWork=syncNpcAutonomousWork(),npcRelationUpdates=tickNpcRelationshipDynamics(),romanceUpdates=tickRomanceRelationships(),rumorUpdates=tickRumors(),npcUpdates=[...npcWork,...npcGrowth,...npcRelationUpdates,...romanceUpdates,...rumorUpdates,...rivalUpdates,...workUpdates],news=generateIndustryNews({awards,npcUpdates}),opinion=tickPublicOpinion(news);tickBrandRelations();const scandal=tickScandals();tickManager();refreshAgencyJobOffers();recordCareerRoute();const persona=evaluatePersona(),fandom=syncFandom(),calendar=enqueueCalendarEvents(),npcStories=queueNpcStoryEvents(),proactive=tickNpcProactiveEvents(),media=maybeQueueMediaEvent(),sequel=tickSequelOpportunities(),worldEvent=queueAnnualWorldEvent(),hiddenRoute=queueHiddenRoute(),careerPhase=queueCareerPhaseEvent(),crossEvent=tickCrossEventChains(),deepening=tickDeepeningSystems(),playableDepth=tickPlayableDepth(),playableVisible=surfacePlayableDepth(playableDepth),due=processQueuedEvents();return{breached,awards,market,npcUpdates,rumorUpdates,news,opinion,scandal,persona,fandom,due,calendar,npcStories,proactive,media,sequel,worldEvent,hiddenRoute,careerPhase,crossEvent,deepening,playableDepth,playableVisible}
}
