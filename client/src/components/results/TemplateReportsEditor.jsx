import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import {
  FileText,
  FileEdit,
  Edit3,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Table as TableIcon,
  Maximize2,
  RotateCcw,
  Sparkles,
  Search,
  Check,
  Tag,
  Layers,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Activity,
  Download,
  FileDown,
  Printer,
  Cpu,
} from 'lucide-react';
import { sortSectionKeys, orderExamObject, openUpstreamTemplateEditor } from '../../utils/templateSequence.js';

/**
 * Standard default examination result schema for full-page template reports
 * Matching canonical fixed section sequence
 */
const getDefaultSchema = (templateName = 'CLINICAL EXAMINATION') => {
  const norm = String(templateName || '').toUpperCase().trim();

  if (norm.includes('URINE')) {
    return {
      TEMPLATE_NAME: norm.includes('COMPLETE') ? 'URINE EXAMINATION - COMPLETE' : 'URINE EXAMINATION',
      Exam: {
        'Physical Examination': [
          { Name: 'Quantity', Value: '' },
          { Name: 'Colour', Value: '' },
          { Name: 'Appearance', Value: '' },
          { Name: 'Specific Gravity', Value: '' },
          { Name: 'Deposit', Value: '' },
        ],
        'Chemical Examination': [
          { Name: 'Reaction (pH)', Value: '' },
          { Name: 'Protein / Albumin', Value: '' },
          { Name: 'Sugar / Glucose', Value: '' },
          { Name: 'Ketone Bodies', Value: '' },
          { Name: 'Bile Salts', Value: '' },
          { Name: 'Bile Pigments', Value: '' },
          { Name: 'Urobilinogen', Value: '' },
          { Name: 'Blood / Hemoglobin', Value: '' },
        ],
        'Microscopic Examination': [
          { Name: 'Pus Cells', Value: '' },
          { Name: 'R.B.C.', Value: '' },
          { Name: 'Epithelial Cells', Value: '' },
          { Name: 'Casts', Value: '' },
          { Name: 'Crystals', Value: '' },
          { Name: 'Bacteria', Value: '' },
          { Name: 'Yeast Cells', Value: '' },
        ],
        Others: [
          { Name: 'Mucus Threads', Value: '' },
          { Name: 'Amorphous Phosphates', Value: '' },
        ],
      },
      Impression: '',
    };
  }

  if (norm.includes('STOOL')) {
    return {
      TEMPLATE_NAME: 'STOOL EXAMINATION',
      Exam: {
        'Physical Examination': [
          { Name: 'Quantity', Value: '' },
          { Name: 'Colour', Value: '' },
          { Name: 'Odour', Value: '' },
          { Name: 'Consistency', Value: '' },
          { Name: 'Mucus', Value: '' },
          { Name: 'Parasite', Value: '' },
        ],
        'Chemical Examination': [
          { Name: 'Occult Blood', Value: '' },
          { Name: 'Reducing Substance', Value: '' },
          { Name: 'pH', Value: '' },
        ],
        'Microscopic Examination': [
          { Name: 'OVA / LARVAE', Value: '' },
          { Name: 'Trophozoites', Value: '' },
          { Name: 'Crystals', Value: '' },
          { Name: 'Ghost Cells', Value: '' },
          { Name: 'RBC', Value: '' },
          { Name: 'Bacteria', Value: '' },
          { Name: 'Cysts', Value: '' },
          { Name: 'Pyknotic Bodies', Value: '' },
          { Name: 'Pus cells', Value: '' },
          { Name: 'Epithelial Cells', Value: '' },
          { Name: 'Veg. cells', Value: '' },
        ],
        Others: [
          { Name: 'Others 1', Value: '' },
          { Name: 'Others 2', Value: '' },
        ],
      },
      Impression: '',
    };
  }

  if (norm.includes('SEMEN')) {
    return {
      TEMPLATE_NAME: 'SEMEN ANALYSIS',
      Exam: {
        'Physical Examination': [
          { Name: 'Period of Abstinence', Value: '' },
          { Name: 'Time of Collection', Value: '' },
          { Name: 'Time of Examination', Value: '' },
          { Name: 'Volume', Value: '' },
          { Name: 'Colour & Appearance', Value: '' },
          { Name: 'Liquefaction Time', Value: '' },
          { Name: 'Viscosity', Value: '' },
          { Name: 'pH', Value: '' },
        ],
        'Microscopic Examination': [
          { Name: 'Total Sperm Count', Value: '' },
          { Name: 'Active Motility (Grade a)', Value: '' },
          { Name: 'Sluggish Motility (Grade b)', Value: '' },
          { Name: 'Non-Progressive (Grade c)', Value: '' },
          { Name: 'Immotile (Grade d)', Value: '' },
          { Name: 'Normal Morphology', Value: '' },
          { Name: 'Abnormal Forms', Value: '' },
          { Name: 'Pus Cells', Value: '' },
          { Name: 'Epithelial Cells', Value: '' },
          { Name: 'Agglutination', Value: '' },
        ],
        Others: [
          { Name: 'Fructose', Value: '' },
          { Name: 'Impression / Note', Value: '' },
        ],
      },
      Impression: '',
    };
  }

  if (norm.includes('CSF') || norm.includes('FLUID') || norm.includes('ASCITIC') || norm.includes('SYNOVIAL') || norm.includes('PLEURAL')) {
    return {
      TEMPLATE_NAME: templateName,
      Exam: {
        'Physical Examination': [
          { Name: 'Quantity', Value: '' },
          { Name: 'Colour', Value: '' },
          { Name: 'Appearance / Clarity', Value: '' },
          { Name: 'Coagulum / Clot', Value: '' },
          { Name: 'Specific Gravity', Value: '' },
        ],
        'Chemical Examination': [
          { Name: 'Protein', Value: '' },
          { Name: 'Glucose', Value: '' },
          { Name: 'Chloride', Value: '' },
          { Name: 'L.D.H.', Value: '' },
          { Name: 'Adenosine Deaminase (ADA)', Value: '' },
        ],
        'Microscopic / Cytological Examination': [
          { Name: 'Total WBC Count', Value: '' },
          { Name: 'Polymorphs (Neutrophils)', Value: '' },
          { Name: 'Lymphocytes', Value: '' },
          { Name: 'RBCs', Value: '' },
          { Name: 'Malignant / Atypical Cells', Value: '' },
        ],
        'Microbiological Examination': [
          { Name: 'Gram Stain', Value: '' },
          { Name: 'ZN Stain for AFB', Value: '' },
          { Name: 'India Ink Preparation', Value: '' },
        ],
        Others: [
          { Name: 'Special Comments', Value: '' },
        ],
      },
      Impression: '',
    };
  }

  if (norm.includes('HISTOPATHOLOGY') || norm.includes('FNAC') || norm.includes('BIOPSY')) {
    return {
      TEMPLATE_NAME: templateName,
      Exam: {
        'Gross Examination': [
          { Name: 'Specimen Received', Value: '' },
          { Name: 'Dimensions / Weight', Value: '' },
          { Name: 'External Surface & Cut Surface', Value: '' },
          { Name: 'Number of Blocks Processed', Value: '' },
        ],
        'Microscopic Examination': [
          { Name: 'Section Findings', Value: '' },
          { Name: 'Cellular Architecture', Value: '' },
          { Name: 'Nuclear Atypia / Mitotic Figures', Value: '' },
          { Name: 'Stromal / Vascular Infiltration', Value: '' },
          { Name: 'Surgical Resection Margins', Value: '' },
        ],
        'Diagnostic Impression': [
          { Name: 'Final Histopathological Diagnosis', Value: '' },
          { Name: 'Pathological Staging / Grade', Value: '' },
          { Name: 'Comments / Recommendations', Value: '' },
        ],
        Others: [
          { Name: 'Special Note', Value: '' },
        ],
      },
      Impression: '',
    };
  }

  if (norm.includes('HBA1C') || norm.includes('GLYCATED') || norm.includes('A1C')) {
    return {
      TEMPLATE_NAME: 'HbA1C Report',
      headingName: 'HbA1C Report',
      templateType: 'HBA1C',
      Exam: {
        'HbA1C Result': [
          { Name: 'Glycated Haemoglobin (HbA1c)', Value: '', Unit: '% ofTotal Hb', RefRange: '<6%' },
          { Name: 'Estimated Average Glucose', Value: '', Unit: 'mg/dL', RefRange: '' },
        ],
        'Peak Data Table': [
          { Name: 'HbA1a', Value: '' },
          { Name: 'HbA1b', Value: '' },
          { Name: 'HbF', Value: '' },
          { Name: 'LA1c', Value: '' },
          { Name: 'HbA1c', Value: '' },
          { Name: 'HbA0', Value: '' },
          { Name: 'V_Win', Value: '' },
        ],
        'Summary Result': [
          { Name: 'TotalArea', Value: '' },
          { Name: 'HbA1C(NGSP)', Value: '' },
          { Name: 'eAG(ADA)', Value: '' },
          { Name: 'HbA1C(IFCC)', Value: '' },
          { Name: 'eAG[ADA]', Value: '' },
        ],
        Others: [
          { Name: 'Others 1', Value: '' },
          { Name: 'Others 2', Value: '' },
          { Name: 'Others 3', Value: '' },
        ],
        'Drawing Data': [
          { Name: 'Peak Data', Value: '' },
          { Name: 'Graph Data', Value: '' },
        ],
      },
      Impression: '',
    };
  }

  // Default examination structure for single tests / hematology / biochemistry full-page formats
  return {
    TEMPLATE_NAME: templateName,
    Exam: {
      'Clinical Observations': [
        { Name: 'Observed Value / Reading', Value: '' },
        { Name: 'Biological Reference Interval', Value: '' },
        { Name: 'Unit of Measurement', Value: '' },
        { Name: 'Methodology / Principle', Value: '' },
      ],
      'Diagnostic Findings': [
        { Name: 'Pathological Interpretation', Value: '' },
        { Name: 'Clinical Remarks', Value: '' },
      ],
    },
    Impression: '',
  };
};

/**
 * Quick shortcut chips for common clinical values
 */
const COMMON_SHORTCUT_VALUES = [
  'Normal',
  'Nil',
  'Negative',
  'Present',
  'Absent',
  'Trace',
  'Adequate',
  'Not Seen',
];

export default function TemplateReportsEditor({
  templateReports = [],
  patient = {},
  onRefresh,
  onDeleteReport,
  deletingId,
  onOpenModal,
  onDownloadResult,
  downloadingId,
}) {
  const navigate = useNavigate();

  // 'boxes' (item box grid matching Image 2) | 'editor' (inline whole edit) | 'table' (compact summary view)
  const [viewMode, setViewMode] = useState('boxes');
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedMap, setCollapsedMap] = useState({});
  const [savingAll, setSavingAll] = useState(false);
  const [globalSuccess, setGlobalSuccess] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [newSectionNameMap, setNewSectionNameMap] = useState({});
  const [addingSectionForId, setAddingSectionForId] = useState(null);
  const [localDownloadingId, setLocalDownloadingId] = useState(null);
  const activeDownloadingId = downloadingId || localDownloadingId;

  // Individual Template Report Download Result Handler (DOWNLOADRESULT)
  const handleDownload = async (tmpl) => {
    const rId = String(tmpl.reportId || tmpl.templatesId || tmpl.id || '').trim();
    if (!rId) return;
    const targetPid = patient?.patientId || patient?.slNo;
    const tmplName = tmpl.testName || tmpl.TEMPLATE_NAME || `Template (${rId})`;
    setLocalDownloadingId(rId);
    setGlobalError('');
    setGlobalSuccess('');

    try {
      const res = await api.post('/reports/download-result', {
        patientId: targetPid,
        reportId: rId,
        reportType: 1,
      });

      if (res.data?.STATUS === 'FAILED' || res.data?.StatusCode === '1211') {
        const msg = res.data?.Message || 'Technical Error - 1211';
        setGlobalError(
          `Analyzer Machine (DOWNLOADRESULT): ${msg}. (Equipment has not transmitted findings for ${tmplName} [#${rId}] yet).`
        );
        return;
      }

      setGlobalSuccess(`Result for "${tmplName}" downloaded from analyzer equipment successfully!`);
      if (onRefresh) await onRefresh(true);
    } catch (err) {
      const msg = err.response?.data?.Message || err.message || 'Failed to download reading from analyzer';
      setGlobalError(`Analyzer Machine (DOWNLOADRESULT): ${msg}`);
    } finally {
      setLocalDownloadingId(null);
    }
  };

  // Download official diagnostic report PDF
  const handleDownloadPdf = () => {
    const rawPid = patient?.patientId || patient?.slNo;
    const cleanPid = rawPid
      ? (String(rawPid).toUpperCase().startsWith('P') ? `P${String(rawPid).replace(/^P+/i, '')}` : `P${rawPid}`)
      : '';
    const targetUrl = patient?.printPDFUrl || patient?.reportUrl;
    if (targetUrl) {
      window.open(targetUrl, '_blank');
    } else if (cleanPid) {
      window.open(`/api/reports/pdf?patientId=${encodeURIComponent(cleanPid)}&addHeader=true&download=true`, '_blank');
    } else {
      setGlobalError('No report PDF available for this patient yet.');
    }
  };

  // Core state: Map of reportId -> { reportId, testName, status, resultJson, loading, saving, isDirty, error }
  const [reportsState, setReportsState] = useState({});

  // Initialize and synchronize schemas for all template reports
  useEffect(() => {
    if (!templateReports || templateReports.length === 0) {
      setReportsState({});
      return;
    }

    setReportsState((prev) => {
      const updated = { ...prev };

      templateReports.forEach((tmpl) => {
        const rId = String(tmpl.reportId || tmpl.templatesId || tmpl.id || '').trim();
        if (!rId) return;

        // If not already in state, initialize
        if (!updated[rId]) {
          const preloadedJson = tmpl.resultJson || tmpl.resultJsonParsed || tmpl.raw?.resultJson || tmpl.raw?.resultJsonParsed;
          const parsed = typeof preloadedJson === 'string'
            ? (() => {
                try { return JSON.parse(preloadedJson); } catch { return null; }
              })()
            : preloadedJson;

          updated[rId] = {
            reportId: rId,
            testName: tmpl.testName || tmpl.TEMPLATE_NAME || `Template (${rId})`,
            status: tmpl.status || 'ENTRY',
            date: tmpl.date || tmpl.reportDate || 'Today',
            resultJson: parsed && parsed.Exam ? parsed : null,
            loading: !(parsed && parsed.Exam),
            saving: false,
            isDirty: false,
            error: '',
          };
        }
      });

      return updated;
    });

    // Concurrently fetch full structured schemas for any template reports lacking Exam data
    templateReports.forEach(async (tmpl) => {
      const rId = String(tmpl.reportId || tmpl.templatesId || tmpl.id || '').trim();
      if (!rId) return;

      const preloadedJson = tmpl.resultJson || tmpl.resultJsonParsed || tmpl.raw?.resultJson || tmpl.raw?.resultJsonParsed;
      if (preloadedJson && (typeof preloadedJson === 'object') && preloadedJson.Exam) {
        return; // Schema already present
      }

      try {
        const res = await api.get('/reports/template-json', {
          params: {
            reportId: rId,
            templateName: tmpl.testName || tmpl.TEMPLATE_NAME,
          },
        });

        const rep = res.data?.templateReport || res.data?.payLoadJSON?.TemplateReport;
        let fetchedJson = rep?.resultJSON || rep?.resultJson;

        if (typeof fetchedJson === 'string') {
          try {
            fetchedJson = JSON.parse(fetchedJson);
          } catch {
            fetchedJson = null;
          }
        }

        const validSchema = fetchedJson && fetchedJson.Exam
          ? fetchedJson
          : getDefaultSchema(tmpl.testName || tmpl.TEMPLATE_NAME);

        setReportsState((prev) => {
          const cur = prev[rId] || {};
          return {
            ...prev,
            [rId]: {
              ...cur,
              reportId: rId,
              testName: tmpl.testName || tmpl.TEMPLATE_NAME || `Template (${rId})`,
              status: tmpl.status || cur.status || 'ENTRY',
              resultJson: validSchema,
              loading: false,
            },
          };
        });
      } catch (err) {
        console.warn(`[TemplateReportsEditor] Fallback schema applied for ${rId}:`, err.message);
        const fallback = getDefaultSchema(tmpl.testName || tmpl.TEMPLATE_NAME);
        setReportsState((prev) => {
          const cur = prev[rId] || {};
          return {
            ...prev,
            [rId]: {
              ...cur,
              reportId: rId,
              testName: tmpl.testName || tmpl.TEMPLATE_NAME || `Template (${rId})`,
              status: tmpl.status || cur.status || 'ENTRY',
              resultJson: fallback,
              loading: false,
            },
          };
        });
      }
    });
  }, [templateReports]);

  // Dirty count across all template reports
  const dirtyReports = useMemo(() => {
    return Object.values(reportsState).filter((r) => r.isDirty);
  }, [reportsState]);

  const dirtyCount = dirtyReports.length;

  // Filtered template reports according to search term and deletion status
  const filteredList = useMemo(() => {
    const activeTemplates = (templateReports || []).filter((tmpl) => {
      if (!tmpl) return false;
      const st = String(tmpl.status || '').toUpperCase();
      return !tmpl.isDeleted && st !== 'DELETED';
    });
    if (!searchTerm) return activeTemplates;
    const term = searchTerm.toLowerCase().trim();
    return activeTemplates.filter((tmpl) => {
      const name = String(tmpl.testName || tmpl.TEMPLATE_NAME || '').toLowerCase();
      const rId = String(tmpl.reportId || '').toLowerCase();
      return name.includes(term) || rId.includes(term);
    });
  }, [templateReports, searchTerm]);

  // Expand / Collapse controls
  const toggleCollapse = (reportId) => {
    setCollapsedMap((prev) => ({
      ...prev,
      [reportId]: !prev[reportId],
    }));
  };

  const handleExpandAll = () => {
    const next = {};
    templateReports.forEach((t) => {
      next[t.reportId] = false; // false = expanded
    });
    setCollapsedMap(next);
  };

  const handleCollapseAll = () => {
    const next = {};
    templateReports.forEach((t) => {
      next[t.reportId] = true; // true = collapsed
    });
    setCollapsedMap(next);
  };

  // Update parameter Value in Exam[section][idx]
  const handleValueChange = (reportId, sectionName, itemIdx, newValue) => {
    setReportsState((prev) => {
      const cur = prev[reportId];
      if (!cur || !cur.resultJson || !cur.resultJson.Exam) return prev;

      const currentSection = cur.resultJson.Exam[sectionName] || [];
      const updatedSection = [...currentSection];
      updatedSection[itemIdx] = {
        ...updatedSection[itemIdx],
        Value: newValue,
      };

      const updatedResultJson = {
        ...cur.resultJson,
        Exam: {
          ...cur.resultJson.Exam,
          [sectionName]: updatedSection,
        },
      };

      return {
        ...prev,
        [reportId]: {
          ...cur,
          resultJson: updatedResultJson,
          isDirty: true,
          error: '',
        },
      };
    });
  };

  // Update parameter Name in Exam[section][idx]
  const handleNameChange = (reportId, sectionName, itemIdx, newName) => {
    setReportsState((prev) => {
      const cur = prev[reportId];
      if (!cur || !cur.resultJson || !cur.resultJson.Exam) return prev;

      const currentSection = cur.resultJson.Exam[sectionName] || [];
      const updatedSection = [...currentSection];
      updatedSection[itemIdx] = {
        ...updatedSection[itemIdx],
        Name: newName,
      };

      const updatedResultJson = {
        ...cur.resultJson,
        Exam: {
          ...cur.resultJson.Exam,
          [sectionName]: updatedSection,
        },
      };

      return {
        ...prev,
        [reportId]: {
          ...cur,
          resultJson: updatedResultJson,
          isDirty: true,
        },
      };
    });
  };

  // Add parameter item into Exam[section] array
  const handleAddParamItem = (reportId, sectionName) => {
    setReportsState((prev) => {
      const cur = prev[reportId];
      if (!cur || !cur.resultJson || !cur.resultJson.Exam) return prev;

      const currentSection = cur.resultJson.Exam[sectionName] || [];
      const updatedSection = [
        ...currentSection,
        { Name: `Parameter ${currentSection.length + 1}`, Value: '' },
      ];

      const updatedResultJson = {
        ...cur.resultJson,
        Exam: {
          ...cur.resultJson.Exam,
          [sectionName]: updatedSection,
        },
      };

      return {
        ...prev,
        [reportId]: {
          ...cur,
          resultJson: updatedResultJson,
          isDirty: true,
        },
      };
    });
  };

  // Remove parameter item from Exam[section] array
  const handleRemoveParamItem = (reportId, sectionName, itemIdx) => {
    setReportsState((prev) => {
      const cur = prev[reportId];
      if (!cur || !cur.resultJson || !cur.resultJson.Exam) return prev;

      const currentSection = cur.resultJson.Exam[sectionName] || [];
      const updatedSection = currentSection.filter((_, idx) => idx !== itemIdx);

      const updatedResultJson = {
        ...cur.resultJson,
        Exam: {
          ...cur.resultJson.Exam,
          [sectionName]: updatedSection,
        },
      };

      return {
        ...prev,
        [reportId]: {
          ...cur,
          resultJson: updatedResultJson,
          isDirty: true,
        },
      };
    });
  };

  // Add new section to Exam
  const handleAddNewSection = (reportId) => {
    const rawName = (newSectionNameMap[reportId] || '').trim();
    const sectionName = rawName || 'New Examination Section';

    setReportsState((prev) => {
      const cur = prev[reportId];
      if (!cur || !cur.resultJson) return prev;

      const updatedExam = {
        ...(cur.resultJson.Exam || {}),
        [sectionName]: [
          { Name: 'Finding 1', Value: '' },
          { Name: 'Finding 2', Value: '' },
        ],
      };

      return {
        ...prev,
        [reportId]: {
          ...cur,
          resultJson: {
            ...cur.resultJson,
            Exam: updatedExam,
          },
          isDirty: true,
        },
      };
    });

    setNewSectionNameMap((prev) => ({ ...prev, [reportId]: '' }));
    setAddingSectionForId(null);
  };

  // Remove entire section from Exam
  const handleRemoveSection = (reportId, sectionName) => {
    setReportsState((prev) => {
      const cur = prev[reportId];
      if (!cur || !cur.resultJson || !cur.resultJson.Exam) return prev;

      const updatedExam = { ...cur.resultJson.Exam };
      delete updatedExam[sectionName];

      return {
        ...prev,
        [reportId]: {
          ...cur,
          resultJson: {
            ...cur.resultJson,
            Exam: updatedExam,
          },
          isDirty: true,
        },
      };
    });
  };

  // Update diagnostic impression / notes
  const handleImpressionChange = (reportId, val) => {
    setReportsState((prev) => {
      const cur = prev[reportId];
      if (!cur || !cur.resultJson) return prev;

      return {
        ...prev,
        [reportId]: {
          ...cur,
          resultJson: {
            ...cur.resultJson,
            Impression: val,
          },
          isDirty: true,
        },
      };
    });
  };

  // Save single template report
  const handleSaveSingle = async (reportId) => {
    const item = reportsState[reportId];
    if (!item || !item.resultJson) return;

    setReportsState((prev) => ({
      ...prev,
      [reportId]: { ...prev[reportId], saving: true, error: '' },
    }));
    setGlobalError('');
    setGlobalSuccess('');

    const targetPatientId = patient?.patientId || patient?.id || '';
    try {
      const res = await api.post(
        `/reports/template-data?reportId=${encodeURIComponent(reportId)}&patientId=${encodeURIComponent(targetPatientId)}`,
        {
          ...item.resultJson,
          patientId: targetPatientId,
          reportId,
          templateId: item.templatesId,
        }
      );

      if (res.data?.STATUS === 'SUCCESS' || res.data?.StatusCode === '0000') {
        setReportsState((prev) => ({
          ...prev,
          [reportId]: {
            ...prev[reportId],
            saving: false,
            isDirty: false,
            status: 'SAVED',
          },
        }));
        setGlobalSuccess(`Template report "${item.testName}" (#${reportId}) saved successfully.`);
        if (onRefresh) onRefresh(false);
      } else {
        throw new Error(res.data?.Message || 'Failed to save template report');
      }
    } catch (err) {
      const msg = err.response?.data?.Message || err.message || 'Server error updating template report';
      setReportsState((prev) => ({
        ...prev,
        [reportId]: { ...prev[reportId], saving: false, error: msg },
      }));
      setGlobalError(msg);
    }
  };

  // Bulk Save All Dirty Template Reports
  const handleSaveAll = async () => {
    if (dirtyReports.length === 0) return;

    setSavingAll(true);
    setGlobalError('');
    setGlobalSuccess('');

    try {
      // 1. Prepare batch payload
      const targetPatientId = patient?.patientId || patient?.id || '';
      const batchPayload = dirtyReports.map((r) => ({
        reportId: r.reportId,
        patientId: targetPatientId || r.patientId,
        templateId: r.templatesId,
        resultJSON: r.resultJson,
      }));

      // Try batch endpoint first
      let successCount = 0;
      try {
        const batchRes = await api.post('/reports/template-batch-data', {
          reports: batchPayload,
        });
        if (batchRes.data?.STATUS === 'SUCCESS') {
          successCount = batchRes.data?.updatedCount || batchPayload.length;
        }
      } catch (batchErr) {
        // Fallback to parallel single saves
        console.warn('[TemplateReportsEditor] Batch endpoint failed, falling back to parallel updates:', batchErr.message);
        await Promise.all(
          batchPayload.map((p) =>
            api.post(
              `/reports/template-data?reportId=${encodeURIComponent(p.reportId)}&patientId=${encodeURIComponent(p.patientId || '')}`,
              {
                ...p.resultJSON,
                patientId: p.patientId,
                reportId: p.reportId,
                templateId: p.templateId,
              }
            )
          )
        );
        successCount = batchPayload.length;
      }

      // Mark all dirty items as clean & saved
      setReportsState((prev) => {
        const updated = { ...prev };
        dirtyReports.forEach((d) => {
          if (updated[d.reportId]) {
            updated[d.reportId] = {
              ...updated[d.reportId],
              saving: false,
              isDirty: false,
              status: 'SAVED',
              error: '',
            };
          }
        });
        return updated;
      });

      setGlobalSuccess(`Successfully saved ${successCount} template report(s) directly to server!`);
      if (onRefresh) onRefresh(true);
    } catch (err) {
      setGlobalError(err.response?.data?.Message || err.message || 'Failed to save all template reports');
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-purple-200 shadow-sm overflow-hidden mt-4 space-y-0">
      {/* 1. TOP HEADER & WORKSPACE TOOLBAR */}
      <div className="px-4 py-3.5 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white border-b border-purple-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold text-purple-950 tracking-tight">
                Template Reports — Full Page Clinical Examination Editor
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                {filteredList.length} Examination{filteredList.length !== 1 ? 's' : ''}
              </span>
              {dirtyCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                  ● {dirtyCount} Unsaved Changes
                </span>
              )}
            </div>
            <p className="text-[11px] text-purple-800/80 mt-0.5">
              All findings, observation sections, and parameter arrays are directly editable below. Enter results across all examinations in one page.
            </p>
          </div>
        </div>

        {/* Toolbar Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search examinations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-2.5 py-1 text-xs bg-white border border-purple-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 w-36 sm:w-44 transition-all"
            />
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-purple-100/80 p-0.5 rounded-lg border border-purple-200">
            <button
              type="button"
              onClick={() => setViewMode('boxes')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'boxes'
                  ? 'bg-white text-purple-800 shadow-2xs'
                  : 'text-purple-700 hover:text-purple-900'
              }`}
              title="Item boxes grid matching clinical format (Image 2)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Item Boxes ({filteredList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'editor'
                  ? 'bg-white text-purple-800 shadow-2xs'
                  : 'text-purple-700 hover:text-purple-900'
              }`}
              title="One-page whole edit view: all fields editable directly on this page"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Inline Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-purple-800 shadow-2xs'
                  : 'text-purple-700 hover:text-purple-900'
              }`}
              title="Compact summary table view"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* Expand / Collapse All (Editor Mode) */}
          {viewMode === 'editor' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleExpandAll}
                className="px-2 py-1 text-[11px] font-bold text-purple-700 bg-white hover:bg-purple-50 rounded-lg border border-purple-200 transition-colors cursor-pointer"
                title="Expand all examination panels"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-2 py-1 text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                title="Collapse all examination panels"
              >
                Collapse All
              </button>
            </div>
          )}

          {/* Download Full Patient Diagnostic Report PDF */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Download official patient diagnostic report PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download PDF</span>
          </button>

          {/* SAVE ALL BUTTON */}
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={savingAll || dirtyCount === 0}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-95 ${
              dirtyCount > 0
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white ring-2 ring-purple-400/50'
                : 'bg-purple-100 text-purple-400 cursor-not-allowed border border-purple-200'
            }`}
            title="Save all modified template examinations to server (UPDATETEMPLATEDATA)"
          >
            {savingAll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save All ({dirtyCount})</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {globalSuccess && (
        <div className="mx-4 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{globalSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setGlobalSuccess('')}
            className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {globalError && (
        <div className="mx-4 mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{globalError}</span>
          </div>
          <button
            type="button"
            onClick={() => setGlobalError('')}
            className="text-rose-700 hover:text-rose-900 font-bold cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. MODE: ITEM BOXES GRID */}
      {viewMode === 'boxes' && (
        <div className="p-4 sm:p-5">
          {filteredList.length === 0 ? (
            <div className="py-12 text-center text-xs font-semibold text-slate-500 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              No active clinical template reports for this patient.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {filteredList.map((tmpl, idx) => {
              const rId = String(tmpl.reportId || tmpl.templatesId || tmpl.id || '').trim();
              const isDeleting = deletingId === rId;
              const testName = tmpl.testName || tmpl.TEMPLATE_NAME || 'Template Report';
              const deptName =
                tmpl.deptName || tmpl.department || 'DEPT HAEMATOLOGY TESTS - Template';
              const pid = patient?.patientId || patient?.slNo || '';
              const rawPid = String(pid).trim();
              const cleanPid = rawPid.toUpperCase().startsWith('P')
                ? `P${rawPid.replace(/^P+/i, '')}`
                : `P${rawPid}`;

              const state = reportsState[rId] || {};
              const isItemDirty = Boolean(state.isDirty);
              const schema = state.resultJson;
              const sections = schema?.Exam ? sortSectionKeys(Object.keys(schema.Exam), testName) : [];
              const totalParams = sections.reduce(
                (acc, s) => acc + (schema.Exam[s]?.length || 0),
                0
              );

              let filledCount = 0;
              if (schema?.Exam) {
                sections.forEach((s) => {
                  (schema.Exam[s] || []).forEach((p) => {
                    if (p && p.Value !== undefined && String(p.Value).trim() !== '') {
                      filledCount++;
                    }
                  });
                });
              }

              const statusStr = String(state.status || tmpl.status || '').toUpperCase();
              const isSaved = statusStr === 'SAVED';

              return (
                <div
                  key={rId || idx}
                  className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-violet-300 shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
                >
                  {/* Top Colorful Accent Line */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600" />

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Top Header: Icon + Identifiers + Delete */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Modern Squircle Badge */}
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                            <FileText className="w-5 h-5" />
                          </div>

                          <div className="min-w-0">
                            {/* Badges */}
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <span className="font-mono text-[10px] font-bold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md border border-violet-200/70">
                                #{rId}
                              </span>
                              {isItemDirty ? (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                  ● Unsaved
                                </span>
                              ) : isSaved ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  ● Saved
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                  Template
                                </span>
                              )}
                            </div>

                            {/* Examination Name */}
                            <h4
                              className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-violet-950 leading-snug tracking-tight truncate transition-colors"
                              title={testName}
                            >
                              {testName}
                            </h4>

                            {/* Department Subtitle */}
                            <div
                              className="flex items-center gap-1 text-[11px] font-medium text-slate-500 mt-0.5 truncate"
                              title={deptName}
                            >
                              <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{deptName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Soft Danger Delete Button */}
                        {onDeleteReport && (
                          <button
                            type="button"
                            onClick={() => onDeleteReport(tmpl)}
                            disabled={isDeleting}
                            className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 flex items-center justify-center transition-all cursor-pointer shrink-0 disabled:opacity-50 active:scale-95"
                            title="Delete template report from worklist"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Middle Details / Observations Preview Chips */}
                      <div className="mt-4 pt-3.5 border-t border-slate-100">
                        {sections.length > 0 ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-slate-600">
                              <span className="font-semibold text-slate-700">
                                {sections.length} Clinical Section{sections.length !== 1 ? 's' : ''}
                              </span>
                              <span className="font-mono text-[10px] text-slate-500">
                                {filledCount > 0 ? `${filledCount}/${totalParams} filled` : `${totalParams} parameters`}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {sections.slice(0, 3).map((sec) => (
                                <span
                                  key={sec}
                                  className="text-[10px] font-semibold bg-slate-50 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/80 truncate max-w-[140px]"
                                  title={sec}
                                >
                                  {sec}
                                </span>
                              ))}
                              {sections.length > 3 && (
                                <span className="text-[10px] font-bold bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded-md border border-violet-100">
                                  +{sections.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                            <Activity className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                            <span>Clinical template ready for findings entry</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center gap-2">
                        {/* 1. HERO BUTTON: Dedicated My Template Editor */}
                        <button
                          type="button"
                          onClick={() => {
                            navigate(
                              `/patients/${cleanPid}/template/${rId}?name=${encodeURIComponent(testName)}`,
                              { state: { patient } }
                            );
                          }}
                          className="flex-1 py-2.5 px-3 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                          title="Open full-page dedicated template findings editor (My Editor)"
                        >
                          <FileEdit className="w-4 h-4" />
                          <span>My Editor</span>
                        </button>

                        {/* 1b. Upstream AWS Template Editor */}
                        <button
                          type="button"
                          onClick={() =>
                            openUpstreamTemplateEditor({
                              patientId: cleanPid,
                              reportId: rId,
                              name: testName,
                            })
                          }
                          className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-800 border border-amber-300 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                          title="Open official AWS template editor (editTemplateV2.jsp) in new window"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
                          <span>AWS Editor</span>
                        </button>

                        {/* 2. Quick Inline Drawer Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setViewMode('editor');
                            setCollapsedMap((prev) => ({ ...prev, [rId]: false }));
                          }}
                          className="py-2.5 px-3 bg-violet-50 hover:bg-violet-100 active:scale-95 text-violet-700 font-bold text-xs rounded-xl border border-violet-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                          title="Quick inline edit directly on this page"
                        >
                          <FileCheck2 className="w-4 h-4" />
                          <span>Inline</span>
                        </button>
                      </div>

                      {/* Secondary Row: Machine Sync (DOWNLOADRESULT) & PDF Download */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
                        {/* A. Download from Machine Analyzer (DOWNLOADRESULT) */}
                        {tmpl.possibleDownload !== false && (
                          <button
                            type="button"
                            onClick={() => handleDownload(tmpl)}
                            disabled={activeDownloadingId === rId}
                            className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-violet-50 active:scale-95 text-slate-700 hover:text-violet-700 font-bold text-[11px] rounded-lg border border-slate-200 hover:border-violet-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                            title="Download instrument reading from analyzer equipment (DOWNLOADRESULT)"
                          >
                            {activeDownloadingId === rId ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />
                            ) : (
                              <Cpu className="w-3.5 h-3.5 text-violet-600" />
                            )}
                            <span>From Analyzer</span>
                          </button>
                        )}

                        {/* B. Download / Print Report PDF */}
                        <button
                          type="button"
                          onClick={handleDownloadPdf}
                          className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-emerald-50 active:scale-95 text-slate-700 hover:text-emerald-700 font-bold text-[11px] rounded-lg border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          title="Download / View official patient report PDF"
                        >
                          <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Download PDF</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* 3. MODE: ONE-PAGE WHOLE EDIT VIEW (ALL THINGS EDITABLE TO SHOW UP ON PAGE) */}
      {viewMode === 'editor' && (
        <div className="p-4 space-y-4">
          {filteredList.length === 0 ? (
            <div className="py-12 text-center text-xs font-semibold text-slate-500 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              No active clinical template reports for this patient.
            </div>
          ) : (
            filteredList.map((tmpl, idx) => {
            const rId = String(tmpl.reportId || tmpl.templatesId || tmpl.id || '').trim();
            const state = reportsState[rId] || {};
            const isCollapsed = Boolean(collapsedMap[rId]);
            const schema = state.resultJson;
            const examSections = schema?.Exam ? sortSectionKeys(Object.keys(schema.Exam), tmpl.testName || tmpl.TEMPLATE_NAME) : [];
            const isItemDirty = Boolean(state.isDirty);
            const isItemSaving = Boolean(state.saving);
            const isDeleting = deletingId === rId;

            return (
              <div
                key={rId || idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isItemDirty
                    ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/20 shadow-xs'
                    : 'border-slate-200/90 bg-white hover:border-purple-200 shadow-2xs'
                }`}
              >
                {/* Examination Card Header */}
                <div
                  className={`px-4 py-3 flex items-center justify-between gap-3 border-b select-none transition-colors ${
                    isItemDirty
                      ? 'bg-amber-50/60 border-amber-200/80'
                      : 'bg-slate-50/70 border-slate-200/70'
                  }`}
                >
                  <div
                    onClick={() => toggleCollapse(rId)}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  >
                    <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                          {tmpl.testName || tmpl.TEMPLATE_NAME}
                        </span>
                        <span className="font-mono text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200 shrink-0">
                          ID: #{rId}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isItemDirty
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : String(state.status || tmpl.status || '').toUpperCase() === 'SAVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isItemDirty ? 'MODIFIED' : state.status || tmpl.status || 'ENTRY'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                        {tmpl.date || tmpl.reportDate || 'Today'} • {examSections.length} Examination Section{examSections.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Individual Save Button */}
                    <button
                      type="button"
                      onClick={() => handleSaveSingle(rId)}
                      disabled={isItemSaving || !isItemDirty}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isItemDirty
                          ? 'bg-purple-600 hover:bg-purple-700 active:scale-95 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                      title="Save this examination findings to server (UPDATETEMPLATEDATA)"
                    >
                      {isItemSaving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isItemDirty ? (
                        <Save className="w-3.5 h-3.5" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span className="hidden sm:inline">{isItemSaving ? 'Saving...' : isItemDirty ? 'Save' : 'Saved'}</span>
                    </button>

                    {/* Dedicated Full-Page Template Editor Button (My Editor) */}
                    <button
                      type="button"
                      onClick={() => {
                        const rawPid = patient?.patientId || patient?.slNo || '';
                        const cleanPid = String(rawPid).toUpperCase().startsWith('P')
                          ? `P${String(rawPid).replace(/^P+/i, '')}`
                          : `P${rawPid}`;
                        navigate(
                          `/patients/${cleanPid}/template/${rId}?name=${encodeURIComponent(tmpl.testName || tmpl.TEMPLATE_NAME)}`,
                          { state: { patient } }
                        );
                      }}
                      className="p-1.5 px-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-bold shadow-2xs active:scale-95"
                      title="Open full-page dedicated template findings editor (My Editor)"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">My Editor</span>
                    </button>

                    {/* Upstream AWS Template Editor Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const rawPid = patient?.patientId || patient?.slNo || '';
                        const cleanPid = String(rawPid).toUpperCase().startsWith('P')
                          ? `P${String(rawPid).replace(/^P+/i, '')}`
                          : `P${rawPid}`;
                        openUpstreamTemplateEditor({
                          patientId: cleanPid,
                          reportId: rId,
                          name: tmpl.testName || tmpl.TEMPLATE_NAME,
                        });
                      }}
                      className="p-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-bold shadow-2xs active:scale-95"
                      title="Open official AWS template editor (editTemplateV2.jsp) in new window"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
                      <span className="hidden sm:inline">AWS Editor</span>
                    </button>

                    {/* Download Result from Analyzer (DOWNLOADRESULT) - Checking possibleDownload !== false */}
                    {tmpl.possibleDownload !== false && (
                      <button
                        type="button"
                        onClick={() => handleDownload(tmpl)}
                        disabled={activeDownloadingId === rId}
                        className="p-1.5 px-2 bg-violet-50 hover:bg-violet-100 active:scale-95 text-violet-700 rounded-lg border border-violet-200 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold shadow-2xs disabled:opacity-50"
                        title="Download Result from Analyzer Equipment (DOWNLOADRESULT)"
                      >
                        {activeDownloadingId === rId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-violet-600" />
                        )}
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    )}

                    {/* Delete Report Button */}
                    {onDeleteReport && (
                      <button
                        type="button"
                        onClick={() => onDeleteReport(tmpl)}
                        disabled={isDeleting}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete this template examination from worklist"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        )}
                      </button>
                    )}

                    {/* Expand/Collapse Chevron */}
                    <button
                      type="button"
                      onClick={() => toggleCollapse(rId)}
                      className="p-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      title={isCollapsed ? 'Expand' : 'Collapse'}
                    >
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Examination Card Body (Full Inline Editor) */}
                {!isCollapsed && (
                  <div className="p-4 space-y-4">
                    {state.loading ? (
                      <div className="py-6 flex flex-col items-center justify-center text-slate-400 space-y-2">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                        <span className="text-xs font-semibold">Loading examination schema from API...</span>
                      </div>
                    ) : schema ? (
                      <div className="space-y-4">
                        {/* Error Alert if any for this report */}
                        {state.error && (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{state.error}</span>
                          </div>
                        )}

                        {/* RENDER EACH SECTION IN Exam */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {examSections.map((sectionName) => {
                            const paramsList = Array.isArray(schema.Exam[sectionName])
                              ? schema.Exam[sectionName]
                              : [];

                            return (
                              <div
                                key={sectionName}
                                className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-3 space-y-2.5 transition-all hover:bg-slate-50"
                              >
                                {/* Section Header */}
                                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider truncate">
                                      {sectionName}
                                    </span>
                                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                                      {paramsList.length}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleAddParamItem(rId, sectionName)}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md border border-purple-200 transition-colors cursor-pointer"
                                      title="Add new parameter to this section"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Add Item</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Section Parameter Rows */}
                                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                                  {paramsList.length === 0 ? (
                                    <div className="py-2 text-center text-xs text-slate-400 italic">
                                      No parameters in this section. Click "+ Add Item" above.
                                    </div>
                                  ) : (
                                    paramsList.map((param, pIdx) => (
                                      <div
                                        key={pIdx}
                                        className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs space-y-1.5 transition-all focus-within:border-purple-300 focus-within:ring-1 focus-within:ring-purple-200"
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          {/* Parameter Name */}
                                          <input
                                            type="text"
                                            value={param.Name || ''}
                                            onChange={(e) =>
                                              handleNameChange(rId, sectionName, pIdx, e.target.value)
                                            }
                                            placeholder="Parameter name..."
                                            className="text-xs font-bold text-slate-800 bg-transparent border-0 focus:outline-none focus:bg-slate-100 rounded px-1 py-0.5 w-full"
                                            title="Click to edit parameter name"
                                          />

                                          {/* Delete Parameter Button */}
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleRemoveParamItem(rId, sectionName, pIdx)
                                            }
                                            className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors cursor-pointer shrink-0"
                                            title="Remove parameter"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>

                                        {/* Parameter Editable Value Input */}
                                        <div className="flex items-center gap-1.5">
                                          <input
                                            type="text"
                                            value={param.Value || ''}
                                            onChange={(e) =>
                                              handleValueChange(rId, sectionName, pIdx, e.target.value)
                                            }
                                            placeholder="Enter observation / finding..."
                                            className="w-full text-xs font-medium text-slate-900 bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all font-mono"
                                          />
                                        </div>

                                        {/* Quick Value Helper Chips */}
                                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                          {COMMON_SHORTCUT_VALUES.map((shortcut) => (
                                            <button
                                              key={shortcut}
                                              type="button"
                                              onClick={() =>
                                                handleValueChange(rId, sectionName, pIdx, shortcut)
                                              }
                                              className="text-[9px] font-semibold text-purple-700 bg-purple-50/80 hover:bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200 transition-colors cursor-pointer"
                                            >
                                              {shortcut}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Add New Section Controls */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                          {addingSectionForId === rId ? (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <input
                                type="text"
                                placeholder="Section title (e.g. Microscopic Examination)..."
                                value={newSectionNameMap[rId] || ''}
                                onChange={(e) =>
                                  setNewSectionNameMap((prev) => ({
                                    ...prev,
                                    [rId]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddNewSection(rId);
                                }}
                                className="text-xs px-3 py-1.5 bg-white border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-72"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddNewSection(rId)}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => setAddingSectionForId(null)}
                                className="px-2.5 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAddingSectionForId(rId)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Custom Examination Section</span>
                            </button>
                          )}

                          {/* Quick Bottom Save for this report */}
                          <button
                            type="button"
                            onClick={() => handleSaveSingle(rId)}
                            disabled={isItemSaving || !isItemDirty}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                              isItemDirty
                                ? 'bg-purple-600 hover:bg-purple-700 active:scale-95 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {isItemSaving ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            <span>Save {tmpl.testName} Findings</span>
                          </button>
                        </div>

                        {/* Diagnostic Impression / Remarks Box */}
                        <div className="pt-2 border-t border-slate-100 space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Clinical Impression / Diagnostic Remarks
                          </label>
                          <textarea
                            rows={2}
                            value={schema.Impression || ''}
                            onChange={(e) => handleImpressionChange(rId, e.target.value)}
                            placeholder="Enter summary impression, pathologist notes, or recommendations..."
                            className="w-full text-xs font-medium text-slate-900 bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400 italic">
                        No schema available for this examination format.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
          )}
        </div>
      )}

      {/* 3. MODE B: TABULAR SUMMARY VIEW (WITH INSTANT INLINE ACCORDION DRAWER) */}
      {viewMode === 'table' && (
        <div className="p-2 sm:p-3 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-bold">
                <th className="py-2 px-3 w-10">#</th>
                <th className="py-2 px-3">Template Report Name</th>
                <th className="py-2 px-3">Report ID</th>
                <th className="py-2 px-3 hidden sm:table-cell">Report Date</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs font-semibold text-slate-500 bg-slate-50/50">
                    No active clinical template reports for this patient.
                  </td>
                </tr>
              ) : (
                filteredList.map((tmpl, idx) => {
                const rId = String(tmpl.reportId || tmpl.templatesId || tmpl.id || '').trim();
                const state = reportsState[rId] || {};
                const isExpanded = !collapsedMap[rId];
                const isItemDirty = Boolean(state.isDirty);
                const isDeleting = deletingId === rId;

                return (
                  <React.Fragment key={rId || idx}>
                    <tr className="hover:bg-purple-50/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400 text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800">
                          {tmpl.testName || tmpl.TEMPLATE_NAME}
                        </div>
                        <div className="text-[10px] text-purple-600 font-medium">
                          Full-Page Dynamic Result Format
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs font-bold text-purple-700">
                        {rId}
                      </td>
                      <td className="py-2.5 px-3 hidden sm:table-cell text-slate-500 font-mono text-[11px]">
                        {tmpl.date || tmpl.reportDate || 'Today'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isItemDirty
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : String(tmpl.status || '').toUpperCase() === 'SAVED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isItemDirty ? 'MODIFIED' : tmpl.status || 'SAVED'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* Dedicated Full-Page Template Editor */}
                          <button
                            type="button"
                            onClick={() => {
                              const rawPid = patient?.patientId || patient?.slNo || '';
                              const cleanPid = String(rawPid).toUpperCase().startsWith('P')
                                ? `P${String(rawPid).replace(/^P+/i, '')}`
                                : `P${rawPid}`;
                              navigate(
                                `/patients/${cleanPid}/template/${rId}?name=${encodeURIComponent(tmpl.testName || tmpl.TEMPLATE_NAME)}`,
                                { state: { patient } }
                              );
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
                            title="Open full-page dedicated template findings editor (My Editor)"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">My Editor</span>
                          </button>

                          {/* Upstream AWS Template Editor */}
                          <button
                            type="button"
                            onClick={() => {
                              const rawPid = patient?.patientId || patient?.slNo || '';
                              const cleanPid = String(rawPid).toUpperCase().startsWith('P')
                                ? `P${String(rawPid).replace(/^P+/i, '')}`
                                : `P${rawPid}`;
                              openUpstreamTemplateEditor({
                                patientId: cleanPid,
                                reportId: rId,
                                name: tmpl.testName || tmpl.TEMPLATE_NAME,
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-800 rounded-lg text-xs font-bold border border-amber-300 shadow-2xs transition-all cursor-pointer"
                            title="Open official AWS template editor (editTemplateV2.jsp) in new window"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
                            <span className="hidden md:inline">AWS Editor</span>
                          </button>

                          {/* Download Result from Analyzer (DOWNLOADRESULT) - Checking possibleDownload !== false */}
                          {tmpl.possibleDownload !== false && (
                            <button
                              type="button"
                              onClick={() => handleDownload(tmpl)}
                              disabled={activeDownloadingId === rId}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 hover:bg-violet-100 active:scale-95 text-violet-700 rounded-lg text-xs font-bold border border-violet-200 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                              title="Download Result from Analyzer Equipment (DOWNLOADRESULT)"
                            >
                              {activeDownloadingId === rId ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />
                              ) : (
                                <Download className="w-3.5 h-3.5 text-violet-600" />
                              )}
                              <span className="hidden md:inline">Download</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleCollapse(rId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 active:scale-95 text-purple-700 rounded-lg text-xs font-bold border border-purple-200 shadow-2xs transition-all cursor-pointer"
                            title="Toggle inline edit drawer"
                          >
                            <span>{isExpanded ? 'Close' : 'Inline'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {onDeleteReport && (
                            <button
                              type="button"
                              onClick={() => onDeleteReport(tmpl)}
                              disabled={isDeleting}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 rounded-lg text-xs font-bold border border-rose-200 transition-all cursor-pointer disabled:opacity-50"
                              title="Delete this template report"
                            >
                              {isDeleting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              )}
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Inline Expand Drawer for Table Mode */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="p-0 bg-slate-50/80 border-b border-purple-100">
                          <div className="p-3.5 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-purple-900">
                                Inline Examination Findings for {tmpl.testName} (#{rId})
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSaveSingle(rId)}
                                disabled={state.saving || !isItemDirty}
                                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isItemDirty
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-2xs'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                {state.saving ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Save className="w-3.5 h-3.5" />
                                )}
                                <span>Save Changes</span>
                              </button>
                            </div>

                            {/* Section arrays */}
                            {state.resultJson?.Exam && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.keys(state.resultJson.Exam).map((sName) => (
                                  <div
                                    key={sName}
                                    className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-2"
                                  >
                                    <div className="text-xs font-bold text-slate-800 border-b pb-1">
                                      {sName}
                                    </div>
                                    <div className="space-y-1.5">
                                      {(state.resultJson.Exam[sName] || []).map((p, pIdx) => (
                                        <div key={pIdx} className="flex items-center gap-2">
                                          <span className="w-1/2 text-xs font-medium text-slate-700 truncate" title={p.Name}>
                                            {p.Name}
                                          </span>
                                          <input
                                            type="text"
                                            value={p.Value || ''}
                                            onChange={(e) =>
                                              handleValueChange(rId, sName, pIdx, e.target.value)
                                            }
                                            className="w-1/2 text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 font-mono"
                                            placeholder="Value..."
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

