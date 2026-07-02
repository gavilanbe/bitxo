"use strict";
/* =========================================================
   BITXO — audio/ambience: pájaros, grillos, lechuza, lluvia y viento
   ========================================================= */
/* ------ ambiente diegetico: pajaros, grillos, lechuza, lluvia y viento ------ */
const AMB = {rain:null, wind:null};
let birdNext=0, cricketNext=0, owlNext=0;
function startBed(id, freq, q, vol, lfo){
  const a = bus(); if(!a || AMB[id]) return;
  const src = a.createBufferSource(); src.buffer = noiseBuf(); src.loop = true;
  const f = a.createBiquadFilter();
  f.type = id==='rain' ? 'lowpass' : 'bandpass';
  f.frequency.value = freq; f.Q.value = q;
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, a.currentTime);
  g.gain.linearRampToValueAtTime(vol, a.currentTime+1.6);
  src.connect(f); f.connect(g); g.connect(a._master);
  let l = null;
  if(lfo){
    l = a.createOscillator(); l.frequency.value = 0.13;
    const lg = a.createGain(); lg.gain.value = vol*0.45;
    l.connect(lg); lg.connect(g.gain); l.start();
  }
  src.start();
  AMB[id] = {src, g, l};
}
function stopBed(id){
  const b = AMB[id]; if(!b || !AC) return;
  try{
    b.g.gain.linearRampToValueAtTime(0.0001, AC.currentTime+1.2);
    b.src.stop(AC.currentTime+1.4);
    if(b.l) b.l.stop(AC.currentTime+1.4);
  }catch(e){}
  AMB[id] = null;
}
function ambBird(){
  const f0 = 2300 + Math.random()*900;
  const n = 2 + Math.floor(Math.random()*3);
  for(let i=0;i<n;i++){
    tone({f:f0*(1+Math.random()*0.12), slide:f0*0.82, d:0.06, type:'p125',
          vol:0.01+Math.random()*0.007, at:sfxAt(i*0.09), send:0.35});
  }
}
function ambCrickets(){
  for(let i=0;i<3;i++) tone({f:4300, d:0.025, type:'triangle', vol:0.007, at:sfxAt(i*0.07)});
}
function ambOwl(){
  tone({f:392, slide:330, d:0.3, type:'triangle', vol:0.017, send:0.5});
  tone({f:330, slide:294, d:0.4, type:'triangle', vol:0.015, at:sfxAt(0.42), send:0.5});
}
setInterval(()=>{
  if(!AC) return;
  const quiet = (G && G.muted) || ['boot','battle','mgDance','mgSimon','evolve','hatch','ascendFX'].includes(UI.mode);
  const wk = (typeof WEATHER!=='undefined') ? WEATHER.kind : 'clear';
  if(quiet || wk!=='rain') stopBed('rain'); else startBed('rain', 950, 0.6, 0.014);
  if(quiet || wk!=='wind') stopBed('wind'); else startBed('wind', 420, 0.5, 0.012, true);
  if(quiet) return;
  const now = performance.now();
  const ph = dayPhase();
  if(ph==='day' || ph==='dawn'){
    if(now>birdNext){ ambBird(); birdNext = now + (ph==='dawn'?2500:4200) + Math.random()*6000; }
  } else if(ph==='night'){
    if(now>cricketNext){ ambCrickets(); cricketNext = now + 1100 + Math.random()*1600; }
    if(now>owlNext){ if(Math.random()<0.25) ambOwl(); owlNext = now + 15000 + Math.random()*20000; }
  } else if(ph==='dusk'){
    if(now>cricketNext){ ambCrickets(); cricketNext = now + 2300 + Math.random()*2600; }
  }
}, 300);
