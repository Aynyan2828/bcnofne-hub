# -*- coding: utf-8 -*-
"""
make_qr.py
任意のURL（例: iCloudショートカット共有リンク）から
スキャン可能なQRコードPNGを生成する再利用スニペット。

BCNOFNe / Knowledge_Ingestor 用。

使い方:
    # 依存ライブラリ（初回のみ）
    #   pip install "qrcode[pil]"
    #   ※ Windowsで文字化けする場合は先に:  chcp 65001

    # URLを渡してQRを生成（出力先は自動でURL由来のファイル名）
    python make_qr.py "https://www.icloud.com/shortcuts/xxxxxxxx"

    # 出力ファイル名を明示
    python make_qr.py "https://example.com/foo" -o my_qr.png

    # 引数なしで実行すると対話入力を求める
    python make_qr.py

設計方針:
    - すべてUTF-8で扱う
    - 誤り訂正レベルはM（読み取り耐性と情報量のバランス）
    - box_size / border を大きめにして、実機カメラで確実にスキャンできるサイズにする
    - 例外は握りつぶさず、原因が分かるメッセージで終了する
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


# ---- 設定値（外出し）----------------------------------------------------
DEFAULT_BOX_SIZE = 12      # 1モジュールあたりのピクセル数（大きいほど高解像度）
DEFAULT_BORDER = 4         # クワイエットゾーン（白余白）のモジュール数。規格上は4以上推奨
DEFAULT_EC_LEVEL = "M"     # 誤り訂正レベル: L / M / Q / H
# ------------------------------------------------------------------------


def _safe_filename_from_url(url: str) -> str:
    """URLから安全なPNGファイル名を作る（英数と一部記号のみ残す）。"""
    tail = url.rstrip("/").split("/")[-1] or "qr"
    # ファイル名に使えない文字をアンダースコアへ
    tail = re.sub(r"[^A-Za-z0-9._-]", "_", tail)
    return f"qr_{tail}.png"


def make_qr(
    url: str,
    out_path: str | None = None,
    box_size: int = DEFAULT_BOX_SIZE,
    border: int = DEFAULT_BORDER,
    ec_level: str = DEFAULT_EC_LEVEL,
) -> Path:
    """
    URLからQRコードPNGを生成して保存し、保存先パスを返す。

    Raises:
        ImportError: qrcodeライブラリが未インストールのとき
        ValueError:  urlが空、または誤り訂正レベル指定が不正なとき
        OSError:     ファイル保存に失敗したとき
    """
    if not url or not url.strip():
        raise ValueError("URLが空です。生成対象のURLを指定してください。")
    url = url.strip()

    # 依存ライブラリは関数内でimportし、未導入時に分かりやすく案内する
    try:
        import qrcode
        from qrcode.constants import (
            ERROR_CORRECT_L,
            ERROR_CORRECT_M,
            ERROR_CORRECT_Q,
            ERROR_CORRECT_H,
        )
    except ImportError as e:  # noqa: F841
        raise ImportError(
            'qrcode ライブラリが必要です。次でインストールしてください:\n'
            '    pip install "qrcode[pil]"'
        )

    ec_map = {
        "L": ERROR_CORRECT_L,
        "M": ERROR_CORRECT_M,
        "Q": ERROR_CORRECT_Q,
        "H": ERROR_CORRECT_H,
    }
    key = ec_level.upper()
    if key not in ec_map:
        raise ValueError(f"誤り訂正レベルが不正です: {ec_level!r} (L/M/Q/H のいずれか)")

    # QR本体の生成
    qr = qrcode.QRCode(
        version=None,              # データ量に応じて自動でサイズ決定
        error_correction=ec_map[key],
        box_size=box_size,
        border=border,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    # 出力先の決定
    out = Path(out_path) if out_path else Path(_safe_filename_from_url(url))
    out = out.expanduser().resolve()
    out.parent.mkdir(parents=True, exist_ok=True)

    try:
        img.save(out)
    except OSError as e:
        raise OSError(f"PNGの保存に失敗しました: {out} ({e})")

    return out


def _parse_args(argv: list[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="URLからスキャン可能なQRコードPNGを生成する。"
    )
    p.add_argument("url", nargs="?", help="QRに埋め込むURL")
    p.add_argument("-o", "--output", help="出力PNGパス（省略時はURLから自動命名）")
    p.add_argument("--box-size", type=int, default=DEFAULT_BOX_SIZE,
                   help=f"1モジュールのpx数 (default: {DEFAULT_BOX_SIZE})")
    p.add_argument("--border", type=int, default=DEFAULT_BORDER,
                   help=f"白余白のモジュール数 (default: {DEFAULT_BORDER})")
    p.add_argument("--ec", default=DEFAULT_EC_LEVEL, choices=list("LMQH"),
                   help=f"誤り訂正レベル (default: {DEFAULT_EC_LEVEL})")
    return p.parse_args(argv)


def main(argv: list[str]) -> int:
    args = _parse_args(argv)

    url = args.url
    if not url:
        try:
            url = input("QRにするURLを入力してください: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n中断しました。", file=sys.stderr)
            return 1

    try:
        saved = make_qr(
            url,
            out_path=args.output,
            box_size=args.box_size,
            border=args.border,
            ec_level=args.ec,
        )
    except (ImportError, ValueError, OSError) as e:
        print(f"[エラー] {e}", file=sys.stderr)
        return 1

    print(f"[OK] QRコードを生成しました: {saved}")
    print(f"     埋め込みURL: {url}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
