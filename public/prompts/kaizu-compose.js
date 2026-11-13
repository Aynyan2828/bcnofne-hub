/* 海図帳の統合モード（kaizu_compose.py・style_mix.py・lettering_mix.py と同じ決まり）。
   使う側で D（lettering.json）・SD（画風の部品）・SC（場所の部品）・KC（kaizu_compose.shared_json）と fmtT を用意する。
   見本ページ（build_lettering.py が埋め込む）とサイトの両方で使う（2026-11-14） */
/* 画風を混ぜる（style_mix.py と同じ決まり） */
function mixParse(text, n) {
  const R = SD.mix_rules;
  if (!text) return R.default_ratio[n].slice();
  text = text.trim();
  if (R.word_ratios[text] !== undefined) { const v = R.word_ratios[text]; return n === 2 ? [1 - v, v] : [1 - v - 0.1, v, 0.1]; }
  const nums = text.split(/[:：対/]/).filter(x => x.trim()).map(Number);
  if (nums.length !== n || nums.some(isNaN)) return null;
  const sum = nums.reduce((a, b) => a + b, 0); return sum > 0 ? nums.map(x => x / sum) : null;
}
function composeMix(ids, ratio, lang) {
  const its = ids.map(id => SD.items.find(x => x.id === id));
  const w = mixParse(ratio, ids.length); if (!w) return null;
  const t = SD.mix_text[lang], c = SD.prompt_common[lang], titles = SD.prompt_sections[lang];
  const main = its[0], sp = lang === 'en' ? ' ' : '', pct = x => Math.round(x * 100);
  const sec = {}; for (const k of ['line','surface','texture','color','light','face','finish','avoid']) sec[k] = main.prompt_parts[lang][k];
  const subs = [];
  its.slice(1).forEach((it, i) => {
    const s = w[i + 1], mp = it.mix_parts[lang], name = lang === 'ja' ? it.name_ja : it.name_en;
    const f = (key, txt) => fmtT(t[key], { name, p: pct(s), txt });
    let whats;
    if (i === 1) { sec.light = s > 0.15 ? f('borrowed', mp.light) : sec.light + sp + f('light_lean', mp.light); whats = ['light']; }
    else if (s <= 0.15) { sec.color = sec.color + sp + f('lean', mp.color); whats = ['color']; }
    else {
      sec.color = f('borrowed', mp.color) + t.keep_hue; sec.texture = f('borrowed', mp.texture); whats = ['color', 'texture'];
      if (s >= 0.4) { sec.light = f('borrowed', mp.light); sec.line = sec.line + sp + f('line_add', mp.line); whats.push('light', 'line'); }
    }
    subs.push(fmtT(t.sub, { name, gen: lang === 'ja' ? it.general_ja : it.general_en, p: pct(s), what: whats.map(x => t.what[x]).join(t.and) }));
  });
  for (const k of ['use','keep','scratch','ratio']) sec[k] = c[k];
  sec.finish += sp + t.finish_mix; sec.avoid += sp + fmtT(t.avoid_mix, { n: ids.length }); sec.priority = c.priority + t.priority_mix;
  const intro = fmtT(t.intro, { n: ids.length, main: lang === 'ja' ? main.name_ja : main.name_en, main_gen: lang === 'ja' ? main.general_ja : main.general_en, mp: pct(w[0]), subs: subs.join(sp) });
  const head = k => lang === 'en' ? `[${titles[k]}]` : `【${titles[k]}】`;
  const order = ['use','keep','scratch','ratio','line','surface','texture','color','light','face','finish','avoid','priority'];
  return [intro, ...order.map(k => `${head(k)}\n${sec[k]}`)].join('\n\n');
}

/* 文字の棚（lettering_mix.py と同じ決まり） */
function charsList(words, lang) {
  const t = D.mix_text[lang];
  return words.filter(Boolean).map(w => fmtT(t.chars_pair, { w, cs: Array.from(w.replace(/ /g, '')).join(t.sep) })).join(t.and);
}
function st(key, value, lang) {
  const s = D.settings[key]; const o = s.options[value || s.default];
  if (!o) throw new Error(key + ' ' + value); return o[lang];
}
function sections(it, text, sub, o, lang, withStyle) {
  const c = D.prompt_common[lang], part = it.prompt_parts[lang], t = D.mix_text[lang], sp = lang === 'en' ? ' ' : '';
  const words = sub ? [text, sub] : [text];
  const sec = {
    words: [fmtT(c.words_main, { main: text })].concat(sub ? [fmtT(c.words_sub, { sub })] : []).concat([c.words_none]).join(sp),
    script: fmtT(c.script, { chars: charsList(words, lang) }),
    size: st('size', o.size, lang),
    layout: st('layout', o.layout, lang) + sp + st('place', o.place, lang),
    letterform: part.letterform + sp + st('priority', o.priority, lang),
    stroke: part.stroke, material: part.material, color: part.color, light: part.light, edge: part.edge,
    mode: st('mode', o.mode, lang), people: c.people,
    finish: part.finish + sp + c.finish_common, avoid: part.avoid + sp + c.avoid_common, priority: c.priority,
  };
  const outline = o.outline || D.settings.outline.default;
  if (outline !== 'none') sec.edge += sp + t.outline_head + sp + st('outline', outline, lang) + sp + st('weight', o.weight, lang) + sp + (o.outline_color ? fmtT(t.outline_color, { c: o.outline_color }) : t.outline_color_auto);
  if (withStyle) { sec.material = c.match_style; delete sec.color; delete sec.light; }
  return sec;
}
function compose(ltId, text, sub, o, lang, styleIds, ratio) {
  const it = D.items.find(x => x.id === ltId), titles = D.prompt_sections[lang], c = D.prompt_common[lang];
  const head = k => lang === 'en' ? `[${titles[k]}]` : `【${titles[k]}】`;
  if (!styleIds || !styleIds.length) {
    const sec = sections(it, text, sub, o, lang, false); sec.use = c.use;
    const intro = fmtT(c.intro, { name_en: it.name_en, general_en: it.general_en, name_ja: it.name_ja, general_ja: it.general_ja });
    return [intro, ...D.prompt_order.map(k => `${head(k)}\n${sec[k]}`)].join('\n\n');
  }
  let base;
  if (styleIds.length === 1) { const s = SD.items.find(x => x.id === styleIds[0]); base = lang === 'en' ? s.prompt_en : s.prompt_ja; }
  else { base = composeMix(styleIds, ratio, lang); if (base === null) return null; }
  const sec = sections(it, text, sub, o, lang, true), t = D.mix_text[lang];
  const big = lang === 'en' ? `[${t.with_style_head}]` : `【${t.with_style_head}】`;
  const intro = fmtT(t.with_style_intro, { name_en: it.name_en, general_en: it.general_en, name_ja: it.name_ja, general_ja: it.general_ja });
  const order = D.prompt_order.filter(k => k in sec && k !== 'use');
  return base + '\n\n' + big + '\n' + intro + '\n\n' + order.map(k => `${head(k)}\n${sec[k]}`).join('\n\n');
}

/* 統合モード（kaizu_compose.py と同じ決まり） */
/* 足す棚（kaizu_compose.py の addon_section と同じ文） */
function addonSection(shelf, itemId, lang, st) {
  const it = shelf.items.find(x => x.id === itemId), key = it.section, title = shelf.section_titles[lang][key];
  const head = lang === 'en' ? `[${title}]` : `【${title}】`, sp = lang === 'en' ? ' ' : '', pre = [];
  if (key === 'framing') {
    pre.push(shelf.modes[st.mode || 'keep'][lang]);
    const asp = st.aspect || 'keep'; pre.push(shelf.aspects[asp][lang]);
    if (asp !== 'keep') pre.push(shelf.fits[st.fit || 'extend'][lang]);
  } else if (key === 'light') pre.push(shelf.modes[st.mode || 'add'][lang]);
  else if (key === 'weather') { pre.push(shelf.modes.keep_place[lang]); const se = st.season || 'none'; if (se !== 'none') pre.push(shelf.seasons[se][lang]); }
  return head + '\n' + pre.concat(it.part_keys.map(k => it.prompt_parts[lang][k])).join(sp);
}
function composeAll(styleIds, ratio, sceneId, ltId, text, sub, o, tplKey, lang, add) {
  add = add || {};
  const t = KC.text[lang], tpl = tplKey ? KC.templates[tplKey] : null;
  const hd = (titles, k) => lang === 'en' ? `[${titles[k]}]` : `【${titles[k]}】`;
  let base = '';
  if (styleIds.length) {
    if (styleIds.length === 1) { const s = SD.items.find(x => x.id === styleIds[0]); base = lang === 'en' ? s.prompt_en : s.prompt_ja; }
    else { base = composeMix(styleIds, ratio, lang); if (base === null) return null; }
    if (sceneId) {
      const sc = SC.items.find(x => x.id === sceneId), st = SC.prompt_sections[lang];
      const block = KC.scene_keys.map(k => `${hd(st, k)}\n${sc.prompt_parts[lang][k]}`).join('\n\n');
      const big = lang === 'en' ? `[${t.scene_head}]` : `【${t.scene_head}】`;
      base += `\n\n${big}\n${t.scene_intro}\n\n${block}`;
    }
  } else if (sceneId) { const sc = SC.items.find(x => x.id === sceneId); base = lang === 'en' ? sc.prompt_en : sc.prompt_ja; }
  const picks = [['framing', add.framing], ['light', add.light], ['light', add.lens], ['weather', add.weather]];
  const aspect = (add.framing || {}).aspect;
  if (aspect && aspect !== 'keep' && !(add.framing || {}).id) return null;
  const extra = [];
  for (const [nm, pk] of picks) if (pk && pk.id) { if (!KC.addons[nm]) return null; extra.push(addonSection(KC.addons[nm], pk.id, lang, pk)); }
  if (extra.length) {
    if (base) base += '\n\n' + extra.join('\n\n');
    else { const sh = KC.addons[picks.find(([, p]) => p && p.id)[0]]; base = sh.intro[lang] + '\n\n' + extra.join('\n\n'); }
  }
  const oo = Object.assign({}, tpl ? tpl.lettering : {});
  for (const [k, v] of Object.entries(o)) if (v) oo[k] = v;
  if (sub === null) sub = tpl ? tpl.sub_default : '';
  let out = base;
  if (ltId && text) {
    if (base) {
      const it = D.items.find(x => x.id === ltId), sec = sections(it, text, sub, oo, lang, true), lt = D.mix_text[lang], titles = D.prompt_sections[lang];
      const big = lang === 'en' ? `[${lt.with_style_head}]` : `【${lt.with_style_head}】`;
      const intro = fmtT(lt.with_style_intro, { name_en: it.name_en, general_en: it.general_en, name_ja: it.name_ja, general_ja: it.general_ja });
      out = base + '\n\n' + big + '\n' + intro + '\n\n' + D.prompt_order.filter(k => k in sec && k !== 'use').map(k => `${hd(titles, k)}\n${sec[k]}`).join('\n\n');
    } else out = compose(ltId, text, sub, oo, lang, [], null);
  }
  if (!out) return null;
  if (tpl) { const big = lang === 'en' ? `[${t.format}]` : `【${t.format}】`; const r = aspect && aspect !== 'keep' ? aspect : tpl.ratio; const body = !sub && tpl[lang + '_one'] ? tpl[lang + '_one'] : tpl[lang]; out += `\n\n${big}\n${body}${lang === 'en' ? ' ' : ''}${fmtT(t.ratio, { r })}`; }
  return out;
}

