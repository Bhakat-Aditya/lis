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

    // Determine amount to pay
    let amtToPay = Number(amount);
    if (!amtToPay || amtToPay <= 0) {
      // Look up current summary
      const currentSummary = await upstreamService.getBillingSummary(patientId, req.user?.upstreamSid);
      if (currentSummary && currentSummary.due > 0) {
        amtToPay = currentSummary.due;
      } else {
        const pReport = await upstreamService.get('GETPATIENTREPORT', { patientId }, req.user?.upstreamSid);
        amtToPay = Number(pReport?.payLoadJSON?.patient?.totalBill) || 0;
      }
    }

    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    const formattedDate = date || `${d}/${m}/${y}`;
    const mode = (paymentMode || '').toUpperCase().includes('UPI') ? 'OFFLINE_UPI' : 'CASH';

    // 1. Post real payment to BillingServlet
    if (amtToPay > 0) {
      await upstreamService.postBilling(
        {
          patientId,
          action: 'addpayment',
          date: formattedDate,
          amt: amtToPay.toFixed(2),
          paymentMode: mode,
          info: info || '',
        },
        req.user?.upstreamSid
      );
    }

    // 2. Trigger BILLGENERATE to sync internal state
    let upstreamData = null;
    try {
      upstreamData = await upstreamService.post('BILLGENERATE', { patientId }, null, req.user?.upstreamSid);
    } catch (e) {
      console.warn('[Billing] BILLGENERATE sync note:', e.message);
    }

    // 3. Fetch fresh summary
    const summary = await upstreamService.getBillingSummary(patientId, req.user?.upstreamSid);

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

export const getInvoice = async (req, res, next) => {
  try {
    const { patientId } = req.query;
    if (!patientId) {
      return res.status(400).json({ STATUS: 'FAILED', Message: 'patientId is required' });
    }

    // Get patient report & details
    const upstreamData = await upstreamService.get(
      'GETPATIENTREPORT',
      { patientId },
      req.user?.upstreamSid
    );

    const payload = upstreamData?.payLoadJSON || {};
    const patient = payload.patient || {};
    const reports = payload.reports || [];

    // Aggregate unique tests with rates
    const testItems = reports.map((r, index) => ({
      sn: index + 1,
      name: r.testName || `Test ${index + 1}`,
      sampleType: r.sampleType || 'Serum',
      rate: Number(r.rate) || 0,
      discount: 0,
      amount: Number(r.rate) || 0,
    }));

    // Fetch real-time billing ledger summary from upstream
    const summary = await upstreamService.getBillingSummary(patientId, req.user?.upstreamSid);

    const testTotal = testItems.reduce((acc, curr) => acc + curr.amount, 0);
    const totalAmount = summary?.total || (testTotal > 0 ? testTotal : Number(patient.totalBill)) || 0;
    const discount = summary?.discount || Number(patient.discount || 0);
    const netAmount = Math.max(0, totalAmount - discount);
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
        totalAmount,
        totalBill: totalAmount,
        discount,
        netAmount,
        netBill: netAmount,
        deposited,
        paidAmount: deposited,
        totalDue: due,
        dueAmount: due,
        paymentMode: summary?.paymentLines?.[0]?.mode || 'Cash',
        amountInWords: numberToWordsINR(netAmount),
        payments: summary?.paymentLines || [],
      },
      printedAt: new Date().toLocaleString(),
      printedBy: req.user?.name || 'Staff',
    };

    return res.json({
      STATUS: 'SUCCESS',
      StatusCode: '0000',
      invoice: invoiceData,
    });
  } catch (err) {
    next(err);
  }
};
