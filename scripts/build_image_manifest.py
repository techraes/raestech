import json, os, hashlib
from collections import Counter

# 1) read authoritative mapping (committed source for reproducibility)
MAPPING_PATH = 'data/image-master/manifests/model_image_mapping.json'
if not os.path.exists(MAPPING_PATH):
    raise SystemExit('Missing authoritative mapping source: %s (commit it or re-extract the master pack)' % MAPPING_PATH)
mp = json.load(open(MAPPING_PATH, encoding='utf8'))
models = mp['models']

# 2) read catalog
cat = json.load(open('src/data/catalog_seed.json', encoding='utf8'))
products = cat['products']
prod_by_img = {}
for p in products:
    img = (p.get('image') or '')
    base = os.path.splitext(img)[0]
    prod_by_img[base] = p

# 3) concept image files present
concepts_dir = 'public/images/concepts'
os.makedirs(concepts_dir, exist_ok=True)
have = set(os.listdir(concepts_dir))

manifest = []
unmatched = []
held = []
ref_only = []
review = []
missing_asset = []
for m in models:
    slug = m.get('model_slug') or ''
    brand = m.get('brand')
    model = m.get('model')
    qa = m.get('qa_status') or 'qa_review'
    if qa == 'reference_only':
        status = 'reference_only'
        ref_only.append((brand, model))
    elif qa == 'qa_hold':
        status = 'hold'
        held.append((brand, model))
    else:
        status = 'review'
        review.append((brand, model))

    imgs = m.get('images') or {}
    a1280 = '/images/concepts/%s-1280.webp' % slug if slug else None
    a600 = '/images/concepts/%s-600.webp' % slug if slug else None
    f1280 = '%s-1280.webp' % slug
    f600 = '%s-600.webp' % slug
    has1280 = f1280 in have
    has600 = f600 in have
    if status != 'reference_only':
        if not (has1280 and has600):
            missing_asset.append((brand, model, f1280, f600))
    if slug not in prod_by_img:
        unmatched.append((brand, model, slug))

    manifest.append({
        'slug': slug,
        'brand': brand,
        'model': model,
        'qaStatus': status,
        'asset1280': a1280 if has1280 else None,
        'asset600': a600 if has600 else None,
        'productImageBasename': slug,
    })

out = {
    'package': 'RAES TECH Mercury 3 live image import',
    'generated_at_utc': '2026-11-06T21:20:45Z',
    'totalModels': len(models),
    'statusCounts': {'review': len(review), 'hold': len(held), 'reference_only': len(ref_only)},
    'assetsStaged': len(missing_asset) == 0,
    'entries': manifest,
}
open('src/data/image-manifest.json', 'w', encoding='utf8').write(json.dumps(out, indent=2, ensure_ascii=False))

print('manifest entries:', len(manifest))
print('status counts:', dict(Counter(e['qaStatus'] for e in manifest)))
print('unmatched catalog slugs:', unmatched)
print('missing asset files:', missing_asset)
print('reference-only:', len(ref_only))
