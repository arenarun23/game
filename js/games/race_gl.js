// 레이싱 새 그래픽: three.js(WebGL)로 길·땅·장식·차를 진짜 입체로 그린다.
// 게임 규칙·물리·화면 버튼은 race.js 그대로 두고 '그리기'만 바꾼다.
// WebGL 이 안 되거나 '예전 그래픽'을 고르면 race.js(2D)·race3d.js(3D) 그림을 쓴다.
// 좌표: 게임 (x, y) → three (X = x, Z = y), 높이 → Y. (위에서 보면 화면과 같은 방향이라 좌우가 뒤집히지 않는다)
import * as THREE from '../vendor/three.min.js';

const BGU = THREE.BufferGeometryUtils, RoundedBoxGeometry = THREE.RoundedBoxGeometry;
const TAU = Math.PI * 2, clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const G = window.G;

let support = null;
function ok() {
  if (support === null) { try { const c = document.createElement('canvas'); support = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { support = false; } }
  return support;
}

// ───── 그림(캔버스) → 텍스처 ─────
const canvas = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; };
const rand = (seed) => { let a = seed >>> 0; return () => (a = (a * 1664525 + 1013904223) >>> 0) / 4294967296; };

function create(o) {
  const { T, th, racers, me } = o;
  const P = T.pts, M = T.M, hw = T.hw, V3 = T.v3d, SPC = !!T.space, ds = T.ds;
  const hgt = (i) => (V3 ? T.hgt[((i % M) + M) % M] : 0);
  const gz = V3 ? Math.min.apply(null, T.hgt) - 10 : -0.5;
  const S = (o.wall || hw * 1.5) + 26, Cc = hw + 12, BAR = V3 ? 24 : 16, K = V3 ? 1.12 : 1.42; // S: 벽 자리, K: 차 크기
  const fogc = new THREE.Color(th.sky[1]), FOGK = th.fogK == null ? 1 : th.fogK;
  const mix = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);

  const renderer = new THREE.WebGLRenderer({ antialias: (window.devicePixelRatio || 1) < 2, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const cvs = renderer.domElement; cvs.className = 'rcv rgl';
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const toDispose = [];
  const tex = (c, rx, ry, srgb = true) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry || rx); } t.anisotropy = aniso; toDispose.push(t); return t; };
  const lam = (p) => { const m = new THREE.MeshLambertMaterial(p); toDispose.push(m); return m; };
  const pho = (p) => { const m = new THREE.MeshPhongMaterial(p); toDispose.push(m); return m; };
  const bas = (p) => { const m = new THREE.MeshBasicMaterial(p); toDispose.push(m); return m; };

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 4, 16000);

  // ───── 하늘·안개·빛 ─────
  scene.background = tex(canvas(4, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, th.sky[0]); gr.addColorStop(0.62, th.sky[1]); gr.addColorStop(1, th.sky[1]); g.fillStyle = gr; g.fillRect(0, 0, w, h); }));
  if (V3) { if (FOGK > 0.03) scene.fog = new THREE.Fog(fogc, 520, 520 + 2300 / FOGK); }
  else scene.fog = new THREE.Fog(fogc, 1500, 4200);
  const hemi = new THREE.HemisphereLight(SPC ? '#c9d4ff' : '#ffffff', SPC ? '#3a3a46' : mix(th.bg, '#000000', 0.35), SPC ? 0.95 : 1.55); scene.add(hemi);
  const sun = new THREE.DirectionalLight(SPC ? '#fff6e6' : '#fff4dd', SPC ? 3.2 : 2.3);
  let sunDir = new THREE.Vector3(-0.45, 1, 0.3).normalize();
  if (SPC && th.sun) { const c = Math.cos(th.sun.el); sunDir = new THREE.Vector3(Math.cos(th.sun.az) * c, Math.max(0.25, Math.sin(th.sun.el)), Math.sin(th.sun.az) * c).normalize(); }
  const big = (window.devicePixelRatio || 1) >= 2 || Math.min(innerWidth, innerHeight) > 700;
  sun.castShadow = true; sun.shadow.mapSize.set(big ? 2048 : 1024, big ? 2048 : 1024);
  const SH = V3 ? 620 : 700; Object.assign(sun.shadow.camera, { left: -SH, right: SH, top: SH, bottom: -SH, near: 50, far: 4200 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 1.2;
  scene.add(sun); scene.add(sun.target);

  // ───── 길 (한 바퀴 띠) ─────
  const N1 = M + 1, cx = (i) => P[i % M];
  // 띠 하나: 각 점에서 옆으로 a→b, 높이 ya→yb. v 는 길을 따라간 거리/주기
  function strip(a, b, ya, yb, period, fnA, fnB) {
    const pos = new Float32Array(N1 * 6), uv = new Float32Array(N1 * 4), idx = [];
    for (let i = 0; i < N1; i++) {
      const c = cx(i), h = hgt(i), la = fnA ? fnA(i, a) : a, lb = fnB ? fnB(i, b) : b, yA = typeof ya === 'function' ? ya(i, h) : h + ya, yB = typeof yb === 'function' ? yb(i, h) : h + yb;
      pos.set([c.x + c.nx * la, yA, c.y + c.ny * la, c.x + c.nx * lb, yB, c.y + c.ny * lb], i * 6);
      const v = (i * ds) / period; uv.set([0, v, 1, v], i * 4);
      if (i < M) { const A = i * 2, B = A + 1, A2 = A + 2, B2 = A + 3; idx.push(A, B, A2, B, B2, A2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); toDispose.push(g); return g;
  }
  const add = (geo, mat, { cast = false, recv = true, order } = {}) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = recv; if (order != null) m.renderOrder = order; scene.add(m); return m; };

  // 땅
  const b = T.bounds, mx = (b.x0 + b.x1) / 2, mz = (b.y0 + b.y1) / 2, ext = Math.max(b.x1 - b.x0, b.y1 - b.y0);
  const groundC = canvas(256, 256, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256); const r = rand(77); for (let i = 0; i < 70; i++) { const x = r() * 256, y = r() * 256, r0 = 8 + r() * 30; g.fillStyle = i % 2 ? 'rgba(255,255,255,.5)' : `rgba(0,0,0,${SPC ? 0.1 : 0.07})`; for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) { g.beginPath(); g.ellipse(x + ox, y + oy, r0, r0 * 0.7, i, 0, TAU); g.fill(); } } for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${0.04 + r() * 0.05})`; g.fillRect(r() * 256, r() * 256, 2, 2); } });
  const GS = ext + 14000;
  { const geo = new THREE.PlaneGeometry(GS, GS); geo.rotateX(-Math.PI / 2); toDispose.push(geo); const m = add(geo, lam({ color: th.bg, map: tex(groundC, GS / 420) })); m.position.set(mx, gz, mz); }

  // 길이 다른 길 위를 지나가는 곳(다리): 그 아래로 비탈을 내리지 않고 기둥을 세운다
  const over = new Uint8Array(M), underPts = [];
  if (V3) for (let i = 0; i < M; i += 2) for (let j = 0; j < M; j += 2) {
    const dd = Math.abs(i - j), circ = Math.min(dd, M - dd); if (circ < 40) continue;
    const a = P[i], c = P[j], d2 = (a.x - c.x) ** 2 + (a.y - c.y) ** 2;
    if (d2 < (S * 2.6) ** 2 && T.hgt[i] - T.hgt[j] > 30) { for (let k = -3; k <= 3; k++) over[(i + k + M) % M] = 1; underPts.push(c); }
  }

  // 길 바탕(그림: 회색 결 + 가장자리 어둡게), 색은 점마다(먼지 구간)
  const roadC = canvas(64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, '#b9b9b9'); gr.addColorStop(0.1, '#e4e4e4'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(0.9, '#e4e4e4'); gr.addColorStop(1, '#b9b9b9'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); const r = rand(9); for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? `rgba(0,0,0,${0.05 + r() * 0.07})` : `rgba(255,255,255,${0.05 + r() * 0.08})`; g.fillRect(r() * 64, r() * 256, 1 + r() * 2, 1 + r() * 2); } });
  const roadGeo = strip(-hw, hw, 0.6, 0.6, 260);
  const roadCol = new Float32Array(N1 * 6), cRoad = new THREE.Color(th.road), cDust = mix(th.road, th.slow, 0.55);
  let dustNow = -1;
  const paintRoad = (storm) => { for (let i = 0; i < N1; i++) { const c = (SPC && (storm || T.dust[i % M])) ? cDust : cRoad; roadCol.set([c.r, c.g, c.b, c.r, c.g, c.b], i * 6); } roadGeo.attributes.color ? (roadGeo.attributes.color.needsUpdate = true) : roadGeo.setAttribute('color', new THREE.BufferAttribute(roadCol, 3)); };
  paintRoad(false); dustNow = 0;
  add(roadGeo, lam({ vertexColors: true, map: tex(roadC) }));

  // 가운데 점선
  const dashC = canvas(8, 128, (g) => { g.clearRect(0, 0, 8, 128); g.fillStyle = '#fff'; g.fillRect(0, 0, 8, V3 ? 64 : 56); });
  add(strip(-3, 3, 0.9, 0.9, V3 ? 140 : 60), lam({ color: th.line, map: tex(dashC), alphaTest: 0.5 }));
  // 연석(빨강·흰색 줄무늬) — 바깥쪽을 살짝 높여 입체로
  const stripes = (c0, c1) => canvas(4, 64, (g) => { g.fillStyle = c0; g.fillRect(0, 0, 4, 32); g.fillStyle = c1; g.fillRect(0, 32, 4, 32); });
  const curbM = lam({ map: tex(stripes(th.curb[0], th.curb[1])) }), CP = V3 ? 80 : 68;
  add(strip(hw, Cc, 0.6, 3.2, CP), curbM); add(strip(-Cc, -hw, 3.2, 0.6, CP), curbM);
  // 길 어깨(벽까지)
  const shM = lam({ map: tex(stripes(th.shoulder, '#' + mix(th.shoulder, '#000000', 0.07).getHexString())) });
  add(strip(Cc, S, 3.2, 1.5, 80), shM); add(strip(-S, -Cc, 1.5, 3.2, 80), shM);
  // 벽(낮은 가드레일): 안쪽 면 + 윗면 + 바깥 면
  const wallTex = SPC ? tex(stripes('#c8ccd4', '#8a9099')) : tex(stripes(th.curb[0], th.curb[1]));
  const wallM = lam({ map: wallTex, side: THREE.DoubleSide }), wallTop = lam({ color: SPC ? '#e6e9ef' : '#ffffff' }), WT = 7;
  for (const sg of [1, -1]) {
    add(strip(sg * S, sg * S, 1.5, BAR, CP), wallM, { cast: true });
    add(strip(sg * S, sg * (S + WT), BAR, BAR, CP), wallTop);
    add(strip(sg * (S + WT), sg * (S + WT), BAR, (i, h) => h - 0.5, CP), wallM);
  }
  // 비탈(언덕길에서 벽 바깥으로 땅까지)
  if (V3) {
    const skC = mix(th.bg, '#000000', 0.22), skM = lam({ color: skC, map: tex(groundC, 3, 6), side: THREE.DoubleSide });
    for (const sg of [1, -1]) add(strip(sg * (S + WT), sg * (S + WT), (i, h) => h - 0.5, (i, h) => (over[i % M] ? h - 0.5 : gz), 300, null, (i, l) => (over[i % M] ? l : l + sg * (Math.max(0, hgt(i) - gz) * 0.9 + 50))), skM);
    // 다리 기둥
    const pg = new THREE.CylinderGeometry(9, 12, 1, 10); pg.translate(0, 0.5, 0); toDispose.push(pg);
    const pm = lam({ color: SPC ? '#9aa0aa' : '#b9b2a6' }), list = [];
    for (let i = 0; i < M; i += 7) { const h = hgt(i); if (h - gz < 40 || !over[i]) continue; const c = P[i]; for (const lat of [-hw * 0.7, hw * 0.7]) { const x = c.x + c.nx * lat, y = c.y + c.ny * lat; if (underPts.some((u) => (u.x - x) ** 2 + (u.y - y) ** 2 < (S + 30) ** 2)) continue; list.push([x, y, h]); } }
    if (list.length) { const im = new THREE.InstancedMesh(pg, pm, list.length), m4 = new THREE.Matrix4(); list.forEach(([x, y, h], k) => { m4.makeScale(1, h - gz, 1).setPosition(x, gz, y); im.setMatrixAt(k, m4); }); im.castShadow = true; im.receiveShadow = true; scene.add(im); }
  }

  // 출발선 + 출발 문
  {
    const s0 = P[0], a = Math.atan2(s0.ty, s0.tx), h0 = hgt(0);
    const chk = canvas(32, 160, (g) => { for (let i = 0; i < 10; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#fff' : '#111'; g.fillRect(j * 16, i * 16, 16, 16); } });
    const geo = new THREE.PlaneGeometry(28, hw * 2); geo.rotateX(-Math.PI / 2); toDispose.push(geo);
    const m = add(geo, lam({ map: tex(chk) })); m.position.set(s0.x, h0 + 1, s0.y); m.rotation.y = -a;
    const GH = V3 ? 250 : 120, gate = new THREE.Group(), postG = new THREE.CylinderGeometry(5, 6, GH, 10), barG = new THREE.BoxGeometry(14, 26, S * 2 + 20); toDispose.push(postG, barG);
    const postM = lam({ color: '#f5f5f5' });
    for (const sg of [-1, 1]) { const p = new THREE.Mesh(postG, postM); p.position.set(0, GH / 2, sg * (S + 10)); p.castShadow = true; gate.add(p); }
    const bannerC = canvas(256, 32, (g) => { for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#fff' : '#111'; g.fillRect(i * 16, j * 16, 16, 16); } });
    const bar = new THREE.Mesh(barG, lam({ map: tex(bannerC) })); bar.position.set(0, GH + 2, 0); bar.castShadow = true; gate.add(bar);
    gate.position.set(s0.x, h0, s0.y); gate.rotation.y = -a; scene.add(gate);
  }

  // ───── 길 위의 지대 ─────
  {
    const arrowC = canvas(128, 128, (g) => { g.fillStyle = '#00c8ff'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#fff'; g.lineWidth = 14; g.lineCap = 'round'; g.lineJoin = 'round'; for (const ox of [30, 70]) { g.beginPath(); g.moveTo(ox, 24); g.lineTo(ox + 28, 64); g.lineTo(ox, 104); g.stroke(); } });
    const jumpC = canvas(128, 128, (g) => { g.fillStyle = '#ff9f1c'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#fff3c4'; g.lineWidth = 12; g.lineCap = 'round'; for (const ox of [16, 52, 88]) { g.beginPath(); g.moveTo(ox, 28); g.lineTo(ox + 22, 64); g.lineTo(ox, 100); g.stroke(); } });
    const boostM = bas({ map: tex(arrowC) }), jumpM = lam({ map: tex(jumpC) }), slowM = lam({ color: th.slow }), iceM = pho({ color: '#c8efff', shininess: 120, specular: '#ffffff', transparent: true, opacity: 0.88 });
    const disc = new THREE.CircleGeometry(1, 28); disc.rotateX(-Math.PI / 2); toDispose.push(disc);
    for (const z of T.haz) {
      const h = hgt(z.idx);
      if (z.type === 'boost') { const g2 = new THREE.PlaneGeometry(68, 60); g2.rotateX(-Math.PI / 2); toDispose.push(g2); const m = add(g2, boostM); m.position.set(z.x, h + 1.2, z.y); m.rotation.y = -z.a; }
      else if (z.type === 'jump') {
        const l = 36, w = 40, H2 = 26, v = [-l, 0, -w, -l, 0, w, l, H2, w, -l, 0, -w, l, H2, w, l, H2, -w, l, 0, -w, l, H2, -w, l, H2, w, l, 0, -w, l, H2, w, l, 0, w, -l, 0, -w, l, H2, -w, l, 0, -w, -l, 0, w, l, 0, w, l, H2, w];
        const uvs = [0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0]; for (let k = 0; k < 6; k++) uvs.push(0.02, 0.02, 0.02, 0.02, 0.02, 0.02);
        const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g2.setAttribute('uv', new THREE.Float32BufferAttribute(uvs.slice(0, v.length / 3 * 2), 2)); g2.computeVertexNormals(); toDispose.push(g2);
        const m = add(g2, jumpM, { cast: true }); m.material.side = THREE.DoubleSide; m.position.set(z.x, h + 0.8, z.y); m.rotation.y = -z.a;
      } else { const m = add(disc, z.type === 'ice' ? iceM : slowM); m.scale.set(z.r, 1, z.r * (z.type === 'ice' ? 0.75 : 0.8)); m.position.set(z.x, h + 1.1, z.y); m.rotation.y = z.type === 'ice' ? 0.4 : -0.5; }
    }
  }

  // ───── 아이템 상자(빙글빙글 도는 금빛 상자) ─────
  const qC = canvas(128, 128, (g) => { const gr = g.createLinearGradient(0, 0, 128, 128); gr.addColorStop(0, '#ffe680'); gr.addColorStop(1, '#f2b600'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#c98a00'; g.lineWidth = 10; g.strokeRect(5, 5, 118, 118); g.fillStyle = '#fff'; g.font = 'bold 88px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeStyle = '#b07400'; g.lineWidth = 6; g.strokeText('?', 64, 70); g.fillText('?', 64, 70); });
  const boxGeo = new RoundedBoxGeometry(26, 26, 26, 2, 4); toDispose.push(boxGeo);
  const boxes = new THREE.InstancedMesh(boxGeo, pho({ map: tex(qC), shininess: 70, specular: '#fff3c0' }), T.boxes.length); boxes.castShadow = true; scene.add(boxes);

  // ───── 장식: 자주 나오는 것은 입체 모형, 나머지는 서 있는 그림 ─────
  const decoY = (d) => { if (!V3) return gz + 0.5; const c = P[d.idx], lat = Math.abs((d.x - c.x) * c.nx + (d.y - c.y) * c.ny); return Math.max(gz, hgt(d.idx) - Math.max(0, lat - S) * 0.9); };
  const parts = (list) => list; // [geo, color|'E:color'|{phong}, matrix?]
  const T3 = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
  const cyl = (rt, rb, h, seg = 8) => { const g2 = new THREE.CylinderGeometry(rt, rb, h, seg); g2.translate(0, h / 2, 0); return g2; };
  const cone = (r, h, seg = 8) => { const g2 = new THREE.ConeGeometry(r, h, seg); g2.translate(0, h / 2, 0); return g2; };
  const ball = (r, d = 1) => new THREE.IcosahedronGeometry(r, d);
  const at = (g2, x, y, z, sx, sy, sz) => { if (sx) g2.scale(sx, sy == null ? sx : sy, sz == null ? sx : sz); g2.translate(x, y, z); return g2; };
  const MODELS = {
    tree: () => parts([[cyl(0.06, 0.08, 0.42), '#8a5a33'], [at(ball(0.3), 0, 0.6, 0), '#4caf50'], [at(ball(0.2), 0.16, 0.5, 0.1), '#43a047'], [at(ball(0.18), -0.14, 0.72, -0.06), '#66bb6a']]),
    pine: () => parts([[cyl(0.05, 0.06, 0.25), '#7a4f2c'], [at(cone(0.32, 0.45), 0, 0.2, 0), '#2e8b57'], [at(cone(0.25, 0.38), 0, 0.45, 0), '#2f9e60'], [at(cone(0.17, 0.3), 0, 0.68, 0), '#38ad69']]),
    palm: () => { const L = [[at(cyl(0.05, 0.065, 0.3), 0, 0, 0), '#a0703f'], [at(cyl(0.045, 0.05, 0.3), 0.04, 0.29, 0), '#8f6236'], [at(cyl(0.04, 0.045, 0.28), 0.1, 0.57, 0), '#a0703f']]; for (let k = 0; k < 6; k++) { const g2 = new THREE.BoxGeometry(0.42, 0.02, 0.1); g2.translate(0.21, 0, 0); g2.rotateZ(-0.35); g2.rotateY(k / 6 * TAU); g2.translate(0.12, 0.86, 0); L.push([g2, k % 2 ? '#3fae49' : '#2f9a3d']); } L.push([at(ball(0.05, 0), 0.12, 0.8, 0.05), '#6b4a2b'], [at(ball(0.05, 0), 0.08, 0.8, -0.05), '#6b4a2b']); return L; },
    cactus: () => parts([[cyl(0.1, 0.11, 0.8, 10), '#5aa64a'], [at(cyl(0.06, 0.06, 0.26), 0.2, 0.35, 0), '#5aa64a'], [at(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 8).rotateZ(Math.PI / 2), 0.12, 0.35, 0), '#5aa64a'], [at(cyl(0.055, 0.055, 0.2), -0.18, 0.45, 0), '#4f9a40'], [at(new THREE.CylinderGeometry(0.055, 0.055, 0.14, 8).rotateZ(Math.PI / 2), -0.1, 0.45, 0), '#4f9a40']]),
    rock: () => parts([[at(new THREE.DodecahedronGeometry(0.35, 0), 0, 0.18, 0, 1, 0.65, 0.9), SPC ? '#' + mix(th.ridge[1], '#000000', 0.15).getHexString() : '#8d8a84'], [at(new THREE.DodecahedronGeometry(0.2, 0), 0.26, 0.1, 0.1, 1, 0.7, 1), SPC ? '#' + mix(th.ridge[0], '#ffffff', 0.1).getHexString() : '#a5a29b']]),
    pebble: () => parts([[at(new THREE.DodecahedronGeometry(0.16, 0), 0, 0.06, 0, 1, 0.6, 1), '#' + mix(th.bg, '#000000', 0.3).getHexString()], [at(new THREE.DodecahedronGeometry(0.1, 0), 0.18, 0.04, 0.08, 1, 0.6, 1), '#' + mix(th.bg, '#ffffff', 0.15).getHexString()]]),
    mushroom: () => { const cap = new THREE.SphereGeometry(0.34, 14, 8, 0, TAU, 0, Math.PI / 2); cap.scale(1, 0.75, 1); cap.translate(0, 0.38, 0); const L = [[cyl(0.1, 0.12, 0.4, 10), '#fff6e8'], [cap, '#e53935']]; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.3, r = k % 2 ? 0.22 : 0.15; L.push([at(ball(0.045, 0), Math.cos(a) * r, 0.38 + Math.sqrt(Math.max(0, 0.34 * 0.34 - r * r)) * 0.75, Math.sin(a) * r), '#ffffff']); } L.push([at(ball(0.05, 0), 0, 0.64, 0), '#ffffff']); return L; },
    snowman: () => parts([[at(ball(0.26), 0, 0.24, 0), '#ffffff'], [at(ball(0.19), 0, 0.6, 0), '#ffffff'], [at(ball(0.14), 0, 0.88, 0), '#ffffff'], [at(new THREE.ConeGeometry(0.035, 0.16, 6).rotateZ(-Math.PI / 2), 0.2, 0.88, 0), '#ff8a1c'], [at(cyl(0.1, 0.1, 0.14, 10), 0, 0.98, 0), '#2b2b2b'], [at(cyl(0.16, 0.16, 0.02, 12), 0, 0.98, 0), '#2b2b2b'], [at(new THREE.TorusGeometry(0.16, 0.035, 6, 14).rotateX(Math.PI / 2), 0, 0.76, 0), '#e53935']]),
    mountain: () => parts([[cone(0.65, 1.2, 9), '#8c7f73'], [at(cone(0.24, 0.45, 9), 0, 0.75, 0), '#ffffff']]),
    volcano: () => parts([[cyl(0.2, 0.62, 0.85, 10), '#6b4a3a'], [at(cyl(0.16, 0.16, 0.02, 10), 0, 0.85, 0), 'E:#ff7a1a'], [at(ball(0.07, 0), 0.05, 0.98, 0), 'E:#ffb347']]),
    building: () => parts([[at(new THREE.BoxGeometry(0.46, 1.4, 0.46), 0, 0.7, 0), 'WIN'], [at(new THREE.BoxGeometry(0.5, 0.04, 0.5), 0, 1.42, 0), '#5a6170']]),
    city: () => parts([[at(new THREE.BoxGeometry(0.36, 1.5, 0.36), 0, 0.75, 0), 'WIN'], [at(new THREE.BoxGeometry(0.3, 1.0, 0.3), 0.34, 0.5, 0.12), 'WIN'], [at(new THREE.BoxGeometry(0.3, 0.75, 0.3), -0.3, 0.375, -0.1), 'WIN']]),
    lamp: () => parts([[cyl(0.025, 0.035, 1.2, 8), '#59606b'], [at(new THREE.BoxGeometry(0.3, 0.03, 0.04), 0.13, 1.18, 0), '#59606b'], [at(ball(0.07, 1), 0.27, 1.14, 0), 'E:#fff3a6']]),
    signal: () => parts([[cyl(0.03, 0.035, 1.0, 8), '#59606b'], [at(new THREE.BoxGeometry(0.14, 0.38, 0.12), 0, 1.05, 0), '#2b2f36'], [at(ball(0.04, 1), 0, 1.17, 0.065), 'E:#ff4040'], [at(ball(0.04, 1), 0, 1.05, 0.065), 'E:#ffd23f'], [at(ball(0.04, 1), 0, 0.93, 0.065), 'E:#40e070']]),
    bush: () => parts([[at(ball(0.2), 0, 0.14, 0, 1, 0.75, 1), '#4caf50'], [at(ball(0.16), 0.18, 0.1, 0.06, 1, 0.75, 1), '#43a047'], [at(ball(0.15), -0.16, 0.1, -0.05, 1, 0.75, 1), '#5cbf60']]),
    egg: () => parts([[at(ball(0.18, 2), 0, 0.22, 0, 1, 1.3, 1), '#fff4dc'], [at(ball(0.04, 0), 0.12, 0.3, 0.1), '#c9a36b'], [at(ball(0.035, 0), -0.1, 0.18, 0.13), '#c9a36b']]),
    bone: () => parts([[at(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8).rotateZ(Math.PI / 2), 0, 0.07, 0), '#f3ead6'], ...[[-0.3, -0.06], [-0.3, 0.06], [0.3, -0.06], [0.3, 0.06]].map(([x, z]) => [at(ball(0.07, 1), x, 0.07, z), '#f3ead6'])]),
    parasol: () => parts([[cyl(0.02, 0.02, 0.8, 6), '#eeeeee'], [at(cone(0.42, 0.18, 10), 0, 0.72, 0), '#ff5a5a'], [at(cone(0.43, 0.06, 10), 0, 0.71, 0), '#ffffff']]),
    ball: () => parts([[at(ball(0.16, 2), 0, 0.16, 0), '#ffffff'], [at(new THREE.TorusGeometry(0.16, 0.012, 4, 20), 0, 0.16, 0), '#3b7bd8']]),
    // 🚀 우주
    crater: () => parts([[at(new THREE.TorusGeometry(0.62, 0.14, 6, 18).rotateX(Math.PI / 2), 0, 0.02, 0, 1, 0.5, 1), '#' + mix(th.bg, '#000000', 0.12).getHexString()], [at(new THREE.CircleGeometry(0.6, 18).rotateX(-Math.PI / 2), 0, 0.02, 0), '#' + mix(th.bg, '#000000', 0.38).getHexString()]]),
    lake: () => parts([[at(new THREE.CircleGeometry(0.75, 20).rotateX(-Math.PI / 2), 0, 0.03, 0, 1, 1, 0.8), 'P:#26332f']]),
    vent: () => parts([[cyl(0.12, 0.5, 0.6, 9), '#4a3418'], [at(cyl(0.11, 0.11, 0.02, 9), 0, 0.6, 0), 'E:#ff7a2a'], [at(ball(0.16, 0), 0.03, 0.82, 0), 'T:#cbbf86'], [at(ball(0.22, 0), -0.05, 1.08, 0.04), 'T:#b8ad7a']]),
    ice: () => parts([[at(cone(0.13, 0.7, 5), -0.15, 0, 0), 'P:#bfe6ff'], [at(cone(0.16, 1.0, 5), 0, 0, 0.05), 'P:#d6f0ff'], [at(cone(0.12, 0.6, 5), 0.17, 0, -0.04), 'P:#bfe6ff']]),
    dish: () => { const d = new THREE.SphereGeometry(0.42, 14, 6, 0, TAU, 0, 1.0); d.scale(1, 0.6, 1); d.rotateX(Math.PI); d.rotateZ(-0.7); d.translate(0, 0.95, 0); return parts([[cyl(0.16, 0.2, 0.12, 8), '#555b63'], [cyl(0.035, 0.035, 0.75, 6), '#9097a0'], [d, '#d8dce1'], [at(cyl(0.012, 0.012, 0.4, 4).rotateZ(-0.7), 0.05, 0.7, 0), '#9097a0'], [at(ball(0.035, 0), 0.25, 1.0, 0), 'E:#ff4040']]); },
    lander: () => { const L = [[at(cyl(0.3, 0.36, 0.42, 8), 0, 0.42, 0), '#c9a24a'], [at(cyl(0.2, 0.3, 0.12, 8), 0, 0.84, 0), '#d8dce1'], [at(cone(0.16, 0.14, 8).rotateX(Math.PI), 0, 0.42, 0), '#555b63']]; for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.78, g2 = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 5); g2.rotateZ(0.6); g2.rotateY(-a); g2.translate(Math.cos(a) * 0.4, 0.26, Math.sin(a) * 0.4); L.push([g2, '#555b63'], [at(cyl(0.07, 0.07, 0.02, 8), Math.cos(a) * 0.56, 0, Math.sin(a) * 0.56), '#9097a0']); } return L; },
    hab: () => parts([[at(new THREE.CylinderGeometry(0.24, 0.24, 1.1, 14).rotateZ(Math.PI / 2), 0, 0.26, 0), '#d8dce1'], [at(ball(0.24, 1), 0.55, 0.26, 0, 0.5, 1, 1), '#c0c6cf'], [at(ball(0.24, 1), -0.55, 0.26, 0, 0.5, 1, 1), '#c0c6cf'], ...[-0.3, 0, 0.3].map((x) => [at(new THREE.BoxGeometry(0.1, 0.09, 0.02), x, 0.3, 0.235), 'E:#9ad0ff']), [at(new THREE.BoxGeometry(0.4, 0.02, 0.32), -0.25, 0.62, 0), '#243f7d'], [at(cyl(0.015, 0.015, 0.14, 4), -0.25, 0.48, 0), '#9097a0']]),
    solar: () => parts([[cyl(0.025, 0.03, 0.5, 6), '#555b63'], [at(new THREE.BoxGeometry(0.5, 0.02, 0.42).rotateZ(0.5), -0.3, 0.6, 0), '#243f7d'], [at(new THREE.BoxGeometry(0.5, 0.02, 0.42).rotateZ(-0.5), 0.3, 0.6, 0), '#243f7d']]),
    mast: () => parts([[cyl(0.015, 0.03, 1.3, 6), '#9097a0'], [at(new THREE.BoxGeometry(0.32, 0.02, 0.02), 0, 0.5, 0), '#9097a0'], [at(new THREE.BoxGeometry(0.32, 0.02, 0.02), 0, 0.85, 0), '#9097a0'], [at(cyl(0.12, 0.12, 0.05, 8), 0, 0, 0), '#555b63'], [at(ball(0.04, 0), 0, 1.32, 0), 'BLINK']]),
  };
  const KIND = { '🌳': 'tree', '🌲': 'pine', '🌴': 'palm', '🌵': 'cactus', '🪨': 'rock', rock: 'rock', pebble: 'pebble', '🍄': 'mushroom', '⛄': 'snowman', '🏔️': 'mountain', '🌋': 'volcano', '🏢': 'building', '🏙️': 'city', '💡': 'lamp', '🚦': 'signal', '🌿': 'bush', '🥚': 'egg', '🦴': 'bone', '⛱️': 'parasol', '🏐': 'ball', crater: 'crater', lake: 'lake', vent: 'vent', ice: 'ice', dish: 'dish', lander: 'lander', hab: 'hab', solar: 'solar', mast: 'mast' };
  const SCALE = { mushroom: 0.85, snowman: 1.0, mountain: 2.2, volcano: 1.9, building: 1.5, city: 1.6, crater: 1.6, lake: 1.6, hab: 1.15, lamp: 1.1, signal: 1.0, palm: 1.35, tree: 1.3, pine: 1.35 };
  const winC = canvas(64, 128, (g) => { g.fillStyle = '#7c8aa3'; g.fillRect(0, 0, 64, 128); const r = rand(5); for (let y = 6; y < 124; y += 12) for (let x = 6; x < 60; x += 14) { g.fillStyle = r() < 0.6 ? '#ffe9a0' : '#3a4a66'; g.fillRect(x, y, 9, 7); } });
  const winM = lam({ map: tex(winC) });
  let blinkM = null;
  const matOf = (key) => {
    if (key === 'WIN') return winM;
    if (key === 'BLINK') return (blinkM = bas({ color: '#ff3b30' }));
    if (key.startsWith('E:')) return bas({ color: key.slice(2) });
    if (key.startsWith('P:')) return pho({ color: key.slice(2), shininess: 90, specular: '#ffffff', flatShading: true });
    if (key.startsWith('T:')) return lam({ color: key.slice(2), transparent: true, opacity: 0.55, depthWrite: false });
    return lam({ color: key, flatShading: true });
  };
  const byKind = new Map(), bill = new Map(), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), v3a = new THREE.Vector3(), v3b = new THREE.Vector3(), yAxis = new THREE.Vector3(0, 1, 0);
  const rr = rand(1234);
  for (const d of T.decos) {
    const k = KIND[d.e], y = decoY(d);
    if (k) { if (!byKind.has(k)) byKind.set(k, []); byKind.get(k).push([d, y, rr() * TAU]); }
    else { if (!bill.has(d.e)) bill.set(d.e, []); bill.get(d.e).push([d, y]); }
  }
  for (const [k, list] of byKind) {
    const groups = new Map();
    for (const [geo, key] of MODELS[k]()) { if (!groups.has(key)) groups.set(key, []); groups.get(key).push(geo.index ? geo.toNonIndexed() : geo); }
    const sc0 = SCALE[k] || 1.15;
    for (const [key, geos] of groups) {
      const geo = geos.length > 1 ? BGU.mergeGeometries(geos.map((g2) => { for (const n of Object.keys(g2.attributes)) if (!['position', 'normal', 'uv'].includes(n)) g2.deleteAttribute(n); if (!g2.attributes.uv) g2.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g2.attributes.position.count * 2), 2)); return g2; })) : geos[0];
      toDispose.push(geo);
      const im = new THREE.InstancedMesh(geo, matOf(key), list.length);
      list.forEach(([d, y, rot], n) => { const s = d.s * sc0; q4.setFromAxisAngle(yAxis, rot); m4.compose(v3a.set(d.x, y, d.y), q4, v3b.set(s, s, s)); im.setMatrixAt(n, m4); });
      const flat = k === 'crater' || k === 'lake' || k === 'pebble';
      im.castShadow = !flat && !key.startsWith('T:') && !key.startsWith('E:'); im.receiveShadow = true; scene.add(im);
    }
  }
  // 서 있는 그림(이모지): 늘 카메라 쪽을 본다 + 발밑 그림자
  const blobC = canvas(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(0,0,0,.42)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  const blobM = bas({ map: tex(blobC), transparent: true, depthWrite: false });
  const plane = new THREE.PlaneGeometry(1, 1); plane.translate(0, 0.5, 0); toDispose.push(plane);
  const flatDisc = new THREE.PlaneGeometry(1, 1); flatDisc.rotateX(-Math.PI / 2); toDispose.push(flatDisc);
  const emoTex = new Map(), emoT = (e) => { let t = emoTex.get(e); if (!t) { t = tex(G.raceUtil.emo(e)); emoTex.set(e, t); } return t; };
  const bills = [];
  let nBlob = 0; for (const [, list] of bill) nBlob += list.length;
  const blobs = new THREE.InstancedMesh(flatDisc, blobM, Math.max(1, nBlob)); blobs.renderOrder = 1; scene.add(blobs); blobs.count = nBlob;
  { let n = 0; for (const [e, list] of bill) {
    const im = new THREE.InstancedMesh(plane, bas({ map: emoT(e), alphaTest: 0.45, side: THREE.DoubleSide }), list.length); im.frustumCulled = false; scene.add(im);
    const items = list.map(([d, y]) => { const s = d.s * (e === '☁️' ? 1.6 : 1.25); m4.compose(v3a.set(d.x + s * 0.12, y + 0.8, d.y + s * 0.12), q4.identity(), v3b.set(s * 0.8, 1, s * 0.8)); blobs.setMatrixAt(n++, m4); return { x: d.x, y: e === '☁️' ? y + 140 : y, z: d.y, s }; });
    bills.push({ im, items });
  } }

  // ───── 먼 산(3D 경기장)·별·행성 ─────
  if (V3) {
    const R0 = ext * 0.75 + 2600;
    for (let layer = 0; layer < 2; layer++) {
      const R = R0 * (1 - layer * 0.12), n = 96, pos = [], idx = [], r = rand(31 + layer);
      for (let k = 0; k <= n; k++) {
        const a = k / n * TAU, q = a * (6 + layer * 4), ht = SPC ? 120 + 380 * Math.abs(Math.sin(q * 1.3 + layer * 2)) * (0.55 + 0.45 * Math.abs(Math.sin(q * 3.7))) : 160 + 260 * (0.5 + 0.5 * Math.sin(q)) * (0.6 + 0.4 * Math.sin(q * 2.3 + 1)) + r() * 40;
        pos.push(mx + Math.cos(a) * R, gz - 40, mz + Math.sin(a) * R, mx + Math.cos(a) * R, gz + ht * (1.2 + layer * 0.5), mz + Math.sin(a) * R);
        if (k < n) idx.push(k * 2, k * 2 + 1, k * 2 + 2, k * 2 + 1, k * 2 + 3, k * 2 + 2);
      }
      const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g2.setIndex(idx); toDispose.push(g2);
      const c = mix(th.ridge[layer], th.sky[1], Math.min(0.85, (0.5 - layer * 0.18) * Math.max(FOGK, 0.15)));
      add(g2, bas({ color: c, side: THREE.DoubleSide, fog: false }), { recv: false });
    }
  }
  if (th.stars) {
    const n = 900, pos = new Float32Array(n * 3), r = rand(99);
    for (let i = 0; i < n; i++) { const u = r() * 2 - 1, a = r() * TAU, s = Math.sqrt(1 - u * u), up = Math.abs(u); pos.set([mx + Math.cos(a) * s * 9000, gz + up * 9000 * 0.9 + 200, mz + Math.sin(a) * s * 9000], i * 3); }
    const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.BufferAttribute(pos, 3)); toDispose.push(g2);
    const pm = new THREE.PointsMaterial({ color: '#ffffff', size: 2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 }); toDispose.push(pm);
    scene.add(new THREE.Points(g2, pm));
  }
  if (th.planet) {
    const pc = canvas(512, 512, (g) => drawPlanet(g, th.planet));
    const sm = new THREE.SpriteMaterial({ map: tex(pc), fog: false, depthWrite: false }); toDispose.push(sm);
    const sp = new THREE.Sprite(sm), big2 = th.planet === 'jupiter' ? 5200 : th.planet === 'saturn' ? 4200 : th.planet === 'belt' ? 5000 : 2600;
    sp.scale.set(big2, big2, 1); sp.position.set(mx + 8000 * 0.8, gz + 2000, mz - 8000 * 0.6); sp.renderOrder = -1; scene.add(sp);
  }
  if (SPC && th.sun) {
    const gc = canvas(256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(255,253,242,1)'); gr.addColorStop(0.08, 'rgba(255,248,225,.9)'); gr.addColorStop(0.3, 'rgba(255,230,190,.2)'); gr.addColorStop(1, 'rgba(255,230,190,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
    const sm = new THREE.SpriteMaterial({ map: tex(gc), fog: false, depthWrite: false, blending: THREE.AdditiveBlending }); toDispose.push(sm);
    const sp = new THREE.Sprite(sm); const sk = 2400 * (th.sunK || 1); sp.scale.set(sk, sk, 1); sp.position.set(mx + sunDir.x * 9000, gz + sunDir.y * 9000, mz + sunDir.z * 9000); scene.add(sp);
  }

  // ───── 차 ─────
  const kartBody = new RoundedBoxGeometry(50, 13, 32, 3, 5); kartBody.translate(0, 13, 0);
  const nose = new RoundedBoxGeometry(14, 8, 26, 2, 3); nose.translate(27, 10, 0);
  const bump = new RoundedBoxGeometry(6, 7, 34, 2, 2.5);
  const seat = new RoundedBoxGeometry(10, 16, 22, 2, 3); seat.translate(-14, 25, 0);
  const wheel = new THREE.CylinderGeometry(8.5, 8.5, 7, 16); wheel.rotateX(Math.PI / 2);
  const hub = new THREE.CylinderGeometry(4, 4, 7.6, 10); hub.rotateX(Math.PI / 2);
  const glass = new THREE.PlaneGeometry(14, 10); glass.rotateY(Math.PI / 2); glass.rotateZ(-0.5);
  const lightG = new THREE.SphereGeometry(2.8, 8, 6), coneG = new THREE.ConeGeometry(7, 26, 10); coneG.rotateZ(Math.PI / 2);
  toDispose.push(kartBody, nose, bump, seat, wheel, hub, glass, lightG, coneG);
  const darkM = pho({ color: '#1b1c20', shininess: 20 }), hubM = lam({ color: '#cfd3da' }), glassM = pho({ color: '#9fd8ff', transparent: true, opacity: 0.55, shininess: 120, specular: '#ffffff', side: THREE.DoubleSide, depthWrite: false });
  const headM = bas({ color: '#fff7b0' }), tailM = bas({ color: '#ff4b4b' }), flameM = bas({ color: '#ff9f1c', transparent: true, opacity: 0.85 }), flame2M = bas({ color: '#fff176', transparent: true, opacity: 0.9 });
  const shieldG = new THREE.SphereGeometry(40, 18, 12), slipG = new THREE.TorusGeometry(40, 2.2, 6, 30), iceG = new RoundedBoxGeometry(66, 44, 46, 2, 6), ringG = new THREE.RingGeometry(38, 46, 40); ringG.rotateX(-Math.PI / 2); slipG.rotateX(Math.PI / 2);
  const markG = new THREE.ConeGeometry(9, 18, 4); markG.rotateX(Math.PI); toDispose.push(shieldG, slipG, iceG, ringG, markG);
  const shieldM = pho({ color: '#50dcff', transparent: true, opacity: 0.28, shininess: 100, depthWrite: false, emissive: '#1a6f8a' }), slipM = bas({ color: '#78e65a', transparent: true, opacity: 0.85 }), iceM2 = pho({ color: '#cfefff', transparent: true, opacity: 0.55, shininess: 120, specular: '#ffffff', depthWrite: false });
  const ringM = bas({ color: '#ffe14d', transparent: true, opacity: 0.55, depthWrite: false }), markM = lam({ color: '#ffe14d', emissive: '#7a5d00' });
  const domeG = new THREE.SphereGeometry(19, 16, 10, 0, TAU, 0, Math.PI / 2); toDispose.push(domeG);
  const domeM = pho({ color: '#bfe6ff', transparent: true, opacity: 0.18, shininess: 140, specular: '#ffffff', depthWrite: false }); // 우주: 운전석 유리 돔(얼굴이 잘 보이게 아주 옅게)
  const spriteM = new Map(), sprM = (key, c) => { let m = spriteM.get(key); if (!m) { m = new THREE.SpriteMaterial({ map: tex(c), depthWrite: true, alphaTest: 0.3 }); toDispose.push(m); spriteM.set(key, m); } return m; };

  function extras(car, col) { // 차마다 다른 모양 장식
    const L = [], box = (w, h, d, x, y, z, c, rz) => { const g2 = new THREE.BoxGeometry(w, h, d); if (rz) g2.rotateZ(rz); g2.translate(x, y, z); toDispose.push(g2); L.push([g2, c]); };
    const id = car.id;
    if (id === 'bolt' || id === 'claw') { box(4, 10, 4, -22, 24, -11, '#222'); box(4, 10, 4, -22, 24, 11, '#222'); box(10, 2.5, 34, -23, 30, 0, id === 'claw' ? '#222' : '#ffd23f'); }
    else if (id === 'cop') { box(6, 4, 22, -4, 21.5, 0, '#222'); box(5, 5, 9, -4, 25, -6, 'E:#ff3030'); box(5, 5, 9, -4, 25, 6, 'E:#3070ff'); box(48, 3, 33, 0, 15, 0, '#ffffff'); }
    else if (id === 'fire') { box(40, 3, 6, -2, 24, -8, '#d9d9d9'); box(40, 3, 6, -2, 24, 8, '#d9d9d9'); for (let x = -18; x <= 14; x += 8) box(2.5, 2.5, 16, x, 24, 0, '#d9d9d9'); box(6, 5, 8, 18, 22, 0, 'E:#ff3030'); }
    else if (id === 'bus' || id === 'van') { box(id === 'bus' ? 40 : 30, 16, 30, -6, 28, 0, col); box(id === 'bus' ? 38 : 28, 6, 31, -6, 30, 0, '#9fd8ff'); }
    else if (id === 'tank' || id === 'rex') { box(54, 6, 36, 0, 8, 0, '#3b3f45'); if (id === 'rex') for (let z = -12; z <= 12; z += 6) box(3, 4, 3, 26, 17, z, '#ffffff'); }
    else if (id === 'horn') { const c3 = new THREE.ConeGeometry(2.6, 14, 6); c3.rotateZ(-Math.PI / 2); for (const [y, z] of [[20, -10], [20, 10], [16, 0]]) { const g3 = c3.clone(); g3.translate(37, y, z); toDispose.push(g3); L.push([g3, '#f5ecd0']); } c3.dispose(); }
    else if (id === 'aqua') { for (let x = -18; x <= 10; x += 7) box(5, 12 - Math.abs(x + 4) / 3, 2.5, x, 25 + (6 - Math.abs(x + 4) / 4), 0, '#e8792b'); }
    else if (id === 'spike') { const c3 = new THREE.ConeGeometry(3, 9, 5); for (let x = -18; x <= 14; x += 8) { const g3 = c3.clone(); g3.translate(x, 23, 0); toDispose.push(g3); L.push([g3, '#f0883e']); } c3.dispose(); }
    else if (id === 'snake') { for (let k = 0; k < 6; k++) box(7, 1.2, 4, -17 + k * 7, 19.8, (k % 2 ? -5 : 5), '#ffe45c'); box(4, 1, 2, 27, 15, 0, '#e8483f'); }
    else if (id === 'hop') { box(10, 1.2, 10, 0, 19.8, 0, '#ffffff'); }
    else if (id === 'slide') { box(46, 1.2, 4, 0, 19.8, 0, '#ffffff'); }
    return L;
  }
  const kmats = new Map(), kmat = (key) => { let m = kmats.get(key); if (!m) { m = key.startsWith('E:') ? bas({ color: key.slice(2) }) : pho({ color: key, shininess: 70, specular: '#ffffff' }); kmats.set(key, m); } return m; };
  const karts = racers.map((r) => {
    const g = new THREE.Group(); g.rotation.order = 'YZX';
    const body = new THREE.Group(); g.add(body);
    const col = r.col || r.car.color, cm = kmat(col);
    const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; body.add(m); return m; };
    mesh(kartBody, cm); mesh(nose, cm); mesh(bump, darkM, 26, 9, 0); mesh(bump, darkM, -26, 9, 0); mesh(seat, darkM);
    mesh(glass, glassM, 8, 25, 0).castShadow = false;
    for (const z of [-10, 10]) { mesh(lightG, headM, 33, 12, z).castShadow = false; mesh(lightG, tailM, -28.5, 14, z).castShadow = false; }
    for (const [geo, c] of extras(r.car, col)) mesh(geo, kmat(c));
    const wheels = [];
    for (const [x, z] of [[16, -18], [16, 18], [-16, -18], [-16, 18]]) { const w = new THREE.Group(); w.position.set(x, 8.5, z); const a = new THREE.Mesh(wheel, darkM), h = new THREE.Mesh(hub, hubM); a.castShadow = true; w.add(a, h); body.add(w); wheels.push(w); }
    const flame = new THREE.Group(), f1 = new THREE.Mesh(coneG, flameM), f2 = new THREE.Mesh(coneG, flame2M); f2.scale.set(0.55, 0.55, 0.55); flame.add(f1, f2); flame.position.set(-42, 13, 0); body.add(flame);
    const head = new THREE.Sprite(sprM('f:' + r.ch.e, G.raceUtil.emo(r.ch.e))); head.scale.set(31, 31, 1); head.position.set(-6, 38, 0); body.add(head);
    let hat = null; if (r.hat) { hat = new THREE.Sprite(sprM('f:' + r.hat, G.raceUtil.emo(r.hat))); hat.scale.set(19, 19, 1); hat.position.set(-6, 56, 0); body.add(hat); }
    let dome = null; if (SPC) { dome = new THREE.Mesh(domeG, domeM); dome.position.set(-6, 22, 0); body.add(dome); }
    const shield = new THREE.Mesh(shieldG, shieldM); shield.position.y = 22; g.add(shield);
    const slip = new THREE.Mesh(slipG, slipM); slip.position.y = 10; g.add(slip);
    const ice = new THREE.Mesh(iceG, iceM2); ice.position.y = 24; g.add(ice);
    let ring = null, mark = null; if (r.isPlayer) { ring = new THREE.Mesh(ringG, ringM); ring.position.y = 1.5; ring.renderOrder = 2; g.add(ring); mark = new THREE.Mesh(markG, markM); mark.position.set(-6, 76, 0); body.add(mark); }
    const s = K * (r.isPlayer && !V3 ? 1.08 : 1); g.scale.set(s, s, s);
    scene.add(g);
    return { r, g, body, wheels, flame, head, hat, dome, shield, slip, ice, ring, mark, roll: 0, faceKey: 'f' };
  });

  // ───── 던진 것·꼬리 효과·먼지·충격파: 그때그때 만들고 지운다 ─────
  const dyn = new Map(), oilG = new THREE.CircleGeometry(1, 20); oilG.rotateX(-Math.PI / 2); toDispose.push(oilG);
  const oilM = pho({ color: '#14141e', shininess: 140, specular: '#8c96ff' }), pitM = bas({ color: '#120c08' }), pitRimM = lam({ color: '#6b4a2b' });
  const OBJ_E = { banana: '🍌', trap: '🪤', ice: '🧊' };
  const dustTex = tex(canvas(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }));
  const dustCol = mix(th.bg, th.slow, 0.5);
  const pool = []; // 꼬리·먼지용 스프라이트 묶음
  const spr = (map, color) => { let s = pool.pop(); if (!s) { s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false })); } s.material.map = map; s.material.color.set(color || '#ffffff'); s.material.needsUpdate = true; s.visible = true; scene.add(s); return s; };
  const used = [];
  const fxRings = [], ringFxG = new THREE.TorusGeometry(1, 0.06, 6, 40); ringFxG.rotateX(Math.PI / 2); toDispose.push(ringFxG);
  const groundAt = (x, y) => { if (!V3) return 0; let bi = me.idx, bd = 1e18; for (let q = -40; q <= 160; q += 2) { const m = (me.idx + q + M) % M, c = P[m], d = (c.x - x) ** 2 + (c.y - y) ** 2; if (d < bd) { bd = d; bi = m; } } return hgt(bi); };

  // ───── 카메라 ─────
  const cam = { z: null, p: 0.16 };
  let W = 0, H = 0;
  function resize(w, h) { W = w; H = h; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  let lastShadow = true, lastT = 0;

  function draw(E) {
    const t = E.t || 0, dt = clamp(t - lastT, 0, 0.1); lastT = t;
    const yaw = E.yaw, fx = Math.cos(yaw), fy = Math.sin(yaw);
    if (W !== E.W || H !== E.H) resize(E.W, E.H);
    const land = W > H * 1.05;
    // 카메라
    if (V3) {
      const VIEW = land ? 1.5 : 1.12, DIST = 240 * VIEW, CAMH = 92 * VIEW, meH = E.hOf(me), k = 1 - Math.exp(-(E.dt || 0.016) * 7);
      if (cam.z === null) cam.z = meH + CAMH;
      cam.z += (meH + CAMH - cam.z) * k;
      const hLook = hgt(me.idx + 28), pT = clamp(Math.atan2(cam.z - hLook, DIST + 290) + 0.03, 0.05, 0.6); cam.p += (pT - cam.p) * k;
      const Fp = Math.max(W * 0.8, H * 0.45); camera.fov = 2 * Math.atan(H / 2 / Fp) * 180 / Math.PI;
      camera.position.set(me.dx - fx * DIST, cam.z, me.dy - fy * DIST);
      const cp = Math.cos(cam.p), sp = Math.sin(cam.p);
      camera.lookAt(camera.position.x + fx * cp * 100, cam.z - sp * 100, camera.position.z + fy * cp * 100);
    } else {
      const pitch = land ? 0.95 : 1.0, D = land ? 660 : 820, ahead = land ? 40 : 120;
      camera.fov = land ? 42 : 46;
      const tx = me.dx + fx * ahead, ty = me.dy + fy * ahead;
      camera.position.set(tx - fx * D * Math.cos(pitch), D * Math.sin(pitch) + me.zair * 0.3, ty - fy * D * Math.cos(pitch));
      camera.lookAt(tx, 0, ty);
    }
    camera.updateProjectionMatrix();
    // 해(그림자)는 내 차를 따라간다
    const lowQ = !!E.lowQ;
    if (lowQ === lastShadow) { lastShadow = !lowQ; sun.castShadow = !lowQ; }
    const gy = V3 ? E.hOf(me) - me.zair : 0;
    sun.target.position.set(me.dx + fx * 160, gy, me.dy + fy * 160); sun.position.copy(sun.target.position).addScaledVector(sunDir, 1800);
    if (blinkM) blinkM.color.set(Math.sin(t * 3) > 0 ? '#ff3b30' : '#4a1210');
    // 먼지 폭풍(우주)
    if (SPC) { const dn = E.stormN > 0.5 ? 1 : 0; if (dn !== dustNow) { dustNow = dn; paintRoad(!!dn); } }
    // 상자
    for (let i = 0; i < T.boxes.length; i++) { const bx = T.boxes[i], hide = E.boxT[i] > 0; q4.setFromAxisAngle(yAxis, t * 1.6 + i); m4.compose(v3a.set(bx.x, hgt(bx.idx) + 20 + Math.sin(t * 3 + i) * 3, bx.y), q4, v3b.setScalar(hide ? 0.0001 : 1)); boxes.setMatrixAt(i, m4); }
    boxes.instanceMatrix.needsUpdate = true;
    // 서 있는 그림: 카메라 쪽으로 돌린다
    const cxp = camera.position.x, czp = camera.position.z;
    for (const bgp of bills) { const { im, items } = bgp; for (let n = 0; n < items.length; n++) { const it = items[n]; q4.setFromAxisAngle(yAxis, Math.atan2(cxp - it.x, czp - it.z)); m4.compose(v3a.set(it.x, it.y, it.z), q4, v3b.set(it.s, it.s, it.s)); im.setMatrixAt(n, m4); } im.instanceMatrix.needsUpdate = true; }
    // 차
    for (const k of karts) {
      const r = k.r, gh = V3 ? E.hOf(r) - r.zair : 0;
      k.g.position.set(r.dx, gh + r.zair + (V3 ? 0 : 0.5), r.dy);
      let hd = r.dh + (V3 ? 0 : r.spin) + (r.slip > 0 ? Math.sin(t * 20) * 0.24 : 0);
      k.g.rotation.y = -hd;
      k.g.rotation.z = V3 ? Math.atan(T.slope[r.idx] || 0) * 0.9 : 0;
      k.g.rotation.x = V3 && r.stun > 0 ? Math.sin(r.spin * 1.5) * 0.35 : 0;
      if (V3 && r.stun > 0) k.g.rotation.y = -(r.dh + r.spin);
      k.roll += (r.v || 0) * dt / 8.5; for (let w = 0; w < 4; w++) { k.wheels[w].rotation.z = -k.roll; if (w < 2) k.wheels[w].rotation.y = -(r.steerIn || 0) * 0.4; }
      k.flame.visible = r.boost > 0; if (r.boost > 0) { const f = 0.8 + Math.random() * 0.5; k.flame.scale.set(f, 1, 1); }
      k.shield.visible = r.shield > 0; if (r.shield > 0) k.shield.scale.setScalar(1 + Math.sin(t * 10) * 0.04);
      k.slip.visible = r.slip > 0; if (r.slip > 0) k.slip.rotation.y = t * 4;
      k.ice.visible = r.frozen > 0;
      if (k.ring) { k.ring.material.opacity = 0.35 + 0.25 * (0.5 + 0.5 * Math.sin(t * 6)); k.ring.scale.setScalar(1 + 0.05 * Math.sin(t * 6)); }
      if (k.mark) k.mark.position.y = 76 + Math.sin(t * 7) * 4;
      // 얼굴: 2D 경기장·출발 전·카메라를 볼 때는 얼굴, 3D 에서 달릴 때는 뒷모습
      const rel = Math.atan2(Math.sin(r.dh - yaw), Math.cos(r.dh - yaw)), face = !V3 || E.state === 'count' || Math.abs(rel) > 1.25, key = face ? 'f' : 'b';
      if (key !== k.faceKey) { k.faceKey = key; k.head.material = face ? sprM('f:' + r.ch.e, G.raceUtil.emo(r.ch.e)) : sprM('b:' + r.ch.id, window.Race3D.charBack(r.ch)); }
    }
    // 던진 것
    const seen = new Set();
    for (const ob of E.objs) {
      seen.add(ob); let m = dyn.get(ob);
      const ox = ob.px === undefined ? ob.x : ob.px + (ob.x - ob.px) * E.alpha, oy = ob.py === undefined ? ob.y : ob.py + (ob.y - ob.py) * E.alpha;
      if (!m) {
        if (ob.k === 'oil') { m = new THREE.Mesh(oilG, oilM); m.scale.set(ob.r, 1, ob.r * 0.75); m.rotation.y = 0.3; }
        else if (ob.k === 'pit') { m = new THREE.Group(); const a = new THREE.Mesh(oilG, pitRimM), c = new THREE.Mesh(oilG, pitM); a.scale.set(ob.r, 1, ob.r * 0.78); c.scale.set(ob.r * 0.8, 1, ob.r * 0.62); c.position.y = 0.3; m.add(a, c); }
        else { m = new THREE.Sprite(sprM('f:' + (OBJ_E[ob.k] || '🎯'), G.raceUtil.emo(OBJ_E[ob.k] || '🎯'))); m.scale.set(38, 38, 1); }
        scene.add(m); dyn.set(ob, m);
      }
      const gh = groundAt(ox, oy);
      m.position.set(ox, gh + (m.isSprite ? 20 : 1.3), oy);
    }
    for (const [ob, m] of dyn) if (!seen.has(ob)) { scene.remove(m); dyn.delete(ob); }
    // 꼬리 효과·먼지
    while (used.length) { const s = used.pop(); s.visible = false; scene.remove(s); pool.push(s); }
    for (const p of me.tr || []) { const s = spr(emoT(p.e)); const z = 22 * K * (1 - 0.4 * p.t / 0.6); s.scale.set(z, z, 1); s.material.opacity = Math.max(0, 1 - p.t / 0.6); s.position.set(p.x, (V3 ? p.h : 0) + 12, p.y); used.push(s); }
    if (SPC) for (const r of racers) for (const p of r.dust || []) { const s = spr(dustTex, dustCol), k3 = p.t / p.life, z = (24 + 92 * k3); s.scale.set(z, z * 0.7, 1); s.material.opacity = 0.34 * Math.pow(1 - k3, 1.3); s.position.set(p.x, p.h + 6 + p.t * 40, p.y); used.push(s); }
    // 충격파
    while (fxRings.length < E.fx.length) { const m = new THREE.Mesh(ringFxG, bas({ color: '#ffffff', transparent: true, depthWrite: false })); scene.add(m); fxRings.push(m); }
    fxRings.forEach((m, i) => { const f = E.fx[i]; m.visible = !!(f && f.k === 'ring'); if (!m.visible) return; const k3 = f.t / f.life, R = 20 + k3 * 220; m.scale.set(R, 30, R); m.material.opacity = 1 - k3; m.position.set(f.x, groundAt(f.x, f.y) + 8, f.y); });
    renderer.render(scene, camera);
  }

  function dispose() {
    for (const [, m] of dyn) scene.remove(m);
    scene.traverse((ob) => { if (ob.isInstancedMesh) ob.dispose(); if (ob.isSprite && ob.material && !toDispose.includes(ob.material)) ob.material.dispose(); });
    for (const m of fxRings) m.material.dispose();
    for (const s of pool) s.material.dispose();
    for (const d of toDispose) try { d.dispose(); } catch (e) {}
    renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {}
    cvs.remove();
  }
  return { canvas: cvs, draw, resize, dispose };
}

// 하늘의 큰 천체(우주 코스): 512×512 그림
function drawPlanet(g, kind) {
  const C = 256;
  if (kind === 'earth') {
    const r = 200, gr = g.createRadialGradient(C - 60, C - 60, 20, C, C, r); gr.addColorStop(0, '#9fd2ff'); gr.addColorStop(0.55, '#3a7fd6'); gr.addColorStop(1, '#14336b');
    g.save(); g.beginPath(); g.arc(C, C, r, 0, TAU); g.fillStyle = gr; g.fill(); g.clip();
    g.fillStyle = 'rgba(70,170,90,.85)'; g.beginPath(); g.ellipse(C - 60, C - 20, 68, 44, 0.5, 0, TAU); g.ellipse(C + 70, C + 50, 44, 60, -0.4, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 18; g.beginPath(); g.arc(C - 20, C - 50, 110, 3.4, 5.2); g.stroke(); g.beginPath(); g.arc(C + 20, C + 60, 100, 0.2, 1.8); g.stroke();
    g.fillStyle = 'rgba(0,0,20,.35)'; g.beginPath(); g.arc(C + 84, C + 40, 210, 0, TAU); g.fill(); g.restore();
    g.strokeStyle = 'rgba(140,200,255,.5)'; g.lineWidth = 6; g.beginPath(); g.arc(C, C, r + 4, 0, TAU); g.stroke();
  } else if (kind === 'jupiter') {
    const r = 240; g.save(); g.beginPath(); g.arc(C, C, r, 0, TAU); g.fillStyle = '#d8a468'; g.fill(); g.clip();
    const cols = ['#c58a52', '#e6c08e', '#b9764a', '#f0d6a8', '#c98f5a', '#e2b684', '#a9663f']; cols.forEach((c, i) => { g.fillStyle = c; g.fillRect(C - r, C - r + (i / cols.length) * 2 * r, 2 * r, (2 * r) / cols.length + 1); });
    g.fillStyle = '#b4472f'; g.beginPath(); g.ellipse(C + 84, C + 67, 48, 26, 0, 0, TAU); g.fill();
    const sh = g.createRadialGradient(C - 84, C - 84, 48, C, C, r * 1.05); sh.addColorStop(0, 'rgba(255,255,255,.12)'); sh.addColorStop(1, 'rgba(0,0,20,.55)'); g.fillStyle = sh; g.fillRect(0, 0, 512, 512); g.restore();
  } else if (kind === 'saturn') {
    const r = 105; g.save(); g.translate(C, C); g.rotate(-0.28);
    g.strokeStyle = 'rgba(230,200,150,.55)'; g.lineWidth = r * 0.22; g.beginPath(); g.ellipse(0, 0, r * 2.2, r * 0.56, 0, Math.PI, TAU); g.stroke();
    const gr = g.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); gr.addColorStop(0, '#f6e2b0'); gr.addColorStop(1, '#a8803f'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(240,215,165,.85)'; g.lineWidth = r * 0.22; g.beginPath(); g.ellipse(0, 0, r * 2.2, r * 0.56, 0, 0, Math.PI); g.stroke(); g.restore();
  } else if (kind === 'belt') {
    const r = rand(3); for (let i = 0; i < 14; i++) { const x = r() * 512, y = 80 + r() * 300, s = 8 + r() * 26; g.fillStyle = i % 2 ? '#8c857d' : '#6e6862'; g.beginPath(); g.ellipse(x, y, s * 1.3, s, r() * 3, 0, TAU); g.fill(); }
  } else if (kind === 'neptune') { // 트리톤 하늘의 해왕성(파란 줄무늬)
    const r = 220; g.save(); g.beginPath(); g.arc(C, C, r, 0, TAU); const gr = g.createRadialGradient(C - 70, C - 70, 20, C, C, r); gr.addColorStop(0, '#8fc4ff'); gr.addColorStop(0.6, '#3a6fe0'); gr.addColorStop(1, '#1a2f8a'); g.fillStyle = gr; g.fill(); g.clip();
    g.fillStyle = 'rgba(200,225,255,.22)'; for (const [y, h] of [[-90, 18], [-20, 10], [60, 24], [130, 12]]) g.fillRect(C - r, C + y, 2 * r, h);
    g.fillStyle = '#1e2f86'; g.beginPath(); g.ellipse(C - 60, C + 40, 40, 20, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(0,0,20,.4)'; g.beginPath(); g.arc(C + 90, C + 60, 230, 0, TAU); g.fill(); g.restore();
  } else if (kind === 'charon') { // 명왕성 하늘의 카론(회색, 붉은 북극)
    const r = 170; g.save(); g.beginPath(); g.arc(C, C, r, 0, TAU); const gr = g.createRadialGradient(C - 50, C - 50, 15, C, C, r); gr.addColorStop(0, '#d9d4cf'); gr.addColorStop(1, '#7c7670'); g.fillStyle = gr; g.fill(); g.clip();
    g.fillStyle = 'rgba(120,50,40,.75)'; g.beginPath(); g.ellipse(C, C - r * 0.85, r * 0.6, r * 0.32, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(0,0,0,.18)'; for (const [x, y, rr] of [[-40, 30, 22], [50, -10, 16], [10, 80, 12]]) { g.beginPath(); g.arc(C + x, C + y, rr, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(0,0,20,.4)'; g.beginPath(); g.arc(C + 70, C + 50, 180, 0, TAU); g.fill(); g.restore();
  } else if (kind === 'phobos') {
    for (const [x, y, s, c] of [[180, 260, 60, '#8d7d70'], [360, 170, 36, '#a59686']]) { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, s * 1.25, s, 0.4, 0, TAU); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(x + s * 0.3, y + s * 0.1, s * 0.25, 0, TAU); g.fill(); }
  }
}

window.RaceGL = { ok, create };
