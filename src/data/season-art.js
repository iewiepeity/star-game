import{SCENE_ART}from"./story-art.js";
export const YEAR_TRANSITIONS=Object.freeze({
 52:{year:1,title:"第一年・名字開始被記住",text:"你不再只是履歷表上的新人；做過的選擇，已經開始決定別人如何向下一個人介紹你。",art:SCENE_ART.audition},
 104:{year:2,title:"第二年・機會開始有代價",text:"工作變多以後，真正稀缺的不再只是曝光，而是時間、健康與仍願意相信的人。",art:SCENE_ART.studio},
 156:{year:3,title:"第三年・作品離開現場",text:"角色、歌曲與節目進入市場；你必須學會面對作品不再只屬於創作者。",art:SCENE_ART.cinema},
 208:{year:4,title:"第四年・位置成為責任",text:"你已經能影響團隊與後來的新人。如何使用這個位置，也會成為作品的一部分。",art:SCENE_ART.press},
 260:{year:5,title:"第五年・留下自己的版本",text:"最後一年不是衝刺成唯一答案，而是確認這條路上哪些東西值得被帶到結局。",art:SCENE_ART.awards}
});
export const yearTransitionForWeek=week=>YEAR_TRANSITIONS[week]||null;
export function endingArt(result){const route=`${result?.route||""} ${result?.rank||""} ${result?.title||""}`;if(/國際|海外|全球/.test(route))return SCENE_ART.airport;if(/導演|演員|電影|影視/.test(route))return SCENE_ART.cinema;if(/歌|音樂|偶像/.test(route))return SCENE_ART.recording;if(/主持|綜藝|媒體/.test(route))return SCENE_ART.radio;if(/獎|傳奇|巨星|S/.test(route))return SCENE_ART.awards;return SCENE_ART.room}
