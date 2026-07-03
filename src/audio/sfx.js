"use strict";
/* =========================================================
   BITXO — audio/sfx: efectos por capas y voz de cada bitxo
   ========================================================= */
/* ------ SFX por capas: transitorio + cuerpo + cola ------ */
const SFX = {
  tap(){
    nz(sfxAt(0), 0.015, 0.03, 5000, 2);
    tone({f:460, slide:310, d:0.05, type:'p25', vol:0.045});
  },
  coin(){
    tone({f:987, d:0.055, type:'p25', vol:0.05});
    tone({f:1319, at:sfxAt(0.055), d:0.4, type:'p25', vol:0.05, send:0.35});
  },
  buy(){
    [523,659,784].forEach((f,i)=> tone({f, at:sfxAt(i*0.07), d:0.1, type:'p25', vol:0.048}));
    tone({f:1047, at:sfxAt(0.21), d:0.32, type:'p25', vol:0.05, vib:true, send:0.4});
    nz(sfxAt(0.24), 0.12, 0.02, 8000, 3);
  },
  eat(){
    const j = Math.random()*22;
    tone({f:235+j, slide:150, d:0.08, type:'sawtooth', vol:0.045});
    nz(sfxAt(0.015), 0.05, 0.03, 2500, 0.8);
    tone({f:205+j, slide:132, d:0.08, type:'sawtooth', vol:0.04, at:sfxAt(0.14)});
    nz(sfxAt(0.155), 0.05, 0.025, 2100, 0.8);
    tone({f:520, slide:660, d:0.09, type:'p25', vol:0.035, at:sfxAt(0.3), send:0.2});
  },
  yay(){
    const t0 = sfxAt(0);
    const a = bus();
    if(a && !(G&&G.muted)){
      const o=a.createOscillator(), g=a.createGain();
      setTimbre(a,o,'p25');
      o.frequency.setValueAtTime(380,t0);
      o.frequency.exponentialRampToValueAtTime(640,t0+0.05);
      o.frequency.exponentialRampToValueAtTime(1080,t0+0.17);
      g.gain.setValueAtTime(0.055,t0);
      g.gain.exponentialRampToValueAtTime(0.0001,t0+0.22);
      o.connect(g); g.connect(a._master);
      const sg=a.createGain(); sg.gain.value=0.3; g.connect(sg); sg.connect(a._delay);
      o.start(t0); o.stop(t0+0.25);
    }
    tone({f:1319, at:sfxAt(0.18), d:0.12, type:'p25', vol:0.04, send:0.3});
  },
  nope(){
    tone({f:190, slide:118, d:0.16, type:'sawtooth', vol:0.05});
    tone({f:142, slide:90, d:0.22, type:'sawtooth', vol:0.045, at:sfxAt(0.13)});
    nz(sfxAt(0), 0.06, 0.03, 700, 1);
    kick(sfxAt(0.02), 0.05);
  },
  clean(){
    nz(sfxAt(0), 0.38, 0.04, 700, 0.7, 6500);
    [1400,1750,2100].forEach((f,i)=> tone({f, at:sfxAt(0.26+i*0.05), d:0.06, type:'p125', vol:0.03, send:0.3}));
  },
  sleep(){
    [523,494,440,392].forEach((f,i)=> tone({f, at:sfxAt(i*0.22), d:0.34, type:'p125', vol:0.038, vib:true, send:0.5}));
  },
  hatch(){
    [523,587,659,784,880,1047,1319].forEach((f,i)=> tone({f, at:sfxAt(i*0.065), d:0.13, type:'p25', vol:0.048, send:i>3?0.3:0.1}));
    [1568,1976,2637].forEach((f,i)=> tone({f, at:sfxAt(0.5+i*0.04), d:0.2, type:'p125', vol:0.03, send:0.5}));
    nz(sfxAt(0.5), 0.35, 0.018, 8500, 4);
  },
  evolve(){
    kick(sfxAt(0), 0.1);
    nz(sfxAt(0), 0.6, 0.035, 320, 1.2, 6200);
    tone({f:290, slide:930, d:0.58, type:'sawtooth', vol:0.038});
    [523,659,784,1047].forEach(f=> tone({f, at:sfxAt(0.62), d:0.55, type:'p25', vol:0.03, vib:true, send:0.45}));
    nz(sfxAt(0.62), 0.4, 0.02, 9000, 3);
  },
  levelup(){
    tone({f:523, at:sfxAt(0),    d:0.09, type:'p25', vol:0.05});
    tone({f:698, at:sfxAt(0.09), d:0.09, type:'p25', vol:0.05});
    tone({f:784, at:sfxAt(0.18), d:0.09, type:'p25', vol:0.052});
    [1047,659,784].forEach(f=> tone({f, at:sfxAt(0.27), d:0.42, type:'p25', vol:0.035, vib:true, send:0.4}));
    nz(sfxAt(0.29), 0.1, 0.02, 9500, 3);
  },
  ascend(){
    const gl = [262,330,392,523,659,784,1047,1319,1568,2093];
    gl.forEach((f,i)=> tone({f, at:sfxAt(i*0.11), d:0.5, type:'p125', vol:0.038, vib:i>5, send:0.55}));
    tone({f:131, at:sfxAt(0.2), d:2.2, type:'triangle', vol:0.03, send:0.3});
    tone({f:196, at:sfxAt(0.2), d:2.2, type:'triangle', vol:0.024, send:0.3});
    nz(sfxAt(0.8), 1.0, 0.013, 9000, 5);
  },
  bye(){
    [523,494,440,392,330,262].forEach((f,i)=> tone({f, at:sfxAt(i*0.24), d:0.34, type:'p125', vol:0.038, vib:true, send:0.5}));
  },
  train(){
    kick(sfxAt(0), 0.08);
    tone({f:150, slide:94, d:0.1, type:'sawtooth', vol:0.05});
    kick(sfxAt(0.14), 0.08);
    tone({f:165, slide:100, d:0.1, type:'sawtooth', vol:0.05, at:sfxAt(0.14)});
    tone({f:349, d:0.09, type:'p25', vol:0.04, at:sfxAt(0.28)});
  },
  hit(crit){
    nz(sfxAt(0), 0.03, 0.07, 2600, 1.5);
    nz(sfxAt(0.01), 0.09, 0.045, 1200, 0.9);
    kick(sfxAt(0), 0.09);
    tone({f:265, slide:145, d:0.09, type:'sawtooth', vol:0.04});
    if(crit){
      tone({f:1760, at:sfxAt(0.04), d:0.22, type:'p125', vol:0.05, send:0.4});
      nz(sfxAt(0.04), 0.12, 0.025, 8000, 3);
    }
  },
  hurt(){
    tone({f:225, slide:126, d:0.13, type:'sawtooth', vol:0.05});
    nz(sfxAt(0), 0.09, 0.045, 850, 0.8);
    kick(sfxAt(0.01), 0.06);
  }
};
/* voz propia de cada bitxo: linea + etapa dan timbre y tono */
function petVoice(p){
  if(!p || p.stage===STAGES.EGG || (G && G.muted)) return;
  const j = 1 + (Math.random()*0.08 - 0.04);
  const f = (p.stage===1? 880 : p.stage===2? 620 : 450) * j;
  if(p.form==='grimo'){
    tone({f:310*j, d:0.24, type:'sawtooth', vol:0.028, vib:true, vibDepth:0.06, send:0.55});
    return;
  }
  switch(p.line){
    case 'brasa':
      tone({f:f*0.8, slide:f*1.2, d:0.09, type:'sawtooth', vol:0.032});
      nz(sfxAt(0.01), 0.04, 0.012, 3200, 1);
      break;
    case 'marea':
      tone({f:f*1.1, slide:f*0.6, d:0.14, type:'sine', vol:0.05, send:0.3});
      tone({f:f*1.5, at:sfxAt(0.11), slide:f*0.95, d:0.09, type:'sine', vol:0.03, send:0.3});
      break;
    case 'petrea':
      tone({f:f*0.42, slide:f*0.34, d:0.13, type:'triangle', vol:0.05});
      kick(sfxAt(0), 0.028);
      break;
    case 'astro':
      tone({f:f*1.25, d:0.13, type:'p125', vol:0.03, vib:true, send:0.5});
      tone({f:f*1.87, at:sfxAt(0.07), d:0.11, type:'p125', vol:0.02, send:0.5});
      break;
    default:
      tone({f, slide:f*1.26, d:0.08, type:'p25', vol:0.04});
      tone({f:f*1.33, at:sfxAt(0.09), slide:f*1.55, d:0.07, type:'p25', vol:0.028});
  }
}
SFX.eatFood = function(id){
  if(id==='sopa'){
    tone({f:700, slide:240, d:0.34, type:'sine', vol:0.05, send:0.3});
    tone({f:520, slide:200, d:0.26, type:'sine', vol:0.035, at:sfxAt(0.12)});
    tone({f:880, d:0.12, type:'p125', vol:0.028, at:sfxAt(0.42), send:0.4});
  } else if(id==='picante'){
    SFX.eat();
    nz(sfxAt(0.3), 0.4, 0.02, 6000, 0.7);
    tone({f:2800, slide:2200, d:0.12, type:'p125', vol:0.02, at:sfxAt(0.5)});
  } else if(id==='fruta' || id==='seta'){
    nz(sfxAt(0), 0.06, 0.05, 1900, 0.9);
    tone({f:260, slide:180, d:0.06, type:'sawtooth', vol:0.035});
    nz(sfxAt(0.14), 0.06, 0.04, 1500, 0.9);
    tone({f:230, slide:160, d:0.06, type:'sawtooth', vol:0.03, at:sfxAt(0.14)});
    tone({f:560, slide:700, d:0.08, type:'p25', vol:0.03, at:sfxAt(0.3)});
  } else if(id==='pastel'){
    SFX.eat();
    tone({f:659, d:0.32, type:'p125', vol:0.026, vib:true, at:sfxAt(0.45), send:0.4});
    tone({f:784, d:0.32, type:'p125', vol:0.022, vib:true, at:sfxAt(0.45), send:0.4});
  } else {
    SFX.eat();
  }
};
SFX.ballKick = function(){
  nz(sfxAt(0), 0.025, 0.05, 2100, 1.2);
  tone({f:290, slide:480, d:0.07, type:'p25', vol:0.05});
};
SFX.bounce = function(){
  tone({f:230, slide:310, d:0.06, type:'triangle', vol:0.028});
};
SFX.boing = function(){
  tone({f:300, slide:520, d:0.08, type:'p25', vol:0.05});
  tone({f:520, slide:340, d:0.08, type:'p25', vol:0.045, at:sfxAt(0.08)});
  tone({f:340, slide:580, d:0.1, type:'p25', vol:0.04, at:sfxAt(0.16)});
  nz(sfxAt(0), 0.12, 0.02, 1200, 2);
  [880,1175,1568].forEach((f,i)=> tone({f, at:sfxAt(0.28+i*0.05), d:0.12, type:'p125', vol:0.03, send:0.4}));
};
SFX.wish = function(){
  tone({f:1568, d:0.3, type:'p125', vol:0.04, send:0.5});
  tone({f:2093, at:sfxAt(0.09), d:0.4, type:'p125', vol:0.035, vib:true, send:0.55});
  nz(sfxAt(0.1), 0.3, 0.014, 9000, 4);
};
SFX.creak = function(){
  tone({f:135, slide:112, d:0.09, type:'sawtooth', vol:0.011});
  nz(sfxAt(0.01), 0.05, 0.007, 600, 2);
};
SFX.starWhistle = function(){
  tone({f:2500, slide:850, d:1.6, type:'p125', vol:0.011, send:0.5});
};
/* ------ combate v2: telegrafía, bloqueo y SUPER ------ */
SFX.telegraph = function(big){
  tone({f:180, slide:140, d:0.18, type:'sawtooth', vol:0.045});
  nz(sfxAt(0), 0.08, 0.02, 800, 1);
  if(big){
    tone({f:120, slide:78, d:0.32, type:'sawtooth', vol:0.05, at:sfxAt(0.16)});
    kick(sfxAt(0.2), 0.08);
  }
};
SFX.block = function(){
  nz(sfxAt(0), 0.04, 0.06, 3000, 2);
  tone({f:520, slide:390, d:0.12, type:'triangle', vol:0.055});
  tone({f:1040, d:0.22, type:'p125', vol:0.03, at:sfxAt(0.05), send:0.4});
};
SFX.superCharge = function(){
  tone({f:220, slide:880, d:0.5, type:'p25', vol:0.05, send:0.3});
  nz(sfxAt(0.1), 0.4, 0.02, 2000, 1, 8000);
  [440,554,659,880].forEach((f,i)=> tone({f, at:sfxAt(0.12*i), d:0.14, type:'p125', vol:0.035, send:0.4}));
};
SFX.superHit = function(){
  kick(sfxAt(0), 0.12);
  nz(sfxAt(0), 0.5, 0.06, 900, 0.8, 4000);
  tone({f:200, slide:60, d:0.4, type:'sawtooth', vol:0.05});
  [1319,1568,2093].forEach((f,i)=> tone({f, at:sfxAt(0.3+i*0.06), d:0.25, type:'p125', vol:0.035, send:0.5}));
};
