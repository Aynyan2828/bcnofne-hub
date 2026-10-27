/*! radio figure for bcnofne.com, built on Hairline (MIT, Lucas Marques). */
/**
 * Radio: a tabletop radio with four preset keys on its top, a round speaker
 * grille and a dial window on its front, and an aerial at the back. The key
 * under the pointer goes down, the others come up staggered outwards from it,
 * and the dial's needle swings to that preset on the 700ms curve. The four
 * presets are the four stations: sleep, work, radio, ai radio. The slider is
 * the stagger, in ms.
 *
 * The pattern: discrete items in one row, picked on the plane of the radio's
 * top, which never moves, by the key whose x is nearest.
 */
const {
  Cam, circ, clamp, facing, fit, open, poly, prism, proj, rad, ringAt, rings, rrect, run, seg, unproj,
  tdone, tset, tval, tween, disposer, mk, place, pointer, register, put, solid,
} = HL;

const NAMES = ["sleep", "work", "radio", "ai radio"];
const N = 4, X0 = 0, X1 = 132, Y0 = 0, Y1 = 46, BH = 58, KY0 = 14, KY1 = 32;
const UP = 7, DOWN = 1.5, REST = [DOWN, 5, 7, 4];
const kx = (i) => 30 + i * 26;
const nx = (i) => 72 + i * 15;
const tag = (parent, part) => mk("g", { "data-part": part }, parent);

/** A shape drawn flat on the front face (y = Y1): u along x, v along z. */
const onFront = (P, pts) => pts.map((q) => P(q.u, Y1, q.v));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;

  const C = Cam(45, 0.5, 1.9);
  fit(C, [[X0, Y0, 0], [X1, Y1, 0], [X0, Y1, 0], [X1, Y0, 0], [0, 5, BH + 26], [X1, Y0, BH + UP], [X0, Y1, BH]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // aerial at the far corner, painted first: a short rod leaning back from its swivel, and a tip
  const ae = tag(g, "aerial"), a0 = P(10, 8, BH), a1 = P(0, 5, BH + 24);
  put(solid(ae), prism(P, front, rings(6, 4, 14, 12, 4, 1)[0], rings(6, 4, 14, 12, 4, 1)[1], BH - 1, BH + 3));
  mk("path", { d: seg(P(10, 8, BH + 3), a1), class: "nf" }, ae);
  const tip = mk("circle", { r: 1.6, class: "dot off" }, ae);
  place(tip, a1);

  // the body: a rounded box, its top crease, a seam round its foot
  const body = tag(g, "body");
  const [ring, inner] = rings(X0, Y0, X1, Y1, 7, 1.6);
  put(solid(body), prism(P, front, ring, inner, 0, BH));
  const [seam] = rings(X0 + 0.01, Y0 + 0.01, X1 - 0.01, Y1 - 0.01, 7, 1);
  mk("path", { d: open(ringAt(P, run(seam, front), 6)), class: "nf lo" }, body);

  // the speaker: a round grille of three rings on the front
  const sp = tag(g, "speaker");
  for (const [r, cls] of [[19, "nf"], [14, "nf lo"], [9, "nf lo"], [4, "nf lo"]]) {
    mk("path", { d: poly(onFront(P, circ(r, 24).map((q) => ({ u: q.u + 34, v: q.v + 29 })))), class: cls }, sp);
  }

  // the dial: a window, a tick under each preset, and the needle
  const dl = tag(g, "dial");
  mk("path", { d: poly(onFront(P, rrect(62, 30, 122, 46, 3, 4))), class: "nf" }, dl);
  let ticks = "";
  for (let i = 0; i < N; i++) ticks += seg(P(nx(i), Y1, 24), P(nx(i), Y1, 27));
  mk("path", { d: ticks, class: "nf lo" }, dl);
  const needle = mk("path", { class: "nf" }, dl);

  // the keys, back to front along x
  const keys = [];
  for (let i = 0; i < N; i++) {
    const [r, inn] = rings(kx(i) - 10, KY0, kx(i) + 10, KY1, 3, 1);
    keys.push({ s: solid(tag(g, "key")), r, inn, h: tween(REST[i]), last: -1 });
  }
  const pin = tween(nx(0));
  let lastN = -1;

  function draw(now) {
    keys.forEach((k) => {
      const h = tval(k.h, now);
      if (Math.abs(h - k.last) < 0.01) return;
      k.last = h;
      put(k.s, prism(P, front, k.r, k.inn, BH - 0.5, BH + h));
    });
    const x = tval(pin, now);
    if (Math.abs(x - lastN) > 0.01) { lastN = x; needle.setAttribute("d", seg(P(x, Y1, 32), P(x, Y1, 44))); }
  }

  const B = register(stage, (_dt, now) => {
    draw(now);
    return keys.some((k) => !tdone(k.h, now)) || !tdone(pin, now);
  });
  bag.add(B.unregister);

  // hit: the point under the pointer on the plane of the radio's top; the key whose x is nearest
  function hit([sx, sy]) {
    const [x, y] = unproj(C, sx, sy, BH);
    if (x < X0 - 6 || x > X1 + 6 || y < Y0 - 16 || y > Y1 + 70) return -1;
    return clamp(Math.round((x - kx(0)) / 26), 0, N - 1);
  }

  // at rest the sleep key is down and lit, the needle on its preset
  let act = -2;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act >= 0 ? act : 0;
    act = a;
    keys.forEach((k, i) => {
      tset(k.h, a < 0 ? REST[i] : i === a ? DOWN : UP, now, Math.abs(i - from) * stag);
      k.s.sil.classList.toggle("hi", i === (a < 0 ? 0 : a));
    });
    tset(pin, nx(a < 0 ? 0 : a), now, 0);
    read.textContent = a < 0 ? "rest" : NAMES[a];
    B.wake();
  }
  setActive(-1);

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { stag = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "radio",
  means: "A tabletop radio with four preset keys: the one under the pointer goes down and the dial's needle swings to its station.",
  rules: [1, 2, 8, 10],
  range: [0, 45, 90],
  tour: [[150, 120], [215, 150], [250, 170], null],
  mount,
});
