import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './context/context.auth.jsx';
import { MasterProvider } from './context/context.master.jsx';
import { PatientProvider } from './context/context.patient.jsx';
import SmoothScrollProvider from './components/common/SmoothScrollProvider.jsx';

// Common UI
import Navbar from './components/common/Navbar.jsx';
import Sidebar from './components/common/Sidebar.jsx';
import PatientRegistrationModal from './components/patient/PatientRegistrationModal.jsx';

// Pages
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PatientsPage from './pages/PatientsPage.jsx';
import PatientDetailPage from './pages/PatientDetailPage.jsx';
import ResultsPage from './pages/ResultsPage.jsx';
import ApprovalsPage from './pages/ApprovalsPage.jsx';
import BillingPage from './pages/BillingPage.jsx';
import MasterPage from './pages/MasterPage.jsx';
import InvoicePrintPage from './pages/InvoicePrintPage.jsx';

// Protected Route Layout
const ProtectedLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold tracking-wide">Initializing Lab Expert Portal...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
      <Navbar onSearch={(term) => navigate(term ? `/patients?search=${encodeURIComponent(term)}` : '/patients')} />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar onOpenNewPatient={() => setIsRegisterOpen(true)} />
        <main className="flex-1 p-3 md:p-5 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet context={{ openNewPatient: () => setIsRegisterOpen(true) }} />
        </main>
      </div>

      {/* Global Patient Registration Modal */}
      <PatientRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onPatientAdded={(data) => {
          const pid = data?.patientId || data?.patient?.patientId;
          if (pid) {
            navigate(`/patients/${pid}?tab=tests`);
          } else {
            navigate('/patients');
          }
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <HelmetProvider>
      <SmoothScrollProvider>
        <BrowserRouter>
          <AuthProvider>
            <MasterProvider>
              <PatientProvider>
                <Routes>
                  {/* Public Auth */}
                  <Route path="/login" element={<LoginPage />} />

                  {/* Dedicated Printable Invoice View */}
                  <Route path="/invoice/:id" element={<InvoicePrintPage />} />

                  {/* Protected Clinic Operations */}
                  <Route element={<ProtectedLayout />}>
                    <Route path="/" element={<DashboardWrapper />} />
                    <Route path="/patients" element={<PatientsWrapper />} />
                    <Route path="/patients/:id" element={<PatientDetailPage />} />
                    <Route path="/results" element={<ResultsPage />} />
                    <Route path="/approvals" element={<ApprovalsPage />} />
                    <Route path="/billing" element={<BillingPage />} />
                    <Route path="/master" element={<MasterPage />} />
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </PatientProvider>
            </MasterProvider>
          </AuthProvider>
        </BrowserRouter>
      </SmoothScrollProvider>
    </HelmetProvider>
  );
}

// Helpers to inject modal opener into pages
function DashboardWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <>
      <DashboardPage onOpenNewPatient={() => setIsOpen(true)} />
      <PatientRegistrationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onPatientAdded={(data) => {
          const pid = data?.patientId || data?.patient?.patientId;
          if (pid) {
            navigate(`/patients/${pid}?tab=tests`);
          } else {
            navigate('/patients');
          }
        }}
      />
    </>
  );
}

function PatientsWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <>
      <PatientsPage onOpenNewPatient={() => setIsOpen(true)} />
      <PatientRegistrationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onPatientAdded={(data) => {
          const pid = data?.patientId || data?.patient?.patientId;
          if (pid) {
            navigate(`/patients/${pid}?tab=tests`);
          } else {
            navigate(0);
          }
        }}
      />
    </>
  );
}
