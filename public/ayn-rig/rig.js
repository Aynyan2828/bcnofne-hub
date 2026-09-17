/* AynRig — パーツPNG + rig.json を canvas で動かす軽量2.5Dリグ(Live2D 不要)。
 * 使い方:
 *   const rig = new AynRig(canvasEl, '/assets/rig/rig.json'); await rig.load();
 *   毎フレーム rig.render(dt, {level, speaking, blink, t})
 * 他のアプリ(Remotion/ブラウザ)でもそのまま使える。依存なし。
 */
class AynRig {
  constructor(canvas, url, opts = {}) {
    this.canvas = canvas; this.url = url; this.base = url.replace(/[^/]*$/, '');
    this.opts = Object.assign({ focus: 'face', zoom: 1.0 }, opts);
    this.ready = false; this.layers = []; this.state = {};
  }
  async load() {
    const rig = await (await fetch(this.url, { cache: 'no-store' })).json();
    this.rig = rig;
    const imgs = await Promise.all(rig.layers.map(l => new Promise((res, rej) => {
      const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('layer: ' + l.file));
      im.src = this.base + l.file + '?v=' + Date.now();
    })));
    this.layers = rig.layers.map((l, i) => ({ ...l, img: imgs[i], angle: 0, vel: 0, alpha: l.switch ? 0 : 1 }))
      .sort((a, b) => a.z - b.z);
    this.ready = true; this.prevTilt = 0; this.prevTiltVel = 0;
    return this;
  }
  // 表示変換: 顔を中心に、円窓に収まる倍率
  _view() {
    const c = this.canvas, r = this.rig, s = r.size, f = r.face;
    const dpr = window.devicePixelRatio || 1;
    const W = c.clientWidth || c.width / dpr, H = c.clientHeight || c.height / dpr;
    if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    // 帽子のてっぺん〜あご下が円に入るくらい。目の少し上を中心に
    const cx = f.cx, cy = (f.eyes[1] + f.eyes[3]) / 2 - 0.03 * s;
    const k = (W / (0.80 * s)) * this.opts.zoom;
    return { dpr, W, H, k, cx, cy };
  }
  render(dt, st) {
    if (!this.ready) return;
    const t = st.t || performance.now() / 1000, r = this.rig, s = r.size;
    dt = Math.min(dt || 0.016, 0.05);
    const ctx = this.canvas.getContext('2d');
    const v = this._view();
    // 頭の傾き(ゆっくり揺れ + 喋る時の小さな相槌)
    const g = r.groups.head;
    const tilt = Math.sin(t * 0.45) * g.tilt_deg * 0.55 + (st.speaking ? Math.sin(t * 2.3) * 0.8 : 0) + (st.level || 0) * 0.8;
    const tiltVel = (tilt - this.prevTilt) / dt; const tiltAcc = (tiltVel - this.prevTiltVel) / dt;
    this.prevTilt = tilt; this.prevTiltVel = tiltVel;
    const breatheHead = Math.sin(t * 1.25) * g.breathe_px * (st.speaking ? 1.3 : 1);
    const breatheBody = Math.sin(t * 1.25 - 0.4) * r.groups.body.breathe_px;
    // スイッチ層の目標値
    const mouth = st.speaking ? Math.min(1, Math.max(0, ((st.level || 0) - 0.18) * 2.6)) : 0;
    for (const L of this.layers) {
      if (L.physics) {
        const p = L.physics;
        const wind = Math.sin(t * 1.1 + p.phase) * 0.35 + Math.sin(t * 2.7 + p.phase * 2) * 0.15
                   + Math.sin(t * 0.23 + p.phase * 3) * 0.25;   // ゆっくりした「そよ風」の強弱
        const drive = wind * p.wind + (-tiltAcc * 0.004) + (st.speaking ? Math.sin(t * 3.1 + p.phase) * 0.25 : 0);
        const acc = -p.stiffness * L.angle - p.damping * L.vel + drive * p.stiffness * 0.5;
        L.vel += acc * dt; L.angle += L.vel * dt;
        L.angle = Math.max(-p.max_deg, Math.min(p.max_deg, L.angle));
      }
      if (L.switch === 'blink') L.alpha += ((st.blink ? 1 : 0) - L.alpha) * 0.6;
      if (L.switch === 'mouth') L.alpha += (mouth - L.alpha) * 0.5;
    }
    // 描画
    ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
    ctx.clearRect(0, 0, v.W, v.H);
    ctx.save();
    ctx.translate(v.W / 2, v.H / 2); ctx.scale(v.k, v.k); ctx.translate(-v.cx, -v.cy);
    const rad = d => d * Math.PI / 180;
    for (const L of this.layers) {
      if (L.alpha <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha = Math.min(1, L.alpha);
      if (L.group === 'head') {
        const [px, py] = g.pivot;
        ctx.translate(px, py + breatheHead); ctx.rotate(rad(tilt)); ctx.translate(-px, -py);
      } else {
        ctx.translate(0, breatheBody);
      }
      if (L.physics && L.pivot) {
        const [px, py] = L.pivot;
        ctx.translate(px, py); ctx.rotate(rad(L.angle)); ctx.translate(-px, -py);
      }
      ctx.drawImage(L.img, 0, 0, s, s);
      ctx.restore();
    }
    ctx.restore();
  }
}
window.AynRig = AynRig;
