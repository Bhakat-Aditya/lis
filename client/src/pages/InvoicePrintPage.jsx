import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AwsBillViewer from '../components/billing/AwsBillViewer.jsx';

export default function InvoicePrintPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-5 flex flex-col">
      <AwsBillViewer
        patientId={id}
        onBack={() => navigate(-1)}
        title="Official Diagnostic Bill (AWS Server)"
      />
    </div>
  );
}
