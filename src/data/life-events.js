// 跨行程情境事件：讓既有訓練／工作／生活行程偶爾長出故事。
export const LIFE_EVENTS={
 train:[
  {id:"train_observer",title:"教室後排的陌生訪客",text:"今天課堂後排坐了一位沒見過的人。老師沒有介紹，只說照平常練。下課後你才聽見有人說，那是來看新人的製作人。",kind:"職涯事件",choices:[{id:"stay",label:"照自己的節奏完成",outcome:"你沒有為陌生目光打亂節奏。",effect:{hidden:"抗壓",value:2}},{id:"show",label:"刻意多做一點表現",outcome:"至少你確定對方有抬頭看你。",effect:{rep:"業界評價",value:2,fatigue:3}}]},
  {id:"train_bad_day",title:"今天就是不在狀態",text:"同一段內容卡了好幾次。老師沒有罵人，只問你要不要硬撐。",choices:[{id:"push",label:"再來一次",outcome:"最後一次終於比前面好。",effect:{hidden:"自律",value:2,fatigue:4}},{id:"stop",label:"承認今天需要休息",outcome:"你提早收工，至少沒有把自己練壞。",effect:{health:2,fatigue:-4}}]},
  {id:"train_peer",title:"隔壁練習生進步得太快",text:"上週還會一起卡拍的人，今天忽然像換了一個人。你忍不住開始比較。",choices:[{id:"ask",label:"直接問他怎麼練的",outcome:"你拿到一套很實際的練習方法。",effects:[{stat:"學習",value:3},{hidden:"自律",value:1}]},{id:"compete",label:"今天一定要追上",outcome:"效果有，但明天大概會鐵腿。",effect:{stat:"肢體表現",value:3,fatigue:5}}]},
  {id:"train_teacher_note",title:"老師把你單獨留下",text:"課後老師沒有立刻走，只把你的練習影片重新播了一遍。",choices:[{id:"listen",label:"把批評全部聽完",outcome:"有些話很刺，但確實打中問題。",effects:[{rep:"業界評價",value:2},{hidden:"抗壓",value:2}]},{id:"question",label:"追問具體改善方法",outcome:"你拿到下一週可以執行的練法。",effect:{hidden:"自律",value:2}}]},
  {id:"train_injury_scare",title:"差一點扭到",text:"一個落地沒踩穩，腳踝瞬間傳來警訊。還好沒有真的受傷。",choices:[{id:"ice",label:"今天就到這裡",outcome:"你冰敷後提早離開。",effect:{health:3,fatigue:-2}},{id:"continue",label:"降低強度完成課程",outcome:"你沒有逞強，但也沒有完全停下。",effect:{hidden:"自律",value:1,health:-1}}]},
  {id:"train_recording",title:"練習片段意外被錄下",text:"助教說想留一段今天的練習做內部紀錄。你忽然比正式試鏡還緊張。",choices:[{id:"normal",label:"當作平常練習",outcome:"自然反而成了優點。",effect:{stat:"鏡頭感",value:2}},{id:"perfect",label:"要求再錄一次",outcome:"第二次更完整，但你也更累。",effect:{stat:"鏡頭感",value:3,fatigue:2}}]},
  {id:"train_old_clip",title:"看到三個月前的自己",text:"系統自動跳出舊練習影片。當時覺得已經很努力，現在看卻滿是破綻。",choices:[{id:"compare",label:"認真比較差異",outcome:"進步變得看得見。",effect:{mood:4,hidden:"自律",value:1}},{id:"delete",label:"拜託不要讓任何人看到",outcome:"黑歷史也是歷史。",effect:{mood:2}}]},
  {id:"train_invite",title:"臨時被叫去旁聽高階課",text:"有位學員請假，老師問你要不要補上那個位置。內容明顯比目前進度難。",kind:"職涯事件",choices:[{id:"join",label:"硬著頭皮上",outcome:"很吃力，但你第一次看見更高一層的要求。",effect:{rep:"業界評價",value:3,fatigue:4}},{id:"watch",label:"先旁聽觀察",outcome:"你記下不少高手才會注意的細節。",effect:{hidden:"洞察",value:2}}]}
 ],
 job:[
  {id:"job_delay",title:"現場臨時大延誤",text:"器材出了問題，整組人只能乾等。有人開始抱怨，有人乾脆補眠。",choices:[{id:"network",label:"趁空檔和工作人員聊天",outcome:"你記住了幾張臉，也被幾張臉記住。",effect:{stat:"社交",value:2}},{id:"rest",label:"找角落補眠",outcome:"真正開工時，你至少還像個人。",effect:{fatigue:-3}}]},
  {id:"job_praise",title:"導演多看了一眼",text:"收工前，導演忽然把你叫住，問你下一個檔期到什麼時候。",kind:"職涯事件",effect:{rep:"業界評價",value:3}},
  {id:"job_rewrite",title:"開拍前五分鐘改稿",text:"新的台詞剛送到手上，連標點都還帶著修訂痕跡。",choices:[{id:"memorize",label:"先把內容穩穩記住",outcome:"至少正式拍攝沒有卡詞。",effect:{hidden:"抗壓",value:2}},{id:"ask",label:"先確認導演真正要的情緒",outcome:"你沒有死背，而是抓到了修改原因。",effects:[{hidden:"洞察",value:2},{rep:"業界評價",value:1}]}]},
  {id:"job_coactor",title:"對手演員今天狀態很差",text:"連續幾次 NG 後，現場氣氛變得很僵。下一顆鏡頭是你們的對手戲。",choices:[{id:"support",label:"私下替對方穩一下",outcome:"下一次終於順利完成。",effect:{hidden:"共情",value:2}},{id:"focus",label:"先顧好自己的部分",outcome:"至少你沒有被現場情緒拖走。",effect:{hidden:"抗壓",value:2}}]},
  {id:"job_staff",title:"工作人員記得你的名字",text:"今天一到現場，燈光師遠遠就喊了你的名字。你才發現自己已經不是完全的陌生新人。",kind:"職涯事件",effect:{rep:"業界評價",value:2,mood:3}},
  {id:"job_extra_take",title:"導演想多拍一版",text:"原定內容已經過了，但導演說還有時間，想試一個完全不同的版本。",choices:[{id:"try",label:"當然試",outcome:"這一版最後真的被留下。",effect:{rep:"業界評價",value:3,fatigue:2}},{id:"safe",label:"維持已經成功的版本",outcome:"沒有驚喜，但也沒有把成果玩壞。",effect:{hidden:"自律",value:1}}]},
  {id:"job_interview",title:"收工突然多了一個短訪",text:"宣傳組臨時問你能不能補錄兩分鐘幕後訪談。沒有題綱。",choices:[{id:"accept",label:"直接上",outcome:"一段自然的回答被剪進宣傳花絮。",effects:[{stat:"口才",value:2},{rep:"話題度",value:2}]},{id:"prepare",label:"先要三分鐘整理一下",outcome:"回答比較完整，也沒有說錯話。",effect:{rep:"可信度",value:2}}]},
  {id:"job_wrap_gift",title:"殺青前的小禮物",text:"劇組有人悄悄傳了一張卡片，上面簽滿這段時間一起工作的人。",kind:"人物事件",choices:[{id:"keep",label:"好好收起來",outcome:"你忽然覺得這份工作真的結束了。",effect:{mood:6}},{id:"post",label:"拍一角放上社群",outcome:"沒有洩漏內容，只留下了一點告別氣氛。",effect:{fans:8,rep:"話題度",value:1,mood:4}}]}
 ],
 life:[
  {id:"daily_recognized",title:"好像有人認出你了",text:"便利商店排隊時，後面的人小聲問朋友：「那是不是最近那個……？」",kind:"輿論事件",requires:{fameMin:10},choices:[{id:"smile",label:"回頭笑一下",outcome:"對方瞬間手忙腳亂地拿出手機。",effect:{fans:6,rep:"路人緣",value:2}},{id:"quiet",label:"假裝沒聽見",outcome:"今天只是想普通地買個晚餐。",effect:{mood:2}}]},
  {id:"daily_old_friend",title:"很久沒聯絡的人傳訊息",text:"對方只問了一句：「最近是不是很忙？」你盯著訊息看了很久。",choices:[{id:"reply",label:"好好回一段",outcome:"聊完才發現自己真的很久沒講工作以外的事。",effect:{mood:5,fatigue:-2}},{id:"later",label:"先標記未讀",outcome:"你告訴自己晚點回。至於晚點是哪一天，就不知道了。",effect:{mood:-1}}]},
  {id:"daily_rain",title:"突然下了一場大雨",text:"你沒帶傘，只能和一群陌生人擠在屋簷下等雨變小。",choices:[{id:"wait",label:"慢慢等",outcome:"難得什麼都不用做。",effect:{fatigue:-3,mood:3}},{id:"run",label:"直接衝回去",outcome:"衣服濕透，但莫名很痛快。",effect:{mood:4,health:-1}}]},
  {id:"daily_comment",title:"一則留言讓你停下來",text:"不是稱讚外表，也不是問八卦。對方說，某次你的表演讓他撐過很難熬的一天。",kind:"輿論事件",requires:{fansMin:100},choices:[{id:"save",label:"默默收藏",outcome:"你沒有回覆，但把這句話存了下來。",effect:{mood:7,rep:"可信度",value:2}},{id:"reply",label:"簡單回一句謝謝",outcome:"那則留言很快被更多人按讚。",effect:{fans:10,rep:"路人緣",value:2}}]},
  {id:"daily_gossip",title:"隔壁桌在聊圈內八卦",text:"內容一半是真的、一半錯得離譜，而他們完全不知道你就在旁邊。",choices:[{id:"listen",label:"安靜聽完",outcome:"民間版本永遠比官方精彩。",effect:{hidden:"洞察",value:2}},{id:"leave",label:"不要荼毒自己",outcome:"至少今天不用知道自己被傳成什麼樣。",effect:{mood:2}}]},
  {id:"daily_street_photo",title:"被路人拍到了",text:"有人把你剛買完宵夜的照片傳上網。沒有濾鏡，也沒有造型團隊。",kind:"輿論事件",requires:{fameMin:40},choices:[{id:"laugh",label:"自己也去按讚",outcome:"路人反而覺得你很真實。",effect:{rep:"路人緣",value:3,rep2:"話題度"}},{id:"ignore",label:"完全不處理",outcome:"半天後話題自己沉下去。",effect:{mood:1}}]},
  {id:"daily_invitation",title:"突然收到一張活動邀請函",text:"不是正式工作，只是一場圈內小型聚會。去不去都不會有人怪你。",kind:"職涯事件",requires:{fameMin:60},choices:[{id:"go",label:"露個臉",outcome:"你交換了幾張名片，也聽見一些還沒公開的企劃。",effects:[{stat:"社交",value:2},{rep:"業界評價",value:2},{fatigue:2}]},{id:"home",label:"今晚留給自己",outcome:"錯過一點人脈，換到一點安靜。",effect:{mood:4,fatigue:-3}}]},
  {id:"daily_break",title:"手機突然沒電",text:"行動電源也忘了帶。你被迫和通知、數據、熱搜斷線兩個小時。",choices:[{id:"enjoy",label:"那就算了",outcome:"世界沒有因為你兩小時沒上線而毀滅。",effect:{fatigue:-4,mood:5}},{id:"borrow",label:"到處借充電器",outcome:"最後是借到了，但休息感也沒了。",effect:{stat:"社交",value:1}}]}
 ]
};
