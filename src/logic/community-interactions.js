import{state}from"../core/state.js";
import{NPCS}from"../data/npcs.js";
import{adjustRelationship}from"./npc-engine.js";

const SOCIAL_REPLIES={encourage:{label:"替對方加油",copy:"留下了一句不搶風頭、但很真誠的鼓勵。",relation:2,trust:1},work:{label:"聊作品細節",copy:"你從作品本身回應，對方也認真接住了話題。",relation:1,trust:2},care:{label:"提醒好好休息",copy:"你沒有只稱讚成果，也注意到文字後面的疲倦。",relation:2,trust:2}};

export function replyToNpcPost(npcId,type){
 const npc=NPCS[npcId],reply=SOCIAL_REPLIES[type];if(!npc||!reply||!state.knownPeople.includes(npcId))return{ok:false,message:"這則互動目前無法送出。"};
 state.socialReplies??={};const key=`${state.week}:${npcId}`;if(state.socialReplies[key])return{ok:false,message:`這週已經回覆過${npc.name}的動態了。`};
 state.socialReplies[key]=type;adjustRelationship(npcId,{closeness:reply.relation,trust:reply.trust,source:`社群回覆：${reply.label}`});
 return{ok:true,message:`已回覆${npc.name}：${reply.copy}`};
}

export function forumReaction(threadId,type){
 state.forumReactions??={};const key=`${state.week}:${threadId}`;if(state.forumReactions[key])return{ok:false,message:"這週已經在這串留下回應。"};
 const map={reason:{label:"理性補充",rep:"可信度",value:2,message:"你補上可查證的資訊，討論稍微冷靜下來。"},join:{label:"分享經驗",rep:"路人緣",value:2,message:"你用自己的經驗加入討論，沒有暴露不該公開的內容。"},ignore:{label:"先觀望",rep:null,value:0,message:"你把手機放下，沒有讓每一場網路討論都變成自己的戰場。"}},reaction=map[type];
 if(!reaction)return{ok:false,message:"這個回應不存在。"};state.forumReactions[key]=type;if(reaction.rep)state.rep[reaction.rep]=Math.min(1000,(state.rep[reaction.rep]||0)+reaction.value);
 return{ok:true,message:reaction.message,label:reaction.label};
}

export function socialReplyOptions(){return SOCIAL_REPLIES}

