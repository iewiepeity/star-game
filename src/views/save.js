// 畫面層：存檔管理 App。自動存檔每次操作都會覆寫，僅供顯示時間；手動存檔／讀取由玩家自己觸發。
import{state}from"../core/state.js";
import{autoSaveMeta,manualSaveMeta}from"../core/persistence.js";
import{esc}from"../core/utils.js";

const fmtTime=ts=>{if(!ts)return"—";const d=new Date(ts);return`${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`};

export function saveApp(){const auto=autoSaveMeta(),manual=manualSaveMeta();return `<div class="inside-page"><div class="inside-title"><div><span>SAVE &amp; LOAD</span><h2>存檔管理</h2></div><p>手動存檔與自動存檔互不影響</p></div>${state.saveNotice?`<div class="wardrobe-notice">${esc(state.saveNotice)}</div>`:""}<div class="save-cards"><section class="save-card"><header><span>AUTO SAVE</span><h3>自動存檔</h3></header><p>每次操作都會自動存進這台瀏覽器，意外關閉分頁或重新整理都能從這裡接續。</p><div class="save-meta">${auto?`<b>第 ${auto.week} 週・${esc(auto.name)}</b><small>${fmtTime(auto.savedAt)}</small>`:"尚無自動存檔"}</div></section><section class="save-card"><header><span>MANUAL SAVE</span><h3>手動存檔</h3></header><p>建立一個你可以隨時回來的進度點；讀取會直接把目前進度換成手動存檔當下的狀態。</p><div class="save-meta">${manual?`<b>第 ${manual.week} 週・${esc(manual.name)}</b><small>${fmtTime(manual.savedAt)}</small>`:"尚無手動存檔"}</div><div class="save-actions"><button id="manual-save">存檔・記錄目前進度</button><button id="manual-load" ${manual?"":"disabled"}>讀取存檔・回到記錄點</button></div></section></div></div>`}
