import React from 'react';
import AwsBillViewer from './AwsBillViewer.jsx';

export default function PrintableInvoice({
  invoiceData,
  patientId,
  onHome,
  onFillResults,
  onDiscount,
  onDeposit,
}) {
  const pid =
    patientId ||
    invoiceData?.patient?.patientId ||
    invoiceData?.patient?.slNo ||
    '';

  return (
    <AwsBillViewer
      patientId={pid}
      onBack={onHome}
      title="AWS Official Bill & Diagnostic Receipt"
    />
  );
}
