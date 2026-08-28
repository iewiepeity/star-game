export const NPC_RELATION_EDGES=[
 {a:"jiqing",b:"guchengxi",type:"friend",label:"多年好友",strength:72,note:"訪談合作多年，私下也會交換業界消息。"},
 {a:"jiqing",b:"tangtang",type:"mentor",label:"照顧後輩",strength:58,note:"喬映澄很會替楚星梨擋掉不必要的尖銳提問。"},
 {a:"shenyao",b:"guchengxi",type:"collaborator",label:"長期合作",strength:78,note:"彼此對作品要求很高，合作時幾乎不用多說。"},
 {a:"shenyao",b:"xiayutong",type:"rival",label:"理念競爭",strength:52,note:"兩人在影像美學與演員調度上常有不同主張。"},
 {a:"tangtang",b:"lujingran",type:"rival",label:"音樂圈競爭",strength:46,note:"路線不同，但榜單與獎季難免被放在一起比較。"},
 {a:"tangtang",b:"linxiafan",type:"collaborator",label:"造型合作",strength:64,note:"黎曼青替她做過幾次重要舞臺造型。"},
 {a:"guchengxi",b:"sufei",type:"friend",label:"劇場舊識",strength:66,note:"兩人都從表演訓練體系出身，對劇組倫理很有共識。"},
 {a:"linxiafan",b:"chengyian",type:"collaborator",label:"品牌夥伴",strength:70,note:"時尚與商業企劃常互相借力。"},
 {a:"lujingran",b:"hanzhiyuan",type:"tense",label:"商業理念不合",strength:38,note:"江敘白不喜歡把音樂完全商品化，雙方合作時容易拉扯。"},
 {a:"chengyian",b:"hanzhiyuan",type:"ally",label:"商務合作",strength:74,note:"兩人熟悉品牌資源與市場操作，互相介紹過不少案子。"}
];

export const NPC_CAREER_PROFILES={
 jiqing:{field:"主持",specialties:["綜藝","廣告"],level:3,momentum:62},
 shenyao:{field:"導演",specialties:["電影","電視劇"],level:4,momentum:70},
 tangtang:{field:"歌手",specialties:["歌曲","綜藝","廣告"],level:3,momentum:76},
 guchengxi:{field:"演員",specialties:["電影","電視劇","廣告"],level:4,momentum:74},
 linxiafan:{field:"時尚",specialties:["廣告","綜藝"],level:4,momentum:66},
 lujingran:{field:"歌手",specialties:["歌曲","綜藝"],level:3,momentum:61},
 xiayutong:{field:"導演",specialties:["電影","電視劇","廣告"],level:3,momentum:64},
 sufei:{field:"演員",specialties:["電視劇","電影","綜藝"],level:3,momentum:59},
 chengyian:{field:"企劃",specialties:["廣告","綜藝"],level:4,momentum:72},
 hanzhiyuan:{field:"製作",specialties:["廣告","綜藝","歌曲"],level:4,momentum:69}
};

export const NPC_INTERACTIONS={
 chat:{label:"聊近況",closeness:4,trust:2,affection:1,fatigue:0},
 meal:{label:"約吃飯",closeness:7,trust:4,affection:2,cost:700,fatigue:1},
 support:{label:"替對方工作應援",closeness:4,trust:7,affection:1,cost:300,fatigue:1},
 collaborate:{label:"聊工作與合作",closeness:3,trust:5,affection:0,minStage:"familiar",fame:1},
 personal:{label:"關心對方",closeness:4,trust:6,affection:4,minStage:"friend",fatigue:1},
 date:{label:"單獨約會",closeness:6,trust:4,affection:7,minRomance:"dating",cost:1200,fatigue:1},
 reconcile:{label:"嘗試和解",closeness:0,trust:0,affection:0,minHostility:20,fatigue:1}
};
