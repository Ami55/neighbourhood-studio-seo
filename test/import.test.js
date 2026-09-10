import assert from "node:assert/strict";
import test from "node:test";
import XLSX from "xlsx";

const normalizeHeader = (value) => String(value || "").toLowerCase().replace(/[^a-z]/g, "");
function pickField(row, candidates) {
  const match = Object.entries(row).find(([key]) => candidates.includes(normalizeHeader(key)));
  return match ? String(match[1] ?? "").trim() : "";
}

test("imports the supplied Input worksheet shape", () => {
  const workbook = XLSX.utils.book_new();
  const rows = [
    ["Status"], ["Current Row"], ["Progress"],
    ["id", "city", "country", "neighbourhoods list", "name", "neighbourhoods desc"],
    ["example", "London", "United Kingdom", "Kings Cross, Little Venice", "London, United Kingdom", ""],
    ["", "Aberdeen", "United Kingdom", "City Centre, Old Aberdeen", "Aberdeen, United Kingdom", ""],
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "Input");
  const sheet = workbook.Sheets.Input;
  const sourceRows = XLSX.utils.sheet_to_json(sheet, { defval: "", range: 3 });
  const imported = sourceRows.map((row) => ({
    city: pickField(row, ["city"]),
    country: pickField(row, ["country"]),
    neighbourhoods: pickField(row, ["neighbourhoodslist", "neighbourhoods"]),
  })).filter((row) => row.city || row.country || row.neighbourhoods);

  assert.equal(imported.length, 2);
  assert.deepEqual(imported[1], {
    city: "Aberdeen",
    country: "United Kingdom",
    neighbourhoods: "City Centre, Old Aberdeen",
  });
});
