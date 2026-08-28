// NPC 戀愛路線資格。好感數值只供引擎判定，任何玩家介面都不得直接顯示。
export const ROMANCE_ROUTES=Object.freeze({
 jiqing:{tier:"standard",minAge:18,label:"溫柔成熟系",hook:"從訪談與深夜談心開始，慢慢成為彼此能卸下工作表情的人。"},
 tangtang:{tier:"standard",minAge:18,label:"偶像競爭系",hook:"從同臺競爭、交換 Demo 到一起面對粉絲與公開戀情。"},
 sufei:{tier:"standard",minAge:18,label:"宿敵變戀人",hook:"共同試鏡與公平競爭，讓最懂彼此不甘心的人逐漸並肩。"},
 lujingran:{tier:"standard",minAge:18,label:"慢熱創作系",hook:"沒有說完的旋律與安靜陪伴，比情話更早洩漏心意。"},
 guchengxi:{tier:"standard",minAge:20,minWorks:1,label:"演員前輩系",hook:"在對戲與媒體風暴裡，學會不再只扮演永遠可靠的人。",avoidWorkConflict:true},
 chengyian:{tier:"standard",minAge:20,label:"藝術家陪伴系",hook:"鏡頭先看見真實的你，而他最後也願意走到鏡頭前。",avoidWorkConflict:true},
 xiayutong:{tier:"conditional",minAge:20,minWorks:1,label:"製作人行動系",hook:"收工後仍亮著的攝影棚，成為兩人把工作與心意說清楚的地方。",avoidWorkConflict:true},
 shenyao:{tier:"conditional",minAge:20,minWorks:1,label:"冷面導演系",hook:"從嚴格合作到交出未公開分鏡，信任必須先於感情成立。",avoidWorkConflict:true},
 linxiafan:{tier:"conditional",minAge:21,minWorks:1,label:"成熟姊系",hook:"從替你定義形象，到尊重彼此都能選擇自己想成為的人。",avoidWorkConflict:true},
 hanzhiyuan:{tier:"disabled",minAge:21,label:"職涯夥伴",hook:"現階段維持合約、健康管理與職涯信任線，不開放攻略。"},
 silver_pc:{tier:"hidden",minAge:18,label:"多周目隱藏線",hook:"跨越不同人生仍再次認出彼此；需待特殊周目內容完成。"}
});

export const ROMANCE_STAGE_DEFS=Object.freeze([
 {id:"none",label:"尚未定義"},
 {id:"interested",label:"開始在意"},
 {id:"ambiguous",label:"曖昧"},
 {id:"dating",label:"交往中"},
 {id:"committed",label:"穩定伴侶"},
 {id:"engaged",label:"已訂婚"},
 {id:"married",label:"已婚"},
 {id:"rejected",label:"心意未被接受"},
 {id:"broken",label:"已分手"}
]);

export const ROMANCE_STAGES=Object.freeze(ROMANCE_STAGE_DEFS.map(stage=>stage.id));
export const ROMANCE_STAGE_BY_ID=Object.freeze(Object.fromEntries(ROMANCE_STAGE_DEFS.map(stage=>[stage.id,stage])));
