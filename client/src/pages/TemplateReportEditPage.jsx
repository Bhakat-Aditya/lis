import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { sortSectionKeys, orderExamObject, getDefaultTemplateSchema } from '../utils/templateSequence.js';
import { formatDisplayDate } from '../utils/dateUtils.js';

export default function TemplateReportEditPage() {
  const { id: patientId, reportId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryName = searchParams.get('name') || '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Patient Demographic Information
  const [patient, setPatient] = useState(null);

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
            params: { patientId: cleanPid, withBilling: 'true' },
          });
          if (isMounted && ptRes.data?.patient) {
            loadedPatient = ptRes.data.patient;
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
        `/reports/template-data?reportId=${encodeURIComponent(reportId)}`,
        compiledJson
      );

      if (res.data?.STATUS === 'SUCCESS' || res.data?.StatusCode === '0000') {
        setSuccessMsg('Template Report Saved Successfully!');
        setTimeout(() => {
          navigate(`/patients/${patientId}?tab=results`);
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
        <title>Edit Template Report - {headingName} | LIS Portal</title>
      </Helmet>

      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(`/patients/${patientId}?tab=results`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patient Reports</span>
        </button>

        <span className="text-xs font-mono font-bold text-slate-400">
          Template Report #{reportId}
        </span>
      </div>

      {/* 1. REAL PATIENT DEMOGRAPHIC BANNER */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/50 border border-blue-200/90 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Barcode Pill & Patient Name */}
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold font-mono text-sm shadow-md ring-4 ring-blue-100 shrink-0">
              {patient?.slNo || patient?.barcode || cleanPid || 'ID'}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                {patient?.name
                  ? `${patient.title ? patient.title + ' ' : ''}${patient.name}`
                  : (patient ? `Patient (${cleanPid})` : (loading ? 'Loading Patient Details...' : `Patient (${cleanPid})`))}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {formatDisplayDate(patient?.regDate || patient?.collectionDate || patient?.date)}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Demographic Boxes */}
          <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap text-center">
            {/* Age / Sex */}
            <div className="bg-white/80 border border-blue-200/80 rounded-xl px-3.5 py-1.5 shadow-2xs min-w-[110px]">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age / Sex</div>
              <div className="text-xs font-black text-slate-900 mt-0.5">
                {patient?.age
                  ? `${patient.age}${!String(patient.age).toLowerCase().includes('year') && !String(patient.age).toLowerCase().includes('day') ? ` ${patient.age_unit || 'Years'}` : ''}`
                  : '-'}{' '}
                / {patient?.gender || '-'}
              </div>
            </div>

            {/* Referred By */}
            <div className="bg-white/80 border border-blue-200/80 rounded-xl px-3.5 py-1.5 shadow-2xs min-w-[110px]">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Referred</div>
              <div className="text-xs font-black text-rose-600 uppercase mt-0.5 truncate max-w-[150px]" title={patient?.referedDr || patient?.doctor || 'SELF'}>
                {patient?.referedDr || patient?.doctor || 'SELF'}
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
                    {isPaid ? 'PAID' : (patient?.dueAmount !== undefined && Number(patient.dueAmount) > 0 ? `DUE ₹${patient.dueAmount}` : 'UNPAID')}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                    {/* 1. Parameter Label (Blue Border) */}
                    <div className="sm:w-64 border-2 border-blue-600 rounded-lg px-3 py-1.5 font-bold text-xs text-blue-900 bg-blue-50/20 shrink-0">
                      {row.name}
                    </div>

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

                    {/* 3. Value Input (Red Border) */}
                    <input
                      type="text"
                      value={row.value || ''}
                      onChange={(e) => {
                        const next = [...hba1cResult];
                        next[idx].value = e.target.value;
                        setHba1cResult(next);
                      }}
                      placeholder="Value"
                      className="w-full sm:w-36 border-2 border-rose-500 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />

                    {/* 4. Unit Box (Green Border) */}
                    <div className="sm:w-36 border-2 border-emerald-500 rounded-lg px-3 py-1.5 font-bold text-xs text-emerald-800 bg-emerald-50/20 text-center shrink-0">
                      {row.unit || '-'}
                    </div>

                    {/* 5. Ref Range Box (Amber Border) */}
                    <div className="sm:w-44 border-2 border-amber-500 rounded-lg px-3 py-1.5 font-bold text-xs text-amber-900 bg-amber-50/20 text-center shrink-0">
                      {row.refRange || '-'}
                    </div>
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
                  <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Row Name (Blue Border) */}
                    <div className="sm:w-64 border-2 border-blue-600 rounded-lg px-3 py-1.5 font-bold text-xs text-blue-900 bg-blue-50/20 shrink-0">
                      {row.name}
                    </div>

                    {/* Value 1 (Red Border) */}
                    <input
                      type="text"
                      value={row.val1 || ''}
                      onChange={(e) => {
                        const next = [...summaryResult];
                        next[idx].val1 = e.target.value;
                        setSummaryResult(next);
                      }}
                      className="w-full sm:w-72 border-2 border-rose-500 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                      placeholder="Reading / Value"
                    />

                    {/* Value 2 (Green Border) */}
                    <input
                      type="text"
                      value={row.val2 || ''}
                      onChange={(e) => {
                        const next = [...summaryResult];
                        next[idx].val2 = e.target.value;
                        setSummaryResult(next);
                      }}
                      className="w-full sm:w-72 border-2 border-emerald-500 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-emerald-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      placeholder="Normalized / Equivalent"
                    />
                  </div>
                ))}

                {/* Others 1, 2, 3 Textareas */}
                <div className="pt-2 space-y-2">
                  {others.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="sm:w-64 border-2 border-blue-600 rounded-lg px-3 py-2 font-bold text-xs text-blue-900 bg-blue-50/20 shrink-0">
                        {item.name}
                      </div>
                      <textarea
                        rows={2}
                        value={item.value || ''}
                        onChange={(e) => {
                          const next = [...others];
                          next[idx].value = e.target.value;
                          setOthers(next);
                        }}
                        className="w-full border-2 border-rose-500 rounded-lg p-2 text-xs font-mono font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
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
                  <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="sm:w-64 border-2 border-blue-600 rounded-lg px-3 py-2 font-bold text-xs text-blue-900 bg-blue-50/20 shrink-0">
                      {item.name}
                    </div>
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
                <div key={sectionName} className="space-y-2">
                  <h3 className="text-xs font-black text-blue-700 uppercase tracking-wide">
                    {sectionName}
                  </h3>

                  <div className="space-y-2">
                    {(generalExam[sectionName] || []).map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="sm:w-64 border-2 border-blue-600 rounded-lg px-3 py-1.5 font-bold text-xs text-blue-900 bg-blue-50/20 shrink-0">
                          {item.Name || `Item ${idx + 1}`}
                        </div>

                        <input
                          type="text"
                          value={item.Value || ''}
                          onChange={(e) => {
                            const nextExam = { ...generalExam };
                            nextExam[sectionName][idx].Value = e.target.value;
                            setGeneralExam(nextExam);
                          }}
                          placeholder="Observation / Finding"
                          className="w-full sm:w-96 border-2 border-rose-500 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                        />

                        {item.Unit && (
                          <div className="sm:w-32 border-2 border-emerald-500 rounded-lg px-3 py-1.5 font-bold text-xs text-emerald-800 bg-emerald-50/20 text-center shrink-0">
                            {item.Unit}
                          </div>
                        )}
                        {item.RefRange && (
                          <div className="sm:w-40 border-2 border-amber-500 rounded-lg px-3 py-1.5 font-bold text-xs text-amber-900 bg-amber-50/20 text-center shrink-0">
                            {item.RefRange}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* 3. SAVE BUTTON (MATCHING IMAGE 1) */}
        <div className="pt-4 border-t flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Report</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/patients/${patientId}?tab=results`)}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

