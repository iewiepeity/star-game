export const MANAGERS={
 starlight:{id:"mgr-starlight",agencyId:"starlight",name:"許芮安",title:"新人組經紀人",personality:"冷靜務實",description:"做事俐落、嘴上不太哄人，但會把藝人的檔期、風險與長期路線顧得很細。最討厭臨時失聯與明知會爆還硬要亂衝。",strengths:["危機處理","商務談判","行程管理"],initialTrust:52,initialStress:18}
};
export const managerForAgency=id=>MANAGERS[id]||null;
