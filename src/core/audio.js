import{getPreferences}from"./preferences.js";
let context=null,master=null,music=null,activeMode="",activeOscillators=[];
const AudioContextClass=()=>globalThis.AudioContext||globalThis.webkitAudioContext;
function ensure(){const C=AudioContextClass();if(!C)return null;if(!context){context=new C();master=context.createGain();music=context.createGain();music.connect(master);master.connect(context.destination)}return context}
export async function enableAudio(){const c=ensure();if(c?.state==="suspended")await c.resume();syncAudio(activeMode||"room")}
function stopMusic(){if(!music)return;activeOscillators.forEach(osc=>{try{osc.stop()}catch{}});activeOscillators=[];music.disconnect();music=context.createGain();music.connect(master);activeMode=""}
export function syncAudio(mode="room"){
 const c=ensure(),prefs=getPreferences();if(!c)return;master.gain.setTargetAtTime(prefs.audioMuted?0:1,c.currentTime,.04);music.gain.setTargetAtTime(prefs.musicVolume,c.currentTime,.08);if(activeMode===mode)return;stopMusic();activeMode=mode;
 const notes={room:[174.61,220,261.63],event:[146.83,196,233.08],runner:[130.81,174.61,220],summary:[196,246.94,293.66],ending:[220,277.18,329.63]}[mode]||[174.61,220,261.63];
 notes.forEach((frequency,index)=>{const osc=c.createOscillator(),gain=c.createGain();osc.type=index?"sine":"triangle";osc.frequency.value=frequency;gain.gain.value=.018/(index+1);osc.connect(gain);gain.connect(music);osc.start();activeOscillators.push(osc)});
}
export function playSfx(kind="tap"){
 const c=ensure(),prefs=getPreferences();if(!c||prefs.audioMuted||c.state!=="running")return;const osc=c.createOscillator(),gain=c.createGain(),now=c.currentTime;osc.type="sine";osc.frequency.setValueAtTime(kind==="confirm"?660:420,now);osc.frequency.exponentialRampToValueAtTime(kind==="confirm"?880:520,now+.09);gain.gain.setValueAtTime(Math.max(.001,prefs.sfxVolume*.08),now);gain.gain.exponentialRampToValueAtTime(.001,now+.12);osc.connect(gain);gain.connect(master);osc.start(now);osc.stop(now+.13);
}
