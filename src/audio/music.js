"use strict";
/* =========================================================
   BITXO — audio/music: el TEMA DE BITXO y su vida en el prado
   Una sola melodía memorable (16 compases) que suena en todas partes
   con arreglos distintos: kalimba al alba, flauta y marimba de día,
   cajita de música de noche, menor y rápida en combate, chiptune en la
   sala de juegos. En el prado no suena sin parar: canción → ambiente →
   tu bitxo la TARAREA desde donde está (con notas ♪ y panorama) → vuelve.
   ========================================================= */

/* ---- el tema: [semitono sobre la tónica, corcheas]; -1 = silencio ---- */
const THEME = {
  A: [[7,2],[4,1],[7,1],[12,3],[11,1],  [9,2],[7,2],[4,4],
      [5,2],[4,1],[5,1],[9,3],[7,1],    [4,2],[2,6],
      [7,2],[4,1],[7,1],[12,3],[14,1],  [16,2],[14,1],[12,1],[9,4],
      [11,2],[9,1],[7,1],[5,2],[2,2],   [0,6],[-1,2]],
  B: [[9,3],[7,1],[5,2],[4,2],          [2,2],[4,2],[5,4],
      [9,3],[7,1],[9,2],[12,2],         [11,6],[-1,2],
      [9,3],[7,1],[5,2],[2,2],          [5,2],[4,2],[2,4],
      [4,3],[7,1],[12,2],[9,2],         [11,4],[7,2],[-1,2]],
  /* un acorde por compás: [raíz, calidad] */
  chA: [[0,'M'],[9,'m'],[5,'M'],[7,'M'],[0,'M'],[9,'m'],[7,'7'],[0,'M']],
  chB: [[5,'M'],[7,'M'],[9,'m'],[7,'M'],[2,'m'],[7,'7'],[9,'m'],[7,'7']]
};
const QUAL = { M:[0,4,7], m:[0,3,7], '7':[0,4,7,10], M7:[0,4,7,11], m7:[0,3,7,10] };
/* versión menor para el combate: 3ª, 6ª y 7ª bajan */
const MINOR_MAP = {4:3, 9:8, 11:10, 16:15, 21:20, 23:22};
function toMinor(s){ const o = ((s%12)+12)%12, b = s-o; return b + (MINOR_MAP[o]!==undefined ? MINOR_MAP[o] : o); }

/* ---- arreglos ---- */
const ARR = {
  dawn:  {bpm:84,  key:349.23, lead:'kalimba',  comp:'pad',     bass:'pluck', drums:null,     form:['A','B'],        swing:0.08},
  day:   {bpm:96,  key:261.63, lead:'flute',    comp:'marimba', bass:'pluck', drums:'soft',   form:['A','A','B','A'], swing:0.12},
  park:  {bpm:104, key:293.66, lead:'flute',    comp:'marimba', bass:'pluck', drums:'band',   form:['A','B','A'],     swing:0.14},
  huerta:{bpm:90,  key:246.94, lead:'whistle',  comp:'guitar',  bass:'pluck', drums:'soft',   form:['A','B','A'],     swing:0.18},
  dusk:  {bpm:80,  key:311.13, lead:'musicbox', comp:'arp',     bass:'pluck', drums:null,     form:['A','B'],        swing:0},
  night: {bpm:66,  key:233.08, lead:'musicbox', comp:'pad',     bass:null,    drums:null,     form:['A','B'],        swing:0, soft:true},
  lull:  {bpm:58,  key:233.08, lead:'musicbox', comp:'pad',     bass:null,    drums:null,     form:['A'],            swing:0, soft:true},
  rain:  {bpm:78,  key:293.66, lead:'kalimba',  comp:'pad7',    bass:'pluck', drums:null,     form:['A','B'],        swing:0},
  battle:{bpm:150, key:220.00, lead:'chip',     comp:'stab',    bass:'drive', drums:'battle', form:['A','B'],        swing:0, minor:true, loop:true},
  arcade:{bpm:132, key:392.00, lead:'chip',     comp:'stab',    bass:'drive', drums:'arcade', form:['A','A','B','A'], swing:0, loop:true}
};
/* compila un arreglo a una lista de eventos por corchea */
function buildSong(name){
  const R = ARR[name];
  if(R.ev) return R;
  const mel = [], chords = [];
  let t = 0;
  for(const sec of R.form){
    for(const n of THEME[sec]){ mel.push({at:t, s:n[0], d:n[1]}); t += n[1]; }
    for(const c of THEME[sec==='A' ? 'chA' : 'chB']) chords.push(c);
  }
  R.ev = mel; R.chords = chords; R.len = t;
  R.byStep = new Array(t).fill(null);
  for(const m of mel) R.byStep[m.at] = m;
  return R;
}

/* ---- instrumentos con reverb, filtro cálido y panorama ---- */
function musBus(){
  const a = bus(); if(!a) return null;
  if(!a._mus){
    const g = a.createGain(); g.gain.value = 0.3;           /* la música, por debajo de los efectos */
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200; lp.Q.value = 0.4;
    g.connect(lp); lp.connect(a._master);
    /* reverb de sala generada (sin samples) */
    const len = Math.floor(a.sampleRate*2.2), ir = a.createBuffer(2, len, a.sampleRate);
    for(let c=0;c<2;c++){ const d = ir.getChannelData(c); for(let i=0;i<len;i++) d[i] = (Math.random()*2-1)*Math.pow(1-i/len, 3.2); }
    const cv = a.createConvolver(); cv.buffer = ir;
    const wet = a.createGain(); wet.gain.value = 0.32;
    cv.connect(wet); wet.connect(lp);
    a._mus = g; a._musRev = cv; a._musLP = lp;
  }
  return a;
}
/* nota musical genérica: osciladores → envolvente → (pan) → bus de música + reverb */
function mnote(o){
  const a = musBus(); if(!a || (G && G.muted)) return;
  const t = o.at, d = o.d, f = o.f;
  const g = a.createGain();
  let out = g;
  if(a.createStereoPanner && o.pan){ const p = a.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, o.pan)); g.connect(p); out = p; }
  out.connect(a._mus);
  if(o.rev){ const s = a.createGain(); s.gain.value = o.rev; out.connect(s); s.connect(a._musRev); }
  const v = o.vol;
  const env = o.env || 'pluck';
  g.gain.setValueAtTime(0.0001, t);
  if(env==='pluck'){ g.gain.linearRampToValueAtTime(v, t+0.006); g.gain.exponentialRampToValueAtTime(0.0001, t+d); }
  else if(env==='swell'){ g.gain.linearRampToValueAtTime(v, t+Math.min(0.5, d*0.35)); g.gain.linearRampToValueAtTime(v*0.7, t+d*0.8); g.gain.exponentialRampToValueAtTime(0.0001, t+d+0.25); }
  else { /* breath: soplo suave */ g.gain.linearRampToValueAtTime(v, t+0.05); g.gain.setValueAtTime(v*0.85, t+Math.max(0.06, d-0.08)); g.gain.exponentialRampToValueAtTime(0.0001, t+d+0.12); }
  for(const p of o.parts){
    const osc = a.createOscillator();
    if(p.type==='p25' || p.type==='p125') setTimbre(a, osc, p.type); else osc.type = p.type||'sine';
    osc.frequency.setValueAtTime(f*(p.m||1), t);
    if(o.glide) { osc.frequency.setValueAtTime(f*(p.m||1)*o.glide, t); osc.frequency.exponentialRampToValueAtTime(f*(p.m||1), t+0.06); }
    let src = osc;
    if(p.g!==undefined || p.decay){
      const pg = a.createGain(); pg.gain.setValueAtTime(p.g!==undefined?p.g:1, t);
      if(p.decay) pg.gain.exponentialRampToValueAtTime(0.0001, t+p.decay);
      osc.connect(pg); src = pg;
    }
    if(o.vib){
      const l = a.createOscillator(), lg = a.createGain();
      l.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f*0.011, t+0.25);
      l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t+d+0.3);
    }
    src.connect(g);
    osc.start(t); osc.stop(t+d+0.35);
  }
  if(o.breath){
    const n = a.createBufferSource(); n.buffer = noiseBuf(); n.loop = true;
    const bf = a.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = f*2; bf.Q.value = 2.5;
    const bg = a.createGain(); bg.gain.setValueAtTime(o.breath*v, t); bg.gain.exponentialRampToValueAtTime(0.0001, t+0.12);
    n.connect(bf); bf.connect(bg); bg.connect(g); n.start(t); n.stop(t+0.15);
  }
}
/* timbres: parciales y envolventes */
const INST = {
  kalimba: (f,t,d,v,pan)=>mnote({f,at:t,d:Math.max(0.5,d*1.4),vol:v,pan,rev:0.35,parts:[{type:'sine'},{type:'sine',m:3.01,g:0.25,decay:0.12},{type:'triangle',m:2,g:0.08}]}),
  flute:   (f,t,d,v,pan)=>mnote({f,at:t,d,vol:v*0.9,pan,rev:0.3,env:'breath',vib:d>0.3,breath:0.35,parts:[{type:'triangle'},{type:'sine',m:2,g:0.12}]}),
  whistle: (f,t,d,v,pan)=>mnote({f:f*2,at:t,d,vol:v*0.6,pan,rev:0.25,env:'breath',vib:true,glide:0.97,parts:[{type:'sine'}]}),
  musicbox:(f,t,d,v,pan)=>mnote({f:f*2,at:t,d:1.1,vol:v*0.8,pan,rev:0.45,parts:[{type:'sine'},{type:'sine',m:4.2,g:0.18,decay:0.18},{type:'sine',m:2.0,g:0.1}]}),
  marimba: (f,t,d,v,pan)=>mnote({f,at:t,d:0.32,vol:v,pan,rev:0.2,parts:[{type:'sine'},{type:'sine',m:3.9,g:0.3,decay:0.05},{type:'sine',m:10,g:0.05,decay:0.02}]}),
  guitar:  (f,t,d,v,pan)=>mnote({f,at:t,d:0.6,vol:v,pan,rev:0.2,parts:[{type:'triangle'},{type:'sawtooth',g:0.08,decay:0.08},{type:'sine',m:2,g:0.2}]}),
  pad:     (f,t,d,v,pan)=>mnote({f,at:t,d,vol:v,pan,rev:0.5,env:'swell',parts:[{type:'triangle'},{type:'triangle',m:1.004},{type:'sine',m:2,g:0.2}]}),
  pluck:   (f,t,d,v,pan)=>mnote({f,at:t,d:Math.min(0.9,d),vol:v,pan,rev:0.08,parts:[{type:'triangle'},{type:'sine',m:0.5,g:0.6}]}),
  chip:    (f,t,d,v,pan)=>mnote({f,at:t,d,vol:v*0.55,pan,rev:0.12,env:'breath',vib:d>0.3,parts:[{type:'p25'}]}),
  chipb:   (f,t,d,v,pan)=>mnote({f,at:t,d,vol:v*0.8,pan,rev:0.02,env:'breath',parts:[{type:'triangle'}]}),
  stab:    (f,t,d,v,pan)=>mnote({f,at:t,d:0.12,vol:v*0.4,pan,rev:0.1,parts:[{type:'p125'}]})
};
/* batería suave o de banda */
function mdrum(kind, pos, t, bar, spb){
  const a = musBus(); if(!a) return;
  if(kind==='soft'){
    if(pos===0 || pos===4) kick(t, 0.0175);
    if(pos%2===1) nz(t, 0.025, 0.003, 9000, 3);
    if(pos===2 || pos===6) nz(t, 0.05, 0.006, 3200, 0.8);
  } else if(kind==='band'){
    if(pos===0 || pos===3 || pos===4) kick(t, 0.0225);
    if(pos===2 || pos===6) nz(t, 0.07, 0.01, 1800, 1);
    nz(t, 0.02, pos%2 ? 0.006 : 0.01, 9000, 3);
  } else if(kind==='battle' || kind==='arcade'){
    const fill = bar%4===3 && pos>=6;
    if(fill){ nz(t, 0.05, 0.015+pos*0.0015, 1600+pos*150, 1); return; }
    if(pos===0 || pos===4 || (kind==='battle' && pos===5)) kick(t, 0.0375);
    if(pos===2 || pos===6) nz(t, 0.07, 0.0225, 1900, 1);
    nz(t, 0.022, 0.004, 9000, 3);
  }
}

/* ---- el director: qué suena, cuándo calla y cuándo tararea el bitxo ---- */
let MUSIC_HOLD = 0;
/* silencia la música un rato (preescuchas, jingles): así no se mezclan */
function holdMusic(ms){ MUSIC_HOLD = Math.max(MUSIC_HOLD, performance.now() + ms); MUS.paused = true; }
const MUS = {song:null, step:0, stepT:0, state:'intro', until:0, hum:null};
function worldArrangement(){
  const p = G && G.pets[G.sel];
  if(p && p.sleeping) return 'lull';
  const ph = dayPhase();
  if(ph==='night') return 'night';
  if(typeof WEATHER!=='undefined' && WEATHER.kind==='rain') return 'rain';
  if(ph==='dawn') return 'dawn';
  if(ph==='dusk') return 'dusk';
  if(G && G.zone==='parque') return 'park';
  if(G && G.zone==='huerta') return 'huerta';
  return 'day';
}
function wantSong(){
  if(UI.mode==='battle') return 'battle';
  if(UI.mode==='train') return 'park';
  if(UI.mode && UI.mode.startsWith('mg')) return 'arcade';
  return null; /* el mundo tiene su propio ciclo */
}
function startSong(name){
  MUS.song = name; MUS.step = 0; MUS.stepT = AC.currentTime + 0.2;
  buildSong(name);
}
/* un paso de corchea de la canción actual */
function schedStep(R, st, t, spb){
  const bar = Math.floor(st/8), pos = st%8;
  const ch = R.chords[bar % R.chords.length];
  const q = QUAL[R.comp==='pad7' ? (ch[1]==='m'?'m7':'M7') : ch[1]];
  const root = R.minor ? toMinor(ch[0]) : ch[0];
  const qq = R.minor ? q.map(i=>i===4?3:i) : q;
  const ev = R.byStep[st];
  const vol = R.soft ? 0.05 : 0.07;
  if(ev && ev.s>=0){
    const s = R.minor ? toMinor(ev.s) : ev.s;
    INST[R.lead](NOTE(R.key, s), t, ev.d*spb*0.95, vol, 0);
    /* dúo a la tercera en la vuelta final: más cuerpo sin cansar */
    if(R.form.length>2 && st >= R.len - 64 && ev.d>=2 && !R.soft) INST[R.lead](NOTE(R.key, s-(s%12>=7?4:3)), t, ev.d*spb*0.9, vol*0.35, 0.25);
  }
  /* acompañamiento */
  if(R.comp==='marimba'){ if(pos===2||pos===6) for(const i of [qq[1],qq[2]]) INST.marimba(NOTE(R.key, root+i), t, spb, 0.03, -0.3); }
  else if(R.comp==='guitar'){ if(pos===0||pos===3||pos===6) qq.slice(0,3).forEach((i,k)=>INST.guitar(NOTE(R.key/2, root+i+12), t+k*0.018, spb*2, 0.022, -0.35)); }
  else if(R.comp==='arp'){ const seq=[0,1,2,1]; INST.musicbox(NOTE(R.key/2, root+qq[seq[pos%4]]), t, spb, 0.022, (pos%2?0.4:-0.4)); }
  else if(R.comp==='pad' || R.comp==='pad7'){ if(pos===0) for(const i of qq) INST.pad(NOTE(R.key/2, root+i), t, spb*8, R.soft?0.012:0.016, 0); }
  else if(R.comp==='stab'){ if(pos===2||pos===6) for(const i of [qq[1],qq[2]]) INST.stab(NOTE(R.key, root+i), t, spb, 0.05, 0); }
  /* bajo */
  if(R.bass==='pluck'){ if(pos===0) INST.pluck(NOTE(R.key/4, root), t, spb*3.5, 0.08, 0); if(pos===4) INST.pluck(NOTE(R.key/4, root+7), t, spb*3, 0.06, 0); }
  else if(R.bass==='drive'){ const n = pos===6 ? root+12 : (pos===7 ? root+7 : root); INST.chipb(NOTE(R.key/4, n), t, spb*0.85, 0.09, 0); }
  if(R.drums) mdrum(R.drums, pos, t, bar, spb);
}
/* el bitxo tararea el tema desde donde está: ♪ y panorama */
function startHum(){
  const p = G.pets[G.sel];
  if(!p || p.stage===STAGES.EGG || p.sleeping || p.exped || (p.zone||'prado')!==G.zone) return false;
  const friend = G.pets.find(q=>q!==p && q.stage>STAGES.EGG && !q.sleeping && !q.exped && (q.zone||'prado')===G.zone);
  /* el registro depende de la etapa; la línea da el timbre */
  const reg = [0, 523.25, 440, 349.23][p.stage] || 440;
  MUS.hum = {p, friend, i:0, t:AC.currentTime + 0.3, reg, spb:60/92/2, notes:THEME.A};
  return true;
}
function humTick(){
  const h = MUS.hum; if(!h) return false;
  while(h.i < h.notes.length && h.t < AC.currentTime + 0.4){
    const n = h.notes[h.i];
    if(n[0]>=0){
      const pan = ((h.p.rx||80)-80)/80;
      const inst = h.p.line==='astro' || h.p.line==='marea' ? 'whistle' : (h.p.line==='voltio' || h.p.line==='brasa' ? 'chip' : 'flute');
      INST[inst](NOTE(h.reg, n[0]), h.t, n[1]*h.spb*0.9, 0.06, pan);
      /* segunda voz: el amigo entra en la segunda mitad, una tercera por debajo */
      if(h.friend && h.i >= 14 && n[1]>=2) INST.whistle(NOTE(h.reg, n[0]-(n[0]%12>=7?4:3)), h.t, n[1]*h.spb*0.85, 0.035, ((h.friend.rx||80)-80)/80);
      /* la nota se VE: sale del bitxo cuando suena */
      const delay = Math.max(0, (h.t - AC.currentTime)*1000);
      const hp = h.p, fr = h.friend && h.i>=14 && n[1]>=2 ? h.friend : null;
      setTimeout(()=>{
        if(sceneFamily(UI.mode)!=='world') return;
        if((hp.zone||'prado')===G.zone) fx({x:hp.rx+(hp.dir||1)*5, y:136, vx:(Math.random()-0.5)*0.01, vy:-0.022, life:1100, kind:'txt', s:'♪', col:['#ffd94a','#f2a2b8','#9adcf0'][n[0]%3], wob:Math.random()*6});
        if(fr && (fr.zone||'prado')===G.zone) fx({x:fr.rx, y:138, vy:-0.02, life:900, kind:'txt', s:'♪', col:'#bde8a8'});
        if(hp.stage>STAGES.EGG) hp.petT = performance.now();
      }, delay);
    }
    h.t += n[1]*h.spb; h.i++;
  }
  return h.i < h.notes.length || h.t > AC.currentTime;
}

setInterval(()=>{
  if(!AC || (G && G.muted) || !G){ MUS.song = null; return; }
  const now = performance.now();
  if(['boot','evolve','hatch','ascendFX','mgDance','mgSimon'].includes(UI.mode)){
    MUS.song = null; MUS.hum = null; return;
  }
  /* una fanfarria o una preescucha: la canción espera y luego SIGUE donde iba */
  if(now < MUSIC_HOLD){ MUS.paused = true; return; }
  if(MUS.paused){ MUS.paused = false; MUS.stepT = AC.currentTime + 0.15; }
  const forced = wantSong();
  let want = forced;
  if(!forced){
    /* ciclo del mundo: canción → respiro de ambiente → tarareo → respiro → canción */
    if(MUS.state==='intro'){ MUS.state = 'song'; MUS.worldSong = worldArrangement(); }
    if(MUS.state==='song'){
      /* si cambia la hora, el tiempo o se duerme, el arreglo cambia al acabar la frase */
      want = MUS.worldSong;
      const R = ARR[want]; buildSong(want);
      if(MUS.song===want && MUS.step >= R.len){ MUS.state = 'rest'; MUS.until = now + 40000 + Math.random()*40000; MUS.next = 'hum'; want = null; }
    } else if(MUS.state==='rest'){
      want = null;
      if(worldArrangement()==='lull' && !MUS.lulled){ MUS.lulled = true; MUS.state='song'; MUS.worldSong='lull'; }
      else if(now > MUS.until){
        if(MUS.next==='hum' && sceneFamily(UI.mode)==='world' && startHum()){ MUS.state = 'hum'; }
        else { MUS.state = 'song'; MUS.worldSong = worldArrangement(); MUS.lulled = MUS.worldSong==='lull'; }
      }
    } else if(MUS.state==='hum'){
      want = null;
      if(!humTick()){ MUS.hum = null; MUS.state = 'rest'; MUS.until = now + 25000 + Math.random()*30000; MUS.next = 'song'; }
    }
  } else {
    /* combate o juegos cortan el tarareo; al volver, la canción del lugar */
    MUS.hum = null;
    MUS.state = 'intro';
  }
  if(!want){ MUS.song = null; return; }
  const R = buildSong(want);
  if(want !== MUS.song){ startSong(want); }
  const spb = 60/R.bpm/2;
  while(MUS.stepT < AC.currentTime + 0.5){
    if(MUS.step >= R.len){
      if(R.loop) MUS.step = 0; else break;
    }
    const st = MUS.step;
    const t = MUS.stepT + ((st%2===1) ? spb*R.swing : 0);
    schedStep(R, st, t, spb);
    MUS.step++; MUS.stepT += spb;
  }
}, 110);

/* ---- jingles que CITAN el tema: lo que suena al crecer ya te lo sabes ---- */
/* toca una frase del tema (lista [semitono, corcheas]) con un instrumento */
function playMotif(notes, inst, key, spb, vol, at){
  const a = musBus(); if(!a || (G && G.muted)) return;
  let t = (at!==undefined ? at : a.currentTime) + 0.02;
  for(const n of notes){ if(n[0]>=0) INST[inst](NOTE(key, n[0]), t, n[1]*spb, vol, 0); t += n[1]*spb; }
  return t;
}
/* subir de nivel: la cabeza del tema, rápida y brillante */
SFX.levelup = function(){
  const a = musBus(); if(!a) return;
  holdMusic(1400);
  const end = playMotif([[7,1],[4,1],[7,1],[12,3]], 'kalimba', 523.25, 0.075, 0.09);
  INST.musicbox(NOTE(523.25, 16), end-0.08, 0.5, 0.05, 0.3);
  nz(sfxAt(0.3), 0.12, 0.016, 9500, 3);
};
/* nacer: el primer compás, suave, como una nana que empieza */
SFX.hatch = function(){
  const a = musBus(); if(!a) return;
  holdMusic(2600);
  playMotif([[7,2],[4,1],[7,1],[12,3],[11,1],[12,4]], 'musicbox', 349.23, 0.13, 0.08);
  nz(sfxAt(0), 0.3, 0.02, 4000, 2, 9000);
};
/* evolucionar: la frase que cierra el tema, en grande, con acorde final */
SFX.evolveFanfare = function(){
  const a = musBus(); if(!a) return;
  holdMusic(3200);
  const end = playMotif([[7,1],[4,1],[7,1],[12,2],[14,1],[16,2],[14,1],[12,1],[19,4]], 'flute', 392, 0.09, 0.1);
  for(const s of [0,4,7,12]) INST.pad(NOTE(196, s), end-0.36, 1.2, 0.03, 0);
  kick(end-0.36, 0.08);
  nz(end-0.3, 0.4, 0.016, 8500, 4);
};
