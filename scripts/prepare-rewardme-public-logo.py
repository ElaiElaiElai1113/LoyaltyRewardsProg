"""Prepare the supplied RewardMe logo for its 44 CSS px public placement.

Requires Pillow with WebP support. Example:
  python scripts/prepare-rewardme-public-logo.py /path/to/rewardme-original.png \
    --receipt outputs/rewardme-implementation/logo-derivative.json

The client master stays outside the delivery tree. Resize the complete RGB
artwork to 3x display density, retain its white background, and encode losslessly.
"""

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageChops, __version__, features


MASTER_SHA256 = "e2f05324e3cb17182a65a94eb1c03da06f0d494a4515c3c5dbc26390175e0828"


def digest(file: Path) -> str:
    return hashlib.sha256(file.read_bytes()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("master", type=Path)
    parser.add_argument("--output", type=Path, default=Path("public/rewardme-client-logo-132.webp"))
    parser.add_argument("--receipt", type=Path)
    args = parser.parse_args()
    assert digest(args.master) == MASTER_SHA256, "Use the verified client-supplied RewardMe master."
    assert args.master.resolve() != args.output.resolve(), "Never overwrite the master."
    with Image.open(args.master) as image:
        assert image.size == (1391, 1131) and image.mode == "RGB"
        size = (132, round(132 * image.height / image.width))
        resized = image.resize(size, Image.Resampling.LANCZOS)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        resized.save(args.output, "WEBP", lossless=True, method=6, exact=True,
                     icc_profile=image.info.get("icc_profile", b""))
        with Image.open(args.output) as delivered:
            assert delivered.size == size and delivered.mode == "RGB"
            assert ImageChops.difference(resized, delivered).getbbox() is None, "Encoding must be lossless."
    assert digest(args.master) == MASTER_SHA256, "Master changed during preparation."
    receipt = {
        "masterSha256": MASTER_SHA256,
        "masterBytes": args.master.stat().st_size,
        "masterDimensions": [1391, 1131],
        "deliveryPath": args.output.as_posix(),
        "deliverySha256": digest(args.output),
        "deliveryBytes": args.output.stat().st_size,
        "deliveryDimensions": list(size),
        "displayWidthCssPx": 44,
        "density": 3,
        "resize": "Pillow LANCZOS, complete image, original RGB and background",
        "encoding": "lossless WebP; decoded pixels equal the resized bitmap",
        "masterUnchanged": True,
        "pillowVersion": __version__,
        "webpVersion": features.version("webp"),
    }
    if args.receipt:
        args.receipt.parent.mkdir(parents=True, exist_ok=True)
        args.receipt.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(receipt, indent=2))


if __name__ == "__main__":
    main()
