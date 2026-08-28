// 固定年度節點。生日由玩家資料動態換算週次；獎項週次與 portfolio 的實際典禮週一致。
export const CALENDAR_EVENTS=[
 {id:"annual_goal",weekInYear:1,repeat:"yearly",title:"新的一年，新的星途",text:"新年度的第一週，行事曆忽然顯得格外空白。你決定替今年留下一個方向。",kind:"職涯事件",choices:[{id:"work",label:"今年想留下代表作",outcome:"你把作品放在第一順位。",effect:{flag:"年度目標：作品",mood:2}},{id:"people",label:"今年想經營人脈",outcome:"你提醒自己，娛樂圈從來不是一個人的舞台。",effect:{flag:"年度目標：人脈",mood:2}},{id:"health",label:"今年先學會活著下班",outcome:"很務實，但五年職涯最怕第二年就躺平在病床。",effect:{flag:"年度目標：健康",health:3}}]},
 {id:"birthday",dynamic:"birthday",repeat:"yearly",title:"生日這一天",text:"又長了一歲。手機通知、工作邀約與生活痕跡，讓今年的生日和去年有點不一樣。",kind:"人物事件",choices:[{id:"quiet",label:"留一點時間給自己",outcome:"你替自己留下一個安靜的晚上。",effect:{mood:8,fatigue:-6}},{id:"share",label:"在社群和大家分享",outcome:"祝福訊息一路跳到深夜。",effect:{fans:20,fame:2,mood:5}}]},
 {id:"music_award_week",weekInYear:20,repeat:"yearly",title:"星音年度音樂獎",text:"音樂圈一年一度的典禮週到了。入圍、得獎與紅毯討論同時洗滿娛樂版面。",kind:"職涯事件",requires:{completedCategory:"歌曲"},effect:{rep:"話題度",value:3}},
 {id:"screen_award_week",weekInYear:42,repeat:"yearly",title:"金幕／星河影視獎季",text:"電影與電視作品進入年度典禮週。曾經參與的作品，再一次被業界拿出來討論。",kind:"職涯事件",requires:{completedWorksMin:1},effect:{rep:"業界評價",value:3}},
 {id:"variety_award_week",weekInYear:46,repeat:"yearly",title:"金笑綜藝獎",text:"年度綜藝節目與主持表現開始結算，棚內外都在猜今年最大贏家。",kind:"職涯事件",requires:{completedCategory:"綜藝"},effect:{rep:"國民度",value:2}},
 {id:"brand_award_week",weekInYear:48,repeat:"yearly",title:"年度品牌影響力獎",text:"品牌方與廣告圈公布年度代表合作，商業價值也在這幾週被重新估價。",kind:"職涯事件",requires:{completedCategory:"廣告"},effect:{rep:"商業價值",value:3}},
 {id:"year_end",weekInYear:52,repeat:"yearly",title:"年末娛樂圈盤點",text:"年度榜單、熱搜與代表作盤點陸續公開。無論今年過得如何，你確實又在這個圈子裡走完了一年。",kind:"輿論事件",choices:[{id:"review",label:"回頭看看今年留下了什麼",outcome:"你把得失記下，準備帶進下一年。",effect:{mood:4}},{id:"forward",label:"不回頭，直接往明年走",outcome:"下一個舞台永遠比上一個更重要。",effect:{hidden:"野心",value:3}}]}
];
