import{NPCS}from"../data/npcs.js";
import{state}from"../core/state.js";

export const RELATIONSHIP_STAGES=Object.freeze([
 {id:"acquaintance",label:"初識",closeness:0,trust:0},
 {id:"familiar",label:"熟識",closeness:20,trust:15},
 {id:"friend",label:"朋友",closeness:40,trust:30},
 {id:"confidant",label:"知己",closeness:65,trust:55},
 {id:"bonded",label:"重要的人",closeness:85,trust:75}
]);

export function ensureRelationship(id){
 return state.relationships[id]||(state.relationships[id]={closeness:0,trust:0,romance:"none",stage:"acquaintance",lastInteractionWeek:0,events:[]});
}

export function relationshipStage(rel){return[...RELATIONSHIP_STAGES].reverse().find(stage=>rel.closeness>=stage.closeness&&rel.trust>=stage.trust)||RELATIONSHIP_STAGES[0]}

export function meetNpc(id,source="偶然相遇"){
 if(!NPCS[id])return{met:false,text:""};
 const already=state.knownPeople.includes(id),rel=ensureRelationship(id);
 if(already)return{met:false,text:""};
 const familiar=state.familiarNpcs.includes(id);
 if(familiar){rel.closeness=18;rel.trust=20}else{rel.closeness=8;rel.trust=10}
 rel.stage=relationshipStage(rel).id;rel.lastInteractionWeek=state.week;
 state.knownPeople.push(id);state.selectedNpc=id;
 state.flags.push({week:state.week,label:`第一次認識${NPCS[id].name}`,note:familiar?"彼此有種說不上來的熟悉，很快就聊開了。":source});
 return{met:true,text:familiar?`第一次正式認識<b>${NPCS[id].name}</b>，彼此都覺得似曾相識`:`第一次認識了<b>${NPCS[id].name}</b>`};
}

export function adjustRelationship(id,{closeness=0,trust=0,source="互動"}={}){
 if(!NPCS[id])return{changed:false,text:""};
 if(!state.knownPeople.includes(id))meetNpc(id,source);
 const rel=ensureRelationship(id),before=relationshipStage(rel);
 rel.closeness=Math.max(0,Math.min(100,rel.closeness+closeness));
 rel.trust=Math.max(0,Math.min(100,rel.trust+trust));
 rel.lastInteractionWeek=state.week;
 const after=relationshipStage(rel);rel.stage=after.id;
 if(before.id!==after.id){
  const key=`${id}:${after.id}`;
  state.npcEventProgress[key]=true;
  rel.events=[...(rel.events||[]),{week:state.week,stage:after.id,source}];
  state.npcMessages.push({week:state.week,npcId:id,title:`與${NPCS[id].name}的關係進入「${after.label}」`,text:milestoneText(id,after.id)});
  state.flags.push({week:state.week,label:`人物關係：${NPCS[id].name}・${after.label}`,note:source});
 }
 const pieces=[];if(closeness)pieces.push(`好感${closeness>0?"＋":""}${closeness}`);if(trust)pieces.push(`信任${trust>0?"＋":""}${trust}`);
 return{changed:true,stageChanged:before.id!==after.id,stage:after,text:`與<b>${NPCS[id].name}</b>的${pieces.join("、")}`};
}

function milestoneText(id,stage){
 const npc=NPCS[id];
 const text={familiar:`${npc.name}開始記得你的習慣，也願意在工作以外多聊幾句。`,friend:`你們不再只是業界點頭之交，彼此會主動分享近況。`,confidant:`${npc.name}願意讓你看見公眾形象之外的壓力與選擇。`,bonded:`你已成為${npc.name}人生中無法輕易取代的重要存在。`};
 return text[stage]||`你和${npc.name}的關係有了新的變化。`;
}

export function npcStoryStatus(id){const rel=state.relationships[id]||{closeness:0,trust:0,events:[]},stage=relationshipStage(rel);return{stage,events:rel.events||[],unread:state.npcMessages.filter(m=>m.npcId===id&&!m.read)}}
