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
    const { patientId } = req.body;
    if (!patientId) {
      return res.status(400).json({ STATUS: 'FAILED', Message: 'patientId is required' });
    }

    const upstreamData = await upstreamService.post('BILLGENERATE', { patientId }, null, req.user?.upstreamSid);
    return res.json({
      STATUS: upstreamData?.STATUS || 'SUCCESS',
      StatusCode: upstreamData?.StatusCode || '0000',
      Message: upstreamData?.Message || 'Bill generated successfully',
      data: upstreamData,
    });
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

    const totalAmount = testItems.reduce((acc, curr) => acc + curr.amount, 0) || Number(patient.totalBill) || 0;
    const discount = 0;
    const netAmount = Math.max(0, totalAmount - discount);
    const deposited = patient.billPayStatus === 2 ? netAmount : 0;
    const due = Math.max(0, netAmount - deposited);

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
      },
      items: testItems,
      financials: {
        totalAmount,
        discount,
        netAmount,
        deposited,
        totalDue: due,
        paymentMode: 'Cash',
        amountInWords: numberToWordsINR(netAmount),
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
