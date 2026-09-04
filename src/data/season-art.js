import{SCENE_ART}from"./story-art.js";
export const YEAR_TRANSITIONS=Object.freeze({
 52:{year:1,title:"第一年・名字開始被記住",text:"你不再只是履歷表上的新人；做過的選擇，已經開始決定別人如何向下一個人介紹你。",art:SCENE_ART.audition},
 104:{year:2,title:"第二年・機會開始有代價",text:"工作變多以後，真正稀缺的不再只是曝光，而是時間、健康與仍願意相信的人。",art:SCENE_ART.studio},
 156:{year:3,title:"第三年・作品離開現場",text:"角色、歌曲與節目進入市場；你必須學會面對作品不再只屬於創作者。",art:SCENE_ART.cinema},
 208:{year:4,title:"第四年・位置成為責任",text:"你已經能影響團隊與後來的新人。如何使用這個位置，也會成為作品的一部分。",art:SCENE_ART.press},
 260:{year:5,title:"第五年・留下自己的版本",text:"最後一年不是衝刺成唯一答案，而是確認這條路上哪些東西值得被帶到結局。",art:SCENE_ART.awards}
});
export const yearTransitionForWeek=week=>YEAR_TRANSITIONS[week]||null;
const ENDING_CG=Object.freeze({
 death:{src:"./assets/cg/milestone-ending-death.webp",alt:"燃盡的星光",position:"center"},
 storm_icon:{src:"./assets/cg/milestone-ending-storm_icon.webp",alt:"風暴中心",position:"center"},
 legacy_builder:{src:"./assets/cg/milestone-ending-legacy_builder.webp",alt:"把門留在身後",position:"center"},
 people_first:{src:"./assets/cg/milestone-ending-people_first.webp",alt:"散場後仍有人等你",position:"center"},
 masterpiece_vow:{src:"./assets/cg/milestone-ending-masterpiece_vow.webp",alt:"五年只為這一幕",position:"center"},
 creative_auteur:{src:"./assets/cg/milestone-ending-creative_auteur.webp",alt:"自己的名字就是片頭",position:"center"},
 award_collector:{src:"./assets/cg/milestone-ending-award_collector.webp",alt:"獎櫃放不下的人",position:"center"},
 national_darling:{src:"./assets/cg/milestone-ending-national_darling.webp",alt:"國民記憶",position:"center"},
 commercial_king:{src:"./assets/cg/milestone-ending-commercial_king.webp",alt:"品牌爭奪戰",position:"center"},
 soulmate:{src:"./assets/cg/milestone-ending-soulmate.webp",alt:"星光之外的重要的人",position:"center"},
 power_couple:{src:"./assets/cg/milestone-ending-power_couple.webp",alt:"並肩站上紅毯",position:"center"},
 multi_hyphenate:{src:"./assets/cg/milestone-ending-multi_hyphenate.webp",alt:"斜槓巨星",position:"center"},
 cult_artist:{src:"./assets/cg/milestone-ending-cult_artist.webp",alt:"圈內人的圈內人",position:"center"},
 wealthy_exit:{src:"./assets/cg/milestone-ending-wealthy_exit.webp",alt:"漂亮轉身",position:"center"},
 workhorse:{src:"./assets/cg/milestone-ending-workhorse.webp",alt:"片尾名單裡總有你",position:"center"},
 breakout:{src:"./assets/cg/milestone-ending-breakout.webp",alt:"下一站，一線",position:"center"},
 steady:{src:"./assets/cg/milestone-ending-steady.webp",alt:"站穩腳步",position:"center"},
 unfinished:{src:"./assets/cg/milestone-ending-unfinished.webp",alt:"未完待續",position:"center"},
});
export function endingArt(result){const route=`${result?.route||""} ${result?.rank||""} ${result?.title||""}`;if(result?.endingId==="whole_life")return{src:"./assets/cg/milestone-five-year-integrated.webp",alt:"五年後的完整人生",position:"center"};if(Object.hasOwn(ENDING_CG,result?.endingId))return ENDING_CG[result.endingId];if(/國際|海外|全球/.test(route))return SCENE_ART.airport;if(/導演|演員|電影|影視/.test(route))return SCENE_ART.cinema;if(/歌|音樂|偶像/.test(route))return SCENE_ART.recording;if(/主持|綜藝|媒體/.test(route))return SCENE_ART.radio;if(/獎|傳奇|巨星|S/.test(route))return SCENE_ART.awards;return SCENE_ART.room}
