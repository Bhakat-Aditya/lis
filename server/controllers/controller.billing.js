import axios from 'axios';
import { upstreamService } from '../services/service.upstream.js';


// Number to Words converter (for Indian Rupees on medical invoices)
function numberToWordsINR(amount) {
  const num = Math.floor(Number(amount) || 0);
  if (num === 0) return 'Zero Rupees Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n) {
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    const unit = n % 10;
    return `${tens[Math.floor(n / 10)]}${unit ? ' ' + units[unit] : ''}`;
  }

  function convertThreeDigits(n) {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let str = '';
    if (hundred > 0) {
      str += `${units[hundred]} Hundred`;
      if (rest > 0) str += ' and ';
    }
    if (rest > 0) {
      str += convertTwoDigits(rest);
    }
    return str;
  }

  let crore = Math.floor(num / 10000000);
  let remainder = num % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  let thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;
  let rest = remainder;

  let result = '';
  if (crore > 0) result += `${convertThreeDigits(crore)} Crore `;
  if (lakh > 0) result += `${convertThreeDigits(lakh)} Lakh `;
  if (thousand > 0) result += `${convertThreeDigits(thousand)} Thousand `;
  if (rest > 0) result += `${convertThreeDigits(rest)} `;

  return `${result.trim()} Rupees Only`;
}

export const generateBill = async (req, res, next) => {
  try {
    const { patientId, amount, paymentMode = 'CASH', date, info } = req.body;
    if (!patientId) {
      return res.status(400).json({ STATUS: 'FAILED', Message: 'patientId is required' });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;

    // Determine amount to pay
    let amtToPay = Number(amount);
    if (!amtToPay || amtToPay <= 0) {
      // Look up current summary
      const currentSummary = await upstreamService.getBillingSummary(cleanPatientId, req.user?.upstreamSid);
      if (currentSummary && currentSummary.due > 0) {
        amtToPay = currentSummary.due;
      } else {
        const pReport = await upstreamService.get('GETPATIENTREPORT', { patientId: cleanPatientId }, req.user?.upstreamSid);
        amtToPay = Number(pReport?.payLoadJSON?.patient?.totalBill) || 0;
      }
    }

    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    const formattedDate = date || `${d}/${m}/${y}`;
    const mode = (paymentMode || '').toUpperCase().includes('UPI') ? 'OFFLINE_UPI' : 'CASH';

    // 1. Post real payment using BILLPAYMENTUPDATE or fallback to BillingServlet
    if (amtToPay > 0) {
      try {
        await upstreamService.post(
          'BILLPAYMENTUPDATE',
          {
            patientId: cleanPatientId,
            action: 'addpayment',
            date: formattedDate,
            amt: amtToPay.toFixed(2),
            paymentMode: mode,
            info: info || '',
          },
          null,
          req.user?.upstreamSid
        );
      } catch (err) {
        console.warn('[Billing] BILLPAYMENTUPDATE fallback to BillingServlet:', err.message);
        await upstreamService.postBilling(
          {
            patientId: cleanPatientId,
            action: 'addpayment',
            date: formattedDate,
            amt: amtToPay.toFixed(2),
            paymentMode: mode,
            info: info || '',
          },
          req.user?.upstreamSid
        );
      }
    }

    // 2. Trigger BILLGENERATE to sync internal state
    let upstreamData = null;
    try {
      upstreamData = await upstreamService.post('BILLGENERATE', { patientId: cleanPatientId }, null, req.user?.upstreamSid);
    } catch (e) {
      console.warn('[Billing] BILLGENERATE sync note:', e.message);
    }

    // 3. Fetch fresh summary
    const summary = await upstreamService.getBillingSummary(cleanPatientId, req.user?.upstreamSid);

    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      Message: `Deposit of ₹${amtToPay} recorded successfully`,
      data: upstreamData,
      summary,
    });
  } catch (err) {
    next(err);
  }
};

export const recordDeposit = generateBill;

/**
 * Apply clinical discount using upstream native BILLUPDATE API
 */
export const applyDiscount = async (req, res, next) => {
  try {
    const { patientId, discountType = 'flat', discountValue = 0, reason = '' } = req.body;
    if (!patientId) {
      return res.status(400).json({ STATUS: 'FAILED', Message: 'patientId is required' });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;

    // 1. Fetch current bill JSON
    let billJson = null;
    try {
      billJson = await upstreamService.get('GETBILLJSON', { patientId: cleanPatientId }, req.user?.upstreamSid);
    } catch (e) {
      console.warn('[Billing] GETBILLJSON failed, attempting GETPATIENTREPORT:', e.message);
    }

    let tests = billJson?.payLoadJSON?.bill?.['Test List'] || [];
    let grossTotal = parseFloat(billJson?.payLoadJSON?.bill?.['Total Amount']) || 0;

    // Fallback: if Test List is empty, get from GETPATIENTREPORT
    if (tests.length === 0) {
      const pReport = await upstreamService.get('GETPATIENTREPORT', { patientId: cleanPatientId }, req.user?.upstreamSid);
      const reports = pReport?.payLoadJSON?.reports || [];
      const pt = pReport?.payLoadJSON?.patient || {};
      const today = new Date();
      const d = String(today.getDate()).padStart(2, '0');
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const y = today.getFullYear();
      const formattedDate = `${d}/${m}/${y}`;

      if (Array.isArray(pt?.testList) && pt.testList.length > 0) {
        tests = pt.testList;
        grossTotal = Number(pt.totalBill) || tests.reduce((acc, t) => acc + (parseFloat(t.Amount) || 0), 0);
      } else {
        // Group by package and profile to avoid unbundled sub-test rates
        const seenPkg = new Set();
        const seenProf = new Set();
        reports.forEach((r, idx) => {
          if (r.packageName) {
            if (!seenPkg.has(r.packageName)) {
              seenPkg.add(r.packageName);
              tests.push({
                'Bill Particulars': r.packageName,
                Amount: String(Number(r.rate) || 0),
                'Bill Date': formattedDate,
              });
            }
          } else if (r.profileName) {
            if (!seenProf.has(r.profileName)) {
              seenProf.add(r.profileName);
              tests.push({
                'Bill Particulars': r.profileName,
                Amount: String(Number(r.rate) || 0),
                'Bill Date': formattedDate,
              });
            }
          } else {
            tests.push({
              'Bill Particulars': r.testName || `Test ${idx + 1}`,
              Amount: String(Number(r.rate) || 0),
              'Bill Date': formattedDate,
            });
          }
        });
        grossTotal = Number(pt.totalBill) > 0 ? Number(pt.totalBill) : tests.reduce((acc, t) => acc + (parseFloat(t.Amount) || 0), 0);
      }
    }

    if (grossTotal <= 0) {
      return res.status(400).json({
        STATUS: 'FAILED',
        Message: 'Cannot apply discount on a bill with zero total amount',
      });
    }

    const val = Number(discountValue) || 0;
    let discamt = 0;
    let discPerc = 0;

    if (discountType === 'percent') {
      discPerc = Math.min(100, Math.max(0, val));
      discamt = Math.round(((grossTotal * discPerc) / 100) * 100) / 100;
    } else {
      discamt = Math.min(grossTotal, Math.max(0, val));
      discPerc = grossTotal > 0 ? Math.round(((discamt / grossTotal) * 100) * 100) / 100 : 0;
    }

    const remainder = grossTotal - discamt;
    const roundedRemainder = Math.round(remainder);
    const roundoff = Math.round((remainder - roundedRemainder) * 100) / 100;
    const finalBillAmount = Math.max(0, roundedRemainder);

    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    const formattedDate = `${d}/${m}/${y}`;

    // Prepare params for BILLUPDATE
    const params = {
      patientId: cleanPatientId,
      isNew: '0',
      action: 'addbill',
      billname: 'TAX/RECEIPT',
      count: String(tests.length),
      totalamt: grossTotal.toFixed(2),
      disc: String(discPerc),
      discamt: discamt.toFixed(2),
      roundoff: (roundoff >= 0 ? roundoff : -roundoff).toFixed(2),
      billamount: finalBillAmount.toFixed(2),
    };

    tests.forEach((t, i) => {
      params[`name${i + 1}`] = t['Bill Particulars'] || `Test ${i + 1}`;
      params[`date${i + 1}`] = t['Bill Date'] || formattedDate;
      params[`amt${i + 1}`] = String(t.Amount || 0);
    });

    const updateRes = await upstreamService.post('BILLUPDATE', params, null, req.user?.upstreamSid);

    // Refresh summary
    const freshSummary = await upstreamService.getBillingSummary(cleanPatientId, req.user?.upstreamSid);

    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      Message: `Discount of ₹${discamt} (${discPerc}%) applied successfully`,
      data: updateRes,
      summary: freshSummary,
      financials: {
        totalAmount: grossTotal,
        discount: discamt,
        discountPercent: discPerc,
        roundoff: roundoff,
        netBill: finalBillAmount,
        reason,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get native GETBILLJSON payload
 */
export const getBillJson = async (req, res, next) => {
  try {
    const { patientId } = req.query;
    if (!patientId) {
      return res.status(400).json({ STATUS: 'FAILED', Message: 'patientId is required' });
    }
    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;
    const data = await upstreamService.get('GETBILLJSON', { patientId: cleanPatientId }, req.user?.upstreamSid);
    return res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getInvoice = async (req, res, next) => {
  try {
    const { patientId } = req.query;
    if (!patientId) {
      return res.status(400).json({ STATUS: 'FAILED', Message: 'patientId is required' });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;

    // Get patient report & details
    const upstreamData = await upstreamService.get(
      'GETPATIENTREPORT',
      { patientId: cleanPatientId },
      req.user?.upstreamSid
    );

    const payload = upstreamData?.payLoadJSON || {};
    const patient = payload.patient || {};
    const reports = payload.reports || [];

    // Fetch real-time billing ledger summary from upstream (uses GETBILLJSON)
    const summary = await upstreamService.getBillingSummary(cleanPatientId, req.user?.upstreamSid);

    // Build invoice items from official bill lots (Packages, Profiles, Standalone Tests)
    let testItems = [];
    if (summary?.testList && summary.testList.length > 0) {
      testItems = summary.testList.map((t, index) => ({
        sn: index + 1,
        testName: t['Bill Particulars'] || `Item ${index + 1}`,
        name: t['Bill Particulars'] || `Item ${index + 1}`,
        rate: Number(t.Amount || 0),
        disc: 0,
        discount: 0,
        amount: Number(t.Amount || 0),
      }));
    } else {
      // Fallback: group reports by package and profile
      const seenPkg = new Set();
      const seenProf = new Set();
      reports.forEach((r, idx) => {
        if (r.packageName) {
          if (!seenPkg.has(r.packageName)) {
            seenPkg.add(r.packageName);
            testItems.push({
              sn: testItems.length + 1,
              testName: r.packageName,
              name: r.packageName,
              rate: Number(r.rate) || 0,
              disc: 0,
              discount: 0,
              amount: Number(r.rate) || 0,
            });
          }
        } else if (r.profileName) {
          if (!seenProf.has(r.profileName)) {
            seenProf.add(r.profileName);
            testItems.push({
              sn: testItems.length + 1,
              testName: r.profileName,
              name: r.profileName,
              rate: Number(r.rate) || 0,
              disc: 0,
              discount: 0,
              amount: Number(r.rate) || 0,
            });
          }
        } else {
          testItems.push({
            sn: testItems.length + 1,
            testName: r.testName || `Test ${idx + 1}`,
            name: r.testName || `Test ${idx + 1}`,
            rate: Number(r.rate) || 0,
            disc: 0,
            discount: 0,
            amount: Number(r.rate) || 0,
          });
        }
      });
    }

    const testTotal = testItems.reduce((acc, curr) => acc + curr.amount, 0);
    const grossAmount = summary?.gross || summary?.total || (testTotal > 0 ? testTotal : Number(patient.totalBill)) || 0;
    const discount = summary?.discount || Number(patient.discount || 0);
    const roundoff = summary?.roundoff || 0;
    const netAmount = summary?.total || Math.max(0, grossAmount - discount - roundoff);
    const isExplicitPaid = (patient.billPayStatus === 2 || patient.billPayStatus === '2') || summary?.isPaid;
    const deposited = summary ? summary.paid : (isExplicitPaid ? netAmount : Number(patient.paidBill || 0));
    const due = summary ? summary.due : (isExplicitPaid ? 0 : Math.max(0, netAmount - deposited));

    const invoiceData = {
      clinic: {
        name: 'NEW LIFE CARE DIAGNOSTIC CENTER',
        address: 'KERANITOLA, STATION ROAD, PASCHIM MIDNAPORE (WB) PIN - 721101',
        mobile: '9733525031, 9647393949',
        email: 'noreply@labexperts.in',
        website: 'https://newlifecare.labexperts.in',
        nablCertified: true,
        isoCertified: true,
      },
      patient: {
        patientId: patient.patientId || patientId,
        slNo: patient.slNo || '',
        name: patient.name || '',
        gender: patient.gender || '',
        age: patient.age || '',
        mobile: patient.mobile || '',
        collectionDate: patient.sampleTime || patient.regDate || new Date().toLocaleString(),
        referredBy: patient.referedDr || 'Self',
        branch: patient.branch || '1',
        billPayStatus: (isExplicitPaid || due <= 0) ? 2 : patient.billPayStatus,
      },
      items: testItems,
      financials: {
        grossAmount,
        totalAmount: grossAmount,
        totalBill: netAmount,
        discount,
        roundoff,
        netAmount,
        netBill: netAmount,
        deposited,
        paidAmount: deposited,
        totalDue: due,
        dueAmount: due,
        paymentMode: summary?.paymentLines?.[0]?.mode || 'Cash',
        amountInWords: numberToWordsINR(netAmount),
        payments: summary?.paymentLines || [],
        billUrl: summary?.billUrl || '',
        invoiceUrl: summary?.billUrl || '',
      },
      printedAt: new Date().toLocaleString(),
      printedBy: req.user?.name || 'Staff',
    };

    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      invoice: invoiceData,
      billUrl: summary?.billUrl || '',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Stream official AWS Bill / Invoice PDF directly
 */
export const streamInvoicePdf = async (req, res, next) => {
  try {
    const { patientId } = req.query;
    if (!patientId) {
      return res.status(400).json({ STATUS: 'FAILED', Message: 'patientId is required' });
    }

    const rawPid = String(patientId).trim();
    const cleanPatientId = rawPid.toUpperCase().startsWith('P')
      ? `P${rawPid.replace(/^P+/i, '')}`
      : `P${rawPid}`;

    let summary = await upstreamService.getBillingSummary(cleanPatientId, req.user?.upstreamSid);
    let billUrl = summary?.billUrl;

    if (!billUrl) {
      const bData = await upstreamService.get('GETBILLJSON', { patientId: cleanPatientId }, req.user?.upstreamSid);
      billUrl = bData?.payLoadJSON?.billUrl;
    }

    if (!billUrl) {
      return res.status(404).json({ STATUS: 'FAILED', Message: 'Official bill PDF not found on upstream AWS server' });
    }

    const pdfStream = await axios.get(billUrl, {
      responseType: 'stream',
      timeout: 25000,
    });

    const isDownload = req.query.download === 'true';
    res.setHeader('Content-Type', 'application/pdf');
    if (isDownload) {
      res.setHeader('Content-Disposition', `attachment; filename="Bill_${cleanPatientId}.pdf"`);
    } else {
      res.setHeader('Content-Disposition', 'inline');
    }
    pdfStream.data.pipe(res);
  } catch (err) {
    console.error('[InvoicePDF] Stream error:', err.message);
    next(err);
  }
};

