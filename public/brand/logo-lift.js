/*
 * フネのしるし（BCNOFNe のロゴ）を、指／マウスを当てた所から持ち上げる。外部読み込みなし。
 * - 船・波・月・外の輪：ロゴを細かい四角（タイル）に分け、指の近くほど高く浮く
 * - しぶきの丸 19 個：丸ごと、指が近くを通るだけで、近いほど高く浮く（タイルより上）
 * 画像は public/brand/logo/（sea.webp＝しぶきを抜いたロゴ、dotNN.webp＝しぶきの丸、dots.json＝位置）。
 * 動きを減らす設定では、ばねを使わずすぐその高さで止まる。元は ~/bcnofne/vendor/hairline-test/logo-lift。
 */
(() => {
  const scene = document.querySelector("[data-logo-lift]");
  if (!scene || scene.dataset.ready) return;
  scene.dataset.ready = "1";
  const base = scene.dataset.base || "";
  const dir = `${base}/brand/logo`;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  fetch(`${dir}/dots.json`).then((r) => r.json()).then(start).catch((e) => console.warn("logo-lift: 読み込めんかった", e));

  function start(meta) {
    const W = meta.W, H = meta.H;
    const plane = document.createElement("div");
    plane.className = "ll-plane";
    scene.appendChild(plane);

    /* 大きさ：場面の幅に合わせて縮める */
    const fit = () => {
      const s = Math.min(scene.clientWidth / W, scene.clientHeight / H) * 0.9;
      plane.style.setProperty("--w", W + "px");
      plane.style.setProperty("--h", H + "px");
      plane.style.setProperty("--s", String(s));
    };
    fit();
    addEventListener("resize", fit);

    /* ばね（k 100・c 18・m 1）。動きを減らす設定では、すぐ着地 */
    const spring = (x) => ({ x, v: 0, t: x });
    const step = (sp, dt) => {
      if (reduced.matches) { sp.x = sp.t; sp.v = 0; return false; }
      sp.v += (100 * (sp.t - sp.x) - 18 * sp.v) * dt; sp.x += sp.v * dt;
      if (Math.abs(sp.t - sp.x) < 0.05 && Math.abs(sp.v) < 0.05) { sp.x = sp.t; sp.v = 0; return false; }
      return true;
    };
    /* 動いとる間だけ回る 1 本のループ */
    const ticks = [];
    let running = false, last = 0;
    const wake = () => {
      if (running) return;
      running = true; last = performance.now();
      requestAnimationFrame(function loop(now) {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        let any = false;
        for (const t of ticks) if (t(dt)) any = true;
        if (any && !document.hidden) requestAnimationFrame(loop); else running = false;
      });
    };

    /* タイル（しぶきを抜いたロゴ）。画像は CSS に 1 回だけ書く */
    const T = 18, LIFT = 150, R = 84, tiles = [];
    plane.style.setProperty("--ll-img", `url(${dir}/sea.webp)`);
    for (let j = 0; j < Math.ceil(H / T); j++) for (let i = 0; i < Math.ceil(W / T); i++) {
      const el = document.createElement("div");
      el.className = "ll-tile";
      /* 1.6px 重ねて継ぎ目を消す */
      el.style.cssText = `left:${i * T}px;top:${j * T}px;width:${T + 1.6}px;height:${T + 1.6}px;background-position:${-i * T}px ${-j * T}px`;
      plane.appendChild(el);
      tiles.push({ el, cx: i * T + T / 2, cy: j * T + T / 2, z: spring(0), drawn: -1 });
    }
    /* しぶきの丸（タイルより上・影つき） */
    const DOT = 150, RD = 95, dots = meta.dots.map((d) => {
      const sh = document.createElement("img"), el = document.createElement("img");
      sh.className = "ll-shadow"; el.className = "ll-dot";
      for (const n of [sh, el]) {
        n.src = `${dir}/${d.name}.webp`; n.alt = ""; n.decoding = "async";
        n.style.cssText = `left:${d.x}px;top:${d.y}px;width:${d.w}px;height:${d.h}px`;
        plane.appendChild(n);
      }
      return { d, el, sh, z: spring(0), drawn: -1 };
    });
    ticks.push((dt) => {
      let moving = false;
      for (const t of tiles) {
        if (step(t.z, dt)) moving = true;
        const z = t.z.x;
        if (Math.abs(z - t.drawn) > 0.02) { t.drawn = z; t.el.style.transform = `translateZ(${z.toFixed(2)}px)`; t.el.style.filter = z > 1 ? `brightness(${(1 + z / 300).toFixed(3)})` : ""; }
      }
      for (const o of dots) {
        if (step(o.z, dt)) moving = true;
        const z = o.z.x;
        if (Math.abs(z - o.drawn) > 0.02) {
          o.drawn = z;
          o.el.style.transform = `translateZ(${(z + 0.6).toFixed(2)}px)`;
          o.sh.style.opacity = String(Math.min(0.12, z / 220));
          o.sh.style.transform = `translate(${(z * 0.1).toFixed(1)}px, ${(z * 0.1).toFixed(1)}px)`;
        }
      }
      return moving;
    });

    /* 指の位置に合わせて高さを決める（null で全部おろす） */
    const near = (o, x, y) => { let m = 1e9; for (const [px, py] of o.d.pts) { const v = (px - x) ** 2 + (py - y) ** 2; if (v < m) m = v; } return Math.sqrt(m); };
    const aim = (p) => {
      for (const t of tiles) {
        if (!p) { t.z.t = 0; continue; }
        const d = Math.hypot(t.cx - p[0], t.cy - p[1]) / R;
        t.z.t = LIFT * Math.max(Math.exp(-d * d), d < 1.6 ? 0.08 : 0);
      }
      for (const o of dots) {
        if (!p) { o.z.t = 0; continue; }
        const d = near(o, p[0], p[1]) / RD;
        o.z.t = DOT * Math.exp(-d * d);
      }
      wake();
    };

    /* 当たり判定：持ち上がらん平面（z=0）の上の位置を、画面の点から逆算する（四隅の対応から射影を解く） */
    const solve = (from, to) => {
      const A = [], b = [];
      for (let k = 0; k < 4; k++) {
        const [x, y] = from[k], [u, v] = to[k];
        A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
        A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
      }
      for (let i = 0; i < 8; i++) {
        let m = i; for (let r = i + 1; r < 8; r++) if (Math.abs(A[r][i]) > Math.abs(A[m][i])) m = r;
        [A[i], A[m]] = [A[m], A[i]]; [b[i], b[m]] = [b[m], b[i]];
        for (let r = 0; r < 8; r++) if (r !== i) { const f = A[r][i] / A[i][i]; for (let c = i; c < 8; c++) A[r][c] -= f * A[i][c]; b[r] -= f * b[i]; }
      }
      return b.map((v, i) => v / A[i][i]);
    };
    const toPlane = (cx, cy) => {
      const d = 1400, sr = scene.getBoundingClientRect(), mx = scene.clientWidth / 2, my = scene.clientHeight / 2;
      const P = new DOMMatrix().translate(mx, my).multiply(new DOMMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1 / d, 0, 0, 0, 1])).translate(-mx, -my);
      const M = new DOMMatrix(getComputedStyle(plane).transform);
      const Tm = P.multiply(new DOMMatrix().translate(plane.offsetLeft + W / 2, plane.offsetTop + H / 2).multiply(M).translate(-W / 2, -H / 2));
      const to = (u, v) => { const q = Tm.transformPoint(new DOMPoint(u, v, 0, 1)); return [q.x / q.w, q.y / q.w]; };
      const corners = [[0, 0], [W, 0], [W, H], [0, H]];
      const h = solve(corners.map(([u, v]) => to(u, v)), corners);
      const x = cx - sr.left, y = cy - sr.top, w = h[6] * x + h[7] * y + 1;
      return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w];
    };
    const move = (e) => {
      const [x, y] = toPlane(e.clientX, e.clientY);
      aim(x < -20 || y < -20 || x > W + 20 || y > H + 20 ? null : [x, y]);
    };
    scene.addEventListener("pointermove", move);
    scene.addEventListener("pointerdown", move);
    scene.addEventListener("pointerleave", () => aim(null));
    scene.addEventListener("pointercancel", () => aim(null));
  }
})();
