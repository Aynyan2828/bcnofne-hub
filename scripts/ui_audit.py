# -*- coding: utf-8 -*-
"""bcnofne.com の UI/UX 点検（UI UX Pro Max の Quick Reference §1〜§6 を数字で測る）

    ~/bcnofne/ayn-sleep-radio/.venv/bin/python scripts/ui_audit.py https://bcnofne.com/ /tmp/ui_audit.json

測るもの: 文字と背景のコントラスト（文字を透明にした画面を撮って、後ろの色を実測）/
12px 未満の文字 / 押せる所の大きさ / 画像の alt / 見出しの順番 / 横はみ出し（375・320・横向き・PC）/
表示中のガタつき(CLS) / 読み込みの重さ / キーボードのフォーカス枠。
★小さい丸いバッジは角に外の背景が入って、コントラストが低めに出る（測り方のクセ）。
★サイトは smooth scroll やけん、位置を動かす時は behavior:'instant'。
"""
import io, json, math, sys
from playwright.sync_api import sync_playwright
from PIL import Image

URL = sys.argv[1] if len(sys.argv) > 1 else "https://bcnofne.com/"
OUT = sys.argv[2] if len(sys.argv) > 2 else "ui_audit.json"
R = {}

def lum(c):
    def ch(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2])

def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)

with sync_playwright() as p:
    b = p.chromium.launch()

    # ── A. 静的な状態で測る（動きを減らす設定＝演出で伏せられた文字も全部見える）
    ctx = b.new_context(viewport={"width": 375, "height": 812}, device_scale_factor=1,
                        reduced_motion="reduce", is_mobile=True, has_touch=True)
    pg = ctx.new_page()
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_timeout(1500)

    R["basics"] = pg.evaluate("""() => ({
      lang: document.documentElement.lang,
      viewport: document.querySelector('meta[name=viewport]')?.content,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      skipLink: !!document.querySelector('a[href="#main"]'),
      title: document.title,
      bodyFont: getComputedStyle(document.body).fontSize,
      bodyLineHeight: getComputedStyle(document.body).lineHeight,
    })""")

    R["headings"] = pg.evaluate("""() => [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
      .filter(h => h.offsetParent !== null || getComputedStyle(h).position === 'fixed')
      .map(h => ({lv: +h.tagName[1], t: h.textContent.replace(/\\s+/g,' ').trim().slice(0,30)}))""")

    R["images"] = pg.evaluate("""() => [...document.querySelectorAll('img')].map(i => ({
      src: (i.currentSrc || i.src).split('/').pop().slice(0,40),
      alt: i.getAttribute('alt'), hasSize: !!(i.getAttribute('width') && i.getAttribute('height')) || getComputedStyle(i).aspectRatio !== 'auto',
      lazy: i.loading, visible: i.offsetParent !== null }))""")

    R["targets"] = pg.evaluate("""() => {
      const els = [...document.querySelectorAll('a[href], button, [role=button], input, select, textarea, summary')];
      return els.map(e => {
        const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
        const vis = (e.offsetParent !== null || cs.position === 'fixed') && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
        const name = (e.getAttribute('aria-label') || e.textContent || e.getAttribute('title') || e.getAttribute('alt') || e.querySelector('img')?.alt || '').replace(/\\s+/g,' ').trim();
        return {tag: e.tagName.toLowerCase(), cls: (e.className && e.className.baseVal === undefined ? e.className : '').toString().split(' ')[0],
                name: name.slice(0,28), w: Math.round(r.width), h: Math.round(r.height), vis, display: cs.display,
                inline: cs.display === 'inline', inText: !!e.closest('p')};
      }).filter(t => t.vis);
    }""")

    R["tinyText"] = pg.evaluate("""() => {
      const out = []; const seen = new Set();
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) {
        const n = w.currentNode; if (!n.nodeValue.trim()) continue;
        const el = n.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
        if (el.closest('.tfx-sr, [aria-hidden=true], script, style, noscript')) continue;
        const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
        if (r.width === 0 || cs.visibility === 'hidden' || (el.offsetParent === null && cs.position !== 'fixed')) continue;
        const fs = parseFloat(cs.fontSize);
        if (fs < 12) out.push({fs, t: el.textContent.replace(/\\s+/g,' ').trim().slice(0,26), cls: el.className.toString().split(' ')[0]});
      }
      return out;
    }""")

    # コントラスト: 文字を透明にした画面を撮って「文字の後ろの色」を実測する
    items = pg.evaluate("""() => {
      const out = []; const seen = new Set(); let id = 0;
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) {
        const n = w.currentNode; if (n.nodeValue.trim().length < 2) continue;
        const el = n.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
        if (el.closest('.tfx-sr, [aria-hidden=true], script, style, noscript, canvas, svg')) continue;
        const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4 || cs.visibility === 'hidden' || (el.offsetParent === null && cs.position !== 'fixed')) continue;
        let op = 1; for (let a = el; a; a = a.parentElement) op *= parseFloat(getComputedStyle(a).opacity);
        el.dataset.aid = String(id);
        out.push({id: id++, y: r.top + scrollY, color: cs.color, op, fs: parseFloat(cs.fontSize), fw: parseInt(cs.fontWeight),
                  t: el.textContent.replace(/\\s+/g,' ').trim().slice(0,26), cls: el.className.toString().split(' ')[0], fixed: cs.position === 'fixed'});
      }
      return out;
    }""")
    pg.add_style_tag(content="*{color:transparent!important;text-shadow:none!important;-webkit-text-stroke:0!important;caret-color:transparent!important}")
    H = pg.evaluate("document.documentElement.scrollHeight")
    results = []
    todo = sorted(items, key=lambda i: i["y"])
    y = 0
    while y < H and todo:
        pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(250)
        shot = Image.open(io.BytesIO(pg.screenshot())).convert("RGB")
        boxes = pg.evaluate("""(ids) => ids.map(id => { const e = document.querySelector(`[data-aid="${id}"]`);
            const r = e.getBoundingClientRect(); return [id, r.left, r.top, r.width, r.height]; })""", [i["id"] for i in todo])
        done = set()
        for (iid, x0, y0, w, h) in boxes:
            if y0 < 0 or y0 + h > 812 or x0 < 0 or x0 + w > 375.5:
                continue
            crop = shot.crop((int(x0), int(y0), int(math.ceil(x0 + w)), int(math.ceil(y0 + h))))
            px = list(crop.getdata())
            if not px:
                continue
            # 背景: 一番「文字色から遠い」側の 25% やなく、全体の中央値（まだら背景に強い）
            px.sort(key=lambda c: lum(c))
            bg_med = px[len(px) // 2]
            bg_dark, bg_light = px[int(len(px) * 0.1)], px[int(len(px) * 0.9)]
            it = next(i for i in todo if i["id"] == iid)
            c = [float(v) for v in it["color"].replace("rgba(", "").replace("rgb(", "").replace(")", "").split(",")]
            a = (c[3] if len(c) > 3 else 1.0) * it["op"]
            def blend(bg):
                return tuple(a * c[k] + (1 - a) * bg[k] for k in range(3))
            worst = min(ratio(blend(bg), bg) for bg in (bg_med, bg_dark, bg_light))
            large = it["fs"] >= 24 or (it["fs"] >= 18.66 and it["fw"] >= 700)
            need = 3.0 if large else 4.5
            results.append({**it, "ratio": round(ratio(blend(bg_med), bg_med), 2), "worst": round(worst, 2), "need": need})
            done.add(iid)
        todo = [i for i in todo if i["id"] not in done]
        y += 600
    R["contrast"] = results
    ctx.close()

    # ── B. 普段どおり（演出あり）で、ガタつき(CLS)・重さ・キーボード操作
    ctx = b.new_context(viewport={"width": 375, "height": 812}, is_mobile=True, has_touch=True)
    pg = ctx.new_page()
    pg.add_init_script("""window.__cls=0; new PerformanceObserver(l=>{for(const e of l.getEntries()) if(!e.hadRecentInput) window.__cls+=e.value}).observe({type:'layout-shift',buffered:true});
      window.__lcp=0; new PerformanceObserver(l=>{const e=l.getEntries().pop(); if(e) window.__lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});""")
    sizes = []
    pg.on("response", lambda r: sizes.append((r.url, r.headers.get("content-length"), r.request.resource_type)))
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_timeout(1500)
    lcp = pg.evaluate("window.__lcp")
    cls_load = pg.evaluate("window.__cls")
    for yy in range(0, H, 500):
        pg.evaluate(f"window.scrollTo(0,{yy})"); pg.wait_for_timeout(120)
    pg.wait_for_timeout(1000)
    R["perf"] = {"lcp_ms": round(lcp), "cls_load": round(cls_load, 3), "cls_after_scroll": round(pg.evaluate("window.__cls"), 3)}
    by = {}
    tot = 0
    for u, l, t in sizes:
        n = int(l) if l and l.isdigit() else 0
        by[t] = by.get(t, 0) + n; tot += n
    R["perf"]["bytes_by_type_kb"] = {k: round(v / 1024) for k, v in by.items()}
    R["perf"]["requests"] = len(sizes)

    # キーボード: Tab で進めて、フォーカス枠が見えるか
    pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(300)
    foc = []
    for i in range(14):
        pg.keyboard.press("Tab"); pg.wait_for_timeout(80)
        foc.append(pg.evaluate("""() => { const e = document.activeElement; if (!e || e === document.body) return null;
          const cs = getComputedStyle(e);
          const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none');
          return {tag: e.tagName.toLowerCase(), name: (e.getAttribute('aria-label')||e.textContent||'').replace(/\\s+/g,' ').trim().slice(0,22), ring,
                  outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor}; }"""))
    R["focus"] = foc
    ctx.close()

    # ── C. 横向き・広い画面ではみ出さんか
    for vw, vh, name in [(812, 375, "landscape"), (1440, 900, "desktop"), (320, 640, "small")]:
        ctx = b.new_context(viewport={"width": vw, "height": vh}, reduced_motion="reduce")
        pg = ctx.new_page(); pg.goto(URL, wait_until="networkidle"); pg.wait_for_timeout(600)
        R[f"overflow_{name}"] = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        ctx.close()
    b.close()

json.dump(R, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("saved", OUT)
