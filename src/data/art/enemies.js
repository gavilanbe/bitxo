"use strict";
/* =========================================================
   BITXO — data/art/enemies: arte de enemigos (ESPR)
   Pintor por capas: elipses con rampa de luz (arriba-izquierda),
   cada capa con su contorno K, y un segundo fotograma por bicho
   (ESPR[kind+'_b']) para el reposo animado. Miran a la DERECHA
   (el combate los voltea hacia tu bitxo).
   ========================================================= */
function buildEnemyArt(){
  const LX = -0.52, LY = -0.66, LZ = 0.54;
  const W = '#ffffff';

  function painter(w, h){
    const mk = ()=> new Array(w*h).fill(null);
    let cur = mk(); const base = cur;
    const inb = (x,y)=> x>=0 && y>=0 && x<w && y<h;
    const P = {
      w, h,
      set(x, y, c){ x = Math.round(x); y = Math.round(y); if(inb(x,y)) cur[y*w+x] = c; },
      get(x, y){ return inb(x,y) ? cur[y*w+x] : null; },
      rect(x, y, ww, hh, c){ for(let j=0;j<hh;j++) for(let i=0;i<ww;i++) P.set(x+i, y+j, c); },
      /* elipse con volumen: rampa [oscuro, base, claro, brillo]; tex(x,y,idx)->color opcional */
      ell(cx, cy, rx, ry, ramp, tex){
        for(let y=Math.floor(cy-ry-1); y<=cy+ry+1; y++) for(let x=Math.floor(cx-rx-1); x<=cx+rx+1; x++){
          const nx = (x+0.5-cx)/rx, ny = (y+0.5-cy)/ry, r2 = nx*nx+ny*ny;
          if(r2>1) continue;
          if(typeof ramp==='string'){ P.set(x, y, ramp); continue; }
          const nz = Math.sqrt(1-r2), v = nx*LX + ny*LY + nz*LZ;
          let i = v<0.08 ? 0 : (v<0.55 ? 1 : (v<0.9 ? 2 : 3));
          if(i>=ramp.length) i = ramp.length-1;
          const c = tex ? tex(x, y, i, ramp) : ramp[i];
          if(c) P.set(x, y, c);
        }
      },
      line(x0, y0, x1, y1, c){
        x0=Math.round(x0); y0=Math.round(y0); x1=Math.round(x1); y1=Math.round(y1);
        const dx = Math.abs(x1-x0), dy = -Math.abs(y1-y0), sx = x0<x1?1:-1, sy = y0<y1?1:-1;
        let e = dx+dy;
        for(;;){ P.set(x0, y0, c); if(x0===x1 && y0===y1) break; const e2 = 2*e; if(e2>=dy){ e+=dy; x0+=sx; } if(e2<=dx){ e+=dx; y0+=sy; } }
      },
      /* filas de texto con paleta; '.' = nada */
      rows(x, y, pal, rs){ rs.forEach((r, j)=>{ for(let i=0;i<r.length;i++){ const ch = r[i]; if(ch!=='.' && pal[ch]) P.set(x+i, y+j, pal[ch]); } }); },
      /* capa con su propio contorno: tapa lo de debajo con una línea K */
      layer(fn, outline){
        const prev = cur; cur = mk(); fn(P);
        if(outline!==false) outl(cur);
        for(let i=0;i<cur.length;i++) if(cur[i]) prev[i] = cur[i];
        cur = prev;
      },
      canvas(){
        outl(base);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const g = c.getContext('2d');
        for(let i=0;i<base.length;i++) if(base[i]){ g.fillStyle = base[i]; g.fillRect(i%w, Math.floor(i/w), 1, 1); }
        return c;
      }
    };
    function solid(c){ return c && c!==K && c.indexOf('rgba')!==0; }
    function outl(d){
      const add = [];
      for(let y=0;y<h;y++) for(let x=0;x<w;x++){
        if(d[y*w+x]) continue;
        if((x>0&&solid(d[y*w+x-1])) || (x<w-1&&solid(d[y*w+x+1])) || (y>0&&solid(d[(y-1)*w+x])) || (y<h-1&&solid(d[(y+1)*w+x]))) add.push(y*w+x);
      }
      for(const i of add) d[i] = K;
    }
    return P;
  }
  const make = (w, h, fn)=>{ const a = painter(w, h); fn(a, 0); const b = painter(w, h); fn(b, 1); return [a.canvas(), b.canvas()]; };
  /* ojo malo: ceja inclinada hacia el centro de la cara + pupila + brillo */
  function evilEye(P, x, y, col, dir, closed){
    if(closed){ P.set(x, y+1, K); P.set(x+1, y+1, K); return; }
    P.set(x, y+1, col); P.set(x+1, y+1, col);
    if(dir>0){ P.set(x, y, W); P.set(x+1, y, K); P.set(x, y-1, K); }
    else if(dir<0){ P.set(x+1, y, W); P.set(x, y, K); P.set(x+1, y-1, K); }
    else { P.set(x, y, W); P.set(x+1, y, col); }
  }

  const A = {};

  /* ---------- RATUCO: rata gris de dientes largos ---------- */
  A.ratuco = make(16, 13, (P, f)=>{
    const R = ['#4e3c44','#7a6068','#a4888a','#cdb4aa'];
    const sy = f ? -1 : 0;
    P.layer(p=>{ /* cola rosa que se enrosca */
      const q = '#c8708a';
      p.set(3, 10, q); p.set(2, 10, q); p.set(1, 9, q); p.set(1, 8, q); p.set(1, 7, q);
      if(f) p.set(1, 6, q); else p.set(2, 6, q);
    });
    P.layer(p=>{ p.rect(4, 11, 2, 1, R[0]); p.rect(9, 11, 2, 1, R[0]); });
    P.layer(p=> p.ell(6.6, 8.4, 5, 3.3, R));
    P.layer(p=>{ p.ell(11, 7, 3.2, 2.8, R); p.ell(13.3, 8.2 + sy, 1.8, 1.3, R); p.set(14, 7 + sy, '#f2a2b8'); });
    P.layer(p=>{ p.ell(9.4, 3.8, 2.1, 2.1, R); p.set(9, 3, '#f2a2b8'); p.set(9, 4, '#c8708a'); p.set(10, 4, '#e88aa4'); });
    evilEye(P, 11, 6, '#ff5a3a', -1);
    /* dientes de roedor */
    P.set(12, 9 + sy, K); P.set(13, 10 + sy, '#f6efe0'); P.set(12, 10 + sy, '#f6efe0');
    /* bigotes */
    P.set(15, 7 + sy, K); P.set(15, 9 + sy, K);
    P.set(5, 6, R[3]); P.set(4, 6, R[2]);
  });

  /* ---------- PINCHON: erizo de púas afiladas ---------- */
  A.pinchon = make(18, 14, (P, f)=>{
    const S = ['#24401e','#3e6a34','#5a9a44','#8ac866'];
    P.layer(p=>{ p.rect(5, 12, 2, 1, '#6a4a2e'); p.rect(10, 12, 2, 1, '#6a4a2e'); });
    P.layer(p=>{
      const cx = 8.4, cy = 8.4, rx = 5.6, ry = 4.4;
      let n = 0;
      for(let a=172; a<=340; a+=21, n++){
        const r = a*Math.PI/180, c = Math.cos(r), s = Math.sin(r);
        const len = (n%2 ? 2.2 : 3) + (f && n%2 ? 0.8 : 0);
        const tx = cx + c*(rx+len), ty = cy + s*(ry+len);
        p.line(cx + c*(rx-1.5), cy + s*(ry-1.5), tx, ty, S[1]);
        p.set(tx, ty, S[3]);
      }
      p.ell(cx, cy, rx, ry, S, (x, y, i)=> (i>0 && (x*2+y)%5===0) ? S[i-1] : S[i]);
    });
    P.layer(p=>{
      const F = ['#8a6440','#c49a68','#e2c08e','#f4dcb0'];
      p.ell(13.2, 9.4, 3.2, 2.8, F); p.ell(15.4, 10.2, 1.7, 1.2, F);
    });
    P.set(16, 9, K); P.set(16, 10, K);
    evilEye(P, 13, 8, '#ff5a3a', -1);
    P.set(14, 11, K); P.set(15, 11, K); P.set(14, 12, '#f6efe0');
    P.set(12, 10, '#e88a8a');
  });

  /* ---------- CHISPIN: diablillo de fuego que quema ---------- */
  A.chispin = make(14, 16, (P, f)=>{
    const O = ['#b8302c','#e8603a','#ff9a3a','#ffd05a'];
    const tongue = (x, yb, hgt, lean, cols)=>{
      for(let j=0;j<hgt;j++){
        const k = j/hgt, ww = k<0.34 ? 3 : (k<0.7 ? 2 : 1);
        const xx = Math.round(x + lean*k*hgt*0.5);
        const c = cols[Math.min(cols.length-1, Math.floor(k*cols.length))];
        for(let i=0;i<ww;i++) P.set(xx - (ww>>1) + i, yb - j, c);
      }
    };
    P.layer(p=>{
      tongue(7, 6, 6 - f, 0.2, ['#e8603a','#ff9a3a','#ffd05a']);
      tongue(4, 7, 4 + f, -0.6, ['#e8603a','#ff9a3a']);
      tongue(10, 7, 5 - f, 0.6, ['#e8603a','#ff9a3a','#ffd05a']);
      p.ell(7, 10, 5.2, 4.4, O);
      /* gotas de brasa al pie */
      p.set(5, 14, O[1]); p.set(8, 14 + (f?0:0), O[0]); p.set(7, 14, O[1]);
    });
    P.layer(p=>{ p.ell(7.6, 10.8, 3.4, 2.8, ['#f0b030','#ffd94a','#fff0a0','#fff8d0']); }, false);
    evilEye(P, 5, 9, '#3a0a14', 1);
    evilEye(P, 9, 9, '#3a0a14', -1);
    P.set(7, 9, O[0]);
    /* sonrisa torcida con colmillo */
    P.set(6, 12, K); P.set(7, 12, K); P.set(8, 12, K); P.set(9, 12, K); P.set(10, 11, K); P.set(5, 11, K);
    P.set(8, 13, K); P.set(7, 13, W);
    if(f){ P.set(3, 2, '#ffd05a'); P.set(11, 1, '#ff9a3a'); } else { P.set(2, 4, '#ff9a3a'); P.set(12, 3, '#ffd05a'); }
  });

  /* ---------- BURBUJON: pez globo que sopla su burbuja ---------- */
  A.burbujon = make(18, 16, (P, f)=>{
    const B = ['#1e4e8a','#3a80c8','#6ab4e6','#bfe8f8'];
    const cx = 9, cy = 9.4, rx = 5.8 + (f?0.4:0), ry = 4.8 + (f?0.4:0);
    P.layer(p=>{ /* aleta cola */
      p.ell(2.4, 9.2, 1.8, 2.4, ['#1e4e8a','#3a80c8','#6ab4e6']);
      p.set(1, 7, B[1]); p.set(1, 11, B[1]);
    });
    P.layer(p=>{
      for(const a of [205, 240, 275, 310, 150, 115, 75]){
        const r = a*Math.PI/180, L = f ? 1.8 : 1;
        p.line(cx + Math.cos(r)*rx*0.8, cy + Math.sin(r)*ry*0.8, cx + Math.cos(r)*(rx+L), cy + Math.sin(r)*(ry+L), B[1]);
      }
      p.ell(cx, cy, rx, ry, B, (x, y, i)=> (y>=11 && x>=6) ? (i>=1 ? '#e6f4fa' : '#a8cce0') : (((x*7+y*3)%13===0 && i>0) ? B[i-1] : B[i]));
    });
    P.layer(p=>{ p.set(7, 9, B[2]); p.set(6, 10, B[2]); p.set(7, 10, B[1]); }, false);
    evilEye(P, 11, 7, '#ffd94a', -1);
    /* morros grandes y malhumorados */
    P.set(15, 10, '#f2a2b8'); P.set(15, 11, '#c8708a'); P.set(14, 10, K); P.set(14, 11, K);
    /* burbuja que sopla */
    const bub = 'rgba(200,240,255,0.9)';
    const bx = 16, by = f ? 5 : 7;
    P.set(bx, by-1, bub); P.set(bx-1, by, bub); P.set(bx+1, by, bub); P.set(bx, by+1, bub); P.set(bx-1, by-1, W);
    P.set(f ? 14 : 15, f ? 2 : 4, bub);
  });

  /* ---------- SOMBRIO: sombra de ojos rojos que se esfuma ---------- */
  A.sombrio = make(16, 16, (P, f)=>{
    const S = ['#1a1230','#30264e','#4a3c70','#665a92'];
    P.layer(p=>{
      p.ell(8, 7.4, 6.2, 5.6, S);
      /* jirones abajo: se mueven */
      const o = f ? 1 : 0;
      p.rect(3, 11, 10, 2, S[1]);
      p.set(2 + o, 13, S[1]); p.set(3 + o, 13, S[0]); p.set(3, 14 - o, S[0]);
      p.set(7, 13, S[1]); p.set(7 - o, 14, S[0]); p.set(8, 13, S[0]);
      p.set(11, 13, S[1]); p.set(12 - o, 13, S[0]); p.set(12 + o, 14, S[0]);
      /* cuernecillos */
      p.set(4, 2, S[1]); p.set(3, 1, S[0]); p.set(12, 2, S[1]); p.set(13, 1, S[0]);
    });
    /* ojos brasa rojos */
    const e = '#ff4a3a', e2 = '#ffb0a0';
    P.set(6, 6, K); P.set(7, 7, K); P.set(6, 7, e); P.set(5, 6, K); P.set(5, 7, e2);
    P.set(11, 6, K); P.set(10, 7, K); P.set(11, 7, e); P.set(12, 6, K); P.set(12, 7, e2);
    if(f){ P.set(5, 7, K); P.set(6, 7, K); P.set(11, 7, K); P.set(12, 7, K); }
    /* sonrisa de dientes */
    P.rect(6, 9, 6, 2, K);
    P.set(6, 9, '#c8c0e0'); P.set(8, 9, '#c8c0e0'); P.set(10, 9, '#c8c0e0'); P.set(7, 10, '#c8c0e0'); P.set(9, 10, '#c8c0e0'); P.set(11, 10, '#c8c0e0');
    P.set(5, 9, K); P.set(12, 9, K);
  });

  /* ---------- ROQUIJO: escarabajo de roca acorazado ---------- */
  A.roquijo = make(20, 15, (P, f)=>{
    const R = ['#46465a','#727288','#9e9eb0','#cacad8'];
    const H = ['#262630','#40404e','#5c5c70','#7a7a90'];
    P.layer(p=>{ const d = '#2a2a34'; p.rect(3, 13, 2, 1, d); p.rect(7, 13, 2, 1, d); p.rect(11, 13, 2, 1, d); });
    P.layer(p=>{
      p.ell(7.8, 8.4, 6.6, 5, R);
      /* placas: juntas y grietas */
      for(let y=3;y<=13;y++){ if(p.get(5,y)) p.set(5, y, R[0]); if(p.get(10,y)) p.set(10, y, R[0]); }
      p.set(7, 7, R[0]); p.set(8, 8, R[0]); p.set(12, 6, R[0]); p.set(3, 9, R[0]);
      /* musgo */
      p.set(4, 4, '#7ac74f'); p.set(3, 5, '#5a9a44'); p.set(8, 4, '#7ac74f'); p.set(9, 4, '#5a9a44'); p.set(6, 4, '#5a9a44');
      /* cristal clavado */
      p.set(7, 3, '#8ae0f0'); p.set(7, 2, '#d8f8ff'); p.set(8, 3, '#5ab0c8');
    });
    P.layer(p=>{
      p.ell(15.2, 9.6, 3.1, 2.8, H);
      /* cuerno de rinoceronte */
      p.set(16, 7, H[2]); p.set(17, 6, H[3]); p.set(17, 5, H[3]); p.set(18, 4, '#a0a0b8');
    });
    evilEye(P, 15, 8, '#ff4a3a', -1, false);
    P.set(17, 11, K); P.set(18, 11, '#f6efe0'); P.set(18, 10, K);
    if(f){ P.set(7, 2, '#ffffff'); P.set(6, 1, '#8ae0f0'); }
  });

  /* ---------- SETAZO: seta venenosa que se regenera ---------- */
  A.setazo = make(16, 18, (P, f)=>{
    const C = ['#44204e','#6e3480','#9a52aa','#c888d0'];
    const T = ['#9a8a6e','#d0c4a4','#ece2c8','#fff8e6'];
    P.layer(p=>{ p.rect(4, 16, 3, 1, '#7a6a52'); p.rect(9, 16, 3, 1, '#7a6a52'); });
    P.layer(p=>{ p.ell(7.8, 12.6, 4.2, 3.8, T, (x, y, i)=> y<=10 ? T[0] : T[i]); });
    P.layer(p=>{
      p.ell(8, 5.4, 7, 4.4, C, (x, y, i)=> y>=8 ? C[0] : C[i]);
      /* motas que brillan: su regeneración */
      const g = f ? '#e8ffa0' : '#b8f060';
      for(const [x,y] of [[4,4],[8,2],[11,4],[6,6],[13,6],[2,7],[10,7]]) p.set(x, y, g);
      p.set(7, 2, '#90d040'); p.set(8, 3, '#90d040');
    });
    for(let x=3;x<=12;x+=2) P.set(x, 9, '#5a2a64');
    evilEye(P, 5, 11, '#8ae04a', 1);
    evilEye(P, 9, 11, '#8ae04a', -1);
    P.set(7, 14, K); P.set(8, 14, K); P.set(9, 14, K); P.set(6, 13, K); P.set(8, 15, '#f6efe0');
    /* brote que crece */
    P.layer(p=>{ p.set(1, 14, '#5a9a44'); p.set(1, 13, '#7ac74f'); if(f){ p.set(1, 12, '#b8f060'); p.set(2, 12, '#b8f060'); } });
  });

  /* ---------- POLILLUX: polilla astral de 4 alas ---------- */
  A.polillux = make(20, 16, (P, f)=>{
    const V = ['#3e2a86','#6a4ac8','#9a80f0','#d0c4fc'];
    const V2 = ['#2e2066','#523aa8','#7e66d8'];
    const up = f ? -1 : 0;
    P.layer(p=>{ p.ell(5.6, 11.4 - up, 3.2, 2.4, V2); p.ell(14.4, 11.4 - up, 3.2, 2.4, V2); p.set(4, 11 - up, '#ffd94a'); p.set(15, 11 - up, '#ffd94a'); });
    P.layer(p=>{
      p.ell(5, 6 + up, 4.3, 3.6 + (f?-0.6:0), V); p.ell(15, 6 + up, 4.3, 3.6 + (f?-0.6:0), V);
      /* ojos de ala dorados */
      p.set(4, 6 + up, '#ffd94a'); p.set(5, 6 + up, '#ffd94a'); p.set(4, 7 + up, '#c98a22'); p.set(5, 7 + up, K);
      p.set(15, 6 + up, '#ffd94a'); p.set(14, 6 + up, '#ffd94a'); p.set(15, 7 + up, '#c98a22'); p.set(14, 7 + up, K);
      p.set(2, 5 + up, '#fff8d0'); p.set(17, 5 + up, '#fff8d0');
    });
    P.layer(p=>{
      p.ell(10, 9.8, 1.9, 4, ['#6a5a90','#a898d0','#d8ccf0'], (x, y, i)=> y%2 && i>0 ? '#8a7ab0' : ['#6a5a90','#a898d0','#d8ccf0'][i]);
    });
    P.layer(p=>{ p.ell(10, 5, 2.6, 2.1, ['#8a7ab0','#c8b8e8','#ece4ff']); p.set(8, 7, '#fff8e6'); p.set(11, 7, '#fff8e6'); p.set(10, 7, '#ece4ff'); });
    /* antenas plumosas */
    P.set(8, 2, K); P.set(7, 1, K); P.set(6, 0, '#ffd94a'); P.set(12, 2, K); P.set(13, 1, K); P.set(14, 0, '#ffd94a');
    P.set(9, 5, '#ff4a3a'); P.set(11, 5, '#ff4a3a'); P.set(8, 4, K); P.set(9, 4, K); P.set(11, 4, K); P.set(12, 4, K);
    P.set(10, 6, K);
  });

  /* ---------- CUERVILLO: cuervo que vuela sobre tu escudo ---------- */
  A.cuervillo = make(18, 15, (P, f)=>{
    const N = ['#12121c','#242434','#3a3a54','#5a5a7c'];
    P.layer(p=>{ /* cola en abanico */
      p.set(2, 9, N[1]); p.set(1, 10, N[1]); p.set(2, 10, N[2]); p.set(1, 11, N[1]); p.set(2, 11, N[1]); p.set(3, 11, N[2]); p.set(2, 12, N[1]);
    });
    P.layer(p=>{ p.line(7, 12, 7, 13, '#e89040'); p.line(10, 12, 10, 13, '#e89040'); p.set(8, 13, '#e89040'); p.set(11, 13, '#e89040'); });
    P.layer(p=> p.ell(7.6, 9.4, 4.6, 3.2, N));
    P.layer(p=>{ p.ell(12, 6.2, 3.2, 2.9, N); });
    P.layer(p=>{ p.set(15, 6, '#f0a04b'); p.set(16, 6, '#e89040'); p.set(15, 7, '#c86a28'); p.set(14, 7, '#c86a28'); });
    /* ala: arriba o abajo */
    P.layer(p=>{
      if(!f){
        p.set(6, 7, N[2]); p.set(5, 6, N[2]); p.set(4, 5, N[3]); p.set(3, 4, N[2]); p.set(2, 3, N[1]);
        p.set(6, 6, N[2]); p.set(5, 5, N[3]); p.set(4, 4, N[2]); p.set(3, 3, N[1]);
        p.set(7, 7, N[2]); p.set(7, 6, N[1]); p.set(6, 5, N[2]); p.set(5, 4, N[2]); p.set(4, 3, N[1]); p.set(3, 2, N[1]); p.set(6, 4, N[1]);
        p.set(8, 7, N[1]);
      } else {
        p.rect(4, 9, 5, 2, N[2]); p.set(3, 11, N[1]); p.set(4, 11, N[2]); p.set(5, 11, N[1]); p.set(4, 12, N[1]); p.rect(5, 8, 4, 1, N[3]);
      }
    });
    evilEye(P, 12, 5, '#ff4a3a', -1);
    P.set(10, 9, N[3]); P.set(9, 9, N[2]);
  });

  /* ---------- RELAMPIN: bola de chispas que paraliza ---------- */
  A.relampin = make(16, 16, (P, f)=>{
    const Y = ['#b8861c','#f0c030','#ffe060','#fff8c0'];
    P.layer(p=>{ /* cola rayo */
      p.set(3, 10, Y[1]); p.set(2, 9, Y[1]); p.set(3, 8, Y[2]); p.set(2, 7, Y[2]); p.set(1, 6, Y[2]); p.set(2, 6, Y[1]); p.set(1, 7, Y[1]);
      p.set(1, 5, Y[3]);
    });
    P.layer(p=>{ p.rect(5, 14, 2, 1, '#8a6414'); p.rect(10, 14, 2, 1, '#8a6414'); });
    P.layer(p=>{
      p.ell(8.4, 10, 5.2, 4.4, Y);
      /* rayo en la barriga */
      p.set(8, 11, '#fff8c0'); p.set(9, 12, '#fff8c0'); p.set(8, 12, '#fff8c0'); p.set(9, 13, '#fff8c0');
    });
    P.layer(p=>{ /* orejas en zigzag */
      p.set(5, 5, Y[1]); p.set(5, 4, Y[2]); p.set(4, 3, Y[2]); p.set(5, 2, Y[3]); p.set(4, 1, '#2a2436');
      p.set(11, 5, Y[1]); p.set(11, 4, Y[2]); p.set(12, 3, Y[2]); p.set(11, 2, Y[3]); p.set(12, 1, '#2a2436');
    });
    evilEye(P, 7, 8, '#20243c', 1);
    evilEye(P, 11, 8, '#20243c', -1);
    P.set(9, 10, K); P.set(10, 11, K);
    P.set(4, 10, '#ff8a6a'); P.set(13, 10, '#ff8a6a');
    /* chispas cian */
    const c = '#8af0ff';
    if(f){ P.set(14, 4, c); P.set(15, 3, W); P.set(13, 3, c); P.set(0, 12, c); } else { P.set(14, 6, c); P.set(15, 7, W); P.set(1, 2, c); P.set(0, 3, W); }
  });

  /* ---------- LADRONZUELO: mapache enmascarado con su saco ---------- */
  A.ladronzuelo = make(18, 16, (P, f)=>{
    const M = ['#4a3e48','#766472','#a08c96','#cabac0'];
    const Cr = ['#a89aa0','#d8ccc8','#f0e8e2'];
    P.layer(p=>{ /* cola a rayas */
      p.ell(2.8, 11, 1.8, 2.6, M, (x, y, i)=> y%2 ? '#2a2230' : M[i]);
    });
    P.layer(p=>{ p.rect(8, 14, 2, 1, M[0]); p.rect(12, 14, 2, 1, M[0]); });
    P.layer(p=> p.ell(10.2, 11, 3.8, 3.4, M, (x, y, i)=> (x>=10 && y>=10) ? Cr[Math.min(2,i)] : M[i]));
    /* saco de motas al hombro */
    P.layer(p=>{
      p.ell(5, 6.8, 3.8, 3.8, ['#7a5a30','#b0884a','#d4ae6e','#f0d8a0']);
      p.set(5, 2, '#7a5a30'); p.set(6, 2, '#7a5a30');
      p.set(4, 6, '#ffd94a'); p.set(3, 7, '#fff4a0'); p.set(5, 8, '#ffd94a'); p.set(3, 9, '#b0884a');
    });
    P.layer(p=>{
      p.set(10, 3, M[1]); p.set(10, 2, M[2]); p.set(14, 3, M[1]); p.set(14, 2, M[2]);
    });
    P.layer(p=>{
      p.ell(12, 6.4, 3.4, 2.8, M, (x, y, i)=> y>=7 ? Cr[Math.min(2,i)] : M[i]);
      p.ell(15, 7.6, 1.8, 1.2, Cr);
    });
    P.set(16, 7, K);
    /* antifaz */
    for(let x=9;x<=14;x++){ P.set(x, 5, '#1e1826'); P.set(x, 6, '#1e1826'); }
    P.set(15, 6, '#1e1826');
    if(!f){ P.set(11, 5, W); P.set(11, 6, '#ff4a3a'); P.set(13, 5, W); P.set(13, 6, '#ff4a3a'); }
    else { P.set(11, 6, '#6a5a70'); P.set(13, 6, '#6a5a70'); }
    P.set(14, 9, K); P.set(15, 9, K); P.set(14, 10, W);
    /* mano que agarra el saco */
    P.set(8, 9, M[2]); P.set(7, 9, M[3]);
  });

  /* ---------- LOBRUNO (jefe): lobo huargo de ojos rojos ---------- */
  A.lobruno = make(28, 21, (P, f)=>{
    const L = ['#2e2a3a','#4e4860','#746c88','#a49cb8'];
    const D = ['#221e2c','#3a3448','#56506a'];
    P.layer(p=>{ /* cola peluda en alto */
      p.ell(3.8, 8, 2.4, 4, L); p.set(2, 4, L[2]); p.set(3, 3, L[3]); p.set(4, 4, L[2]);
    });
    P.layer(p=>{ /* patas traseras */
      p.rect(5, 15, 3, 4, D[1]); p.rect(9, 15, 3, 4, D[0]); p.rect(5, 19, 3, 1, D[2]); p.rect(9, 19, 3, 1, D[1]);
    });
    P.layer(p=>{
      p.ell(10.6, 12.4, 7.6, 4.6, L, (x, y, i)=> ((x+y)%4===0 && i===2) ? L[1] : L[i]);
      /* zarpazos viejos en el lomo */
      p.set(8, 9, '#8a7a90'); p.set(9, 10, '#8a7a90'); p.set(10, 9, '#8a7a90'); p.set(11, 10, '#8a7a90');
    });
    P.layer(p=>{ /* patas delanteras con garras */
      p.rect(15, 15, 3, 4, D[1]); p.rect(19, 15, 3, 4, D[2]);
      p.set(18, 19, W); p.set(22, 19, W); p.rect(15, 19, 3, 1, D[2]); p.rect(19, 19, 3, 1, L[2]);
    });
    P.layer(p=>{ /* melena erizada */
      const cx = 17.4, cy = 10.2;
      for(const a of [200, 225, 250, 150, 125]){ const r = a*Math.PI/180; p.line(cx + Math.cos(r)*3, cy + Math.sin(r)*3.6, cx + Math.cos(r)*6.4, cy + Math.sin(r)*7, L[2]); }
      p.ell(cx, cy, 4.4, 5.2, L, (x, y, i)=> (y%2===0 && i===1) ? L[2] : L[i]);
    });
    P.layer(p=>{
      /* orejas puntiagudas */
      p.set(18, 4, L[1]); p.set(18, 3, L[2]); p.set(18, 2, L[3]); p.set(19, 4, L[1]); p.set(19, 3, '#c8708a');
      p.set(22, 4, L[1]); p.set(22, 3, L[2]); p.set(22, 2, L[3]); p.set(21, 4, L[1]); p.set(21, 3, '#c8708a');
      p.ell(20.4, 7.4, 3.8, 3.2, L);
      p.ell(24.2, 8.8, 2.6, 1.6, L);
      /* mandíbula */
      p.ell(23.6, 11.4 + (f?0.6:0), 2.4, 1.1, D);
    });
    P.set(26, 8, K);
    /* fauces con colmillos */
    P.rect(21, 10, 5, 1 + f, '#7a1e28'); P.set(21, 10, K);
    P.set(22, 10, W); P.set(25, 10, W); P.set(23, 11 + f, W);
    /* ojo que arde y cicatriz */
    P.set(20, 7, '#ff3a2a'); P.set(21, 7, '#ffd0a0'); P.set(19, 6, K); P.set(20, 6, K); P.set(21, 6, K); P.set(22, 7, K);
    P.set(20, 5, '#c8a0b0'); P.set(21, 8, '#c8a0b0');
    /* aliento en el frío */
    if(f){ P.set(27, 11, 'rgba(230,230,255,0.7)'); P.set(27, 12, 'rgba(230,230,255,0.5)'); }
  });

  /* ---------- REY SETO (jefe): rey de las setas con corona y capa ---------- */
  A.reyseto = make(26, 26, (P, f)=>{
    const R = ['#6a1a24','#a82e34','#dc4a44','#ff8870'];
    const T = ['#a8987a','#d8ccb0','#f0e8d4','#fffaf0'];
    const Cp = ['#2e1a4a','#4a2a72','#6a44a0'];
    P.layer(p=>{ /* capa real */
      for(let y=13;y<=23;y++){ const k = (y-13)/10, x0 = Math.round(8 - k*4), x1 = Math.round(17 + k*4); for(let x=x0;x<=x1;x++) p.set(x, y, x<x0+2 ? Cp[0] : (x>x1-3 ? Cp[0] : Cp[1])); }
      for(let x=4;x<=21;x++) if(x%3===0) p.set(x, 23, '#f6efe0');
      p.set(6, 20, Cp[2]); p.set(7, 18, Cp[2]); p.set(5, 22, Cp[2]);
    });
    P.layer(p=>{
      p.ell(12.6, 17.6, 5.4, 5.4, T, (x, y, i)=> y<=14 ? T[0] : T[i]);
      /* manos */
      p.set(19, 17, T[1]); p.set(20, 17, T[2]); p.set(21, 17, T[1]);
    });
    P.layer(p=>{
      p.ell(12.4, 9, 10.6, 5.8, R, (x, y, i)=> y>=12 ? R[0] : R[i]);
      for(const [x,y,s] of [[6,7,2],[12,5,2],[17,8,2],[3,11,1],[21,11,1],[10,10,1],[15,11,1]]){ p.rect(x, y, s, s, '#f0e0c0'); p.set(x, y, '#fffaf0'); }
      if(f) for(const [x,y] of [[6,7],[12,5],[17,8]]) p.set(x+1, y+1, '#fff4b0');
    });
    P.layer(p=>{ /* cetro con seta, por delante del sombrero */
      p.line(22, 8, 22, 23, '#c98a22'); p.set(22, 7, '#ffe070');
      p.ell(22.5, 5.4, 2.2, 1.7, ['#6a1a24','#dc4a44','#ff8870']); p.set(22, 4, '#f6efe0');
      if(f) p.set(23, 4, '#fff4b0');
    });
    P.layer(p=>{ /* corona */
      const Y = '#ffd94a', Yd = '#c98a22', Yl = '#fff4b0';
      p.rect(8, 3, 9, 2, Y); p.rect(8, 4, 9, 1, Yd);
      for(const x of [8, 12, 16]){ p.set(x, 2, Y); p.set(x, 1, Yl); }
      p.set(10, 2, Y); p.set(14, 2, Y);
      p.set(12, 3, '#e2574c'); p.set(9, 3, Yl);
    });
    for(let x=6;x<=19;x+=2) P.set(x, 14, '#8a7a5e');
    /* cara feroz: cuencas oscuras y ojos que arden */
    const eg = f ? '#fff070' : '#ffd94a';
    P.rect(9, 16, 3, 2, K); P.rect(14, 16, 3, 2, K);
    P.set(10, 17, eg); P.set(11, 17, eg); P.set(14, 17, eg); P.set(15, 17, eg);
    P.set(8, 15, K); P.set(9, 15, K); P.set(16, 15, K); P.set(17, 15, K);
    P.rect(10, 20, 6, 1, K); P.set(9, 19, K); P.set(16, 19, K);
    P.set(11, 20, W); P.set(13, 20, W); P.set(15, 20, W);
    P.set(12, 21, '#8a7a5e'); P.set(13, 21, '#8a7a5e');
  });

  for(const k in A){ ESPR[k] = A[k][0]; ESPR[k+'_b'] = A[k][1]; }
}
