#!/usr/bin/env python3
"""海図帳（Kaizu）の正本を Vault からサイトへ写す。

正本: ~/Documents/BCNOFNe Vault/03_Knowledge/Image_Prompts/BCNOFNe_画風カタログ/
  - style.json（画風 30 種）・scene.json（場所 24 か所）・images/style/*.png
写し先（このリポ）:
  - src/data/kaizu/style.json  … ページを作るのに要る所だけ（Astro がビルド時に読む）
  - src/data/kaizu/scene.json
  - public/prompts/style/mix.json … 「混ぜる」欄がブラウザで読む部品だけ
  - public/prompts/img/*.webp     … 見本画像（一覧用 480px・1 種ずつのページ用 1000px）

Vault 側は読むだけ。上書き・削除はせん。
使い方: python3 scripts/kaizu_sync.py [--vault <カタログのフォルダ>]
"""
import argparse
import json
import logging
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
SIZES = {"s": 480, "l": 1000}


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
                                         "prompt_parts", "mix_parts"]} for it in style["items"]]}
    dump(mix, REPO / "public/prompts/style/mix.json")

    shead = {k: scene[k] for k in ["version", "updated", "shelves", "times", "moods", "addons"]}
    dump({**shead, "items": [{k: it.get(k) for k in SCENE_ITEM_KEYS} for it in scene["items"]]},
         REPO / "src/data/kaizu/scene.json", 1)
    log.info("画風 %d 種・場所 %d か所・画像 %d 枚", len(items), len(scene["items"]),
             len(list(img_dir.glob("*.webp"))))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    try:
        main()
    except Exception as e:  # noqa: BLE001
        log.error("失敗: %r", e)
        sys.exit(1)
