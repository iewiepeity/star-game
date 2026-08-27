// 資料層：性別／稱呼選項。立繪獨立為 avatarId，但女性／男性會各自鎖定另一種性別的立繪（見 data/wardrobe.js 的 isAvatarLocked）；非二元與自訂稱呼不受限制。
export const KNOWN_GENDERS=["女性","男性","非二元"];
export const GENDER_OPTIONS=[...KNOWN_GENDERS,"自訂"];
