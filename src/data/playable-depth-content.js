export const WEEKLY_THREADS=Object.freeze({
 job:{open:"這週的重心很明確：正在進行的作品會一路追著行程走。",follow:"前幾天留下的工作狀態沒有消失，今天進棚時，合作班底已經知道你現在卡在哪裡。",close:"一週收尾時，作品留下的不是一次結算，而是一段會被合作對象記住的工作印象。"},
 training:{open:"這週有一個能力問題反覆出現，訓練不再只是單次加點。",follow:"老師把前一次的問題重新丟回來，要求你證明那不是偶然。",close:"週末回頭看，真正的進步是同一個問題已經不需要別人提醒。"},
 romance:{open:"工作表之外，有一個人正在等你的時間。",follow:"前幾天沒有說完的話，並沒有因為行程切換就消失。",close:"這週最後留下的，可能不是作品，而是一段關係的新默契。"},
 scandal:{open:"這週的每個公開行程都多了一層視線。",follow:"昨天的新聞還在發酵，今天遇到的人已經帶著自己的理解來看你。",close:"輿論沒有在週末自動歸零；你的處理方式會決定它下週以什麼樣子留下。"}
});

export const SHORT_CHAINS=Object.freeze([
 {id:"crew-kindness",start:"片場角落，一名剛入行的場務因連續出錯被罵得抬不起頭。",choices:[{id:"help",label:"順手幫他把流程理清",later:"幾週後再遇見時，他已經能獨立處理現場，遠遠先向你點了頭。",yearLater:"一年後的新劇組裡，那個名字出現在副導名單。他記得你第一次沒有把他的狼狽當笑話。"},{id:"ignore",label:"不介入別人的工作",later:"那名場務很快從劇組消失，這件事原本應該就此結束。",yearLater:"一年後你在另一個場合聽見他的名字，才知道有些人的職涯轉彎並不會通知旁觀者。"}]},
 {id:"audition-second-look",start:"試鏡結束後，導演沒有多說什麼，副導卻在你離開前又確認了一次名字。",choices:[{id:"leave",label:"禮貌離開，不追問",later:"角色沒有拿到，但副導把你的試鏡片段留在下一案的備選資料夾。",yearLater:"新的邀約寄來時，備註只有一句：『之前看過，這次想再聊。』"},{id:"ask",label:"詢問哪裡還能更好",later:"你仍然落選，但得到一條非常具體的表演意見。",yearLater:"再次見面時，對方第一句是：『你真的改掉了。』"}]},
 {id:"viral-moment",start:"一個原本不在腳本裡的反應被剪成短影音，流量突然超過節目正片。",choices:[{id:"lean",label:"順勢接住這個梗",later:"同一個梗開始出現在更多邀約裡，曝光變快，人設也變窄。",yearLater:"有人仍用那個名場面認出你；你得決定它是招牌還是包袱。"},{id:"balance",label:"不否認，但補上另一面",later:"熱度少了一點，觀眾對你的印象卻沒有只剩一個表情包。",yearLater:"回顧影片重新翻出那段時，留言開始出現『原來他後來走這麼遠』。"}]}
]);

export const CREW_ROLES=["導演","製作人","編劇","合作演員","攝影指導","造型師","音樂製作人","主持人"];
export const CREW_SURNAMES=["林","陳","沈","周","顧","許","葉","程","方","宋","唐","何"];
export const CREW_GIVEN=["至衡","以安","聞川","若庭","子謙","靜禾","明修","語棠","景然","知夏","承宇","映真"];

export const AUDITION_INTEL=[
 {key:"restraint",tip:"導演不喜歡把情緒全部演在臉上。",prompt:"把剛才那段收掉一半，再來一次。"},
 {key:"improv",tip:"這組人很看臨場反應，照本宣科反而吃虧。",prompt:"台詞不變，但現在假設對方沒有照劇本回答。"},
 {key:"motive",tip:"導演會追問角色動機，不接受『劇本這樣寫』。",prompt:"先別演。告訴我，這個角色為什麼現在不走？"},
 {key:"chemistry",tip:"這個案子最後一輪很重視搭檔火花。",prompt:"換一位搭檔，再從中間開始。"}
];

export const LEGACY_TAGS=Object.freeze({
 breakthrough:"突破作",critical:"影評口碑",commercial:"商業代表作",cult:"長尾神作",award:"獎季作品",meme:"全民名場面",controversial:"爭議作品",turning:"轉型作"
});

export const MEMORY_LABELS=Object.freeze({firstMeet:"第一次見面",firstWork:"第一次合作",firstDate:"第一次約會",firstConflict:"第一次真正吵架",helped:"曾經站在對方這邊",publicLove:"公開關係",breakup:"分手",reconcile:"復合",proposal:"求婚／訂婚",marriage:"結婚"});

export const FAME_LIFE_TIERS=Object.freeze([
 {min:0,label:"還能自由生活",text:"街上沒有人特別注意你。"},
 {min:250,label:"開始被認出",text:"熱門地點偶爾有人回頭確認是不是你。"},
 {min:700,label:"公開行程有成本",text:"臨時去人多的地方可能引來合照、偷拍與即時貼文。"},
 {min:1400,label:"爆紅生活",text:"普通約會也需要選包廂、側門與時間；成功開始改變生活本身。"}
]);

export const SCANDAL_RESPONSES=Object.freeze([
 {id:"silent",label:"暫不回應",text:"不替新聞增加新句子，但空白會被別人填滿。"},
 {id:"deny",label:"明確否認",text:"短期止血很快；如果後續出現反證，可信度會承受更大代價。"},
 {id:"admit",label:"直接承認",text:"話題度會升高，但長期比較不容易被追著問同一句。"},
 {id:"vague",label:"模糊處理",text:"保留空間，也延長猜測壽命。"},
 {id:"publicLove",label:"公開關係",text:"把緋聞變成正式關係事件；伴侶、品牌與粉絲都會立刻回應。"}
]);

export const ANNUAL_TENTPOLES=Object.freeze([
 {week:8,title:"春季平台招商",lead:3,pressure:"下一季的大案開始找人，經紀公司會提前調整履歷與檔期。"},
 {week:20,title:"城市電影節",lead:5,pressure:"作品、紅毯與影評會同時被看見。"},
 {week:31,title:"夏季大型音樂祭",lead:4,pressure:"歌手與綜藝路線都能吃到曝光，但準備期會壓縮其他工作。"},
 {week:39,title:"時尚週",lead:5,pressure:"品牌關係、造型與座位本身就是業界訊號。"},
 {week:47,title:"年度盛典／獎季",lead:6,pressure:"入圍、表演、紅毯與競爭者會在同一段時間集中碰撞。"},
 {week:52,title:"跨年舞臺",lead:4,pressure:"直播沒有重來，人氣越高，舞臺越大、事故成本也越高。"}
]);

export const NG_PLUS_INTUITION=Object.freeze([
 "你說不上原因，但總覺得這個機會不該太快拒絕。",
 "這個名字讓你有種奇怪的熟悉感，像是曾經在哪份工作名單上看過。",
 "你直覺知道：現在把行程排滿，幾週後可能會後悔。",
 "某個選項看起來普通，你卻比第一次更清楚它真正會犧牲什麼。"
]);
