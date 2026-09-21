/* =========================================================================
   SITE ENGINE — you shouldn't need to touch this file.
   Edit js/content.js for projects, index.html for prose, css/style.css
   for colour and type.
   ========================================================================= */
(function(){
'use strict';

var el = function(s){ return document.querySelector(s); };
var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var TAU = Math.PI*2;

/* ---- read content, fail loudly if content.js has a syntax error -------- */
var C = window.CONTENT;
if(!C || !C.projects || !C.projects.length){
  console.error('[optic] js/content.js did not load, or has no projects. ' +
                'Check the browser console for a syntax error in that file.');
  var ro = el('#readout');
  if(ro) ro.innerHTML = 'Focus: <b>js/content.js failed to load</b>';
  C = { wall:{variants:1, columns:[420], gap:60}, effects:{}, projects:[
    {title:'Add a project', kind:'js/content.js', note:'Open js/content.js and add one.', code:'ADD'} ] };
}

var FX = C.effects || {};
var root = document.documentElement;
if(FX.grain === false)     root.classList.add('fx-no-grain');
if(FX.scanlines === false) root.classList.add('fx-no-scanlines');
if(FX.cursor === false)    root.classList.add('fx-no-cursor');
var DRIFT = FX.drift !== false;

var INK='#0A0A0B', PAPER='#EDEBE7', WINE='#A8202F';

function slug(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

var PROJECTS = C.projects.map(function(p,i){
  return {
    id:   slug(p.title || ('project-'+i)) || ('project-'+i),
    t:    p.title || 'Untitled',
    k:    p.kind  || '',
    note: p.note  || '',
    code: String(p.code || p.title || 'X').replace(/[^A-Za-z0-9]/g,'').slice(0,4).toUpperCase() || 'X',
    images: Array.isArray(p.images) ? p.images.filter(Boolean) : [],
    link: p.link || '',
    art:  null
  };
});
function byId(id){ for(var i=0;i<PROJECTS.length;i++) if(PROJECTS[i].id===id) return PROJECTS[i]; return null; }

var pc = el('#projCount');
if(pc) pc.textContent = PROJECTS.length + (PROJECTS.length===1 ? ' project' : ' projects');

/* =========================================================================
   AUTO LAYOUT — packs however many projects you have into the wall.
   ========================================================================= */
var CELL_W=1880, CELL_H=1700, SLOTS=[];

/* Tiles take the shape of their own image, so nothing is ever cropped.
   We need the real proportions before laying the wall out. */
var RATIO = {};
function measureImages(done){
  var paths=[];
  PROJECTS.forEach(function(p){
    p.images.forEach(function(s){ if(paths.indexOf(s)<0) paths.push(s); });
  });
  if(!paths.length) return done();
  var left=paths.length, fired=false;
  function finish(){ if(!fired){ fired=true; clearTimeout(timer); done(); } }
  function tick(){ if(--left<=0) finish(); }
  var timer=setTimeout(finish, 5000);   /* never let a slow image block the wall */
  paths.forEach(function(src){
    var im=new Image();
    im.onload=function(){
      if(im.naturalWidth) RATIO[src]=im.naturalHeight/im.naturalWidth;
      tick();
    };
    im.onerror=tick;
    im.src=src;
  });
}

function buildSlots(){
  var cfg   = C.wall || {};
  var COLW  = (cfg.columns && cfg.columns.length) ? cfg.columns : [420,380,440,400];
  var GAP   = cfg.gap > 0 ? cfg.gap : 60;
  var NC    = COLW.length;
  var VAR   = Math.max(1, Math.min(6, cfg.variants|0 || 3));
  var RATIOS  = [1.32, 1.00, 0.5625, 1.26, 0.76, 1.48, 0.62];
  var STAGGER = [0, 140, 70, 200, 110, 40];

  /* project-major order, so two tiles next to each other are never the same piece */
  var list=[], v, i;
  for(v=0; v<VAR; v++) for(i=0; i<PROJECTS.length; i++) list.push({p:PROJECTS[i], v:v});

  var xs=[], x=GAP/2, c;
  for(c=0;c<NC;c++){ xs.push(x); x += COLW[c] + GAP; }
  CELL_W = Math.round(x - GAP/2);

  var ys=[], slots=[];
  for(c=0;c<NC;c++) ys.push(STAGGER[c % STAGGER.length]);

  for(i=0;i<list.length;i++){
    c = i % NC;
    var w = COLW[c];
    var own = list[i].p.images.length ? list[i].p.images[list[i].v % list[i].p.images.length] : null;
    var ratio = (own && RATIO[own]) ? RATIO[own] : RATIOS[(i*2 + c) % RATIOS.length];
    if(ratio < .35) ratio = .35;
    if(ratio > 2.2) ratio = 2.2;
    var h = Math.round(w * ratio);
    var light = (i % 3 === 1);
    var mode = (i*3) % 5;
    if(light && (mode===1 || mode===4)) mode = (mode===1 ? 0 : 3);  /* light needs a light-capable mode */
    slots.push({ x:xs[c], top:ys[c], w:w, h:h, p:list[i].p, v:list[i].v, mode:mode, light:light, art:null });
    ys[c] += h + GAP;
  }
  CELL_H = Math.max(600, Math.round(Math.max.apply(null, ys)));
  SLOTS = slots;
}
buildSlots();

/* =========================================================================
   POSTER GENERATOR — only runs for projects with no images.
   ========================================================================= */
function hashStr(s){ var h=2166136261>>>0; for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619);} return h>>>0; }
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hex2rgb(h){ return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]; }
function mix(a,b,t){ var A=hex2rgb(a),B=hex2rgb(b);
  return 'rgb('+Math.round(A[0]+(B[0]-A[0])*t)+','+Math.round(A[1]+(B[1]-A[1])*t)+','+Math.round(A[2]+(B[2]-A[2])*t)+')'; }

var grainPat=null;
function grain(x){
  if(!grainPat){
    var n=128, g=document.createElement('canvas'); g.width=g.height=n;
    var gc=g.getContext('2d'), d=gc.createImageData(n,n);
    for(var i=0;i<n*n;i++){ var v=(Math.random()*255)|0; d.data[i*4]=v; d.data[i*4+1]=v; d.data[i*4+2]=v; d.data[i*4+3]=255; }
    gc.putImageData(d,0,0); grainPat=g;
  }
  x.save(); x.globalAlpha=.09; x.globalCompositeOperation='overlay';
  x.fillStyle=x.createPattern(grainPat,'repeat'); x.fillRect(0,0,x.canvas.width,x.canvas.height); x.restore();
}

function makeField(r){
  var ws=[], i;
  for(i=0;i<4;i++) ws.push({a:r()*TAU, f:1.1+r()*4.4, p:r()*TAU, w:.35+r()*.85});
  var bx=.15+r()*.7, by=.15+r()*.7;
  return function(u,v){
    var s=0,t=0,k;
    for(var j=0;j<ws.length;j++){ k=ws[j]; s+=k.w*Math.sin((u*Math.cos(k.a)+v*Math.sin(k.a))*k.f*Math.PI+k.p); t+=k.w; }
    var val=.5+.5*(s/t);
    var d=Math.sqrt((u-bx)*(u-bx)+(v-by)*(v-by));
    val=val*.6+(1-Math.min(1,d*1.3))*.4;
    return val<0?0:val>1?1:val;
  };
}

function poster(slot){
  var W=Math.round(slot.w), H=Math.round(slot.h);
  var c=document.createElement('canvas'); c.width=W; c.height=H;
  var x=c.getContext('2d');
  var r=mulberry32(hashStr(slot.p.id+'#'+slot.v));
  var F=makeField(r), mode=slot.mode, light=slot.light;
  var gx,gy,v,rad,s;

  x.fillStyle = light?PAPER:INK; x.fillRect(0,0,W,H);

  if(mode===0){                                     /* twin halftone screens */
    s=6+Math.round(r()*3);
    x.fillStyle = light?INK:PAPER;
    for(gy=0;gy<H+s;gy+=s) for(gx=0;gx<W+s;gx+=s){
      v=F(gx/W,gy/H); rad=s*.56*Math.pow(v,1.5);
      if(rad>.25){ x.beginPath(); x.arc(gx,gy,rad,0,TAU); x.fill(); }
    }
    x.globalCompositeOperation = light?'multiply':'screen'; x.fillStyle=WINE;
    for(gy=s/2;gy<H+s;gy+=s) for(gx=s/2;gx<W+s;gx+=s){
      v=1-F(gx/W,gy/H); rad=s*.46*Math.pow(v,1.9);
      if(rad>.25){ x.beginPath(); x.arc(gx,gy,rad,0,TAU); x.fill(); }
    }
    x.globalCompositeOperation='source-over';

  } else if(mode===1){                              /* quantised bands, screened */
    s=4; var bands=4+Math.floor(r()*4);
    var cw=Math.ceil(W/s), ch=Math.ceil(H/s);
    var buf=new Float32Array(cw*ch), i2=0;
    for(gy=0;gy<ch;gy++) for(gx=0;gx<cw;gx++) buf[i2++]=F(gx*s/W, gy*s/H);
    for(var b=0;b<bands;b++){
      var lo=b/bands, hi=(b+1)/bands, q2=b/(bands-1||1);
      x.fillStyle = q2<.6 ? mix(INK,WINE,.18+Math.pow(q2/.6,1.05)*.82)
                          : mix(WINE,PAPER,(q2-.6)/.4*.92);
      i2=0;
      for(gy=0;gy<ch;gy++) for(gx=0;gx<cw;gx++){ v=buf[i2++]; if(v>=lo&&v<hi) x.fillRect(gx*s,gy*s,s,s); }
    }
    var bs=7+Math.round(r()*2);
    x.fillStyle='rgba(8,8,9,.9)';
    for(gy=0;gy<H+bs;gy+=bs) for(gx=0;gx<W+bs;gx+=bs){
      v=F(gx/W,gy/H); rad=bs*.54*(1-Math.pow(v,.7));
      if(rad>.3){ x.beginPath(); x.arc(gx,gy,rad,0,TAU); x.fill(); }
    }
    x.fillStyle=PAPER; x.fillRect(0,H*(.12+r()*.72),W,1.5);

  } else if(mode===2){                              /* type lockup, slice displaced */
    x.fillStyle = light?mix(PAPER,WINE,.1):mix(INK,WINE,.3); x.fillRect(0,0,W,H);
    var fs=Math.round(H*(slot.p.code.length>3?.36:.5));
    x.font='800 '+fs+'px Inter, "Helvetica Neue", Helvetica, Arial, sans-serif';
    x.fillStyle = light?INK:PAPER; x.textBaseline='middle';
    var tw=x.measureText(slot.p.code).width;
    x.fillText(slot.p.code, (W-tw)/2+(r()-.5)*W*.12, H*(.36+r()*.28));
    for(var sl=0;sl<7;sl++){
      var sy=Math.floor(r()*H), sh=2+Math.floor(r()*Math.max(3,H*.05));
      x.drawImage(c,0,sy,W,sh,Math.round((r()-.5)*W*.26),sy,W,sh);
    }
    x.fillStyle=WINE; x.fillRect(0,H*(.2+r()*.6),W,3+r()*4);

  } else if(mode===3){                              /* scanline field */
    for(gy=0;gy<H;gy+=2){
      v=F(.5+Math.sin(gy*.013)*.35, gy/H);
      x.fillStyle = light ? 'rgba(10,10,11,'+(v*.8).toFixed(3)+')' : 'rgba(237,235,231,'+(v*.82).toFixed(3)+')';
      x.fillRect(Math.abs(Math.sin(gy*.07))>.965 ? (r()-.5)*W*.22 : 0, gy, W, 1);
    }
    x.globalCompositeOperation = light?'multiply':'overlay';
    var g=x.createLinearGradient(0,0,W,H);
    g.addColorStop(0,WINE); g.addColorStop(.58,'rgba(0,0,0,0)'); g.addColorStop(1,WINE);
    x.fillStyle=g; x.fillRect(0,0,W,H);
    x.globalCompositeOperation='source-over';
    x.fillStyle = light?WINE:'rgba(237,235,231,.85)'; x.fillRect(0,H*(.25+r()*.5),W,1.5);

  } else {                                          /* bloom, then halftoned */
    x.globalCompositeOperation='screen';
    for(var o=0;o<4;o++){
      var ox=r()*W, oy=r()*H, orad=(.25+r()*.45)*Math.max(W,H);
      var rg=x.createRadialGradient(ox,oy,0,ox,oy,orad);
      rg.addColorStop(0, o%2 ? WINE : mix(WINE,PAPER,.8)); rg.addColorStop(1,'rgba(0,0,0,0)');
      x.fillStyle=rg; x.fillRect(0,0,W,H);
    }
    x.globalCompositeOperation='source-over';
    var src=x.getImageData(0,0,W,H).data;
    x.fillStyle=INK; x.fillRect(0,0,W,H);
    s=5;
    var buckets=[[WINE,[]],[PAPER,[]]];
    for(gy=0;gy<H;gy+=s) for(gx=0;gx<W;gx+=s){
      var idx=((gy*W)+gx)*4;
      var lum=(.299*src[idx]+.587*src[idx+1]+.114*src[idx+2])/255;
      if(lum<.05) continue;
      buckets[lum>.42?1:0][1].push(gx,gy,s*.62*Math.pow(lum,.5));
    }
    for(var bi=0;bi<2;bi++){
      x.fillStyle=buckets[bi][0]; var arr=buckets[bi][1];
      for(var q=0;q<arr.length;q+=3){ x.beginPath(); x.arc(arr[q],arr[q+1],arr[q+2],0,TAU); x.fill(); }
    }
  }

  grain(x);
  var vg=x.createRadialGradient(W/2,H*.45,0,W/2,H*.45,Math.max(W,H)*.78);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1, light?'rgba(5,5,6,.2)':'rgba(5,5,6,.42)');
  x.fillStyle=vg; x.fillRect(0,0,W,H);
  return c.toDataURL('image/jpeg',.84);
}

/* =========================================================================
   THE WALL — infinite drag canvas. Never steals the wheel.
   ========================================================================= */
var board=el('#board'), wrap=el('#wrap'), readout=el('#readout');
var px=0, py=0, vx=0, vy=0, dragging=false, moved=0;
var lastX=0, lastY=0, ptrX=-9999, ptrY=-9999, ptrIn=false;
var drift=Math.random()*TAU, hot=null, tiles=[], visible=false;
var S=.72, CW=CELL_W, CH=CELL_H, FOCUS_R=245;

function buildWall(){
  var r=board.getBoundingClientRect(), vw=window.innerWidth;
  /* keep the cell wider than the viewport so copies never sit side by side */
  S = Math.min(1.05, Math.max(.42, (vw+200)/CELL_W));
  CW=CELL_W*S; CH=CELL_H*S; FOCUS_R=340*S;
  var cols=Math.ceil(r.width/CW)+1, rows=Math.ceil(r.height/CH)+1;
  wrap.textContent=''; tiles=[];
  var frag=document.createDocumentFragment();
  for(var j=0;j<rows;j++) for(var i=0;i<cols;i++){
    var cell=document.createElement('div');
    cell.className='cell';
    cell.style.transform='translate3d('+(i*CW)+'px,'+(j*CH)+'px,0)';
    for(var n=0;n<SLOTS.length;n++){
      var sl=SLOTS[n];
      var t=document.createElement('div');
      t.className='tile';
      t.style.cssText='left:'+(sl.x*S)+'px;top:'+(sl.top*S)+'px;width:'+(sl.w*S)+'px;height:'+(sl.h*S)+'px';
      t.innerHTML='<img data-k="'+n+'" alt=""><div class="dots"></div>'
        +'<div class="tile-cap"><b></b><i></i></div>';
      t.querySelector('.tile-cap b').textContent = sl.p.t;
      t.querySelector('.tile-cap i').textContent = sl.p.k;
      if(sl.art) t.firstChild.src=sl.art;
      cell.appendChild(t);
      tiles.push({e:t, cx:(i*CELL_W+sl.x+sl.w/2)*S, cy:(j*CELL_H+sl.top+sl.h/2)*S, p:sl.p, f:-1});
    }
    frag.appendChild(cell);
  }
  wrap.appendChild(frag);
}

function frame(){
  if(visible){
    if(!dragging){
      px+=vx; py+=vy; vx*=.94; vy*=.94;
      if(Math.abs(vx)<.05) vx=0;
      if(Math.abs(vy)<.05) vy=0;
      if(DRIFT && !RM && !vx && !vy){ drift+=.0018; px+=Math.cos(drift)*.28; py+=Math.sin(drift*.72)*.22; }
    }
    var wx=((px%CW)+CW)%CW-CW, wy=((py%CH)+CH)%CH-CH;
    wrap.style.transform='translate3d('+wx+'px,'+wy+'px,0)';

    var best=null, bestF=0, i, t, f;
    for(i=0;i<tiles.length;i++){
      t=tiles[i]; f=0;
      if(ptrIn){
        var dx=wx+t.cx-ptrX, dy=wy+t.cy-ptrY;
        var d=Math.sqrt(dx*dx+dy*dy);
        f = d<FOCUS_R ? 1-d/FOCUS_R : 0;
        f = f*f*(3-2*f);
      }
      if(f>bestF){ bestF=f; best=t; }
      if(Math.abs(f-t.f)>.008){
        t.f=f;
        t.e.style.transform = f ? 'scale('+(1+f*.075).toFixed(4)+')' : '';
        t.e.style.filter='saturate('+(.55+f*.6).toFixed(3)+') brightness('+(.92+f*.26).toFixed(3)+') contrast('+(1.03+f*.09).toFixed(3)+')';
        t.e.style.zIndex = f>.55 ? 2 : '';
      }
      var isHot = (t===best && bestF>.72);
      if(isHot !== t.e.classList.contains('hot')) t.e.classList.toggle('hot', isHot);
    }
    var label=(bestF>.72 && best) ? best.p : null;
    if(label!==hot){ hot=label; readout.innerHTML='Focus: <b>'+(hot?hot.t+' · '+hot.k:'—')+'</b>'; }
  }
  tickFrame(); cursorFrame();
  requestAnimationFrame(frame);
}

board.addEventListener('pointerdown', function(e){
  dragging=true; moved=0; vx=vy=0; board.classList.add('dragging');
  try{ board.setPointerCapture(e.pointerId); }catch(err){}
  lastX=e.clientX; lastY=e.clientY;
});
board.addEventListener('pointermove', function(e){
  var r=board.getBoundingClientRect();
  ptrX=e.clientX-r.left; ptrY=e.clientY-r.top; ptrIn=true;
  if(!dragging) return;
  var dx=e.clientX-lastX, dy=e.clientY-lastY;
  px+=dx; py+=dy; vx=dx*.6; vy=dy*.6;
  moved+=Math.abs(dx)+Math.abs(dy);
  lastX=e.clientX; lastY=e.clientY;
});
function endDrag(){ if(!dragging) return; dragging=false; board.classList.remove('dragging'); if(moved<7&&hot) openSheet(hot); }
board.addEventListener('pointerup', endDrag);
board.addEventListener('pointercancel', function(){ dragging=false; board.classList.remove('dragging'); });
board.addEventListener('pointerleave', function(){ ptrIn=false; endDrag(); });

if('IntersectionObserver' in window){
  new IntersectionObserver(function(en){ visible=en[0].isIntersecting; },{rootMargin:'120px'}).observe(board);
} else visible=true;

/* =========================================================================
   INDEX, HOVER PREVIEW, DETAIL SHEET
   ========================================================================= */
var idx=el('#idx'), peek=el('#peek'), peekImg=peek.querySelector('img');
PROJECTS.forEach(function(p,i){
  var b=document.createElement('button');
  b.type='button'; b.className='idx-row'; b.dataset.id=p.id;
  b.innerHTML='<span class="n"></span><span class="t"></span><span class="k"></span>';
  b.children[0].textContent=String(i+1).padStart(2,'0');
  b.children[1].textContent=p.t;
  b.children[2].textContent=p.k;
  idx.appendChild(b);
});

idx.addEventListener('pointerover', function(e){
  var row=e.target.closest('.idx-row'); if(!row) return;
  var p=byId(row.dataset.id); if(!p||!p.art) return;
  peekImg.src=p.art;
  peek.style.left=e.clientX+'px'; peek.style.top=e.clientY+'px';
  peek.classList.add('on');
});
idx.addEventListener('pointerout', function(e){
  if(!e.relatedTarget||!e.relatedTarget.closest||!e.relatedTarget.closest('.idx')) peek.classList.remove('on');
});
idx.addEventListener('click', function(e){
  var row=e.target.closest('.idx-row'); if(row) openSheet(byId(row.dataset.id));
});

var sheet=el('#sheet'), sheetLink=el('#sheetLink');
var sheetImg=el('#sheetImg'), sheetPrev=el('#sheetPrev'), sheetNext=el('#sheetNext');
var gal={p:null, i:0};

function galleryOf(p){
  if(p.images.length) return p.images;
  if(p.gallery && p.gallery.length) return p.gallery;
  return p.art ? [p.art] : [];
}
function renderSheet(){
  var p=gal.p; if(!p) return;
  var list=galleryOf(p);
  if(!list.length) list=[''];
  if(gal.i<0) gal.i=list.length-1;
  if(gal.i>=list.length) gal.i=0;
  sheetImg.src=list[gal.i];
  sheetImg.alt=p.t + (list.length>1 ? ', image '+(gal.i+1)+' of '+list.length : '');
  el('#sheetCount').textContent = list.length>1 ? (gal.i+1)+' / '+list.length : '';
  sheetPrev.hidden = sheetNext.hidden = list.length<2;
  sheetImg.style.cursor = list.length>1 ? 'zoom-in' : 'default';
}
function step(d){ gal.i+=d; renderSheet(); }

function openSheet(p){
  if(!p) return;
  gal.p=p; gal.i=0;
  el('#sheetKind').textContent=p.k;
  el('#sheetTitle').textContent=p.t;
  el('#sheetNote').textContent=p.note;
  if(p.link){ sheetLink.href=p.link; sheetLink.hidden=false; } else sheetLink.hidden=true;
  renderSheet();
  sheet.classList.add('on'); el('.sheet-in').focus();
}
function closeSheet(){ sheet.classList.remove('on'); gal.p=null; }

el('#sheetClose').addEventListener('click', closeSheet);
sheetPrev.addEventListener('click', function(e){ e.stopPropagation(); step(-1); });
sheetNext.addEventListener('click', function(e){ e.stopPropagation(); step(1); });
sheetImg.addEventListener('click', function(e){ e.stopPropagation(); if(galleryOf(gal.p||{images:[]}).length>1) step(1); });
sheet.addEventListener('click', function(e){
  if(e.target===sheet || e.target.classList.contains('sheet-in') || e.target.classList.contains('sheet-art')) closeSheet();
});
document.addEventListener('keydown', function(e){
  if(e.key==='Escape') return closeSheet();
  if(!sheet.classList.contains('on')) return;
  if(e.key==='ArrowLeft'){ e.preventDefault(); step(-1); }
  if(e.key==='ArrowRight'){ e.preventDefault(); step(1); }
});

/* =========================================================================
   EASED IN-PAGE SCROLL
   ========================================================================= */
var gliding=false;
function ease(t){ return t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; }
function glideTo(target){
  var start=window.scrollY;
  var end=Math.max(0, Math.min(
    document.documentElement.scrollHeight-window.innerHeight,
    target.getBoundingClientRect().top+start-(target.id==='top'?0:72)));
  var dist=end-start;
  if(!dist) return;
  if(RM){ window.scrollTo(0,end); return; }
  var dur=Math.min(1500, Math.max(650, Math.abs(dist)*.45)), t0=performance.now();
  gliding=true;
  (function step(now){
    if(!gliding) return;
    var k=Math.min(1,(now-t0)/dur);
    window.scrollTo(0, start+dist*ease(k));
    if(k<1) requestAnimationFrame(step); else gliding=false;
  })(t0);
}
['wheel','touchstart','keydown'].forEach(function(ev){
  window.addEventListener(ev, function(){ gliding=false; }, {passive:true});
});
document.addEventListener('click', function(e){
  var a=e.target.closest('a[href^="#"]'); if(!a) return;
  var t=document.getElementById(a.getAttribute('href').slice(1));
  if(!t) return;
  e.preventDefault(); glideTo(t);
  if(history.replaceState) history.replaceState(null,'',a.getAttribute('href'));
});

/* nav highlights the section you're looking at */
if('IntersectionObserver' in window){
  var navLinks=[].slice.call(document.querySelectorAll('.nav a'));
  var io=new IntersectionObserver(function(ents){
    ents.forEach(function(en){
      if(!en.isIntersecting) return;
      navLinks.forEach(function(a){ a.classList.toggle('here', a.getAttribute('href')==='#'+en.target.id); });
    });
  },{rootMargin:'-45% 0px -50% 0px'});
  ['work','index','about','contact'].forEach(function(id){
    var s=document.getElementById(id); if(s) io.observe(s);
  });
}

/* =========================================================================
   TICKER, SCROLL DOTS, CURSOR, CLOCK
   ========================================================================= */
var tick=el('#tick'), tx=0, tickW=0, scrollV=0, lastScroll=window.scrollY;
(function(){
  var raw=(tick.dataset.words||'Brand identity / Posters / Editorial / Motion').split('/');
  var inner='<span>';
  raw.forEach(function(w){ inner += w.trim()+' <em>/</em> '; });
  inner+='</span>';
  tick.innerHTML = new Array(7).join(inner);
})();
function measureTick(){ tickW=tick.firstChild ? tick.firstChild.getBoundingClientRect().width : 0; }
function tickFrame(){
  if(!tickW) measureTick();
  tx-=(RM?0:.5)+Math.min(7,Math.abs(scrollV)*.14);
  if(tickW && tx<=-tickW) tx+=tickW;
  tick.style.transform='translate3d('+tx.toFixed(2)+'px,0,0)';
  scrollV*=.9;
}

var dotsWrap=el('#dots'), dotEls=[];
for(var di=0; di<5; di++){ var dd=document.createElement('span'); dd.className='pdot'; dotsWrap.appendChild(dd); dotEls.push(dd); }
function onScroll(){
  var y=window.scrollY, dy=y-lastScroll;
  lastScroll=y; scrollV=dy;
  if(visible) py-=dy*.26;
  var max=document.documentElement.scrollHeight-window.innerHeight;
  var prog=max>0?y/max:0;
  for(var i=0;i<5;i++) dotEls[i].classList.toggle('on', prog>=i/5+.001);
}
window.addEventListener('scroll', onScroll, {passive:true});

var cur=el('#cur'), curLabel=cur.querySelector('span');
var cxp=-100, cyp=-100, ctx=-100, cty=-100;
window.addEventListener('pointermove', function(e){
  if(e.pointerType!=='mouse') return;
  ctx=e.clientX; cty=e.clientY; cur.classList.add('on');
  if(peek.classList.contains('on')){ peek.style.left=e.clientX+'px'; peek.style.top=e.clientY+'px'; }
  var over=e.target.closest ? e.target.closest('#board, a, button') : null;
  if(over && over.id==='board'){ cur.classList.add('big'); curLabel.textContent='Drag'; }
  else if(over){ cur.classList.add('big'); curLabel.textContent='Open'; }
  else cur.classList.remove('big');
});
function cursorFrame(){
  cxp+=(ctx-cxp)*.22; cyp+=(cty-cyp)*.22;
  cur.style.transform='translate3d('+cxp.toFixed(1)+'px,'+cyp.toFixed(1)+'px,0)';
}

var c1=el('#clock'), c2=el('#clock2');
function clock(){
  var n=new Date();
  try{
    c1.textContent=n.toLocaleTimeString('en-GB',{timeZone:'Europe/Oslo',hour12:false})+' Molde';
    c2.textContent=n.toLocaleTimeString('en-GB',{timeZone:'Europe/Oslo',hour12:false,hour:'2-digit',minute:'2-digit'});
  }catch(e){
    c1.textContent=n.toTimeString().slice(0,8)+' Molde';
    c2.textContent=n.toTimeString().slice(0,5);
  }
}
clock(); setInterval(clock,1000);

/* =========================================================================
   BOOT
   ========================================================================= */
onScroll(); requestAnimationFrame(frame);

function paint(n, src){
  var imgs=wrap.querySelectorAll('img[data-k="'+n+'"]');
  for(var i=0;i<imgs.length;i++) imgs[i].src=src;
}

var q=0;
function fill(){
  var budget=3;
  while(budget-- > 0 && q<SLOTS.length){
    var sl=SLOTS[q];
    if(!sl.art){
      var own = sl.p.images.length ? sl.p.images[sl.v % sl.p.images.length] : null;
      if(own){ sl.art = own; }
      else { try{ sl.art = poster(sl); }catch(e){ sl.art=''; } }
      if(sl.art){
        if(!sl.p.art) sl.p.art = sl.art;
        if(!sl.p.images.length){ (sl.p.gallery = sl.p.gallery || []).push(sl.art); }
        paint(q, sl.art);
      }
    }
    q++;
  }
  if(q<SLOTS.length) requestAnimationFrame(fill);
}
/* real images should be assigned to p.art immediately, before generation runs */
PROJECTS.forEach(function(p){ if(p.images.length) p.art = p.images[0]; });

function start(){
  buildSlots();                 /* re-run now that real proportions are known */
  buildWall();
  requestAnimationFrame(fill);
}
measureImages(function(){
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(start);
  else start();
});

var rt;
window.addEventListener('resize', function(){
  clearTimeout(rt);
  rt=setTimeout(function(){ buildWall(); measureTick(); for(var i=0;i<SLOTS.length;i++) if(SLOTS[i].art) paint(i, SLOTS[i].art); }, 220);
});

})();
