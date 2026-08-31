const flags=s=>s.flags||[];
const hasFlag=(s,pattern)=>flags(s).some(x=>pattern.test(x.label||""))||(s.eventFlags||[]).some(x=>pattern.test(x));
const endings=s=>[...(s.endingHistory||[]).map(x=>x.endingId),s.endingResult?.endingId].filter(Boolean);
const works=s=>s.completedWorks||[];
const histories=s=>Object.values(s.relationships||{}).flatMap(r=>r.romanceHistory||[]);
const trait=(s,name)=>s.hidden?.[name]||0;
const rep=(s,name)=>s.rep?.[name]||0;
const a=(id,icon,category,title,description,target,value,hidden=false)=>Object.freeze({id,icon,category,title,description,target,value,hidden});
const ENDING_ACHIEVEMENTS=Object.freeze([
 ["death","燃盡的星光"],["storm_icon","風暴中心"],["whole_life","完整人生"],["legacy_builder","把門留在身後"],["people_first","散場後仍有人等你"],["masterpiece_vow","五年只為這一幕"],["creative_auteur","自己的名字就是片頭"],["award_collector","獎櫃真的放不下了"],["national_darling","國民記憶"],["commercial_king","品牌爭奪戰"],["soulmate","星光之外的重要的人"],["power_couple","並肩站上紅毯"],["multi_hyphenate","斜槓巨星"],["cult_artist","圈內人的圈內人"],["wealthy_exit","漂亮轉身"],["workhorse","片尾名單裡總有你"],["breakout","下一站，一線"],["steady","站穩腳步"],["unfinished","未完待續"]
].map(([id,title])=>a(`ending_${id}`,"幕","結局",title,`親自走到「${title}」結局。`,1,s=>endings(s).includes(id)?1:0,true)));

export const ACHIEVEMENTS=Object.freeze([
 a("first_week","☀","旅程","第一週，完成","完成第一週的七日行程。",1,s=>s.history?.length||0),
 a("training_beginner","✦","成長","練習生報到","累積完成 10 次訓練。",10,s=>s.trainingSessionsCompleted||0),
 a("first_audition","★","工作","站到鏡頭前","完成第一次正式通告試鏡。",1,s=>s.jobHistory?.filter(x=>x.type==="audition").length||0),
 a("first_work","🎬","工作","名字上字幕","完成第一部正式作品。",1,s=>works(s).length),
 a("works_five","▤","工作","作品開始說話","累積完成 5 部作品。",5,s=>works(s).length),
 a("first_award","♛","職涯","掌聲響起","獲得第一座獎項。",1,s=>s.awards?.length||0),
 a("fame_500","◇","職涯","街頭巷尾","知名度達到 500。",500,s=>s.fame||0),
 a("fans_100k","♡","職涯","十萬份心意","粉絲人數達到 100,000。",100000,s=>s.fans||0),
 a("first_original","✎","創作","自己的名字","正式發行第一部原創作品。",1,s=>s.creativeProjects?.filter(x=>x.status==="released").length||0),
 a("contacts_five","☎","人際","不再是空白通訊錄","認識 5 位 NPC。",5,s=>s.knownPeople?.length||0),
 a("first_partner","♥","人際","兩個人的秘密","與一位 NPC 正式交往。",1,s=>Object.values(s.relationships||{}).some(r=>["dating","committed","engaged","married"].includes(r.romance))?1:0),
 a("married","∞","人際","星途同行","與伴侶結婚。",1,s=>Object.values(s.relationships||{}).some(r=>r.romance==="married")?1:0,true),
 a("conflict","⚡","人際","不是每次相遇都美好","與一位 NPC 的關係進入交惡。",1,s=>Object.values(s.relationships||{}).some(r=>(r.hostility||0)>=45)?1:0),
 a("wealthy","$","生活","終於不用看存摺嘆氣","持有資金達到 $1,000,000。",1000000,s=>s.money||0),
 a("hospital","☁","生活","身體不是消耗品","曾因疲勞過高被迫住院。",1,s=>hasFlag(s,/疲勞住院/)?1:0,true),
 a("year_one","Ⅰ","旅程","在圈內活過一年","走完第一個完整年度。",52,s=>s.history?.length||0),
 a("five_year","Ⅴ","旅程","五年之約","抵達五年正式結局。",1,s=>s.endingResult?.trigger==="fiveyear"||s.endingHistory?.some(x=>x.week>260)?1:0),
 a("second_run","Ⅱ","多周目","似曾相識","開始第二周目。",2,s=>s.runCount||1),
 a("creator_first","▶","多周目","鏡頭也是舞台","在第二周目發布第一支自媒體內容。",1,s=>s.creatorVideos?.length||0),
 a("creator_rare","彩","多周目","演算法記住了你","製作第一支稀有以上的自媒體內容。",1,s=>s.creatorVideos?.some(v=>["rare","epic","legendary"].includes(v.rarity))?1:0,true),
 a("creator_viral","火","多周目","今晚全網都在看","讓一支自媒體內容爆紅。",1,s=>s.creatorVideos?.some(v=>v.viral)?1:0,true),
 a("third_run","Ⅲ","多周目","命運也有第三稿","開始第三周目。",3,s=>s.runCount||1,true),
 a("hidden_route","◐","多周目","沒有命定的重逢","走完沈霧棠的八章隱藏線。",1,s=>s.eventHistory?.some(x=>x.id==="silver-route-finale")?1:0,true),
 a("works_ten","▦","工作","履歷有了重量","累積完成 10 部作品。",10,s=>works(s).length),
 a("works_twenty","▥","工作","片尾總有你的名字","累積完成 20 部作品。",20,s=>works(s).length),
 a("flagship_first","◆","工作","進入主舞臺","完成第一份 A 級旗艦通告。",1,s=>works(s).filter(w=>/^J0(6[1-9]|7[0-5])$/.test(w.jobId||"")).length),
 a("flagship_five","✺","工作","旗艦常客","完成 5 份 A 級旗艦通告。",5,s=>works(s).filter(w=>/^J0(6[1-9]|7[0-5])$/.test(w.jobId||"")).length,true),
 a("quality_95","✧","工作","這一版會被留下","完成品質至少 95 的作品。",1,s=>works(s).some(w=>(w.quality||0)>=95)?1:0,true),
 a("first_sequel","↻","工作","觀眾還沒說再見","接受或談成第一份續作。",1,s=>hasFlag(s,/sequel-(accepted|negotiate)/)?1:0),
 a("first_agency","⌂","職涯","終於有人替你接電話","正式簽進第一間經紀公司。",1,s=>hasFlag(s,/正式簽約/)?1:0),
 a("renewal","⌁","職涯","下一階段，繼續同行","完成第一次經紀合約續約。",1,s=>s.agencyRenewalCount||0),
 a("all_categories","✣","職涯","分類表撕掉了","在歌曲、電影、電視劇、綜藝與廣告都留下作品。",5,s=>Object.values(s.careerProgress||{}).filter(v=>v>0).length,true),
 a("hidden_insight","◉","成長","看見鏡頭之外","隱藏特質「洞察」達到 650。",650,s=>trait(s,"洞察"),true),
 a("hidden_resilience","盾","成長","壓不垮的現場","隱藏特質「抗壓」達到 650。",650,s=>trait(s,"抗壓"),true),
 a("hidden_empathy","心","成長","先聽見別人的故事","隱藏特質「共情」達到 650。",650,s=>trait(s,"共情"),true),
 a("hidden_humor","笑","成長","把尷尬變成空氣","隱藏特質「幽默」達到 650。",650,s=>trait(s,"幽默"),true),
 a("hidden_courage","勇","成長","這次不退到安全線","隱藏特質「膽識」達到 650。",650,s=>trait(s,"膽識"),true),
 a("hidden_virtue","正","成長","沒有鏡頭也做同一選擇","隱藏特質「品德」達到 650。",650,s=>trait(s,"品德"),true),
 a("hidden_discipline","律","成長","天分也需要準時抵達","隱藏特質「自律」達到 650。",650,s=>trait(s,"自律"),true),
 a("hidden_ambition","焰","成長","不再假裝沒有野心","隱藏特質「野心」達到 650。",650,s=>trait(s,"野心"),true),
 a("hidden_all","八","成長","沒有寫在履歷上的實力","八項隱藏特質全部達到 600。",600,s=>Math.min(...["幽默","共情","洞察","膽識","品德","自律","野心","抗壓"].map(n=>trait(s,n))),true),
 a("industry_700","業","聲望","圈內指定合作","業界評價達到 700。",700,s=>rep(s,"業界評價")),
 a("commercial_700","商","聲望","名字本身就是行情","商業價值達到 700。",700,s=>rep(s,"商業價值")),
 a("national_700","國","聲望","成為國民記憶","國民度達到 700。",700,s=>rep(s,"國民度")),
 a("credibility_700","信","聲望","說出口就有人相信","可信度達到 700。",700,s=>rep(s,"可信度")),
 a("fashion_700","衣","聲望","城市開始學你穿衣服","時尚影響力達到 700。",700,s=>rep(s,"時尚影響力")),
 a("topic_700","熱","聲望","討論本身成為舞臺","話題度達到 700。",700,s=>rep(s,"話題度")),
 a("controversy_700","刺","聲望","不能被安全分類","爭議度達到 700。",700,s=>rep(s,"爭議度"),true),
 a("favor_700","緣","聲望","路人也願意替你停一下","路人緣達到 700。",700,s=>rep(s,"路人緣")),
 a("storm_center","!","聲望","風暴中心","高知名度下讓爭議度達到 650。",1,s=>rep(s,"爭議度")>=650&&(s.fame>=450||s.fans>=100000)?1:0,true),
 a("manager_bond","握","經紀人","不用把話說完","與經紀人達成信任 80、默契 65。",1,s=>(s.managerState?.trust||0)>=80&&(s.managerState?.rapport||0)>=65?1:0),
 a("manager_intervention","傘","經紀人","有人替你踩下煞車","高信任經紀人曾主動取消危險行程。",1,s=>s.managerInterventions?.length||0,true),
 a("manager_conservative","守","經紀人","先守住不能失去的","收到經紀人的穩健立場建議。",1,s=>s.managerAdviceHistory?.some(x=>x.type==="conservative")?1:0),
 a("manager_ambitious","進","經紀人","窗口只有這一次","收到經紀人的進取立場建議。",1,s=>s.managerAdviceHistory?.some(x=>x.type==="ambitious")?1:0),
 a("manager_crisis","止","經紀人","先把危機時間線排好","收到經紀人的危機立場建議。",1,s=>s.managerAdviceHistory?.some(x=>x.type==="crisis")?1:0),
 a("manager_renewal","續","經紀人","下一階段重新分工","收到經紀人的續約立場建議。",1,s=>s.managerAdviceHistory?.some(x=>x.type==="renewal")?1:0),
 a("doctrine_complete","路","方針","三次選擇，一條路","完成第三、第四、第五年的永久方針。",3,s=>Object.keys(s.careerDoctrine||{}).filter(k=>/^year[345]$/.test(k)).length),
 a("doctrine_echo","聲","方針","選擇真的會回來","看見 5 次永久方針帶來的世界回響。",5,s=>s.doctrineEventHistory?.length||0),
 a("public_love","閃","人際","全世界都知道了","公開一段正式戀情。",1,s=>hasFlag(s,/romance:public:/)?1:0),
 a("engaged","環","人際","把以後說得具體","與伴侶訂婚。",1,s=>Object.values(s.relationships||{}).some(r=>r.romance==="engaged")?1:0,true),
 a("breakup","裂","人際","不是所有故事都要在一起","親自結束一段正式關係。",1,s=>histories(s).some(x=>x.to==="broken")?1:0,true),
 a("reconcile","縫","人際","重新認識一次","分手後與同一人重新開始。",1,s=>Object.values(s.relationships||{}).some(r=>{const h=r.romanceHistory||[],i=h.findIndex(x=>x.to==="broken");return i>=0&&h.slice(i+1).some(x=>["dating","committed","engaged","married"].includes(x.to))})?1:0,true),
 a("flagship_signature","印","工作","第三份答案","在 A 級旗艦作品採用累積經歷解鎖的獨創版本。",1,s=>s.eventFlags?.some(x=>/^flagship:.*:signature$/.test(x))?1:0,true),
 a("original_five","稿","創作","市場開始等你的下一部","正式發行 5 部原創作品。",5,s=>s.creativeProjects?.filter(x=>x.status==="released").length||0),
 a("creative_master","冠","創作","年度代表作","完成第一部 S 級原創作品。",1,s=>s.creativeProjects?.some(x=>x.finalGrade?.grade==="S")?1:0,true),
 ...ENDING_ACHIEVEMENTS,
]);
export const ACHIEVEMENT_BY_ID=Object.fromEntries(ACHIEVEMENTS.map(x=>[x.id,x]));
export const ACHIEVEMENT_CATEGORIES=Object.freeze(["全部",...new Set(ACHIEVEMENTS.map(x=>x.category))]);
