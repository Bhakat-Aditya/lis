/**
 * Standard Clinical Catalog Fallbacks for New Life Care Midnapore
 * Provides medically accurate reference defaults when upstream is cold or rate-limited.
 */

export const DEFAULT_SAMPLES = [
  { Status: 'Active', status: 'Active', 'Sample Id': '1', id: '1', Name: 'Serum', name: 'Serum' },
  { Status: 'Active', status: 'Active', 'Sample Id': '2', id: '2', Name: 'EDTA Whole Blood', name: 'EDTA Whole Blood' },
  { Status: 'Active', status: 'Active', 'Sample Id': '3', id: '3', Name: 'Fluoride Plasma', name: 'Fluoride Plasma' },
  { Status: 'Active', status: 'Active', 'Sample Id': '4', id: '4', Name: 'Citrate Plasma', name: 'Citrate Plasma' },
  { Status: 'Active', status: 'Active', 'Sample Id': '5', id: '5', Name: 'Urine', name: 'Urine' },
  { Status: 'Active', status: 'Active', 'Sample Id': '6', id: '6', Name: 'Stool', name: 'Stool' },
  { Status: 'Active', status: 'Active', 'Sample Id': '7', id: '7', Name: 'Semen', name: 'Semen' },
  { Status: 'Active', status: 'Active', 'Sample Id': '8', id: '8', Name: 'CSF', name: 'CSF' },
  { Status: 'Active', status: 'Active', 'Sample Id': '9', id: '9', Name: 'Body Fluid', name: 'Body Fluid' },
  { Status: 'Active', status: 'Active', 'Sample Id': '10', id: '10', Name: 'Synovial Fluid', name: 'Synovial Fluid' },
  { Status: 'Active', status: 'Active', 'Sample Id': '11', id: '11', Name: 'Ascitic Fluid', name: 'Ascitic Fluid' },
  { Status: 'Active', status: 'Active', 'Sample Id': '12', id: '12', Name: 'Pleural Fluid', name: 'Pleural Fluid' },
  { Status: 'Active', status: 'Active', 'Sample Id': '13', id: '13', Name: 'Swab / Pus', name: 'Swab / Pus' },
  { Status: 'Active', status: 'Active', 'Sample Id': '14', id: '14', Name: 'Tissue / Biopsy', name: 'Tissue / Biopsy' },
];

export const DEFAULT_TEMPLATES = [
  { addDuplicate: true, TEMPLATE_NAME: 'URINE EXAMINATION', reportId: 'P14R1', patientId: 'P14', name: 'URINE EXAMINATION', templatesId: 'T1', templatesDate: '2026-11-01', status: 'Active', price: '150', Rate: '150', price1: '', price2: '', Rate1: '', Rate2: '' },
  { addDuplicate: true, TEMPLATE_NAME: 'URINE EXAMINATION - COMPLETE', reportId: 'P14R2', patientId: 'P14', name: 'URINE EXAMINATION - COMPLETE', templatesId: 'T2', templatesDate: '2026-11-01', status: 'Active', price: '200', Rate: '200', price1: '', price2: '', Rate1: '', Rate2: '' },
  { addDuplicate: true, TEMPLATE_NAME: 'STOOL EXAMINATION', reportId: 'P14R3', patientId: 'P14', name: 'STOOL EXAMINATION', templatesId: 'T3', templatesDate: '2026-11-01', status: 'Active', price: '120', Rate: '120', price1: '', price2: '', Rate1: '', Rate2: '' },
  { addDuplicate: true, TEMPLATE_NAME: 'ASCITIC FLUID EXAMINATION', reportId: 'P14R4', patientId: 'P14', name: 'ASCITIC FLUID EXAMINATION', templatesId: 'T4', templatesDate: '2026-11-01', status: 'Active', price: '450', Rate: '450', price1: '', price2: '', Rate1: '', Rate2: '' },
  { addDuplicate: true, TEMPLATE_NAME: 'SYNOVIAL FLUID EXAMINATION', reportId: 'P14R5', patientId: 'P14', name: 'SYNOVIAL FLUID EXAMINATION', templatesId: 'T5', templatesDate: '2026-11-01', status: 'Active', price: '450', Rate: '450', price1: '', price2: '', Rate1: '', Rate2: '' },
  { addDuplicate: true, TEMPLATE_NAME: 'PLEURAL/PERITONEAL/PERICARDIAL/BODY FLUID ANALYSIS REPORT', reportId: 'P14R6', patientId: 'P14', name: 'BIOCHEMISTRY TESTS', templatesId: 'T6', templatesDate: '2026-10-13', status: 'Active', price: '500', Rate: '500', price1: '', price2: '', Rate1: '', Rate2: '' },
  { addDuplicate: true, TEMPLATE_NAME: 'CSF', reportId: 'P14R7', patientId: 'P14', name: 'CSF', templatesId: 'T7', templatesDate: '2026-11-01', status: 'Active', price: '550', Rate: '550', price1: '', price2: '', Rate1: '', Rate2: '' },
  { addDuplicate: true, TEMPLATE_NAME: 'COMPLETE BLOOD COUNT', reportId: 'P14R8', patientId: 'P14', name: 'COMPLETE BLOOD COUNT', templatesId: 'T8', templatesDate: '2026-11-01', status: 'Active', price: '350', Rate: '350', price1: '', price2: '', Rate1: '', Rate2: '' },
  { addDuplicate: true, TEMPLATE_NAME: 'HISTOPATHOLOGY', reportId: 'P14R9', patientId: 'P14', name: 'HISTOPATHOLOGY', templatesId: 'T9', templatesDate: '2026-11-01', status: 'Active', price: '800', Rate: '800', price1: '', price2: '', Rate1: '', Rate2: '' },
  { addDuplicate: true, TEMPLATE_NAME: 'FNAC - ', reportId: 'P14R10', patientId: 'P14', name: 'FNAC - ', templatesId: 'T10', templatesDate: '2026-11-01', status: 'Active', price: '600', Rate: '600', price1: '', price2: '', Rate1: '', Rate2: '' },
  { addDuplicate: true, TEMPLATE_NAME: 'BACTERIOLOGY REPORT', reportId: 'P14R11', patientId: 'P14', name: 'BIOCHEMISTRY TESTS', templatesId: 'T11', templatesDate: '2026-10-13', status: 'Active', price: '400', Rate: '400', price1: '', price2: '', Rate1: '', Rate2: '' },
  { addDuplicate: true, TEMPLATE_NAME: 'SEMEN ANALYSIS', reportId: 'P14R12', patientId: 'P14', name: 'SEMEN ANALYSIS', templatesId: 'T12', templatesDate: '2026-11-01', status: 'Active', price: '300', Rate: '300', price1: '', price2: '', Rate1: '', Rate2: '' },
  { addDuplicate: true, TEMPLATE_NAME: 'Blank', reportId: 'P14R13', patientId: 'P14', name: 'Blank Template', templatesId: 'T13', templatesDate: '2026-11-01', status: 'Active', price: '100', Rate: '100', price1: '', price2: '', Rate1: '', Rate2: '' },
  { addDuplicate: false, TEMPLATE_NAME: 'HBA1C REPORT', reportId: 'P14R14', patientId: 'P14', name: 'BIOCHEMISTRY TESTS', templatesId: 'T14', templatesDate: '2026-10-09', status: 'Active', price: '400', Rate: '400', price1: '', price2: '', Rate1: '', Rate2: '' },
  { addDuplicate: true, TEMPLATE_NAME: 'PASS REPORT', reportId: 'P14R15', patientId: 'P14', name: 'BIOCHEMISTRY TESTS', templatesId: 'T15', templatesDate: '2026-10-13', status: 'Active', price: '150', Rate: '150', price1: '', price2: '', Rate1: '', Rate2: '' },
];

export const DEFAULT_DEPARTMENTS = [
  { 'Dept Id': '1', id: '1', Name: 'Hematology', name: 'Hematology', 'Short Name': 'HEMA', shortName: 'HEMA', Status: 'Active', status: 'Active' },
  { 'Dept Id': '2', id: '2', Name: 'Biochemistry', name: 'Biochemistry', 'Short Name': 'BIO', shortName: 'BIO', Status: 'Active', status: 'Active' },
  { 'Dept Id': '3', id: '3', Name: 'Clinical Pathology', name: 'Clinical Pathology', 'Short Name': 'CPATH', shortName: 'CPATH', Status: 'Active', status: 'Active' },
  { 'Dept Id': '4', id: '4', Name: 'Serology & Immunology', name: 'Serology & Immunology', 'Short Name': 'SERO', shortName: 'SERO', Status: 'Active', status: 'Active' },
  { 'Dept Id': '5', id: '5', Name: 'Microbiology', name: 'Microbiology', 'Short Name': 'MICRO', shortName: 'MICRO', Status: 'Active', status: 'Active' },
  { 'Dept Id': '6', id: '6', Name: 'Histopathology', name: 'Histopathology', 'Short Name': 'HISTO', shortName: 'HISTO', Status: 'Active', status: 'Active' },
  { 'Dept Id': '7', id: '7', Name: 'Cytology', name: 'Cytology', 'Short Name': 'CYTO', shortName: 'CYTO', Status: 'Active', status: 'Active' },
  { 'Dept Id': '8', id: '8', Name: 'Coagulation', name: 'Coagulation', 'Short Name': 'COAG', shortName: 'COAG', Status: 'Active', status: 'Active' },
  { 'Dept Id': '9', id: '9', Name: 'Endocrinology & Hormones', name: 'Endocrinology & Hormones', 'Short Name': 'ENDO', shortName: 'ENDO', Status: 'Active', status: 'Active' },
  { 'Dept Id': '10', id: '10', Name: 'Molecular Biology', name: 'Molecular Biology', 'Short Name': 'MOL', shortName: 'MOL', Status: 'Active', status: 'Active' },
];

export const DEFAULT_UNITS = [
  { 'Unit Id': '1', id: '1', Name: 'g/dL', name: 'g/dL', Status: 'Active', status: 'Active' },
  { 'Unit Id': '2', id: '2', Name: 'mg/dL', name: 'mg/dL', Status: 'Active', status: 'Active' },
  { 'Unit Id': '3', id: '3', Name: '%', name: '%', Status: 'Active', status: 'Active' },
  { 'Unit Id': '4', id: '4', Name: '/cumm', name: '/cumm', Status: 'Active', status: 'Active' },
  { 'Unit Id': '5', id: '5', Name: 'fl', name: 'fl', Status: 'Active', status: 'Active' },
  { 'Unit Id': '6', id: '6', Name: 'pg', name: 'pg', Status: 'Active', status: 'Active' },
  { 'Unit Id': '7', id: '7', Name: 'U/L', name: 'U/L', Status: 'Active', status: 'Active' },
  { 'Unit Id': '8', id: '8', Name: 'mIU/L', name: 'mIU/L', Status: 'Active', status: 'Active' },
  { 'Unit Id': '9', id: '9', Name: 'ng/mL', name: 'ng/mL', Status: 'Active', status: 'Active' },
  { 'Unit Id': '10', id: '10', Name: 'µg/dL', name: 'µg/dL', Status: 'Active', status: 'Active' },
  { 'Unit Id': '11', id: '11', Name: 'mmol/L', name: 'mmol/L', Status: 'Active', status: 'Active' },
  { 'Unit Id': '12', id: '12', Name: 'mm/1st hr', name: 'mm/1st hr', Status: 'Active', status: 'Active' },
  { 'Unit Id': '13', id: '13', Name: 'Seconds', name: 'Seconds', Status: 'Active', status: 'Active' },
  { 'Unit Id': '14', id: '14', Name: 'Ratio', name: 'Ratio', Status: 'Active', status: 'Active' },
  { 'Unit Id': '15', id: '15', Name: 'Titre', name: 'Titre', Status: 'Active', status: 'Active' },
  { 'Unit Id': '16', id: '16', Name: '/HPF', name: '/HPF', Status: 'Active', status: 'Active' },
  { 'Unit Id': '17', id: '17', Name: '/LPF', name: '/LPF', Status: 'Active', status: 'Active' },
  { 'Unit Id': '18', id: '18', Name: 'Index', name: 'Index', Status: 'Active', status: 'Active' },
  { 'Unit Id': '19', id: '19', Name: 'mEq/L', name: 'mEq/L', Status: 'Active', status: 'Active' },
  { 'Unit Id': '20', id: '20', Name: 'million/cumm', name: 'million/cumm', Status: 'Active', status: 'Active' },
];

export const DEFAULT_METHODS = [
  { 'Method Id': '1', id: '1', Name: 'Automated 5-Part Cell Counter', name: 'Automated 5-Part Cell Counter', Status: 'Active', status: 'Active' },
  { 'Method Id': '2', id: '2', Name: 'GOD-POD Enzymatic', name: 'GOD-POD Enzymatic', Status: 'Active', status: 'Active' },
  { 'Method Id': '3', id: '3', Name: 'Hexokinase', name: 'Hexokinase', Status: 'Active', status: 'Active' },
  { 'Method Id': '4', id: '4', Name: 'Modified Jaffe Kinetic', name: 'Modified Jaffe Kinetic', Status: 'Active', status: 'Active' },
  { 'Method Id': '5', id: '5', Name: 'IFCC UV Kinetic', name: 'IFCC UV Kinetic', Status: 'Active', status: 'Active' },
  { 'Method Id': '6', id: '6', Name: 'Biuret Colorimetric', name: 'Biuret Colorimetric', Status: 'Active', status: 'Active' },
  { 'Method Id': '7', id: '7', Name: 'BCG Dye Binding', name: 'BCG Dye Binding', Status: 'Active', status: 'Active' },
  { 'Method Id': '8', id: '8', Name: 'CHOD-PAP Enzymatic', name: 'CHOD-PAP Enzymatic', Status: 'Active', status: 'Active' },
  { 'Method Id': '9', id: '9', Name: 'CLIA (Chemiluminescence)', name: 'CLIA (Chemiluminescence)', Status: 'Active', status: 'Active' },
  { 'Method Id': '10', id: '10', Name: 'HPLC (High Performance Liquid Chromatography)', name: 'HPLC (High Performance Liquid Chromatography)', Status: 'Active', status: 'Active' },
  { 'Method Id': '11', id: '11', Name: 'Immunoturbidimetry', name: 'Immunoturbidimetry', Status: 'Active', status: 'Active' },
  { 'Method Id': '12', id: '12', Name: 'Direct Microscopy', name: 'Direct Microscopy', Status: 'Active', status: 'Active' },
  { 'Method Id': '13', id: '13', Name: 'Slide Agglutination', name: 'Slide Agglutination', Status: 'Active', status: 'Active' },
  { 'Method Id': '14', id: '14', Name: 'Automated Optical Coagulometry', name: 'Automated Optical Coagulometry', Status: 'Active', status: 'Active' },
  { 'Method Id': '15', id: '15', Name: 'ISE (Ion Selective Electrode)', name: 'ISE (Ion Selective Electrode)', Status: 'Active', status: 'Active' },
];

export const DEFAULT_DOCTORS = [
  { 'Doct Id': '1', id: '1', Name: 'Dr. S. K. Mahapatra', name: 'Dr. S. K. Mahapatra', Deg: 'MBBS, MD (Pathology)', Contact: '9832100001', Rate: '0', Type: 'P', Status: 'Active', status: 'Active' },
  { 'Doct Id': '2', id: '2', Name: 'Dr. Ananya Roy', name: 'Dr. Ananya Roy', Deg: 'MBBS, MD (Biochemistry)', Contact: '9832100002', Rate: '0', Type: 'P', Status: 'Active', status: 'Active' },
  { 'Doct Id': '3', id: '3', Name: 'Dr. Bikram Das', name: 'Dr. Bikram Das', Deg: 'MBBS, MD (Microbiology)', Contact: '9832100003', Rate: '0', Type: 'P', Status: 'Active', status: 'Active' },
  { 'Doct Id': '4', id: '4', Name: 'Dr. Debabrata Sen', name: 'Dr. Debabrata Sen', Deg: 'MBBS, MD (Medicine)', Contact: '9832100004', Rate: '0', Type: 'P', Status: 'Active', status: 'Active' },
  { 'Doct Id': '5', id: '5', Name: 'Dr. R. N. Mukherjee', name: 'Dr. R. N. Mukherjee', Deg: 'MBBS, MS (Surgery)', Contact: '9832100005', Rate: '0', Type: 'P', Status: 'Active', status: 'Active' },
  { 'Doct Id': '6', id: '6', Name: 'Self Referral / OPD Desk', name: 'Self Referral / OPD Desk', Deg: 'OPD Reception', Contact: '03222-265100', Rate: '0', Type: 'P', Status: 'Active', status: 'Active' },
];

export const DEFAULT_BRANCHES = [
  { 'Branch Id': '1', id: '1', Name: 'New Life Care Main Diagnostic Lab', name: 'New Life Care Main Diagnostic Lab', Location: 'Hospital Road, Midnapore Town', Contact: '03222-265100', Status: 'Active', status: 'Active' },
  { 'Branch Id': '2', id: '2', Name: 'New Life Care Collection Center - Station Road', name: 'New Life Care Collection Center - Station Road', Location: 'Station Road, Midnapore', Contact: '03222-265101', Status: 'Active', status: 'Active' },
];

export const DEFAULT_REFERANCES = [
  { 'Refer Id': '1', id: '1', Name: 'Direct Walk-in Patient', name: 'Direct Walk-in Patient', Address: 'Midnapore', Contact: '', Rate: '0', Type: 'P', Status: 'Active', status: 'Active' },
  { 'Refer Id': '2', id: '2', Name: 'Life Care Health Camp', name: 'Life Care Health Camp', Address: 'Midnapore Rural', Contact: '', Rate: '0', Type: 'P', Status: 'Active', status: 'Active' },
];

export const DEFAULT_USERS = [
  { UserId: '1', id: '1', loginId: 'sandip', Name: 'Sandip Patra', Email: 'sandip@osplmail.in', Mobile: '8670207475', accessPermissionJson: '{"accessType":"Super"}', accessBranch: '1', Status: 'Active', status: 'Active' },
  { UserId: '2', id: '2', loginId: 'reception', Name: 'Reception Desk', Email: 'reception@newlifecare.com', Mobile: '9832100010', accessPermissionJson: '{"accessType":"Receptionist"}', accessBranch: '1', Status: 'Active', status: 'Active' },
  { UserId: '3', id: '3', loginId: 'technician', Name: 'Lab Technician', Email: 'lab@newlifecare.com', Mobile: '9832100011', accessPermissionJson: '{"accessType":"Technician"}', accessBranch: '1', Status: 'Active', status: 'Active' },
  { UserId: '4', id: '4', loginId: 'pathologist', Name: 'Chief Pathologist', Email: 'doctor@newlifecare.com', Mobile: '9832100012', accessPermissionJson: '{"accessType":"Doctor"}', accessBranch: '1', Status: 'Active', status: 'Active' },
  { UserId: '5', id: '5', loginId: 'setting', Name: 'Master Admin - Settings', Email: 'settings@newlifecare.com', Mobile: '9832100013', accessPermissionJson: '{"accessType":"Master Control - Setting"}', accessBranch: '1', Status: 'Active', status: 'Active' },
];

export const DEFAULT_TESTS = [
  // Hematology
  {
    'Test Id': '101', id: '101', Name: 'Hemoglobin (Hb)', name: 'Hemoglobin (Hb)', 'Short Name': 'Hb', shortName: 'Hb',
    'Dept Id': '1', deptId: '1', 'Sample Type': 'EDTA Whole Blood', sampleType: 'EDTA Whole Blood',
    'Method Id': '1', methodId: '1', 'Unit Id': '1', unitId: '1',
    Rate: '100', rate: '100', Status: 'Active', status: 'Active',
    rg0l: '13.0', rg0h: '17.0', rg1l: '12.0', rg1h: '15.0', rg2l: '11.0', rg2h: '14.0', rg3l: '13.5', rg3h: '19.5', rg4l: '11.0', rg4h: '14.0', rg5l: '11.0', rg5h: '14.0', rg6l: '11.0', rg6h: '14.0',
    Comment: 'Direct measurement via spectrophotometry.'
  },
  {
    'Test Id': '102', id: '102', Name: 'Total Leucocyte Count (TLC / WBC)', name: 'Total Leucocyte Count (TLC / WBC)', 'Short Name': 'TLC', shortName: 'TLC',
    'Dept Id': '1', deptId: '1', 'Sample Type': 'EDTA Whole Blood', sampleType: 'EDTA Whole Blood',
    'Method Id': '1', methodId: '1', 'Unit Id': '4', unitId: '4',
    Rate: '120', rate: '120', Status: 'Active', status: 'Active',
    rg0l: '4000', rg0h: '11000', rg1l: '4000', rg1h: '11000', rg2l: '5000', rg2h: '14000', rg3l: '6000', rg3h: '18000', rg4l: '4000', rg4h: '11000', rg5l: '4000', rg5h: '11000', rg6l: '4000', rg6h: '11000',
    Comment: 'Automated impedance cell counter.'
  },
  {
    'Test Id': '103', id: '103', Name: 'Neutrophils', name: 'Neutrophils', 'Short Name': 'Neutro', shortName: 'Neutro',
    'Dept Id': '1', deptId: '1', 'Sample Type': 'EDTA Whole Blood', sampleType: 'EDTA Whole Blood',
    'Method Id': '1', methodId: '1', 'Unit Id': '3', unitId: '3',
    Rate: '50', rate: '50', Status: 'Active', status: 'Active',
    rg0l: '40', rg0h: '75', rg1l: '40', rg1h: '75', rg2l: '30', rg2h: '60', rg3l: '25', rg3h: '55', rg4l: '40', rg4h: '75', rg5l: '40', rg5h: '75', rg6l: '40', rg6h: '75',
  },
  {
    'Test Id': '104', id: '104', Name: 'Lymphocytes', name: 'Lymphocytes', 'Short Name': 'Lympho', shortName: 'Lympho',
    'Dept Id': '1', deptId: '1', 'Sample Type': 'EDTA Whole Blood', sampleType: 'EDTA Whole Blood',
    'Method Id': '1', methodId: '1', 'Unit Id': '3', unitId: '3',
    Rate: '50', rate: '50', Status: 'Active', status: 'Active',
    rg0l: '20', rg0h: '45', rg1l: '20', rg1h: '45', rg2l: '30', rg2h: '60', rg3l: '35', rg3h: '65', rg4l: '20', rg4h: '45', rg5l: '20', rg5h: '45', rg6l: '20', rg6h: '45',
  },
  {
    'Test Id': '105', id: '105', Name: 'Eosinophils', name: 'Eosinophils', 'Short Name': 'Eosino', shortName: 'Eosino',
    'Dept Id': '1', deptId: '1', 'Sample Type': 'EDTA Whole Blood', sampleType: 'EDTA Whole Blood',
    'Method Id': '1', methodId: '1', 'Unit Id': '3', unitId: '3',
    Rate: '50', rate: '50', Status: 'Active', status: 'Active',
    rg0l: '1', rg0h: '6', rg1l: '1', rg1h: '6', rg2l: '1', rg2h: '5', rg3l: '1', rg3h: '4', rg4l: '1', rg4h: '6', rg5l: '1', rg5h: '6', rg6l: '1', rg6h: '6',
  },
  {
    'Test Id': '106', id: '106', Name: 'Monocytes', name: 'Monocytes', 'Short Name': 'Mono', shortName: 'Mono',
    'Dept Id': '1', deptId: '1', 'Sample Type': 'EDTA Whole Blood', sampleType: 'EDTA Whole Blood',
    'Method Id': '1', methodId: '1', 'Unit Id': '3', unitId: '3',
    Rate: '50', rate: '50', Status: 'Active', status: 'Active',
    rg0l: '2', rg0h: '10', rg1l: '2', rg1h: '10', rg2l: '2', rg2h: '8', rg3l: '2', rg3h: '9', rg4l: '2', rg4h: '10', rg5l: '2', rg5h: '10', rg6l: '2', rg6h: '10',
  },
  {
    'Test Id': '107', id: '107', Name: 'Basophils', name: 'Basophils', 'Short Name': 'Baso', shortName: 'Baso',
    'Dept Id': '1', deptId: '1', 'Sample Type': 'EDTA Whole Blood', sampleType: 'EDTA Whole Blood',
    'Method Id': '1', methodId: '1', 'Unit Id': '3', unitId: '3',
    Rate: '50', rate: '50', Status: 'Active', status: 'Active',
    rg0l: '0', rg0h: '1', rg1l: '0', rg1h: '1', rg2l: '0', rg2h: '1', rg3l: '0', rg3h: '1', rg4l: '0', rg4h: '1', rg5l: '0', rg5h: '1', rg6l: '0', rg6h: '1',
  },
  {
    'Test Id': '108', id: '108', Name: 'Platelet Count', name: 'Platelet Count', 'Short Name': 'PLT', shortName: 'PLT',
    'Dept Id': '1', deptId: '1', 'Sample Type': 'EDTA Whole Blood', sampleType: 'EDTA Whole Blood',
    'Method Id': '1', methodId: '1', 'Unit Id': '4', unitId: '4',
    Rate: '150', rate: '150', Status: 'Active', status: 'Active',
    rg0l: '150000', rg0h: '450000', rg1l: '150000', rg1h: '450000', rg2l: '150000', rg2h: '450000', rg3l: '150000', rg3h: '450000', rg4l: '150000', rg4h: '450000', rg5l: '150000', rg5h: '450000', rg6l: '150000', rg6h: '450000',
  },
  {
    'Test Id': '109', id: '109', Name: 'Total RBC Count', name: 'Total RBC Count', 'Short Name': 'RBC', shortName: 'RBC',
    'Dept Id': '1', deptId: '1', 'Sample Type': 'EDTA Whole Blood', sampleType: 'EDTA Whole Blood',
    'Method Id': '1', methodId: '1', 'Unit Id': '20', unitId: '20',
    Rate: '100', rate: '100', Status: 'Active', status: 'Active',
    rg0l: '4.5', rg0h: '6.0', rg1l: '3.8', rg1h: '5.2', rg2l: '3.8', rg2h: '5.4', rg3l: '4.0', rg3h: '6.5', rg4l: '4.5', rg4h: '6.0', rg5l: '4.5', rg5h: '6.0', rg6l: '4.5', rg6h: '6.0',
  },
  {
    'Test Id': '110', id: '110', Name: 'PCV / Hematocrit', name: 'PCV / Hematocrit', 'Short Name': 'PCV', shortName: 'PCV',
    'Dept Id': '1', deptId: '1', 'Sample Type': 'EDTA Whole Blood', sampleType: 'EDTA Whole Blood',
    'Method Id': '1', methodId: '1', 'Unit Id': '3', unitId: '3',
    Rate: '80', rate: '80', Status: 'Active', status: 'Active',
    rg0l: '40', rg0h: '50', rg1l: '36', rg1h: '46', rg2l: '32', rg2h: '42', rg3l: '44', rg3h: '62', rg4l: '40', rg4h: '50', rg5l: '40', rg5h: '50', rg6l: '40', rg6h: '50',
  },
  {
    'Test Id': '111', id: '111', Name: 'MCV (Mean Corpuscular Volume)', name: 'MCV (Mean Corpuscular Volume)', 'Short Name': 'MCV', shortName: 'MCV',
    'Dept Id': '1', deptId: '1', 'Sample Type': 'EDTA Whole Blood', sampleType: 'EDTA Whole Blood',
    'Method Id': '1', methodId: '1', 'Unit Id': '5', unitId: '5',
    Rate: '50', rate: '50', Status: 'Active', status: 'Active',
    rg0l: '80', rg0h: '100', rg1l: '80', rg1h: '100', rg2l: '75', rg2h: '90', rg3l: '95', rg3h: '115', rg4l: '80', rg4h: '100', rg5l: '80', rg5h: '100', rg6l: '80', rg6h: '100',
  },
  {
    'Test Id': '112', id: '112', Name: 'MCH (Mean Corpuscular Hemoglobin)', name: 'MCH (Mean Corpuscular Hemoglobin)', 'Short Name': 'MCH', shortName: 'MCH',
    'Dept Id': '1', deptId: '1', 'Sample Type': 'EDTA Whole Blood', sampleType: 'EDTA Whole Blood',
    'Method Id': '1', methodId: '1', 'Unit Id': '6', unitId: '6',
    Rate: '50', rate: '50', Status: 'Active', status: 'Active',
    rg0l: '27', rg0h: '32', rg1l: '27', rg1h: '32', rg2l: '24', rg2h: '30', rg3l: '30', rg3h: '36', rg4l: '27', rg4h: '32', rg5l: '27', rg5h: '32', rg6l: '27', rg6h: '32',
  },
  {
    'Test Id': '113', id: '113', Name: 'MCHC', name: 'MCHC', 'Short Name': 'MCHC', shortName: 'MCHC',
    'Dept Id': '1', deptId: '1', 'Sample Type': 'EDTA Whole Blood', sampleType: 'EDTA Whole Blood',
    'Method Id': '1', methodId: '1', 'Unit Id': '1', unitId: '1',
    Rate: '50', rate: '50', Status: 'Active', status: 'Active',
    rg0l: '31.5', rg0h: '35.0', rg1l: '31.5', rg1h: '35.0', rg2l: '30.0', rg2h: '34.0', rg3l: '30.0', rg3h: '36.0', rg4l: '31.5', rg4h: '35.0', rg5l: '31.5', rg5h: '35.0', rg6l: '31.5', rg6h: '35.0',
  },
  {
    'Test Id': '114', id: '114', Name: 'Erythrocyte Sedimentation Rate (ESR)', name: 'Erythrocyte Sedimentation Rate (ESR)', 'Short Name': 'ESR', shortName: 'ESR',
    'Dept Id': '1', deptId: '1', 'Sample Type': 'EDTA Whole Blood', sampleType: 'EDTA Whole Blood',
    'Method Id': '1', methodId: '1', 'Unit Id': '12', unitId: '12',
    Rate: '80', rate: '80', Status: 'Active', status: 'Active',
    rg0l: '0', rg0h: '15', rg1l: '0', rg1h: '20', rg2l: '0', rg2h: '10', rg3l: '0', rg3h: '5', rg4l: '0', rg4h: '15', rg5l: '0', rg5h: '15', rg6l: '0', rg6h: '15',
  },
  {
    'Test Id': '115', id: '115', Name: 'ABO & Rh Blood Group', name: 'ABO & Rh Blood Group', 'Short Name': 'Blood Group', shortName: 'Blood Group',
    'Dept Id': '1', deptId: '1', 'Sample Type': 'EDTA Whole Blood', sampleType: 'EDTA Whole Blood',
    'Method Id': '13', methodId: '13', 'Unit Id': '18', unitId: '18',
    Rate: '100', rate: '100', Status: 'Active', status: 'Active',
  },

  // Biochemistry - Glucose & Glycemic
  {
    'Test Id': '120', id: '120', Name: 'Fasting Blood Sugar (FBS)', name: 'Fasting Blood Sugar (FBS)', 'Short Name': 'FBS', shortName: 'FBS',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Fluoride Plasma', sampleType: 'Fluoride Plasma',
    'Method Id': '2', methodId: '2', 'Unit Id': '2', unitId: '2',
    Rate: '80', rate: '80', Status: 'Active', status: 'Active',
    rg0l: '70', rg0h: '100', rg1l: '70', rg1h: '100', rg2l: '70', rg2h: '100', rg3l: '60', rg3h: '100', rg4l: '70', rg4h: '100', rg5l: '70', rg5h: '100', rg6l: '70', rg6h: '100',
    Comment: 'Fasting of 8-12 hours required. Pre-diabetes: 100-125 mg/dL, Diabetes: >= 126 mg/dL.'
  },
  {
    'Test Id': '121', id: '121', Name: 'Post Prandial Blood Sugar (PPBS)', name: 'Post Prandial Blood Sugar (PPBS)', 'Short Name': 'PPBS', shortName: 'PPBS',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Fluoride Plasma', sampleType: 'Fluoride Plasma',
    'Method Id': '2', methodId: '2', 'Unit Id': '2', unitId: '2',
    Rate: '80', rate: '80', Status: 'Active', status: 'Active',
    rg0l: '70', rg0h: '140', rg1l: '70', rg1h: '140', rg2l: '70', rg2h: '140', rg3l: '70', rg3h: '140', rg4l: '70', rg4h: '140', rg5l: '70', rg5h: '140', rg6l: '70', rg6h: '140',
    Comment: 'Specimen collected 2 hours after starting meal.'
  },
  {
    'Test Id': '122', id: '122', Name: 'Random Blood Sugar (RBS)', name: 'Random Blood Sugar (RBS)', 'Short Name': 'RBS', shortName: 'RBS',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Fluoride Plasma', sampleType: 'Fluoride Plasma',
    'Method Id': '2', methodId: '2', 'Unit Id': '2', unitId: '2',
    Rate: '70', rate: '70', Status: 'Active', status: 'Active',
    rg0l: '70', rg0h: '140', rg1l: '70', rg1h: '140', rg2l: '70', rg2h: '140', rg3l: '70', rg3h: '140', rg4l: '70', rg4h: '140', rg5l: '70', rg5h: '140', rg6l: '70', rg6h: '140',
  },
  {
    'Test Id': '123', id: '123', Name: 'Glycated Hemoglobin (HbA1c)', name: 'Glycated Hemoglobin (HbA1c)', 'Short Name': 'HbA1c', shortName: 'HbA1c',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'EDTA Whole Blood', sampleType: 'EDTA Whole Blood',
    'Method Id': '10', methodId: '10', 'Unit Id': '3', unitId: '3',
    Rate: '400', rate: '400', Status: 'Active', status: 'Active',
    rg0l: '4.0', rg0h: '5.6', rg1l: '4.0', rg1h: '5.6', rg2l: '4.0', rg2h: '5.6', rg3l: '4.0', rg3h: '5.6', rg4l: '4.0', rg4h: '5.6', rg5l: '4.0', rg5h: '5.6', rg6l: '4.0', rg6h: '5.6',
    Comment: 'Non-diabetic: <5.7%, Pre-diabetic: 5.7 - 6.4%, Diabetic: >=6.5%.'
  },

  // Biochemistry - Liver Function Tests (LFT)
  {
    'Test Id': '130', id: '130', Name: 'Serum Bilirubin Total', name: 'Serum Bilirubin Total', 'Short Name': 'Bilirubin Total', shortName: 'Bilirubin Total',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '5', methodId: '5', 'Unit Id': '2', unitId: '2',
    Rate: '100', rate: '100', Status: 'Active', status: 'Active',
    rg0l: '0.2', rg0h: '1.2', rg1l: '0.2', rg1h: '1.2', rg2l: '0.2', rg2h: '1.0', rg3l: '0.2', rg3h: '12.0', rg4l: '0.2', rg4h: '1.2', rg5l: '0.2', rg5h: '1.2', rg6l: '0.2', rg6h: '1.2',
  },
  {
    'Test Id': '131', id: '131', Name: 'Serum Bilirubin Direct (Conjugated)', name: 'Serum Bilirubin Direct (Conjugated)', 'Short Name': 'Bilirubin Direct', shortName: 'Bilirubin Direct',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '5', methodId: '5', 'Unit Id': '2', unitId: '2',
    Rate: '80', rate: '80', Status: 'Active', status: 'Active',
    rg0l: '0.0', rg0h: '0.3', rg1l: '0.0', rg1h: '0.3', rg2l: '0.0', rg2h: '0.3', rg3l: '0.0', rg3h: '0.6', rg4l: '0.0', rg4h: '0.3', rg5l: '0.0', rg5h: '0.3', rg6l: '0.0', rg6h: '0.3',
  },
  {
    'Test Id': '132', id: '132', Name: 'Serum Bilirubin Indirect (Unconjugated)', name: 'Serum Bilirubin Indirect (Unconjugated)', 'Short Name': 'Bilirubin Indirect', shortName: 'Bilirubin Indirect',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '5', methodId: '5', 'Unit Id': '2', unitId: '2',
    Rate: '50', rate: '50', Status: 'Active', status: 'Active',
    rg0l: '0.1', rg0h: '0.9', rg1l: '0.1', rg1h: '0.9', rg2l: '0.1', rg2h: '0.8', rg3l: '0.1', rg3h: '11.4', rg4l: '0.1', rg4h: '0.9', rg5l: '0.1', rg5h: '0.9', rg6l: '0.1', rg6h: '0.9',
  },
  {
    'Test Id': '133', id: '133', Name: 'SGOT / AST (Aspartate Aminotransferase)', name: 'SGOT / AST (Aspartate Aminotransferase)', 'Short Name': 'SGOT', shortName: 'SGOT',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '5', methodId: '5', 'Unit Id': '7', unitId: '7',
    Rate: '120', rate: '120', Status: 'Active', status: 'Active',
    rg0l: '5', rg0h: '40', rg1l: '5', rg1h: '35', rg2l: '10', rg2h: '40', rg3l: '15', rg3h: '60', rg4l: '5', rg4h: '40', rg5l: '5', rg5h: '40', rg6l: '5', rg6h: '40',
  },
  {
    'Test Id': '134', id: '134', Name: 'SGPT / ALT (Alanine Aminotransferase)', name: 'SGPT / ALT (Alanine Aminotransferase)', 'Short Name': 'SGPT', shortName: 'SGPT',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '5', methodId: '5', 'Unit Id': '7', unitId: '7',
    Rate: '120', rate: '120', Status: 'Active', status: 'Active',
    rg0l: '7', rg0h: '56', rg1l: '7', rg1h: '45', rg2l: '10', rg2h: '40', rg3l: '10', rg3h: '50', rg4l: '7', rg4h: '56', rg5l: '7', rg5h: '56', rg6l: '7', rg6h: '56',
  },
  {
    'Test Id': '135', id: '135', Name: 'Alkaline Phosphatase (ALP)', name: 'Alkaline Phosphatase (ALP)', 'Short Name': 'ALP', shortName: 'ALP',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '5', methodId: '5', 'Unit Id': '7', unitId: '7',
    Rate: '120', rate: '120', Status: 'Active', status: 'Active',
    rg0l: '44', rg0h: '147', rg1l: '44', rg1h: '147', rg2l: '100', rg2h: '350', rg3l: '150', rg3h: '450', rg4l: '44', rg4h: '147', rg5l: '44', rg5h: '147', rg6l: '44', rg6h: '147',
  },
  {
    'Test Id': '136', id: '136', Name: 'Total Protein', name: 'Total Protein', 'Short Name': 'Total Protein', shortName: 'Total Protein',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '6', methodId: '6', 'Unit Id': '1', unitId: '1',
    Rate: '100', rate: '100', Status: 'Active', status: 'Active',
    rg0l: '6.4', rg0h: '8.3', rg1l: '6.4', rg1h: '8.3', rg2l: '6.0', rg2h: '8.0', rg3l: '5.2', rg3h: '7.8', rg4l: '6.4', rg4h: '8.3', rg5l: '6.4', rg5h: '8.3', rg6l: '6.4', rg6h: '8.3',
  },
  {
    'Test Id': '137', id: '137', Name: 'Serum Albumin', name: 'Serum Albumin', 'Short Name': 'Albumin', shortName: 'Albumin',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '7', methodId: '7', 'Unit Id': '1', unitId: '1',
    Rate: '100', rate: '100', Status: 'Active', status: 'Active',
    rg0l: '3.5', rg0h: '5.2', rg1l: '3.5', rg1h: '5.2', rg2l: '3.5', rg2h: '5.0', rg3l: '3.0', rg3h: '4.8', rg4l: '3.5', rg4h: '5.2', rg5l: '3.5', rg5h: '5.2', rg6l: '3.5', rg6h: '5.2',
  },
  {
    'Test Id': '138', id: '138', Name: 'Serum Globulin', name: 'Serum Globulin', 'Short Name': 'Globulin', shortName: 'Globulin',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '6', methodId: '6', 'Unit Id': '1', unitId: '1',
    Rate: '60', rate: '60', Status: 'Active', status: 'Active',
    rg0l: '2.0', rg0h: '3.5', rg1l: '2.0', rg1h: '3.5', rg2l: '2.0', rg2h: '3.5', rg3l: '1.8', rg3h: '3.2', rg4l: '2.0', rg4h: '3.5', rg5l: '2.0', rg5h: '3.5', rg6l: '2.0', rg6h: '3.5',
  },
  {
    'Test Id': '139', id: '139', Name: 'A:G Ratio', name: 'A:G Ratio', 'Short Name': 'A/G Ratio', shortName: 'A/G Ratio',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '6', methodId: '6', 'Unit Id': '14', unitId: '14',
    Rate: '40', rate: '40', Status: 'Active', status: 'Active',
    rg0l: '1.1', rg0h: '2.2', rg1l: '1.1', rg1h: '2.2', rg2l: '1.1', rg2h: '2.2', rg3l: '1.0', rg3h: '2.0', rg4l: '1.1', rg4h: '2.2', rg5l: '1.1', rg5h: '2.2', rg6l: '1.1', rg6h: '2.2',
  },

  // Biochemistry - Renal Function Tests (KFT / RFT)
  {
    'Test Id': '140', id: '140', Name: 'Blood Urea', name: 'Blood Urea', 'Short Name': 'Urea', shortName: 'Urea',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '5', methodId: '5', 'Unit Id': '2', unitId: '2',
    Rate: '100', rate: '100', Status: 'Active', status: 'Active',
    rg0l: '15', rg0h: '45', rg1l: '15', rg1h: '45', rg2l: '10', rg2h: '40', rg3l: '8', rg3h: '35', rg4l: '15', rg4h: '45', rg5l: '15', rg5h: '45', rg6l: '15', rg6h: '45',
  },
  {
    'Test Id': '141', id: '141', Name: 'Serum Creatinine', name: 'Serum Creatinine', 'Short Name': 'Creatinine', shortName: 'Creatinine',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '4', methodId: '4', 'Unit Id': '2', unitId: '2',
    Rate: '120', rate: '120', Status: 'Active', status: 'Active',
    rg0l: '0.7', rg0h: '1.3', rg1l: '0.5', rg1h: '1.1', rg2l: '0.3', rg2h: '0.8', rg3l: '0.2', rg3h: '0.5', rg4l: '0.7', rg4h: '1.3', rg5l: '0.7', rg5h: '1.3', rg6l: '0.7', rg6h: '1.3',
  },
  {
    'Test Id': '142', id: '142', Name: 'Serum Uric Acid', name: 'Serum Uric Acid', 'Short Name': 'Uric Acid', shortName: 'Uric Acid',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '5', methodId: '5', 'Unit Id': '2', unitId: '2',
    Rate: '120', rate: '120', Status: 'Active', status: 'Active',
    rg0l: '3.5', rg0h: '7.2', rg1l: '2.6', rg1h: '6.0', rg2l: '2.0', rg2h: '5.5', rg3l: '2.0', rg3h: '5.0', rg4l: '3.5', rg4h: '7.2', rg5l: '3.5', rg5h: '7.2', rg6l: '3.5', rg6h: '7.2',
  },
  {
    'Test Id': '143', id: '143', Name: 'Serum Sodium (Na+)', name: 'Serum Sodium (Na+)', 'Short Name': 'Sodium', shortName: 'Sodium',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '15', methodId: '15', 'Unit Id': '11', unitId: '11',
    Rate: '150', rate: '150', Status: 'Active', status: 'Active',
    rg0l: '135', rg0h: '145', rg1l: '135', rg1h: '145', rg2l: '135', rg2h: '145', rg3l: '133', rg3h: '146', rg4l: '135', rg4h: '145', rg5l: '135', rg5h: '145', rg6l: '135', rg6h: '145',
  },
  {
    'Test Id': '144', id: '144', Name: 'Serum Potassium (K+)', name: 'Serum Potassium (K+)', 'Short Name': 'Potassium', shortName: 'Potassium',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '15', methodId: '15', 'Unit Id': '11', unitId: '11',
    Rate: '150', rate: '150', Status: 'Active', status: 'Active',
    rg0l: '3.5', rg0h: '5.1', rg1l: '3.5', rg1h: '5.1', rg2l: '3.5', rg2h: '5.1', rg3l: '3.7', rg3h: '5.9', rg4l: '3.5', rg4h: '5.1', rg5l: '3.5', rg5h: '5.1', rg6l: '3.5', rg6h: '5.1',
  },
  {
    'Test Id': '145', id: '145', Name: 'Serum Chloride (Cl-)', name: 'Serum Chloride (Cl-)', 'Short Name': 'Chloride', shortName: 'Chloride',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '15', methodId: '15', 'Unit Id': '11', unitId: '11',
    Rate: '150', rate: '150', Status: 'Active', status: 'Active',
    rg0l: '98', rg0h: '107', rg1l: '98', rg1h: '107', rg2l: '98', rg2h: '107', rg3l: '96', rg3h: '110', rg4l: '98', rg4h: '107', rg5l: '98', rg5h: '107', rg6l: '98', rg6h: '107',
  },

  // Biochemistry - Lipid Profile
  {
    'Test Id': '150', id: '150', Name: 'Serum Cholesterol Total', name: 'Serum Cholesterol Total', 'Short Name': 'Total Cholesterol', shortName: 'Total Cholesterol',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '8', methodId: '8', 'Unit Id': '2', unitId: '2',
    Rate: '120', rate: '120', Status: 'Active', status: 'Active',
    rg0l: '125', rg0h: '200', rg1l: '125', rg1h: '200', rg2l: '120', rg2h: '190', rg3l: '100', rg3h: '180', rg4l: '125', rg4h: '200', rg5l: '125', rg5h: '200', rg6l: '125', rg6h: '200',
  },
  {
    'Test Id': '151', id: '151', Name: 'Serum Triglycerides', name: 'Serum Triglycerides', 'Short Name': 'Triglycerides', shortName: 'Triglycerides',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '8', methodId: '8', 'Unit Id': '2', unitId: '2',
    Rate: '150', rate: '150', Status: 'Active', status: 'Active',
    rg0l: '50', rg0h: '150', rg1l: '50', rg1h: '150', rg2l: '40', rg2h: '130', rg3l: '40', rg3h: '120', rg4l: '50', rg4h: '150', rg5l: '50', rg5h: '150', rg6l: '50', rg6h: '150',
  },
  {
    'Test Id': '152', id: '152', Name: 'HDL Cholesterol (Good)', name: 'HDL Cholesterol (Good)', 'Short Name': 'HDL', shortName: 'HDL',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '8', methodId: '8', 'Unit Id': '2', unitId: '2',
    Rate: '150', rate: '150', Status: 'Active', status: 'Active',
    rg0l: '40', rg0h: '60', rg1l: '50', rg1h: '70', rg2l: '40', rg2h: '65', rg3l: '35', rg3h: '65', rg4l: '40', rg4h: '60', rg5l: '40', rg5h: '60', rg6l: '40', rg6h: '60',
  },
  {
    'Test Id': '153', id: '153', Name: 'LDL Cholesterol (Bad)', name: 'LDL Cholesterol (Bad)', 'Short Name': 'LDL', shortName: 'LDL',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '8', methodId: '8', 'Unit Id': '2', unitId: '2',
    Rate: '120', rate: '120', Status: 'Active', status: 'Active',
    rg0l: '60', rg0h: '100', rg1l: '60', rg1h: '100', rg2l: '60', rg2h: '110', rg3l: '50', rg3h: '100', rg4l: '60', rg4h: '100', rg5l: '60', rg5h: '100', rg6l: '60', rg6h: '100',
  },
  {
    'Test Id': '154', id: '154', Name: 'VLDL Cholesterol', name: 'VLDL Cholesterol', 'Short Name': 'VLDL', shortName: 'VLDL',
    'Dept Id': '2', deptId: '2', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '8', methodId: '8', 'Unit Id': '2', unitId: '2',
    Rate: '60', rate: '60', Status: 'Active', status: 'Active',
    rg0l: '5', rg0h: '30', rg1l: '5', rg1h: '30', rg2l: '5', rg2h: '30', rg3l: '5', rg3h: '30', rg4l: '5', rg4h: '30', rg5l: '5', rg5h: '30', rg6l: '5', rg6h: '30',
  },

  // Thyroid Hormones
  {
    'Test Id': '160', id: '160', Name: 'Thyroid Stimulating Hormone (TSH - Ultrasensitive)', name: 'Thyroid Stimulating Hormone (TSH - Ultrasensitive)', 'Short Name': 'TSH', shortName: 'TSH',
    'Dept Id': '9', deptId: '9', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '9', methodId: '9', 'Unit Id': '8', unitId: '8',
    Rate: '200', rate: '200', Status: 'Active', status: 'Active',
    rg0l: '0.35', rg0h: '4.94', rg1l: '0.35', rg1h: '4.94', rg2l: '0.7', rg2h: '6.4', rg3l: '1.0', rg3h: '9.0', rg4l: '0.35', rg4h: '4.94', rg5l: '0.35', rg5h: '4.94', rg6l: '0.35', rg6h: '4.94',
  },
  {
    'Test Id': '161', id: '161', Name: 'Total Triiodothyronine (T3)', name: 'Total Triiodothyronine (T3)', 'Short Name': 'Total T3', shortName: 'Total T3',
    'Dept Id': '9', deptId: '9', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '9', methodId: '9', 'Unit Id': '9', unitId: '9',
    Rate: '180', rate: '180', Status: 'Active', status: 'Active',
    rg0l: '0.8', rg0h: '2.0', rg1l: '0.8', rg1h: '2.0', rg2l: '0.9', rg2h: '2.5', rg3l: '1.0', rg3h: '3.0', rg4l: '0.8', rg4h: '2.0', rg5l: '0.8', rg5h: '2.0', rg6l: '0.8', rg6h: '2.0',
  },
  {
    'Test Id': '162', id: '162', Name: 'Total Thyroxine (T4)', name: 'Total Thyroxine (T4)', 'Short Name': 'Total T4', shortName: 'Total T4',
    'Dept Id': '9', deptId: '9', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '9', methodId: '9', 'Unit Id': '10', unitId: '10',
    Rate: '180', rate: '180', Status: 'Active', status: 'Active',
    rg0l: '5.1', rg0h: '14.1', rg1l: '5.1', rg1h: '14.1', rg2l: '6.0', rg2h: '15.0', rg3l: '8.0', rg3h: '18.0', rg4l: '5.1', rg4h: '14.1', rg5l: '5.1', rg5h: '14.1', rg6l: '5.1', rg6h: '14.1',
  },

  // Serology & Immunology
  {
    'Test Id': '170', id: '170', Name: 'C-Reactive Protein (CRP) Quantitative', name: 'C-Reactive Protein (CRP) Quantitative', 'Short Name': 'CRP', shortName: 'CRP',
    'Dept Id': '4', deptId: '4', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '11', methodId: '11', 'Unit Id': '2', unitId: '2',
    Rate: '300', rate: '300', Status: 'Active', status: 'Active',
    rg0l: '0.0', rg0h: '6.0', rg1l: '0.0', rg1h: '6.0', rg2l: '0.0', rg2h: '6.0', rg3l: '0.0', rg3h: '6.0', rg4l: '0.0', rg4h: '6.0', rg5l: '0.0', rg5h: '6.0', rg6l: '0.0', rg6h: '6.0',
  },
  {
    'Test Id': '171', id: '171', Name: 'Widal Slide Agglutination Test', name: 'Widal Slide Agglutination Test', 'Short Name': 'Widal', shortName: 'Widal',
    'Dept Id': '4', deptId: '4', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '13', methodId: '13', 'Unit Id': '15', unitId: '15',
    Rate: '150', rate: '150', Status: 'Active', status: 'Active',
  },
  {
    'Test Id': '172', id: '172', Name: 'Dengue NS1 Antigen (Rapid)', name: 'Dengue NS1 Antigen (Rapid)', 'Short Name': 'Dengue NS1', shortName: 'Dengue NS1',
    'Dept Id': '4', deptId: '4', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '13', methodId: '13', 'Unit Id': '18', unitId: '18',
    Rate: '450', rate: '450', Status: 'Active', status: 'Active',
  },
  {
    'Test Id': '173', id: '173', Name: 'Dengue IgM & IgG Antibodies', name: 'Dengue IgM & IgG Antibodies', 'Short Name': 'Dengue Ab', shortName: 'Dengue Ab',
    'Dept Id': '4', deptId: '4', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '13', methodId: '13', 'Unit Id': '18', unitId: '18',
    Rate: '600', rate: '600', Status: 'Active', status: 'Active',
  },
  {
    'Test Id': '174', id: '174', Name: 'Malaria Antigen (Pv / Pf)', name: 'Malaria Antigen (Pv / Pf)', 'Short Name': 'Malaria Ag', shortName: 'Malaria Ag',
    'Dept Id': '4', deptId: '4', 'Sample Type': 'EDTA Whole Blood', sampleType: 'EDTA Whole Blood',
    'Method Id': '13', methodId: '13', 'Unit Id': '18', unitId: '18',
    Rate: '250', rate: '250', Status: 'Active', status: 'Active',
  },
  {
    'Test Id': '175', id: '175', Name: 'Typhidot IgM & IgG', name: 'Typhidot IgM & IgG', 'Short Name': 'Typhidot', shortName: 'Typhidot',
    'Dept Id': '4', deptId: '4', 'Sample Type': 'Serum', sampleType: 'Serum',
    'Method Id': '13', methodId: '13', 'Unit Id': '18', unitId: '18',
    Rate: '350', rate: '350', Status: 'Active', status: 'Active',
  },

  // Coagulation
  {
    'Test Id': '180', id: '180', Name: 'Prothrombin Time with INR (PT / INR)', name: 'Prothrombin Time with INR (PT / INR)', 'Short Name': 'PT/INR', shortName: 'PT/INR',
    'Dept Id': '8', deptId: '8', 'Sample Type': 'Citrate Plasma', sampleType: 'Citrate Plasma',
    'Method Id': '14', methodId: '14', 'Unit Id': '13', unitId: '13',
    Rate: '250', rate: '250', Status: 'Active', status: 'Active',
    rg0l: '11.0', rg0h: '14.5', rg1l: '11.0', rg1h: '14.5', rg2l: '11.0', rg2h: '14.5', rg3l: '11.0', rg3h: '15.0', rg4l: '11.0', rg4h: '14.5', rg5l: '11.0', rg5h: '14.5', rg6l: '11.0', rg6h: '14.5',
    Comment: 'INR Therapeutic range: 2.0 - 3.0 (Oral Anticoagulant Therapy).'
  },
  {
    'Test Id': '181', id: '181', Name: 'Activated Partial Thromboplastin Time (APTT)', name: 'Activated Partial Thromboplastin Time (APTT)', 'Short Name': 'APTT', shortName: 'APTT',
    'Dept Id': '8', deptId: '8', 'Sample Type': 'Citrate Plasma', sampleType: 'Citrate Plasma',
    'Method Id': '14', methodId: '14', 'Unit Id': '13', unitId: '13',
    Rate: '300', rate: '300', Status: 'Active', status: 'Active',
    rg0l: '26.0', rg0h: '38.0', rg1l: '26.0', rg1h: '38.0', rg2l: '26.0', rg2h: '38.0', rg3l: '26.0', rg3h: '42.0', rg4l: '26.0', rg4h: '38.0', rg5l: '26.0', rg5h: '38.0', rg6l: '26.0', rg6h: '38.0',
  },
];

export const DEFAULT_PROFILES = [
  {
    'Profile Id': '1', id: '1',
    Name: 'Complete Blood Count (CBC Profile)', name: 'Complete Blood Count (CBC Profile)',
    'Dept Id': '1', deptId: '1',
    Rate: '350', rate: '350', Status: 'Active', status: 'Active',
    'Test Id List': '101,102,103,104,105,106,107,108,109,110,111,112,113,114',
  },
  {
    'Profile Id': '2', id: '2',
    Name: 'Liver Function Test (LFT Comprehensive)', name: 'Liver Function Test (LFT Comprehensive)',
    'Dept Id': '2', deptId: '2',
    Rate: '650', rate: '650', Status: 'Active', status: 'Active',
    'Test Id List': '130,131,132,133,134,135,136,137,138,139',
  },
  {
    'Profile Id': '3', id: '3',
    Name: 'Kidney / Renal Function Test (KFT / RFT with Electrolytes)', name: 'Kidney / Renal Function Test (KFT / RFT with Electrolytes)',
    'Dept Id': '2', deptId: '2',
    Rate: '650', rate: '650', Status: 'Active', status: 'Active',
    'Test Id List': '140,141,142,143,144,145',
  },
  {
    'Profile Id': '4', id: '4',
    Name: 'Lipid Profile (Full Heart Health Panel)', name: 'Lipid Profile (Full Heart Health Panel)',
    'Dept Id': '2', deptId: '2',
    Rate: '550', rate: '550', Status: 'Active', status: 'Active',
    'Test Id List': '150,151,152,153,154',
  },
  {
    'Profile Id': '5', id: '5',
    Name: 'Thyroid Function Profile (T3, T4, TSH Panel)', name: 'Thyroid Function Profile (T3, T4, TSH Panel)',
    'Dept Id': '9', deptId: '9',
    Rate: '450', rate: '450', Status: 'Active', status: 'Active',
    'Test Id List': '160,161,162',
  },
  {
    'Profile Id': '6', id: '6',
    Name: 'Diabetic Assessment Profile', name: 'Diabetic Assessment Profile',
    'Dept Id': '2', deptId: '2',
    Rate: '500', rate: '500', Status: 'Active', status: 'Active',
    'Test Id List': '120,121,123',
  },
  {
    'Profile Id': '7', id: '7',
    Name: 'Acute Fever Workup Panel', name: 'Acute Fever Workup Panel',
    'Dept Id': '4', deptId: '4',
    Rate: '850', rate: '850', Status: 'Active', status: 'Active',
    'Test Id List': '101,102,114,170,171,172,174',
  },
  {
    'Profile Id': '8', id: '8',
    Name: 'Coagulation Screening Panel', name: 'Coagulation Screening Panel',
    'Dept Id': '8', deptId: '8',
    Rate: '500', rate: '500', Status: 'Active', status: 'Active',
    'Test Id List': '108,180,181',
  },
];

export const DEFAULT_PACKAGES = [
  {
    'Package Id': '1', id: '1',
    Name: 'Full Body Health Checkup (Comprehensive Master)', name: 'Full Body Health Checkup (Comprehensive Master)',
    'Dept Id': '2', deptId: '2',
    Rate: '1500', rate: '1500', Status: 'Active', status: 'Active',
    'Test Id List': '120,123',
    'Profile Id List': '1,2,3,4,5',
  },
  {
    'Package Id': '2', id: '2',
    Name: 'Executive Wellness Health Package', name: 'Executive Wellness Health Package',
    'Dept Id': '2', deptId: '2',
    Rate: '1200', rate: '1200', Status: 'Active', status: 'Active',
    'Test Id List': '120',
    'Profile Id List': '1,2,3,4',
  },
  {
    'Package Id': '3', id: '3',
    Name: 'Senior Citizen Complete Care Package', name: 'Senior Citizen Complete Care Package',
    'Dept Id': '2', deptId: '2',
    Rate: '1400', rate: '1400', Status: 'Active', status: 'Active',
    'Test Id List': '120,142',
    'Profile Id List': '1,2,3,4,5',
  },
  {
    'Package Id': '4', id: '4',
    Name: 'Diabetic & Renal Surveillance Package', name: 'Diabetic & Renal Surveillance Package',
    'Dept Id': '2', deptId: '2',
    Rate: '950', rate: '950', Status: 'Active', status: 'Active',
    'Test Id List': '120,121,123',
    'Profile Id List': '3,4',
  },
  {
    'Package Id': '5', id: '5',
    Name: 'Pre-Operative Surgical Fitness Package', name: 'Pre-Operative Surgical Fitness Package',
    'Dept Id': '1', deptId: '1',
    Rate: '1100', rate: '1100', Status: 'Active', status: 'Active',
    'Test Id List': '115,122',
    'Profile Id List': '1,3,8',
  },
];

export const ALL_CLINICAL_DEFAULTS = {
  SAMPLE_LIST: DEFAULT_SAMPLES,
  TEMPLATE_LIST: DEFAULT_TEMPLATES,
  DEPT_LIST: DEFAULT_DEPARTMENTS,
  UNIT_LIST: DEFAULT_UNITS,
  METHOD_LIST: DEFAULT_METHODS,
  DOCT_LIST: DEFAULT_DOCTORS,
  BRANCH_LIST: DEFAULT_BRANCHES,
  REFERANCE_LIST: DEFAULT_REFERANCES,
  USER_LIST: DEFAULT_USERS,
  TEST_LIST: DEFAULT_TESTS,
  PROFILE_LIST: DEFAULT_PROFILES,
  PKG_LIST: DEFAULT_PACKAGES,
};

