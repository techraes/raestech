import zipfile
import re

path = "raestech/data/catalog/RaesTech_Mobile_Catalog.xlsx"

with zipfile.ZipFile(path) as z:
    print("FILES IN XLSX:")
    for n in z.namelist():
        print("  -", n)
    names = z.namelist()

    # figure out shared strings
    shared = []
    if "xl/sharedStrings.xml" in names:
        data = z.read("xl/sharedStrings.xml").decode("utf-8", "ignore")
        shared = re.findall(r"<t[^>]*>(.*?)</t>", data, re.S)
        print("\nSHARED STRINGS COUNT:", len(shared))

    # sheet names
    wbxml = z.read("xl/workbook.xml").decode("utf-8", "ignore")
    sheets = re.findall(r'<sheet[^>]*name="([^"]+)"', wbxml)
    print("\nSHEETS:", sheets)

    # list sheet files
    sheet_files = [n for n in names if re.match(r"xl/worksheets/sheet\d+\.xml", n)]
    print("SHEET XML FILES:", sheet_files)

    # parse first sheet rows
    def col_letter(ref):
        return re.match(r"([A-Z]+)", ref).group(1)

    def col_index(ref):
        c = col_letter(ref)
        idx = 0
        for ch in c:
            idx = idx * 26 + (ord(ch) - 64)
        return idx - 1

    if sheet_files:
        target = "xl/worksheets/sheet2.xml"  # Product Catalog
        for sheetpath in sheet_files:
            data = z.read(sheetpath).decode("utf-8", "ignore")
            rows = re.findall(r"<row[^>]*r=\"(\d+)\"[^>]*>(.*?)</row>", data, re.S)
            print(f"\n=== SHEET {sheetpath} rows={len(rows)} (first 3 shown) ===")
            if sheetpath != target:
                for rnum, rowxml in rows[:3]:
                    cells = re.findall(r'<c r="([A-Z]+\d+)"[^>]*?(?: t="(\w+)")?[^>]*>(.*?)</c>', rowxml, re.S)
                    values = {}
                    for ref, t, inner in cells:
                        val = ""
                        if t == "s":
                            m = re.search(r"<v>(\d+)</v>", inner)
                            if m:
                                val = shared[int(m.group(1))]
                        elif t == "inlineStr":
                            m = re.search(r"<t[^>]*>(.*?)</t>", inner, re.S)
                            if m:
                                val = m.group(1)
                        else:
                            m = re.search(r"<v>(.*?)</v>", inner, re.S)
                            if m:
                                val = m.group(1)
                        values[col_letter(ref)] = val
                    print(rnum, list(values.items())[:8])
            else:
                lines = []
                for rnum, rowxml in rows:
                    cells = re.findall(r'<c r="([A-Z]+\d+)"[^>]*?(?: t="(\w+)")?[^>]*>(.*?)</c>', rowxml, re.S)
                    values = {}
                    for ref, t, inner in cells:
                        val = ""
                        if t == "s":
                            m = re.search(r"<v>(\d+)</v>", inner)
                            if m:
                                val = shared[int(m.group(1))]
                        elif t == "inlineStr":
                            m = re.search(r"<t[^>]*>(.*?)</t>", inner, re.S)
                            if m:
                                val = m.group(1)
                        else:
                            m = re.search(r"<v>(.*?)</v>", inner, re.S)
                            if m:
                                val = m.group(1)
                        values[col_letter(ref)] = val
                    lines.append(f"{rnum}: {values}")
                out = "\n".join(lines)
                print(out)
                with open("raestech/data/catalog/catalog_dump.txt", "w", encoding="utf-8") as f:
                    f.write(out)
                print("\n[WROTE catalog_dump.txt]")
