
const DETAIL  = 200;
const OUTER_R = 300 / 4;
const INNER_R = 80  / 4;

let NOISE_SPEED   = 0.002;
const NOISE_SCALE = 1.5;
const AMP_FACTOR  = 0.6;

const strokeOuterOptions = [1, 5, 15];
const strokeInnerOptions = [10, 15, 20];

/*************************  CELLS  *************************/
let cells = [];
let specialCell = null;
let spreadStart = null; // specialCell active
let doneSpread  = false;

/*************************  LAYER hole   *************************/
// gradient -> #333333
const PALETTE_HEX      = ['#F29BAB', '#79D0F2', '#8EECAF', '#F2AA6B', '#F27A5E'];
const DARK_HEX         = '#333333';
const OVER_ALPHA       = 255;      // 100%
const FADE_DURATION_MS = 8000;     // 8 s

// Ovals
const HOLE_COUNT   = 140;
const HOLE_W_RANGE = [280, 900];
const HOLE_H_RANGE = [180, 650];
const HOLE_MARGIN  = 6;
const OVERFLOW_PAD = 500;

// Scale animation
const SCALE_AMP_RANGE   = [0.04, 0.12];      // ±%
const SCALE_SPEED_RANGE = [0.25, 0.7];       // rad/frame 
const SPEED_FACTOR      = 1 / 12;            

// Biến cho layer
let overlayPG;
let holes = []; // hole = {x,y,w,h,r,amp,speed,phase}

/*************************  SETUP  *************************/
function setup() {
  createCanvas(1920, 1080);
  pixelDensity(1);
  noFill();
  stroke(255, 150);
  const cnv = createCanvas(1920, 1080); // fit size CSS #p5-holder
  cnv.parent('p5-holder');


  // Tạo lưới cell
  const spacing = OUTER_R * 2;
  let gy = 0;
  for (let y = OUTER_R; y <= height - OUTER_R; y += spacing) {
    let gx = 0;
    for (let x = OUTER_R; x <= width - OUTER_R; x += spacing) {
      cells.push(makeCell(x, y, gx, gy));
      gx++;
    }
    gy++;
  }

  // Kích hoạt 1 cell sau 5 giây
  setTimeout(() => {
    specialCell = random(cells);
    specialCell.isActive = true;
    specialCell.vel.setMag(specialCell.baseVelMag * 3);
    spreadStart = millis();
  }, 5000);

  // Layer đục lỗ
  overlayPG = createGraphics(width, height);
  overlayPG.pixelDensity(1);
  buildHoles();
}

/*************************  DRAW  *************************/
function draw() {
  background(0);

  // 1. Vẽ layer đục lỗ DƯỚI cùng
  renderOverlay(frameCount);
  image(overlayPG, 0, 0);

  // 2. Lan truyền cell (mỗi 1500ms thêm 1 vòng)
  if (specialCell && !doneSpread) {
    let elapsed = millis() - spreadStart;
    let waves   = floor(elapsed / 1500);
    for (let c of cells) {
      if (!c.isActive) {
        let d = chebyshevDist(c, specialCell);
        if (d <= waves) activateCell(c);
      }
    }
    doneSpread = cells.every(c => c.isActive);
  }

  // 3. Vẽ cells TRÊN overlay
  const tBase = frameCount * NOISE_SPEED;
  for (let c of cells) {
    updateCell(c);
    const t = c.isActive ? frameCount * (NOISE_SPEED * 10) : tBase;
    drawCell(c, t);
  }
}

/*************************  RESIZE  *************************/
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  overlayPG = createGraphics(windowWidth, windowHeight);
  overlayPG.pixelDensity(1);
  buildHoles(); 
}

/*************************  CELLS   *************************/
function makeCell(cx, cy, gx, gy) {
  const outerSW = random(strokeOuterOptions);
  const innerSW = random(strokeInnerOptions);

  const safe = OUTER_R - (INNER_R + innerSW / 2);
  const pos  = p5.Vector.random2D().mult(random(safe));
  const baseVel = random(0.2, 0.5);
  const vel  = p5.Vector.random2D().mult(baseVel);

  return {
    center: createVector(cx, cy),
    gx, gy,
    outerSW,
    innerSW,
    isActive: false,
    pos,
    baseVelMag: baseVel,
    vel
  };
}

function activateCell(c) {
  c.isActive = true;
  c.vel.setMag(c.baseVelMag * 3);
}

function updateCell(c) {
  // di chuyển inner ring
  c.pos.add(c.vel);
  const limit = OUTER_R - (INNER_R + c.innerSW / 2);
  if (c.pos.mag() > limit) {
    let nrm = c.pos.copy().normalize();
    let dot = c.vel.dot(nrm);
    c.vel.sub(p5.Vector.mult(nrm, 2 * dot));
    c.pos.setMag(limit);
  }
}

function drawCell(c, t) {
  push();
    translate(c.center.x, c.center.y);

    // vòng ngoài
    strokeWeight(c.outerSW);
    stroke(c.isActive ? '#eb0e0e' : color(255, 150));
    noFill();
    beginShape();
    for (let i = 0; i <= DETAIL; i++) {
      let ang  = map(i, 0, DETAIL, 0, TWO_PI);
      let xoff = cos(ang) * 0.5 + 0.5;
      let yoff = sin(ang) * 0.5 + 0.5;
      let r    = OUTER_R + map(noise(xoff*NOISE_SCALE, yoff*NOISE_SCALE, t), 0, 1,
                               -OUTER_R * AMP_FACTOR, OUTER_R * AMP_FACTOR);
      vertex(r * cos(ang), r * sin(ang));
    }
    endShape(CLOSE);

    // vòng trong
    push();
      translate(c.pos.x, c.pos.y);
      strokeWeight(c.innerSW);
      stroke(c.isActive ? '#eb0e0e' : color(255, 150));
      beginShape();
      for (let i = 0; i <= DETAIL; i++) {
        let ang  = map(i, 0, DETAIL, 0, TWO_PI);
        let xoff = cos(ang) * 0.5 + 0.5;
        let yoff = sin(ang) * 0.5 + 0.5;
        let base = INNER_R - c.innerSW / 2;
        let r    = base + map(noise(xoff*NOISE_SCALE, yoff*NOISE_SCALE, t + 100),
                               0, 1, -base * AMP_FACTOR, base * AMP_FACTOR);
        vertex(r * cos(ang), r * sin(ang));
      }
      endShape(CLOSE);
    pop();

  pop();
}

function chebyshevDist(a, b) {
  return max(abs(a.gx - b.gx), abs(a.gy - b.gy));
}

/*************************  OVERLAY  *************************/
function buildHoles() {
  holes = [];
  let tries = 0;
  let maxTry = HOLE_COUNT * 120;

  while (holes.length < HOLE_COUNT && tries < maxTry) {
    const w = random(HOLE_W_RANGE[0], HOLE_W_RANGE[1]);
    const h = random(HOLE_H_RANGE[0], HOLE_H_RANGE[1]);
    const x = random(-OVERFLOW_PAD, width  + OVERFLOW_PAD);
    const y = random(-OVERFLOW_PAD, height + OVERFLOW_PAD);
    const rBound = max(w, h) / 2 + HOLE_MARGIN;

    let ok = true;
    for (let o of holes) {
      if (dist(x, y, o.x, o.y) < rBound + o.r) { ok = false; break; }
    }

    if (ok) {
      holes.push({
        x, y, w, h,
        r: rBound,
        amp: random(SCALE_AMP_RANGE[0], SCALE_AMP_RANGE[1]),
        speed: random(SCALE_SPEED_RANGE[0], SCALE_SPEED_RANGE[1]),
        phase: random(TWO_PI)
      });
    }
    tries++;
  }
}

function renderOverlay(frameN) {
  overlayPG.clear();

  //fade gradient -> #333333
  let fadeT = 0;
  if (specialCell && spreadStart != null) {
    fadeT = constrain((millis() - spreadStart) / FADE_DURATION_MS, 0, 1);
  }

  // gradient 
  drawGradientBackground(overlayPG, PALETTE_HEX, DARK_HEX, fadeT, OVER_ALPHA);

  // erase
  overlayPG.erase(255, 255);
  overlayPG.fill(255);
  overlayPG.noStroke();
  for (let o of holes) {
    const s = 1 + sin(frameN * o.speed * SPEED_FACTOR + o.phase) * o.amp;
    overlayPG.ellipse(o.x, o.y, o.w * s, o.h * s);
  }
  overlayPG.noErase();
}

function drawGradientBackground(pg, paletteArr, darkHex, fadeT, alphaVal) {
  const cols = paletteArr.map(h => color(h));
  const dark = color(darkHex);

  pg.noFill();
  for (let y = 0; y < pg.height; y++) {
    const t = y / (pg.height - 1);
    const seg = cols.length - 1;
    const i0 = floor(t * seg);
    const i1 = min(i0 + 1, seg);
    const localT = t * seg - i0;
    let cGrad = lerpColor(cols[i0], cols[i1], localT);
    let cFinal = lerpColor(cGrad, dark, fadeT);

    pg.stroke(red(cFinal), green(cFinal), blue(cFinal), alphaVal);
    pg.line(0, y, pg.width, y);
  }
}


function keyPressed() {
  if (key === 'o' || key === 'O') buildHoles(); 
}


