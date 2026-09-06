// NPC 戀愛路線資格。好感數值只供引擎判定，任何玩家介面都不得直接顯示。
export const ROMANCE_ROUTES=Object.freeze({
 jiqing:{tier:"standard",minAge:18,label:"溫柔成熟系",hook:"她接得住每個人的話，偏偏告白時會忘詞。從收播後的小故事，到只留給你的一個私人頻道。"},
 tangtang:{tier:"standard",minAge:18,label:"偶像競爭系",hook:"她能對整座舞台比心，卻會為一則私人邀請緊張。一起練習、吃糖，也學會沒有排名的喜歡。"},
 sufei:{tier:"standard",minAge:18,label:"宿敵變戀人",hook:"不准放水的對戲，沒有劇本的邀約。她最會說的是「再來一次」，最難說的是「今天想你」。"},
 lujingran:{tier:"standard",minAge:18,label:"慢熱創作系",hook:"耳機裡是雨聲，草稿檔名卻叫「找個理由」。他得先學會直接說想見你，才不會讓喜歡只留在歌裡。"},
 guchengxi:{tier:"standard",minAge:20,minWorks:1,label:"演員前輩系",hook:"他的玩笑總晚兩秒才聽懂，真心卻藏得更久。從前輩的從容，走到收工後願意讓你看見的笨拙。",avoidWorkConflict:true},
 chengyian:{tier:"standard",minAge:20,label:"藝術家陪伴系",hook:"他總能找到漂亮的光，卻得學會準時赴約。當相機放回包裡，那個愛說奇怪比喻的人才真正靠近。",avoidWorkConflict:true},
 xiayutong:{tier:"conditional",minAge:20,minWorks:1,label:"製作人行動系",hook:"她一次有三個新點子，第四個卻只是想見你。從收工鹹酥雞到雙人生活，讓約會不再卡在待排。",avoidWorkConflict:true},
 shenyao:{tier:"conditional",minAge:20,minWorks:1,label:"冷面導演系",hook:"他看得懂鏡頭裡的心事，輪到自己卻會弄錯開場。從最後兩排的空位，到沒有分鏡也想一起走的以後。",avoidWorkConflict:true},
 linxiafan:{tier:"conditional",minAge:21,minWorks:1,label:"成熟姊系",hook:"她的評語像剪刀，私人邀請卻短得讓人心跳。從「穿得還行」到親口說喜歡，兩個人都不用被修改成標準答案。",avoidWorkConflict:true},
 hanzhiyuan:{tier:"disabled",minAge:21,label:"職涯夥伴",hook:"他把承諾記進備忘錄，也慢慢學著讓飯桌沒有議程。這是一條職涯信任與友誼線，現階段不開放戀愛。"},
 silver_pc:{tier:"hidden",minAge:18,label:"多周目隱藏線",hook:"不同人生留下相似的片段，這一輪仍必須重新認識。熟悉感不能替任何一方答應靠近。"}
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
