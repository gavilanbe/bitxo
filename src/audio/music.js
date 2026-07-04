"use strict";
/* =========================================================
   BITXO — audio/music: banda sonora procedural (día/noche/lluvia/combate)
   ========================================================= */
/* ====== banda sonora: acordes con cualidad, voz interior y groove ====== */
const QUAL = { M:[0,4,7], m:[0,3,7], '7':[0,4,7,10], M7:[0,4,7,11], m7:[0,3,7,10] };
const SONGS = {
 day: {
  bpm:96, swing:0.16, base:349.23, bassBase:87.31,
  lead:'p125', vol:0.024, vib:true, melSend:0.4, drums:null, comp:null, bassStyle:'long', har:true,
  chords:[[0,'M'],[5,'M'],[0,'M'],[7,'7'], [0,'M'],[5,'M'],[0,'M'],[7,'7'], [5,'M'],[0,'M'],[5,'M'],[7,'7'], [0,'M'],[5,'M'],[7,'7'],[0,'M'], [0,'M'],[5,'M'],[0,'M'],[7,'7'], [0,'M'],[5,'M'],[7,'7'],[0,'M']],
  mel:[
   [7,2],[4,2],[0,2],[4,2],[7,2],[9,2],[7,4],
   [5,2],[4,2],[2,2],[4,2],[5,2],[7,2],[4,4],
   [7,2],[4,2],[0,2],[4,2],[7,2],[9,2],[12,4],
   [9,2],[7,2],[5,2],[7,2],[4,2],[2,2],[0,4],
   [7,2],[4,2],[0,2],[4,2],[7,2],[9,2],[7,4],
   [5,2],[4,2],[2,2],[4,2],[5,2],[7,2],[4,4],
   [7,2],[4,2],[0,2],[4,2],[7,2],[9,2],[12,4],
   [9,2],[11,2],[12,4],[16,2],[14,2],[12,4],
   [5,3],[5,1],[9,2],[7,2],[5,2],[4,2],[2,4],
   [4,3],[4,1],[7,2],[5,2],[4,2],[2,2],[0,4],
   [5,3],[5,1],[9,2],[12,2],[11,2],[9,2],[7,4],
   [14,2],[12,2],[11,2],[9,2],[7,2],[5,2],[4,2],[2,2],
   [7,2],[4,2],[0,2],[4,2],[7,2],[9,2],[7,4],
   [5,2],[4,2],[2,2],[4,2],[5,2],[7,2],[4,4],
   [7,2],[4,2],[0,2],[4,2],[7,2],[9,2],[12,4],
   [9,2],[7,2],[5,2],[2,2],[4,2],[5,2],[0,4],
   [-1,16],[-1,16],[-1,16],[-1,16],[-1,16],[-1,16],[-1,16],[-1,16]
  ]
 },
 night: {
  bpm:72, swing:0, base:440, bassBase:110,
  lead:'triangle', vol:0.036, vib:true, melSend:0.5, drums:null, comp:'roll', bassStyle:'long',
  chords:[[0,'m'],[-2,'M'],[0,'m'],[5,'M'], [3,'M'],[-2,'M'],[-4,'M'],[0,'m']],
  mel:[
   [7,4],[5,2],[3,2],[5,4],[0,4],
   [3,4],[2,2],[0,2],[2,8],
   [7,4],[5,2],[3,2],[5,4],[9,4],
   [7,2],[5,2],[3,2],[2,2],[0,8],
   [12,4],[10,2],[7,2],[10,4],[7,4],
   [5,4],[3,2],[2,2],[3,8],
   [7,4],[9,4],[10,2],[9,2],[7,4],
   [5,2],[3,2],[2,2],[3,2],[0,8]
  ]
 },
 rain: {
  bpm:100, swing:0, base:261.63, bassBase:65.41,
  lead:'p125', vol:0.024, vib:true, melSend:0.45, drums:'rain', comp:'weave', bassStyle:'long',
  chords:[[0,'M7'],[5,'M7'],[0,'M7'],[5,'M7'], [-3,'m7'],[5,'M7'],[-5,'7'],[0,'M7']],
  mel:[
   [-1,16],
   [16,4],[14,4],[12,8],
   [-1,16],
   [11,4],[12,4],[7,8],
   [-1,16],
   [14,4],[16,4],[19,4],[16,4],
   [-1,16],
   [12,4],[11,4],[12,8]
  ]
 },
 battle: {
  bpm:168, swing:0, base:440, bassBase:110,
  lead:'p25', vol:0.04, melSend:0.12, drums:'battle', comp:'dark', bassStyle:'drive',
  chords:[[0,'m'],[0,'m'],[-4,'M'],[-2,'M'], [0,'m'],[0,'m'],[-4,'M'],[-2,'M']],
  mel:[
   [12,2],[-1,2],[12,2],[15,2],[12,2],[-1,2],[10,2],[12,2],
   [7,2],[-1,2],[7,2],[10,2],[12,2],[10,2],[7,2],[5,2],
   [8,2],[-1,2],[8,2],[12,2],[8,2],[-1,2],[7,2],[8,2],
   [10,2],[-1,2],[10,2],[14,2],[15,2],[14,2],[10,2],[7,2],
   [12,2],[-1,2],[12,2],[15,2],[17,2],[15,2],[12,2],[10,2],
   [12,2],[10,2],[8,2],[10,2],[12,2],[15,2],[12,2],[10,2],
   [8,4],[12,4],[15,4],[19,4],
   [14,2],[15,2],[14,2],[12,2],[10,2],[8,2],[7,2],[5,2]
  ]
 }
};
function compileSong(S){
  if(S.melAt) return;
  S.total = 0;
  for(const n of S.mel) S.total += n[1];
  S.melAt = new Array(S.total).fill(null);
  let pos = 0;
  for(const n of S.mel){ S.melAt[pos] = n; pos += n[1]; }
}
let curSong = null, songStep = 0, stepT = 0, MUSIC_HOLD = 0;
/* silencia la banda sonora un rato (preescuchas, jingles): así no se mezclan */
function holdMusic(ms){ MUSIC_HOLD = performance.now() + ms; curSong = null; }
function pickSong(){
  if(UI.mode==='battle') return 'battle';
  if(dayPhase()==='night') return 'night';
  if(typeof WEATHER!=='undefined' && WEATHER.kind==='rain') return 'rain';
  return 'day';
}
function chordAt(S, bar){ return S.chords[bar % S.chords.length]; }
function schedBass(S, bar, pos, t, spb){
  const ch = chordAt(S, bar), r = ch[0]-12;
  const nxt = chordAt(S, bar+1)[0]-12;
  const bv = S.vol*1.2;
  if(S.bassStyle==='long'){
    if(pos===0) tone({f:NOTE(S.bassBase, r+12), at:t, d:spb*11, type:'triangle', vol:bv});
    if(pos===12) tone({f:NOTE(S.bassBase, r+19), at:t, d:spb*3.6, type:'triangle', vol:bv*0.85});
  } else if(S.bassStyle==='drive'){
    if(pos%2===0){
      let n = r;
      if(pos===6) n = r+12;
      if(pos===14) n = nxt + (nxt>r? -1 : 1);
      tone({f:NOTE(S.bassBase, n+12), at:t, d:spb*1.7, type:'triangle', vol:bv});
    }
  } else {
    if(pos===0)  tone({f:NOTE(S.bassBase, r+12), at:t, d:spb*2.6, type:'triangle', vol:bv});
    if(pos===4)  tone({f:NOTE(S.bassBase, r+19), at:t, d:spb*2.6, type:'triangle', vol:bv*0.9});
    if(pos===8)  tone({f:NOTE(S.bassBase, r+24), at:t, d:spb*2.6, type:'triangle', vol:bv*0.9});
    if(pos===12) tone({f:NOTE(S.bassBase, r+19), at:t, d:spb*1.6, type:'triangle', vol:bv*0.85});
    if(pos===14) tone({f:NOTE(S.bassBase, nxt+11), at:t, d:spb*1.6, type:'triangle', vol:bv*0.8});
  }
}
/* voz interior: guide-tones (3as y 7as del acorde), calida y con vibrato */
function schedHar(S, bar, pos, t, spb){
  if(!S.har || pos!==0) return;
  const ch = chordAt(S, bar);
  const iv = QUAL[ch[1]];
  const third = ch[0] + iv[1];
  tone({f:NOTE(S.base, third), at:t, d:spb*13, type:'p125', vol:0.017, vib:true, vibDepth:0.008, send:0.3});
}
/* acompañamiento por estilo */
function schedComp(S, bar, pos, t, spb){
  const ch = chordAt(S, bar);
  const iv = QUAL[ch[1]];
  if(S.comp==='stab'){
    if(pos===2||pos===6||pos===10||pos===14){
      tone({f:NOTE(S.base, ch[0]+iv[1]+12), at:t, d:spb*0.9, type:'p25', vol:0.016});
      tone({f:NOTE(S.base, ch[0]+iv[2]+12), at:t, d:spb*0.9, type:'p25', vol:0.014});
    }
  } else if(S.comp==='roll'){
    if(pos===0 && bar%2===0){
      [iv[0], iv[2], iv[1]+12].forEach((sv,i)=>
        tone({f:NOTE(S.base, ch[0]+sv), at:t+i*spb*0.5, d:spb*3, type:'p125', vol:0.019, send:0.5}));
    }
  } else if(S.comp==='weave'){
    const seq = [iv[0], iv[2], iv[3]!==undefined?iv[3]:iv[1]+12, 12+iv[0]];
    if(pos%4===0) tone({f:NOTE(S.base, ch[0]+seq[pos/4]), at:t, d:spb*3.4, type:'triangle', vol:0.024});
    if(pos%4===2) tone({f:NOTE(S.base, ch[0]+seq[(pos-2)/4]+12), at:t, d:spb*2.4, type:'p125', vol:0.013, send:0.45});
  } else if(S.comp==='dark'){
    if(pos===4||pos===12){
      tone({f:NOTE(S.base, ch[0]+iv[1]+12), at:t, d:spb*0.8, type:'p25', vol:0.02});
      const sev = iv[3]!==undefined ? iv[3] : 10;
      tone({f:NOTE(S.base, ch[0]+sev+12), at:t, d:spb*0.8, type:'p25', vol:0.016});
    }
  }
}
function schedDrums(kind, pos, t, bar){
  if(!kind) return;
  const fill = (kind==='day'||kind==='battle') && bar%4===3 && pos>=12;
  if(fill){
    if(pos===12) nz(t, 0.05, 0.035, 1700, 1);
    if(pos===13) nz(t, 0.05, 0.042, 2100, 1);
    if(pos===14) nz(t, 0.05, 0.05, 2500, 1);
    if(pos===15) kick(t, kind==='battle'?0.09:0.07);
    return;
  }
  if(kind==='day'){
    if(pos===0||pos===8) kick(t, 0.06);
    if(pos===4||pos===12) nz(t, 0.06, 0.045, 1700, 1);
    if(pos%2===0) nz(t, 0.03, pos%4? 0.011:0.017, 8500, 3);
  } else if(kind==='battle'){
    if(pos===0||pos===8||pos===10) kick(t, 0.085);
    if(pos===4||pos===12) nz(t, 0.07, 0.055, 1900, 1);
    if(pos%2===0) nz(t, 0.028, 0.011, 9000, 3);
  } else if(kind==='rain'){
    if(pos===6) tone({f:1680, at:t, d:0.05, type:'p125', vol:0.016, send:0.4});
    if(pos===13) tone({f:1980, at:t, d:0.05, type:'p125', vol:0.013, send:0.4});
  }
}
setInterval(()=>{
  if(!AC || (G && G.muted)) { curSong=null; return; }
  if(['boot','evolve','hatch','ascendFX','mgDance','mgSimon'].includes(UI.mode) ||
     performance.now() < MUSIC_HOLD){ curSong=null; return; }
  const want = pickSong();
  if(want !== curSong){
    curSong = want; songStep = 0;
    stepT = AC.currentTime + 0.25;
    compileSong(SONGS[want]);
    bus();
  }
  const S = SONGS[curSong];
  const spb = 60/S.bpm/4;
  while(stepT < AC.currentTime + 0.5){
    const st = songStep % S.total;
    const bar = Math.floor(st/16), pos = st%16;
    const t = stepT + ((pos%2===1)? spb*S.swing : 0);
    const mn = S.melAt[st];
    if(mn && mn[0]>=0){
      const accent = pos===0 ? 1.08 : (pos===8 ? 1.04 : 1);
      const gate = mn[1]<=2 ? 0.8 : 0.95;
      tone({f:NOTE(S.base, mn[0]), at:t, d:mn[1]*spb*gate, type:S.lead,
            vol:S.vol*accent, vib:(S.vib||mn[1]>=6) && mn[1]>=4, send:S.melSend});
    }
    schedBass(S, bar, pos, t, spb);
    schedHar(S, bar, pos, t, spb);
    schedComp(S, bar, pos, t, spb);
    schedDrums(S.drums, pos, t, bar);
    songStep++; stepT += spb;
  }
}, 110);
