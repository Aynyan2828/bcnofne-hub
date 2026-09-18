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
    // file:// (iOS の WKWebView など)では fetch が使えんけん、rig.json.js が定義する window.AYN_RIG を優先
    const rig = window.AYN_RIG || await (await fetch(this.url, { cache: 'no-store' })).json();
    this.rig = rig;
    const imgs = await Promise.all(rig.layers.map(l => new Promise((res, rej) => {
      const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('layer: ' + l.file));
      im.src = this.base + l.file + '?v=' + Date.now();
    })));
    // 衣装(outfit): l.outfit が付いとる層は、その衣装の時だけ出る(oa=衣装アルファ)。既定の衣装は rig.json outfits.default
    this.layers = rig.layers.map((l, i) => ({ ...l, img: imgs[i], angle: 0, vel: 0, tip: 0, tipVel: 0, alpha: l.switch ? 0 : 1, oa: l.outfit ? 0 : 1 }))
      .sort((a, b) => a.z - b.z);
    this.ready = true; this.prevTilt = 0; this.prevTiltVel = 0;
    this.expr = { name: 'neutral', layers: new Set(), tilt: 0, bangs: 0 }; this.tiltExtra = 0;
    this.outfit = 'default';
    if (this.opts.outfit) this.setOutfit(this.opts.outfit);
    return this;
  }
  /** 衣装を切り替える(rig.json の outfits にある名前。無ければ default)。本体の層をクロスフェードで差し替える(髪揺れ・表情はそのまま) */
  setOutfit(name) {
    const outfits = this.rig.outfits || {};
    if (name !== 'default' && !outfits[name]) name = 'default';
    if (this.outfit === name) return;
    this.outfit = name;
    if (name !== 'default' && this.expr && this.expr.pose) this.expr.pose = null;   // 衣装中はポーズ絵(昼の服)を使わん
  }
  /** この層が今の衣装で出るか(1/0)。outfit 付き層は一致した時だけ、無印の層は今の衣装の hide に無ければ出る */
  _outfitTarget(L) {
    if (L.outfit) return L.outfit === this.outfit ? 1 : 0;
    const o = (this.rig.outfits || {})[this.outfit];
    return o && o.hide && o.hide.includes(L.name) ? 0 : 1;
  }
  /** 表情プリセット(rig.json の expressions)。無い名前は neutral。tilt=首傾げ, bangs=前髪の流れ(度・正で向かって右) */
  setExpression(name) {
    const e = (this.rig.expressions || {})[name] || {};
    this.expr = { name, layers: new Set(e.layers || []), tilt: e.tilt || 0, bangs: e.bangs || 0, pose: (this.outfit && this.outfit !== 'default') ? null : (e.pose || null) };
    this.gust(0.6);   // 表情が変わる瞬間に髪がふわっと動く
  }
  /** 髪に突風(速度の衝撃)。喋り出し・表情変化で呼ぶ。dir=+1 右, -1 左, 0 交互 */
  gust(strength = 1, dir = 0) {
    this.gustSeq = (this.gustSeq || 0) + 1;
    const d = dir || (this.gustSeq % 2 ? 1 : -1);
    for (const L of this.layers) if (L.physics) L.vel += d * strength * L.physics.max_deg * 1.6 * (L.physics.gust ?? (L.name === 'hair_front' ? 1.3 : 1));
  }
  /** 首傾げ(度)。正=向かって右に傾く。0 で戻る。表情の tilt に足される */
  tilt(deg) { this.tiltExtra = deg || 0; }
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
    const tiltGoal = (this.expr ? this.expr.tilt : 0) + (this.tiltExtra || 0);
    this.tiltNow = (this.tiltNow || 0) + (tiltGoal - (this.tiltNow || 0)) * Math.min(1, dt * 4);   // ゆっくり傾く
    const tilt = this.tiltNow + Math.sin(t * 0.45) * g.tilt_deg * 0.55 + (st.speaking ? Math.sin(t * 2.3) * 0.8 : 0) + (st.level || 0) * 0.8;
    const tiltVel = (tilt - this.prevTilt) / dt; const tiltAcc = (tiltVel - this.prevTiltVel) / dt;
    this.prevTilt = tilt; this.prevTiltVel = tiltVel;
    const breatheHead = Math.sin(t * 1.25) * g.breathe_px * (st.speaking ? 1.3 : 1);
    const breatheBody = Math.sin(t * 1.25 - 0.4) * r.groups.body.breathe_px;
    if (st.speaking && !this.wasSpeaking) this.gust(0.8);
    this.wasSpeaking = !!st.speaking;
    // スイッチ層の目標値
    const mouth = st.speaking ? Math.min(1, Math.max(0, ((st.level || 0) - 0.18) * 2.6)) : 0;
    for (const L of this.layers) {
      if (L.physics) {
        const p = L.physics;
        const f = p.wind_freq || 1.1;   // 前髪は低めにして「ふわー」と左右に流れるように
        const wind = Math.sin(t * f + p.phase) * 0.35 + Math.sin(t * f * 2.45 + p.phase * 2) * 0.15
                   + Math.sin(t * 0.23 + p.phase * 3) * 0.25;   // ゆっくりした「そよ風」の強弱
        const drive = wind * p.wind + (-tiltAcc * 0.004) + (st.speaking ? Math.sin(t * 3.1 + p.phase) * 0.25 : 0);
        // 表情の「流れ」(bias): 前髪だけ、ばねの中心をずらす
        const bias = this.expr ? (this.expr.bangs || 0) * (p.expr_bias ?? (L.name === 'hair_front' ? 1 : 0)) : 0;
        const acc = -p.stiffness * (L.angle - bias) - p.damping * L.vel + drive * p.stiffness * 0.5;
        L.vel += acc * dt; L.angle += L.vel * dt;
        L.angle = Math.max(-p.max_deg, Math.min(p.max_deg, L.angle));
        // 毛先: 根元の角度に遅れて付いてくる(柔らかいばね)。根元より少し大きく振れ、細かくそよぐ
        if (p.bend) {
          const lag = p.tip_lag ?? 0.45, over = p.tip_over ?? 1.35;
          const flutter = Math.sin(t * 2.7 + p.phase * 5) * 0.4 + Math.sin(t * 4.3 + p.phase * 7) * 0.2;
          const goal = L.angle * over + flutter * (st.speaking ? 1.6 : 1) + wind * p.wind * 0.3;
          const tacc = -p.stiffness * lag * (L.tip - goal) - p.damping * 0.8 * L.tipVel;
          L.tipVel += tacc * dt; L.tip += L.tipVel * dt;
          L.tip = Math.max(-p.max_deg * over, Math.min(p.max_deg * over, L.tip));
        }
      }
      L.oa += (this._outfitTarget(L) - L.oa) * Math.min(1, dt * 5);   // 衣装のクロスフェード ~0.3s
      if (L.switch === 'blink') L.alpha += ((st.blink ? 1 : 0) - L.alpha) * 0.6;
      if (L.switch === 'mouth') L.alpha += (mouth - L.alpha) * 0.5;
      if (L.switch === 'expr') L.alpha += ((this.expr && this.expr.layers.has(L.name) ? 1 : 0) - L.alpha) * Math.min(1, dt * 8);
      if (L.switch === 'pose') L.alpha += ((this.expr && this.expr.pose === L.name ? 1 : 0) - L.alpha) * Math.min(1, dt * 5);   // クロスフェード ~0.3s
      if (L.switch === 'pose_blink') L.alpha = (this.expr && this.expr.pose === L.parent && st.blink) ? 1 : 0;
      if (L.switch === 'pose_mouth') L.alpha += (((this.expr && this.expr.pose === L.parent) ? mouth : 0) - L.alpha) * 0.5;
    }
    // 描画
    ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
    ctx.clearRect(0, 0, v.W, v.H);
    ctx.save();
    ctx.translate(v.W / 2, v.H / 2); ctx.scale(v.k, v.k); ctx.translate(-v.cx, -v.cy);
    const rad = d => d * Math.PI / 180;
    const poseOn = this.layers.reduce((m, L) => L.switch === 'pose' ? Math.max(m, L.alpha) : m, 0);   // 0..1
    // ポーズ絵の上に乗る口/目は、親ポーズのフェード量を掛ける
    const poseAlpha = {}; for (const L of this.layers) if (L.switch === 'pose') poseAlpha[L.name] = L.alpha;
    for (const L of this.layers) {
      if (L.alpha <= 0.01 || L.oa <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha = Math.min(1, L.alpha) * Math.min(1, L.oa) * (L.group === 'pose' ? (L.parent ? (poseAlpha[L.parent] || 0) : 1) : 1 - poseOn);   // ポーズ中は本体を消す
      if (ctx.globalAlpha <= 0.01) { ctx.restore(); continue; }
      if (L.group === 'pose') { ctx.translate(0, breatheHead); ctx.drawImage(L.img, 0, 0, s, s); ctx.restore(); continue; }
      if (L.group === 'head') {
        const [px, py] = g.pivot;
        ctx.translate(px, py + breatheHead); ctx.rotate(rad(tilt)); ctx.translate(-px, -py);
      } else {
        ctx.translate(0, breatheBody);
      }
      if (L.physics && L.pivot && L.physics.bend && L.bbox) {
        // しなり: 支点より下を N 本の横帯に分け、帯ごとに角度を根元→毛先へ補間して回す(帯は少し重ねて隙間を隠す)
        const [px, py] = L.pivot; const [, by0, , by1] = L.bbox;
        const N = L.physics.strips || 12, y0 = Math.max(py, by0), y1 = Math.min(s, by1 + 2), h = (y1 - y0) / N;
        if (by0 < y0) {  // 支点より上は根元の角度で 1 枚
          ctx.save(); ctx.translate(px, py); ctx.rotate(rad(L.angle)); ctx.translate(-px, -py);
          ctx.drawImage(L.img, 0, by0, s, y0 - by0 + 2, 0, by0, s, y0 - by0 + 2); ctx.restore();
        }
        for (let k = 0; k < N; k++) {
          const u = Math.pow((k + 0.5) / N, 1.5);   // 根元は硬く、毛先ほどよく動く
          const a = L.angle * (1 - u) + L.tip * u;
          const sy = y0 + k * h, sh = h + 3;
          ctx.save(); ctx.translate(px, py); ctx.rotate(rad(a)); ctx.translate(-px, -py);
          ctx.drawImage(L.img, 0, sy, s, sh, 0, sy, s, sh); ctx.restore();
        }
        ctx.restore(); continue;
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
