import json
import re

SRC = "raestech/data/catalog/catalog_clean.json"
OUT_APP = "raestech/src/data/catalog_seed.json"
OUT_SQL = "raestech/supabase/seed_catalog.sql"

def slugify(s):
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s

def cell(r, col):
    return r.get("cells", {}).get(col)

def is_product_row(r):
    sku = (cell(r, "A") or "").strip()
    model = (cell(r, "C") or "").strip()
    price = parse_int(cell(r, "P"))
    return bool(re.match(r"^RT-", sku)) and bool(model) and price is not None

def parse_brands(rows):
    order = []
    seen = set()
    for r in rows:
        if not is_product_row(r):
            continue
        b = (cell(r, "B") or "").strip()
        if b and b not in seen:
            seen.add(b)
            order.append(b)
    return order

def parse_int(v):
    if v is None:
        return None
    s = str(v).replace(",", "").strip()
    m = re.search(r"\d+", s)
    return int(m.group(0)) if m else None

def split_list(v):
    if not v:
        return []
    return [x.strip() for x in re.split(r"[;|,/]", v) if x.strip()]

def group_products(rows):
    products = {}
    order = []
    for r in rows:
        if not is_product_row(r):
            continue
        brand = (cell(r, "B") or "").strip()
        model = (cell(r, "C") or "").strip()
        price = parse_int(cell(r, "P"))
        if not brand or not model or price is None:
            continue
        key = (brand, model)
        if key not in products:
            products[key] = {"brand": brand, "model": model, "rows": []}
            order.append(key)
        products[key]["rows"].append(r)
    return products, order

def variant_from_row(r):
    colors = split_list(cell(r, "G"))
    pta = (cell(r, "N") or "").strip()
    box = (cell(r, "O") or "").strip()
    # condition inference
    cond = "Used"
    if "kit" in box.lower() or "open-box" in box.lower() or "used" in box.lower():
        cond = "Used / Open-Box"
    if "box pack" in box.lower() or "box-pack" in box.lower():
        cond = "Box Pack"
    listed = parse_int(cell(r, "P"))
    buy_now = parse_int(cell(r, "Q"))
    inst_total = parse_int(cell(r, "R"))
    monthly = parse_int(cell(r, "S"))
    return {
        "sku": (cell(r, "A") or "").strip(),
        "storage": (cell(r, "F") or "").strip(),
        "ram": (cell(r, "E") or "").strip(),
        "colors": colors,
        "display": (cell(r, "H") or "").strip(),
        "chipset": (cell(r, "I") or "").strip(),
        "rear_camera": (cell(r, "J") or "").strip(),
        "front_camera": (cell(r, "K") or "").strip(),
        "battery": (cell(r, "L") or "").strip(),
        "network": (cell(r, "M") or "").strip(),
        "pta_status": pta,
        "condition": cond,
        "box_pack": box,
        "listedPrice": listed,
        "buyNowPrice": buy_now,
        "instalmentTotal": inst_total if inst_total is not None else listed,
        "monthly": monthly,
        "priceEvidence": (cell(r, "T") or "").strip(),
        "sourceUrl": (cell(r, "V") or "").strip(),
        "confidence": (cell(r, "U") or "").strip(),
        "priceCheckedDate": (cell(r, "W") or "").strip(),
        "requiresVerification": (cell(r, "X") or "").strip() == "YES",
        "notes": (cell(r, "Y") or "").strip(),
        "stock": 0,
    }

def main():
    with open(SRC, encoding="utf-8") as f:
        sheets = json.load(f)
    rows = sheets["Product Catalog"]

    brands = parse_brands(rows)
    products_map, order = group_products(rows)

    products = []
    idx = 0
    for brand, model in order:
        idx += 1
        variants = [variant_from_row(r) for r in products_map[(brand, model)]["rows"]]
        name = f"{brand} {model}"
        products.append({
            "id": idx,
            "slug": slugify(f"{brand}-{model}"),
            "brand": brand,
            "model": model,
            "name": name,
            "description": f"{name} — {model} smartphone at RAES TECH.",
            "category": brand,
            "seo_title": f"{name} Price in Pakistan | RAES TECH",
            "seo_description": f"Buy {name} at the best price in Pakistan with Buy Now discount or 0% markup instalments.",
            "featured": False,
            "new_arrival": False,
            "bestseller": False,
            "variants": variants,
        })

    seed = {"brands": [{"name": b, "slug": slugify(b)} for b in brands], "products": products}
    with open(OUT_APP, "w", encoding="utf-8") as f:
        json.dump(seed, f, ensure_ascii=False, indent=1)

    # ---- SQL seed ----
    sql = []
    sql.append("-- Product catalogue seed generated from catalog XLSX")
    sql.append("-- NOTE: product images are NOT attached; admin must upload real photos.")
    sql.append("")
    for b in brands:
        sql.append(f"INSERT INTO brands (name, slug) VALUES ('{b.replace(chr(39), chr(39)+chr(39))}', '{slugify(b)}') ON CONFLICT (slug) DO NOTHING;")
    sql.append("")
    for p in products:
        b = p["brand"].replace("'", "''")
        sql.append(f"INSERT INTO categories (name, slug) VALUES ('{b}', '{p['category'] and slugify(b)}') ON CONFLICT (slug) DO NOTHING;")
    sql.append("")
    for p in products:
        brand = p["brand"].replace("'", "''")
        name = p["name"].replace("'", "''")
        model = p["model"].replace("'", "''")
        desc = p["description"].replace("'", "''")
        seo_t = p["seo_title"].replace("'", "''")
        seo_d = p["seo_description"].replace("'", "''")
        sql.append(
            f"INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) "
            f"VALUES ('{p['slug']}', (SELECT id FROM brands WHERE slug='{slugify(brand)}'), '{name}', '{model}', '{desc}', '{slugify(brand)}', '{seo_t}', '{seo_d}') "
            f"ON CONFLICT (slug) DO NOTHING;"
        )
        for v in p["variants"]:
            sku = v["sku"].replace("'", "''")
            colors = ", ".join(v["colors"]).replace("'", "''")
            pta = v["pta_status"].replace("'", "''")
            cond = v["condition"].replace("'", "''")
            retail = v["listedPrice"] or 0
            bn = v["buyNowPrice"] or int(retail * 0.9)
            tot = v["instalmentTotal"] or retail
            sql.append(
                f"INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) "
                f"SELECT id, '{sku}', '{v['storage']}', '{v['ram']}', '{colors}', '{v['display'].replace(chr(39), chr(39)+chr(39))}', '{v['chipset'].replace(chr(39), chr(39)+chr(39))}', "
                f"'{v['rear_camera'].replace(chr(39), chr(39)+chr(39))}', '{v['front_camera'].replace(chr(39), chr(39)+chr(39))}', '{v['battery'].replace(chr(39), chr(39)+chr(39))}', "
                f"'{v['network'].replace(chr(39), chr(39)+chr(39))}', '{pta}', '{cond}', {retail}, {bn}, {tot}, {v['stock']}, {str(v['requiresVerification']).lower()} "
                f"FROM products WHERE slug='{p['slug']}' ON CONFLICT (sku) DO NOTHING;"
            )

    with open(OUT_SQL, "w", encoding="utf-8") as f:
        f.write("\n".join(sql))

    print("Products:", len(products), "| Brands:", len(brands))
    print("Wrote", OUT_APP, "and", OUT_SQL)

if __name__ == "__main__":
    main()
