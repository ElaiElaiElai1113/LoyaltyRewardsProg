"""Derive saved-home-screen PNGs from the verified, untouched RewardMe master.

Usage: python scripts/prepare-rewardme-install-icons.py /path/to/rewardme-original.png
       --receipt outputs/rewardme-black-gold/icon-provenance.json
Requires Pillow; no palette reduction, recolouring, cropping or background removal.
"""

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageChops, __version__


MASTER_SHA256 = "e2f05324e3cb17182a65a94eb1c03da06f0d494a4515c3c5dbc26390175e0828"
VERSION = "rewardme-client-e2f05324-20261023"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("master", type=Path)
    parser.add_argument("--receipt", type=Path)
    args = parser.parse_args()
    assert digest(args.master) == MASTER_SHA256
    records = []
    with Image.open(args.master) as master:
        assert master.mode == "RGB" and master.size == (1391, 1131)
        for size in (180, 192, 512):
            width = round(size * 0.60)
            height = round(width * master.height / master.width)
            resized = master.resize((width, height), Image.Resampling.LANCZOS)
            canvas = Image.new("RGB", (size, size), "white")
            position = ((size - width) // 2, (size - height) // 2)
            canvas.paste(resized, position)
            # The whole rectangular source fits inside the maskable safe circle
            # (radius 40% of the canvas), preserving all supplied artwork.
            assert ((width / 2) ** 2 + (height / 2) ** 2) ** 0.5 < size * 0.40
            target = Path(f"api/_assets/rewardme-client-{size}.png")
            target.parent.mkdir(parents=True, exist_ok=True)
            canvas.save(target, "PNG", optimize=True, compress_level=9)
            with Image.open(target) as decoded:
                assert decoded.size == (size, size)
                assert ImageChops.difference(decoded, canvas).getbbox() is None
                assert ImageChops.difference(decoded.crop((*position, position[0] + width, position[1] + height)), resized).getbbox() is None
            records.append({"path": target.as_posix(), "size": size, "contentSize": [width, height],
                            "position": list(position), "bytes": target.stat().st_size, "sha256": digest(target),
                            "losslessPixelEquality": True, "fullSourcePreserved": True, "maskableSafeCircle": True})
    assert digest(args.master) == MASTER_SHA256
    receipt = {"masterSha256": MASTER_SHA256, "masterUnchanged": True, "pillowVersion": __version__,
               "version": VERSION, "resize": "Complete RGB master, LANCZOS, centered white canvas", "icons": records}
    if args.receipt:
        args.receipt.parent.mkdir(parents=True, exist_ok=True)
        args.receipt.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(receipt, indent=2))


if __name__ == "__main__":
    main()
