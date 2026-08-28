const c=(id,label,outcome,effect)=>({id,label,outcome,effect});
const arc=(id,stage,title,text,a,b)=>({id,stage,title,text,choices:[a,b]});

export const NPC_ARCS={
 jiqing:[
  arc("unasked-question","familiar","那個沒有問出口的問題","喬映澄拿著一份會帶來高收視的訪綱，卻對其中幾個追問遲遲沒有畫線。她問你，主持人應該追到真相，還是替來賓留下不回答的權利？",c("boundary","留下不回答的空間","她把最尖銳的那題刪掉，節目仍然成立。",{relation:4,trust:7}),c("truth","先確認來賓願意談到哪裡","你們一起重寫提問，讓真相與界線不必互相犧牲。",{relation:5,trust:6})),
  arc("live-accident","confidant","直播事故留下的聲音","她終於把那段一直不肯重播的錄音交給你。多年前的直播事故不是她忘詞，而是她為保護來賓擅自切斷訊號。",c("understand","告訴她那不是失控","她第一次允許自己不把那天稱作失敗。",{relation:5,trust:9,affection:3}),c("listen","陪她把整段錄音聽完","你沒有替她定義，只在錄音結束後仍留在旁邊。",{relation:6,trust:8,affection:4})),
  arc("own-program","bonded","以她真正相信的方式主持","喬映澄收到獨立製作節目的機會，代價是放棄熟悉的大台資源。她把第一版企劃交給你，封面沒有收視保證，只有她真正想問的問題。",c("support","支持她做自己的節目","她在企劃共同討論欄留下你的名字。",{relation:7,trust:8,affection:3}),c("plan","陪她把風險一項項算清楚","你沒有只說加油，而是讓她知道這條路可以被好好準備。",{relation:5,trust:10,affection:2}))
 ],
 shenyao:[
  arc("failed-film","familiar","他不願重看的作品","裴硯之帶你看一部幾乎沒有人提過的早期作品。放映結束後，他問的不是好不好看，而是哪一幕讓角色失去了說服力。",c("honest","指出真正斷掉的地方","他沉默很久，卻把你的答案寫進筆記。",{relation:3,trust:8}),c("question","反問他當時想保護什麼","他第一次從失敗之外重新談起那部電影。",{relation:5,trust:6})),
  arc("producer-pressure","confidant","不能只拍市場要的結局","投資方要求替新片換一個更安全的結局。裴硯之沒有發脾氣，只把兩個版本並排放在你面前。",c("character","守住角色真正的選擇","你們連夜整理出能說服投資方的版本。",{relation:5,trust:9,affection:2}),c("audience","尋找不背叛故事的折衷","他接受不是所有妥協都等於投降。",{relation:4,trust:8,affection:2})),
  arc("new-frame","bonded","下一部片的第一格","他的新分鏡裡沒有角色姓名，第一格卻是你曾經描述過的清晨。裴硯之問你，願不願意陪這個故事走到開拍。",c("join","接下這段漫長的同行","他把空白的角色欄交給你填。",{relation:7,trust:9,affection:4}),c("behind","留在鏡頭後一起發展故事","你們決定重要的不一定是站在哪一側。",{relation:6,trust:10,affection:3}))
 ],
 tangtang:[
  arc("quiet-stage","familiar","尖叫聲裡的安靜","楚星梨問你，舞台上萬人一起喊名字的時候，為什麼她反而會覺得四周很安靜。",c("normal","告訴她不必一直快樂","她終於承認偶像也會被掌聲壓得喘不過氣。",{relation:5,trust:7,affection:2}),c("ritual","一起設計下台後的安定儀式","從那天起，她每次收工都會傳一個只有你看得懂的符號。",{relation:6,trust:6,affection:3})),
  arc("voice-choice","confidant","不是市場預測的聲音","公司希望她延續安全的熱門曲風，她卻藏了一首完全不同的 Demo。那首歌不完美，卻比任何成品都更像她。",c("demo","支持她把 Demo 做完","她決定至少讓這首歌擁有被聽見的機會。",{relation:5,trust:9,affection:3}),c("strategy","替她規劃能被接受的發表方式","堅持沒有被稀釋，反而多了一條走出去的路。",{relation:4,trust:10,affection:2})),
  arc("own-encore","bonded","安可之後仍然是她","巡演最後一場結束，她沒有立刻回休息室，而是坐在空舞台邊問你：如果有一天沒有燈，她還剩下什麼？",c("person","她首先是楚星梨","這個答案沒有華麗，卻讓她靠在你身旁很久。",{relation:7,trust:9,affection:5}),c("music","還有她真正喜歡的音樂","你陪她在空場唱了一首沒有編舞的歌。",{relation:6,trust:8,affection:4}))
 ],
 guchengxi:[
  arc("forgotten-line","familiar","忘詞救回的一場戲","周予珩告訴你，他曾在重要演出裡完全忘詞。真正救回那場戲的不是技巧，而是搭檔沒有移開的眼神。",c("partner","談談信任對手演員","他笑說你比許多合作過的人更懂對戲。",{relation:5,trust:7}),c("fear","問他之後還會害怕嗎","他承認每次上台仍會，只是學會帶著害怕走出去。",{relation:4,trust:8})),
  arc("safe-role","confidant","不再安全的角色","團隊希望他繼續演擅長的形象，他卻收到一個可能讓觀眾討厭自己的角色。這次選擇不只關於演技，也關於失去。",c("risk","鼓勵他承擔角色的風險","他決定不再只交出正確的表演。",{relation:5,trust:9,affection:3}),c("read","陪他把劇本讀到天亮","你們找到角色值得被理解、卻不必被原諒的地方。",{relation:6,trust:8,affection:3})),
  arc("empty-stage","bonded","沒有觀眾的謝幕","劇場整修前最後一晚，周予珩帶你站上沒有觀眾的舞台。他說自己留下來，不只是因為掌聲。",c("stay","和他一起完成最後一次謝幕","台下空無一人，他卻向你正式鞠躬。",{relation:7,trust:9,affection:5}),c("future","問下一個舞台想去哪裡","他說，只要仍能和真正理解表演的人同行。",{relation:6,trust:10,affection:4}))
 ],
 linxiafan:[
  arc("wrong-success","familiar","最成功也最討厭的一場秀","黎曼青翻出那場讓她聲名大噪的秀。媒體稱讚每一個細節，她卻說自己直到現在仍不願看完整錄影。",c("why","問她當時放棄了什麼","她坦白那不是品味問題，而是讓一位年輕設計師失去署名。",{relation:4,trust:8}),c("repair","問現在還能做什麼","你們開始查那位設計師現在的消息。",{relation:5,trust:7})),
  arc("credit","confidant","把名字放回作品上","她找到當年的設計師，對方沒有立刻接受道歉。黎曼青第一次必須面對不是每個錯誤都能靠漂亮公關解決。",c("time","尊重對方需要時間","她決定先公開補回署名，不要求原諒。",{relation:5,trust:10,affection:2}),c("action","用後續合作補償資源","你提醒她補償不能再次變成施予。",{relation:4,trust:9,affection:2})),
  arc("own-label","bonded","不再替市場定義誰","黎曼青準備成立自己的企劃品牌。第一條原則不是風格，而是每個參與者都會被正確寫下名字。",c("witness","成為她第一個見證人","她把品牌草稿交給你保管，像交出一個重新開始的證明。",{relation:7,trust:10,affection:4}),c("collab","和她討論第一個企劃","這次她沒有替你決定形象，而是從你的答案開始畫。",{relation:6,trust:9,affection:4}))
 ],
 lujingran:[
  arc("old-band","familiar","那首歌原本有兩個名字","江敘白最受歡迎的歌其實寫給一位斷聯的舊團員。成功讓他被看見，也讓另一個人的名字消失。",c("credit","問他是否想補回署名","他第一次認真考慮重新聯絡對方。",{relation:4,trust:8}),c("memory","先聽完歌曲最初的版本","粗糙錄音裡有兩個年輕人還沒分開的聲音。",{relation:5,trust:7,affection:2})),
  arc("contract-line","confidant","合作不等於被控制","大型唱片公司再次提出合約。條件比以前自由，但江敘白仍在看到簽名欄時停住。",c("terms","陪他逐條畫出不能退讓的界線","他發現合作可以是清楚地說好彼此不能做什麼。",{relation:5,trust:10,affection:2}),c("choice","告訴他拒絕也不是失敗","決定權重新回到他手上後，他反而願意繼續談。",{relation:6,trust:8,affection:3})),
  arc("two-headphones","bonded","完成的旋律不再只屬於一個人","那段你第一次聽見的旋律終於完成。江敘白遞來兩副耳機，檔案資訊裡清楚寫著所有參與者的名字。",c("listen","從頭一起聽完","最後一個音消失後，他沒有避開你的目光。",{relation:7,trust:9,affection:5}),c("release","支持他把作品交給世界","他說這次不怕作品被聽見，因為沒有任何人被留在後面。",{relation:6,trust:10,affection:4}))
 ],
 xiayutong:[
  arc("wrong-cast","familiar","那次錯誤選角","宋知夏曾為了證明自己眼光，堅持使用不適合的演員。最後承擔代價的卻是整個劇組。",c("responsibility","問她後來如何負責","她沒有拿作品結果替自己辯解，而是說起逐一登門道歉的過程。",{relation:4,trust:8}),c("lesson","談選擇與固執的差別","她說現在終於會在最有把握時，再多問一個人的意見。",{relation:5,trust:7})),
  arc("cut-scene","confidant","最喜歡卻必須剪掉的畫面","新片時長超標，她必須在最喜歡的場景與故事完整性之間選擇。她把剪輯室鑰匙放到你手上。",c("story","讓整體故事先活下來","她親手刪除那段畫面，卻把原始檔好好保存。",{relation:5,trust:9,affection:2}),c("rewrite","尋找能保留核心的重剪方式","你們熬夜找到一個更短、更誠實的版本。",{relation:6,trust:8,affection:3})),
  arc("empty-monitor","bonded","鏡頭之外的答案","殺青後監看螢幕已經關閉，宋知夏仍問你，如果這五年是一部片，你會留下哪個畫面。",c("ordinary","選一個沒有鏡頭的平凡時刻","她笑了，說那也是她最想拍到的你。",{relation:7,trust:9,affection:5}),c("first","選你們第一次真正討論作品的時候","她說下一次，不必隔著監看螢幕。",{relation:6,trust:10,affection:4}))
 ],
 sufei:[
  arc("family-call","familiar","一直沒有撥出去的電話","許映真的家人以為她已經穩定拍戲。她每次接電話都把試鏡說成工作，把兼職說成休息。",c("truth","陪她把近況說清楚","電話那端沒有她想像中失望，只是沉默地問她有沒有好好吃飯。",{relation:5,trust:8}),c("ready","讓她先決定什麼時候說","你沒有替她按下通話鍵，但她知道不必再一個人演下去。",{relation:4,trust:7,affection:2})),
  arc("same-audition","confidant","同一份角色名單","你們同時收到重要角色的最終試鏡。許映真沒有假裝不在意，只說希望無論誰拿到，都不要用讓路交換友情。",c("fair","約好都使出全力","競爭第一次沒有讓你們站到彼此對面。",{relation:5,trust:10,affection:2}),c("practice","在試鏡前再陪彼此對一次戲","你們把最好的對手戲留給了同一間排練室。",{relation:7,trust:8,affection:3})),
  arc("shared-stage","bonded","不必假裝沒有比較過","多年後你們終於在同一部作品裡並肩。許映真坦白，她曾把你當成最害怕輸掉的人，也因此最清楚你走了多遠。",c("answer","告訴她你也曾經害怕","承認比較沒有破壞關係，反而讓信任變得完整。",{relation:7,trust:10,affection:4}),c("scene","用下一場對手戲回答","開拍後你們都沒有保留，把角色真正交到對方手上。",{relation:6,trust:9,affection:4}))
 ],
 chengyian:[
  arc("profitable-case","familiar","最賺錢也最不想署名的案子","溫時嶼做過一份極成功的品牌企劃，卻把藝人的脆弱包裝成消費話題。數字漂亮到沒有人追究代價。",c("person","問那位藝人後來怎麼了","他承認自己一直不敢查，也終於決定去面對。",{relation:4,trust:8}),c("line","談企劃不能跨過的界線","他把你的話寫在之後每份提案的第一頁。",{relation:5,trust:7})),
  arc("client-no","confidant","對最大客戶說不","重要品牌要求複製那套操作方式。拒絕可能失去年度最大案，接受則會重複他最不想承認的自己。",c("refuse","支持他正式拒絕","提案沒有成交，但團隊第一次知道原則不是簡報裝飾。",{relation:5,trust:10,affection:3}),c("rewrite","提出不消費傷口的新企劃","你們讓品牌看見真實不等於揭開所有私事。",{relation:6,trust:9,affection:3})),
  arc("name-not-object","bonded","備註欄裡的名字","新的合作表不再只有藝人定位與商業價值，每個名字旁都寫著本人真正想做的事。你的那一欄被他留到最後親自確認。",c("write","親手寫下自己的答案","溫時嶼沒有修改，只在旁邊加了一句：我會記得。",{relation:7,trust:10,affection:5}),c("together","問他自己的答案呢","他第一次把自己也放進不是工作目標的人生規劃。",{relation:6,trust:9,affection:5}))
 ],
 hanzhiyuan:[
  arc("only-selling","familiar","知道什麼會賣的恐懼","秦紹謙能在五分鐘內指出一個企劃為什麼會成功，卻花了一整晚回答自己到底喜不喜歡。",c("like","請他先說一件單純喜歡的事","答案與市場完全無關，他反而鬆了一口氣。",{relation:5,trust:7}),c("why","問他從什麼時候不再問喜歡","他第一次提起那個只談成績、不談作品的家庭。",{relation:4,trust:8})),
  arc("unsafe-project","confidant","不安全但值得的企劃","公司內部否決了一個沒有明星、沒有熱門題材的企劃。秦紹謙把預算表與故事放在你面前，問你願不願意和他一起承擔判斷錯誤。",c("story","先替故事找到非拍不可的理由","商業計算沒有消失，但它開始替作品服務。",{relation:5,trust:10,affection:3}),c("scale","把規模縮到能承擔的風險","你們沒有放棄，只是找到讓作品活下來的方式。",{relation:6,trust:9,affection:2})),
  arc("ten-pm","bonded","晚上十點以後","他真的把工作訊息停在十點以前。沒有會議、沒有進度表的晚上，秦紹謙一開始甚至不知道該怎麼坐著不做事。",c("stay","陪他慢慢習慣生活","安靜不再讓他焦慮，因為這裡有人願意一起留下。",{relation:7,trust:9,affection:5}),c("walk","拉他出去走走","他第一次沒有把散步換算成浪費的工時。",{relation:6,trust:10,affection:4}))
 ]
};

