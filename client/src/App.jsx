import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/context.auth.jsx';
import { MasterProvider } from './context/context.master.jsx';

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

// Protected Route Wrapper
const ProtectedLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500">
        Initializing LIS Clinic Portal...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar onSearch={(term) => navigate(`/patients?search=${encodeURIComponent(term)}`)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onOpenNewPatient={() => setIsRegisterOpen(true)} />
        <main className="flex-1 p-5 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet context={{ openNewPatient: () => setIsRegisterOpen(true) }} />
        </main>
      </div>

      {/* Global Patient Registration Modal */}
      <PatientRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onPatientAdded={(data) => {
          navigate(`/patients`);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MasterProvider>
          <Routes>
            {/* Public Auth */}
            <Route path="/login" element={<LoginPage />} />

            {/* Dedicated Print View */}
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
        </MasterProvider>
      </AuthProvider>
    </BrowserRouter>
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
        onPatientAdded={() => navigate('/patients')}
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
        onPatientAdded={() => navigate(0)}
      />
    </>
  );
}
