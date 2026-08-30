import { getPreferences } from "./preferences.js";

let context = null, master = null, music = null, sfx = null, activeMode = "";
let musicTimer = null, musicStep = 0, lastSfxAt = 0;
const AudioContextClass = () => globalThis.AudioContext || globalThis.webkitAudioContext;

const MODES = Object.freeze({
  room: { bpm: 74, notes: [261.63,329.63,392,329.63,293.66,349.23,440,349.23], bass: [130.81,146.83], wave: "sine" },
  event: { bpm: 62, notes: [220,261.63,329.63,293.66,196,246.94,293.66,261.63], bass: [110,98], wave: "triangle" },
  runner: { bpm: 92, notes: [293.66,369.99,440,369.99,329.63,392,493.88,392], bass: [146.83,164.81], wave: "triangle" },
  summary: { bpm: 80, notes: [329.63,392,493.88,440,349.23,440,523.25,493.88], bass: [164.81,174.61], wave: "sine" },
  ending: { bpm: 68, notes: [261.63,329.63,392,523.25,493.88,392,329.63,293.66], bass: [130.81,146.83], wave: "sine" },
});

function ensure() {
  const C = AudioContextClass();
  if (!C) return null;
  if (!context) {
    context = new C(); master = context.createGain(); music = context.createGain(); sfx = context.createGain();
    music.connect(master); sfx.connect(master); master.connect(context.destination);
  }
  return context;
}

function tone(frequency,start,duration,{destination=sfx,gain=.08,type="sine",endFrequency=frequency}={}) {
  if (!context || !destination) return;
  const oscillator=context.createOscillator(), envelope=context.createGain();
  oscillator.type=type; oscillator.frequency.setValueAtTime(Math.max(20,frequency),start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20,endFrequency),start+duration);
  envelope.gain.setValueAtTime(.001,start);
  envelope.gain.exponentialRampToValueAtTime(Math.max(.001,gain),start+Math.min(.018,duration/3));
  envelope.gain.exponentialRampToValueAtTime(.001,start+duration);
  oscillator.connect(envelope); envelope.connect(destination); oscillator.start(start); oscillator.stop(start+duration+.02);
}

function noise(start,duration,gain=.025) {
  if (!context || !sfx || typeof context.createBuffer!=="function") return;
  const length=Math.max(1,Math.floor(context.sampleRate*duration)), buffer=context.createBuffer(1,length,context.sampleRate), data=buffer.getChannelData(0);
  for(let i=0;i<length;i+=1)data[i]=(Math.random()*2-1)*(1-i/length);
  const source=context.createBufferSource(),filter=context.createBiquadFilter(),envelope=context.createGain();
  filter.type="highpass"; filter.frequency.value=1200; envelope.gain.setValueAtTime(gain,start); envelope.gain.exponentialRampToValueAtTime(.001,start+duration);
  source.buffer=buffer; source.connect(filter); filter.connect(envelope); envelope.connect(sfx); source.start(start);
}

function stopMusic(){if(musicTimer)globalThis.clearInterval(musicTimer);musicTimer=null;musicStep=0}
function scheduleMusicNote(){
  if(!context||context.state!=="running"||!MODES[activeMode])return;
  const config=MODES[activeMode],now=context.currentTime+.025,beat=60/config.bpm,note=config.notes[musicStep%config.notes.length];
  tone(note,now,beat*1.45,{destination:music,gain:.018,type:config.wave});
  if(musicStep%4===0)tone(config.bass[Math.floor(musicStep/4)%config.bass.length],now,beat*3.2,{destination:music,gain:.012,type:"sine"});
  musicStep+=1;
}
function startMusic(mode){stopMusic();activeMode=MODES[mode]?mode:"room";if(!context||context.state!=="running")return;scheduleMusicNote();musicTimer=globalThis.setInterval(scheduleMusicNote,(60/MODES[activeMode].bpm)*1000)}

export async function enableAudio(){const c=ensure();if(c?.state==="suspended")await c.resume();if(c?.state==="running"&&!musicTimer)startMusic(activeMode||"room");syncAudio(activeMode||"room")}
export function syncAudio(mode="room"){
  const c=ensure();if(!c)return;const prefs=getPreferences();
  master.gain.setTargetAtTime(prefs.audioMuted?0:1,c.currentTime,.04);music.gain.setTargetAtTime(prefs.musicVolume,c.currentTime,.08);sfx.gain.setTargetAtTime(prefs.sfxVolume,c.currentTime,.04);
  if(activeMode!==mode)startMusic(mode);
}

const SFX=Object.freeze({
  tap:[[420,0,.055,500,.045,"sine"]],open:[[392,0,.07,523.25,.055,"sine"],[659.25,.045,.09,784,.035,"sine"]],close:[[523.25,0,.075,349.23,.05,"sine"]],back:[[440,0,.06,369.99,.045,"triangle"]],
  confirm:[[523.25,0,.08,659.25,.06,"sine"],[783.99,.07,.12,1046.5,.045,"sine"]],cancel:[[293.66,0,.1,220,.055,"triangle"]],schedule:[[587.33,0,.055,698.46,.05,"triangle"],[880,.055,.08,987.77,.035,"sine"]],
  message:[[880,0,.06,987.77,.04,"sine"],[1174.66,.085,.1,1318.51,.035,"sine"]],success:[[523.25,0,.11,659.25,.055,"sine"],[659.25,.09,.11,783.99,.05,"sine"],[783.99,.18,.18,1046.5,.055,"sine"]],
  reward:[[659.25,0,.13,783.99,.05,"triangle"],[987.77,.1,.18,1318.51,.055,"sine"],[1567.98,.22,.28,2093,.035,"sine"]],warning:[[196,0,.14,174.61,.065,"sawtooth"],[196,.18,.14,174.61,.06,"sawtooth"]],
  failure:[[246.94,0,.13,196,.06,"triangle"],[185,.13,.22,130.81,.06,"triangle"]],purchase:[[1174.66,0,.055,1567.98,.04,"sine"],[783.99,.08,.12,987.77,.045,"triangle"]],save:[[659.25,0,.07,783.99,.045,"sine"],[1046.5,.06,.12,1318.51,.04,"sine"]],
  day:[[349.23,0,.1,440,.045,"triangle"],[523.25,.1,.15,659.25,.04,"sine"]],week:[[261.63,0,.12,329.63,.05,"triangle"],[392,.11,.14,493.88,.045,"triangle"],[659.25,.23,.2,783.99,.04,"sine"]],reveal:[[329.63,0,.22,659.25,.04,"sine"],[987.77,.16,.28,1318.51,.03,"sine"]],
});

export function playSfx(kind="tap"){
  const c=ensure(),prefs=getPreferences();if(!c||prefs.audioMuted||c.state!=="running")return false;
  const nowMs=globalThis.performance?.now?.()??Date.now();if(kind==="tap"&&nowMs-lastSfxAt<35)return false;lastSfxAt=nowMs;
  const now=c.currentTime,pattern=SFX[kind]||SFX.tap;pattern.forEach(([frequency,offset,duration,endFrequency,gain,type])=>tone(frequency,now+offset,duration,{endFrequency,gain,type}));
  if(["purchase","save","schedule"].includes(kind))noise(now,.045,.012);return true;
}

export function audioModeForState(state){
  if(state.screen!=="game")return MODES[state.screen]?state.screen:"room";
  if(["jobs","agency","creative","planner"].includes(state.appOpen))return"runner";
  if(["timeline","gallery","log","world"].includes(state.appOpen))return"summary";
  return"room";
}

export function soundForControl(control){
  if(!control||control.disabled||control.getAttribute?.("aria-disabled")==="true")return null;
  if(control.matches?.("[data-preview-sfx]"))return null;
  if(control.matches?.("[data-confirm-cancel], [data-request-reset], .danger"))return"warning";
  if(control.matches?.("[data-close-app], [data-dismiss-guide]"))return"close";
  if(control.matches?.("[data-app-back], [data-gallery-back], [data-map-back]"))return"back";
  if(control.matches?.("[data-open-app], [data-open-save-manager]"))return"open";
  if(control.matches?.("[data-save-slot], [data-export-save], [data-import-save]"))return"save";
  if(control.matches?.("[data-buy-outfit], [data-creative-sell], [data-creative-submit]"))return"purchase";
  if(control.matches?.("[data-event-choice], #event-resolve"))return"reveal";
  if(control.matches?.("[data-schedule], [data-activity], [data-planner-day], [data-copy-week]"))return"schedule";
  if(control.matches?.("#begin-week, #next-week"))return"week";
  if(control.matches?.(".main-btn, [data-confirm-accept]"))return"confirm";
  return"tap";
}
