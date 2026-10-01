const XLSX = require('xlsx');

// Create a new workbook
const wb = XLSX.utils.book_new();

// Sheet 1: Vendor Invoices
const wsVendors = XLSX.utils.aoa_to_sheet([
  ['Vendor Invoices Data Collection'],
  ['Fill out details for each material a vendor provides.'],
  [],
  ['Vendor Name', 'Material Type', 'Total Area (sq.ft)', 'Pre-GST Amount (Rs)', 'GST Rate (%)', 'Other Expenses (Delivery/Rush) (Rs)', 'Profit Margin (Rs)'],
  ['Sample Vendor A', 'Frontlit Flex', '', '', '12', '', ''],
  ['Sample Vendor A', 'Vinyl', '', '', '12', '', ''],
  ['Sample Vendor B', 'Backlit Film', '', '', '12', '', ''],
  ['', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '']
]);
XLSX.utils.book_append_sheet(wb, wsVendors, '1. Vendor Invoices');

// Sheet 2: Machine Costs
const wsMachines = XLSX.utils.aoa_to_sheet([
  ['Machine Costs (CapEx) Data Collection'],
  ['Enter the pre-GST cost and applicable GST rate for each machine/item.'],
  [],
  ['Machine / Item Name', 'Pre-GST Cost (Rs)', 'GST Rate (%)'],
  ['Eco-Solvent Printer', '', '18'],
  ['UV Flatbed Printer', '', '18'],
  ['Vinyl Cutter / Plotter', '', '18'],
  ['Cold Laminator', '', '18'],
  ['Computer / RIP Software', '', '18'],
  ['Installation & Commissioning', '', '0'],
  ['First-Year AMC', '', '18'],
  ['Civil / Infrastructure Work', '', '0'],
  ['Other Equipment / Accessories', '', '18'],
  ['', '', '']
]);
XLSX.utils.book_append_sheet(wb, wsMachines, '2. Machine Costs');

// Sheet 3: Ink & Media
const wsInkMedia = XLSX.utils.aoa_to_sheet([
  ['Ink & Media Costs Data Collection'],
  ['Enter the price per unit. For inks, enter the coverage/yield per litre.'],
  [],
  ['Consumable Name', 'Unit (litre/sq.m)', 'Price per Unit (Rs)', 'Coverage/Yield (optional)'],
  ['Eco-Solvent Ink', 'litre', '', '27.5'],
  ['UV-Curable Ink', 'litre', '', '17.5'],
  ['Flex / Frontlit Banner', 'sq.m', '', ''],
  ['Self-Adhesive Vinyl', 'sq.m', '', ''],
  ['Backlit Film', 'sq.m', '', ''],
  ['Cold Laminate Film', 'sq.m', '', '0.6'],
  ['Cleaning Solution', 'litre', '', '0.5'],
  ['Foam Board', 'sq.m', '', ''],
  ['', '', '', '']
]);
XLSX.utils.book_append_sheet(wb, wsInkMedia, '3. Ink & Media');

// Sheet 4: Electricity
const wsElectricity = XLSX.utils.aoa_to_sheet([
  ['Electricity Costs Data Collection'],
  [],
  ['Global Parameters', 'Value'],
  ['KSEB Commercial Tariff (Rs/kWh)', '7.50'],
  ['Working Days per Month', '26'],
  [],
  ['Machine / Area', 'Power (kW)', 'Daily Usage (Hours)'],
  ['Eco-Solvent Printer', '2.0', '6'],
  ['UV Flatbed Printer', '3.5', '4'],
  ['Vinyl Cutter', '0.5', '4'],
  ['Cold Laminator', '1.0', '3'],
  ['Computers & Peripherals', '0.8', '8'],
  ['Lighting & Misc', '1.5', '8'],
  ['', '', '']
]);
XLSX.utils.book_append_sheet(wb, wsElectricity, '4. Electricity');

// Sheet 5: Staff
const wsStaff = XLSX.utils.aoa_to_sheet([
  ['Staff & Maintenance Data Collection'],
  [],
  ['Role', 'Gross Salary per Month (Rs)', 'Headcount'],
  ['Production Supervisor', '', '1'],
  ['Machine Operator (Eco/UV)', '', '1'],
  ['Machine Operator / Finishing', '', '1'],
  ['Helper / Production Assistant', '', '1'],
  ['', '', ''],
  ['Annual Maintenance Contract (AMC)', '']
]);
XLSX.utils.book_append_sheet(wb, wsStaff, '5. Staff Costs');

// Sheet 6: Model Assumptions
const wsAssumptions = XLSX.utils.aoa_to_sheet([
  ['Financial Model Assumptions'],
  [],
  ['Parameter', 'Value'],
  ['Annual Production Volume (sq.ft)', '8000'],
  ['Discount Rate (%)', '12'],
  ['Residual Value of Machines (%)', '15']
]);
XLSX.utils.book_append_sheet(wb, wsAssumptions, '6. Assumptions');

// Styling (Column Widths)
wsVendors['!cols'] = [{wch: 25}, {wch: 25}, {wch: 20}, {wch: 20}, {wch: 15}, {wch: 35}, {wch: 20}];
wsMachines['!cols'] = [{wch: 35}, {wch: 20}, {wch: 15}];
wsInkMedia['!cols'] = [{wch: 30}, {wch: 20}, {wch: 20}, {wch: 25}];
wsElectricity['!cols'] = [{wch: 30}, {wch: 15}, {wch: 20}];
wsStaff['!cols'] = [{wch: 35}, {wch: 30}, {wch: 15}];
wsAssumptions['!cols'] = [{wch: 35}, {wch: 20}];

XLSX.writeFile(wb, 'GDMR_Data_Collection_Template.xlsx');
console.log("Excel template generated successfully.");
