// Parity check: the SQL regex fallback for JV detection must match the
// front-end logic (ProductDetailPage / orders store / AdminOrders), which uses
// /jv|sim-locked|carrier-locked/i against "<pta_status> <notes>".
const fe = (v) => /jv|sim-locked|carrier-locked/i.test(`${v.pta_status ?? ""} ${v.notes ?? ""}`);
const sql = (v) => /jv|sim-locked|carrier-locked/i.test(v.pta_status ?? "") || /jv|sim-locked|carrier-locked/i.test(v.notes ?? "");

const cases = [
  { pta_status: "PTA Approved", notes: "" },
  { pta_status: "JV / SIM-Locked", notes: "carrier locked" },
  { pta_status: "", notes: "Sim-locked unit" },
  { pta_status: "PTA Approved", notes: "Already PTA-registered" },
  { pta_status: "CARRIER-LOCKED", notes: "" },
  { pta_status: "PTA Approved (verify IMEI on PTA DIRBS)", notes: "Already PTA-registered: confirm IMEI on PTA DIRBS before sale. Kit = phone only (no box); reconfirm charger/accessories included." },
];

let f = 0;
for (const c of cases) {
  const a = fe(c), b = sql(c);
  console.log(a === b ? "  ok" : "  FAIL", JSON.stringify(c), "fe=" + a, "sql=" + b);
  if (a !== b) f++;
}
console.log(f ? `${f} MISMATCH(ES)` : "PARITY OK");
process.exit(f ? 1 : 0);
