// ============================================================
//  SUPER JAMES  🥦
//  COM676 Interactive Computer Graphics – AT1
//
//  Controls:
//    A / ← = move left      D / → = move right
//    W / ↑ / SPACE = jump   R = restart
//
//  Hit broccoli blocks from below to grow BIG!
//  Stomp chocolates, sweets & lollies to score!
//  Reach the HOME door at the end to win!
// ============================================================

const GRAVITY   = 0.58;
const JUMP_SM   = -13;
const JUMP_BIG  = -14.5;
const SPEED_SM  = 4.2;
const SPEED_BIG = 4.8;
const TILE      = 48;
const GROUND_Y  = 488;
const WORLD_W   = 5200;

let cam, player, platforms, collectibles, enemies;
let particles, windows, outsideClouds;
let score, broccoliEaten, enemiesStomped;
let gameState;
let keys = {};
let moveLeft=false, moveRight=false, moveJump=false;
// SVG sprites loaded via loadImage() — SVG/Images technology
let spriteJames = [];   // [idle, walk1, walk2, jump]
let spriteChocolate, spriteSweet, spriteLolly;
let trailBuffer;   // createGraphics() offscreen buffer for motion trail

// ─── PRELOAD — load SVG assets before sketch starts ─────────
function preload() {
  spriteJames[0]   = loadImage('james_idle.svg');   // idle
  spriteJames[1]   = loadImage('james_walk1.svg');  // walk frame 1
  spriteJames[2]   = loadImage('james_walk2.svg');  // walk frame 2
  spriteJames[3]   = loadImage('james_jump.svg');   // jump/air
  spriteChocolate  = loadImage('chocolate.svg');
  spriteSweet      = loadImage('sweet.svg');
  spriteLolly      = loadImage('lolly.svg');
}

// ─── SETUP ───────────────────────────────────────────────────
function setup() {
  createCanvas(960, 560);
  colorMode(HSB, 360, 100, 100, 100);
  angleMode(DEGREES);
  noStroke();
  // createGraphics() — offscreen buffer used as SVG/image layer for motion trail
  trailBuffer = createGraphics(960, 560);
  trailBuffer.colorMode(HSB, 360, 100, 100, 100);
  trailBuffer.angleMode(DEGREES);
  initWorld();
}

// ─── WORLD INIT ──────────────────────────────────────────────
function initWorld() {
  score = 0; broccoliEaten = 0; enemiesStomped = 0;
  gameState = "play"; cam = 0;
  particles = []; clouds = []; decorations = [];
  if (trailBuffer) trailBuffer.clear();

  player = {
    x:100, y:GROUND_Y-52,
    vx:0, vy:0, w:34, h:50,
    big:false, onGround:false,
    facingRight:true,
    animFrame:0, animTimer:0,
    invincible:0, dead:false,
    lives:3, growTimer:0, jumpConsumed:false,
  };

  // Windows — fixed positions along the world wall
  windows = [];
  outsideClouds = [];
  const winPositions = [180, 520, 980, 1450, 1950, 2480, 3000, 3520, 4050, 4580];
  for (let wx of winPositions) {
    windows.push({ x:wx, y:100, w:130, h:110 });
    outsideClouds.push({ wx, x:random(wx-20, wx+60), y:random(115,165), w:random(50,90), spd:random(0.3,0.7) });
    outsideClouds.push({ wx, x:random(wx+20, wx+100), y:random(130,175), w:random(40,70), spd:random(0.2,0.5) });
  }

  // ── Platforms ──────────────────────────────────────────────
  platforms = [];
  const plats = [
    [280,370,144,"shelf"],[500,290,192,"sofa"],[750,360,96,"shelf"],
    [900,260,144,"table"],[1100,330,96,"shelf"],[1280,220,192,"sofa"],
    [1500,310,96,"table"],[1700,240,144,"shelf"],[1950,180,96,"sofa"],
    [2150,300,192,"table"],[2400,200,96,"shelf"],[2600,280,144,"sofa"],
    [2800,160,192,"table"],[3050,250,96,"shelf"],[3250,340,144,"sofa"],
    [3500,210,96,"table"],[3700,290,192,"shelf"],[3950,180,96,"sofa"],
    [4200,260,144,"table"],[4450,200,96,"shelf"],[4700,320,144,"sofa"],
  ];
  for (let [x,y,w,type] of plats)
    platforms.push({x,y,w,h:TILE,type});

    // ── Collectibles ───────────────────────────────────────────
  collectibles = [];
  const brocBlocks = [
    [310,322],[560,242],[930,212],[1310,172],
    [1960,132],[2430,152],[2830,112],[3510,162],[3960,132],[4460,152],
  ];
  for (let [x,y] of brocBlocks)
    collectibles.push({x,y,w:TILE,h:TILE,type:"broccoli",collected:false,bobY:0});

  const groundItems = [
    [220,"football"],[400,"football"],[600,"toy"],[820,"book"],
    [1050,"toy"],[1350,"football"],[1600,"book"],[1800,"toy"],
    [2000,"football"],[2200,"book"],[2500,"toy"],[2700,"football"],
    [2900,"book"],[3100,"toy"],[3400,"football"],[3600,"book"],
    [3800,"toy"],[4000,"football"],[4300,"book"],[4600,"toy"],[4900,"football"],
  ];
  for (let [gx,type] of groundItems)
    collectibles.push({x:gx,y:GROUND_Y-32,w:32,h:32,type,collected:false,bobY:0});

  // ── Enemies ────────────────────────────────────────────────
  enemies = [];
  const eDefs = [
    [450,GROUND_Y-40,"chocolate"],[680,GROUND_Y-40,"sweet"],
    [880,GROUND_Y-40,"chocolate"],[1070,GROUND_Y-40,"lolly"],
    [1200,GROUND_Y-40,"sweet"],[1480,GROUND_Y-40,"chocolate"],
    [1750,GROUND_Y-40,"sweet"],[2050,GROUND_Y-40,"lolly"],
    [2320,GROUND_Y-40,"chocolate"],[2550,GROUND_Y-40,"sweet"],
    [2720,GROUND_Y-40,"lolly"],[2980,GROUND_Y-40,"chocolate"],
    [3180,GROUND_Y-40,"sweet"],[3420,GROUND_Y-40,"lolly"],
    [3650,GROUND_Y-40,"chocolate"],[3870,GROUND_Y-40,"sweet"],
    [4100,GROUND_Y-40,"lolly"],[4330,GROUND_Y-40,"chocolate"],
    [4550,GROUND_Y-40,"sweet"],[4750,GROUND_Y-40,"lolly"],
    [540,254,"sweet"],[960,224,"chocolate"],[1720,204,"lolly"],
    [2820,124,"sweet"],[4470,164,"chocolate"],
  ];
  for (let [ex,ey,type] of eDefs) {
    enemies.push({
      x:ex,y:ey,vx:random([-1.4,1.4]),w:38,h:38,type,
      alive:true,deathTimer:0,patrolOrigin:ex,patrolRange:random(55,125),
      animFrame:0,animTimer:0,
    });
  }
}

// ─── MAIN DRAW ───────────────────────────────────────────────
function draw() {
  if (gameState==="play") { updateAll(); renderAll(); }
  else if (gameState==="win")  { renderAll(); drawWinScreen(); }
  else                         { renderAll(); drawDeadScreen(); }
}

// ─── UPDATE ──────────────────────────────────────────────────
function updateAll() {
  // Drift outside clouds within their window bounds
  for (let cl of outsideClouds) {
    cl.x -= cl.spd;
    if (cl.x + cl.w < cl.wx - 10) cl.x = cl.wx + 140;
  }
  for (let c of collectibles) if(!c.collected) c.bobY=sin(frameCount*3+c.x)*3;
  updatePlayer(); updateEnemies(); updateParticles();
  cam = constrain(player.x - width*0.32, 0, WORLD_W-width);
}

function updatePlayer() {
  if (player.dead) return;
  if (player.growTimer>0) player.growTimer--;

  let spd  = player.big ? SPEED_BIG  : SPEED_SM;
  let jmpF = player.big ? JUMP_BIG   : JUMP_SM;

  // Movement — always allow left/right, instant stop when no key held
  if      (moveLeft)  { player.vx=-spd; player.facingRight=false; }
  else if (moveRight) { player.vx= spd; player.facingRight=true;  }
  else { player.vx=0; }

  if (moveJump && player.onGround && !player.jumpConsumed) {
    player.vy=jmpF; player.onGround=false;
    player.jumpConsumed=true;
    spawnDust(player.x, player.y+player.h);
  }

  player.vy+=GRAVITY;
  player.x +=player.vx;
  let prevY = player.y;
  player.y +=player.vy;
  player.x  =constrain(player.x,20,WORLD_W-20);
  if (player.y>700) { loseLife(); return; }

  player.onGround=false;
  if (player.y+player.h>=GROUND_Y) {
    player.y=GROUND_Y-player.h; player.vy=0; player.onGround=true;
    if (!moveLeft && !moveRight) player.vx=0;
  }

  for (let p of platforms) {
    if (rectHit(player,p)) {
      if (player.vy>0 && player.y+player.h-player.vy<=p.y+4) {
        player.y=p.y-player.h; player.vy=0; player.onGround=true;
        if (!moveLeft && !moveRight) player.vx=0;
      } else if (player.vy<0 && player.y-player.vy>=p.y+p.h-4) {
        player.y=p.y+p.h; player.vy=2;
      }
    }
  }

  // Broccoli blocks - robust prevY collision
  for (let c of collectibles) {
    if (c.collected||c.type!=="broccoli") continue;
    let pL=player.x-player.w/2, pR=player.x+player.w/2;
    let pT=player.y,             pB=player.y+player.h;
    let bL=c.x, bR=c.x+c.w, bT=c.y, bB=c.y+c.h;
    if (pR<=bL||pL>=bR) continue;            // no horizontal overlap
    // Hit from BELOW: head crossed block bottom this frame
    if (player.vy<0 && pT<=bB && prevY>=bB) {
      c.collected=true; player.big=true; player.h=62;
      player.growTimer=40; broccoliEaten++; score+=50;
      spawnBurst(c.x+c.w/2,c.y,12,[120,80,85],"leaf");
      player.vy=2; player.y=bB;
      continue;
    }
    // Land on TOP: feet crossed block top this frame — also collects broccoli
    if (player.vy>0 && pB>=bT && (prevY+player.h)<=bT+6) {
      player.y=bT-player.h; player.vy=0; player.onGround=true;
      if (!moveLeft && !moveRight) player.vx=0;
      c.collected=true; player.big=true; player.h=62;
      player.growTimer=40; broccoliEaten++; score+=50;
      spawnBurst(c.x+c.w/2,c.y,12,[120,80,85],"leaf");
    }
  }

  // Ground items
  for (let c of collectibles) {
    if (c.collected||c.type==="broccoli") continue;
    if (dist(player.x,player.y+player.h/2,c.x+c.w/2,c.y+c.h/2)<28) {
      c.collected=true; score+=10;
      spawnBurst(c.x,c.y,6,[40,70,100],"spark");
    }
  }

  // Enemy collision
  if (player.invincible>0) { player.invincible--; return; }
  for (let e of enemies) {
    if (!e.alive) continue;
    let er={x:e.x-e.w/2,y:e.y-e.h,w:e.w,h:e.h};
    if (rectHit(player,er)) {
      if (player.vy>0 && player.y+player.h<e.y-e.h*0.35) {
        e.alive=false; e.deathTimer=28; enemiesStomped++; score+=200;
        spawnBurst(e.x,e.y-e.h/2,10,[0,80,90],"star");
        player.vy=player.big?JUMP_SM*0.55:JUMP_SM*0.5;
      } else {
        if (player.big) {
          player.big=false; player.h=50; player.invincible=100;
          spawnBurst(player.x,player.y,10,[0,70,90],"spark");
        } else loseLife();
      }
    }
  }

  if (player.x>=WORLD_W-180) {
    gameState="win";
    spawnBurst(player.x,player.y,25,[55,90,100],"star");
  }

  player.animTimer++;
  if (abs(player.vx)>0.5&&player.onGround) {
    if (player.animTimer>7) { player.animFrame=(player.animFrame+1)%4; player.animTimer=0; }
  } else player.animFrame=0;
}

function updateEnemies() {
  for (let e of enemies) {
    if (!e.alive) { e.deathTimer--; continue; }
    e.x+=e.vx;
    if (e.x<e.patrolOrigin-e.patrolRange||e.x>e.patrolOrigin+e.patrolRange) e.vx*=-1;
    e.animTimer++;
    if (e.animTimer>14) { e.animFrame=(e.animFrame+1)%2; e.animTimer=0; }
  }
}

function updateParticles() {
  for (let i=particles.length-1;i>=0;i--) {
    let p=particles[i];
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.25; p.life--;
    if (p.life<=0) particles.splice(i,1);
  }
}

function loseLife() {
  player.lives--;
  spawnBurst(player.x,player.y,14,[0,85,90],"star");
  if (player.lives<=0) { gameState="dead"; player.dead=true; }
  else {
    player.x=max(80,cam+80); player.y=GROUND_Y-200;
    player.vx=0; player.vy=0;
    player.invincible=110; player.big=false; player.h=50;
  }
}

// ─── RENDER ──────────────────────────────────────────────────
function renderAll() {
  drawBackground();
  // Draw offscreen trail buffer as an image layer (SVG/Images technology)
  image(trailBuffer, 0, 0);
  // Fade the trail each frame — only wall area, not floor
  trailBuffer.noStroke();
  trailBuffer.fill(42, 22, 97, 18);
  trailBuffer.rect(0, 0, 960, GROUND_Y);
  push(); translate(-cam,0);
  drawDecorations(); drawWindows(); drawPlatforms();
  drawCollectibles(); drawEnemies();
  drawJames(); drawParticlesWorld(); drawEndDoor();
  pop();
  drawHUD();
}

// ── Sky colours (global, computed from player progress) ────────
function drawBackground() {
  background(42,22,97);
  // Wallpaper stripes (parallax)
  noStroke();
  for (let x=((-cam)*0.1)%60; x<width; x+=60) {
    fill(42,18,93,55); rect(x,0,28,GROUND_Y);
  }
  // Dot motif
  for (let xi=0;xi<width;xi+=60) {
    for (let yi=40;yi<GROUND_Y-50;yi+=60) {
      fill(42,30,88,38);
      ellipse(xi+((-cam)*0.1%60),yi,5,5);
    }
  }
  // Skirting board
  fill(35,25,88); rect(0,GROUND_Y-18,width,22);
  fill(35,15,96); rect(0,GROUND_Y-18,width,4);
  // Floor
  for (let x=((-cam)*0.6)%(TILE*2);x<width;x+=TILE*2) {
    fill(28,55,52); rect(x,GROUND_Y,TILE*2,120);
    fill(28,50,58);
    rect(x+TILE,GROUND_Y,TILE,60); rect(x,GROUND_Y+60,TILE,60);
    stroke(28,60,42,28); strokeWeight(1);
    for (let gx=x;gx<x+TILE*2;gx+=14) line(gx,GROUND_Y,gx,GROUND_Y+120);
    noStroke();
  }
}

function drawDecorations() {
  // Decorations now replaced by windows — nothing else to draw here
}

function drawPicture(d) {}

function drawWindows() {
  let t = constrain(player.x / (WORLD_W - 400), 0, 1);

  let skyH, skyS, skyB;
  if (t < 0.5) {
    let f = t * 2;
    skyH = lerp(210, 28, f); skyS = lerp(75, 85, f); skyB = lerp(92, 80, f);
  } else {
    let f = (t - 0.5) * 2;
    skyH = lerp(28, 240, f); skyS = lerp(85, 65, f); skyB = lerp(80, 14, f);
  }

  let starAlpha  = map(t, 0.55, 1.0, 0, 95, true);
  let cloudAlpha = map(t, 0.6,  1.0, 85, 20, true);
  for (let w of windows) {
    if (w.x + w.w < cam - 10 || w.x > cam + width + 10) continue;
    let wx = w.x, wy = w.y, ww = w.w, wh = w.h;

    // Outer wood frame
    fill(28, 55, 52); noStroke();
    rect(wx - 8, wy - 8, ww + 16, wh + 16, 6);

    // Clip all sky content to window pane
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(wx, wy, ww, wh);
    drawingContext.clip();

    // Sky fill
    fill(skyH, skyS, skyB);
    rect(wx, wy, ww, wh, 2);

    // Stars
    if (starAlpha > 2) {
      randomSeed(wx * 7 + 42);
      for (let i = 0; i < 12; i++) {
        let sx = wx + random(ww);
        let sy = wy + random(wh * 0.7);
        let sr = random(0.8, 2.2);
        let twinkle = 60 + 35 * sin(frameCount * 0.06 * (i + 1) + wx + i);
        fill(55, 5, 100, starAlpha * (twinkle / 95));
        ellipse(sx, sy, sr * 2);
      }
      randomSeed();
    }

    // Horizon glow at sunset
    if (t > 0.35 && t < 0.7) {
      let glowA = map(t, 0.35, 0.5, 0, 50) - map(t, 0.5, 0.7, 0, 50);
      for (let r = 40; r > 0; r -= 8) {
        fill(28, 80, 95, glowA * (r / 40) * 0.4);
        ellipse(wx + ww/2, wy + wh, r * 2.5, r);
      }
    }

    // Clouds (clipped to window by drawingContext.clip above)
    fill(0, 0, 100, cloudAlpha); noStroke();
    for (let cl of outsideClouds) {
      if (cl.wx !== wx) continue;
      let cr = cl.w * 0.25;
      ellipse(cl.x,        cl.y,        cr*2.2, cr*1.5);
      ellipse(cl.x+cr,     cl.y-cr*0.4, cr*1.8, cr*1.4);
      ellipse(cl.x+cr*2,   cl.y,        cr*2.0, cr*1.4);
    }

    drawingContext.restore(); // end clip

    // Cross-bar (on top of sky)
    fill(28, 55, 52); noStroke();
    rect(wx, wy + wh/2 - 4, ww, 8);
    rect(wx + ww/2 - 4, wy, 8, wh);

    // Frame inner border
    stroke(28, 60, 42); strokeWeight(2); noFill();
    rect(wx, wy, ww, wh, 2);
    noStroke();

    // Glass shimmer
    fill(0, 0, 100, 12);
    rect(wx + 4, wy + 4, ww/2 - 8, wh - 8, 2);

    // Window sill
    fill(28, 50, 58);
    rect(wx - 10, wy + wh + 8, ww + 20, 10, 2);
    fill(28, 40, 70, 60);
    rect(wx - 10, wy + wh + 8, ww + 20, 3, 2);
  }
}

function drawPlatforms() {
  for (let p of platforms) {
    if (p.x+p.w<cam-TILE||p.x>cam+width+TILE) continue;
    if (p.type==="shelf") drawShelf(p);
    else if (p.type==="sofa") drawSofa(p);
    else drawTable(p);
  }
}

function drawShelf(p) {
  fill(28,50,40);
  rect(p.x+4,p.y+4,8,TILE-4); rect(p.x+p.w-12,p.y+4,8,TILE-4);
  fill(28,55,62); rect(p.x,p.y,p.w,12,2);
  stroke(28,60,50,40); strokeWeight(1);
  for (let lx=p.x+6;lx<p.x+p.w-4;lx+=12) line(lx,p.y+2,lx,p.y+10);
  noStroke();
  let bCols=[200,0,120,280,55]; let bx=p.x+4;
  for (let i=0;i<floor(p.w/16);i++) {
    let bh=18+((i*7)%12);
    fill(bCols[i%bCols.length],70,80); rect(bx,p.y-bh,13,bh,1);
    fill(bCols[i%bCols.length],60,95,60); rect(bx+1,p.y-bh+2,11,4);
    bx+=14;
  }
}

function drawSofa(p) {
  fill(220,55,72); rect(p.x,p.y-18,p.w,28,6,6,0,0);
  fill(220,50,80); rect(p.x,p.y+8,p.w,36,0,0,8,8);
  fill(220,60,65); rect(p.x,p.y-4,14,44,4); rect(p.x+p.w-14,p.y-4,14,44,4);
  fill(220,45,86,80); rect(p.x+14,p.y+10,p.w-28,12,3);
  fill(220,70,55); ellipse(p.x+p.w/2,p.y+16,8,8);
  fill(28,55,45); rect(p.x+8,p.y+40,10,8,2); rect(p.x+p.w-18,p.y+40,10,8,2);
}

function drawTable(p) {
  fill(28,60,68); rect(p.x,p.y,p.w,14,3);
  fill(28,55,52); rect(p.x+6,p.y+13,10,TILE-14); rect(p.x+p.w-16,p.y+13,10,TILE-14);
  let ox=p.x+20;
  for (let i=0;i<floor(p.w/48);i++) {
    if ((i+p.x)%2===0) {
      fill(0,random(40,80),random(70,90)); rect(ox,p.y-20,14,20,2);
      fill(0,0,100,40); rect(ox+2,p.y-18,10,8,2);
    } else {
      fill((i*40)%360,75,85); rect(ox,p.y-18,18,18,2);
      fill(0,0,100,50); textAlign(CENTER,CENTER); textSize(10); textStyle(BOLD);
      text(["A","B","1","2","C"][i%5],ox+9,p.y-9); noStroke();
    }
    ox+=38;
  }
}

// ── Collectibles ──────────────────────────────────────────────
function drawCollectibles() {
  for (let c of collectibles) {
    if (c.collected) continue;
    if (c.x+c.w<cam-60||c.x>cam+width+60) continue;
    push(); translate(0,c.bobY);
    if      (c.type==="broccoli") drawBroccoliBlock(c);
    else if (c.type==="football") drawFootball(c);
    else if (c.type==="toy")      drawToy(c);
    else                          drawBookItem(c);
    pop();
  }
}

function drawBroccoliBlock(c) {
  fill(110,80,80); rect(c.x,c.y,c.w,c.h,4);
  stroke(110,70,55); strokeWeight(3); noFill(); rect(c.x+4,c.y+4,c.w-8,c.h-8,2); noStroke();
  fill(110,90,70); ellipse(c.x+TILE/2,c.y+16,22,18);
  fill(120,80,55); ellipse(c.x+TILE/2-8,c.y+14,14,12);
  fill(110,85,65); ellipse(c.x+TILE/2+8,c.y+14,14,12);
  fill(110,60,55); rect(c.x+TILE/2-3,c.y+22,6,16);
  fill(110,50,95,50); rect(c.x+3,c.y+3,c.w-6,8,2);
}

function drawFootball(c) {
  fill(0,0,100); ellipse(c.x+16,c.y+16,32,32);
  stroke(0,0,15); strokeWeight(1.5); noFill();
  arc(c.x+16,c.y+16,16,16,0,360);
  line(c.x+16,c.y+4,c.x+8,c.y+14); line(c.x+16,c.y+4,c.x+24,c.y+14);
  line(c.x+4,c.y+21,c.x+12,c.y+24); line(c.x+28,c.y+21,c.x+20,c.y+24);
  noStroke(); fill(0,0,0); ellipse(c.x+16,c.y+16,12,12);
  fill(0,0,95,50); ellipse(c.x+12,c.y+12,6,6);
}

function drawToy(c) {
  if (c.x%200<100) {
    fill(55,90,100); ellipse(c.x+16,c.y+22,28,20);
    ellipse(c.x+22,c.y+12,16,16);
    fill(30,90,100); triangle(c.x+28,c.y+13,c.x+36,c.y+11,c.x+28,c.y+16);
    fill(0,0,10); ellipse(c.x+25,c.y+10,5,5);
    fill(0,0,100); ellipse(c.x+26,c.y+9,2,2);
  } else {
    fill(0,85,90); rect(c.x+2,c.y+16,28,12,3);
    fill(0,70,70); rect(c.x+6,c.y+10,20,10,3,3,0,0);
    fill(200,70,80,70); rect(c.x+8,c.y+11,7,7,2); rect(c.x+17,c.y+11,7,7,2);
    fill(0,0,20); ellipse(c.x+8,c.y+28,10,10); ellipse(c.x+24,c.y+28,10,10);
    fill(0,0,70); ellipse(c.x+8,c.y+28,5,5); ellipse(c.x+24,c.y+28,5,5);
  }
}

function drawBookItem(c) {
  fill((c.x%3===0?200:c.x%3===1?0:280),65,75);
  rect(c.x,c.y+10,32,22,2);
  fill(0,0,97); rect(c.x+3,c.y+13,26,16,1);
  stroke(0,0,70,60); strokeWeight(0.8);
  for (let ly=c.y+17;ly<c.y+28;ly+=4) line(c.x+5,ly,c.x+27,ly);
  noStroke();
}

// ── Enemies ───────────────────────────────────────────────────
function drawEnemies() {
  for (let e of enemies) {
    if (!e.alive) {
      if (e.deathTimer>0) {
        push(); translate(e.x,e.y-8);
        fill(0,70,80,e.deathTimer*3); ellipse(0,0,e.w*1.3,e.h*0.25); pop();
      }
      continue;
    }
    if (e.x<cam-70||e.x>cam+width+70) continue;
    if      (e.type==="chocolate") drawChocolate(e);
    else if (e.type==="sweet")     drawSweet(e);
    else                           drawLolly(e);
  }
}

function drawChocolate(e) {
  let b = e.animFrame===0 ? 0 : 1.5;
  push(); translate(e.x, e.y + b);
  // Shadow
  noStroke(); fill(0,0,0,15); ellipse(0,2,e.w,7);
  // Draw SVG sprite centred on origin (sprite viewBox: -22,-40 to 22,4)
  imageMode(CENTER);
  image(spriteChocolate, 0, -18, 44, 44);
  pop();
}

function drawSweet(e) {
  let b = e.animFrame===0 ? 0 : 1.5;
  push(); translate(e.x, e.y + b);
  noStroke(); fill(0,0,0,15); ellipse(0,2,e.w,7);
  // SVG sprite viewBox: -32,-46 to 32,4 (wider for wrapper twists)
  imageMode(CENTER);
  image(spriteSweet, 0, -22, 64, 50);
  pop();
}

function drawLolly(e) {
  let b = e.animFrame===0 ? 0 : 1.5;
  push(); translate(e.x, e.y + b);
  noStroke(); fill(0,0,0,15); ellipse(0,2,e.w,7);
  // SVG sprite viewBox: -22,-50 to 22,4
  imageMode(CENTER);
  image(spriteLolly, 0, -24, 44, 54);
  pop();
}

// ── James ─────────────────────────────────────────────────────
function drawJames() {
  if (player.dead) return;
  if (player.invincible>0&&frameCount%4<2) return;

  let sf = player.big ? 1.3 : 1.0;
  if (player.growTimer>0) sf += sin(player.growTimer*15)*0.08;

  let air = !player.onGround;
  let fr  = player.animFrame;

  push();
  translate(player.x, player.y + player.h);
  if (!player.facingRight) scale(-1, 1);
  scale(sf, sf);

  // Shadow
  if (player.onGround) { noStroke(); fill(0,0,0,12); ellipse(0,2,36,8); }

  // Pick pose SVG based on state
  // 0=idle, 1=walk1, 2=walk2, 3=jump
  let pose;
  if (air) {
    pose = 3;  // jump/air
  } else if (abs(player.vx) > 0.5) {
    pose = (fr === 1 || fr === 3) ? 1 : 2;  // alternate walk frames
  } else {
    pose = 0;  // idle
  }
  imageMode(CENTER);
  image(spriteJames[pose], 0, -48, 52, 96);

  // Big James broccoli badge (drawn on top of SVG)
  if (player.big) {
    noStroke();
    fill(110,80,85); ellipse(14,-44,16,16);
    fill(110,90,65); ellipse(14,-47,10,8);
    fill(110,60,55); rect(12,-42,4,8);
  }

  // Stamp ghost trail onto offscreen buffer (createGraphics image layer)
  if (!player.dead && !(player.invincible>0 && frameCount%4<2)) {
    let tx = player.x - cam;
    let ty = player.y + player.h;
    trailBuffer.push();
    trailBuffer.translate(tx, ty);
    if (!player.facingRight) trailBuffer.scale(-1,1);
    trailBuffer.noStroke();
    trailBuffer.fill(0, 75, 85, 28);
    trailBuffer.ellipse(0, -46, 28, 28);
    trailBuffer.ellipse(0, -68, 32, 30);
    trailBuffer.fill(50, 60, 90, 22);
    trailBuffer.ellipse(0, -84, 20, 16);
    trailBuffer.pop();
  }

  pop();
}


// ── End Door ──────────────────────────────────────────────────
function drawEndDoor() {
  let dx=WORLD_W-200, dy=GROUND_Y-140;
  fill(28,60,45); rect(dx-5,dy-5,90,150,4);
  fill(28,50,68); rect(dx,dy,80,140,3);
  fill(28,55,58);
  rect(dx+8,dy+10,27,50,2); rect(dx+45,dy+10,27,50,2); rect(dx+8,dy+70,64,55,2);
  fill(45,80,90); ellipse(dx+65,dy+72,10,10);
  fill(55,85,95); rect(dx+12,dy+20,56,20,2);
  fill(0,0,15); textAlign(CENTER,CENTER); textSize(10); textStyle(BOLD); text("HOME",dx+40,dy+30);
  for (let i=0;i<3;i++) {
    fill(55,90,100,80);
    let sx=dx+20+i*22, sy=dy-22+sin(frameCount*3+i*60)*5;
    drawStar5(sx,sy,8);
  }
}

function drawStar5(x,y,r) {
  beginShape();
  for (let i=0;i<10;i++) {
    let a=-90+i*36, rad=i%2===0?r:r*0.4;
    vertex(x+cos(a)*rad,y+sin(a)*rad);
  }
  endShape(CLOSE);
}

// ── Particles ─────────────────────────────────────────────────
function drawParticlesWorld() {
  for (let p of particles) {
    let a=map(p.life,0,p.maxLife,0,85);
    noStroke(); push(); translate(p.x,p.y);
    if (p.type==="star") {
      fill(p.h,p.s,p.b,a); rotate(frameCount*9); drawStar5(0,0,p.size);
    } else if (p.type==="leaf") {
      fill(p.h,p.s,p.b,a); rotate(p.life*8); ellipse(0,0,p.size*1.5,p.size*0.7);
    } else {
      fill(p.h,p.s,p.b,a); ellipse(0,0,p.size,p.size);
    }
    pop();
  }
}

// ── HUD ───────────────────────────────────────────────────────
function drawHUD() {
  fill(240,50,12,88); rect(0,0,width,46);

  fill(50,75,100); textSize(12); textAlign(LEFT,CENTER); textStyle(BOLD);
  text("JAMES",14,14);
  for (let i=0;i<player.lives;i++) drawHeart(14+i*28,32,10);

  noStroke();
  fill(110,80,90); textSize(12); textAlign(LEFT,CENTER);
  text("🥦 x "+broccoliEaten, width/2-100, 24);
  fill(0,70,90);
  text("💀 x "+enemiesStomped, width/2+5, 24);

  fill(55,90,100); textAlign(RIGHT,CENTER); textSize(12);
  text("SCORE",width-14,14);
  fill(0,0,100); textSize(20);
  text(nf(score,5,0),width-14,32);

  if (player.big) {
    fill(110,70,85,88); rect(width/2-60,0,120,46,0,0,8,8);
    fill(110,90,75); textAlign(CENTER,CENTER); textSize(11); textStyle(BOLD);
    text("⬆ BIG JAMES! ⬆",width/2,23);
  }

  fill(0,0,80,55); textSize(10); textAlign(CENTER,BOTTOM); textStyle(NORMAL);
  text("A/D or ← → = Move   W/↑/SPACE = Jump   R = Restart",width/2,height-5);
}

function drawHeart(x,y,r) {
  fill(0,90,90); noStroke();
  push(); translate(x,y); scale(r/10);
  beginShape();
  vertex(0,6); bezierVertex(-10,-2,-14,-10,-7,-13);
  bezierVertex(-2,-15,0,-10,0,-10); bezierVertex(0,-10,2,-15,7,-13);
  bezierVertex(14,-10,10,-2,0,6);
  endShape(CLOSE); pop();
}

// ── Win / Dead ────────────────────────────────────────────────
function drawWinScreen() {
  fill(0,0,0,65); rect(0,0,width,height);
  fill(110,85,90); textAlign(CENTER,CENTER); textSize(48); textStyle(BOLD);
  text("YOU GOT HOME! 🏠",width/2,height/2-70);
  fill(0,0,100); textSize(18);
  text("Final Score: "+score,width/2,height/2-18);
  fill(110,70,90); textSize(15);
  text("🥦 Broccoli: "+broccoliEaten+"   💀 Stomped: "+enemiesStomped,width/2,height/2+15);
  fill(55,90,100); textSize(14);
  text("Well done James! 🌟",width/2,height/2+50);
  fill(55,60,100); textSize(13);
  text("Press R to play again",width/2,height/2+88);
}

function drawDeadScreen() {
  fill(0,0,0,70); rect(0,0,width,height);
  fill(0,90,90); textAlign(CENTER,CENTER); textSize(48); textStyle(BOLD);
  text("GAME OVER",width/2,height/2-40);
  fill(0,0,100); textSize(20); text("Score: "+score,width/2,height/2+8);
  fill(55,70,100); textSize(14); text("Press R to try again! 💪",width/2,height/2+50);
}

// ── Helpers ───────────────────────────────────────────────────
function spawnDust(x,y) {
  for (let i=0;i<5;i++) {
    let a=random(150,210),sp=random(1,3),life=floor(random(12,22));
    particles.push({x,y,vx:cos(a)*sp,vy:sin(a)*sp-1,h:40,s:20,b:90,life,maxLife:life,size:random(3,7),type:"dust"});
  }
}
function spawnBurst(x,y,n,[h,s,b],type) {
  for (let i=0;i<n;i++) {
    let a=random(360),sp=random(1.5,5.5),life=floor(random(18,45));
    particles.push({x,y,vx:cos(a)*sp,vy:sin(a)*sp-random(2),h,s,b,life,maxLife:life,size:random(4,11),type});
  }
}
function rectHit(a,b) {
  return a.x-a.w/2<b.x+b.w && a.x+a.w/2>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
}

// ── Input ─────────────────────────────────────────────────────
function keyPressed() {
  if (keyCode===LEFT_ARROW  || key==="a" || key==="A") moveLeft =true;
  if (keyCode===RIGHT_ARROW || key==="d" || key==="D") moveRight=true;
  if (keyCode===UP_ARROW || keyCode===32 || key==="w" || key==="W") moveJump=true;
  if (key==="r"||key==="R") initWorld();
  return false;
}
function keyReleased() {
  if (keyCode===LEFT_ARROW)                            moveLeft =false;
  if (key==="a" || key==="A")                          moveLeft =false;
  if (keyCode===RIGHT_ARROW)                           moveRight=false;
  if (key==="d" || key==="D")                          moveRight=false;
  if (keyCode===UP_ARROW || keyCode===32)              { moveJump=false; player.jumpConsumed=false; }
  if (key==="w" || key==="W")                          { moveJump=false; player.jumpConsumed=false; }
  return false;
}

// Reset all movement if window loses focus (prevents stuck keys)
function windowBlurred() {
  moveLeft=false; moveRight=false; moveJump=false;
  if (player) player.jumpConsumed=false;
}