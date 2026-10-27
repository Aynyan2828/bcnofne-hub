/*! engine figure for bcnofne.com, built on Hairline (MIT, Lucas Marques). */
/**
 * Engine: a marine inline six on its bedplate. A turbocharger at the fore end,
 * six head covers in a row with the exhaust manifold beside them, a ribbed
 * block, and the flywheel at the aft end. The crank idles round, and each head
 * cover lifts in its firing stroke, so the lift walks the firing order
 * 1-5-3-6-2-4. The cover under the pointer is brought to its own firing: the
 * crank turns there on the 700ms curve. The slider is the idle speed, in °/s.
 *
 * The pattern: discrete items in one row, picked by the ground point under the
 * pointer, which never moves; the crank angle is the one number drawn from.
 */
const {
  Cam, circ, clamp, facing, fit, hull, open, poly, prism, proj, rad, reducedMotion, ringAt, rings,
  run, seg, unproj, tdone, tset, tval, tween, disposer, mk, place, pointer, register, put, solid,
} = HL;

// the firing order; 1-4-2-6-3-5 is the other common one
const ORDER = [1, 5, 3, 6, 2, 4];
const N = 6, PITCH = 24, HX = 22, CY = 17, BED = 7, BH = 40, HH = 11, LIFT = 9, REST = 20;
const X0 = 8, X1 = 160, Y0 = 0, Y1 = 34, FW = 24, FZ = 27, FX = 166;
const hx = (i) => HX + i * PITCH;
const phase = (i) => 120 * ORDER.indexOf(i + 1);
const tag = (parent, part) => mk("g", { "data-part": part }, parent);

/** Degrees from cylinder i's firing TDC, folded into -360..360. */
function off(i, th) { const d = (((th - phase(i)) % 720) + 720) % 720; return d > 360 ? d - 720 : d; }
/** How far cover i is lifted: a cosine bump over its firing stroke, 0 elsewhere. */
const bump = (i, th) => { const d = off(i, th); return Math.abs(d) < 90 ? Math.cos(rad(d)) : 0; };

/** A disc standing across x (u along y, v along z), from xa to xb. */
const discX = (P, R, y, z, xa, xb, n = 28) => {
  const c = circ(R, n);
  return { a: c.map((q) => P(xa, y + q.u, z + q.v)), b: c.map((q) => P(xb, y + q.u, z + q.v)) };
};
/** A disc standing across y (u along x, v along z), from ya to yb. */
const discY = (P, R, x, z, ya, yb, n = 24) => {
  const c = circ(R, n);
  return { a: c.map((q) => P(x + q.u, ya, z + q.v)), b: c.map((q) => P(x + q.u, yb, z + q.v)) };
};

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let rate = value;

  const C = Cam(45, 0.5, 1.8);
  fit(C, [[-14, Y1 + 14, BH + 18], [X0 - 6, Y0 - 6, 0], [FX + 6, Y1 + 6, 0], [FX + 6, CY, FZ + FW], [hx(0), CY, BH + HH + LIFT], [X1, Y0 - 6, 0]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // bedplate
  const bed = rings(X0 - 6, Y0 - 6, FX + 6, Y1 + 6, 4, 1.4);
  put(solid(tag(g, "bed")), prism(P, front, bed[0], bed[1], 0, BED));

  // block: wider at its foot, a crease at the deck, a rib between each cylinder on the near face
  const blk = tag(g, "block");
  const [foot] = rings(X0 - 2, Y0 - 2, X1 + 2, Y1 + 2, 4, 1), [deck, din] = rings(X0, Y0, X1, Y1, 4, 1.6);
  mk("path", { d: poly(hull(ringAt(P, foot, BED).concat(ringAt(P, deck, BH)))), class: "sil" }, blk);
  mk("path", { d: open(ringAt(P, run(din, front), BH)), class: "nf lo" }, blk);
  let ribs = "";
  for (let i = 0; i <= N; i++) { const x = hx(i) - PITCH / 2; ribs += seg(P(x, Y1 + 2, BED + 2), P(x, Y1, BH - 3)); }
  mk("path", { d: ribs, class: "nf lo" }, blk);

  // head covers, back to front
  const covers = [];
  for (let i = 0; i < N; i++) {
    const [ring, inner] = rings(hx(i) - 10, 5, hx(i) + 10, Y1 - 5, 3, 1.2);
    const s = solid(tag(g, "head"));
    covers.push({ s, ring, inner, last: -1 });
  }

  // exhaust manifold along the near side, a branch from each head
  const ex = tag(g, "exhaust"), eY = Y1 + 5, eZ = BH - 2;
  let br = "";
  for (let i = 0; i < N; i++) br += seg(P(hx(i), Y1 - 5, BH + 3), P(hx(i), eY, eZ + 3));
  mk("path", { d: br, class: "nf lo" }, ex);
  const pipe = discX(P, 4, eY, eZ, X0 - 4, X1 - 8, 16);
  mk("path", { d: poly(hull(pipe.a.concat(pipe.b))), class: "sil" }, ex);

  // turbocharger at the fore end: a volute facing the viewer, its inlet and wheel as rings
  const tb = tag(g, "turbo"), tv = discY(P, 12, -4, BH + 6, Y1 + 2, Y1 + 12);
  mk("path", { d: poly(hull(tv.a.concat(tv.b))), class: "sil" }, tb);
  mk("path", { d: poly(discY(P, 7, -4, BH + 6, Y1 + 12, Y1 + 12).a), class: "nf lo" }, tb);
  mk("path", { d: poly(discY(P, 3, -4, BH + 6, Y1 + 12, Y1 + 12).a), class: "nf" }, tb);

  // flywheel at the aft end, with a mark on its rim that turns with the crank
  const fw = tag(g, "flywheel"), fd = discX(P, FW, CY, FZ, FX - 4, FX + 3, 32);
  mk("path", { d: poly(hull(fd.a.concat(fd.b))), class: "sil" }, fw);
  mk("path", { d: poly(discX(P, FW - 4, CY, FZ, FX + 3, FX + 3, 32).a), class: "nf lo" }, fw);
  mk("path", { d: poly(discX(P, 6, CY, FZ, FX + 3, FX + 3, 16).a), class: "nf" }, fw);
  const tick = mk("circle", { r: 1.6, class: "dot m" }, fw);

  function draw(th) {
    covers.forEach((c, i) => {
      const h = LIFT * bump(i, th);
      if (Math.abs(h - c.last) < 0.02) return;
      c.last = h;
      put(c.s, prism(P, front, c.ring, c.inner, BH + h * 0.2, BH + HH + h));
    });
    const a = rad(th);
    place(tick, P(FX + 3, CY + (FW - 2) * Math.cos(a), FZ + (FW - 2) * Math.sin(a)));
  }
  /** The cylinder nearest its firing TDC. */
  const firing = (th) => { let b = 0; for (let i = 1; i < N; i++) if (Math.abs(off(i, th)) < Math.abs(off(b, th))) b = i; return b; };

  // the crank: a tween for the cylinder chosen, plus the idle turned since
  const base = tween(REST);
  let spin = 0, act = -1, lit = -1;
  const theta = (now) => tval(base, now) + spin;

  const B = register(stage, (dt, now) => {
    const idle = act < 0 && rate > 0 && !reducedMotion();
    if (idle) spin += rate * dt;
    const th = theta(now), f = firing(th);
    draw(th);
    if (f !== lit) { covers.forEach((c, i) => c.s.sil.classList.toggle("hi", i === f)); lit = f; }
    return idle || !tdone(base, now);
  });
  bag.add(B.unregister);

  // hit: the point under the pointer on the plane of the covers' resting tops, which never moves; the cover whose x is nearest
  function hit([sx, sy]) {
    const [x, y] = unproj(C, sx, sy, BH + HH);
    if (x < X0 - 10 || x > X1 + 4 || y < Y0 - 30 || y > Y1 + 40) return -1;
    return clamp(Math.round((x - HX) / PITCH), 0, N - 1);
  }

  function setActive(a) {
    if (a === act) return;
    const now = performance.now();
    if (a >= 0) {
      // turn forward to cylinder a's firing TDC, the nearest one ahead
      // the whole angle (tween + idle turned so far) lands on a's firing TDC, the nearest one ahead
      const cur = theta(now);
      let to = phase(a) + 720 * Math.floor((cur - phase(a)) / 720);
      while (to < cur) to += 720;
      tset(base, to - spin, now, 0);
    }
    act = a;
    read.textContent = a < 0 ? "rest" : "fire " + (a + 1) + " · " + ORDER.join("-");
    B.wake();
  }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { rate = v; B.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "engine",
  means: "A marine inline six idling: each head cover lifts in its firing stroke, 1-5-3-6-2-4; point at one to turn the crank to it.",
  rules: [1, 4, 7, 9],
  range: [0, 90, 240],
  tour: [[140, 84], [262, 138], [201, 114], null],
  mount,
});
