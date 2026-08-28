// 玩家立繪與衣櫃資料。新增服裝可透過 assetKey 共用既有完整立繪素材，商品效果與持有狀態仍各自獨立。
export const AVATARS={
 raven:{id:"raven",name:"夜櫻系",tagline:"柔和沉穩，安靜裡帶著不服輸的韌性",gender:"女性"},
 sunny:{id:"sunny",name:"暖杏系",tagline:"明亮親切，很容易讓人記住笑容",gender:"女性"},
 noir:{id:"noir",name:"夜墨系",tagline:"冷靜俐落，天生適合站在鏡頭前",gender:"男性"},
 sage:{id:"sage",name:"春茶系",tagline:"溫柔清爽，有毫不費力的親和感",gender:"男性"}
};
export const AVATAR_LIST=Object.values(AVATARS);
const GENDER_LOCKED_AVATARS=["女性","男性"];
export const isAvatarLocked=(avatar,gender)=>GENDER_LOCKED_AVATARS.includes(gender)&&avatar.gender!==gender;
export const defaultAvatarForGender=gender=>AVATAR_LIST.find(a=>a.gender===gender)||AVATAR_LIST[0];
export const defaultOwnedOutfits=()=>Object.fromEntries(AVATAR_LIST.map(a=>[a.id,["newcomer"]]));
export const GENDER_CHANGE_COST=60000;
export const OUTFITS={
 newcomer:{id:"newcomer",name:"新人私服",price:0,note:"乾淨耐看的日常搭配，適合初次見面。",bonuses:{親和力:6,時尚:4}},
 practice:{id:"practice",name:"練習服",price:1200,note:"活動方便，排練與肢體表現更穩定。",bonuses:{舞蹈:8,肢體表現:5}},
 audition:{id:"audition",name:"試鏡造型",price:2200,note:"俐落又不搶戲，讓評審更容易看見你的可塑性。",bonuses:{鏡頭感:6,口才:5}},
 stage:{id:"stage",name:"舞台造型",price:3500,note:"為燈光與鏡頭設計，登場時更有存在感。",bonuses:{鏡頭感:8,時尚:8}},
 gala:{id:"gala",name:"典禮禮服",price:5200,note:"正式場合的壓軸造型，讓舉止與氣場更受矚目。",bonuses:{氣質:8,儀態:6}},
 casual:{id:"casual",assetKey:"newcomer",name:"週末休閒套裝",price:1600,note:"不刻意搶鏡的舒服搭配，適合生活節目與社群曝光。",bonuses:{親和力:8,社交:4}},
 street:{id:"street",assetKey:"practice",name:"街頭機能造型",price:2600,note:"活動度高又有辨識度，適合外景、舞蹈與街頭企劃。",bonuses:{肢體表現:7,時尚:6}},
 classic:{id:"classic",assetKey:"audition",name:"經典試鏡正裝",price:3200,note:"乾淨、專業、不搶角色，特別適合戲劇與主持試鏡。",bonuses:{鏡頭感:7,儀態:6}},
 vocal:{id:"vocal",assetKey:"practice",name:"錄音室舒適穿搭",price:2400,note:"長時間錄音也不妨礙呼吸與發聲，讓聲音工作更穩。",bonuses:{聲線:7,歌藝:5}},
 variety:{id:"variety",assetKey:"stage",name:"綜藝亮色套裝",price:3900,note:"鏡頭上有存在感但不會過度正式，適合棚內與外景綜藝。",bonuses:{主持:7,口才:6,親和力:4}},
 cinema:{id:"cinema",assetKey:"audition",name:"演員質感套裝",price:4200,note:"線條簡潔、情緒不被服裝吃掉，適合戲劇與電影場合。",bonuses:{演技:7,鏡頭感:6,氣質:3}},
 editorial:{id:"editorial",assetKey:"stage",name:"時尚編輯造型",price:5800,note:"輪廓強、辨識度高，適合品牌拍攝、看秀與雜誌企劃。",bonuses:{時尚:10,外貌:5}},
 premium:{id:"premium",assetKey:"gala",name:"精品活動禮服",price:8200,note:"高端品牌與紅毯場合的正式配置，商務活動更有說服力。",bonuses:{氣質:10,儀態:8,時尚:5}},
 host:{id:"host",assetKey:"gala",name:"典禮主持正裝",price:6800,note:"兼顧正式感與活動度，長時間直播主持也能維持穩定氣場。",bonuses:{主持:9,口才:6,儀態:5}},
 icon:{id:"icon",assetKey:"stage",name:"個人標誌造型",price:12000,note:"不是最安全的穿法，但如果撐得住，就很難被忘記。",bonuses:{時尚:12,鏡頭感:8,氣質:5}}
};
export const OUTFIT_LIST=Object.values(OUTFITS);
const assetOutfit=id=>OUTFITS[id]?.assetKey||id;
export const portraitAsset=(avatarId,outfitId)=>`./assets/avatars/${AVATARS[avatarId]?avatarId:"raven"}-${OUTFITS[outfitId]?assetOutfit(outfitId):"newcomer"}.webp`;
export const portraitThumbAsset=(avatarId,outfitId)=>`./assets/avatars/thumbs/${AVATARS[avatarId]?avatarId:"raven"}-${OUTFITS[outfitId]?assetOutfit(outfitId):"newcomer"}.webp`;
export const outfitBonusText=outfit=>Object.entries(outfit.bonuses).map(([name,value])=>`${name}＋${value}`).join("・");
