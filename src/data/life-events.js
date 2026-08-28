// 跨行程情境事件：不是新增數值按鈕，而是讓既有訓練／工作／生活偶爾長出故事。
export const LIFE_EVENTS={
 train:[
  {id:"train_observer",title:"教室後排的陌生訪客",text:"今天課堂後排坐了一位沒見過的人。老師沒有介紹，只說照平常練。下課後你才聽見有人說，那是來看新人的製作人。",kind:"職涯事件",choices:[{id:"stay",label:"照自己的節奏完成",outcome:"你沒有為陌生目光打亂節奏。",effect:{hidden:"抗壓",value:2}},{id:"show",label:"刻意多做一點表現",outcome:"至少你確定對方有抬頭看你。",effect:{rep:"業界評價",value:2,fatigue:3}}]},
  {id:"train_bad_day",title:"今天就是不在狀態",text:"同一段內容卡了好幾次。老師沒有罵人，只問你要不要硬撐。",choices:[{id:"push",label:"再來一次",outcome:"最後一次終於比前面好。",effect:{hidden:"自律",value:2,fatigue:4}},{id:"stop",label:"承認今天需要休息",outcome:"你提早收工，至少沒有把自己練壞。",effect:{health:2,fatigue:-4}}]}
 ],
 job:[
  {id:"job_delay",title:"現場臨時大延誤",text:"器材出了問題，整組人只能乾等。有人開始抱怨，有人乾脆補眠。",choices:[{id:"network",label:"趁空檔和工作人員聊天",outcome:"你記住了幾張臉，也被幾張臉記住。",effect:{stat:"社交",value:2}},{id:"rest",label:"找角落補眠",outcome:"真正開工時，你至少還像個人。",effect:{fatigue:-3}}]},
  {id:"job_praise",title:"導演多看了一眼",text:"收工前，導演忽然把你叫住，問你下一個檔期到什麼時候。",kind:"職涯事件",effect:{rep:"業界評價",value:3}}
 ],
 life:[
  {id:"daily_recognized",title:"好像有人認出你了",text:"便利商店排隊時，後面的人小聲問朋友：「那是不是最近那個……？」",kind:"輿論事件",requires:{fameMin:10},choices:[{id:"smile",label:"回頭笑一下",outcome:"對方瞬間手忙腳亂地拿出手機。",effect:{fans:6,rep:"路人緣",value:2}},{id:"quiet",label:"假裝沒聽見",outcome:"今天只是想普通地買個晚餐。",effect:{mood:2}}]}
 ]
};
