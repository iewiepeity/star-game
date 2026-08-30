import { getPreferences } from "./preferences.js";

const AudioContextClass=()=>globalThis.AudioContext||globalThis.webkitAudioContext;
const SAMPLE_ROOT="./assets/audio/kenney-interface/";
const SAMPLE_NAMES=["tap","open","close","back","confirm","schedule","warning","reward","message","paper","scroll","select","switch","tick"];
const SAMPLE_BY_SFX={tap:"tap",open:"open",close:"close",back:"back",confirm:"confirm",cancel:"back",schedule:"schedule",message:"message",success:"confirm",reward:"reward",warning:"warning",failure:"warning",purchase:"reward",save:"confirm",day:"switch",week:"reward",reveal:"message",paper:"paper",scroll:"scroll",select:"select",switch:"switch",tick:"tick",shutter:"tick",applause:"reward",clapper:"schedule"};
const MODES=Object.freeze({
 room:{bpm:68,root:130.81,scale:[0,2,4,7,9,11],motif:[0,2,null,4,2,null,1,null],density:.58,wave:"sine",color:"warm"},
 planning:{bpm:78,root:146.83,scale:[0,2,4,7,9],motif:[0,null,2,3,null,4,2,null],density:.62,wave:"triangle",color:"warm"},
 industry:{bpm:94,root:146.83,scale:[0,2,3,5,7,9,10],motif:[0,2,null,4,3,5,null,2],density:.72,wave:"triangle",color:"bright"},
 creative:{bpm:76,root:164.81,scale:[0,2,4,6,9,11],motif:[0,null,3,2,null,5,4,null],density:.55,wave:"sine",color:"dream"},
 social:{bpm:88,root:174.61,scale:[0,2,4,7,9],motif:[0,2,4,null,3,2,1,null],density:.7,wave:"sine",color:"bright"},
 romance:{bpm:62,root:130.81,scale:[0,2,4,7,11],motif:[0,null,2,null,4,3,null,2],density:.42,wave:"sine",color:"dream"},
 tension:{bpm:58,root:110,scale:[0,1,3,5,6,8,10],motif:[0,null,1,null,4,null,3,1],density:.48,wave:"triangle",color:"dark"},
 event:{bpm:66,root:123.47,scale:[0,2,3,7,8,10],motif:[0,null,3,2,null,4,1,null],density:.55,wave:"triangle",color:"dark"},
 runner:{bpm:96,root:146.83,scale:[0,2,4,7,9,11],motif:[0,2,4,2,3,5,4,null],density:.78,wave:"triangle",color:"bright"},
 summary:{bpm:80,root:164.81,scale:[0,2,4,7,9],motif:[0,2,null,4,3,null,2,1],density:.58,wave:"sine",color:"warm"},
 awards:{bpm:72,root:174.61,scale:[0,2,4,7,9,11],motif:[0,2,4,5,4,3,2,null],density:.68,wave:"sine",color:"bright"},
 ending:{bpm:64,root:130.81,scale:[0,2,4,7,9,11],motif:[0,null,2,4,5,4,3,2],density:.62,wave:"sine",color:"dream"},
});

let context=null,master=null,compressor=null,musicMix=null,sfxBus=null,musicBuses=[];
let activeBus=0,activeMode="room",musicTimer=null,musicStep=0,careerIntensity=0,hiddenByPage=false,lastPointerAt=0,lastTapAt=0,loadPromise=null;
const buffers=new Map(),musicSources=new Set(),sfxSources=new Set();

function ensure(){
 const C=AudioContextClass();if(!C)return null;
 if(!context){
  context=new C();master=context.createGain();compressor=context.createDynamicsCompressor();musicMix=context.createGain();sfxBus=context.createGain();musicBuses=[context.createGain(),context.createGain()];
  compressor.threshold.value=-16;compressor.knee.value=18;compressor.ratio.value=5;compressor.attack.value=.004;compressor.release.value=.18;
  musicBuses.forEach(bus=>{bus.gain.value=0;bus.connect(musicMix)});musicMix.connect(master);sfxBus.connect(master);master.connect(compressor);compressor.connect(context.destination);
 }
 return context;
}

function frequency(root,semitones,octave=1){return root*octave*2**(semitones/12)}
function synthTone(frequencyValue,start,duration,{destination=sfxBus,gain=.05,type="sine",endFrequency=frequencyValue,trackMusic=false}={}){
 if(!context||!destination)return null;const oscillator=context.createOscillator(),envelope=context.createGain(),sources=trackMusic?musicSources:sfxSources;
 oscillator.type=type;oscillator.frequency.setValueAtTime(Math.max(20,frequencyValue),start);oscillator.frequency.exponentialRampToValueAtTime(Math.max(20,endFrequency),start+duration);
 envelope.gain.setValueAtTime(.001,start);envelope.gain.exponentialRampToValueAtTime(Math.max(.001,gain),start+Math.min(.035,duration/3));envelope.gain.exponentialRampToValueAtTime(.001,start+duration);
 oscillator.connect(envelope);envelope.connect(destination);oscillator.start(start);oscillator.stop(start+duration+.03);sources.add(oscillator);oscillator.onended=()=>sources.delete(oscillator);return oscillator;
}
function synthNoise(start,duration,{gain=.018,frequencyValue=1400,type="bandpass",destination=sfxBus}={}){
 if(!context||typeof context.createBuffer!=="function")return;const length=Math.max(1,Math.floor(context.sampleRate*duration)),buffer=context.createBuffer(1,length,context.sampleRate),data=buffer.getChannelData(0);
 for(let i=0;i<length;i+=1)data[i]=(Math.random()*2-1)*(1-i/length);const source=context.createBufferSource(),filter=context.createBiquadFilter(),envelope=context.createGain();
 filter.type=type;filter.frequency.value=frequencyValue;envelope.gain.setValueAtTime(gain,start);envelope.gain.exponentialRampToValueAtTime(.001,start+duration);source.buffer=buffer;source.connect(filter);filter.connect(envelope);envelope.connect(destination);source.start(start);sfxSources.add(source);source.onended=()=>sfxSources.delete(source);
}

async function loadSamples(){
 if(loadPromise)return loadPromise;const c=ensure();if(!c)return Promise.resolve();
 loadPromise=Promise.all(SAMPLE_NAMES.map(async name=>{try{const response=await fetch(`${SAMPLE_ROOT}${name}.ogg`);if(!response.ok)return;buffers.set(name,await c.decodeAudioData(await response.arrayBuffer()))}catch{}}));return loadPromise;
}
function playSample(name,gain=.5,rate=1){const buffer=buffers.get(name);if(!buffer||!context||!sfxBus)return false;const source=context.createBufferSource(),envelope=context.createGain();source.buffer=buffer;source.playbackRate.value=rate;envelope.gain.value=gain;source.connect(envelope);envelope.connect(sfxBus);source.start();sfxSources.add(source);source.onended=()=>sfxSources.delete(source);return true}

function stopMusicScheduler(){if(musicTimer)globalThis.clearInterval(musicTimer);musicTimer=null;musicStep=0}
function scheduleMusicBeat(){
 if(!context||context.state!=="running")return;const config=MODES[activeMode]||MODES.room,now=context.currentTime+.035,beat=60/config.bpm,index=musicStep%config.motif.length,noteIndex=config.motif[index];
 if(noteIndex!=null&&Math.random()<config.density+careerIntensity*.08){const degree=config.scale[noteIndex%config.scale.length],octave=musicStep%16>=8?2:1; synthTone(frequency(config.root,degree,octave),now,beat*(index%4===0?1.8:.78),{destination:musicBuses[activeBus],gain:(config.color==="dark"?.013:.017)*(1+careerIntensity*.12),type:config.wave,trackMusic:true})}
 if(musicStep%8===0){const chordShift=[0,5,3,4][Math.floor(musicStep/8)%4],bass=frequency(config.root,config.scale[chordShift%config.scale.length]);synthTone(bass,now,beat*7.2,{destination:musicBuses[activeBus],gain:.011,type:"sine",trackMusic:true});synthTone(bass*2**(7/12),now+.06,beat*6.4,{destination:musicBuses[activeBus],gain:.006,type:"sine",trackMusic:true})}
 if(config.color==="bright"&&musicStep%4===2)synthNoise(now,.025,{gain:.0018,frequencyValue:4200,type:"highpass",destination:musicBuses[activeBus]});if(careerIntensity>.55&&musicStep%16===12)synthTone(config.root*4,now,beat*2.4,{destination:musicBuses[activeBus],gain:.006*careerIntensity,type:"sine",trackMusic:true});musicStep+=1;
}
function startMusic(mode,{fade=.9}={}){
 const c=ensure();if(!c)return;stopMusicScheduler();const previous=activeBus;activeBus=1-activeBus;activeMode=MODES[mode]?mode:"room";const now=c.currentTime,target=getPreferences().audioMuted?0:1;
 musicBuses[previous].gain.cancelScheduledValues(now);musicBuses[previous].gain.setValueAtTime(musicBuses[previous].gain.value,now);musicBuses[previous].gain.linearRampToValueAtTime(0,now+fade);
 musicBuses[activeBus].gain.cancelScheduledValues(now);musicBuses[activeBus].gain.setValueAtTime(0,now);musicBuses[activeBus].gain.linearRampToValueAtTime(target,now+fade*1.25);
 if(c.state!=="running")return;scheduleMusicBeat();musicTimer=globalThis.setInterval(scheduleMusicBeat,(60/MODES[activeMode].bpm)*1000);
}
function duckMusic(amount=.42,duration=.28){if(!context||!musicMix)return;const now=context.currentTime,volume=getPreferences().musicVolume;musicMix.gain.cancelScheduledValues(now);musicMix.gain.setValueAtTime(musicMix.gain.value,now);musicMix.gain.linearRampToValueAtTime(volume*amount,now+.025);musicMix.gain.linearRampToValueAtTime(volume,now+duration)}

export async function enableAudio(){const c=ensure();if(!c)return false;if(c.state==="suspended")await c.resume();loadSamples();if(c.state==="running"&&!musicTimer)startMusic(activeMode||"room",{fade:.35});syncAudio(activeMode||"room");return c.state==="running"}
export async function suspendAudio(){if(!context||context.state!=="running")return;hiddenByPage=true;const now=context.currentTime;master.gain.cancelScheduledValues(now);master.gain.linearRampToValueAtTime(0,now+.12);await new Promise(resolve=>globalThis.setTimeout(resolve,140));if(hiddenByPage&&context.state==="running")await context.suspend()}
export async function resumeAudio(){if(!context||!hiddenByPage)return;hiddenByPage=false;await context.resume();syncAudio(activeMode);const now=context.currentTime;master.gain.setValueAtTime(0,now);master.gain.linearRampToValueAtTime(getPreferences().audioMuted?0:1,now+.2);if(!musicTimer)startMusic(activeMode,{fade:.35})}
export function syncAudio(mode="room",gameState=null){
 const c=ensure();if(!c)return;if(gameState){const year=Math.max(1,Math.min(5,Number(gameState.year)||1)),fame=Math.max(0,Math.min(500,Number(gameState.fame)||0));careerIntensity=Math.min(1,(year-1)/8+fame/1000)}const prefs=getPreferences(),now=c.currentTime;master.gain.setTargetAtTime(prefs.audioMuted?0:1,now,.04);musicMix.gain.setTargetAtTime(prefs.musicVolume,now,.08);sfxBus.gain.setTargetAtTime(prefs.sfxVolume,now,.04);if(activeMode!==mode)startMusic(mode);
}

const SYNTH=Object.freeze({
 tap:[[420,0,.05,500,.022,"sine"]],open:[[392,0,.07,523.25,.026,"sine"],[659.25,.045,.09,784,.018,"sine"]],close:[[523.25,0,.075,349.23,.025,"sine"]],back:[[440,0,.06,369.99,.022,"triangle"]],confirm:[[523.25,0,.08,659.25,.028,"sine"],[783.99,.07,.12,1046.5,.022,"sine"]],schedule:[[587.33,0,.055,698.46,.025,"triangle"],[880,.055,.08,987.77,.018,"sine"]],
 success:[[523.25,0,.1,659.25,.035,"sine"],[659.25,.08,.12,783.99,.03,"sine"],[783.99,.17,.18,1046.5,.035,"sine"]],reward:[[659.25,0,.13,783.99,.035,"triangle"],[987.77,.1,.18,1318.51,.04,"sine"],[1567.98,.22,.28,2093,.025,"sine"]],
 warning:[[196,0,.13,174.61,.045,"sawtooth"],[196,.17,.13,174.61,.04,"sawtooth"]],failure:[[246.94,0,.13,196,.045,"triangle"],[185,.12,.22,130.81,.045,"triangle"]],message:[[880,0,.055,987.77,.025,"sine"],[1174.66,.075,.09,1318.51,.022,"sine"]],
 day:[[349.23,0,.09,440,.025,"triangle"],[523.25,.09,.14,659.25,.025,"sine"]],week:[[261.63,0,.12,329.63,.03,"triangle"],[392,.1,.14,493.88,.03,"triangle"],[659.25,.22,.2,783.99,.025,"sine"]],reveal:[[329.63,0,.2,659.25,.03,"sine"],[987.77,.15,.26,1318.51,.02,"sine"]],
});
export function playSfx(kind="tap"){
 const c=ensure(),prefs=getPreferences();if(!c||prefs.audioMuted||c.state!=="running")return false;const nowMs=globalThis.performance?.now?.()??Date.now();if(kind==="tap"&&nowMs-lastTapAt<55)return false;lastTapAt=nowMs;
 const rate=.96+Math.random()*.08,sample=SAMPLE_BY_SFX[kind],impact=["success","reward","warning","failure","week","reveal","applause"].includes(kind);
 if(impact){const danger=kind==="warning"||kind==="failure",long=kind==="reward"||kind==="applause";duckMusic(danger ? .28 : .48,long ? .55 : .34)}
 const sampled=sample?playSample(sample,kind==="tap"?.34:.46,rate):false,now=c.currentTime;for(const[frequencyValue,offset,duration,endFrequency,gain,type]of SYNTH[kind]||[])synthTone(frequencyValue,now+offset,duration,{endFrequency,gain,type});
 if(kind==="shutter"){synthNoise(now,.055,{gain:.045,frequencyValue:2400,type:"highpass"});synthTone(95,now,.035,{gain:.035,type:"square",endFrequency:55})}
 if(kind==="clapper"){synthNoise(now,.035,{gain:.065,frequencyValue:900});synthTone(180,now,.06,{gain:.035,type:"square",endFrequency:90})}
 if(kind==="applause")for(let i=0;i<12;i+=1)synthNoise(now+i*.045,.08,{gain:.012,frequencyValue:900+Math.random()*2200,type:"bandpass"});
 return sampled||Boolean(SYNTH[kind])||["shutter","clapper","applause"].includes(kind);
}

function narrativeText(state){return`${state.activeEvent?.event?.title||""} ${state.activeEvent?.event?.text||""} ${state.runnerResult?.title||""} ${state.runnerResult?.text||""} ${state.notice||""}`}
export function audioModeForState(state){
 const text=narrativeText(state);if(/醜聞|炎上|違約|爭議|衝突|分手|危機|失敗/.test(text))return"tension";if(/告白|約會|戀愛|求婚|結婚|心意|曖昧/.test(text))return"romance";if(/頒獎|得獎|獎項|紅毯|典禮/.test(text))return"awards";
 if(state.screen==="ending")return"ending";if(state.screen==="event")return"event";if(state.screen==="runner")return"runner";if(state.screen==="summary")return"summary";if(state.screen!=="game")return"room";
 if(["planner","jobs"].includes(state.appOpen))return"planning";if(["agency","world","stats"].includes(state.appOpen))return"industry";if(["creative","wardrobe","gallery"].includes(state.appOpen))return"creative";if(["people","npc","social","forum"].includes(state.appOpen))return"social";return"room";
}
export function soundForControl(control){
 if(!control||control.disabled||control.getAttribute?.("aria-disabled")==="true"||control.matches?.("[data-preview-sfx]"))return null;
 if(control.matches?.("[data-confirm-cancel], [data-request-reset], .danger"))return"warning";if(control.matches?.("[data-close-app], [data-dismiss-guide]"))return"close";if(control.matches?.("[data-app-back], [data-gallery-back], [data-map-back]"))return"back";if(control.matches?.("[data-open-app], [data-open-save-manager]"))return"open";
 if(control.matches?.("[data-save-slot], [data-export-save], [data-import-save]"))return"save";if(control.matches?.("[data-buy-outfit], [data-creative-sell], [data-creative-submit]"))return"purchase";if(control.matches?.("[data-event-choice], #event-resolve"))return"reveal";if(control.matches?.("[data-schedule], [data-activity], [data-planner-day], [data-copy-week]"))return"schedule";if(control.matches?.("#begin-week, #next-week"))return"week";if(control.matches?.(".main-btn, [data-confirm-accept]"))return"confirm";return"tap";
}
export function markPointerSound(){lastPointerAt=globalThis.performance?.now?.()??Date.now()}
export function shouldPlayKeyboardSound(){return(globalThis.performance?.now?.()??Date.now())-lastPointerAt>350}
