# -*- coding: utf-8 -*-
"""
gen_shortcut_qr.py
まかせんしゃい台帳(registry)を正本に、各slugの go.bcnofne.com/<slug> QRを
hubの public/qr/<slug>.png へ一括生成する（Prompt178）。

正本は bcnofne-edge/src/shortcuts.json（このリポの兄弟ディレクトリ）。
台帳に1行足したら:
    python3 scripts/gen_shortcut_qr.py
だけで、新slugのQRが public/qr/ に生えてカード一覧に反映される。

設計方針:
    - すべてUTF-8で扱う（open は encoding="utf-8"）
    - 既存PNGがあってもURLは不変なので毎回上書き（idempotent）
    - 台帳が読めない/qrcode未導入は原因が分かるメッセージで終了
    - QRの中身は導入リンク go.bcnofne.com/<slug>（iCloud直リンクにしない＝計測を通す）
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# scripts/ の1つ上がリポルート
HUB_ROOT = Path(__file__).resolve().parent.parent
# 台帳の既定パス（兄弟リポ）。環境で上書きしたい時は SHORTCUTS_JSON 環境変数。
DEFAULT_REGISTRY = HUB_ROOT.parent / "bcnofne-edge" / "src" / "shortcuts.json"
OUT_DIR = HUB_ROOT / "public" / "qr"
GO_BASE = "https://go.bcnofne.com"

sys.path.insert(0, str(Path(__file__).resolve().parent))
try:
    from make_qr import make_qr  # 同ディレクトリの再利用スニペット
except ImportError as e:  # noqa: F841
    print(f"[エラー] make_qr.py を読み込めません: {e}", file=sys.stderr)
    raise SystemExit(1)


def load_registry(path: Path) -> list[dict]:
    if not path.exists():
        print(f"[エラー] 台帳が見つかりません: {path}\n"
              f"        SHORTCUTS_JSON 環境変数で明示できます。", file=sys.stderr)
        raise SystemExit(1)
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    items = data.get("shortcuts", [])
    if not isinstance(items, list):
        print(f"[エラー] 台帳の shortcuts が配列ではありません: {path}", file=sys.stderr)
        raise SystemExit(1)
    return items


def main(argv: list[str]) -> int:
    import os

    registry_path = Path(os.environ.get("SHORTCUTS_JSON", str(DEFAULT_REGISTRY)))
    items = load_registry(registry_path)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    made = 0
    for entry in items:
        slug = str(entry.get("slug", "")).strip().lower()
        if not slug:
            print("[警告] slug 空のエントリをスキップ", file=sys.stderr)
            continue
        url = f"{GO_BASE}/{slug}"
        out = OUT_DIR / f"{slug}.png"
        try:
            # box_size/border は make_qr の既定（12/4）で実機スキャン十分。
            saved = make_qr(url, out_path=str(out))
        except Exception as e:  # noqa: BLE001
            print(f"[エラー] {slug}: QR生成失敗 ({e})", file=sys.stderr)
            return 1
        print(f"[OK] {slug} -> {saved}  ({url})")
        made += 1

    print(f"[完了] {made} 件のQRを {OUT_DIR} に生成しました。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
