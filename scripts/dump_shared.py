import zipfile
import re

path = "raestech/data/catalog/RaesTech_Mobile_Catalog.xlsx"
with zipfile.ZipFile(path) as z:
    data = z.read("xl/sharedStrings.xml").decode("utf-8", "ignore")
    shared = re.findall(r"<t[^>]*>(.*?)</t>", data, re.S)
    print("TOTAL SHARED STRINGS:", len(shared))
    # print indices 22..52 for catalog column headers
    for i in range(22, min(53, len(shared))):
        print(i, "=", repr(shared[i]))
