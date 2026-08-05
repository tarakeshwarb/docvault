const XLSX = require("xlsx");
const wb = XLSX.readFile("FT4 & LLT1 - DS - Result Analysis_SoC.xlsx");
console.log(wb.SheetNames);
