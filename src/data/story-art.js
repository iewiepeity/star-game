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
 airport:scene("star-city-airport.webp","星望國際機場"),
 agency:scene("talent-agency-lobby.webp","經紀公司大廳與面談區"),
 television:scene("tv-variety-studio.webp","星曜電視台綜藝攝影棚"),
 filmSet:scene("film-soundstage.webp","極光影業電影拍攝現場"),
 dance:scene("pulse-dance-studio.webp","Pulse 舞蹈教室"),
 livehouse:scene("eclipse-livehouse.webp","月蝕 Live House 舞臺"),
 theatre:scene("galaxy-theatre.webp","星河劇場舞臺"),
 fashion:scene("fashion-atelier.webp","時尚造型工作室"),
 boardroom:scene("entertainment-boardroom.webp","星環商務中心會議室"),
 gallery:scene("white-wall-gallery.webp","白牆藝廊展場"),
 library:scene("city-media-library.webp","星望市立圖書館影視館藏區"),
 boutique:scene("starlight-boutique.webp","星光購物商場時尚選品店"),
 park:scene("star-riverside-park.webp","金色夕陽下的星河濱水公園"),
 gym:scene("lark-fitness-center.webp","雲雀健身中心的專業訓練區"),
 temple:scene("starview-mazu-temple.webp","清晨的星望媽祖廟庭院"),
 beach:scene("moon-bay-beach.webp","紫金夕照下的月灣海灘"),
 restaurant:scene("nightlight-bistro.webp","夜光小館的慶功晚餐"),
 beauty:scene("morning-beauty-salon.webp","晨曦藝人美容沙龍"),
 cityStreet:scene("entertainment-district-rain.webp","雨後的星望市娛樂街區")
});

const ACTION_SCENES=Object.freeze({
 vocal:"recording",songwriting:"recording",acting:"studio",dance:"dance",speech:"radio",
 creation:"editing",script:"editing",study:"room",image:"backstage",styling:"backstage",
 networking:"cafe",audition:"audition",job_session:"studio",personal_task:"editing",
 street:"cityStreet",free:"cafe",rest:"room",agency_interview:"agency"
});

const LOCATION_SCENES=Object.freeze({
 radio:"radio",tv_company:"television",film_company:"filmSet",record_company:"recording",
 media_company:"fashion",livehouse:"livehouse",cinema:"cinema",studio:"filmSet",
 recording:"recording",rehearsal:"audition",theatre:"theatre",gallery:"gallery",
 shop:"boutique",business:"boardroom",cafe:"cafe",library:"library",clinic:"hospital",
 airport:"airport",dance:"dance",park:"park",market:"cityStreet",restaurant:"restaurant",
 gym:"gym",temple:"temple",beach:"beach",beauty:"beauty"
});

export function runnerSceneArt(actionId,locationId=null,result=null){
 if(result?.portrait)return SCENE_ART.backstage;
 return SCENE_ART[LOCATION_SCENES[locationId]||ACTION_SCENES[actionId]||"studio"];
}

const EXACT_EVENT_ART=Object.freeze({
 "network-offer":cg("chapter-jiqing-network-offer.webp","喬映澄在電視網會議討論試播邀約與來賓界線"),
 "first-season":cg("chapter-jiqing-first-season.webp","喬映澄在收播後整理聽眾回饋與下一季提案"),
 "actor-break":cg("chapter-shenyao-actor-break.webp","裴硯之在片場休息區重新檢查給演員的指令"),
 "festival-no":cg("chapter-shenyao-festival-no.webp","裴硯之面對影展退件信與接下來的放映選擇"),
 "public-screening":cg("chapter-shenyao-public-screening.webp","裴硯之在小型放映後面對觀眾與映後問卷"),
 "solo-rumor":cg("chapter-tangtang-solo-rumor.webp","楚星梨整理個人試唱引發的單飛傳聞"),
 "member-conflict":cg("chapter-tangtang-member-conflict.webp","楚星梨在舞蹈教室面對團體轉型歧見"),
 "villain-cut":cg("chapter-guchengxi-villain-cut.webp","周予珩檢查反派預告與本人形象被混談的輿論"),
 "old-contract":cg("chapter-guchengxi-old-contract.webp","周予珩整理去識別的舊合約時間線與說明稿"),
 "first-payroll":cg("chapter-linxiafan-first-payroll.webp","黎曼青在深夜核對工作室第一份薪資"),
 "assistant-name":cg("chapter-linxiafan-assistant-name.webp","黎曼青在助理主責提案前練習交回決定權"),
 "chorus-order":cg("chapter-lujingran-chorus-order.webp","江敘白在錄音室比較副歌位置不同的兩個版本"),
 "quiet-release":cg("chapter-lujingran-quiet-release.webp","江敘白面對新歌上線後安靜的數字與回饋"),
 "team-burnout":cg("chapter-chengyian-team-burnout.webp","溫時嶼在深夜辦公室看見漂亮提案背後的透支"),
 "team-exit":cg("chapter-hanzhiyuan-team-exit.webp","秦紹謙面對經紀助理的離職與下班需求"),
 "guest-boundary":cg("chapter-jiqing-guest-boundary.webp","喬映澄在錄音室守住來賓不願公開的界線"),
 "missing-shot":cg("chapter-shenyao-missing-shot.webp","裴硯之在剪輯室討論四十七秒告別戲的刪剪"),
 "fan-project":cg("chapter-tangtang-fan-project.webp","楚星梨讀著粉絲替她留下的創作時間線"),
 "young-actor":cg("chapter-guchengxi-young-actor.webp","周予珩在片場思考如何協助忘詞的新人"),
 "copied-work":cg("chapter-linxiafan-copied-work.webp","黎曼青核對相似提案與帶日期的原始創作"),
 "two-names":cg("chapter-lujingran-two-names.webp","江敘白在小型演出前核對參與者署名與節目單"),
 "session-credit":cg("chapter-lujingran-session-credit.webp","江敘白在母帶送出前查到缺漏的樂手署名"),
 "bad-review":cg("chapter-xiayutong-bad-review.webp","宋知夏在試播檢討放映室核對負評與未剪素材"),
 "second-round":cg("chapter-xiayutong-second-round.webp","宋知夏以綜藝試錄片段討論新人的第二輪資格"),
 "platform-note":cg("chapter-xiayutong-platform-note.webp","宋知夏在平台會議討論外景規則與開場節奏"),
 "family-seat":cg("chapter-sufei-family-seat.webp","許映真在小成本短片放映前準備留給家人的座位"),
 "understudy":cg("chapter-sufei-understudy.webp","許映真收到短篇讀劇遞補通知後整理排練準備"),
 "stage-return":cg("chapter-guchengxi-stage-return.webp","周予珩在劇場討論回歸演出與完整排練的條件"),
 "studio-year":cg("chapter-linxiafan-studio-year.webp","黎曼青在工作室回顧夜整理退稿與失敗打樣"),
 "same-credit":cg("chapter-sufei-same-credit.webp","許映真與玩家談私人排練簿上的兩個名字"),
 "crew-hour":cg("chapter-xiayutong-crew-hour.webp","宋知夏在錄製現場討論工時上限與最後一關"),
 "board-choice":cg("chapter-hanzhiyuan-board-choice.webp","秦紹謙在會議後整理無法同時承接的兩份邀約"),
 "artist-no":cg("chapter-chengyian-artist-no.webp","溫時嶼看見合作對象不願使用自己最喜歡的人像"),
 "client-secret":cg("chapter-chengyian-client-secret.webp","溫時嶼核對拍攝同意範圍與未公開的私人內容"),
 "failed-pitch":cg("chapter-chengyian-failed-pitch.webp","溫時嶼在提案落選後整理團隊資源與接案方向"),
 "voice-rest":cg("chapter-tangtang-voice-rest.webp","楚星梨在休聲期間用手機和玩家討論生活與作品"),
 "listener-letter":cg("chapter-jiqing-listener-letter.webp","喬映澄在錄音室讀一封註明不要播出的聽眾信"),
 "rough-cut":cg("shenyao-rough-cut.webp","裴硯之在深夜剪輯室審視粗剪"),
 "unplugged":cg("tangtang-unplugged.webp","楚星梨在安可彩排後回看伴奏中斷的片段"),
 "rent-day":cg("sufei-rent-day.webp","許映真在房租日等待試鏡通知"),
 "last-bow":cg("guchengxi-last-bow.webp","周予珩在小型讀劇謝幕後回到後台"),
 "body-request":cg("linxiafan-body-request.webp","黎曼青檢查模糊的身材修改要求與替代方案"),
 "empty-studio":cg("jiqing-empty-studio.webp","喬映澄在節目改版空窗的錄音室與玩家碰面"),
 "ordinary-night":cg("hanzhiyuan-ordinary-night.webp","秦紹謙度過沒有工作訊息的夜晚"),
 "small-project":cg("chapter-hanzhiyuan-small-project.webp","秦紹謙為新人小型演出整理投入與排練條件"),
 "wrong-model":cg("chapter-hanzhiyuan-wrong-model.webp","秦紹謙檢查密集通告安排失準後的實際負擔"),
 "next-monitor":cg("xiayutong-ordinary-dawn.webp","宋知夏在下一次綜藝試錄檢查規則與參與方式"),
 "own-column":cg("chengyian-sunset-frame.webp","溫時嶼與玩家討論不帶拍攝任務的休假時間"),
 "lujingran-chat":cg("lujingran-shared-headphones.webp","江敘白把耳機分給玩家一邊"),
 "band-reply":cg("lujingran-shared-headphones.webp","江敘白與玩家整理舊團員回信與共編署名"),
 "silver-route-festival":cg("silver-pc-film-festival.webp","沈霧棠與玩家為影展影像合作整理不同人生的分鏡"),
 "silver-route-archive":cg("silver-pc-archive-room.webp","沈霧棠在剪輯室與玩家檢查來源不明的九秒影像"),
 "silver-pc-last-train":cg("silver-pc-last-train.webp","沈霧棠在末班車上再次認出玩家")
});

const NPC_ROUTE_ART=Object.freeze({
 shenyao:cg("route-shenyao-shared-umbrella.webp","裴硯之在雨中把傘偏向玩家"),
 tangtang:cg("route-tangtang-secret-date.webp","楚星梨與玩家的深夜秘密約會"),
 hanzhiyuan:cg("route-hanzhiyuan-hospital-vigil.webp","秦紹謙在病床旁守候到天亮"),
 jiqing:cg("route-jiqing-studio-argument.webp","喬映澄在直播後的錄音室轉身離開"),
 lujingran:cg("route-lujingran-rooftop-confession.webp","江敘白在天台以一副耳機說出心意"),
 silver_pc:cg("route-silver-last-train-farewell.webp","銀髮旅人在末班車門前伸出手"),
 chengyian:cg("route-chengyian-premiere-reunion.webp","溫時嶼在首映夜越過人群迎向玩家"),
 guchengxi:cg("route-guchengxi-stage-flower.webp","周予珩在謝幕後把唯一一朵花遞給玩家"),
 linxiafan:cg("route-linxiafan-collar.webp","黎曼青在深夜工作室替玩家整理衣領"),
 sufei:cg("route-sufei-stage-hand.webp","許映真在空舞臺向玩家伸出手"),
 xiayutong:cg("route-xiayutong-wrap-drink.webp","宋知夏在收工清晨與玩家分享一杯飲料")
});

const MILESTONE_RULES=Object.freeze([
 [/flagship-choice:|旗艦作品|第三份答案/,cg("milestone-flagship-signature.webp","玩家在旗艦作品的關鍵現場提出第三份答案")],
 [/npc-romance-.*:committed:|求婚|走向下一步/,cg("milestone-romance-proposal.webp","重要的人在城市夜色中向玩家求婚")],
 [/npc-romance-.*:engaged:|結婚|婚禮/,cg("milestone-romance-wedding.webp","玩家在私人婚禮交換戒指")],
 [/分手|分開|broken|breakup/,cg("milestone-romance-breakup.webp","兩人在雨夜離開彼此的生活")],
 [/續約|renewal|renew-/,cg("milestone-contract-renewal.webp","玩家與長期夥伴簽下續約")],
 [/完整人生|integrated|作品、關係與制度/,cg("milestone-five-year-integrated.webp","五年後玩家讓作品、關係與制度成為同一份答案")],
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

// Pixel scenes may offer a full-size illustration, but must never substitute a
// generic dressing room for an NPC-specific scene that has no authored CG.
export function authoredEventArt(event, outcome = {}) {
 const exact = Object.entries(EXACT_EVENT_ART).find(([id]) => String(event?.id || "").includes(id));
 if (exact) return exact[1];
 if (/^npc-romance-/.test(event?.id || "") && ["yes", "build-together", "private-vow"].includes(outcome.choice)) {
  if (event.id.includes(":romance:engaged:")) return cg("milestone-romance-wedding.webp", "把承諾變成生活");
  if (event.id.includes(":romance:committed:")) return cg("milestone-romance-proposal.webp", "關於更遠的以後");
 }
 return null;
}

export const STORY_ART_ASSETS=Object.freeze([
 ...Object.values(SCENE_ART),...Object.values(EXACT_EVENT_ART),...Object.values(NPC_ROUTE_ART),
 ...MILESTONE_RULES.map(([,art])=>art)
]);

const MILESTONE_GALLERY_ITEMS=Object.freeze([
 ["milestone:proposal","關於更遠的以後",cg("milestone-romance-proposal.webp","重要的人在城市夜色中向玩家求婚")],
 ["milestone:wedding","把承諾變成生活",cg("milestone-romance-wedding.webp","玩家在私人婚禮交換戒指")],
 ["milestone:breakup","雨夜留下的距離",cg("milestone-romance-breakup.webp","兩人在雨夜離開彼此的生活")],
 ["milestone:renewal","下一份共同合約",cg("milestone-contract-renewal.webp","玩家與長期夥伴簽下續約")],
 ["milestone:integrated","完整人生",cg("milestone-five-year-integrated.webp","五年後玩家讓作品、關係與制度成為同一份答案")],
 ["milestone:flagship","第三份答案",cg("milestone-flagship-signature.webp","玩家在旗艦作品的關鍵現場提出第三份答案")],
 ["milestone:award","第一次舉起獎座",cg("milestone-first-award.webp","玩家第一次在頒獎臺舉起獎座")],
 ["milestone:scandal","被閃光燈包圍",cg("milestone-scandal-press.webp","輿論危機中蜂擁而至的媒體")],
 ["milestone:overwork","身體按下暫停",cg("milestone-overwork-collapse.webp","玩家因過勞倒在後台")],
 ["milestone:red-carpet","第一次走上紅毯",cg("milestone-first-red-carpet.webp","玩家第一次踏上聚光燈下的紅毯")],
 ["milestone:fan","第一個認出你的人",cg("milestone-first-fan.webp","玩家第一次在街頭被粉絲認出")],
 ["milestone:contract","第一份演藝合約",cg("milestone-first-contract.webp","玩家簽下第一份演藝合約")],
 ["milestone:audition","站進正式試鏡室",cg("milestone-first-audition.webp","玩家第一次站進正式試鏡室")],
 ["milestone:shoot","第一顆正式鏡頭",cg("milestone-first-shoot.webp","玩家第一次站上正式拍攝現場")]
].map(([id,title,art])=>Object.freeze({id,kind:"milestone",title,art})));

export const CG_GALLERY_ITEMS=Object.freeze([
 ...Object.entries(EXACT_EVENT_ART).map(([id,art])=>Object.freeze({id,kind:"chapter",title:art.alt,art})),
 ...Object.entries(NPC_ROUTE_ART).map(([id,art])=>Object.freeze({id:`route:${id}`,kind:"route",title:art.alt,art})),
 ...MILESTONE_GALLERY_ITEMS
]);
