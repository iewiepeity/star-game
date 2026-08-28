export const TUTORIALS=[
 {id:"room-welcome",when:s=>s.screen==="game"&&!s.appOpen,kicker:"新人手冊・第一步",title:"先安排，再開跑",text:"每一週都從平板開始。先安排七天行程，再按「開始這週」，結果會按照星期逐日演出。"},
 {id:"planner-basics",when:s=>s.screen==="game"&&s.appOpen==="planner",kicker:"經紀人小抄・行程",title:"點日期，再選活動",text:"先點行事曆中的一天，再從下方選活動。疲勞會影響訓練、試鏡與工作表現，別把自己排成黑心公司的受害者。"},
 {id:"agency-basics",when:s=>s.screen==="game"&&s.appOpen==="agency",kicker:"經紀人小抄・簽約",title:"公司不是裝飾品",text:"比較門檻與合約後再投遞。簽約後，經紀人每週只會送來有限且適合你的工作，不會把整座娛樂圈塞進信箱。"},
 {id:"map-basics",when:s=>s.screen==="game"&&s.appOpen==="map",kicker:"經紀人小抄・探索",title:"自由活動要有目的地",text:"地圖會把目前選取的日期安排成自由活動。主動探索較容易遇見人物；專注體驗則偏向能力成長。"},
 {id:"jobs-basics",when:s=>s.screen==="game"&&s.appOpen==="jobs",kicker:"經紀人小抄・通告",title:"先看資質，再搶鏡頭",text:"資質達標才能登記試鏡；試鏡也會占用一天行程。簽約後還要依指定工作日，在期限內完成所有場次。"},
 {id:"npc-basics",when:s=>s.screen==="game"&&s.appOpen==="npc"&&s.knownPeople?.length,kicker:"經紀人小抄・人際",title:"關係藏在相處裡",text:"好感與交惡數值不會直接顯示。多次見面、主動相處與合作會開啟專屬事件；踩到底線，愛心也可能當場碎給你看。"},
 {id:"wardrobe-basics",when:s=>s.screen==="game"&&s.appOpen==="wardrobe",kicker:"造型師便條・衣櫃",title:"穿搭也算戰力",text:"每位立繪角色分開擁有服裝；換裝提供不同能力加成。先看場合與通告需求，不是最貴那套就能走遍天下。"},
 {id:"stats-basics",when:s=>s.screen==="game"&&s.appOpen==="stats",kicker:"經紀人小抄・能力",title:"能力上限是一千",text:"能力條以 1,000 為滿值，衣服加成會另外計入。隱藏特質不靠普通訓練提升，而是由選擇、事件與經歷慢慢改變。"},
 {id:"runner-basics",when:s=>s.screen==="runner",kicker:"拍攝現場・執行中",title:"一天一天走完這週",text:"每天會獨立結算成功、成長與疲勞；遇到選擇事件時流程會暫停，等你決定後才繼續。"},
 {id:"summary-basics",when:s=>s.screen==="summary",kicker:"經紀人小抄・週報",title:"看懂這週留下什麼",text:"週報會整理能力、金錢、名聲、關係與事件結果。確認完再進入下一週，新的邀約與人物動態也會跟著更新。"}
];

export function nextTutorial(state){
 const seen=new Set(Array.isArray(state.tutorialSeen)?state.tutorialSeen:[]);
 return TUTORIALS.find(item=>!seen.has(item.id)&&item.when(state))||null;
}

export function markTutorialSeen(state,id){
 const seen=new Set(Array.isArray(state.tutorialSeen)?state.tutorialSeen:[]);
 seen.add(id);
 state.tutorialSeen=[...seen];
}
