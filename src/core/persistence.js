// 核心層：把 state 存進 localStorage，下次開啟頁面時還原。全部包在 try/catch 裡——
// 私密瀏覽模式或使用者關閉 localStorage 時，存讀都會靜默失敗，遊戲照常從新的一輪開始，不會噴錯。
// SAVE_VERSION 是存檔格式版本號：以後 state 的形狀如果改到舊存檔會對不上（例如整個欄位改名），
// 就把這裡的數字加一，讀到舊版本一律當作沒有存檔，直接開新的一輪，不必寫遷移邏輯。
const KEY="star-game-save";
const SAVE_VERSION=1;

export function saveState(state){
 try{localStorage.setItem(KEY,JSON.stringify({v:SAVE_VERSION,state}))}catch(e){}
}

export function loadState(){
 try{
  const raw=localStorage.getItem(KEY);
  if(!raw)return null;
  const parsed=JSON.parse(raw);
  if(!parsed||parsed.v!==SAVE_VERSION||!parsed.state)return null;
  return parsed.state;
 }catch(e){return null}
}
