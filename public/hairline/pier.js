/*! pier figure for bcnofne.com, built on Hairline (MIT, Lucas Marques). */
/**
 * Pier: a plank deck on piles, a bollard at its end, and three crates of
 * different sizes waiting on it, each with its count of dots on the lid. The
 * crate under the pointer is hooked and lifted, the others slide away from it,
 * staggered outwards on the 700ms curve. The crates are the three apps:
 * fuyou, shiftwake, subscope. The slider is the stagger, in ms.
 *
 * The pattern: discrete items in one row, picked on a fixed plane at the
 * crates' resting tops by the crate whose x is nearest.
 */
const {
  Cam, circ, clamp, facing, fit, open, prism, proj, ringAt, rings, run, seg, unproj,
  tdone, tset, tval, tween, disposer, mk, place, pointer, register, put, solid,
} = HL;

const NAMES = ["fuyou", "shiftwake", "subscope"];
// crate footprints [x0, x1, y0, y1, height]: big, medium, small
const CR = [[14, 50, 10, 40, 26], [64, 96, 11, 39, 22], [110, 138, 13, 37, 18]];
const X0 = 0, X1 = 172, Y0 = 0, Y1 = 50, DZ0 = 14, DZ1 = 20, LIFT = 24, GAP = 9, TOP = DZ1 + 82;
const N = 3, PLANE = DZ1 + 22;
const cx = (i) => (CR[i][0] + CR[i][1]) / 2;
const tag = (parent, part) => mk("g", { "data-part": part }, parent);
/** A ring moved to (x, y). */
const at = (ring, x, y) => ring.map((q) => ({ ...q, u: q.u + x, v: q.v + y }));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;

  const C = Cam(45, 0.5, 1.62);
  fit(C, [[X0, Y0, 0], [X1, Y1, 0], [X0, Y1, 0], [X1, Y0, DZ1], [cx(0), 25, TOP], [cx(2), 25, TOP], [X1, Y1, DZ1 + 9]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // piles, far to near
  const piles = tag(g, "pile"), pc = circ(3.6, 12), pi = circ(2.4, 12), spots = [];
  for (const x of [8, 62, 116, 164]) for (const y of [7, 43]) spots.push([x, y]);
  spots.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  for (const [x, y] of spots) put(solid(piles), prism(P, front, at(pc, x, y), at(pi, x, y), 0, DZ0 + 0.5));

  // the deck: one plate, its planks across it
  const deck = tag(g, "deck"), [dr, di] = rings(X0, Y0, X1, Y1, 3, 1.2);
  put(solid(deck), prism(P, front, dr, di, DZ0, DZ1));
  let planks = "";
  for (let x = 12; x < X1 - 4; x += 12) planks += seg(P(x, Y0 + 1.2, DZ1), P(x, Y1 - 1.2, DZ1));
  mk("path", { d: planks, class: "nf lo" }, deck);

  // the crates, back to front along x: body, the hook's cable, the dots on the lid
  const crates = CR.map(([x0, x1, y0, y1, h], i) => {
    const grp = tag(g, "crate-" + NAMES[i]);
    const s = solid(grp), cable = mk("path", { class: "nf" }, grp);
    const dots = [];
    for (let k = 0; k <= i; k++) dots.push(mk("circle", { r: 1.2, class: "dot off" }, grp));
    const [r, inn] = rings(x0, y0, x1, y1, 3, 1.4);
    const corners = [[x0 + 3, y0 + 3], [x1 - 3, y0 + 3], [x1 - 3, y1 - 3], [x0 + 3, y1 - 3]];
    return { s, cable, dots, r, inn, h, x0, y0, corners, z: tween(0), dx: tween(0), last: "" };
  });

  // the bollard at the near end
  const bo = tag(g, "bollard");
  put(solid(bo), prism(P, front, at(circ(3.4, 14), 165, 43), at(circ(2.4, 14), 165, 43), DZ1, DZ1 + 6));
  put(solid(bo), prism(P, front, at(circ(4.8, 14), 165, 43), at(circ(3.6, 14), 165, 43), DZ1 + 6, DZ1 + 8.5));

  function draw(c, z, dx) {
    const key = z.toFixed(2) + "," + dx.toFixed(2);
    if (key === c.last) return;
    c.last = key;
    const r = at(c.r, dx, 0), inn = at(c.inn, dx, 0), top = DZ1 + c.h + z;
    put(c.s, prism(P, front, r, inn, DZ1 + z, top));
    const mx = (c.r.reduce((s, q) => s + q.u, 0) / c.r.length) + dx, my = c.r.reduce((s, q) => s + q.v, 0) / c.r.length;
    // a four-leg sling from the lid's corners to the hook, then the wire up
    const hk = P(mx, my, top + 30);
    const cs = c.corners.map(([u, v]) => seg(P(u + dx, v, top), hk)).join("");
    c.cable.setAttribute("d", z > 0.5 ? cs + seg(hk, P(mx, my, TOP)) : "");
    c.dots.forEach((d, k) => place(d, P(c.x0 + dx + 5 + k * 4, c.y0 + 5, top)));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    crates.forEach((c) => { draw(c, tval(c.z, now), tval(c.dx, now)); if (!tdone(c.z, now) || !tdone(c.dx, now)) moving = true; });
    return moving;
  });
  bag.add(B.unregister);

  // hit: the point under the pointer on a fixed plane at the crates' resting tops; the crate whose x is nearest
  function hit([sx, sy]) {
    const [x, y] = unproj(C, sx, sy, PLANE);
    if (x < X0 - 4 || x > CR[2][1] + 14 || y < Y0 - 30 || y > Y1 + 30) return -1;
    let best = 0;
    for (let i = 1; i < N; i++) if (Math.abs(x - cx(i)) < Math.abs(x - cx(best))) best = i;
    return best;
  }

  // at rest the biggest crate's edge is lit: where the eye starts
  let act = -2;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act >= 0 ? act : 0;
    act = a;
    crates.forEach((c, i) => {
      const d = Math.abs(i - from) * stag;
      tset(c.z, i === a ? LIFT : 0, now, d);
      tset(c.dx, a < 0 || i === a ? 0 : clamp(Math.sign(i - a) * GAP / Math.abs(i - a), -GAP, GAP), now, d);
      c.s.sil.classList.toggle("hi", i === (a < 0 ? 0 : a));
      c.dots.forEach((el) => el.setAttribute("class", i === a ? "dot m" : "dot off"));
    });
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
  name: "pier",
  means: "Three crates on a pier: the one under the pointer is hooked and lifted, and the others slide away from it in turn.",
  rules: [1, 2, 5, 10],
  range: [0, 50, 100],
  tour: [[140, 150], [200, 180], [245, 200], null],
  mount,
});
