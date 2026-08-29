import{backupLastAutoSave,exportSave,loadBackup,loadState,saveState}from"./persistence.js";
let recoveryActive=false;
const safe=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
function download(text){const blob=new Blob([text],{type:"application/json"}),url=URL.createObjectURL(blob),anchor=document.createElement("a");anchor.href=url;anchor.download=`star-game-recovery-${new Date().toISOString().slice(0,10)}.json`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export function showFatalError(error){
 if(recoveryActive)return false;
 recoveryActive=true;
 console.error("《星途未定》發生未處理錯誤",error);
 const backedUp=backupLastAutoSave(),root=document.querySelector("#app"),message=error?.message||"未知的畫面錯誤";
 if(!root)return false;
 root.innerHTML=`<main class="fatal-recovery" role="alert"><section><span>RECOVERY MODE・存檔救援</span><h1>畫面暫時無法繼續</h1><p>遊戲沒有把你丟在黑畫面裡。${backedUp?"已保留錯誤發生前最後一次可讀取的自動存檔。":"目前找不到可用的舊自動存檔，但仍可重新載入嘗試恢復。"}</p><details><summary>查看技術資訊</summary><code>${safe(message)}</code></details><div><button class="main-btn" data-recovery-reload>重新載入最後進度</button><button data-recovery-restore ${backedUp?"":"disabled"}>回復安全備份</button><button data-recovery-download ${backedUp||loadState()?"":"disabled"}>下載救援存檔</button></div><small>若問題持續發生，請保留下載的存檔檔案再回報。</small></section></main>`;
 root.querySelector("[data-recovery-reload]")?.addEventListener("click",()=>location.reload());
 root.querySelector("[data-recovery-restore]")?.addEventListener("click",()=>{const saved=loadBackup();if(saved&&saveState(saved))location.reload()});
 root.querySelector("[data-recovery-download]")?.addEventListener("click",()=>{const saved=loadBackup()||loadState();if(saved)download(exportSave(saved))});
 return true;
}
export function installGlobalErrorHandlers(){
 window.addEventListener("error",event=>{if(event.error)showFatalError(event.error)});
 window.addEventListener("unhandledrejection",event=>showFatalError(event.reason instanceof Error?event.reason:new Error(String(event.reason||"未處理的非同步錯誤"))));
}
