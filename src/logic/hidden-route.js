import{state}from"../core/state.js";
import{enqueueVisibleEvent}from"./event-engine.js";

const events=[
 {id:"encounter",requires:()=>!state.knownPeople.includes("silver_pc")&&state.week>=9&&state.familiarNpcs.length>=3,title:"錯過一班車之後",text:"末班車門關上前，你和一名銀灰長髮的女子同時停下腳步。她看著你，像在確認一段只有夢裡才發生過的記憶。",choices:[{id:"stay",label:"停下來問她的名字",outcome:"她叫沈霧棠。交換聯絡方式時，你們都沒有說出那句『是不是見過』。",effect:{npc:"silver_pc",relation:4,trust:2}},{id:"leave",label:"把熟悉感留在原地",outcome:"你搭上下一班車；幾天後，工作信箱卻收到一份署名沈霧棠的動態設計提案。",effect:{mood:1}}]},
 {id:"echo",requires:()=>state.knownPeople.includes("silver_pc")&&(state.relationships.silver_pc?.trust||0)>=18,title:"兩份一模一樣的分鏡",text:"沈霧棠帶來一份沒有日期的舊分鏡。最後一格的舞台、服裝與你曾做過的選擇完全相同，但那並不是這一輪發生過的事。",choices:[{id:"compare",label:"把自己的記憶也攤開來比對",outcome:"你們不急著替巧合命名，先共同記下所有重疊之處。",effect:{npc:"silver_pc",relation:5,trust:7}},{id:"present",label:"先談現在想完成的作品",outcome:"她收起舊分鏡，說也許再遇見的意義不是找回過去，而是別再錯過現在。",effect:{npc:"silver_pc",relation:6,trust:5,affection:2}}]},
 {id:"choice",requires:()=>state.knownPeople.includes("silver_pc")&&(state.relationships.silver_pc?.trust||0)>=45,title:"不是命中注定的答案",text:"沈霧棠終於承認，她也做過重複的人生夢境。她沒有問你是否相信，只問：如果沒有任何前一輪的承諾，這一輪還會不會選擇認識她？",choices:[{id:"again",label:"這次也從真正認識開始",outcome:"你們把似曾相識留在身後，第一次只為眼前的人留下位置。",effect:{npc:"silver_pc",relation:8,trust:8,affection:8}},{id:"friends",label:"不讓過去替現在決定",outcome:"她接受這個答案。能夠自由選擇，也許正是重新開始真正的意義。",effect:{npc:"silver_pc",relation:5,trust:7}}]}
];

export function queueHiddenRoute(){
 if((state.runCount||1)<2)return null;
 state.hiddenRouteHistory??=[];
 const event=events.find(item=>!state.hiddenRouteHistory.includes(item.id)&&item.requires());
 if(!event)return null;
 const payload={...event,id:`silver-route-${event.id}`,kind:"人物事件",persistent:true,priority:110};
 enqueueVisibleEvent(payload,"多周目人物主線");state.hiddenRouteHistory.push(event.id);return payload.id;
}
