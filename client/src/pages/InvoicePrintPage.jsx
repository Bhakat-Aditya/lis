import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import PrintableInvoice from '../components/billing/PrintableInvoice.jsx';
import { RefreshCw, ArrowLeft } from 'lucide-react';

export default function InvoicePrintPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      try {
        const res = await api.get('/billing/invoice', {
          params: { patientId: id },
        });
        setInvoiceData(res.data?.invoice);
      } catch (err) {
        alert('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchInvoice();
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
        <span>Preparing printable invoice...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-4xl mx-auto mb-4 no-print flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
        <span className="text-xs text-slate-500 font-medium">
          Official Medical Diagnostic Invoice (A4 Standard)
        </span>
      </div>

      <PrintableInvoice
        invoiceData={invoiceData}
        onHome={() => navigate('/patients')}
      />
    </div>
  );
}
