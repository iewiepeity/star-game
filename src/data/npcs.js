// 資料層：可認識的人物檔案。玩家實際認識過的人物 id 存在 state.knownPeople，尚未相遇前不會出現在任何畫面。
// portrait 是立繪圖檔路徑，圖還沒畫之前先把路徑訂好——之後把圖存成這個檔名放進 assets/portraits/ 就會自動顯示，
// 找不到檔案時畫面會自動退回 avatar 那個文字頭像，不需要再改程式碼。新增 NPC 時比照加一個 portrait 欄位即可。
export const NPCS={
 jiqing:{name:"紀晴",job:"廣播節目主持人",location:"星望廣播電臺",bio:"星望廣播電臺節目主持人。反應快、待人親切，對有潛力的新人很敏銳。",avatar:"紀",portrait:"./assets/portraits/jiqing.png"},
 silver_pc:{name:"銀灰少女",job:"身分尚未揭露",location:"星望市・不定期出沒",bio:"有著銀灰長捲髮與灰藍眼眸的神祕女子。玩家尚未真正認識她，姓名與背景會在後續事件中揭露。",avatar:"銀",portrait:"./assets/avatars/silver-newcomer.webp"}
};
