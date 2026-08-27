// 玩家立繪與衣櫃資料。四種外型與五套服裝都有完整對應圖，不以性別限制選擇。
export const AVATARS={
 raven:{id:"raven",name:"夜櫻系",tagline:"柔和沉穩，安靜裡帶著不服輸的韌性",genderHint:"女性立繪"},
 sunny:{id:"sunny",name:"暖杏系",tagline:"明亮親切，很容易讓人記住笑容",genderHint:"女性立繪"},
 noir:{id:"noir",name:"夜墨系",tagline:"冷靜俐落，天生適合站在鏡頭前",genderHint:"男性立繪"},
 sage:{id:"sage",name:"春茶系",tagline:"溫柔清爽，有毫不費力的親和感",genderHint:"男性立繪"}
};

export const AVATAR_LIST=Object.values(AVATARS);

export const OUTFITS={
 newcomer:{id:"newcomer",name:"新人私服",price:0,note:"乾淨耐看的日常搭配，適合初次見面。",bonuses:{親和力:6,時尚:4}},
 practice:{id:"practice",name:"練習服",price:1200,note:"活動方便，排練與肢體表現更穩定。",bonuses:{舞蹈:8,肢體表現:5}},
 audition:{id:"audition",name:"試鏡造型",price:2200,note:"俐落又不搶戲，讓評審更容易看見你的可塑性。",bonuses:{鏡頭感:6,口才:5}},
 stage:{id:"stage",name:"舞台造型",price:3500,note:"為燈光與鏡頭設計，登場時更有存在感。",bonuses:{鏡頭感:8,時尚:8}},
 gala:{id:"gala",name:"典禮禮服",price:5200,note:"正式場合的壓軸造型，讓舉止與氣場更受矚目。",bonuses:{氣質:8,儀態:6}}
};

export const OUTFIT_LIST=Object.values(OUTFITS);
export const portraitAsset=(avatarId,outfitId)=>`./assets/avatars/${AVATARS[avatarId]?avatarId:"raven"}-${OUTFITS[outfitId]?outfitId:"newcomer"}.webp`;
export const portraitThumbAsset=(avatarId,outfitId)=>`./assets/avatars/thumbs/${AVATARS[avatarId]?avatarId:"raven"}-${OUTFITS[outfitId]?outfitId:"newcomer"}.webp`;
export const outfitBonusText=outfit=>Object.entries(outfit.bonuses).map(([name,value])=>`${name}＋${value}`).join("・");
