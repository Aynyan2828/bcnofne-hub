/*! studio figure for bcnofne.com, built on Hairline (MIT, Lucas Marques). */
/**
 * Studio: AYN's broadcast booth. A rack beside the desk; on the desk a monitor, an HHKB-like keyboard, a four-fader mixer
 * (the four stations), a Mac mini, a speaker, a mouse, a cup, studio headphones on a stand and a broadcast mic on a boom.
 * Each answers the pointer: the rack unit nearest it slides out, its neighbours less, staggered outwards; the monitor's
 * wave swells and it turns to you; a keycap sinks; a fader slides up; the Mac mini lifts and runs; the speaker cone
 * trembles; the mouse nudges; the headphones float and swivel; the boom bends and turns the mic to you.
 * Choices ride the 700ms curve, motions that follow the pointer ride springs. Hit areas are the devices' rest outlines
 * on screen, front-most first, so nothing that moves can take the pointer from under itself. The slider is the rack's stagger.
 */
const { Cam, circ, clamp, facing, fit, hull, open, poly, prism, proj, rings, seg, spring, stepS, unproj,
  tdone, tset, tval, tween, disposer, mk, place, pointer, register, put, solid } = HL;

const DZ = 62, NU = 12, RK = [-42, -10, 2, 30], KB = [44, 108, 27, 51], R2 = Math.SQRT1_2, Z = [0, 0, 1];
const at = (ring, x, y) => ring.map((q) => ({ ...q, u: q.u + x, v: q.v + y }));
const tag = (p, part) => mk("g", { "data-part": part }, p);
const v3 = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const dir = (yaw, pitch) => [Math.cos(yaw) * Math.cos(pitch), Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch)];
/** p turned by angle about the unit axis k through c (Rodrigues). */
function turn(p, c, k, ang) {
  const v = [p[0] - c[0], p[1] - c[1], p[2] - c[2]], co = Math.cos(ang), si = Math.sin(ang), d = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
  const x = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]];
  return [0, 1, 2].map((i) => c[i] + v[i] * co + x[i] * si + k[i] * d * (1 - co));
}
/** Two unit vectors square to the unit axis a (a never vertical here). */
const basis = (a) => { const l = Math.hypot(a[0], a[1]), e1 = [-a[1] / l, a[0] / l, 0]; return [e1, [a[1] * e1[2] - a[2] * e1[1], a[2] * e1[0] - a[0] * e1[2], a[0] * e1[1] - a[1] * e1[0]]]; };
/** An ellipse round centre c in the plane of e1, e2, as world points. */
const ell = (c, e1, e2, a, b, n = 20) => Array.from({ length: n }, (_, k) => { const t = (2 * Math.PI * k) / n; return v3(v3(c, e1, a * Math.cos(t)), e2, b * Math.sin(t)); });
// HHKB rows in key units: Esc row, Tab…BS, Control (where Caps Lock sits)…Return, Shift…Shift Fn, a long space bar (negative = gap)
const ROWS = [Array(15).fill(1), [1.5, ...Array(12).fill(1), 1.5], [1.75, ...Array(11).fill(1), 2.25], [2.25, ...Array(10).fill(1), 1.75, 1], [-1.5, 1, 1.5, 6, 1.5, 1, -1.5]];

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let stag = value;
  const C = Cam(45, 0.5, 1.22);
  fit(C, [[-42, 2, 140], [-42, 30, 0], [174, 0, 0], [174, 88, 0], [0, 88, 0], [-10, 2, 0], [60, 4, 116]], 200, 160);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg), Q = (pts) => pts.map((p) => P(...p));
  const box = (s, x0, x1, y0, y1, z0, z1, r = 1.5, b = 0.8) => { const [o, i] = rings(x0, y0, x1, y1, r, b); put(s, prism(P, front, o, i, z0, z1)); };
  const cyl = (s, x, y, R, z0, z1) => put(s, prism(P, front, at(circ(R, 12), x, y), at(circ(R * 0.7, 12), x, y), z0, z1));
  const boxPts = (x0, x1, y0, y1, z0, z1) => [x0, x1].flatMap((x) => [y0, y1].flatMap((y) => [P(x, y, z0), P(x, y, z1)]));
  const set = (el, d) => el.setAttribute("d", d), path = (cls, p) => mk("path", { class: cls }, p), paths = (p, ...cls) => cls.map((c) => path(c, p));
  const dev = []; // { name, area: rest outline on screen, pick(p), on(part, now), off(now), track(p) }
  const add = (name, pts, d) => dev.push({ name, area: hull(pts), ...d });
  const inside = (q, [x, y]) => { let c = false; for (let i = 0, j = q.length - 1; i < q.length; j = i++) if ((q[i][1] > y) !== (q[j][1] > y) && x < ((q[j][0] - q[i][0]) * (y - q[i][1])) / (q[j][1] - q[i][1]) + q[i][0]) c = !c; return c; };
  const mover = [], springs = []; // tweens drawn from each frame; springs with their draw
  const hiOn = (el, on) => el.classList.toggle("hi", on);
  // rack server beside the desk: a cabinet, twelve units that slide out on +y, an LED and vents each
  const rk = tag(g, "rack");
  box(solid(rk), RK[0], RK[1], RK[2], RK[3], 0, 132, 2, 1.2);
  const units = Array.from({ length: NU }, (_, i) => ({ z0: 8 + i * 10, s: solid(rk), led: mk("circle", { r: 1.1, class: "dot off" }, rk), vent: path("nf lo", rk), d: tween(0), last: -1 }));
  units.forEach((u) => mover.push(() => {
    const d = tval(u.d, performance.now()), y = RK[3] + 1 + d;
    if (Math.abs(d - u.last) > 0.02) { u.last = d; box(u.s, RK[0] + 2, RK[1] - 2, RK[2] + 2, y, u.z0, u.z0 + 8.6, 1, 0.6); place(u.led, P(RK[0] + 6, y, u.z0 + 4.3)); set(u.vent, [0, 1, 2, 3, 4].map((k) => seg(P(RK[0] + 12 + k * 3.2, y, u.z0 + 2.5), P(RK[0] + 12 + k * 3.2, y, u.z0 + 6))).join("")); }
    return u.d;
  }));
  const rest = units.map((u) => [P(RK[0] + 2, RK[3] + 1, u.z0 + 4.3), P(RK[1] - 2, RK[3] + 1, u.z0 + 4.3)]);
  add("rack", boxPts(RK[0], RK[1], RK[2], RK[3] + 2, 0, 132), {
    pick: ([x, y]) => { let b = 0, bd = Infinity; rest.forEach(([a, c], i) => { const t = clamp((x - a[0]) / (c[0] - a[0]), 0, 1), d = Math.abs(y - (a[1] + t * (c[1] - a[1]))); if (d < bd) { bd = d; b = i; } }); return b; },
    on: (a, now) => units.forEach((u, i) => { const k = Math.abs(i - a); tset(u.d, [14, 6, 2][k] || 0, now, k * stag); hiOn(u.s.sil, k === 0); u.led.setAttribute("class", k === 0 ? "dot" : "dot off"); }),
    off: (now) => units.forEach((u, i) => { tset(u.d, 0, now, Math.abs(i - 5) * stag); hiOn(u.s.sil, false); u.led.setAttribute("class", "dot off"); }),
  });
  // desk: legs, then the top
  const dk = tag(g, "desk"); box(solid(dk), 0, 172, 0, 86, DZ - 4, DZ, 7, 1.6);
  for (const [x, y] of [[6, 6], [166, 6], [6, 80], [166, 80]]) cyl(solid(dk), x, y, 2.4, 0, DZ - 4);
  // broadcast mic on a boom: a clamp at the desk's back-left corner, two long sprung arms with their joints, a U yoke with a knob
  // each side, a body three times as long as wide (front a little fatter: grille band and face; rear cap with its XLR cable), and a
  // round pop filter on a gooseneck, off to one side of the grille. On a spring the elbow bends a little and the mic turns to you.
  const mc = tag(g, "mic"), mS = spring(0), P0 = [6, 2, DZ + 5];
  box(solid(mc), 2, 10, -2, 6, DZ - 8, DZ + 5, 1, 0.5);
  const [mCable, mArm, mJoint, mYoke, mBody, mBand, mFront, mCap, mGoose, mPop, mMesh] = paths(mc, "nf lo", "nf", "nf", "nf", "sil", "nf lo", "nf", "nf", "nf lo", "nf", "nf lo");
  const rail = (a, b, d) => { const n = [-d[1], d[0], 0], sp = Array.from({ length: 17 }, (_, k) => P(...v3(v3(v3(a, v3(b, a, -1), 0.1 + (0.8 * k) / 16), n, 2.4), Z, k % 2 ? 0.9 : -0.9))); return [1.1, -1.1].map((o) => seg(P(...v3(a, n, o)), P(...v3(b, n, o)))).join("") + open(sp); };
  let micRest = []; const micDraw = (s) => {
    const yaw = 0.35 - 0.05 * s, d1 = dir(yaw, 1.0 - 0.08 * s), J = v3(P0, d1, 30), d2 = dir(yaw + 0.2 * s, 0.1 - 0.2 * s), T = v3(J, d2, 32 - 4 * s);
    const a = dir(1.15 - 0.35 * s, -0.1 + 0.35 * s), [b1, b2] = basis(a), M = v3(T, Z, -8), R = 3.7, end = (t, r) => ell(v3(M, a, t), b1, b2, r, r, 18);
    set(mArm, rail(P0, J, d1) + rail(J, T, d2)); set(mJoint, [P0, J, T].map((c) => poly(Q(ell(c, basis(d2)[0], Z, 2, 2, 12)))).join(""));
    const yk = [-1, 1].map((sg) => v3(M, b1, sg * (R + 1.6)));
    set(mYoke, open(Q([yk[0], v3(yk[0], Z, 6.5), v3(T, b1, -(R + 1.6)), T, v3(T, b1, R + 1.6), v3(yk[1], Z, 6.5), yk[1]])) + yk.map((c) => poly(Q(ell(c, a, Z, 1.6, 1.6, 10)))).join(""));
    set(mBody, poly(hull(Q([...end(-11, R - 0.2), ...end(11, R + 0.6)]))));
    set(mBand, [5, 7.5, 9.5].map((t) => poly(Q(end(t, R + 0.2 + t * 0.03)))).join(""));
    set(mFront, poly(Q(end(11, R + 0.6))) + [2.4, 1.2].map((r) => poly(Q(end(11, r)))).join("") + [b1, b2].map((b) => seg(P(...v3(v3(M, a, 11), b, -3.3)), P(...v3(v3(M, a, 11), b, 3.3)))).join(""));
    set(mCap, poly(Q(end(-11, R - 0.2)))); const back = v3(M, a, -11); set(mCable, open(Q([back, v3(back, a, -4), v3(v3(J, d1, -6), Z, -2), v3(P0, Z, -2)])));
    const F = v3(v3(M, a, 16), b1, 6.5);
    set(mGoose, open(Q([v3(J, d2, 12), v3(v3(J, d2, 12), Z, -6), v3(F, b2, 6)])));
    set(mPop, poly(Q(ell(F, b1, b2, 6, 6, 22))) + poly(Q(ell(F, b1, b2, 5.2, 5.2, 22))));
    set(mMesh, [-3, 0, 3].map((o) => seg(P(...v3(v3(F, b2, o), b1, -4.5)), P(...v3(v3(F, b2, o), b1, 4.5)))).join(""));
    if (!s) micRest = Q([P0, v3(P0, Z, -13), J, T, ...end(-11, R), ...end(11, R + 0.6), ...ell(F, b1, b2, 6, 6, 12)]);
  };
  springs.push({ s: mS, last: -1, draw: micDraw }); micDraw(0);
  add("mic", micRest, { on: () => { mS.t = 1; hiOn(mBody, true); }, off: () => { mS.t = 0; hiOn(mBody, false); } });
  // studio headphones on a stand: oval cups with cushions on yokes, a slider above each cup, a padded band arched over the
  // stand's top, a cable. On a spring they float off the stand and tip, and the cups swivel on their yokes.
  const hp = tag(g, "headphones"), H = [24, 58, DZ], D = [R2, -R2, 0], N = [R2, R2, 0], top = v3(H, Z, 36), hS = spring(0);
  cyl(solid(hp), 24, 58, 7, DZ, DZ + 1.5); cyl(solid(hp), 24, 58, 1.3, DZ + 1.5, DZ + 34); cyl(solid(hp), 24, 58, 2.6, DZ + 34, DZ + 36);
  const [hCable, cupA, capA, cushA, cupB, capB, cushB, hYoke, hBand] = paths(hp, "nf lo", "sil", "nf", "nf lo", "sil", "nf", "nf lo", "nf", "sil");
  springs.push({ s: hS, last: -1, draw: (s) => {
    const T = (p) => v3(turn(p, top, N, 0.22 * s), Z, 10 * s), Tp = (p) => P(...T(p));
    let yoke = ""; for (const [sg, cup, cap, cush] of [[-1, cupA, capA, cushA], [1, cupB, capB, cushB]]) {
      const cc = v3(v3(H, D, 15 * sg), Z, 16), sw = turn(N, [0, 0, 0], Z, (0.4 + 0.45 * s) * sg), sd = turn(D, [0, 0, 0], Z, (0.4 + 0.45 * s) * sg);
      const shell = ell(v3(cc, sd, 2.5 * sg), sw, Z, 5.5, 7.2).map(T), pad = ell(v3(cc, sd, -2.5 * sg), sw, Z, 5.8, 7.5).map(T);
      set(cup, poly(hull(Q([...shell, ...pad])))); set(cap, poly(Q(shell))); set(cush, poly(Q(ell(v3(cc, sd, -2.5 * sg), sw, Z, 3.6, 5, 16).map(T))));
      yoke += open(Q([-1, -0.5, 0, 0.5, 1].map((t) => T(v3(v3(cc, sw, 6.6 * t), Z, 7.2 + 2.6 * Math.cos((t * Math.PI) / 2))))));
      yoke += [0.9, -0.9].map((o) => seg(Tp(v3(v3(cc, Z, 9.8), sw, o)), Tp(v3(v3(v3(H, D, 13 * sg), Z, 30), sw, o)))).join("");
    }
    set(hYoke, yoke);
    const arc = (r, lift) => Array.from({ length: 15 }, (_, k) => { const t = Math.PI * (k / 14); return T(v3(v3(H, D, -r * Math.cos(t)), Z, 30 + lift * Math.sin(t))); });
    set(hBand, poly(Q([...arc(13, 8.5), ...arc(12, 6).reverse()])));
    set(hCable, open([Tp(v3(v3(H, D, -15), Z, 9)), P(...v3(v3(H, D, -17), Z, 1 + 4 * s)), P(...v3(v3(H, D, -10), N, 9)), P(...v3(v3(H, D, 4), N, 12))]));
  } });
  add("headphones", boxPts(5, 43, 39, 77, DZ, DZ + 46), { on: () => { hS.t = 1; hiOn(hBand, true); }, off: () => { hS.t = 0; hiOn(hBand, false); } });
  // monitor on its stand: the panel turns toward the pointer on a spring; its screen holds a flowing wave, three bars and a level meter
  const mn = tag(g, "monitor"), NK = [89, 11, 0], yw = spring(0), roll = tween(0);
  box(solid(mn), 78, 100, 6, 20, DZ, DZ + 1.5, 2, 0.8); box(solid(mn), 87, 91, 7, 10, DZ + 1.5, DZ + 18, 1, 0.5);
  const [panel, face, wave, bars, lit, unlit] = paths(mn, "sil", "nf", "nf", "nf lo", "nf", "nf lo");
  const S = (u, t, z, y) => P(...turn([89 + u, 11 + t, z], NK, Z, y)), quad = (u0, u1, z0, z1, y) => poly([[u0, z0], [u1, z0], [u1, z1], [u0, z1]].map(([u, z]) => S(u, 2, z, y)));
  const mon = { s: yw, last: -1, draw: (y) => { const r = tval(roll, performance.now());
    set(panel, poly(hull([-33, 33].flatMap((u) => [-2, 2].flatMap((t) => [S(u, t, DZ + 14, y), S(u, t, DZ + 56, y)])))));
    set(face, quad(-29, 29, DZ + 18, DZ + 52, y));
    set(wave, [[DZ + 40, 4 + 7 * r, 0.42], [DZ + 31, 2.5 + 4 * r, 0.75]].map(([zc, A, f]) => open(Array.from({ length: 22 }, (_, k) => S(-20 + k * 2, 2, zc + A * Math.sin(k * f + r * 5) * Math.sin((k + 2) * 0.25), y)))).join(""));
    set(bars, [0, 1, 2].map((i) => quad(22 + i * 2.2, 23.6 + i * 2.2, DZ + 20, DZ + 23 + (5 + 4 * i) * r, y)).join(""));
    const seg8 = (k) => quad(-27, -24.5, DZ + 20 + k * 3.8, DZ + 22.6 + k * 3.8, y), K = [0, 1, 2, 3, 4, 5, 6, 7];
    set(lit, K.filter((k) => k < 2 + 5 * r).map(seg8).join("")); set(unlit, K.filter((k) => k >= 2 + 5 * r).map(seg8).join(""));
  } };
  springs.push(mon); mover.push(() => { mon.last = -1; return roll; });
  add("monitor", boxPts(56, 122, 9, 13, DZ + 14, DZ + 56), {
    on: (_a, now) => { tset(roll, 1, now, 0); hiOn(panel, true); }, off: (now) => { tset(roll, 0, now, 0); yw.t = 0; hiOn(panel, false); },
    track: ([x]) => { yw.t = clamp((x - P(89, 11, DZ + 35)[0]) / 70, -1, 1) * 0.32; },
  });
  // keyboard, HHKB-like: a thin case tilted toward the user, each keycap a square frustum (a foot ring, a smaller top, the top a
  // crease). Sides are dim, tops medium. The key under the pointer sinks: its sides shrink and its top goes bright.
  const kb = tag(g, "keyboard"), KU = (KB[1] - KB[0] - 3) / 15, KD = (KB[3] - KB[2] - 3) / 5, zb = (y) => DZ + 2.2 + (1.6 * (KB[3] - y)) / (KB[3] - KB[2]);
  const caseTop = rings(KB[0], KB[2], KB[1], KB[3], 2.5, 1)[0], caseFoot = rings(KB[0] - 0.5, KB[2] - 0.5, KB[1] + 0.5, KB[3] + 0.5, 3, 1)[0];
  mk("path", { d: poly(hull([...caseFoot.map((q) => P(q.u, q.v, DZ)), ...caseTop.map((q) => P(q.u, q.v, zb(q.v)))])), class: "sil" }, kb);
  const caps = []; ROWS.forEach((row, r) => { let c = 0; row.forEach((w) => { if (w > 0) caps.push([KB[0] + 1.5 + c * KU, KB[0] + 1.5 + (c + w) * KU, KB[2] + 1.5 + r * KD, KB[2] + 1.5 + (r + 1) * KD]); c += Math.abs(w); }); });
  const cap = ([x0, x1, y0, y1], h) => { const f = rings(x0 + 0.25, y0 + 0.25, x1 - 0.25, y1 - 0.25, 0.6, 0.2)[0], t = rings(x0 + 0.85, y0 + 0.8, x1 - 0.85, y1 - 1.1, 0.5, 0.2)[0], tp = t.map((q) => P(q.u, q.v, zb(q.v) + h));
    return [poly(hull([...f.map((q) => P(q.u, q.v, zb(q.v))), ...tp])), poly(tp)]; };
  const [kSide, kTop, pSide, pTop] = paths(kb, "lo", "nf", "lo", "nf");
  const drawKeys = (k) => { const all = caps.map((c, i) => (i === k ? ["", ""] : cap(c, 2.4))); set(kSide, all.map((a) => a[0]).join("")); set(kTop, all.map((a) => a[1]).join("")); const p = k >= 0 ? cap(caps[k], 0.7) : ["", ""]; set(pSide, p[0]); set(pTop, p[1]); };
  drawKeys(-1);
  add("keyboard", boxPts(KB[0], KB[1], KB[2], KB[3], DZ, DZ + 6), {
    pick: ([x, y]) => { const [u, v] = unproj(C, x, y, DZ + 5); const i = caps.findIndex(([x0, x1, y0, y1]) => u >= x0 && u < x1 && v >= y0 && v < y1); return i < 0 ? caps.length - 1 : i; },
    on: (a) => { drawKeys(a); hiOn(pTop, true); }, off: () => { drawKeys(-1); hiOn(pTop, false); },
  });
  // mixer: four channel faders, the four stations; the fader under the pointer slides up its slot
  const mx = tag(g, "mixer"), ST = ["sleep", "work", "radio", "ai radio"], fx = (i) => 64 + i * 11, FR = [72, 66, 74, 69];
  box(solid(mx), 56, 106, 54, 82, DZ, DZ + 3, 3, 1);
  mk("path", { d: [0, 1, 2, 3].map((i) => seg(P(fx(i), 58, DZ + 3), P(fx(i), 78, DZ + 3))).join(""), class: "nf lo" }, mx);
  const faders = ST.map((_n, i) => ({ s: solid(mx), y: tween(FR[i]), last: -1 }));
  faders.forEach((f, i) => mover.push(() => { const y = tval(f.y, performance.now()); if (Math.abs(y - f.last) > 0.02) { f.last = y; box(f.s, fx(i) - 2.6, fx(i) + 2.6, y - 2, y + 2, DZ + 3, DZ + 6.5, 1, 0.5); } return f.y; }));
  add("fader", boxPts(56, 106, 54, 82, DZ, DZ + 7), {
    pick: ([x, y]) => clamp(Math.round((unproj(C, x, y, DZ + 5)[0] - fx(0)) / 11), 0, 3),
    on: (a, now) => { faders.forEach((f, i) => { tset(f.y, i === a ? 59 : FR[i], now, 0); hiOn(f.s.sil, i === a); }); read.textContent = "fader · " + ST[a]; },
    off: (now) => faders.forEach((f, i) => { tset(f.y, FR[i], now, 0); hiOn(f.s.sil, false); }),
  });
  // Mac mini: it lifts and slides forward, its light comes on, the vents on its top run, its rear cable sways, a ring glows on top
  const mm = tag(g, "macmini"), mmS = solid(mm), [mCab, mVent, mGlow] = paths(mm, "nf lo", "nf lo", "nf"), mUp = tween(0), light = mk("circle", { r: 1.2, class: "dot off" }, mm);
  mover.push(() => {
    const o = tval(mUp, performance.now()), z = DZ + 4 * o, y = 3 * o;
    box(mmS, 124, 148, 8 + y, 32 + y, z, z + 6, 3, 1); place(light, P(140, 32 + y, z + 3));
    set(mCab, open([P(136, 8 + y, z + 2), P(136 + 3 * Math.sin(o * 6), 3, DZ + 1), P(130, 1, DZ)]));
    set(mVent, [0, 1, 2, 3, 4].map((k) => { const x = 128 + ((k * 4 + o * 9) % 18); return seg(P(x, 11 + y, z + 6), P(x + 1.5 + 2 * o, 11 + y, z + 6)); }).join(""));
    set(mGlow, o > 0.02 ? poly(rings(128, 12 + y, 144, 28 + y, 5, 1)[0].map((q) => P(q.u, q.v, z + 6))) : "");
    return mUp;
  });
  add("mac mini", boxPts(124, 148, 8, 32, DZ, DZ + 6), { on: (_a, now) => { tset(mUp, 1, now, 0); light.setAttribute("class", "dot"); hiOn(mGlow, true); }, off: (now) => { tset(mUp, 0, now, 0); light.setAttribute("class", "dot off"); hiOn(mGlow, false); } });
  // speaker: a cabinet, its cone on the front, which trembles on a spring
  const sp = tag(g, "speaker"), spS = solid(sp), cone = path("nf", sp), kick = spring(0);
  box(spS, 152, 170, 4, 22, DZ, DZ + 24, 2, 0.8);
  mk("path", { d: poly(circ(6.5, 20).map((q) => P(161 + q.u, 22, DZ + 10 + q.v))), class: "nf lo" }, sp);
  springs.push({ s: kick, last: -1, draw: (k) => set(cone, poly(circ(3.2 + k, 16).map((q) => P(161 + q.u, 22 + k, DZ + 10 + q.v)))) });
  add("speaker", boxPts(152, 170, 4, 22, DZ, DZ + 24), { on: () => { kick.x = 2.2; kick.t = 0; hiOn(spS.sil, true); }, off: () => hiOn(spS.sil, false) });
  // mouse on its pad: the pad lies flat, the mouse nudges forward; a cup at the near corner
  const ms = tag(g, "mouse"), nudge = tween(0); box(solid(ms), 116, 156, 42, 70, DZ, DZ + 0.6, 3, 1); const mouse = solid(ms);
  mover.push(() => { const n = tval(nudge, performance.now()); box(mouse, 132 + n, 142 + n, 50 + n, 62 + n, DZ + 0.6, DZ + 4.5, 4.8, 1.4); return nudge; });
  add("mouse", boxPts(116, 156, 42, 70, DZ, DZ + 5), { on: (_a, now) => { tset(nudge, 4, now, 0); hiOn(mouse.sil, true); }, off: (now) => { tset(nudge, 0, now, 0); hiOn(mouse.sil, false); } });
  const cup = solid(tag(g, "cup")); cyl(cup, 160, 76, 4.5, DZ, DZ + 10);
  add("cup", boxPts(155, 165, 71, 81, DZ, DZ + 10), { on: () => hiOn(cup.sil, true), off: () => hiOn(cup.sil, false) });
  const B = register(stage, (dt, now) => { let m = false; for (const f of mover) if (!tdone(f(), now)) m = true;
    for (const q of springs) { if (stepS(q.s, dt)) m = true; if (Math.abs(q.s.x - q.last) > 0.002) { q.last = q.s.x; q.draw(q.s.x); } } return m; });
  bag.add(B.unregister);
  /** The device whose rest outline holds the point, front-most (painted last) first. */
  const hit = (p) => { for (let i = dev.length - 1; i >= 0; i--) if (inside(dev[i].area, p)) return [i, dev[i].pick ? dev[i].pick(p) : 0]; return [-1, 0]; };
  const MARK = 3; // at rest the monitor's edge is bright (the fourth device added): where the eye starts
  let act = -2, sub = -1;
  function setActive([a, s], p) {
    if (a >= 0 && dev[a].track) { dev[a].track(p); B.wake(); }
    if (a === act && s === sub) return;
    const now = performance.now(); if (act >= 0 && act !== a) dev[act].off(now);
    if (act < 0 && a !== MARK) hiOn(panel, false);
    act = a; sub = s; if (a >= 0) dev[a].on(s, now); else hiOn(panel, true);
    if (a < 0 || dev[a].name !== "fader") read.textContent = a < 0 ? "rest" : dev[a].name;
    B.wake();
  }
  setActive([-1, 0]);
  bag.add(pointer(stage, { move: (p) => setActive(hit(p), p), leave: () => setActive([-1, 0]) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { stag = v; }, destroy: bag.dispose };
}

hairline({
  name: "studio", means: "AYN's broadcast booth: four faders are the four stations, and every device on the desk answers the pointer.",
  rules: [1, 2, 6, 8], range: [0, 45, 90], tour: [[120, 90], [230, 130], [180, 180], null], mount,
});
