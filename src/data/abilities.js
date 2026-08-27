// 資料層：21 項固定公開能力（依分類分組）與 8 項隱藏特質的名稱表。
// 只放名稱／分組，不放數值——數值是每局隨機擲骰後存在 core/state.js 的 state.stats／state.hidden。
export const ABILITY_GROUPS={"表演":["歌藝","演技","舞蹈","主持","聲線","鏡頭感","肢體表現"],"創作":["創作","作詞","作曲","編劇","樂器","靈感"],"形象":["外貌","氣質","時尚","儀態","親和力"],"社交與知識":["口才","社交","學識"]};
export const ABILITIES=Object.values(ABILITY_GROUPS).flat();
export const HIDDEN_TRAITS=["幽默","共情","洞察","膽識","品德","自律","野心","抗壓"];
