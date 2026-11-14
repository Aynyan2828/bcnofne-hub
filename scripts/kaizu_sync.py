#!/usr/bin/env python3
"""海図帳（Kaizu）の正本を Vault からサイトへ写す。

正本: ~/Documents/BCNOFNe Vault/03_Knowledge/Image_Prompts/BCNOFNe_画風カタログ/
  - style.json（画風 30 種）・scene.json（場所 24 か所）・images/style/*.png
  - lettering.json（文字 20 種）・images/lettering/*.png（見本 20 枚＋統合モードのジャケ見本）
  - framing.json・light.json・weather.json（足す棚。統合モードだけが使う）
  - tools/kaizu_compose.py（shared_json）・tools/kaizu_compose.js（統合モードの組み立て）
写し先（このリポ）:
  - src/data/kaizu/style.json  … ページを作るのに要る所だけ（Astro がビルド時に読む）
  - src/data/kaizu/scene.json
  - src/data/kaizu/lettering.json … 文字の棚の一覧用
  - src/data/kaizu/framing.json・light.json・weather.json … 構図・光とレンズ・時間帯と天気の棚の一覧用
    （見本の絵がまだ無い項目は img なし＝ページで「見本はまだ」。描けたら sync し直せば埋まる）
  - public/prompts/style/mix.json … 「混ぜる」欄と統合モードがブラウザで読む画風の部品
  - public/prompts/compose.json   … 統合モードがブラウザで読む部品（D=文字・SC=場所・KC=ひな形と足す棚）
  - public/prompts/kaizu-compose.js … tools/kaizu_compose.js をそのまま写す（中身は変えん）
  - public/prompts/img/*.webp     … 見本画像（一覧用 480px・1 種ずつのページ用 1000px）

Vault 側は読むだけ。上書き・削除はせん。
使い方: python3 scripts/kaizu_sync.py [--vault <カタログのフォルダ>]
"""
import argparse
import json
import logging
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image

log = logging.getLogger("kaizu_sync")
REPO = Path(__file__).resolve().parent.parent
DEFAULT_VAULT = Path.home() / "Documents/BCNOFNe Vault/03_Knowledge/Image_Prompts/BCNOFNe_画風カタログ"

# サイトに出す項目（外部サイトの名前や作業メモは持ってこん）
STYLE_ITEM_KEYS = ["id", "no", "number_ja", "slug", "name_ja", "name_en", "general_ja", "general_en",
                   "aliases", "family", "desc_ja", "sample_image", "prompt_en", "prompt_ja"]
SCENE_ITEM_KEYS = ["id", "no", "number_ja", "slug", "name_ja", "name_en", "place_ja", "aliases",
                   "shelf", "time", "mood", "desc_ja", "prompt_en", "prompt_ja"]
LETTERING_ITEM_KEYS = ["id", "number_ja", "slug", "name_ja", "name_en", "general_ja", "aliases", "family", "desc_ja"]
# 統合モードの JS（kaizu_compose.js）が読む所だけ。作業メモ・外部サイトの話は持ってこん
COMPOSE_LT_ITEM_KEYS = ["id", "number_ja", "name_ja", "name_en", "general_ja", "general_en", "prompt_parts"]
COMPOSE_LT_HEAD = ["version", "settings", "prompt_common", "prompt_sections", "prompt_order", "mix_text", "families"]
COMPOSE_SC_ITEM_KEYS = ["id", "number_ja", "name_ja", "prompt_en", "prompt_ja", "prompt_parts"]
ADDON_HEAD = ["version", "section_titles", "intro", "aspects", "fits", "modes", "seasons"]
ADDON_ITEM_KEYS = ["id", "number_ja", "name_ja", "section", "part_keys", "prompt_parts"]
# 構図・光とレンズ・時間帯と天気の棚（一覧用）。棚の名前 → 見本の置き場（images/<名前>/<ID>.png）
ADDON_SHELVES = ["framing", "light", "weather"]
ADDON_LIST_KEYS = ["id", "number_ja", "slug", "section", "name_ja", "name_en", "general_ja", "aliases", "desc_ja", "time"]
# 見本の置き場にある作業用の絵（元絵と同じ・描き直し中）は拾わん
SKIP_IMG_SUFFIX = ("_SAME_AS_SOURCE.png", "_new.png")
SIZES = {"s": 480, "l": 1000}
# 作家・個人の名前を指す呼び方はサイトに出さん（法務部 2026-11-13。Vault の正本はそのまま）
ALIAS_BLOCK = ["ミュシャ"]


def load(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def dump(obj, p: Path, indent=None):
    p.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(obj, ensure_ascii=False, indent=indent, separators=None if indent else (",", ":")) + "\n"
    p.write_bytes(text.encode("utf-8"))
    log.info("書いた %s (%d KB)", p.relative_to(REPO), p.stat().st_size // 1024)


def to_webp(src: Path, stem: str, out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        im = im.convert("RGB")
        for tag, w in SIZES.items():
            h = round(im.height * w / im.width)
            dst = out_dir / f"{stem}-{tag}.webp"
            im.resize((w, h), Image.LANCZOS).save(dst, "WEBP", quality=80, method=6)
    return f"{stem}"


def drop_blocked(aliases):
    return [a for a in aliases if not any(b in a for b in ALIAS_BLOCK)]


def addon_sample(v: Path, shelf: str, it: dict):
    """見本の絵の場所。JSON の sample_image があればそれ、無ければ images/<棚>/<ID>.png。どちらも無ければ None"""
    cands = []
    if it.get("sample_image"):
        cands.append(v / it["sample_image"])
    cands.append(v / "images" / shelf / f"{it['id']}.png")
    for c in cands:
        if c.name.endswith(SKIP_IMG_SUFFIX):
            continue
        if c.is_file():
            return c
    return None


def sync_addon_shelf(v: Path, shelf: str, img_dir: Path):
    d = load(v / f"{shelf}.json")
    rows, have = [], 0
    for it in d["items"]:
        row = {k: it.get(k) for k in ADDON_LIST_KEYS}
        row["aliases"] = drop_blocked(row["aliases"] or [])
        src = addon_sample(v, shelf, it)
        row["img"] = to_webp(src, it["id"], img_dir) if src else None
        have += 1 if src else 0
        rows.append(row)
    head = {"version": d["version"], "updated": d.get("updated"),
            "section_titles": d["section_titles"]["ja"]}
    dump({**head, "items": rows}, REPO / f"src/data/kaizu/{shelf}.json", 1)
    log.info("%s：%d 項目のうち見本 %d 枚（まだ %d）", shelf, len(rows), have, len(rows) - have)
    return len(rows), have


def compose_shared(v: Path):
    """Vault の kaizu_compose.shared_json() を別のプロセスで呼ぶ（Vault 側のコードはこのリポに混ぜん）"""
    code = "import json,sys; sys.path.insert(0, sys.argv[1]); import kaizu_compose as K; print(json.dumps(K.shared_json(), ensure_ascii=False))"
    r = subprocess.run([sys.executable, "-I", "-c", code, str(v / "tools")], capture_output=True, text=True, encoding="utf-8", check=True)
    kc = json.loads(r.stdout)
    # 足す棚は JS が使う所だけに絞る（文は同じ。名前・説明・作業メモは要らん）
    for name, shelf in list(kc["addons"].items()):
        if not shelf:
            continue
        slim = {k: shelf[k] for k in ADDON_HEAD if k in shelf}
        slim["items"] = [{k: it[k] for k in ADDON_ITEM_KEYS} for it in shelf["items"]]
        kc["addons"][name] = slim
    return kc


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--vault", type=Path, default=DEFAULT_VAULT)
    a = ap.parse_args()
    v = a.vault
    style, scene = load(v / "style.json"), load(v / "scene.json")
    img_dir = REPO / "public/prompts/img"

    items = []
    for it in style["items"]:
        row = {k: it.get(k) for k in STYLE_ITEM_KEYS}
        row["aliases"] = drop_blocked(row["aliases"])
        if it.get("sample_image"):
            row["img"] = to_webp(v / it["sample_image"], it["id"], img_dir)
        items.append(row)
    src_img = to_webp(v / style["source_image"], "source", img_dir)
    mixes = []
    for m in style.get("mix_samples", []):
        stem = "MIX_" + "x".join(m["ids"]) + "_" + m["ratio"].replace(":", "-")
        mixes.append({"ids": m["ids"], "ratio": m["ratio"], "img": to_webp(v / m["image"], stem, img_dir)})
    head = {k: style[k] for k in ["catalog_id", "catalog_name_ja", "catalog_name_en", "section_name_ja",
                                  "section_name_en", "version", "updated", "families"]}
    dump({**head, "source_img": src_img, "mix_samples": mixes, "items": items}, REPO / "src/data/kaizu/style.json", 1)

    mix = {"version": style["version"], "mix_rules": style["mix_rules"], "mix_text": style["mix_text"],
           "prompt_common": style["prompt_common"], "prompt_sections": style["prompt_sections"],
           "items": [{k: it[k] for k in ["id", "number_ja", "name_ja", "name_en", "general_ja", "general_en",
                                         "prompt_parts", "mix_parts", "prompt_en", "prompt_ja"]} for it in style["items"]]}
    dump(mix, REPO / "public/prompts/style/mix.json")

    shead = {k: scene[k] for k in ["version", "updated", "shelves", "times", "moods", "addons"]}
    dump({**shead, "items": [{k: it.get(k) for k in SCENE_ITEM_KEYS} for it in scene["items"]]},
         REPO / "src/data/kaizu/scene.json", 1)
    # 文字の棚（一覧用）
    lett = load(v / "lettering.json")
    lrows = []
    for it in lett["items"]:
        row = {k: it.get(k) for k in LETTERING_ITEM_KEYS}
        row["aliases"] = drop_blocked(row["aliases"])
        if it.get("sample_image"):
            row["img"] = to_webp(v / it["sample_image"], it["id"], img_dir)
        lrows.append(row)
    jacket = v / "images/lettering/COMPOSE_jacket_ST-05xLT-02.png"
    compose_samples = []
    if jacket.exists():
        compose_samples.append({"template": "jacket", "style": ["ST-05"], "lettering": "LT-02",
                                "img": to_webp(jacket, "COMPOSE_jacket_ST-05xLT-02", img_dir)})
    lhead = {k: lett[k] for k in ["version", "updated", "families", "sample_text"]}
    dump({**lhead, "compose_samples": compose_samples, "items": lrows}, REPO / "src/data/kaizu/lettering.json", 1)

    # 構図・光とレンズ・時間帯と天気の棚（一覧用）
    addon_counts = {name: sync_addon_shelf(v, name, img_dir) for name in ADDON_SHELVES}

    # 統合モードの部品
    compose = {
        "D": {**{k: lett[k] for k in COMPOSE_LT_HEAD},
              "items": [{k: it[k] for k in COMPOSE_LT_ITEM_KEYS} for it in lett["items"]]},
        "SC": {"prompt_sections": scene["prompt_sections"],
               "items": [{k: it[k] for k in COMPOSE_SC_ITEM_KEYS} for it in scene["items"]]},
        "KC": compose_shared(v),
    }
    # サイトでは、ジャケのアーティスト名の既定を空にする（他の人のプロンプトに BCNOFNe の名前が入らんよう・法務部 2026-11-14）。
    # 空の時は「文字は 1 行だけ：曲名」の文になる。Vault の道具（マスター用）は既定のまま
    for tpl in compose["KC"].get("templates", {}).values():
        tpl["sub_default"] = ""
    dump(compose, REPO / "public/prompts/compose.json")
    js_dst = REPO / "public/prompts/kaizu-compose.js"
    shutil.copyfile(v / "tools/kaizu_compose.js", js_dst)
    log.info("写した %s", js_dst.relative_to(REPO))

    log.info("画風 %d 種・場所 %d か所・文字 %d 種・%s・画像 %d 枚", len(items), len(scene["items"]), len(lrows),
             "・".join(f"{k} {n}（見本 {h}）" for k, (n, h) in addon_counts.items()),
             len(list(img_dir.glob("*.webp"))))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    try:
        main()
    except Exception as e:  # noqa: BLE001
        log.error("失敗: %r", e)
        sys.exit(1)
