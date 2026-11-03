import { parseCSV } from "@/lib/csv";
import { detectColumnMapping, buildRecordFromRow } from "@/features/import/columns";
import { validateAll, validateRecord, normalizeCondition, normalizePta } from "@/features/import/validate";
import type { ImportMode } from "@/features/import/types";

let failures = 0;
function check(name: string, cond: boolean, extra?: unknown) {
  if (cond) {
    console.log(`  PASS: ${name}`);
  } else {
    failures += 1;
    console.error(`  FAIL: ${name}`, extra ?? "");
  }
}

console.log("CSV parser");
{
  const rows = parseCSV("a,b,c\n1,2,3\r\n4,5,6");
  check("basic CRLF", rows.length === 3 && rows[2][2] === "6", rows);

  const q = parseCSV('brand,name,sku\n"Apple, Inc.","iPhone 13","SKU-1"\n"X","Y","Z"');
  check("quoted comma", q[1][0] === "Apple, Inc.", q[1]);

  const nl = parseCSV('a,b\n"line1\nline2",x\nc,d');
  check("embedded newline", nl[1][0] === "line1\nline2" && nl[1][1] === "x", nl);

  const esc = parseCSV('a\n"he said ""hi"""');
  check("quote escape", esc[1][0] === 'he said "hi"', esc);

  const bom = parseCSV("\uFEFFa,b\n1,2");
  check("BOM stripped", bom[0][0] === "a", bom);
}

console.log("normalizeCondition / normalizePta");
{
  check("box pack", normalizeCondition("New Box Packed") === "box_pack");
  check("used", normalizeCondition("Used") === "used");
  check("refurbished", normalizeCondition("Refurbished") === "refurbished");
  check("bad condition", normalizeCondition("Mint") === undefined);
  check("PTA approved", normalizePta("PTA Approved") === "PTA Approved");
  check("JV", normalizePta("Non-PTA / JV") === "Non-PTA / JV");
}

console.log("column auto-detection");
{
  const headers = ["Brand", "Model", "SKU", "Storage", "Listed Price", "Condition", "PTA Status", "SIM-Lock Status", "Stock"];
  const { mappings, unmappedHeaders } = detectColumnMapping(headers);
  const fields = mappings.map((m) => m.field);
  for (const expect of ["brand", "model", "sku", "storage", "listedPrice", "condition", "ptaStatus", "simLockStatus", "stock"]) {
    check(`mapped ${expect}`, fields.includes(expect), fields);
  }
  check("no unmapped", unmappedHeaders.length === 0, unmappedHeaders);
}

console.log("buildRecordFromRow");
{
  const headers = ["brand", "listed_price", "stock", "colors", "featured"];
  const mappings = detectColumnMapping(headers).mappings;
  const rec = buildRecordFromRow(headers, ["Apple", "Rs. 250,000", "7", "Midnight|Blue", "yes"], mappings);
  check("number parse drops currency", rec.listedPrice === 250000, rec.listedPrice);
  check("stock int", rec.stock === 7, rec.stock);
  check("colors split", Array.isArray(rec.colors) && rec.colors.length === 2, rec.colors);
  check("boolean yes", rec.featured === true, rec.featured);
}

console.log("validation");
{
  const base = {
    brand: "Apple",
    model: "iPhone 13",
    name: "iPhone 13 128GB",
    sku: "APL-1",
    storage: "128GB",
    listedPrice: 250000,
    stock: 5,
    condition: "New",
    category: "Smartphone",
    ptaStatus: "PTA Approved",
    simLockStatus: "Unlocked",
  };
  const { rows: v1 } = validateAll([{ rowIndex: 1, record: base }], "main");
  check("valid main record", v1[0].errors.length === 0, v1[0].errors);

  const { rows: v2 } = validateAll([{ rowIndex: 1, record: { ...base, sku: "" } }], "main");
  check("missing SKU", v2[0].errors.some((e) => e.field === "sku"));

  const { rows: v3 } = validateAll(
    [{ rowIndex: 1, record: base }, { rowIndex: 2, record: { ...base, sku: "APL-1" } }],
    "main"
  );
  check("duplicate SKU flagged", v3[1].errors.some((e) => e.message.includes("Duplicate")));

  const { rows: v4 } = validateAll([{ rowIndex: 1, record: { ...base, condition: "Mint" } }], "main");
  check("bad condition flagged", v4[0].errors.some((e) => e.field === "condition"));

  const { rows: v5 } = validateAll([{ rowIndex: 1, record: { ...base, listedPrice: -5 } }], "main");
  check("negative price flagged", v5[0].errors.some((e) => e.field === "listedPrice"));

  const { rows: v6 } = validateAll([{ rowIndex: 1, record: { ...base, category: "Tablet" } }], "main");
  check("unsupported category flagged", v6[0].errors.some((e) => e.field === "category"));

  // JV hardening
  const { rows: v7 } = validateAll([{ rowIndex: 1, record: { ...base, category: "Apple JV", ptaStatus: "PTA Approved" } }], "apple-jv");
  check("JV PTA-approved rejected", v7[0].errors.some((e) => e.field === "ptaStatus"));

  const { rows: v8 } = validateAll([{ rowIndex: 1, record: { ...base, category: "Apple JV", ptaStatus: "Non-PTA / JV", simLockStatus: "SIM-Locked" } }], "apple-jv");
  check("JV valid forces SIM-locked", v8[0].errors.length === 0 && v8[0].record!.simLockStatus === "SIM-Locked", v8[0]);

  const { rows: v9 } = validateAll(
    [{ rowIndex: 1, record: { ...base, category: "Apple JV", ptaStatus: "Non-PTA / JV", simLockStatus: "Factory Unlocked" } }],
    "apple-jv"
  );
  check("JV unlocked rejected", v9[0].errors.some((e) => e.field === "simLockStatus"));
}

console.log(failures === 0 ? "\nALL TESTS PASSED" : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
