import { state } from "../core/state.js";
import { NPCS } from "../data/npcs.js";
import { enqueueVisibleEvent } from "./event-engine.js";

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

const PAIR_TOPICS=[
 ["jiqing","shenyao","真話應該被追問到哪裡","訪談想讓人說出口，電影卻有時需要替角色保留沉默。兩人都在等你替這場合作定下界線。"],
 ["tangtang","lujingran","舞台究竟屬於誰","一個習慣把所有力氣交給觀眾，一個堅持作品也需要留白；聯名舞台因此卡在最後一首歌。"],
 ["guchengxi","sufei","前輩的保護會不會變成陰影","同場試鏡的宣傳想把提攜寫成依附，兩人都拒絕，卻對應該如何回應有不同答案。"],
 ["linxiafan","chengyian","好作品能不能建立在透支上","得獎企劃背後是團隊連續加班；一個要停案，一個擔心停下會讓所有人的努力失去出口。"],
 ["xiayutong","hanzhiyuan","數字看不見的那一顆鏡頭","平台模型要求刪除一場低留存片段，導演與投資方第一次把最後決定交給身在作品裡的你。"],
];

function referenceText(){
 const scandal=[...(state.scandals||[])].reverse().find(x=>x.status!=="resolved");
 if(scandal)return`你最近那場「${scandal.title||scandal.type||"輿論風波"}」仍有人議論，對方沒有假裝沒看見。`;
 const award=[...(state.awards||[])].reverse()[0];
 if(award)return`對方先提到你在「${award.name||award.title||"頒獎季"}」留下的那一刻，接著才說今天找你的真正原因。`;
 const work=[...(state.completedWorks||[])].reverse()[0];
 if(work)return`《${work.title}》完成後，你們已經有一陣子只在工作消息裡看見彼此。`;
 return"這次邀請沒有通告、曝光或人脈交換；它只占用你願不願意留給一個人的時間。";
}

export function tickNpcInvitation(){
 if(state.week<18||state.week%8!==2)return null;
 const known=(state.knownPeople||[]).filter(id=>INVITATIONS[id]);
 if(!known.length)return null;
 const npcId=known[Math.floor(state.week/8)%known.length],npc=NPCS[npcId],def=INVITATIONS[npcId];
 const id=`invitation:${npcId}:${state.week}`;
 if((state.npcInvitationHistory||[]).some(x=>x.id===id))return null;
 const romance=state.relationships?.[npcId]?.romance;
 const intimate=["dating","committed","engaged","married"].includes(romance);
 enqueueVisibleEvent({id,kind:intimate?"戀愛邀約":"人物邀約",priority:82,maxDelayWeeks:4,title:`${npc.name}・不是工作行程`,text:def.ask,cast:[npcId],beats:[
  {label:"一則不是公事的訊息",text:`地點是${def.place}。${def.ask}`},
  {label:"你抵達之後",text:def.detail},
  {label:"被帶進今天的過去",text:referenceText()},
 ],choices:[
  {id:"accept",label:"把今晚完整留給對方",note:"接受邀約；關係與共同記憶會前進。",outcome:`你沒有把這次見面塞進下一個行程中間。離開${def.place}時，對方知道自己被真正選擇過一次。`,effect:{npc:npcId,relation:5,trust:5,affection:intimate?5:2,invitation:{id,npcId,response:"accept",label:"接受邀約"}}},
  {id:"reschedule",label:"坦白今天做不到，但親自約定另一個時間",note:"不會立刻加深關係；數週後會出現改期後續。",outcome:"你沒有用『再看看』敷衍。新的日期被確實寫進兩個人的行事曆。",effect:{npc:npcId,trust:2,invitation:{id,npcId,response:"reschedule",label:"主動改期"}},followUp:{delayWeeks:2,event:{id:`${id}:rescheduled`,kind:"人物後續",title:`${npc.name}・被履行的改期`,text:`兩週後，你真的出現在${def.place}。對方沒有說謝謝，只把原本替你留的位置往外拉了一點。`,beats:[{label:"不是客套的下次",text:"被改期的邀請沒有消失，因為你讓承諾成為一個能抵達的日期。"}],outcome:"準時出現本身，成為比補償更可靠的回答。",effect:{npc:npcId,relation:4,trust:7,affection:intimate?4:1}}}},
  {id:"decline",label:"直接說現在不想赴約",note:"誠實拒絕；不消耗時間，但對方會記得這次距離。",outcome:"你沒有編造藉口。對方收回邀請，也重新理解你們現在能靠近到哪裡。",effect:{npc:npcId,relation:-2,trust:1,affection:-2,invitation:{id,npcId,response:"decline",label:"坦白拒絕"}}},
 ]},"NPC 主動邀約");
 state.npcInvitationHistory.push({id,npcId,week:state.week,response:"pending",title:def.place});
 return id;
}

export function tickEnsembleScene(){
 if(state.week<30||state.week%13!==0)return null;
 const available=PAIR_TOPICS.filter(([a,b])=>state.knownPeople.includes(a)&&state.knownPeople.includes(b));
 if(!available.length)return null;
 const [a,b,title,text]=available[Math.floor(state.week/13)%available.length],na=NPCS[a],nb=NPCS[b],id=`ensemble:${a}:${b}:${state.week}`;
 enqueueVisibleEvent({id,kind:"多人事件",priority:84,maxDelayWeeks:6,title:`${na.name} × ${nb.name}・${title}`,text,cast:[a,b],beats:[
  {label:"兩條人生撞在同一份工作",text},
  {label:`${na.name}的立場`,text:`${na.name}不是在爭輸贏，而是擔心退讓後，最重要的東西會被當成從未存在。`},
  {label:`${nb.name}的立場`,text:`${nb.name}也沒有要你選邊；真正的問題是，這次合作能不能容納兩種都合理的堅持。`},
 ],choices:[
  {id:"mediate",label:"把兩人的底線寫成同一份合作條件",note:"信任共同提高，但你必須承擔協調責任。",outcome:"你沒有叫任何一方顧全大局，而是讓所謂大局第一次包含每個人的底線。",effects:[{npc:a,trust:5,relation:2},{npc:b,trust:5,relation:2},{ensemble:{id,cast:[a,b],choice:"mediate",label:"共同條件"}}]},
  {id:"side-a",label:`支持${na.name}，接受另一條路被關閉`,note:`${na.name}會記得你站過來；${nb.name}也會記得代價由誰承擔。`,outcome:"你做了清楚而不討好的選擇。合作得以繼續，但關係不會假裝毫髮無傷。",effects:[{npc:a,trust:7,relation:4},{npc:b,trust:-2,relation:-3},{ensemble:{id,cast:[a,b],choice:"side-a",label:`支持${na.name}`}}]},
  {id:"side-b",label:`支持${nb.name}，接受另一條路被關閉`,note:`${nb.name}會記得你站過來；${na.name}不會把不同意見當成沒發生。`,outcome:"你選擇了承擔取捨，而不是用漂亮話把衝突拖到下一次爆炸。",effects:[{npc:a,trust:-2,relation:-3},{npc:b,trust:7,relation:4},{ensemble:{id,cast:[a,b],choice:"side-b",label:`支持${nb.name}`}}]},
 ]},"人物關係網");
 return id;
}
