const KEY="star-game-preferences";
const FONT_SIZES=new Set(["standard","comfortable","large"]);
const THEMES=new Set(["warm","rose","night"]);
export const DEFAULT_PREFERENCES={fontSize:"standard",theme:"warm"};

export function normalizePreferences(value={}){
 return{fontSize:FONT_SIZES.has(value.fontSize)?value.fontSize:DEFAULT_PREFERENCES.fontSize,theme:THEMES.has(value.theme)?value.theme:DEFAULT_PREFERENCES.theme};
}

function readPreferences(){
 try{return normalizePreferences(JSON.parse(localStorage.getItem(KEY)||"{}"))}catch{return{...DEFAULT_PREFERENCES}}
}

let preferences=readPreferences();
export function getPreferences(){return{...preferences}}
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
