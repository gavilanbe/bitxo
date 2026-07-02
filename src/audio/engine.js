"use strict";
/* =========================================================
   BITXO — audio/engine: pulsos NES, bus con delay, ruido y percusión
   ========================================================= */
/* ============ AUDIO v11: pulsos NES, bus de delay, arreglo completo ============ */
let AC = null;
function audio(){ if(!AC){ try{ AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } return AC; }
function NOTE(base, semi){ return base * Math.pow(2, semi/12); }

/* bus maestro + delay con feedback filtrado (el "aire") */
function bus(){
  const a = audio(); if(!a) return null;
  if(!a._master){
    const m = a.createGain(); m.gain.value = 0.9; m.connect(a.destination);
    const d = a.createDelay(1); d.delayTime.value = 0.23;
    const fb = a.createGain(); fb.gain.value = 0.34;
    const lp = a.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value = 2300;
    d.connect(fb); fb.connect(lp); lp.connect(d);
    d.connect(m);
    a._master = m; a._delay = d;
  }
  return a;
}
/* ondas de pulso NES (duty 12.5% / 25%) por serie de Fourier */
function pulseWave(a, duty){
  const n = 32, real = new Float32Array(n), imag = new Float32Array(n);
  for(let k=1;k<n;k++) imag[k] = (2/(k*Math.PI)) * Math.sin(Math.PI*k*duty);
  return a.createPeriodicWave(real, imag);
}
function setTimbre(a, osc, type){
  if(type==='p25'){ if(!a._p25) a._p25 = pulseWave(a, 0.25); osc.setPeriodicWave(a._p25); }
  else if(type==='p125'){ if(!a._p125) a._p125 = pulseWave(a, 0.125); osc.setPeriodicWave(a._p125); }
  else osc.type = type || 'square';
}
function noiseBuf(){
  const a = audio(); if(!a) return null;
  if(!a._nb){
    const b = a.createBuffer(1, Math.floor(a.sampleRate*0.5), a.sampleRate);
    const d = b.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    a._nb = b;
  }
  return a._nb;
}
/* tono: envolvente, glissando, vibrato, send al delay */
function tone(o){
  const a = bus(); if(!a || (G && G.muted)) return;
  const t = o.at!==undefined ? o.at : a.currentTime;
  const d = o.d || 0.1;
  const osc = a.createOscillator(), g = a.createGain();
  setTimbre(a, osc, o.type);
  osc.frequency.setValueAtTime(Math.max(20,o.f), t);
  if(o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20,o.slide), t+d);
  if(o.vib){
    const l = a.createOscillator(), lg = a.createGain();
    l.type='sine'; l.frequency.value = 5.3;
    lg.gain.value = o.f * (o.vibDepth||0.013);
    l.connect(lg); lg.connect(osc.frequency);
    l.start(t+0.07); l.stop(t+d+0.05);
  }
  const v = o.vol||0.05;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(v, t+0.007);
  g.gain.exponentialRampToValueAtTime(0.0001, t+d);
  osc.connect(g); g.connect(a._master);
  if(o.send){
    const sg = a.createGain(); sg.gain.value = o.send;
    g.connect(sg); sg.connect(a._delay);
  }
  osc.start(t); osc.stop(t+d+0.03);
}
/* ruido filtrado con barrido opcional del filtro */
function nz(at, d, vol, f1, q, f2){
  const a = bus(); if(!a || (G && G.muted)) return;
  const t = at!==undefined ? at : a.currentTime;
  const src = a.createBufferSource(); src.buffer = noiseBuf(); src.loop = true;
  const f = a.createBiquadFilter(); f.type='bandpass';
  f.frequency.setValueAtTime(f1||4000, t);
  if(f2) f.frequency.exponentialRampToValueAtTime(f2, t+d);
  f.Q.value = q||1;
  const g = a.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t+d);
  src.connect(f); f.connect(g); g.connect(a._master);
  src.start(t); src.stop(t+d+0.02);
}
function kick(at, vol){
  const a = bus(); if(!a || (G && G.muted)) return;
  const t = at!==undefined ? at : a.currentTime;
  const o = a.createOscillator(), g = a.createGain();
  o.type='sine';
  o.frequency.setValueAtTime(160, t);
  o.frequency.exponentialRampToValueAtTime(38, t+0.1);
  g.gain.setValueAtTime(vol||0.09, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t+0.12);
  o.connect(g); g.connect(a._master);
  o.start(t); o.stop(t+0.14);
}
function beep(freq, dur, when, type, vol){
  const a = audio(); if(!a) return;
  tone({f:freq, at:a.currentTime+(when||0), d:dur, type:type||'square', vol:vol===undefined?0.06:vol});
}
function sfxAt(off){ const a = audio(); return a ? a.currentTime + off : 0; }
