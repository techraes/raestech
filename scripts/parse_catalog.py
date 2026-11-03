import zipfile
import re
import json

path = "raestech/data/catalog/RaesTech_Mobile_Catalog.xlsx"
out = "raestech/data/catalog/catalog_clean.json"

def get_attr(attrs, name):
    m = re.search(name + r'="([^"]*)"', attrs)
    return m.group(1) if m else None

with zipfile.ZipFile(path) as z:
    shared = re.findall(r"<t[^>]*>(.*?)</t>", z.read("xl/sharedStrings.xml").decode("utf-8", "ignore"), re.S)

    sheet_meta = [("xl/worksheets/sheet1.xml", "START HERE"),
                  ("xl/worksheets/sheet2.xml", "Product Catalog"),
                  ("xl/worksheets/sheet3.xml", "Price Model"),
                  ("xl/worksheets/sheet4.xml", "Sources"),
                  ("xl/worksheets/sheet5.xml", "Verify Before Publish"),
                  ("xl/worksheets/sheet6.xml", "Brand Summary")]

    sheets_out = {}
    for sheetpath, sheetname in sheet_meta:
        src = z.read(sheetpath).decode("utf-8", "ignore")
        rows = re.findall(r"<row[^>]*r=\"(\d+)\"[^>]*>(.*?)</row>", src, re.S)
        data_rows = []
        for rnum, rowxml in rows:
            cells = re.findall(r"<c\b([^>]*)>(.*?)</c>", rowxml, re.S)
            rec = {}
            for attrs, inner in cells:
                ref = get_attr(attrs, "r")
                t = get_attr(attrs, "t")
                if not ref:
                    continue
                col = re.match(r"([A-Z]+)", ref).group(1)
                val = ""
                if t == "s":
                    m = re.search(r"<v>(\d+)</v>", inner)
                    if m and 0 <= int(m.group(1)) < len(shared):
                        val = shared[int(m.group(1))]
                elif t == "inlineStr":
                    m = re.search(r"<t[^>]*>(.*?)</t>", inner, re.S)
                    if m:
                        val = m.group(1)
                elif t == "str":
                    m = re.search(r"<v>(.*?)</v>", inner, re.S)
                    if m:
                        val = m.group(1)
                else:
                    m = re.search(r"<v>(.*?)</v>", inner, re.S)
                    if m:
                        val = m.group(1)
                rec[col] = val
            data_rows.append({"row": int(rnum), "cells": rec})
        sheets_out[sheetname] = data_rows

    with open(out, "w", encoding="utf-8") as f:
        json.dump(sheets_out, f, ensure_ascii=False, indent=1)

    # print header row + first product row of Product Catalog
    cat = sheets_out["Product Catalog"]
    print("Product Catalog rows:", len(cat))
    hdr = cat[0]["cells"]
    print("\nHEADERS:")
    for k, v in hdr.items():
        print("  ", k, "=", v)
    print("\nROW 2 (first product):")
    print(json.dumps(cat[1]["cells"], ensure_ascii=False, indent=1))
