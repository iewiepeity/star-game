import{state}from"../core/state.js";
import{enqueueVisibleEvent}from"./event-engine.js";

const trust=()=>state.relationships.silver_pc?.trust||0;
const known=()=>state.knownPeople.includes("silver_pc");
const scene=(id,trustMin,title,text,beats,choices)=>Object.freeze({id,requires:()=>known()&&trust()>=trustMin,title,text,beats,choices});
const npc=(relation,trustGain,affection=0)=>({npc:"silver_pc",relation,trust:trustGain,affection});

export const HIDDEN_ROUTE_CHAPTERS=Object.freeze([
 {id:"encounter",requires:()=>!known()&&state.week>=9&&state.familiarNpcs.length>=3,title:"錯過一班車之後",text:"末班車門關上前，你和一名銀灰長髮的女子同時停下腳步。她看著你，像在確認一段只有夢裡才發生過的記憶。",beats:[{label:"關門提示",text:"月臺廣播催促旅客上車，你們卻同時停在黃線兩側。"},{label:"沒有來源的熟悉",text:"她準確說出你習慣先伸哪一隻手，說完後自己也怔住。"},{label:"重新自我介紹",text:"她叫沈霧棠。這一次，名字不是從任何舊記憶裡被撿回來的。"}],choices:[{id:"stay",label:"停下來問她的名字",outcome:"你們交換聯絡方式，誰也沒有把熟悉感當成承諾。",effect:npc(4,4,1)},{id:"leave",label:"先搭上下一班車",outcome:"三天後，工作信箱收到她的動態設計提案；你們仍從正式自我介紹開始。",effect:npc(2,2)}]},
 scene("echo",8,"兩份一模一樣的分鏡","沈霧棠帶來一份沒有日期的舊分鏡。最後一格的舞臺、服裝與你曾做過的選擇完全相同，但那並不是這一輪發生過的事。",[{label:"舊稿",text:"紙張有被反覆翻閱的折痕，卻找不到任何製作年份。"},{label:"重疊",text:"其中一格畫著你從未穿過、卻莫名知道重量的演出服。"},{label:"現在",text:"霧棠把筆放到你面前：如果要補下一格，應該畫這一輪真正發生的事。"}],[{id:"compare",label:"把自己的記憶也攤開比對",outcome:"你們共同記下所有重疊之處，也標出彼此記憶互相矛盾的地方。",effect:npc(5,7,2)},{id:"present",label:"先畫現在想完成的作品",outcome:"她收起舊稿；再遇見的意義或許不是找回過去，而是別再錯過現在。",effect:npc(6,5,3)}]),
 scene("fracture",18,"記憶第一次互相背叛","你夢見自己曾在頒獎夜追出去挽留她；霧棠卻記得是她站在雨裡，而你從未回頭。同一段人生不可能同時擁有兩個版本。",[{label:"夢境證詞",text:"你們分別寫下細節，連雨落在玻璃上的方向都不一樣。"},{label:"無法驗證",text:"沒有照片、訊息或檔案能證明任何一方記得比較正確。"},{label:"第一條界線",text:"霧棠問：如果記憶不能當證據，你還願不願意相信她此刻的感受？"}],[{id:"believe",label:"相信感受，不替記憶判真偽",outcome:"你們約定不再用上一輪的版本要求對方道歉。",effect:npc(5,8,3)},{id:"verify",label:"繼續尋找能交叉驗證的線索",outcome:"她同意調查，但要求任何答案都不能凌駕現在的選擇。",effect:npc(3,6,1)}]),
 scene("festival",28,"一部只拍不存在人生的短片","海外影展邀請霧棠製作開幕影像。她想把那些互相矛盾的共同記憶拍成一部短片，卻把是否入鏡的決定留給你。",[{label:"測試鏡頭",text:"動態捕捉棚裡沒有布景，所有過去都只能由動作與停頓成立。"},{label:"導演與演員",text:"她在監看螢幕後非常冷靜，直到你重現某個兩人都記得的回頭。"},{label:"片名空白",text:"輸出檔案前，她堅持不使用任何像命運或前世的名字。"}],[{id:"perform",label:"親自演出那些不確定的記憶",outcome:"你不保證它們真實，只承認它們確實影響了現在。",effect:npc(6,7,4)},{id:"observe",label:"只擔任共同剪輯與見證者",outcome:"你保留與舊人生的距離，卻陪她把作品完整做完。",effect:npc(4,8,2)}]),
 scene("archive",38,"被刪除的結局檔案","影展伺服器的備份裡出現一個不屬於任何工作人員的舊檔。影片只有九秒：散場後的你獨自站在空座位間，而霧棠的聲音說『這次不要等我』。",[{label:"九秒",text:"檔案沒有建立者，時間標記卻落在你上一輪結束的那一週。"},{label:"刪除鍵",text:"霧棠沒有按播放第二次，只問你要不要保留。"},{label:"真正害怕的事",text:"她怕的不是忘記，而是你們會為了修正舊結局，再次犧牲現在。"}],[{id:"delete",label:"一起永久刪除檔案",outcome:"你們不再把人生當成需要修正的剪輯版本。",effect:npc(6,9,4)},{id:"seal",label:"封存，但不再重播",outcome:"檔案被加密保存；它是證據，不是命令。",effect:npc(4,8,2)}]),
 scene("consent",48,"熟悉不能代替同意","合作結束後，媒體把你們的默契寫成命定重逢。霧棠第一次在鏡頭前明確否認：沒有人因為前一輪被愛過，就欠下一輪一段感情。",[{label:"熱門標題",text:"『跨越命運再次相遇』比作品本身得到更多轉發。"},{label:"她的否認",text:"霧棠沒有否認在意，只否認任何人替你們先寫好答案。"},{label:"沒有觀眾的對話",text:"記者離開後，她問你是否也願意公開守住這條界線。"}],[{id:"stand",label:"和她一起說清楚",outcome:"外界少了一個浪漫標題，你們卻第一次擁有不被故事綁架的關係。",effects:[npc(5,9,4),{flag:"silver-route:consent"}]},{id:"private",label:"把答案留在沒有鏡頭的地方",outcome:"你不配合命定敘事，也不把私人關係交給媒體驗證。",effects:[npc(5,8,5),{flag:"silver-route:private"}]}]),
 scene("choice",58,"不是命中注定的答案","霧棠終於承認，她也反覆夢見不屬於這一輪的人生。她沒有問你是否相信，只問：沒有任何舊承諾時，這一輪還會不會選擇認識她？",[{label:"最後一本舊分鏡",text:"她把所有無法驗證的記憶裝進同一個資料盒。"},{label:"沒有命運作證",text:"房間裡只剩現在的你們，沒有故事替任何答案背書。"},{label:"重新選擇",text:"這不是找回誰，而是決定此刻想讓誰留下。"}],[{id:"again",label:"這次也從真正認識開始",outcome:"你們把似曾相識留在身後，第一次只為眼前的人留下位置。",effect:npc(8,9,8)},{id:"friends",label:"不讓過去替現在決定",outcome:"她接受這個答案。能夠自由選擇，也是重新開始真正的意義。",effect:npc(5,8,1)},{id:"rewrite",label:"承認記得，但共同寫第三個版本",note:"第三周目或洞察 620",special:true,requires:(state.runCount||1)>=3?{runMin:3}:{hidden:{洞察:620}},outcome:"你們不採用任何一方的舊結局，而是把矛盾本身拍成下一部共同作品。",effects:[npc(8,10,7),{flag:"silver-route:third-draft"}]}]),
 scene("finale",68,"末班車不再是唯一出口","新作品首映散場，列車即將進站。這一次，霧棠沒有站在車門裡伸手；她和你一起留在月臺，看著那班曾經象徵錯過的車自行離開。",[{label:"首映謝幕",text:"觀眾為那部沒有說明真假的作品鼓掌，沒有人需要知道它源自哪一輪。"},{label:"列車進站",text:"同樣的提示音響起，你們卻都沒有急著跨進車門。"},{label:"下一班",text:"城市還亮著。你們決定用現在的時間，走去一個從未出現在舊分鏡裡的地方。"}],[{id:"together",label:"一起走向沒有畫過的下一幕",outcome:"熟悉感終於不再是債，而成為你們願意再次靠近的理由。",effects:[npc(8,10,8),{flag:"silver-route:present"}]},{id:"farewell",label:"好好道別，也保留這次相遇",outcome:"你們沒有成為戀人，卻完成了一段不需要以遺憾證明深刻的關係。",effects:[npc(5,9,0),{flag:"silver-route:farewell"}]}]),
]);

export function queueHiddenRoute(){
 if((state.runCount||1)<2)return null;
 state.hiddenRouteHistory??=[];
 const chapter=HIDDEN_ROUTE_CHAPTERS.find(item=>!state.hiddenRouteHistory.includes(item.id)&&item.requires());
 if(!chapter)return null;
 const choices=chapter.choices?.map(choice=>choice.id==="rewrite"&&(state.runCount||1)>=3?{...choice,requires:{}}:choice);
 const payload={...chapter,choices,id:`silver-route-${chapter.id}`,kind:"人物事件",persistent:true,priority:110};
 enqueueVisibleEvent(payload,"多周目人物主線");state.hiddenRouteHistory.push(chapter.id);return payload.id;
}
