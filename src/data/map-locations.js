// 自由活動地點。category 用於地圖篩選；gain/encounter 由探索結算共用。
export const MAP_LOCATIONS={
 radio:{name:"星望廣播電臺",area:"傳媒區",category:"演藝",icon:"聲",note:"節目錄音、主持與業界人士出入的地方。",effect:"口才／社交・可能遇見紀晴",gain:["口才",3,6],encounter:"jiqing"},
 livehouse:{name:"月蝕 Live House",area:"舊城區",category:"演藝",icon:"樂",note:"地下歌手與新人樂團聚集的小型展演空間。",effect:"歌藝／靈感・可能遇見陸景然",gain:["靈感",4,8],bonus:["歌藝",2,4],encounter:"lujingran"},
 cinema:{name:"星輝電影院",area:"文化街區",category:"靈感",icon:"戲",note:"獨立電影與院線片都會上映的老戲院。",effect:"靈感／演技・可能遇見沈曜",gain:["靈感",3,7],bonus:["演技",1,3],encounter:"shenyao"},
 studio:{name:"十七號攝影棚",area:"影視園區",category:"演藝",icon:"影",note:"廣告、戲劇與綜藝經常在此錄製。",effect:"鏡頭感／社交・可能遇見夏語彤",gain:["鏡頭感",3,6],bonus:["社交",1,3],encounter:"xiayutong"},
 recording:{name:"迴聲錄音室",area:"音樂園區",category:"演藝",icon:"錄",note:"專輯、配唱與廣告歌曲的專業錄音空間。",effect:"歌藝／聲線・可能遇見唐棠",gain:["聲線",3,7],bonus:["歌藝",2,4],encounter:"tangtang"},
 rehearsal:{name:"映畫排練室",area:"影視園區",category:"演藝",icon:"排",note:"演員與舞者租用的排練空間，牆上貼滿試鏡通知。",effect:"演技／肢體表現・可能遇見蘇霏",gain:["演技",4,7],bonus:["肢體表現",2,4],encounter:"sufei"},
 theatre:{name:"星河小劇場",area:"劇場街區",category:"演藝",icon:"劇",note:"舞臺劇與演員工作坊輪番登場，後臺總有意外的交流。",effect:"演技／口才・可能遇見顧承熙",gain:["演技",3,7],bonus:["口才",1,3],encounter:"guchengxi"},
 gallery:{name:"白牆藝廊",area:"藝文街區",category:"靈感",icon:"藝",note:"攝影展與品牌企劃常在此舉行。",effect:"鏡頭感／時尚・可能遇見程以安",gain:["時尚",3,6],bonus:["鏡頭感",1,3],encounter:"chengyian"},
 shop:{name:"星光購物商場",area:"購物特區",category:"生活",icon:"購",note:"當季服飾與美妝品牌聚集，逛過後可在衣櫃購買服裝。",effect:"時尚・解鎖本週服裝購買",gain:["時尚",3,7],encounter:"linxiafan"},
 business:{name:"星環商務中心",area:"商業區",category:"演藝",icon:"務",note:"經紀公司、品牌與製作公司密集的大樓群。",effect:"社交／口才・可能遇見韓知遠",gain:["社交",3,6],bonus:["口才",1,3],encounter:"hanzhiyuan"},
 park:{name:"星光河濱公園",area:"河岸區",category:"休閒",icon:"休",note:"適合散步、慢跑與放空的公共空間。",effect:"降低疲勞、提升心情",recover:{fatigue:9,mood:6}},
 cafe:{name:"晨星咖啡館",area:"文青街區",category:"生活",icon:"咖",note:"安靜的小店，常有人在角落讀劇本或改企劃。",effect:"學識／靈感",gain:["學識",3,6],bonus:["靈感",1,3]},
 library:{name:"星望市立圖書館",area:"學院區",category:"靈感",icon:"讀",note:"資料齊全，頂樓還收藏歷年影劇與音樂刊物。",effect:"學識／編劇",gain:["學識",4,8],bonus:["編劇",1,3]},
 gym:{name:"雲雀健身中心",area:"運動區",category:"訓練",icon:"健",note:"藝人與舞者常來維持體能的複合式健身房。",effect:"肢體表現／儀態，略增疲勞",gain:["肢體表現",3,7],bonus:["儀態",1,3],extraFatigue:4},
 dance:{name:"Pulse 舞蹈教室",area:"運動區",category:"訓練",icon:"舞",note:"落地窗後總有人練到深夜，偶爾開放旁聽。",effect:"舞蹈／肢體表現，略增疲勞",gain:["舞蹈",4,8],bonus:["肢體表現",2,4],extraFatigue:5},
 market:{name:"週末文創市集",area:"舊城區",category:"生活",icon:"集",note:"街頭表演、手作品牌與小吃攤讓人眼花撩亂。",effect:"社交／親和力",gain:["親和力",3,7],bonus:["社交",1,3]},
 temple:{name:"星望天后宮",area:"舊城區",category:"休閒",icon:"籤",note:"演出前來求籤的人不少，廟埕也常有地方活動。",effect:"心情／運氣線索",recover:{fatigue:4,mood:8},luck:4},
 beach:{name:"月灣海灘",area:"海灣區",category:"休閒",icon:"浪",note:"離市中心不遠，黃昏時能暫時忘記行程表。",effect:"降低疲勞、提升心情與靈感",recover:{fatigue:12,mood:9},gain:["靈感",2,5]},
 restaurant:{name:"夜光餐酒館",area:"夜生活區",category:"生活",icon:"夜",note:"慶功宴與業界聚會常選在這裡，價格也很有業界感。",effect:"社交／口才・額外花費 $600",gain:["社交",4,8],bonus:["口才",1,3],extraCost:600},
 beauty:{name:"晨光美容沙龍",area:"美妝特區",category:"生活",icon:"美",note:"專做造型與保養的美容沙龍，熟客多是圈內人。",effect:"外貌／儀態",gain:["外貌",3,6],bonus:["儀態",1,3]},
 clinic:{name:"星望整形外科",area:"醫療特區",category:"健康",icon:"醫",note:"提供造型諮詢、整形與性別肯認醫療。",effect:"外貌・解鎖本週整形／變性",gain:["外貌",2,5]},
 airport:{name:"星望國際機場",area:"對外門戶",category:"交通",icon:"機",note:"粉絲接送機與藝人出國工作都從這裡開始。",effect:"尚待外地發展系統開放",locked:true}
};

export const MAP_CATEGORIES=["全部","演藝","訓練","靈感","生活","休閒","健康"];
