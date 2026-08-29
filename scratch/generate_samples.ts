import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

async function generate() {
  const dir = path.join(process.cwd(), 'scratch');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  // 1. Courses Sample
  const wbCourses = new ExcelJS.Workbook();
  const wsCourses = wbCourses.addWorksheet('Courses');
  wsCourses.addRow(['Course Code', 'Course Name', 'Type', 'Year', 'Credits']);
  
  // Case 1: Standard full row
  wsCourses.addRow(['SAMPLE101', 'Introduction to Sample', 'Core', '1', '3']);
  // Case 2: Standard full row
  wsCourses.addRow(['SAMPLE102', 'Advanced Sample', 'Elective', '2', '4']);
  // Case 3: Missing optional fields (Type, Year)
  wsCourses.addRow(['SAMPLE103', 'Missing Optionals Sample', '', '', '2']);
  // Case 4: Blank row in the middle (should be ignored)
  wsCourses.addRow(['', '', '', '', '']);
  // Case 5: Missing required field (Credits) -> should show validation error in UI
  wsCourses.addRow(['SAMPLE104', 'Missing Credits', 'Core', '3', '']);
  
  await wbCourses.xlsx.writeFile(path.join(dir, 'sample_courses.xlsx'));

  // 2. Offerings Sample
  const wbOfferings = new ExcelJS.Workbook();
  const wsOfferings = wbOfferings.addWorksheet('Offerings');
  wsOfferings.addRow(['Course Code', 'Semester Name', 'Academic Year', 'Batch', 'Primary Coordinator ID', 'Secondary Coordinator IDs', 'Audit Professor IDs']);
  
  // Case 1: All fields filled, multiple IDs with spaces
  wsOfferings.addRow(['DEV101', 'ODD', '2026-2027', '1', ' 103454 ', '103610,  103685 ', '103750']);
  
  // Case 2: Completely empty optional fields (batch, secondary, audit)
  wsOfferings.addRow(['21CSE354T', 'ODD', '2026-2027', '', '103685', '', '']);
  
  // Case 3: A completely empty row (should be ignored by parser)
  wsOfferings.addRow(['', '', '', '', '', '', '']);
  
  // Case 4: Invalid course code (should show validation error in UI)
  wsOfferings.addRow(['INVALID999', 'ODD', '2026-2027', '1', '103454', '', '']);
  
  // Case 5: Invalid faculty ID (should show validation error in UI)
  wsOfferings.addRow(['DEV101', 'ODD', '2026-2027', '2', '999999', '', '']);
  
  await wbOfferings.xlsx.writeFile(path.join(dir, 'sample_offerings.xlsx'));

  console.log('Sample files regenerated with all edge cases!');
}

generate().catch(console.error);
