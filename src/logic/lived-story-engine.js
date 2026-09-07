import { titleTag } from "../core/utils.js";
import { state } from "../core/state.js";
import { NPCS } from "../data/npcs.js";
import { NPC_INVITATION_POOLS } from "../data/invitation-content.js";
import { NPC_RELATION_EDGES } from "../data/npc-network.js";
import { ENSEMBLE_STORIES } from "../data/ensemble-story-content.js";
import { queueEvent, enqueueVisibleEvent } from "./event-engine.js";

import { characterMemory, canInitiateMemoryContact } from "./character-memory.js";
import { narrativePreferences } from "./narrative-preferences.js";

const INVITATIONS=Object.freeze({
 jiqing:{place:"深夜節目收播後的便利商店",ask:"她想找一個不用主持、也不用替任何人圓場的晚上。",detail:"她把耳機收進包裡，問的不是你最近紅不紅，而是你有多久沒有好好吃完一頓飯。"},
 shenyao:{place:"最後一場散場後的電影院",ask:"他留了最後一排兩個位置，想聽你對粗剪真正不客氣的答案。",detail:"銀幕已經熄了，他仍把筆記本攤在膝上；這次先問你累不累，才問電影。"},
 tangtang:{place:"沒有鏡子的練習室",ask:"她想試一首不錄影、不評分，也不會公開的新歌。",detail:"她拔掉監聽耳機，笑著說今天誰都不用證明自己值得站在舞台上。"},
 guchengxi:{place:"劇場後門的宵夜攤",ask:"他想在沒有記者和工作人員的地方，把新角色暫時留在後台。",detail:"他把帽沿壓低，難得沒有先用玩笑救場，只替你留了對面的塑膠椅。"},
 linxiafan:{place:"工作室打烊後的樣衣間",ask:"她想請你一起看那些沒有被選中的版本，替團隊留下正確署名。",detail:"牆上不是成品，而是失敗的剪裁、被退回的提案，以及每一個不該消失的名字。"},
 lujingran:{place:"錄音室屋頂",ask:"他帶了一副共用耳機，裡面是還沒決定要不要發行的版本。",detail:"城市很吵，他卻把音量調得很小，像是只想確認你有沒有聽見某一句。"},
 xiayutong:{place:"清晨收工的空景片場",ask:"她想讓你看一顆不會進正片、卻最像角色生活的鏡頭。",detail:"工作人員已撤場，她沒有談平台與數據，只問這個畫面值不值得被你們記住。"},
 sufei:{place:"試鏡教室外的樓梯",ask:"她買了兩杯最便宜的熱飲，想在下一場試鏡前先喘一口氣。",detail:"她承認自己今天其實很怕，但不想再把害怕包裝成『我會更努力』。"},
 chengyian:{place:"提案結束後的二十四小時咖啡店",ask:"他想把企劃表闔上，談一次不會變成素材的近況。",detail:"他第一次沒有替談話設定目的，只把手機反扣，等你決定要不要坐下。"},
 hanzhiyuan:{place:"辦公大樓熄燈後的一樓大廳",ask:"他取消司機，想用一段普通的路確認生活不必每分鐘都有產值。",detail:"電梯門關上後，他沒有再看報表，卻顯得比任何決策會議都更不習慣。"},
});

function invitationType(npcId){const rel=state.relationships?.[npcId]||{};if((rel.hostility||0)>=20)return"conflict";if(["dating","committed","engaged","married"].includes(rel.romance))return"romance";if(state.health<=55||state.fatigue>=65||state.week%16===2)return"low";return"ordinary"}

function dynamicCast(){
 const known=new Set(state.knownPeople||[]),edges=NPC_RELATION_EDGES.filter(edge=>known.has(edge.a)&&known.has(edge.b));if(!edges.length)return null;
 const pair=edges[Math.floor(state.week/13)%edges.length],cast=[pair.a,pair.b];
 if(state.week%26===0){const third=edges.find(edge=>cast.includes(edge.a)&&!cast.includes(edge.b))?.b||edges.find(edge=>cast.includes(edge.b)&&!cast.includes(edge.a))?.a;if(third)cast.push(third)}
 return{cast,edge:pair};
}

function ensembleCopy({cast,edge}) {
 const story=ENSEMBLE_STORIES[`${edge.a}:${edge.b}`];
 const third=cast[2] ? ` ${NPCS[cast[2]].name}也在場，先替兩邊核對現有素材與時段，等你們把問題談完。` : "";
 return {...story,text:story.text+third};
}

function referenceText(){
 const scandal=[...(state.scandals||[])].reverse().find(x=>x.status!=="resolved");
 if(scandal)return`你最近那場「${scandal.title||scandal.type||"輿論風波"}」仍有人議論，對方沒有假裝沒看見。`;
 const award=[...(state.awards||[])].reverse()[0];
 if(award)return`對方先提到你在「${award.name||award.title||"頒獎季"}」留下的那一刻，接著才說今天找你的真正原因。`;
 const work=[...(state.completedWorks||[])].reverse()[0];
 if(work)return`你最近完成${titleTag(work.title)}，對方先問起這段工作的近況。`;
 return"這次邀請沒有通告、曝光或人脈交換；它只占用你願不願意留給一個人的時間。";
}

export function tickNpcInvitation(){
 if(state.week<18||state.week%8!==2)return null;
 const known=(state.knownPeople||[]).filter(id=>NPC_INVITATION_POOLS[id]&&canInitiateMemoryContact(id)&&characterMemory(id).disclosure!=="guarded");
 if(!known.length)return null;
 const npcId=known[Math.floor(state.week/8)%known.length],npc=NPCS[npcId],type=invitationType(npcId),def=NPC_INVITATION_POOLS[npcId][type]||INVITATIONS[npcId];
 const id=`invitation:${npcId}:${state.week}`;
 if((state.npcInvitationHistory||[]).some(x=>x.id===id))return null;
 const romance=state.relationships?.[npcId]?.romance;
 const intimate=["dating","committed","engaged","married"].includes(romance);
 const prefs=narrativePreferences(), memory=characterMemory(npcId);
 if((type==="conflict"&&prefs.conflictIntensity==="gentle")||(intimate&&(prefs.romanceFrequency==="off"||(prefs.romanceFrequency==="low"&&state.week%16!==2))))return null;
 const advance=memory.boundaries.notice==="advance";
 const invitation={id,kind:intimate?"戀愛邀約":"人物邀約",priority:82,maxDelayWeeks:4,title:`${npc.name}・不是工作行程`,text:advance?`上週已提前問過你的空檔，${npc.name}今天再確認你是否願意見面。${def.ask}`:def.ask,cast:[npcId],beats:[
  {label:"一則不是公事的訊息",text:`${advance?"這是上週先詢問過的邀約。":""}地點是${def.place}。${def.ask}` },
  {label:"你抵達之後",text:def.detail},
  {label:"被帶進今天的過去",text:referenceText()},
 ],choices:[
  {id:"accept",label:"把今晚完整留給對方",note:"接受邀約；關係與共同記憶會前進。",outcome:`你沒有把這次見面塞進下一個行程中間。離開${def.place}時，對方知道自己被真正選擇過一次。`,effect:{npc:npcId,relation:5,trust:5,affection:intimate?5:2,invitation:{id,npcId,response:"accept",label:"接受邀約"}}},
  {id:"reschedule",label:"坦白今天做不到，但親自約定另一個時間",note:"不會立刻加深關係；數週後會出現改期後續。",outcome:"你沒有用『再看看』敷衍。新的日期被確實寫進兩個人的行事曆。",effect:{npc:npcId,trust:2,invitation:{id,npcId,response:"reschedule",label:"主動改期"}},followUp:{delayWeeks:2,event:{id:`${id}:rescheduled`,kind:"人物後續",title:`${npc.name}・被履行的改期`,text:`兩週後，你真的出現在${def.place}。對方沒有說謝謝，只把原本替你留的位置往外拉了一點。`,beats:[{label:"不是客套的下次",text:"被改期的邀請沒有消失，因為你讓承諾成為一個能抵達的日期。"}],outcome:"準時出現本身，成為比補償更可靠的回答。",effect:{npc:npcId,relation:4,trust:7,affection:intimate?4:1}}}},
  {id:"decline",label:"直接說現在不想赴約",note:"誠實拒絕；不消耗時間，但對方會記得這次距離。",outcome:"你沒有編造藉口。對方收回邀請，也重新理解你們現在能靠近到哪裡。",effect:{npc:npcId,relation:-2,trust:1,affection:-2,invitation:{id,npcId,response:"decline",label:"坦白拒絕"}}},
 ]};
 const queued=advance?queueEvent(invitation,{source:"NPC 主動邀約",dueWeek:state.week+1}):enqueueVisibleEvent(invitation,"NPC 主動邀約");
 if(!queued||queued==="expired")return null;
 if(advance){state.npcMessages??=[];state.npcMessages.push({id:`${id}:advance`,npcId,week:state.week,source:"invitation-notice",text:`我記得你希望提前問。下一週想邀你到${def.place}；到時候再確認，不方便也可以先放著。`,read:false})}
 state.npcInvitationHistory.push({id,npcId,week:state.week,response:"pending",title:def.place,type});
 return id;
}

export function tickEnsembleScene() {
 if(state.week<30||state.week%13!==0)return null;
 const selected=dynamicCast();if(!selected)return null;
 const {cast}=selected,[a,b]=cast,na=NPCS[a],nb=NPCS[b],copy=ensembleCopy(selected);
 // Each production dispute and branch return is a unique shared memory.
 const key=cast.slice(0,2).join(":");
 const id=`ensemble:${key}:story`;
 if ((state.eventHistory||[]).some(x=>x.id===id)) return null;
 const choices=[
  {id:"mediate",label:copy.mediate,note:"一起整理合作方式，彼此信任增加。",effects:[...cast.map(npc=>({npc,trust:5,relation:2})),{ensemble:{id,cast,choice:"mediate",label:"共同條件"}}]},
  {id:"side-a",label:copy.sideA,note:`偏向${na.name}的做法；${nb.name}對這次合作的信任會下降。`,effects:[{npc:a,trust:7,relation:4},...cast.slice(1).map(npc=>({npc,trust:-2,relation:-3})),{ensemble:{id,cast,choice:"side-a",label:`支持${na.name}`}}]},
  {id:"side-b",label:copy.sideB,note:`偏向${nb.name}的做法；${na.name}對這次合作的信任會下降。`,effects:[{npc:a,trust:-2,relation:-3},{npc:b,trust:7,relation:4},...(cast[2]?[{npc:cast[2],trust:4,relation:2}]:[]),{ensemble:{id,cast,choice:"side-b",label:`支持${nb.name}`}}]},
 ].map((choice,index)=>({...choice,outcome:copy.outcomes[index],followUp:{delayWeeks:3,event:{
   id:`${id}:${choice.id}:follow-up`,kind:"人物後續",cast,persistent:true,priority:82,
   title:`${copy.title}・新的確認稿`,text:copy.after[index],
   choices:[{id:"read",label:"核對後續安排",outcome:"你把新稿和當時的決定放在一起，知道哪裡真的改了，也知道誰仍在配合。",effect:{mood:1}}],
 }}}));
 const queued=enqueueVisibleEvent({id,kind:cast.length>2?"三人事件":"多人事件",priority:84,persistent:true,title:copy.title,text:copy.text,cast,beats:[
  {label:"宣傳會議還沒結束",text:copy.text},
  {label:`${na.name}的提議`,text:copy.a,speaker:a},
  {label:`${nb.name}的考量`,text:copy.b,speaker:b},
 ],choices},"人物關係網");
 return queued&&queued!=="expired"?id:null;
}
