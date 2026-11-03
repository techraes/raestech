#!/usr/bin/env python3
"""
Batch-generate product images from the 'Image Manifest' sheet of the RaesTech catalog.

For every model it uses the prompt in column G and saves the image under the exact
file name in column A (e.g. apple-iphone-15-pro.png). Re-running skips files that
already exist, so you can stop and resume safely.

SETUP
    pip install openpyxl requests
    export OPENAI_API_KEY="sk-..."          # Windows PowerShell: $env:OPENAI_API_KEY="sk-..."

USAGE
    python generate_product_images.py --dry-run                 # list what would be made
    python generate_product_images.py --limit 3                 # test run: first 3 images
    python generate_product_images.py                           # everything (resumes)
    python generate_product_images.py --reference apple-iphone-15-pro.png
        # --reference sends one of your sample images with every request so the
        # style (dark studio, 3/4 back view, reflection) stays consistent.

    python generate_product_images.py --provider fal --model fal-ai/flux/dev
        # fal.ai alternative: export FAL_KEY="..." and pip install fal-client.
        # Check the model id in fal.ai's docs; --reference is not used with fal.

Check the provider's current pricing and model names before a full run.
"""
import argparse, base64, os, sys, time
from pathlib import Path

import openpyxl
import requests

DEFAULT_XLSX = "RaesTech_Pakistan_Mobile_Market_Catalog_2026-11-02_KIT.xlsx"
SHEET = "Image Manifest"


def read_manifest(xlsx):
    wb = openpyxl.load_workbook(xlsx, data_only=True)
    ws = wb[SHEET]
    rows = []
    for r in ws.iter_rows(min_row=5, values_only=True):
        fname, brand, model, _n, status, colour, prompt = r[:7]
        if not fname or not prompt:
            continue
        rows.append(dict(file=fname, brand=brand, model=model, status=status or "", prompt=prompt))
    return rows


def gen_openai(prompt, model, size, reference):
    key = os.environ["OPENAI_API_KEY"]
    headers = {"Authorization": f"Bearer {key}"}
    if reference:
        with open(reference, "rb") as fh:
            resp = requests.post(
                "https://api.openai.com/v1/images/edits",
                headers=headers,
                data={"model": model, "prompt": "Use the attached image only as a style reference "
                      "(backdrop, angle, lighting, reflection). Render the phone described here: " + prompt,
                      "size": size},
                files={"image": (Path(reference).name, fh, "image/png")},
                timeout=300,
            )
    else:
        resp = requests.post(
            "https://api.openai.com/v1/images/generations",
            headers={**headers, "Content-Type": "application/json"},
            json={"model": model, "prompt": prompt, "size": size},
            timeout=300,
        )
    resp.raise_for_status()
    item = resp.json()["data"][0]
    if item.get("b64_json"):
        return base64.b64decode(item["b64_json"])
    return requests.get(item["url"], timeout=120).content


def gen_fal(prompt, model, size, reference):
    import fal_client  # pip install fal-client ; needs FAL_KEY
    result = fal_client.subscribe(model, arguments={"prompt": prompt, "image_size": "square_hd"})
    url = result["images"][0]["url"]
    return requests.get(url, timeout=120).content


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--xlsx", default=DEFAULT_XLSX)
    ap.add_argument("--out", default="product-images")
    ap.add_argument("--provider", choices=["openai", "fal"], default="openai")
    ap.add_argument("--model", default=None, help="openai default: gpt-image-1")
    ap.add_argument("--size", default="1024x1024")
    ap.add_argument("--reference", default=None, help="sample image used as style reference (openai only)")
    ap.add_argument("--limit", type=int, default=0, help="only generate the first N missing images")
    ap.add_argument("--delay", type=float, default=1.0, help="seconds between requests")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not Path(args.xlsx).exists():
        sys.exit(f"Workbook not found: {args.xlsx} (run the script from the folder that contains it, or use --xlsx)")
    model = args.model or ("gpt-image-1" if args.provider == "openai" else "fal-ai/flux/dev")
    gen = gen_openai if args.provider == "openai" else gen_fal

    out = Path(args.out)
    out.mkdir(exist_ok=True)
    rows = read_manifest(args.xlsx)
    todo = [r for r in rows
            if not r["status"].startswith("Sample supplied") and not (out / r["file"]).exists()]
    if args.limit:
        todo = todo[: args.limit]
    print(f"{len(rows)} models in manifest, {len(todo)} to generate -> {out}/")

    if args.dry_run:
        for r in todo:
            print("  ", r["file"])
        return

    failed = []
    for i, r in enumerate(todo, 1):
        for attempt in range(1, 4):
            try:
                data = gen(r["prompt"], model, args.size, args.reference)
                (out / r["file"]).write_bytes(data)
                print(f"[{i}/{len(todo)}] saved {r['file']}")
                break
            except Exception as e:  # network, rate limit, content filter...
                print(f"[{i}/{len(todo)}] {r['file']} attempt {attempt} failed: {e}")
                time.sleep(5 * attempt)
        else:
            failed.append(r["file"])
        time.sleep(args.delay)

    if failed:
        Path("failed.txt").write_text("\n".join(failed))
        print(f"\n{len(failed)} failed - listed in failed.txt. Re-run the script to retry them.")
    else:
        print("\nDone. Upload the files to your site using these exact names.")


if __name__ == "__main__":
    main()
