// 資料層：性別選項。KNOWN_GENDERS 是三個固定選項，GENDER_OPTIONS 多一個「自訂」讓玩家輸入自己的稱呼。
// 立繪用的 core/utils.js 的 playerPortraitPath() 也是靠 KNOWN_GENDERS 判斷要挑哪一張圖，兩處共用同一份清單。
export const KNOWN_GENDERS=["女性","男性","非二元"];
export const GENDER_OPTIONS=[...KNOWN_GENDERS,"自訂"];
