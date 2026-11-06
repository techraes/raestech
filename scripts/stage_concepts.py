import os, shutil, hashlib, json
src = 'data/image-import-live/product-images'
dst = 'public/images/concepts'
os.makedirs(dst, exist_ok=True)
copied = 0
skipped = 0
for fn in sorted(os.listdir(src)):
    if not fn.endswith('.webp'):
        continue
    s = os.path.join(src, fn)
    d = os.path.join(dst, fn)
    if os.path.exists(d):
        # idempotent: skip if identical bytes
        if open(s,'rb').read() == open(d,'rb').read():
            skipped += 1
            continue
    shutil.copy2(s, d)
    copied += 1
# write a sha256 manifest for idempotency record
sha = {}
for fn in sorted(os.listdir(dst)):
    if fn.endswith('.webp'):
        sha[fn] = hashlib.sha256(open(os.path.join(dst,fn),'rb').read()).hexdigest()
open('data/reports/staged_concepts_sha256.json','w').write(json.dumps(sha, indent=1))
print('copied', copied, 'skipped(identical)', skipped, 'total', len(sha))
