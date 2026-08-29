// 集中管理劇情與行程美術。事件資料只需維持敘事 ID，畫面層不必散落資產路徑。
const scene=(file,alt,position="center")=>Object.freeze({src:`./assets/scenes/${file}`,alt,position});
const cg=(file,alt,position="center")=>Object.freeze({src:`./assets/cg/${file}`,alt,position});

export const SCENE_ART=Object.freeze({
 room:scene("rookie-room-night.webp","夜晚的新人租屋處"),
 audition:scene("audition-room.webp","正式試鏡室"),
 studio:scene("studio-17.webp","十七號攝影棚"),
 recording:scene("echo-recording-studio.webp","迴聲錄音室"),
 radio:scene("star-city-radio-night.webp","深夜的星望廣播電臺"),
 backstage:scene("backstage-dressing-room.webp","演出後台化妝間"),
 awards:scene("awards-stage.webp","星望市頒獎典禮舞臺"),
 editing:scene("editing-suite-night.webp","深夜剪輯室"),
 cafe:scene("morning-star-cafe-rain.webp","雨天的晨星咖啡館"),
 cinema:scene("star-cinema-premiere.webp","星輝電影院首映夜"),
 press:scene("press-conference.webp","媒體記者會現場"),
 hospital:scene("hospital-room-dawn.webp","清晨的醫院病房"),
 airport:scene("star-city-airport.webp","星望國際機場")
});

const ACTION_SCENES=Object.freeze({
 vocal:"recording",songwriting:"recording",acting:"studio",dance:"studio",speech:"radio",
 creation:"editing",script:"editing",study:"room",image:"backstage",styling:"backstage",
 networking:"cafe",audition:"audition",job_session:"studio",personal_task:"editing",
 street:"cinema",free:"cafe",rest:"room",agency_interview:"press"
});

const LOCATION_SCENES=Object.freeze({
 radio:"radio",tv_company:"studio",film_company:"cinema",record_company:"recording",
 media_company:"studio",livehouse:"recording",cinema:"cinema",studio:"studio",
 recording:"recording",rehearsal:"audition",theatre:"backstage",gallery:"cinema",
 shop:"backstage",business:"press",cafe:"cafe",library:"room",clinic:"hospital",airport:"airport"
});

export function runnerSceneArt(actionId,locationId=null,result=null){
 if(result?.portrait)return SCENE_ART.backstage;
 return SCENE_ART[LOCATION_SCENES[locationId]||ACTION_SCENES[actionId]||"studio"];
}

const EXACT_EVENT_ART=Object.freeze({
 "network-offer":cg("chapter-jiqing-network-offer.webp","喬映澄在會議室拒絕把訪談變成衝突秀"),
 "first-season":cg("chapter-jiqing-first-season.webp","喬映澄在第一季結束後讀完聽眾來信"),
 "actor-break":cg("chapter-shenyao-actor-break.webp","裴硯之在高壓片場停下來聽演員說完"),
 "festival-no":cg("chapter-shenyao-festival-no.webp","裴硯之在雨夜承認影展落選的失落"),
 "public-screening":cg("chapter-shenyao-public-screening.webp","裴硯之在小型放映的最後一排聽觀眾說話"),
 "solo-rumor":cg("chapter-tangtang-solo-rumor.webp","楚星梨先與團員說清楚單飛傳聞"),
 "member-conflict":cg("chapter-tangtang-member-conflict.webp","楚星梨在舞蹈教室面對團體轉型歧見"),
 "villain-cut":cg("chapter-guchengxi-villain-cut.webp","周予珩在化妝間拒絕為反派角色討好輿論"),
 "old-contract":cg("chapter-guchengxi-old-contract.webp","周予珩只以可證明的事回應舊合約風波"),
 "first-payroll":cg("chapter-linxiafan-first-payroll.webp","黎曼青在深夜核對工作室第一份薪資"),
 "assistant-name":cg("chapter-linxiafan-assistant-name.webp","黎曼青退到一旁看著助理首次獨立署名"),
 "chorus-order":cg("chapter-lujingran-chorus-order.webp","江敘白在錄音室尋找不犧牲歌曲呼吸的短版"),
 "quiet-release":cg("chapter-lujingran-quiet-release.webp","江敘白關掉數字與玩家聽完沒有熱搜的新歌"),
 "team-burnout":cg("chapter-chengyian-team-burnout.webp","溫時嶼在深夜辦公室看見漂亮提案背後的透支"),
 "team-exit":cg("chapter-hanzhiyuan-team-exit.webp","秦紹謙放下挽留條件聽完核心製作人的離職理由"),
 "guest-boundary":cg("chapter-jiqing-guest-boundary.webp","喬映澄在錄音室守住來賓不願公開的界線"),
 "missing-shot":cg("chapter-shenyao-missing-shot.webp","裴硯之在剪輯室為被拿走的關鍵鏡頭據理力爭"),
 "fan-project":cg("chapter-tangtang-fan-project.webp","楚星梨讀著粉絲替她留下的創作時間線"),
 "young-actor":cg("chapter-guchengxi-young-actor.webp","周予珩在片場替緊張的新人留一次完整重來"),
 "copied-work":cg("chapter-linxiafan-copied-work.webp","黎曼青在工作室整理遭到抄襲的原始創作"),
 "two-names":cg("chapter-lujingran-two-names.webp","江敘白在演唱會上把掌聲還給所有創作者"),
 "session-credit":cg("chapter-lujingran-session-credit.webp","江敘白在母帶送出前補回遺漏的樂手署名"),
 "bad-review":cg("chapter-xiayutong-bad-review.webp","宋知夏在空蕩放映室面對那篇說中的負評"),
 "second-round":cg("chapter-xiayutong-second-round.webp","宋知夏讓沒有代表作的新人留下進入第二輪"),
 "platform-note":cg("chapter-xiayutong-platform-note.webp","宋知夏在平台會議守住角色真正活起來的時間"),
 "family-seat":cg("chapter-sufei-family-seat.webp","許映真在首映散場後向家人承認一路並不容易"),
 "understudy":cg("chapter-sufei-understudy.webp","許映真在遞補通知後走向真正屬於自己的舞臺"),
 "stage-return":cg("chapter-guchengxi-stage-return.webp","周予珩在老劇場後台選擇重返舞臺"),
 "studio-year":cg("chapter-linxiafan-studio-year.webp","黎曼青在工作室週年夜為失敗版本舉杯"),
 "same-credit":cg("chapter-sufei-same-credit.webp","許映真在並列主演席前確認平等合作"),
 "crew-hour":cg("chapter-xiayutong-crew-hour.webp","宋知夏在清晨片場為劇組宣布收工"),
 "board-choice":cg("chapter-hanzhiyuan-board-choice.webp","秦紹謙在雨夜董事會後交出最終企劃"),
 "artist-no":cg("chapter-chengyian-artist-no.webp","溫時嶼收起簡報並真正聽見藝人的拒絕"),
 "client-secret":cg("chapter-chengyian-client-secret.webp","溫時嶼拒絕把當事人的傷口變成企劃賣點"),
 "failed-pitch":cg("chapter-chengyian-failed-pitch.webp","溫時嶼守住原則後獨自面對落選的代價"),
 "voice-rest":cg("chapter-tangtang-voice-rest.webp","楚星梨在休聲期間用心意卡代替說話"),
 "listener-letter":cg("chapter-jiqing-listener-letter.webp","喬映澄在深夜錄音室讀一封匿名來信"),
 "rough-cut":cg("shenyao-rough-cut.webp","裴硯之在深夜剪輯室審視粗剪"),
 "unplugged":cg("tangtang-unplugged.webp","楚星梨在無伴奏的舞臺安可"),
 "rent-day":cg("sufei-rent-day.webp","許映真在房租日等待試鏡通知"),
 "last-bow":cg("guchengxi-last-bow.webp","周予珩謝幕後回到後台"),
 "body-request":cg("linxiafan-body-request.webp","黎曼青拒絕不合理的修圖要求"),
 "empty-studio":cg("jiqing-empty-studio.webp","喬映澄獨自在停播後的錄音室"),
 "ordinary-night":cg("hanzhiyuan-ordinary-night.webp","秦紹謙度過沒有工作訊息的夜晚"),
 "small-project":cg("chapter-hanzhiyuan-small-project.webp","秦紹謙替沒有明星的小企劃爭取完整製作期"),
 "wrong-model":cg("chapter-hanzhiyuan-wrong-model.webp","秦紹謙在預測失準後公開承擔自己的判斷"),
 "next-monitor":cg("xiayutong-ordinary-dawn.webp","宋知夏在清晨監看下一部作品"),
 "own-column":cg("chengyian-sunset-frame.webp","溫時嶼把鏡頭轉向夕陽下的玩家"),
 "lujingran-chat":cg("lujingran-shared-headphones.webp","江敘白把耳機分給玩家一邊"),
 "band-reply":cg("lujingran-shared-headphones.webp","江敘白與玩家共聽沒有說完的旋律"),
 "silver-route-festival":cg("silver-pc-film-festival.png","沈霧棠在夜間影展重新認出玩家"),
 "silver-route-archive":cg("silver-pc-archive-room.png","沈霧棠在隱藏檔案室交出被抹去的記憶卡"),
 "silver-pc-last-train":cg("silver-pc-last-train.webp","沈霧棠在末班車上再次認出玩家")
});

const NPC_ROUTE_ART=Object.freeze({
 shenyao:cg("route-shenyao-shared-umbrella.webp","裴硯之在雨中把傘偏向玩家"),
 tangtang:cg("route-tangtang-secret-date.webp","楚星梨與玩家的深夜秘密約會"),
 hanzhiyuan:cg("route-hanzhiyuan-hospital-vigil.webp","秦紹謙在病床旁守候到天亮"),
 jiqing:cg("route-jiqing-studio-argument.webp","喬映澄在直播後的錄音室轉身離開"),
 lujingran:cg("route-lujingran-rooftop-confession.webp","江敘白在天台以一副耳機說出心意"),
 silver_pc:cg("route-silver-last-train-farewell.webp","銀髮旅人在末班車門前伸出手"),
 chengyian:cg("route-chengyian-premiere-reunion.webp","溫時嶼在首映夜越過人群迎向玩家")
});

const MILESTONE_RULES=Object.freeze([
 [/flagship-choice:|旗艦作品|第三份答案/,cg("milestone-flagship-signature.png","玩家在旗艦作品的關鍵現場提出第三份答案")],
 [/npc-romance-.*:committed:|求婚|走向下一步/,cg("milestone-romance-proposal.png","重要的人在城市夜色中向玩家求婚")],
 [/npc-romance-.*:engaged:|結婚|婚禮/,cg("milestone-romance-wedding.png","玩家在私人婚禮交換戒指")],
 [/分手|分開|broken|breakup/,cg("milestone-romance-breakup.png","兩人在雨夜離開彼此的生活")],
 [/續約|renewal|renew-/,cg("milestone-contract-renewal.png","玩家與長期夥伴簽下續約")],
 [/完整人生|integrated|作品、關係與制度/,cg("milestone-five-year-integrated.png","五年後玩家讓作品、關係與制度成為同一份答案")],
 [/award-ceremony|頒獎|得獎|獲獎|獎座/,cg("milestone-first-award.webp","玩家第一次在頒獎臺舉起獎座")],
 [/scandal|醜聞|緋聞|公關危機|危機的第二波/,cg("milestone-scandal-press.webp","輿論危機中蜂擁而至的媒體")],
 [/overwork|過勞|昏倒|健康警訊|強制休養/,cg("milestone-overwork-collapse.webp","玩家因過勞倒在後台")],
 [/紅毯|典禮週|影視獎季|品牌影響力獎/,cg("milestone-first-red-carpet.webp","玩家第一次踏上聚光燈下的紅毯")],
 [/粉絲|應援|被認出/,cg("milestone-first-fan.webp","玩家第一次在街頭被粉絲認出")],
 [/簽約|合約|發出合約/,cg("milestone-first-contract.webp","玩家簽下第一份演藝合約")],
 [/公開試鏡|正式通告試鏡|試鏡/,cg("milestone-first-audition.webp","玩家第一次站進正式試鏡室")],
 [/開機|開拍|正式拍攝|第一顆鏡頭|通告殺青/,cg("milestone-first-shoot.webp","玩家第一次站上正式拍攝現場")]
]);

function eventSearchText(event){return`${event?.id||""} ${event?.kind||""} ${event?.title||""} ${event?.text||""}`;}
function npcIdFromEvent(event){
 const text=eventSearchText(event);
 return Object.keys(NPC_ROUTE_ART).find(id=>text.includes(id))||null;
}

export function eventStoryArt(event){
 if(!event)return null;
 const text=eventSearchText(event);
 for(const[id,art]of Object.entries(EXACT_EVENT_ART))if(text.includes(id))return art;
 for(const[pattern,art]of MILESTONE_RULES)if(pattern.test(text))return art;
 const npcId=npcIdFromEvent(event);
 if(npcId&&(text.includes("npc-romance-")||event.kind==="戀愛事件"||/分開|重逢|曖昧|心意|約會/.test(text)))return NPC_ROUTE_ART[npcId];
 if(text.includes("末班車")||text.includes("silver_pc"))return NPC_ROUTE_ART.silver_pc;
 if(text.includes("醫院")||text.includes("病床"))return NPC_ROUTE_ART.hanzhiyuan;
 if(text.includes("直播後")||text.includes("爭執")||text.includes("決裂"))return NPC_ROUTE_ART.jiqing;
 if(event.kind==="輿論事件")return SCENE_ART.press;
 if(event.kind==="戀愛事件")return SCENE_ART.cafe;
 if(event.kind==="職涯事件")return SCENE_ART.studio;
 if(event.kind==="人物事件")return SCENE_ART.backstage;
 return SCENE_ART.cinema;
}

export const STORY_ART_ASSETS=Object.freeze([
 ...Object.values(SCENE_ART),...Object.values(EXACT_EVENT_ART),...Object.values(NPC_ROUTE_ART),
 ...MILESTONE_RULES.map(([,art])=>art)
]);

const MILESTONE_GALLERY_ITEMS=Object.freeze([
 ["milestone:proposal","關於更遠的以後",cg("milestone-romance-proposal.png","重要的人在城市夜色中向玩家求婚")],
 ["milestone:wedding","把承諾變成生活",cg("milestone-romance-wedding.png","玩家在私人婚禮交換戒指")],
 ["milestone:breakup","雨夜留下的距離",cg("milestone-romance-breakup.png","兩人在雨夜離開彼此的生活")],
 ["milestone:renewal","下一份共同合約",cg("milestone-contract-renewal.png","玩家與長期夥伴簽下續約")],
 ["milestone:integrated","完整人生",cg("milestone-five-year-integrated.png","五年後玩家讓作品、關係與制度成為同一份答案")],
 ["milestone:flagship","第三份答案",cg("milestone-flagship-signature.png","玩家在旗艦作品的關鍵現場提出第三份答案")]
].map(([id,title,art])=>Object.freeze({id,kind:"milestone",title,art})));

export const CG_GALLERY_ITEMS=Object.freeze([
 ...Object.entries(EXACT_EVENT_ART).map(([id,art])=>Object.freeze({id,kind:"chapter",title:art.alt,art})),
 ...Object.entries(NPC_ROUTE_ART).map(([id,art])=>Object.freeze({id:`route:${id}`,kind:"route",title:art.alt,art})),
 ...MILESTONE_GALLERY_ITEMS
]);
