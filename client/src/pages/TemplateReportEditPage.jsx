import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../services/api.js';
import {
  FileText,
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  User,
  CreditCard,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { sortSectionKeys, orderExamObject, getDefaultTemplateSchema } from '../utils/templateSequence.js';
import { formatDisplayDate, formatAgeDisplay } from '../utils/dateUtils.js';

export default function TemplateReportEditPage() {
  const { id: patientIdParam, reportId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isMasterTemplate =
    String(patientIdParam || '').toUpperCase() === 'P14' ||
    searchParams.get('from') === 'master' ||
    location.pathname.startsWith('/master/template');

  const patientId = patientIdParam || (isMasterTemplate ? 'P14' : '');
  const queryName = searchParams.get('name') || '';

  const [loading, setLoading] = useState(!location.state?.patient && !isMasterTemplate);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Patient Demographic Information (prefilled from router state if available)
  const [patient, setPatient] = useState(
    location.state?.patient ||
      (isMasterTemplate
        ? {
            name: 'Master Template Blueprint',
            patientId: 'P14',
            barcode: searchParams.get('templateId') || reportId,
            doctor: 'MASTER CATALOG',
          }
        : null)
  );

  // Template Data State
  const [headingName, setHeadingName] = useState(queryName || 'HbA1C Report');
  const [templateType, setTemplateType] = useState('HBA1C');

  // HbA1C Specific State
  const [hba1cResult, setHba1cResult] = useState([
    { name: 'Glycated Haemoglobin (HbA1c)', operator: '-', value: '', unit: '% ofTotal Hb', refRange: '<6%' },
    { name: 'Estimated Average Glucose', operator: '-', value: '', unit: 'mg/dL', refRange: '' },
  ]);

  const [peakDataTable, setPeakDataTable] = useState([
    { peak: 'HbA1a', time: '', abs: '', area: '', result: '', refRange: '' },
    { peak: 'HbA1b', time: '', abs: '', area: '', result: '', refRange: '' },
    { peak: 'HbF', time: '', abs: '', area: '', result: '', refRange: '' },
    { peak: 'LA1c', time: '', abs: '', area: '', result: '', refRange: '' },
    { peak: 'HbA1c', time: '', abs: '', area: '', result: '', refRange: '' },
    { peak: 'HbA0', time: '', abs: '', area: '', result: '', refRange: '' },
    { peak: 'V_Win', time: '', abs: '', area: '', result: '', refRange: '' },
  ]);

  const [summaryResult, setSummaryResult] = useState([
    { name: 'TotalArea', val1: '', val2: '' },
    { name: 'HbA1C(NGSP)', val1: '', val2: '' },
    { name: 'eAG(ADA)', val1: '', val2: '' },
    { name: 'HbA1C(IFCC)', val1: '', val2: '' },
    { name: 'eAG[ADA]', val1: '', val2: '' },
  ]);

  const [others, setOthers] = useState([
    { name: 'Others 1', value: '' },
    { name: 'Others 2', value: '' },
    { name: 'Others 3', value: '' },
  ]);

  const [drawingData, setDrawingData] = useState([
    { name: 'Peak Data', value: '' },
    { name: 'Graph Data', value: '' },
  ]);

  // General Examination State (for Stool, Urine, Semen, CSF, etc.)
  const [generalExam, setGeneralExam] = useState(null);

  // Load Patient and Template JSON
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setErrorMsg('');

      const rawPid = String(patientId || '').trim();
      const cleanPid = rawPid.toUpperCase().startsWith('P')
        ? `P${rawPid.replace(/^P+/i, '')}`
        : `P${rawPid}`;

      try {
        let loadedPatient = null;
        let templatesList = [];

        // 1. Fetch Patient Info & Templates directly via /reports/patient-report
        try {
          const ptRes = await api.get('/reports/patient-report', {
            params: { patientId: cleanPid, withBilling: isMasterTemplate ? 'false' : 'true' },
          });
          if (isMounted && ptRes.data?.patient) {
            loadedPatient = isMasterTemplate
              ? {
                  name: 'Master Template Blueprint',
                  patientId: 'P14',
                  barcode: searchParams.get('templateId') || reportId,
                  doctor: 'MASTER CATALOG',
                }
              : ptRes.data.patient;
            setPatient(loadedPatient);
          }
          if (Array.isArray(ptRes.data?.templates)) {
            templatesList = ptRes.data.templates;
          }
        } catch (ptErr) {
          console.warn('[TemplateReportEditPage] Patient-report fetch note:', ptErr.message);
        }

        // Fallback: If patient was not returned, try /patient/:id
        if (!loadedPatient) {
          try {
            const fallbackRes = await api.get(`/patient/${cleanPid}`);
            if (isMounted && fallbackRes.data?.patient) {
              loadedPatient = fallbackRes.data.patient;
              setPatient(loadedPatient);
            }
          } catch {
            // ignore
          }
        }

        // 2. Identify Matching Template from Patient's Templates List
        const cleanRid = String(reportId || '').trim().toLowerCase();
        const matchedTmpl = templatesList.find(
          (t) =>
            String(t.reportId || '').trim().toLowerCase() === cleanRid ||
            String(t.templatesId || '').trim().toLowerCase() === cleanRid ||
            String(t.id || '').trim().toLowerCase() === cleanRid
        ) || (templatesList.length === 1 ? templatesList[0] : null);

        let resultJson = matchedTmpl?.resultJsonParsed || matchedTmpl?.resultJson || matchedTmpl?.resultJSON;
        if (typeof resultJson === 'string') {
          try {
            resultJson = JSON.parse(resultJson);
          } catch {
            resultJson = null;
          }
        }

        const effectiveName =
          resultJson?.headingName ||
          resultJson?.TEMPLATE_NAME ||
          matchedTmpl?.TEMPLATE_NAME ||
          matchedTmpl?.name ||
          queryName ||
          'Template Report';

        setHeadingName(effectiveName);

        // 3. If no prefilled findings found on patient, fetch template schema from /reports/template-json
        if (!resultJson || (!resultJson.Exam && !resultJson.peakDataTable)) {
          try {
            const tmplRes = await api.get('/reports/template-json', {
              params: {
                reportId,
                templateName: effectiveName,
              },
            });

            const rep = tmplRes.data?.templateReport || tmplRes.data?.payLoadJSON?.TemplateReport;
            const fetchedJson = rep?.resultJSON || rep?.resultJson;
            if (fetchedJson) {
              if (typeof fetchedJson === 'string') {
                try {
                  resultJson = JSON.parse(fetchedJson);
                } catch {
                  resultJson = null;
                }
              } else {
                resultJson = fetchedJson;
              }
            }
          } catch (tmplErr) {
            console.warn('[TemplateReportEditPage] Template schema fetch note:', tmplErr.message);
          }
        }

        if (!isMounted) return;

        // 4. Distinguish between HbA1C and General Examinations
        const isHbA1C =
          resultJson?.templateType === 'HBA1C' ||
          effectiveName.toUpperCase().includes('HBA1C') ||
          effectiveName.toUpperCase().includes('GLYCATED') ||
          resultJson?.peakDataTable !== undefined ||
          Boolean(resultJson?.Exam?.PeakData);

        if (isHbA1C) {
          setTemplateType('HBA1C');

          // A. HbA1C Result
          const resArr = resultJson?.hba1cResult || resultJson?.Exam?.Result || resultJson?.Exam?.['HbA1C Result'];
          if (Array.isArray(resArr) && resArr.length > 0) {
            setHba1cResult(
              resArr.map((r) => ({
                name: r.Name || r.name || 'Parameter',
                operator: r.operator || '-',
                value: r.Value !== undefined ? String(r.Value) : (r.value !== undefined ? String(r.value) : ''),
                unit: r.Unit || r.unit || '',
                refRange: r['Ref Range'] || r.RefRange || r.refRange || '',
              }))
            );
          }

          // B. Peak Data Table
          const peakArr = resultJson?.peakDataTable || resultJson?.Exam?.PeakData || resultJson?.Exam?.['Peak Data'];
          if (Array.isArray(peakArr) && peakArr.length > 0) {
            setPeakDataTable(
              peakArr.map((p) => ({
                peak: p.Peak || p.peak || '',
                time: p.Time !== undefined ? String(p.Time) : (p.time !== undefined ? String(p.time) : ''),
                abs: p.ABS !== undefined ? String(p.ABS) : (p.abs !== undefined ? String(p.abs) : ''),
                area: p.Area !== undefined ? String(p.Area) : (p.area !== undefined ? String(p.area) : ''),
                result: p.Result !== undefined ? String(p.Result) : (p.result !== undefined ? String(p.result) : ''),
                refRange: p['Ref Range'] || p.RefRange || p.refRange || '',
              }))
            );
          }

          // C. Summary Result / Final Result
          const sumArr = resultJson?.summaryResult || resultJson?.Exam?.['Final Result'] || resultJson?.Exam?.['Summary Result'];
          if (Array.isArray(sumArr) && sumArr.length > 0) {
            setSummaryResult(
              sumArr.map((s) => ({
                name: s.Name || s.name || '',
                val1: s.Value !== undefined ? String(s.Value) : (s.val1 !== undefined ? String(s.val1) : ''),
                val2: s.Unit || s.val2 || '',
              }))
            );
          }

          // D. Others
          const othArr = resultJson?.others || resultJson?.Exam?.Others;
          if (Array.isArray(othArr) && othArr.length > 0) {
            setOthers(
              othArr.map((o) => ({
                name: o.Name || o.name || '',
                value: o.Value !== undefined ? String(o.Value) : (o.value !== undefined ? String(o.value) : ''),
              }))
            );
          }

          // E. Drawing Data
          const drawArr = resultJson?.drawingData || resultJson?.Exam?.['Drawing Data'];
          if (Array.isArray(drawArr) && drawArr.length > 0) {
            setDrawingData(
              drawArr.map((d) => ({
                name: d.Name || d.name || '',
                value: d.Value !== undefined ? String(d.Value) : (d.value !== undefined ? String(d.value) : ''),
              }))
            );
          }
        } else {
          // GENERAL EXAMINATION (URINE, STOOL, SEMEN, CSF, HISTOPATHOLOGY, etc.)
          setTemplateType('GENERAL');
          let examData = resultJson?.Exam || resultJson?.exam;

          if (!examData || typeof examData !== 'object' || Object.keys(examData).length === 0) {
            examData = getDefaultTemplateSchema(effectiveName);
          }

          setGeneralExam(orderExamObject(examData, effectiveName));
        }
      } catch (err) {
        if (isMounted) {
          setErrorMsg('Failed to load template data from server. Default form initialized.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (patientId && reportId) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [patientId, reportId, queryName]);

  // Handle Save
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    let compiledJson = {};

    if (templateType === 'HBA1C') {
      compiledJson = {
        TEMPLATE_NAME: headingName,
        headingName,
        templateType: 'HBA1C',
        hba1cResult,
        peakDataTable,
        summaryResult,
        others,
        drawingData,
        Exam: {
          'HbA1C Result': hba1cResult.map((r) => ({ Name: r.name, Value: r.value, Unit: r.unit, RefRange: r.refRange })),
          Result: hba1cResult.map((r) => ({ Name: r.name, Value: r.value, Unit: r.unit, RefRange: r.refRange })),
          PeakData: peakDataTable.map((p) => ({ Peak: p.peak, Time: p.time, ABS: p.abs, Area: p.area, Result: p.result, RefRange: p.refRange })),
          'Summary Result': summaryResult.map((r) => ({ Name: r.name, Value: r.val1 })),
          'Final Result': summaryResult.map((r) => ({ Name: r.name, Value: r.val1, Unit: r.val2 })),
          Others: others.map((o) => ({ Name: o.name, Value: o.value })),
          'Drawing Data': drawingData.map((d) => ({ Name: d.name, Value: d.value })),
        },
      };
    } else {
      compiledJson = {
        TEMPLATE_NAME: headingName,
        headingName,
        Exam: orderExamObject(generalExam || {}, headingName),
      };
    }

    try {
      const res = await api.post(
        `/reports/template-data?reportId=${encodeURIComponent(reportId)}&patientId=${encodeURIComponent(patientId)}`,
        {
          ...compiledJson,
          patientId,
          reportId,
          templateId: searchParams.get('templateId') || '',
        }
      );

      if (res.data?.STATUS === 'SUCCESS' || res.data?.StatusCode === '0000') {
        setSuccessMsg(
          isMasterTemplate
            ? 'Master Template Blueprint Saved Successfully!'
            : 'Template Report Saved Successfully!'
        );
        setTimeout(() => {
          if (isMasterTemplate) {
            navigate('/master?tab=templates');
          } else {
            navigate(`/patients/${patientId}?tab=results`);
          }
        }, 900);
      } else {
        throw new Error(res.data?.Message || 'Failed to save template report');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.Message || err.message || 'Server error updating template report');
    } finally {
      setSaving(false);
    }
  };

  const isPaid = patient?.billPayStatus === 2 || patient?.billPayStatus === '2' || (patient && Number(patient.dueAmount) <= 0 && Number(patient.totalBill) > 0);
  const cleanPid = patientId ? (String(patientId).toUpperCase().startsWith('P') ? patientId : `P${patientId}`) : '';

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-300">
      <Helmet>
        <title>{isMasterTemplate ? `Master Blueprint - ${headingName}` : `Edit Template Report - ${headingName}`} | LIS Portal</title>
      </Helmet>

      {/* Top Navigation Row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            if (isMasterTemplate) {
              navigate('/master?tab=templates');
            } else {
              navigate(`/patients/${patientId}?tab=results`);
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isMasterTemplate ? 'Back to Master Catalog (Templates)' : 'Back to Patient Reports'}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-400">
            {isMasterTemplate ? `Master Template Blueprint #${reportId}` : `Template Report #${reportId}`}
          </span>
        </div>
      </div>

      {/* 1. MASTER BLUEPRINT BANNER OR REAL PATIENT DEMOGRAPHIC BANNER */}
      {isMasterTemplate ? (
        <div className="bg-gradient-to-r from-purple-50/95 via-indigo-50/85 to-blue-50/75 border border-purple-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-extrabold font-mono text-sm shadow-md ring-4 ring-purple-100 shrink-0">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                    {headingName}
                  </h2>
                  <span className="font-mono text-xs font-bold text-purple-700 bg-purple-100/90 border border-purple-300 px-2 py-0.5 rounded-md">
                    Master #{searchParams.get('templateId') || reportId}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-md">
                    Master Blueprint
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  Master Catalog Blueprint • Configure default parameter names (Blue), prefilled observation paragraphs (Red), and units (Green) applied when this examination is added to any patient.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <div className="bg-white/90 border border-purple-200/90 rounded-xl px-3.5 py-2 shadow-2xs text-left min-w-[130px]">
                <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Catalog Key</div>
                <div className="text-xs font-mono font-black text-slate-800 mt-0.5">
                  P14 • {reportId}
                </div>
              </div>
              <div className="bg-white/90 border border-emerald-200/90 rounded-xl px-3.5 py-2 shadow-2xs text-left min-w-[140px]">
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Catalog Scope</div>
                <div className="text-xs font-black text-slate-800 mt-0.5">
                  Applies to All Patients
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/50 border border-blue-200/90 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Barcode Pill & Patient Name */}
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold font-mono text-sm shadow-md ring-4 ring-blue-100 shrink-0">
              {patient?.patientId || cleanPid || 'ID'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                  {patient?.name
                    ? `${patient.title ? patient.title + ' ' : ''}${patient.name}`
                    : (patient ? `Patient (${cleanPid})` : (loading ? 'Loading Patient Details...' : `Patient (${cleanPid})`))}
                </h2>
                {(patient?.slNo || patient?.barcode) && (
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100/80 border border-blue-200 px-2 py-0.5 rounded-md">
                    #{patient.slNo || patient.barcode}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5 flex-wrap">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {formatDisplayDate(patient?.regDate || patient?.collectionDate || patient?.date)}
                  </span>
                </div>
                {patient?.sampleTime && (
                  <>
                    <span>•</span>
                    <span className="text-[11px] text-amber-700 font-semibold">
                      Sample: {patient.sampleTime}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Demographic Boxes */}
          <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap text-center">
            {/* Age / Sex */}
            <div className="bg-white/80 border border-blue-200/80 rounded-xl px-3.5 py-1.5 shadow-2xs min-w-[110px]">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age / Sex</div>
              <div className="text-xs font-black text-slate-900 mt-0.5">
                {formatAgeDisplay(patient?.age, patient?.age_unit)} / {patient?.gender || '-'}
              </div>
            </div>

            {/* Referred By */}
            <div className="bg-white/80 border border-blue-200/80 rounded-xl px-3.5 py-1.5 shadow-2xs min-w-[110px]">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Referred</div>
              <div className="text-xs font-black text-rose-600 uppercase mt-0.5 truncate max-w-[150px]" title={patient?.referedDr || patient?.doctor || patient?.referDr || 'SELF'}>
                {patient?.referedDr || patient?.doctor || patient?.referDr || 'SELF'}
              </div>
            </div>

            {/* Mobile */}
            <div className="bg-white/80 border border-blue-200/80 rounded-xl px-3.5 py-1.5 shadow-2xs min-w-[100px]">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile</div>
              <div className="text-xs font-bold text-slate-700 font-mono mt-0.5">
                {patient?.mobile || patient?.phone || '-'}
              </div>
            </div>

            {/* Payment Status */}
            <div className="bg-white/80 border border-blue-200/80 rounded-xl px-3.5 py-1.5 shadow-2xs min-w-[100px]">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment</div>
              <div className="mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                    isPaid
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  <CreditCard className="w-3 h-3" />
                  <span>
                    {isPaid ? 'PAID' : (patient?.dueAmount !== undefined && Number(patient.dueAmount) > 0 ? `DUE ₹${patient.dueAmount}` : (patient?.totalBill && Number(patient.totalBill) > 0 ? `DUE ₹${patient.totalBill}` : 'UNPAID'))}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. FORM BODY (MATCHING IMAGE 1) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-6">
        {/* Title & Heading Name */}
        <div className="space-y-2 border-b pb-4">
          <div className="flex items-center gap-2 text-blue-700 font-extrabold text-sm sm:text-base">
            <span>👤+</span>
            <span>Edit Template Report</span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Heading Name
            </label>
            <input
              type="text"
              value={headingName}
              onChange={(e) => setHeadingName(e.target.value)}
              className="w-full text-sm font-extrabold text-slate-900 bg-white border-2 border-emerald-500 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="e.g. HbA1C Report"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-semibold">Loading template findings...</span>
          </div>
        ) : templateType === 'HBA1C' ? (
          /* ======================================================== */
          /* HbA1C REPORT SECTIONS (EXACT REPLICA OF IMAGE 1)         */
          /* ======================================================== */
          <div className="space-y-6">
            {/* Section A: HbA1C Result */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-blue-700 uppercase tracking-wide">
                HbA1C Result
              </h3>

              <div className="space-y-2">
                {hba1cResult.map((row, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* 1. BLUE BOX: Editable Parameter Name */}
                    <input
                      type="text"
                      value={row.name || ''}
                      onChange={(e) => {
                        const next = [...hba1cResult];
                        next[idx].name = e.target.value;
                        setHba1cResult(next);
                      }}
                      placeholder="Parameter Name"
                      title="Click to edit parameter name (Blue Box)"
                      className="sm:w-64 border-2 border-blue-600 rounded-lg px-3 py-1.5 font-bold text-xs text-blue-900 bg-blue-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 shrink-0 shadow-2xs transition-colors"
                    />

                    {/* 2. Operator Dropdown (Blue Border) */}
                    <select
                      value={row.operator || '-'}
                      onChange={(e) => {
                        const next = [...hba1cResult];
                        next[idx].operator = e.target.value;
                        setHba1cResult(next);
                      }}
                      className="border-2 border-blue-600 rounded-lg px-2.5 py-1.5 text-xs font-bold text-blue-900 bg-white focus:outline-none shrink-0"
                    >
                      <option value="-">-</option>
                      <option value=">">&gt;</option>
                      <option value="<">&lt;</option>
                      <option value="=">=</option>
                      <option value="≥">≥</option>
                      <option value="≤">≤</option>
                    </select>

                    {/* 3. RED BOX: Value Input */}
                    <input
                      type="text"
                      value={row.value || ''}
                      onChange={(e) => {
                        const next = [...hba1cResult];
                        next[idx].value = e.target.value;
                        setHba1cResult(next);
                      }}
                      placeholder="Value"
                      title="Enter finding / value (Red Box)"
                      className="w-full sm:w-36 border-2 border-rose-500 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-2xs"
                    />

                    {/* 4. GREEN BOX: Editable Unit */}
                    <input
                      type="text"
                      value={row.unit || ''}
                      onChange={(e) => {
                        const next = [...hba1cResult];
                        next[idx].unit = e.target.value;
                        setHba1cResult(next);
                      }}
                      placeholder="Unit"
                      title="Click to edit unit (Green Box)"
                      className="w-28 sm:w-36 border-2 border-emerald-500 rounded-lg px-3 py-1.5 font-bold text-xs text-emerald-800 bg-emerald-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-center shrink-0 shadow-2xs transition-colors"
                    />

                    {/* 5. AMBER BOX: Editable Ref Range */}
                    <input
                      type="text"
                      value={row.refRange || ''}
                      onChange={(e) => {
                        const next = [...hba1cResult];
                        next[idx].refRange = e.target.value;
                        setHba1cResult(next);
                      }}
                      placeholder="Ref Range"
                      title="Click to edit reference range"
                      className="sm:w-44 border-2 border-amber-500 rounded-lg px-3 py-1.5 font-bold text-xs text-amber-900 bg-amber-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-center shrink-0 shadow-2xs transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Section B: Peak Data Table (Exact Image 1 Matrix) */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-blue-700 uppercase tracking-wide">
                Peak Data Table
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-separate border-spacing-2">
                  <thead>
                    <tr>
                      <th className="border-2 border-blue-600 rounded-lg py-1.5 px-3 text-blue-900 font-black text-left w-36 bg-blue-50/30">
                        Peak
                      </th>
                      <th className="border-2 border-rose-500 rounded-lg py-1.5 px-3 text-rose-700 font-black text-center bg-rose-50/20">
                        Time
                      </th>
                      <th className="border-2 border-rose-500 rounded-lg py-1.5 px-3 text-rose-700 font-black text-center bg-rose-50/20">
                        ABS
                      </th>
                      <th className="border-2 border-rose-500 rounded-lg py-1.5 px-3 text-rose-700 font-black text-center bg-rose-50/20">
                        Area
                      </th>
                      <th className="border-2 border-rose-500 rounded-lg py-1.5 px-3 text-rose-700 font-black text-center bg-rose-50/20">
                        Result
                      </th>
                      <th className="border-2 border-rose-500 rounded-lg py-1.5 px-3 text-rose-700 font-black text-center bg-rose-50/20">
                        Ref Range
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {peakDataTable.map((row, idx) => (
                      <tr key={idx}>
                        {/* Peak Name */}
                        <td className="border-2 border-blue-600 rounded-lg py-1.5 px-3 font-bold text-blue-900 bg-blue-50/20">
                          {row.peak}
                        </td>

                        {/* Time */}
                        <td>
                          <input
                            type="text"
                            value={row.time || ''}
                            onChange={(e) => {
                              const next = [...peakDataTable];
                              next[idx].time = e.target.value;
                              setPeakDataTable(next);
                            }}
                            className="w-full border-2 border-rose-500 rounded-lg py-1.5 px-2 text-center text-xs font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-rose-400"
                          />
                        </td>

                        {/* ABS */}
                        <td>
                          <input
                            type="text"
                            value={row.abs || ''}
                            onChange={(e) => {
                              const next = [...peakDataTable];
                              next[idx].abs = e.target.value;
                              setPeakDataTable(next);
                            }}
                            className="w-full border-2 border-rose-500 rounded-lg py-1.5 px-2 text-center text-xs font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-rose-400"
                          />
                        </td>

                        {/* Area */}
                        <td>
                          <input
                            type="text"
                            value={row.area || ''}
                            onChange={(e) => {
                              const next = [...peakDataTable];
                              next[idx].area = e.target.value;
                              setPeakDataTable(next);
                            }}
                            className="w-full border-2 border-rose-500 rounded-lg py-1.5 px-2 text-center text-xs font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-rose-400"
                          />
                        </td>

                        {/* Result */}
                        <td>
                          <input
                            type="text"
                            value={row.result || ''}
                            onChange={(e) => {
                              const next = [...peakDataTable];
                              next[idx].result = e.target.value;
                              setPeakDataTable(next);
                            }}
                            className="w-full border-2 border-rose-500 rounded-lg py-1.5 px-2 text-center text-xs font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-rose-400"
                          />
                        </td>

                        {/* Ref Range */}
                        <td>
                          <input
                            type="text"
                            value={row.refRange || ''}
                            onChange={(e) => {
                              const next = [...peakDataTable];
                              next[idx].refRange = e.target.value;
                              setPeakDataTable(next);
                            }}
                            className="w-full border-2 border-rose-500 rounded-lg py-1.5 px-2 text-center text-xs font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-rose-400"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section C: Summary Result */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-blue-700 uppercase tracking-wide">
                Summary Result
              </h3>

              <div className="space-y-2">
                {summaryResult.map((row, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2">
                    {/* 1. BLUE BOX: Editable Row Name */}
                    <input
                      type="text"
                      value={row.name || ''}
                      onChange={(e) => {
                        const next = [...summaryResult];
                        next[idx].name = e.target.value;
                        setSummaryResult(next);
                      }}
                      placeholder="Parameter Name"
                      title="Click to edit parameter name (Blue Box)"
                      className="sm:w-64 border-2 border-blue-600 rounded-lg px-3 py-2 font-bold text-xs text-blue-900 bg-blue-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 shrink-0 shadow-2xs transition-colors"
                    />

                    {/* 2. RED BOX: Multi-line Paragraph Observation */}
                    <textarea
                      rows={2}
                      value={row.val1 || ''}
                      onChange={(e) => {
                        const next = [...summaryResult];
                        next[idx].val1 = e.target.value;
                        setSummaryResult(next);
                      }}
                      className="flex-1 min-w-[240px] w-full border-2 border-rose-500 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 resize-y min-h-[42px] leading-relaxed shadow-2xs"
                      placeholder="Reading / Observation"
                    />

                    {/* 3. GREEN BOX: Editable Unit / Suffix */}
                    <input
                      type="text"
                      value={row.val2 || ''}
                      onChange={(e) => {
                        const next = [...summaryResult];
                        next[idx].val2 = e.target.value;
                        setSummaryResult(next);
                      }}
                      className="w-28 sm:w-36 border-2 border-emerald-500 rounded-lg px-3 py-2 text-xs font-mono font-bold text-emerald-900 bg-emerald-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-center shrink-0 shadow-2xs"
                      placeholder="Unit"
                      title="Click to edit unit (Green Box)"
                    />
                  </div>
                ))}

                {/* Others 1, 2, 3 Textareas */}
                <div className="pt-2 space-y-2">
                  {others.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2">
                      <input
                        type="text"
                        value={item.name || ''}
                        onChange={(e) => {
                          const next = [...others];
                          next[idx].name = e.target.value;
                          setOthers(next);
                        }}
                        placeholder="Section / Note Name"
                        title="Click to edit section name (Blue Box)"
                        className="sm:w-64 border-2 border-blue-600 rounded-lg px-3 py-2 font-bold text-xs text-blue-900 bg-blue-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 shrink-0 shadow-2xs transition-colors"
                      />
                      <textarea
                        rows={2}
                        value={item.value || ''}
                        onChange={(e) => {
                          const next = [...others];
                          next[idx].value = e.target.value;
                          setOthers(next);
                        }}
                        className="flex-1 w-full border-2 border-rose-500 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 resize-y min-h-[42px] shadow-2xs"
                        placeholder={`Enter ${item.name} observation...`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section D: Drawing Data */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-blue-700 uppercase tracking-wide">
                Drawing Data
              </h3>

              <div className="space-y-2">
                {drawingData.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2">
                    <input
                      type="text"
                      value={item.name || ''}
                      onChange={(e) => {
                        const next = [...drawingData];
                        next[idx].name = e.target.value;
                        setDrawingData(next);
                      }}
                      placeholder="Data Label"
                      title="Click to edit data label (Blue Box)"
                      className="sm:w-64 border-2 border-blue-600 rounded-lg px-3 py-2 font-bold text-xs text-blue-900 bg-blue-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 shrink-0 shadow-2xs transition-colors"
                    />
                    <textarea
                      rows={2}
                      value={item.value || ''}
                      onChange={(e) => {
                        const next = [...drawingData];
                        next[idx].value = e.target.value;
                        setDrawingData(next);
                      }}
                      className="w-full border-2 border-rose-500 rounded-lg p-2 text-xs font-mono font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                      placeholder={`Enter ${item.name} coordinates or telemetry stream...`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* GENERAL EXAMINATION (STOOL, URINE, SEMEN, CSF, CUSTOM)  */
          /* ======================================================== */
          <div className="space-y-6">
            {generalExam &&
              sortSectionKeys(Object.keys(generalExam), headingName).map((sectionName) => (
                <div key={sectionName} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-blue-700 uppercase tracking-wide">
                      {sectionName}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        const nextExam = { ...generalExam };
                        if (!Array.isArray(nextExam[sectionName])) nextExam[sectionName] = [];
                        nextExam[sectionName].push({ Name: '', Value: '', Unit: '' });
                        setGeneralExam(nextExam);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50/80 hover:bg-blue-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                      title={`Add parameter to ${sectionName}`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Item</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {(generalExam[sectionName] || []).map((item, idx) => {
                      const hasUnit =
                        item.Unit !== undefined &&
                        item.Unit !== null &&
                        (item.Unit !== '' || item.showUnitInput);
                      const hasRefRange =
                        item.RefRange !== undefined &&
                        item.RefRange !== null &&
                        item.RefRange !== '';

                      return (
                        <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2">
                          {/* 1. BLUE BOX: Editable Parameter Name */}
                          <input
                            type="text"
                            value={item.Name || ''}
                            onChange={(e) => {
                              const nextExam = { ...generalExam };
                              nextExam[sectionName][idx].Name = e.target.value;
                              setGeneralExam(nextExam);
                            }}
                            placeholder="Parameter Name"
                            title="Click to edit parameter name (Blue Box)"
                            className="sm:w-64 border-2 border-blue-600 rounded-lg px-3 py-2 font-bold text-xs text-blue-900 bg-blue-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 shrink-0 shadow-2xs transition-colors"
                          />

                          {/* 2. RED BOX: Multi-line Paragraph Observation / Finding */}
                          <textarea
                            rows={2}
                            value={item.Value || ''}
                            onChange={(e) => {
                              const nextExam = { ...generalExam };
                              nextExam[sectionName][idx].Value = e.target.value;
                              setGeneralExam(nextExam);
                            }}
                            placeholder="Observation / Finding"
                            title="Enter observation or multi-line clinical paragraph (Red Box)"
                            className="flex-1 min-w-[280px] w-full border-2 border-rose-500 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 resize-y min-h-[42px] leading-relaxed shadow-2xs transition-colors"
                          />

                          {/* 3. GREEN BOX: Editable Unit */}
                          {hasUnit ? (
                            <input
                              type="text"
                              value={item.Unit || ''}
                              onChange={(e) => {
                                const nextExam = { ...generalExam };
                                nextExam[sectionName][idx].Unit = e.target.value;
                                setGeneralExam(nextExam);
                              }}
                              placeholder="Unit (/CU.mm)"
                              title="Click to edit unit (Green Box)"
                              className="w-28 sm:w-32 border-2 border-emerald-500 rounded-lg px-3 py-2 font-bold text-xs text-emerald-800 bg-emerald-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-center shrink-0 shadow-2xs transition-colors"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const nextExam = { ...generalExam };
                                nextExam[sectionName][idx].Unit = '';
                                nextExam[sectionName][idx].showUnitInput = true;
                                setGeneralExam(nextExam);
                              }}
                              title="Add unit to this examination parameter"
                              className="self-center px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50/80 hover:bg-emerald-100 rounded-lg border border-dashed border-emerald-400 transition-colors cursor-pointer shrink-0"
                            >
                              + Unit
                            </button>
                          )}

                          {/* 4. AMBER BOX: Editable Ref Range (if present) */}
                          {hasRefRange && (
                            <input
                              type="text"
                              value={item.RefRange || ''}
                              onChange={(e) => {
                                const nextExam = { ...generalExam };
                                nextExam[sectionName][idx].RefRange = e.target.value;
                                setGeneralExam(nextExam);
                              }}
                              placeholder="Ref Range"
                              title="Click to edit reference range"
                              className="sm:w-36 border-2 border-amber-500 rounded-lg px-3 py-2 font-bold text-xs text-amber-900 bg-amber-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-center shrink-0 shadow-2xs transition-colors"
                            />
                          )}

                          {/* Delete Item (if more than 1 item in section) */}
                          {(generalExam[sectionName] || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const nextExam = { ...generalExam };
                                nextExam[sectionName] = nextExam[sectionName].filter((_, i) => i !== idx);
                                setGeneralExam(nextExam);
                              }}
                              title="Delete this parameter"
                              className="self-center p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* 3. SAVE BUTTON */}
        <div className="pt-4 border-t flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isMasterTemplate ? 'Save Master Blueprint' : 'Save Report'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isMasterTemplate) {
                navigate('/master?tab=templates');
              } else {
                navigate(`/patients/${patientId}?tab=results`);
              }
            }}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

