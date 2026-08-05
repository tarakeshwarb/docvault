const XLSX = require("xlsx");
const wb = XLSX.readFile("FT4 & LLT1 - DS - Result Analysis_SoC.xlsx");
console.log("Sheet names:", wb.SheetNames);
for (const name of wb.SheetNames) {
  console.log(`\n--- Sheet: ${name} ---`);
  const sheet = wb.Sheets[name];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(json.slice(0, 15)); // print first 15 rows
}
