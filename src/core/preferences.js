const KEY="star-game-preferences";
const FONT_SIZES=new Set(["standard","comfortable","large"]);
const THEMES=new Set(["warm","rose","night"]);
export const PLAYBACK_SPEEDS = Object.freeze([
 { id: "manual", label: "手動", title: "手動播放", resultDelay: null, loadingDelay: 350 },
 ...[1, 2, 4, 8, 16].map((speed, index) => ({
  id: `x${speed}`, label: `${speed}×`,
  title: ["一般閱讀", "快速播放", "加速推進", "高速播放", "極速播放"][index],
  resultDelay: 4000 / speed, loadingDelay: Math.round(350 / speed),
 })),
].map(Object.freeze));
const AUTO_SPEEDS=new Set(PLAYBACK_SPEEDS.map(speed=>speed.id));
const clampVolume=value=>Math.max(0,Math.min(1,Number.isFinite(Number(value))?Number(value):0));
export const DEFAULT_PREFERENCES={fontSize:"standard",theme:"warm",autoSpeed:"x1",musicVolume:.28,sfxVolume:.42,audioMuted:false};

export function normalizePreferences(value={}){
 return{fontSize:FONT_SIZES.has(value.fontSize)?value.fontSize:DEFAULT_PREFERENCES.fontSize,theme:THEMES.has(value.theme)?value.theme:DEFAULT_PREFERENCES.theme,autoSpeed:AUTO_SPEEDS.has(value.autoSpeed)?value.autoSpeed:DEFAULT_PREFERENCES.autoSpeed,musicVolume:clampVolume(value.musicVolume??DEFAULT_PREFERENCES.musicVolume),sfxVolume:clampVolume(value.sfxVolume??DEFAULT_PREFERENCES.sfxVolume),audioMuted:Boolean(value.audioMuted)};
}

function readPreferences(){
 try{return normalizePreferences(JSON.parse(localStorage.getItem(KEY)||"{}"))}catch{return{...DEFAULT_PREFERENCES}}
}

let preferences=readPreferences();
export function getPreferences(){return{...preferences}}
export function autoAdvanceDelay(){return PLAYBACK_SPEEDS.find(speed=>speed.id===preferences.autoSpeed).resultDelay}
export function runnerLoadingDelay(){return PLAYBACK_SPEEDS.find(speed=>speed.id===preferences.autoSpeed).loadingDelay}
export function applyPreferences(){
 if(typeof document==="undefined")return;
 document.documentElement.dataset.fontSize=preferences.fontSize;
 document.documentElement.dataset.theme=preferences.theme;
 const colors={warm:"#f3d9d4",rose:"#efc7cf",night:"#252730"};
 document.querySelector('meta[name="theme-color"]')?.setAttribute("content",colors[preferences.theme]);
}
export function setPreference(name,value){
 preferences=normalizePreferences({...preferences,[name]:value});
 try{localStorage.setItem(KEY,JSON.stringify(preferences))}catch{}
 applyPreferences();
 return getPreferences();
}
