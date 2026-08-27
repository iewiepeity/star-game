// 核心層：把 state 存進 localStorage，下次開啟頁面時還原。全部包在 try/catch 裡——
// 私密瀏覽模式或使用者關閉 localStorage 時，存讀都會靜默失敗，遊戲照常從新的一輪開始，不會噴錯。
// SAVE_VERSION 是存檔格式版本號：以後 state 的形狀如果改到舊存檔會對不上（例如整個欄位改名），
// 就把這裡的數字加一，讀到舊版本一律當作沒有存檔，直接開新的一輪，不必寫遷移邏輯。
// 有兩個獨立的存檔槽：AUTO_KEY 是自動存檔，每次 render() 都會覆寫，用來防止重新整理或關分頁遺失進度；
// MANUAL_KEY 是玩家自己按「存檔」才會寫入的紀錄點，讀取時只會覆寫成手動存檔當下的狀態。
const AUTO_KEY="star-game-save";
const MANUAL_KEY="star-game-save-manual";
const SAVE_VERSION=2;

function readSlot(key){
 try{
  const raw=localStorage.getItem(key);
  if(!raw)return null;
  const parsed=JSON.parse(raw);
  if(!parsed||parsed.v!==SAVE_VERSION||!parsed.state)return null;
  return parsed;
 }catch(e){return null}
}

function writeSlot(key,state){
 try{localStorage.setItem(key,JSON.stringify({v:SAVE_VERSION,state,savedAt:Date.now()}));return true}catch(e){return false}
}

export function saveState(state){writeSlot(AUTO_KEY,state)}
export function loadState(){return readSlot(AUTO_KEY)?.state||null}
export function autoSaveMeta(){const s=readSlot(AUTO_KEY);return s?{savedAt:s.savedAt,week:s.state.week,name:s.state.name}:null}

export function saveManualState(state){return writeSlot(MANUAL_KEY,state)}
export function loadManualState(){return readSlot(MANUAL_KEY)?.state||null}
export function manualSaveMeta(){const s=readSlot(MANUAL_KEY);return s?{savedAt:s.savedAt,week:s.state.week,name:s.state.name}:null}
