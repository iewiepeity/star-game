// 資料層：玩家立繪的圖檔路徑（依性別挑一張），實際圖檔還沒畫，先把路徑訂好。
// 之後美術圖只要用這裡列的檔名存進 assets/portraits/，畫面就會自動吃到，不需要再改程式碼；
// 圖還沒放進去之前，畫面上找不到檔案會自動隱藏、退回原本的文字頭像，不會出現壞掉的圖示。
// 想換檔名或改用其他副檔名（例如 .webp）也只需要改這裡這四行，不用動到有引用它的畫面檔案。
export const PLAYER_PORTRAITS={
 female:"./assets/portraits/player-female.png",
 male:"./assets/portraits/player-male.png",
 nonbinary:"./assets/portraits/player-nonbinary.png",
 default:"./assets/portraits/player-default.png"
};
