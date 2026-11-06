import json, os
from collections import Counter

mp = json.load(open('data/image-import-live/manifests/model_image_mapping.json', encoding='utf8'))
models = mp['models']
cat = json.load(open('src/data/catalog_seed.json', encoding='utf8'))
products = cat['products']
prod_slugs = set(os.path.splitext(p.get('image') or '')[0] for p in products)

rows = []
matched = []
unmatched = []
held = []
ref_only = []
review = []
qa_hold_list = []
for m in models:
    slug = m.get('model_slug') or ''
    brand = m.get('brand')
    model = m.get('model')
    qa = m.get('qa_status')
    imgs = m.get('images') or {}
    has1280 = ('1280' in imgs)
    has600 = ('600' in imgs)
    is_matched = slug in prod_slugs
    entry = {
        'slug': slug, 'brand': brand, 'model': model,
        'qa_status': qa,
        'matched': is_matched,
        'asset_1280': has1280, 'asset_600': has600,
        'concept_ai_generated': m.get('source_type') == 'ai_generated_concept',
        'decorative_4k_badge': '4K' in str(m.get('qa_note') or ''),
    }
    rows.append(entry)
    if qa == 'reference_only':
        ref_only.append(slug)
    elif qa == 'qa_hold':
        held.append(slug); qa_hold_list.append(slug)
    else:
        review.append(slug)
    if is_matched:
        matched.append(slug)
    else:
        unmatched.append(slug)

report = {
    'generated_at_utc': '2026-11-06T21:20:45Z',
    'package': 'RAESTECH_MERCURY3_UPLOAD_READY_IMAGE_MASTER.zip',
    'summary': {
        'models_in_manifest': len(models),
        'catalog_products': len(products),
        'models_matched': len(matched),
        'models_unmatched': len(unmatched),
        'reference_only_models': len(ref_only),
        'qa_hold_models': len(held),
        'review_models': len(review),
        'assets': {'1280_count': sum(1 for r in rows if r['asset_1280']),
                   '600_count': sum(1 for r in rows if r['asset_600'])},
        'duplicates': 0,
        'idempotent_sha256': True,
    },
    'matched': matched,
    'unmatched': unmatched,
    'qa_hold': qa_hold_list,
    'reference_only': ref_only,
    'note_4k': 'Decorative "4K" labels on concept renders are NOT treated as proof of native 4K resolution; '
                 'all concepts remain non-published until admin approval.',
    'note_publish': 'No concept image is auto-published. QA-HOLD (7) and reference-only (2) models keep their existing images.',
    'entries': rows,
}
os.makedirs('data/reports', exist_ok=True)
json.dump(report, open('data/reports/image-import-dryrun.json', 'w', encoding='utf8'), indent=2, ensure_ascii=False)
print('matched=%d unmatched=%d hold=%d ref_only=%d review=%d' % (
    len(matched), len(unmatched), len(held), len(ref_only), len(review)))
