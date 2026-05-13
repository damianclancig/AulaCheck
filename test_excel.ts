import ExcelJS from 'exceljs';
const workbook = new ExcelJS.Workbook();
console.log(workbook ? 'OK' : 'FAIL');
