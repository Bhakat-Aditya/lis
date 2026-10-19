import React, { createContext, useContext, useState, useEffect } from 'react';

const PatientContext = createContext(null);

export const PatientProvider = ({ children }) => {
  const [activePatient, setActivePatientState] = useState(() => {
    try {
      const stored = localStorage.getItem('lis_active_patient');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [activePatientMenuOpen, setActivePatientMenuOpen] = useState(true);

  // Global modals triggered from patient sidebar
  const [activeModal, setActiveModal] = useState(null); // 'barcode', 'deposit', 'discount', 'update', 'outside_report', 'old_record', 'inventory'

  const setActivePatient = (patient) => {
    setActivePatientState(patient);
    setActivePatientMenuOpen(true);
    if (patient) {
      try {
        localStorage.setItem('lis_active_patient', JSON.stringify(patient));
      } catch (e) {
        // ignore
      }
    } else {
      localStorage.removeItem('lis_active_patient');
    }
  };

  const clearActivePatient = () => {
    setActivePatientState(null);
    localStorage.removeItem('lis_active_patient');
  };

  const openModal = (modalName) => {
    setActiveModal(modalName);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <PatientContext.Provider
      value={{
        activePatient,
        setActivePatient,
        clearActivePatient,
        activePatientMenuOpen,
        setActivePatientMenuOpen,
        activeModal,
        openModal,
        closeModal,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export const usePatientContext = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatientContext must be used within a PatientProvider');
  }
  return context;
};
