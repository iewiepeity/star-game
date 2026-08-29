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
 "rough-cut":cg("shenyao-rough-cut.webp","裴硯之在深夜剪輯室審視粗剪"),
 "unplugged":cg("tangtang-unplugged.webp","楚星梨在無伴奏的舞臺安可"),
 "rent-day":cg("sufei-rent-day.webp","許映真在房租日等待試鏡通知"),
 "last-bow":cg("guchengxi-last-bow.webp","周予珩謝幕後回到後台"),
 "body-request":cg("linxiafan-body-request.webp","黎曼青拒絕不合理的修圖要求"),
 "empty-studio":cg("jiqing-empty-studio.webp","喬映澄獨自在停播後的錄音室"),
 "ordinary-night":cg("hanzhiyuan-ordinary-night.webp","秦紹謙度過沒有工作訊息的夜晚"),
 "next-monitor":cg("xiayutong-ordinary-dawn.webp","宋知夏在清晨監看下一部作品"),
 "own-column":cg("chengyian-sunset-frame.webp","溫時嶼把鏡頭轉向夕陽下的玩家"),
 "lujingran-chat":cg("lujingran-shared-headphones.webp","江敘白把耳機分給玩家一邊"),
 "band-reply":cg("lujingran-shared-headphones.webp","江敘白與玩家共聽沒有說完的旋律"),
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
 const npcId=npcIdFromEvent(event);
 if(npcId&&(text.includes("npc-romance-")||event.kind==="戀愛事件"||/分開|重逢|曖昧|心意|約會/.test(text)))return NPC_ROUTE_ART[npcId];
 if(text.includes("末班車")||text.includes("silver_pc"))return NPC_ROUTE_ART.silver_pc;
 if(text.includes("醫院")||text.includes("病床"))return NPC_ROUTE_ART.hanzhiyuan;
 if(text.includes("直播後")||text.includes("爭執")||text.includes("決裂"))return NPC_ROUTE_ART.jiqing;
 for(const[pattern,art]of MILESTONE_RULES)if(pattern.test(text))return art;
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
